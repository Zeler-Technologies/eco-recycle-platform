import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'default', className }) => {
  const getStatusStyles = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'new':
      case 'ny':
      case 'nya':
        return 'bg-status-new text-white border-status-new';
      case 'processing':
      case 'pågående':
      case 'in_progress':
        return 'bg-status-processing text-white border-status-processing';
      case 'completed':
      case 'klar':
      case 'klara':
        return 'bg-status-completed text-white border-status-completed';
      case 'cancelled':
      case 'avbruten':
        return 'bg-status-cancelled text-white border-status-cancelled';
      case 'pending':
      case 'hämtas':
      case 'schemalagd':
        return 'bg-status-pending text-white border-status-pending';
      case 'active':
      case 'aktiv':
        return 'bg-success text-white border-success';
      case 'inactive':
      case 'inaktiv':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const statusStyles = getStatusStyles(status);
  
  const getSwedishStatus = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'new':
      case 'pending':
        return 'Ny';
      case 'assigned':
        return 'Tilldelad';
      case 'processing':
      case 'in_progress':
        return 'Pågående';
      case 'completed':
        return 'Klar';
      case 'cancelled':
        return 'Avbruten';
      case 'scheduled':
        return 'Schemalagd';
      case 'confirmed':
        return 'Bekräftad';
      case 'active':
        return 'Aktiv';
      case 'inactive':
        return 'Inaktiv';
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant={variant}
      className={cn(
        variant === 'default' ? statusStyles : `text-${statusStyles.split(' ')[0].replace('bg-', '')} border-${statusStyles.split(' ')[2].replace('border-', '')}`,
        className
      )}
    >
      {getSwedishStatus(status)}
    </Badge>
  );
};

export default StatusBadge;