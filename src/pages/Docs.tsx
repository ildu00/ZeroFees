import Header from "@/components/Header";
import BackgroundEffects from "@/components/BackgroundEffects";
import Footer from "@/components/Footer";
import FeedbackForm from "@/components/FeedbackForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Wallet, ArrowLeftRight, Droplets, BarChart3, Globe, Code } from "lucide-react";

const Docs = () => {
  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Documentation
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to know about using ZeroFees — the decentralized exchange on Base
            </p>
          </div>

          {/* Getting Started */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">Getting Started</h2>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 space-y-4 text-muted-foreground">
                <p>
                  ZeroFees is a decentralized exchange (DEX) built on the Base network. 
                  It allows you to swap tokens, provide liquidity, and earn rewards with minimal fees.
                </p>
                <h3 className="text-foreground font-semibold mt-4">Quick Start:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Connect your wallet (MetaMask, WalletConnect, or Coinbase Wallet)</li>
                  <li>Make sure you're on the Base network (Chain ID: 8453)</li>
                  <li>Select the tokens you want to swap</li>
                  <li>Enter the amount and review the quote</li>
                  <li>Confirm the transaction in your wallet</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* Features */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">Features</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-primary" />
                    Low Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Trade with a minimal 0.3% ReGraph fee. Combined with Base's low gas costs, you get efficient swaps.
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowLeftRight className="w-5 h-5 text-primary" />
                    Token Swaps
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Instantly swap between any supported tokens on Base with competitive rates from liquidity pools.
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplets className="w-5 h-5 text-primary" />
                    Liquidity Pools
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Provide liquidity to concentrated liquidity pools and earn a share of trading fees.
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Position Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Track and manage your liquidity positions. Add or remove liquidity at any time.
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-primary" />
                    Base Network
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Built on Base — Coinbase's L2 network with fast transactions and low gas fees.
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Code className="w-5 h-5 text-primary" />
                    Open Source
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  ZeroFees is fully open source. View our code on GitHub and contribute to the project.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">How It Works</h2>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 space-y-6 text-muted-foreground">
                <div>
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    Connecting Your Wallet
                  </h3>
                  <p>
                    Click the "Connect Wallet" button in the top right corner. Select your preferred wallet provider 
                    and approve the connection. Make sure you're connected to the Base network (Chain ID: 8453).
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                    Making a Swap
                  </h3>
                  <p>
                    Select the token you want to sell and the token you want to buy. Enter the amount, 
                    and the system will automatically find the best rate. Review the fee breakdown 
                    (0.3% ReGraph fee + network fee) and confirm the swap.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    Providing Liquidity
                  </h3>
                  <p>
                    Navigate to the Pools page to see available liquidity pools. Select a pool and 
                    click "Add Liquidity". Choose your price range for concentrated liquidity. 
                    Provide tokens and earn fees when trades occur in your range.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Security
                  </h3>
                  <p>
                    ZeroFees uses battle-tested smart contracts. Your funds remain in your wallet 
                    until you confirm a transaction. Always verify transaction details and amounts 
                    before confirming in your wallet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Fee Structure */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">Fee Structure</h2>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 space-y-4 text-muted-foreground">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="font-medium text-foreground">ReGraph Fee</span>
                    <span className="text-primary font-semibold">0.3%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="font-medium text-foreground">Pool Fee (varies by tier)</span>
                    <span>0.01% - 1%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-foreground">Network Gas</span>
                    <span>Base network rates</span>
                  </div>
                </div>
                <p className="text-sm mt-4">
                  The ReGraph fee (0.3%) is collected on each swap to support the protocol. 
                  Pool fees go to liquidity providers. Gas fees are paid to Base network validators.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">FAQ</h2>
            <div className="space-y-4">
              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">What is Base network?</h3>
                  <p className="text-muted-foreground text-sm">
                    Base is a secure, low-cost Layer 2 network built on Ethereum by Coinbase. 
                    It offers fast transactions with significantly lower gas fees compared to Ethereum mainnet.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">Which wallets are supported?</h3>
                  <p className="text-muted-foreground text-sm">
                    We support MetaMask, WalletConnect-compatible wallets, Coinbase Wallet, and other 
                    EVM-compatible wallets. Make sure your wallet is configured for the Base network.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">How do I add Base network to my wallet?</h3>
                  <p className="text-muted-foreground text-sm">
                    When you connect your wallet, you'll be prompted to add the Base network automatically. 
                    You can also add it manually: Chain ID 8453, RPC: https://mainnet.base.org
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">Can I import custom tokens?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! Click the token selector and use "Import Token" to add any ERC-20 token 
                    by its contract address. Make sure to verify the token address before trading.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">Is ZeroFees open source?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes, ZeroFees is fully open source. You can view the code and contribute on our 
                    GitHub repository at github.com/ildu00/ZeroFees
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Feedback Form */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">Get in Touch</h2>
            <FeedbackForm />
          </section>

          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Docs;
