import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, TestTube, Loader2 } from 'lucide-react';
import { testAddressConsistency, updateAddressAndTest, type AddressTestResult } from '@/utils/addressTestUtils';
import { useToast } from '@/hooks/use-toast';

interface AddressTestComponentProps {
  tenantId: number;
}

export const AddressTestComponent: React.FC<AddressTestComponentProps> = ({ tenantId }) => {
  const [testResult, setTestResult] = useState<AddressTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testAddress, setTestAddress] = useState('Testgatan 123, 12345, Stockholm');
  const { toast } = useToast();

  const runConsistencyTest = async () => {
    setLoading(true);
    try {
      const result = await testAddressConsistency(tenantId);
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: result.isConsistent ? "✅ Test Passed" : "⚠️ Inconsistency Found",
          description: result.isConsistent 
            ? "Address data is consistent across tenant and scrapyard"
            : "Address mismatch detected between tenant and scrapyard"
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: `Errors: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runUpdateTest = async () => {
    setLoading(true);
    try {
      const result = await updateAddressAndTest(tenantId, testAddress);
      setTestResult(result);
      
      if (result.success && result.isConsistent) {
        toast({
          title: "✅ Update Test Passed",
          description: "Address updated and data is consistent across all components"
        });
      } else {
        toast({
          title: result.success ? "⚠️ Update Inconsistent" : "❌ Update Failed",
          description: result.success 
            ? "Update completed but data is inconsistent"
            : `Update failed: ${result.errors.join(', ')}`,
          variant: result.success ? "default" : "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Update Test Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Address Functionality Test
        </CardTitle>
        <CardDescription>
          Test address consistency across tenant management components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runConsistencyTest} 
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Test Current Consistency
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-address">Test Address (for update test)</Label>
            <Input
              id="test-address"
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="Gatunavn 123, 12345, Stad"
            />
            <Button 
              onClick={runUpdateTest} 
              disabled={loading || !testAddress.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Test Address Update
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="space-y-4">
            <Alert className={testResult.isConsistent ? "border-green-200" : "border-yellow-200"}>
              {testResult.isConsistent ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertTitle>
                Consistency Test: {testResult.isConsistent ? "PASSED" : "FAILED"}
              </AlertTitle>
              <AlertDescription>
                {testResult.isConsistent 
                  ? "Address data is consistent between tenant and scrapyard tables"
                  : "Address mismatch detected - single source of truth is not maintained"
                }
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tenant Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tenant Base Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    {testResult.tenantAddress || 'NULL'}
                  </div>
                </CardContent>
              </Card>

              {/* Scrapyard Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Primary Scrapyard Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    {testResult.scrapyardAddress || 'NULL'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Parts: {testResult.scrapyardParts.address || 'NULL'} | {testResult.scrapyardParts.postalCode || 'NULL'} | {testResult.scrapyardParts.city || 'NULL'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "API Success" : "API Error"}
              </Badge>
              <Badge variant={testResult.isConsistent ? "default" : "secondary"}>
                {testResult.isConsistent ? "Data Consistent" : "Data Inconsistent"}
              </Badge>
            </div>

            {/* Errors */}
            {testResult.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Errors Detected</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {testResult.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};