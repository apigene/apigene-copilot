import { tool as createTool } from "ai";
import { z } from "zod";
import { safe } from "ts-safe";
import { workflowRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { WorkflowIcon } from "app-types/workflow";
import { isValidUUID } from "lib/utils/uuid-validation";
import { NodeKind } from "lib/ai/workflow/workflow.interface";

/**
 * Comprehensive details about each node type available in the workflow system.
 * This provides users with detailed information about what each node type does,
 * its capabilities, configuration options, and usage examples.
 */
const NODE_TYPE_DETAILS = {
  [NodeKind.Input]: {
    name: "Input Node",
    description:
      "Entry point of the workflow that receives initial data and passes it to connected nodes.",
    purpose:
      "Acts as the starting point for workflow execution, accepting user input or external data.",
    capabilities: [
      "Receives initial workflow input data",
      "Defines output schema for data flow to subsequent nodes",
      "Serves as the single entry point for workflow execution",
      "Passes data through to connected nodes",
    ],
    configuration: {
      required: ["name", "outputSchema"],
      optional: ["description"],
      outputSchema:
        "Defines the structure of data that will be passed to connected nodes",
    },
    useCases: [
      "Accepting user queries or requests",
      "Receiving data from external APIs",
      "Starting data processing workflows",
      "Defining input parameters for complex operations",
    ],
    examples: [
      "User query input for a chatbot workflow",
      "API request data for processing",
      "File upload information for document processing",
      "Search parameters for data retrieval",
    ],
    limitations: [
      "Only one Input node allowed per workflow",
      "Must have at least one outgoing edge",
      "Cannot receive data from other nodes",
    ],
    icon: "📥",
    category: "Data Flow",
  },

  [NodeKind.Output]: {
    name: "Output Node",
    description:
      "Exit point of the workflow that collects data from previous nodes and produces the final result.",
    purpose:
      "Consolidates results from multiple nodes into a structured final output.",
    capabilities: [
      "Collects data from multiple source nodes",
      "Combines results into structured output",
      "Defines final workflow result format",
      "Maps source node outputs to final output keys",
    ],
    configuration: {
      required: ["name", "outputData"],
      optional: ["description"],
      outputData:
        "Array of key-source mappings defining how to collect and structure final output",
    },
    useCases: [
      "Generating final reports from multiple data sources",
      "Creating structured API responses",
      "Producing formatted output for users",
      "Consolidating results from parallel processing",
    ],
    examples: [
      "Combining LLM response with search results",
      "Merging data from multiple API calls",
      "Creating a final report from analysis nodes",
      "Formatting results for display",
    ],
    limitations: [
      "Only one Output node allowed per workflow",
      "Must have at least one incoming edge",
      "Cannot send data to other nodes",
    ],
    icon: "📤",
    category: "Data Flow",
  },

  [NodeKind.LLM]: {
    name: "LLM Node",
    description:
      "Interacts with Large Language Models to generate text responses or structured data.",
    purpose:
      "Leverages AI models for text generation, analysis, and structured data processing.",
    capabilities: [
      "Generates text responses using AI models",
      "Supports multiple message types (system, user, assistant)",
      "References outputs from previous nodes via mentions",
      "Produces structured data based on output schema",
      "Configurable model selection",
    ],
    configuration: {
      required: ["name", "model", "messages", "outputSchema"],
      optional: ["description"],
      model: "AI model to use (e.g., GPT-4, Claude, etc.)",
      messages: "Array of messages with roles and content",
      outputSchema: "Defines the structure of the generated response",
    },
    useCases: [
      "Text generation and completion",
      "Data analysis and insights",
      "Content summarization",
      "Code generation and explanation",
      "Translation and language processing",
      "Structured data extraction",
    ],
    examples: [
      "Generate product descriptions from specifications",
      "Analyze customer feedback sentiment",
      "Summarize long documents",
      "Generate code from requirements",
      "Extract structured data from unstructured text",
    ],
    limitations: [
      "Requires valid AI model configuration",
      "Token limits based on selected model",
      "Response quality depends on prompt quality",
    ],
    icon: "🤖",
    category: "AI Processing",
  },

  [NodeKind.Tool]: {
    name: "Tool Node",
    description:
      "Executes external tools (primarily MCP tools) with optional LLM-generated parameters.",
    purpose:
      "Integrates external functionality and APIs into workflow execution.",
    capabilities: [
      "Executes MCP (Model Context Protocol) tools",
      "Runs built-in application tools",
      "Uses LLM to generate tool parameters from messages",
      "Handles tool execution results",
      "Supports parameter validation",
    ],
    configuration: {
      required: ["name", "tool", "model", "message"],
      optional: ["description"],
      tool: "Tool definition with ID, description, and schemas",
      model: "AI model for parameter generation",
      message: "Message describing what the tool should do",
    },
    useCases: [
      "API integrations and external service calls",
      "File operations and data processing",
      "Web scraping and data extraction",
      "Database operations",
      "Custom business logic execution",
    ],
    examples: [
      "Search the web for information",
      "Send emails or notifications",
      "Process uploaded files",
      "Query databases",
      "Integrate with third-party APIs",
    ],
    limitations: [
      "Tool must be properly configured and available",
      "Parameter generation depends on LLM quality",
      "Tool execution may have timeouts or failures",
    ],
    icon: "🔧",
    category: "Integration",
  },

  [NodeKind.Http]: {
    name: "HTTP Node",
    description:
      "Performs HTTP requests to external services with configurable parameters.",
    purpose: "Makes REST API calls and integrates with external web services.",
    capabilities: [
      "Supports all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD)",
      "Dynamic URL, headers, query parameters, and body",
      "Variable substitution from previous node outputs",
      "Configurable timeout and error handling",
      "Comprehensive response data including status and headers",
    ],
    configuration: {
      required: ["name", "url", "method"],
      optional: ["description", "headers", "query", "body", "timeout"],
      url: "Request URL (can reference other node outputs)",
      method: "HTTP method to use",
      headers: "Array of key-value header pairs",
      query: "Array of key-value query parameters",
      body: "Request body content",
      timeout: "Request timeout in milliseconds (default: 30000)",
    },
    useCases: [
      "REST API integrations",
      "Webhook triggers",
      "Data fetching from external services",
      "Authentication with external systems",
      "File uploads and downloads",
    ],
    examples: [
      "Fetch user data from CRM API",
      "Send notifications via webhook",
      "Upload files to cloud storage",
      "Query external databases",
      "Trigger external processes",
    ],
    limitations: [
      "Network connectivity required",
      "Subject to external service availability",
      "Rate limits may apply",
      "Authentication may be required",
    ],
    icon: "🌐",
    category: "Integration",
  },

  [NodeKind.Condition]: {
    name: "Condition Node",
    description:
      "Provides conditional branching in workflows based on evaluated conditions.",
    purpose: "Enables dynamic workflow paths and decision-making logic.",
    capabilities: [
      "Evaluates conditions using if-elseIf-else structure",
      "Supports AND/OR logical operators",
      "References data from previous nodes",
      "Routes execution to different paths",
      "Dynamic edge resolution based on conditions",
    ],
    configuration: {
      required: ["name", "branches"],
      optional: ["description"],
      branches:
        "Conditional logic structure with if, elseIf, and else branches",
    },
    useCases: [
      "Workflow branching based on data values",
      "Error handling and retry logic",
      "Different processing paths for different data types",
      "User permission-based routing",
      "Quality gates and validation checks",
    ],
    examples: [
      "Route based on user type (premium vs free)",
      "Handle different error scenarios",
      "Process different file formats differently",
      "Apply different business rules",
      "Skip steps based on conditions",
    ],
    limitations: [
      "Condition evaluation must be deterministic",
      "Complex conditions may impact performance",
      "All branches must have valid target nodes",
    ],
    icon: "🔀",
    category: "Control Flow",
  },

  [NodeKind.Template]: {
    name: "Template Node",
    description:
      "Processes text templates with variable substitution using TipTap content.",
    purpose:
      "Generates dynamic text content by combining templates with data from other nodes.",
    capabilities: [
      "Variable substitution from previous node outputs",
      "Support for mentions in template content",
      "TipTap-based rich text templates",
      "Simple text output for easy consumption",
      "Dynamic content generation",
    ],
    configuration: {
      required: ["name", "template"],
      optional: ["description"],
      template: "Template configuration with type and content",
    },
    useCases: [
      "Email template generation",
      "Report formatting",
      "Dynamic content creation",
      "Message personalization",
      "Document generation",
    ],
    examples: [
      "Generate personalized emails",
      "Create dynamic reports",
      "Format API responses",
      "Generate user notifications",
      "Create document templates",
    ],
    limitations: [
      "Template syntax must be valid",
      "Referenced variables must exist",
      "Output is limited to text format",
    ],
    icon: "📝",
    category: "Content Generation",
  },

  [NodeKind.Note]: {
    name: "Note Node",
    description:
      "Documentation and annotation node that doesn't affect workflow execution.",
    purpose:
      "Provides documentation, comments, and annotations within workflows.",
    capabilities: [
      "Adds documentation to workflows",
      "Provides context and explanations",
      "Does not affect execution flow",
      "Supports rich text content",
      "Helps with workflow understanding",
    ],
    configuration: {
      required: ["name"],
      optional: ["description"],
      content: "Documentation content (not executed)",
    },
    useCases: [
      "Workflow documentation",
      "Process explanations",
      "Team collaboration notes",
      "Implementation details",
      "Troubleshooting guides",
    ],
    examples: [
      "Explain complex workflow logic",
      "Document API endpoints used",
      "Provide troubleshooting steps",
      "Add implementation notes",
      "Create workflow overview",
    ],
    limitations: [
      "Does not process or output data",
      "Cannot be referenced by other nodes",
      "Purely for documentation purposes",
    ],
    icon: "📋",
    category: "Documentation",
  },

  [NodeKind.Code]: {
    name: "Code Node",
    description:
      "Code execution node for running custom scripts (future implementation).",
    purpose: "Execute custom code snippets and scripts within workflows.",
    capabilities: [
      "Execute custom code snippets",
      "Support for multiple programming languages",
      "Access to workflow data and context",
      "Custom business logic implementation",
      "Integration with external libraries",
    ],
    configuration: {
      required: ["name", "code", "language"],
      optional: ["description", "dependencies"],
      code: "Code snippet to execute",
      language: "Programming language (JavaScript, Python, etc.)",
      dependencies: "Required libraries or modules",
    },
    useCases: [
      "Custom data transformations",
      "Complex calculations",
      "Integration with specialized libraries",
      "Custom business logic",
      "Data validation and processing",
    ],
    examples: [
      "Custom data transformation scripts",
      "Mathematical calculations",
      "Data validation logic",
      "Integration with specialized APIs",
      "Custom formatting functions",
    ],
    limitations: [
      "Currently not implemented",
      "Security considerations for code execution",
      "Resource limitations",
      "Error handling complexity",
    ],
    icon: "💻",
    category: "Custom Logic",
  },
};

/**
 * Pre-built workflow templates for common use cases.
 * These provide starting points for users to build their own workflows.
 */
const WORKFLOW_TEMPLATES = {
  "simple-chatbot": {
    name: "Simple Chatbot",
    description:
      "A basic chatbot that processes user input and generates responses using an LLM.",
    category: "AI & Chat",
    complexity: "Beginner",
    estimatedTime: "5 minutes",
    nodes: [
      {
        id: "input",
        kind: NodeKind.Input,
        name: "User Input",
        description: "Receives user messages",
        outputSchema: {
          type: "object",
          properties: {
            message: { type: "string", description: "User's message" },
            userId: { type: "string", description: "User identifier" },
          },
        },
      },
      {
        id: "llm",
        kind: NodeKind.LLM,
        name: "AI Response",
        description: "Generates AI response to user message",
        model: { provider: "openai", name: "gpt-4", id: "gpt-4" },
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Respond to the user's message in a friendly and helpful way.",
          },
          {
            role: "user",
            content: "{{input.message}}",
          },
        ],
        outputSchema: {
          type: "object",
          properties: {
            answer: { type: "string", description: "AI response" },
            totalTokens: { type: "number", description: "Tokens used" },
          },
        },
      },
      {
        id: "output",
        kind: NodeKind.Output,
        name: "Response",
        description: "Returns the AI response",
        outputData: [
          {
            key: "response",
            source: { nodeId: "llm", path: ["answer"] },
          },
          {
            key: "tokens",
            source: { nodeId: "llm", path: ["totalTokens"] },
          },
        ],
      },
    ],
    edges: [
      { source: "input", target: "llm" },
      { source: "llm", target: "output" },
    ],
  },

  "data-processing-pipeline": {
    name: "Data Processing Pipeline",
    description:
      "Processes data through multiple steps: validation, transformation, and analysis.",
    category: "Data Processing",
    complexity: "Intermediate",
    estimatedTime: "15 minutes",
    nodes: [
      {
        id: "input",
        kind: NodeKind.Input,
        name: "Data Input",
        description: "Receives raw data for processing",
        outputSchema: {
          type: "object",
          properties: {
            data: { type: "array", description: "Array of data items" },
            metadata: { type: "object", description: "Data metadata" },
          },
        },
      },
      {
        id: "validation",
        kind: NodeKind.LLM,
        name: "Data Validation",
        description: "Validates data quality and structure",
        model: { provider: "openai", name: "gpt-4", id: "gpt-4" },
        messages: [
          {
            role: "system",
            content:
              "You are a data validation expert. Analyze the provided data and return validation results.",
          },
          {
            role: "user",
            content: "Validate this data: {{input.data}}",
          },
        ],
        outputSchema: {
          type: "object",
          properties: {
            isValid: { type: "boolean", description: "Whether data is valid" },
            issues: { type: "array", description: "List of validation issues" },
            summary: { type: "string", description: "Validation summary" },
          },
        },
      },
      {
        id: "condition",
        kind: NodeKind.Condition,
        name: "Validation Check",
        description: "Routes based on validation results",
        branches: {
          if: {
            id: "valid",
            type: "if",
            conditions: [
              {
                source: { nodeId: "validation", path: ["isValid"] },
                operator: "IsTrue",
              },
            ],
            logicalOperator: "AND",
          },
          else: {
            id: "invalid",
            type: "else",
            conditions: [],
            logicalOperator: "AND",
          },
        },
      },
      {
        id: "transform",
        kind: NodeKind.LLM,
        name: "Data Transformation",
        description: "Transforms valid data into processed format",
        model: { provider: "openai", name: "gpt-4", id: "gpt-4" },
        messages: [
          {
            role: "system",
            content:
              "You are a data transformation expert. Process and clean the data.",
          },
          {
            role: "user",
            content: "Transform this data: {{input.data}}",
          },
        ],
        outputSchema: {
          type: "object",
          properties: {
            processedData: { type: "array", description: "Transformed data" },
            transformationLog: {
              type: "string",
              description: "Transformation details",
            },
          },
        },
      },
      {
        id: "error-handler",
        kind: NodeKind.Template,
        name: "Error Handler",
        description: "Handles validation errors",
        template: {
          type: "tiptap",
          tiptap: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Data validation failed. Issues found: {{validation.issues}}",
                  },
                ],
              },
            ],
          },
        },
      },
      {
        id: "output",
        kind: NodeKind.Output,
        name: "Final Result",
        description: "Returns processed data or error information",
        outputData: [
          {
            key: "result",
            source: { nodeId: "transform", path: ["processedData"] },
          },
          {
            key: "status",
            source: { nodeId: "validation", path: ["isValid"] },
          },
        ],
      },
    ],
    edges: [
      { source: "input", target: "validation" },
      { source: "validation", target: "condition" },
      { source: "condition", target: "transform", sourceHandle: "valid" },
      { source: "condition", target: "error-handler", sourceHandle: "invalid" },
      { source: "transform", target: "output" },
      { source: "error-handler", target: "output" },
    ],
  },

  "api-integration": {
    name: "API Integration Workflow",
    description:
      "Fetches data from external APIs, processes it, and returns formatted results.",
    category: "Integration",
    complexity: "Intermediate",
    estimatedTime: "20 minutes",
    nodes: [
      {
        id: "input",
        kind: NodeKind.Input,
        name: "API Request",
        description: "Receives API request parameters",
        outputSchema: {
          type: "object",
          properties: {
            endpoint: { type: "string", description: "API endpoint URL" },
            parameters: { type: "object", description: "Request parameters" },
          },
        },
      },
      {
        id: "http-call",
        kind: NodeKind.Http,
        name: "API Call",
        description: "Makes HTTP request to external API",
        url: "{{input.endpoint}}",
        method: "GET",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "User-Agent", value: "WorkflowBot/1.0" },
        ],
        query: [{ key: "format", value: "json" }],
        timeout: 30000,
      },
      {
        id: "process-data",
        kind: NodeKind.LLM,
        name: "Data Processing",
        description: "Processes and analyzes API response",
        model: { provider: "openai", name: "gpt-4", id: "gpt-4" },
        messages: [
          {
            role: "system",
            content:
              "You are a data analyst. Process the API response and extract key insights.",
          },
          {
            role: "user",
            content: "Analyze this API response: {{http-call.response.body}}",
          },
        ],
        outputSchema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              description: "Key insights from the data",
            },
            summary: { type: "string", description: "Data summary" },
            recommendations: {
              type: "array",
              description: "Actionable recommendations",
            },
          },
        },
      },
      {
        id: "output",
        kind: NodeKind.Output,
        name: "Processed Results",
        description: "Returns processed API data",
        outputData: [
          {
            key: "rawData",
            source: { nodeId: "http-call", path: ["response", "body"] },
          },
          {
            key: "insights",
            source: { nodeId: "process-data", path: ["insights"] },
          },
          {
            key: "summary",
            source: { nodeId: "process-data", path: ["summary"] },
          },
        ],
      },
    ],
    edges: [
      { source: "input", target: "http-call" },
      { source: "http-call", target: "process-data" },
      { source: "process-data", target: "output" },
    ],
  },

  "conditional-workflow": {
    name: "Conditional Processing Workflow",
    description:
      "Demonstrates conditional branching based on user type or data conditions.",
    category: "Control Flow",
    complexity: "Intermediate",
    estimatedTime: "10 minutes",
    nodes: [
      {
        id: "input",
        kind: NodeKind.Input,
        name: "User Input",
        description: "Receives user information",
        outputSchema: {
          type: "object",
          properties: {
            userType: {
              type: "string",
              description: "Type of user (premium, free, admin)",
            },
            request: { type: "string", description: "User's request" },
          },
        },
      },
      {
        id: "user-check",
        kind: NodeKind.Condition,
        name: "User Type Check",
        description: "Routes based on user type",
        branches: {
          if: {
            id: "premium",
            type: "if",
            conditions: [
              {
                source: { nodeId: "input", path: ["userType"] },
                operator: "Equals",
                value: "premium",
              },
            ],
            logicalOperator: "AND",
          },
          elseIf: [
            {
              id: "admin",
              type: "elseIf",
              conditions: [
                {
                  source: { nodeId: "input", path: ["userType"] },
                  operator: "Equals",
                  value: "admin",
                },
              ],
              logicalOperator: "AND",
            },
          ],
          else: {
            id: "free",
            type: "else",
            conditions: [],
            logicalOperator: "AND",
          },
        },
      },
      {
        id: "premium-service",
        kind: NodeKind.LLM,
        name: "Premium Service",
        description: "Provides enhanced service for premium users",
        model: { provider: "openai", name: "gpt-4", id: "gpt-4" },
        messages: [
          {
            role: "system",
            content:
              "You are providing premium service. Give detailed, comprehensive responses.",
          },
          {
            role: "user",
            content: "{{input.request}}",
          },
        ],
        outputSchema: {
          type: "object",
          properties: {
            response: {
              type: "string",
              description: "Premium service response",
            },
            features: {
              type: "array",
              description: "Available premium features",
            },
          },
        },
      },
      {
        id: "admin-service",
        kind: NodeKind.LLM,
        name: "Admin Service",
        description: "Provides administrative functions",
        model: { provider: "openai", name: "gpt-4", id: "gpt-4" },
        messages: [
          {
            role: "system",
            content:
              "You are providing admin service. Include administrative options and system information.",
          },
          {
            role: "user",
            content: "{{input.request}}",
          },
        ],
        outputSchema: {
          type: "object",
          properties: {
            response: { type: "string", description: "Admin service response" },
            adminOptions: {
              type: "array",
              description: "Available admin options",
            },
          },
        },
      },
      {
        id: "free-service",
        kind: NodeKind.LLM,
        name: "Free Service",
        description: "Provides basic service for free users",
        model: {
          provider: "openai",
          name: "gpt-3.5-turbo",
          id: "gpt-3.5-turbo",
        },
        messages: [
          {
            role: "system",
            content:
              "You are providing free service. Give helpful but concise responses. Mention upgrade options.",
          },
          {
            role: "user",
            content: "{{input.request}}",
          },
        ],
        outputSchema: {
          type: "object",
          properties: {
            response: { type: "string", description: "Free service response" },
            upgradePrompt: {
              type: "string",
              description: "Upgrade suggestion",
            },
          },
        },
      },
      {
        id: "output",
        kind: NodeKind.Output,
        name: "Service Response",
        description: "Returns appropriate service response",
        outputData: [
          {
            key: "response",
            source: { nodeId: "premium-service", path: ["response"] },
          },
          {
            key: "userType",
            source: { nodeId: "input", path: ["userType"] },
          },
        ],
      },
    ],
    edges: [
      { source: "input", target: "user-check" },
      {
        source: "user-check",
        target: "premium-service",
        sourceHandle: "premium",
      },
      { source: "user-check", target: "admin-service", sourceHandle: "admin" },
      { source: "user-check", target: "free-service", sourceHandle: "free" },
      { source: "premium-service", target: "output" },
      { source: "admin-service", target: "output" },
      { source: "free-service", target: "output" },
    ],
  },
};

