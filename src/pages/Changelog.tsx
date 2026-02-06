import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";
import { Calendar, Zap, Globe, ArrowLeftRight, Droplets, Wallet, Code, Shield, Layers } from "lucide-react";

interface ChangeEntry {
  type: "added" | "improved" | "fixed";
  text: string;
}

interface DayLog {
  date: string;
  title: string;
  icon: React.ReactNode;
  changes: ChangeEntry[];
}

const typeBadge: Record<string, { label: string; className: string }> = {
  added: { label: "Added", className: "bg-primary/15 text-primary border-primary/30" },
  improved: { label: "Improved", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  fixed: { label: "Fixed", className: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

const changelog: DayLog[] = [
  {
    date: "February 6, 2026",
    title: "Multi-Chain Swaps & Wallet API",
    icon: <Globe className="w-5 h-5" />,
    changes: [
      { type: "added", text: "Full swap support for Ethereum, Arbitrum, Polygon, and Optimism via Uniswap V3" },
      { type: "added", text: "Chain parameter added to Wallet API — now supports all 9 integrated networks" },
      { type: "improved", text: "get-swap-quote edge function refactored with shared price cache (30s TTL)" },
      { type: "improved", text: "SwapCard dynamically selects tokens and DEX router based on current chain" },
      { type: "improved", text: "API documentation updated — Supported Chains table now shows ✓ for all networks" },
      { type: "fixed", text: "Removed outdated 'Base only' and 'Coming soon' labels from Wallet API docs" },
    ],
  },
  {
    date: "February 5, 2026",
    title: "Avalanche & TraderJoe Integration",
    icon: <Layers className="w-5 h-5" />,
    changes: [
      { type: "added", text: "Avalanche C-Chain support with AVAX, USDC, USDT, WAVAX tokens" },
      { type: "added", text: "TraderJoe DEX integration for Avalanche swaps and liquidity" },
      { type: "added", text: "get-traderjoe-quote edge function for Avalanche swap quotes" },
      { type: "added", text: "Avalanche positions tracking via useAvalanchePositions hook" },
      { type: "improved", text: "Chain selector redesigned with network grouping (EVM / Non-EVM)" },
    ],
  },
  {
    date: "February 4, 2026",
    title: "TRON & NEO Blockchain Support",
    icon: <Globe className="w-5 h-5" />,
    changes: [
      { type: "added", text: "TRON network integration with TronLink wallet support" },
      { type: "added", text: "NEO N3 blockchain support with NeoLine wallet connector" },
      { type: "added", text: "SunSwap DEX integration for TRON swaps (TRX, USDT, USDC, WTRX)" },
      { type: "added", text: "Flamingo DEX integration for NEO swaps (NEO, GAS, FLM, fUSDT)" },
      { type: "added", text: "get-sunswap-quote and get-neo-quote edge functions" },
      { type: "added", text: "TRON and NEO position tracking hooks" },
      { type: "improved", text: "Wallet connection flow supports EVM, TRON, and NEO simultaneously" },
    ],
  },
  {
    date: "February 3, 2026",
    title: "BNB Chain & PancakeSwap",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    changes: [
      { type: "added", text: "BNB Smart Chain support with BNB, USDT, USDC, WBNB, CAKE tokens" },
      { type: "added", text: "PancakeSwap V3 integration for BSC swaps" },
      { type: "added", text: "get-pancakeswap-quote edge function for BSC swap quotes" },
      { type: "added", text: "useBnbSwap hook for PancakeSwap swap execution" },
      { type: "improved", text: "Network selector updated with BSC chain configuration" },
    ],
  },
  {
    date: "February 2, 2026",
    title: "Liquidity Pools & Positions",
    icon: <Droplets className="w-5 h-5" />,
    changes: [
      { type: "added", text: "Pools page with live Uniswap V3 pool discovery and stats" },
      { type: "added", text: "Positions page for tracking active liquidity positions" },
      { type: "added", text: "Add Liquidity modal with Simple LP, Tick-based, and Bin-based strategies" },
      { type: "added", text: "Increase and Remove Liquidity modals for position management" },
      { type: "added", text: "get-uniswap-pools and get-chain-positions edge functions" },
      { type: "improved", text: "Navigation updated with Pools and Positions links" },
    ],
  },
  {
    date: "February 1, 2026",
    title: "Wallet & Transaction History",
    icon: <Wallet className="w-5 h-5" />,
    changes: [
      { type: "added", text: "WalletConnect / Reown AppKit integration for EVM wallet connections" },
      { type: "added", text: "Transaction history panel with real-time tracking" },
      { type: "added", text: "get-wallet-transactions edge function for on-chain tx fetching" },
      { type: "added", text: "Slippage settings modal with custom tolerance configuration" },
      { type: "added", text: "Swap confirmation modal with detailed route breakdown" },
      { type: "improved", text: "Token import modal for adding custom ERC-20 tokens" },
    ],
  },
  {
    date: "January 31, 2026",
    title: "API Documentation & Developer Tools",
    icon: <Code className="w-5 h-5" />,
    changes: [
      { type: "added", text: "API documentation page at /api with interactive examples" },
      { type: "added", text: "API key request system with backend storage" },
      { type: "added", text: "Swap API, Token Price API, and Wallet API documentation sections" },
      { type: "added", text: "Syntax-highlighted code examples with Prism React Renderer" },
      { type: "improved", text: "Docs page redesigned with cleaner layout and better navigation" },
    ],
  },
  {
    date: "January 30, 2026",
    title: "Core DEX Launch",
    icon: <Zap className="w-5 h-5" />,
    changes: [
      { type: "added", text: "Zero-fee swap interface on Base network via Uniswap V3" },
      { type: "added", text: "get-swap-quote edge function with real-time pricing from CoinGecko" },
      { type: "added", text: "get-token-price edge function for token price lookups" },
      { type: "added", text: "Token selection modal with search and popular token list" },
      { type: "added", text: "Glass-morphism UI design with Space Grotesk typography" },
      { type: "added", text: "Feedback form with backend persistence" },
      { type: "added", text: "Responsive layout with mobile-first approach" },
    ],
  },
];

const Changelog = () => {
  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-20 max-w-3xl relative z-10">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Calendar className="w-4 h-4" />
            Changelog
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What's <span className="text-gradient">New</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A detailed log of every feature, improvement, and fix shipped to ZeroFees.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent hidden md:block" />

          <div className="space-y-12">
            {changelog.map((day, i) => (
              <article key={i} className="relative md:pl-14">
                {/* Dot on timeline */}
                <div className="absolute left-0 top-1 hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border/50 text-primary">
                  {day.icon}
                </div>

                {/* Date */}
                <time className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  {day.date}
                </time>

                {/* Card */}
                <div className="glass-card p-6 mt-2">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 md:hidden">
                    <span className="text-primary">{day.icon}</span>
                    {day.title}
                  </h2>
                  <h2 className="text-lg font-semibold mb-4 hidden md:block">{day.title}</h2>

                  <ul className="space-y-2.5">
                    {day.changes.map((c, j) => {
                      const badge = typeBadge[c.type];
                      return (
                        <li key={j} className="flex items-start gap-3 text-sm leading-relaxed">
                          <span
                            className={`shrink-0 mt-0.5 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-muted-foreground">{c.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
