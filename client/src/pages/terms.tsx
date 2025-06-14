
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service & Privacy Policy</h1>
        <p className="text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using L&D Nexus, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>

            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily use L&D Nexus for personal, 
              non-commercial transitory viewing only.
            </p>

            <h3>3. User Accounts</h3>
            <p>
              You are responsible for safeguarding the password and for maintaining the 
              confidentiality of your account.
            </p>

            <h3>4. Privacy Policy</h3>
            <p>
              Your privacy is important to us. This Privacy Policy explains how we collect, 
              use, and protect your information when you use our service.
            </p>

            <h3>5. Data Collection</h3>
            <p>
              We collect information you provide directly to us, such as when you create 
              an account, fill out a form, or contact us.
            </p>

            <h3>6. Data Usage</h3>
            <p>
              We use the information we collect to provide, maintain, and improve our services, 
              process transactions, and communicate with you.
            </p>

            <h3>7. Data Protection</h3>
            <p>
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h3>8. Contact Information</h3>
            <p>
              If you have any questions about these Terms or our Privacy Policy, 
              please contact us at legal@ldnexus.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
