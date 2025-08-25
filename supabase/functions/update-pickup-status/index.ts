import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { p_pickup_order_id, p_new_status, p_driver_notes, p_completion_photos } = await req.json()

    console.log('Updating pickup status:', {
      pickup_order_id: p_pickup_order_id,
      new_status: p_new_status,
      driver_notes: p_driver_notes
    })

    // Get current pickup order
    const { data: currentPickup, error: fetchError } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('id', p_pickup_order_id)
      .single()

    if (fetchError) {
      console.error('Error fetching pickup:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Pickup not found', details: fetchError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update pickup order status
    const updateData: any = {
      status: p_new_status,
      updated_at: new Date().toISOString()
    }

    // If rescheduling/rejecting, clear the driver assignment
    if (p_new_status === 'scheduled' && (p_driver_notes?.includes('Omschemalagd') || p_driver_notes?.includes('Avvisad'))) {
      updateData.assigned_driver_id = null
      updateData.driver_id = null
      updateData.driver_notes = p_driver_notes
    }

    // If completing, add completion data
    if (p_new_status === 'completed') {
      updateData.actual_pickup_date = new Date().toISOString().split('T')[0]
      updateData.completion_photos = p_completion_photos
      if (p_driver_notes) {
        updateData.driver_notes = p_driver_notes
      }
    }

    // If starting, add start timestamp
    if (p_new_status === 'in_progress') {
      if (p_driver_notes) {
        updateData.driver_notes = p_driver_notes
      }
    }

    const { data: updatedPickup, error: updateError } = await supabase
      .from('pickup_orders')
      .update(updateData)
      .eq('id', p_pickup_order_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating pickup:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update pickup', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the status change
    const { error: logError } = await supabase
      .from('pickup_status_updates')
      .insert({
        pickup_order_id: p_pickup_order_id,
        customer_request_id: currentPickup.customer_request_id,
        old_status: currentPickup.status,
        new_status: p_new_status,
        driver_id: currentPickup.driver_id,
        notes: p_driver_notes,
        photos: p_completion_photos,
        timestamp: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging status change:', logError)
      // Don't fail the request for logging errors
    }

    console.log('Successfully updated pickup status')

    return new Response(
      JSON.stringify({ 
        success: true, 
        pickup: updatedPickup,
        message: 'Pickup status updated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})