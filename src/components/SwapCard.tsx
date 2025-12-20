import { useState, useEffect, useCallback } from "react";
import { ArrowDownUp, Settings, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token } from "./TokenSelectModal";
import SlippageSettingsModal from "./SlippageSettingsModal";
import SwapConfirmationModal from "./SwapConfirmationModal";
import { useWalletContext } from "@/contexts/WalletContext";
import { useSwap, BASE_TOKENS } from "@/hooks/useSwap";
import { toast } from "sonner";

// Storage key for imported tokens
const IMPORTED_TOKENS_KEY = "regraph_imported_tokens";

// Get imported tokens from localStorage
const getImportedTokens = (): Token[] => {
  try {
    const stored = localStorage.getItem(IMPORTED_TOKENS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save imported tokens to localStorage
const saveImportedTokens = (tokens: Token[]) => {
  localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(tokens));
};

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
  const { prices, balances, quote, isLoadingQuote, isSwapping, fetchQuote, executeSwap } = useSwap();
  
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [fromToken, setFromToken] = useState<Token>(baseTokensList[0]); // ETH
  const [toToken, setToToken] = useState<Token>(baseTokensList[2]); // USDC
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [slippage, setSlippage] = useState(0.1);
  const [deadline, setDeadline] = useState(30); // 30 minutes default
  const [customTokens, setCustomTokens] = useState<Token[]>(() => getImportedTokens());

  // All available tokens (base + imported)
  const allTokens = [...baseTokensList, ...customTokens];

  const handleImportToken = (token: Token) => {
    // Check if token already exists
    if (allTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
      toast.error("Token already exists");
      return;
    }
    const newCustomTokens = [...customTokens, token];
    setCustomTokens(newCustomTokens);
    saveImportedTokens(newCustomTokens);
    toast.success(`${token.symbol} added`);
  };

  const handleRemoveToken = (address: string) => {
    const newCustomTokens = customTokens.filter(t => t.address.toLowerCase() !== address.toLowerCase());
    setCustomTokens(newCustomTokens);
    saveImportedTokens(newCustomTokens);
    toast.success("Token removed");
  };

  // Update token prices and balances when they change
  useEffect(() => {
    if (Object.keys(prices).length > 0 || Object.keys(balances).length > 0) {
      setFromToken(prev => ({ 
        ...prev, 
        price: prices[prev.symbol] || 0,
        balance: balances[prev.symbol] || "0"
      }));
      setToToken(prev => ({ 
        ...prev, 
        price: prices[prev.symbol] || 0,
        balance: balances[prev.symbol] || "0"
      }));
    }
  }, [prices, balances]);

  // Detect in-app browser (MetaMask, Trust Wallet, etc.)
  const isInAppBrowser = typeof navigator !== 'undefined' && 
    /MetaMask|Trust|Coinbase|TokenPocket|imToken/i.test(navigator.userAgent);

  // Fetch quote when input changes - with improved debounce for in-app browsers
  const [quoteKey, setQuoteKey] = useState(0);

  useEffect(() => {
    // Clear previous quote immediately when inputs change
    if (!fromValue || parseFloat(fromValue) === 0) {
      setToValue("");
      return;
    }

    const decimalsIn = BASE_TOKENS[fromToken.symbol as keyof typeof BASE_TOKENS]?.decimals || 18;
    const decimalsOut = BASE_TOKENS[toToken.symbol as keyof typeof BASE_TOKENS]?.decimals || 18;

    // Use shorter debounce for in-app browsers
    const debounceMs = isInAppBrowser ? 200 : 300;
    const timer = setTimeout(() => {
      fetchQuote(fromToken.symbol, toToken.symbol, fromValue, decimalsIn, decimalsOut);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [fromValue, fromToken.symbol, toToken.symbol, fetchQuote, quoteKey, isInAppBrowser]);

  // Auto-refresh quote every 15 seconds when there's a valid amount
  useEffect(() => {
    if (!fromValue || parseFloat(fromValue) === 0) return;

    const interval = setInterval(() => {
      setQuoteKey(prev => prev + 1);
    }, 15000);

    return () => clearInterval(interval);
  }, [fromValue]);

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

  // Force refetch quote (for manual refresh)
  const refreshQuote = useCallback(() => {
    setQuoteKey(prev => prev + 1);
  }, []);

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
    // Find token in all tokens (base + custom)
    const foundToken = allTokens.find(t => t.address.toLowerCase() === token.address.toLowerCase());
    if (!foundToken) return;

    const tokenWithData = { 
      ...foundToken, 
      price: prices[token.symbol] || 0,
      balance: balances[token.symbol] || "0"
    };

    if (selectingFor === "from") {
      if (token.symbol === toToken.symbol) {
        setToToken(fromToken);
      }
      setFromToken(tokenWithData);
    } else {
      if (token.symbol === fromToken.symbol) {
        setFromToken(toToken);
      }
      setToToken(tokenWithData);
    }
  };

  const openConfirmModal = () => {
    if (!fromValue || parseFloat(fromValue) === 0) {
      toast.error("Enter an amount");
      return;
    }

    if (!quote) {
      toast.error("No quote available");
      return;
    }

    setConfirmOpen(true);
  };

  const handleSwap = async () => {
    const fromTokenData = BASE_TOKENS[fromToken.symbol as keyof typeof BASE_TOKENS];
    const toTokenData = BASE_TOKENS[toToken.symbol as keyof typeof BASE_TOKENS];

    if (!fromTokenData || !toTokenData || !quote) {
      toast.error("Invalid swap parameters");
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
      setConfirmOpen(false);
      setFromValue("");
      setToValue("");
    }
  };

  // Calculate minimum received with slippage
  const getMinReceived = () => {
    if (!toValue || parseFloat(toValue) === 0) return "0";
    const amount = parseFloat(toValue);
    const minAmount = amount * (1 - slippage / 100);
    return minAmount.toFixed(6);
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
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
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
            <button 
              onClick={refreshQuote}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh quote"
            >
              <span>~${feeUsd} fee ({feePercent}%)</span>
              <ArrowDownUp className="w-3 h-3" />
            </button>
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
            onClick={openConfirmModal}
            disabled={isSwapping || !fromValue || parseFloat(fromValue) === 0 || !quote}
          >
            {!fromValue || parseFloat(fromValue) === 0 ? (
              "Enter Amount"
            ) : !quote ? (
              "Fetching Quote..."
            ) : (
              "Review Swap"
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
          Slippage tolerance: {slippage}% • Powered by{' '}
          <a
            href="https://regraph.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            ReGraph
          </a>
        </p>
      </div>

      {/* Token Select Modal */}
      <TokenSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectToken}
        selectedToken={selectingFor === "from" ? fromToken : toToken}
        tokens={allTokens}
        onImportToken={handleImportToken}
        onRemoveToken={handleRemoveToken}
      />

      {/* Slippage Settings Modal */}
      <SlippageSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        slippage={slippage}
        onSlippageChange={setSlippage}
        deadline={deadline}
        onDeadlineChange={setDeadline}
      />

      {/* Swap Confirmation Modal */}
      <SwapConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSwap}
        isSwapping={isSwapping}
        fromToken={fromToken}
        toToken={toToken}
        fromValue={fromValue}
        toValue={toValue}
        slippage={slippage}
        fee={feeUsd}
        exchangeRate={exchangeRate}
        minReceived={getMinReceived()}
      />
    </>
  );
};

export default SwapCard;