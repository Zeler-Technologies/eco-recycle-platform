import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteMapProps {
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  className?: string;
}

export default function AddressAutocompleteMap({
  onAddressSelect,
  className = ""
}: AddressAutocompleteMapProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Generate new session token
  const generateSessionToken = useCallback(() => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  // Initialize session token
  useEffect(() => {
    setSessionToken(generateSessionToken());
  }, [generateSessionToken]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      const mapInstance = new google.maps.Map(mapRef.current!, {
        center: { lat: 59.3293, lng: 18.0686 }, // Stockholm
        zoom: 12,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }]
          }
        ]
      });

      // Add click listener for reverse geocoding
      mapInstance.addListener("click", async (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          await handleReverseGeocode(lat, lng);
          
          // Update marker position
          if (marker) {
            marker.setPosition({ lat, lng });
          } else {
            const newMarker = new google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              title: "Selected location"
            });
            setMarker(newMarker);
          }
        }
      });

      setMap(mapInstance);
    };

    // Load Google Maps API if not already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // For now, don't load the API to avoid key issues
      // The component will work with just autocomplete functionality
      console.log('Google Maps API not loaded - map functionality disabled');
    }
  }, []);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  const fetchAutocomplete = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          service: 'autocomplete',
          params: {
            input,
            language: 'sv',
            components: 'country:se',
            sessiontoken: sessionToken
          }
        }
      });

      if (error) {
        console.error('Autocomplete error:', error);
        setPredictions([]);
        return;
      }

      if (data && data.predictions) {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Network error:', error);
      setPredictions([]);
      toast({
        title: "Error",
        description: "Failed to fetch address suggestions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [sessionToken, toast]);

  // Debounced fetch
  const debouncedFetch = useCallback((input: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(input);
    }, 300);
  }, [fetchAutocomplete]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetch(value);
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: Prediction) => {
    setQuery(prediction.description);
    setPredictions([]);
    setShowDropdown(false);

    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          service: 'geocode',
          params: {
            address: prediction.description
          }
        }
      });

      if (error) {
        console.error('Geocode error:', error);
        toast({
          title: "Error",
          description: "Failed to get location coordinates",
          variant: "destructive"
        });
        return;
      }

      if (data && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const coordinates = { lat: location.lat, lng: location.lng };

        // Update map center and marker
        if (map) {
          map.setCenter(coordinates);
          map.setZoom(15);

          if (marker) {
            marker.setPosition(coordinates);
          } else {
            const newMarker = new google.maps.Marker({
              position: coordinates,
              map: map,
              title: prediction.description
            });
            setMarker(newMarker);
          }
        }

        // Reset session token after successful geocoding
        setSessionToken(generateSessionToken());

        // Call callback if provided
        onAddressSelect?.(prediction.description, coordinates);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      toast({
        title: "Error",
        description: "Failed to get location coordinates",
        variant: "destructive"
      });
    }
  };

  // Handle reverse geocoding
  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          service: 'reverse-geocode',
          params: {
            lat,
            lng,
            language: 'sv'
          }
        }
      });

      if (error) {
        console.error('Reverse geocode error:', error);
        return;
      }

      if (data && data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setQuery(address);
        onAddressSelect?.(address, { lat, lng });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Address Input */}
      <div className="relative" ref={dropdownRef}>
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          className="w-full"
          placeholder="Sök adress..."
        />
        
        {loading && (
          <div className="absolute top-1/2 right-3 transform -translate-y-1/2 text-muted-foreground text-sm">
            ...
          </div>
        )}

        {/* Predictions Dropdown */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 bg-popover border border-border rounded-lg mt-1 w-full shadow-lg max-h-60 overflow-auto">
            {predictions.map((prediction) => (
              <div
                key={prediction.place_id}
                className="p-3 hover:bg-accent cursor-pointer text-popover-foreground transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                onClick={() => handlePredictionSelect(prediction)}
              >
                <div className="font-medium text-sm">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Map */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-border"
        style={{ minHeight: '256px' }}
      />
    </div>
  );
}