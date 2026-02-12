import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventType = 
  | 'swap_attempt' 
  | 'swap_complete' 
  | 'swap_error'
  | 'wallet_connect' 
  | 'wallet_disconnect' 
  | 'page_view' 
  | 'pool_view'
  | 'position_view'
  | 'add_liquidity'
  | 'remove_liquidity';

export const useActivityLogger = () => {
  const logActivity = useCallback(async (
    eventType: EventType,
    metadata: Record<string, string | number | boolean | null> = {},
    walletAddress?: string,
    chain?: string
  ) => {
    try {
      await supabase.from('activity_logs').insert([{
        event_type: eventType,
        wallet_address: walletAddress || null,
        chain: chain || null,
        metadata,
        user_agent: navigator.userAgent,
      }]);
    } catch (err) {
      // Silent fail — logging should never break UX
      console.error('Activity log error:', err);
    }
  }, []);

  return { logActivity };
};
