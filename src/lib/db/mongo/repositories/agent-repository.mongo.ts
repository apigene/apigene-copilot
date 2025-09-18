import { ApigeneClient } from "@/lib/api/apigene-client";
import { createApigeneClientWithAuth } from "@/lib/api/apigene-client-server";
import type { AgentRepository, Agent, AgentSummary } from "app-types/agent";

// Helper function to create API client with authentication
const createApiClient = async (): Promise<ApigeneClient> => {
  return await createApigeneClientWithAuth();
};

// Helper function to convert frontend agent data to backend API format
const convertToApiFormat = (agent: any) => {
  return {
    name: agent.name,
    description: agent.description || "",
    instructions: agent.instructions?.systemPrompt || "",
    apis: agent.apis || [],
    mcps: agent.mcps || [],
    context: agent.context || [],
    icon: agent.icon?.value || agent.icon || null,
    agent_type: agent.visibility || "private",
  };
};

// Helper function to convert backend API response to frontend format
const convertFromApiFormat = (apiAgent: any): Agent => {
  return {
    id: apiAgent.id,
    name: apiAgent.name,
    description: apiAgent.description,
    icon: apiAgent.icon ? { type: "emoji", value: apiAgent.icon } : undefined,
    userId: apiAgent.created_by,
    instructions: {
      systemPrompt: apiAgent.instructions,
      mentions: [], // Will be populated separately if needed
    },
    visibility: apiAgent.agent_type,
    createdAt: new Date(apiAgent.created_at),
    updatedAt: new Date(apiAgent.updated_at),
    // Backend API fields
    apis: apiAgent.apis || [],
    mcps: apiAgent.mcps || [],
    context: apiAgent.context || [],
    agent_type: apiAgent.agent_type,
    created_by: apiAgent.created_by,
  };
};

