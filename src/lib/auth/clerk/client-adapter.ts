"use client";

export interface AuthClient {
  signIn: {
    email: (
      credentials: {
        email: string;
        password: string;
        callbackURL?: string;
      },
      options?: {
        onError?: (ctx: any) => void;
      },
    ) => Promise<void>;
    social: (params: { provider: string }) => Promise<void>;
  };
  signOut: () => Promise<void>;
}

export class ClerkClientAdapter {
  createAuthClient(): AuthClient {
    return {
      signIn: {
        email: async (credentials, _options) => {
          // Clerk handles email/password through their components
          // This would redirect to Clerk's sign-in page
          const url = new URL("/sign-in", window.location.origin);
          url.searchParams.set("email", credentials.email);
          if (credentials.callbackURL) {
            url.searchParams.set("redirect_url", credentials.callbackURL);
          }
          window.location.href = url.toString();
        },
        social: async ({ provider }) => {
          // Redirect to Clerk's social auth
          window.location.href = `/api/auth/signin/${provider}`;
        },
      },
      signOut: async () => {
        // Use Clerk's signOut method properly
        if (typeof window !== "undefined") {
          try {
            // Get the Clerk instance from the global window object
            const clerk = (window as any).__clerk;

            if (clerk && typeof clerk.signOut === "function") {
              // Call Clerk's signOut method with explicit redirect URL
              await clerk.signOut({
                redirectUrl: window.location.origin + "/sign-in",
              });
            } else {
              // Fallback: redirect to Clerk's sign-out URL
              window.location.href = "/api/auth/signout";
            }
          } catch (error) {
            console.error("Sign out error:", error);
            // Fallback: redirect to Clerk's sign-out URL
            window.location.href = "/api/auth/signout";
          }
        }
      },
    };
  }
}

export const clerkClientAdapter = new ClerkClientAdapter();
