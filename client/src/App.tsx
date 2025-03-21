import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Home from "@/pages/home";
import Register from "@/pages/register";
import Login from "@/pages/login";
import ProfessionalDashboard from "@/pages/professional-dashboard";
import CompanyDashboard from "@/pages/company-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Professionals from "@/pages/professionals";
import ProfessionalProfile from "@/pages/professional-profile";
import EditProfile from "@/pages/edit-profile";
import Jobs from "@/pages/jobs";
import PostJob from "@/pages/post-job";
import JobDetail from "@/pages/job-detail";
import Resources from "@/pages/resources";
import ManageResources from "@/pages/manage-resources";
import CareerRecommendations from "@/pages/career-recommendations";
import ResourceDetail from "@/pages/resource-detail";
import Forum from "@/pages/forum";
import Messages from "@/pages/messages";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import SubscriptionSuccess from "@/pages/subscription-success";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/professional-dashboard" component={ProfessionalDashboard} />
      <Route path="/company-dashboard" component={CompanyDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/professionals" component={Professionals} />
      <Route path="/professional-profile/:id" component={ProfessionalProfile} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/job/:id" component={JobDetail} />
      <Route path="/resources" component={Resources} />
      <Route path="/manage-resources" component={ManageResources} />
      <Route path="/career-recommendations" component={CareerRecommendations} />
      <Route path="/resource/:id" component={ResourceDetail} />
      <Route path="/forum" component={Forum} />
      <Route path="/messages" component={Messages} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/subscribe/:tierId" component={Subscribe} />
      <Route path="/subscription-success" component={SubscriptionSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
