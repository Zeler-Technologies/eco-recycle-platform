import { useEffect, useRef, useState } from "react";

interface SimpleMapProps {
  center: { lat: number; lng: number };
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  pickups?: any[];
  onPickupSelect?: (pickup: any) => void;
  className?: string;
}

export default function SimpleMap({ 
  center, 
  onLocationSelect, 
  pickups = [], 
  onPickupSelect, 
  className = "" 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Add a small delay to avoid conflicts with browser extensions during page load
    const initTimer = setTimeout(() => {
      if (!mounted) return;
      
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
              try {
                window.google?.maps?.event?.removeListener(clickListener);
              } catch (e) {
                console.warn('Error removing click listener:', e);
              }
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
    }, 100); // Small delay to avoid extension conflicts

    return () => {
      mounted = false;
      clearTimeout(initTimer);
      try {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        // Clear pickup markers safely
        pickupMarkersRef.current.forEach(marker => {
          try {
            marker.setMap(null);
          } catch (e) {
            console.warn('Error removing marker:', e);
          }
        });
        pickupMarkersRef.current = [];
      } catch (e) {
        console.warn('Error during map cleanup:', e);
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update pickup markers when pickups change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing pickup markers safely
    pickupMarkersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        console.warn('Error removing existing marker:', e);
      }
    });
    pickupMarkersRef.current = [];

    // Add markers for each pickup
    pickups.forEach((pickup) => {
      if (!pickup.pickup_latitude || !pickup.pickup_longitude) return;

      try {
        const marker = new window.google.maps.Marker({
          position: { lat: pickup.pickup_latitude, lng: pickup.pickup_longitude },
          map: mapInstanceRef.current,
          title: pickup.car_registration_number || 'Pickup',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getPickupStatusColor(pickup.status),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }
        });

        // Add click listener for pickup selection
        marker.addListener('click', () => {
          onPickupSelect?.(pickup);
        });

        pickupMarkersRef.current.push(marker);
      } catch (e) {
        console.warn('Error creating marker for pickup:', pickup.car_registration_number, e);
      }
    });

    // Fit map bounds to show all pickups
    if (pickups.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      pickups.forEach((pickup) => {
        if (pickup.pickup_latitude && pickup.pickup_longitude) {
          bounds.extend({ lat: pickup.pickup_latitude, lng: pickup.pickup_longitude });
        }
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [pickups, isLoaded, onPickupSelect]);

  const getPickupStatusColor = (status: string): string => {
    const colors = {
      'scheduled': '#3b82f6', // blue
      'in_progress': '#eab308', // yellow  
      'completed': '#22c55e', // green
      'cancelled': '#ef4444', // red
      default: '#6b7280' // gray
    };
    return colors[status as keyof typeof colors] || colors.default;
  };

  // Update marker position when center changes
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter(center);
      markerRef.current.setPosition(center);
    }
  }, [center]);

  if (error) {
    return (
      <div className={`w-full h-96 bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-destructive">Kunde inte ladda karta</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-96 rounded-lg border border-border">
        {!isLoaded && (
          <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Laddar karta...</p>
          </div>
        )}
      </div>
    </div>
  );
}