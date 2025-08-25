export const assignDriverToPickup = async (
  pickupOrderId: string,
  newDriverId: string | null,
  supabase: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!pickupOrderId) {
      return { success: false, error: 'Saknar pickupOrderId' };
    }

    if (!newDriverId) {
      // Unassign: deactivate all active assignments for this pickup
      const { error: unassignErr } = await supabase
        .from('driver_assignments')
        .update({ 
          is_active: false, 
          completed_at: new Date().toISOString() 
        })
        .eq('pickup_order_id', pickupOrderId)
        .eq('is_active', true);

      if (unassignErr) return { success: false, error: unassignErr.message };
      return { success: true };
    }

    // Check for an existing active assignment
    const { data: existingAssignments, error: checkErr } = await supabase
      .from('driver_assignments')
      .select('*')
      .eq('pickup_order_id', pickupOrderId)
      .eq('is_active', true)
      .is('completed_at', null);

    if (checkErr) return { success: false, error: checkErr.message };

    if (existingAssignments && existingAssignments.length > 0) {
      // Update existing assignment with the new driver
      const assignmentId = existingAssignments[0].id;
      const { error: updateErr } = await supabase
        .from('driver_assignments')
        .update({ 
          driver_id: newDriverId,
          updated_at: new Date().toISOString(),
          notes: 'Reassigned via admin interface'
        })
        .eq('id', assignmentId);

      if (updateErr) return { success: false, error: updateErr.message };
    } else {
      // Create a new active assignment for this pickup
      const { error: insertErr } = await supabase
        .from('driver_assignments')
        .insert({
          pickup_order_id: pickupOrderId,
          driver_id: newDriverId,
          is_active: true,
          status: 'scheduled',
          assigned_at: new Date().toISOString(),
          assignment_type: 'pickup',
          role: 'primary'
        });

      if (insertErr) return { success: false, error: insertErr.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Driver assignment error:', e);
    return { success: false, error: e?.message || 'Okänt fel' };
  }
};
