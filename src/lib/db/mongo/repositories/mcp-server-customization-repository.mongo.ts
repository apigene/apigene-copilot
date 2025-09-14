import { pgMcpServerCustomizationRepository } from "../../pg/repositories/mcp-server-customization-repository.pg";
import type { McpServerCustomizationRepository } from "app-types/mcp";

// MongoDB MCP Server Customization Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoMcpServerCustomizationRepository: McpServerCustomizationRepository =
  {
    async selectByUserIdAndMcpServerId({ userId, mcpServerId }) {
      console.log(
        "🔍 [MongoDB MCP Server Customization Repository] selectByUserIdAndMcpServerId called with userId:",
        userId,
        "mcpServerId:",
        mcpServerId,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      const result =
        await pgMcpServerCustomizationRepository.selectByUserIdAndMcpServerId({
          userId,
          mcpServerId,
        });
      console.log(
        "✅ [MongoDB MCP Server Customization Repository] selectByUserIdAndMcpServerId result:",
        result ? "Customization found" : "No customization found",
      );
      return result;
    },

    async selectByUserId(userId: string) {
      console.log(
        "🔍 [MongoDB MCP Server Customization Repository] selectByUserId called with userId:",
        userId,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      const result =
        await pgMcpServerCustomizationRepository.selectByUserId(userId);
      console.log(
        "✅ [MongoDB MCP Server Customization Repository] selectByUserId result:",
        result.length,
        "customizations found",
      );
      return result;
    },

    async upsertMcpServerCustomization(data) {
      console.log(
        "💾 [MongoDB MCP Server Customization Repository] upsertMcpServerCustomization called with data:",
        data,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      const result =
        await pgMcpServerCustomizationRepository.upsertMcpServerCustomization(
          data,
        );
      console.log(
        "✅ [MongoDB MCP Server Customization Repository] upsertMcpServerCustomization result:",
        result,
      );
      return result;
    },

    async deleteMcpServerCustomizationByMcpServerIdAndUserId(key: {
      mcpServerId: string;
      userId: string;
    }) {
      console.log(
        "🗑️ [MongoDB MCP Server Customization Repository] deleteMcpServerCustomizationByMcpServerIdAndUserId called with key:",
        key,
      );
      // TODO: Implement MongoDB version
      // For now, delegate to PostgreSQL
      await pgMcpServerCustomizationRepository.deleteMcpServerCustomizationByMcpServerIdAndUserId(
        key,
      );
      console.log(
        "✅ [MongoDB MCP Server Customization Repository] deleteMcpServerCustomizationByMcpServerIdAndUserId completed",
      );
    },
  };
