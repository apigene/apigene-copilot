import { pgMcpRepository } from "../../pg/repositories/mcp-repository.pg";
import type {
  MCPRepository,
  McpServerInsert,
  McpServerSelect,
} from "app-types/mcp";

// MongoDB MCP Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoMcpRepository: MCPRepository = {
  async save(server: McpServerInsert): Promise<McpServerSelect> {
    console.log(
      "💾 [MongoDB MCP Repository] save called with server:",
      server.name,
      "id:",
      server.id,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpRepository.save(server);
    console.log("✅ [MongoDB MCP Repository] save result:", result);
    return result;
  },

  async selectById(id: string): Promise<McpServerSelect | null> {
    console.log("🔍 [MongoDB MCP Repository] selectById called with id:", id);
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpRepository.selectById(id);
    console.log(
      "✅ [MongoDB MCP Repository] selectById result:",
      result ? "Server found" : "Server not found",
    );
    return result;
  },

  async selectByServerName(name: string): Promise<McpServerSelect | null> {
    console.log(
      "🔍 [MongoDB MCP Repository] selectByServerName called with name:",
      name,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpRepository.selectByServerName(name);
    console.log(
      "✅ [MongoDB MCP Repository] selectByServerName result:",
      result ? "Server found" : "Server not found",
    );
    return result;
  },

  async selectAll(): Promise<McpServerSelect[]> {
    console.log("📋 [MongoDB MCP Repository] selectAll called");
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpRepository.selectAll();
    console.log(
      "✅ [MongoDB MCP Repository] selectAll result:",
      result.length,
      "servers found",
    );
    return result;
  },

  async deleteById(id: string): Promise<void> {
    console.log("🗑️ [MongoDB MCP Repository] deleteById called with id:", id);
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgMcpRepository.deleteById(id);
    console.log("✅ [MongoDB MCP Repository] deleteById completed");
  },

  async existsByServerName(name: string): Promise<boolean> {
    console.log(
      "🔍 [MongoDB MCP Repository] existsByServerName called with name:",
      name,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgMcpRepository.existsByServerName(name);
    console.log(
      "✅ [MongoDB MCP Repository] existsByServerName result:",
      result,
    );
    return result;
  },
};
