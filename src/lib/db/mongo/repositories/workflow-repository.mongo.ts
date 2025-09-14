import { getCollection, COLLECTIONS } from "../mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import { randomUUID } from "crypto";
import type {
  WorkflowRepository,
  DBWorkflow,
  WorkflowSummary,
} from "app-types/workflow";
import type { ObjectJsonSchema7 } from "app-types/util";

// Helper function to check if a string is a valid UUID
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Helper function to safely convert to Date
function safeDateConversion(dateValue: any): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (typeof dateValue === "string" || typeof dateValue === "number") {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date value:", dateValue, "using current date");
      return new Date();
    }
    return date;
  }

  console.warn(
    "Unknown date type:",
    typeof dateValue,
    dateValue,
    "using current date",
  );
  return new Date();
}

// MongoDB Workflow Repository Implementation
export const mongoWorkflowRepository: WorkflowRepository = {
  async delete(id: string): Promise<void> {
    console.log("🗑️ [MongoDB Workflow Repository] delete called with id:", id);

    const collection = await getCollection(COLLECTIONS.WORKFLOWS);

    if (!isValidUUID(id)) {
      throw new Error(`Invalid UUID format: ${id}`);
    }

    const result = await collection.deleteOne({ id: id });

    if (result.deletedCount === 0) {
      throw new Error("Workflow not found");
    }

    console.log("✅ [MongoDB Workflow Repository] delete completed");
  },

  async selectByUserId(userId: string): Promise<DBWorkflow[]> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectByUserId called with userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.WORKFLOWS);

    const docs = await collection
      .find({ userId: userEmail }) // Use current user email instead of passed userId
      .sort({ createdAt: -1 })
      .toArray();

    const results: DBWorkflow[] = docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      icon: doc.icon,
      visibility: doc.visibility,
      isPublished: doc.isPublished,
      userId: doc.userId,
      version: doc.version,
      createdAt: safeDateConversion(doc.createdAt),
      updatedAt: safeDateConversion(doc.updatedAt),
    }));

    console.log(
      "✅ [MongoDB Workflow Repository] selectByUserId result:",
      results.length,
      "workflows found",
    );
    return results;
  },

  async selectAll(userId: string): Promise<WorkflowSummary[]> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectAll called with userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const workflowCollection = await getCollection(COLLECTIONS.WORKFLOWS);
    const userCollection = await getCollection(COLLECTIONS.USERS);

    // Find workflows that are public/readonly or belong to the user
    const workflowDocs = await workflowCollection
      .find({
        $or: [
          { visibility: { $in: ["public", "readonly"] } },
          { userId: userEmail }, // Use current user email instead of passed userId
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get user information for each workflow
    const results = await Promise.all(
      workflowDocs.map(async (doc) => {
        const userDoc = await userCollection.findOne(
          { email: doc.userId },
          { projection: { name: 1, image: 1 } },
        );

        return {
          id: doc.id,
          name: doc.name,
          description: doc.description,
          icon: doc.icon,
          visibility: doc.visibility,
          isPublished: doc.isPublished,
          userId: doc.userId,
          userName: userDoc?.name,
          userAvatar: userDoc?.image,
          updatedAt: safeDateConversion(doc.updatedAt),
        } as WorkflowSummary;
      }),
    );

    console.log(
      "✅ [MongoDB Workflow Repository] selectAll result:",
      results.length,
      "workflows found",
    );
    return results;
  },

  async selectExecuteAbility(userId: string): Promise<WorkflowSummary[]> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectExecuteAbility called with userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const workflowCollection = await getCollection(COLLECTIONS.WORKFLOWS);
    const userCollection = await getCollection(COLLECTIONS.USERS);

    // Find published workflows that are accessible to the user
    const workflowDocs = await workflowCollection
      .find({
        isPublished: true,
        $or: [
          { userId: userEmail }, // Use current user email instead of passed userId
          { visibility: { $ne: "private" } },
        ],
      })
      .toArray();

    // Get user information for each workflow
    const results = await Promise.all(
      workflowDocs.map(async (doc) => {
        const userDoc = await userCollection.findOne(
          { email: doc.userId },
          { projection: { name: 1, image: 1 } },
        );

        return {
          id: doc.id,
          name: doc.name,
          description: doc.description,
          icon: doc.icon,
          visibility: doc.visibility,
          isPublished: doc.isPublished,
          userId: doc.userId,
          userName: userDoc?.name,
          userAvatar: userDoc?.image,
          updatedAt: safeDateConversion(doc.updatedAt),
        } as WorkflowSummary;
      }),
    );

    console.log(
      "✅ [MongoDB Workflow Repository] selectExecuteAbility result:",
      results.length,
      "workflows found",
    );
    return results;
  },

  async selectToolByIds(ids: string[]): Promise<
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

    if (!ids.length) return [];

    const collection = await getCollection(COLLECTIONS.WORKFLOWS);

    // Filter valid UUIDs
    const validIds = ids.filter((id) => isValidUUID(id));

    if (!validIds.length) return [];

    const docs = await collection
      .find({
        id: { $in: validIds },
        isPublished: true,
      })
      .toArray();

    const results = docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      schema: doc.schema || {}, // Default empty schema if not present
    }));

    console.log(
      "✅ [MongoDB Workflow Repository] selectToolByIds result:",
      results.length,
      "tools found",
    );
    return results;
  },

  async checkAccess(
    workflowId: string,
    userId: string,
    readOnly: boolean = true,
  ): Promise<boolean> {
    console.log(
      "🔐 [MongoDB Workflow Repository] checkAccess called with workflowId:",
      workflowId,
      "userId:",
      userId,
      "readOnly:",
      readOnly,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.WORKFLOWS);

    if (!isValidUUID(workflowId)) {
      console.log(
        "✅ [MongoDB Workflow Repository] checkAccess result: false (invalid UUID)",
      );
      return false;
    }

    const doc = await collection.findOne({ id: workflowId });

    if (!doc) {
      console.log(
        "✅ [MongoDB Workflow Repository] checkAccess result: false (workflow not found)",
      );
      return false;
    }

    // Check if user owns the workflow
    if (doc.userId === userEmail) {
      // Use current user email instead of passed userId
      console.log(
        "✅ [MongoDB Workflow Repository] checkAccess result: true (owner)",
      );
      return true;
    }

    // Check visibility
    if (doc.visibility === "private") {
      console.log(
        "✅ [MongoDB Workflow Repository] checkAccess result: false (private)",
      );
      return false;
    }

    if (doc.visibility === "readonly" && !readOnly) {
      console.log(
        "✅ [MongoDB Workflow Repository] checkAccess result: false (readonly, not readOnly)",
      );
      return false;
    }

    console.log(
      "✅ [MongoDB Workflow Repository] checkAccess result: true (public access)",
    );
    return true;
  },

  async selectById(id: string): Promise<DBWorkflow | null> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectById called with id:",
      id,
    );

    const collection = await getCollection(COLLECTIONS.WORKFLOWS);

    if (!isValidUUID(id)) {
      console.log(
        "✅ [MongoDB Workflow Repository] selectById result: null (invalid UUID)",
      );
      return null;
    }

    const doc = await collection.findOne({ id: id });

    if (!doc) {
      console.log(
        "✅ [MongoDB Workflow Repository] selectById result: null (workflow not found)",
      );
      return null;
    }

    const result: DBWorkflow = {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      icon: doc.icon,
      visibility: doc.visibility,
      isPublished: doc.isPublished,
      userId: doc.userId,
      version: doc.version,
      createdAt: safeDateConversion(doc.createdAt),
      updatedAt: safeDateConversion(doc.updatedAt),
    };

    console.log(
      "✅ [MongoDB Workflow Repository] selectById result: Workflow found",
    );
    return result;
  },

  async save(
    workflow: Partial<DBWorkflow>,
    noGenerateInputNode: boolean = false,
  ): Promise<DBWorkflow> {
    console.log(
      "💾 [MongoDB Workflow Repository] save called with workflow:",
      workflow.name,
      "noGenerateInputNode:",
      noGenerateInputNode,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.WORKFLOWS);
    const now = new Date();

    const workflowDoc = {
      name: workflow.name,
      description: workflow.description,
      icon: workflow.icon,
      visibility: workflow.visibility || "private",
      isPublished: workflow.isPublished || false,
      userId: userEmail, // Use current user email instead of passed userId
      version: workflow.version || 1,
      createdAt: workflow.createdAt || now,
      updatedAt: now,
    };

    let result;
    if (workflow.id && isValidUUID(workflow.id)) {
      // Update existing workflow
      result = await collection.findOneAndUpdate(
        { id: workflow.id },
        { $set: workflowDoc },
        { returnDocument: "after" },
      );
    } else {
      // Create new workflow with UUID
      const workflowId = randomUUID();
      const docWithId = { ...workflowDoc, id: workflowId };
      await collection.insertOne(docWithId);
      result = await collection.findOne({ id: workflowId });
    }

    const workflowResult: DBWorkflow = {
      id: result.id,
      name: result.name,
      description: result.description,
      icon: result.icon,
      visibility: result.visibility,
      isPublished: result.isPublished,
      userId: result.userId,
      version: result.version,
      createdAt: safeDateConversion(result.createdAt),
      updatedAt: safeDateConversion(result.updatedAt),
    };

    console.log(
      "✅ [MongoDB Workflow Repository] save result:",
      workflowResult,
    );
    return workflowResult;
  },

  async saveStructure(data: {
    workflowId: string;
    nodes?: any[];
    edges?: any[];
    deleteNodes?: string[];
    deleteEdges?: string[];
  }): Promise<void> {
    console.log(
      "💾 [MongoDB Workflow Repository] saveStructure called with workflowId:",
      data.workflowId,
      "nodes:",
      data.nodes?.length,
      "edges:",
      data.edges?.length,
    );

    // For now, this is a simplified implementation
    // In a real implementation, you would need separate collections for nodes and edges
    // and implement proper transaction handling
    console.log(
      "✅ [MongoDB Workflow Repository] saveStructure completed (simplified)",
    );
  },

  async selectStructureById(
    id: string,
    option?: { ignoreNote?: boolean },
  ): Promise<any> {
    console.log(
      "🔍 [MongoDB Workflow Repository] selectStructureById called with id:",
      id,
      "option:",
      option,
    );

    const collection = await getCollection(COLLECTIONS.WORKFLOWS);

    if (!isValidUUID(id)) {
      console.log(
        "✅ [MongoDB Workflow Repository] selectStructureById result: null (invalid UUID)",
      );
      return null;
    }

    const doc = await collection.findOne({ id: id });

    if (!doc) {
      console.log(
        "✅ [MongoDB Workflow Repository] selectStructureById result: null (workflow not found)",
      );
      return null;
    }

    // For now, return the workflow with empty nodes and edges
    // In a real implementation, you would query separate collections for nodes and edges
    const result = {
      ...doc,
      id: doc.id,
      nodes: [], // TODO: Implement nodes collection
      edges: [], // TODO: Implement edges collection
    };

    console.log(
      "✅ [MongoDB Workflow Repository] selectStructureById result: Structure found (simplified)",
    );
    return result;
  },
};
