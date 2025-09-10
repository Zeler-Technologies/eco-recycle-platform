import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverStatusIndicatorProps {
  driver: {
    id: string;
    current_status?: string;
    driver_status?: string;
    last_activity_update?: string;
  };
  showLabel?: boolean;
}

const DriverStatusIndicator: React.FC<DriverStatusIndicatorProps> = ({ driver, showLabel = true }) => {
  const [status, setStatus] = useState(driver.driver_status || driver.current_status || 'offline');
  const [lastSeen, setLastSeen] = useState(driver.last_activity_update);

  useEffect(() => {
    if (!driver?.id) return;

    // Subscribe to real-time updates for this driver
    const subscription = supabase
      .channel(`driver-status-${driver.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'drivers',
        filter: `id=eq.${driver.id}`
      }, (payload) => {
        console.log('Driver status real-time update:', payload);
        const newData = payload.new as any;
        setStatus(newData.driver_status || newData.current_status);
        setLastSeen(newData.last_activity_update || newData.status_updated_at);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'driver_status_history',
        filter: `driver_id=eq.${driver.id}`
      }, (payload) => {
        console.log('Driver status history update:', payload);
        const newData = payload.new as any;
        setStatus(newData.new_status);
        setLastSeen(newData.changed_at);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [driver?.id]);

  const getStatusInfo = (status: string, lastSeen?: string) => {
    const now = new Date();
    const lastActivity = lastSeen ? new Date(lastSeen) : new Date(0);
    const minutesAgo = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));

    if (minutesAgo > 15) {
      return { 
        status: 'offline', 
        label: 'Offline', 
        color: 'bg-gray-500',
        time: `${minutesAgo}m sedan`
      };
    }

    const statusMap: Record<string, { label: string; color: string }> = {
      'available': { label: 'Tillgänglig', color: 'bg-green-500' },
      'busy': { label: 'Upptagen', color: 'bg-red-500' },
      'offline': { label: 'Offline', color: 'bg-gray-500' },
      'active': { label: 'Aktiv', color: 'bg-green-500' },
      'on_break': { label: 'Paus', color: 'bg-blue-500' }
    };

    return {
      ...statusMap[status] || statusMap.offline,
      time: minutesAgo < 1 ? 'Just nu' : `${minutesAgo}m sedan`
    };
  };

  const statusInfo = getStatusInfo(status, lastSeen);

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
      {showLabel && (
        <div>
          <span className="font-medium text-sm">{statusInfo.label}</span>
          <span className="text-xs text-gray-500 ml-2">{statusInfo.time}</span>
        </div>
      )}
    </div>
  );
};

export default DriverStatusIndicator;