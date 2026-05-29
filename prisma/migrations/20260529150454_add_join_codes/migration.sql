-- CreateTable
CREATE TABLE "JoinCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "teamId" TEXT,
    "productId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoinCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JoinCode_code_key" ON "JoinCode"("code");

-- CreateIndex
CREATE INDEX "JoinCode_orgId_idx" ON "JoinCode"("orgId");

-- CreateIndex
CREATE INDEX "JoinCode_code_idx" ON "JoinCode"("code");

-- AddForeignKey
ALTER TABLE "JoinCode" ADD CONSTRAINT "JoinCode_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinCode" ADD CONSTRAINT "JoinCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
