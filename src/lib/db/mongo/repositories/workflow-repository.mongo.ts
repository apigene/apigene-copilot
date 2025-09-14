import { pgWorkflowRepository } from "../../pg/repositories/workflow-repository.pg";
import type {
  WorkflowRepository,
  DBWorkflow,
  WorkflowSummary,
} from "app-types/workflow";
import type { ObjectJsonSchema7 } from "app-types/util";

// MongoDB Workflow Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoWorkflowRepository: WorkflowRepository = {
  async delete(id: string): Promise<void> {
    console.log("🗑️ [MongoDB Workflow Repository] delete called with id:", id);
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgWorkflowRepository.delete(id);
    console.log("✅ [MongoDB Workflow Repository] delete completed");
  },

  async selectByUserId(userId: string): Promise<DBWorkflow[]> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectByUserId called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.selectByUserId(userId);
    console.log(
      "✅ [MongoDB Workflow Repository] selectByUserId result:",
      result.length,
      "workflows found",
    );
    return result;
  },

  async selectAll(userId: string): Promise<WorkflowSummary[]> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectAll called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.selectAll(userId);
    console.log(
      "✅ [MongoDB Workflow Repository] selectAll result:",
      result.length,
      "workflows found",
    );
    return result;
  },

  async selectExecuteAbility(userId: string): Promise<WorkflowSummary[]> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectExecuteAbility called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.selectExecuteAbility(userId);
    console.log(
      "✅ [MongoDB Workflow Repository] selectExecuteAbility result:",
      result.length,
      "workflows found",
    );
    return result;
  },

  async selectToolByIds(
    ids: string[],
  ): Promise<
    {
      id: string;
      name: string;
      description?: string;
      schema: ObjectJsonSchema7;
    }[]
  > {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectToolByIds called with ids:",
      ids,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.selectToolByIds(ids);
    console.log(
      "✅ [MongoDB Workflow Repository] selectToolByIds result:",
      result.length,
      "tools found",
    );
    return result;
  },

  async checkAccess(
    workflowId: string,
    userId: string,
    readOnly?: boolean,
  ): Promise<boolean> {
    console.log(
      "🔐 [MongoDB Workflow Repository] checkAccess called with workflowId:",
      workflowId,
      "userId:",
      userId,
      "readOnly:",
      readOnly,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.checkAccess(
      workflowId,
      userId,
      readOnly,
    );
    console.log("✅ [MongoDB Workflow Repository] checkAccess result:", result);
    return result;
  },

  async selectById(id: string): Promise<DBWorkflow | null> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectById called with id:",
      id,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.selectById(id);
    console.log(
      "✅ [MongoDB Workflow Repository] selectById result:",
      result ? "Workflow found" : "Workflow not found",
    );
    return result;
  },

  async save(workflow, noGenerateInputNode?: boolean): Promise<DBWorkflow> {
    console.log(
      "💾 [MongoDB Workflow Repository] save called with workflow:",
      workflow.name,
      "noGenerateInputNode:",
      noGenerateInputNode,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.save(
      workflow,
      noGenerateInputNode,
    );
    console.log("✅ [MongoDB Workflow Repository] save result:", result);
    return result;
  },

  async saveStructure(data) {
    console.log(
      "💾 [MongoDB Workflow Repository] saveStructure called with workflowId:",
      data.workflowId,
      "nodes:",
      data.nodes?.length,
      "edges:",
      data.edges?.length,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgWorkflowRepository.saveStructure(data);
    console.log("✅ [MongoDB Workflow Repository] saveStructure completed");
  },

  async selectStructureById(id: string, option?: { ignoreNote?: boolean }) {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectStructureById called with id:",
      id,
      "option:",
      option,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgWorkflowRepository.selectStructureById(id, option);
    console.log(
      "✅ [MongoDB Workflow Repository] selectStructureById result:",
      result ? "Structure found" : "Structure not found",
    );
    return result;
  },
};
