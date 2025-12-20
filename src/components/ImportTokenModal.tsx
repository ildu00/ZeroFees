import { useState } from "react";
import { X, Search, Loader2, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImportTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (token: ImportedToken) => void;
}

export interface ImportedToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
}

// ERC20 ABI selectors
const ERC20_SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
};

const BASE_RPC = "https://mainnet.base.org";

const ImportTokenModal = ({ isOpen, onClose, onImport }: ImportTokenModalProps) => {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<ImportedToken | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const decodeString = (hex: string): string => {
    if (!hex || hex === "0x") return "";
    try {
      // Remove 0x prefix
      const data = hex.slice(2);
      // Check if it's a dynamic string (has offset)
      if (data.length >= 128) {
        // Dynamic string: skip offset (32 bytes) and length (32 bytes), read string
        const lengthHex = data.slice(64, 128);
        const length = parseInt(lengthHex, 16);
        const stringHex = data.slice(128, 128 + length * 2);
        return Buffer.from(stringHex, "hex").toString("utf8").replace(/\0/g, "");
      } else {
        // Short string directly encoded
        return Buffer.from(data, "hex").toString("utf8").replace(/\0/g, "");
      }
    } catch {
      return "";
    }
  };

  const fetchTokenInfo = async () => {
    if (!isValidAddress(address)) {
      setError("Invalid contract address");
      return;
    }

    setIsLoading(true);
    setError("");
    setTokenInfo(null);

    try {
      // Fetch name
      const nameResponse = await fetch(BASE_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to: address, data: ERC20_SELECTORS.name }, "latest"],
        }),
      });
      const nameData = await nameResponse.json();

      // Fetch symbol
      const symbolResponse = await fetch(BASE_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "eth_call",
          params: [{ to: address, data: ERC20_SELECTORS.symbol }, "latest"],
        }),
      });
      const symbolData = await symbolResponse.json();

      // Fetch decimals
      const decimalsResponse = await fetch(BASE_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "eth_call",
          params: [{ to: address, data: ERC20_SELECTORS.decimals }, "latest"],
        }),
      });
      const decimalsData = await decimalsResponse.json();

      if (nameData.error || symbolData.error || decimalsData.error) {
        throw new Error("Failed to fetch token info");
      }

      const name = decodeString(nameData.result);
      const symbol = decodeString(symbolData.result);
      const decimals = parseInt(decimalsData.result, 16);

      if (!name || !symbol || isNaN(decimals)) {
        throw new Error("Invalid ERC20 contract");
      }

      setTokenInfo({
        name,
        symbol,
        address: address.toLowerCase(),
        decimals,
        icon: "🪙",
      });
    } catch (err) {
      console.error("Error fetching token:", err);
      setError("Could not find token. Make sure this is a valid ERC20 contract on Base.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (tokenInfo) {
      onImport(tokenInfo);
      toast.success(`${tokenInfo.symbol} imported successfully`);
      handleClose();
    }
  };

  const handleClose = () => {
    setAddress("");
    setTokenInfo(null);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm glass-card p-0 animate-scale-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold">Import Token</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Address Input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Token Contract Address</label>
            <div className="flex gap-2">
              <div className="flex-1 glass-input flex items-center gap-2 px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
              <Button
                onClick={fetchTokenInfo}
                disabled={isLoading || !address}
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Token Info */}
          {tokenInfo && (
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary border border-border/30 flex items-center justify-center text-xl">
                  {tokenInfo.icon}
                </div>
                <div>
                  <p className="font-semibold">{tokenInfo.symbol}</p>
                  <p className="text-sm text-muted-foreground">{tokenInfo.name}</p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decimals</span>
                  <span className="font-medium">{tokenInfo.decimals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-mono text-xs">
                    {tokenInfo.address.slice(0, 6)}...{tokenInfo.address.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-500/80">
                  ⚠️ Anyone can create a token with any name. Make sure this is the token you want to trade.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <Button
            variant="glow"
            className="w-full"
            onClick={handleImport}
            disabled={!tokenInfo}
          >
            <Plus className="w-4 h-4 mr-2" />
            Import Token
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportTokenModal;