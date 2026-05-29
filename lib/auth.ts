import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins/organization';
import { prisma } from './prisma';
import { enabledOAuthProviders } from './oauth';
import { sendInvitationEmail } from './email';

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
    deleteUser: {
      enabled: true,
      // Succession guard: you must transfer ownership before deleting your
      // account if you own an org with other members; orgs where you're the
      // sole member are deleted with you (cascade removes teams/products/etc.).
      beforeDelete: async (user) => {
        const owned = await prisma.member.findMany({
          where: { userId: user.id, role: 'owner' },
          select: { organizationId: true },
        });
        for (const m of owned) {
          const others = await prisma.member.count({
            where: { organizationId: m.organizationId, NOT: { userId: user.id } },
          });
          if (others > 0) {
            throw new APIError('BAD_REQUEST', {
              message: 'Transfer ownership of your organization(s) before deleting your account.',
            });
          }
        }
        if (owned.length) {
          await prisma.organization.deleteMany({ where: { id: { in: owned.map((o) => o.organizationId) } } });
        }
      },
    },
  },
  // Basic abuse protection (no email dependency).
  rateLimit: { enabled: true, window: 60, max: 100 },
  plugins: [
    organization({
      // Don't auto-create a default team named after the org — the org-creation
      // UI asks the creator to pick starter teams (Engineering, UI/UX, …) instead.
      teams: { enabled: true, defaultTeam: { enabled: false } },
      requireEmailVerificationOnInvitation: false,
      async sendInvitationEmail(data) {
        const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
        const acceptUrl = `${base}/auth/accept-invitation?id=${data.id}`;
        // Always log so the link is recoverable without email in local dev.
        console.log(`[invite] ${data.email} -> ${acceptUrl} (org=${data.organization.name})`);
        await sendInvitationEmail({ to: data.email, orgName: data.organization.name, acceptUrl });
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
