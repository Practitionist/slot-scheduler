import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      // Link accounts that share the same email so a single intern using
      // email/password, Google, and GitHub resolves to one User.
      enabled: true,
      // Only providers that return a VERIFIED email may auto-link by email.
      // Google and GitHub both verify emails; never trust-link an unverified one.
      trustedProviders: ['google', 'github'],
    },
  },
  user: {
    additionalFields: {
      // IANA timezone (e.g. "Asia/Kolkata", "America/New_York"). Captured from
      // the browser on sign-up and editable later; defaults to IST.
      timezone: {
        type: 'string',
        required: false,
        defaultValue: 'Asia/Kolkata',
        input: true,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
