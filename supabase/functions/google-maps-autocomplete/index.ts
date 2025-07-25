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

  console.log('Function called - method:', req.method);
  
  try {
    // First, let's test if we can even parse the request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { q, ll, gl = "se", hl = "sv" } = requestBody;
    
    console.log('Extracted parameters:', { q, ll, gl, hl });
    
    if (!q || q.length < 3) {
      console.log('Query validation failed:', q);
      return new Response(
        JSON.stringify({ error: 'Query parameter "q" is required and must be at least 3 characters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for SerpAPI key
    const serpApiKey = Deno.env.get('SERPAPI_Googautocompl_KEY');
    console.log('SerpAPI key check:', !!serpApiKey);
    
    if (!serpApiKey) {
      console.error('SerpAPI key not found');
      // For now, return a test response to verify the function works
      return new Response(
        JSON.stringify({ 
          suggestions: [
            {
              place_id: "test_1",
              name: "Test Location 1",
              formatted_address: "Test Address 1, Sweden"
            },
            {
              place_id: "test_2", 
              name: "Test Location 2",
              formatted_address: "Test Address 2, Sweden"
            }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build URL parameters for SerpAPI
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
    console.log('SerpAPI URL:', url.replace(serpApiKey, '[HIDDEN]'));
    
    const response = await fetch(url);
    console.log('SerpAPI response status:', response.status);
    
    if (!response.ok) {
      console.error(`SerpAPI request failed with status ${response.status}`);
      throw new Error(`SerpAPI request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('SerpAPI response received, keys:', Object.keys(data));

    if (data.error) {
      console.error('SerpAPI error:', data.error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch autocomplete suggestions', details: data.error }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return SerpAPI response
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});