import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Position } from "@/hooks/usePositions";

interface IncreaseLiquidityModalProps {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  onIncrease: (tokenId: string, token0Address: string, token1Address: string, amount0: string, amount1: string) => Promise<boolean>;
  isIncreasing: boolean;
}

const KNOWN_DECIMALS: Record<string, number> = {
  'WETH': 18,
  'USDC': 6,
  'USDbC': 6,
  'DAI': 18,
};

const getDecimals = (symbol: string): number => {
  return KNOWN_DECIMALS[symbol] || 18;
};

const parseAmount = (amount: string, decimals: number): string => {
  if (!amount || amount === '0' || amount === '') return '0';
  
  const parts = amount.split('.');
  const wholePart = parts[0] || '0';
  const decimalPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  
  const fullNumber = wholePart + decimalPart;
  return BigInt(fullNumber).toString();
};

const IncreaseLiquidityModal = ({ 
  open, 
  onClose, 
  position, 
  onIncrease,
  isIncreasing 
}: IncreaseLiquidityModalProps) => {
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');

  if (!position) return null;

  const handleIncrease = async () => {
    const decimals0 = getDecimals(position.token0.symbol);
    const decimals1 = getDecimals(position.token1.symbol);
    
    const parsedAmount0 = parseAmount(amount0, decimals0);
    const parsedAmount1 = parseAmount(amount1, decimals1);

    if (parsedAmount0 === '0' && parsedAmount1 === '0') return;

    const success = await onIncrease(
      position.tokenId,
      position.token0.address,
      position.token1.address,
      parsedAmount0,
      parsedAmount1
    );

    if (success) {
      setAmount0('');
      setAmount1('');
      onClose();
    }
  };

  const handleClose = () => {
    if (!isIncreasing) {
      setAmount0('');
      setAmount1('');
      onClose();
    }
  };

  const hasValidAmount = (amount0 && parseFloat(amount0) > 0) || (amount1 && parseFloat(amount1) > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Increase Liquidity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Position Info */}
          <div className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border border-border/30">
            <div className="flex -space-x-2">
              <img
                src={position.token0.icon}
                alt={position.token0.symbol}
                className="w-10 h-10 rounded-full border-2 border-card"
              />
              <img
                src={position.token1.icon}
                alt={position.token1.symbol}
                className="w-10 h-10 rounded-full border-2 border-card"
              />
            </div>
            <div>
              <p className="font-semibold">{position.token0.symbol}/{position.token1.symbol}</p>
              <p className="text-sm text-muted-foreground">Position #{position.tokenId}</p>
            </div>
          </div>

          {/* Token 0 Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <img src={position.token0.icon} alt={position.token0.symbol} className="w-5 h-5 rounded-full" />
              {position.token0.symbol} Amount
            </label>
            <Input
              type="number"
              placeholder="0.0"
              value={amount0}
              onChange={(e) => setAmount0(e.target.value)}
              className="bg-card/50 border-border/30"
              disabled={isIncreasing}
            />
          </div>

          {/* Token 1 Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <img src={position.token1.icon} alt={position.token1.symbol} className="w-5 h-5 rounded-full" />
              {position.token1.symbol} Amount
            </label>
            <Input
              type="number"
              placeholder="0.0"
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
              className="bg-card/50 border-border/30"
              disabled={isIncreasing}
            />
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Adding liquidity will increase your position within the existing price range. 
              You need to provide tokens in the correct ratio.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isIncreasing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="glow"
              onClick={handleIncrease}
              disabled={!hasValidAmount || isIncreasing}
              className="flex-1"
            >
              {isIncreasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Liquidity
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncreaseLiquidityModal;
