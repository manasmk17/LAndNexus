import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

interface LayoutHeaderProps {
  children: React.ReactNode;
}

export function LayoutHeader({ children }: LayoutHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40 py-4 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
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
    <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
  );
}

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="space-y-8">
        {children}
      </div>
    </main>
  );
}

interface LayoutSidebarProps {
  children: React.ReactNode;
}

export function LayoutSidebar({ children }: LayoutSidebarProps) {
  return (
    <aside className="w-full md:w-64 bg-muted/30 p-4 border-r">
      {children}
    </aside>
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