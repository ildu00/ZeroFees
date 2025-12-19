import { ChevronDown } from "lucide-react";
import type { Token } from "./TokenSelectModal";

interface TokenInputProps {
  label: string;
  token: Token;
  value: string;
  onChange?: (value: string) => void;
  onTokenClick?: () => void;
  readOnly?: boolean;
}

const TokenInput = ({ label, token, value, onChange, onTokenClick, readOnly = false }: TokenInputProps) => {
  const handleMaxClick = () => {
    if (onChange && token.balance) {
      // Parse the balance and set it, leaving a small amount for gas if it's ETH
      const balance = parseFloat(token.balance);
      if (token.symbol === 'ETH' && balance > 0.001) {
        // Leave 0.001 ETH for gas
        onChange((balance - 0.001).toFixed(6));
      } else {
        onChange(balance.toString());
      }
    }
  };

  const hasBalance = token.balance && parseFloat(token.balance) > 0;

  return (
    <div className="glass-input p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Balance: <span className="text-foreground">{token.balance || "0"}</span>
          </span>
          {!readOnly && hasBalance && (
            <button
              onClick={handleMaxClick}
              className="px-1.5 py-0.5 text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded transition-colors"
            >
              MAX
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder="0.0"
          className="flex-1 min-w-0 bg-transparent text-2xl font-medium text-foreground placeholder:text-muted-foreground/50 outline-none truncate"
        />
        
        <button 
          onClick={onTokenClick}
          className="token-selector shrink-0"
        >
          <span className="text-lg">{token.icon}</span>
          <span className="font-medium text-sm">{token.symbol}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      <div className="mt-2 text-right text-sm text-muted-foreground">
        ≈ ${token.price ? (parseFloat(value || "0") * token.price).toFixed(2) : "0.00"}
      </div>
    </div>
  );
};

export default TokenInput;