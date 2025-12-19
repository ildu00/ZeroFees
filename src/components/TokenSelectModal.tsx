import { useState } from "react";
import { X, Search, Star, Clock, TrendingUp } from "lucide-react";

export interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  address: string;
  price?: number;
}

const allTokens: Token[] = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠", balance: "2.4521", address: "0x0000...0000", price: 2345.67 },
  { symbol: "USDC", name: "USD Coin", icon: "💲", balance: "1,245.00", address: "0xa0b8...6eb4", price: 1.00 },
  { symbol: "USDT", name: "Tether", icon: "₮", balance: "500.00", address: "0xdac1...ec7a", price: 1.00 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "₿", balance: "0.0234", address: "0x2260...c599", price: 43250.00 },
  { symbol: "DAI", name: "Dai Stablecoin", icon: "◈", balance: "750.00", address: "0x6b17...f34c", price: 1.00 },
  { symbol: "LINK", name: "Chainlink", icon: "⬡", balance: "45.23", address: "0x514a...c2d5", price: 14.52 },
  { symbol: "UNI", name: "Uniswap", icon: "🦄", balance: "120.50", address: "0x1f98...6674", price: 6.78 },
  { symbol: "AAVE", name: "Aave", icon: "👻", balance: "5.00", address: "0x7fc6...f9cc", price: 92.34 },
  { symbol: "MATIC", name: "Polygon", icon: "⬣", balance: "1,500.00", address: "0x7d1a...f3e1", price: 0.85 },
  { symbol: "ARB", name: "Arbitrum", icon: "🔷", balance: "800.00", address: "0xb50a...6c5d", price: 1.12 },
  { symbol: "OP", name: "Optimism", icon: "🔴", balance: "350.00", address: "0x4200...0042", price: 2.45 },
  { symbol: "CRV", name: "Curve DAO", icon: "〰️", balance: "2,000.00", address: "0xd533...f180", price: 0.52 },
];

const popularTokens = ["ETH", "USDC", "USDT", "WBTC", "DAI"];
const recentTokens = ["ETH", "USDC", "LINK"];

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
}

const TokenSelectModal = ({ isOpen, onClose, onSelect, selectedToken }: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTokenBySymbol = (symbol: string) => allTokens.find((t) => t.symbol === symbol);

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
          <h2 className="text-lg font-semibold">Select Token</h2>
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
          <div className="p-4 border-b border-border/30 space-y-4">
            {/* Popular */}
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <TrendingUp className="w-3 h-3" />
                <span>Popular</span>
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

            {/* Recent */}
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Clock className="w-3 h-3" />
                <span>Recent</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentTokens.map((symbol) => {
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

                {/* Balance & Price */}
                <div className="text-right">
                  <div className="font-medium">{token.balance}</div>
                  <div className="text-sm text-muted-foreground">
                    ${token.price?.toLocaleString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 text-center">
          <button className="text-sm text-primary hover:underline">
            Manage Token Lists
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
export { allTokens };
