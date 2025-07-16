import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/Common/StatusBadge';
import { Building2, Users, TrendingUp, Settings, MoreHorizontal } from 'lucide-react';

interface TenantCardProps {
  tenant: {
    id: string;
    name: string;
    plan: string;
    status: string;
    monthlyRevenue: string;
    userCount: number;
    country: string;
    joinDate: string;
  };
  onViewDetails?: (tenantId: string) => void;
  onManageUsers?: (tenantId: string) => void;
  onViewAnalytics?: (tenantId: string) => void;
}

const TenantCard: React.FC<TenantCardProps> = ({ tenant, onViewDetails, onManageUsers, onViewAnalytics }) => {
  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'starter':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCountryFlag = (country: string) => {
    switch (country.toLowerCase()) {
      case 'sweden':
      case 'se':
        return '🇸🇪';
      case 'norway':
      case 'no':
        return '🇳🇴';
      case 'denmark':
      case 'dk':
        return '🇩🇰';
      default:
        return '🌍';
    }
  };

  return (
    <Card className="hover:shadow-custom-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-admin-accent rounded-full">
              <Building2 className="h-5 w-5 text-admin-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{tenant.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span>{getCountryFlag(tenant.country)}</span>
                <span>Joined {tenant.joinDate}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={tenant.status} />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-admin-primary">{tenant.monthlyRevenue}</div>
            <div className="text-xs text-muted-foreground">Monthly Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{tenant.userCount}</div>
            <div className="text-xs text-muted-foreground">Users</div>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(tenant.plan)}`}>
              {tenant.plan}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Plan</div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(tenant.id)}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-1" />
            Manage
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageUsers?.(tenant.id)}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Users
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewAnalytics?.(tenant.id)}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantCard;