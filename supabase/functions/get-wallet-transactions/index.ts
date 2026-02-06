import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Chain RPC configurations ───────────────────────────────────────────────

interface ChainRpcConfig {
  type: 'evm' | 'tron' | 'neo';
  rpcs: string[];
  nativeSymbol: string;
  nativeDecimals: number;
  tokens: Record<string, { symbol: string; decimals: number }>;
  lookbackBlocks: number;
  chunkSize: number;
}

const CHAIN_CONFIGS: Record<string, ChainRpcConfig> = {
  base: {
    type: 'evm',
    rpcs: [
      "https://rpc.ankr.com/base",
      "https://1rpc.io/base",
      "https://base-rpc.publicnode.com",
      "https://mainnet.base.org",
    ],
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    lookbackBlocks: 200000,
    chunkSize: 5000,
    tokens: {
      "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
      "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": { symbol: "USDbC", decimals: 6 },
      "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": { symbol: "DAI", decimals: 18 },
      "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": { symbol: "cbETH", decimals: 18 },
      "0x940181a94a35a4569e4529a3cdfb74e38fd98631": { symbol: "AERO", decimals: 18 },
      "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b": { symbol: "VIRTUAL", decimals: 18 },
      "0x532f27101965dd16442e59d40670faf5ebb142e4": { symbol: "BRETT", decimals: 18 },
    },
  },
  ethereum: {
    type: 'evm',
    rpcs: [
      "https://eth.llamarpc.com",
      "https://1rpc.io/eth",
      "https://ethereum-rpc.publicnode.com",
      "https://rpc.ankr.com/eth",
    ],
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    lookbackBlocks: 50000,
    chunkSize: 2000,
    tokens: {
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { symbol: "WETH", decimals: 18 },
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { symbol: "USDC", decimals: 6 },
      "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", decimals: 6 },
      "0x6b175474e89094c44da98b954eedeac495271d0f": { symbol: "DAI", decimals: 18 },
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { symbol: "WBTC", decimals: 8 },
      "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": { symbol: "UNI", decimals: 18 },
      "0x514910771af9ca656af840dff83e8264ecf986ca": { symbol: "LINK", decimals: 18 },
    },
  },
  arbitrum: {
    type: 'evm',
    rpcs: [
      "https://arb1.arbitrum.io/rpc",
      "https://1rpc.io/arb",
      "https://rpc.ankr.com/arbitrum",
      "https://arbitrum-one-rpc.publicnode.com",
    ],
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    lookbackBlocks: 500000,
    chunkSize: 10000,
    tokens: {
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": { symbol: "WETH", decimals: 18 },
      "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { symbol: "USDC", decimals: 6 },
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": { symbol: "USDT", decimals: 6 },
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": { symbol: "DAI", decimals: 18 },
      "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": { symbol: "WBTC", decimals: 8 },
      "0x912ce59144191c1204e64559fe8253a0e49e6548": { symbol: "ARB", decimals: 18 },
    },
  },
  polygon: {
    type: 'evm',
    rpcs: [
      "https://polygon-rpc.com",
      "https://1rpc.io/matic",
      "https://rpc.ankr.com/polygon",
      "https://polygon-bor-rpc.publicnode.com",
    ],
    nativeSymbol: 'MATIC',
    nativeDecimals: 18,
    lookbackBlocks: 100000,
    chunkSize: 3500,
    tokens: {
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": { symbol: "WMATIC", decimals: 18 },
      "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": { symbol: "USDC", decimals: 6 },
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": { symbol: "USDC.e", decimals: 6 },
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": { symbol: "USDT", decimals: 6 },
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": { symbol: "DAI", decimals: 18 },
      "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": { symbol: "WBTC", decimals: 8 },
    },
  },
  optimism: {
    type: 'evm',
    rpcs: [
      "https://mainnet.optimism.io",
      "https://1rpc.io/op",
      "https://rpc.ankr.com/optimism",
      "https://optimism-rpc.publicnode.com",
    ],
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    lookbackBlocks: 200000,
    chunkSize: 5000,
    tokens: {
      "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
      "0x0b2c639c533813f4aa9d7837caf62653d097ff85": { symbol: "USDC", decimals: 6 },
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607": { symbol: "USDC.e", decimals: 6 },
      "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": { symbol: "USDT", decimals: 6 },
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": { symbol: "DAI", decimals: 18 },
      "0x4200000000000000000000000000000000000042": { symbol: "OP", decimals: 18 },
    },
  },
  bsc: {
    type: 'evm',
    rpcs: [
      "https://bsc-dataseed.binance.org",
      "https://1rpc.io/bnb",
      "https://rpc.ankr.com/bsc",
      "https://bsc-rpc.publicnode.com",
    ],
    nativeSymbol: 'BNB',
    nativeDecimals: 18,
    lookbackBlocks: 100000,
    chunkSize: 5000,
    tokens: {
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": { symbol: "WBNB", decimals: 18 },
      "0x55d398326f99059ff775485246999027b3197955": { symbol: "USDT", decimals: 18 },
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": { symbol: "USDC", decimals: 18 },
      "0xe9e7cea3dedca5984780bafc599bd69add087d56": { symbol: "BUSD", decimals: 18 },
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3": { symbol: "DAI", decimals: 18 },
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8": { symbol: "ETH", decimals: 18 },
      "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82": { symbol: "CAKE", decimals: 18 },
    },
  },
  avalanche: {
    type: 'evm',
    rpcs: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://1rpc.io/avax/c",
      "https://rpc.ankr.com/avalanche",
      "https://avalanche-c-chain-rpc.publicnode.com",
    ],
    nativeSymbol: 'AVAX',
    nativeDecimals: 18,
    lookbackBlocks: 200000,
    chunkSize: 5000,
    tokens: {
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7": { symbol: "WAVAX", decimals: 18 },
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": { symbol: "USDC", decimals: 6 },
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": { symbol: "USDT", decimals: 6 },
      "0xd586e7f844cea2f87f50152665bcbc2c279d8d70": { symbol: "DAI.e", decimals: 18 },
      "0x49d5c2bdffac6ce2bfdb6fd9b3c1db3a3e3f04e8": { symbol: "WETH.e", decimals: 18 },
      "0x152b9d0fdc40c096de345726706b8e18eb534fd4": { symbol: "JOE", decimals: 18 },
    },
  },
  tron: {
    type: 'tron',
    rpcs: ["https://api.trongrid.io"],
    nativeSymbol: 'TRX',
    nativeDecimals: 6,
    lookbackBlocks: 0,
    chunkSize: 0,
    tokens: {
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t": { symbol: "USDT", decimals: 6 },
      "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8": { symbol: "USDC", decimals: 6 },
      "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR": { symbol: "WTRX", decimals: 6 },
      "TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq": { symbol: "APENFT", decimals: 6 },
      "TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4": { symbol: "BTT", decimals: 18 },
      "TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S": { symbol: "SUN", decimals: 18 },
    },
  },
  neo: {
    type: 'neo',
    rpcs: ["https://mainnet1.neo.coz.io:443"],
    nativeSymbol: 'NEO',
    nativeDecimals: 0,
    lookbackBlocks: 0,
    chunkSize: 0,
    tokens: {
      "0xd2a4cff31913016155e38e474a2c06d08be276cf": { symbol: "GAS", decimals: 8 },
      "0xf0151f528127558851b39c2cd8aa47da7418ab28": { symbol: "FLM", decimals: 8 },
      "0x48c40d4666f93408be1bef038b6722404d9a4c2a": { symbol: "fUSDT", decimals: 6 },
    },
  },
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

