import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { ErrorMessage } from '@/components/Common/ErrorMessage';
import { Smartphone, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BankIDAuthProps {
  onSuccess: (userInfo: any) => void;
  onCancel: () => void;
  purpose: 'login' | 'signing' | 'verification';
  className?: string;
}

export const BankIDAuth: React.FC<BankIDAuthProps> = ({
  onSuccess,
  onCancel,
  purpose,
  className = ''
}) => {
  const [status, setStatus] = useState<'initial' | 'starting' | 'pending' | 'success' | 'error'>('initial');
  const [error, setError] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const purposeTexts = {
    login: {
      title: 'Logga in med BankID',
      description: 'Använd ditt BankID för att logga in säkert',
      buttonText: 'Öppna BankID',
      pendingText: 'Väntar på BankID-signering...'
    },
    signing: {
      title: 'Signera med BankID',
      description: 'Signera avtalet digitalt med ditt BankID',
      buttonText: 'Signera med BankID',
      pendingText: 'Väntar på digital signatur...'
    },
    verification: {
      title: 'Verifiera identitet',
      description: 'Bekräfta din identitet med BankID',
      buttonText: 'Verifiera med BankID',
      pendingText: 'Verifierar din identitet...'
    }
  };

  const currentTexts = purposeTexts[purpose];

  const startBankIDAuth = async () => {
    try {
      setStatus('starting');
      setError(null);

      // Call Supabase Edge Function for BankID integration
      const { data, error } = await supabase.functions.invoke('bankid-auth', {
        body: { purpose, returnUrl: window.location.href }
      });

      if (error) throw error;

      setOrderRef(data.orderRef);
      setStatus('pending');

      // Start polling for completion
      pollBankIDStatus(data.orderRef);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'BankID-fel uppstod');
      setStatus('error');
    }
  };

  const pollBankIDStatus = async (orderRef: string) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        const { data, error } = await supabase.functions.invoke('bankid-status', {
          body: { orderRef }
        });

        if (error) throw error;

        if (data.status === 'complete') {
          setUserInfo(data.userInfo);
          setStatus('success');
          setTimeout(() => onSuccess(data.userInfo), 1500);
        } else if (data.status === 'failed') {
          throw new Error(data.hintCode || 'BankID-autentisering misslyckades');
        } else if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 2000);
        } else {
          throw new Error('Timeout - försök igen');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'BankID-fel');
        setStatus('error');
      }
    };

    poll();
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <LoadingSpinner size="sm" message="" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Smartphone className="h-8 w-8 text-blue-600" />;
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-center mb-3">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl">{currentTexts.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {status === 'initial' && (
            <div className="text-center space-y-4">
              <p className="text-gray-600 mb-6">{currentTexts.description}</p>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
                <Shield className="h-4 w-4" />
                <span>Säker autentisering enligt svensk lag</span>
              </div>
              
              <Button 
                onClick={startBankIDAuth}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                size="lg"
              >
                {currentTexts.buttonText}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="w-full"
              >
                Avbryt
              </Button>
            </div>
          )}

          {status === 'pending' && (
            <div className="text-center space-y-4">
              <LoadingSpinner message={currentTexts.pendingText} />
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Öppna BankID-appen på din telefon eller dator och följ instruktionerna.
                </p>
              </div>
              <Button variant="outline" onClick={() => setStatus('initial')}>
                Starta om
              </Button>
            </div>
          )}

          {status === 'success' && userInfo && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Autentisering lyckades!</h3>
                <p className="text-sm text-gray-600">Välkommen {userInfo.name}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <ErrorMessage error={error || 'Ett fel uppstod'} />
              <div className="flex space-x-2">
                <Button onClick={() => setStatus('initial')} className="flex-1">
                  Försök igen
                </Button>
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};