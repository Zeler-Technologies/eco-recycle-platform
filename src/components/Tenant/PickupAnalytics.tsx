import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Filter, 
  Car, 
  MapPin,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  Route
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PickupAnalyticsProps {
  onBack: () => void;
}

interface PickupData {
  id: string;
  pickup_date: string;
  car_registration_number: string;
  car_brand: string;
  car_model: string;
  car_year: string;
  final_price: number;
  payment_status: string;
  distance_km: number;
  driver_name: string;
  driver_id: string;
  customer_name: string;
  pickup_address: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  status: string;
  completed_at: string;
}

interface SummaryStats {
  total_pickups: number;
  total_paid_pickups: number;
  total_revenue: number;
  total_distance: number;
  average_price: number;
  unique_drivers: number;
  average_distance: number;
}

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Idag' },
  { value: 'yesterday', label: 'Igår' },
  { value: 'this_week', label: 'Denna vecka' },
  { value: 'last_week', label: 'Förra veckan' },
  { value: 'this_month', label: 'Denna månad' },
  { value: 'last_month', label: 'Förra månaden' },
  { value: 'this_quarter', label: 'Detta kvartal' },
  { value: 'last_quarter', label: 'Förra kvartalet' },
  { value: 'custom', label: 'Anpassad period' }
];