// ─── Utilities ──────────────────────────────────────────────────────────────

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

function formatTronAmount(raw: number | string, decimals: number): string {
  try {
    const value = typeof raw === 'string' ? BigInt(raw) : BigInt(Math.floor(Number(raw)));
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

// ─── EVM RPC helper with fallback ───────────────────────────────────────────

async function evmRpcCall(rpcs: string[], method: string, params: any[]): Promise<any> {
  let lastError: Error | null = null;

  for (const rpc of rpcs) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.log(`RPC ${rpc} failed: ${lastError.message}, trying next...`);
    }
  }

  throw lastError || new Error("All RPC endpoints failed");
}

// ─── EVM swap fetcher (works for all EVM chains) ────────────────────────────

async function getEvmSwaps(walletAddress: string, config: ChainRpcConfig): Promise<Transaction[]> {
  const walletLower = walletAddress.toLowerCase();
  const paddedAddress = padAddress(walletLower);

  const decodeTopicAddress = (topic?: string) => {
    if (!topic || topic.length < 66) return null;
    return ("0x" + topic.slice(26)).toLowerCase();
  };

  console.log(`[EVM] Fetching swaps for wallet: ${walletLower}`);

  const latestBlockHex = await evmRpcCall(config.rpcs, 'eth_blockNumber', []);
  const latestBlock = parseInt(latestBlockHex, 16);
  const startBlock = Math.max(0, latestBlock - config.lookbackBlocks);

  console.log(`[EVM] Scanning blocks ${startBlock}..${latestBlock} (chunk ${config.chunkSize})`);

  const incomingByTx = new Map<string, { log: any; blockNumber: string }>();

  for (let chunkTo = latestBlock; chunkTo >= startBlock; chunkTo -= config.chunkSize) {
    const chunkFrom = Math.max(startBlock, chunkTo - config.chunkSize + 1);
    const fromBlockHex = "0x" + chunkFrom.toString(16);
    const toBlockHex = "0x" + chunkTo.toString(16);

    try {
      const logsTo = await evmRpcCall(config.rpcs, 'eth_getLogs', [{
        fromBlock: fromBlockHex,
        toBlock: toBlockHex,
        topics: [TRANSFER_TOPIC, null, paddedAddress],
      }]);

      for (const log of logsTo || []) {
        if (!incomingByTx.has(log.transactionHash)) {
          incomingByTx.set(log.transactionHash, { log, blockNumber: log.blockNumber });
        }
      }

      if (incomingByTx.size >= 40) break;
    } catch (err) {
      console.error(`[EVM] Chunk ${chunkFrom}-${chunkTo} failed:`, err);
      continue;
    }
  }

  console.log(`[EVM] ${incomingByTx.size} candidate txs with incoming transfers`);

  const sortedCandidates = Array.from(incomingByTx.entries())
    .sort((a, b) => parseInt(b[1].blockNumber, 16) - parseInt(a[1].blockNumber, 16));

  const transactions: Transaction[] = [];

  for (const [txHash, { log: incomingLog, blockNumber }] of sortedCandidates) {
    if (transactions.length >= 10) break;

    try {
      const tx = await evmRpcCall(config.rpcs, 'eth_getTransactionByHash', [txHash]);
      if (!tx || (tx.from || '').toLowerCase() !== walletLower) continue;

      const receipt = await evmRpcCall(config.rpcs, 'eth_getTransactionReceipt', [txHash]);
      if (!receipt || !Array.isArray(receipt.logs)) continue;

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

      let fromTokenSymbol: string;
      let fromAmount: string;

      if (outgoingLog) {
        const fromTokenAddr = (outgoingLog.address || '').toLowerCase();
        const info = config.tokens[fromTokenAddr] || { symbol: shortenAddress(outgoingLog.address), decimals: 18 };
        fromTokenSymbol = info.symbol;
        fromAmount = formatAmount(outgoingLog.data, info.decimals);
      } else if (valueWei > 0n) {
        fromTokenSymbol = config.nativeSymbol;
        fromAmount = formatAmount('0x' + valueWei.toString(16), config.nativeDecimals);
      } else {
        continue;
      }

      const toTokenAddr = (incomingLog.address || '').toLowerCase();
      const toInfo = config.tokens[toTokenAddr] || { symbol: shortenAddress(incomingLog.address), decimals: 18 };
      const toTokenSymbol = toInfo.symbol;
      const toAmount = formatAmount(incomingLog.data, toInfo.decimals);

      if (fromTokenSymbol === toTokenSymbol) continue;

      const block = await evmRpcCall(config.rpcs, 'eth_getBlockByNumber', [blockNumber, false]);
      const timestamp = parseInt(block.timestamp, 16);

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
      console.error(`[EVM] Error processing ${txHash}:`, err);
    }
  }

  console.log(`[EVM] Found ${transactions.length} swap transactions`);
  return transactions;
}

