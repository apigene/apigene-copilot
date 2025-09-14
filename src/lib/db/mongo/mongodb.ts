import { MongoClient, Collection, Document } from "mongodb";
import { auth } from "@clerk/nextjs/server";

// Collection names constants
export const COLLECTIONS = {
  MCP_SERVERS: "mcp-servers",
  USERS: "users",
  ACCOUNTS: "accounts",
  CHAT_THREADS: "chat-threads",
  CHAT_MESSAGES: "chat-messages",
  AGENTS: "agents",
  WORKFLOWS: "workflows",
  ARCHIVES: "archives",
  ARCHIVE_ITEMS: "archive-items",
  BOOKMARKS: "bookmarks",
  MCP_OAUTH: "mcp-oauth",
  MCP_SERVER_CUSTOMIZATIONS: "mcp-server-customizations",
  MCP_TOOL_CUSTOMIZATIONS: "mcp-tool-customizations",
} as const;

// Helper function to get a collection
export const getCollection = async <T extends Document = Document>(
  collectionName: string,
): Promise<Collection<T>> => {
  const { client, databaseName } = await connectToDatabase();
  const db = client.db(databaseName);
  return db.collection<T>(collectionName);
};

const connectToDatabase = async () => {
  // Get the current user's organization from Clerk
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("User not associated with an organization");
  }

  const MONGO_DB_URL = process.env.MONGO_DB_URL;

  if (!MONGO_DB_URL) {
    throw new Error(
      "Please define the MONGO_DB_URL environment variable inside environment variables file",
    );
  }

  let client: MongoClient;

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClient?: MongoClient;
    };

    if (!globalWithMongo._mongoClient) {
      globalWithMongo._mongoClient = new MongoClient(MONGO_DB_URL);
    }
    client = globalWithMongo._mongoClient;
  } else {
    client = new MongoClient(MONGO_DB_URL);
  }

  // Construct database name using orgId
  const databaseName = process.env.DATABASE_ENV + "_" + orgId;
  return { client, databaseName };
};

export default connectToDatabase;

// Re-export auth utilities for convenience
export * from "./auth-utils";
