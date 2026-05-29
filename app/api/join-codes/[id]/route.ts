import { getOrgContext, isOrgAdmin } from '@/lib/org-guard';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgContext();
  if (!ctx.ok) return ctx.res;
  if (!ctx.orgId) return new Response('No active organization', { status: 400 });
  if (!(await isOrgAdmin(ctx.orgId, ctx.userId))) return new Response('Forbidden', { status: 403 });

  const { id } = await params;
  const existing = await prisma.joinCode.findFirst({ where: { id, orgId: ctx.orgId } });
  if (!existing) return new Response('Not found', { status: 404 });

  await prisma.joinCode.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
