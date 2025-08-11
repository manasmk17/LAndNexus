import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X } from "lucide-react";
import clsx from "clsx";

// Password restriction check helper
const passwordChecks = [
  { id: "length", label: "Minimum 8 characters", test: (val: string) => val.length >= 8 },
  { id: "uppercase", label: "At least one uppercase letter", test: (val: string) => /[A-Z]/.test(val) },
  { id: "number", label: "At least one number", test: (val: string) => /\d/.test(val) },
  { id: "symbol", label: "At least one special character", test: (val: string) => /[^A-Za-z0-9]/.test(val) },
];

// Username restriction check helper
const usernameChecks = [
  { id: "length", label: "Minimum 3 characters", test: (val: string) => val.length >= 3 },
  { id: "noSpace", label: "No spaces", test: (val: string) => !/\s/.test(val) },
  { id: "onlyLettersNumbers", label: "Only letters & numbers", test: (val: string) => /^[A-Za-z0-9]+$/.test(val) },
];


// Validation schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must have at least one uppercase letter")
    .regex(/\d/, "Password must have at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must have at least one special character"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  userType: z.enum(["professional", "company"])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterFormProps = {
  initialUserType?: string;
};

export default function RegisterForm({ initialUserType }: RegisterFormProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showUsernameChecks, setShowUsernameChecks] = useState(false);
  const [showPasswordChecks, setShowPasswordChecks] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      userType: (initialUserType === "professional" || initialUserType === "company")
        ? initialUserType
        : "professional",
    },
  });

  const passwordValue = form.watch("password");
  const confirmPasswordValue = form.watch("confirmPassword");
  const passwordsMatch = passwordValue === confirmPasswordValue;

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      await login({ username: values.username, password: values.password });
      toast({
        title: t("auth.registerSuccess"),
        description: "Welcome to L&D Nexus",
      });

      setLocation(values.userType === "professional" ? "/professional-dashboard" : "/company-dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("auth.registerFailed"),
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* User Type */}
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t("auth.userType")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4 rtl:space-x-reverse"
                >
                  <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
                    <FormControl>
                      <RadioGroupItem value="professional" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("auth.professional")}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
                    <FormControl>
                      <RadioGroupItem value="company" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("auth.company")}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.firstName")}</FormLabel>
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
                <FormLabel>{t("auth.lastName")}</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.username")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="johndoe"
                  {...field}
                  onFocus={() => setShowUsernameChecks(true)}
                  onBlur={() => setShowUsernameChecks(false)}
                />
              </FormControl>
              {showUsernameChecks && (
                <div className="mt-1 space-y-1 text-sm">
                  {usernameChecks.map((check) => {
                    const valid = check.test(field.value);
                    return (
                      <div key={check.id} className={clsx("flex items-center gap-1", valid ? "text-green-600" : "text-red-500")}>
                        {valid ? <Check size={14} /> : <X size={14} />}
                        {check.label}
                      </div>
                    );
                  })}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                    onFocus={() => setShowPasswordChecks(true)}
                    onBlur={() => setShowPasswordChecks(false)}
                  />
                </FormControl>
                {showPasswordChecks && (
                  <div className="mt-1 space-y-1 text-sm">
                    {passwordChecks.map((check) => {
                      const valid = check.test(field.value);
                      return (
                        <div key={check.id} className={clsx("flex items-center gap-1", valid ? "text-green-600" : "text-red-500")}>
                          {valid ? <Check size={14} /> : <X size={14} />}
                          {check.label}
                        </div>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>

                {confirmPasswordValue.length > 0 && !passwordsMatch && (
                  <p className="text-red-500 text-sm mt-1">
                    Passwords don’t match
                  </p>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* Submit */}
        <Button type="submit" className="w-full btn-with-icon" disabled={isSubmitting}>
          {isSubmitting ? t("auth.registerButton") + "..." : t("auth.registerButton")}
        </Button>
      </form>
    </Form>
  );
}
