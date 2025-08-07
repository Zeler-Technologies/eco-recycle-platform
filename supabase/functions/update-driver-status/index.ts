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
    
    // First check if driver exists
    const { data: driver, error: driverError } = await supabaseClient
      .from('drivers')
      .select('id, driver_status')
      .eq('id', driverId)
      .single()
    
    if (driverError || !driver) {
      return new Response(
        JSON.stringify({ error: `Driver with ID ${driverId} does not exist` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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