import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TickBasedConfig } from "@/config/liquidityTypes";

interface TickBasedFormProps {
  config: TickBasedConfig;
  feeTier: number;
  setFeeTier: (v: number) => void;
  priceLower: string;
  setPriceLower: (v: string) => void;
  priceUpper: string;
  setPriceUpper: (v: string) => void;
  priceRangePercent: number;
  setPriceRangePercent: (v: number) => void;
  currentPrice: number | null;
  isFetchingPrice: boolean;
  onRefreshPrice: () => void;
  token0Symbol: string;
  token1Symbol: string;
  isLoading: boolean;
}

const TickBasedForm = ({
  config,
  feeTier,
  setFeeTier,
  priceLower,
  setPriceLower,
  priceUpper,
  setPriceUpper,
  priceRangePercent,
  setPriceRangePercent,
  currentPrice,
  isFetchingPrice,
  onRefreshPrice,
  token0Symbol,
  token1Symbol,
  isLoading,
}: TickBasedFormProps) => {
  const selectedFeeTier = config.feeTiers.find(f => f.value === feeTier) || config.feeTiers[2];

  return (
    <>
      {/* Fee Tier Selection */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Fee Tier</label>
        <div className="grid grid-cols-4 gap-2">
          {config.feeTiers.map(tier => (
            <button
              key={tier.value}
              onClick={() => setFeeTier(tier.value)}
              disabled={isLoading}
              className={`p-2 rounded-lg text-center transition-all ${
                feeTier === tier.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 hover:bg-secondary'
              } disabled:opacity-50`}
            >
              <p className="font-medium text-sm">{tier.label}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{selectedFeeTier.description}</p>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-muted-foreground">
            Price Range ({token0Symbol} per {token1Symbol})
          </label>
          <button
            onClick={onRefreshPrice}
            disabled={isLoading || isFetchingPrice}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isFetchingPrice ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Range Percentage Selector */}
        <div className="flex gap-2 mb-3">
          {config.rangeOptions.map(percent => (
            <button
              key={percent}
              onClick={() => setPriceRangePercent(percent)}
              disabled={isLoading}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                priceRangePercent === percent
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 hover:bg-secondary text-muted-foreground'
              } disabled:opacity-50`}
            >
              ±{percent}%
            </button>
          ))}
        </div>

        {/* Current Price Display */}
        {currentPrice !== null && (
          <p className="text-xs text-muted-foreground mb-2">
            Current: 1 {token0Symbol} = {currentPrice.toFixed(4)} {token1Symbol}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-input p-3">
            <span className="text-xs text-muted-foreground">Min Price</span>
            <Input
              type="number"
              inputMode="decimal"
              value={priceLower}
              onChange={(e) => setPriceLower(e.target.value)}
              placeholder="0.0"
              disabled={isLoading}
              className="border-0 bg-transparent p-0 text-base sm:text-lg font-medium h-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            />
          </div>
          <div className="glass-input p-3">
            <span className="text-xs text-muted-foreground">Max Price</span>
            <Input
              type="number"
              inputMode="decimal"
              value={priceUpper}
              onChange={(e) => setPriceUpper(e.target.value)}
              placeholder="0.0"
              disabled={isLoading}
              className="border-0 bg-transparent p-0 text-base sm:text-lg font-medium h-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TickBasedForm;
