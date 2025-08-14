import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const BillingTest = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');

  useEffect(() => {
    const testBillingAccess = async () => {
      try {
        console.log('Starting billing test...');
        
        // Test 1: Check RLS functions
        const { data: superAdminCheck, error: superAdminError } = await supabase
          .rpc('is_super_admin_safe');
        
        if (superAdminError) {
          setTestResult(`❌ Super admin check failed: ${superAdminError.message}`);
          return;
        }
        
        console.log('Super admin check:', superAdminCheck);
        
        // Test 2: Simple query to billing_configuration
        const { data: configData, error: configError } = await supabase
          .from('billing_configuration')
          .select('id, config_category, config_key')
          .limit(1);
          
        if (configError) {
          setTestResult(`❌ Billing config query failed: ${configError.message}`);
          return;
        }
        
        console.log('Billing config query result:', configData);
        
        // Test 3: RPC call
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_billing_configuration', { p_tenant_id: null });
          
        if (rpcError) {
          setTestResult(`❌ RPC call failed: ${rpcError.message}`);
          return;
        }
        
        console.log('RPC call result:', rpcData);
        
        setTestResult('✅ All billing tests passed successfully!');
        
      } catch (error) {
        console.error('Billing test error:', error);
        setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testBillingAccess();
  }, []);

  return (
    <Card className="bg-white shadow-custom-sm">
      <CardHeader>
        <CardTitle className="text-admin-primary">Billing Access Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg">{testResult}</p>
      </CardContent>
    </Card>
  );
};