import { supabase } from '@/integrations/supabase/client';

export const createTestUsers = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-test-users');
    
    if (error) {
      console.error('Error creating test users:', error);
      return { success: false, error };
    }
    
    console.log('Test users created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error invoking create-test-users function:', error);
    return { success: false, error };
  }
};