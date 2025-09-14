import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type { McpServerCustomizationRepository } from "app-types/mcp";

// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// MongoDB MCP Server Customization Repository Implementation
export const mongoMcpServerCustomizationRepository: McpServerCustomizationRepository =
  {
    async selectByUserIdAndMcpServerId({ userId, mcpServerId }) {
      console.log(
        "🔍 [MongoDB MCP Server Customization Repository] selectByUserIdAndMcpServerId called with userId:",
        userId,
        "mcpServerId:",
        mcpServerId,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const customizationCollection = await getCollection(
        COLLECTIONS.MCP_SERVER_CUSTOMIZATIONS,
      );
      const serverCollection = await getCollection(COLLECTIONS.MCP_SERVERS);

      // Find the customization
      const customizationDoc = await customizationCollection.findOne({
        userId: userEmail, // Use current user email instead of passed userId
        mcpServerId: mcpServerId,
      });

      if (!customizationDoc) {
        console.log(
          "✅ [MongoDB MCP Server Customization Repository] selectByUserIdAndMcpServerId result: No customization found",
        );
        return null;
      }

      // Get server name
      const serverDoc = await serverCollection.findOne(
        { _id: new ObjectId(mcpServerId) },
        { projection: { name: 1 } },
      );

      const result = {
        id: customizationDoc._id.toString(),
        userId: customizationDoc.userId,
        mcpServerId: customizationDoc.mcpServerId,
        prompt: customizationDoc.prompt,
        serverName: serverDoc?.name || "Unknown Server",
      };

      console.log(
        "✅ [MongoDB MCP Server Customization Repository] selectByUserIdAndMcpServerId result: Customization found",
      );
      return result;
    },

    async selectByUserId(userId: string) {
      console.log(
        "🔍 [MongoDB MCP Server Customization Repository] selectByUserId called with userId:",
        userId,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const customizationCollection = await getCollection(
        COLLECTIONS.MCP_SERVER_CUSTOMIZATIONS,
      );
      const serverCollection = await getCollection(COLLECTIONS.MCP_SERVERS);

      // Find all customizations for the user
      const customizationDocs = await customizationCollection
        .find({ userId: userEmail }) // Use current user email instead of passed userId
        .toArray();

      // Get server names for each customization
      const results = await Promise.all(
        customizationDocs.map(async (customizationDoc) => {
          const serverDoc = await serverCollection.findOne(
            { _id: new ObjectId(customizationDoc.mcpServerId) },
            { projection: { name: 1 } },
          );

          return {
            id: customizationDoc._id.toString(),
            userId: customizationDoc.userId,
            mcpServerId: customizationDoc.mcpServerId,
            prompt: customizationDoc.prompt,
            serverName: serverDoc?.name || "Unknown Server",
          };
        }),
      );

      console.log(
        "✅ [MongoDB MCP Server Customization Repository] selectByUserId result:",
        results.length,
        "customizations found",
      );
      return results;
    },

    async upsertMcpServerCustomization(data) {
      console.log(
        "💾 [MongoDB MCP Server Customization Repository] upsertMcpServerCustomization called with data:",
        data,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const collection = await getCollection(
        COLLECTIONS.MCP_SERVER_CUSTOMIZATIONS,
      );
      const now = new Date();

      const customizationDoc = {
        userId: userEmail, // Use current user email instead of passed userId
        mcpServerId: data.mcpServerId,
        prompt: data.prompt ?? null,
        created_at: now,
        updated_at: now,
      };

      let result;
      if (data.id && isValidObjectId(data.id)) {
        // Update existing customization
        result = await collection.findOneAndUpdate(
          { _id: new ObjectId(data.id) },
          { $set: customizationDoc },
          { returnDocument: "after" },
        );
      } else {
        // Create new customization or update existing one by userId + mcpServerId
        result = await collection.findOneAndUpdate(
          {
            userId: userEmail,
            mcpServerId: data.mcpServerId,
          },
          { $set: customizationDoc },
          { upsert: true, returnDocument: "after" },
        );
      }

      const customizationResult = {
        id: result._id.toString(),
        userId: result.userId,
        mcpServerId: result.mcpServerId,
        prompt: result.prompt,
      };

      console.log(
        "✅ [MongoDB MCP Server Customization Repository] upsertMcpServerCustomization result:",
        customizationResult,
      );
      return customizationResult;
    },

    async deleteMcpServerCustomizationByMcpServerIdAndUserId(key: {
      mcpServerId: string;
      userId: string;
    }) {
      console.log(
        "🗑️ [MongoDB MCP Server Customization Repository] deleteMcpServerCustomizationByMcpServerIdAndUserId called with key:",
        key,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const collection = await getCollection(
        COLLECTIONS.MCP_SERVER_CUSTOMIZATIONS,
      );

      await collection.deleteOne({
        userId: userEmail, // Use current user email instead of passed userId
        mcpServerId: key.mcpServerId,
      });

      console.log(
        "✅ [MongoDB MCP Server Customization Repository] deleteMcpServerCustomizationByMcpServerIdAndUserId completed",
      );
    },
  };
