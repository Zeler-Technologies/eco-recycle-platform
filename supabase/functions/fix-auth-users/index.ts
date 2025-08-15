import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fixing auth users with correct passwords...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const testUsers = [
      {
        email: 'admin@pantabilen.se',
        password: 'SecurePass123!',
        role: 'super_admin',
        tenant_id: null
      },
      {
        email: 'admin@demoscrapyard.se',
        password: 'SecurePass123!',
        role: 'tenant_admin',
        tenant_id: 1
      },
      {
        email: 'test@customer.se',
        password: 'SecurePass123!',
        role: 'customer',
        tenant_id: 1
      },
      {
        email: 'erik@pantabilen.se',
        password: 'SecurePass123!',
        role: 'driver',
        tenant_id: 1
      },
      {
        email: 'test@debug.com',
        password: 'debug123456',
        role: 'super_admin',
        tenant_id: null
      }
    ];

    const results = [];

    for (const user of testUsers) {
      try {
        console.log(`Processing user: ${user.email}`);

        // First, try to find existing user by email via listUsers (getUsersByEmail not available)
        let existingUserId: string | null = null;
        try {
          let page = 1;
          const perPage = 1000;
          while (true) {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
            if (error) break;
            const match = data.users.find((u: any) => (u.email || '').toLowerCase() === user.email.toLowerCase());
            if (match) { existingUserId = match.id; break; }
            if (!data.users || data.users.length < perPage) break;
            page++;
          }
        } catch (_e) {}
        
        if (existingUserId) {
          console.log(`User ${user.email} already exists in auth, updating password...`);
          
          // Update the existing user's password
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUserId,
            {
              password: user.password,
              email_confirm: true
            }
          );
          
          if (updateError) {
            console.error(`Error updating password for ${user.email}:`, updateError);
            results.push({
              email: user.email,
              status: 'error',
              error: updateError.message
            });
            continue;
          }

          // Update auth_users record
          await supabaseAdmin
            .from('auth_users')
            .upsert({
              id: existingUserId,
              email: user.email,
              role: user.role,
              tenant_id: user.tenant_id
            });

          results.push({
            email: user.email,
            status: 'password_updated',
            user_id: existingUserId
          });
        } else {
          console.log(`Creating new user: ${user.email}`);
          
          // Create new user
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
              role: user.role
            }
          });

          if (authError) {
            console.error(`Error creating user ${user.email}:`, authError);
            results.push({
              email: user.email,
              status: 'error',
              error: authError.message
            });
            continue;
          }

          if (authData.user) {
            // Create auth_users record
            const { error: authUserError } = await supabaseAdmin
              .from('auth_users')
              .upsert({
                id: authData.user.id,
                email: user.email,
                role: user.role,
                tenant_id: user.tenant_id
              });

            if (authUserError) {
              console.error(`Error creating auth_users record for ${user.email}:`, authUserError);
            }

            results.push({
              email: user.email,
              status: 'created',
              user_id: authData.user.id
            });
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auth users fixed successfully',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fix-auth-users function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});