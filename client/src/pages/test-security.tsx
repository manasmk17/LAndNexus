import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, secureFileUpload } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function TestSecurity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{[key: string]: any}>({});
  const [file, setFile] = useState<File | null>(null);
  
  // Test professional profile update with secureFileUpload
  async function testProfessionalProfileUpdate() {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to run this test",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResults({});
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('firstName', 'Security');
      formData.append('lastName', 'Test');
      formData.append('title', 'Security Tester');
      formData.append('bio', 'This is a security test for secure file upload functionality');
      formData.append('userId', user.id.toString());
      
      // Add file if selected
      if (file) {
        formData.append('profileImage', file);
      }
      
      const response = await secureFileUpload('PUT', '/api/professionals/me', formData);
      const responseData = await response.json();
      
      setResults({
        status: response.status,
        ok: response.ok,
        data: responseData
      });
      
      toast({
        title: response.ok ? "Test passed" : "Test failed",
        description: `Status: ${response.status}`,
        variant: response.ok ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Test error:", error);
      setResults({
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Test error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Test regular API request with CSRF token
  async function testApiRequest() {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to run this test",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResults({});
    
    try {
      // Test a simple POST request with CSRF token
      const response = await apiRequest('POST', '/api/expertise', { name: 'Security Testing' });
      const responseData = await response.json();
      
      setResults({
        status: response.status,
        ok: response.ok,
        data: responseData
      });
      
      toast({
        title: response.ok ? "Test passed" : "Test failed",
        description: `Status: ${response.status}`,
        variant: response.ok ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Test error:", error);
      setResults({
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Test error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Security Test Page</CardTitle>
          <CardDescription>
            Test secure file uploads and CSRF protection
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="file-upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file-upload">Secure File Upload</TabsTrigger>
              <TabsTrigger value="api-request">API Request</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file-upload" className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test File</label>
                <Input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: Select a file to test secure file upload
                </p>
              </div>
              
              <Button 
                onClick={testProfessionalProfileUpdate} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Secure File Upload
              </Button>
            </TabsContent>
            
            <TabsContent value="api-request" className="space-y-4 pt-4">
              <div>
                <p>This will test a simple API request with CSRF protection.</p>
                <p className="text-sm text-muted-foreground">It will create a new expertise entry called "Security Testing".</p>
              </div>
              
              <Button 
                onClick={testApiRequest}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test API Request
              </Button>
            </TabsContent>
          </Tabs>
          
          {Object.keys(results).length > 0 && (
            <div className="mt-6 border rounded-md p-4">
              <h3 className="font-medium mb-2">Test Results</h3>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-[300px]">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            User: {user ? `${user.username} (ID: ${user.id})` : "Not logged in"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}