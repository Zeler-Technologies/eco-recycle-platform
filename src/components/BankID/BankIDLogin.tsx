import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BankIDLoading from './BankIDLoading';

const BankIDLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [personalNumber, setPersonalNumber] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleBankIDLogin = () => {
    if (!personalNumber) return;
    setIsLoading(true);
  };

  const handleAuthComplete = async () => {
    // Simulate BankID authentication success
    // In a real implementation, this would involve BankID API calls
    try {
      await login('customer@example.com', 'password'); // Mock login
      navigate('/customer-app');
    } catch (error) {
      console.error('Authentication failed:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <BankIDLoading onComplete={handleAuthComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Logga in med BankID
          </h1>
          <p className="text-gray-800 text-lg">
            Dags att ge din bil ett nytt liv – och bidra till en grönare framtid.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <div className="space-y-4">
            <div>
              <Label htmlFor="personalNumber" className="text-gray-900 font-medium">
                Personnummer
              </Label>
              <Input
                id="personalNumber"
                type="text"
                placeholder="ÅÅMMDD-XXXX"
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.target.value)}
                className="mt-1 bg-white/80 border-none focus:bg-white"
                maxLength={11}
              />
            </div>

            <Button
              onClick={handleBankIDLogin}
              disabled={!personalNumber || personalNumber.length < 10}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 rounded-2xl text-lg font-semibold"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="text-xl font-bold">iD</div>
                <span>Öppna BankID</span>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white py-4 rounded-2xl font-medium"
            >
              BankID på annan enhet
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-800">
            Genom att logga in godkänner du våra{' '}
            <a href="#" className="underline font-medium">villkor</a> och{' '}
            <a href="#" className="underline font-medium">integritetspolicy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BankIDLogin;