import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    
    console.log(`Testing login for: ${email}`);

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create regular client for testing login
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // 1. Check if user exists in auth.users via admin
    let page = 1;
    let authUser = null;
    while (true) {
      const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      const match = usersData.users.find((u: any) => u.email === email);
      if (match) {
        authUser = match;
        break;
      }
      if (usersData.users.length < 1000) break;
      page++;
    }

    // 2. Try to sign in with the provided credentials
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    // 3. Check auth_users table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single();

    const result = {
      email,
      test_password: password,
      auth_user_exists: !!authUser,
      auth_user_id: authUser?.id || null,
      auth_user_confirmed: authUser?.email_confirmed_at ? true : false,
      signin_success: !!signInData.user,
      signin_error: signInError?.message || null,
      profile_exists: !!profileData,
      profile_data: profileData || null,
      profile_error: profileError?.message || null,
    };

    console.log('Debug result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});