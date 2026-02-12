import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "";

    if (!ip || ip === "127.0.0.1" || ip === "::1") {
      return new Response(
        JSON.stringify({ country: null, city: null, region: null, ip }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use ip-api.com (free, no key needed, 45 req/min)
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city`
    );
    const data = await res.json();

    if (data.status === "success") {
      return new Response(
        JSON.stringify({
          country: data.country,
          city: data.city,
          region: data.regionName,
          ip,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ country: null, city: null, region: null, ip }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
