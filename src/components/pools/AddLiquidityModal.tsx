import { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { toast } from "sonner";
import type { Pool } from "@/hooks/useUniswapPools";

interface AddLiquidityModalProps {
  open: boolean;
  onClose: () => void;
  pool: Pool | null;
}

const tokens = [
  { symbol: "ETH", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png", balance: "2.45" },
  { symbol: "USDC", icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png", balance: "5,234.50" },
  { symbol: "WBTC", icon: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png", balance: "0.125" },
  { symbol: "DAI", icon: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png", balance: "1,200.00" },
  { symbol: "USDT", icon: "https://cryptologos.cc/logos/tether-usdt-logo.png", balance: "890.25" },
  { symbol: "LINK", icon: "https://cryptologos.cc/logos/chainlink-link-logo.png", balance: "45.8" },
  { symbol: "UNI", icon: "https://cryptologos.cc/logos/uniswap-uni-logo.png", balance: "120.5" },
];

const AddLiquidityModal = ({ open, onClose, pool }: AddLiquidityModalProps) => {
  const { isConnected, connect } = useWalletContext();
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [token0, setToken0] = useState(pool?.token0 || tokens[0]);
  const [token1, setToken1] = useState(pool?.token1 || tokens[1]);

  if (!open) return null;

  const handleAddLiquidity = () => {
    if (!amount0 || !amount1) {
      toast.error("Please enter amounts for both tokens");
      return;
    }
    toast.success("Liquidity added successfully!", {
      description: `Added ${amount0} ${token0.symbol} and ${amount1} ${token1.symbol}`,
    });
    onClose();
    setAmount0("");
    setAmount1("");
  };

  const selectedToken0 = pool?.token0 || token0;
  const selectedToken1 = pool?.token1 || token1;
  const token0Data = tokens.find(t => t.symbol === selectedToken0.symbol) || tokens[0];
  const token1Data = tokens.find(t => t.symbol === selectedToken1.symbol) || tokens[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md glass-card p-0 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold">Add Liquidity</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Pool Info */}
          {pool && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="flex -space-x-2">
                <img
                  src={pool.token0.icon}
                  alt={pool.token0.symbol}
                  className="w-8 h-8 rounded-full border-2 border-card"
                />
                <img
                  src={pool.token1.icon}
                  alt={pool.token1.symbol}
                  className="w-8 h-8 rounded-full border-2 border-card"
                />
              </div>
              <div>
                <p className="font-medium">{pool.token0.symbol}/{pool.token1.symbol}</p>
                <p className="text-xs text-muted-foreground">0.3% fee tier • {pool.apr}% APR</p>
              </div>
            </div>
          )}

          {/* Token 0 Input */}
          <div className="glass-input p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Deposit</span>
              <span className="text-xs text-muted-foreground">
                Balance: {token0Data.balance}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-medium outline-none"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-xl">
                <img
                  src={selectedToken0.icon}
                  alt={selectedToken0.symbol}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{selectedToken0.symbol}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {["25%", "50%", "75%", "MAX"].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setAmount0(pct === "MAX" ? token0Data.balance.replace(",", "") : "")}
                  className="px-2 py-1 text-xs bg-secondary/60 hover:bg-secondary rounded-md transition-colors"
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>

          {/* Plus Icon */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border/50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Token 1 Input */}
          <div className="glass-input p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Deposit</span>
              <span className="text-xs text-muted-foreground">
                Balance: {token1Data.balance}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-medium outline-none"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-xl">
                <img
                  src={selectedToken1.icon}
                  alt={selectedToken1.symbol}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium">{selectedToken1.symbol}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {["25%", "50%", "75%", "MAX"].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setAmount1(pct === "MAX" ? token1Data.balance.replace(",", "") : "")}
                  className="px-2 py-1 text-xs bg-secondary/60 hover:bg-secondary rounded-md transition-colors"
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              By adding liquidity, you'll earn 0.3% of all trades on this pair proportional to your share of the pool.
            </p>
          </div>

          {/* Action Button */}
          {isConnected ? (
            <Button
              variant="glow"
              className="w-full"
              size="lg"
              onClick={handleAddLiquidity}
              disabled={!amount0 || !amount1}
            >
              Add Liquidity
            </Button>
          ) : (
            <Button
              variant="glow"
              className="w-full"
              size="lg"
              onClick={connect}
            >
              Connect Wallet to Add Liquidity
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddLiquidityModal;
