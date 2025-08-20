import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers for browser calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  console.log('get-google-maps-key function called with method:', req.method);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    console.log('API key exists:', !!googleMapsApiKey);
    console.log('API key length:', googleMapsApiKey?.length || 0);

    if (!googleMapsApiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('Returning API key successfully');
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
