import { useState, useMemo } from "react";
import { X, Search, Star, TrendingUp, Plus, Trash2 } from "lucide-react";
import { useChain } from "@/contexts/ChainContext";
import { getTokensForChain, Token as ChainToken } from "@/config/tokens";
import ImportTokenModal, { ImportedToken } from "./ImportTokenModal";

export interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  address: string;
  price?: number;
  decimals?: number;
}

// Popular tokens per chain
const POPULAR_TOKENS: Record<string, string[]> = {
  base: ["ETH", "USDC", "BRETT", "DEGEN", "AERO", "WETH", "VIRTUAL"],
  ethereum: ["ETH", "USDC", "USDT", "WBTC", "UNI", "LINK", "AAVE"],
  arbitrum: ["ETH", "USDC", "ARB", "GMX", "MAGIC", "USDT"],
  polygon: ["MATIC", "USDC", "USDT", "WETH", "WBTC"],
  optimism: ["ETH", "USDC", "OP", "SNX", "USDT"],
  bsc: ["BNB", "USDT", "USDC", "CAKE", "ETH", "BUSD"],
  avalanche: ["AVAX", "USDC", "USDT", "JOE", "WETH.e"],
  tron: ["TRX", "USDT", "USDC", "USDD", "BTT", "SUN"],
  neo: ["NEO", "GAS", "FLM", "fUSDT", "bNEO"],
};

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  customTokens?: Token[];
  onImportToken?: (token: Token) => void;
  onRemoveToken?: (address: string) => void;
}

const TokenSelectModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedToken,
  customTokens = [],
  onImportToken,
  onRemoveToken
}: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { currentChain } = useChain();

  // Convert chain tokens to UI Token format
  const chainTokens = useMemo(() => {
    const baseTokens = getTokensForChain(currentChain.id);
    return baseTokens.map((t: ChainToken): Token => ({
      symbol: t.symbol,
      name: t.name,
      icon: t.icon,
      balance: "0",
      address: t.address,
      price: 0,
      decimals: t.decimals,
    }));
  }, [currentChain.id]);

  // Merge chain tokens with custom tokens
  const allTokens = useMemo(() => {
    const chainAddresses = new Set(chainTokens.map(t => t.address.toLowerCase()));
    const filteredCustom = customTokens.filter(t => !chainAddresses.has(t.address.toLowerCase()));
    return [...chainTokens, ...filteredCustom];
  }, [chainTokens, customTokens]);

  const popularTokens = POPULAR_TOKENS[currentChain.id] || POPULAR_TOKENS.base;
  const defaultAddresses = chainTokens.map((t) => t.address.toLowerCase());

  if (!isOpen) return null;

  const isCustomToken = (token: Token) => !defaultAddresses.includes(token.address.toLowerCase());

  const handleImportToken = (imported: ImportedToken) => {
    const newToken: Token = {
      symbol: imported.symbol,
      name: imported.name,
      icon: imported.icon,
      balance: "0",
      address: imported.address,
      price: 0,
      decimals: imported.decimals,
    };
    onImportToken?.(newToken);
    setImportModalOpen(false);
  };

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

  // Show import only for EVM chains
  const canImport = currentChain.type === 'evm';

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 overflow-y-auto p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md glass-card p-0 animate-scale-in mx-4 my-4 max-h-[calc(100vh-6rem)] md:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Select Token</h2>
            <span 
              className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1"
            >
              <span>{currentChain.icon}</span>
              <span>{currentChain.shortName}</span>
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
              className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Select */}
        {!searchQuery && (
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <TrendingUp className="w-3 h-3" />
              <span>Popular on {currentChain.name}</span>
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
              <div
                key={token.address}
                className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors ${
                  selectedToken?.symbol === token.symbol ? "bg-secondary/30" : ""
                }`}
              >
                <button
                  onClick={() => handleSelect(token)}
                  className="flex items-center gap-3 flex-1"
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
                      {isCustomToken(token) && (
                        <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-medium">
                          Imported
                        </span>
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

                {/* Remove button for custom tokens */}
                {isCustomToken(token) && onRemoveToken && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveToken(token.address);
                    }}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Trading on {currentChain.name} via {currentChain.dex.name}
          </p>
          {canImport && (
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="w-3 h-3" />
              Import Token
            </button>
          )}
        </div>
      </div>

      {/* Import Token Modal */}
      {canImport && (
        <ImportTokenModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImportToken}
        />
      )}
    </div>
  );
};

export default TokenSelectModal;

// Export all tokens for backward compatibility
export const allTokens = getTokensForChain('base').map(t => ({
  symbol: t.symbol,
  name: t.name,
  icon: t.icon,
  balance: "0",
  address: t.address,
  price: 0,
  decimals: t.decimals,
}));
