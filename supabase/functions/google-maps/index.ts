import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Google Maps Function Called ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { service, params } = requestBody;
    console.log('Service requested:', service);
    console.log('Params:', JSON.stringify(params, null, 2));

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    console.log('API Key available:', !!googleMapsApiKey);
    console.log('API Key length:', googleMapsApiKey?.length || 0);

    if (!googleMapsApiKey) {
      console.error('ERROR: Google Maps API key not configured');
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
        console.log('Autocomplete URL params:', queryParams.toString());
        break;

      case 'geocode':
        apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        queryParams.append('address', params.address);
        if (params.language) queryParams.append('language', params.language);
        console.log('Geocode URL params:', queryParams.toString());
        break;

      case 'reverse-geocode':
        apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        queryParams.append('latlng', `${params.lat},${params.lng}`);
        if (params.language) queryParams.append('language', params.language);
        console.log('Reverse geocode URL params:', queryParams.toString());
        break;

      default:
        console.error('ERROR: Invalid service type:', service);
        return new Response(
          JSON.stringify({ error: 'Invalid service type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const fullUrl = `${apiUrl}?${queryParams.toString()}`;
    console.log('Making request to Google Maps API:', fullUrl.replace(googleMapsApiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(fullUrl);
    console.log('Google Maps API response status:', response.status);
    console.log('Google Maps API response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Google Maps API response data:', JSON.stringify(data, null, 2));

    // Check for API errors
    if (data.status && data.status !== 'OK') {
      console.error('Google Maps API Error Status:', data.status);
      console.error('Google Maps API Error Message:', data.error_message);
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('=== ERROR in google-maps function ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});