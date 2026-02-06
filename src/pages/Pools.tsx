import Header from "@/components/Header";
import BackgroundEffects from "@/components/BackgroundEffects";
import PoolsList from "@/components/pools/PoolsList";
import Footer from "@/components/Footer";
import { useChain } from "@/contexts/ChainContext";
const Pools = () => {
  const { currentChain } = useChain();
  
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
              Provide liquidity on {currentChain.shortName} to earn fees from every trade
            </p>
          </div>

          {/* Pools List */}
          <PoolsList />

          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Pools;
