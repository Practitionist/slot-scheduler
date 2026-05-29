import { prisma } from '@/lib/prisma';

// Nightly zombie sweep. Secret-guarded; invoked by the Netlify scheduled
// function (netlify/functions/scheduled-cleanup). Safe to run repeatedly.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  // 7-day grace so freshly-created (intentionally empty) starter teams/products
  // aren't deleted before anyone is added to them.
  const staleCutoff = new Date(now.getTime() - 7 * 86_400_000);

  // Run sequentially — the Neon HTTP adapter doesn't support batched
  // transactions, and this sweep doesn't need atomicity.
  const invites = await prisma.invitation.deleteMany({ where: { status: 'pending', expiresAt: { lt: now } } });
  const teams = await prisma.team.deleteMany({ where: { teamMembers: { none: {} }, createdAt: { lt: staleCutoff } } });
  const products = await prisma.product.deleteMany({ where: { members: { none: {} }, createdAt: { lt: staleCutoff } } });
  // A member-less org is definitively dead — remove it (cascades teams/products/invites).
  const orgs = await prisma.organization.deleteMany({ where: { members: { none: {} } } });

  return Response.json({
    ok: true,
    deleted: {
      expiredInvitations: invites.count,
      emptyTeams: teams.count,
      emptyProducts: products.count,
      memberlessOrgs: orgs.count,
    },
  });
}
