
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  stats?: Array<{
    label: string;
    value: string | number;
    trend?: "up" | "down" | "neutral";
    icon?: React.ReactNode;
  }>;
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  actions, 
  stats 
}: DashboardLayoutProps) {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Stats Section */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                {stat.icon && (
                  <div className="text-muted-foreground">
                    {stat.icon}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.trend && (
                    <Badge 
                      variant={
                        stat.trend === "up" ? "default" : 
                        stat.trend === "down" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {stat.trend === "up" ? "↗" : stat.trend === "down" ? "↘" : "→"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Main Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

export function DashboardGrid({ 
  children, 
  columns = 2, 
  gap = "md" 
}: DashboardGridProps) {
  const gapClass = {
    sm: "gap-4",
    md: "gap-6", 
    lg: "gap-8"
  }[gap];

  const columnClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  }[columns];

  return (
    <div className={`grid ${columnClass} ${gapClass}`}>
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardSection({ 
  title, 
  description, 
  children, 
  actions 
}: DashboardSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
