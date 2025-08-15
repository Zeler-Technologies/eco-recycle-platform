import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const QuickAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { session, isAuth } = useSupabaseSession();

  // Don't show if already authenticated
  if (isAuth) {
    return null;
  }

  const loginAsAdmin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@pantabilen.se',
        password: 'SecurePass123!'
      });

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Logged in to Supabase successfully!'
        });
        // Refresh the page to update auth state
        window.location.reload();
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to login to Supabase',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white shadow-custom-sm">
      <CardHeader>
        <CardTitle className="text-admin-primary">Supabase Authentication Required</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">
          To access billing functionality, you need to authenticate with Supabase:
        </p>
        <Button 
          onClick={loginAsAdmin}
          disabled={isLoading}
          className="bg-admin-primary hover:bg-admin-primary/90"
        >
          {isLoading ? 'Logging in...' : 'Login to Supabase as Admin'}
        </Button>
      </CardContent>
    </Card>
  );
};