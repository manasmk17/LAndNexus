import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { useState, useEffect } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/ui/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Home from "@/pages/home";
import Register from "@/pages/register";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import RecoverUsername from "@/pages/recover-username";
import ProfessionalDashboard from "@/pages/professional-dashboard";
import CompanyDashboard from "@/pages/company-dashboard";

import Professionals from "@/pages/professionals";
import ProfessionalProfile from "@/pages/professional-profile";
import EditProfile from "@/pages/edit-profile";
import SettingsPage from "@/pages/settings";
import Jobs from "@/pages/jobs";
import PostJob from "@/pages/post-job";
import JobDetail from "@/pages/job-detail";
import Resources from "@/pages/resources";
import ManageResources from "@/pages/manage-resources";
import CreateResource from "@/pages/create-resource";
import CareerRecommendations from "@/pages/career-recommendations";
import ResourceDetail from "@/pages/resource-detail";
import Forum from "@/pages/forum";
import Messages from "@/pages/messages";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import SubscriptionSuccess from "@/pages/subscription-success";
import SubscriptionPlans from "@/pages/subscription-plans";
import ManageSubscription from "@/pages/manage-subscription";
import ProfileSuccess from "@/pages/profile-success";
import BookConsultation from "@/pages/book-consultation";
import PageView from "@/pages/page";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";
import JobApplications from "@/pages/job-applications";
import AdminDashboard from "@/pages/admin-dashboard";
import { AuthProvider } from "@/lib/auth";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/recover-username" component={RecoverUsername} />
      <Route path="/professionals" component={Professionals} />
      <Route path="/professional-profile/:id" component={ProfessionalProfile} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/job/:id" component={JobDetail} />
      <Route path="/resources" component={Resources} />
      <Route path="/resource/:id" component={ResourceDetail} />
      <Route path="/forum" component={Forum} />
      <Route path="/about" component={About} />
      <Route path="/pages/:slug" component={PageView} />
      
      {/* Job Applications Route */}
      <ProtectedRoute 
        path="/job/:id/applications" 
        component={JobApplications} 
        userTypes={["company"]} 
      />

      {/* Protected routes with user type restrictions */}
      <ProtectedRoute 
        path="/professional-dashboard" 
        component={ProfessionalDashboard} 
        userTypes={["professional"]} 
      />
      <ProtectedRoute 
        path="/company-dashboard" 
        component={CompanyDashboard} 
        userTypes={["company"]} 
      />
      
      {/* Admin Dashboard Route */}
      <ProtectedRoute 
        path="/admin" 
        component={AdminDashboard} 
        adminOnly={true} 
      />

      <ProtectedRoute 
        path="/edit-profile" 
        component={EditProfile} 
      />
      <ProtectedRoute 
        path="/profile" 
        component={EditProfile} 
      />
      <ProtectedRoute 
        path="/settings" 
        component={SettingsPage} 
      />
      <ProtectedRoute 
        path="/post-job" 
        component={PostJob} 
        userTypes={["company"]} 
      />
      <ProtectedRoute 
        path="/manage-resources" 
        component={ManageResources} 
        userTypes={["professional"]} 
      />
      <ProtectedRoute 
        path="/create-resource" 
        component={CreateResource} 
        userTypes={["professional", "company"]} 
      />
      <ProtectedRoute 
        path="/career-recommendations" 
        component={CareerRecommendations} 
        userTypes={["professional"]} 
      />
      <ProtectedRoute 
        path="/messages" 
        component={Messages} 
      />
      <ProtectedRoute 
        path="/checkout" 
        component={Checkout} 
      />
      {/* Subscription routes */}
      <Route path="/subscription-plans" component={SubscriptionPlans} />
      <ProtectedRoute 
        path="/subscribe" 
        component={Subscribe} 
      />
      <ProtectedRoute 
        path="/subscribe/:tierId" 
        component={Subscribe} 
      />
      <ProtectedRoute 
        path="/subscription-success" 
        component={SubscriptionSuccess} 
      />
      <ProtectedRoute 
        path="/manage-subscription" 
        component={ManageSubscription} 
      />
      <ProtectedRoute 
        path="/profile-success" 
        component={ProfileSuccess} 
      />
      <ProtectedRoute 
        path="/book-consultation/:id" 
        component={BookConsultation} 
      />

      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();

  // Prevent automatic redirect loops to resource pages
  useEffect(() => {
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // If we're being redirected to a resource page automatically, stop it
    if (searchParams.has('redirect') && searchParams.get('redirect')?.includes('/resource/')) {
      console.log('Preventing automatic resource page redirect');
      searchParams.delete('redirect');
      const newUrl = window.location.pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
      
      // Redirect to home if we're on a problematic page
      if (currentPath.includes('/resource/') && !document.referrer.includes('/resource')) {
        setLocation('/');
      }
    }
  }, [setLocation]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
