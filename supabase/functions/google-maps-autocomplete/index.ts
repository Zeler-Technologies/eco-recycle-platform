import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { q, ll, gl = "se", hl = "sv" } = await req.json();
    
    console.log('Request received:', { q, ll, gl, hl });
    
    if (!q || q.length < 3) {
      console.log('Query too short or missing:', q);
      return new Response(
        JSON.stringify({ error: 'Query parameter "q" is required and must be at least 3 characters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_Googautocompl_KEY');
    console.log('SerpAPI key found:', !!serpApiKey);
    
    if (!serpApiKey) {
      console.error('SERPAPI_Googautocompl_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'SERPAPI_Googautocompl_KEY not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build URL parameters
    const params = new URLSearchParams({
      engine: 'google_maps_autocomplete',
      q: q,
      gl: gl,
      hl: hl,
      api_key: serpApiKey
    });

    // Add ll parameter if provided
    if (ll) {
      params.append('ll', ll);
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;

    console.log('Fetching Google Maps autocomplete suggestions for:', q);
    console.log('SerpAPI URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`SerpAPI request failed with status ${response.status}`);
      throw new Error(`SerpAPI request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('SerpAPI response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('SerpAPI error:', data.error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch autocomplete suggestions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return SerpAPI response as-is
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-maps-autocomplete function:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});