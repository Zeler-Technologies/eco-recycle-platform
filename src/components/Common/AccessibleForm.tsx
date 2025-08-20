import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Info } from 'lucide-react';

interface AccessibleInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onKeyDown,
  error,
  helpText,
  required = false,
  placeholder,
  className = '',
  disabled = false,
  'aria-describedby': ariaDescribedBy
}) => {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="obligatoriskt">*</span>}
      </Label>
      
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
        aria-describedby={[
          helpText ? helpId : '',
          error ? errorId : '',
          ariaDescribedBy || ''
        ].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : 'false'}
      />
      
      {helpText && (
        <div id={helpId} className="flex items-start gap-2 text-sm text-gray-600">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{helpText}</span>
        </div>
      )}
      
      {error && (
        <div id={errorId} className="flex items-start gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

interface AccessibleTextareaProps extends Omit<AccessibleInputProps, 'type'> {
  rows?: number;
}

export const AccessibleTextarea: React.FC<AccessibleTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  helpText,
  required = false,
  placeholder,
  className = '',
  rows = 3,
  'aria-describedby': ariaDescribedBy
}) => {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="obligatoriskt">*</span>}
      </Label>
      
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={error ? 'border-red-500' : ''}
        aria-describedby={[
          helpText ? helpId : '',
          error ? errorId : '',
          ariaDescribedBy || ''
        ].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : 'false'}
      />
      
      {helpText && (
        <div id={helpId} className="flex items-start gap-2 text-sm text-gray-600">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{helpText}</span>
        </div>
      )}
      
      {error && (
        <div id={errorId} className="flex items-start gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};