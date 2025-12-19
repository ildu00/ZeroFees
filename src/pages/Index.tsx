import Header from "@/components/Header";
import SwapCard from "@/components/SwapCard";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import BackgroundEffects from "@/components/BackgroundEffects";
import TransactionHistory from "@/components/TransactionHistory";
import Footer from "@/components/Footer";
const Index = () => {
  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Trade Crypto
              <br />
              <span className="text-gradient">Instantly</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Swap tokens with the best rates, lowest fees, and lightning-fast execution
            </p>
          </div>

          {/* Swap Interface */}
          <div className="flex justify-center mb-8">
            <SwapCard />
          </div>

          {/* Transaction History */}
          <div className="mt-12 mb-16">
            <TransactionHistory />
          </div>

          {/* Stats */}
          <Stats />

          {/* Features */}
          <Features />

          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Index;
