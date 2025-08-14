import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating test users for driver authentication...');

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const testUsers = [
      {
        email: 'erik@pantabilen.se',
        password: 'SecurePass123!',
        auth_user_id: '11111111-2222-3333-4444-555555555555'
      },
      {
        email: 'anna@pantabilen.se', 
        password: 'SecurePass123!',
        auth_user_id: '66666666-7777-8888-9999-000000000000'
      }
    ];

    const results = [];

    for (const testUser of testUsers) {
      try {
        // Create the auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            role: 'driver'
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`User ${testUser.email} already exists, updating driver link...`);
            
            // Get existing user
            const { data: existingUser } = await supabaseAdmin.auth.admin.getUsersByEmail(testUser.email);
            if (existingUser && existingUser.length > 0) {
              const userId = existingUser[0].id;
              
              // Update driver record to link to this user
              const { error: updateError } = await supabaseAdmin
                .from('drivers')
                .update({ auth_user_id: userId })
                .eq('email', testUser.email);

              if (updateError) {
                console.error(`Error updating driver for ${testUser.email}:`, updateError);
              }

              results.push({
                email: testUser.email,
                status: 'linked_existing',
                user_id: userId
              });
            }
          } else {
            console.error(`Error creating user ${testUser.email}:`, authError);
            results.push({
              email: testUser.email,
              status: 'error',
              error: authError.message
            });
          }
          continue;
        }

        if (authData.user) {
          console.log(`Created user ${testUser.email} with ID ${authData.user.id}`);

          // Update the driver record to link to this auth user
          const { error: updateError } = await supabaseAdmin
            .from('drivers')
            .update({ auth_user_id: authData.user.id })
            .eq('email', testUser.email);

          if (updateError) {
            console.error(`Error updating driver for ${testUser.email}:`, updateError);
          }

          // Create auth_users record for role management
          const { error: authUserError } = await supabaseAdmin
            .from('auth_users')
            .upsert({
              id: authData.user.id,
              email: testUser.email,
              role: 'driver',
              tenant_id: 1,
              pnr_num: testUser.email.includes('erik') ? '8501011234' : '9002021234'
            });

          if (authUserError) {
            console.error(`Error creating auth_users record for ${testUser.email}:`, authUserError);
          }

          results.push({
            email: testUser.email,
            status: 'created',
            user_id: authData.user.id
          });
        }
      } catch (error) {
        console.error(`Error processing user ${testUser.email}:`, error);
        results.push({
          email: testUser.email,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test users processed successfully',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-test-users function:', error);
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