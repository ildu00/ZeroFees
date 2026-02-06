# ZeroFees — Multi-Chain Decentralized Exchange

A modern, multi-chain decentralized exchange (DEX) aggregator supporting token swaps, liquidity provision, and position management across 9 blockchain networks.

**Live:** [zerofees.online](https://zerofees.online)

## 🚀 Features

### Token Swapping
- **Multi-chain swaps** across 9 networks with automatic DEX routing
- **Best price routing** via Uniswap V3, PancakeSwap, Trader Joe, SunSwap, and Flamingo
- **Configurable slippage** tolerance to protect against price movements
- **Real-time quotes** with USD value estimation
- **Transaction history** tracking

### Liquidity Pools
- **Pool discovery** — browse pools with TVL, 24h volume, fees, and APR
- **Add liquidity** — provide liquidity across multiple fee tiers (0.01%, 0.05%, 0.3%, 1%)
- **Multiple LP types** — Simple LP, Tick-based (Uniswap V3), and Bin-based (Trader Joe)

### Position Management
- **View & manage** active liquidity positions
- **Increase / remove** liquidity with customizable percentage
- **Collect fees** from accumulated trading rewards

### Wallet Integration
- **WalletConnect** — connect via Reown AppKit (WalletConnect v2)
- **MetaMask** — native support on mobile & desktop
- **TronLink** — for TRON network
- **NeoLine** — for NEO N3 network
- **Coinbase Wallet** and other Web3 wallets

## 🌐 Supported Networks

| Network | Chain ID | DEX | Native Token |
|---------|----------|-----|-------------|
| **Base** | 8453 | Uniswap V3 | ETH |
| **Ethereum** | 1 | Uniswap V3 | ETH |
| **Arbitrum One** | 42161 | Uniswap V3 | ETH |
| **Polygon** | 137 | Uniswap V3 | MATIC |
| **Optimism** | 10 | Uniswap V3 | ETH |
| **BNB Smart Chain** | 56 | PancakeSwap | BNB |
| **Avalanche** | 43114 | Trader Joe | AVAX |
| **TRON** | — | SunSwap | TRX |
| **NEO N3** | — | Flamingo | NEO |

## 🛠 Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom design tokens
- **UI Components:** shadcn/ui + Radix primitives
- **Web3:** ethers.js v6 + Reown AppKit
- **Backend:** Lovable Cloud (Edge Functions)
- **State Management:** TanStack Query (React Query)
- **Animations:** Framer Motion-ready

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (shadcn)
│   ├── pools/           # Liquidity pool components
│   ├── positions/       # Position management components
│   ├── SwapCard.tsx     # Main swap interface
│   ├── TokenInput.tsx   # Token selection & amount input
│   ├── NetworkSelector  # Multi-chain network switcher
│   └── ...
├── hooks/
│   ├── useSwap.ts           # Base swap logic
│   ├── useAvalancheSwap.ts  # Avalanche (Trader Joe) swap
│   ├── useBnbSwap.ts        # BSC (PancakeSwap) swap
│   ├── useTronSwap.ts       # TRON (SunSwap) swap
│   ├── useNeoSwap.ts        # NEO (Flamingo) swap
│   ├── useAppKitWallet.ts   # EVM wallet connection
│   ├── useTronLink.ts       # TronLink wallet
│   ├── useNeoLine.ts        # NeoLine wallet
│   ├── usePositions.ts      # Position management
│   └── useUniswapPools.ts   # Pool data fetching
├── pages/
│   ├── Index.tsx        # Home — swap interface
│   ├── Pools.tsx        # Liquidity pools listing
│   ├── Positions.tsx    # User positions
│   ├── Docs.tsx         # Documentation
│   ├── Api.tsx          # API access page
│   └── Changelog.tsx    # Release history
├── config/
│   ├── chains.ts        # Chain configurations
│   ├── tokens.ts        # Token lists per chain
│   ├── appkit.ts        # WalletConnect config
│   └── liquidityTypes.ts
└── contexts/
    ├── WalletContext.tsx # Wallet state provider
    └── ChainContext.tsx  # Active chain provider
```

## ⚙️ Edge Functions

| Function | Purpose |
|----------|---------|
| `get-swap-quote` | Uniswap V3 swap quotes (Base, ETH, ARB, MATIC, OP) |
| `get-pancakeswap-quote` | PancakeSwap quotes (BSC) |
| `get-traderjoe-quote` | Trader Joe quotes (Avalanche) |
| `get-sunswap-quote` | SunSwap quotes (TRON) |
| `get-neo-quote` | Flamingo quotes (NEO) |
| `get-uniswap-pools` | Pool data for all supported chains |
| `get-chain-positions` | User liquidity positions |
| `get-token-price` | Token price lookups |
| `get-wallet-transactions` | Transaction history |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## 🔐 Security

- **Non-custodial** — users maintain full control of funds
- **Slippage protection** — configurable tolerance per swap
- **Transaction confirmation** — review details before signing
- **Secure wallet connection** — WalletConnect v2 protocol

## 📱 Mobile

- Fully responsive design
- Native mobile wallet deep linking
- MetaMask & TronLink mobile app support
- WalletConnect QR scanning

## 📄 License

Proprietary software.

## 🔗 Links

- [Live App](https://zerofees.online)
- [Documentation](https://zerofees.online/docs)
- [API](https://zerofees.online/api)
- [Changelog](https://zerofees.online/changelog)
