import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityLog {
  id: string;
  created_at: string;
  event_type: string;
  wallet_address: string | null;
  chain: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
}

const PAGE_SIZE = 20;

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

const parseUserAgent = (ua: string | null) => {
  if (!ua) return { browser: '—', os: '—', device: 'desktop' as const };

  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (ua.includes('Mobile') || ua.includes('Android')) device = 'mobile';
  if (ua.includes('iPad') || ua.includes('Tablet')) device = 'tablet';

  return { browser, os, device };
};

const DeviceIcon = ({ device }: { device: 'mobile' | 'tablet' | 'desktop' }) => {
  if (device === 'mobile') return <Smartphone className="w-3.5 h-3.5" />;
  if (device === 'tablet') return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
};

const AdminActivityFeed = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (p = page) => {
    setLoading(true);
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [{ data, count }, ] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to),
    ]);

    setLogs((data as ActivityLog[]) || []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const shortAddr = (addr: string | null) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : null;

  return (
    <Card className="glass-card">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{total} events</span>
          <Button variant="ghost" size="sm" onClick={() => fetchLogs(page)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 && !loading && (
          <p className="text-muted-foreground text-center py-8">No activity logged yet.</p>
        )}
        <div className="space-y-2">
          {logs.map((log) => {
            const ua = parseUserAgent(log.user_agent);
            const metadata = log.metadata || {};
            return (
              <div key={log.id} className="p-3 rounded-lg bg-secondary/30 border border-border/20 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={eventColors[log.event_type] || 'bg-muted text-muted-foreground'} variant="secondary">
                    {log.event_type.replace(/_/g, ' ')}
                  </Badge>
                  {log.chain && <Badge variant="outline" className="text-xs">{log.chain}</Badge>}
                  {shortAddr(log.wallet_address) && (
                    <span className="text-sm text-muted-foreground font-mono">{shortAddr(log.wallet_address)}</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {log.ip_address && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {log.ip_address}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <DeviceIcon device={ua.device} /> {ua.browser} · {ua.os}
                  </span>
                  <span className="hidden sm:inline">
                    {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                  </span>
                </div>
                {Object.keys(metadata).length > 0 && (
                  <div className="text-xs text-muted-foreground/70 font-mono truncate">
                    {Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminActivityFeed;
