import { useState, useEffect, useRef } from "react";

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
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  // Initialize Google Maps services when available
  useEffect(() => {
    const initializeServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Initializing Google Maps services...');
        autocompleteService.current = new google.maps.places.AutocompleteService();
        geocoder.current = new google.maps.Geocoder();
        
        if (mapRef.current && !mapLoaded) {
          initializeMap();
        }
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeServices();
    } else {
      // Poll until Google Maps is loaded
      const interval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initializeServices();
          clearInterval(interval);
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(interval), 10000);
    }
  }, []);

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
    if (!query || query.length <= 2 || !autocompleteService.current) {
      console.log('Skipping autocomplete: query too short or service not ready');
      return;
    }
    
    setLoading(true);
    console.log('Fetching suggestions for:', query);
    
    try {
      const request = {
        input: query,
        componentRestrictions: { country: 'se' },
        language: 'sv'
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        console.log('Autocomplete status:', status);
        console.log('Predictions:', predictions);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setOpen(true);
        } else {
          console.error('Autocomplete failed:', status);
          setSuggestions([]);
          setOpen(false);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Autocomplete error:", error);
      setSuggestions([]);
      setLoading(false);
    }
  };

  const handleSelect = async (description: string, placeId: string) => {
    console.log('Address selected:', description);
    setQuery(description);
    setOpen(false);

    if (!geocoder.current) {
      console.error('Geocoder not available');
      return;
    }

    try {
      console.log('Geocoding place ID:', placeId);
      
      geocoder.current.geocode({ placeId: placeId }, (results, status) => {
        console.log('Geocode status:', status);
        console.log('Geocode results:', results);
        
        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          const location = results[0].geometry.location;
          const coordinates = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          console.log('New coordinates:', coordinates);
          setSelectedCoords(coordinates);
          onAddressSelect?.(description, coordinates);
        } else {
          console.error('Geocoding failed:', status);
        }
      });
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
                onClick={() => handleSelect(item.description, item.place_id)}
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