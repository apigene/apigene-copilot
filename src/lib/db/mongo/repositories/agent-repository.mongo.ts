import { pgAgentRepository } from "../../pg/repositories/agent-repository.pg";
import type { AgentRepository, Agent, AgentSummary } from "app-types/agent";

// MongoDB Agent Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    console.log(
      "➕ [MongoDB Agent Repository] insertAgent called with agent:",
      agent.name,
      "userId:",
      agent.userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgAgentRepository.insertAgent(agent);
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgAgentRepository.selectAgentById(id, userId);
    console.log(
      "✅ [MongoDB Agent Repository] selectAgentById result:",
      result ? "Agent found" : "Agent not found",
    );
    return result;
  },

  async selectAgentsByUserId(userId: string): Promise<Agent[]> {
    console.log(
      "🔍 [MongoDB Agent Repository] selectAgentsByUserId called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgAgentRepository.selectAgentsByUserId(userId);
    console.log(
      "✅ [MongoDB Agent Repository] selectAgentsByUserId result:",
      result.length,
      "agents found",
    );
    return result;
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgAgentRepository.updateAgent(id, userId, agent);
    console.log("✅ [MongoDB Agent Repository] updateAgent result:", result);
    return result;
  },

  async deleteAgent(id: string, userId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Agent Repository] deleteAgent called with id:",
      id,
      "userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgAgentRepository.deleteAgent(id, userId);
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgAgentRepository.selectAgents(
      currentUserId,
      filters,
      limit,
    );
    console.log(
      "✅ [MongoDB Agent Repository] selectAgents result:",
      result.length,
      "agents found",
    );
    return result;
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgAgentRepository.checkAccess(
      agentId,
      userId,
      destructive,
    );
    console.log("✅ [MongoDB Agent Repository] checkAccess result:", result);
    return result;
  },
};
