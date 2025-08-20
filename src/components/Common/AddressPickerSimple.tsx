import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AddressPickerSimpleProps {
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  className?: string;
}

export default function AddressPickerSimple({
  onAddressSelect,
  className = ""
}: AddressPickerSimpleProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: 59.3293, lng: 18.0686 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  // Initialize Google Maps using existing script tag
  useEffect(() => {
    if (mapRef.current && !mapLoaded && window.google && window.google.maps) {
      initializeMap();
    }
  }, []);

  // Poll for Google Maps to be available (from script tag in index.html)
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && mapRef.current && !mapLoaded) {
        initializeMap();
      }
    };

    const interval = setInterval(checkGoogleMaps, 100);
    
    // Cleanup after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [mapLoaded]);

  const initializeMap = () => {
    if (mapRef.current && window.google && window.google.maps && !mapLoaded) {
      try {
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: selectedCoords,
          zoom: 13,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        markerInstance.current = new google.maps.Marker({
          position: selectedCoords,
          map: mapInstance.current,
          title: "Vald position"
        });

        setMapLoaded(true);
        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  };

  // Update map when coordinates change
  useEffect(() => {
    if (mapInstance.current && markerInstance.current && mapLoaded) {
      mapInstance.current.setCenter(selectedCoords);
      markerInstance.current.setPosition(selectedCoords);
    }
  }, [selectedCoords, mapLoaded]);

  // Debounce autocomplete
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (query.length > 2) {
      timeoutId = setTimeout(fetchSuggestions, 300);
    } else {
      setSuggestions([]);
      setOpen(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [query]);

  const fetchSuggestions = async () => {
    if (!query || query.length <= 2) return;
    
    setLoading(true);
    console.log('Fetching suggestions for:', query);
    
    try {
      const requestBody = {
        service: "autocomplete",
        params: {
          input: query,
          language: "sv",
          components: "country:se",
          sessiontoken: sessionToken.current,
        },
      };
      
      console.log('Calling google-maps function with:', requestBody);
      const { data, error } = await supabase.functions.invoke("google-maps", {
        body: requestBody,
      });
      
      if (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      } else {
        console.log('Autocomplete response:', data);
        
        // Check for Google Maps API errors
        if (data?.status && data.status !== 'OK') {
          console.error('Google Maps API Error:', data.status, data.error_message);
          setSuggestions([]);
          return;
        }
        
        const predictions = data?.predictions ?? [];
        console.log('Found predictions:', predictions.length);
        setSuggestions(predictions);
        setOpen(predictions.length > 0);
      }
    } catch (error) {
      console.error("Autocomplete fetch error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (description: string) => {
    console.log('Address selected:', description);
    setQuery(description);
    setOpen(false);

    try {
      console.log('Geocoding address:', description);
      const { data, error } = await supabase.functions.invoke("google-maps", {
        body: {
          service: "geocode",
          params: { address: description },
        },
      });

      console.log('Geocode response:', { data, error });

      if (!error && data?.results?.[0]?.geometry?.location) {
        const result = data.results[0];
        const coordinates = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
        console.log('New coordinates:', coordinates);
        setSelectedCoords(coordinates);
        onAddressSelect?.(description, coordinates);
        sessionToken.current = crypto.randomUUID();
        console.log('Map should update to new position');
      } else {
        console.error('Geocoding failed:', error || 'No results found');
      }
    } catch (error) {
      console.error("Geocode error:", error);
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök adress..."
          className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
        />
        {loading && (
          <p className="absolute top-3 right-3 text-muted-foreground text-sm">...</p>
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 bg-popover border border-border rounded-lg mt-1 w-full shadow-lg max-h-60 overflow-auto">
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                className="p-3 hover:bg-accent cursor-pointer text-popover-foreground transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                onClick={() => handleSelect(item.description)}
              >
                <div className="font-medium text-sm">
                  {item.structured_formatting?.main_text || item.description}
                </div>
                {item.structured_formatting?.secondary_text && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.structured_formatting.secondary_text}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative w-full h-64 bg-muted rounded-lg border border-border overflow-hidden">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Laddar karta...</p>
              {query && (
                <p className="text-sm text-foreground">Vald adress: {query}</p>
              )}
            </div>
          </div>
        )}
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ display: mapLoaded ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}