import "server-only";
import { auth } from "@clerk/nextjs/server";
import { clerkServerAdapter } from "./clerk/server-adapter";
import { Session, User } from "./types";

// Re-export Clerk's auth for direct usage if needed
export { auth };

// Maintain existing API
export const getSession = async (): Promise<Session | null> => {
  "use server";
  return await clerkServerAdapter.getSession();
};

export const ensureUserExists = async (): Promise<User | null> => {
  "use server";
  return await clerkServerAdapter.ensureUserExists();
};
