// Driver App Constants and Translations (TypeScript)
export type DriverStatus = 'available' | 'busy' | 'break' | 'offline';

// Task statuses (pickups) - keep existing for UI chips
export const STATUS_TEXTS = {
  scheduled: 'Väntar på upphämtning',
  in_progress: 'Pågående',
  completed: 'Klar',
  cancelled: 'Avbruten',
  pending: 'Att hantera',
} as const;

// Note: left as hex for existing UI usage; pickup status colors are out of scope here
export const STATUS_COLORS = {
  scheduled: '#6366f1',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
  pending: '#f59e0b',
} as const;

export const DRIVER_STATUS_TEXTS: Record<DriverStatus, string> = {
  available: 'Tillgänglig',
  busy: 'Upptagen',
  break: 'Rast',
  offline: 'Offline',
};

export const FILTER_OPTIONS = [
  { key: 'all', label: 'Alla' },
  { key: 'scheduled', label: 'Schemalagd' },
  { key: 'in_progress', label: 'Pågående' },
  { key: 'completed', label: 'Klar' },
  { key: 'pending', label: 'Väntar' },
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