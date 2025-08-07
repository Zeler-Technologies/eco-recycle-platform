import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This Edge Function updates a driver's status and logs the change in the history table
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { driverId, newStatus, reason } = await req.json()
    
    // Validate required parameters
    if (!driverId) {
      return new Response(
        JSON.stringify({ error: 'Driver ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!newStatus) {
      return new Response(
        JSON.stringify({ error: 'New status is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate status value
    const validStatuses = ['available', 'busy', 'offline', 'break']
    if (!validStatuses.includes(newStatus)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid status: ${newStatus}. Valid statuses are: ${validStatuses.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' }
        }
      }
    )
    
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get current user's role and tenant info
    const { data: authUser, error: authUserError } = await supabaseClient
      .from('auth_users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()
    
    if (authUserError) {
      return new Response(
        JSON.stringify({ error: 'User authorization info not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get driver details including tenant and auth_user_id
    const { data: driver, error: driverError } = await supabaseClient
      .from('drivers')
      .select('id, driver_status, tenant_id, auth_user_id')
      .eq('id', driverId)
      .single()
    
    if (driverError || !driver) {
      return new Response(
        JSON.stringify({ error: `Driver with ID ${driverId} does not exist` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Authorization check: Verify user can update this driver's status
    const canUpdate = 
      // Super admin can update any driver
      authUser.role === 'super_admin' ||
      // Driver can update their own status
      (authUser.role === 'driver' && driver.auth_user_id === user.id) ||
      // Tenant admin can update drivers in their tenant
      (authUser.role === 'tenant_admin' && authUser.tenant_id === driver.tenant_id)
    
    if (!canUpdate) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions to update this driver status',
          userRole: authUser.role,
          userTenant: authUser.tenant_id,
          driverTenant: driver.tenant_id
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Only update if status is changing
    if (driver.driver_status === newStatus) {
      return new Response(
        JSON.stringify({ 
          message: 'No change needed - driver already has this status',
          driver
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Update driver status
    const { error: updateError } = await supabaseClient
      .from('drivers')
      .update({ 
        driver_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Failed to update driver status: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Log the status change in history
    const { data: historyEntry, error: historyError } = await supabaseClient
      .from('driver_status_history')
      .insert({
        driver_id: driverId,
        old_status: driver.driver_status,
        new_status: newStatus,
        reason: reason || 'Status changed via API'
      })
      .select()
      .single()
    
    if (historyError) {
      console.log('Failed to log status history:', historyError)
      return new Response(
        JSON.stringify({ 
          warning: `Driver status updated but failed to log history: ${historyError.message}`,
          driverId,
          oldStatus: driver.driver_status,
          newStatus
        }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Driver status updated successfully',
        driverId,
        oldStatus: driver.driver_status,
        newStatus,
        historyId: historyEntry?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})