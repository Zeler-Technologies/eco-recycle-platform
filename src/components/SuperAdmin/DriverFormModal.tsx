
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, User, Phone, Mail, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  vehicle_registration?: string;
  vehicle_type?: string;
  is_active: boolean;
  tenant_id: number;
  scrapyard_id?: number | null;
  max_capacity_kg?: number;
}

interface DriverFormModalProps {
  driver?: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DriverFormModal: React.FC<DriverFormModalProps> = ({ driver, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    vehicle_registration: '',
    vehicle_type: '',
    max_capacity_kg: 1000,
    is_active: true,
    tenant_id: 1,
    scrapyard_id: null as number | null,
  });
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [scrapyards, setScrapyards] = useState<any[]>([]);
  const [scrapyardsLoading, setScrapyardsLoading] = useState(false);

  useEffect(() => {
    fetchTenants();
    if (driver) {
      setFormData({
        full_name: driver.full_name,
        phone_number: driver.phone_number,
        email: driver.email || '',
        vehicle_registration: driver.vehicle_registration || '',
        vehicle_type: driver.vehicle_type || '',
        max_capacity_kg: driver.max_capacity_kg || 1000,
        is_active: driver.is_active,
        tenant_id: driver.tenant_id,
        scrapyard_id: driver.scrapyard_id ?? null,
      });
      fetchScrapyards(driver.tenant_id);
    } else if (user?.role === 'tenant_admin' && user.tenant_id) {
      // Pre-fill tenant for tenant admins
      const tenantId = Number(user.tenant_id);
      setFormData(prev => ({
        ...prev,
        tenant_id: tenantId,
      }));
      fetchScrapyards(tenantId, true);
    }
  }, [driver, user]);

  const fetchTenants = async () => {
    try {
      setTenantsLoading(true);
      let query = supabase.from('tenants').select('tenants_id, name');
      if (user?.role === 'tenant_admin' && user.tenant_id) {
        query = query.eq('tenants_id', Number(user.tenant_id));
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching tenants:', error);
        return;
      }
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setTenantsLoading(false);
    }
  };

  const fetchScrapyards = async (tenantId: number, autoAssignIfSingle: boolean = false) => {
    try {
      setScrapyardsLoading(true);
      let query = supabase.from('scrapyards' as any).select('id, name, tenant_id').eq('tenant_id', tenantId);
      const { data, error } = await query.order('name', { ascending: true });
      if (error) {
        console.error('Error fetching scrapyards:', error);
        setScrapyards([]);
        return;
      }
      const list = (data as any[]) || [];
      setScrapyards(list);
      if (autoAssignIfSingle && list.length === 1) {
        setFormData(prev => ({ ...prev, scrapyard_id: (list[0] as any).id }));
      }
    } catch (error) {
      console.error('Error fetching scrapyards:', error);
      setScrapyards([]);
    } finally {
      setScrapyardsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enforce tenant for tenant_admins regardless of UI state
      const payload = { ...formData } as any;
      if (user?.role === 'tenant_admin' && user.tenant_id) {
        payload.tenant_id = Number(user.tenant_id);
      }
      // Ensure scrapyard_id is set for tenant_admins when only one scrapyard exists
      if (!payload.scrapyard_id && scrapyards.length === 1) {
        payload.scrapyard_id = scrapyards[0].id;
      }
      // tenant_id should match selected scrapyard's tenant if provided
      if (payload.scrapyard_id && tenants.length) {
        const selectedScrapyard = scrapyards.find(s => s.id === payload.scrapyard_id);
        if (selectedScrapyard) payload.tenant_id = selectedScrapyard.tenant_id;
      }

      if (driver) {
        // Update existing driver
        const { error } = await supabase
          .from('drivers' as any)
          .update(payload)
          .eq('id', driver.id);

        if (error) throw error;
        toast.success('Driver updated successfully');
      } else {
        // Create new driver
        const { error } = await supabase
          .from('drivers' as any)
          .insert([payload]);

        if (error) throw error;
        toast.success('Driver created successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving driver:', error);
      const message = error?.message || `Failed to ${driver ? 'update' : 'create'} driver`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-admin-primary">
            {driver ? 'Edit Driver' : 'Add New Driver'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter driver's full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tenant_id">Tenant *</Label>
                  {user?.role === 'tenant_admin' ? (
                    <Input
                      id="tenant_id"
                      value={
                        tenantsLoading
                          ? 'Loading...'
                          : tenants.find(t => t.tenants_id === Number(formData.tenant_id))?.name ||
                            tenants[0]?.name ||
                            'No tenant found'
                      }
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                  ) : (
                    <select
                      id="tenant_id"
                      value={formData.tenant_id}
                      onChange={(e) => {
                        const newTenantId = Number(e.target.value);
                        setFormData({ ...formData, tenant_id: newTenantId, scrapyard_id: null });
                        fetchScrapyards(newTenantId);
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                      disabled={tenantsLoading}
                    >
                      <option value="">Select tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.tenants_id} value={tenant.tenants_id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scrapyard_id">Scrapyard *</Label>
                  <select
                    id="scrapyard_id"
                    value={formData.scrapyard_id ?? ''}
                    onChange={(e) => setFormData({ ...formData, scrapyard_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={scrapyardsLoading || !formData.tenant_id}
                  >
                    <option value="">Select scrapyard</option>
                    {scrapyards.map((yard) => (
                      <option key={yard.id} value={yard.id}>
                        {yard.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_registration">Registration Number</Label>
                  <Input
                    id="vehicle_registration"
                    value={formData.vehicle_registration}
                    onChange={(e) => setFormData({ ...formData, vehicle_registration: e.target.value })}
                    placeholder="e.g. ABC123"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <select
                    id="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select vehicle type</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="pickup">Pickup</option>
                    <option value="trailer">Trailer</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_capacity_kg">Max Capacity (kg)</Label>
                  <Input
                    id="max_capacity_kg"
                    type="number"
                    value={formData.max_capacity_kg}
                    onChange={(e) => setFormData({ ...formData, max_capacity_kg: Number(e.target.value) })}
                    placeholder="1000"
                    min="100"
                    max="50000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <select
                    id="is_active"
                    value={formData.is_active.toString()}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-admin-primary hover:bg-admin-primary/90"
              >
                {loading ? 'Saving...' : (driver ? 'Update Driver' : 'Create Driver')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverFormModal;
