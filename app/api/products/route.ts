import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgContext, isOrgMember, isOrgAdmin } from '@/lib/org-guard';

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx.ok) return ctx.res;
  if (!ctx.orgId) return NextResponse.json([]);
  if (!(await isOrgMember(ctx.orgId, ctx.userId))) return new Response('Forbidden', { status: 403 });

  const products = await prisma.product.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, members: { select: { userId: true } } },
  });
  return NextResponse.json(
    products.map((p) => ({ id: p.id, name: p.name, memberIds: p.members.map((m) => m.userId) }))
  );
}

export async function POST(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx.ok) return ctx.res;
  if (!ctx.orgId) return new Response('No active organization', { status: 400 });
  if (!(await isOrgAdmin(ctx.orgId, ctx.userId))) return new Response('Admins only', { status: 403 });

  const { name } = await req.json();
  if (typeof name !== 'string' || !name.trim()) return new Response('Name is required', { status: 400 });

  const product = await prisma.product.create({
    data: { name: name.trim(), organizationId: ctx.orgId },
  });
  return NextResponse.json(product, { status: 201 });
}