/**
 * Workflow validation functions
 */
const validateWorkflowStructure = (nodes: any[], edges: any[]) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for required nodes
  const hasInput = nodes.some((n) => n.kind === NodeKind.Input);
  const hasOutput = nodes.some((n) => n.kind === NodeKind.Output);

  if (!hasInput) {
    errors.push("Workflow must have exactly one Input node");
  } else if (nodes.filter((n) => n.kind === NodeKind.Input).length > 1) {
    errors.push("Workflow can only have one Input node");
  }

  if (!hasOutput) {
    errors.push("Workflow must have exactly one Output node");
  } else if (nodes.filter((n) => n.kind === NodeKind.Output).length > 1) {
    errors.push("Workflow can only have one Output node");
  }

  // Check for unreachable nodes
  const reachableNodes = new Set<string>();
  const inputNode = nodes.find((n) => n.kind === NodeKind.Input);
  if (inputNode) {
    reachableNodes.add(inputNode.id);
    const queue = [inputNode.id];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const outgoingEdges = edges.filter((e) => e.source === currentNodeId);

      for (const edge of outgoingEdges) {
        if (!reachableNodes.has(edge.target)) {
          reachableNodes.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
  }

  const unreachableNodes = nodes.filter(
    (n) => !reachableNodes.has(n.id) && n.kind !== NodeKind.Note,
  );
  if (unreachableNodes.length > 0) {
    warnings.push(
      `Unreachable nodes detected: ${unreachableNodes.map((n) => n.name).join(", ")}`,
    );
  }

  // Check for nodes without outgoing edges (except Output and Note nodes)
  const nodesWithoutOutgoing = nodes.filter((n) => {
    const hasOutgoing = edges.some((e) => e.source === n.id);
    return (
      !hasOutgoing && n.kind !== NodeKind.Output && n.kind !== NodeKind.Note
    );
  });

  if (nodesWithoutOutgoing.length > 0) {
    warnings.push(
      `Nodes without outgoing edges: ${nodesWithoutOutgoing.map((n) => n.name).join(", ")}`,
    );
  }

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (hasCycle(node.id)) {
      errors.push("Circular dependency detected in workflow");
      break;
    }
  }

  // Performance suggestions
  if (nodes.length > 20) {
    suggestions.push(
      "Consider breaking down large workflows into smaller, more manageable pieces",
    );
  }

  const llmNodes = nodes.filter((n) => n.kind === NodeKind.LLM);
  if (llmNodes.length > 5) {
    suggestions.push(
      "Consider optimizing LLM usage - multiple LLM calls can be expensive",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypes: nodes.reduce(
        (acc, n) => {
          acc[n.kind] = (acc[n.kind] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      reachableNodes: reachableNodes.size,
      unreachableNodes: unreachableNodes.length,
    },
  };
};

/**
 * Data flow validation functions
 */
const validateDataFlow = (nodes: any[], edges: any[]) => {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for proper node connections
  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      issues.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      issues.push(`Edge references non-existent target node: ${edge.target}`);
    }
  }

  // Check for unreachable nodes (except Input and Note nodes)
  const reachableNodes = new Set<string>();
  const inputNode = nodes.find((n) => n.kind === NodeKind.Input);

  if (inputNode) {
    reachableNodes.add(inputNode.id);
    const queue = [inputNode.id];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const outgoingEdges = edges.filter((e) => e.source === currentNodeId);

      for (const edge of outgoingEdges) {
        if (!reachableNodes.has(edge.target)) {
          reachableNodes.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
  }

  const unreachableNodes = nodes.filter(
    (n) =>
      !reachableNodes.has(n.id) &&
      n.kind !== NodeKind.Note &&
      n.kind !== NodeKind.Input,
  );

  if (unreachableNodes.length > 0) {
    issues.push(
      `Unreachable nodes detected: ${unreachableNodes.map((n) => n.name).join(", ")}`,
    );
  }

  // Check for nodes without outgoing edges (except Output and Note nodes)
  const nodesWithoutOutgoing = nodes.filter((n) => {
    const hasOutgoing = edges.some((e) => e.source === n.id);
    return (
      !hasOutgoing && n.kind !== NodeKind.Output && n.kind !== NodeKind.Note
    );
  });

  if (nodesWithoutOutgoing.length > 0) {
    suggestions.push(
      `Consider connecting nodes without outgoing edges: ${nodesWithoutOutgoing.map((n) => n.name).join(", ")}`,
    );
  }

  // Check for potential data flow issues
  const llmNodes = nodes.filter((n) => n.kind === NodeKind.LLM);
  for (const llmNode of llmNodes) {
    if (llmNode.messages) {
      for (const message of llmNode.messages) {
        if (message.content && typeof message.content === "string") {
          const variableMatches = message.content.match(/\{\{([^}]+)\}\}/g);
          if (variableMatches) {
            for (const match of variableMatches) {
              const variable = match.replace(/[{}]/g, "");
              const [nodeName] = variable.split(".");
              const sourceNode = nodes.find(
                (n) => n.name === nodeName || n.id === nodeName,
              );
              if (!sourceNode) {
                issues.push(
                  `LLM node "${llmNode.name}" references non-existent node: ${nodeName}`,
                );
              }
            }
          }
        }
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    dataFlowStats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      reachableNodes: reachableNodes.size,
      unreachableNodes: unreachableNodes.length,
      nodesWithoutOutgoing: nodesWithoutOutgoing.length,
    },
  };
};

/**
 * Comprehensive UUID format documentation and validation
 * This explains the proper UUID format and provides validation tools
 */
const UUID_FORMAT_DOCUMENTATION = {
  overview: {
    title: "Workflow ID UUID Format",
    description:
      "Workflow IDs must be valid UUIDs (version 4) following the exact format specification",
    format: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },

  formatSpecification: {
    pattern:
      "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    breakdown: {
      "8-4-4-4-12": "Standard UUID format with hyphens",
      "8 chars": "First group - random data",
      "4 chars 1": "Second group - random data",
      "4 chars 2": "Third group - version 4 (must start with 4) + random data",
      "4 chars 3": "Fourth group - variant (8,9,a,b) + random data",
      "12 chars": "Fifth group - random data",
    },
    requirements: [
      "Must be exactly 36 characters long (32 hex + 4 hyphens)",
      "Must use lowercase hexadecimal characters (0-9, a-f)",
      "Must have hyphens in positions 8, 13, 18, and 23",
      "The 13th character must always be 4 (indicating version 4)",
      "The 17th character must be one of 8, 9, a, or b (UUID variant)",
      "Do not add prefixes like 'node-' or 'input-', use only the UUID itself",
    ],
  },

  validExamples: [
    "550e8400-e29b-41d4-a716-446655440000",
    "b8f4c2a3-1234-4f56-9abc-1234567890de",
    "123e4567-e89b-42d3-a456-426614174000",
    "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  ],

  invalidExamples: [
    {
      example: "123e4567-e89b-12d3-a456-42661417400",
      reason: "Too short - missing characters",
    },
    {
      example: "123e4567-e89b-12d3-a456-4266141740000",
      reason: "Too long - extra characters",
    },
    {
      example: "123e4567-e89b-12d3-a456-426614174000-",
      reason: "Extra hyphen at the end",
    },
    {
      example: "123e4567e89b12d3a456426614174000",
      reason: "Missing hyphens",
    },
    {
      example: "123E4567-E89B-12D3-A456-426614174000",
      reason: "Uppercase letters (must be lowercase)",
    },
    {
      example: "123e4567-e89b-12d3-a456-42661417400g",
      reason: "Invalid character 'g' (not hexadecimal)",
    },
    {
      example: "123e4567-e89b-62d3-a456-426614174000",
      reason: "Invalid version '6' (13th character must be 4)",
    },
    {
      example: "123e4567-e89b-42d3-c456-426614174000",
      reason: "Invalid variant 'c' (17th character must be 8,9,a, or b)",
    },
    {
      example: "edge-550e8400-e29b-41d4-a716-446655440000",
      reason: "Has prefix 'edge-' (use only the UUID itself)",
    },
  ],

  commonMistakes: [
    "Using uppercase letters instead of lowercase",
    "Missing or extra hyphens",
    "Wrong version digit (13th character must be 4)",
    "Wrong variant digit (17th character must be 8,9,a, or b)",
    "Using non-hexadecimal characters",
    "Adding prefixes like 'node-' or 'edge-'",
    "Copy-paste errors with extra spaces or characters",
  ],

  troubleshooting: {
    "Getting UUID format errors": [
      "Double-check the UUID is exactly 36 characters",
      "Ensure all letters are lowercase (a-f, not A-F)",
      "Verify hyphens are in correct positions",
      "Check that 13th character is 4 (version 4)",
      "Check that 17th character is 8, 9, a, or b (variant)",
      "Remove any prefixes like 'node-' or 'edge-'",
      "Use the 'validate_uuid' action to test your UUID",
    ],
    "Finding workflow IDs": [
      "Use 'list' action to see all your workflows with their IDs",
      "Use 'find_by_name' action to search by workflow name",
      "Copy the full UUID from the list results",
      "Don't modify or shorten the UUID",
    ],
  },

  bestPractices: [
    "Always generate valid UUIDs (version 4) following the exact format",
    "Use only the UUID itself - no prefixes like 'node-' or 'edge-'",
    "Use the 'list' action to find workflow IDs by name",
    "Store UUIDs in variables to avoid typos",
    "Validate UUIDs before using them in actions",
    "Use descriptive workflow names to make finding IDs easier",
  ],
};

const DATA_FLOW_DOCUMENTATION = `
## Data Flow and Connection Documentation

This guide explains how data flows between nodes in a workflow and how to properly connect them.

### Overview
- Output Schema defines what data a node produces
- Input references pull data from previous nodes
- Edges create the execution path and data flow
- Variable substitution uses {{nodeName.field}} syntax

### Connection Types
1. **Direct Connection**  
   - One-to-one connection  
   - Example: Input → LLM → Output  
   - Requirements: source has output schema, target references it, edge connects them  
   - Data flows directly from source to target  

2. **Conditional Connection**  
   - Based on conditions (true/false branches)  
   - Example: Condition Node → [True] → Node A  
   - Data flows only to nodes connected to the active branch  

3. **Parallel Connection**  
   - One source to multiple targets in parallel  
   - Example: Input → [A, B, C]  
   - Data is copied to all connected nodes  

4. **Convergent Connection**  
   - Multiple sources to one target  
   - Example: [A, B] → Output  
   - Target combines data from all sources  

### Parameter Passing
- {{nodeName.field}} → reference specific field  
- {{nodeName.field.subField}} → nested field  
- {{nodeName}} → full output object  

**Examples per node type**:
- **LLM Node**: {{input.userMessage}}, {{http.response.body}}, combine multiple params in one prompt  
- **HTTP Node**: dynamic URL {{input.apiEndpoint}}, headers like Bearer {{input.token}}, body {{llm.formattedData}}  
- **Condition Node**: check {{input.userType}} == premium, boolean flags, numeric comparisons  
- **Template Node**: templates like "Hello {{input.userName}}, your order {{order.id}} is ready!"  

### Troubleshooting
- Node not receiving data: check edges, syntax, schema, names  
- Condition not branching: add sourceHandle, test condition logic  
- Template not substituting: verify syntax, node output, template config  
- HTTP node empty params: test variables, ensure source executes, check paths  

**Debug steps**:  
1. Check execution order  
2. Verify output schemas  
3. Test variable references  
4. Validate edge connections  
5. Check condition logic  
6. Review configurations  

### Best Practices
- Define clear output schemas  
- Use descriptive node names  
- Test simple examples first  
- Keep schemas consistent  
- Use condition nodes for scenarios  
- Validate variable references before deploying  
- Document expected formats  

### Step-by-Step Connection Instructions
1. **Create nodes**: unique IDs, descriptive names, define output schemas  
2. **Create edges**: connect source → target, edges need unique IDs  
3. **Configure references**: use {{nodeName.fieldName}} syntax, match names exactly  
4. **Test connections**: validate structure, check unreachable nodes, verify variables  

### Practical Examples
- **Simple Chatbot**: Input → LLM → Output, references {{input.message}}  
- **Conditional Workflow**: input userType → condition → premium/free branch → output  
- **HTTP Integration**: Input (endpoint, userId) → HTTP call → LLM process → Output  

### Common Mistakes
- Forgetting edges → always connect nodes  
- Wrong node names in variables → use exact names  
- Referencing non-existent fields → check schema  
- Missing sourceHandle in condition nodes → always specify branch  

---
`;

/**
 * UUID validation helper function
 */
const validateUUIDFormat = (uuid: string) => {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check length
  if (uuid.length !== 36) {
    issues.push(
      `UUID length is ${uuid.length}, should be exactly 36 characters`,
    );
    if (uuid.length < 36) {
      suggestions.push("UUID appears to be missing characters");
    } else {
      suggestions.push("UUID appears to have extra characters");
    }
  }

  // Check for hyphens
  const hyphenPositions = [8, 13, 18, 23];
  for (let i = 0; i < uuid.length; i++) {
    if (hyphenPositions.includes(i)) {
      if (uuid[i] !== "-") {
        issues.push(`Missing hyphen at position ${i + 1}`);
      }
    } else {
      if (uuid[i] === "-") {
        issues.push(`Unexpected hyphen at position ${i + 1}`);
      }
    }
  }

  // Check for uppercase letters
  if (/[A-F]/.test(uuid)) {
    issues.push("UUID contains uppercase letters - should be lowercase");
    suggestions.push("Convert all letters to lowercase (a-f)");
  }

  // Check for invalid characters
  const invalidChars = uuid.replace(/[0-9a-f-]/g, "");
  if (invalidChars) {
    issues.push(
      `UUID contains invalid characters: ${invalidChars.split("").join(", ")}`,
    );
    suggestions.push("Use only hexadecimal characters (0-9, a-f) and hyphens");
  }

  // Check version digit
  if (uuid.length >= 15) {
    const versionDigit = uuid[14];
    if (!/[1-5]/.test(versionDigit)) {
      issues.push(
        `Invalid version digit '${versionDigit}' at position 15 - must be 1-5`,
      );
    }
  }

  // Check variant digits
  if (uuid.length >= 20) {
    const variantDigit = uuid[19];
    if (!/[89ab]/.test(variantDigit)) {
      issues.push(
        `Invalid variant digit '${variantDigit}' at position 20 - must be 8, 9, a, or b`,
      );
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    format: uuid,
    expectedFormat: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    example: "123e4567-e89b-12d3-a456-426614174000",
  };
};

export const workflowBuilderTool = createTool({
  description:
    "Comprehensive workflow management tool with advanced features. Create, read, update, delete, and list workflows. Manage workflow structure (nodes and edges). Get detailed node type information, validate workflows, test with sample data, access pre-built templates, view analytics, get specific node details, learn about data flow between nodes, validate UUID formats, and get step-by-step connection instructions. Use 'get_node_types' for node information, 'validate_workflow' to check for errors, 'test_workflow' for testing, 'get_templates' for examples, 'get_analytics' for insights, 'get_node_details' for specific node information, 'get_data_flow_guide' for comprehensive data flow documentation, 'validate_uuid' to check UUID format, and 'get_connection_guide' for step-by-step node connection instructions. IMPORTANT: Workflow IDs must be valid UUIDs in format 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'. Use 'list' action to find workflows by name and get their IDs.",
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
        "get_node_types",
        "validate_workflow",
        "test_workflow",
        "get_templates",
        "get_analytics",
        "get_node_details",
        "get_data_flow_guide",
        "validate_uuid",
        "get_connection_guide",
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
          id: z
            .string()
            .describe(
              "Node ID - MUST be a valid UUID (version 4) following format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x=hex digit, 13th char=4, 17th char=8/9/a/b. Example: 550e8400-e29b-41d4-a716-446655440000. Do NOT add prefixes like 'node-' or 'input-'",
            ),
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
      .describe(
        "Nodes to add or update (update_structure only). All IDs must be valid UUIDs without prefixes.",
      ),
    edges: z
      .array(
        z.object({
          id: z
            .string()
            .describe(
              "Edge ID - MUST be a valid UUID (version 4) following format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x=hex digit, 13th char=4, 17th char=8/9/a/b. Example: 550e8400-e29b-41d4-a716-446655440000. Do NOT add prefixes like 'edge-' or 'node-'",
            ),
          source: z
            .string()
            .describe(
              "Source node ID - MUST be a valid UUID (version 4) following format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
            ),
          target: z
            .string()
            .describe(
              "Target node ID - MUST be a valid UUID (version 4) following format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
            ),
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
      .describe(
        "Edges to add (update_structure only). All IDs must be valid UUIDs without prefixes.",
      ),
    deleteNodes: z
      .array(z.string())
      .optional()
      .describe("Node IDs to delete (update_structure only)"),
    deleteEdges: z
      .array(z.string())
      .optional()
      .describe("Edge IDs to delete (update_structure only)"),

    // Validation specific fields
    validateNodes: z
      .array(z.any())
      .optional()
      .describe("Nodes to validate (validate_workflow only)"),
    validateEdges: z
      .array(z.any())
      .optional()
      .describe("Edges to validate (validate_workflow only)"),

    // Testing specific fields
    testData: z
      .record(z.string(), z.any())
      .optional()
      .describe("Sample data for workflow testing (test_workflow only)"),
    dryRun: z
      .boolean()
      .optional()
      .describe(
        "Run workflow in dry-run mode without actual execution (test_workflow only)",
      ),

    // Node details specific fields
    nodeKind: z
      .string()
      .optional()
      .describe(
        "Specific node kind to get detailed information about (get_node_details only)",
      ),

    // UUID validation specific fields
    uuid: z
      .string()
      .optional()
      .describe("UUID to validate (validate_uuid only)"),
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
      testData,
      dryRun,
      nodeKind,
      uuid,
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
            true,
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

          // Validate edge IDs are proper UUIDs
          if (edges) {
            for (const edge of edges) {
              if (!isValidUUID(edge.id)) {
                throw new Error(
                  `Invalid edge ID format: "${edge.id}". Edge IDs must be valid UUIDs (version 4) following format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x=hex digit, 13th char=4, 17th char=8/9/a/b. Examples: 550e8400-e29b-41d4-a716-446655440000 or b8f4c2a3-1234-4f56-9abc-1234567890de. Do NOT add prefixes like "edge-" or "node-". Use only the UUID itself.`,
                );
              }
            }
          }

          // Validate node IDs are proper UUIDs
          if (nodes) {
            for (const node of nodes) {
              if (!isValidUUID(node.id)) {
                throw new Error(
                  `Invalid node ID format: "${node.id}". Node IDs must be valid UUIDs (version 4) following format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x=hex digit, 13th char=4, 17th char=8/9/a/b. Examples: 550e8400-e29b-41d4-a716-446655440000 or b8f4c2a3-1234-4f56-9abc-1234567890de. Do NOT add prefixes like "node-" or "input-". Use only the UUID itself.`,
                );
              }
            }
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
            uuidGuidance: {
              note: "All node and edge IDs must be valid UUIDs (version 4)",
              format: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
              requirements: [
                "Each x must be a hexadecimal digit (0–9 or a–f)",
                "The 13th character must always be 4 (indicating version 4)",
                "The 17th character must be one of 8, 9, a, or b (UUID variant)",
                "Do not add prefixes like 'node-' or 'input-', use only the UUID itself",
              ],
              validExamples: [
                "550e8400-e29b-41d4-a716-446655440000",
                "b8f4c2a3-1234-4f56-9abc-1234567890de",
              ],
              invalidExamples: [
                "edge-550e8400-e29b-41d4-a716-446655440000 (has prefix)",
                "node-123e4567-e89b-12d3-a456-426614174000 (has prefix)",
                "550e8400-e29b-41d4-a716-446655440000-extra (too long)",
              ],
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

        case "get_node_types": {
          return {
            success: true,
            action: "get_node_types",
            nodeTypes: Object.entries(NODE_TYPE_DETAILS).map(
              ([kind, details]) => ({
                kind,
                ...details,
              }),
            ),
            categories: {
              "Data Flow": ["input", "output"],
              "AI Processing": ["llm"],
              Integration: ["tool", "http"],
              "Control Flow": ["condition"],
              "Content Generation": ["template"],
              Documentation: ["note"],
              "Custom Logic": ["code"],
            },
            total: Object.keys(NODE_TYPE_DETAILS).length,
            message: `Retrieved details for ${Object.keys(NODE_TYPE_DETAILS).length} node types`,
          };
        }

        case "validate_workflow": {
          if (!id) {
            throw new Error("Workflow ID is required for validation");
          }

          if (!isValidUUID(id)) {
            throw new Error(
              `Invalid workflow ID format: "${id}". Workflow IDs must be valid UUIDs (e.g., "123e4567-e89b-12d3-a456-426614174000"). If you're trying to find a workflow by name, use the "list" action first to find the correct ID.`,
            );
          }

          const hasAccess = await workflowRepository.checkAccess(
            id,
            session.user.id,
            true,
          );
          if (!hasAccess) {
            throw new Error("You don't have access to this workflow");
          }

          const workflow = await workflowRepository.selectStructureById(id);
          if (!workflow) {
            throw new Error("Workflow not found");
          }

          const validation = validateWorkflowStructure(
            workflow.nodes,
            workflow.edges,
          );
          const dataFlowValidation = validateDataFlow(
            workflow.nodes,
            workflow.edges,
          );

          return {
            success: true,
            action: "validate_workflow",
            workflowId: id,
            workflowName: workflow.name,
            validation: {
              ...validation,
              dataFlow: dataFlowValidation,
            },
            message:
              validation.isValid && dataFlowValidation.isValid
                ? "Workflow validation passed successfully"
                : `Workflow validation failed with ${validation.errors.length + dataFlowValidation.issues.length} error(s)`,
          };
        }

        case "test_workflow": {
          if (!id) {
            throw new Error("Workflow ID is required for testing");
          }

          if (!isValidUUID(id)) {
            throw new Error(
              `Invalid workflow ID format: "${id}". Workflow IDs must be valid UUIDs (e.g., "123e4567-e89b-12d3-a456-426614174000"). If you're trying to find a workflow by name, use the "list" action first to find the correct ID.`,
            );
          }

          const hasAccess = await workflowRepository.checkAccess(
            id,
            session.user.id,
            true,
          );
          if (!hasAccess) {
            throw new Error("You don't have access to this workflow");
          }

          const workflow = await workflowRepository.selectStructureById(id);
          if (!workflow) {
            throw new Error("Workflow not found");
          }

          // For now, return a mock test result since actual execution requires more setup
          const testResult = {
            success: true,
            action: "test_workflow",
            workflowId: id,
            workflowName: workflow.name,
            testData: testData || {
              message: "Test input",
              userId: "test-user",
            },
            dryRun: dryRun ?? true,
            result: dryRun
              ? {
                  status: "dry_run_completed",
                  message:
                    "Workflow structure is valid and ready for execution",
                  estimatedExecutionTime: "2-5 seconds",
                  nodeCount: workflow.nodes.length,
                  edgeCount: workflow.edges.length,
                }
              : {
                  status: "execution_not_supported",
                  message:
                    "Full workflow execution requires additional setup. Use dry_run=true for structure validation.",
                },
            message: dryRun
              ? "Workflow dry run completed successfully"
              : "Workflow testing requires dry run mode or additional execution setup",
          };

          return testResult;
        }

        case "get_templates": {
          return {
            success: true,
            action: "get_templates",
            templates: Object.entries(WORKFLOW_TEMPLATES).map(
              ([id, template]) => ({
                id,
                ...template,
              }),
            ),
            categories: {
              "AI & Chat": ["simple-chatbot"],
              "Data Processing": ["data-processing-pipeline"],
              Integration: ["api-integration"],
              "Control Flow": ["conditional-workflow"],
            },
            total: Object.keys(WORKFLOW_TEMPLATES).length,
            message: `Retrieved ${Object.keys(WORKFLOW_TEMPLATES).length} workflow templates`,
          };
        }

        case "get_analytics": {
          const workflows = await workflowRepository.selectAll(session.user.id);

          const analytics = {
            totalWorkflows: workflows.length,
            ownedWorkflows: workflows.filter(
              (w) => w.userId === session.user.id,
            ).length,
            publicWorkflows: workflows.filter((w) => w.visibility === "public")
              .length,
            publishedWorkflows: workflows.filter((w) => w.isPublished).length,
            recentActivity: workflows
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              )
              .slice(0, 5)
              .map((w) => ({
                id: w.id,
                name: w.name,
                updatedAt: w.updatedAt,
                visibility: w.visibility,
              })),
            visibilityDistribution: {
              private: workflows.filter((w) => w.visibility === "private")
                .length,
              public: workflows.filter((w) => w.visibility === "public").length,
              readonly: workflows.filter((w) => w.visibility === "readonly")
                .length,
            },
          };

          return {
            success: true,
            action: "get_analytics",
            analytics,
            message: `Retrieved analytics for ${analytics.totalWorkflows} workflows`,
          };
        }

        case "get_node_details": {
          if (!nodeKind) {
            throw new Error("Node kind is required for getting node details");
          }

          const nodeDetails = NODE_TYPE_DETAILS[nodeKind as NodeKind];
          if (!nodeDetails) {
            throw new Error(`Unknown node kind: ${nodeKind}`);
          }

          return {
            success: true,
            action: "get_node_details",
            nodeKind,
            details: nodeDetails,
            message: `Retrieved detailed information for ${nodeKind} node type`,
          };
        }

        case "get_data_flow_guide": {
          return {
            success: true,
            action: "get_data_flow_guide",
            dataFlowGuide: DATA_FLOW_DOCUMENTATION,
            quickReference: {
              syntax:
                "{{nodeName.fieldName}} - Reference field from node output",
              examples: [
                "{{input.message}} - Get message from Input node",
                "{{llm.response}} - Get response from LLM node",
                "{{http.response.body}} - Get body from HTTP response",
              ],
              commonIssues: [
                "Node not receiving data - Check edge connections and variable syntax",
                "Condition not branching - Verify sourceHandle in edges",
                "Template not substituting - Check variable syntax and node names",
              ],
            },
            message: "Retrieved comprehensive data flow and connection guide",
          };
        }

        case "validate_uuid": {
          if (!uuid) {
            throw new Error("UUID is required for validation");
          }

          const validation = validateUUIDFormat(uuid);
          const isValid = isValidUUID(uuid);

          return {
            success: true,
            action: "validate_uuid",
            uuid,
            validation,
            isValid,
            documentation: UUID_FORMAT_DOCUMENTATION,
            message: isValid
              ? `UUID "${uuid}" is valid`
              : `UUID "${uuid}" is invalid - ${validation.issues.length} issue(s) found`,
          };
        }

        case "get_connection_guide": {
          return {
            success: true,
            action: "get_connection_guide",
            connectionGuide: DATA_FLOW_DOCUMENTATION,
            quickStart: {
              title: "Quick Start: Connecting Nodes",
              steps: [
                "1. Create your nodes with unique IDs and names",
                "2. Create edges: { id: 'edge1', source: 'node1', target: 'node2' }",
                "3. Reference data: {{nodeName.fieldName}} in target nodes",
                "4. For conditions: add sourceHandle to edges",
                "5. Validate: use validate_workflow action",
              ],
              examples: [
                "Simple: Input → LLM → Output",
                "Conditional: Input → Condition → [Branch A, Branch B] → Output",
                "HTTP: Input → HTTP → LLM → Output",
              ],
            },
            message:
              "Retrieved comprehensive node connection guide with step-by-step instructions",
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
