import { useState } from "react";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlippageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  onSlippageChange: (slippage: number) => void;
  deadline: number;
  onDeadlineChange: (deadline: number) => void;
}

const PRESET_SLIPPAGES = [0.1, 0.5, 1.0];

const SlippageSettingsModal = ({
  isOpen,
  onClose,
  slippage,
  onSlippageChange,
  deadline,
  onDeadlineChange,
}: SlippageSettingsModalProps) => {
  const [customSlippage, setCustomSlippage] = useState(
    PRESET_SLIPPAGES.includes(slippage) ? "" : slippage.toString()
  );
  const [customDeadline, setCustomDeadline] = useState(deadline.toString());

  if (!isOpen) return null;

  const handlePresetClick = (value: number) => {
    setCustomSlippage("");
    onSlippageChange(value);
  };

  const handleCustomSlippageChange = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onSlippageChange(numValue);
    }
  };

  const handleDeadlineChange = (value: string) => {
    setCustomDeadline(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 180) {
      onDeadlineChange(numValue);
    }
  };

  const isHighSlippage = slippage > 5;
  const isLowSlippage = slippage < 0.1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm glass-card p-0 animate-scale-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold">Transaction Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Slippage Tolerance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Slippage Tolerance</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg text-xs w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PRESET_SLIPPAGES.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    slippage === preset && !customSlippage
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-foreground hover:bg-secondary"
                  }`}
                >
                  {preset}%
                </button>
              ))}

              <div className="flex-1 min-w-[80px] relative">
                <input
                  type="text"
                  value={customSlippage}
                  onChange={(e) => handleCustomSlippageChange(e.target.value)}
                  placeholder="Custom"
                  className={`w-full py-2 px-3 pr-7 rounded-xl text-sm font-medium bg-secondary/60 text-foreground placeholder:text-muted-foreground/50 outline-none border transition-all ${
                    customSlippage
                      ? "border-primary"
                      : "border-transparent hover:bg-secondary"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            {/* Warnings */}
            {isHighSlippage && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <span className="text-xs text-destructive">
                  ⚠️ High slippage may result in unfavorable trades
                </span>
              </div>
            )}
            {isLowSlippage && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <span className="text-xs text-yellow-500">
                  ⚠️ Low slippage may cause transaction to fail
                </span>
              </div>
            )}
          </div>

          {/* Transaction Deadline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Transaction Deadline</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg text-xs w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Your transaction will revert if it is pending for more than this period of time.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={customDeadline}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl text-sm font-medium bg-secondary/60 text-foreground outline-none border border-transparent focus:border-primary transition-all"
                />
              </div>
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          {/* MEV Protection Info */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-primary">🛡️ MEV Protection</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions are submitted with private mempool protection to prevent front-running and sandwich attacks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <Button variant="glow" className="w-full" onClick={onClose}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SlippageSettingsModal;