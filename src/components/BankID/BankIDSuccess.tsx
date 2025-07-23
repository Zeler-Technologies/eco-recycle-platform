import React from 'react';
import { Button } from '@/components/ui/button';

interface BankIDSuccessProps {
  onContinue: () => void;
}

const BankIDSuccess: React.FC<BankIDSuccessProps> = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-4">
      <div className="mobile-container bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm w-full">
        <h1 className="text-4xl font-bold text-black mb-8">
          KLART!
        </h1>
        
        <div className="mb-8 text-left">
          <h2 className="text-xl font-bold text-black mb-4">
            Vad händer nu?
          </h2>
          
          <p className="text-gray-700 text-base leading-relaxed mb-6">
            Du har fått ett SMS med mer info om nästa steg och tips på hur du kan 
            förbereda dig inför upphämtning eller avlämning.
          </p>
          
          <h3 className="text-xl font-bold text-black text-center">
            Tack för att du valde att panta din bil!
          </h3>
        </div>
        
        <Button
          onClick={onContinue}
          className="w-full bg-gray-900 text-white hover:bg-gray-800 py-4 rounded-2xl font-semibold text-lg"
        >
          Tillbaka till hemsidan
        </Button>
      </div>
    </div>
  );
};

export default BankIDSuccess;