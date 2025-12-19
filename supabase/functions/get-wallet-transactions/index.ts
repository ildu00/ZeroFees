import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple Base RPC endpoints for failover
const BASE_RPCS = [
  "https://base.llamarpc.com",
  "https://base.drpc.org",
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
  console.log(`Fetching swaps for wallet: ${walletAddress}`);
  
  const latestBlock = await getLatestBlock();
  // Look back ~1 day only (assuming ~2 sec blocks = ~43200 blocks)
  const fromBlock = Math.max(0, latestBlock - 43200);
  
  const paddedAddress = padAddress(walletAddress);
  
  console.log(`Searching blocks ${fromBlock} to ${latestBlock}`);
  
  // Get Transfer events where wallet is sender or receiver
  const [logsFrom, logsTo] = await Promise.all([
    rpcCallWithFallback('eth_getLogs', [{
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "latest",
      topics: [TRANSFER_TOPIC, paddedAddress, null],
    }]),
    rpcCallWithFallback('eth_getLogs', [{
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "latest",
      topics: [TRANSFER_TOPIC, null, paddedAddress],
    }]),
  ]);

  console.log(`Found ${logsFrom?.length || 0} outgoing, ${logsTo?.length || 0} incoming transfers`);

  if (!logsFrom || !logsTo) {
    return [];
  }

  // Group logs by transaction hash
  const txMap = new Map<string, { from: any[], to: any[], blockNumber: string }>();
  
  for (const log of logsFrom) {
    if (!txMap.has(log.transactionHash)) {
      txMap.set(log.transactionHash, { from: [], to: [], blockNumber: log.blockNumber });
    }
    txMap.get(log.transactionHash)!.from.push(log);
  }
  
  for (const log of logsTo) {
    if (!txMap.has(log.transactionHash)) {
      txMap.set(log.transactionHash, { from: [], to: [], blockNumber: log.blockNumber });
    }
    txMap.get(log.transactionHash)!.to.push(log);
  }

  // Filter for potential swaps (has both in and out transfers)
  const potentialSwaps = Array.from(txMap.entries())
    .filter(([_, data]) => data.from.length > 0 && data.to.length > 0)
    .sort((a, b) => parseInt(b[1].blockNumber, 16) - parseInt(a[1].blockNumber, 16))
    .slice(0, 10);

  console.log(`Found ${potentialSwaps.length} potential swap transactions`);

  const transactions: Transaction[] = [];

  for (const [txHash, data] of potentialSwaps) {
    try {
      const fromLog = data.from[0];
      const toLog = data.to[0];

      const fromTokenAddr = fromLog.address.toLowerCase();
      const toTokenAddr = toLog.address.toLowerCase();

      if (fromTokenAddr === toTokenAddr) continue;

      const fromTokenInfo = TOKEN_INFO[fromTokenAddr] || { symbol: shortenAddress(fromLog.address), decimals: 18 };
      const toTokenInfo = TOKEN_INFO[toTokenAddr] || { symbol: shortenAddress(toLog.address), decimals: 18 };

      const fromAmount = formatAmount(fromLog.data, fromTokenInfo.decimals);
      const toAmount = formatAmount(toLog.data, toTokenInfo.decimals);

      const timestamp = await getBlockTimestamp(data.blockNumber);

      transactions.push({
        id: txHash,
        hash: txHash,
        fromToken: fromTokenInfo.symbol,
        toToken: toTokenInfo.symbol,
        fromAmount,
        toAmount,
        status: 'completed',
        timestamp: new Date(timestamp * 1000),
        blockNumber: parseInt(data.blockNumber, 16),
      });
      
    } catch (err) {
      console.error(`Error processing tx ${txHash}:`, err);
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
    return new Response(
      JSON.stringify({ error: "Failed to fetch transactions", details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});