import { ArrowDown, Info, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Token } from "./TokenSelectModal";
import { useEffect } from "react";

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSwapping: boolean;
  fromToken: Token;
  toToken: Token;
  fromValue: string;
  toValue: string;
  slippage: number;
  fee: string;
  regraphFee?: string;
  exchangeRate: string;
  minReceived: string;
}

const SwapConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isSwapping,
  fromToken,
  toToken,
  fromValue,
  toValue,
  slippage,
  fee,
  regraphFee,
  exchangeRate,
  minReceived,
}: SwapConfirmationModalProps) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const fromUsdValue = fromToken.price ? (parseFloat(fromValue) * fromToken.price).toFixed(2) : "0.00";
  const toUsdValue = toToken.price ? (parseFloat(toValue) * toToken.price).toFixed(2) : "0.00";

  return (
    <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center pt-20 md:pt-0 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={!isSwapping ? onClose : undefined}
      />

      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-sm glass-card p-0 animate-scale-in mx-4 my-4 max-h-[calc(100vh-6rem)] md:max-h-[90vh] overflow-y-auto overscroll-contain"
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold text-center">Confirm Swap</h2>
        </div>

        <div className="p-4 space-y-4">
          {/* From Token */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">You Pay</p>
                <p className="text-2xl font-semibold">{fromValue}</p>
                <p className="text-sm text-muted-foreground">${fromUsdValue}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{fromToken.icon}</span>
                <span className="font-medium">{fromToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-2">
            <div className="w-8 h-8 rounded-full bg-secondary border border-border/50 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* To Token */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">You Receive</p>
                <p className="text-2xl font-semibold text-primary">{toValue}</p>
                <p className="text-sm text-muted-foreground">${toUsdValue}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{toToken.icon}</span>
                <span className="font-medium">{toToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2 p-3 rounded-xl bg-secondary/20 border border-border/20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Exchange Rate</span>
              </div>
              <span className="font-medium">
                1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Slippage Tolerance</span>
              </div>
              <span className="font-medium">{slippage}%</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Minimum Received</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded-lg text-xs w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    Minimum amount after slippage
                  </div>
                </div>
              </div>
              <span className="font-medium">
                {minReceived} {toToken.symbol}
              </span>
            </div>

            {regraphFee && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>ReGraph Fee (0.3%)</span>
                </div>
                <span className="font-medium text-primary">~${regraphFee}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Total Fees</span>
              </div>
              <span className="font-medium">~${fee}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>Network</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-medium">Base</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-xs text-yellow-500/80">
              ⚠️ Output is estimated. You will receive at least{" "}
              <span className="font-semibold">{minReceived} {toToken.symbol}</span> or the transaction will revert.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 space-y-3">
          <Button
            variant="glow"
            className="w-full"
            onClick={onConfirm}
            disabled={isSwapping}
          >
            {isSwapping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming in Wallet...
              </>
            ) : (
              "Confirm Swap"
            )}
          </Button>
          
          {!isSwapping && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapConfirmationModal;