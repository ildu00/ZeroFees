import { useState } from "react";
import Header from "@/components/Header";
import BackgroundEffects from "@/components/BackgroundEffects";
import { useWalletContext } from "@/contexts/WalletContext";
import { usePositions, Position } from "@/hooks/usePositions";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wallet, ExternalLink, TrendingUp, Droplets, AlertCircle, Loader2, Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import RemoveLiquidityModal from "@/components/positions/RemoveLiquidityModal";
import IncreaseLiquidityModal from "@/components/positions/IncreaseLiquidityModal";

const formatLiquidity = (liquidity: string): string => {
  const num = BigInt(liquidity);
  if (num >= BigInt(10 ** 18)) {
    return (Number(num) / 10 ** 18).toFixed(4);
  }
  if (num >= BigInt(10 ** 12)) {
    return (Number(num) / 10 ** 12).toFixed(4) + "T";
  }
  return liquidity;
};

interface PositionCardProps {
  position: Position;
  onCollect: (tokenId: string) => void;
  onRemove: (position: Position) => void;
  onIncrease: (position: Position) => void;
  isCollecting: boolean;
  isRemoving: boolean;
  isIncreasing: boolean;
}

const PositionCard = ({ position, onCollect, onRemove, onIncrease, isCollecting, isRemoving, isIncreasing }: PositionCardProps) => {
  const hasFees = position.tokensOwed0 !== '0' || position.tokensOwed1 !== '0';
  const isLoading = isCollecting || isRemoving || isIncreasing;
  
  return (
    <div className="glass-card p-5 hover:border-primary/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img
              src={position.token0.icon}
              alt={position.token0.symbol}
              className="w-10 h-10 rounded-full border-2 border-card bg-card"
            />
            <img
              src={position.token1.icon}
              alt={position.token1.symbol}
              className="w-10 h-10 rounded-full border-2 border-card bg-card"
            />
          </div>
          <div>
            <h3 className="font-semibold">
              {position.token0.symbol}/{position.token1.symbol}
            </h3>
            <p className="text-xs text-muted-foreground">{position.fee}% fee tier</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          position.inRange 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }`}>
          {position.inRange ? 'In Range' : 'Out of Range'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Position ID</p>
          <p className="font-medium">#{position.tokenId}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Liquidity</p>
          <p className="font-medium">{formatLiquidity(position.liquidity)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Min Tick</p>
          <p className="font-medium text-sm">{position.tickLower}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Max Tick</p>
          <p className="font-medium text-sm">{position.tickUpper}</p>
        </div>
      </div>

      {/* Unclaimed Fees */}
      {hasFees && (
        <div className="p-3 bg-primary/10 rounded-xl mb-4 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Unclaimed Fees</p>
          <div className="flex gap-4 text-sm">
            <span className="font-medium text-primary">
              {formatLiquidity(position.tokensOwed0)} {position.token0.symbol}
            </span>
            <span className="font-medium text-primary">
              {formatLiquidity(position.tokensOwed1)} {position.token1.symbol}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant={hasFees ? "glow" : "glass"} 
          className="flex-1" 
          size="sm" 
          disabled={!hasFees || isLoading}
          onClick={() => onCollect(position.tokenId)}
        >
          {isCollecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Collecting...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-1" />
              Collect Fees
            </>
          )}
        </Button>
        <Button 
          variant="glass" 
          size="sm"
          disabled={isLoading}
          onClick={() => onIncrease(position)}
        >
          {isIncreasing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </>
          )}
        </Button>
        <Button 
          variant="glass" 
          size="sm"
          disabled={isLoading}
          onClick={() => onRemove(position)}
        >
          {isRemoving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Minus className="w-4 h-4 mr-1" />
              Remove
            </>
          )}
        </Button>
        <Button 
          variant="glass" 
          size="icon" 
          className="shrink-0"
          onClick={() => window.open(`https://basescan.org/nft/0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1/${position.tokenId}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const Positions = () => {
  const { isConnected, connect } = useWalletContext();
  const { positions, loading, collecting, removing, increasing, error, refetch, collectFees, removeLiquidity, increaseLiquidity } = usePositions();
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [increaseModalOpen, setIncreaseModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

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
              View and manage your Uniswap V3 liquidity positions on Base
            </p>
          </div>

          {/* Content */}
          {!isConnected ? (
            // Not connected state
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
                <Link to="/pools">
                  <Button variant="glow" size="sm">
                    <Droplets className="w-4 h-4 mr-1" />
                    New Position
                  </Button>
                </Link>
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
                    You don't have any liquidity positions on Uniswap V3 yet
                  </p>
                  <Link to="/pools">
                    <Button variant="glow" size="lg">
                      Add Liquidity
                    </Button>
                  </Link>
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
                    />
                  ))}
                </div>
              )}
            </>
          )}

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
    </div>
  );
};

export default Positions;
