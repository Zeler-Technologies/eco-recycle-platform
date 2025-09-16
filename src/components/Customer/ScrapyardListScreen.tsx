import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star } from 'lucide-react';
import { useScrapyardList } from '@/hooks/useScrapyardList';
import { formatSwedishCurrency } from '@/utils/swedishFormatting';

interface Scrapyard {
  id: number;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  distance_km: number;
  bid_amount?: number;
  is_premium?: boolean;
}

interface ScrapyardListScreenProps {
  registrationNumber: string;
  onScrapyardSelect: (scrapyard: Scrapyard) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ScrapyardListScreen: React.FC<ScrapyardListScreenProps> = ({
  registrationNumber,
  onScrapyardSelect,
  onNext,
  onBack
}) => {
  const { scrapyards, loading, error, selectedScrapyard, setSelectedScrapyard } = useScrapyardList(registrationNumber);

  const handleScrapyardSelect = (scrapyard: Scrapyard) => {
    setSelectedScrapyard(scrapyard);
    onScrapyardSelect(scrapyard);
  };

  const handleNext = () => {
    if (selectedScrapyard) {
      onNext();
    }
  };

  return (
    <div className="min-h-screen bg-yellow-swedish mobile-container">
      <div className="bg-white rounded-t-[2rem] mt-6 p-6 h-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">Välj skrothandlare</h1>
          <p className="text-gray-600">Välj den skrothandlare som passar dig bäst</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full"
            >
              Gå tillbaka
            </button>
          </div>
        )}

        {/* Scrapyard List */}
        {!loading && !error && scrapyards.length > 0 && (
          <div className="space-y-4 mb-20">
            {scrapyards.map((scrapyard) => (
              <Card
                key={scrapyard.id}
                className={`cursor-pointer transition-all ${
                  selectedScrapyard?.id === scrapyard.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleScrapyardSelect(scrapyard)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-black">{scrapyard.name}</h3>
                    {scrapyard.bid_amount && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Premiumpartner
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {scrapyard.address}, {scrapyard.postal_code} {scrapyard.city}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">{scrapyard.distance_km.toFixed(1)} km bort</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600">4.5</span>
                    </div>
                  </div>

                  {scrapyard.bid_amount && (
                    <div className="mt-2 text-xs text-green-700">
                      Högsta bud: {formatSwedishCurrency(scrapyard.bid_amount)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && scrapyards.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Inga skrothandlare hittades i ditt område</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-full"
            >
              Gå tillbaka
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {!loading && !error && scrapyards.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
            <div className="flex gap-4 max-w-md mx-auto">
              <button
                onClick={onBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold"
              >
                Tillbaka
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedScrapyard}
                className={`flex-1 py-3 rounded-full font-semibold ${
                  selectedScrapyard
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Fortsätt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};