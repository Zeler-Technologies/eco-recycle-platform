
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Users, Navigation } from 'lucide-react';
import DriverTrackingMap from '@/components/Common/DriverTrackingMap';

interface Driver {
  id: string;
  full_name: string;
  driver_status: string;
  current_latitude?: number;
  current_longitude?: number;
  vehicle_type?: string;
  phone_number: string;
}

interface DriverLocationMapProps {
  drivers: Driver[];
  onBack: () => void;
}

const DriverLocationMap: React.FC<DriverLocationMapProps> = ({ drivers, onBack }) => {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const driversWithLocation = drivers.filter(d => d.current_latitude && d.current_longitude);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-status-completed';
      case 'busy': return 'bg-status-processing';
      case 'offline': return 'bg-muted';
      case 'break': return 'bg-status-pending';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '🟢';
      case 'busy': return '🟡';
      case 'offline': return '⚫';
      case 'break': return '🟠';
      default: return '⚪';
    }
  };

  return (
    <div className="theme-admin min-h-screen bg-admin-muted">
      {/* Header */}
      <header className="bg-admin-primary text-admin-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-admin-primary-foreground hover:text-admin-primary-foreground/80 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>← Back to Fleet</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-admin-primary-foreground/80">
                  {driversWithLocation.length} of {drivers.length} drivers with location data
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold">Live Driver Locations</h1>
            <p className="text-admin-primary-foreground/80">Real-time tracking of your fleet</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Placeholder - In a real implementation, this would be a proper map */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-custom-sm h-[600px]">
              <CardHeader>
                <CardTitle className="text-admin-primary flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <DriverTrackingMap
                  drivers={driversWithLocation}
                  onDriverSelect={setSelectedDriver}
                  selectedDriver={selectedDriver}
                />
              </CardContent>
            </Card>
          </div>

          {/* Driver List Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-admin-primary flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {driversWithLocation.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No drivers with location data
                    </div>
                  ) : (
                    driversWithLocation.map((driver) => (
                      <div
                        key={driver.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedDriver?.id === driver.id 
                            ? 'bg-admin-accent/30 border-admin-primary' 
                            : 'hover:bg-admin-accent/10'
                        }`}
                        onClick={() => setSelectedDriver(selectedDriver?.id === driver.id ? null : driver)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{driver.full_name}</h4>
                          <Badge className={`${getStatusColor(driver.driver_status)} text-white text-xs`}>
                            {driver.driver_status}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>{driver.vehicle_type || 'Vehicle'}</div>
                          <div>{driver.phone_number}</div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {driver.current_latitude?.toFixed(4)}, {driver.current_longitude?.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="bg-white shadow-custom-sm mt-4">
              <CardHeader>
                <CardTitle className="text-admin-primary text-sm">Status Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-completed"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-processing"></div>
                    <span>Busy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-pending"></div>
                    <span>On Break</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted"></div>
                    <span>Offline</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLocationMap;
