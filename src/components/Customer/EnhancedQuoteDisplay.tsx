import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Car, MapPin, Calendar, Star } from 'lucide-react';
import { formatSwedishCurrency, formatSwedishDate } from '@/utils/swedishFormatting';

interface QuoteDisplay {
  baseValue: number;
  memberBonus?: number;
  transportFee: number;
  finalQuote: number;
  pickupDate: string;
  estimatedDistance: number;
  carInfo: {
    brand: string;
    model: string;
    year: number;
    registration: string;
  };
}

interface EnhancedQuoteDisplayProps {
  quote: QuoteDisplay;
  onAccept: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const EnhancedQuoteDisplay: React.FC<EnhancedQuoteDisplayProps> = ({
  quote,
  onAccept,
  onBack,
  isLoading = false
}) => {
  const savings = quote.memberBonus ? quote.memberBonus : 0;
  const totalWithoutTransport = quote.baseValue + savings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-navy-900">
            Din Offert är Klar!
          </CardTitle>
          <p className="text-muted-foreground">
            Vi har beräknat värdet på din bil baserat på märke, modell och årsmodell
          </p>
        </CardHeader>
      </Card>

      {/* Car Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Fordonsinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Registreringsnummer</p>
              <p className="font-semibold">{quote.carInfo.registration}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Årsmodell</p>
              <p className="font-semibold">{quote.carInfo.year}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Märke & Modell</p>
              <p className="font-semibold">{quote.carInfo.brand} {quote.carInfo.model}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Breakdown */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-navy-900">
            Prisuppbyggnad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-base">Grundvärde för {quote.carInfo.brand} {quote.carInfo.year}</span>
              <span className="font-semibold text-lg">{formatSwedishCurrency(quote.baseValue)}</span>
            </div>
            
            {quote.memberBonus && quote.memberBonus > 0 && (
              <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded-lg border border-green-200">
                <span className="text-green-700 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-current" />
                  SBR-medlemsbonus
                </span>
                <span className="font-semibold text-green-700">+{formatSwedishCurrency(quote.memberBonus)}</span>
              </div>
            )}

            {quote.transportFee > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-orange-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Transportavgift ({quote.estimatedDistance} km)
                </span>
                <span className="font-semibold text-orange-700">-{formatSwedishCurrency(quote.transportFee)}</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-navy-900">Totalt värde</span>
                <span className="text-2xl font-bold text-primary">{formatSwedishCurrency(quote.finalQuote)}</span>
              </div>
            </div>
          </div>

          {/* Pickup Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">Planerad hämtning</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Vi hämtar din bil den {formatSwedishDate(quote.pickupDate)} eller närmast möjliga datum
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="font-semibold text-navy-900">Ingår i priset:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Kostnadsfri hämtning
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Miljöcertifikat för återvinning
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Avregistrering från Transportstyrelsen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Säker betalning via BankID
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button 
          size="lg" 
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4"
          onClick={onAccept}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Behandlar...
            </>
          ) : (
            `Acceptera offert - ${formatSwedishCurrency(quote.finalQuote)}`
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full"
          onClick={onBack}
          disabled={isLoading}
        >
          Tillbaka för att ändra uppgifter
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Genom att acceptera offerten godkänner du våra villkor och bekräftar att uppgifterna är korrekta
        </p>
      </div>
    </div>
  );
};