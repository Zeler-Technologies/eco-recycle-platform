import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';

interface ImportProgressProps {
  isImporting: boolean;
  fileName: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  processedRecords: number | null;
  totalRecords: number | null;
  estimatedTimeLeft: number | null;
  errors: string[];
  onCancel: () => void;
}

const ImportProgress: React.FC<ImportProgressProps> = ({
  isImporting,
  fileName,
  progress,
  currentStep,
  totalSteps,
  processedRecords,
  totalRecords,
  estimatedTimeLeft,
  errors,
  onCancel
}) => {
  if (!isImporting) return null;

  const getStepDescription = (step: number) => {
    const steps = {
      1: "Läser fil",
      2: "Analyserar postnummer", 
      3: "Rensar gammal data",
      4: "Sparar ny data"
    };
    return steps[step] || "Bearbetar...";
  };

  const formatTimeRemaining = (milliseconds: number) => {
    if (!milliseconds) return "Beräknar...";
    
    const seconds = Math.ceil(milliseconds / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes}min`;
    } else {
      const hours = Math.ceil(seconds / 3600);
      return `${hours}h`;
    }
  };

  const getProgressColor = (step: number) => {
    switch(step) {
      case 1: return "bg-blue-600";    // Reading
      case 2: return "bg-yellow-600";  // Parsing
      case 3: return "bg-orange-600";  // Clearing
      case 4: return "bg-green-600";   // Importing
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <h3 className="text-lg font-medium">Importerar postnummer</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* File Information */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">Fil:</div>
          <div className="font-medium truncate" title={fileName}>{fileName}</div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Framsteg</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-3"
          />
        </div>
        
        {/* Current Step */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">
            Steg {currentStep} av {totalSteps}: {getStepDescription(currentStep)}
          </div>
          
          {/* Records Progress */}
          {processedRecords !== null && totalRecords !== null && (
            <div className="text-sm text-gray-600">
              Bearbetat {processedRecords.toLocaleString('sv-SE')} av {totalRecords.toLocaleString('sv-SE')} rader
            </div>
          )}
        </div>
        
        {/* Time Estimation */}
        {estimatedTimeLeft && (
          <div className="mb-4 text-sm text-gray-600">
            Beräknad tid kvar: {formatTimeRemaining(estimatedTimeLeft)}
          </div>
        )}
        
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm font-medium text-yellow-800">
                Varningar ({errors.length})
              </div>
            </div>
            <div className="text-xs text-yellow-700 max-h-20 overflow-y-auto space-y-1">
              {errors.slice(-3).map((error, i) => (
                <div key={i} className="flex items-start space-x-1">
                  <span>•</span>
                  <span>{error}</span>
                </div>
              ))}
              {errors.length > 3 && (
                <div className="text-xs text-yellow-600 italic">
                  ... och {errors.length - 3} fler varningar
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Cancel Button */}
        <div className="flex justify-end">
          <Button 
            onClick={onCancel}
            variant="outline"
            size="sm"
          >
            Avbryt import
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportProgress;