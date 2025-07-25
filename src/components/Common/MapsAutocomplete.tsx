import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MapsAutocompleteSuggestion {
  place_id: string;
  name: string;
  formatted_address?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface MapsAutocompleteProps {
  onSelect?: (suggestion: MapsAutocompleteSuggestion) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function MapsAutocomplete({
  onSelect,
  placeholder = "Search for a place...",
  label = "Location Search",
  className = ""
}: MapsAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [ll, setLL] = useState("");
  const [suggestions, setSuggestions] = useState<MapsAutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string, coordinates?: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);
    
    try {
      const requestBody: any = { q: searchQuery };
      if (coordinates) {
        requestBody.ll = coordinates;
      }

      const { data, error } = await supabase.functions.invoke("google-maps-autocomplete", {
        body: requestBody,
      });

      if (error) {
        console.error("Error fetching autocomplete:", error);
        setSuggestions([]);
      } else if (data) {
        console.log("SerpAPI response:", data);
        // SerpAPI google_maps_autocomplete returns suggestions in 'suggestions' or 'places' array
        const suggestions = data.suggestions || data.places || [];
        setSuggestions(suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Network error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback((searchQuery: string, coordinates?: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery, coordinates);
    }, 250);
  }, [fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetch(value, ll || undefined);
  };

  const handleLLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLL(value);
    if (query.length >= 3) {
      debouncedFetch(query, value || undefined);
    }
  };

  const handleSelect = (suggestion: MapsAutocompleteSuggestion) => {
    const displayText = suggestion.formatted_address || suggestion.name;
    setQuery(displayText);
    setSuggestions([]);
    setShowDropdown(false);
    onSelect?.(suggestion);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleLLClear = () => {
    setLL("");
    if (query.length >= 3) {
      debouncedFetch(query);
    }
  };

  return (
    <div className={`w-full max-w-md space-y-3 ${className}`}>
      {label && (
        <Label className="block text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      

      {/* Main Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            className="w-full rounded-xl shadow-sm focus:ring-2 focus:ring-ring pr-10"
            placeholder={placeholder}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              ✕
            </button>
          )}
          {loading && (
            <div className="absolute top-1/2 right-10 transform -translate-y-1/2 text-muted-foreground text-sm">
              ...
            </div>
          )}
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 bg-popover border border-border rounded-xl mt-1 w-full shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id || index}
                className="p-3 hover:bg-accent cursor-pointer text-popover-foreground transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                onClick={() => handleSelect(suggestion)}
              >
                <div className="font-medium text-sm">{suggestion.name}</div>
                {suggestion.formatted_address && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {suggestion.formatted_address}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}