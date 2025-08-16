import axios from 'axios';

export interface EmailValidationResult {
  isValid: boolean;
  exists?: boolean;
  isGmail?: boolean;
  error?: string;
}

class EmailValidator {
  private static instance: EmailValidator;
  private cache = new Map<string, EmailValidationResult>();

  static getInstance(): EmailValidator {
    if (!EmailValidator.instance) {
      EmailValidator.instance = new EmailValidator();
    }
    return EmailValidator.instance;
  }

  // Gmail API yoxlaması (server-side endpoint lazımdır)
  async validateEmailWithAPI(email: string): Promise<EmailValidationResult> {
    if (this.cache.has(email)) {
      return this.cache.get(email)!;
    }

    try {
      const response = await axios.post('/api/validate-email', { email });
      const result = response.data;
      console.log(`Email validation result for ${email}:`, result);
      this.cache.set(email, result);
      return result;
    } catch (error) {
      const result = {
        isValid: false,
        error: 'Validation service unavailable'
      };
      return result;
    }
  }

  // SMTP-based validation (client-side basic check)
  async validateEmailBasic(email: string): Promise<EmailValidationResult> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);
    
    if (!isValidFormat) {
      return {
        isValid: false,
        error: 'Invalid email format'
      };
    }

    const domain = email.split('@')[1];
    const isGmail = domain === 'gmail.com';

    return {
      isValid: true,
      isGmail,
      exists: undefined // Bu server-side yoxlama tələb edir
    };
  }
}

export const emailValidator = EmailValidator.getInstance();