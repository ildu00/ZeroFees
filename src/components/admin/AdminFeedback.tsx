import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

const AdminFeedback = () => {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      setItems((data as Feedback[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">User Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && !loading && (
          <p className="text-muted-foreground text-center py-8">No feedback submitted yet.</p>
        )}
        <div className="space-y-3">
          {items.map((fb) => (
            <div key={fb.id} className="p-4 rounded-lg bg-secondary/30 border border-border/20">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-foreground">{fb.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">{fb.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(fb.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-foreground/80">{fb.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFeedback;
