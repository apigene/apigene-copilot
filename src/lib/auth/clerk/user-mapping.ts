import { pgDb as db } from "lib/db/pg/db.pg";
import { AccountSchema, UserSchema } from "lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";

// MongoDB imports
import { mapClerkUserIdToUuid as mongoMapClerkUserIdToUuid } from "./user-mapping.mongo";
import { getUuidForClerkUserId as mongoGetUuidForClerkUserId } from "./user-mapping.mongo";

/**
 * Maps Clerk user ID to internal database UUID
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
  // Use MongoDB if configured
  if (process.env.REPOSITORY_DB === "mongodb") {
    return mongoMapClerkUserIdToUuid(clerkUserId, userData);
  }

  // PostgreSQL implementation
  // First, try to find existing mapping
  const existingAccount = await db
    .select({ userId: AccountSchema.userId })
    .from(AccountSchema)
    .where(
      and(
        eq(AccountSchema.accountId, clerkUserId),
        eq(AccountSchema.providerId, "clerk"),
      ),
    )
    .limit(1);

  if (existingAccount.length > 0) {
    return existingAccount[0].userId;
  }

  // If no mapping exists, check if a user with this email already exists
  const existingUser = await db
    .select({ id: UserSchema.id })
    .from(UserSchema)
    .where(
      eq(UserSchema.email, userData?.email || `${clerkUserId}@clerk.local`),
    )
    .limit(1);

  let userId: string;

  if (existingUser.length > 0) {
    // User already exists, use their ID
    userId = existingUser[0].id;
  } else {
    // Create a new user
    const [newUser] = await db
      .insert(UserSchema)
      .values({
        name: userData?.name || "User",
        email: userData?.email || `${clerkUserId}@clerk.local`,
        emailVerified: true,
        image: userData?.image,
      })
      .returning({ id: UserSchema.id });

    userId = newUser.id;
  }

  // Create account mapping
  await db.insert(AccountSchema).values({
    accountId: clerkUserId,
    providerId: "clerk",
    userId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return userId;
}

/**
 * Gets the internal UUID for a Clerk user ID
 * Returns null if no mapping exists
 */
export async function getUuidForClerkUserId(
  clerkUserId: string,
): Promise<string | null> {
  // Use MongoDB if configured
  if (process.env.REPOSITORY_DB === "mongodb") {
    return mongoGetUuidForClerkUserId(clerkUserId);
  }

  // PostgreSQL implementation
  const result = await db
    .select({ userId: AccountSchema.userId })
    .from(AccountSchema)
    .where(
      and(
        eq(AccountSchema.accountId, clerkUserId),
        eq(AccountSchema.providerId, "clerk"),
      ),
    )
    .limit(1);

  return result.length > 0 ? result[0].userId : null;
}
