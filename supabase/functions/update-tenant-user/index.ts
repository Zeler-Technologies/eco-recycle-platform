import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    console.log('Update tenant user function called');
    
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, email, firstName, lastName, role, pnrNum } = await req.json();

    console.log('Updating user with params:', { userId, email, firstName, lastName, role, pnrNum });

    // Validate required fields
    if (!userId || !email || !firstName || !lastName || !role) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for duplicate PNR number if provided (excluding current user)
    if (pnrNum && pnrNum.trim()) {
      const { data: existingUser, error: pnrCheckError } = await supabaseAdmin
        .from('auth_users')
        .select('id, email')
        .eq('pnr_num', pnrNum.trim())
        .neq('id', userId)
        .single();

      if (pnrCheckError && pnrCheckError.code !== 'PGRST116') {
        console.error('Error checking PNR uniqueness:', pnrCheckError);
        return new Response(
          JSON.stringify({ error: 'Failed to validate personal number' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (existingUser) {
        console.error('PNR already exists for user:', existingUser.email);
        return new Response(
          JSON.stringify({ error: `Personal number ${pnrNum} is already in use by another user` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Update user profile data in auth_users table
    const { error: updateError } = await supabaseAdmin
      .from('auth_users')
      .update({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        pnr_num: pnrNum && pnrNum.trim() ? pnrNum.trim() : null,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('User update failed:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to update user: ${updateError.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('User updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          pnr_num: pnrNum && pnrNum.trim() ? pnrNum.trim() : null,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in update-tenant-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});