import { prisma } from '@/lib/prisma';
import { getOrgContext, isOrgMember } from '@/lib/org-guard';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const ctx = await getOrgContext();
  if (!ctx.ok) return ctx.res;
  const { id: productId } = await params;
  const { userId, action } = await req.json();

  if (typeof userId !== 'string' || (action !== 'add' && action !== 'remove')) {
    return new Response('userId and action (add|remove) required', { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { organizationId: true } });
  if (!product) return new Response('Not found', { status: 404 });

  // Requester must belong to the product's org; so must the target user.
  if (!(await isOrgMember(product.organizationId, ctx.userId))) return new Response('Forbidden', { status: 403 });
  if (!(await isOrgMember(product.organizationId, userId))) {
    return new Response('Target user is not a member of this organization', { status: 400 });
  }

  if (action === 'add') {
    try {
      await prisma.productMember.create({ data: { productId, userId } });
    } catch (e: unknown) {
      if ((e as { code?: string }).code !== 'P2002') throw e; // already a member → idempotent
    }
  } else {
    await prisma.productMember.deleteMany({ where: { productId, userId } });
  }
  return new Response(null, { status: 204 });
}