// ─── TRON swap fetcher ──────────────────────────────────────────────────────

async function getTronSwaps(walletAddress: string, config: ChainRpcConfig): Promise<Transaction[]> {
  console.log(`[TRON] Fetching swaps for wallet: ${walletAddress}`);

  const transactions: Transaction[] = [];

  try {
    // Fetch TRC20 transfers using TronGrid API
    const url = `https://api.trongrid.io/v1/accounts/${walletAddress}/transactions/trc20?limit=50&order_by=block_timestamp,desc`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`TronGrid HTTP ${response.status}`);

    const data = await response.json();
    const transfers = data?.data || [];

    // Group transfers by transaction_id to detect swaps (in + out in same tx)
    const txGroups = new Map<string, any[]>();
    for (const t of transfers) {
      const txId = t.transaction_id;
      if (!txGroups.has(txId)) txGroups.set(txId, []);
      txGroups.get(txId)!.push(t);
    }

    const walletLower = walletAddress.toLowerCase();

    for (const [txId, group] of txGroups) {
      if (transactions.length >= 10) break;

      const outgoing = group.find((t: any) => (t.from || '').toLowerCase() === walletLower);
      const incoming = group.find((t: any) => (t.to || '').toLowerCase() === walletLower);

      if (!outgoing || !incoming) continue;
      if (outgoing.token_info?.symbol === incoming.token_info?.symbol) continue;

      const fromDecimals = parseInt(outgoing.token_info?.decimals || '6');
      const toDecimals = parseInt(incoming.token_info?.decimals || '6');

      transactions.push({
        id: txId,
        hash: txId,
        fromToken: outgoing.token_info?.symbol || shortenAddress(outgoing.token_info?.address || ''),
        toToken: incoming.token_info?.symbol || shortenAddress(incoming.token_info?.address || ''),
        fromAmount: formatTronAmount(outgoing.value || '0', fromDecimals),
        toAmount: formatTronAmount(incoming.value || '0', toDecimals),
        status: 'completed',
        timestamp: new Date(outgoing.block_timestamp || Date.now()),
        blockNumber: 0,
      });
    }

    // Also check native TRX transactions for TRX -> token swaps
    if (transactions.length < 10) {
      const nativeUrl = `https://api.trongrid.io/v1/accounts/${walletAddress}/transactions?limit=30&order_by=block_timestamp,desc`;
      const nativeCtrl = new AbortController();
      const nativeTimeout = setTimeout(() => nativeCtrl.abort(), 10000);

      const nativeResp = await fetch(nativeUrl, {
        headers: { 'Accept': 'application/json' },
        signal: nativeCtrl.signal,
      });
      clearTimeout(nativeTimeout);

      if (nativeResp.ok) {
        const nativeData = await nativeResp.json();
        const nativeTxs = nativeData?.data || [];

        for (const ntx of nativeTxs) {
          if (transactions.length >= 10) break;
          const txId = ntx.txID;
          // Skip already processed
          if (transactions.some(t => t.hash === txId)) continue;

          // Check if this native tx has associated TRC20 transfers (swap pattern)
          const trc20Group = txGroups.get(txId);
          if (!trc20Group) continue;

          const incoming = trc20Group.find((t: any) => (t.to || '').toLowerCase() === walletLower);
          if (!incoming) continue;

          // Check if native TRX was sent
          const contract = ntx.raw_data?.contract?.[0];
          if (!contract || contract.type !== 'TriggerSmartContract') continue;

          const callValue = contract.parameter?.value?.call_value;
          if (!callValue || callValue <= 0) continue;

          const toDecimals = parseInt(incoming.token_info?.decimals || '6');

          transactions.push({
            id: txId,
            hash: txId,
            fromToken: 'TRX',
            toToken: incoming.token_info?.symbol || 'Unknown',
            fromAmount: formatTronAmount(callValue, 6),
            toAmount: formatTronAmount(incoming.value || '0', toDecimals),
            status: 'completed',
            timestamp: new Date(ntx.block_timestamp || Date.now()),
            blockNumber: ntx.blockNumber || 0,
          });
        }
      }
    }
  } catch (err) {
    console.error('[TRON] Error fetching transactions:', err);
    throw err;
  }

  console.log(`[TRON] Found ${transactions.length} swap transactions`);
  return transactions;
}

