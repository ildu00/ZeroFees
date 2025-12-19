import { ExternalLink, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const mockTransactions: Transaction[] = [
  {
    id: '1',
    hash: '0x1234...5678',
    fromToken: 'ETH',
    toToken: 'USDC',
    fromAmount: '1.5',
    toAmount: '3,245.50',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '2',
    hash: '0xabcd...efgh',
    fromToken: 'USDC',
    toToken: 'WBTC',
    fromAmount: '5,000',
    toAmount: '0.052',
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '3',
    hash: '0x9876...5432',
    fromToken: 'DAI',
    toToken: 'ETH',
    fromAmount: '2,500',
    toAmount: '1.15',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: '4',
    hash: '0xfedc...ba98',
    fromToken: 'WETH',
    toToken: 'UNI',
    fromAmount: '0.8',
    toAmount: '245.5',
    status: 'failed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '5',
    hash: '0x5555...6666',
    fromToken: 'LINK',
    toToken: 'ETH',
    fromAmount: '150',
    toAmount: '0.95',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
];

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

const TransactionHistory = () => {
  const openExplorer = (hash: string) => {
    window.open(`https://etherscan.io/tx/${hash}`, '_blank');
  };

  return (
    <div className="glass-card p-6 rounded-2xl max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Transactions</h2>
        <span className="text-sm text-muted-foreground">{mockTransactions.length} transactions</span>
      </div>
      
      <div className="space-y-3">
        {mockTransactions.map((tx) => {
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
                <span className="hidden sm:inline">{tx.hash}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      
      {mockTransactions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transactions yet</p>
          <p className="text-sm">Your swap history will appear here</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
