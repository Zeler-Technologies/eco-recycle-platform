import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/Common/StatusBadge';
import { Car, MapPin, Calendar, Phone, Euro } from 'lucide-react';

interface OrderCardProps {
  order: {
    id: string;
    customer: string;
    phone?: string;
    vehicle: string;
    location: string;
    status: string;
    price: string;
    scheduledDate?: string;
    priority?: 'high' | 'medium' | 'low';
  };
  onViewDetails?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails, onUpdateStatus }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-destructive';
      case 'medium':
        return 'border-l-4 border-l-warning';
      case 'low':
        return 'border-l-4 border-l-success';
      default:
        return 'border-l-4 border-l-muted';
    }
  };

  return (
    <Card className={`hover:shadow-custom-md transition-shadow ${getPriorityColor(order.priority)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-tenant-primary">{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{order.price}</p>
            <p className="text-xs text-muted-foreground">Uppskattad</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.vehicle}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{order.location}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.customer}</span>
            </div>
            {order.scheduledDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{order.scheduledDate}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(order.id)}
            className="flex-1"
          >
            Visa detaljer
          </Button>
          {order.status === 'Ny' && (
            <Button
              variant="tenant"
              size="sm"
              onClick={() => onUpdateStatus?.(order.id, 'Pågående')}
              className="flex-1"
            >
              Starta ärende
            </Button>
          )}
          {order.status === 'Pågående' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onUpdateStatus?.(order.id, 'Klar')}
              className="flex-1"
            >
              Markera klar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;