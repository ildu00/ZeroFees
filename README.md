# BaseSwap - Decentralized Exchange on Base Network

A modern, user-friendly decentralized exchange (DEX) built on the Base network, offering token swaps, liquidity provision, and position management with a sleek interface.

## 🚀 Features

### Token Swapping
- **Instant Swaps**: Exchange tokens seamlessly on the Base network
- **Best Price Routing**: Automatically finds the optimal swap route for best prices
- **Slippage Protection**: Configurable slippage tolerance to protect against price movements
- **Real-time Quotes**: Live price quotes with USD value estimation
- **Transaction History**: Track all your swap transactions

### Liquidity Pools
- **Pool Discovery**: Browse and explore available liquidity pools
- **Add Liquidity**: Provide liquidity to earn trading fees
- **Pool Analytics**: View TVL, 24h volume, fees, and APR for each pool
- **Multiple Fee Tiers**: Support for various fee tiers (0.01%, 0.05%, 0.3%, 1%)

### Position Management
- **Active Positions**: View and manage your liquidity positions
- **Increase Liquidity**: Add more liquidity to existing positions
- **Remove Liquidity**: Withdraw liquidity with customizable percentage
- **Collect Fees**: Claim accumulated trading fees from your positions

### Wallet Integration
- **WalletConnect**: Connect via WalletConnect protocol
- **MetaMask**: Native MetaMask support on mobile and desktop
- **Coinbase Wallet**: Coinbase Wallet integration
- **Multi-wallet Support**: Connect with various Web3 wallets

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui with Radix primitives
- **Web3**: ethers.js v6 + Reown AppKit (WalletConnect)
- **Backend**: Supabase Edge Functions
- **State Management**: React Query (TanStack Query)

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (shadcn)
│   ├── pools/           # Liquidity pool components
│   ├── positions/       # Position management components
│   ├── SwapCard.tsx     # Main swap interface
│   ├── TokenInput.tsx   # Token selection & amount input
│   └── ...
├── hooks/
│   ├── useSwap.ts       # Swap logic and state
│   ├── useAppKitWallet.ts # Wallet connection
│   ├── usePositions.ts  # Position management
│   └── useUniswapPools.ts # Pool data fetching
├── pages/
│   ├── Index.tsx        # Home page with swap
│   ├── Pools.tsx        # Liquidity pools listing
│   ├── Positions.tsx    # User positions
│   └── Docs.tsx         # Documentation
├── config/
│   └── appkit.ts        # WalletConnect configuration
└── contexts/
    └── WalletContext.tsx # Wallet state provider
```

## 🔧 Supported Tokens

The DEX supports major tokens on Base network:
- **ETH** - Native Ether
- **WETH** - Wrapped Ether
- **USDC** - USD Coin
- **USDbC** - USD Base Coin
- **DAI** - Dai Stablecoin
- **AERO** - Aerodrome Finance
- **BRETT** - Brett memecoin
- **TOSHI** - Toshi memecoin

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The project uses Lovable Cloud (Supabase) for backend services. Environment variables are automatically configured.

## 🔐 Security Features

- **Non-custodial**: Users maintain full control of their funds
- **Slippage Protection**: Configurable slippage tolerance
- **Transaction Confirmation**: Review transactions before signing
- **Secure Wallet Connection**: Industry-standard WalletConnect protocol

## 📱 Mobile Support

- Responsive design for all screen sizes
- Native mobile wallet support via deep linking
- MetaMask mobile app integration
- WalletConnect QR code scanning

## 🌐 Networks

Currently supports:
- **Base Mainnet** (Chain ID: 8453)

## 📖 API Integration

The DEX integrates with:
- **Uniswap V3** - For swap quotes and liquidity pools
- **0x Protocol** - For optimal swap routing
- **Base RPC** - For blockchain interactions

## 🛡 Edge Functions

Backend functionality powered by Supabase Edge Functions:
- `get-swap-quote` - Fetches optimal swap quotes
- `get-uniswap-pools` - Retrieves pool data
- `get-wallet-transactions` - Fetches transaction history

## 📄 License

This project is proprietary software.

## 🔗 Links

- [Live App](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
- [Documentation](/docs)

---

Built with ❤️ using [Lovable](https://lovable.dev)
