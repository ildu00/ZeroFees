import { useState } from "react";
import { X, Search, Star, TrendingUp, Plus, Trash2 } from "lucide-react";
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

const defaultTokens: Token[] = [
  // Native & Wrapped ETH
  { symbol: "ETH", name: "Ethereum", icon: "⟠", balance: "0", address: "0x0000000000000000000000000000000000000000", price: 0, decimals: 18 },
  { symbol: "WETH", name: "Wrapped Ethereum", icon: "⟠", balance: "0", address: "0x4200000000000000000000000000000000000006", price: 0, decimals: 18 },
  
  // Stablecoins
  { symbol: "USDC", name: "USD Coin", icon: "💲", balance: "0", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", price: 1, decimals: 6 },
  { symbol: "USDbC", name: "USD Base Coin", icon: "💲", balance: "0", address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", price: 1, decimals: 6 },
  { symbol: "DAI", name: "Dai Stablecoin", icon: "◈", balance: "0", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", price: 1, decimals: 18 },
  { symbol: "USDT", name: "Tether USD", icon: "💵", balance: "0", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", price: 1, decimals: 6 },
  { symbol: "crvUSD", name: "Curve USD", icon: "📈", balance: "0", address: "0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93", price: 1, decimals: 18 },
  { symbol: "EURC", name: "Euro Coin", icon: "💶", balance: "0", address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", price: 1.1, decimals: 6 },
  
  // LST / LRT
  { symbol: "cbETH", name: "Coinbase Wrapped Staked ETH", icon: "🔵", balance: "0", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", price: 0, decimals: 18 },
  { symbol: "wstETH", name: "Wrapped stETH", icon: "🔷", balance: "0", address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", price: 0, decimals: 18 },
  { symbol: "rETH", name: "Rocket Pool ETH", icon: "🚀", balance: "0", address: "0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c", price: 0, decimals: 18 },
  { symbol: "ezETH", name: "Renzo Restaked ETH", icon: "🔶", balance: "0", address: "0x2416092f143378750bb29b79eD961ab195CcEea5", price: 0, decimals: 18 },
  { symbol: "weETH", name: "Wrapped eETH", icon: "🟢", balance: "0", address: "0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A", price: 0, decimals: 18 },
  
  // DeFi Tokens
  { symbol: "AERO", name: "Aerodrome", icon: "✈️", balance: "0", address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", price: 0, decimals: 18 },
  { symbol: "WELL", name: "Moonwell", icon: "🌙", balance: "0", address: "0xA88594D404727625A9437C3f886C7643872296AE", price: 0, decimals: 18 },
  { symbol: "MORPHO", name: "Morpho", icon: "🦋", balance: "0", address: "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842", price: 0, decimals: 18 },
  { symbol: "SEAM", name: "Seamless Protocol", icon: "🧵", balance: "0", address: "0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85", price: 0, decimals: 18 },
  { symbol: "EXTRA", name: "Extra Finance", icon: "➕", balance: "0", address: "0x2dAD3a13ef0C6366220f989157009e501e7938F8", price: 0, decimals: 18 },
  { symbol: "BSWAP", name: "BaseSwap", icon: "🔄", balance: "0", address: "0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9", price: 0, decimals: 18 },
  { symbol: "ALB", name: "Alien Base", icon: "👽", balance: "0", address: "0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4", price: 0, decimals: 18 },
  
  // Memecoins
  { symbol: "BRETT", name: "Brett", icon: "🐸", balance: "0", address: "0x532f27101965dd16442E59d40670FaF5eBB142E4", price: 0, decimals: 18 },
  { symbol: "DEGEN", name: "Degen", icon: "🎩", balance: "0", address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", price: 0, decimals: 18 },
  { symbol: "TOSHI", name: "Toshi", icon: "🐱", balance: "0", address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4", price: 0, decimals: 18 },
  { symbol: "HIGHER", name: "Higher", icon: "⬆️", balance: "0", address: "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe", price: 0, decimals: 18 },
  { symbol: "NORMIE", name: "Normie", icon: "😐", balance: "0", address: "0x7F12d13B34F5F4f0a9449c16Bcd42f0da47AF200", price: 0, decimals: 9 },
  { symbol: "MOCHI", name: "Mochi", icon: "🍡", balance: "0", address: "0xF6e932Ca12afa26665dC4dDE7e27be02A7c02e50", price: 0, decimals: 18 },
  { symbol: "KEYCAT", name: "Keyboard Cat", icon: "🐈", balance: "0", address: "0x9a26F5433671751C3276a065f57e5a02D2817973", price: 0, decimals: 18 },
  { symbol: "TYBG", name: "Base God", icon: "🙏", balance: "0", address: "0x0d97F261b1e88845184f678e2d1e7a98D9FD38dE", price: 0, decimals: 18 },
  { symbol: "DOGINME", name: "doginme", icon: "🐕", balance: "0", address: "0x6921B130D297cc43754afba22e5EAc0FBf8Db75b", price: 0, decimals: 18 },
  { symbol: "BENJI", name: "Benji", icon: "🐶", balance: "0", address: "0xBC45647eA894030a4E9801Ec03479739FA2485F0", price: 0, decimals: 18 },
  { symbol: "MFER", name: "mfercoin", icon: "😎", balance: "0", address: "0xE3086852A4B125803C815a158249ae468A3254Ca", price: 0, decimals: 18 },
  { symbol: "BASED", name: "Based", icon: "🔵", balance: "0", address: "0x32E0f9d26D1e33625742A52620cC76C1130efDE6", price: 0, decimals: 18 },
  { symbol: "BALD", name: "Bald", icon: "👨‍🦲", balance: "0", address: "0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8", price: 0, decimals: 18 },
  { symbol: "DINO", name: "Dino", icon: "🦖", balance: "0", address: "0x85E90a5430AF45776548ADB82eE4cD9E33B08077", price: 0, decimals: 18 },
  { symbol: "CHOMP", name: "Chomp", icon: "🦈", balance: "0", address: "0x1a0B71A88d25dB40c8f59F24eB6424dD3D5e4aF9", price: 0, decimals: 18 },
  { symbol: "SKI", name: "Ski Mask Dog", icon: "🎿", balance: "0", address: "0x768BE13e1680b5ebE0024C42c896E3dB59ec0149", price: 0, decimals: 18 },
  { symbol: "WEIRDO", name: "Weirdo", icon: "🤪", balance: "0", address: "0x76c02803c135b9aF79B9df597b83c2B37b3e74fc", price: 0, decimals: 18 },
  
  // Gaming / Social
  { symbol: "VIRTUAL", name: "Virtuals Protocol", icon: "🎮", balance: "0", address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", price: 0, decimals: 18 },
  { symbol: "FRIEND", name: "friend.tech", icon: "🤝", balance: "0", address: "0x0BD4887f7D41B35CD75DFF9FfEE2856106f86670", price: 0, decimals: 18 },
  
  // Other Popular
  { symbol: "SNX", name: "Synthetix", icon: "⚡", balance: "0", address: "0x22e6966B799c4D5B13BE962E1D117b56327FDa66", price: 0, decimals: 18 },
  { symbol: "COMP", name: "Compound", icon: "🏦", balance: "0", address: "0x9e1028F5F1D5eDE59748FFceE5532509976840E0", price: 0, decimals: 18 },
  { symbol: "YFI", name: "yearn.finance", icon: "🔵", balance: "0", address: "0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239", price: 0, decimals: 18 },
  { symbol: "AAVE", name: "Aave", icon: "👻", balance: "0", address: "0x76e87c5c0b6d2c6D5D8C9a9a0C1e9a9a9a9a9a9a", price: 0, decimals: 18 },
  { symbol: "UNI", name: "Uniswap", icon: "🦄", balance: "0", address: "0xc3De830EA07524a0761646a6a4e4be0e114a3C83", price: 0, decimals: 18 },
  { symbol: "LINK", name: "Chainlink", icon: "🔗", balance: "0", address: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196", price: 0, decimals: 18 },
  { symbol: "CRV", name: "Curve DAO", icon: "📉", balance: "0", address: "0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415", price: 0, decimals: 18 },
  { symbol: "BAL", name: "Balancer", icon: "⚖️", balance: "0", address: "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2", price: 0, decimals: 18 },
  { symbol: "LDO", name: "Lido DAO", icon: "🌊", balance: "0", address: "0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b", price: 0, decimals: 18 },
  { symbol: "PENDLE", name: "Pendle", icon: "🔮", balance: "0", address: "0xBC5B59EA1b6f8Da8258615EE38D40e999EC5D74F", price: 0, decimals: 18 },
];

const popularTokens = ["ETH", "USDC", "BRETT", "DEGEN", "AERO", "WETH", "TOSHI", "HIGHER"];

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  tokens?: Token[];
  onImportToken?: (token: Token) => void;
  onRemoveToken?: (address: string) => void;
}

const defaultAddresses = defaultTokens.map((t) => t.address.toLowerCase());

const TokenSelectModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedToken,
  tokens = defaultTokens,
  onImportToken,
  onRemoveToken
}: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
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
            Trading on Base via ReGraph
          </p>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="w-3 h-3" />
            Import Token
          </button>
        </div>
      </div>

      {/* Import Token Modal */}
      <ImportTokenModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportToken}
      />
    </div>
  );
};

export default TokenSelectModal;
export { defaultTokens as allTokens };
