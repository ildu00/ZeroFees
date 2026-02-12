import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        if (error) {
          console.error('useAdmin: role check error', error.message);
          return false;
        }
        return !!data;
      } catch (e) {
        console.error('useAdmin: role check exception', e);
        return false;
      }
    };

    const handleAuthChange = (user: User | null) => {
      // Defer to escape Supabase's internal auth lock
      setTimeout(async () => {
        if (!mountedRef.current) return;
        setUser(user);

        if (user) {
          const admin = await checkRole(user.id);
          if (mountedRef.current) {
            setIsAdmin(admin);
            setLoading(false);
          }
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleAuthChange(session?.user ?? null);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signIn, signOut };
};
