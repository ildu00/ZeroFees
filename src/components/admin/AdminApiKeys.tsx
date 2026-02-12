import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Plus, Copy, Ban, RotateCcw, Key } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ApiKeyRequest {
  id: string;
  name: string;
  email: string;
  company: string | null;
  use_case: string;
  status: string;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  email: string;
  company: string | null;
  api_key: string;
  monthly_limit: number;
  current_month_usage: number;
  usage_reset_at: string;
  is_active: boolean;
  created_at: string;
  notes: string | null;
  request_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-destructive/20 text-destructive',
};

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'zf_';
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

const AdminApiKeys = () => {
  const [requests, setRequests] = useState<ApiKeyRequest[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLimit, setNewLimit] = useState('1000');
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [reqRes, keyRes] = await Promise.all([
      supabase.from('api_key_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('api_keys').select('*').order('created_at', { ascending: false }),
    ]);
    setRequests((reqRes.data as ApiKeyRequest[]) || []);
    setKeys((keyRes.data as ApiKey[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const approveAndGenerate = async (req: ApiKeyRequest) => {
    const apiKey = generateApiKey();
    const { error } = await supabase.from('api_keys').insert([{
      name: req.name,
      email: req.email,
      company: req.company,
      api_key: apiKey,
      monthly_limit: 1000,
      request_id: req.id,
    }]);
    if (error) {
      toast.error('Failed to create key: ' + error.message);
      return;
    }
    await supabase.from('api_key_requests').update({ status: 'approved' }).eq('id', req.id);
    toast.success('API key generated and request approved');
    fetchAll();
  };

  const rejectRequest = async (id: string) => {
    await supabase.from('api_key_requests').update({ status: 'rejected' }).eq('id', id);
    fetchAll();
  };

  const createManualKey = async () => {
    if (!newName || !newEmail) { toast.error('Name and email required'); return; }
    const apiKey = generateApiKey();
    const { error } = await supabase.from('api_keys').insert([{
      name: newName,
      email: newEmail,
      company: newCompany || null,
      api_key: apiKey,
      monthly_limit: parseInt(newLimit) || 1000,
    }]);
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('API key created');
    setNewName(''); setNewEmail(''); setNewCompany(''); setNewLimit('1000');
    setCreateOpen(false);
    fetchAll();
  };

  const toggleActive = async (key: ApiKey) => {
    await supabase.from('api_keys').update({ is_active: !key.is_active }).eq('id', key.id);
    toast.success(key.is_active ? 'Key revoked' : 'Key reactivated');
    fetchAll();
  };

  const updateLimit = async (id: string) => {
    const limit = parseInt(editLimitValue);
    if (!limit || limit < 0) { toast.error('Invalid limit'); return; }
    await supabase.from('api_keys').update({ monthly_limit: limit }).eq('id', id);
    toast.success('Monthly limit updated');
    setEditingLimit(null);
    fetchAll();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied');
  };

  const maskKey = (key: string) => key.slice(0, 7) + '•'.repeat(20) + key.slice(-4);
  const usagePercent = (k: ApiKey) => k.monthly_limit > 0 ? Math.round((k.current_month_usage / k.monthly_limit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Active API Keys */}
      <Card className="glass-card">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> API Keys ({keys.length})
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="glow">
                <Plus className="w-4 h-4 mr-1" /> Create Key
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/30">
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-secondary/80 border-border/50" />
                <Input placeholder="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="bg-secondary/80 border-border/50" />
                <Input placeholder="Company (optional)" value={newCompany} onChange={e => setNewCompany(e.target.value)} className="bg-secondary/80 border-border/50" />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Monthly Request Limit</label>
                  <Input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} className="bg-secondary/80 border-border/50" />
                </div>
                <Button className="w-full" variant="glow" onClick={createManualKey}>Generate Key</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {keys.length === 0 && !loading && (
            <p className="text-muted-foreground text-center py-8">No API keys created yet.</p>
          )}
          <div className="space-y-3">
            {keys.map((k) => (
              <div key={k.id} className={`p-4 rounded-lg border space-y-3 ${k.is_active ? 'bg-secondary/30 border-border/20' : 'bg-destructive/5 border-destructive/20 opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground">{k.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">{k.email}</span>
                    {k.company && <span className="text-muted-foreground text-sm ml-2">({k.company})</span>}
                  </div>
                  <Badge variant="secondary" className={k.is_active ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}>
                    {k.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                </div>

                {/* Key display */}
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-background/50 px-3 py-1.5 rounded-lg flex-1 text-muted-foreground">
                    {maskKey(k.api_key)}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => copyKey(k.api_key)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Usage & limits */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Monthly Usage</span>
                      <span>{k.current_month_usage.toLocaleString()} / {k.monthly_limit.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${usagePercent(k) > 90 ? 'bg-destructive' : usagePercent(k) > 70 ? 'bg-yellow-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(usagePercent(k), 100)}%` }}
                      />
                    </div>
                  </div>

                  {editingLimit === k.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editLimitValue}
                        onChange={e => setEditLimitValue(e.target.value)}
                        className="w-24 h-7 text-xs bg-secondary/80 border-border/50"
                      />
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => updateLimit(k.id)}>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingLimit(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setEditingLimit(k.id); setEditLimitValue(String(k.monthly_limit)); }}>
                      Edit limit
                    </Button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(k.created_at), { addSuffix: true })}
                    {' · Resets '}{formatDistanceToNow(new Date(k.usage_reset_at), { addSuffix: true })}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(k)} className={k.is_active ? 'text-destructive hover:text-destructive/80' : 'text-green-400 hover:text-green-300'}>
                    {k.is_active ? <><Ban className="w-3.5 h-3.5 mr-1" /> Revoke</> : <><RotateCcw className="w-3.5 h-3.5 mr-1" /> Reactivate</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
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
                      <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300" onClick={() => approveAndGenerate(req)}>
                        <Check className="w-4 h-4 mr-1" /> Approve & Generate Key
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive/80" onClick={() => rejectRequest(req.id)}>
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
    </div>
  );
};

export default AdminApiKeys;
