import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';

interface PhotoUploadProps {
  pickupOrderId: string;
  onNext: () => void;
  onBack: () => void;
}

interface PhotoRequirement {
  id: string;
  title: string;
  description: string;
  type: 'engine' | 'exterior_front' | 'exterior_back';
  required: boolean;
  completed: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ pickupOrderId, onNext, onBack }) => {
  const [currentPhotoType, setCurrentPhotoType] = useState<string>('engine');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo requirements matching database constraints (exact image_type values)
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
      id: 'exterior_front',
      title: 'Framifrån',
      description: 'Bild framifrån av fordonet',
      type: 'exterior_front',
      required: true,
      completed: false
    },
    {
      id: 'exterior_back',
      title: 'Bakifrån',
      description: 'Bild bakifrån av fordonet',
      type: 'exterior_back',
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Endast JPEG, PNG eller WebP är tillåtna.');
      return;
    }

    await handlePhotoUpload(file);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      console.log('Starting RLS-compliant photo upload for type:', currentPhotoType);

      // Step 1: Get pickup order details first, then customer request details
      const { data: pickupOrder, error: pickupError } = await supabase
        .from('pickup_orders')
        .select(`
          customer_request_id,
          tenant_id
        `)
        .eq('id', pickupOrderId)
        .single();

      if (pickupError || !pickupOrder) {
        console.error('Pickup order lookup failed:', pickupError);
        throw new Error('Kunde inte hitta hämtningsorder');
      }

      console.log('Pickup order data:', pickupOrder);

      // Step 2: Get customer request details including scrapyard_id for RLS
      const { data: customerRequest, error: requestError } = await supabase
        .from('customer_requests')
        .select(`
          car_registration_number, 
          pnr_num, 
          scrapyard_id, 
          car_brand, 
          car_model,
          car_year
        `)
        .eq('id', pickupOrder.customer_request_id)
        .single();

      if (requestError || !customerRequest) {
        console.error('Customer request lookup failed:', requestError);
        throw new Error('Kunde inte hitta kundförfrågan');
      }

      console.log('Customer request data:', customerRequest);

      // Step 3: Validate required data
      if (!customerRequest.car_registration_number) {
        throw new Error('Bilregistreringsnummer saknas');
      }

      if (!customerRequest.scrapyard_id) {
        throw new Error('Skrothandlare-ID saknas');
      }

      // Validate and clean PNR (required for car_images.pnr_num)
      const cleanPnr = customerRequest.pnr_num?.toString().replace(/\D/g, '') || '';
      const numericPnr = parseInt(cleanPnr) || 0;

      if (numericPnr === 0 || cleanPnr.length < 8) {
        throw new Error('Ogiltigt personnummer');
      }

      console.log('Using PNR:', numericPnr, 'for registration:', customerRequest.car_registration_number);

      // Step 4: Create or find car record (required for RLS policy)
      console.log('Creating/finding car record for RLS compliance...');
      
      let carId = null;

      // First check if car already exists
      const { data: existingCar, error: findError } = await supabase
        .from('cars')
        .select('id')
        .eq('license_plate', customerRequest.car_registration_number)
        .eq('tenant_id', customerRequest.scrapyard_id)
        .maybeSingle();

      if (findError) {
        console.error('Error checking for existing car:', findError);
        throw new Error('Fel vid kontroll av befintlig bil');
      }

      if (existingCar) {
        carId = existingCar.id;
        console.log('Found existing car with ID:', carId);
      } else {
        // Create new car record with all required fields and correct enum values
        console.log('Creating new car record...');
        
        const carData = {
          tenant_id: customerRequest.scrapyard_id as number,
          license_plate: customerRequest.car_registration_number as string,
          brand: customerRequest.car_brand || 'Okänd',
          model: customerRequest.car_model || 'Okänd',
          color: 'Okänd', // Default color
          status: 'new' as 'new', // Valid car_status enum value
          treatment_type: 'pickup' as 'pickup', // Valid treatment_type enum value
          age: customerRequest.car_year ? String(customerRequest.car_year) : undefined
        };
        console.log('Creating car with data:', carData);

        const { data: newCar, error: createError } = await supabase
          .from('cars')
          .insert(carData)
          .select('id')
          .single();

        if (createError) {
          console.error('Car creation failed:', createError);
          throw new Error(`Kunde inte skapa bilpost: ${createError.message}`);
        }

        carId = newCar.id;
        console.log('Created new car with ID:', carId);
      }

      // Step 5: Upload image to pickup-photos storage with secure path
      const timestamp = Date.now();
      const safeOrderId = pickupOrderId.replace(/[^a-zA-Z0-9-]/g, '');
      const filePath = `driver_verification/${safeOrderId}/${timestamp}.jpg`;

      console.log('[Storage] Uploading driver verification to pickup-photos bucket:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pickup-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        const msg = (uploadError as any)?.message?.toLowerCase() || '';
        const status = (uploadError as any)?.status;
        if (status === 403 || msg.includes('row level security') || msg.includes('permission')) {
          throw new Error('Endast tilldelade förare kan ladda upp verifieringsfoton');
        } else if (status === 401) {
          throw new Error('Du har inte behörighet att ladda upp foton för denna upphämtning');
        }
        throw new Error(`Fel vid uppladdning: ${(uploadError as any)?.message || ''}`);
      }

      // Step 6: Get public URL
      const { data: urlData } = supabase.storage
        .from('pickup-photos')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;
      console.log('Image uploaded to storage successfully:', imageUrl);

      // Step 7: Insert into car_images table with driver verification data
      console.log('Inserting driver verification photo to car_images table:', {
        car_id: carId,
        image_url: imageUrl,
        pnr_num: numericPnr,
        car_registration_number: customerRequest.car_registration_number,
        image_type: `verification_${currentPhotoType}`,
        file_name: filePath.split("/").pop() as string,
        file_size: file.size,
        uploaded_by: 'driver'
      });

      const { data: photoRecord, error: dbError } = await supabase
        .from('car_images')
        .insert({
          car_id: carId, // Required for RLS policy satisfaction
          image_url: imageUrl,
          pnr_num: numericPnr, // Required field (NOT NULL)
          car_registration_number: customerRequest.car_registration_number,
          image_type: `verification_${currentPhotoType}`, // Driver verification type
          file_name: filePath.split("/").pop() as string,
          file_size: file.size,
          uploaded_by: 'driver' // Mark as driver uploaded for comparison
          // Note: pnr_num_norm removed - it may be auto-generated or cause conflicts
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

        if (dbError.code === '23503' && dbError.message.includes('car_id')) {
          throw new Error('Bil-ID är inte giltigt (RLS policy fel)');
        }

        if (dbError.code === '23514' && dbError.message.includes('image_type')) {
          throw new Error(`Bildtyp '${currentPhotoType}' är inte tillåten`);
        }

        throw new Error(`Databasfel: ${dbError.message}`);
      }

      if (!photoRecord?.id) {
        throw new Error('Ingen bild-ID returnerades från databasen');
      }

      console.log('Photo uploaded successfully with ID:', photoRecord.id);

      // Step 8: Mark current photo requirement as completed
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
      console.error('Complete photo upload process failed:', error);
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
          accept="image/jpeg,image/png,image/webp"
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