import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, secureFileUpload, getCsrfToken } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

export default function CsrfTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<{[key: string]: {success: boolean, message: string}}>({}); 
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [requestHeaders, setRequestHeaders] = useState<string>("");
  const [cookies, setCookies] = useState<string>("");
  
  // Refresh browser information
  const refreshBrowserInfo = () => {
    // Get cookies
    setCookies(document.cookie || "No cookies found");
    
    // Simulate getting headers (for demonstration only - we can't directly read headers)
    setRequestHeaders(JSON.stringify({
      "User-Agent": navigator.userAgent,
      "CSRF-Token": getCsrfToken() || "Not found",
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Cookie": document.cookie || "No cookies found",
    }, null, 2));
  };
  
  // Initialize when component mounts
  useEffect(() => {
    refreshBrowserInfo();
  }, []);

  // Test getting CSRF token
  const testGetCsrfToken = () => {
    setIsLoading(prev => ({ ...prev, token: true }));
    try {
      const token = getCsrfToken();
      setTestResults(prev => ({ 
        ...prev, 
        token: {
          success: !!token,
          message: token ? `Token found: ${token.substring(0, 8)}...` : 'No CSRF token found'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        token: {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, token: false }));
    }
  };

  // Test API request with CSRF token
  const testApiRequest = async () => {
    setIsLoading(prev => ({ ...prev, api: true }));
    try {
      const res = await apiRequest('GET', '/api/me', undefined);
      const data = await res.json();
      
      setTestResults(prev => ({ 
        ...prev, 
        api: {
          success: res.ok,
          message: `Status: ${res.status} ${res.statusText}, ${JSON.stringify(data)}`
        }
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        api: {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, api: false }));
    }
  };

  // Test professional profile API with CSRF
  const testProfessionalProfileApi = async () => {
    setIsLoading(prev => ({ ...prev, profile: true }));
    try {
      // Create FormData with minimal profile data
      const formData = new FormData();
      formData.append('title', 'Test Professional');
      formData.append('bio', 'This is a test profile bio created for CSRF testing.');
      
      console.log("FormData for professional profile test:", Array.from(formData.entries()));
      console.log("CSRF Token:", getCsrfToken());
      
      const res = await secureFileUpload('PUT', '/api/professionals/me', formData);
      let responseText = '';
      
      try {
        const responseData = await res.json();
        responseText = JSON.stringify(responseData);
      } catch {
        responseText = await res.text();
      }
      
      setTestResults(prev => ({ 
        ...prev, 
        profile: {
          success: res.ok,
          message: `Status: ${res.status} ${res.statusText}, Response: ${responseText}`
        }
      }));
      
      if (res.ok) {
        toast({
          title: "Profile test successful",
          description: "Professional profile API test passed!"
        });
      }
    } catch (error) {
      console.error("Profile test error:", error);
      setTestResults(prev => ({ 
        ...prev, 
        profile: {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }));
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">CSRF Protection Testing</h1>
      <p className="text-muted-foreground mb-6">
        This page contains tests to verify that our CSRF protection is working correctly.
      </p>
      
      <Tabs defaultValue="tests">
        <TabsList className="mb-4">
          <TabsTrigger value="tests">Run Tests</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="headers">Request Headers</TabsTrigger>
          <TabsTrigger value="cookies">Cookies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tests">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CSRF Token Test</CardTitle>
                <CardDescription>Checks if the CSRF token is available in cookies</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  This test will check if the browser has a valid CSRF token cookie set.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={testGetCsrfToken} disabled={isLoading.token}>
                  {isLoading.token ? 'Testing...' : 'Test CSRF Token'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Request Test</CardTitle>
                <CardDescription>Tests an authenticated API request with CSRF</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  This test attempts to make an API request that should include the CSRF token.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={testApiRequest} disabled={isLoading.api}>
                  {isLoading.api ? 'Testing...' : 'Test API Request'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Professional Profile API Test</CardTitle>
                <CardDescription>Tests updating a professional profile with CSRF protection</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  This test will attempt to update a professional profile with the CSRF token.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={testProfessionalProfileApi} disabled={isLoading.profile}>
                  {isLoading.profile ? 'Testing...' : 'Test Profile API'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Detailed results from the CSRF tests</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(testResults).length === 0 ? (
                <p className="text-muted-foreground">No tests have been run yet</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testResults).map(([key, result]) => (
                    <div key={key} className="p-4 border rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <h3 className="font-medium">
                          {key === 'token' && 'CSRF Token Test'}
                          {key === 'api' && 'API Request Test'}
                          {key === 'profile' && 'Professional Profile API Test'}
                        </h3>
                      </div>
                      <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="headers">
          <Card>
            <CardHeader>
              <CardTitle>Request Headers</CardTitle>
              <CardDescription>
                Headers that would be sent with requests (simulated)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={refreshBrowserInfo}
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
              </div>
              <Textarea 
                className="font-mono h-64 bg-muted" 
                readOnly 
                value={requestHeaders} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cookies">
          <Card>
            <CardHeader>
              <CardTitle>Browser Cookies</CardTitle>
              <CardDescription>
                Current cookies stored in the browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={refreshBrowserInfo}
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
              </div>
              <div className="border p-4 rounded-md bg-muted font-mono break-all whitespace-pre-wrap">
                {cookies || "No cookies found"}
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-sm">Security Notes:</h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>CSRF tokens should be present in the XSRF-TOKEN cookie.</li>
                  <li>The CSRF cookie works with the X-CSRF-Token header on form submissions.</li>
                  <li>If tokens are missing, try visiting a protected page or reloading.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}