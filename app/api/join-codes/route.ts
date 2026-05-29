import { NextResponse } from 'next/server';
import { getOrgContext, isOrgAdmin } from '@/lib/org-guard';
import { prisma } from '@/lib/prisma';

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx.ok) return ctx.res;
  if (!ctx.orgId) return new Response('No active organization', { status: 400 });
  if (!(await isOrgAdmin(ctx.orgId, ctx.userId))) return new Response('Forbidden', { status: 403 });

  const codes = await prisma.joinCode.findMany({
    where: { orgId: ctx.orgId },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx.ok) return ctx.res;
  if (!ctx.orgId) return new Response('No active organization', { status: 400 });
  if (!(await isOrgAdmin(ctx.orgId, ctx.userId))) return new Response('Forbidden', { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { teamId, productId, role = 'member', expiresInDays, maxUses } = body;

  const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 86_400_000) : null;

  // Retry up to 3 times on the unlikely event of a code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const code = await prisma.joinCode.create({
        data: {
          code: randomCode(),
          orgId: ctx.orgId,
          teamId: teamId || null,
          productId: productId || null,
          role,
          expiresAt,
          maxUses: maxUses ? Number(maxUses) : null,
          createdById: ctx.userId,
        },
      });
      return NextResponse.json(code, { status: 201 });
    } catch (e: unknown) {
      if (attempt === 2) throw e;
    }
  }
}
