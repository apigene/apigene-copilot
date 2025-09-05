"use client";

import { clerkClientAdapter } from "./clerk/client-adapter";
import { AuthClient } from "./types";

// Maintain existing API
export const authClient: AuthClient = clerkClientAdapter.createAuthClient();

// Export Clerk hooks for direct usage
export { useUser, useClerk } from "@clerk/nextjs";
