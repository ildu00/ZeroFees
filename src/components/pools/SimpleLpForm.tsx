import { Droplets } from "lucide-react";
import type { SimpleLpConfig } from "@/config/liquidityTypes";

interface SimpleLpFormProps {
  config: SimpleLpConfig;
  currentPrice: number | null;
  token0Symbol: string;
  token1Symbol: string;
}

const SimpleLpForm = ({
  config,
  currentPrice,
  token0Symbol,
  token1Symbol,
}: SimpleLpFormProps) => {
  return (
    <div className="space-y-3">
      {/* Info about simple LP */}
      <div className="flex items-start gap-3 p-3 bg-secondary/30 border border-border/30 rounded-xl">
        <Droplets className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-1">{config.dexName} — Simple Liquidity</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Current Price */}
      {currentPrice !== null && (
        <div className="glass-input p-3">
          <span className="text-xs text-muted-foreground">Current Rate</span>
          <p className="text-base font-medium">
            1 {token0Symbol} ≈ {currentPrice.toFixed(4)} {token1Symbol}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Deposit both tokens in equal value. No price range needed.
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleLpForm;
