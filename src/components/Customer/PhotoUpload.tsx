import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  customerRequestId: string;
  onNext: () => void;
  onBack: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ customerRequestId, onNext, onBack }) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length === 0) {
        setError('Välj endast bildfiler (JPG, PNG, etc.)');
        return;
      }

      if (imageFiles.length > 10) {
        setError('Du kan ladda upp max 10 bilder åt gången');
        return;
      }

      setSelectedImages(imageFiles);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedImages.length) {
      setError('Välj minst en bild att ladda upp');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      console.log('Starting photo upload for customer request:', customerRequestId);

      // First, get customer request details
      const { data: customerRequest, error: requestError } = await supabase
        .from('customer_requests')
        .select('car_registration_number, pnr_num')
        .eq('id', customerRequestId)
        .single();

      if (requestError || !customerRequest) {
        throw new Error('Kunde inte hitta kundförfrågan');
      }

      console.log('Customer request data:', customerRequest);

      // Upload each photo using direct database insert (since your helper function requires cars table)
      const uploadPromises = selectedImages.map(async (image, index) => {
        try {
          // Generate unique filename
          const fileExt = image.name.split('.').pop();
          const timestamp = Date.now();
          const fileName = `customer_${customerRequestId}_${timestamp}_${index}.${fileExt}`;
          const filePath = `car-images/${fileName}`;

          console.log(`Uploading image ${index + 1}:`, fileName);

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('car-images')
            .upload(filePath, image);

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Fel vid uppladdning av ${image.name}: ${uploadError.message}`);
          }

          console.log('Storage upload successful:', uploadData);

          // Get public URL for the uploaded image
          const { data: urlData } = supabase.storage
            .from('car-images')
            .getPublicUrl(filePath);

          const imageUrl = urlData.publicUrl;

          // Since cars table is empty, we'll insert directly to car_images with available data
          const { data: photoRecord, error: dbError } = await supabase
            .from('car_images')
            .insert([{
              car_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID since cars table is empty
              image_url: imageUrl,
              car_registration_number: customerRequest.car_registration_number,
              pnr_num: customerRequest.pnr_num || 0
            }])
            .select('id')
            .single();

          if (dbError) {
            console.error('Database insert error:', dbError);
            throw new Error(`Fel vid sparande av bildinfo för ${image.name}: ${dbError.message}`);
          }

          console.log('Photo record saved successfully:', photoRecord);
          
          // Update progress
          setUploadProgress(((index + 1) / selectedImages.length) * 100);
          
          return {
            id: photoRecord.id,
            url: imageUrl,
            fileName: fileName
          };
        } catch (error) {
          console.error(`Error uploading image ${index + 1}:`, error);
          throw error;
        }
      });

      const photoRecords = await Promise.all(uploadPromises);

      // Update customer request status to indicate photos are uploaded
      const { error: updateError } = await supabase
        .from('customer_requests')
        .update({ 
          status: 'photos_uploaded',
          updated_at: new Date().toISOString()
        })
        .eq('id', customerRequestId);

      if (updateError) {
        console.error('Status update error:', updateError);
        // Don't throw - photos are uploaded successfully
      }

      console.log(`Successfully uploaded ${photoRecords.length} photos for request ${customerRequestId}`);
      
      // Clear error and proceed to next step
      setError(null);
      onNext();
      
    } catch (error: any) {
      console.error('Photo upload error:', error);
      setError(error.message || 'Fel vid bilduppladdning. Försök igen.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
            Ta bilder från olika vinklar för bästa värdering
          </p>
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
          multiple
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* Upload Area */}
        {!selectedImages.length ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div 
              onClick={triggerFileInput}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Tryck för att ta bilder</p>
              <p className="text-gray-500 text-sm">
                Ta bilder från olika vinklar
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">
                Valda bilder ({selectedImages.length})
              </h3>
              <button
                onClick={triggerFileInput}
                className="text-blue-600 text-sm underline"
                disabled={uploading}
              >
                Lägg till fler
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  {!uploading && (
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex items-center mb-2">
              <Upload className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-gray-700">Laddar upp bilder...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {Math.round(uploadProgress)}% slutfört
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {selectedImages.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Laddar upp...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ladda upp {selectedImages.length} bilder
                </>
              )}
            </button>
          )}

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
          <p>Tips: Ta bilder från framsidan, baksidan, sidorna och eventuella skador</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;