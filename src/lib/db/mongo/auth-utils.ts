import { currentUser } from "@clerk/nextjs/server";

/**
 * Get current authenticated user information for MongoDB operations
 * @returns Object containing userId and userEmail
 * @throws Error if user is not authenticated
 */
export const getCurrentUserInfo = async () => {
  const user = await currentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return {
    userId: user.id,
    userEmail: user.primaryEmailAddress?.emailAddress || "",
  };
};

/**
 * Get current user email only (useful when you only need email)
 * @returns User email address
 * @throws Error if user is not authenticated
 */
export const getCurrentUserEmail = async (): Promise<string> => {
  const user = await currentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.primaryEmailAddress?.emailAddress || "";
};

/**
 * Get current user ID only (useful when you only need user ID)
 * @returns User ID
 * @throws Error if user is not authenticated
 */
export const getCurrentUserId = async (): Promise<string> => {
  const user = await currentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.id;
};

/**
 * Check if user is authenticated without throwing error
 * @returns Object with authentication status and user info if authenticated
 */
export const checkUserAuthentication = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return { isAuthenticated: false, user: null };
    }
    return {
      isAuthenticated: true,
      user: {
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || "",
      },
    };
  } catch (_error) {
    return { isAuthenticated: false, user: null };
  }
};
