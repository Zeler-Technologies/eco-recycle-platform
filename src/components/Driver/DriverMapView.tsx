import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Pickup {
  pickup_id: string;
  car_registration_number: string;
  car_brand: string;
  car_model: string;
  car_year: string;
  owner_name: string;
  phone_number: string;
  pickup_address: string;
  status: string;
  final_price?: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
}

interface DriverMapViewProps {
  pickups: Pickup[];
  onPickupSelect: (pickup: Pickup) => void;
}

const DriverMapView: React.FC<DriverMapViewProps> = ({ pickups, onPickupSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getStatusColor = (status: string): string => {
    const colors = {
      'pending': '#f59e0b',
      'scheduled': '#3b82f6',
      'assigned': '#8b5cf6',
      'pickup_accepted': '#10b981',
      'in_progress': '#f59e0b',
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'rejected': '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const createMarkerIcon = (status: string): google.maps.Symbol => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: getStatusColor(status),
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  };

  const createInfoWindowContent = (pickup: Pickup): string => {
    return `
      <div class="p-4 min-w-[280px] max-w-[320px]">
        <div class="mb-3">
          <div class="text-lg font-bold text-indigo-600 mb-1">${pickup.car_registration_number}</div>
          <div class="text-sm text-gray-600">${pickup.car_year} ${pickup.car_brand} ${pickup.car_model}</div>
        </div>
        
        <div class="space-y-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-base">👤</span>
            <span class="text-sm font-medium">${pickup.owner_name}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-base">📍</span>
            <span class="text-sm">${pickup.pickup_address}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-base">💰</span>
            <span class="text-sm font-medium">${pickup.final_price ? pickup.final_price.toLocaleString() + ' kr' : 'Pris ej satt'}</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button 
            onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickup.pickup_address)}', '_blank')"
            class="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            🗺️ Navigera
          </button>
          <button 
            onclick="window.open('tel:${pickup.phone_number}', '_self')"
            class="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            📞 Ring
          </button>
        </div>
      </div>
    `;
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
          // Default to Stockholm if location is unavailable
          setUserLocation({ lat: 59.3293, lng: 18.0686 });
        }
      );
    } else {
      setUserLocation({ lat: 59.3293, lng: 18.0686 });
    }
  }, []);

  useEffect(() => {
    if (!window.google || !mapRef.current || !userLocation) return;

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      zoom: 11,
      center: userLocation,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    googleMapRef.current = map;
    
    // Create info window
    infoWindowRef.current = new google.maps.InfoWindow();

    // Add user location marker
    new google.maps.Marker({
      position: userLocation,
      map,
      title: 'Din position',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }
    });

    setIsLoaded(true);
  }, [userLocation]);

  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    const map = googleMapRef.current;
    const markers = markersRef.current;
    const infoWindow = infoWindowRef.current;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    markers.clear();

    // Add pickup locations using addresses for geocoding if no coordinates
    const bounds = new google.maps.LatLngBounds();
    
    // Add user location to bounds if available
    if (userLocation) {
      bounds.extend(userLocation);
    }

    pickups.forEach((pickup) => {
      // If we have coordinates, use them directly
      if (pickup.pickup_latitude && pickup.pickup_longitude) {
        const position = {
          lat: pickup.pickup_latitude,
          lng: pickup.pickup_longitude
        };

        const marker = new google.maps.Marker({
          position,
          map,
          title: pickup.car_registration_number,
          icon: createMarkerIcon(pickup.status),
          animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
          if (infoWindow) {
            infoWindow.setContent(createInfoWindowContent(pickup));
            infoWindow.open(map, marker);
          }
          onPickupSelect(pickup);
        });

        markers.set(pickup.pickup_id, marker);
        bounds.extend(position);
      } else {
        // Geocode the address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: pickup.pickup_address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const position = results[0].geometry.location;
            
            const marker = new google.maps.Marker({
              position,
              map,
              title: pickup.car_registration_number,
              icon: createMarkerIcon(pickup.status),
              animation: google.maps.Animation.DROP
            });

            marker.addListener('click', () => {
              if (infoWindow) {
                infoWindow.setContent(createInfoWindowContent(pickup));
                infoWindow.open(map, marker);
              }
              onPickupSelect(pickup);
            });

            markers.set(pickup.pickup_id, marker);
            bounds.extend(position);
            
            // Fit bounds after adding marker
            map.fitBounds(bounds);
          }
        });
      }
    });

    // Fit map to show all markers if we have pickups
    if (pickups.length > 0) {
      setTimeout(() => {
        map.fitBounds(bounds);
        
        // Ensure minimum zoom level
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom()! > 15) map.setZoom(15);
          google.maps.event.removeListener(listener);
        });
      }, 500);
    }
  }, [pickups, isLoaded, onPickupSelect, userLocation]);

  const centerOnUserLocation = () => {
    if (googleMapRef.current && userLocation) {
      googleMapRef.current.setCenter(userLocation);
      googleMapRef.current.setZoom(14);
    }
  };

  return (
    <div className="h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
      
      {/* User location button */}
      <Button
        onClick={centerOnUserLocation}
        className="absolute bottom-4 right-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-lg"
        size="sm"
      >
        <span className="text-base mr-1">📍</span>
        Min position
      </Button>

      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Laddar karta...</p>
          </div>
        </div>
      )}

      {pickups.length === 0 && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-xl font-medium text-gray-600">Inga uppdrag att visa</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverMapView;