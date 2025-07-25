import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GoogleAutocompleteSuggestion {
  place_id: string;
  description: string;
}

interface GoogleAutocompleteProps {
  onSelect?: (suggestion: GoogleAutocompleteSuggestion) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function GoogleAutocomplete({
  onSelect,
  placeholder = "Type an address...",
  label = "Search Address",
  className = ""
}: GoogleAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GoogleAutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      setLoading(true);
      setShowDropdown(true);
      
      try {
        const { data, error } = await supabase.functions.invoke("google-autocomplete", {
          body: { query: value },
        });

        if (error) {
          console.error("Error fetching autocomplete:", error);
          setSuggestions([]);
        } else if (data?.predictions) {
          setSuggestions(data.predictions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Network error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (suggestion: GoogleAutocompleteSuggestion) => {
    setQuery(suggestion.description);
    setSuggestions([]);
    setShowDropdown(false);
    onSelect?.(suggestion);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      {label && (
        <Label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </Label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            className="w-full rounded-xl shadow-sm focus:ring-2 focus:ring-ring"
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
        </div>

        {loading && (
          <div className="absolute top-3 right-10 text-muted-foreground text-sm">
            Loading...
          </div>
        )}

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 bg-popover border border-border rounded-xl mt-1 w-full shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="p-3 hover:bg-accent cursor-pointer text-popover-foreground transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}