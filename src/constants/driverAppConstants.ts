// Driver App Constants and Translations (TypeScript)
export type DriverStatus = 'available' | 'busy' | 'break' | 'offline';

// Task statuses (pickups) - corrected Swedish translations
export const STATUS_TEXTS = {
  pending: 'Ny förfrågan',
  scheduled: 'Väntar på upphämtning',
  assigned: 'Tilldelad',
  in_progress: 'Pågående',
  completed: 'Slutförd',
  cancelled: 'Avbruten',
  rejected: 'Avvisad',
} as const;

// Note: left as hex for existing UI usage; pickup status colors are out of scope here
export const STATUS_COLORS = {
  pending: '#f59e0b',
  scheduled: '#6366f1',
  assigned: '#8b5cf6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
  rejected: '#ef4444',
} as const;

export const DRIVER_STATUS_TEXTS: Record<DriverStatus, string> = {
  available: 'Tillgänglig',
  busy: 'Upptagen',
  break: 'Rast',
  offline: 'Offline',
};

export const FILTER_OPTIONS = [
  { key: 'all', label: 'Alla' },
  { key: 'pending', label: 'Ny förfrågan' },
  { key: 'scheduled', label: 'Schemalagd' },
  { key: 'assigned', label: 'Tilldelad' },
  { key: 'in_progress', label: 'Pågående' },
  { key: 'completed', label: 'Slutförd' },
] as const;

export const UI_LABELS = {
  loading: 'Laddar...',
  noDriverFound: 'Ingen förare hittades',
  tryAgain: 'Försök igen eller kontakta administratören',
  contactAdmin: 'Kontakta administratören för att skapa ditt förarkonto',
  tasks: 'uppdrag',
  filterAndSort: 'Filtrera och sortera',
  filterByStatus: 'Filtrera efter status:',
  noTasksToShow: 'Inga uppdrag att visa',
  estimatedDistance: 'Uppskattad sträcka',
  estimatedTime: 'Uppskattad tid',
  optimizeRoute: 'Optimera rutt',
  googleMapsIntegration: 'Google Maps Integration',
  showOnMap: 'Visa på kartan',
  backToList: 'Tillbaka till listan',
  customer: 'Kund',
  name: 'Namn',
  address: 'Adress',
  status: 'Status',
  startPickup: 'Starta upphämtning',
  completePickup: 'Slutför upphämtning',
  navigate: 'Navigera',
  finalPrice: 'Slutpris',
  notDetermined: 'Ej bestämt',
  recentStatusChanges: 'Senaste statusändringar',
  noStatusHistory: 'Inga statusändringar ännu',
  reason: 'Orsak',
  changedAt: 'Ändrad',
} as const;

export const ARIA_LABELS = {
  toggleFilters: 'Växla filter och sortering',
  statusDropdown: 'Välj förarstatus',
  mapView: 'Visa kartvy',
  listView: 'Visa listvy',
  optimizeRoute: 'Optimera rutt för uppdrag',
  navigate: 'Navigera till upphämtningsadress',
  scrapInfo: 'Skrotinformation',
  taskInfo: 'Uppdragsinformation',
  backToList: 'Gå tillbaka till uppdragslistan',
} as const;

// Canonical driver availability options with semantic tokens (no hard-coded colors)
export const DRIVER_STATUS_OPTIONS: Array<{
  value: DriverStatus;
  label: string;
  dotClass: string;
  badgeClass: string;
}> = [
  { value: 'available', label: 'Tillgänglig', dotClass: 'bg-success',       badgeClass: 'bg-success/15 text-success' },
  { value: 'busy',      label: 'Upptagen',    dotClass: 'bg-warning',       badgeClass: 'bg-warning/15 text-warning' },
  { value: 'break',     label: 'Rast',        dotClass: 'bg-primary',       badgeClass: 'bg-primary/10 text-primary' },
  { value: 'offline',   label: 'Offline',     dotClass: 'bg-muted-foreground', badgeClass: 'bg-muted text-muted-foreground' },
];

export const DRIVER_STATUS_MAP = Object.fromEntries(
  DRIVER_STATUS_OPTIONS.map((o) => [o.value, o])
) as Record<DriverStatus, typeof DRIVER_STATUS_OPTIONS[number]>;