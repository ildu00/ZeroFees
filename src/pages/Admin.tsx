import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Activity, BarChart3, Key, MessageSquare } from 'lucide-react';
import AdminActivityFeed from '@/components/admin/AdminActivityFeed';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminApiKeys from '@/components/admin/AdminApiKeys';
import AdminFeedback from '@/components/admin/AdminFeedback';

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAdmin();
  const [activeTab, setActiveTab] = useState('activity');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gradient font-bold text-lg">ZERO FEES</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card/60 border border-border/30 mb-6">
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="w-4 h-4" /> <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="apikeys" className="gap-1.5">
              <Key className="w-4 h-4" /> <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5">
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity"><AdminActivityFeed /></TabsContent>
          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
          <TabsContent value="apikeys"><AdminApiKeys /></TabsContent>
          <TabsContent value="feedback"><AdminFeedback /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
