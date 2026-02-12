import { useCallback, useRef, useEffect } from 'react';
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

interface GeoData {
  country: string | null;
  city: string | null;
  region: string | null;
  ip: string | null;
}

const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return Object.keys(utm).length > 0 ? utm : null;
};

export const useActivityLogger = () => {
  const geoRef = useRef<GeoData | null>(null);
  const geoFetched = useRef(false);

  // Resolve geo once per session
  useEffect(() => {
    if (geoFetched.current) return;
    geoFetched.current = true;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'hkvmvhrwwvpjiypqvjyv';
    fetch(`https://${projectId}.supabase.co/functions/v1/resolve-geo`, {
      headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '' },
    })
      .then(r => r.json())
      .then(data => { geoRef.current = data; })
      .catch(() => {});
  }, []);

  const logActivity = useCallback(async (
    eventType: EventType,
    metadata: Record<string, string | number | boolean | null> = {},
    walletAddress?: string,
    chain?: string
  ) => {
    try {
      const geo = geoRef.current;
      const utm = getUtmParams();

      const enrichedMetadata: Record<string, string | number | boolean | null> = {
        ...metadata,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        referrer: document.referrer || null,
        ...(utm ? utm : {}),
        ...(geo ? { country: geo.country, city: geo.city, region: geo.region } : {}),
      };

      await supabase.from('activity_logs').insert([{
        event_type: eventType,
        wallet_address: walletAddress || null,
        chain: chain || null,
        ip_address: geo?.ip || null,
        metadata: enrichedMetadata,
        user_agent: navigator.userAgent,
      }]);
    } catch (err) {
      // Silent fail — logging should never break UX
      console.error('Activity log error:', err);
    }
  }, []);

  return { logActivity };
};
