/**
 * Apigene API Client - A lightweight API client for Apigene services
 */

import { useMemo, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

// Utility function for creating FormData from objects
export const customFormData = <Body>(body: Body): FormData => {
  const formData = new FormData();

  for (const key in body) {
    if ((body as object).hasOwnProperty(key)) {
      const value = body[key];

      // Handle File objects
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        value.forEach((item) => formData.append(`${key}[]`, item));
      }
      // Handle null or undefined
      else if (value === null || value === undefined) {
        continue;
      }
      // Handle other types (convert to string)
      else {
        formData.append(key, String(value));
      }
    }
  }

  return formData;
};

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
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
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
    body?: any,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    // Remove Content-Type header if it's FormData to let browser set it with boundary
    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

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
    const headers = await this.buildHeaders(customHeaders, body);

    // Log before making the request
    console.log(`Request >> ${method}: ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body:
          body instanceof FormData
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error(
          `[ApigeneClient] Failed to parse JSON response for ${method} ${url}:`,
          jsonError,
        );
        const textResponse = await response.text();
        console.error(`[ApigeneClient] Raw response text:`, textResponse);
        throw new ApigeneApiError(
          `Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`,
          response.status,
          response.statusText,
          textResponse,
        );
      }

      // Log after receiving the response
      // console.log(`[ApigeneClient] Response received for ${method} ${url}:`, {
      //   status: response.status,
      //   statusText: response.statusText,
      //   data: responseData,
      // });

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
      // Log error
      console.error(
        `[ApigeneClient] Error in ${method} request to ${url}:`,
        error,
      );

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
    options?: {
      queryParams?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "GET",
      queryParams: options?.queryParams,
      headers: options?.headers,
    });
    return response.data;
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: {
      queryParams?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "POST",
      body,
      queryParams: options?.queryParams,
      headers: options?.headers,
    });
    return response.data;
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: {
      queryParams?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "PUT",
      body,
      queryParams: options?.queryParams,
      headers: options?.headers,
    });
    return response.data;
  }

  async delete<T = any>(
    endpoint: string,
    options?: {
      queryParams?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "DELETE",
      queryParams: options?.queryParams,
      headers: options?.headers,
    });
    return response.data;
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: {
      queryParams?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const response = await this.request<T>({
      endpoint,
      method: "PATCH",
      body,
      queryParams: options?.queryParams,
      headers: options?.headers,
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

  // Add interaction methods
  const interactionList = useCallback(
    async (
      filters: Record<string, any> = {},
      params: Record<string, any> = {},
    ) => {
      return client.post("/api/interaction/list", filters, params);
    },
    [client],
  );

  const interactionCreate = useCallback(
    async (data: any) => {
      return client.post("/api/interaction/create", data);
    },
    [client],
  );

  const interactionSummary = useCallback(
    async (data: any) => {
      return client.post("/api/interaction/summary", data);
    },
    [client],
  );

  const specGet = useCallback(
    async (name: string) => {
      return client.get(`/api/spec/${name}`);
    },
    [client],
  );

  const specUpdate = useCallback(
    async (name: string, data: any) => {
      return client.post(`/api/spec/${name}/update`, data);
    },
    [client],
  );

  const specDelete = useCallback(
    async (name: string) => {
      return client.delete(`/api/spec/${name}`);
    },
    [client],
  );

  const specGetInstructions = useCallback(
    async (name: string) => {
      return client.get(`/api/spec/instructions/${name}`);
    },
    [client],
  );

  const specCreateInstructions = useCallback(
    async (data: any) => {
      return client.post(`/api/spec/instructions`, data);
    },
    [client],
  );

  const specGetAgenticMetadata = useCallback(
    async (name: string) => {
      return client.get(`/api/spec/${name}/agentic_metadata`);
    },
    [client],
  );

  const specCreateAgenticMetadata = useCallback(
    async (name: string) => {
      return client.post(`/api/spec/${name}/create_agentic_metadata`);
    },
    [client],
  );

  const specUpdateAgenticMetadata = useCallback(
    async (name: string, data: any) => {
      return client.post(`/api/spec/${name}/update_agentic_metadata`, data);
    },
    [client],
  );

  const specGetOperations = useCallback(
    async (name: string) => {
      return client.get(`/api/spec/${name}/operations`);
    },
    [client],
  );

  const specCreateFromUrl = useCallback(
    async (data: {
      url: string;
      global_spec?: boolean;
      shared_security_info?: boolean;
      create_mcp?: boolean;
    }) => {
      return client.post("/api/spec_from_url/", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    [client],
  );

  const specCreateFromFile = useCallback(
    async (data: {
      file: File;
      global_spec?: boolean;
      shared_security_info?: boolean;
      create_mcp?: boolean;
    }) => {
      const formData = customFormData(data);
      console.log(
        "🔥 HOT RELOAD TEST - specCreateFromFile() with formData:",
        formData,
      );
      const response = await client.request({
        endpoint: "/api/spec_from_file/",
        method: "POST",
        body: formData,
      });
      return response.data;
    },
    [client],
  );

  return useMemo(
    () => ({
      // Spread all the original client methods
      get: client.get.bind(client),
      post: client.post.bind(client),
      put: client.put.bind(client),
      delete: client.delete.bind(client),
      patch: client.patch.bind(client),
      request: client.request.bind(client),
      getBaseUrl: client.getBaseUrl.bind(client),
      // Add interaction methods
      interactionList,
      interactionCreate,
      interactionSummary,
      // Spec general methods
      specGet,
      specUpdate,
      specDelete,
      // Spec security (instructions) methods
      specGetInstructions,
      specCreateInstructions,
      // Spec agentic metadata methods
      specGetAgenticMetadata,
      specCreateAgenticMetadata,
      specUpdateAgenticMetadata,
      // Spec operations methods
      specGetOperations,
      // Spec creation methods
      specCreateFromUrl,
      specCreateFromFile,
    }),
    [client, interactionList, interactionCreate, interactionSummary],
  );
}

// Export error class for error handling
export { ApigeneApiError };
