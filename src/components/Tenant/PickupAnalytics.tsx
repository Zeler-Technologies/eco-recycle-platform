import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatsCard from '@/components/Common/StatsCard';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { CalendarDays, TrendingUp, DollarSign, Package } from 'lucide-react';

interface PickupStats {
  totalPickups: number;
  completedPickups: number;
  pendingPickups: number;
  cancelledPickups: number;
  totalRevenue: number;
  averageValue: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

export const PickupAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PickupStats | null>(null);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [dailyPickups, setDailyPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    if (user?.tenant_id) {
      fetchAnalytics();
    }
  }, [user?.tenant_id, selectedPeriod]);

  const fetchAnalytics = async () => {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

      // Fetch pickup stats
      const { data: pickups, error: pickupsError } = await supabase
        .from('customer_requests')
        .select('status, quote_amount, created_at')
        .eq('tenant_id', user.tenant_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (pickupsError) throw pickupsError;

      // Calculate stats
      const totalPickups = pickups?.length || 0;
      const completedPickups = pickups?.filter(p => p.status === 'completed').length || 0;
      const pendingPickups = pickups?.filter(p => p.status === 'pending').length || 0;
      const cancelledPickups = pickups?.filter(p => p.status === 'cancelled').length || 0;
      const totalRevenue = pickups?.reduce((sum, p) => sum + (p.quote_amount || 0), 0) || 0;
      const averageValue = totalPickups > 0 ? totalRevenue / totalPickups : 0;

      setStats({
        totalPickups,
        completedPickups,
        pendingPickups,
        cancelledPickups,
        totalRevenue,
        averageValue
      });

      // Status distribution
      const statusCounts = pickups?.reduce((acc, pickup) => {
        acc[pickup.status] = (acc[pickup.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const distribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      setStatusDistribution(distribution);

      // Daily pickups (last 7 days)
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayPickups = pickups?.filter(p => {
          const pickupDate = new Date(p.created_at);
          return pickupDate >= dayStart && pickupDate <= dayEnd;
        }).length || 0;

        dailyData.push({
          date: dayStart.toLocaleDateString('sv-SE'),
          pickups: dayPickups
        });
      }

      setDailyPickups(dailyData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner message="Laddar analytics..." />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pickup Analytics</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Senaste 7 dagarna</SelectItem>
            <SelectItem value="30">Senaste 30 dagarna</SelectItem>
            <SelectItem value="90">Senaste 90 dagarna</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Totala upphämtningar"
          value={stats.totalPickups.toString()}
          icon={Package}
          trend="up"
        />
        <StatsCard
          title="Genomförda"
          value={stats.completedPickups.toString()}
          icon={TrendingUp}
          trend="up"
        />
        <StatsCard
          title="Total intäkt"
          value={`${stats.totalRevenue.toLocaleString('sv-SE')} kr`}
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title="Genomsnittsvärde"
          value={`${Math.round(stats.averageValue).toLocaleString('sv-SE')} kr`}
          icon={CalendarDays}
          trend="neutral"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="status">Status fördelning</TabsTrigger>
          <TabsTrigger value="daily">Daglig trend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Genomförandegrad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {stats.totalPickups > 0 
                    ? Math.round((stats.completedPickups / stats.totalPickups) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.completedPickups} av {stats.totalPickups} upphämtningar genomförda
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Väntande upphämtningar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">
                  {stats.pendingPickups}
                </div>
                <p className="text-sm text-muted-foreground">
                  Kräver åtgärd
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status fördelning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex justify-between items-center">
                    <span className="capitalize">{item.status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ 
                            width: `${(item.count / stats.totalPickups) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daglig trend (senaste 7 dagarna)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyPickups.map((day) => (
                  <div key={day.date} className="flex justify-between items-center">
                    <span className="text-sm">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ 
                            width: `${Math.max(10, (day.pickups / Math.max(...dailyPickups.map(d => d.pickups), 1)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6">{day.pickups}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};