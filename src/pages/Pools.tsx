import Header from "@/components/Header";
import BackgroundEffects from "@/components/BackgroundEffects";
import PoolsList from "@/components/pools/PoolsList";

const Pools = () => {
  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Liquidity
              <br />
              <span className="text-gradient">Pools</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Provide liquidity to earn fees from every trade
            </p>
          </div>

          {/* Pools List */}
          <PoolsList />

          {/* Footer */}
          <footer className="mt-24 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Docs</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">Discord</a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground/50">
              © 2024 SWAP.fi — Decentralized Exchange Protocol
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Pools;
