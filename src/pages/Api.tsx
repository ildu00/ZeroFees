import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Highlight, themes } from "prism-react-renderer";
import { toast } from "sonner";

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="relative group">
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language as any}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre 
            className="rounded-lg p-4 overflow-x-auto text-sm border border-border/30" 
            style={{ ...style, background: 'hsl(var(--secondary) / 0.5)' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                <span className="table-cell pr-4 text-muted-foreground/50 select-none text-right" style={{ minWidth: '2rem' }}>
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-background/80 border border-border/30 opacity-0 group-hover:opacity-100 transition-all hover:bg-secondary"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
};

const ApiSection = ({ 
  title, 
  method, 
  endpoint, 
  description, 
  requestBody, 
  responseBody,
  parameters 
}: { 
  title: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  description: string;
  requestBody?: string;
  responseBody: string;
  parameters?: { name: string; type: string; description: string; required: boolean }[];
}) => {
  const methodColors = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-mono font-bold border ${methodColors[method]}`}>
            {method}
          </span>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg p-3 font-mono text-sm break-all">
        <span className="text-muted-foreground">{endpoint}</span>
      </div>

      {parameters && parameters.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Parameters</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Required</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => (
                  <tr key={param.name} className="border-b border-border/20">
                    <td className="py-2 px-3 font-mono text-primary">{param.name}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{param.type}</td>
                    <td className="py-2 px-3">
                      {param.required ? (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Yes</span>
                      ) : (
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">No</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requestBody && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Request Body</h4>
          <CodeBlock code={requestBody} />
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-2">Response</h4>
        <CodeBlock code={responseBody} />
      </div>
    </div>
  );
};

const Api = () => {
  const baseUrl = "https://hkvmvhrwwvpjiypqvjyv.supabase.co/functions/v1";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Code className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Developer API</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">API Reference</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete API documentation for integrating with ZERO FEES DeFi services on Base network.
            </p>
          </div>

          {/* Base URL */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-2">Base URL</h2>
            <div className="bg-secondary/30 rounded-lg p-3 font-mono text-sm break-all">
              {baseUrl}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              All API endpoints are served over HTTPS. Authentication is handled via Supabase API keys.
            </p>
          </div>

          {/* Authentication */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Authentication</h2>
            <p className="text-muted-foreground mb-4">
              All requests must include the following headers:
            </p>
            <CodeBlock code={`{
  "apikey": "YOUR_SUPABASE_ANON_KEY",
  "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY",
  "Content-Type": "application/json"
}`} />
          </div>

          {/* API Sections */}
          <div className="space-y-8">
            {/* Section: Swap */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Swap API
              </h2>

              <div className="space-y-6">
                <ApiSection
                  title="Get Token Prices"
                  method="POST"
                  endpoint={`${baseUrl}/get-swap-quote`}
                  description="Fetches current USD prices for all supported tokens on Base network. Prices are sourced from CoinGecko."
                  requestBody={`{
  "action": "prices"
}`}
                  responseBody={`{
  "prices": {
    "ETH": 2986.65,
    "WETH": 2986.65,
    "USDC": 0.999845,
    "BRETT": 0.00018221,
    "DEGEN": 0.0089,
    "AERO": 0.512766,
    // ... 50+ tokens
  },
  "tokens": {
    "ETH": "0x0000000000000000000000000000000000000000",
    "WETH": "0x4200000000000000000000000000000000000006",
    "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    // ... token addresses
  }
}`}
                />

                <ApiSection
                  title="Get Swap Quote"
                  method="POST"
                  endpoint={`${baseUrl}/get-swap-quote`}
                  description="Calculates the expected output amount for a token swap, including fees and price impact estimation."
                  parameters={[
                    { name: "action", type: "string", required: true, description: 'Must be "quote"' },
                    { name: "tokenIn", type: "string", required: true, description: "Input token symbol (e.g., ETH, USDC, BRETT)" },
                    { name: "tokenOut", type: "string", required: true, description: "Output token symbol" },
                    { name: "amountIn", type: "string", required: true, description: "Input amount in wei (smallest unit)" },
                  ]}
                  requestBody={`{
  "action": "quote",
  "tokenIn": "ETH",
  "tokenOut": "USDC",
  "amountIn": "1000000000000000000"  // 1 ETH in wei
}`}
                  responseBody={`{
  "amountOut": "2980123456",  // Output in smallest unit (6 decimals for USDC)
  "fee": 3000,                 // 0.3% fee (3000 = 0.3%)
  "route": "ETH -> USDC",
  "decimalsOut": 6
}`}
                />
              </div>
            </div>

            {/* Section: Pools */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Pools API
              </h2>

              <div className="space-y-6">
                <ApiSection
                  title="Get Uniswap V3 Pools"
                  method="POST"
                  endpoint={`${baseUrl}/get-uniswap-pools`}
                  description="Fetches top liquidity pools from Uniswap V3 on Base network, including TVL, volume, and fee tier information."
                  requestBody={`{
  "limit": 20,
  "orderBy": "totalValueLockedUSD"
}`}
                  responseBody={`{
  "pools": [
    {
      "id": "0x...",
      "token0": {
        "symbol": "WETH",
        "name": "Wrapped Ether",
        "decimals": "18"
      },
      "token1": {
        "symbol": "USDC",
        "name": "USD Coin",
        "decimals": "6"
      },
      "feeTier": "500",
      "totalValueLockedUSD": "45000000.00",
      "volumeUSD": "120000000.00",
      "token0Price": "2986.50",
      "token1Price": "0.000335"
    }
  ]
}`}
                  parameters={[
                    { name: "limit", type: "number", required: false, description: "Number of pools to return (default: 20, max: 100)" },
                    { name: "orderBy", type: "string", required: false, description: "Sort field: totalValueLockedUSD, volumeUSD" },
                  ]}
                />
              </div>
            </div>

            {/* Section: Wallet */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Wallet API
              </h2>

              <div className="space-y-6">
                <ApiSection
                  title="Get Wallet Transactions"
                  method="POST"
                  endpoint={`${baseUrl}/get-wallet-transactions`}
                  description="Retrieves transaction history for a specific wallet address on Base network using BaseScan API."
                  parameters={[
                    { name: "address", type: "string", required: true, description: "Wallet address (0x...)" },
                    { name: "page", type: "number", required: false, description: "Page number for pagination (default: 1)" },
                    { name: "limit", type: "number", required: false, description: "Transactions per page (default: 50)" },
                  ]}
                  requestBody={`{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE23",
  "page": 1,
  "limit": 50
}`}
                  responseBody={`{
  "transactions": [
    {
      "hash": "0x...",
      "from": "0x...",
      "to": "0x...",
      "value": "1000000000000000000",
      "timestamp": "1703001234",
      "gasUsed": "21000",
      "gasPrice": "1000000000",
      "isError": "0",
      "methodId": "0xa9059cbb"
    }
  ],
  "total": 150
}`}
                />
              </div>
            </div>

            {/* Supported Tokens */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Supported Tokens
              </h2>

              <div className="glass-card p-6">
                <p className="text-muted-foreground mb-4">
                  The following tokens are supported for swaps on Base network:
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                  {[
                    "ETH", "WETH", "USDC", "USDT", "DAI", "USDbC", "EURC", "crvUSD",
                    "cbETH", "wstETH", "rETH", "ezETH", "weETH",
                    "AERO", "WELL", "MORPHO", "SEAM", "EXTRA", "BSWAP", "ALB",
                    "BRETT", "DEGEN", "TOSHI", "HIGHER", "NORMIE", "MOCHI", "KEYCAT",
                    "TYBG", "DOGINME", "BENJI", "MFER", "BASED", "BALD", "DINO",
                    "CHOMP", "SKI", "WEIRDO", "VIRTUAL", "FRIEND",
                    "SNX", "COMP", "YFI", "UNI", "LINK", "CRV", "BAL", "LDO", "PENDLE"
                  ].map((token) => (
                    <div key={token} className="bg-secondary/30 rounded px-3 py-1.5 text-sm font-mono text-center">
                      {token}
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  Custom tokens can be imported by contract address using the frontend interface.
                </p>
              </div>
            </div>

            {/* Rate Limits */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Rate Limits & Best Practices
              </h2>

              <div className="glass-card p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Rate Limits</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Price API: 100 requests per minute</li>
                    <li>• Quote API: 60 requests per minute</li>
                    <li>• Pools API: 30 requests per minute</li>
                    <li>• Transactions API: 20 requests per minute</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Best Practices</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Cache price responses for at least 30 seconds</li>
                    <li>• Use WebSocket for real-time price updates when available</li>
                    <li>• Always validate token addresses before executing swaps</li>
                    <li>• Implement proper error handling for failed requests</li>
                    <li>• Use appropriate slippage tolerance (0.5% - 1% for stable pairs, 1% - 5% for volatile pairs)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Error Codes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Code</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/20">
                          <td className="py-2 px-3 font-mono">400</td>
                          <td className="py-2 px-3 text-muted-foreground">Invalid request parameters</td>
                        </tr>
                        <tr className="border-b border-border/20">
                          <td className="py-2 px-3 font-mono">401</td>
                          <td className="py-2 px-3 text-muted-foreground">Missing or invalid API key</td>
                        </tr>
                        <tr className="border-b border-border/20">
                          <td className="py-2 px-3 font-mono">429</td>
                          <td className="py-2 px-3 text-muted-foreground">Rate limit exceeded</td>
                        </tr>
                        <tr className="border-b border-border/20">
                          <td className="py-2 px-3 font-mono">500</td>
                          <td className="py-2 px-3 text-muted-foreground">Internal server error</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* SDK */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                JavaScript SDK Example
              </h2>

              <div className="glass-card p-6">
                <p className="text-muted-foreground mb-4">
                  Example integration using the Supabase JavaScript client:
                </p>

                <CodeBlock code={`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hkvmvhrwwvpjiypqvjyv.supabase.co',
  'YOUR_ANON_KEY'
);

// Get token prices
async function getTokenPrices() {
  const { data, error } = await supabase.functions.invoke('get-swap-quote', {
    body: { action: 'prices' }
  });
  
  if (error) throw error;
  return data.prices;
}

// Get swap quote
async function getSwapQuote(tokenIn, tokenOut, amountInWei) {
  const { data, error } = await supabase.functions.invoke('get-swap-quote', {
    body: { 
      action: 'quote',
      tokenIn,
      tokenOut,
      amountIn: amountInWei
    }
  });
  
  if (error) throw error;
  return data;
}

// Usage
const prices = await getTokenPrices();
console.log('ETH Price:', prices.ETH);

const quote = await getSwapQuote('ETH', 'USDC', '1000000000000000000');
console.log('Expected USDC:', quote.amountOut);`} language="javascript" />
              </div>
            </div>

            {/* Contract Addresses */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Contract Addresses
              </h2>

              <div className="glass-card p-6">
                <p className="text-muted-foreground mb-4">
                  Key contract addresses on Base mainnet:
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-sm font-medium">Uniswap V3 SwapRouter02</span>
                    <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono">
                      0x2626664c2603336E57B271c5C0b26F421741e481
                    </code>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-sm font-medium">Uniswap V3 Factory</span>
                    <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono">
                      0x33128a8fC17869897dcE68Ed026d694621f6FDfD
                    </code>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-sm font-medium">WETH</span>
                    <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono">
                      0x4200000000000000000000000000000000000006
                    </code>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium">USDC</span>
                    <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono">
                      0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                    </code>
                  </div>
                </div>

                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://basescan.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on BaseScan
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Api;