// ─── NEO N3 swap fetcher ────────────────────────────────────────────────────

async function getNeoSwaps(walletAddress: string, config: ChainRpcConfig): Promise<Transaction[]> {
  console.log(`[NEO] Fetching swaps for wallet: ${walletAddress}`);

  const transactions: Transaction[] = [];

  try {
    // Use OneGate / Dora explorer API for NEO N3 transfer history
    const url = `https://onegate.space/api/transfers?address=${walletAddress}&page=1&limit=50`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      // Fallback: try NeoTube API
      const fallbackUrl = `https://api.neotube.io/v1/address/${walletAddress}/transfers?page=1&limit=50`;
      const fbCtrl = new AbortController();
      const fbTimeout = setTimeout(() => fbCtrl.abort(), 10000);

      const fbResp = await fetch(fallbackUrl, {
        headers: { 'Accept': 'application/json' },
        signal: fbCtrl.signal,
      });
      clearTimeout(fbTimeout);

      if (!fbResp.ok) {
        console.log('[NEO] No available explorer API responded');
        return [];
      }

      const fbData = await fbResp.json();
      return parseNeoTransfers(fbData?.items || fbData?.data || [], walletAddress, config);
    }

    const data = await response.json();
    return parseNeoTransfers(data?.items || data?.data || data?.result || [], walletAddress, config);
  } catch (err) {
    console.error('[NEO] Error fetching transactions:', err);
    return [];
  }
}

