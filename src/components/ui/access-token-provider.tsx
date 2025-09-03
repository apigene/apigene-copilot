"use client";

import * as React from "react";
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from "react";

// Constants for token storage
const TOKEN_STORAGE_KEY = "access_token";

interface AccessTokenContextProps {
  // Token state
  token: string | null;

  // Token actions
  setToken: (token: string) => void;
  clearToken: () => void;
}

const AccessTokenContext = createContext<AccessTokenContextProps | null>(null);

function useAccessToken() {
  const context = useContext(AccessTokenContext);
  if (!context) {
    throw new Error(
      "useAccessToken must be used within an AccessTokenProvider.",
    );
  }
  return context;
}

interface AccessTokenProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

function AccessTokenProvider({
  children,
  storageKey = TOKEN_STORAGE_KEY,
}: AccessTokenProviderProps) {
  const [token, setTokenState] = React.useState<string | null>(null);

  // Load token from storage on mount
  useEffect(() => {
    const loadTokenFromStorage = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setTokenState(stored);
        }
      } catch (error) {
        console.error("Failed to load token from storage:", error);
      }
    };

    loadTokenFromStorage();
  }, [storageKey]);

  // Save token to storage
  const saveTokenToStorage = useCallback(
    (tokenValue: string) => {
      try {
        localStorage.setItem(storageKey, tokenValue);
      } catch (error) {
        console.error("Failed to save token to storage:", error);
      }
    },
    [storageKey],
  );

  // Set token
  const setToken = useCallback(
    (tokenValue: string) => {
      setTokenState(tokenValue);
      saveTokenToStorage(tokenValue);
    },
    [saveTokenToStorage],
  );

  // Clear token
  const clearToken = useCallback(() => {
    setTokenState(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Context value
  const contextValue = useMemo<AccessTokenContextProps>(
    () => ({
      token,
      setToken,
      clearToken,
    }),
    [token, setToken, clearToken],
  );

  return (
    <AccessTokenContext.Provider value={contextValue}>
      {children}
    </AccessTokenContext.Provider>
  );
}

// Utility function to get token from storage (for server-side usage)
function getStoredToken(storageKey: string = TOKEN_STORAGE_KEY): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(storageKey);
  } catch (error) {
    console.error("Failed to get stored token:", error);
    return null;
  }
}

export {
  AccessTokenProvider,
  useAccessToken,
  getStoredToken,
  type AccessTokenContextProps,
};
