import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { usePerformanceMonitor } from "@/hooks/use-performance";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
  showBreadcrumbs?: boolean;
  className?: string;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="mt-2">
          <p className="font-medium mb-2">Something went wrong</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || "An unexpected error occurred"}
          </p>
          <Button onClick={resetErrorBoundary} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnhancedLayout({ 
  children, 
  user, 
  onLogout, 
  showBreadcrumbs = true, 
  className = "" 
}: LayoutProps) {
  const metrics = usePerformanceMonitor();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className={`min-h-screen bg-background ${className}`}>
        {/* Header with mobile navigation */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <MobileNavigation user={user} onLogout={onLogout} />
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">L&D</span>
                </div>
                <span className="font-semibold text-lg">L&D Nexus</span>
              </div>
            </div>

            {/* Desktop navigation - simplified for now */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-sm font-medium hover:text-primary">Home</a>
              <a href="/professionals" className="text-sm font-medium hover:text-primary">Professionals</a>
              <a href="/jobs" className="text-sm font-medium hover:text-primary">Jobs</a>
              <a href="/resources" className="text-sm font-medium hover:text-primary">Resources</a>
              {user ? (
                <Button onClick={onLogout} variant="outline" size="sm">
                  Sign Out
                </Button>
              ) : (
                <Button asChild variant="default" size="sm">
                  <a href="/login">Sign In</a>
                </Button>
              )}
            </nav>
          </div>
        </header>

        {/* Main content with breadcrumbs */}
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6">
            {showBreadcrumbs && <BreadcrumbNavigation />}
            
            <Suspense fallback={<LoadingSkeleton />}>
              <div className="animate-in fade-in-0 duration-200">
                {children}
              </div>
            </Suspense>
          </div>
        </main>

        {/* Performance indicator (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-muted/90 backdrop-blur text-xs p-2 rounded-lg border">
            Load: {metrics.loadTime.toFixed(0)}ms | 
            Memory: {metrics.memoryUsage.toFixed(1)}MB
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}