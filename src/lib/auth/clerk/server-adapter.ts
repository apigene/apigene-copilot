import "server-only";
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

export class ClerkServerAdapter {
  async getSession(): Promise<Session | null> {
    const { userId, sessionId, getToken } = await auth();

    if (!userId || !sessionId) {
      // Don't log as error - this is expected when user is not authenticated
      return null;
    }

    // Get user data from Clerk using currentUser()
    const user = await currentUser();

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
      accessToken: await getToken({
        template: process.env.NEXT_PUBLIC_AUTH_CLERK_JWT_TPL,
      }),
    };
  }

  async ensureUserExists(): Promise<User | null> {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // Get user data from Clerk using currentUser()
    const user = await currentUser();

    // Map Clerk user ID to internal UUID
    const internalUserId = await mapClerkUserIdToUuid(userId, {
      name: user?.fullName || undefined,
      email: user?.primaryEmailAddress?.emailAddress,
      image: user?.imageUrl,
    });

    // Return user data in expected format
    return {
      id: internalUserId, // Use internal UUID instead of Clerk ID
      email: user?.primaryEmailAddress?.emailAddress || "",
      emailVerified: true,
      name: user?.fullName || undefined || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      image: user?.imageUrl || null,
    };
  }
}

export const clerkServerAdapter = new ClerkServerAdapter();
