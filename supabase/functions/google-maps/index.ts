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
    // Get the Google Maps API key from environment
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body
    const { service, params } = await req.json();
    
    // Build the Google Maps API URL based on service type
    let url: string;
    const queryParams = new URLSearchParams();
    queryParams.set('key', apiKey);

    switch (service) {
      case 'autocomplete':
        url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
        queryParams.set('input', params.input);
        if (params.language) queryParams.set('language', params.language);
        if (params.components) queryParams.set('components', params.components);
        if (params.sessiontoken) queryParams.set('sessiontoken', params.sessiontoken);
        break;

      case 'geocode':
        url = 'https://maps.googleapis.com/maps/api/geocode/json';
        queryParams.set('address', params.address);
        if (params.language) queryParams.set('language', params.language);
        break;

      case 'reverse-geocode':
        url = 'https://maps.googleapis.com/maps/api/geocode/json';
        queryParams.set('latlng', `${params.lat},${params.lng}`);
        if (params.language) queryParams.set('language', params.language);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid service type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    // Make request to Google Maps API
    const fullUrl = `${url}?${queryParams.toString()}`;
    const response = await fetch(fullUrl);
    const data = await response.json();

    // Return the Google Maps API response
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in google-maps function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});