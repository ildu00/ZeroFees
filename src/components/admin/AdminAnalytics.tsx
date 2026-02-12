import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ActivityLog {
  event_type: string;
  created_at: string;
  chain: string | null;
}

interface WalletConnection {
  wallet_address: string;
  chain: string | null;
  created_at: string;
}

interface WalletSummary {
  address: string;
  chains: string[];
  connectCount: number;
  lastSeen: string;
}

const COLORS = ['hsl(180,70%,50%)', 'hsl(260,60%,55%)', 'hsl(30,80%,55%)', 'hsl(340,70%,55%)', 'hsl(120,50%,45%)', 'hsl(200,70%,50%)'];

const AdminAnalytics = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [logsRes, walletsRes] = await Promise.all([
        supabase
          .from('activity_logs')
          .select('event_type, created_at, chain')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('activity_logs')
          .select('wallet_address, chain, created_at')
          .eq('event_type', 'wallet_connect')
          .not('wallet_address', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      setLogs((logsRes.data as ActivityLog[]) || []);

      // Aggregate wallet connections
      const walletMap = new Map<string, WalletSummary>();
      ((walletsRes.data as WalletConnection[]) || []).forEach((w) => {
        const existing = walletMap.get(w.wallet_address);
        if (existing) {
          existing.connectCount++;
          if (!existing.chains.includes(w.chain || 'unknown')) {
            existing.chains.push(w.chain || 'unknown');
          }
        } else {
          walletMap.set(w.wallet_address, {
            address: w.wallet_address,
            chains: [w.chain || 'unknown'],
            connectCount: 1,
            lastSeen: w.created_at,
          });
        }
      });
      setWallets(Array.from(walletMap.values()));
      setLoading(false);
    };
    fetchData();
  }, []);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    toast.success('Address copied');
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  // Events by type
  const eventCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.event_type] = (acc[l.event_type] || 0) + 1;
    return acc;
  }, {});
  const eventData = Object.entries(eventCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  // Chain distribution
  const chainCounts = logs.reduce<Record<string, number>>((acc, l) => {
    const c = l.chain || 'unknown';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const chainData = Object.entries(chainCounts).map(([name, value]) => ({ name, value }));

  // Daily activity (last 7 days)
  const now = Date.now();
  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  logs.forEach((l) => {
    const day = l.created_at.slice(0, 10);
    if (day in dailyMap) dailyMap[day]++;
  });
  const dailyData = Object.entries(dailyMap).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    count,
  }));

  const totalSwaps = (eventCounts['swap_complete'] || 0);
  const totalConnections = (eventCounts['wallet_connect'] || 0);

  if (loading) return <p className="text-muted-foreground">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length },
          { label: 'Completed Swaps', value: totalSwaps },
          { label: 'Wallet Connects', value: totalConnections },
          { label: 'Unique Wallets', value: wallets.length },
        ].map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily activity */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Daily Activity (7d)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" stroke="hsl(0,0%,55%)" fontSize={12} />
                <YAxis stroke="hsl(0,0%,55%)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,15%)', borderRadius: 8 }} itemStyle={{ color: 'hsl(0,0%,98%)' }} labelStyle={{ color: 'hsl(0,0%,98%)' }} />
                <Bar dataKey="count" fill="hsl(180,70%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chain distribution */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Chain Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chainData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {chainData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,15%)', borderRadius: 8 }} itemStyle={{ color: 'hsl(0,0%,98%)' }} labelStyle={{ color: 'hsl(0,0%,98%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Connected Wallets */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Connected Wallets
            <Badge variant="secondary" className="ml-2 text-xs">{wallets.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No wallet connections logged yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {wallets.map((w) => (
                <div
                  key={w.address}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground truncate">
                        {w.address.slice(0, 8)}…{w.address.slice(-6)}
                      </span>
                      <button
                        onClick={() => copyAddress(w.address)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        {copiedAddr === w.address ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {w.chains.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0">
                          {c}
                        </Badge>
                      ))}
                      <span className="text-[10px] text-muted-foreground">
                        {w.connectCount} connect{w.connectCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(w.lastSeen), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events breakdown */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Events Breakdown</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventData} layout="vertical">
              <XAxis type="number" stroke="hsl(0,0%,55%)" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(0,0%,55%)" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,15%)', borderRadius: 8 }} itemStyle={{ color: 'hsl(0,0%,98%)' }} labelStyle={{ color: 'hsl(0,0%,98%)' }} />
              <Bar dataKey="value" fill="hsl(180,70%,50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
