import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TestCascadeDelete() {
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCascadeDelete = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      toast({
        title: "Invalid User ID",
        description: "Please enter a valid user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setError(null);

      const response = await apiRequest(
        "DELETE",
        `/api/admin/users/${userId}/cascade`
      );

      const data = await response.json();
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
        toast({
          title: "Success",
          description: "User and related records deleted successfully",
        });
      } else {
        setError(`Status: ${response.status} - ${data.message}`);
        toast({
          title: "Error",
          description: data.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegularDelete = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      toast({
        title: "Invalid User ID",
        description: "Please enter a valid user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setError(null);

      const response = await apiRequest(
        "DELETE",
        `/api/admin/users/${userId}`
      );

      const data = await response.json();
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } else {
        setError(`Status: ${response.status} - ${data.message}`);
        toast({
          title: "Error",
          description: data.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Test User Deletion</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Delete User</CardTitle>
          <CardDescription>Test both regular and cascade delete operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            onClick={handleRegularDelete} 
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Processing
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> 
                Regular Delete
              </>
            )}
          </Button>
          <Button 
            onClick={handleCascadeDelete}
            disabled={loading}
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Processing
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> 
                Cascade Delete
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="font-mono">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 font-mono text-sm">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}