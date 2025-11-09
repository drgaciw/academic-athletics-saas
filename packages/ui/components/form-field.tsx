import { forwardRef } from 'react';
import { Label } from './label';
import { Input, type InputProps } from './input';
import { Textarea } from './textarea';
import { cn } from '../utils/cn';

export interface FormFieldProps extends Omit<InputProps, 'error'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({ label, error, hint, required, multiline, rows = 3, className, id, ...props }, ref) => {
    const fieldId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={fieldId} className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-error')}>
            {label}
          </Label>
        )}
        {multiline ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            rows={rows}
            className={cn(error && 'border-error focus-visible:ring-error', className)}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            {...(props as any)}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            className={cn(error && 'border-error focus-visible:ring-error', className)}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            {...props}
          />
        )}
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';