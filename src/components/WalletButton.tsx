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
    disconnect 
  } = useWalletContext();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    }
  };

  const viewOnExplorer = () => {
    if (address) {
      window.open(`https://etherscan.io/address/${address}`, '_blank');
    }
  };

  if (error) {
    toast.error(error);
  }

  if (isConnected && formattedAddress) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="glass" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs sm:text-sm">{formattedAddress}</span>
            <span className="text-muted-foreground hidden sm:inline">
              {balance} ETH
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-card/95 backdrop-blur-xl border-border/50"
        >
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-mono font-medium">{balance} ETH</p>
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

  return (
    <Button 
      variant="glass" 
      size="sm" 
      className="gap-1 sm:gap-2 px-2 sm:px-3"
      onClick={connect}
      disabled={isConnecting}
    >
      <Wallet className="w-4 h-4" />
      <span className="hidden sm:inline">
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </span>
    </Button>
  );
};

export default WalletButton;
