import { useEffect, useState } from 'react';
import { DRIVER_STATUS_MAP } from '@/constants/driverAppConstants';
import { supabase } from '@/integrations/supabase/client';

type StatusRow = {
  old_status: string | null;
  new_status: string;
  changed_at: string;
  source: string | null;
  reason: string | null;
};

export default function RecentStatusChanges({ driverId }: { driverId: string }) {
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('driver_status_history')
      .select('old_status, new_status, changed_at, source, reason')
      .eq('driver_id', driverId)
      .order('changed_at', { ascending: false })
      .limit(10);
    if (!error && data) setRows(data as StatusRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!driverId) return;
    load();
    const ch = supabase
      .channel(`dsh-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_status_history',
          filter: `driver_id=eq.${driverId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [driverId]);

  if (!driverId) return null;

  if (loading) {
    return <div className="text-sm text-gray-500">Laddar senaste statusändringar…</div>;
  }

  if (!rows.length) {
    return <div className="text-sm text-gray-500">Inga ändringar än.</div>;
  }

  return (
    <div className="px-4 mb-4">
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Senaste statusändringar</h3>
        <ul className="space-y-2">
          {rows.map((r, i) => {
            const oldOpt = (r.old_status && DRIVER_STATUS_MAP[r.old_status as keyof typeof DRIVER_STATUS_MAP]) || DRIVER_STATUS_MAP['offline'];
            const newOpt = DRIVER_STATUS_MAP[r.new_status as keyof typeof DRIVER_STATUS_MAP] || DRIVER_STATUS_MAP['offline'];
            const when = new Date(r.changed_at).toLocaleString('sv-SE');
            return (
              <li key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${oldOpt.badgeClass}`}>
                    <span className={`h-2 w-2 rounded-full ${oldOpt.dotClass}`} /> {oldOpt.label}
                  </span>
                  <span className="text-gray-500 text-xs">→</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${newOpt.badgeClass}`}>
                    <span className={`h-2 w-2 rounded-full ${newOpt.dotClass}`} /> {newOpt.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">{when}</div>
                  {r.reason && <div className="text-xs text-gray-500">{r.reason}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
