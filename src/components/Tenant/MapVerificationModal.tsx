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
    if (!isOpen || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if Google Maps is already loaded
        if (!window.google?.maps) {
          // Load Google Maps API
          const { Loader } = await import('@googlemaps/js-api-loader');
          const loader = new Loader({
            apiKey: 'AIzaSyAhKuSpLEPJ6aXaABokyk8uKlJTeLM9Sj8',
            version: 'weekly',
            libraries: ['places', 'geometry']
          });

          await loader.load();
        }
        
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
              new google.maps.Marker({
                position: location,
                map: mapInstance,
                title: address,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: 'hsl(var(--primary))',
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                }
              });

              // Add info window
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div class="p-2">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="w-3 h-3 rounded-full bg-primary"></div>
                      <strong>Verifierad adress</strong>
                    </div>
                    <p class="text-sm text-muted-foreground">${address}</p>
                  </div>
                `
              });

              infoWindow.open(mapInstance, 
                new google.maps.Marker({
                  position: location,
                  map: mapInstance,
                })
              );
            } else {
              setError('Kunde inte hitta adressen på kartan. Kontrollera att adressen är korrekt.');
            }
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Kunde inte ladda kartan. Kontrollera din internetanslutning.');
        setIsLoading(false);
      }
    };

    initializeMap();
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