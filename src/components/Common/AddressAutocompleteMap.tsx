import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AddressAutocompleteMapProps {
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  className?: string;
}

export default function AddressAutocompleteMap({
  onAddressSelect,
  className = ""
}: AddressAutocompleteMapProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ lat: 59.3293, lng: 18.0686 }); // Stockholm default
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const isInitializingRef = useRef(false);

  // Check for Google Maps API availability and init map
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let attemptCount = 0;
    const maxAttempts = 10;
    let isMounted = true;

    const cleanupInstances = () => {
      if (clickListenerRef.current) {
        try {
          window.google?.maps?.event?.removeListener(clickListenerRef.current);
          clickListenerRef.current = null;
        } catch (e) {
          console.warn('Error removing click listener:', e);
        }
      }
      if (markerInstance.current) {
        try {
          markerInstance.current.setMap(null);
          markerInstance.current = null;
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      }
      if (mapInstance.current && mapRef.current) {
        try {
          // Clear the map container without removing React-managed DOM
          const mapContainer = mapRef.current;
          if (mapContainer && mapContainer.firstChild) {
            // Let Google Maps clean itself up
            mapInstance.current = null;
          }
        } catch (e) {
          console.warn('Error clearing map:', e);
        }
      }
      isInitializingRef.current = false;
    };

    const initializeMap = () => {
      // Prevent multiple initialization attempts
      if (!isMounted || isInitializingRef.current || mapInstance.current || !mapRef.current) {
        return;
      }

      console.log('Checking Google Maps availability:', !!window.google);
      
      if (window.google && window.google.maps) {
        console.log('Initializing Google Maps...');
        isInitializingRef.current = true;
        
        try {
          // Ensure container is clean before initialization
          const container = mapRef.current;
          if (container && isMounted) {
            mapInstance.current = new window.google.maps.Map(container, {
              center: coords,
              zoom: 12,
              styles: [
                {
                  featureType: "all",
                  elementType: "geometry.fill",
                  stylers: [{ color: "#f5f5f5" }]
                }
              ]
            });

            if (isMounted && mapInstance.current) {
              markerInstance.current = new window.google.maps.Marker({
                position: coords,
                map: mapInstance.current,
              });

              // reverse geocode on click
              clickListenerRef.current = mapInstance.current.addListener("click", async (e: google.maps.MapMouseEvent) => {
                if (!isMounted || !e.latLng) return;
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();

                setCoords({ lat, lng });
                if (markerInstance.current && isMounted) {
                  markerInstance.current.setPosition({ lat, lng });
                }

                if (isMounted) {
                  try {
                    const { data, error } = await supabase.functions.invoke("google-maps", {
                      body: {
                        service: "reverse-geocode",
                        params: { lat, lng, language: "sv" },
                      },
                    });

                    if (isMounted && !error && data?.results?.[0]?.formatted_address) {
                      const addr = data.results[0].formatted_address;
                      setQuery(addr);
                      onAddressSelect?.(addr, { lat, lng });
                    }
                  } catch (error) {
                    if (isMounted) {
                      console.error("Reverse geocode error:", error);
                    }
                  }
                }
              });

              if (isMounted) {
                setMapLoaded(true);
                setGoogleMapsError(false);
              }
            }
          }
          
          isInitializingRef.current = false;
          console.log('Google Maps initialized successfully');
        } catch (error) {
          console.error('Error initializing Google Maps:', error);
          if (isMounted) {
            setGoogleMapsError(true);
          }
          isInitializingRef.current = false;
        }
      } else if (attemptCount < maxAttempts && isMounted) {
        attemptCount++;
        console.log(`Google Maps API not loaded yet, attempt ${attemptCount}/${maxAttempts}...`);
        timeoutId = setTimeout(initializeMap, 1000);
      } else if (isMounted) {
        console.error('Google Maps API failed to load after maximum attempts');
        setGoogleMapsError(true);
      }
    };

    // Small delay to ensure DOM is ready
    timeoutId = setTimeout(initializeMap, 100);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cleanupInstances();
    };
  }, []);

  // keep map/marker synced with coords
  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      try {
        mapInstance.current.setCenter(coords);
        markerInstance.current.setPosition(coords);
      } catch (error) {
        console.warn('Error updating map coords:', error);
      }
    }
  }, [coords]);

  // debounce autocomplete
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
    
    console.log('=== Frontend: Starting autocomplete request ===');
    console.log('Query:', query);
    
    setLoading(true);
    
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
      
      const { data, error } = await supabase.functions.invoke("google-maps", {
        body: requestBody,
      });
      
      if (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      } else {
        const predictions = data?.predictions ?? [];
        console.log('Predictions extracted:', predictions.length, 'items');
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
    setQuery(description);
    setOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke("google-maps", {
        body: {
          service: "geocode",
          params: { address: description },
        },
      });

      if (!error && data?.results?.[0]?.geometry?.location) {
        const result = data.results[0];
        const newCoords = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
        setCoords(newCoords);
        onAddressSelect?.(description, newCoords);
        // end session, start new one for next search
        sessionToken.current = crypto.randomUUID();
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

      <div ref={mapRef} className="w-full h-64 rounded-lg border border-border relative">
        {googleMapsError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-destructive">Kunde inte ladda karta</p>
          </div>
        ) : !mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Laddar karta...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
