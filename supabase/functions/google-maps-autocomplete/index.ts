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
    const { q } = await req.json();
    
    // Return simple test data
    return new Response(
      JSON.stringify({
        suggestions: [
          {
            place_id: "1",
            name: "Strandvägen 1, Stockholm",
            formatted_address: "Strandvägen 1, 114 51 Stockholm, Sweden"
          },
          {
            place_id: "2", 
            name: "Strandvägen 2, Stockholm",
            formatted_address: "Strandvägen 2, 114 51 Stockholm, Sweden"
          },
          {
            place_id: "3",
            name: `${q} - Test Location`,
            formatted_address: `${q}, Sweden`
          }
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});