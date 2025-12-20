import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Position } from "@/hooks/usePositions";

interface RemoveLiquidityModalProps {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  onRemove: (tokenId: string, liquidity: string, percent: number) => Promise<boolean>;
  isRemoving: boolean;
}

const formatLiquidity = (liquidity: string): string => {
  const num = BigInt(liquidity);
  if (num >= BigInt(10 ** 18)) {
    return (Number(num) / 10 ** 18).toFixed(6);
  }
  if (num >= BigInt(10 ** 12)) {
    return (Number(num) / 10 ** 12).toFixed(6) + "T";
  }
  return liquidity;
};

const RemoveLiquidityModal = ({ 
  open, 
  onClose, 
  position, 
  onRemove,
  isRemoving 
}: RemoveLiquidityModalProps) => {
  const [percent, setPercent] = useState(100);

  if (!open || !position) return null;

  const handleRemove = async () => {
    const success = await onRemove(position.tokenId, position.liquidity, percent);
    if (success) {
      onClose();
      setPercent(100);
    }
  };

  const handleClose = () => {
    if (!isRemoving) {
      onClose();
      setPercent(100);
    }
  };

  const liquidityToRemove = (BigInt(position.liquidity) * BigInt(percent)) / BigInt(100);

  return (
    <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center pt-20 md:pt-0 overflow-y-auto p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md glass-card p-0 animate-scale-in my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold">Remove Liquidity</h2>
          <button
            onClick={handleClose}
            disabled={isRemoving}
            className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Position Info */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="flex -space-x-2">
              <img
                src={position.token0.icon}
                alt={position.token0.symbol}
                className="w-8 h-8 rounded-full border-2 border-card"
              />
              <img
                src={position.token1.icon}
                alt={position.token1.symbol}
                className="w-8 h-8 rounded-full border-2 border-card"
              />
            </div>
            <div>
              <p className="font-medium">{position.token0.symbol}/{position.token1.symbol}</p>
              <p className="text-xs text-muted-foreground">Position #{position.tokenId}</p>
            </div>
          </div>

          {/* Percent Selector */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Amount to Remove</span>
              <span className="text-2xl font-bold text-primary">{percent}%</span>
            </div>
            
            <Slider
              value={[percent]}
              onValueChange={(value) => setPercent(value[0])}
              min={1}
              max={100}
              step={1}
              disabled={isRemoving}
              className="mb-4"
            />

            <div className="flex gap-2">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => setPercent(p)}
                  disabled={isRemoving}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    percent === p 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/60 hover:bg-secondary'
                  } disabled:opacity-50`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="glass-input p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Liquidity</span>
              <span className="font-medium">{formatLiquidity(position.liquidity)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Removing</span>
              <span className="font-medium text-primary">{formatLiquidity(liquidityToRemove.toString())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {formatLiquidity((BigInt(position.liquidity) - liquidityToRemove).toString())}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Removing liquidity will withdraw your tokens from the pool. Any unclaimed fees will also be collected.
            </p>
          </div>

          {/* Action Button */}
          <Button
            variant="glow"
            className="w-full"
            size="lg"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing Liquidity...
              </>
            ) : (
              `Remove ${percent}% Liquidity`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RemoveLiquidityModal;
