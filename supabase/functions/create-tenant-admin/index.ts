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
    const { tenantId, scrapyardId, adminEmail, adminName, password } = await req.json();

    if (!tenantId || !adminEmail || !adminName || !password) {
      throw new Error("Missing required fields: tenantId, adminEmail, adminName, password");
    }

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

    console.log(`Creating tenant admin user for email: ${adminEmail}`);

    // Create the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: adminName }
    });

    if (userError) {
      console.error("Error creating user:", userError);
      throw userError;
    }

    console.log(`User created successfully with ID: ${userData.user.id}`);

    // Add user to auth_users table
    const { error: authUserError } = await supabaseAdmin
      .from("auth_users")
      .insert({
        id: userData.user.id,
        email: adminEmail,
        role: "tenant_admin",
        tenant_id: tenantId
      });

    if (authUserError) {
      console.error("Error inserting auth_users record:", authUserError);
      throw authUserError;
    }

    // Assign the tenant admin role
    const { error: roleError } = await supabaseAdmin.rpc(
      'assign_tenant_admin_role',
      {
        p_user_id: userData.user.id,
        p_tenant_id: tenantId
      }
    );

    if (roleError) {
      console.error("Error assigning tenant admin role:", roleError);
      throw roleError;
    }

    console.log(`Successfully assigned tenant admin role to user ${userData.user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created successfully",
        userId: userData.user.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in create-tenant-admin function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});