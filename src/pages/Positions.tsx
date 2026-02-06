import { useState } from "react";
import Header from "@/components/Header";
import BackgroundEffects from "@/components/BackgroundEffects";
import Footer from "@/components/Footer";
import { useWalletContext } from "@/contexts/WalletContext";
import { useChain } from "@/contexts/ChainContext";
import { usePositions, Position } from "@/hooks/usePositions";
import { useAvalanchePositions } from "@/hooks/useAvalanchePositions";
import { useTronPositions } from "@/hooks/useTronPositions";
import { useNeoPositions } from "@/hooks/useNeoPositions";
import { isEvmNftPositionChain, getPositionManager } from "@/config/positionManagers";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wallet, Droplets, AlertCircle } from "lucide-react";
import PositionCard from "@/components/positions/PositionCard";
import RemoveLiquidityModal from "@/components/positions/RemoveLiquidityModal";
import IncreaseLiquidityModal from "@/components/positions/IncreaseLiquidityModal";
import AddLiquidityModal from "@/components/pools/AddLiquidityModal";

// Hook result interface for unified access
interface PositionHookResult {
  positions: Position[];
  loading: boolean;
  collecting: string | null;
  removing: string | null;
  increasing: string | null;
  error: string | null;
  refetch: () => void;
  collectFees: (tokenId: string) => Promise<boolean>;
  removeLiquidity: (tokenId: string, liquidity: string, percent: number) => Promise<boolean>;
  increaseLiquidity: (tokenId: string, t0: string, t1: string, a0: string, a1: string) => Promise<boolean>;
  positionManagerAddress: string;
}

const Positions = () => {
  const { isConnected, connect } = useWalletContext();
  const { currentChain } = useChain();

  // Always call all hooks (React rules)
  const evmPositions = usePositions();
  const avalanchePositions = useAvalanchePositions();
  const tronPositions = useTronPositions();
  const neoPositions = useNeoPositions();

  // Select the active hook based on chain
  const activeHook: PositionHookResult = (() => {
    switch (currentChain.id) {
      case 'avalanche': return avalanchePositions;
      case 'tron': return tronPositions;
      case 'neo': return neoPositions;
      default: return evmPositions;
    }
  })();

  const {
    positions, loading, collecting, removing, increasing, error,
    refetch, collectFees, removeLiquidity, increaseLiquidity, positionManagerAddress
  } = activeHook;

  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [increaseModalOpen, setIncreaseModalOpen] = useState(false);
  const [addLiquidityModalOpen, setAddLiquidityModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const positionManager = getPositionManager(currentChain.id);
  const dexName = positionManager?.dexName || 'DEX';

  const handleCollect = async (tokenId: string) => {
    await collectFees(tokenId);
  };

  const handleOpenRemoveModal = (position: Position) => {
    setSelectedPosition(position);
    setRemoveModalOpen(true);
  };

  const handleOpenIncreaseModal = (position: Position) => {
    setSelectedPosition(position);
    setIncreaseModalOpen(true);
  };

  const handleRemoveLiquidity = async (tokenId: string, liquidity: string, percent: number) => {
    return await removeLiquidity(tokenId, liquidity, percent);
  };

  const handleIncreaseLiquidity = async (tokenId: string, token0Address: string, token1Address: string, amount0: string, amount1: string) => {
    return await increaseLiquidity(tokenId, token0Address, token1Address, amount0, amount1);
  };

  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              My
              <br />
              <span className="text-gradient">Positions</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              View and manage your {dexName} liquidity positions on {currentChain.shortName}
            </p>
          </div>

          {!isConnected ? (
            <div className="glass-card p-12 text-center max-w-md mx-auto">
              <Wallet className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-3">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to view your liquidity positions
              </p>
              <Button variant="glow" size="lg" onClick={connect}>
                Connect Wallet
              </Button>
            </div>
          ) : (
            <>
              {/* Header with refresh */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Your Positions</h2>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                    {dexName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refetch}
                    disabled={loading}
                    className="h-8 w-8"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <Button variant="glow" size="sm" onClick={() => setAddLiquidityModalOpen(true)}>
                  <Droplets className="w-4 h-4 mr-1" />
                  New Position
                </Button>
              </div>

              {/* Error State */}
              {error && (
                <div className="glass-card p-6 border-destructive/50 flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Failed to load positions</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={refetch} className="ml-auto">
                    Retry
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass-card p-6 animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-muted" />
                        <div className="w-10 h-10 rounded-full bg-muted -ml-3" />
                        <div className="h-5 w-24 bg-muted rounded" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 w-20 bg-muted rounded" />
                        <div className="h-6 w-28 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && positions.length === 0 && (
                <div className="glass-card p-12 text-center">
                  <Droplets className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-3">No Positions Found</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have any {dexName} liquidity positions on {currentChain.shortName} yet
                  </p>
                  <Button variant="glow" size="lg" onClick={() => setAddLiquidityModalOpen(true)}>
                    Add Liquidity
                  </Button>
                </div>
              )}

              {/* Positions Grid */}
              {!loading && positions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positions.map((position) => (
                    <PositionCard 
                      key={position.tokenId} 
                      position={position} 
                      onCollect={handleCollect}
                      onRemove={handleOpenRemoveModal}
                      onIncrease={handleOpenIncreaseModal}
                      isCollecting={collecting === position.tokenId}
                      isRemoving={removing === position.tokenId}
                      isIncreasing={increasing === position.tokenId}
                      blockExplorerUrl={currentChain.blockExplorer}
                      positionManagerAddress={positionManagerAddress}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <Footer />
        </div>
      </main>

      {/* Remove Liquidity Modal */}
      <RemoveLiquidityModal
        open={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        position={selectedPosition}
        onRemove={handleRemoveLiquidity}
        isRemoving={removing !== null}
      />

      {/* Increase Liquidity Modal */}
      <IncreaseLiquidityModal
        open={increaseModalOpen}
        onClose={() => setIncreaseModalOpen(false)}
        position={selectedPosition}
        onIncrease={handleIncreaseLiquidity}
        isIncreasing={increasing !== null}
      />

      {/* Add Liquidity Modal */}
      <AddLiquidityModal
        open={addLiquidityModalOpen}
        onClose={() => setAddLiquidityModalOpen(false)}
        pool={null}
      />
    </div>
  );
};

export default Positions;
