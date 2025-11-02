// Referenced from javascript_database blueprint
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

const databaseUrl = process.env.DATABASE_URL?.trim();

// Debug: log DATABASE_URL status (first 30 chars only for security)
if (process.env.NODE_ENV === "development") {
  if (!databaseUrl || databaseUrl.length === 0) {
    console.warn("⚠️  DATABASE_URL is empty or not set in .env file");
  } else if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error(`❌ DATABASE_URL format invalid. Starts with: ${databaseUrl.substring(0, 30)}...`);
    console.error(`   Expected: postgresql://user:password@host/database`);
  } else {
    console.log(`✅ DATABASE_URL detected (starts with: ${databaseUrl.substring(0, 20)}...)`);
  }
}

if (!databaseUrl || databaseUrl.length === 0) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL must be set in production. Did you forget to provision a database?",
    );
  }
  console.warn(
    "⚠️  DATABASE_URL not set. Database functionality will not be available.",
  );
  console.warn(
    "   To enable database: create a .env file with DATABASE_URL from Neon.tech",
  );
} else if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error("❌ DATABASE_URL format is invalid!");
  console.error(`   Expected format: postgresql://user:password@host/database`);
  console.error(`   Current value: ${databaseUrl.substring(0, 50)}${databaseUrl.length > 50 ? '...' : ''}`);
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection string");
  }
  console.warn("   Continuing without database in development...");
} else {
  try {
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Database connection initialized successfully");
    }
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
    }
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    console.warn("   Continuing without database in development...");
  }
}

export { pool, db };
