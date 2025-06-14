
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface FormLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  showActions?: boolean;
}

export function FormLayout({
  title,
  description,
  children,
  onSubmit,
  isLoading = false,
  submitText = "Save Changes",
  cancelText = "Cancel",
  onCancel,
  showActions = true
}: FormLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          <Separator />
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-8">
            {children}
            
            {showActions && (
              <>
                <Separator />
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isLoading}
                      className="order-2 sm:order-1"
                    >
                      {cancelText}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="order-1 sm:order-2"
                  >
                    {isLoading ? "Saving..." : submitText}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4 pl-0 sm:pl-4">
        {children}
      </div>
    </div>
  );
}

interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

export function FormGrid({ children, columns = 2 }: FormGridProps) {
  const columnClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  }[columns];

  return (
    <div className={`grid ${columnClass} gap-4`}>
      {children}
    </div>
  );
}
