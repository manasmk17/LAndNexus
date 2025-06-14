
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EnhancedCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  badges?: Array<{
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function EnhancedCard({
  title,
  subtitle,
  description,
  image,
  badges,
  actions,
  children,
  className,
  hover = true,
  onClick
}: EnhancedCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300",
        hover && "hover:shadow-lg hover:-translate-y-1",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {image && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
            {actions && (
              <div className="flex gap-1 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
          )}
          
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {badges.map((badge, index) => (
                <Badge 
                  key={index} 
                  variant={badge.variant || "secondary"}
                  className="text-xs"
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
        )}
      </CardHeader>
      
      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

interface CardGridProps {
  children: React.ReactNode;
  columns?: "auto" | 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  minCardWidth?: string;
}

export function CardGrid({ 
  children, 
  columns = "auto", 
  gap = "md",
  minCardWidth = "280px"
}: CardGridProps) {
  const gapClass = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8"
  }[gap];

  if (columns === "auto") {
    return (
      <div 
        className={`grid ${gapClass}`}
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`
        }}
      >
        {children}
      </div>
    );
  }

  const columnClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  }[columns];

  return (
    <div className={`grid ${columnClass} ${gapClass}`}>
      {children}
    </div>
  );
}
