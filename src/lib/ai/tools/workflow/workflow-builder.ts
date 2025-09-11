import { tool as createTool } from "ai";
import { z } from "zod";
import { safe } from "ts-safe";
import { workflowRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { WorkflowIcon } from "app-types/workflow";
import { isValidUUID } from "lib/utils/uuid-validation";

export const workflowBuilderTool = createTool({
  description:
    "Comprehensive workflow management tool. Create, read, update, delete, and list workflows. Also manage workflow structure (nodes and edges). IMPORTANT: Workflow IDs must be valid UUIDs. Use 'list' action to find workflows by name and get their IDs.",
  inputSchema: z.object({
    action: z
      .enum([
        "create",
        "read",
        "update",
        "delete",
        "list",
        "update_structure",
        "find_by_name",
      ])
      .describe("The action to perform on workflows"),

    // Common fields
    id: z
      .string()
      .optional()
      .describe(
        "Workflow ID (required for read, update, delete, update_structure). Must be a valid UUID format.",
      ),
    workflowName: z
      .string()
      .optional()
      .describe(
        "Workflow name (for find_by_name action or when you know the name but not the ID)",
      ),

    // Create/Update fields
    name: z.string().optional().describe("Workflow name (required for create)"),
    description: z.string().optional().describe("Workflow description"),
    icon: z
      .object({
        type: z.literal("emoji"),
        value: z.string().describe("Emoji value for the workflow icon"),
        style: z
          .record(z.string(), z.string())
          .optional()
          .describe("Optional styling for the icon"),
      })
      .optional()
      .describe("Workflow icon configuration"),
    visibility: z
      .enum(["private", "public", "readonly"])
      .optional()
      .describe("Workflow visibility"),
    isPublished: z
      .boolean()
      .optional()
      .describe("Whether the workflow is published"),
    noGenerateInputNode: z
      .boolean()
      .optional()
      .describe("Skip generating default input node (create only)"),

    // Read specific fields
    includeStructure: z
      .boolean()
      .optional()
      .describe("Include workflow structure with nodes and edges (read only)"),

    // List specific fields
    includeOwned: z
      .boolean()
      .optional()
      .describe("Include workflows owned by the user (list only)"),
    includePublic: z
      .boolean()
      .optional()
      .describe("Include public workflows (list only)"),
    includeReadonly: z
      .boolean()
      .optional()
      .describe("Include readonly workflows (list only)"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of workflows to return (list only)"),

    // Delete specific fields
    confirm: z
      .boolean()
      .optional()
      .describe("Confirmation for deletion (delete only)"),

    // Update structure specific fields
    nodes: z
      .array(
        z.object({
          id: z.string().describe("Node ID"),
          kind: z.string().describe("Node kind/type"),
          name: z.string().describe("Node name"),
          description: z.string().optional().describe("Node description"),
          nodeConfig: z
            .record(z.string(), z.any())
            .describe("Node configuration"),
          uiConfig: z
            .object({
              position: z
                .object({
                  x: z.number(),
                  y: z.number(),
                })
                .optional(),
              additionalProperties: z.any().optional(),
            })
            .describe("UI configuration for the node"),
        }),
      )
      .optional()
      .describe("Nodes to add or update (update_structure only)"),
    edges: z
      .array(
        z.object({
          id: z.string().describe("Edge ID"),
          source: z.string().describe("Source node ID"),
          target: z.string().describe("Target node ID"),
          uiConfig: z
            .object({
              sourceHandle: z.string().optional(),
              targetHandle: z.string().optional(),
              additionalProperties: z.any().optional(),
            })
            .describe("UI configuration for the edge"),
        }),
      )
      .optional()
      .describe("Edges to add (update_structure only)"),
    deleteNodes: z
      .array(z.string())
      .optional()
      .describe("Node IDs to delete (update_structure only)"),
    deleteEdges: z
      .array(z.string())
      .optional()
      .describe("Edge IDs to delete (update_structure only)"),
  }),

  execute: async (params) => {
    const {
      action,
      id,
      workflowName,
      name,
      description,
      icon,
      visibility,
      isPublished,
      noGenerateInputNode,
      includeStructure,
      includeOwned,
      includePublic,
      includeReadonly,
      limit,
      confirm,
      nodes,
      edges,
      deleteNodes,
      deleteEdges,
    } = params;

    return safe(async () => {
      const session = await getSession();
      if (!session?.user.id) {
        throw new Error("User not authenticated");
      }

      switch (action) {
        case "create": {
          if (!name) {
            throw new Error("Name is required for creating a workflow");
          }

          const workflow = await workflowRepository.save(
            {
              name,
              description,
              icon: icon as WorkflowIcon,
              visibility: visibility ?? "private",
              isPublished: isPublished ?? false,
              userId: session.user.id,
            },
            noGenerateInputNode ?? false,
          );

          return {
            success: true,
            action: "create",
            workflow: {
              id: workflow.id,
              name: workflow.name,
              description: workflow.description,
              icon: workflow.icon,
              visibility: workflow.visibility,
              isPublished: workflow.isPublished,
              createdAt: workflow.createdAt,
              updatedAt: workflow.updatedAt,
            },
            message: `Workflow "${name}" created successfully`,
          };
        }

        case "read": {
          if (!id) {
            throw new Error("ID is required for reading a workflow");
          }

          if (!isValidUUID(id)) {
            throw new Error(
              `Invalid workflow ID format: "${id}". Workflow IDs must be valid UUIDs (e.g., "123e4567-e89b-12d3-a456-426614174000"). If you're trying to find a workflow by name, use the "list" action first to find the correct ID.`,
            );
          }

          const hasAccess = await workflowRepository.checkAccess(
            id,
            session.user.id,
          );
          if (!hasAccess) {
            throw new Error("You don't have access to this workflow");
          }

          if (includeStructure) {
            const workflow = await workflowRepository.selectStructureById(id);
            if (!workflow) {
              throw new Error("Workflow not found");
            }

            return {
              success: true,
              action: "read",
              workflow: {
                id: workflow.id,
                name: workflow.name,
                description: workflow.description,
                icon: workflow.icon,
                visibility: workflow.visibility,
                isPublished: workflow.isPublished,
                version: workflow.version,
                userId: workflow.userId,
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt,
                nodes: workflow.nodes,
                edges: workflow.edges,
              },
              message: `Workflow "${workflow.name}" retrieved with structure`,
            };
          } else {
            const workflow = await workflowRepository.selectById(id);
            if (!workflow) {
              throw new Error("Workflow not found");
            }

            return {
              success: true,
              action: "read",
              workflow: {
                id: workflow.id,
                name: workflow.name,
                description: workflow.description,
                icon: workflow.icon,
                visibility: workflow.visibility,
                isPublished: workflow.isPublished,
                version: workflow.version,
                userId: workflow.userId,
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt,
              },
              message: `Workflow "${workflow.name}" retrieved`,
            };
          }
        }

        case "update": {
          if (!id) {
            throw new Error("ID is required for updating a workflow");
          }

          if (!isValidUUID(id)) {
            throw new Error(
              `Invalid workflow ID format: "${id}". Workflow IDs must be valid UUIDs (e.g., "123e4567-e89b-12d3-a456-426614174000"). If you're trying to find a workflow by name, use the "list" action first to find the correct ID.`,
            );
          }

          const hasAccess = await workflowRepository.checkAccess(
            id,
            session.user.id,
            false,
          );
          if (!hasAccess) {
            throw new Error("You don't have write access to this workflow");
          }

          const existingWorkflow = await workflowRepository.selectById(id);
          if (!existingWorkflow) {
            throw new Error("Workflow not found");
          }

          const updatedWorkflow = await workflowRepository.save({
            ...existingWorkflow,
            name: name ?? existingWorkflow.name,
            description: description ?? existingWorkflow.description,
            icon: (icon as WorkflowIcon) ?? existingWorkflow.icon,
            visibility: visibility ?? existingWorkflow.visibility,
            isPublished: isPublished ?? existingWorkflow.isPublished,
            updatedAt: new Date(),
          });

          return {
            success: true,
            action: "update",
            workflow: {
              id: updatedWorkflow.id,
              name: updatedWorkflow.name,
              description: updatedWorkflow.description,
              icon: updatedWorkflow.icon,
              visibility: updatedWorkflow.visibility,
              isPublished: updatedWorkflow.isPublished,
              version: updatedWorkflow.version,
              userId: updatedWorkflow.userId,
              createdAt: updatedWorkflow.createdAt,
              updatedAt: updatedWorkflow.updatedAt,
            },
            message: `Workflow "${updatedWorkflow.name}" updated successfully`,
          };
        }

        case "delete": {
          if (!id) {
            throw new Error("ID is required for deleting a workflow");
          }

          if (!isValidUUID(id)) {
            throw new Error(
              `Invalid workflow ID format: "${id}". Workflow IDs must be valid UUIDs (e.g., "123e4567-e89b-12d3-a456-426614174000"). If you're trying to find a workflow by name, use the "list" action first to find the correct ID.`,
            );
          }

          if (!confirm) {
            throw new Error(
              "Deletion not confirmed. Set confirm to true to proceed.",
            );
          }

          const hasAccess = await workflowRepository.checkAccess(
            id,
            session.user.id,
            false,
          );
          if (!hasAccess) {
            throw new Error("You don't have write access to this workflow");
          }

          const workflow = await workflowRepository.selectById(id);
          if (!workflow) {
            throw new Error("Workflow not found");
          }

          await workflowRepository.delete(id);

          return {
            success: true,
            action: "delete",
            message: `Workflow "${workflow.name}" deleted successfully`,
            deletedWorkflowId: id,
          };
        }

        case "list": {
          const workflows = await workflowRepository.selectAll(session.user.id);

          let filteredWorkflows = workflows;

          if (includeOwned === false) {
            filteredWorkflows = filteredWorkflows.filter(
              (w) => w.userId !== session.user.id,
            );
          }

          if (includePublic === false) {
            filteredWorkflows = filteredWorkflows.filter(
              (w) => w.visibility !== "public",
            );
          }

          if (includeReadonly === false) {
            filteredWorkflows = filteredWorkflows.filter(
              (w) => w.visibility !== "readonly",
            );
          }

          if (limit) {
            filteredWorkflows = filteredWorkflows.slice(0, limit);
          }

          return {
            success: true,
            action: "list",
            workflows: filteredWorkflows.map((w) => ({
              id: w.id,
              name: w.name,
              description: w.description,
              icon: w.icon,
              visibility: w.visibility,
              isPublished: w.isPublished,
              userId: w.userId,
              userName: w.userName,
              userAvatar: w.userAvatar,
              updatedAt: w.updatedAt,
            })),
            total: filteredWorkflows.length,
            message: `Found ${filteredWorkflows.length} workflows`,
          };
        }

        case "update_structure": {
          if (!id) {
            throw new Error("ID is required for updating workflow structure");
          }

          if (!isValidUUID(id)) {
            throw new Error(
              `Invalid workflow ID format: "${id}". Workflow IDs must be valid UUIDs (e.g., "123e4567-e89b-12d3-a456-426614174000"). If you're trying to find a workflow by name, use the "list" action first to find the correct ID.`,
            );
          }

          const hasAccess = await workflowRepository.checkAccess(
            id,
            session.user.id,
            false,
          );
          if (!hasAccess) {
            throw new Error("You don't have write access to this workflow");
          }

          const workflow = await workflowRepository.selectById(id);
          if (!workflow) {
            throw new Error("Workflow not found");
          }

          await workflowRepository.saveStructure({
            workflowId: id,
            nodes: nodes?.map((node) => ({
              ...node,
              workflowId: id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            edges: edges?.map((edge) => ({
              ...edge,
              workflowId: id,
              createdAt: new Date(),
            })),
            deleteNodes,
            deleteEdges,
          });

          return {
            success: true,
            action: "update_structure",
            message: `Workflow structure updated successfully`,
            workflowId: id,
            changes: {
              nodesAdded: nodes?.length || 0,
              edgesAdded: edges?.length || 0,
              nodesDeleted: deleteNodes?.length || 0,
              edgesDeleted: deleteEdges?.length || 0,
            },
          };
        }

        case "find_by_name": {
          if (!workflowName) {
            throw new Error(
              "Workflow name is required for finding workflows by name",
            );
          }

          const workflows = await workflowRepository.selectAll(session.user.id);
          const matchingWorkflows = workflows.filter((w) =>
            w.name.toLowerCase().includes(workflowName.toLowerCase()),
          );

          if (matchingWorkflows.length === 0) {
            return {
              success: true,
              action: "find_by_name",
              workflows: [],
              message: `No workflows found matching "${workflowName}"`,
            };
          }

          return {
            success: true,
            action: "find_by_name",
            workflows: matchingWorkflows.map((w) => ({
              id: w.id,
              name: w.name,
              description: w.description,
              icon: w.icon,
              visibility: w.visibility,
              isPublished: w.isPublished,
              userId: w.userId,
              userName: w.userName,
              userAvatar: w.userAvatar,
              updatedAt: w.updatedAt,
            })),
            total: matchingWorkflows.length,
            message: `Found ${matchingWorkflows.length} workflow(s) matching "${workflowName}"`,
          };
        }

        default: {
          throw new Error(`Unknown action: ${action}`);
        }
      }
    })
      .ifFail((error) => ({
        success: false,
        action: action,
        error: error.message,
        message: `Failed to ${action} workflow: ${error.message}`,
      }))
      .unwrap();
  },
});
