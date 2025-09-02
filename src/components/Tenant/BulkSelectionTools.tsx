import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Minus, MapPin, Building2, Trash2 } from 'lucide-react';

interface BulkSelectionToolsProps {
  tenantId: number;
  country: string;
  onSuccess: () => void;
}

const BulkSelectionTools = ({ tenantId, country, onSuccess }: BulkSelectionToolsProps) => {
  const queryClient = useQueryClient();

  // Bulk select by criteria
  const bulkSelect = useMutation({
    mutationFn: async (criteria: {
      type: 'region' | 'major_cities' | 'has_coordinates' | 'clear_all';
      value?: string;
    }) => {
      if (criteria.type === 'clear_all') {
        // Remove all selections
        const { error } = await supabase
          .from('tenant_coverage_areas')
          .delete()
          .eq('tenant_id', tenantId);
        if (error) throw error;
        return { action: 'cleared', count: 0 };
      }

      let query = supabase
        .from('postal_codes_master')
        .select('id')
        .eq('country', country)
        .eq('is_active', true);

      switch (criteria.type) {
        case 'region':
          if (criteria.value) {
            query = query.eq('region', criteria.value);
          }
          break;
        case 'major_cities':
          // Select major Swedish cities
          const majorCities = [
            'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås', 
            'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'
          ];
          query = query.in('city', majorCities);
          break;
        case 'has_coordinates':
          query = query.not('latitude', 'is', null).not('longitude', 'is', null);
          break;
      }

      const { data: postalCodes, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (postalCodes.length === 0) {
        return { action: 'selected', count: 0 };
      }

      // Insert all postal codes for this tenant
      const inserts = postalCodes.map(pc => ({
        tenant_id: tenantId,
        postal_code_id: pc.id
      }));

      const { error } = await supabase
        .from('tenant_coverage_areas')
        .upsert(inserts, { onConflict: 'tenant_id,postal_code_id' });

      if (error) throw error;
      return { action: 'selected', count: postalCodes.length };
    },
    onSuccess: (result, criteria) => {
      if (criteria.type === 'clear_all') {
        toast({
          title: "Alla val rensade",
          description: "Alla postnummer har tagits bort från täckningsområdet.",
        });
      } else {
        const description = criteria.type === 'region' && criteria.value
          ? `${result.count} postnummer i ${criteria.value} har lagts till.`
          : `${result.count} postnummer har lagts till.`;
        
        toast({
          title: "Postnummer tillagda",
          description,
        });
      }
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ['tenant-selected-postal-codes'] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid bulkval",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quick region selections for Sweden
  const swedenRegions = [
    'Stockholm', 'Västra Götaland', 'Skåne', 'Uppsala', 'Östergötland',
    'Jönköping', 'Halland', 'Örebro', 'Västmanland', 'Dalarna'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snabbval för stora områden</CardTitle>
        <CardDescription>
          Välj hela regioner eller kategorier av postnummer på en gång
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Major Cities */}
        <div>
          <h4 className="font-medium mb-2">Populära val</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkSelect.mutate({ type: 'major_cities' })}
              disabled={bulkSelect.isPending}
            >
              <Building2 className="h-4 w-4 mr-1" />
              Alla storstäder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkSelect.mutate({ type: 'has_coordinates' })}
              disabled={bulkSelect.isPending}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Med koordinater
            </Button>
          </div>
        </div>

        {/* Swedish Regions */}
        {country === 'Sweden' && (
          <div>
            <h4 className="font-medium mb-2">Hela regioner</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {swedenRegions.map((region) => (
                <Button
                  key={region}
                  variant="outline"
                  size="sm"
                  onClick={() => bulkSelect.mutate({ type: 'region', value: region })}
                  disabled={bulkSelect.isPending}
                  className="justify-start"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {region}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Clear All */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkSelect.mutate({ type: 'clear_all' })}
            disabled={bulkSelect.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Rensa alla val
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkSelectionTools;