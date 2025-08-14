import React from 'react';
import { CheckCircle2, Circle, FileText, Calculator, Shield, Star } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: 'form' | 'quote' | 'gdpr' | 'success';
  progress: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, progress }) => {
  const steps = [
    { key: 'form', label: 'Biluppgifter', icon: FileText },
    { key: 'quote', label: 'Offert', icon: Calculator },
    { key: 'gdpr', label: 'Godkännande', icon: Shield },
    { key: 'success', label: 'Klart', icon: Star },
  ];

  const getStepIndex = (step: string) => steps.findIndex(s => s.key === step);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center space-y-2 flex-1">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isCompleted 
                  ? 'bg-green-100 border-green-500 text-green-600' 
                  : isCurrent 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              
              <span className={`
                text-xs font-medium text-center leading-tight
                ${isCompleted 
                  ? 'text-green-600' 
                  : isCurrent 
                    ? 'text-primary' 
                    : 'text-gray-400'
                }
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Progress (only show on form step) */}
      {currentStep === 'form' && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Formulärframsteg</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};