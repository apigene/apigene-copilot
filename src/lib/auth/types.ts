import { Session, User } from "./clerk/server-adapter";

export interface AuthContext {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AuthConfig {
  emailAndPasswordEnabled: boolean;
  signUpEnabled: boolean;
  socialAuthenticationProviders: {
    google: boolean;
    github: boolean;
    microsoft: boolean;
  };
}

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

export type SocialAuthenticationProvider = "google" | "github" | "microsoft";

// Re-export types from server-adapter
export type { Session, User };