export const PickupAnalyticsOptimized: React.FC<PickupAnalyticsProps> = ({ onBack }) => {
  const [pickups, setPickups] = useState<PickupData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [driverFilter, setDriverFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uniqueDrivers, setUniqueDrivers] = useState<{id: string, name: string}[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch pickups data using optimized database functions
  const fetchPickups = async () => {
    setLoading(true);
    try {
      // Get current user and tenant_id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');

      // Get tenant_id from auth_users table
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('tenant_id')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('No tenant_id found for user');

      const tenantId = userData.tenant_id;

      // Fetch pickup data
      const { data: pickupData, error: pickupError } = await supabase
        .rpc('get_pickup_analytics', {
          p_tenant_id: tenantId,
          p_start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          p_end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          p_driver_id: driverFilter !== 'all' ? driverFilter : null
        });

      if (pickupError) throw pickupError;

      // Fetch summary statistics
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_pickup_analytics_summary', {
          p_tenant_id: tenantId,
          p_start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          p_end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          p_driver_id: driverFilter !== 'all' ? driverFilter : null
        });

      if (summaryError) throw summaryError;

      setPickups(pickupData || []);
      setSummaryStats(summaryData?.[0] || null);

      // Extract unique drivers
      const drivers = new Map();
      (pickupData || []).forEach(pickup => {
        if (pickup.driver_id && pickup.driver_name) {
          drivers.set(pickup.driver_id, pickup.driver_name);
        }
      });
      setUniqueDrivers(Array.from(drivers, ([id, name]) => ({ id, name })));

    } catch (error) {
      console.error('Error fetching pickups:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte hämta upphämtningsdata',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update dates based on period selection
  useEffect(() => {
    const today = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'this_week':
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'last_week':
        const lastWeek = subDays(today, 7);
        setStartDate(startOfWeek(lastWeek, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(lastWeek, { weekStartsOn: 1 }));
        break;
      case 'this_month':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 'last_month':
        const lastMonth = subDays(today, 30);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case 'this_quarter':
        setStartDate(startOfQuarter(today));
        setEndDate(endOfQuarter(today));
        break;
      case 'last_quarter':
        const lastQuarter = subDays(today, 90);
        setStartDate(startOfQuarter(lastQuarter));
        setEndDate(endOfQuarter(lastQuarter));
        break;
    }
  }, [selectedPeriod]);

  // Fetch data when filters change
  useEffect(() => {
    fetchPickups();
  }, [startDate, endDate, driverFilter, user?.tenant_id]);

  // Filter pickups based on search (client-side for responsiveness)
  const filteredPickups = useMemo(() => {
    if (!searchTerm) return pickups;
    
    const search = searchTerm.toLowerCase();
    return pickups.filter(pickup => 
      pickup.car_registration_number?.toLowerCase().includes(search) ||
      pickup.customer_name?.toLowerCase().includes(search) ||
      pickup.car_brand?.toLowerCase().includes(search) ||
      pickup.car_model?.toLowerCase().includes(search)
    );
  }, [pickups, searchTerm]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Datum',
      'Registreringsnummer',
      'Märke',
      'Modell',
      'År',
      'Förare',
      'Kund',
      'Adress',
      'Pris (SEK)',
      'Betalningsstatus',
      'Avstånd (km)'
    ];

    const rows = filteredPickups.map(pickup => [
      format(new Date(pickup.pickup_date), 'yyyy-MM-dd'),
      pickup.car_registration_number || '',
      pickup.car_brand || '',
      pickup.car_model || '',
      pickup.car_year || '',
      pickup.driver_name || 'Ej tilldelad',
      pickup.customer_name || '',
      pickup.pickup_address || '',
      pickup.final_price?.toString() || '0',
      pickup.payment_status === 'paid' || pickup.payment_status === 'completed' ? 'Betald' : 'Väntar',
      pickup.distance_km?.toString() || '0'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `upphämtningar_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Tillbaka
          </Button>
          <h1 className="text-2xl font-bold">Upphämtningsanalys</h1>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportera CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt antal upphämtningar</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.total_pickups || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats?.unique_drivers || 0} förare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total intäkt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(summaryStats?.total_revenue || 0).toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats?.total_paid_pickups || 0} betalda upphämtningar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittligt pris</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(summaryStats?.average_price || 0).toLocaleString('sv-SE')} kr
            </div>
            <p className="text-xs text-muted-foreground">per upphämtning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total körsträcka</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(summaryStats?.total_distance || 0).toLocaleString('sv-SE')} km
            </div>
            <p className="text-xs text-muted-foreground">
              ~{Math.round(summaryStats?.average_distance || 0)} km/upphämtning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Period Filter */}
            <div>
              <label className="text-sm font-medium">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="text-sm font-medium">Från datum</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP', { locale: sv }) : 'Välj datum'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Till datum</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP', { locale: sv }) : 'Välj datum'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Driver Filter */}
            <div>
              <label className="text-sm font-medium">Förare</label>
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla förare</SelectItem>
                  {uniqueDrivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium">Sök</label>
              <Input
                placeholder="Reg.nr, kund, märke..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pickups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upphämtningar</CardTitle>
          <CardDescription>
            Visar {filteredPickups.length} upphämtningar
            {searchTerm && ` (filtrerat från ${pickups.length})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Reg.nr</TableHead>
                    <TableHead>Bil</TableHead>
                    <TableHead>Förare</TableHead>
                    <TableHead>Kund</TableHead>
                    <TableHead>Adress</TableHead>
                    <TableHead className="text-right">Pris</TableHead>
                    <TableHead className="text-right">Avstånd</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPickups.map((pickup) => (
                    <TableRow key={pickup.id}>
                      <TableCell>
                        {format(new Date(pickup.pickup_date), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {pickup.car_registration_number}
                      </TableCell>
                      <TableCell>
                        {[pickup.car_brand, pickup.car_model, pickup.car_year]
                          .filter(Boolean)
                          .join(' ')}
                      </TableCell>
                      <TableCell>{pickup.driver_name || 'Ej tilldelad'}</TableCell>
                      <TableCell>{pickup.customer_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {pickup.pickup_address}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(pickup.final_price || 0).toLocaleString('sv-SE')} kr
                      </TableCell>
                      <TableCell className="text-right">
                        {pickup.distance_km ? `${pickup.distance_km} km` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            pickup.payment_status === 'paid' || pickup.payment_status === 'completed' 
                              ? 'success' 
                              : 'secondary'
                          }
                        >
                          {pickup.payment_status === 'paid' || pickup.payment_status === 'completed' 
                            ? 'Betald' 
                            : 'Väntar'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredPickups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Inga upphämtningar hittades för den valda perioden
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};