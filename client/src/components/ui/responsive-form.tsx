
import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function ResponsiveForm({ children, onSubmit, className = "" }: ResponsiveFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 sm:space-y-6 ${className}`}>
      {children}
    </form>
  );
}

interface ResponsiveFormGroupProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

export function ResponsiveFormGroup({
  label,
  children,
  error,
  required,
  description,
  layout = 'vertical',
  className = ""
}: ResponsiveFormGroupProps) {
  const layoutClass = layout === 'horizontal' 
    ? 'flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4'
    : 'space-y-2';

  return (
    <div className={`${layoutClass} ${className}`}>
      <div className={layout === 'horizontal' ? 'sm:w-1/3 sm:pt-2' : ''}>
        <Label className="text-sm sm:text-base font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>
      
      <div className={layout === 'horizontal' ? 'sm:w-2/3' : 'w-full'}>
        {children}
        {error && (
          <p className="text-xs sm:text-sm text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function ResponsiveInput({
  label,
  error,
  fullWidth = true,
  className = "",
  ...props
}: ResponsiveInputProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <Label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        className={`w-full h-10 sm:h-11 text-sm sm:text-base ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs sm:text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function ResponsiveTextarea({
  label,
  error,
  fullWidth = true,
  className = "",
  ...props
}: ResponsiveTextareaProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <Label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Textarea
        className={`w-full min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-y ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs sm:text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

interface ResponsiveFormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  stack?: boolean;
  className?: string;
}

export function ResponsiveFormActions({
  children,
  align = 'right',
  stack = true,
  className = ""
}: ResponsiveFormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  const stackClass = stack 
    ? 'flex flex-col sm:flex-row gap-2 sm:gap-3'
    : 'flex flex-row gap-2 sm:gap-3';

  return (
    <div className={`${stackClass} ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export function ResponsiveButton({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ResponsiveButtonProps) {
  const sizeClasses = {
    sm: 'h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm',
    md: 'h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base',
    lg: 'h-10 sm:h-11 px-6 sm:px-8 text-base sm:text-lg'
  };

  return (
    <Button
      variant={variant}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium
        touch-target
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
