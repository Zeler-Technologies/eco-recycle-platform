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
    const { query } = await req.json();
    
    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    
    if (!serpApiKey) {
      console.error('SerpAPI key not found');
      return new Response(
        JSON.stringify({ error: 'SerpAPI key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const url = `https://serpapi.com/search.json?engine=google_autocomplete&q=${encodeURIComponent(query)}&gl=se&hl=sv&client=toolbar&no_cache=true&api_key=${serpApiKey}`;

    console.log('Fetching autocomplete suggestions for:', query);
    
    const response = await fetch(url);
    const data = await response.json();

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

    // Transform SerpAPI response to match our expected format
    const predictions = (data.suggestions || []).map((suggestion: any) => ({
      place_id: suggestion.value || '',
      description: suggestion.value || ''
    }));

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-autocomplete function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});