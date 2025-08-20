import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@googlemaps/js-api-loader";

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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const sessionToken = useRef(crypto.randomUUID());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  // Load Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-google-maps-key");
        if (!error && data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          console.error("Failed to get Google Maps API key:", error);
        }
      } catch (error) {
        console.error("Error fetching Google Maps API key:", error);
      }
    };

    fetchApiKey();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!apiKey || !mapRef.current || mapLoaded) return;

    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      if (mapRef.current) {
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
      }
    }).catch(error => {
      console.error("Error loading Google Maps:", error);
    });
  }, [apiKey, selectedCoords]);

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
        const coordinates = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
        setSelectedCoords(coordinates);
        onAddressSelect?.(description, coordinates);
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