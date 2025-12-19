import { useState } from "react";
import { ArrowDownUp, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";

const SwapCard = () => {
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [isSwapped, setIsSwapped] = useState(false);

  const handleSwapTokens = () => {
    setIsSwapped(!isSwapped);
    const temp = fromValue;
    setFromValue(toValue);
    setToValue(temp);
  };

  const fromToken = {
    symbol: "ETH",
    icon: "⟠",
    balance: "2.4521",
  };

  const toToken = {
    symbol: "USDC",
    icon: "💲",
    balance: "1,245.00",
  };

  return (
    <div className="glass-card p-6 w-full max-w-md animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Swap</h2>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* From Token */}
      <TokenInput
        label="You Pay"
        token={isSwapped ? toToken : fromToken}
        value={fromValue}
        onChange={setFromValue}
      />

      {/* Swap Arrow */}
      <div className="flex justify-center -my-3 relative z-10">
        <button 
          onClick={handleSwapTokens}
          className="swap-arrow"
        >
          <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* To Token */}
      <TokenInput
        label="You Receive"
        token={isSwapped ? fromToken : toToken}
        value={toValue}
        onChange={setToValue}
        readOnly
      />

      {/* Swap Info */}
      <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            <span>1 ETH = 2,345.67 USDC</span>
          </div>
          <span className="text-muted-foreground">~$0.12 fee</span>
        </div>
      </div>

      {/* Swap Button */}
      <Button variant="glow" size="lg" className="w-full mt-6">
        Connect Wallet to Swap
      </Button>

      {/* Additional Info */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        Slippage tolerance: 0.5% • Price impact: {'<'}0.01%
      </p>
    </div>
  );
};

export default SwapCard;
