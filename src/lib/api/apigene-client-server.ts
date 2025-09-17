/**
 * Server-side utilities for ApigeneClient
 * This file should only be imported in server-side code
 */

import { ApigeneClient } from "./apigene-client";

/**
 * Create an ApigeneClient instance with automatic server-side authentication
 * This should only be called from server-side code
 */
export async function createApigeneClientWithAuth(
  baseUrl?: string,
): Promise<ApigeneClient> {
  const apiClient = new ApigeneClient(baseUrl);

  try {
    const { clerkServerAdapter } = await import(
      "@/lib/auth/clerk/server-adapter"
    );
    const session = await clerkServerAdapter.getSession();

    if (session?.accessToken) {
      apiClient.setTokenGetter(async () => session.accessToken);
    }
  } catch (error) {
    console.warn("Failed to get server-side token:", error);
  }

  return apiClient;
}
