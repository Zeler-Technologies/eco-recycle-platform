// Driver App Constants and Translations
export const STATUS_TEXTS = {
  scheduled: 'Väntar på upphämtning',
  in_progress: 'Pågående',
  completed: 'Klar',
  cancelled: 'Avbruten',
  pending: 'Att hantera'
};

export const STATUS_COLORS = {
  scheduled: '#6366f1',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
  pending: '#f59e0b'
};

export const DRIVER_STATUS_TEXTS = {
  available: 'Tillgänglig',
  busy: 'Upptagen',
  break: 'Rast',
  offline: 'Offline'
};

export const FILTER_OPTIONS = [
  { key: 'all', label: 'Alla' },
  { key: 'scheduled', label: 'Schemalagd' },
  { key: 'in_progress', label: 'Pågående' },
  { key: 'completed', label: 'Klar' },
  { key: 'pending', label: 'Väntar' }
];

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
  notDetermined: 'Ej bestämt'
};

export const ARIA_LABELS = {
  toggleFilters: 'Växla filter och sortering',
  statusDropdown: 'Välj förarstatus',
  mapView: 'Visa kartvy',
  listView: 'Visa listvy',
  optimizeRoute: 'Optimera rutt för uppdrag',
  navigate: 'Navigera till upphämtningsadress',
  scrapInfo: 'Skrotinformation',
  taskInfo: 'Uppdragsinformation',
  backToList: 'Gå tillbaka till uppdragslistan'
};

export const DRIVER_STATUS_OPTIONS = [
  { key: 'available', label: 'Tillgänglig' },
  { key: 'busy', label: 'Upptagen' },
  { key: 'break', label: 'Rast' },
  { key: 'offline', label: 'Offline' }
];