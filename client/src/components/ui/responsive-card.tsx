
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

interface ResponsiveCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
}

export function ResponsiveCard({
  title,
  description,
  children,
  footer,
  variant = 'default',
  size = 'md',
  hover = true,
  className = ""
}: ResponsiveCardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg border-0',
    outlined: 'bg-transparent border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-200'
  };

  const sizeClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const hoverClass = hover ? 'hover:shadow-md transition-shadow duration-200' : '';

  return (
    <Card className={`${variantClasses[variant]} ${hoverClass} ${className}`}>
      {(title || description) && (
        <CardHeader className={`${size === 'sm' ? 'pb-2' : 'pb-4'}`}>
          {title && (
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      <CardContent className={sizeClasses[size]}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className={`${size === 'sm' ? 'pt-2' : 'pt-4'} ${sizeClasses[size]}`}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

interface ResponsiveCardGridProps {
  children: React.ReactNode;
  minWidth?: string;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveCardGrid({
  children,
  minWidth = '280px',
  gap = 'md',
  className = ""
}: ResponsiveCardGridProps) {
  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  return (
    <div 
      className={`grid ${gapClasses[gap]} ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))` 
      }}
    >
      {children}
    </div>
  );
}

interface MobileOptimizedCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function MobileOptimizedCard({
  title,
  subtitle,
  image,
  children,
  actions,
  className = ""
}: MobileOptimizedCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      {image && (
        <div className="aspect-video sm:aspect-[4/3] lg:aspect-video overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="text-sm sm:text-base text-gray-700">
            {children}
          </div>
        </div>
      </CardContent>
      
      {actions && (
        <CardFooter className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            {actions}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
