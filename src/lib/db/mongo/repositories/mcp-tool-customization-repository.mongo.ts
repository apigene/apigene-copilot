import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type { McpToolCustomizationRepository } from "app-types/mcp";

// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// MongoDB MCP Tool Customization Repository Implementation
export const mongoMcpToolCustomizationRepository: McpToolCustomizationRepository =
  {
    async select(key) {
      console.log(
        "🔍 [MongoDB MCP Tool Customization Repository] select called with key:",
        key,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const collection = await getCollection(
        COLLECTIONS.MCP_TOOL_CUSTOMIZATIONS,
      );

      const doc = await collection.findOne({
        userId: userEmail, // Use current user email instead of passed userId
        mcpServerId: key.mcpServerId,
        toolName: key.toolName,
      });

      if (!doc) {
        console.log(
          "✅ [MongoDB MCP Tool Customization Repository] select result: No customization found",
        );
        return null;
      }

      const result = {
        id: doc._id.toString(),
        userId: doc.userId,
        toolName: doc.toolName,
        mcpServerId: doc.mcpServerId,
        prompt: doc.prompt,
      };

      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] select result: Customization found",
      );
      return result;
    },

    async selectByUserIdAndMcpServerId(key) {
      console.log(
        "🔍 [MongoDB MCP Tool Customization Repository] selectByUserIdAndMcpServerId called with key:",
        key,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const collection = await getCollection(
        COLLECTIONS.MCP_TOOL_CUSTOMIZATIONS,
      );

      const docs = await collection
        .find({
          userId: userEmail, // Use current user email instead of passed userId
          mcpServerId: key.mcpServerId,
        })
        .toArray();

      const results = docs.map((doc) => ({
        id: doc._id.toString(),
        userId: doc.userId,
        toolName: doc.toolName,
        mcpServerId: doc.mcpServerId,
        prompt: doc.prompt,
      }));

      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] selectByUserIdAndMcpServerId result:",
        results.length,
        "customizations found",
      );
      return results;
    },

    async selectByUserId(userId: string) {
      console.log(
        "🔍 [MongoDB MCP Tool Customization Repository] selectByUserId called with userId:",
        userId,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const customizationCollection = await getCollection(
        COLLECTIONS.MCP_TOOL_CUSTOMIZATIONS,
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
            toolName: customizationDoc.toolName,
            mcpServerId: customizationDoc.mcpServerId,
            prompt: customizationDoc.prompt,
            serverName: serverDoc?.name || "Unknown Server",
          };
        }),
      );

      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] selectByUserId result:",
        results.length,
        "customizations found",
      );
      return results;
    },

    async upsertToolCustomization(data) {
      console.log(
        "💾 [MongoDB MCP Tool Customization Repository] upsertToolCustomization called with data:",
        data,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const collection = await getCollection(
        COLLECTIONS.MCP_TOOL_CUSTOMIZATIONS,
      );
      const now = new Date();

      const customizationDoc = {
        userId: userEmail, // Use current user email instead of passed userId
        toolName: data.toolName,
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
        // Create new customization or update existing one by userId + mcpServerId + toolName
        result = await collection.findOneAndUpdate(
          {
            userId: userEmail,
            mcpServerId: data.mcpServerId,
            toolName: data.toolName,
          },
          { $set: customizationDoc },
          { upsert: true, returnDocument: "after" },
        );
      }

      const customizationResult = {
        id: result._id.toString(),
        userId: result.userId,
        toolName: result.toolName,
        mcpServerId: result.mcpServerId,
        prompt: result.prompt,
      };

      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] upsertToolCustomization result:",
        customizationResult,
      );
      return customizationResult;
    },

    async deleteToolCustomization(key) {
      console.log(
        "🗑️ [MongoDB MCP Tool Customization Repository] deleteToolCustomization called with key:",
        key,
      );

      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();

      const collection = await getCollection(
        COLLECTIONS.MCP_TOOL_CUSTOMIZATIONS,
      );

      await collection.deleteOne({
        userId: userEmail, // Use current user email instead of passed userId
        mcpServerId: key.mcpServerId,
        toolName: key.toolName,
      });

      console.log(
        "✅ [MongoDB MCP Tool Customization Repository] deleteToolCustomization completed",
      );
    },
  };
