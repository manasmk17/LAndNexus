import { loadStripe, Stripe, StripeConstructor } from '@stripe/stripe-js';

// Add type definitions for the global Stripe object on window
declare global {
  interface Window {
    // Use a proper type for the Stripe constructor
    Stripe?: StripeConstructor;
  }
}

// Global reference to Stripe Promise
let stripePromise: Promise<Stripe | null> | null = null;

// Declare a global error handler for unhandled promise rejections
// This helps catch any unexpected promise rejections that might slip through our handling
window.addEventListener('unhandledrejection', (event) => {
  // Check if this is a Stripe-related error
  if (event.reason && 
      event.reason.message && 
      typeof event.reason.message === 'string' && 
      event.reason.message.includes('Stripe')) {
    console.warn('Caught unhandled Stripe promise rejection:', event.reason);
    
    // Prevent the error from propagating to the console as an unhandled rejection
    event.preventDefault();
    
    // Reset the stripePromise so next attempt will try to load again
    stripePromise = null;
  }
});

/**
 * Safely loads the Stripe.js script manually before initializing Stripe
 * This gives us more control over the loading process and error handling
 */
function loadStripeScript(publicKey: string): Promise<Stripe | null> {
  return new Promise((resolve) => {
    try {
      // Check if Stripe is already loaded on the window
      if (window.Stripe) {
        console.log('Stripe already available on window');
        try {
          resolve(window.Stripe(publicKey));
        } catch (err) {
          console.error('Error creating Stripe instance:', err);
          resolve(null);
        }
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.type = 'text/javascript';
      script.async = true;
      
      // Set up load and error handlers
      script.onload = () => {
        try {
          if (window.Stripe) {
            resolve(window.Stripe(publicKey));
          } else {
            console.error('Stripe.js loaded but Stripe not available on window');
            resolve(null);
          }
        } catch (err) {
          console.error('Error creating Stripe instance after script load:', err);
          resolve(null);
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Stripe.js script');
        resolve(null);
      };
      
      // Add the script to the document
      document.head.appendChild(script);
    } catch (err) {
      console.error('Error setting up Stripe script:', err);
      resolve(null);
    }
  });
}

/**
 * Loads the Stripe.js library with enhanced error handling
 * Returns a promise that always resolves (either with a Stripe instance or null)
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (!stripeKey) {
      console.warn('Missing Stripe public key - stripe features will be disabled');
      return Promise.resolve(null);
    }
    
    try {
      // Manually load Stripe.js script and initialize
      console.log("Initializing Stripe with key:", stripeKey.substring(0, 8) + "...");
      stripePromise = loadStripeScript(stripeKey);
    } catch (error) {
      console.error('Exception during Stripe initialization:', error);
      return Promise.resolve(null);
    }
  }
  
  return stripePromise;
}

/**
 * Checks if Stripe is available and the environment is configured correctly
 * @param {boolean} suppressConsoleError - Whether to suppress console error logging
 * @returns {boolean} - Whether Stripe is available
 */
export function isStripeAvailable(suppressConsoleError = false): boolean {
  const stripeKeyAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  
  if (!stripeKeyAvailable && !suppressConsoleError) {
    console.error('Stripe public key is not available. Set the VITE_STRIPE_PUBLIC_KEY environment variable.');
  }
  
  return stripeKeyAvailable;
}

/**
 * Helper function to format currency amounts
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Creates a payment intent for a specific amount
 * @param amount The amount to charge in dollars
 * @param metadata Optional metadata to associate with the payment
 * @returns Client secret for the payment intent
 */
export async function createPaymentIntent(amount: number, metadata?: Record<string, string>): Promise<string | null> {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount,
        ...metadata
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creating payment intent');
    }

    const data = await response.json();
    return data.clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

/**
 * Common Stripe test card numbers for testing payment scenarios
 */
export const TEST_CARDS = {
  success: '4242 4242 4242 4242', // Always succeeds
  requiresAuth: '4000 0025 0000 3155', // Requires authentication
  declined: '4000 0000 0000 0002', // Always declined
};

/**
 * Helper to build a list of subscription tiers
 */
export const SUBSCRIPTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    description: 'Essential tools for L&D professionals and companies',
    features: [
      'Create basic profile',
      'Browse job postings',
      'Access resource library',
      'Apply to up to 5 jobs monthly'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    description: 'Advanced features for serious L&D professionals and growing organizations',
    features: [
      'Featured profile placement',
      'Unlimited job applications',
      'Direct messaging',
      'Access to premium resources',
      'Priority support'
    ]
  }
];