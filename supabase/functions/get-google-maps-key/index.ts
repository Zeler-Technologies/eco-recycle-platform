import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers for browser calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!googleMapsApiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ apiKey: googleMapsApiKey }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to fetch Google Maps API key:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch API key" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
