import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
      "home.featured.resources": "Learning Resources"
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
      "home.featured.resources": "موارد التعلم"
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
    },
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