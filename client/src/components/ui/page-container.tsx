
import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  padding?: "sm" | "md" | "lg" | "xl";
}

export function PageContainer({ 
  children, 
  maxWidth = "2xl", 
  className,
  padding = "lg"
}: PageContainerProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-2xl",
    lg: "max-w-4xl", 
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full"
  }[maxWidth];

  const paddingClass = {
    sm: "px-4 py-4",
    md: "px-4 sm:px-6 py-6",
    lg: "px-4 sm:px-6 lg:px-8 py-8",
    xl: "px-4 sm:px-6 lg:px-8 py-12"
  }[padding];

  return (
    <div className={cn(
      "container mx-auto",
      maxWidthClass,
      paddingClass,
      className
    )}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="space-y-4 mb-8">
      {breadcrumbs && (
        <div className="text-sm text-muted-foreground">
          {breadcrumbs}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
