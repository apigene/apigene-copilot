import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // Only run PostgreSQL migrations if not using MongoDB
      if (process.env.REPOSITORY_DB == "postgres") {
        // run DB migration
        const runMigrate = await import("./lib/db/pg/migrate.pg").then(
          (m) => m.runMigrate,
        );
        await runMigrate().catch((e) => {
          console.error(e);
          process.exit(1);
        });
      } else {
        console.log("🚀 Using MongoDB");
      }
      // MCP clients manager will be initialized lazily when first accessed
      // This improves cold start performance by deferring initialization until needed
    }
  }
}
