import { useState, useEffect, useCallback } from "react";
import { X, Plus, AlertCircle, Loader2, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletContext } from "@/contexts/WalletContext";
import { useChain } from "@/contexts/ChainContext";
import { toast } from "sonner";
import type { Pool } from "@/hooks/useUniswapPools";
import { useAddLiquidity, FEE_TIERS } from "@/hooks/useAddLiquidity";
import { useAddLiquidityTraderJoe } from "@/hooks/useAddLiquidityTraderJoe";
import { useAddLiquidityTron } from "@/hooks/useAddLiquidityTron";
import { useAddLiquidityNeo } from "@/hooks/useAddLiquidityNeo";
import TokenSelectModal, { Token, allTokens } from "@/components/TokenSelectModal";
import { supabase } from "@/integrations/supabase/client";
import {
  getLiquidityConfig,
  isTickBased,
  isBinBased,
  isSimpleLp,
  type LiquidityConfig,
  type TickBasedConfig,
  type BinBasedConfig,
  type SimpleLpConfig,
} from "@/config/liquidityTypes";
import TickBasedForm from "./TickBasedForm";
import BinBasedForm from "./BinBasedForm";
import SimpleLpForm from "./SimpleLpForm";

interface AddLiquidityModalProps {
  open: boolean;
  onClose: () => void;
  pool: Pool | null;
}

const IMPORTED_TOKENS_KEY = "zerofees_liquidity_imported_tokens";

