import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Zap, 
  Shield, 
  Upload,
  MessageSquare,
  Star,
  Bot,
  Activity
} from "lucide-react";

interface FeatureStatus {
  name: string;
  status: 'working' | 'degraded' | 'broken';
  description: string;
  lastTested: string;
  details?: any;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  lastChecked: string;
  issues: string[];
  details: any;
}

interface DiagnosticsData {
  timestamp: string;
  platform: string;
  version: string;
  overallHealth: 'healthy' | 'degraded' | 'critical';
  features: FeatureStatus[];
  systemComponents: Record<string, SystemHealth>;
  recommendations: string[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'working':
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'broken':
    case 'critical':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Activity className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'working':
    case 'healthy':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'broken':
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getFeatureIcon = (featureName: string) => {
  if (featureName.includes('AI')) return <Bot className="h-4 w-4" />;
  if (featureName.includes('Rating')) return <Star className="h-4 w-4" />;
  if (featureName.includes('Notification')) return <MessageSquare className="h-4 w-4" />;
  if (featureName.includes('Upload')) return <Upload className="h-4 w-4" />;
  if (featureName.includes('Authentication')) return <Shield className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
};

export default function SystemStatusPage() {
  const { data: diagnostics, isLoading, error, refetch } = useQuery<DiagnosticsData>({
    queryKey: ['/api/system/comprehensive-diagnostics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4" />
          <AlertTitle>System Status Unavailable</AlertTitle>
          <AlertDescription>
            Unable to retrieve system diagnostics. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!diagnostics) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            System diagnostics data is not available at the moment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const workingFeatures = diagnostics.features.filter(f => f.status === 'working').length;
  const totalFeatures = diagnostics.features.length;
  const healthPercentage = (workingFeatures / totalFeatures) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Status Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of L&D Nexus platform functionality
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Overall Health Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(diagnostics.overallHealth)}
                Overall System Health
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(diagnostics.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(diagnostics.overallHealth)}>
              {diagnostics.overallHealth.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Functional Features</span>
                <span>{workingFeatures}/{totalFeatures}</span>
              </div>
              <Progress value={healthPercentage} className="h-2" />
            </div>
            
            {diagnostics.recommendations.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Recommendations</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {diagnostics.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {diagnostics.features.map((feature, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {getFeatureIcon(feature.name)}
                {feature.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getStatusIcon(feature.status)}
                  <Badge className={getStatusColor(feature.status)}>
                    {feature.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                
                <div className="text-xs text-muted-foreground">
                  Last tested: {new Date(feature.lastTested).toLocaleString()}
                </div>

                {feature.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(feature.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Components
          </CardTitle>
          <CardDescription>
            Core infrastructure and service status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(diagnostics.systemComponents).map(([name, component]) => (
              <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {name === 'database' && <Database className="h-5 w-5" />}
                  {name === 'stripe' && <Zap className="h-5 w-5" />}
                  {name === 'authentication' && <Shield className="h-5 w-5" />}
                  <div>
                    <h4 className="font-medium capitalize">{name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {component.details?.message || 'Component status'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(component.status)}
                  <Badge className={getStatusColor(component.status)}>
                    {component.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium">Platform</h4>
              <p className="text-sm text-muted-foreground">{diagnostics.platform}</p>
            </div>
            <div>
              <h4 className="font-medium">Version</h4>
              <p className="text-sm text-muted-foreground">{diagnostics.version}</p>
            </div>
            <div>
              <h4 className="font-medium">Last Check</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(diagnostics.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}