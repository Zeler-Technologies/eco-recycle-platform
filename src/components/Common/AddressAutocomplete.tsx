import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AddressAutocompleteProps {
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function AddressAutocomplete({
  onAddressSelect,
  value = "",
  onChange,
  className = ""
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle query changes
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    onChange?.(newQuery);
  };

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
    handleQueryChange(description);
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
        onAddressSelect?.(description, coordinates);
        // Reset session token
        sessionToken.current = crypto.randomUUID();
      }
    } catch (error) {
      console.error("Geocode error:", error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
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
  );
}