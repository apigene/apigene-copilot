import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type {
  MCPRepository,
  McpServerInsert,
  McpServerSelect,
} from "app-types/mcp";

// MongoDB MCP Repository Implementation
export const mongoMcpRepository: MCPRepository = {
  async save(server: McpServerInsert): Promise<McpServerSelect> {
    console.log(
      "💾 [MongoDB MCP Repository] save called with server:",
      server.name,
      "id:",
      server.id,
    );

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_SERVERS);

    const now = new Date();

    let result: McpServerSelect;

    if (server.id) {
      // Update existing document
      const serverDoc = {
        _id: new ObjectId(server.id),
        name: server.name,
        config: server.config,
        enabled: true,
        created_at: now,
        updated_at: now,
        created_by: userEmail,
      };

      await collection.replaceOne({ _id: new ObjectId(server.id) }, serverDoc, {
        upsert: true,
      });

      result = {
        id: server.id,
        name: server.name,
        config: server.config,
      };
    } else {
      // Insert new document - let MongoDB generate _id
      const serverDoc = {
        name: server.name,
        config: server.config,
        enabled: true,
        created_at: now,
        updated_at: now,
        created_by: userEmail,
      };

      const insertResult = await collection.insertOne(serverDoc);

      result = {
        id: insertResult.insertedId.toString(),
        name: server.name,
        config: server.config,
      };
    }

    console.log("✅ [MongoDB MCP Repository] save result:", result);
    return result;
  },

  async selectById(id: string): Promise<McpServerSelect | null> {
    console.log("🔍 [MongoDB MCP Repository] selectById called with id:", id);

    const collection = await getCollection(COLLECTIONS.MCP_SERVERS);

    const doc = await collection.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      console.log(
        "✅ [MongoDB MCP Repository] selectById result: Server not found",
      );
      return null;
    }

    const result: McpServerSelect = {
      id: doc._id.toString(),
      name: doc.name,
      config: doc.config,
    };

    console.log("✅ [MongoDB MCP Repository] selectById result: Server found");
    return result;
  },

  async selectByServerName(name: string): Promise<McpServerSelect | null> {
    console.log(
      "🔍 [MongoDB MCP Repository] selectByServerName called with name:",
      name,
    );

    const collection = await getCollection(COLLECTIONS.MCP_SERVERS);

    const doc = await collection.findOne({ name: name });

    if (!doc) {
      console.log(
        "✅ [MongoDB MCP Repository] selectByServerName result: Server not found",
      );
      return null;
    }

    const result: McpServerSelect = {
      id: doc._id.toString(),
      name: doc.name,
      config: doc.config,
    };

    console.log(
      "✅ [MongoDB MCP Repository] selectByServerName result: Server found",
    );
    return result;
  },

  async selectAll(): Promise<McpServerSelect[]> {
    console.log("📋 [MongoDB MCP Repository] selectAll called");

    const collection = await getCollection(COLLECTIONS.MCP_SERVERS);

    const docs = await collection.find({}).toArray();

    const results: McpServerSelect[] = docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      config: doc.config,
    }));

    console.log(
      "✅ [MongoDB MCP Repository] selectAll result:",
      results.length,
      "servers found",
    );
    return results;
  },

  async deleteById(id: string): Promise<void> {
    console.log("🗑️ [MongoDB MCP Repository] deleteById called with id:", id);

    // Get current user information for audit trail
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_SERVERS);

    // Instead of hard delete, we could do soft delete by updating the document
    // For now, keeping hard delete but logging the action
    await collection.deleteOne({ _id: new ObjectId(id) });

    console.log(
      "✅ [MongoDB MCP Repository] deleteById completed by user:",
      userEmail,
    );
  },

  async existsByServerName(name: string): Promise<boolean> {
    console.log(
      "🔍 [MongoDB MCP Repository] existsByServerName called with name:",
      name,
    );

    const collection = await getCollection(COLLECTIONS.MCP_SERVERS);

    const doc = await collection.findOne(
      { name: name },
      { projection: { _id: 1 } },
    );
    const result = !!doc;

    console.log(
      "✅ [MongoDB MCP Repository] existsByServerName result:",
      result,
    );
    return result;
  },
};
