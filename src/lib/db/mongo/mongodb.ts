import { MongoClient } from "mongodb";
import { auth } from "@clerk/nextjs/server";

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
