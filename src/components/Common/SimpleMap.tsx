import { useEffect, useRef, useState } from "react";

interface SimpleMapProps {
  center: { lat: number; lng: number };
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  className?: string;
}

export default function SimpleMap({ center, onLocationSelect, className = "" }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initMap = () => {
      if (!mounted || !window.google?.maps || !mapRef.current) return;

      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          clickableIcons: false,
        });

        markerRef.current = new window.google.maps.Marker({
          position: center,
          map: mapInstanceRef.current,
        });

        const clickListener = mapInstanceRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!mounted || !e.latLng) return;
          
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          }
          
          onLocationSelect?.({ lat, lng });
        });

        if (mounted) {
          setIsLoaded(true);
          setError(false);
        }

        return () => {
          if (clickListener) {
            window.google?.maps?.event?.removeListener(clickListener);
          }
        };
      } catch (err) {
        console.error("Map initialization error:", err);
        if (mounted) {
          setError(true);
        }
      }
    };

    const checkAndInit = () => {
      if (window.google?.maps) {
        initMap();
      } else {
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();

    return () => {
      mounted = false;
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when center changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter(center);
      markerRef.current.setPosition(center);
    }
  }, [center]);

  if (error) {
    return (
      <div className={`w-full h-64 bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-destructive">Kunde inte ladda karta</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-64 rounded-lg border border-border">
        {!isLoaded && (
          <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Laddar karta...</p>
          </div>
        )}
      </div>
    </div>
  );
}