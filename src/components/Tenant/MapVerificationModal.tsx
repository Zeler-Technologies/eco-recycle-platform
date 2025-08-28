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
  const [loadAttempts, setLoadAttempts] = useState(0);

  useEffect(() => {
    const currentAttempt = loadAttempts + 1;
    console.log(`🚀 MAP LOAD ATTEMPT #${currentAttempt}:`, { isOpen, address, hasMapRef: !!mapRef.current });
    
    if (!isOpen) {
      console.log('🧹 Modal closed - cleaning up state');
      setMap(null);
      setIsLoading(true);
      setError(null);
      setLoadAttempts(0);
      return;
    }

    setLoadAttempts(currentAttempt);

    const waitForMapContainer = async () => {
      // Wait for modal to fully render and DOM to be ready
      let domCheckAttempts = 0;
      while (!mapRef.current && domCheckAttempts < 20) {
        console.log(`⏳ DOM CHECK #${domCheckAttempts + 1}: Waiting for map container...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        domCheckAttempts++;
      }

      if (!mapRef.current) {
        console.log('❌ CRITICAL: Map container never became available');
        setError('Kartan kunde inte initialiseras. Stäng och öppna modalen igen.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Map container found! Starting initialization...');
      return true;
    };

    const initializeMap = async () => {
      try {
        console.log(`🔄 INITIALIZING MAP (Attempt #${currentAttempt})`);
        setIsLoading(true);
        setError(null);

        // Step 1: Wait for DOM container
        const containerReady = await waitForMapContainer();
        if (!containerReady) return;

        // Step 2: Verify Google Maps API
        console.log('📡 Checking Google Maps API availability...');
        if (!window.google?.maps) {
          console.log('⚠️ Google Maps not immediately available, waiting...');
          let apiWaitAttempts = 0;
          while (!window.google?.maps && apiWaitAttempts < 15) {
            console.log(`⏳ API WAIT #${apiWaitAttempts + 1}: Checking for Google Maps...`);
            await new Promise(resolve => setTimeout(resolve, 200));
            apiWaitAttempts++;
          }
        }

        if (!window.google?.maps) {
          throw new Error('Google Maps API not available after waiting');
        }

        console.log('✅ Google Maps API confirmed available');

        // Step 3: Create map instance
        console.log('🗺️ Creating map instance...');
        const mapInstance = new google.maps.Map(mapRef.current!, {
          zoom: 15,
          center: { lat: 59.3293, lng: 18.0686 }, // Default to Stockholm
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        console.log('✅ Map instance created successfully!');
        setMap(mapInstance);

        // Step 4: Handle address geocoding
        if (address?.trim()) {
          console.log(`🔍 Geocoding address: "${address}"`);
          const geocoder = new google.maps.Geocoder();
          
          geocoder.geocode({ address }, (results, status) => {
            console.log('🎯 Geocoding completed:', { status, resultCount: results?.length || 0 });
            
            if (status === 'OK' && results?.[0]) {
              const location = results[0].geometry.location;
              console.log('📍 Address found! Setting marker...');
              
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
              console.log('✅ Marker and info window added successfully!');
            } else {
              console.log('❌ Geocoding failed:', status);
              setError('Kunde inte hitta adressen på kartan. Kontrollera att adressen är korrekt.');
            }
            setIsLoading(false);
            console.log(`🎉 MAP LOAD COMPLETE (Attempt #${currentAttempt})`);
          });
        } else {
          console.log('ℹ️ No address provided, showing default map');
          setIsLoading(false);
          console.log(`🎉 MAP LOAD COMPLETE (Attempt #${currentAttempt})`);
        }
      } catch (error) {
        console.error(`❌ MAP LOAD FAILED (Attempt #${currentAttempt}):`, error);
        setError('Kunde inte ladda kartan. Kontrollera din internetanslutning.');
        setIsLoading(false);
      }
    };

    // Start initialization after a small delay
    const timer = setTimeout(initializeMap, 100);
    return () => {
      clearTimeout(timer);
      console.log(`🧹 Cleanup for attempt #${currentAttempt}`);
    };
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
                <p className="text-sm text-muted-foreground">
                  Laddar karta... (Försök #{loadAttempts})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {address ? `Geokodning: ${address}` : 'Initialiserar karta'}
                </p>
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