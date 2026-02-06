import { useState, useEffect, useCallback } from "react";
import { X, Plus, AlertCircle, Loader2, Settings, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletContext } from "@/contexts/WalletContext";
import { toast } from "sonner";
import type { Pool } from "@/hooks/useUniswapPools";
import { useAddLiquidity, FEE_TIERS } from "@/hooks/useAddLiquidity";
import TokenSelectModal, { Token, allTokens } from "@/components/TokenSelectModal";
import { supabase } from "@/integrations/supabase/client";

interface AddLiquidityModalProps {
  open: boolean;
  onClose: () => void;
  pool: Pool | null;
}

// Local storage key for imported tokens
const IMPORTED_TOKENS_KEY = "zerofees_liquidity_imported_tokens";

const AddLiquidityModal = ({ open, onClose, pool }: AddLiquidityModalProps) => {
  const { isConnected, connect, address } = useWalletContext();
  const { addLiquidityWithAddresses, isLoading, isApproving, isMinting } = useAddLiquidity();
  
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [lastEditedAmount, setLastEditedAmount] = useState<"amount0" | "amount1" | null>(null);
  const [feeTier, setFeeTier] = useState(3000);
  const [priceLower, setPriceLower] = useState("");
  const [priceUpper, setPriceUpper] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [priceRangePercent, setPriceRangePercent] = useState(30); // ±30% by default
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Calculate the other amount based on current price and the entered amount
  const calculateLinkedAmount = useCallback((enteredAmount: string, isAmount0: boolean): string => {
    if (!currentPrice || !enteredAmount || parseFloat(enteredAmount) === 0) {
      return "";
    }
    
    const amount = parseFloat(enteredAmount);
    if (isNaN(amount)) return "";
    
    // If entering amount0 (e.g., WETH), calculate amount1 (e.g., USDC) = amount0 * price
    // If entering amount1 (e.g., USDC), calculate amount0 (e.g., WETH) = amount1 / price
    if (isAmount0) {
      const result = amount * currentPrice;
      return result.toFixed(6);
    } else {
      const result = amount / currentPrice;
      return result.toFixed(6);
    }
  }, [currentPrice]);

  // Handle amount0 change and calculate amount1
  const handleAmount0Change = (value: string) => {
    setAmount0(value);
    setLastEditedAmount("amount0");
    const calculatedAmount1 = calculateLinkedAmount(value, true);
    if (calculatedAmount1) {
      setAmount1(calculatedAmount1);
    }
  };

  // Handle amount1 change and calculate amount0
  const handleAmount1Change = (value: string) => {
    setAmount1(value);
    setLastEditedAmount("amount1");
    const calculatedAmount0 = calculateLinkedAmount(value, false);
    if (calculatedAmount0) {
      setAmount0(calculatedAmount0);
    }
  };

  // Recalculate amounts when price changes
  useEffect(() => {
    if (currentPrice !== null && lastEditedAmount) {
      if (lastEditedAmount === "amount0" && amount0) {
        const calculated = calculateLinkedAmount(amount0, true);
        if (calculated) setAmount1(calculated);
      } else if (lastEditedAmount === "amount1" && amount1) {
        const calculated = calculateLinkedAmount(amount1, false);
        if (calculated) setAmount0(calculated);
      }
    }
  }, [currentPrice, lastEditedAmount, amount0, amount1, calculateLinkedAmount]);

  // Token selection state
  const [tokens, setTokens] = useState<Token[]>(allTokens);
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [showToken0Select, setShowToken0Select] = useState(false);
  const [showToken1Select, setShowToken1Select] = useState(false);

  // Load imported tokens from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(IMPORTED_TOKENS_KEY);
    if (stored) {
      try {
        const imported = JSON.parse(stored) as Token[];
        const existingAddresses = allTokens.map(t => t.address.toLowerCase());
        const newTokens = imported.filter(t => !existingAddresses.includes(t.address.toLowerCase()));
        if (newTokens.length > 0) {
          setTokens([...allTokens, ...newTokens]);
        }
      } catch (e) {
        console.error("Failed to load imported tokens", e);
      }
    }
  }, []);

  // Initialize tokens based on pool or defaults
  useEffect(() => {
    if (pool) {
      // Find tokens from the pool by symbol only (pool doesn't have address)
      const t0 = tokens.find(t => t.symbol === pool.token0.symbol);
      const t1 = tokens.find(t => t.symbol === pool.token1.symbol);
      
      setToken0(t0 || tokens.find(t => t.symbol === "WETH") || tokens[0]);
      setToken1(t1 || tokens.find(t => t.symbol === "USDC") || tokens[1]);
      
      // Set fee tier from pool if available
      if (pool.feeTier) {
        const tier = pool.feeTier * 10000;
        if (FEE_TIERS.some(f => f.value === tier)) {
          setFeeTier(tier);
        }
      }
    } else {
      // Default tokens
      setToken0(tokens.find(t => t.symbol === "WETH") || tokens[0]);
      setToken1(tokens.find(t => t.symbol === "USDC") || tokens[1]);
    }
  }, [pool, tokens, open]);

  // Fetch current price and calculate price range
  const fetchPriceAndSetRange = useCallback(async () => {
    if (!token0 || !token1) return;
    
    setIsFetchingPrice(true);
    try {
      // Fetch price from edge function
      const { data, error } = await supabase.functions.invoke('get-token-price', {
        body: { token0: token0.symbol, token1: token1.symbol }
      });
      
      if (error) throw error;
      
      if (data?.price) {
        const price = data.price;
        setCurrentPrice(price);
        
        // Calculate range based on percentage
        const rangeMultiplier = priceRangePercent / 100;
        const lower = price * (1 - rangeMultiplier);
        const upper = price * (1 + rangeMultiplier);
        
        setPriceLower(lower.toFixed(6));
        setPriceUpper(upper.toFixed(6));
      } else {
        console.log("Price not available, using default range");
        setPriceLower("0.5");
        setPriceUpper("2.0");
        setCurrentPrice(null);
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      // Fallback to default range
      setPriceLower("0.5");
      setPriceUpper("2.0");
      setCurrentPrice(null);
    } finally {
      setIsFetchingPrice(false);
    }
  }, [token0, token1, priceRangePercent]);

  // Auto-fetch price when tokens change
  useEffect(() => {
    if (open && token0 && token1) {
      fetchPriceAndSetRange();
    }
  }, [open, token0, token1, fetchPriceAndSetRange]);

  // Update price range when percentage changes
  useEffect(() => {
    if (currentPrice !== null) {
      const rangeMultiplier = priceRangePercent / 100;
      const lower = currentPrice * (1 - rangeMultiplier);
      const upper = currentPrice * (1 + rangeMultiplier);
      setPriceLower(lower.toFixed(6));
      setPriceUpper(upper.toFixed(6));
    }
  }, [priceRangePercent, currentPrice]);

  // Handle token import
  const handleImportToken = (newToken: Token) => {
    const exists = tokens.some(t => t.address.toLowerCase() === newToken.address.toLowerCase());
    if (!exists) {
      const updatedTokens = [...tokens, newToken];
      setTokens(updatedTokens);
      
      // Save to localStorage
      const imported = updatedTokens.filter(
        t => !allTokens.some(at => at.address.toLowerCase() === t.address.toLowerCase())
      );
      localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(imported));
    }
  };

  // Handle token removal
  const handleRemoveToken = (tokenAddress: string) => {
    const updatedTokens = tokens.filter(t => t.address.toLowerCase() !== tokenAddress.toLowerCase());
    setTokens(updatedTokens);
    
    // Update localStorage
    const imported = updatedTokens.filter(
      t => !allTokens.some(at => at.address.toLowerCase() === t.address.toLowerCase())
    );
    localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(imported));
    
    // Reset selection if removed token was selected
    if (token0?.address.toLowerCase() === tokenAddress.toLowerCase()) {
      setToken0(tokens.find(t => t.symbol === "WETH") || tokens[0]);
    }
    if (token1?.address.toLowerCase() === tokenAddress.toLowerCase()) {
      setToken1(tokens.find(t => t.symbol === "USDC") || tokens[1]);
    }
  };

  if (!open) return null;

  const handleAddLiquidity = async () => {
    if (!token0 || !token1) {
      toast.error("Please select both tokens");
      return;
    }

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

    const txHash = await addLiquidityWithAddresses(
      token0.address,
      token1.address,
      token0.decimals || 18,
      token1.decimals || 18,
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

  const handleToken0Select = (token: Token) => {
    // Swap if selecting same as token1
    if (token.address.toLowerCase() === token1?.address.toLowerCase()) {
      setToken1(token0);
    }
    setToken0(token);
    setShowToken0Select(false);
  };

  const handleToken1Select = (token: Token) => {
    // Swap if selecting same as token0
    if (token.address.toLowerCase() === token0?.address.toLowerCase()) {
      setToken0(token1);
    }
    setToken1(token);
    setShowToken1Select(false);
  };

  const selectedFeeTier = FEE_TIERS.find(f => f.value === feeTier) || FEE_TIERS[2];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 overflow-y-auto p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md glass-card p-0 animate-scale-in my-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
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
              <button
                onClick={() => setShowToken0Select(true)}
                disabled={isLoading}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary/80 border border-border/30 rounded-xl transition-colors disabled:opacity-50"
              >
                {token0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{token0.icon}</span>
                    <span className="font-medium">{token0.symbol}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Token 2</label>
              <button
                onClick={() => setShowToken1Select(true)}
                disabled={isLoading}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-secondary/50 hover:bg-secondary/80 border border-border/30 rounded-xl transition-colors disabled:opacity-50"
              >
                {token1 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{token1.icon}</span>
                    <span className="font-medium">{token1.symbol}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">
                Price Range ({token0?.symbol || "Token0"} per {token1?.symbol || "Token1"})
              </label>
              <button
                onClick={fetchPriceAndSetRange}
                disabled={isLoading || isFetchingPrice}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingPrice ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {/* Range Percentage Selector */}
            <div className="flex gap-2 mb-3">
              {[10, 20, 30, 50].map(percent => (
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
                Current: 1 {token0?.symbol} = {currentPrice.toFixed(4)} {token1?.symbol}
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

          {/* Token 0 Input */}
          <div className="glass-input p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Deposit {token0?.symbol || "Token"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="decimal"
                value={amount0}
                onChange={(e) => handleAmount0Change(e.target.value)}
                placeholder="0.0"
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent text-base sm:text-2xl font-medium h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              />
              {token0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-xl">
                  <span className="text-lg">{token0.icon}</span>
                  <span className="font-medium">{token0.symbol}</span>
                </div>
              )}
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
              <span className="text-sm text-muted-foreground">Deposit {token1?.symbol || "Token"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                inputMode="decimal"
                value={amount1}
                onChange={(e) => handleAmount1Change(e.target.value)}
                placeholder="0.0"
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent text-base sm:text-2xl font-medium h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              />
              {token1 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-xl">
                  <span className="text-lg">{token1.icon}</span>
                  <span className="font-medium">{token1.symbol}</span>
                </div>
              )}
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
              disabled={isLoading || (!amount0 && !amount1) || !token0 || !token1}
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

      {/* Token Select Modals */}
      <TokenSelectModal
        isOpen={showToken0Select}
        onClose={() => setShowToken0Select(false)}
        onSelect={handleToken0Select}
        selectedToken={token0 || undefined}
        customTokens={customTokens}
        onImportToken={handleImportToken}
        onRemoveToken={handleRemoveToken}
      />

      <TokenSelectModal
        isOpen={showToken1Select}
        onClose={() => setShowToken1Select(false)}
        onSelect={handleToken1Select}
        selectedToken={token1 || undefined}
        customTokens={customTokens}
        onImportToken={handleImportToken}
        onRemoveToken={handleRemoveToken}
      />
    </div>
  );
};

export default AddLiquidityModal;
