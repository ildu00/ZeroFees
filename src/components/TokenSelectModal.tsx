import { useState } from "react";
import { X, Search, Star, TrendingUp } from "lucide-react";

export interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  address: string;
  price?: number;
  decimals?: number;
}

const defaultTokens: Token[] = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠", balance: "0", address: "0x0000000000000000000000000000000000000000", price: 0, decimals: 18 },
  { symbol: "WETH", name: "Wrapped Ethereum", icon: "⟠", balance: "0", address: "0x4200000000000000000000000000000000000006", price: 0, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", icon: "💲", balance: "0", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", price: 1, decimals: 6 },
  { symbol: "USDbC", name: "USD Base Coin", icon: "💲", balance: "0", address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", price: 1, decimals: 6 },
  { symbol: "DAI", name: "Dai Stablecoin", icon: "◈", balance: "0", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", price: 1, decimals: 18 },
  { symbol: "cbETH", name: "Coinbase Wrapped Staked ETH", icon: "🔵", balance: "0", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", price: 0, decimals: 18 },
  { symbol: "AERO", name: "Aerodrome", icon: "✈️", balance: "0", address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", price: 0, decimals: 18 },
];

const popularTokens = ["ETH", "USDC", "DAI", "WETH"];

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  tokens?: Token[];
}

const TokenSelectModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedToken,
  tokens = defaultTokens 
}: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTokenBySymbol = (symbol: string) => tokens.find((t) => t.symbol === symbol);

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearchQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md glass-card p-0 animate-scale-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Select Token</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
              Base
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/30">
          <div className="glass-input flex items-center gap-3 px-4 py-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or symbol"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Select */}
        {!searchQuery && (
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <TrendingUp className="w-3 h-3" />
              <span>Popular on Base</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTokens.map((symbol) => {
                const token = getTokenBySymbol(symbol);
                if (!token) return null;
                return (
                  <button
                    key={symbol}
                    onClick={() => handleSelect(token)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                      selectedToken?.symbol === symbol
                        ? "bg-primary/20 border-primary/50 text-foreground"
                        : "bg-secondary/50 border-border/30 hover:bg-secondary hover:border-border/50"
                    }`}
                  >
                    <span className="text-sm">{token.icon}</span>
                    <span className="text-sm font-medium">{symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Token List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredTokens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tokens found
            </div>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => handleSelect(token)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors ${
                  selectedToken?.symbol === token.symbol ? "bg-secondary/30" : ""
                }`}
              >
                {/* Token Icon */}
                <div className="w-10 h-10 rounded-full bg-secondary/80 border border-border/30 flex items-center justify-center text-xl">
                  {token.icon}
                </div>

                {/* Token Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    {popularTokens.includes(token.symbol) && (
                      <Star className="w-3 h-3 text-primary fill-primary" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{token.name}</span>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {token.price ? `$${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            Trading on Base via ReGraph
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
export { defaultTokens as allTokens };