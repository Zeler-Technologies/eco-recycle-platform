import React, { useState, useRef, useCallback } from 'react';
import { Camera, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Photo {
  id: string;
  url: string;
  type: 'engine' | 'overall';
  file: File;
  fileName: string;
}

interface PhotoUploadProps {
  customerRequestId: string;
  onNext: () => void;
  onBack: () => void;
}

const PHOTO_REQUIREMENTS = [
  {
    id: 'engine',
    title: 'Motorrum', 
    description: 'Ett foto av motorrummet',
    required: true
  },
  {
    id: 'overall1',
    title: 'Helhetsbild 1',
    description: 'Övergripande bild av fordonet', 
    required: true
  },
  {
    id: 'overall2', 
    title: 'Helhetsbild 2',
    description: 'Ytterligare övergripande bild',
    required: true
  }
];

const PhotoUpload: React.FC<PhotoUploadProps> = ({ customerRequestId, onNext, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPhotoType, setCurrentPhotoType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedPhotos = photos.length;
  const totalRequired = 3;
  const progressPercentage = (completedPhotos / totalRequired) * 100;
  const canProceed = completedPhotos === totalRequired;

  const capturePhoto = useCallback((photoType: string) => {
    setCurrentPhotoType(photoType);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handlePhotoCapture = useCallback(async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Bilden är för stor. Max storlek är 10MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Endast bildfiler är tillåtna.');
      return;
    }

    try {
      setIsUploading(true);
      
      // Get customer request info - using any to bypass type issues
      const { data: requestData, error: requestError } = await (supabase as any)
        .from('customer_requests')
        .select('car_registration_number, pnr_num')
        .eq('id', customerRequestId)
        .single();

      if (requestError || !requestData) {
        console.error('Request data error:', requestError);
        throw new Error('Kunde inte hitta kundförfrågan');
      }

      // Get car_id from cars table - using any to bypass type issues
      const { data: carData, error: carError } = await (supabase as any)
        .from('cars')
        .select('id')
        .eq('license_plate', requestData.car_registration_number)
        .single();

      if (carError || !carData) {
        console.error('Car data error:', carError);
        throw new Error('Kunde inte hitta bil i systemet');
      }

      // Generate filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${customerRequestId}_${currentPhotoType}_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Uppladdning misslyckades');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('car-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Kunde inte få bildens URL');
      }

      // Insert to database - using any to bypass type checking
      const imageType = currentPhotoType === 'engine' ? 'engine' : 'overall';
      const pnrNumber = requestData.pnr_num ? Number(requestData.pnr_num) : 0;
      
      const { error: dbError } = await (supabase as any)
        .from('car_images')
        .insert({
          car_id: carData.id,
          image_url: urlData.publicUrl,
          pnr_num: pnrNumber,
          car_registration_number: requestData.car_registration_number,
          image_type: imageType,
          uploaded_by: 'customer',
          file_name: fileName,
          file_size: file.size,
          notes: null
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Fel vid sparning till databas');
      }

      setPhotos(prev => prev.filter(p => p.id !== currentPhotoType));
      setPhotos(prev => [...prev, {
        id: currentPhotoType,
        url: urlData.publicUrl,
        type: imageType,
        file,
        fileName
      }]);

      toast.success('Bild uppladdad framgångsrikt!');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Fel vid uppladdning');
    } finally {
      setIsUploading(false);
    }
  }, [customerRequestId, currentPhotoType]);

  const deletePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    try {
      await supabase.storage.from('car-images').remove([photo.fileName]);
      await (supabase as any).from('car_images').delete().eq('file_name', photo.fileName);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success('Bild borttagen');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fel vid borttagning av bild');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-400 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center text-black text-sm pt-2 px-4">
        <span className="font-medium">12:30</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full"></div>
            <div className="w-1 h-3 bg-black rounded-full opacity-50"></div>
          </div>
          <svg className="w-6 h-4 ml-2" fill="black" viewBox="0 0 24 16">
            <path d="M2 4v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/>
            <path d="M18 2v12h2V2h-2z"/>
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between text-black text-xs px-4 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <span className="font-medium">Dokumentera Bilen</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="opacity-50">Biluppgifter</span>
          <span className="opacity-50">Om bilen</span>
          <span className="opacity-50">Transport</span>
          <span className="opacity-50">Betalnings Info</span>
        </div>
      </div>

      <div className="flex-1 px-4 mobile-container mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">DOKUMENTERA BILEN</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          <div className="mb-6">
            <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-center text-gray-600 text-sm mb-5">
              {completedPhotos} av {totalRequired} foton tagna
            </p>
          </div>

          <div className="bg-gray-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <h3 className="font-semibold text-gray-800 mb-2">Fotoanvisningar:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                3 meters avstånd till bilen
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                God belysning (dagsljus föredras)
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Tydlig bild av hela bilen/motorrum
              </li>
            </ul>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-4">Obligatoriska foton</h2>

          <div className="space-y-3">
            {PHOTO_REQUIREMENTS.map((req) => {
              const isCompleted = photos.some(p => p.id === req.id);
              
              return (
                <div key={req.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">{req.title}</div>
                    <div className="text-sm text-gray-600">{req.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isCompleted 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isCompleted ? 'Klar' : 'Väntar'}
                    </span>
                    <button
                      onClick={() => capturePhoto(req.id)}
                      disabled={isUploading}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                        isCompleted 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-gray-700 hover:bg-gray-800'
                      } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploading && currentPhotoType === req.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {photos.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Uppladdade foton</h3>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={photo.url} 
                      alt={`${photo.type} foto`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                      {PHOTO_REQUIREMENTS.find(req => req.id === photo.id)?.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoCapture}
          />

          <div className="space-y-3 pt-6">
            <button
              onClick={onNext}
              disabled={!canProceed || isUploading}
              className={`w-full py-4 rounded-full text-lg font-semibold transition-all mb-3 ${
                canProceed && !isUploading
                  ? 'bg-gray-700 text-white hover:bg-gray-800 hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {!canProceed && (
                <div className="flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Ta alla {totalRequired} foton för att fortsätta
                </div>
              )}
              {canProceed && !isUploading && `NÄSTA (${completedPhotos}/${totalRequired})`}
              {isUploading && 'Laddar upp...'}
            </button>
            
            <button
              onClick={onBack}
              disabled={isUploading}
              className="w-full text-center text-gray-700 underline hover:text-gray-900"
            >
              Backa
            </button>
          </div>
        </div>
      </div>

      <div className="pb-8 flex justify-center">
        <div className="w-32 h-1 bg-black rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default PhotoUpload;