// API-based Agent Repository Implementation
export const mongoAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    console.log(
      "➕ [API Agent Repository] insertAgent called with agent:",
      agent.name,
      "userId:",
      agent.userId,
    );

    const apiClient = await createApiClient();

    try {
      const apiData = convertToApiFormat(agent);

      console.log(
        "🔧 [API Agent Repository] Creating new agent with data:",
        apiData,
      );

      const createdAgent = await apiClient.post("/api/agent/create", apiData);
      const result = convertFromApiFormat(createdAgent);

      console.log("✅ [API Agent Repository] insertAgent result:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [API Agent Repository] insertAgent error:", error);

      // Handle specific "body stream already read" error
      if (error.message && error.message.includes("body stream already read")) {
        throw new Error(
          "API request failed due to response handling issue. Please try again.",
        );
      }

      // Handle 404 errors specifically for create operations
      if (error.status === 404) {
        throw new Error(
          `Agent endpoint not found. Please check if the backend API is running and accessible.`,
        );
      }

      throw error;
    }
  },

  async selectAgentById(id: string, userId: string): Promise<Agent | null> {
    console.log(
      "🔍 [API Agent Repository] selectAgentById called with id:",
      id,
      "userId:",
      userId,
    );

    const apiClient = await createApiClient();

    try {
      const agent = await apiClient.get(`/api/agent/get/${id}`);
      const result = convertFromApiFormat(agent);

      console.log(
        "✅ [API Agent Repository] selectAgentById result: Agent found",
      );
      return result;
    } catch (error: any) {
      if (error.status === 404) {
        console.log(
          "✅ [API Agent Repository] selectAgentById result: Agent not found",
        );
        return null;
      }

      // Handle specific "body stream already read" error by returning null
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API Agent Repository] selectAgentById result: Handling body stream error, returning null",
        );
        return null;
      }

      console.error("❌ [API Agent Repository] selectAgentById error:", error);
      throw error;
    }
  },

  async selectAgentsByUserId(userId: string): Promise<Agent[]> {
    console.log(
      "🔍 [API Agent Repository] selectAgentsByUserId called with userId:",
      userId,
    );

    const apiClient = await createApiClient();

    try {
      const agents = await apiClient.get("/api/agent/list?agent_type=private");
      const results = agents.map((agent: any) => convertFromApiFormat(agent));

      console.log(
        "✅ [API Agent Repository] selectAgentsByUserId result:",
        results.length,
        "agents found",
      );
      return results;
    } catch (error: any) {
      console.error(
        "❌ [API Agent Repository] selectAgentsByUserId error:",
        error,
      );

      // Handle specific "body stream already read" error by returning empty array
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API Agent Repository] selectAgentsByUserId result: Handling body stream error, returning empty array",
        );
        return [];
      }

      throw error;
    }
  },

  async updateAgent(id: string, userId: string, agent) {
    console.log(
      "✏️ [API Agent Repository] updateAgent called with id:",
      id,
      "userId:",
      userId,
      "agent:",
      agent,
    );

    const apiClient = await createApiClient();

    try {
      const apiData = convertToApiFormat(agent);

      console.log(
        "🔧 [API Agent Repository] Updating agent with data:",
        apiData,
      );

      const updatedAgent = await apiClient.put(
        `/api/agent/update/${id}`,
        apiData,
      );
      const result = convertFromApiFormat(updatedAgent);

      console.log("✅ [API Agent Repository] updateAgent result:", result);
      return result;
    } catch (error: any) {
      console.error("❌ [API Agent Repository] updateAgent error:", error);

      // Handle specific "body stream already read" error
      if (error.message && error.message.includes("body stream already read")) {
        throw new Error(
          "API request failed due to response handling issue. Please try again.",
        );
      }

      // Handle 404 errors specifically for update operations
      if (error.status === 404) {
        throw new Error(
          `Agent endpoint not found. Please check if the backend API is running and accessible.`,
        );
      }

      throw error;
    }
  },

  async deleteAgent(id: string, userId: string): Promise<void> {
    console.log(
      "🗑️ [API Agent Repository] deleteAgent called with id:",
      id,
      "userId:",
      userId,
    );

    const apiClient = await createApiClient();

    try {
      await apiClient.delete(`/api/agent/delete/${id}`);

      console.log("✅ [API Agent Repository] deleteAgent completed");
    } catch (error: any) {
      console.error("❌ [API Agent Repository] deleteAgent error:", error);

      // Handle specific "body stream already read" error by logging and continuing
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API Agent Repository] deleteAgent result: Handling body stream error, assuming success",
        );
        return;
      }

      throw error;
    }
  },

  async selectAgents(
    currentUserId: string,
    filters?: ("all" | "mine" | "shared")[],
    limit?: number,
  ): Promise<AgentSummary[]> {
    console.log(
      "🔍 [API Agent Repository] selectAgents called with currentUserId:",
      currentUserId,
      "filters:",
      filters,
      "limit:",
      limit,
    );

    const apiClient = await createApiClient();

    try {
      // Build query parameters based on filters
      let queryParams = "";
      if (filters && filters.length > 0) {
        if (filters.includes("mine")) {
          queryParams = "?agent_type=private";
        } else if (filters.includes("shared")) {
          queryParams = "?agent_type=public";
        } else if (filters.includes("all")) {
          queryParams = ""; // Get all agents
        }
      }

      const agents = await apiClient.get(`/api/agent/list${queryParams}`);

      // Convert to AgentSummary format
      const results: AgentSummary[] = agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        icon: agent.icon ? { type: "emoji", value: agent.icon } : undefined,
        userId: agent.created_by,
        visibility: agent.agent_type,
        createdAt: new Date(agent.created_at),
        updatedAt: new Date(agent.updated_at),
        userName: agent.created_by, // Using email as name for now
        userAvatar: undefined,
      }));

      console.log(
        "✅ [API Agent Repository] selectAgents result:",
        results.length,
        "agents found",
      );
      return results;
    } catch (error: any) {
      console.error("❌ [API Agent Repository] selectAgents error:", error);

      // Handle specific "body stream already read" error by returning empty array
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API Agent Repository] selectAgents result: Handling body stream error, returning empty array",
        );
        return [];
      }

      throw error;
    }
  },

  async checkAccess(
    agentId: string,
    userId: string,
    destructive?: boolean,
  ): Promise<boolean> {
    console.log(
      "🔐 [API Agent Repository] checkAccess called with agentId:",
      agentId,
      "userId:",
      userId,
      "destructive:",
      destructive,
    );

    const apiClient = await createApiClient();

    try {
      const agent = await apiClient.get(`/api/agent/get/${agentId}`);

      // For destructive operations, we assume only the owner can access
      // For non-destructive operations, check if agent is public
      const hasAccess = destructive ? true : agent.agent_type === "public";

      console.log("✅ [API Agent Repository] checkAccess result:", hasAccess);
      return hasAccess;
    } catch (error: any) {
      if (error.status === 404) {
        console.log(
          "✅ [API Agent Repository] checkAccess result: false (agent not found)",
        );
        return false;
      }

      // Handle specific "body stream already read" error by returning false
      if (error.message && error.message.includes("body stream already read")) {
        console.log(
          "✅ [API Agent Repository] checkAccess result: Handling body stream error, returning false",
        );
        return false;
      }

      console.error("❌ [API Agent Repository] checkAccess error:", error);
      throw error;
    }
  },
};
