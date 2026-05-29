import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins/organization';
import { prisma } from './prisma';
import { enabledOAuthProviders } from './oauth';

// Register ONLY providers that have both id + secret. Registering a provider
// with empty creds makes Better Auth build a broken authorize URL (and spam
// "missing clientId" warnings) — the source of the GitHub sign-in loop.
const enabled = enabledOAuthProviders();
const socialProviders: NonNullable<Parameters<typeof betterAuth>[0]['socialProviders']> = {};
if (enabled.includes('google')) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  };
}
if (enabled.includes('github')) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  socialProviders,
  account: {
    accountLinking: {
      // Link accounts that share the same email so a single intern using
      // email/password, Google, and GitHub resolves to one User.
      enabled: true,
      // Only providers that return a VERIFIED email may auto-link by email.
      // Google and GitHub both verify emails; never trust-link an unverified one.
      trustedProviders: enabled,
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
  plugins: [
    organization({
      // Don't auto-create a default team named after the org — the org-creation
      // UI asks the creator to pick starter teams (Engineering, UI/UX, …) instead.
      teams: { enabled: true, defaultTeam: { enabled: false } },
      // We have no email provider yet, so don't gate invites on email
      // verification; the admin shares the accept link from the UI instead.
      requireEmailVerificationOnInvitation: false,
      async sendInvitationEmail(data) {
        // No transactional email configured yet — log the accept link so it's
        // recoverable, and the /org UI shows a copy-able link to the admin.
        const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
        console.log(
          `[invite] ${data.email} -> ${base}/auth/accept-invitation?id=${data.id} (org=${data.organization.name})`
        );
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
