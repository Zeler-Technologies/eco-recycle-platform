import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 ${className}`}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm">{error}</span>
    </div>
  );
};