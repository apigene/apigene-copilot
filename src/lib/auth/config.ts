import { AuthConfig } from "./types";

export function getAuthConfig(): AuthConfig {
  const rawConfig = {
    emailAndPasswordEnabled: process.env.CLERK_EMAIL_ENABLED !== "false",
    signUpEnabled: process.env.CLERK_SIGNUP_ENABLED !== "false",
    socialAuthenticationProviders: {
      google: !!process.env.CLERK_GOOGLE_ENABLED,
      github: !!process.env.CLERK_GITHUB_ENABLED,
      microsoft: !!process.env.CLERK_MICROSOFT_ENABLED,
    },
  };

  return rawConfig;
}
