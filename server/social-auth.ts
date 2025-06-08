import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { User } from '@shared/schema';

// Define profile interfaces for each provider
interface GoogleProfile {
  id: string;
  emails: { value: string; verified: boolean }[];
  displayName: string;
  name: { givenName: string; familyName: string };
  photos: { value: string }[];
}

interface LinkedInProfile {
  id: string;
  emails: { value: string }[];
  displayName: string;
  name: { givenName: string; familyName: string };
  photos: { value: string }[];
}

// Generic social profile processing
async function handleSocialProfile(
  profile: GoogleProfile | LinkedInProfile,
  provider: string,
  done: any
) {
  try {
    // Check if user already exists with this provider ID
    const providerField = `${provider}Id` as keyof User;
    const existingUser = await storage.getUserBySocialProvider(provider, profile.id);

    if (existingUser) {
      return done(null, existingUser);
    }

    // Check if a user with the same email already exists
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    
    if (!email) {
      return done(new Error(`No email found in ${provider} profile`));
    }

    const userByEmail = await storage.getUserByEmail(email);
    
    if (userByEmail) {
      // Link this social account to the existing user
      await storage.linkSocialAccount(userByEmail.id, provider, profile.id);
      return done(null, userByEmail);
    }

    // Create a new user
    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    
    // Generate a unique username based on name or email
    let username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    username = username.replace(/\s+/g, '');
    
    // Check if username exists
    const usernameExists = await storage.getUserByUsername(username);
    if (usernameExists) {
      // Add a random number to make it unique
      username = `${username}${Math.floor(Math.random() * 1000)}`;
    }

    // Create new user with social profile info
    const newUser = await storage.createUserFromSocial({
      username,
      email,
      firstName,
      lastName,
      password: Math.random().toString(36).slice(-10), // Random password
      userType: 'professional', // Default user type
      emailVerified: true, // Auto verify since the email comes from OAuth provider
      [providerField]: profile.id,
      profilePhotoUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
    });

    return done(null, newUser);
  } catch (error) {
    console.error(`Error in ${provider} strategy:`, error);
    return done(error);
  }
}

export function setupSocialAuth(app: Express) {
  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: '/api/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        await handleSocialProfile(profile as GoogleProfile, 'google', done);
      }
    )
  );

  // LinkedIn Strategy
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID || '',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
        callbackURL: '/api/auth/linkedin/callback',
        scope: ['r_emailaddress', 'r_liteprofile'],
        state: true
      },
      async (accessToken, refreshToken, profile, done) => {
        await handleSocialProfile(profile as LinkedInProfile, 'linkedin', done);
      }
    )
  );

  // Google auth routes
  app.get(
    '/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth?error=google-auth-failed' }),
    (req: Request, res: Response) => {
      // Successful authentication, redirect to the appropriate dashboard
      const user = req.user as User;
      if (user.isAdmin) {
        return res.redirect('/admin-dashboard');
      } else if (user.userType === 'professional') {
        return res.redirect('/professional-dashboard');
      } else {
        return res.redirect('/company-dashboard');
      }
    }
  );

  // LinkedIn auth routes
  app.get(
    '/api/auth/linkedin',
    passport.authenticate('linkedin')
  );

  app.get(
    '/api/auth/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: '/auth?error=linkedin-auth-failed' }),
    (req: Request, res: Response) => {
      // Successful authentication, redirect to the appropriate dashboard
      const user = req.user as User;
      if (user.isAdmin) {
        return res.redirect('/admin-dashboard');
      } else if (user.userType === 'professional') {
        return res.redirect('/professional-dashboard');
      } else {
        return res.redirect('/company-dashboard');
      }
    }
  );
}