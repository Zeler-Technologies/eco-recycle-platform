import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string, notes: string) => void;
  pickup: any;
  isLoading?: boolean;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pickup,
  isLoading = false
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    pickup?.scheduled_pickup_date ? new Date(pickup.scheduled_pickup_date) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!selectedDate) return;
    
    // Combine date and time
    const [hours, minutes] = selectedTime.split(':');
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const rescheduleNotes = `Omschemalagd av förare till ${format(scheduledDateTime, 'yyyy-MM-dd HH:mm')}${notes ? ` - ${notes}` : ''}`;
    
    onConfirm(scheduledDateTime.toISOString(), rescheduleNotes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Omschemalägg upphämtning</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Kund: {pickup?.owner_name}</Label>
            <Label>Bil: {pickup?.car_brand} {pickup?.car_model} ({pickup?.car_registration_number})</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Nytt datum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Välj datum</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Tid</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Kommentar (valfritt)</Label>
            <Input
              id="notes"
              placeholder="Anledning till omschemaläggning..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Avbryt
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedDate || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Omschemalägg...' : 'Omschemalägg'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};