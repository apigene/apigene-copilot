/**
 * Apigene API Client - A lightweight API client for Apigene services
 */

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

// Types
export interface ApiRequest {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  queryParams?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
}

class ApigeneApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;

  constructor(
    message: string,
    status?: number,
    statusText?: string,
    data?: any,
  ) {
    super(message);
    this.name = "ApigeneApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export class ApigeneClient {
  private baseUrl: string;
  private getToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://dev.apigene.ai";
  }

  /**
   * Set the token getter function
   */
  setTokenGetter(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  /**
   * Get the access token from Clerk session
   */
  private async getAuthToken(): Promise<string | null> {
    if (!this.getToken) {
      return null;
    }

    try {
      return await this.getToken();
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean>,
  ): string {
    const url = new URL(endpoint, this.baseUrl);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build headers with authentication
   */
  private async buildHeaders(
    customHeaders?: Record<string, string>,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    const token = await this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make a generic API request
   */
  async request<T = any>(requestConfig: ApiRequest): Promise<ApiResponse<T>> {
    const {
      endpoint,
      method = "GET",
      body,
      queryParams,
      headers: customHeaders,
    } = requestConfig;

    const url = this.buildUrl(endpoint, queryParams);
    const headers = await this.buildHeaders(customHeaders);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new ApigeneApiError(
          responseData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          responseData,
        );
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof ApigeneApiError) {
        throw error;
      }

      throw new ApigeneApiError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    }
  }

  // Convenience methods
  async get<T = any>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "GET",
      queryParams,
    });
    return response.data;
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "POST",
      body,
      queryParams,
    });
    return response.data;
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "PUT",
      body,
      queryParams,
    });
    return response.data;
  }

  async delete<T = any>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "DELETE",
      queryParams,
    });
    return response.data;
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "PATCH",
      body,
      queryParams,
    });
    return response.data;
  }
}

// Create a default instance
export const apigeneApi = new ApigeneClient();

// Hook for using API client with automatic token handling
export function useApigeneApi() {
  const { getToken } = useAuth();

  const client = useMemo(() => {
    const apiClient = new ApigeneClient();
    apiClient.setTokenGetter(async () => {
      try {
        return await getToken({
          template: process.env.NEXT_PUBLIC_AUTH_CLERK_JWT_TPL,
        });
      } catch (error) {
        console.error("Failed to get token:", error);
        return null;
      }
    });
    return apiClient;
  }, [getToken]);

  return client;
}

// Export error class for error handling
export { ApigeneApiError };
