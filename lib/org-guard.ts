import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Returns the signed-in user's id and their active organization id (set via the
// org switcher / setActive). Used by the custom Product routes.
export async function getOrgContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { ok: false as const, res: new Response('Unauthorized', { status: 401 }) };
  }
  const orgId = (session.session as { activeOrganizationId?: string | null }).activeOrganizationId ?? null;
  return { ok: true as const, userId: session.user.id, orgId };
}

export async function isOrgMember(organizationId: string, userId: string) {
  const member = await prisma.member.findFirst({ where: { organizationId, userId } });
  return Boolean(member);
}
