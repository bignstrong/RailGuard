-- CreateTable
CREATE TABLE "AdminLogin" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "lastIp" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AdminLogin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminLogin_login_createdAt_idx" ON "AdminLogin"("login", "createdAt");

-- CreateIndex
CREATE INDEX "AdminLogin_createdAt_idx" ON "AdminLogin"("createdAt");
