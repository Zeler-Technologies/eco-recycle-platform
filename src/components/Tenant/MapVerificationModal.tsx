import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, AlertCircle } from 'lucide-react';

interface MapVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export const MapVerificationModal: React.FC<MapVerificationModalProps> = ({
  isOpen,
  onClose,
  address
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMap(null);
      setIsLoading(true);
      setError(null);
      return;
    }

    if (!mapRef.current) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait a bit for the modal to fully open
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use the already loaded Google Maps API
        if (window.google?.maps) {
          // Initialize the map
          const mapInstance = new google.maps.Map(mapRef.current!, {
            zoom: 15,
            center: { lat: 59.3293, lng: 18.0686 }, // Default to Stockholm
            mapTypeId: google.maps.MapTypeId.ROADMAP,
          });

          setMap(mapInstance);

          // Geocode the address
          if (address.trim()) {
            const geocoder = new google.maps.Geocoder();
            
            geocoder.geocode({ address }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const location = results[0].geometry.location;
                
                // Center map on the location
                mapInstance.setCenter(location);
                
                // Add a marker
                const marker = new google.maps.Marker({
                  position: location,
                  map: mapInstance,
                  title: address,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2,
                  }
                });

                // Add info window
                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 8px;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #3b82f6;"></div>
                        <strong>Verifierad adress</strong>
                      </div>
                      <p style="font-size: 14px; color: #666; margin: 0;">${address}</p>
                    </div>
                  `
                });

                infoWindow.open(mapInstance, marker);
                setIsLoading(false);
              } else {
                setError('Kunde inte hitta adressen på kartan. Kontrollera att adressen är korrekt.');
                setIsLoading(false);
              }
            });
          } else {
            setIsLoading(false);
          }
        } else {
          setError('Google Maps API är inte laddat ännu. Vänta ett ögonblick och försök igen.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Kunde inte ladda kartan. Kontrollera din internetanslutning.');
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure the modal is fully rendered
    const timer = setTimeout(initializeMap, 200);
    return () => clearTimeout(timer);
  }, [isOpen, address]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Verifiera adress på karta
          </DialogTitle>
          <DialogDescription>
            Kontrollera att adressen visas korrekt på kartan
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Laddar karta...</p>
              </div>
            </div>
          )}

          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div 
            ref={mapRef} 
            className="w-full h-full min-h-[400px] rounded-lg border"
            style={{ height: '500px' }}
          />
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">Adress:</span>
            <span className="text-muted-foreground">{address || 'Ingen adress angiven'}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};