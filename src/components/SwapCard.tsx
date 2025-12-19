import { useState, useEffect, useCallback } from "react";
import { ArrowDownUp, Settings, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token } from "./TokenSelectModal";
import { useWalletContext } from "@/contexts/WalletContext";
import { useSwap, BASE_TOKENS } from "@/hooks/useSwap";
import { toast } from "sonner";

// Convert BASE_TOKENS to Token format for the modal
const baseTokensList: Token[] = Object.values(BASE_TOKENS).map(t => ({
  symbol: t.symbol,
  name: t.name,
  icon: t.icon,
  balance: "0",
  address: t.address,
  price: 0,
  decimals: t.decimals,
}));

const SwapCard = () => {
  const { isConnected, connect, isConnecting } = useWalletContext();
  const { prices, quote, isLoadingQuote, isSwapping, fetchQuote, executeSwap } = useSwap();
  
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [fromToken, setFromToken] = useState<Token>(baseTokensList[0]); // ETH
  const [toToken, setToToken] = useState<Token>(baseTokensList[2]); // USDC
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [slippage, setSlippage] = useState(0.5);

  // Update token prices when prices change
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      setFromToken(prev => ({ ...prev, price: prices[prev.symbol] || 0 }));
      setToToken(prev => ({ ...prev, price: prices[prev.symbol] || 0 }));
    }
  }, [prices]);

  // Fetch quote when input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromValue && parseFloat(fromValue) > 0) {
        const decimals = BASE_TOKENS[fromToken.symbol as keyof typeof BASE_TOKENS]?.decimals || 18;
        fetchQuote(fromToken.symbol, toToken.symbol, fromValue, decimals);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fromValue, fromToken.symbol, toToken.symbol, fetchQuote]);

  // Update toValue when quote changes
  useEffect(() => {
    if (quote && quote.amountOut) {
      const decimals = BASE_TOKENS[toToken.symbol as keyof typeof BASE_TOKENS]?.decimals || 18;
      const amountOut = parseFloat(quote.amountOut) / Math.pow(10, decimals);
      setToValue(amountOut.toFixed(6));
    } else if (!fromValue || parseFloat(fromValue) === 0) {
      setToValue("");
    }
  }, [quote, toToken.symbol, fromValue]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempValue = fromValue;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromValue(toValue);
    setToValue(tempValue);
  };

  const handleOpenTokenSelect = (type: "from" | "to") => {
    setSelectingFor(type);
    setModalOpen(true);
  };

  const handleSelectToken = (token: Token) => {
    // Find the BASE_TOKENS entry
    const baseToken = baseTokensList.find(t => t.symbol === token.symbol);
    if (!baseToken) return;

    const tokenWithPrice = { ...baseToken, price: prices[token.symbol] || 0 };

    if (selectingFor === "from") {
      if (token.symbol === toToken.symbol) {
        setToToken(fromToken);
      }
      setFromToken(tokenWithPrice);
    } else {
      if (token.symbol === fromToken.symbol) {
        setFromToken(toToken);
      }
      setToToken(tokenWithPrice);
    }
  };

  const handleSwap = async () => {
    if (!fromValue || parseFloat(fromValue) === 0) {
      toast.error("Enter an amount");
      return;
    }

    if (!quote) {
      toast.error("No quote available");
      return;
    }

    const fromTokenData = BASE_TOKENS[fromToken.symbol as keyof typeof BASE_TOKENS];
    const toTokenData = BASE_TOKENS[toToken.symbol as keyof typeof BASE_TOKENS];

    if (!fromTokenData || !toTokenData) {
      toast.error("Invalid token");
      return;
    }

    const txHash = await executeSwap(
      fromTokenData,
      toTokenData,
      fromValue,
      quote.amountOut,
      slippage
    );

    if (txHash) {
      setFromValue("");
      setToValue("");
    }
  };

  // Calculate exchange rate
  const exchangeRate = fromToken.price && toToken.price 
    ? (fromToken.price / toToken.price).toFixed(6) 
    : prices[fromToken.symbol] && prices[toToken.symbol]
    ? (prices[fromToken.symbol] / prices[toToken.symbol]).toFixed(6)
    : "...";

  // Calculate fee display
  const feePercent = quote?.fee ? (quote.fee / 10000).toFixed(2) : "0.30";
  const feeUsd = fromValue && fromToken.price 
    ? (parseFloat(fromValue) * fromToken.price * parseFloat(feePercent) / 100).toFixed(2)
    : "0.00";

  return (
    <>
      <div className="glass-card p-6 w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Swap</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
              Base
            </span>
          </div>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* From Token */}
        <TokenInput
          label="You Pay"
          token={fromToken}
          value={fromValue}
          onChange={setFromValue}
          onTokenClick={() => handleOpenTokenSelect("from")}
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
        <div className="relative">
          <TokenInput
            label="You Receive"
            token={toToken}
            value={isLoadingQuote ? "" : toValue}
            onChange={setToValue}
            onTokenClick={() => handleOpenTokenSelect("to")}
            readOnly
          />
          {isLoadingQuote && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Swap Info */}
        <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span>1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}</span>
            </div>
            <span className="text-muted-foreground">~${feeUsd} fee ({feePercent}%)</span>
          </div>
          {quote?.route && (
            <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-1">
              <span>Route: {quote.route}</span>
              <span>Slippage: {slippage}%</span>
            </div>
          )}
        </div>

        {/* Swap Button */}
        {isConnected ? (
          <Button 
            variant="glow" 
            size="lg" 
            className="w-full mt-6"
            onClick={handleSwap}
            disabled={isSwapping || !fromValue || parseFloat(fromValue) === 0 || !quote}
          >
            {isSwapping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : !fromValue || parseFloat(fromValue) === 0 ? (
              "Enter Amount"
            ) : !quote ? (
              "Fetching Quote..."
            ) : (
              "Swap"
            )}
          </Button>
        ) : (
          <Button 
            variant="glow" 
            size="lg" 
            className="w-full mt-6"
            onClick={connect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet to Swap'}
          </Button>
        )}

        {/* Additional Info */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Slippage tolerance: {slippage}% • Powered by Uniswap V3
        </p>
      </div>

      {/* Token Select Modal */}
      <TokenSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectToken}
        selectedToken={selectingFor === "from" ? fromToken : toToken}
        tokens={baseTokensList}
      />
    </>
  );
};

export default SwapCard;