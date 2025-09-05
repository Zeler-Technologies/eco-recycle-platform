import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Plus, Settings, Globe, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TenantConfigCard } from "./TenantConfiguration/TenantConfigCard";
import { ConfigurationModal } from "./TenantConfiguration/ConfigurationModal";
import { GlobalConfigPanel } from "./TenantConfiguration/GlobalConfigPanel";
import { NewTenantModal } from "./TenantConfiguration/NewTenantModal";
import { ConflictDetectionPanel } from "./TenantConfiguration/ConflictDetectionPanel";
import { useTenantConfigurations } from "@/hooks/useTenantConfigurations";

interface TenantWithConfig {
  tenant_id: number;
  name: string;
  country: string;
  configurations: any[];
  status: 'complete' | 'partial' | 'missing' | 'conflict';
}

export const TenantConfigurationDashboard: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tenants");
  const { toast } = useToast();

  const {
    tenants,
    globalConfigs,
    conflicts,
    loading,
    fetchTenants,
    fetchGlobalConfigs,
    detectConflicts,
    updateTenantConfiguration,
    createTenantWithDefaults
  } = useTenantConfigurations();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchTenants(),
      fetchGlobalConfigs(),
      detectConflicts()
    ]);
  };

  const handleEditTenant = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfiguration = async (tenantId: number, updates: any[]) => {
    try {
      for (const update of updates) {
        const result = await updateTenantConfiguration(
          tenantId,
          update.category,
          update.key,
          update.value
        );
        
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      toast({
        title: "Configuration Updated",
        description: "Tenant configuration has been successfully updated.",
      });

      setIsConfigModalOpen(false);
      setSelectedTenant(null);
      await loadData();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTenant = async (tenantData: any) => {
    try {
      const result = await createTenantWithDefaults(tenantData);
      
      if (result.success) {
        toast({
          title: "Tenant Created",
          description: `${tenantData.name} has been created with default configurations.`,
        });
        
        setIsNewTenantModalOpen(false);
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getOverallStatus = () => {
    if (loading) return { icon: Settings, text: "Loading...", variant: "secondary" };
    
    const conflictCount = conflicts.length;
    const incompleteCount = tenants.filter(t => t.status !== 'complete').length;
    
    if (conflictCount > 0) {
      return { 
        icon: XCircle, 
        text: `${conflictCount} Conflicts`, 
        variant: "destructive" 
      };
    }
    
    if (incompleteCount > 0) {
      return { 
        icon: AlertTriangle, 
        text: `${incompleteCount} Incomplete`, 
        variant: "warning" 
      };
    }
    
    return { 
      icon: CheckCircle, 
      text: "All Configured", 
      variant: "success" 
    };
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading tenant configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenant Configuration Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage billing configurations, currencies, and settings for all tenants
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={status.variant as any} className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            {status.text}
          </Badge>
          
          <Button onClick={() => setIsNewTenantModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Tenant
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Configured</p>
                <p className="text-2xl font-bold text-green-600">
                  {tenants.filter(t => t.status === 'complete').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold text-red-600">{conflicts.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Global Configs</p>
                <p className="text-2xl font-bold">{globalConfigs.length}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tenants">Tenant Configurations</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="conflicts">Conflict Resolution</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
              <TenantConfigCard
                key={tenant.tenant_id}
                tenant={tenant}
                configurations={tenant.configurations}
                onEdit={handleEditTenant}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <GlobalConfigPanel
            globalConfigs={globalConfigs}
            onUpdate={async (category, key, value) => {
              const result = await updateTenantConfiguration(null, category, key, value);
              if (result.success) {
                toast({
                  title: "Global Configuration Updated",
                  description: "Global setting has been successfully updated.",
                });
                await loadData();
              } else {
                toast({
                  title: "Update Failed",
                  description: result.error,
                  variant: "destructive",
                });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <ConflictDetectionPanel
            conflicts={conflicts}
            onResolve={async () => {
              await loadData();
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ConfigurationModal
        tenant={selectedTenant}
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedTenant(null);
        }}
        onSave={(updates) => handleSaveConfiguration(selectedTenant?.tenant_id, updates)}
        existingConfigs={selectedTenant?.configurations || []}
      />

      <NewTenantModal
        isOpen={isNewTenantModalOpen}
        onClose={() => setIsNewTenantModalOpen(false)}
        onSave={handleCreateTenant}
      />
    </div>
  );
};