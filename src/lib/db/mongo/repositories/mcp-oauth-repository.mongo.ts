import { getCollection, COLLECTIONS } from "../mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type { McpOAuthRepository, McpOAuthSession } from "app-types/mcp";

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

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_OAUTH);

    const doc = await collection.findOne(
      {
        mcpServerId: mcpServerId,
        created_by: userEmail,
        tokens: { $exists: true, $ne: null },
      },
      { sort: { updatedAt: -1 } },
    );

    if (!doc) {
      console.log(
        "✅ [MongoDB MCP OAuth Repository] getAuthenticatedSession result: No session found",
      );
      return undefined;
    }

    const result: McpOAuthSession = {
      id: doc._id.toString(),
      mcpServerId: doc.mcpServerId,
      serverUrl: doc.serverUrl,
      clientInfo: doc.clientInfo,
      tokens: doc.tokens,
      codeVerifier: doc.codeVerifier,
      state: doc.state,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    console.log(
      "✅ [MongoDB MCP OAuth Repository] getAuthenticatedSession result: Session found",
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

    if (!state) {
      console.log(
        "✅ [MongoDB MCP OAuth Repository] getSessionByState result: No state provided",
      );
      return undefined;
    }

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_OAUTH);

    const doc = await collection.findOne({
      state: state,
      created_by: userEmail,
    });

    if (!doc) {
      console.log(
        "✅ [MongoDB MCP OAuth Repository] getSessionByState result: No session found",
      );
      return undefined;
    }

    const result: McpOAuthSession = {
      id: doc._id.toString(),
      mcpServerId: doc.mcpServerId,
      serverUrl: doc.serverUrl,
      clientInfo: doc.clientInfo,
      tokens: doc.tokens,
      codeVerifier: doc.codeVerifier,
      state: doc.state,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    console.log(
      "✅ [MongoDB MCP OAuth Repository] getSessionByState result: Session found",
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

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_OAUTH);
    const now = new Date();

    const sessionDoc = {
      mcpServerId: mcpServerId,
      serverUrl: data.serverUrl || "",
      clientInfo: data.clientInfo,
      tokens: data.tokens,
      codeVerifier: data.codeVerifier,
      state: data.state,
      created_by: userEmail,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await collection.insertOne(sessionDoc);

    const result: McpOAuthSession = {
      id: insertResult.insertedId.toString(),
      mcpServerId: sessionDoc.mcpServerId,
      serverUrl: sessionDoc.serverUrl,
      clientInfo: sessionDoc.clientInfo,
      tokens: sessionDoc.tokens,
      codeVerifier: sessionDoc.codeVerifier,
      state: sessionDoc.state,
      createdAt: sessionDoc.createdAt,
      updatedAt: sessionDoc.updatedAt,
    };

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

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_OAUTH);
    const now = new Date();

    const updateDoc: any = {
      updatedAt: now,
    };

    if (data.serverUrl !== undefined) updateDoc.serverUrl = data.serverUrl;
    if (data.clientInfo !== undefined) updateDoc.clientInfo = data.clientInfo;
    if (data.tokens !== undefined) updateDoc.tokens = data.tokens;
    if (data.codeVerifier !== undefined)
      updateDoc.codeVerifier = data.codeVerifier;
    if (data.state !== undefined) updateDoc.state = data.state;

    const result = await collection.findOneAndUpdate(
      {
        state: state,
        created_by: userEmail,
      },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`Session with state ${state} not found`);
    }

    const sessionResult: McpOAuthSession = {
      id: result._id.toString(),
      mcpServerId: result.mcpServerId,
      serverUrl: result.serverUrl,
      clientInfo: result.clientInfo,
      tokens: result.tokens,
      codeVerifier: result.codeVerifier,
      state: result.state,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    console.log(
      "✅ [MongoDB MCP OAuth Repository] updateSessionByState result:",
      sessionResult,
    );
    return sessionResult;
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

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_OAUTH);
    const now = new Date();

    // Update the session with new data
    const updateDoc: any = {
      updatedAt: now,
    };

    if (data.serverUrl !== undefined) updateDoc.serverUrl = data.serverUrl;
    if (data.clientInfo !== undefined) updateDoc.clientInfo = data.clientInfo;
    if (data.tokens !== undefined) updateDoc.tokens = data.tokens;
    if (data.codeVerifier !== undefined)
      updateDoc.codeVerifier = data.codeVerifier;
    if (data.state !== undefined) updateDoc.state = data.state;

    const result = await collection.findOneAndUpdate(
      {
        state: state,
        created_by: userEmail,
      },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`Session with state ${state} not found`);
    }

    // Cleanup incomplete sessions for the same MCP server and user
    await collection.deleteMany({
      mcpServerId: mcpServerId,
      created_by: userEmail,
      tokens: { $exists: false },
      state: { $ne: state },
    });

    const sessionResult: McpOAuthSession = {
      id: result._id.toString(),
      mcpServerId: result.mcpServerId,
      serverUrl: result.serverUrl,
      clientInfo: result.clientInfo,
      tokens: result.tokens,
      codeVerifier: result.codeVerifier,
      state: result.state,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    console.log(
      "✅ [MongoDB MCP OAuth Repository] saveTokensAndCleanup result:",
      sessionResult,
    );
    return sessionResult;
  },

  // Delete a session by its OAuth state
  deleteByState: async (state: string): Promise<void> => {
    console.log(
      "🗑️ [MongoDB MCP OAuth Repository] deleteByState called with state:",
      state,
    );

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.MCP_OAUTH);

    await collection.deleteOne({
      state: state,
      created_by: userEmail,
    });

    console.log("✅ [MongoDB MCP OAuth Repository] deleteByState completed");
  },
};
