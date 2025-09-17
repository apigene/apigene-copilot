import { ApigeneClient } from "@/lib/api/apigene-client";
import { createApigeneClientWithAuth } from "@/lib/api/apigene-client-server";
import type {
  MCPRepository,
  McpServerInsert,
  McpServerSelect,
} from "app-types/mcp";

// Helper function to create API client with authentication
const createApiClient = async (): Promise<ApigeneClient> => {
  return await createApigeneClientWithAuth();
};

// API-based MCP Repository Implementation
export const mongoMcpRepository: MCPRepository = {
  async save(server: McpServerInsert): Promise<McpServerSelect> {
    console.log(
      "💾 [API MCP Repository] save called with server:",
      server.name,
      "id:",
      server.id,
    );

    const apiClient = await createApiClient();

    let result: McpServerSelect;

    try {
      if (server.id) {
        // Update existing server
        const updateData = {
          name: server.name,
          config: server.config,
          enabled: true,
        };

        const updatedServer = await apiClient.put(
          `/api/mcp-server/update/${server.id}`,
          updateData,
        );

        result = {
          id: updatedServer.id,
          name: updatedServer.name,
          config: updatedServer.config,
        };
      } else {
        // Create new server
        const createData = {
          name: server.name,
          config: server.config,
          enabled: true,
          server_type: "public",
          icon_url: "apigene.ai",
        };

        console.log(
          "🔧 [API MCP Repository] Creating new server with data:",
          createData,
        );
        console.log(
          "🔧 [API MCP Repository] Calling endpoint: /api/mcp-server/create",
        );

        const createdServer = await apiClient.post(
          "/api/mcp-server/create",
          createData,
        );

        result = {
          id: createdServer.id,
          name: createdServer.name,
          config: createdServer.config,
        };
      }

      console.log("✅ [API MCP Repository] save result:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [API MCP Repository] save error:", error);

      // Handle specific "body stream already read" error by rethrowing as a more specific error
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API MCP Repository] save result: Handling body stream error",
        );
        throw new Error(
          "API request failed due to response handling issue. Please try again.",
        );
      }

      // Handle 404 errors specifically for create/update operations
      if (error.status === 404) {
        console.log(
          "❌ [API MCP Repository] save result: Endpoint not found (404)",
        );
        throw new Error(
          `MCP server endpoint not found. Please check if the backend API is running and accessible.`,
        );
      }

      throw error;
    }
  },

  async selectById(id: string): Promise<McpServerSelect | null> {
    console.log("🔍 [API MCP Repository] selectById called with id:", id);

    const apiClient = await createApiClient();

    try {
      const server = await apiClient.get(`/api/mcp-server/get/${id}`);

      const result: McpServerSelect = {
        id: server.id,
        name: server.name,
        config: server.config,
      };

      console.log("✅ [API MCP Repository] selectById result: Server found");
      return result;
    } catch (error: any) {
      if (error.status === 404) {
        console.log(
          "✅ [API MCP Repository] selectById result: Server not found",
        );
        return null;
      }

      // Handle specific "body stream already read" error by returning null
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API MCP Repository] selectById result: Handling body stream error, returning null",
        );
        return null;
      }

      console.error("❌ [API MCP Repository] selectById error:", error);
      throw error;
    }
  },

  async selectByServerName(name: string): Promise<McpServerSelect | null> {
    console.log(
      "🔍 [API MCP Repository] selectByServerName called with name:",
      name,
    );

    // Since the backend API doesn't have a direct "get by name" endpoint,
    // we'll need to get all servers and filter by name
    const allServers = await this.selectAll();
    const server = allServers.find((s) => s.name === name);

    if (!server) {
      console.log(
        "✅ [API MCP Repository] selectByServerName result: Server not found",
      );
      return null;
    }

    console.log(
      "✅ [API MCP Repository] selectByServerName result: Server found",
    );
    return server;
  },

  async selectAll(): Promise<McpServerSelect[]> {
    console.log("📋 [API MCP Repository] selectAll called");

    const apiClient = await createApiClient();

    try {
      const servers = await apiClient.get(
        "/api/mcp-server/list?enabled_only=false",
      );

      const results: McpServerSelect[] = servers.map((server: any) => ({
        id: server.id,
        name: server.name,
        config: server.config,
      }));

      console.log(
        "✅ [API MCP Repository] selectAll result:",
        results.length,
        "servers found",
      );
      return results;
    } catch (error: any) {
      console.error("❌ [API MCP Repository] selectAll error:", error);

      // Handle specific "body stream already read" error by returning empty array
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API MCP Repository] selectAll result: Handling body stream error, returning empty array",
        );
        return [];
      }

      throw error;
    }
  },

  async deleteById(id: string): Promise<void> {
    console.log("🗑️ [API MCP Repository] deleteById called with id:", id);

    const apiClient = await createApiClient();

    try {
      await apiClient.delete(`/api/mcp-server/delete/${id}`);

      console.log("✅ [API MCP Repository] deleteById completed");
    } catch (error: any) {
      console.error("❌ [API MCP Repository] deleteById error:", error);

      // Handle specific "body stream already read" error by logging and continuing
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API MCP Repository] deleteById result: Handling body stream error, assuming success",
        );
        return;
      }

      throw error;
    }
  },

  async existsByServerName(name: string): Promise<boolean> {
    console.log(
      "🔍 [API MCP Repository] existsByServerName called with name:",
      name,
    );

    try {
      const server = await this.selectByServerName(name);
      const result = !!server;

      console.log("✅ [API MCP Repository] existsByServerName result:", result);
      return result;
    } catch (error) {
      console.error("❌ [API MCP Repository] existsByServerName error:", error);
      throw error;
    }
  },
};
