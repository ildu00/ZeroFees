import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base Mainnet configuration
const BASE_RPC = "https://mainnet.base.org";
const BASESCAN_API = "https://api.basescan.org/api";

// Known DEX router addresses on Base
const DEX_ROUTERS = [
  "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap V3 SwapRouter02
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Uniswap Universal Router
  "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43", // Aerodrome Router
  "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5", // KyberSwap
].map(addr => addr.toLowerCase());

// Common token addresses on Base
const TOKEN_INFO: Record<string, { symbol: string; decimals: number }> = {
  "0x0000000000000000000000000000000000000000": { symbol: "ETH", decimals: 18 },
  "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": { symbol: "USDbC", decimals: 6 },
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": { symbol: "DAI", decimals: 18 },
  "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": { symbol: "cbETH", decimals: 18 },
  "0x940181a94a35a4569e4529a3cdfb74e38fd98631": { symbol: "AERO", decimals: 18 },
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

async function getTransactionReceipt(txHash: string): Promise<any> {
  const response = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    }),
  });
  const data = await response.json();
  return data.result;
}

async function getBlock(blockNumber: string): Promise<any> {
  const response = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: [blockNumber, false],
    }),
  });
  const data = await response.json();
  return data.result;
}

async function getRecentTransactions(walletAddress: string): Promise<Transaction[]> {
  console.log(`Fetching transactions for wallet: ${walletAddress}`);
  
  // Use Basescan API to get recent transactions (free tier)
  const url = `${BASESCAN_API}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== "1" || !data.result || !Array.isArray(data.result)) {
    console.log("No transactions found or API error:", data.message);
    return [];
  }

  const transactions: Transaction[] = [];
  
  // Filter for swap transactions (interactions with DEX routers)
  const swapTxs = data.result.filter((tx: any) => 
    DEX_ROUTERS.includes(tx.to?.toLowerCase()) && 
    tx.isError === "0"
  );

  console.log(`Found ${swapTxs.length} potential swap transactions`);

  // Process up to 10 most recent swap transactions
  for (const tx of swapTxs.slice(0, 10)) {
    try {
      const receipt = await getTransactionReceipt(tx.hash);
      if (!receipt || !receipt.logs) continue;

      // Find Transfer events
      const transfers = receipt.logs.filter((log: any) => 
        log.topics && log.topics[0] === TRANSFER_TOPIC
      );

      if (transfers.length < 2) continue;

      // Find transfers from and to the wallet
      const walletLower = walletAddress.toLowerCase();
      
      let fromTransfer = null;
      let toTransfer = null;

      for (const transfer of transfers) {
        const from = "0x" + transfer.topics[1]?.slice(26).toLowerCase();
        const to = "0x" + transfer.topics[2]?.slice(26).toLowerCase();
        
        if (from === walletLower && !fromTransfer) {
          fromTransfer = transfer;
        }
        if (to === walletLower && !toTransfer) {
          toTransfer = transfer;
        }
      }

      // Handle ETH swaps (check if ETH was sent with the transaction)
      const ethValue = BigInt(tx.value || "0");
      if (ethValue > 0n && !fromTransfer) {
        fromTransfer = {
          address: "0x0000000000000000000000000000000000000000",
          data: "0x" + ethValue.toString(16).padStart(64, "0"),
        };
      }

      if (!fromTransfer || !toTransfer) continue;

      const fromTokenAddr = fromTransfer.address.toLowerCase();
      const toTokenAddr = toTransfer.address.toLowerCase();

      const fromTokenInfo = TOKEN_INFO[fromTokenAddr] || { symbol: "TOKEN", decimals: 18 };
      const toTokenInfo = TOKEN_INFO[toTokenAddr] || { symbol: "TOKEN", decimals: 18 };

      const fromAmount = formatAmount(fromTransfer.data, fromTokenInfo.decimals);
      const toAmount = formatAmount(toTransfer.data, toTokenInfo.decimals);

      transactions.push({
        id: tx.hash,
        hash: tx.hash,
        fromToken: fromTokenInfo.symbol,
        toToken: toTokenInfo.symbol,
        fromAmount,
        toAmount,
        status: tx.txreceipt_status === "1" ? "completed" : "failed",
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        blockNumber: parseInt(tx.blockNumber),
      });

    } catch (err) {
      console.error(`Error processing tx ${tx.hash}:`, err);
    }
  }

  console.log(`Processed ${transactions.length} swap transactions`);
  return transactions;
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

serve(async (req) => {
  // Handle CORS preflight
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
    
    const transactions = await getRecentTransactions(walletAddress);

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