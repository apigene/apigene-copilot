import { pgDb as db } from "lib/db/pg/db.pg";
import { AccountSchema, UserSchema } from "lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";

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

  // If no mapping exists, create a new user and account
  const [newUser] = await db
    .insert(UserSchema)
    .values({
      name: userData?.name || "User",
      email: userData?.email || `${clerkUserId}@clerk.local`,
      emailVerified: true,
      image: userData?.image,
    })
    .returning({ id: UserSchema.id });

  // Create account mapping
  await db.insert(AccountSchema).values({
    accountId: clerkUserId,
    providerId: "clerk",
    userId: newUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return newUser.id;
}

/**
 * Gets the internal UUID for a Clerk user ID
 * Returns null if no mapping exists
 */
export async function getUuidForClerkUserId(
  clerkUserId: string,
): Promise<string | null> {
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
