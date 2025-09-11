import { workflowBuilderTool } from "./workflow-builder";
import { Tool } from "ai";

export const WORKFLOW_MANAGEMENT_TOOLS: Record<string, Tool> = {
  workflowBuilder: workflowBuilderTool,
};

export const WORKFLOW_TOOL_NAMES = {
  WORKFLOW_BUILDER: "workflowBuilder",
} as const;
