import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type { AgentRepository, Agent, AgentSummary } from "app-types/agent";

// MongoDB Agent Repository Implementation
export const mongoAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    console.log(
      "➕ [MongoDB Agent Repository] insertAgent called with agent:",
      agent.name,
      "userId:",
      agent.userId,
    );

    // Get current user information
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.AGENTS);
    const now = new Date();

    const agentDoc = {
      name: agent.name,
      description: agent.description,
      icon: agent.icon,
      created_by: userEmail,
      instructions: agent.instructions,
      visibility: agent.visibility || "private",
      created_at: now,
      updated_at: now,
    };

    const insertResult = await collection.insertOne(agentDoc);

    const result: Agent = {
      id: insertResult.insertedId.toString(),
      name: agentDoc.name,
      description: agentDoc.description,
      icon: agentDoc.icon,
      userId: agentDoc.created_by,
      instructions: agentDoc.instructions,
      visibility: agentDoc.visibility,
      createdAt: now,
      updatedAt: now,
    };

    console.log("✅ [MongoDB Agent Repository] insertAgent result:", result);
    return result;
  },

  async selectAgentById(id: string, userId: string): Promise<Agent | null> {
    console.log(
      "🔍 [MongoDB Agent Repository] selectAgentById called with id:",
      id,
      "userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.AGENTS);

    const doc = await collection.findOne({
      _id: new ObjectId(id),
      created_by: userEmail, // Ignore passed userId, use current user email
    });

    if (!doc) {
      console.log(
        "✅ [MongoDB Agent Repository] selectAgentById result: Agent not found",
      );
      return null;
    }

    const result: Agent = {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      icon: doc.icon,
      userId: doc.created_by,
      instructions: doc.instructions,
      visibility: doc.visibility,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };

    console.log(
      "✅ [MongoDB Agent Repository] selectAgentById result: Agent found",
    );
    return result;
  },

  async selectAgentsByUserId(userId: string): Promise<Agent[]> {
    console.log(
      "🔍 [MongoDB Agent Repository] selectAgentsByUserId called with userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.AGENTS);

    const docs = await collection
      .find({ created_by: userEmail }) // Ignore passed userId, use current user email
      .sort({ updated_at: -1 })
      .toArray();

    const results: Agent[] = docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      icon: doc.icon,
      userId: doc.created_by,
      instructions: doc.instructions,
      visibility: doc.visibility,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }));

    console.log(
      "✅ [MongoDB Agent Repository] selectAgentsByUserId result:",
      results.length,
      "agents found",
    );
    return results;
  },

  async updateAgent(id: string, userId: string, agent) {
    console.log(
      "✏️ [MongoDB Agent Repository] updateAgent called with id:",
      id,
      "userId:",
      userId,
      "agent:",
      agent,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.AGENTS);
    const now = new Date();

    const updateDoc: any = {
      updated_at: now,
    };

    if (agent.name !== undefined) updateDoc.name = agent.name;
    if (agent.description !== undefined)
      updateDoc.description = agent.description;
    if (agent.icon !== undefined) updateDoc.icon = agent.icon;
    if (agent.instructions !== undefined)
      updateDoc.instructions = agent.instructions;
    if (agent.visibility !== undefined) updateDoc.visibility = agent.visibility;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), created_by: userEmail }, // Ignore passed userId, use current user email
      { $set: updateDoc },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`Agent with id ${id} not found or access denied`);
    }

    const agentResult: Agent = {
      id: result._id.toString(),
      name: result.name,
      description: result.description,
      icon: result.icon,
      userId: result.created_by,
      instructions: result.instructions,
      visibility: result.visibility,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };

    console.log(
      "✅ [MongoDB Agent Repository] updateAgent result:",
      agentResult,
    );
    return agentResult;
  },

  async deleteAgent(id: string, userId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Agent Repository] deleteAgent called with id:",
      id,
      "userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.AGENTS);

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      created_by: userEmail, // Ignore passed userId, use current user email
    });

    if (result.deletedCount === 0) {
      throw new Error(`Agent with id ${id} not found or access denied`);
    }

    console.log("✅ [MongoDB Agent Repository] deleteAgent completed");
  },

  async selectAgents(
    currentUserId: string,
    filters?: ("all" | "mine" | "shared" | "bookmarked")[],
    limit?: number,
  ): Promise<AgentSummary[]> {
    console.log(
      "🔍 [MongoDB Agent Repository] selectAgents called with currentUserId:",
      currentUserId,
      "filters:",
      filters,
      "limit:",
      limit,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.AGENTS);
    const userCollection = await getCollection(COLLECTIONS.USERS);

    // Build query based on filters
    const query: any = {};

    if (filters && filters.length > 0) {
      if (filters.includes("mine")) {
        query.created_by = userEmail; // Use current user email instead of passed userId
      } else if (filters.includes("shared")) {
        query.visibility = "public";
      } else if (filters.includes("all")) {
        // No additional filter - get all visible agents
        query.$or = [
          { created_by: userEmail }, // Use current user email instead of passed userId
          { visibility: "public" },
        ];
      }
    } else {
      // Default: get user's own agents and public agents
      query.$or = [
        { created_by: userEmail }, // Use current user email instead of passed userId
        { visibility: "public" },
      ];
    }

    const docs = await collection
      .find(query)
      .sort({ updated_at: -1 })
      .limit(limit || 50)
      .toArray();

    // Get user information for each agent
    const results = await Promise.all(
      docs.map(async (doc) => {
        // Since we're now using email as created_by, we need to find user by email
        const userDoc = await userCollection.findOne(
          { email: doc.created_by },
          { projection: { name: 1, image: 1 } },
        );

        return {
          id: doc._id.toString(),
          name: doc.name,
          description: doc.description,
          icon: doc.icon,
          userId: doc.created_by,
          visibility: doc.visibility,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
          userName: userDoc?.name,
          userAvatar: userDoc?.image,
          isBookmarked: false, // TODO: Implement bookmark functionality
        } as AgentSummary;
      }),
    );

    console.log(
      "✅ [MongoDB Agent Repository] selectAgents result:",
      results.length,
      "agents found",
    );
    return results;
  },

  async checkAccess(
    agentId: string,
    userId: string,
    destructive?: boolean,
  ): Promise<boolean> {
    console.log(
      "🔐 [MongoDB Agent Repository] checkAccess called with agentId:",
      agentId,
      "userId:",
      userId,
      "destructive:",
      destructive,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.AGENTS);

    const doc = await collection.findOne({ _id: new ObjectId(agentId) });

    if (!doc) {
      console.log(
        "✅ [MongoDB Agent Repository] checkAccess result: false (agent not found)",
      );
      return false;
    }

    // Check if user owns the agent
    if (doc.created_by === userEmail) {
      // Use current user email instead of passed userId
      console.log(
        "✅ [MongoDB Agent Repository] checkAccess result: true (owner)",
      );
      return true;
    }

    // For destructive operations, only owner can access
    if (destructive) {
      console.log(
        "✅ [MongoDB Agent Repository] checkAccess result: false (destructive operation, not owner)",
      );
      return false;
    }

    // For non-destructive operations, check if agent is public
    const hasAccess = doc.visibility === "public";
    console.log("✅ [MongoDB Agent Repository] checkAccess result:", hasAccess);
    return hasAccess;
  },
};
