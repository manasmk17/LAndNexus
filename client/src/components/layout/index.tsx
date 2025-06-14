import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {children}
    </div>
  );
}

interface LayoutHeaderProps {
  children: React.ReactNode;
}

export function LayoutHeader({ children }: LayoutHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40 py-2 sm:py-4 safe-top">
      <div className="container-responsive">
        {children}
      </div>
    </div>
  );
}

interface LayoutTitleProps {
  children: React.ReactNode;
}

export function LayoutTitle({ children }: LayoutTitleProps) {
  return (
    <h1 className="text-responsive-lg font-bold tracking-tight text-center-mobile">
      {children}
    </h1>
  );
}

interface LayoutContentProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function LayoutContent({ children, className = "", fullWidth = false }: LayoutContentProps) {
  return (
    <main className={`${fullWidth ? 'w-full px-4 sm:px-6 lg:px-8' : 'container-responsive'} py-4 sm:py-6 lg:py-8 safe-bottom ${className}`}>
      {children}
    </main>
  );
}

interface LayoutSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutSidebar({ children, className = "" }: LayoutSidebarProps) {
  return (
    <aside className={`sidebar-responsive bg-muted/30 p-4 sm:p-6 border-r ${className}`}>
      <div className="space-responsive">
        {children}
      </div>
    </aside>
  );
}

interface LayoutGridProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutGrid({ children, className = "" }: LayoutGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] min-h-[calc(100vh-4rem)] ${className}`}>
      {children}
    </div>
  );
}

interface LayoutFooterProps {
  children: React.ReactNode;
}

export function LayoutFooter({ children }: LayoutFooterProps) {
  return (
    <footer className="border-t py-6 sm:py-8 lg:py-12 bg-muted/10 safe-bottom">
      <div className="container-responsive">
        {children}
      </div>
    </footer>
  );
}

interface LayoutSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutSection({ children, className = "" }: LayoutSectionProps) {
  return (
    <section className={`py-8 sm:py-12 lg:py-16 ${className}`}>
      <div className="container-responsive">
        {children}
      </div>
    </section>
  );
}

interface LayoutCardProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutCard({ children, className = "" }: LayoutCardProps) {
  return (
    <div className={`card-responsive ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  size?: 'default' | 'tight' | 'wide' | 'full';
  className?: string;
}

export function ResponsiveContainer({ 
  children, 
  size = 'default', 
  className = "" 
}: ResponsiveContainerProps) {
  const sizeClasses = {
    default: 'container-responsive',
    tight: 'container-tight',
    wide: 'w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}

interface LayoutGridProps {
  children: React.ReactNode;
}

export function LayoutGrid({ children }: LayoutGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] h-[calc(100vh-4rem)]">
      {children}
    </div>
  );
}

interface LayoutFooterProps {
  children: React.ReactNode;
}

export function LayoutFooter({ children }: LayoutFooterProps) {
  return (
    <footer className="border-t py-6 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </footer>
  );
}