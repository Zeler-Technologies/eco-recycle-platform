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
    const { new_password } = await req.json().catch(() => ({ new_password: undefined }));
    const targetPassword = new_password || "SecurePass123!";

    if (typeof targetPassword !== "string" || targetPassword.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: "Password must be a string of at least 8 characters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log(`Starting global password reset to a uniform value for all users (count paginated)`);

    let page = 1;
    const perPage = 1000;
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    const errors: Array<{ user_id: string; email?: string; error: string }> = [];

    while (true) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (listError) {
        throw new Error(`Error listing users on page ${page}: ${listError.message}`);
      }

      const users = usersData.users || [];
      if (users.length === 0) break;

      // Process each user sequentially to avoid rate limits
      for (const user of users) {
        try {
          totalProcessed++;
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: targetPassword,
          });
          if (updateError) {
            totalFailed++;
            errors.push({ user_id: user.id, email: user.email ?? undefined, error: updateError.message });
          } else {
            totalSucceeded++;
          }
        } catch (e: any) {
          totalFailed++;
          errors.push({ user_id: user.id, email: user.email ?? undefined, error: e?.message || String(e) });
        }
      }

      if (users.length < perPage) break;
      page++;
    }

    console.log(`Password reset complete. processed=${totalProcessed} success=${totalSucceeded} failed=${totalFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset completed for all users",
        processed: totalProcessed,
        succeeded: totalSucceeded,
        failed: totalFailed,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in reset-all-passwords function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
