import { pgMcpOAuthRepository } from "../../pg/repositories/mcp-oauth-repository.pg";
import type { McpOAuthRepository, McpOAuthSession } from "app-types/mcp";

// MongoDB MCP OAuth Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoMcpOAuthRepository: McpOAuthRepository = {
  // 1. Query methods

  // Get session with valid tokens (authenticated)
  getAuthenticatedSession: async (
    mcpServerId: string,
  ): Promise<McpOAuthSession | undefined> => {
    console.log(
      "🔐 [MongoDB MCP OAuth Repository] getAuthenticatedSession called with mcpServerId:",
      mcpServerId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result =
      await pgMcpOAuthRepository.getAuthenticatedSession(mcpServerId);
    console.log(
      "✅ [MongoDB MCP OAuth Repository] getAuthenticatedSession result:",
      result ? "Session found" : "No session found",
    );
    return result;
  },

  // Get session by OAuth state (for callback handling)
  getSessionByState: async (
    state: string,
  ): Promise<McpOAuthSession | undefined> => {
    console.log(
      "🔍 [MongoDB MCP OAuth Repository] getSessionByState called with state:",
      state,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpOAuthRepository.getSessionByState(state);
    console.log(
      "✅ [MongoDB MCP OAuth Repository] getSessionByState result:",
      result ? "Session found" : "No session found",
    );
    return result;
  },

  // 2. Create/Update methods

  // Create new OAuth session
  createSession: async (
    mcpServerId: string,
    data: Partial<McpOAuthSession>,
  ): Promise<McpOAuthSession> => {
    console.log(
      "➕ [MongoDB MCP OAuth Repository] createSession called with mcpServerId:",
      mcpServerId,
      "data:",
      data,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpOAuthRepository.createSession(mcpServerId, data);
    console.log(
      "✅ [MongoDB MCP OAuth Repository] createSession result:",
      result,
    );
    return result;
  },

  // Update existing session by state
  updateSessionByState: async (
    state: string,
    data: Partial<McpOAuthSession>,
  ): Promise<McpOAuthSession> => {
    console.log(
      "✏️ [MongoDB MCP OAuth Repository] updateSessionByState called with state:",
      state,
      "data:",
      data,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpOAuthRepository.updateSessionByState(state, data);
    console.log(
      "✅ [MongoDB MCP OAuth Repository] updateSessionByState result:",
      result,
    );
    return result;
  },

  saveTokensAndCleanup: async (
    state: string,
    mcpServerId: string,
    data: Partial<McpOAuthSession>,
  ): Promise<McpOAuthSession> => {
    console.log(
      "💾 [MongoDB MCP OAuth Repository] saveTokensAndCleanup called with state:",
      state,
      "mcpServerId:",
      mcpServerId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpOAuthRepository.saveTokensAndCleanup(
      state,
      mcpServerId,
      data,
    );
    console.log(
      "✅ [MongoDB MCP OAuth Repository] saveTokensAndCleanup result:",
      result,
    );
    return result;
  },

  // Delete a session by its OAuth state
  deleteByState: async (state: string): Promise<void> => {
    console.log(
      "🗑️ [MongoDB MCP OAuth Repository] deleteByState called with state:",
      state,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgMcpOAuthRepository.deleteByState(state);
    console.log("✅ [MongoDB MCP OAuth Repository] deleteByState completed");
  },
};
