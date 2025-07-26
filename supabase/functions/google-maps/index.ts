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
    const { service, params } = await req.json();
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let apiUrl = '';
    let queryParams = new URLSearchParams();
    queryParams.append('key', googleMapsApiKey);

    switch (service) {
      case 'autocomplete':
        apiUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
        queryParams.append('input', params.input);
        if (params.language) queryParams.append('language', params.language);
        if (params.components) queryParams.append('components', params.components);
        if (params.sessiontoken) queryParams.append('sessiontoken', params.sessiontoken);
        break;

      case 'geocode':
        apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        queryParams.append('address', params.address);
        if (params.language) queryParams.append('language', params.language);
        break;

      case 'reverse-geocode':
        apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        queryParams.append('latlng', `${params.lat},${params.lng}`);
        if (params.language) queryParams.append('language', params.language);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid service type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const response = await fetch(`${apiUrl}?${queryParams.toString()}`);
    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-maps function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});