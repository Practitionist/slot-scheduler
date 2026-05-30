import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  // The client funnels unauthenticated users through sign-in before they ever
  // POST here, so a 401 is a genuine edge case — keep the message actionable.
  if (!session?.user) return new Response('Please sign in to join.', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawCode = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!rawCode) return new Response('Enter a join code.', { status: 400 });

  const joinCode = await prisma.joinCode.findUnique({ where: { code: rawCode } });
  if (!joinCode) return new Response("That join code doesn't exist. Double-check it with your admin.", { status: 404 });

  const org = await prisma.organization.findUnique({
    where: { id: joinCode.orgId },
    select: { slug: true, name: true },
  });
  if (!org) return new Response('That organization no longer exists.', { status: 410 });

  // Is the user already in this org? If so the join is a no-op success — never
  // block them with expiry/usage limits when re-opening a link they already used.
  const existing = await prisma.member.findFirst({
    where: { organizationId: joinCode.orgId, userId: session.user.id },
  });
  const alreadyMember = !!existing;

  if (!alreadyMember) {
    if (joinCode.expiresAt && joinCode.expiresAt < new Date()) {
      return new Response('This join code has expired. Ask an admin for a fresh one.', { status: 410 });
    }
    if (joinCode.maxUses !== null && joinCode.uses >= joinCode.maxUses) {
      return new Response('This join code has reached its maximum uses. Ask an admin for a fresh one.', { status: 410 });
    }

    await prisma.member.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: joinCode.orgId,
        userId: session.user.id,
        role: joinCode.role,
        createdAt: new Date(),
      },
    });
  }

  // Optionally add to team (idempotent — the code may scope to a team the
  // existing member hasn't joined yet).
  if (joinCode.teamId) {
    const alreadyInTeam = await prisma.teamMember.findFirst({
      where: { teamId: joinCode.teamId, userId: session.user.id },
    });
    if (!alreadyInTeam) {
      await prisma.teamMember.create({
        data: {
          id: crypto.randomUUID(),
          teamId: joinCode.teamId,
          userId: session.user.id,
          createdAt: new Date(),
        },
      });
    }
  }

  // Optionally add to product (idempotent).
  if (joinCode.productId) {
    const alreadyInProduct = await prisma.productMember.findFirst({
      where: { productId: joinCode.productId, userId: session.user.id },
    });
    if (!alreadyInProduct) {
      await prisma.productMember.create({
        data: {
          productId: joinCode.productId,
          userId: session.user.id,
        },
      });
    }
  }

  // Only a genuinely new membership consumes a use — re-runs don't burn seats.
  if (!alreadyMember) {
    await prisma.joinCode.update({
      where: { id: joinCode.id },
      data: { uses: { increment: 1 } },
    });
  }

  return NextResponse.json({ orgSlug: org.slug, orgId: joinCode.orgId, orgName: org.name, alreadyMember });
}
