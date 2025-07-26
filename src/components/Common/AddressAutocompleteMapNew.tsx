import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AddressAutocomplete from "./AddressAutocomplete";
import SimpleMap from "./SimpleMap";

interface AddressAutocompleteMapProps {
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  className?: string;
}

export default function AddressAutocompleteMapNew({
  onAddressSelect,
  className = ""
}: AddressAutocompleteMapProps) {
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState({ lat: 59.3293, lng: 18.0686 }); // Stockholm default

  const handleAddressSelect = (newAddress: string, coordinates: { lat: number; lng: number }) => {
    setAddress(newAddress);
    setCoords(coordinates);
    onAddressSelect?.(newAddress, coordinates);
  };

  const handleLocationSelect = async (coordinates: { lat: number; lng: number }) => {
    setCoords(coordinates);
    
    try {
      const { data, error } = await supabase.functions.invoke("google-maps", {
        body: {
          service: "reverse-geocode",
          params: { lat: coordinates.lat, lng: coordinates.lng, language: "sv" },
        },
      });

      if (!error && data?.results?.[0]?.formatted_address) {
        const newAddress = data.results[0].formatted_address;
        setAddress(newAddress);
        onAddressSelect?.(newAddress, coordinates);
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <AddressAutocomplete
        value={address}
        onChange={setAddress}
        onAddressSelect={handleAddressSelect}
        className="w-full"
      />
      <SimpleMap
        center={coords}
        onLocationSelect={handleLocationSelect}
        className="w-full"
      />
    </div>
  );
}