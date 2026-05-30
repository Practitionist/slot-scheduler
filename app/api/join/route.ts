import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawCode = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!rawCode) return new Response('Code is required', { status: 400 });

  const joinCode = await prisma.joinCode.findUnique({ where: { code: rawCode } });
  if (!joinCode) return new Response('Invalid join code', { status: 404 });
  if (joinCode.expiresAt && joinCode.expiresAt < new Date()) {
    return new Response('Join code has expired', { status: 410 });
  }
  if (joinCode.maxUses !== null && joinCode.uses >= joinCode.maxUses) {
    return new Response('Join code has reached its maximum uses', { status: 410 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: joinCode.orgId },
    select: { slug: true },
  });
  if (!org) return new Response('Organization no longer exists', { status: 410 });

  // Check if already a member of the org.
  const existing = await prisma.member.findFirst({
    where: { organizationId: joinCode.orgId, userId: session.user.id },
  });

  if (!existing) {
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

  // Optionally add to team.
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

  // Optionally add to product.
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

  // Increment usage counter.
  await prisma.joinCode.update({
    where: { id: joinCode.id },
    data: { uses: { increment: 1 } },
  });

  return NextResponse.json({ orgSlug: org.slug, orgId: joinCode.orgId });
}
