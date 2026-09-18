import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, seed) uses the direct connection: Neon's pooler
// runs in transaction mode, which migrations can't rely on. The app itself
// connects through the pooled DATABASE_URL (see src/lib/db.ts).
//
// Read without throwing so `prisma generate` still works where no database
// is configured (for example a lint-only CI job).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
