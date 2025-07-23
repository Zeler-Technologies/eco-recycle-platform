import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BankIDSuccessProps {
  onContinue: () => void;
}

const BankIDSuccess: React.FC<BankIDSuccessProps> = ({ onContinue }) => {
  useEffect(() => {
    // Auto-continue after 2 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 flex items-center justify-center p-4">
      <div className="text-center">
        <CheckCircle className="w-24 h-24 text-white mx-auto mb-6 animate-pulse" />
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Autentisering lyckades!
        </h1>
        
        <p className="text-xl text-white/90 mb-8">
          Välkommen till Bilskrot
        </p>
        
        <Button
          onClick={onContinue}
          className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-2xl font-semibold text-lg"
        >
          Fortsätt till appen
        </Button>
      </div>
    </div>
  );
};

export default BankIDSuccess;