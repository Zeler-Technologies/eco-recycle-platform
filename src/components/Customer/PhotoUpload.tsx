import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';

interface PhotoUploadProps {
  customerRequestId: string;
  onNext: () => void;
  onBack: () => void;
}

interface PhotoRequirement {
  id: string;
  title: string;
  description: string;
  type: 'engine' | 'overall';
  required: boolean;
  completed: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ customerRequestId, onNext, onBack }) => {
  const [currentPhotoType, setCurrentPhotoType] = useState<string>('engine');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo requirements as per your original specification
  const [photoRequirements, setPhotoRequirements] = useState<PhotoRequirement[]>([
    {
      id: 'engine',
      title: 'Motorrum',
      description: 'Ett foto av motorrummet',
      type: 'engine',
      required: true,
      completed: false
    },
    {
      id: 'overall1',
      title: 'Helhetsbild 1',
      description: 'Övergripande bild av fordonet',
      type: 'overall',
      required: true,
      completed: false
    },
    {
      id: 'overall2',
      title: 'Helhetsbild 2',
      description: 'Ytterligare övergripande bild',
      type: 'overall',
      required: true,
      completed: false
    }
  ]);

  const completedPhotos = photoRequirements.filter(req => req.completed).length;
  const totalRequired = photoRequirements.filter(req => req.required).length;
  const canProceed = completedPhotos === totalRequired;
  const progressPercentage = (completedPhotos / totalRequired) * 100;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    event.target.value = '';

    // Validation
    if (file.size > 10 * 1024 * 1024) {
      setError('Bilden är för stor. Max storlek är 10MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Endast bildfiler är tillåtna.');
      return;
    }

    await handlePhotoUpload(file);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      console.log('Starting direct photo upload for type:', currentPhotoType);

      // Get customer request details
      const { data: customerRequest, error: requestError } = await supabase
        .from('customer_requests')
        .select('car_registration_number, pnr_num')
        .eq('id', customerRequestId)
        .single();

      if (requestError || !customerRequest) {
        console.error('Customer request lookup failed:', requestError);
        throw new Error('Kunde inte hitta kundförfrågan');
      }

      console.log('Customer request data:', customerRequest);

      // Validate PNR number (must be unique)
      const cleanPnr = customerRequest.pnr_num?.toString().replace(/\D/g, '') || '';
      const numericPnr = parseInt(cleanPnr) || 0;

      if (numericPnr === 0 || cleanPnr.length < 8) {
        throw new Error('Ogiltigt personnummer');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${currentPhotoType}_${customerRequest.car_registration_number}_${timestamp}.${fileExt}`;
      const filePath = `car-images/${fileName}`;

      console.log('Uploading file to storage:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Fel vid uppladdning: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;
      console.log('Image uploaded to storage successfully:', imageUrl);

      // Direct insert to car_images table (no helper function)
      console.log('Inserting directly to car_images table with data:', {
        car_id: null,
        image_url: imageUrl,
        pnr_num: numericPnr,
        car_registration_number: customerRequest.car_registration_number,
        image_type: currentPhotoType,
        file_name: fileName,
        file_size: file.size,
        uploaded_by: 'customer'
      });

      const { data: photoRecord, error: dbError } = await supabase
        .from('car_images')
        .insert({
          car_id: null, // cars table is not used
          image_url: imageUrl,
          pnr_num: numericPnr,
          pnr_num_norm: pnrNorm, // Add normalized PNR for constraint
          car_registration_number: customerRequest.car_registration_number,
          image_type: currentPhotoType,
          file_name: fileName,
          file_size: file.size,
          uploaded_by: 'customer'
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Database insert error:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code
        });

        // Handle specific constraint violations
        if (dbError.code === '23505' && dbError.message.includes('pnr_num')) {
          throw new Error('Du har redan laddat upp bilder för detta personnummer');
        }
        
        if (dbError.code === '23503' && dbError.message.includes('car_registration_number')) {
          throw new Error('Bilregistreringsnumret är inte giltigt');
        }

        throw new Error(`Databasfel: ${dbError.message}`);
      }

      if (!photoRecord?.id) {
        throw new Error('Ingen bild-ID returnerades från databasen');
      }

      console.log('Photo uploaded successfully with ID:', photoRecord.id);

      // Mark current photo requirement as completed
      setPhotoRequirements(prev => 
        prev.map(req => 
          req.id === currentPhotoType 
            ? { ...req, completed: true }
            : req
        )
      );

      // Move to next required photo type
      const nextIncomplete = photoRequirements.find(req => 
        req.required && !req.completed && req.id !== currentPhotoType
      );
      
      if (nextIncomplete) {
        setCurrentPhotoType(nextIncomplete.id);
      }

      setError(null);

    } catch (error: any) {
      console.error('Photo upload error:', error);
      setError(error.message || 'Fel vid bilduppladdning. Försök igen.');
    } finally {
      setUploading(false);
    }
  };

  const selectPhotoType = (photoId: string) => {
    setCurrentPhotoType(photoId);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProceed = () => {
    if (canProceed) {
      onNext();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ladda upp bilder
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {completedPhotos} av {totalRequired} bilder uppladdade
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Photo Requirements */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-medium text-gray-900 mb-4">Bildkrav</h3>
          <div className="space-y-3">
            {photoRequirements.map((requirement) => (
              <div 
                key={requirement.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  requirement.completed 
                    ? 'border-green-200 bg-green-50' 
                    : currentPhotoType === requirement.id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectPhotoType(requirement.id)}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {requirement.title}
                    {requirement.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-gray-500">{requirement.description}</p>
                </div>
                <div className="ml-3">
                  {requirement.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : currentPhotoType === requirement.id ? (
                    <Camera className="h-6 w-6 text-blue-500" />
                  ) : (
                    <div className="h-6 w-6 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 text-xs underline"
            >
              Stäng
            </button>
          </div>
        )}

        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* Camera Button */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div 
            onClick={triggerFileInput}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
          >
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Ta bild: {photoRequirements.find(req => req.id === currentPhotoType)?.title}
            </p>
            <p className="text-gray-500 text-sm">
              {photoRequirements.find(req => req.id === currentPhotoType)?.description}
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-3" />
              <span className="text-gray-700">Laddar upp bild...</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
              canProceed
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canProceed ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Fortsätt till nästa steg
              </>
            ) : (
              `Ladda upp ${totalRequired - completedPhotos} bilder till`
            )}
          </button>

          <button
            onClick={onBack}
            disabled={uploading}
            className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Tillbaka
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Tips: Ta tydliga bilder i god belysning för bästa värdering</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;