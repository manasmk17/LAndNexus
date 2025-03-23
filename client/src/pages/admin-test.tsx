import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SimpleDashboard from "@/components/admin/new/simple-dashboard";

export default function AdminTest() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Test Page</h1>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a test page to verify the admin dashboard components are working correctly.</p>
          </CardContent>
        </Card>
        
        <div className="border p-4 rounded-md bg-white">
          <h2 className="text-xl font-bold mb-4">Simple Dashboard Component</h2>
          <SimpleDashboard />
        </div>
      </div>
    </div>
  );
}