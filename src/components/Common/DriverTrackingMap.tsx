import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Car } from 'lucide-react';

interface Driver {
  id: string;
  full_name: string;
  driver_status: string;
  current_latitude?: number;
  current_longitude?: number;
  vehicle_type?: string;
  phone_number: string;
}

interface DriverTrackingMapProps {
  drivers: Driver[];
  onDriverSelect?: (driver: Driver | null) => void;
  selectedDriver?: Driver | null;
}

const DriverTrackingMap: React.FC<DriverTrackingMapProps> = ({
  drivers,
  onDriverSelect,
  selectedDriver
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'available': return '#10b981'; // green
      case 'busy': return '#f59e0b'; // yellow
      case 'break': return '#f97316'; // orange  
      case 'offline': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  const createMarkerIcon = (status: string): google.maps.Symbol => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: getMarkerColor(status),
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  };

  const createInfoWindowContent = (driver: Driver): string => {
    const statusBadgeColor = driver.driver_status === 'available' ? 'bg-green-500' :
                           driver.driver_status === 'busy' ? 'bg-yellow-500' :
                           driver.driver_status === 'break' ? 'bg-orange-500' : 'bg-gray-500';

    return `
      <div class="p-3 min-w-[200px]">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-gray-800">${driver.full_name}</h3>
          <span class="px-2 py-1 rounded-full text-xs font-medium text-white ${statusBadgeColor}">
            ${driver.driver_status}
          </span>
        </div>
        <div class="space-y-1 text-sm text-gray-600">
          ${driver.vehicle_type ? `<div class="flex items-center gap-1"><span class="w-3 h-3">🚗</span> ${driver.vehicle_type}</div>` : ''}
          <div class="flex items-center gap-1"><span class="w-3 h-3">📞</span> ${driver.phone_number}</div>
          <div class="flex items-center gap-1"><span class="w-3 h-3">📍</span> ${driver.current_latitude?.toFixed(4)}, ${driver.current_longitude?.toFixed(4)}</div>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      zoom: 11,
      center: { lat: 59.3293, lng: 18.0686 }, // Stockholm default
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

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    const map = googleMapRef.current;
    const markers = markersRef.current;
    const infoWindow = infoWindowRef.current;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    markers.clear();

    // Filter drivers with location data
    const driversWithLocation = drivers.filter(d => d.current_latitude && d.current_longitude);

    if (driversWithLocation.length === 0) return;

    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();

    // Add markers for each driver
    driversWithLocation.forEach((driver) => {
      const position = {
        lat: driver.current_latitude!,
        lng: driver.current_longitude!
      };

      const marker = new google.maps.Marker({
        position,
        map,
        title: driver.full_name,
        icon: createMarkerIcon(driver.driver_status),
        animation: google.maps.Animation.DROP
      });

      // Add click listener for info window
      marker.addListener('click', () => {
        if (infoWindow) {
          infoWindow.setContent(createInfoWindowContent(driver));
          infoWindow.open(map, marker);
        }
        onDriverSelect?.(driver);
      });

      markers.set(driver.id, marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (driversWithLocation.length > 1) {
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    } else {
      // Single marker - center on it
      const position = {
        lat: driversWithLocation[0].current_latitude!,
        lng: driversWithLocation[0].current_longitude!
      };
      map.setCenter(position);
      map.setZoom(13);
    }
  }, [drivers, isLoaded, onDriverSelect]);

  // Highlight selected driver
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    const markers = markersRef.current;

    markers.forEach((marker, driverId) => {
      const driver = drivers.find(d => d.id === driverId);
      if (!driver) return;

      const isSelected = selectedDriver?.id === driverId;
      
      marker.setIcon({
        ...createMarkerIcon(driver.driver_status),
        scale: isSelected ? 14 : 10,
        strokeWeight: isSelected ? 3 : 2,
      });

      if (isSelected) {
        // Pan to selected driver
        googleMapRef.current!.panTo({
          lat: driver.current_latitude!,
          lng: driver.current_longitude!
        });
      }
    });
  }, [selectedDriver, drivers, isLoaded]);

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '500px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-admin-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTrackingMap;