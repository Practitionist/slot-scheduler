import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});

// Neon's serverless compute auto-suspends when idle (free tier). The first query
// after a cold start can fail with "fetch failed" / ETIMEDOUT while the compute
// wakes. These are transient connection failures — distinct from real query
// errors (unique-constraint, validation, etc.) which must NOT be retried.
function isTransientDbError(err: unknown): boolean {
  const e = err as { name?: string; message?: string; code?: string; cause?: { code?: string }; sourceError?: { cause?: { code?: string } } };
  const message = String(e?.message ?? err ?? '');
  const causeCode = String(e?.sourceError?.cause?.code ?? e?.cause?.code ?? '');
  return (
    e?.name === 'NeonDbError' ||
    /fetch failed|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up|terminating connection|Connection terminated|503|504/i.test(message) ||
    /ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(causeCode)
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(run: () => Promise<T>, label: string): Promise<T> {
  const MAX_ATTEMPTS = 4;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (err) {
      lastError = err;
      if (!isTransientDbError(err) || attempt === MAX_ATTEMPTS) throw err;
      // Exponential backoff with jitter: ~200ms, 400ms, 800ms (+ up to 100ms).
      const backoff = Math.min(2000, 200 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 100);
      console.warn(`[db] transient error on ${label} (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw lastError;
}

function createPrisma() {
  const base = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  return base.$extends({
    query: {
      // Retry every model operation. Safe for cold starts because the failure
      // happens before the query reaches Postgres; a genuinely-applied write that
      // lost its response would re-fail on its unique constraint (non-transient).
      async $allOperations({ model, operation, args, query }) {
        return withRetry(() => query(args), `${model ?? 'raw'}.${operation}`);
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrisma> };

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
