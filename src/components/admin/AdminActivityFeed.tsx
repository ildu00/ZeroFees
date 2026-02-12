import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  created_at: string;
  event_type: string;
  wallet_address: string | null;
  chain: string | null;
  metadata: Record<string, unknown>;
}

const eventColors: Record<string, string> = {
  swap_attempt: 'bg-yellow-500/20 text-yellow-400',
  swap_complete: 'bg-green-500/20 text-green-400',
  swap_error: 'bg-destructive/20 text-destructive',
  wallet_connect: 'bg-blue-500/20 text-blue-400',
  wallet_disconnect: 'bg-muted text-muted-foreground',
  page_view: 'bg-primary/20 text-primary',
  pool_view: 'bg-purple-500/20 text-purple-400',
  add_liquidity: 'bg-emerald-500/20 text-emerald-400',
  remove_liquidity: 'bg-orange-500/20 text-orange-400',
};

const AdminActivityFeed = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs((data as ActivityLog[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const shortAddr = (addr: string | null) => 
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—';

  return (
    <Card className="glass-card">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {logs.length === 0 && !loading && (
          <p className="text-muted-foreground text-center py-8">No activity logged yet.</p>
        )}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20">
              <Badge className={eventColors[log.event_type] || 'bg-muted text-muted-foreground'} variant="secondary">
                {log.event_type.replace(/_/g, ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground font-mono">{shortAddr(log.wallet_address)}</span>
              {log.chain && <Badge variant="outline" className="text-xs">{log.chain}</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminActivityFeed;
