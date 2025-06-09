import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Date and currency formatting utilities
export const formatDate = (date: Date | string, locale: string = 'en') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (locale === 'ar') {
    return new Intl.DateTimeFormat('ar-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

export const formatCurrency = (amount: number, locale: string = 'en') => {
  if (locale === 'ar') {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatNumber = (number: number, locale: string = 'en') => {
  if (locale === 'ar') {
    return new Intl.NumberFormat('ar-AE').format(number);
  }
  
  return new Intl.NumberFormat('en-US').format(number);
};

const resources = {
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.professionals": "Professionals",
      "nav.jobs": "Jobs",
      "nav.resources": "Resources",
      "nav.forum": "Forum",
      "nav.login": "Login",
      "nav.register": "Register",
      "nav.dashboard": "Dashboard",
      "nav.profile": "Profile",
      "nav.logout": "Logout",
      "nav.postJob": "Post Job",
      "nav.messages": "Messages",
      "nav.consultations": "Consultations",

      // Authentication
      "auth.login.title": "Sign In to Your Account",
      "auth.login.subtitle": "Welcome back to L&D Nexus",
      "auth.register.title": "Create an Account",
      "auth.register.subtitle": "Join L&D Nexus to connect with professionals or find expert trainers",
      "auth.username": "Username",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.confirmPassword": "Confirm Password",
      "auth.firstName": "First Name",
      "auth.lastName": "Last Name",
      "auth.userType": "I am a...",
      "auth.professional": "L&D Professional",
      "auth.company": "Company",
      "auth.loginButton": "Sign In",
      "auth.registerButton": "Create Account",
      "auth.alreadyHaveAccount": "Already have an account?",
      "auth.needAccount": "Need an account?",
      "auth.forgotPassword": "Forgot Password?",
      "auth.loginSuccess": "Welcome back!",
      "auth.registerSuccess": "Registration successful!",
      "auth.loginFailed": "Login failed",
      "auth.registerFailed": "Registration failed",

      // Dashboard
      "dashboard.professional.title": "Professional Dashboard",
      "dashboard.professional.subtitle": "Manage your profile, applications, and consultations",
      "dashboard.company.title": "Company Dashboard",
      "dashboard.company.subtitle": "Manage your company profile and job postings",
      "dashboard.editProfile": "Edit Profile",
      "dashboard.createProfile": "Create Profile",
      "dashboard.applications": "Applications",
      "dashboard.consultations": "Consultations",
      "dashboard.messages": "Messages",
      "dashboard.matches": "Job Matches",
      "dashboard.subscription": "Subscription",

      // Profile
      "profile.edit.professional": "Edit Your Professional Profile",
      "profile.edit.company": "Edit Your Company Profile",
      "profile.edit.professionalSubtitle": "Showcase your expertise and attract clients",
      "profile.edit.companySubtitle": "Present your company and find L&D professionals",
      "profile.personalInfo": "Personal Information",
      "profile.title": "Title",
      "profile.bio": "Bio",
      "profile.location": "Location",
      "profile.email": "Email",
      "profile.phone": "Phone",
      "profile.yearsExperience": "Years of Experience",
      "profile.ratePerHour": "Rate per Hour",
      "profile.services": "Services",
      "profile.availability": "Availability",
      "profile.profileImage": "Profile Image",
      "profile.expertise": "Expertise",
      "profile.certifications": "Certifications",
      "profile.workExperience": "Work Experience",
      "profile.testimonials": "Testimonials",
      "profile.save": "Save Profile",
      "profile.saving": "Saving...",

      // Company Profile
      "company.name": "Company Name",
      "company.industry": "Industry",
      "company.description": "Description",
      "company.website": "Website",
      "company.size": "Company Size",
      "company.logo": "Company Logo",

      // Job Posting
      "job.post.title": "Post a Job",
      "job.post.subtitle": "Find the perfect L&D professional for your training needs",
      "job.title": "Job Title",
      "job.description": "Job Description",
      "job.location": "Location",
      "job.type": "Job Type",
      "job.compensation": "Compensation",
      "job.duration": "Duration",
      "job.requirements": "Requirements",
      "job.remote": "Remote Work",
      "job.featured": "Featured Listing",
      "job.post": "Post Job",
      "job.posting": "Posting...",
      "job.posted": "Job posted successfully",
      "job.postFailed": "Failed to post job",

      // Common
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.view": "View",
      "common.loading": "Loading...",
      "common.search": "Search",
      "common.filter": "Filter",
      "common.apply": "Apply",
      "common.submit": "Submit",
      "common.back": "Back",
      "common.next": "Next",
      "common.previous": "Previous",
      "common.close": "Close",
      "common.confirm": "Confirm",
      "common.required": "Required",
      "common.optional": "Optional",

      // Messages
      "messages.title": "Messages",
      "messages.noMessages": "No messages yet",
      "messages.compose": "Compose Message",
      "messages.send": "Send",
      "messages.reply": "Reply",

      // Validation
      "validation.required": "This field is required",
      "validation.email": "Please enter a valid email address",
      "validation.minLength": "Must be at least {{count}} characters",
      "validation.maxLength": "Must be no more than {{count}} characters",
      "validation.passwordMatch": "Passwords don't match",

      // Language
      "language.english": "English",
      "language.arabic": "العربية",
      "language.switch": "Switch Language",

      // Home Page
      "home.hero.title": "Connect. Learn. Grow.",
      "home.hero.subtitle": "The premier platform connecting Learning & Development professionals with companies seeking training expertise",
      "home.hero.cta.professional": "Join as Professional",
      "home.hero.cta.company": "Find Experts",
      "home.featured.professionals": "Featured Professionals",
      "home.featured.jobs": "Latest Opportunities",
      "home.featured.resources": "Learning Resources",

      // Professional Dashboard
      "professional.dashboard.overview": "Overview",
      "professional.dashboard.applications": "My Applications",
      "professional.dashboard.matches": "Job Matches",
      "professional.dashboard.consultations": "Consultations",
      "professional.dashboard.earnings": "Earnings",
      "professional.dashboard.reviews": "Reviews",
      "professional.dashboard.settings": "Settings",
      "professional.profile.complete": "Complete your profile to get more opportunities",
      "professional.profile.incomplete": "Profile Incomplete",
      "professional.profile.completion": "Profile Completion",
      "professional.subscription.upgrade": "Upgrade Subscription",
      "professional.subscription.current": "Current Plan",

      // Company Dashboard  
      "company.dashboard.overview": "Company Overview",
      "company.dashboard.jobPostings": "Job Postings",
      "company.dashboard.applications": "Applications Received",
      "company.dashboard.professionals": "Hired Professionals",
      "company.dashboard.billing": "Billing",
      "company.dashboard.team": "Team Members",
      "company.jobPost.create": "Create Job Posting",
      "company.jobPost.manage": "Manage Job Postings",
      "company.jobPost.draft": "Draft",
      "company.jobPost.published": "Published",
      "company.jobPost.expired": "Expired",

      // Profile Forms
      "form.personalDetails": "Personal Details",
      "form.contactInfo": "Contact Information", 
      "form.professionalInfo": "Professional Information",
      "form.companyDetails": "Company Details",
      "form.uploadPhoto": "Upload Photo",
      "form.chooseFile": "Choose File",
      "form.dragDropFile": "Drag and drop a file here, or click to select",
      "form.fileFormats": "PNG, JPG, GIF up to 10MB",
      "form.websiteUrl": "Website URL",
      "form.linkedIn": "LinkedIn Profile",
      "form.portfolio": "Portfolio URL",
      "form.resume": "Resume/CV",
      "form.coverLetter": "Cover Letter",

      // Job Types and Categories
      "jobType.fullTime": "Full-time",
      "jobType.partTime": "Part-time", 
      "jobType.contract": "Contract",
      "jobType.freelance": "Freelance",
      "jobType.temporary": "Temporary",
      "jobType.internship": "Internship",
      "compensation.hourly": "Hourly",
      "compensation.yearly": "Yearly",
      "compensation.monthly": "Monthly",
      "compensation.project": "Per Project",
      "compensation.negotiable": "Negotiable",

      // Status Messages
      "status.active": "Active",
      "status.inactive": "Inactive",
      "status.pending": "Pending",
      "status.approved": "Approved",
      "status.rejected": "Rejected",
      "status.draft": "Draft",
      "status.published": "Published",
      "status.expired": "Expired",
      "status.completed": "Completed",
      "status.inProgress": "In Progress",
      "status.cancelled": "Cancelled",

      // Notifications
      "notification.success": "Success",
      "notification.error": "Error",
      "notification.warning": "Warning",
      "notification.info": "Information",
      "notification.profileUpdated": "Profile updated successfully",
      "notification.profileUpdateFailed": "Failed to update profile",
      "notification.jobPosted": "Job posted successfully",
      "notification.jobPostFailed": "Failed to post job",
      "notification.applicationSent": "Application sent successfully",
      "notification.applicationFailed": "Failed to send application",
      "notification.messagesSent": "Message sent successfully",
      "notification.messagesFailed": "Failed to send message",

      // Time and Dates
      "time.now": "Now",
      "time.today": "Today",
      "time.yesterday": "Yesterday",
      "time.thisWeek": "This week",
      "time.lastWeek": "Last week",
      "time.thisMonth": "This month",
      "time.lastMonth": "Last month",
      "time.daysAgo": "{{count}} days ago",
      "time.hoursAgo": "{{count}} hours ago",
      "time.minutesAgo": "{{count}} minutes ago",

      // Pagination and Data
      "pagination.previous": "Previous",
      "pagination.next": "Next",
      "pagination.showing": "Showing {{start}} to {{end}} of {{total}} results",
      "pagination.noResults": "No results found",
      "pagination.itemsPerPage": "Items per page",
      "data.noData": "No data available",
      "data.loading": "Loading data...",
      "data.error": "Error loading data",
      "data.retry": "Retry",
      "data.refresh": "Refresh",

      // File Upload
      "upload.selectFile": "Select File",
      "upload.uploading": "Uploading...",
      "upload.uploadSuccess": "Upload successful",
      "upload.uploadFailed": "Upload failed",
      "upload.fileSize": "File size",
      "upload.maxSize": "Maximum file size: {{size}}MB",
      "upload.supportedFormats": "Supported formats: {{formats}}",
      "upload.dragDrop": "Drag & drop files here",

      // Search and Filters
      "search.placeholder": "Search...",
      "search.results": "Search Results",
      "search.noResults": "No results found for '{{query}}'",
      "search.suggestions": "Suggestions",
      "filter.all": "All",
      "filter.category": "Category",
      "filter.location": "Location",
      "filter.experience": "Experience Level",
      "filter.salary": "Salary Range",
      "filter.jobType": "Job Type",
      "filter.industry": "Industry",
      "filter.skills": "Skills",
      "filter.clear": "Clear Filters",
      "filter.apply": "Apply Filters",

      // Modal and Dialog
      "modal.close": "Close",
      "modal.cancel": "Cancel",
      "modal.confirm": "Confirm",
      "modal.save": "Save Changes",
      "modal.delete": "Delete",
      "modal.areYouSure": "Are you sure?",
      "modal.confirmDelete": "This action cannot be undone",
      "modal.confirmLogout": "Are you sure you want to log out?",

      // Error Messages
      "error.networkError": "Network error. Please check your connection.",
      "error.serverError": "Server error. Please try again later.",
      "error.unauthorized": "You are not authorized to perform this action.",
      "error.notFound": "The requested resource was not found.",
      "error.validationError": "Please check your input and try again.",
      "error.sessionExpired": "Your session has expired. Please log in again.",
      "error.fileUploadError": "File upload failed. Please try again.",
      "error.generic": "Something went wrong. Please try again."
    }
  },
  ar: {
    translation: {
      // Navigation
      "nav.home": "الرئيسية",
      "nav.professionals": "المختصون",
      "nav.jobs": "الوظائف",
      "nav.resources": "الموارد",
      "nav.forum": "المنتدى",
      "nav.login": "تسجيل الدخول",
      "nav.register": "إنشاء حساب",
      "nav.dashboard": "لوحة التحكم",
      "nav.profile": "الملف الشخصي",
      "nav.logout": "تسجيل الخروج",
      "nav.postJob": "نشر وظيفة",
      "nav.messages": "الرسائل",
      "nav.consultations": "الاستشارات",

      // Authentication
      "auth.login.title": "تسجيل الدخول إلى حسابك",
      "auth.login.subtitle": "مرحباً بعودتك إلى شبكة التعلم والتطوير",
      "auth.register.title": "إنشاء حساب جديد",
      "auth.register.subtitle": "انضم إلى شبكة التعلم والتطوير للتواصل مع المختصين أو العثور على مدربين خبراء",
      "auth.username": "اسم المستخدم",
      "auth.email": "البريد الإلكتروني",
      "auth.password": "كلمة المرور",
      "auth.confirmPassword": "تأكيد كلمة المرور",
      "auth.firstName": "الاسم الأول",
      "auth.lastName": "اسم العائلة",
      "auth.userType": "أنا...",
      "auth.professional": "مختص تعلم وتطوير",
      "auth.company": "شركة",
      "auth.loginButton": "تسجيل الدخول",
      "auth.registerButton": "إنشاء حساب",
      "auth.alreadyHaveAccount": "هل لديك حساب بالفعل؟",
      "auth.needAccount": "تحتاج إلى حساب؟",
      "auth.forgotPassword": "نسيت كلمة المرور؟",
      "auth.loginSuccess": "مرحباً بعودتك!",
      "auth.registerSuccess": "تم التسجيل بنجاح!",
      "auth.loginFailed": "فشل تسجيل الدخول",
      "auth.registerFailed": "فشل التسجيل",

      // Dashboard
      "dashboard.professional.title": "لوحة تحكم المختص",
      "dashboard.professional.subtitle": "إدارة ملفك الشخصي والطلبات والاستشارات",
      "dashboard.company.title": "لوحة تحكم الشركة",
      "dashboard.company.subtitle": "إدارة ملف شركتك والوظائف المنشورة",
      "dashboard.editProfile": "تعديل الملف الشخصي",
      "dashboard.createProfile": "إنشاء ملف شخصي",
      "dashboard.applications": "الطلبات",
      "dashboard.consultations": "الاستشارات",
      "dashboard.messages": "الرسائل",
      "dashboard.matches": "الوظائف المطابقة",
      "dashboard.subscription": "الاشتراك",

      // Profile
      "profile.edit.professional": "تعديل ملفك المهني",
      "profile.edit.company": "تعديل ملف شركتك",
      "profile.edit.professionalSubtitle": "أظهر خبرتك واجذب العملاء",
      "profile.edit.companySubtitle": "اعرض شركتك واعثر على مختصي التعلم والتطوير",
      "profile.personalInfo": "المعلومات الشخصية",
      "profile.title": "المسمى الوظيفي",
      "profile.bio": "نبذة تعريفية",
      "profile.location": "الموقع",
      "profile.email": "البريد الإلكتروني",
      "profile.phone": "رقم الهاتف",
      "profile.yearsExperience": "سنوات الخبرة",
      "profile.ratePerHour": "السعر بالساعة",
      "profile.services": "الخدمات",
      "profile.availability": "التوفر",
      "profile.profileImage": "صورة الملف الشخصي",
      "profile.expertise": "مجالات الخبرة",
      "profile.certifications": "الشهادات",
      "profile.workExperience": "الخبرة العملية",
      "profile.testimonials": "التوصيات",
      "profile.save": "حفظ الملف الشخصي",
      "profile.saving": "جاري الحفظ...",

      // Company Profile
      "company.name": "اسم الشركة",
      "company.industry": "الصناعة",
      "company.description": "الوصف",
      "company.website": "الموقع الإلكتروني",
      "company.size": "حجم الشركة",
      "company.logo": "شعار الشركة",

      // Job Posting
      "job.post.title": "نشر وظيفة",
      "job.post.subtitle": "ابحث عن مختص التعلم والتطوير المثالي لاحتياجاتك التدريبية",
      "job.title": "عنوان الوظيفة",
      "job.description": "وصف الوظيفة",
      "job.location": "الموقع",
      "job.type": "نوع الوظيفة",
      "job.compensation": "المقابل",
      "job.duration": "المدة",
      "job.requirements": "المتطلبات",
      "job.remote": "العمل عن بُعد",
      "job.featured": "إعلان مميز",
      "job.post": "نشر الوظيفة",
      "job.posting": "جاري النشر...",
      "job.posted": "تم نشر الوظيفة بنجاح",
      "job.postFailed": "فشل في نشر الوظيفة",

      // Common
      "common.save": "حفظ",
      "common.cancel": "إلغاء",
      "common.delete": "حذف",
      "common.edit": "تعديل",
      "common.view": "عرض",
      "common.loading": "جاري التحميل...",
      "common.search": "بحث",
      "common.filter": "تصفية",
      "common.apply": "تطبيق",
      "common.submit": "إرسال",
      "common.back": "رجوع",
      "common.next": "التالي",
      "common.previous": "السابق",
      "common.close": "إغلاق",
      "common.confirm": "تأكيد",
      "common.required": "مطلوب",
      "common.optional": "اختياري",

      // Messages
      "messages.title": "الرسائل",
      "messages.noMessages": "لا توجد رسائل بعد",
      "messages.compose": "كتابة رسالة",
      "messages.send": "إرسال",
      "messages.reply": "رد",

      // Validation
      "validation.required": "هذا الحقل مطلوب",
      "validation.email": "يرجى إدخال عنوان بريد إلكتروني صحيح",
      "validation.minLength": "يجب أن يكون على الأقل {{count}} أحرف",
      "validation.maxLength": "يجب ألا يزيد عن {{count}} أحرف",
      "validation.passwordMatch": "كلمات المرور غير متطابقة",

      // Language
      "language.english": "English",
      "language.arabic": "العربية",
      "language.switch": "تغيير اللغة",

      // Home Page
      "home.hero.title": "تواصل. تعلم. انمُ.",
      "home.hero.subtitle": "المنصة الرائدة لربط مختصي التعلم والتطوير مع الشركات التي تسعى للخبرة التدريبية",
      "home.hero.cta.professional": "انضم كمختص",
      "home.hero.cta.company": "ابحث عن خبراء",
      "home.featured.professionals": "المختصون المميزون",
      "home.featured.jobs": "أحدث الفرص",
      "home.featured.resources": "موارد التعلم",

      // Professional Dashboard
      "professional.dashboard.overview": "نظرة عامة",
      "professional.dashboard.applications": "طلباتي",
      "professional.dashboard.matches": "الوظائف المطابقة",
      "professional.dashboard.consultations": "الاستشارات",
      "professional.dashboard.earnings": "الأرباح",
      "professional.dashboard.reviews": "المراجعات",
      "professional.dashboard.settings": "الإعدادات",
      "professional.profile.complete": "أكمل ملفك الشخصي للحصول على المزيد من الفرص",
      "professional.profile.incomplete": "الملف الشخصي غير مكتمل",
      "professional.profile.completion": "اكتمال الملف الشخصي",
      "professional.subscription.upgrade": "ترقية الاشتراك",
      "professional.subscription.current": "الخطة الحالية",

      // Company Dashboard  
      "company.dashboard.overview": "نظرة عامة على الشركة",
      "company.dashboard.jobPostings": "الوظائف المنشورة",
      "company.dashboard.applications": "الطلبات المستلمة",
      "company.dashboard.professionals": "المختصون المستأجرون",
      "company.dashboard.billing": "الفواتير",
      "company.dashboard.team": "أعضاء الفريق",
      "company.jobPost.create": "إنشاء وظيفة",
      "company.jobPost.manage": "إدارة الوظائف",
      "company.jobPost.draft": "مسودة",
      "company.jobPost.published": "منشورة",
      "company.jobPost.expired": "منتهية الصلاحية",

      // Profile Forms
      "form.personalDetails": "المعلومات الشخصية",
      "form.contactInfo": "معلومات الاتصال", 
      "form.professionalInfo": "المعلومات المهنية",
      "form.companyDetails": "تفاصيل الشركة",
      "form.uploadPhoto": "رفع صورة",
      "form.chooseFile": "اختر ملف",
      "form.dragDropFile": "اسحب واسقط ملف هنا، أو انقر للاختيار",
      "form.fileFormats": "PNG، JPG، GIF حتى 10 ميجابايت",
      "form.websiteUrl": "رابط الموقع الإلكتروني",
      "form.linkedIn": "الملف الشخصي في لينكد إن",
      "form.portfolio": "رابط المعرض",
      "form.resume": "السيرة الذاتية",
      "form.coverLetter": "خطاب المقدمة",

      // Job Types and Categories
      "jobType.fullTime": "دوام كامل",
      "jobType.partTime": "دوام جزئي", 
      "jobType.contract": "عقد",
      "jobType.freelance": "عمل حر",
      "jobType.temporary": "مؤقت",
      "jobType.internship": "تدريب",
      "compensation.hourly": "بالساعة",
      "compensation.yearly": "سنوياً",
      "compensation.monthly": "شهرياً",
      "compensation.project": "لكل مشروع",
      "compensation.negotiable": "قابل للتفاوض",

      // Status Messages
      "status.active": "نشط",
      "status.inactive": "غير نشط",
      "status.pending": "قيد الانتظار",
      "status.approved": "موافق عليه",
      "status.rejected": "مرفوض",
      "status.draft": "مسودة",
      "status.published": "منشور",
      "status.expired": "منتهي الصلاحية",
      "status.completed": "مكتمل",
      "status.inProgress": "قيد التنفيذ",
      "status.cancelled": "ملغي",

      // Notifications
      "notification.success": "نجح",
      "notification.error": "خطأ",
      "notification.warning": "تحذير",
      "notification.info": "معلومات",
      "notification.profileUpdated": "تم تحديث الملف الشخصي بنجاح",
      "notification.profileUpdateFailed": "فشل في تحديث الملف الشخصي",
      "notification.jobPosted": "تم نشر الوظيفة بنجاح",
      "notification.jobPostFailed": "فشل في نشر الوظيفة",
      "notification.applicationSent": "تم إرسال الطلب بنجاح",
      "notification.applicationFailed": "فشل في إرسال الطلب",
      "notification.messagesSent": "تم إرسال الرسالة بنجاح",
      "notification.messagesFailed": "فشل في إرسال الرسالة",

      // Time and Dates
      "time.now": "الآن",
      "time.today": "اليوم",
      "time.yesterday": "أمس",
      "time.thisWeek": "هذا الأسبوع",
      "time.lastWeek": "الأسبوع الماضي",
      "time.thisMonth": "هذا الشهر",
      "time.lastMonth": "الشهر الماضي",
      "time.daysAgo": "منذ {{count}} أيام",
      "time.hoursAgo": "منذ {{count}} ساعات",
      "time.minutesAgo": "منذ {{count}} دقائق",

      // Pagination and Data
      "pagination.previous": "السابق",
      "pagination.next": "التالي",
      "pagination.showing": "عرض {{start}} إلى {{end}} من {{total}} نتيجة",
      "pagination.noResults": "لا توجد نتائج",
      "pagination.itemsPerPage": "عناصر لكل صفحة",
      "data.noData": "لا توجد بيانات متاحة",
      "data.loading": "جاري تحميل البيانات...",
      "data.error": "خطأ في تحميل البيانات",
      "data.retry": "إعادة المحاولة",
      "data.refresh": "تحديث",

      // File Upload
      "upload.selectFile": "اختر ملف",
      "upload.uploading": "جاري الرفع...",
      "upload.uploadSuccess": "تم الرفع بنجاح",
      "upload.uploadFailed": "فشل الرفع",
      "upload.fileSize": "حجم الملف",
      "upload.maxSize": "الحد الأقصى لحجم الملف: {{size}} ميجابايت",
      "upload.supportedFormats": "الصيغ المدعومة: {{formats}}",
      "upload.dragDrop": "اسحب واسقط الملفات هنا",

      // Search and Filters
      "search.placeholder": "بحث...",
      "search.results": "نتائج البحث",
      "search.noResults": "لا توجد نتائج لـ '{{query}}'",
      "search.suggestions": "اقتراحات",
      "filter.all": "الكل",
      "filter.category": "الفئة",

      // Payment System
      "payment": {
        "dashboard": "لوحة المدفوعات",
        "escrowPayment": "دفع آمن بنظام الضمان",
        "escrowDescription": "مدفوعاتك محمية بنظام الضمان الآمن",
        "totalAmount": "المبلغ الإجمالي",
        "serviceAmount": "مبلغ الخدمة",
        "platformFee": "رسوم المنصة",
        "trainerReceives": "يستلم المدرب",
        "proceedToPayment": "متابعة للدفع",
        "completePayment": "إتمام الدفع",
        "securePaymentForm": "أدخل بيانات الدفع بأمان",
        "payNow": "ادفع الآن",
        "processing": "جاري المعالجة...",
        "success": "نجح",
        "error": "خطأ",
        "paymentSuccessful": "تم الدفع بنجاح",
        "paymentFailed": "فشل الدفع. يرجى المحاولة مرة أخرى.",
        "escrowProtection": "حماية الضمان",
        "escrowExplanation": "يتم الاحتفاظ بدفعتك بأمان حتى اكتمال الخدمة",
        "escrowBenefit1": "يتم تحرير الأموال فقط عند اكتمال الخدمة",
        "escrowBenefit2": "حماية كاملة للاسترداد إذا لم يتم تقديم الخدمة",
        "escrowBenefit3": "إطلاق تلقائي بعد 7 أيام إذا لم تكن هناك مشاكل",
        "escrowStatus": "حالة الدفع",
        "amount": "المبلغ",
        "created": "تاريخ الإنشاء",
        "autoRelease": "الإطلاق التلقائي",
        "releaseFunds": "تحرير الأموال",
        "requestRefund": "طلب استرداد",
        "fundsReleased": "تم تحرير الأموال بنجاح",
        "refundRequested": "تم طلب الاسترداد بنجاح",
        "releaseError": "فشل في تحرير الأموال",
        "refundError": "فشل في طلب الاسترداد",
        "totalEarnings": "إجمالي الأرباح",
        "pendingAmount": "المبلغ المعلق",
        "totalTransactions": "إجمالي المعاملات",
        "completedTransactions": "مكتملة",
        "activeTransactions": "نشطة",
        "allTime": "كل الأوقات",
        "allTransactions": "جميع المعاملات",
        "active": "نشط",
        "completed": "مكتمل",
        "transactionDetails": "تفاصيل المعاملة",
        "transactionId": "رقم المعاملة",
        "paymentBreakdown": "تفصيل الدفع",
        "transactionHistory": "تاريخ المعاملات",
        "noDescription": "لم يتم تقديم وصف",
        "autoReleaseDate": "تاريخ الإطلاق التلقائي",
        "status": {
          "pending": "معلق",
          "payment_failed": "فشل الدفع",
          "in_escrow": "في الضمان",
          "released": "محرر",
          "refunded": "مسترد",
          "disputed": "متنازع عليه",
          "cancelled": "ملغى"
        },
        "statusMessage": {
          "pending": "جاري معالجة الدفع",
          "inEscrow": "الأموال محفوظة بأمان في الضمان",
          "released": "تم تحرير الدفعة للمدرب",
          "unknown": "الحالة غير معروفة"
        },
        "action": {
          "created": "تم إنشاء المعاملة",
          "funds_captured": "تم استلام الأموال",
          "released": "تم تحرير الأموال",
          "refunded": "تم معالجة الاسترداد"
        }
      },

      "common": {
        "loading": "جاري التحميل...",
        "refresh": "تحديث",
        "cancel": "إلغاء",
        "viewDetails": "عرض التفاصيل"
      },
      "filter.location": "الموقع",
      "filter.experience": "مستوى الخبرة",
      "filter.salary": "نطاق الراتب",
      "filter.jobType": "نوع الوظيفة",
      "filter.industry": "الصناعة",
      "filter.skills": "المهارات",
      "filter.clear": "إزالة المرشحات",
      "filter.apply": "تطبيق المرشحات",

      // Modal and Dialog
      "modal.close": "إغلاق",
      "modal.cancel": "إلغاء",
      "modal.confirm": "تأكيد",
      "modal.save": "حفظ التغييرات",
      "modal.delete": "حذف",
      "modal.areYouSure": "هل أنت متأكد؟",
      "modal.confirmDelete": "لا يمكن التراجع عن هذا الإجراء",
      "modal.confirmLogout": "هل أنت متأكد من أنك تريد تسجيل الخروج؟",

      // Error Messages
      "error.networkError": "خطأ في الشبكة. يرجى فحص اتصالك.",
      "error.serverError": "خطأ في الخادم. يرجى المحاولة لاحقاً.",
      "error.unauthorized": "غير مخول لك القيام بهذا الإجراء.",
      "error.notFound": "المورد المطلوب غير موجود.",
      "error.validationError": "يرجى فحص مدخلاتك والمحاولة مرة أخرى.",
      "error.sessionExpired": "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
      "error.fileUploadError": "فشل رفع الملف. يرجى المحاولة مرة أخرى.",
      "error.generic": "حدث خطأ ما. يرجى المحاولة مرة أخرى."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('i18nextLng') || 'en',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    }
  });

// Apply RTL direction based on language
i18n.on('languageChanged', (lng) => {
  const isRTL = lng === 'ar';
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
  
  // Update CSS variables for RTL support
  document.documentElement.style.setProperty('--text-align-start', isRTL ? 'right' : 'left');
  document.documentElement.style.setProperty('--text-align-end', isRTL ? 'left' : 'right');
  document.documentElement.style.setProperty('--margin-start', isRTL ? 'margin-right' : 'margin-left');
  document.documentElement.style.setProperty('--margin-end', isRTL ? 'margin-left' : 'margin-right');
  document.documentElement.style.setProperty('--padding-start', isRTL ? 'padding-right' : 'padding-left');
  document.documentElement.style.setProperty('--padding-end', isRTL ? 'padding-left' : 'padding-right');
});

// Initialize direction on load
const currentLng = i18n.language;
const isRTL = currentLng === 'ar';
document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
document.documentElement.setAttribute('lang', currentLng);

export default i18n;