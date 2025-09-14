import { getCollection, COLLECTIONS } from "lib/db/mongo/mongodb";

/**
 * Maps Clerk user ID to internal database UUID using MongoDB
 * Creates a user record if it doesn't exist
 */
export async function mapClerkUserIdToUuid(
  clerkUserId: string,
  userData?: {
    name?: string;
    email?: string;
    image?: string;
  },
): Promise<string> {
  // console.log(
  //   "🔗 [MongoDB User Mapping] mapClerkUserIdToUuid called with clerkUserId:",
  //   clerkUserId,
  // );

  const accountsCollection = await getCollection(COLLECTIONS.ACCOUNTS);
  const usersCollection = await getCollection(COLLECTIONS.USERS);

  // First, try to find existing mapping
  const existingAccount = await accountsCollection.findOne({
    accountId: clerkUserId,
    providerId: "clerk",
  });

  if (existingAccount) {
    // console.log(
    //   "✅ [MongoDB User Mapping] Found existing account mapping:",
    //   existingAccount.userId,
    // );
    return existingAccount.userId;
  }

  // If no mapping exists, check if a user with this email already exists
  const email = userData?.email || `${clerkUserId}@clerk.local`;
  const existingUser = await usersCollection.findOne({
    email: email,
  });

  let userId: string;

  if (existingUser) {
    // User already exists, use their ID
    userId = existingUser._id.toString();
    // console.log("✅ [MongoDB User Mapping] Found existing user:", userId);
  } else {
    // Create a new user
    const now = new Date();
    const userDoc = {
      name: userData?.name || "User",
      email: email,
      emailVerified: true,
      image: userData?.image,
      created_at: now,
      updated_at: now,
    };

    const insertResult = await usersCollection.insertOne(userDoc);
    userId = insertResult.insertedId.toString();
    console.log("✅ [MongoDB User Mapping] Created new user:", userId);
  }

  // Create account mapping
  const now = new Date();
  const accountDoc = {
    accountId: clerkUserId,
    providerId: "clerk",
    userId: userId,
    created_at: now,
    updated_at: now,
  };

  await accountsCollection.insertOne(accountDoc);
  console.log(
    "✅ [MongoDB User Mapping] Created account mapping for:",
    clerkUserId,
    "->",
    userId,
  );

  return userId;
}

/**
 * Gets the internal UUID for a Clerk user ID using MongoDB
 * Returns null if no mapping exists
 */
export async function getUuidForClerkUserId(
  clerkUserId: string,
): Promise<string | null> {
  console.log(
    "🔍 [MongoDB User Mapping] getUuidForClerkUserId called with clerkUserId:",
    clerkUserId,
  );

  const accountsCollection = await getCollection(COLLECTIONS.ACCOUNTS);

  const result = await accountsCollection.findOne({
    accountId: clerkUserId,
    providerId: "clerk",
  });

  const userId = result ? result.userId : null;
  console.log(
    "✅ [MongoDB User Mapping] getUuidForClerkUserId result:",
    userId || "not found",
  );

  return userId;
}