const AddLiquidityModal = ({ open, onClose, pool }: AddLiquidityModalProps) => {
  const { isConnected, connect, address } = useWalletContext();
  const { currentChain } = useChain();
  const liquidityConfig = getLiquidityConfig(currentChain.id);

  // All hooks must be called unconditionally (React rules)
  const evmHook = useAddLiquidity();
  const traderJoeHook = useAddLiquidityTraderJoe();
  const tronHook = useAddLiquidityTron();
  const neoHook = useAddLiquidityNeo();

  // Select active hook
  const activeHook = (() => {
    switch (currentChain.id) {
      case 'avalanche': return traderJoeHook;
      case 'tron': return tronHook;
      case 'neo': return neoHook;
      default: return evmHook;
    }
  })();

  const isLoading = activeHook.isLoading;
  const isApproving = activeHook.isApproving;
  const isMinting = activeHook.isMinting;

  // Common state
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [lastEditedAmount, setLastEditedAmount] = useState<"amount0" | "amount1" | null>(null);
  const [slippage, setSlippage] = useState("0.5");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Tick-based state
  const [feeTier, setFeeTier] = useState(3000);
  const [priceLower, setPriceLower] = useState("");
  const [priceUpper, setPriceUpper] = useState("");
  const [priceRangePercent, setPriceRangePercent] = useState(30);

  // Bin-based state
  const [binStep, setBinStep] = useState(15);
  const [binRange, setBinRange] = useState(10);
  const [shape, setShape] = useState("uniform");
  const [activeBinId, setActiveBinId] = useState<number | null>(null);

  // Token selection state
  const [customTokens, setCustomTokens] = useState<Token[]>([]);
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [showToken0Select, setShowToken0Select] = useState(false);
  const [showToken1Select, setShowToken1Select] = useState(false);

  // Calculate linked amount based on price
  const calculateLinkedAmount = useCallback((enteredAmount: string, isAmount0: boolean): string => {
    if (!currentPrice || !enteredAmount || parseFloat(enteredAmount) === 0) return "";
    const amount = parseFloat(enteredAmount);
    if (isNaN(amount)) return "";
    const result = isAmount0 ? amount * currentPrice : amount / currentPrice;
    return result.toFixed(6);
  }, [currentPrice]);

  const handleAmount0Change = (value: string) => {
    setAmount0(value);
    setLastEditedAmount("amount0");
    const calculated = calculateLinkedAmount(value, true);
    if (calculated) setAmount1(calculated);
  };

  const handleAmount1Change = (value: string) => {
    setAmount1(value);
    setLastEditedAmount("amount1");
    const calculated = calculateLinkedAmount(value, false);
    if (calculated) setAmount0(calculated);
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

  // Load imported tokens
  useEffect(() => {
    const stored = localStorage.getItem(IMPORTED_TOKENS_KEY);
    if (stored) {
      try {
        setCustomTokens(JSON.parse(stored) as Token[]);
      } catch (e) {
        console.error("Failed to load imported tokens", e);
      }
    }
  }, []);

  const allAvailableTokens = [...allTokens, ...customTokens];

  // Initialize tokens based on pool or defaults
  useEffect(() => {
    if (pool) {
      const t0 = allAvailableTokens.find(t => t.symbol === pool.token0.symbol);
      const t1 = allAvailableTokens.find(t => t.symbol === pool.token1.symbol);
      setToken0(t0 || allAvailableTokens.find(t => t.symbol === "WETH") || allAvailableTokens[0]);
      setToken1(t1 || allAvailableTokens.find(t => t.symbol === "USDC") || allAvailableTokens[1]);
      if (pool.feeTier) {
        const tier = pool.feeTier * 10000;
        if (FEE_TIERS.some(f => f.value === tier)) setFeeTier(tier);
      }
    } else {
      setToken0(allAvailableTokens.find(t => t.symbol === "WETH") || allAvailableTokens[0]);
      setToken1(allAvailableTokens.find(t => t.symbol === "USDC") || allAvailableTokens[1]);
    }
  }, [pool, open]);

  // Reset config-specific defaults when chain changes
  useEffect(() => {
    if (isTickBased(liquidityConfig)) {
      setFeeTier(liquidityConfig.defaultFeeTier);
      setPriceRangePercent(liquidityConfig.defaultRangePercent);
    } else if (isBinBased(liquidityConfig)) {
      setBinStep(liquidityConfig.defaultBinStep);
      setBinRange(liquidityConfig.defaultBinRange);
      setShape(liquidityConfig.defaultShape);
    }
  }, [currentChain.id]);

  // Fetch current price
  const fetchPriceAndSetRange = useCallback(async () => {
    if (!token0 || !token1) return;
    setIsFetchingPrice(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-token-price', {
        body: { token0: token0.symbol, token1: token1.symbol }
      });
      if (error) throw error;

      if (data?.price) {
        const price = data.price;
        setCurrentPrice(price);

        if (isTickBased(liquidityConfig)) {
          const rangeMultiplier = priceRangePercent / 100;
          setPriceLower((price * (1 - rangeMultiplier)).toFixed(6));
          setPriceUpper((price * (1 + rangeMultiplier)).toFixed(6));
        }

        if (isBinBased(liquidityConfig)) {
          // Estimate active bin ID from price and bin step
          // binId = floor(log(price) / log(1 + binStep/10000))
          const binStepFactor = 1 + binStep / 10000;
          const estimatedBinId = Math.floor(Math.log(price) / Math.log(binStepFactor));
          setActiveBinId(estimatedBinId);
        }
      } else {
        setCurrentPrice(null);
        if (isTickBased(liquidityConfig)) {
          setPriceLower("0.5");
          setPriceUpper("2.0");
        }
      }
    } catch (err) {
      console.error("Error fetching price:", err);
      setCurrentPrice(null);
    } finally {
      setIsFetchingPrice(false);
    }
  }, [token0, token1, priceRangePercent, liquidityConfig, binStep]);

  // Auto-fetch price when tokens change
  useEffect(() => {
    if (open && token0 && token1) fetchPriceAndSetRange();
  }, [open, token0, token1, fetchPriceAndSetRange]);

  // Update tick-based price range when percentage changes
  useEffect(() => {
    if (currentPrice !== null && isTickBased(liquidityConfig)) {
      const rangeMultiplier = priceRangePercent / 100;
      setPriceLower((currentPrice * (1 - rangeMultiplier)).toFixed(6));
      setPriceUpper((currentPrice * (1 + rangeMultiplier)).toFixed(6));
    }
  }, [priceRangePercent, currentPrice]);

  // Handle token import/remove
  const handleImportToken = (newToken: Token) => {
    const exists = allAvailableTokens.some(t => t.address.toLowerCase() === newToken.address.toLowerCase());
    if (!exists) {
      const updated = [...customTokens, newToken];
      setCustomTokens(updated);
      localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(updated));
    }
  };

  const handleRemoveToken = (tokenAddress: string) => {
    const updated = customTokens.filter(t => t.address.toLowerCase() !== tokenAddress.toLowerCase());
    setCustomTokens(updated);
    localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(updated));
    if (token0?.address.toLowerCase() === tokenAddress.toLowerCase()) {
      setToken0(allAvailableTokens.find(t => t.symbol === "WETH") || allAvailableTokens[0]);
    }
    if (token1?.address.toLowerCase() === tokenAddress.toLowerCase()) {
      setToken1(allAvailableTokens.find(t => t.symbol === "USDC") || allAvailableTokens[1]);
    }
  };

  if (!open) return null;

  // Submit handler dispatches to the correct hook
  const handleAddLiquidity = async () => {
    if (!token0 || !token1) {
      toast.error("Please select both tokens");
      return;
    }
    if (!amount0 && !amount1) {
      toast.error("Please enter at least one amount");
      return;
    }

    let txHash: string | null = null;

    if (currentChain.id === 'avalanche' && isBinBased(liquidityConfig)) {
      if (activeBinId === null) {
        toast.error("Active bin not determined. Refresh price.");
        return;
      }
      txHash = await traderJoeHook.addLiquidity(
        token0.address, token1.address,
        token0.decimals || 18, token1.decimals || 18,
        amount0 || "0", amount1 || "0",
        binStep, activeBinId, binRange, shape,
        parseFloat(slippage)
      );
    } else if (currentChain.id === 'tron') {
      if (!priceLower || !priceUpper) {
        toast.error("Please set price range");
        return;
      }
      txHash = await tronHook.addLiquidity(
        token0.address, token1.address,
        token0.decimals || 6, token1.decimals || 6,
        amount0 || "0", amount1 || "0",
        feeTier, parseFloat(priceLower), parseFloat(priceUpper),
        parseFloat(slippage)
      );
    } else if (currentChain.id === 'neo') {
      txHash = await neoHook.addLiquidity(
        token0.address, token1.address,
        amount0 || "0", amount1 || "0"
      );
    } else {
      // EVM tick-based (Uniswap V3 / PancakeSwap V3)
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
      txHash = await evmHook.addLiquidityWithAddresses(
        token0.address, token1.address,
        token0.decimals || 18, token1.decimals || 18,
        amount0 || "0", amount1 || "0",
        feeTier, priceLowerNum, priceUpperNum,
        parseFloat(slippage)
      );
    }

    if (txHash) {
      onClose();
      setAmount0("");
      setAmount1("");
    }
  };

  const handleClose = () => { if (!isLoading) onClose(); };

  const handleToken0Select = (token: Token) => {
    if (token.address.toLowerCase() === token1?.address.toLowerCase()) setToken1(token0);
    setToken0(token);
    setShowToken0Select(false);
  };

  const handleToken1Select = (token: Token) => {
    if (token.address.toLowerCase() === token0?.address.toLowerCase()) setToken0(token1);
    setToken1(token);
    setShowToken1Select(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 overflow-y-auto p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md glass-card p-0 animate-scale-in my-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-lg font-semibold">Add Liquidity</h2>
            <p className="text-xs text-muted-foreground">
              {liquidityConfig.dexName} · {currentChain.shortName}
            </p>
          </div>
          <button onClick={handleClose} disabled={isLoading} className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

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

          {/* Chain-specific form sections */}
          {isTickBased(liquidityConfig) && (
            <TickBasedForm
              config={liquidityConfig}
              feeTier={feeTier}
              setFeeTier={setFeeTier}
              priceLower={priceLower}
              setPriceLower={setPriceLower}
              priceUpper={priceUpper}
              setPriceUpper={setPriceUpper}
              priceRangePercent={priceRangePercent}
              setPriceRangePercent={setPriceRangePercent}
              currentPrice={currentPrice}
              isFetchingPrice={isFetchingPrice}
              onRefreshPrice={fetchPriceAndSetRange}
              token0Symbol={token0?.symbol || "Token0"}
              token1Symbol={token1?.symbol || "Token1"}
              isLoading={isLoading}
            />
          )}

          {isBinBased(liquidityConfig) && (
            <BinBasedForm
              config={liquidityConfig}
              binStep={binStep}
              setBinStep={setBinStep}
              binRange={binRange}
              setBinRange={setBinRange}
              shape={shape}
              setShape={setShape}
              activeBinId={activeBinId}
              isFetchingPrice={isFetchingPrice}
              onRefreshPrice={fetchPriceAndSetRange}
              currentPrice={currentPrice}
              token0Symbol={token0?.symbol || "Token0"}
              token1Symbol={token1?.symbol || "Token1"}
              isLoading={isLoading}
            />
          )}

          {isSimpleLp(liquidityConfig) && (
            <SimpleLpForm
              config={liquidityConfig}
              currentPrice={currentPrice}
              token0Symbol={token0?.symbol || "Token0"}
              token1Symbol={token1?.symbol || "Token1"}
            />
          )}

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
          {!isSimpleLp(liquidityConfig) && (
            <>
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
            </>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {isBinBased(liquidityConfig)
                ? "Trader Joe Liquidity Book distributes liquidity across discrete price bins. Choose your bin step and distribution shape carefully."
                : isSimpleLp(liquidityConfig)
                ? "Flamingo uses simple LP pools. Your tokens will be deposited in equal value to earn swap fees."
                : "By adding liquidity, you'll earn fees from trades within your price range. Concentrated liquidity can result in higher returns but also impermanent loss."
              }
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
                `Add Liquidity on ${liquidityConfig.dexName}`
              )}
            </Button>
          ) : (
            <Button variant="glow" className="w-full" size="lg" onClick={connect}>
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
