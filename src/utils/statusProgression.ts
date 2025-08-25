// Swedish Scrapyard Status Progression Logic
// Correct workflow: pending → scheduled → assigned → in_progress → completed

export const getNextStatus = (currentStatus: string): string | null => {
  switch (currentStatus) {
    case 'pending':
      return 'scheduled';
    case 'scheduled':
      return 'assigned';
    case 'assigned':
      return 'in_progress';
    case 'in_progress':
      return 'completed';
    default:
      return null;
  }
};

export const getStatusButtonText = (currentStatus: string): string | null => {
  switch (currentStatus) {
    case 'assigned':
      return 'Starta upphämtning'; // "Start pickup"
    case 'in_progress':
      return 'Slutför upphämtning'; // "Complete pickup"
    default:
      return null;
  }
};

export const canProgressStatus = (status: string): boolean => {
  return ['assigned', 'in_progress'].includes(status);
};

export const isValidStatusTransition = (from: string, to: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    pending: ['scheduled', 'cancelled'],
    scheduled: ['assigned', 'cancelled'],
    assigned: ['in_progress', 'rejected', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['scheduled'], // For reactivation
    rejected: ['scheduled']   // For reassignment
  };
  
  return validTransitions[from]?.includes(to) || false;
};