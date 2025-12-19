import { useState, useEffect } from "react";
import { X, Plus, AlertCircle, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWalletContext } from "@/contexts/WalletContext";
import { toast } from "sonner";
import type { Pool } from "@/hooks/useUniswapPools";
import { useAddLiquidity, BASE_TOKENS, FEE_TIERS } from "@/hooks/useAddLiquidity";

interface AddLiquidityModalProps {
  open: boolean;
  onClose: () => void;
  pool: Pool | null;
}

const availableTokens = Object.entries(BASE_TOKENS).map(([symbol, info]) => ({
  symbol,
  icon: info.icon,
  address: info.address,
  decimals: info.decimals,
}));

const AddLiquidityModal = ({ open, onClose, pool }: AddLiquidityModalProps) => {
  const { isConnected, connect, address } = useWalletContext();
  const { addLiquidity, isLoading, isApproving, isMinting } = useAddLiquidity();
  
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [token0Symbol, setToken0Symbol] = useState(pool?.token0.symbol || "WETH");
  const [token1Symbol, setToken1Symbol] = useState(pool?.token1.symbol || "USDC");
  const [feeTier, setFeeTier] = useState(3000);
  const [priceLower, setPriceLower] = useState("");
  const [priceUpper, setPriceUpper] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slippage, setSlippage] = useState("0.5");

  // Update tokens when pool changes
  useEffect(() => {
    if (pool) {
      const t0 = pool.token0.symbol;
      const t1 = pool.token1.symbol;
      setToken0Symbol(BASE_TOKENS[t0] ? t0 : "WETH");
      setToken1Symbol(BASE_TOKENS[t1] ? t1 : "USDC");
      
      // Set fee tier from pool if available
      if (pool.feeTier) {
        const tier = pool.feeTier * 10000;
        if (FEE_TIERS.some(f => f.value === tier)) {
          setFeeTier(tier);
        }
      }
    }
  }, [pool]);

  // Set default price range
  useEffect(() => {
    if (!priceLower && !priceUpper) {
      // Default to a ±50% range around current price (assumed 1:1 for simplicity)
      setPriceLower("0.5");
      setPriceUpper("2.0");
    }
  }, [open]);

  if (!open) return null;

  const handleAddLiquidity = async () => {
    if (!amount0 && !amount1) {
      toast.error("Please enter at least one amount");
      return;
    }

    if (!priceLower || !priceUpper) {
      toast.error("Please set price range");
      return;
    }

    const priceLowerNum = parseFloat(priceLower);
    const priceUpperNum = parseFloat(priceUpper);

    if (priceLowerNum >= priceUpperNum) {
      toast.error("Lower price must be less than upper price");
      return;
    }

    const txHash = await addLiquidity(
      token0Symbol,
      token1Symbol,
      amount0 || "0",
      amount1 || "0",
      feeTier,
      priceLowerNum,
      priceUpperNum,
      parseFloat(slippage)
    );

    if (txHash) {
      onClose();
      setAmount0("");
      setAmount1("");
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const selectedToken0 = availableTokens.find(t => t.symbol === token0Symbol) || availableTokens[0];
  const selectedToken1 = availableTokens.find(t => t.symbol === token1Symbol) || availableTokens[1];
  const selectedFeeTier = FEE_TIERS.find(f => f.value === feeTier) || FEE_TIERS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md glass-card p-0 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">Add Liquidity</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Token Pair Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Token 1</label>
              <Select value={token0Symbol} onValueChange={setToken0Symbol} disabled={isLoading}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.filter(t => t.symbol !== token1Symbol).map(token => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <img src={token.icon} alt={token.symbol} className="w-5 h-5 rounded-full" />
                        {token.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Token 2</label>
              <Select value={token1Symbol} onValueChange={setToken1Symbol} disabled={isLoading}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.filter(t => t.symbol !== token0Symbol).map(token => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <img src={token.icon} alt={token.symbol} className="w-5 h-5 rounded-full" />
                        {token.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fee Tier Selection */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Fee Tier</label>
            <div className="grid grid-cols-4 gap-2">
              {FEE_TIERS.map(tier => (
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
            <label className="text-xs text-muted-foreground mb-2 block">
              Price Range ({token0Symbol} per {token1Symbol})
            </label>
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
                  className="border-0 bg-transparent p-0 text-base sm:text-lg font-medium h-auto focus-visible:ring-0"
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
                  className="border-0 bg-transparent p-0 text-base sm:text-lg font-medium h-auto focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Token 0 Input */}
          <div className="glass-input p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Deposit {token0Symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="decimal"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                placeholder="0.0"
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent text-base sm:text-2xl font-medium h-auto p-0 focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-xl">
                <img
                  src={selectedToken0.icon}
                  alt={token0Symbol}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{token0Symbol}</span>
              </div>
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border/50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Token 1 Input */}
          <div className="glass-input p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Deposit {token1Symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="decimal"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                placeholder="0.0"
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent text-base sm:text-2xl font-medium h-auto p-0 focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-xl">
                <img
                  src={selectedToken1.icon}
                  alt={token1Symbol}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{token1Symbol}</span>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Advanced Settings
          </button>

          {showAdvanced && (
            <div className="glass-input p-3">
              <label className="text-xs text-muted-foreground mb-1 block">Slippage Tolerance (%)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="0.5"
                disabled={isLoading}
                className="bg-transparent border-0 p-0 h-auto text-base focus-visible:ring-0"
              />
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              By adding liquidity, you'll earn fees from trades within your price range. 
              Concentrated liquidity can result in higher returns but also impermanent loss.
            </p>
          </div>

          {/* Action Button */}
          {isConnected ? (
            <Button
              variant="glow"
              className="w-full"
              size="lg"
              onClick={handleAddLiquidity}
              disabled={isLoading || (!amount0 && !amount1)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isApproving ? "Approving..." : isMinting ? "Adding Liquidity..." : "Processing..."}
                </>
              ) : (
                "Add Liquidity"
              )}
            </Button>
          ) : (
            <Button
              variant="glow"
              className="w-full"
              size="lg"
              onClick={connect}
            >
              Connect Wallet to Add Liquidity
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddLiquidityModal;
