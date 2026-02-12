import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApiKeyRequest {
  id: string;
  name: string;
  email: string;
  company: string | null;
  use_case: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-destructive/20 text-destructive',
};

const AdminApiKeys = () => {
  const [requests, setRequests] = useState<ApiKeyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('api_key_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests((data as ApiKeyRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('api_key_requests').update({ status }).eq('id', id);
    fetchRequests();
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">API Key Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 && !loading && (
          <p className="text-muted-foreground text-center py-8">No API key requests yet.</p>
        )}
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="p-4 rounded-lg bg-secondary/30 border border-border/20 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-foreground">{req.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">{req.email}</span>
                  {req.company && <span className="text-muted-foreground text-sm ml-2">({req.company})</span>}
                </div>
                <Badge className={statusColors[req.status] || ''} variant="secondary">{req.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{req.use_case}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </span>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300" onClick={() => updateStatus(req.id, 'approved')}>
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive/80" onClick={() => updateStatus(req.id, 'rejected')}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminApiKeys;
