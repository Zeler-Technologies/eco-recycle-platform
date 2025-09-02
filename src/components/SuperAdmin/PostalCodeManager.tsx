import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Upload, Download, Search, Eye, Trash2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PostalCode {
  id: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  created_at: string;
}

interface TenantCoverage {
  tenant_id: number;
  tenant_name: string;
  postal_code_count: number;
  last_updated: string;
}

const PostalCodeManager = () => {
  const [selectedCountry, setSelectedCountry] = useState('Sweden');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch postal codes
  const { data: postalCodes = [], isLoading: loadingPostalCodes } = useQuery({
    queryKey: ['postal-codes-master', selectedCountry, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('postal_codes_master')
        .select('*')
        .eq('country', selectedCountry)
        .order('postal_code');

      if (searchTerm) {
        query = query.or(`postal_code.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PostalCode[];
    },
  });

  // Fetch tenants for coverage overview
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('tenants_id, name, country')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch tenant coverage overview
  const { data: tenantCoverage = [] } = useQuery({
    queryKey: ['tenant-coverage-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_coverage_areas')
        .select(`
          tenant_id,
          tenants(name),
          updated_at
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Group by tenant and count postal codes
      const coverageMap = new Map();
      data.forEach((item: any) => {
        const tenantId = item.tenant_id;
        const tenantName = item.tenants?.name || 'Okänd';
        
        if (!coverageMap.has(tenantId)) {
          coverageMap.set(tenantId, {
            tenant_id: tenantId,
            tenant_name: tenantName,
            postal_code_count: 0,
            last_updated: item.updated_at
          });
        }
        
        const current = coverageMap.get(tenantId);
        current.postal_code_count++;
        if (item.updated_at > current.last_updated) {
          current.last_updated = item.updated_at;
        }
      });

      return Array.from(coverageMap.values()) as TenantCoverage[];
    },
  });

  // Fetch specific tenant coverage
  const { data: tenantPostalCodes = [] } = useQuery({
    queryKey: ['tenant-postal-codes', selectedTenant],
    enabled: !!selectedTenant,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_coverage_areas')
        .select(`
          postal_codes_master(
            id,
            postal_code,
            city,
            region,
            country
          )
        `)
        .eq('tenant_id', selectedTenant)
        .eq('is_active', true);

      if (error) throw error;
      return data.map((item: any) => item.postal_codes_master) as PostalCode[];
    },
  });

  // Import postal codes mutation
  const importPostalCodes = useMutation({
    mutationFn: async ({ file, country }: { file: File; country: string }) => {
      const text = await file.text();
      console.log(`File size: ${text.length} characters`);
      
      // Debug: test a known-good sample row (should be lat 57.9167, lng 19.1333)
      const testRow = "SE\t624 66\tFårö\tGotland\t05\t\t\t\t\t\t57.9167\t19.1333\t4";
      const testCols = testRow.split('\t');
      console.log('🔍 Test parsing (expected lat 57.9167, lng 19.1333):', {
        postal: testCols[1], 
        city: testCols[2], 
        col10: testCols[10], 
        col11: testCols[11],
        parsedLat: parseFloat(testCols[10]),
        parsedLng: parseFloat(testCols[11])
      });

      const lines = text.split('\n').filter(line => line.trim());
      const postalCodes: any[] = [];
      
      lines.forEach((line, index) => {
        if (!line.trim()) return;
        
        // CRITICAL: Split by TAB character for Swedish format
        const columns = line.split('\t');

        // Debug: Log first few rows to verify column positions
        if (index < 3) {
          console.log(`🔍 Row ${index}:`, {
            totalCols: columns.length,
            col10: columns[10],
            col11: columns[11],
            col12: columns[12],
            postal: columns[1],
            city: columns[2]
          });
        }
        
        if (columns.length < 4) {
          console.warn(`Row ${index + 1}: Not enough columns (${columns.length})`);
          return;
        }
        
        // Extract from correct TAB-separated positions for Swedish format:
        // SE[TAB]624 66[TAB]Fårö[TAB]Gotland[TAB]...[TAB]57.9167[TAB]19.1333
        const countryCode = columns[0]?.trim(); // SE
        const postalCodeRaw = columns[1]?.trim(); // "624 66"
        const city = columns[2]?.trim(); // "Fårö"
        const region = columns[3]?.trim(); // "Gotland"
        
        // Skip invalid rows
        if (!countryCode || !postalCodeRaw || !city) {
          console.warn(`Row ${index + 1}: Missing essential data`);
          return;
        }
        
        // Convert "624 66" to "62466" - remove spaces from postal codes
        const postalCode = postalCodeRaw.replace(/\s+/g, '');
        
        // Validate Swedish postal code (5 digits)
        if (!/^\d{5}$/.test(postalCode)) {
          console.warn(`Row ${index + 1}: Invalid postal code: ${postalCodeRaw}`);
          return;
        }

        // FIXED: Attempt to parse coordinates from expected positions
        let parsedLat: number | null = null;
        let parsedLng: number | null = null;

        // Try columns 10 and 11 first (expected positions)
        const col10Val = columns[10]?.trim();
        const col11Val = columns[11]?.trim();
        
        if (col10Val && !isNaN(parseFloat(col10Val))) {
          parsedLat = parseFloat(col10Val);
        }
        if (col11Val && !isNaN(parseFloat(col11Val))) {
          parsedLng = parseFloat(col11Val);
        }

        // Debug coordinate parsing for first few rows
        if (index < 3) {
          console.log(`🔍 Coordinates for ${postalCode}:`, {
            col10Val, col11Val, parsedLat, parsedLng
          });
        }

        // Swedish coordinate validation and swap detection
        if (parsedLat !== null && parsedLng !== null) {
          // Check if coordinates are swapped (lat should be 55-70, lng should be 10-25)
          if (parsedLat >= 10 && parsedLat <= 25 && parsedLng >= 55 && parsedLng <= 70) {
            console.warn(`🔄 Row ${index + 1}: Swapping coordinates for ${postalCode}`);
            [parsedLat, parsedLng] = [parsedLng, parsedLat];
          }
          
          // Final validation for Swedish coordinates
          if (parsedLat < 55 || parsedLat > 70 || parsedLng < 10 || parsedLng > 25) {
            console.warn(`❌ Row ${index + 1}: Invalid coordinates for ${postalCode}: lat=${parsedLat}, lng=${parsedLng}`);
            parsedLat = null;
            parsedLng = null;
          } else if (index < 3) {
            console.log(`✅ Valid coordinates for ${postalCode}: lat=${parsedLat}, lng=${parsedLng}`);
          }
        }

        // Store final coordinates
        const finalLat = parsedLat;
        const finalLng = parsedLng;
        
        postalCodes.push({
          postal_code: postalCode,
          city: city,
          region: region || '',
          country: country,
          latitude: finalLat,
          longitude: finalLng,
          is_active: true
        });
      });
      
      console.log(`Parsed ${postalCodes.length} valid postal codes`);
      
      if (postalCodes.length === 0) {
        throw new Error('Inga giltiga postnummer hittades. Kontrollera att filen är TAB-separerad.');
      }

      // Clear existing data for this country first
      await supabase
        .from('postal_codes_master')
        .delete()
        .eq('country', country);

      // Insert in batches to avoid timeout
      const batchSize = 1000;
      let imported = 0;
      
      for (let i = 0; i < postalCodes.length; i += batchSize) {
        const batch = postalCodes.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('postal_codes_master')
          .insert(batch);
        
        if (error) throw error;
        imported += batch.length;
        
        console.log(`Imported ${imported}/${postalCodes.length} postal codes`);
      }

      return { total: imported, withCoords: postalCodes.filter(pc => pc.latitude && pc.longitude).length };
    },
    onSuccess: (result) => {
      toast({
        title: "Import slutförd",
        description: `Importerat ${result.total} postnummer för ${selectedCountry}. ${result.withCoords} har koordinater.`,
      });
      queryClient.invalidateQueries({ queryKey: ['postal-codes-master'] });
    },
    onError: (error) => {
      toast({
        title: "Import misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete postal code mutation
  const deletePostalCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('postal_codes_master')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Postnummer borttaget",
        description: "Postnumret har tagits bort från systemet.",
      });
      queryClient.invalidateQueries({ queryKey: ['postal-codes-master'] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid borttagning",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "Ingen fil vald",
        description: "Välj en CSV-fil att importera.",
        variant: "destructive",
      });
      return;
    }

    importPostalCodes.mutate({ file, country: selectedCountry });
  };

  const handleExport = async () => {
    const csvContent = [
      'postal_code,city,region,country',
      ...postalCodes.map(pc => 
        `"${pc.postal_code}","${pc.city}","${pc.region || ''}","${pc.country}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postnummer-${selectedCountry}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Postnummerhantering</h2>
        <p className="text-muted-foreground">
          Hantera centraliserat postnummerdatabasen och övervaka tenant-täckning.
        </p>
      </div>

      <Tabs defaultValue="master" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="master">Postnummer Database</TabsTrigger>
          <TabsTrigger value="coverage">Tenant Täckning</TabsTrigger>
          <TabsTrigger value="import">Import & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Postnummer Database</CardTitle>
              <CardDescription>
                Visa och hantera alla postnummer i systemet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="country-select">Land</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sweden">Sverige</SelectItem>
                      <SelectItem value="Norway">Norge</SelectItem>
                      <SelectItem value="Denmark">Danmark</SelectItem>
                      <SelectItem value="Finland">Finland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-2">
                  <Label htmlFor="search">Sök postnummer eller stad</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Sök postnummer eller stad..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Postnummer</TableHead>
                      <TableHead>Stad</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Land</TableHead>
                      <TableHead>Koordinater</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPostalCodes ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Laddar postnummer...
                        </TableCell>
                      </TableRow>
                    ) : postalCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Inga postnummer funna för {selectedCountry}
                        </TableCell>
                      </TableRow>
                    ) : (
                      postalCodes.map((pc) => (
                        <TableRow key={pc.id}>
                          <TableCell className="font-medium">{pc.postal_code}</TableCell>
                          <TableCell>{pc.city}</TableCell>
                          <TableCell>{pc.region || '-'}</TableCell>
                          <TableCell>{pc.country}</TableCell>
                          <TableCell className="text-xs">
                            {pc.latitude && pc.longitude ? (
                              <div>
                                <div>Lat: {pc.latitude.toFixed(4)}</div>
                                <div>Lng: {pc.longitude.toFixed(4)}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Ej tillgängligt</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pc.is_active ? "default" : "secondary"}>
                              {pc.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ta bort postnummer</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Är du säker på att du vill ta bort postnummer {pc.postal_code} ({pc.city})?
                                    Detta kommer att påverka alla tenants som använder detta postnummer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deletePostalCode.mutate(pc.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Ta bort
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Visar {postalCodes.length} postnummer för {selectedCountry}
                </p>
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportera CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Täckningsöversikt</CardTitle>
              <CardDescription>
                Se vilka postnummer varje tenant har valt för sina tjänsteområden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenantCoverage.map((coverage) => (
                  <Card key={coverage.tenant_id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedTenant(coverage.tenant_id)}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{coverage.tenant_name}</CardTitle>
                        <Badge variant="outline">
                          {coverage.postal_code_count} postnummer
                        </Badge>
                      </div>
                      <CardDescription>
                        Senast uppdaterad: {new Date(coverage.last_updated).toLocaleDateString('sv-SE')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {selectedTenant && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Postnummer för {tenantCoverage.find(t => t.tenant_id === selectedTenant)?.tenant_name}
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedTenant(null)}
                      className="w-fit"
                    >
                      Stäng
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Postnummer</TableHead>
                            <TableHead>Stad</TableHead>
                            <TableHead>Region</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tenantPostalCodes.map((pc) => (
                            <TableRow key={pc.id}>
                              <TableCell className="font-medium">{pc.postal_code}</TableCell>
                              <TableCell>{pc.city}</TableCell>
                              <TableCell>{pc.region || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importera Postnummer</CardTitle>
              <CardDescription>
                Ladda upp en CSV-fil med postnummer för att uppdatera databasen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                   <div className="text-center">
                    <h3 className="font-medium">Välj TAB-separerad fil att importera</h3>
                    <p className="text-sm text-muted-foreground">
                      För svenska postnummer: TAB-separerad fil med koordinater
                    </p>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <Label htmlFor="import-country">Importera för land:</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sweden">Sverige</SelectItem>
                        <SelectItem value="Norway">Norge</SelectItem>
                        <SelectItem value="Denmark">Danmark</SelectItem>
                        <SelectItem value="Finland">Finland</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                    onChange={() => {}}
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                    >
                      Välj fil
                    </Button>
                    <Button 
                      onClick={handleFileImport}
                      disabled={importPostalCodes.isPending}
                    >
                      {importPostalCodes.isPending ? 'Importerar...' : 'Importera'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Filformat för svenska postnummer</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Filen ska vara <strong>TAB-separerad</strong> (inte komma-separerad).
                    </p>
                    <div className="bg-background p-2 rounded text-xs font-mono mb-2">
                      SE[TAB]624 66[TAB]Fårö[TAB]Gotland[TAB]...[TAB]57.9167[TAB]19.1333
                    </div>
                    <p className="text-xs text-amber-600">
                      ⚠️ Viktigt: Använd TAB-tecken mellan kolumner, inte kommatecken!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostalCodeManager;