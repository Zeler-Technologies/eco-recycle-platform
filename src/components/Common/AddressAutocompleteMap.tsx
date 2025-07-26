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
  const sessionToken = useRef(crypto.randomUUID());

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // init map
  useEffect(() => {
    if (window.google && mapRef.current && !mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
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

      markerInstance.current = new google.maps.Marker({
        position: coords,
        map: mapInstance.current,
      });

      // reverse geocode on click
      clickListenerRef.current = mapInstance.current.addListener("click", async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setCoords({ lat, lng });
        markerInstance.current?.setPosition({ lat, lng });

        const { data, error } = await supabase.functions.invoke("google-maps", {
          body: {
            service: "reverse-geocode",
            params: { lat, lng, language: "sv" },
          },
        });

        if (!error) {
          const addr = data?.results?.[0]?.formatted_address;
          if (addr) {
            setQuery(addr);
            onAddressSelect?.(addr, { lat, lng });
          }
        } else {
          console.error("Reverse geocode error:", error);
        }
      });
    }

    return () => {
      clickListenerRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep map/marker synced with coords
  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      mapInstance.current.setCenter(coords);
      markerInstance.current.setPosition(coords);
    }
  }, [coords]);

  // debounce autocomplete
  useEffect(() => {
    if (query.length > 2) {
      const t = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(t);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchSuggestions = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("google-maps", {
      body: {
        service: "autocomplete",
        params: {
          input: query,
          language: "sv",
          components: "country:se",
          sessiontoken: sessionToken.current,
        },
      },
    });
    setLoading(false);

    if (error) {
      console.error("Autocomplete error:", error);
      setSuggestions([]);
      return;
    }

    const predictions = data?.predictions ?? [];
    setSuggestions(predictions);
    setOpen(predictions.length > 0);
  };

  const handleSelect = async (description: string) => {
    setQuery(description);
    setOpen(false);

    const { data, error } = await supabase.functions.invoke("google-maps", {
      body: {
        service: "geocode",
        params: { address: description },
      },
    });

    if (error) {
      console.error("Geocode error:", error);
      return;
    }

    const result = data?.results?.[0];
    if (result?.geometry?.location) {
      const newCoords = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };
      setCoords(newCoords);
      onAddressSelect?.(description, newCoords);
      // end session, start new one for next search
      sessionToken.current = crypto.randomUUID();
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

      <div ref={mapRef} className="w-full h-64 rounded-lg border border-border" />
    </div>
  );
}