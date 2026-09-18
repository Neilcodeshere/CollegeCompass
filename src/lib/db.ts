import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your database connection string.",
    );
  }
  // Neon suspends idle compute; allow a few seconds for it to wake up.
  const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 10_000 });
  return new PrismaClient({ adapter });
}

// Each client owns a connection pool. Reuse one across hot reloads in
// development instead of opening a new pool on every file change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
