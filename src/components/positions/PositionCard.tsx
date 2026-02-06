import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Loader2, Minus, Plus } from "lucide-react";
import type { Position } from "@/hooks/usePositions";

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
  blockExplorerUrl: string;
  positionManagerAddress: string;
}

const PositionCard = ({ 
  position, onCollect, onRemove, onIncrease, 
  isCollecting, isRemoving, isIncreasing, 
  blockExplorerUrl, positionManagerAddress 
}: PositionCardProps) => {
  const hasFees = position.tokensOwed0 !== '0' || position.tokensOwed1 !== '0';
  const isLoading = isCollecting || isRemoving || isIncreasing;
  
  const explorerUrl = `${blockExplorerUrl}/nft/${positionManagerAddress}/${position.tokenId}`;
  
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
          onClick={() => window.open(explorerUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PositionCard;
