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
    console.log('Create tenant user function called');
    
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, firstName, lastName, role, tenantId } = await req.json();

    console.log('Creating user with params:', { email, firstName, lastName, role, tenantId });

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !tenantId) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create user in auth.users table using admin client
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Auth user created successfully:', authUser.user?.id);

    // Insert user profile data into auth_users table
    const { error: profileError } = await supabaseAdmin
      .from('auth_users')
      .insert({
        id: authUser.user!.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        tenant_id: parseInt(tenantId.toString()),
      });

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id);
      
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('User profile created successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: authUser.user!.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          tenant_id: parseInt(tenantId.toString()),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-tenant-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});