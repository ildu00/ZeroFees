import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowDownUp, Settings, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token } from "./TokenSelectModal";
import SlippageSettingsModal from "./SlippageSettingsModal";
import SwapConfirmationModal from "./SwapConfirmationModal";
import { useWalletContext } from "@/contexts/WalletContext";
import { useChain } from "@/contexts/ChainContext";
import { useSwap, BASE_TOKENS } from "@/hooks/useSwap";
import { useTronSwap, TRON_TOKENS } from "@/hooks/useTronSwap";
import { useNeoSwap, NEO_SWAP_TOKENS } from "@/hooks/useNeoSwap";
import { useBnbSwap, BNB_TOKENS } from "@/hooks/useBnbSwap";
import { useAvalancheSwap, AVAX_TOKENS } from "@/hooks/useAvalancheSwap";
import { getTokensForChain, Token as ChainToken } from "@/config/tokens";
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

// Convert chain tokens to Token format for the modal
const chainTokensToModalTokens = (chainTokens: ChainToken[]): Token[] => {
  return chainTokens.map(t => ({
    symbol: t.symbol,
    name: t.name,
    icon: t.icon,
    balance: "0",
    address: t.address,
    price: 0,
    decimals: t.decimals,
  }));
};

const SwapCard = () => {
  const { isConnected, connect, isConnecting, chainType } = useWalletContext();
  const { currentChain } = useChain();
  
  // Use appropriate swap hook based on chain type
  const evmSwap = useSwap();
  const tronSwap = useTronSwap();
  const neoSwap = useNeoSwap();
  const bnbSwap = useBnbSwap();
  
  // Select the right swap hook
  const swap = useMemo(() => {
    if (chainType === 'tron') {
      return {
        prices: tronSwap.prices,
        balances: tronSwap.balances,
        quote: tronSwap.quote,
        isLoadingQuote: tronSwap.isLoadingQuote,
        isSwapping: tronSwap.isSwapping,
        fetchQuote: tronSwap.fetchQuote,
        executeSwap: async (
          fromToken: any,
          toToken: any,
          fromValue: string,
          amountOut: string,
          slippage: number
        ) => {
          const minAmountOut = BigInt(Math.floor(parseFloat(amountOut) * (1 - slippage / 100))).toString();
          return tronSwap.executeSwap(
            fromToken.symbol,
            toToken.symbol,
            fromValue,
            minAmountOut,
            fromToken.decimals
          );
        },
      };
    }
    if (chainType === 'neo') {
      return {
        prices: neoSwap.prices,
        balances: neoSwap.balances,
        quote: neoSwap.quote,
        isLoadingQuote: neoSwap.isLoadingQuote,
        isSwapping: neoSwap.isSwapping,
        fetchQuote: neoSwap.fetchQuote,
        executeSwap: async (
          fromToken: any,
          toToken: any,
          fromValue: string,
          amountOut: string,
          slippage: number
        ) => {
          const minAmountOut = BigInt(Math.floor(parseFloat(amountOut) * (1 - slippage / 100))).toString();
          return neoSwap.executeSwap(
            fromToken.symbol,
            toToken.symbol,
            fromValue,
            minAmountOut,
            fromToken.decimals
          );
        },
      };
    }
    // BSC / BNB Chain → PancakeSwap
    if (currentChain.id === 'bsc') {
      return bnbSwap;
    }
    // Default: EVM swap (Base, Ethereum, Arbitrum, etc.)
    return evmSwap;
  }, [chainType, currentChain.id, evmSwap, tronSwap, neoSwap, bnbSwap]);

  const { prices, balances, quote, isLoadingQuote, isSwapping, fetchQuote, executeSwap } = swap;
  
  // Get tokens for current chain
  const chainTokens = useMemo(() => {
    return getTokensForChain(currentChain.id);
  }, [currentChain.id]);

  const tokensList = useMemo(() => {
    return chainTokensToModalTokens(chainTokens);
  }, [chainTokens]);
  
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [fromToken, setFromToken] = useState<Token>(tokensList[0]);
  const [toToken, setToToken] = useState<Token>(tokensList.length > 2 ? tokensList[2] : tokensList[1] || tokensList[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(30);
  const [customTokens, setCustomTokens] = useState<Token[]>(() => getImportedTokens());

  // All available tokens (chain + imported)
  const allTokens = [...tokensList, ...customTokens];

  // Reset tokens when chain changes
  useEffect(() => {
    if (tokensList.length > 0) {
      setFromToken(tokensList[0]);
      setToToken(tokensList.length > 2 ? tokensList[2] : tokensList[1] || tokensList[0]);
      setFromValue("");
      setToValue("");
    }
  }, [currentChain.id]);

  const handleImportToken = (token: Token) => {
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

  // Update token prices and balances
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

  // Detect in-app browser
  const isInAppBrowser = typeof navigator !== 'undefined' && 
    /MetaMask|Trust|Coinbase|TokenPocket|imToken/i.test(navigator.userAgent);

  const [quoteKey, setQuoteKey] = useState(0);
  const isEstimate = !quote || !quote.amountOut || isLoadingQuote;

  // Get token config for current chain
  const getTokenConfig = useCallback((symbol: string) => {
    if (chainType === 'tron') {
      return TRON_TOKENS[symbol as keyof typeof TRON_TOKENS];
    }
    if (chainType === 'neo') {
      return NEO_SWAP_TOKENS[symbol as keyof typeof NEO_SWAP_TOKENS];
    }
    if (currentChain.id === 'bsc') {
      return BNB_TOKENS[symbol as keyof typeof BNB_TOKENS];
    }
    return BASE_TOKENS[symbol as keyof typeof BASE_TOKENS];
  }, [chainType, currentChain.id]);

  // Calculate display value
  const calculateToValue = useCallback(() => {
    if (!fromValue || parseFloat(fromValue) === 0) return "";
    
    if (quote && quote.amountOut) {
      const tokenConfig = getTokenConfig(toToken.symbol);
      const decimals = tokenConfig?.decimals ?? toToken.decimals ?? 18;
      const amountOut = parseFloat(quote.amountOut) / Math.pow(10, decimals);
      return amountOut.toFixed(6);
    }
    
    const fromPrice = prices[fromToken.symbol] || fromToken.price || 0;
    const toPrice = prices[toToken.symbol] || toToken.price || 0;
    if (!fromPrice || !toPrice) return "";
    const estimated = (parseFloat(fromValue) * fromPrice) / toPrice;
    return estimated.toFixed(6);
  }, [fromValue, fromToken.symbol, toToken.symbol, prices, fromToken.price, toToken.price, quote, getTokenConfig]);

  useEffect(() => {
    const newValue = calculateToValue();
    setToValue(newValue);
  }, [calculateToValue]);

  // Fetch quote
  useEffect(() => {
    if (!fromValue || parseFloat(fromValue) === 0) return;

    const tokenInConfig = getTokenConfig(fromToken.symbol);
    const tokenOutConfig = getTokenConfig(toToken.symbol);
    const decimalsIn = tokenInConfig?.decimals ?? fromToken.decimals ?? 18;
    const decimalsOut = tokenOutConfig?.decimals ?? toToken.decimals ?? 18;

    const debounceMs = isInAppBrowser ? 50 : 150;
    const timer = setTimeout(() => {
      fetchQuote(fromToken.symbol, toToken.symbol, fromValue, decimalsIn, decimalsOut);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [fromValue, fromToken.symbol, toToken.symbol, fetchQuote, quoteKey, isInAppBrowser, getTokenConfig]);

  // Auto-refresh quote
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  
  useEffect(() => {
    if (!fromValue || parseFloat(fromValue) === 0) {
      setRefreshCountdown(15);
      return;
    }

    setRefreshCountdown(15);

    const countdownInterval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          setQuoteKey(k => k + 1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [fromValue, fromToken.symbol, toToken.symbol]);

  const refreshQuote = useCallback(() => {
    setQuoteKey(prev => prev + 1);
    setRefreshCountdown(15);
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
    const fromTokenConfig = getTokenConfig(fromToken.symbol);
    const toTokenConfig = getTokenConfig(toToken.symbol);

    if (!fromTokenConfig || !toTokenConfig || !quote) {
      toast.error("Invalid swap parameters");
      return;
    }

    const txHash = await executeSwap(
      fromTokenConfig,
      toTokenConfig,
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

  const getMinReceived = () => {
    if (!toValue || parseFloat(toValue) === 0) return "0";
    const amount = parseFloat(toValue);
    const minAmount = amount * (1 - slippage / 100);
    return minAmount.toFixed(6);
  };

  const exchangeRate = fromToken.price && toToken.price 
    ? (fromToken.price / toToken.price).toFixed(6) 
    : prices[fromToken.symbol] && prices[toToken.symbol]
    ? (prices[fromToken.symbol] / prices[toToken.symbol]).toFixed(6)
    : "...";

  const networkFeePercent = quote?.fee ? (quote.fee / 10000).toFixed(2) : "0.30";
  const regraphFeePercent = "0.30";
  const totalFeePercent = (parseFloat(networkFeePercent) + parseFloat(regraphFeePercent)).toFixed(2);
  
  const regraphFeeUsd = fromValue && fromToken.price 
    ? (parseFloat(fromValue) * fromToken.price * 0.003).toFixed(2)
    : "0.00";
  const networkFeeUsd = fromValue && fromToken.price 
    ? (parseFloat(fromValue) * fromToken.price * parseFloat(networkFeePercent) / 100).toFixed(2)
    : "0.00";
  const totalFeeUsd = (parseFloat(regraphFeeUsd) + parseFloat(networkFeeUsd)).toFixed(2);

  // Get DEX name for current chain
  const dexName = currentChain.dex.name;

  return (
    <>
      <div className="glass-card p-6 w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Swap</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
              {currentChain.shortName}
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
            value={toValue}
            onChange={setToValue}
            onTokenClick={() => handleOpenTokenSelect("to")}
            readOnly
            isEstimate={isEstimate && !!toValue}
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
              <ArrowDownUp className="w-3 h-3" />
            </button>
          </div>
          
          {/* Fee breakdown */}
          <div className="mt-2 pt-2 border-t border-border/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>ReGraph fee</span>
              <span className="text-primary">${regraphFeeUsd} ({regraphFeePercent}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{dexName} fee</span>
              <span>${networkFeeUsd} ({networkFeePercent}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Total fees</span>
              <span>${totalFeeUsd} ({totalFeePercent}%)</span>
            </div>
          </div>

          {quote?.route && (
            <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-2 pt-2 border-t border-border/20">
              <span>Route: {quote.route}</span>
              <div className="flex items-center gap-2">
                <span>Slippage: {slippage}%</span>
                {fromValue && parseFloat(fromValue) > 0 && (
                  <span className="text-primary/70 tabular-nums min-w-[3rem] text-right">↻ {refreshCountdown}s</span>
                )}
              </div>
            </div>
          )}
          {!quote?.route && fromValue && parseFloat(fromValue) > 0 && (
            <div className="flex items-center justify-end text-xs text-muted-foreground/70 mt-2 pt-2 border-t border-border/20">
              <span className="text-primary/70 tabular-nums min-w-[3rem] text-right">↻ {refreshCountdown}s</span>
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
            {isConnecting ? 'Connecting...' : `Connect ${chainType === 'tron' ? 'TronLink' : chainType === 'neo' ? 'NeoLine' : 'Wallet'} to Swap`}
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
          {' '}via {dexName}
        </p>
      </div>

      {/* Token Select Modal */}
      <TokenSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectToken}
        selectedToken={selectingFor === "from" ? fromToken : toToken}
        customTokens={customTokens}
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
        fee={totalFeeUsd}
        regraphFee={regraphFeeUsd}
        exchangeRate={exchangeRate}
        minReceived={getMinReceived()}
      />
    </>
  );
};

export default SwapCard;
