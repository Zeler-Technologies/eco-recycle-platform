import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log("Starting auth users fix process...");

    // Get all profiles that should have auth users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("auth_users")
      .select("id, email, role, tenant_id");

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} profiles to process`);

    const results: any[] = [];

    for (const profile of profiles || []) {
      try {
        console.log(`Processing user: ${profile.email}`);

        // Use listUsers() to find user by email (getUsersByEmail is not available)
        let page = 1;
        const perPage = 1000;
        let existingUser: any | null = null;
        while (true) {
          const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          });
          if (listError) {
            throw new Error(`Error listing users: ${listError.message}`);
          }
          const match = usersData.users.find((u: any) => (u.email || '').toLowerCase() === (profile.email || '').toLowerCase());
          if (match) {
            existingUser = match;
            break;
          }
          if (!usersData.users || usersData.users.length < perPage) break;
          page++;
        }

        if (existingUser) {
          // User exists in auth; sync IDs if different
          if (existingUser.id === profile.id) {
            console.log(`✅ User ${profile.email} already properly linked`);
            results.push({
              email: profile.email,
              status: "already_linked",
              auth_id: existingUser.id,
              profile_id: profile.id,
            });
          } else {
            console.log(`🔄 Updating profile ID for ${profile.email}`);
            const { error: updateError } = await supabaseAdmin
              .from("auth_users")
              .update({ id: existingUser.id })
              .eq("email", profile.email);
            if (updateError) {
              throw new Error(`Error updating profile: ${updateError.message}`);
            }
            results.push({
              email: profile.email,
              status: "id_updated",
              old_id: profile.id,
              new_id: existingUser.id,
            });
          }
        } else {
          // User doesn't exist in auth; create them
          console.log(`➕ Creating auth user for ${profile.email}`);
          const defaultPassword = "TempPassword123!";
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: profile.email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: {
              role: profile.role,
              tenant_id: profile.tenant_id,
            },
          });
          if (createError) {
            throw new Error(`Error creating user: ${createError.message}`);
          }
          const { error: updateError } = await supabaseAdmin
            .from("auth_users")
            .update({ id: newUser.user.id })
            .eq("email", profile.email);
          if (updateError) {
            throw new Error(`Error updating profile with new ID: ${updateError.message}`);
          }
          results.push({
            email: profile.email,
            status: "created",
            auth_id: newUser.user.id,
            default_password: defaultPassword,
          });
        }
      } catch (userError: any) {
        console.error(`Error processing user ${profile.email}:`, userError);
        results.push({
          email: profile.email,
          status: "error",
          error: userError.message,
        });
      }
    }

    console.log("Auth users fix process completed");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Auth users fix completed",
        processed: profiles?.length || 0,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in fix-auth-users function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
