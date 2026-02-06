import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const WalletButton = () => {
  const { 
    isConnected, 
    formattedAddress, 
    balance, 
    isConnecting, 
    error,
    address,
    connect, 
    disconnect,
    chainType,
    nativeCurrencySymbol,
    blockExplorerUrl,
  } = useWalletContext();

  const lastErrorRef = useRef<string | null>(null);

  // Show error toast only when error changes
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      toast.error(error);
      lastErrorRef.current = error;
    }
    if (!error) {
      lastErrorRef.current = null;
    }
  }, [error]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  const viewOnExplorer = () => {
    if (address && blockExplorerUrl) {
      // Different explorers have different URL patterns
      let explorerUrl = '';
      if (chainType === 'tron') {
        explorerUrl = `${blockExplorerUrl}/#/address/${address}`;
      } else if (chainType === 'neo') {
        explorerUrl = `${blockExplorerUrl}/address/${address}`;
      } else {
        explorerUrl = `${blockExplorerUrl}/address/${address}`;
      }
      window.open(explorerUrl, '_blank');
    }
  };

  if (isConnected && formattedAddress) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="glass" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-9">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs md:text-sm">{formattedAddress}</span>
            <span className="text-muted-foreground hidden lg:inline text-xs">
              {balance} {nativeCurrencySymbol}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-card/95 backdrop-blur-xl border-border/50"
        >
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-mono font-medium">{balance} {nativeCurrencySymbol}</p>
          </div>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
            <Copy className="w-4 h-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={viewOnExplorer} className="gap-2 cursor-pointer">
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem 
            onClick={disconnect} 
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Show different button text based on chain type
  const getConnectText = () => {
    if (isConnecting) return 'Connecting...';
    if (chainType === 'tron') return 'Connect TronLink';
    if (chainType === 'neo') return 'Connect Neon';
    return 'Connect Wallet';
  };

  return (
    <Button 
      variant="glass" 
      size="sm" 
      className="gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-9"
      onClick={connect}
      disabled={isConnecting}
    >
      <Wallet className="w-4 h-4" />
      <span className="hidden md:inline text-xs sm:text-sm">
        {getConnectText()}
      </span>
    </Button>
  );
};

export default WalletButton;
