import { RefreshCw } from "lucide-react";
import type { BinBasedConfig } from "@/config/liquidityTypes";

interface BinBasedFormProps {
  config: BinBasedConfig;
  binStep: number;
  setBinStep: (v: number) => void;
  binRange: number;
  setBinRange: (v: number) => void;
  shape: string;
  setShape: (v: string) => void;
  activeBinId: number | null;
  isFetchingPrice: boolean;
  onRefreshPrice: () => void;
  currentPrice: number | null;
  token0Symbol: string;
  token1Symbol: string;
  isLoading: boolean;
}

const BinBasedForm = ({
  config,
  binStep,
  setBinStep,
  binRange,
  setBinRange,
  shape,
  setShape,
  activeBinId,
  isFetchingPrice,
  onRefreshPrice,
  currentPrice,
  token0Symbol,
  token1Symbol,
  isLoading,
}: BinBasedFormProps) => {
  const selectedBinStep = config.binSteps.find(b => b.value === binStep) || config.binSteps[3];

  return (
    <>
      {/* Bin Step Selection */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Bin Step</label>
        <div className="grid grid-cols-3 gap-2">
          {config.binSteps.map(bs => (
            <button
              key={bs.value}
              onClick={() => setBinStep(bs.value)}
              disabled={isLoading}
              className={`p-2 rounded-lg text-center transition-all ${
                binStep === bs.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 hover:bg-secondary'
              } disabled:opacity-50`}
            >
              <p className="font-medium text-sm">{bs.label}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{selectedBinStep.description}</p>
      </div>

      {/* Active Bin / Price Info */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-muted-foreground">
            Active Bin ({token0Symbol} per {token1Symbol})
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

        {currentPrice !== null && (
          <div className="glass-input p-3 mb-3">
            <span className="text-xs text-muted-foreground">Current Price</span>
            <p className="text-base font-medium">
              1 {token0Symbol} = {currentPrice.toFixed(4)} {token1Symbol}
            </p>
            {activeBinId !== null && (
              <span className="text-xs text-muted-foreground">Active Bin ID: {activeBinId}</span>
            )}
          </div>
        )}
      </div>

      {/* Bin Range */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Number of Bins (each side)</label>
        <div className="flex gap-2">
          {config.binRangeOptions.map(range => (
            <button
              key={range}
              onClick={() => setBinRange(range)}
              disabled={isLoading}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                binRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 hover:bg-secondary text-muted-foreground'
              } disabled:opacity-50`}
            >
              ±{range}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Total: {binRange * 2 + 1} bins around active price
        </p>
      </div>

      {/* Distribution Shape */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Distribution Shape</label>
        <div className="grid grid-cols-3 gap-2">
          {config.shapes.map(s => (
            <button
              key={s.value}
              onClick={() => setShape(s.value)}
              disabled={isLoading}
              className={`p-2.5 rounded-lg text-center transition-all ${
                shape === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 hover:bg-secondary'
              } disabled:opacity-50`}
            >
              <p className="font-medium text-xs">{s.label}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {config.shapes.find(s => s.value === shape)?.description}
        </p>
      </div>
    </>
  );
};

export default BinBasedForm;
