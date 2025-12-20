import { ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pool } from "@/hooks/useUniswapPools";

interface PoolCardProps {
  pool: Pool;
  onAddLiquidity: () => void;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const PoolCard = ({ pool, onAddLiquidity }: PoolCardProps) => {
  return (
    <div className="glass-card p-5 hover:border-primary/30 transition-all duration-300 group">
      {/* Token Pair Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img
              src={pool.token0.icon}
              alt={pool.token0.symbol}
              className="w-10 h-10 rounded-full border-2 border-card bg-card"
            />
            <img
              src={pool.token1.icon}
              alt={pool.token1.symbol}
              className="w-10 h-10 rounded-full border-2 border-card bg-card"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold flex items-center" title={`${pool.token0.symbol}/${pool.token1.symbol}`}>
              <span className="truncate max-w-[60px]">{pool.token0.symbol}</span>
              <span>/</span>
              <span className="truncate max-w-[60px]">{pool.token1.symbol}</span>
            </h3>
            <p className="text-xs text-muted-foreground">{pool.feeTier ? `${pool.feeTier}%` : '0.3%'} fee tier</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          {pool.apr.toFixed(1)}%
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">TVL</p>
          <p className="font-medium">{formatCurrency(pool.tvl)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
          <p className="font-medium">{formatCurrency(pool.volume24h)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">24h Fees</p>
          <p className="font-medium text-primary">{formatCurrency(pool.fees24h)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">APR</p>
          <p className="font-medium text-primary">{pool.apr.toFixed(2)}%</p>
        </div>
      </div>

      {/* My Position (if any) */}
      {pool.myLiquidity && (
        <div className="p-3 bg-primary/10 rounded-xl mb-4 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">My Liquidity</p>
          <p className="font-semibold text-primary">{formatCurrency(pool.myLiquidity)}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="glow" 
          className="flex-1" 
          size="sm"
          onClick={onAddLiquidity}
        >
          Add Liquidity
        </Button>
        <Button 
          variant="glass" 
          size="icon" 
          className="shrink-0"
          onClick={() => {
            // Extract address from pool.id (format: "base_0x..." or "0x...")
            const address = pool.id.includes('_') ? pool.id.split('_').pop() : pool.id;
            window.open(`https://basescan.org/address/${address}`, '_blank');
          }}
        >
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PoolCard;