function parseNeoTransfers(transfers: any[], walletAddress: string, config: ChainRpcConfig): Transaction[] {
  const transactions: Transaction[] = [];
  const walletLower = walletAddress.toLowerCase();

  // Group by txid
  const txGroups = new Map<string, any[]>();
  for (const t of transfers) {
    const txId = t.txid || t.transaction_hash || t.hash;
    if (!txId) continue;
    if (!txGroups.has(txId)) txGroups.set(txId, []);
    txGroups.get(txId)!.push(t);
  }

  for (const [txId, group] of txGroups) {
    if (transactions.length >= 10) break;

    const outgoing = group.find((t: any) =>
      (t.from || t.address_from || '').toLowerCase() === walletLower
    );
    const incoming = group.find((t: any) =>
      (t.to || t.address_to || '').toLowerCase() === walletLower
    );

    if (!outgoing || !incoming) continue;

    const fromSymbol = outgoing.symbol || outgoing.asset_name ||
      config.tokens[outgoing.contract || '']?.symbol || 'Unknown';
    const toSymbol = incoming.symbol || incoming.asset_name ||
      config.tokens[incoming.contract || '']?.symbol || 'Unknown';

    if (fromSymbol === toSymbol) continue;

    const fromDecimals = outgoing.decimals || config.tokens[outgoing.contract || '']?.decimals || 8;
    const toDecimals = incoming.decimals || config.tokens[incoming.contract || '']?.decimals || 8;

    transactions.push({
      id: txId,
      hash: txId,
      fromToken: fromSymbol,
      toToken: toSymbol,
      fromAmount: formatTronAmount(outgoing.amount || outgoing.value || '0', fromDecimals),
      toAmount: formatTronAmount(incoming.amount || incoming.value || '0', toDecimals),
      status: 'completed',
      timestamp: new Date((outgoing.timestamp || outgoing.time || 0) * 1000),
      blockNumber: outgoing.block_height || outgoing.block || 0,
    });
  }

  console.log(`[NEO] Found ${transactions.length} swap transactions`);
  return transactions;
}

// ─── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, chain = 'base' } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: "Wallet address required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = CHAIN_CONFIGS[chain];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unsupported chain: ${chain}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing request for wallet: ${walletAddress} on chain: ${chain}`);

    let transactions: Transaction[];

    switch (config.type) {
      case 'tron':
        transactions = await getTronSwaps(walletAddress, config);
        break;
      case 'neo':
        transactions = await getNeoSwaps(walletAddress, config);
        break;
      case 'evm':
      default:
        transactions = await getEvmSwaps(walletAddress, config);
        break;
    }

    return new Response(
      JSON.stringify({ transactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching transactions:", message);

    return new Response(
      JSON.stringify({ transactions: [], warning: { message } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
