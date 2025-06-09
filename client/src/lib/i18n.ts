// English-only translations (removed internationalization)
export const translations = {
  // Navigation
  "nav.home": "Home",
  "nav.professionals": "Find Professionals",
  "nav.jobs": "Browse Jobs", 
  "nav.resources": "Resources",
  "nav.forum": "Community Forum",
  "nav.messages": "Messages",
  "nav.login": "Login",
  "nav.register": "Sign Up",
  "nav.profile": "Profile",
  "nav.dashboard": "Dashboard",
  "nav.logout": "Logout",
  "nav.admin": "Admin Panel",
  "nav.postJob": "Post a Job",
  "nav.editProfile": "Edit Profile",
  "nav.manageResources": "Manage Resources",

  // Auth & Forms
  "auth.login": "Login",
  "auth.register": "Register",
  "auth.logout": "Logout",
  "auth.forgotPassword": "Forgot Password",
  "auth.resetPassword": "Reset Password",
  "auth.rememberMe": "Remember me",
  "auth.userType": "Account Type",
  "auth.professional": "L&D Professional",
  "auth.company": "Company",
  "auth.firstName": "First Name",
  "auth.lastName": "Last Name",
  "auth.username": "Username",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm Password",
  "auth.register.title": "Create Your Account",
  "auth.register.subtitle": "Join our platform to connect with opportunities",
  "auth.registerSuccess": "Registration Successful",
  "auth.registerFailed": "Registration Failed",
  "auth.userType.professional": "I'm a Learning & Development Professional",
  "auth.userType.company": "I represent a Company",
  "auth.userType.label": "Account Type",
  "form.email": "Email",
  "form.password": "Password",
  "form.confirmPassword": "Confirm Password",
  "form.firstName": "First Name",
  "form.lastName": "Last Name",
  "form.username": "Username",
  "form.phone": "Phone Number",
  "form.save": "Save",
  "form.cancel": "Cancel",
  "form.submit": "Submit",
  "form.required": "This field is required",

  // Professional Profile
  "profile.title": "Professional Profile",
  "profile.edit": "Edit Profile",
  "profile.experience": "Experience",
  "profile.skills": "Skills",
  "profile.certifications": "Certifications",
  "profile.portfolio": "Portfolio",
  "profile.contact": "Contact Information",

  // Job Postings
  "jobs.title": "Job Opportunities",
  "jobs.post": "Post a Job",
  "jobs.apply": "Apply Now",
  "jobs.deadline": "Application Deadline",
  "jobs.salary": "Salary Range",
  "jobs.location": "Location",
  "jobs.type": "Job Type",

  // Payment System
  "payment.dashboard": "Payment Dashboard",
  "payment.escrowPayment": "Secure Escrow Payment",
  "payment.escrowDescription": "Your payment is protected by our secure escrow system",
  "payment.totalAmount": "Total Amount",
  "payment.serviceAmount": "Service Amount",
  "payment.platformFee": "Platform Fee",
  "payment.trainerReceives": "Trainer Receives",
  "payment.proceedToPayment": "Proceed to Payment",
  "payment.completePayment": "Complete Payment",
  "payment.securePaymentForm": "Enter your payment details securely",
  "payment.payNow": "Pay Now",
  "payment.processing": "Processing...",
  "payment.success": "Success",
  "payment.error": "Error",
  "payment.paymentSuccessful": "Payment completed successfully",
  "payment.paymentFailed": "Payment failed. Please try again.",
  "payment.escrowProtection": "Escrow Protection",
  "payment.escrowExplanation": "Your payment is held securely until service completion",
  "payment.escrowBenefit1": "Funds only released upon service completion",
  "payment.escrowBenefit2": "Full refund protection if service not delivered",
  "payment.escrowBenefit3": "Automatic release after 7 days if no issues",
  "payment.escrowStatus": "Payment Status",
  "payment.amount": "Amount",
  "payment.created": "Created",
  "payment.autoRelease": "Auto Release",
  "payment.releaseFunds": "Release Funds",
  "payment.requestRefund": "Request Refund",
  "payment.fundsReleased": "Funds released successfully",
  "payment.refundRequested": "Refund requested successfully",
  "payment.releaseError": "Failed to release funds",
  "payment.refundError": "Failed to request refund",
  "payment.totalEarnings": "Total Earnings",
  "payment.pendingAmount": "Pending Amount",
  "payment.totalTransactions": "Total Transactions",
  "payment.completedTransactions": "completed",
  "payment.activeTransactions": "active",
  "payment.allTime": "All time",
  "payment.allTransactions": "All Transactions",
  "payment.active": "Active",
  "payment.completed": "Completed",
  "payment.transactionDetails": "Transaction Details",
  "payment.transactionId": "Transaction ID",
  "payment.paymentBreakdown": "Payment Breakdown",
  "payment.transactionHistory": "Transaction History",
  "payment.noDescription": "No description provided",
  "payment.autoReleaseDate": "Auto release date",
  "payment.status.pending": "Pending",
  "payment.status.payment_failed": "Payment Failed",
  "payment.status.in_escrow": "In Escrow",
  "payment.status.released": "Released",
  "payment.status.refunded": "Refunded",
  "payment.status.disputed": "Disputed",
  "payment.status.cancelled": "Cancelled",
  "payment.statusMessage.pending": "Payment is being processed",
  "payment.statusMessage.inEscrow": "Funds are held securely in escrow",
  "payment.statusMessage.released": "Payment has been released to trainer",
  "payment.statusMessage.unknown": "Status unknown",
  "payment.action.created": "Transaction Created",
  "payment.action.funds_captured": "Funds Captured",
  "payment.action.released": "Funds Released",
  "payment.action.refunded": "Refund Processed",

  // Common
  "common.loading": "Loading...",
  "common.refresh": "Refresh",
  "common.cancel": "Cancel",
  "common.viewDetails": "View Details",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.save": "Save",
  "common.close": "Close",
  "common.yes": "Yes",
  "common.no": "No",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.sort": "Sort",
  "common.previous": "Previous",
  "common.next": "Next"
};

// Simple translation function to replace i18n
export function t(key: string, options?: { [key: string]: any }): string {
  const translation = translations[key as keyof typeof translations] || key;
  
  if (options) {
    return Object.keys(options).reduce((result, optionKey) => {
      return result.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(options[optionKey]));
    }, translation);
  }
  
  return translation;
}

// Hook replacement for useTranslation
export function useTranslation() {
  return {
    t,
    i18n: {
      language: 'en',
      dir: () => 'ltr',
      changeLanguage: () => Promise.resolve()
    }
  };
}

// Date and currency formatting utilities (English only)
export const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateObj);
};