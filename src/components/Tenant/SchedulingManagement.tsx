import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Car, 
  Filter,
  Search,
  Check,
  X,
  MessageSquare,
  Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

interface Props {
  onBack: () => void;
}

interface Request {
  id: string;
  date: Date;
  time: string;
  customerName: string;
  address: string;
  phone: string;
  carBrand: string;
  carModel: string;
  registrationNumber: string;
  status: 'Förfrågan' | 'Bekräftad' | 'Utförd' | 'Avbokad';
  assignedDriver?: string;
  notes?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'Tillgänglig' | 'Upptagen';
}

const SchedulingManagement: React.FC<Props> = ({ onBack }) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAddPickupDialogOpen, setIsAddPickupDialogOpen] = useState(false);

  // Mock data - in real app this would come from database
  const [requests, setRequests] = useState<Request[]>([
    {
      id: 'REQ001',
      date: new Date(),
      time: '09:00',
      customerName: 'Anna Andersson',
      address: 'Storgatan 15, 11143 Stockholm',
      phone: '08-123 45 67',
      carBrand: 'Volvo',
      carModel: 'V70',
      registrationNumber: 'ABC123',
      status: 'Förfrågan',
      notes: 'Bilen startar inte, behöver bogseras'
    },
    {
      id: 'REQ002',
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      time: '11:30',
      customerName: 'Erik Johansson',
      address: 'Kungsgatan 42, 41119 Göteborg',
      phone: '031-987 65 43',
      carBrand: 'Saab',
      carModel: '9-3',
      registrationNumber: 'DEF456',
      status: 'Bekräftad',
      assignedDriver: 'Maria Larsson'
    },
    {
      id: 'REQ003',
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      time: '14:00',
      customerName: 'Maria Nilsson',
      address: 'Malmövägen 88, 21456 Malmö',
      phone: '040-555 66 77',
      carBrand: 'BMW',
      carModel: 'X5',
      registrationNumber: 'GHI789',
      status: 'Förfrågan'
    }
  ]);

  const drivers: Driver[] = [
    { id: 'D001', name: 'Erik Andersson', phone: '070-123 45 67', status: 'Tillgänglig' },
    { id: 'D002', name: 'Maria Larsson', phone: '070-234 56 78', status: 'Upptagen' },
    { id: 'D003', name: 'Johan Svensson', phone: '070-345 67 89', status: 'Tillgänglig' },
    { id: 'D004', name: 'Anna Petersson', phone: '070-456 78 90', status: 'Tillgänglig' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Förfrågan': return 'bg-blue-500 text-white';
      case 'Bekräftad': return 'bg-green-500 text-white';
      case 'Utförd': return 'bg-gray-500 text-white';
      case 'Avbokad': return 'bg-red-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesLocation = !filterLocation || 
      request.address.toLowerCase().includes(filterLocation.toLowerCase()) ||
      request.address.match(/\d{5}/)?.[0] === filterLocation;
    const matchesStatus = filterStatus === 'all' || !filterStatus || request.status === filterStatus;
    return matchesLocation && matchesStatus;
  });

  const getRequestsForDate = (date: Date) => {
    return filteredRequests.filter(request => isSameDay(request.date, date));
  };

  const handleAssignDriver = (requestId: string, driverId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, assignedDriver: drivers.find(d => d.id === driverId)?.name }
        : req
    ));
  };

  const handleConfirmRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request || !request.assignedDriver) {
      toast({
        title: "Fel",
        description: "Du måste tilldela en förare innan du kan bekräfta hämtningen.",
        variant: "destructive"
      });
      return;
    }

    // Update status
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'Bekräftad' as const } : req
    ));

    // Simulate SMS sending
    try {
      toast({
        title: "Hämtning bekräftad",
        description: `SMS skickat till ${request.customerName} (${request.phone}) om bekräftad hämtning.`
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte skicka SMS bekräftelse.",
        variant: "destructive"
      });
    }

    setIsDetailDialogOpen(false);
  };

  const handleCancelRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'Avbokad' as const } : req
    ));
    setIsDetailDialogOpen(false);
  };

  // Get available requests that can be added to schedule (status 'Förfrågan')
  const availableRequests = requests.filter(request => request.status === 'Förfrågan');

  const handleAddRequestToSchedule = (requestId: string, newDate: Date, newTime: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, date: newDate, time: newTime }
        : req
    ));
    setIsAddPickupDialogOpen(false);
    toast({
      title: "Hämtning tillagd",
      description: "Förfrågan har lagts till i schemat."
    });
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-2 p-4">
        {/* Header */}
        {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
          <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map(day => {
          const dayRequests = getRequestsForDate(day);
          const dayNumber = format(day, 'd');
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={day.toString()}
              className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors ${
                isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                {dayNumber}
              </div>
              <div className="space-y-1 mt-1">
                {dayRequests.slice(0, 2).map(request => (
                  <div 
                    key={request.id}
                    className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(request.status)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(request);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    {request.time} - {request.customerName}
                  </div>
                ))}
                {dayRequests.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayRequests.length - 2} fler
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="theme-tenant min-h-screen bg-tenant-muted">
      {/* Header */}
      <header className="bg-tenant-primary text-tenant-primary-foreground shadow-custom-md">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-tenant-primary-foreground/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Schemaläggning</h1>
              <p className="text-tenant-primary-foreground/80">Hantera kundförfrågningar och hämtningar</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
          <Button
            onClick={() => setIsAddPickupDialogOpen(true)}
            className="bg-tenant-primary hover:bg-tenant-primary/90 text-tenant-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till hämtning
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="month-select">Månad:</Label>
            <Select value={format(selectedDate, 'yyyy-MM')} onValueChange={(value) => {
              const [year, month] = value.split('-');
              setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
            }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = new Date(new Date().getFullYear(), i, 1);
                  const value = format(month, 'yyyy-MM');
                  const monthNames = [
                    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                  ];
                  const label = `${monthNames[i]} ${new Date().getFullYear()}`;
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="location-filter">Filtrera ort/postnummer:</Label>
            <Input
              id="location-filter"
              placeholder="Ort eller postnummer"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter">Status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Alla statusar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="Förfrågan">Förfrågan</SelectItem>
                <SelectItem value="Bekräftad">Bekräftad</SelectItem>
                <SelectItem value="Utförd">Utförd</SelectItem>
                <SelectItem value="Avbokad">Avbokad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar */}
        <Card className="bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {(() => {
                const monthNames = [
                  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                ];
                return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
              })()}
            </CardTitle>
            <CardDescription>
              Klicka på en dag för att se detaljer eller på en förfrågan för att hantera den
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCalendarGrid()}
          </CardContent>
        </Card>

        {/* Today's Requests */}
        <Card className="mt-6 bg-white shadow-custom-sm">
          <CardHeader>
            <CardTitle>Dagens förfrågningar</CardTitle>
            <CardDescription>
              {(() => {
                const monthNames = [
                  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                ];
                const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
                return `${dayNames[selectedDate.getDay()]} ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getRequestsForDate(selectedDate).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga förfrågningar för denna dag
              </p>
            ) : (
              <div className="space-y-4">
                {getRequestsForDate(selectedDate).map(request => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-bold text-lg">{request.time}</div>
                        </div>
                        <div>
                          <h3 className="font-semibold">{request.customerName}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {request.carBrand} {request.carModel} ({request.registrationNumber})
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.address}
                          </p>
                          {request.assignedDriver && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Förare: {request.assignedDriver}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hämtningsförfrågan - {selectedRequest?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const monthNames = [
                      'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
                    ];
                    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
                    return `${dayNames[selectedRequest.date.getDay()]} ${selectedRequest.date.getDate()} ${monthNames[selectedRequest.date.getMonth()]} ${selectedRequest.date.getFullYear()}`;
                  })()} kl. {selectedRequest.time}
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Kund</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {selectedRequest.customerName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefon</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {selectedRequest.phone}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Adress</Label>
                <p className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedRequest.address}
                </p>
              </div>

              {/* Car Info */}
              <div>
                <Label className="text-sm font-medium">Fordon</Label>
                <p className="flex items-center gap-2 mt-1">
                  <Car className="h-4 w-4" />
                  {selectedRequest.carBrand} {selectedRequest.carModel} ({selectedRequest.registrationNumber})
                </p>
              </div>

              {/* Driver Assignment */}
              <div>
                <Label className="text-sm font-medium">Tilldela förare</Label>
                <Select 
                  value={selectedRequest.assignedDriver || ''} 
                  onValueChange={(value) => {
                    handleAssignDriver(selectedRequest.id, value);
                    setSelectedRequest(prev => prev ? { ...prev, assignedDriver: drivers.find(d => d.id === value)?.name } : null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Välj förare" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status === 'Tillgänglig').map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium">Anteckningar</Label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedRequest.status === 'Förfrågan' && (
                  <Button
                    onClick={() => handleConfirmRequest(selectedRequest.id)}
                    className="flex items-center gap-2"
                    disabled={!selectedRequest.assignedDriver}
                  >
                    <Check className="h-4 w-4" />
                    Bekräfta hämtning
                  </Button>
                )}
                
                {selectedRequest.status !== 'Avbokad' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Avboka
                  </Button>
                )}

                {selectedRequest.status === 'Bekräftad' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "SMS skickat",
                        description: `Påminnelse skickad till ${selectedRequest.customerName}`
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Skicka påminnelse
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Pickup Dialog */}
      <Dialog open={isAddPickupDialogOpen} onOpenChange={setIsAddPickupDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lägg till hämtning från förfrågningar</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {availableRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga tillgängliga förfrågningar att schemalägga
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availableRequests.map(request => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <Badge className="bg-blue-500 text-white">
                            {request.status}
                          </Badge>
                          <span className="font-medium">ID: {request.id}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {request.customerName}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {request.phone}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              {request.carBrand} {request.carModel}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.registrationNumber}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4" />
                          {request.address}
                        </p>
                        
                        {request.notes && (
                          <p className="text-sm bg-gray-50 p-2 rounded">
                            <strong>Anteckningar:</strong> {request.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            id={`date-${request.id}`}
                            defaultValue={format(new Date(), 'yyyy-MM-dd')}
                            className="w-36"
                          />
                          <Input
                            type="time"
                            id={`time-${request.id}`}
                            defaultValue="09:00"
                            className="w-24"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            const dateInput = document.getElementById(`date-${request.id}`) as HTMLInputElement;
                            const timeInput = document.getElementById(`time-${request.id}`) as HTMLInputElement;
                            const newDate = new Date(dateInput.value);
                            const newTime = timeInput.value;
                            handleAddRequestToSchedule(request.id, newDate, newTime);
                          }}
                          className="w-full bg-tenant-primary hover:bg-tenant-primary/90 text-tenant-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Lägg till
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulingManagement;