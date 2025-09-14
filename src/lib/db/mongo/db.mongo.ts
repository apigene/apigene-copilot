import { MongoClient } from "mongodb";

const connectToDatabase = async () => {
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

  return client;
};

export default connectToDatabase;
