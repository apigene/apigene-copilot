import { pgMcpMcpToolCustomizationRepository } from "../../pg/repositories/mcp-tool-customization-repository.pg";
import type { McpToolCustomizationRepository } from "app-types/mcp";

// MongoDB MCP Tool Customization Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoMcpToolCustomizationRepository: McpToolCustomizationRepository =
  {
    async select(key) {
      console.log(
        "🔍 [MongoDB MCP Tool Customization Repository] select called with key:",
        key,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      const result = await pgMcpMcpToolCustomizationRepository.select(key);
      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] select result:",
        result ? "Customization found" : "No customization found",
      );
      return result;
    },

    async selectByUserIdAndMcpServerId(key) {
      console.log(
        "🔍 [MongoDB MCP Tool Customization Repository] selectByUserIdAndMcpServerId called with key:",
        key,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      const result =
        await pgMcpMcpToolCustomizationRepository.selectByUserIdAndMcpServerId(
          key,
        );
      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] selectByUserIdAndMcpServerId result:",
        result.length,
        "customizations found",
      );
      return result;
    },

    async selectByUserId(userId: string) {
      console.log(
        "🔍 [MongoDB MCP Tool Customization Repository] selectByUserId called with userId:",
        userId,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      const result =
        await pgMcpMcpToolCustomizationRepository.selectByUserId(userId);
      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] selectByUserId result:",
        result.length,
        "customizations found",
      );
      return result;
    },

    async upsertToolCustomization(data) {
      console.log(
        "💾 [MongoDB MCP Tool Customization Repository] upsertToolCustomization called with data:",
        data,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      const result =
        await pgMcpMcpToolCustomizationRepository.upsertToolCustomization(data);
      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] upsertToolCustomization result:",
        result,
      );
      return result;
    },

    async deleteToolCustomization(key) {
      console.log(
        "🗑️ [MongoDB MCP Tool Customization Repository] deleteToolCustomization called with key:",
        key,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      await pgMcpMcpToolCustomizationRepository.deleteToolCustomization(key);
      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] deleteToolCustomization completed",
      );
    },
  };
