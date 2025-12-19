import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple Base RPC endpoints for failover
// Note: different providers have different limits on `eth_getLogs`, so we also chunk requests below.
const BASE_RPCS = [
  "https://rpc.ankr.com/base",
  "https://1rpc.io/base",
  "https://base.meowrpc.com",
  "https://base-rpc.publicnode.com",
  "https://mainnet.base.org",
];

// Common token addresses on Base
const TOKEN_INFO: Record<string, { symbol: string; decimals: number }> = {
  "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": { symbol: "USDbC", decimals: 6 },
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": { symbol: "DAI", decimals: 18 },
  "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": { symbol: "cbETH", decimals: 18 },
  "0x940181a94a35a4569e4529a3cdfb74e38fd98631": { symbol: "AERO", decimals: 18 },
  "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b": { symbol: "VIRTUAL", decimals: 18 },
  "0x532f27101965dd16442e59d40670faf5ebb142e4": { symbol: "BRETT", decimals: 18 },
};

// ERC20 Transfer event signature
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

interface Transaction {
  id: string;
  hash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  blockNumber: number;
}

async function rpcCallWithFallback(method: string, params: any[]): Promise<any> {
  let lastError: Error | null = null;
  
  for (const rpc of BASE_RPCS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.log(`RPC ${rpc} failed: ${lastError.message}, trying next...`);
    }
  }
  
  throw lastError || new Error("All RPC endpoints failed");
}

async function getLatestBlock(): Promise<number> {
  const result = await rpcCallWithFallback('eth_blockNumber', []);
  return parseInt(result, 16);
}

async function getBlockTimestamp(blockNumber: string): Promise<number> {
  const block = await rpcCallWithFallback('eth_getBlockByNumber', [blockNumber, false]);
  return parseInt(block.timestamp, 16);
}

function formatAmount(hexData: string, decimals: number): string {
  try {
    const value = BigInt(hexData);
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const fracPart = value % divisor;
    
    const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 4);
    const formatted = `${intPart}.${fracStr}`;
    
    return parseFloat(formatted).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } catch {
    return "0";
  }
}

