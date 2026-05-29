import { prisma } from '@/lib/prisma';
import { getOrgContext, isOrgMember } from '@/lib/org-guard';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await getOrgContext();
  if (!ctx.ok) return ctx.res;
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id }, select: { organizationId: true } });
  if (!product) return new Response('Not found', { status: 404 });
  if (!(await isOrgMember(product.organizationId, ctx.userId))) return new Response('Forbidden', { status: 403 });

  await prisma.product.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
