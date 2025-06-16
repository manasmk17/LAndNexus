import { createContext, useContext, ReactNode } from "react";

const translations = {
  "auth.register.title": "Create Account",
  "auth.register.subtitle": "Join our professional development platform",
  "auth.registerButton": "Create Account",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.login.title": "Sign In",
  "auth.login.subtitle": "Welcome back to L&D Nexus",
  "auth.loginButton": "Sign In",
  "auth.noAccount": "Don't have an account?",
  "auth.forgotPassword": "Forgot your password?",
  "nav.home": "Home",
  "nav.professionals": "Professionals",
  "nav.jobs": "Jobs",
  "nav.resources": "Resources",
  "nav.forum": "Forum",
  "nav.dashboard": "Dashboard",
  "nav.login": "Login",
  "nav.register": "Register",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.logout": "Logout",
  "form.username": "Username",
  "form.email": "Email",
  "form.password": "Password",
  "form.confirmPassword": "Confirm Password",
  "form.firstName": "First Name",
  "form.lastName": "Last Name",
  "form.userType": "Account Type",
  "form.userType.professional": "Professional",
  "form.userType.company": "Company",
  "form.required": "This field is required",
  "form.emailInvalid": "Please enter a valid email address",
  "form.passwordMinLength": "Password must be at least 8 characters",
  "form.passwordsNoMatch": "Passwords don't match",
  "error.general": "Something went wrong. Please try again.",
  "success.registration": "Account created successfully!",
  "success.login": "Welcome back!"
};

interface TranslationContextType {
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType>({
  t: (key: string) => key
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const t = (key: string) => {
    return translations[key as keyof typeof translations] || key;
  };

  return (
    <TranslationContext.Provider value={{ t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}