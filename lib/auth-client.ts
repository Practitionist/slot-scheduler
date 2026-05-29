'use client';

import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins';
import type { auth } from './auth';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    // Makes the custom `timezone` field on User type-safe on the client.
    inferAdditionalFields<typeof auth>(),
    organizationClient({ teams: { enabled: true } }),
  ],
});
