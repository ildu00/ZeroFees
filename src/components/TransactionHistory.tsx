import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, Clock, XCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWalletContext } from '@/contexts/WalletContext';
import { useChain } from '@/contexts/ChainContext';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  hash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'text-green-400',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'text-yellow-400',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    className: 'text-red-400',
  },
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const shortenHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

const TransactionHistory = () => {
  const { address, isConnected, blockExplorerUrl, chainType } = useWalletContext();
  const { currentChain } = useChain();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!address) return;
    
    // Only fetch for EVM chains for now
    if (chainType !== 'evm') {
      setTransactions([]);
      setError('Transaction history not available for this network yet');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-wallet-transactions', {
        body: { walletAddress: address },
      });

      if (fnError) throw fnError;

      if (data?.warning?.message) {
        setTransactions([]);
        setError(data.warning.message);
        return;
      }

      if (data?.transactions) {
        const txs = data.transactions.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        setTransactions(txs);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [address, isConnected]);

  const openExplorer = (hash: string) => {
    window.open(`https://basescan.org/tx/${hash}`, '_blank');
  };

  if (!isConnected) {
    return (
      <div className="glass-card p-6 rounded-2xl max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-6">Recent Transactions</h2>
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Connect your wallet</p>
          <p className="text-sm">to view your swap history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Transactions</h2>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            Base
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {transactions.length} swaps
          </span>
          <button
            onClick={fetchTransactions}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>
      
      {isLoading && transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p>Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-destructive" />
          <p>{error}</p>
          <button
            onClick={fetchTransactions}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No swap transactions found</p>
          <p className="text-sm">Your DEX swap history on Base will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const StatusIcon = statusConfig[tx.status].icon;
            
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/80 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn('flex-shrink-0', statusConfig[tx.status].className)}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <span>{tx.fromAmount} {tx.fromToken}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span>{tx.toAmount} {tx.toToken}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={statusConfig[tx.status].className}>
                        {statusConfig[tx.status].label}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(tx.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => openExplorer(tx.hash)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <span className="hidden sm:inline">{shortenHash(tx.hash)}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;