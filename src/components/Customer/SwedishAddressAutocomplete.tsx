import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AccessibleInput } from '@/components/Common/AccessibleForm';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddressSuggestion {
  place_id: string;
  description: string;
  formatted_address?: string;
  postal_code?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SwedishAddressAutocompleteProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (suggestion: AddressSuggestion) => void;
  onPostalCodeChange?: (postalCode: string) => void;
  onCityChange?: (city: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SwedishAddressAutocomplete: React.FC<SwedishAddressAutocompleteProps> = ({
  label,
  placeholder = "Börja skriv din adress...",
  value,
  onChange,
  onAddressSelect,
  onPostalCodeChange,
  onCityChange,
  error,
  required = false,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
  const [sessionToken] = useState(() => crypto.randomUUID());
  const debounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Google Maps integration
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          service: 'autocomplete',
          params: {
            input: query,
            language: 'sv',
            components: 'country:se',
            sessiontoken: sessionToken
          }
        }
      });

      if (error) throw error;

      if (data.status === 'OK' && data.predictions) {
        const addressSuggestions: AddressSuggestion[] = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          formatted_address: prediction.structured_formatting?.main_text || prediction.description,
        }));

        setSuggestions(addressSuggestions);
        setShowSuggestions(true);
      } else if (data.status === 'REQUEST_DENIED') {
        // Fallback to basic parsing for Swedish addresses
        const basicSuggestion = parseSwedishAddress(query);
        if (basicSuggestion) {
          setSuggestions([basicSuggestion]);
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Address search error:', error);
      // Fallback to basic parsing
      const basicSuggestion = parseSwedishAddress(query);
      if (basicSuggestion) {
        setSuggestions([basicSuggestion]);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Basic Swedish address parser as fallback
  const parseSwedishAddress = (address: string): AddressSuggestion | null => {
    // Basic pattern matching for Swedish addresses
    const patterns = [
      /^(.+?)\s+(\d{1,3}[A-Za-z]?)\s*,?\s*(\d{3}\s?\d{2})?\s*([A-Za-zåäöÅÄÖ\s]+)?$/,
      /^(.+?)\s+(\d{1,3}[A-Za-z]?)\s*,?\s*([A-Za-zåäöÅÄÖ\s]+)$/,
    ];

    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match) {
        const [, street, number, postalOrCity, cityOrNull] = match;
        const isPostalCode = /^\d{3}\s?\d{2}$/.test(postalOrCity || '');
        
        return {
          place_id: `fallback_${Date.now()}`,
          description: address.trim(),
          formatted_address: `${street} ${number}`,
          postal_code: isPostalCode ? postalOrCity?.replace(/\s/, '') : undefined,
          city: isPostalCode ? cityOrNull?.trim() : postalOrCity?.trim(),
        };
      }
    }
    
    return null;
  };

  // Debounced search
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    setHasSelectedAddress(false);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  }, [onChange, searchAddresses]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion: AddressSuggestion) => {
    onChange(suggestion.formatted_address || suggestion.description);
    setHasSelectedAddress(true);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get detailed place information if using Google Maps
    if (suggestion.place_id && !suggestion.place_id.startsWith('fallback_')) {
      try {
        const { data, error } = await supabase.functions.invoke('google-maps', {
          body: {
            service: 'place_details',
            params: {
              place_id: suggestion.place_id,
              language: 'sv',
              sessiontoken: sessionToken
            }
          }
        });

        if (!error && data.status === 'OK' && data.result) {
          const place = data.result;
          const addressComponents = place.address_components || [];
          
          // Extract postal code and city from address components
          const postalCode = addressComponents.find((comp: any) => 
            comp.types.includes('postal_code'))?.long_name;
          const city = addressComponents.find((comp: any) => 
            comp.types.includes('locality') || comp.types.includes('postal_town'))?.long_name;

          const enhancedSuggestion = {
            ...suggestion,
            postal_code: postalCode,
            city: city,
            coordinates: place.geometry?.location ? {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            } : undefined
          };

          onAddressSelect(enhancedSuggestion);
          
          if (postalCode && onPostalCodeChange) {
            onPostalCodeChange(postalCode);
          }
          if (city && onCityChange) {
            onCityChange(city);
          }
        } else {
          onAddressSelect(suggestion);
        }
      } catch (error) {
        console.error('Place details error:', error);
        onAddressSelect(suggestion);
      }
    } else {
      // Handle fallback suggestion
      onAddressSelect(suggestion);
      if (suggestion.postal_code && onPostalCodeChange) {
        onPostalCodeChange(suggestion.postal_code);
      }
      if (suggestion.city && onCityChange) {
        onCityChange(suggestion.city);
      }
    }
  }, [onChange, onAddressSelect, onPostalCodeChange, onCityChange, sessionToken]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionSelect]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <AccessibleInput
          id={`address-${label.toLowerCase().replace(/\s+/g, '-')}`}
          label={label}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          error={error}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          helpText="Börja skriv för att se adressförslag"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        
        {/* Success indicator */}
        {hasSelectedAddress && !isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.formatted_address || suggestion.description}
                  </div>
                  {suggestion.postal_code && suggestion.city && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.postal_code} {suggestion.city}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};