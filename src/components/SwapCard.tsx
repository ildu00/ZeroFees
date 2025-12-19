import { useState } from "react";
import { ArrowDownUp, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import TokenInput from "./TokenInput";
import TokenSelectModal, { Token, allTokens } from "./TokenSelectModal";

const SwapCard = () => {
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [fromToken, setFromToken] = useState<Token>(allTokens[0]); // ETH
  const [toToken, setToToken] = useState<Token>(allTokens[1]); // USDC
  const [modalOpen, setModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"from" | "to">("from");

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
    if (selectingFor === "from") {
      // If selecting same token as "to", swap them
      if (token.symbol === toToken.symbol) {
        setToToken(fromToken);
      }
      setFromToken(token);
    } else {
      // If selecting same token as "from", swap them
      if (token.symbol === fromToken.symbol) {
        setFromToken(toToken);
      }
      setToToken(token);
    }
  };

  // Calculate exchange rate
  const exchangeRate = fromToken.price && toToken.price 
    ? (fromToken.price / toToken.price).toFixed(6) 
    : "0";

  return (
    <>
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
        <TokenInput
          label="You Receive"
          token={toToken}
          value={toValue}
          onChange={setToValue}
          onTokenClick={() => handleOpenTokenSelect("to")}
          readOnly
        />

        {/* Swap Info */}
        <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span>1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}</span>
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

      {/* Token Select Modal */}
      <TokenSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectToken}
        selectedToken={selectingFor === "from" ? fromToken : toToken}
      />
    </>
  );
};

export default SwapCard;
