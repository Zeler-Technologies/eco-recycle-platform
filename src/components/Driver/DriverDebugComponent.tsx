import React from 'react';
import { useDriverIntegration } from '@/hooks/useDriverIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export const DriverDebugComponent: React.FC = () => {
  const {
    driver,
    pickups,
    statusHistory,
    loading,
    error,
    historyLoading,
    updateDriverStatus,
    refreshData
  } = useDriverIntegration();

  const handleStatusChange = async (newStatus: string) => {
    if (!driver?.driver_id) return;
    
    try {
      await updateDriverStatus(driver.driver_id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading driver data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-red-200">
        <CardContent className="flex items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-700">{error}</span>
          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm" 
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Driver Data Debug Panel</h2>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Driver Information */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          {driver ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>ID:</strong> {driver.driver_id}
              </div>
              <div>
                <strong>Name:</strong> {driver.full_name}
              </div>
              <div>
                <strong>Email:</strong> {driver.email || 'N/A'}
              </div>
              <div>
                <strong>Phone:</strong> {driver.phone_number}
              </div>
              <div>
                <strong>Vehicle:</strong> {driver.vehicle_type || 'N/A'}
              </div>
              <div>
                <strong>Registration:</strong> {driver.vehicle_registration || 'N/A'}
              </div>
              <div>
                <strong>Status:</strong> 
                <Badge variant="outline" className="ml-2">
                  {driver.status}
                </Badge>
              </div>
              <div>
                <strong>Tenant ID:</strong> {driver.tenant_id}
              </div>
              <div>
                <strong>Is Active:</strong> {driver.is_active ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Created:</strong> {new Date(driver.created_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No driver data found</p>
          )}
        </CardContent>
      </Card>

      {/* Status Control */}
      {driver && (
        <Card>
          <CardHeader>
            <CardTitle>Status Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {['available', 'busy', 'break', 'offline'].map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  variant={driver.status === status ? 'default' : 'outline'}
                  size="sm"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pickup Orders ({pickups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pickups.length > 0 ? (
            <div className="space-y-4">
              {pickups.map((pickup) => (
                <div key={pickup.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>ID:</strong> {pickup.id}</div>
                    <div><strong>Status:</strong> <Badge variant="outline">{pickup.status}</Badge></div>
                    <div><strong>Car:</strong> {pickup.car_brand} {pickup.car_model}</div>
                    <div><strong>Registration:</strong> {pickup.car_registration_number}</div>
                    <div><strong>Owner:</strong> {pickup.owner_name}</div>
                    <div><strong>Address:</strong> {pickup.pickup_address}</div>
                    <div><strong>Price:</strong> {pickup.final_price ? `${pickup.final_price} SEK` : 'N/A'}</div>
                    <div><strong>Created:</strong> {new Date(pickup.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No pickup orders found</p>
          )}
        </CardContent>
      </Card>

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle>
            Status History ({statusHistory.length})
            {historyLoading && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusHistory.length > 0 ? (
            <div className="space-y-2">
              {statusHistory.map((item) => (
                <div key={item.id} className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {item.old_status || 'N/A'} → {item.new_status}
                      </Badge>
                      {item.reason && <span className="text-sm text-gray-600">{item.reason}</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.changed_at).toLocaleString()}
                    </div>
                  </div>
                  {item.source && (
                    <div className="text-xs text-gray-400 mt-1">
                      Source: {item.source}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No status history found</p>
          )}
        </CardContent>
      </Card>

      {/* Raw Data (for debugging) */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (for debugging)</CardTitle>
        </CardHeader>
        <CardContent>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Click to view raw data</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
              {JSON.stringify({ driver, pickups, statusHistory }, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};