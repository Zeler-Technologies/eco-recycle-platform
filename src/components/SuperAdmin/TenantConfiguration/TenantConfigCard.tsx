import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Settings, MapPin } from "lucide-react";

interface TenantConfigCardProps {
  tenant: {
    tenant_id: number;
    name: string;
    country: string;
    status: 'complete' | 'partial' | 'missing' | 'conflict';
  };
  configurations: any[];
  onEdit: (tenant: any) => void;
}

export const TenantConfigCard: React.FC<TenantConfigCardProps> = ({ 
  tenant, 
  configurations, 
  onEdit 
}) => {
  const getConfigValue = (category: string, key: string) => {
    const config = configurations.find(c => 
      c.config_category === category && c.config_key === key
    );
    return config?.config_value || null;
  };

  const getStatusDisplay = () => {
    switch (tenant.status) {
      case 'complete':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: { variant: 'default', text: 'Complete' }
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: { variant: 'secondary', text: 'Partial' }
        };
      case 'missing':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: { variant: 'destructive', text: 'Missing' }
        };
      case 'conflict':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          badge: { variant: 'outline', text: 'Conflict' }
        };
      default:
        return {
          icon: Settings,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: { variant: 'secondary', text: 'Unknown' }
        };
    }
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  // Get configuration details
  const currency = getConfigValue('general', 'currency')?.currency || 'Not set';
  const locale = getConfigValue('general', 'locale')?.locale || 'Not set';
  const fromEmail = getConfigValue('email', 'from_email')?.from_email || 'Not set';
  const billingCycle = getConfigValue('general', 'billing_cycle')?.billing_cycle || 'Not set';
  const timezone = getConfigValue('general', 'timezone')?.timezone || 'Not set';

  // Count configured vs required settings
  const requiredSettings = ['general/currency', 'general/locale', 'email/from_email'];
  const configuredSettings = configurations.filter(config => 
    requiredSettings.includes(`${config.config_category}/${config.config_key}`)
  ).length;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${status.border} ${status.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{tenant.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {tenant.country}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusIcon className={`h-6 w-6 ${status.color}`} />
            <Badge variant={status.badge.variant as any} className="text-xs">
              {status.badge.text}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Configuration</span>
            <span className="font-medium">{configuredSettings}/{requiredSettings.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                configuredSettings === requiredSettings.length 
                  ? 'bg-green-500' 
                  : configuredSettings > 0 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${(configuredSettings / requiredSettings.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Configuration Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium">Currency</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {currency}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium">Locale</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {locale}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium">Billing</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {billingCycle}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium">Timezone</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
              {timezone.split('/').pop() || timezone}
            </p>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium text-sm">Email From</p>
          <p className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
            {fromEmail}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Button 
            onClick={() => onEdit(tenant)}
            className="w-full"
            variant={tenant.status === 'complete' ? 'outline' : 'default'}
          >
            <Settings className="h-4 w-4 mr-2" />
            {tenant.status === 'complete' ? 'Modify Configuration' : 'Configure Tenant'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};