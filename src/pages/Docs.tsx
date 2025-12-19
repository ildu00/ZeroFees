import Header from "@/components/Header";
import BackgroundEffects from "@/components/BackgroundEffects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Wallet, ArrowLeftRight, Droplets, BarChart3 } from "lucide-react";

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
              Everything you need to know about using ZERO FEES DEX powered by ReGraph
            </p>
          </div>

          {/* Getting Started */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">Getting Started</h2>
            <Card className="glass-card border-white/10">
              <CardContent className="p-6 space-y-4 text-muted-foreground">
                <p>
                  ZERO FEES is a decentralized exchange (DEX) built on the Base network using ReGraph technology. 
                  It allows you to swap tokens, provide liquidity, and earn rewards — all with zero trading fees.
                </p>
                <h3 className="text-foreground font-semibold mt-4">Quick Start:</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Connect your wallet (MetaMask, WalletConnect, or Coinbase Wallet)</li>
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
                    Zero Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Trade without paying any protocol fees. You only pay the network gas fee.
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
                  Instantly swap between any supported tokens with best-in-class rates.
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
                  Provide liquidity to pools and earn a share of trading volume.
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
                  Track and manage your liquidity positions with detailed analytics.
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
                    and approve the connection. Make sure you're connected to the Base network.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                    Making a Swap
                  </h3>
                  <p>
                    Select the token you want to sell and the token you want to buy. Enter the amount, 
                    and the system will automatically calculate the best rate. Review the details and 
                    confirm the swap. The transaction will be processed on the Base blockchain.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    Providing Liquidity
                  </h3>
                  <p>
                    Navigate to the Pools page to see available liquidity pools. Select a pool and 
                    click "Add Liquidity". You'll need to provide both tokens in the pair. Once added, 
                    you'll receive LP tokens representing your share of the pool.
                  </p>
                </div>

                <div>
                  <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Security
                  </h3>
                  <p>
                    ZERO FEES is built on ReGraph technology with security as a priority. All smart contracts 
                    are open-source and audited. Your funds remain in your wallet until you confirm a transaction. 
                    Always verify transaction details before confirming.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gradient">FAQ</h2>
            <div className="space-y-4">
              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">What is ReGraph?</h3>
                  <p className="text-muted-foreground text-sm">
                    ReGraph is the underlying protocol technology that powers ZERO FEES DEX, enabling 
                    efficient token swaps and liquidity provision on the Base network.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">Why are there no fees?</h3>
                  <p className="text-muted-foreground text-sm">
                    ZERO FEES operates without protocol fees to maximize value for traders. 
                    You only pay the standard Base network gas fees for transactions.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">Which wallets are supported?</h3>
                  <p className="text-muted-foreground text-sm">
                    We support MetaMask, WalletConnect-compatible wallets, and Coinbase Wallet. 
                    Make sure your wallet is configured for the Base network.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-foreground font-semibold mb-2">How do I add the Base network?</h3>
                  <p className="text-muted-foreground text-sm">
                    When you connect your wallet, you'll be prompted to add the Base network if it's not 
                    already configured. Alternatively, you can add it manually with Chain ID 8453.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-24 text-center">
            <p className="text-xs text-muted-foreground/50">
              © 2025 zerofees.online — Decentralized Exchange Protocol
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Docs;
