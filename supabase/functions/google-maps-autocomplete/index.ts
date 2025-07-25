import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { q, ll, gl = "se", hl = "sv" } = await req.json();
    
    if (!q || q.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Query too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_Googautocompl_KEY');
    
    if (!serpApiKey) {
      console.error('No SerpAPI key found');
      // Return test data if no key
      return new Response(
        JSON.stringify({
          suggestions: [
            {
              place_id: "1",
              name: `${q} - Test Result 1`,
              formatted_address: `${q}, Test Address 1, Sweden`
            },
            {
              place_id: "2", 
              name: `${q} - Test Result 2`,
              formatted_address: `${q}, Test Address 2, Sweden`
            }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build SerpAPI request
    const params = new URLSearchParams({
      engine: 'google_maps_autocomplete',
      q: q,
      gl: gl,
      hl: hl,
      api_key: serpApiKey
    });

    if (ll) {
      params.append('ll', ll);
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`SerpAPI failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});