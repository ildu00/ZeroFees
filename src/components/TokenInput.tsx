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
  return (
    <div className="glass-input p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-xs text-muted-foreground">
          Balance: <span className="text-foreground">{token.balance}</span>
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder="0.0"
          className="flex-1 bg-transparent text-2xl font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
        
        <button 
          onClick={onTokenClick}
          className="token-selector"
        >
          <span className="text-xl">{token.icon}</span>
          <span className="font-medium">{token.symbol}</span>
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