function padAddress(address: string): string {
  return "0x" + address.toLowerCase().slice(2).padStart(64, '0');
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function getRecentSwaps(walletAddress: string): Promise<Transaction[]> {
  const walletLower = walletAddress.toLowerCase();
  const paddedAddress = padAddress(walletLower);

  const decodeTopicAddress = (topic?: string) => {
    if (!topic || topic.length < 66) return null;
    return ("0x" + topic.slice(26)).toLowerCase();
  };

  console.log(`Fetching swaps for wallet: ${walletLower}`);

  const latestBlock = await getLatestBlock();

  // Provider limits differ; we scan backwards in chunks and stop early once we have enough candidates.
  const LOOKBACK_BLOCKS = 200000; // ~4-5 days on Base
  const CHUNK_SIZE = 5000; // safe under common eth_getLogs range limits

  const startBlock = Math.max(0, latestBlock - LOOKBACK_BLOCKS);

  console.log(`Scanning incoming transfers from blocks ${startBlock} to ${latestBlock} in chunks of ${CHUNK_SIZE}`);

  // Collect tx hashes where the wallet RECEIVED a token transfer.
  // This catches token->token and ETH->token swaps (ETH has no Transfer log).
  const incomingByTx = new Map<string, { log: any; blockNumber: string }>();

  for (let chunkTo = latestBlock; chunkTo >= startBlock; chunkTo -= CHUNK_SIZE) {
    const chunkFrom = Math.max(startBlock, chunkTo - CHUNK_SIZE + 1);

    const fromBlockHex = "0x" + chunkFrom.toString(16);
    const toBlockHex = "0x" + chunkTo.toString(16);

    console.log(`Fetching incoming logs for range ${chunkFrom}-${chunkTo}`);

    let logsTo: any[] = [];

    try {
      logsTo = await rpcCallWithFallback('eth_getLogs', [{
        fromBlock: fromBlockHex,
        toBlock: toBlockHex,
        topics: [TRANSFER_TOPIC, null, paddedAddress],
      }]);
    } catch (err) {
      console.error(`Chunk ${chunkFrom}-${chunkTo} failed:`, err);
      continue;
    }

    for (const log of logsTo || []) {
      // Keep the first incoming transfer per tx (good enough for a summary row)
      if (!incomingByTx.has(log.transactionHash)) {
        incomingByTx.set(log.transactionHash, { log, blockNumber: log.blockNumber });
      }
    }

    // Stop early if we have enough candidate txs to inspect.
    if (incomingByTx.size >= 40) break;
  }

  console.log(`Collected ${incomingByTx.size} candidate txs with incoming transfers`);

  const sortedCandidates = Array.from(incomingByTx.entries())
    .sort((a, b) => parseInt(b[1].blockNumber, 16) - parseInt(a[1].blockNumber, 16));

  const transactions: Transaction[] = [];

  for (const [txHash, { log: incomingLog, blockNumber }] of sortedCandidates) {
    if (transactions.length >= 10) break;

    try {
      const tx = await rpcCallWithFallback('eth_getTransactionByHash', [txHash]);
      if (!tx || (tx.from || '').toLowerCase() !== walletLower) {
        continue;
      }

      const receipt = await rpcCallWithFallback('eth_getTransactionReceipt', [txHash]);
      if (!receipt || !Array.isArray(receipt.logs)) continue;

      // Find an outgoing Transfer from the wallet (token -> ...)
      let outgoingLog: any | null = null;
      for (const l of receipt.logs) {
        if (!l?.topics || l.topics[0] !== TRANSFER_TOPIC) continue;
        const fromAddr = decodeTopicAddress(l.topics[1]);
        if (fromAddr === walletLower) {
          outgoingLog = l;
          break;
        }
      }

      const valueWei = tx.value ? BigInt(tx.value) : 0n;

      // Determine fromToken/fromAmount
      let fromTokenSymbol: string;
      let fromAmount: string;

      if (outgoingLog) {
        const fromTokenAddr = (outgoingLog.address || '').toLowerCase();
        const info = TOKEN_INFO[fromTokenAddr] || { symbol: shortenAddress(outgoingLog.address), decimals: 18 };
        fromTokenSymbol = info.symbol;
        fromAmount = formatAmount(outgoingLog.data, info.decimals);
      } else if (valueWei > 0n) {
        fromTokenSymbol = 'ETH';
        fromAmount = formatAmount('0x' + valueWei.toString(16), 18);
      } else {
        // Not a swap-like tx (could be just receiving tokens)
        continue;
      }

      // Determine toToken/toAmount from the incoming Transfer
      const toTokenAddr = (incomingLog.address || '').toLowerCase();
      const toInfo = TOKEN_INFO[toTokenAddr] || { symbol: shortenAddress(incomingLog.address), decimals: 18 };
      const toTokenSymbol = toInfo.symbol;
      const toAmount = formatAmount(incomingLog.data, toInfo.decimals);

      if (fromTokenSymbol === toTokenSymbol) continue;

      const timestamp = await getBlockTimestamp(blockNumber);

      transactions.push({
        id: txHash,
        hash: txHash,
        fromToken: fromTokenSymbol,
        toToken: toTokenSymbol,
        fromAmount,
        toAmount,
        status: 'completed',
        timestamp: new Date(timestamp * 1000),
        blockNumber: parseInt(blockNumber, 16),
      });
    } catch (err) {
      console.error(`Error processing candidate ${txHash}:`, err);
    }
  }

  console.log(`Processed ${transactions.length} swap transactions`);
  return transactions;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: "Wallet address required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing request for wallet: ${walletAddress}`);
    
    const transactions = await getRecentSwaps(walletAddress);

    return new Response(
      JSON.stringify({ transactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching transactions:", message);

    // Important: return 200 so the client can render a friendly message instead of crashing.
    return new Response(
      JSON.stringify({ transactions: [], warning: { message } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});