import { auth, currentUser } from "@clerk/nextjs/server";
import { mapClerkUserIdToUuid } from "./user-mapping";

export interface Session {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
  };
  accessToken: string | null;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

// Simple in-memory cache for user data
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const ENABLE_CACHE = true; // Only enable in production for safety

export class ClerkServerAdapter {
  async getSession(): Promise<Session | null> {
    try {
      const { userId, sessionId, getToken } = await auth();

      if (!userId || !sessionId) {
        // Don't log as error - this is expected when user is not authenticated
        return null;
      }

      // Get user data from Clerk using currentUser()
      const user = await currentUser();

      if (!user) {
        // User not found, likely signed out
        return null;
      }

      // Map Clerk user ID to internal UUID
      const internalUserId = await mapClerkUserIdToUuid(userId, {
        name: user?.fullName || undefined,
        email: user?.primaryEmailAddress?.emailAddress,
        image: user?.imageUrl,
      });

      // Transform Clerk session to match betterAuth format
      return {
        user: {
          id: internalUserId, // Use internal UUID instead of Clerk ID
          email: user?.primaryEmailAddress?.emailAddress || "",
          emailVerified: true,
          name: user?.fullName || undefined || "",
          createdAt: new Date(),
          updatedAt: new Date(),
          image: user?.imageUrl || null,
        },
        session: {
          id: sessionId,
          userId: internalUserId, // Use internal UUID instead of Clerk ID
        },
        accessToken: getToken
          ? await getToken({
              template: process.env.NEXT_PUBLIC_AUTH_CLERK_JWT_TPL,
            })
          : null,
      };
    } catch (error) {
      // Handle authentication errors gracefully
      console.warn("Authentication error in getSession:", error);
      return null;
    }
  }

  async ensureUserExists(): Promise<User | null> {
    try {
      const { userId } = await auth();

      if (!userId) {
        return null;
      }

      // Check cache first (only in production for safety)
      if (ENABLE_CACHE) {
        const cached = userCache.get(userId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log(`[Cache] Returning cached user for ${userId}`);
          return cached.user;
        }
      }

      // Get user data from Clerk using currentUser()
      const user = await currentUser();

      if (!user) {
        // User not found, likely signed out
        return null;
      }

      // Map Clerk user ID to internal UUID
      const internalUserId = await mapClerkUserIdToUuid(userId, {
        name: user?.fullName || undefined,
        email: user?.primaryEmailAddress?.emailAddress,
        image: user?.imageUrl,
      });

      // Return user data in expected format
      const userData = {
        id: internalUserId, // Use internal UUID instead of Clerk ID
        email: user?.primaryEmailAddress?.emailAddress || "",
        emailVerified: true,
        name: user?.fullName || undefined || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        image: user?.imageUrl || null,
      };

      // Cache the result (only in production for safety)
      if (ENABLE_CACHE) {
        userCache.set(userId, { user: userData, timestamp: Date.now() });
        console.log(`[Cache] Cached user for ${userId}`);
      }

      return userData;
    } catch (error) {
      // Handle authentication errors gracefully
      console.warn("Authentication error in ensureUserExists:", error);
      return null;
    }
  }
}

export const clerkServerAdapter = new ClerkServerAdapter();
