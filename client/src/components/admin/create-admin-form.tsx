import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

const adminUserSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  secretKey: z.string().min(1, { message: "Secret key is required" }),
});

type AdminUserFormValues = z.infer<typeof adminUserSchema>;

export default function CreateAdminForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{
    username: string;
    id: number;
  } | null>(null);

  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      secretKey: "",
    },
  });

  const onSubmit = async (data: AdminUserFormValues) => {
    setIsSubmitting(true);
    setSuccess(false);
    try {
      const response = await apiRequest("POST", "/api/create-admin", data);
      const result = await response.json();
      
      setSuccess(true);
      setCreatedAdmin({
        username: data.username,
        id: result.admin.id,
      });
      
      toast({
        title: "Admin Created",
        description: "The admin user has been created successfully",
      });
      
      form.reset();
    } catch (error) {
      console.error("Admin creation error:", error);
      toast({
        title: "Admin Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create admin user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createTestAdmin = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/create-test-admin", {});
      const result = await response.json();
      
      setSuccess(true);
      setCreatedAdmin({
        username: result.user.username,
        id: result.user.id,
      });
      
      toast({
        title: "Test Admin Created",
        description: `Username: ${result.user.username}, Password: ${result.user.password}`,
      });
    } catch (error) {
      console.error("Test admin creation error:", error);
      toast({
        title: "Test Admin Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create test admin user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Admin User</CardTitle>
        <CardDescription>
          Create a new admin user with full system access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && createdAdmin ? (
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center border rounded-lg bg-green-50 border-green-200">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h3 className="text-xl font-semibold text-green-700">Admin User Created</h3>
            <p className="text-green-600">
              Username: <span className="font-semibold">{createdAdmin.username}</span> (ID: {createdAdmin.id})
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setCreatedAdmin(null);
              }}
            >
              Create Another Admin
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin_username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter secret key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={createTestAdmin} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Test Admin"
                  )}
                </Button>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Admin"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <p className="text-sm text-muted-foreground">
          The secret key is required to create an admin user. Default key: "ldn_admin_setup_2025"
        </p>
      </CardFooter>
    </Card>
  );
}