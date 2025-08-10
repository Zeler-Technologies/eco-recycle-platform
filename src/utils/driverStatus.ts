export type DriverStatus = 'available' | 'busy' | 'break' | 'offline';

export function normalizeDriverStatus(status?: string | null): DriverStatus {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'available':
    case 'on_duty':
      return 'available';
    case 'busy':
    case 'on_job':
    case 'in_progress':
      return 'busy';
    case 'break':
    case 'rest':
      return 'break';
    case 'offline':
    case 'off_duty':
    case 'inactive':
    default:
      return 'offline';
  }
}
