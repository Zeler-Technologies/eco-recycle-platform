import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, FileText, Eye } from 'lucide-react';

interface GDPRConsentProps {
  onAccept: (consents: ConsentData) => void;
  onDecline: () => void;
  companyName: string;
}

interface ConsentData {
  personalData: boolean;
  marketing: boolean;
  analytics: boolean;
  thirdParty: boolean;
}

export const GDPRConsent: React.FC<GDPRConsentProps> = ({
  onAccept,
  onDecline,
  companyName
}) => {
  const [consents, setConsents] = useState<ConsentData>({
    personalData: false,
    marketing: false,
    analytics: false,
    thirdParty: false
  });

  const updateConsent = (key: keyof ConsentData, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = consents.personalData; // Only personal data consent is required

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-3">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Samtycke för personuppgifter</CardTitle>
        <p className="text-sm text-gray-600">
          Enligt GDPR behöver vi ditt samtycke för att behandla dina personuppgifter
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Required Consent */}
        <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="personal-data"
              checked={consents.personalData}
              onCheckedChange={(checked) => updateConsent('personalData', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="personal-data" className="font-medium text-sm cursor-pointer">
                Behandling av personuppgifter <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Jag samtycker till att {companyName} behandlar mina personuppgifter (namn, telefon, e-post, personnummer) 
                för att genomföra bilhämtning enligt vårt avtal. Uppgifterna lagras i 7 år enligt bokföringslagen.
              </p>
            </div>
          </div>
        </div>

        {/* Optional Consents */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="marketing"
              checked={consents.marketing}
              onCheckedChange={(checked) => updateConsent('marketing', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="marketing" className="font-medium text-sm cursor-pointer">
                Marknadsföring (valfritt)
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Jag vill få information om nya tjänster och erbjudanden via e-post och SMS. 
                Du kan avregistrera dig när som helst.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="analytics"
              checked={consents.analytics}
              onCheckedChange={(checked) => updateConsent('analytics', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="analytics" className="font-medium text-sm cursor-pointer">
                Användningsanalys (valfritt)
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Hjälp oss förbättra tjänsten genom anonym analys av hur webbplatsen används.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="third-party"
              checked={consents.thirdParty}
              onCheckedChange={(checked) => updateConsent('thirdParty', checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="third-party" className="font-medium text-sm cursor-pointer">
                Tredjepartstjänster (valfritt)
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Tillåt integration med Google Maps, SMS-leverantörer och betalningslösningar 
                för förbättrad funktionalitet.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t pt-4">
          <div className="flex justify-center space-x-6 text-sm">
            <button className="flex items-center text-blue-600 hover:underline">
              <FileText className="h-4 w-4 mr-1" />
              Integritetspolicy
            </button>
            <button className="flex items-center text-blue-600 hover:underline">
              <Eye className="h-4 w-4 mr-1" />
              Användarvillkor
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onDecline}
            className="flex-1"
          >
            Avböj
          </Button>
          <Button
            onClick={() => onAccept(consents)}
            disabled={!canProceed}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Acceptera
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Du kan när som helst ändra dina samtycken genom att kontakta oss på privacy@{companyName.toLowerCase().replace(/\s+/g, '')}.se
        </p>
      </CardContent>
    </Card>
  );
};