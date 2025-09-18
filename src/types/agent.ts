import z from "zod";
import { ChatMentionSchema } from "./chat";
import { VisibilitySchema } from "./util";

export type AgentIcon = {
  type: "emoji";
  value: string;
  style?: Record<string, string>;
};

export const AgentInstructionsSchema = z.object({
  role: z.string().optional(),
  systemPrompt: z.string().optional(),
  mentions: z.array(ChatMentionSchema).optional(),
});

// Backend API compatible schemas
export const AgentCreateApiSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(8000).optional(),
  instructions: z.any(), // Can be string or object
  apis: z.array(z.string()).optional().default([]),
  mcps: z.array(z.string()).optional().default([]),
  context: z.array(z.string()).optional().default([]),
  icon: z.any().optional(), // Can be string, object, or null
  agent_type: z.enum(["private", "public"]).optional().default("private"),
});

export const AgentUpdateApiSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(8000).optional(),
  instructions: z.any().optional(),
  apis: z.array(z.string()).optional(),
  mcps: z.array(z.string()).optional(),
  context: z.array(z.string()).optional(),
  icon: z.any().optional(),
  agent_type: z.enum(["private", "public"]).optional(),
});

export const AgentCreateSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(8000).optional(),
    icon: z
      .object({
        type: z.literal("emoji"),
        value: z.string(),
        style: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
    userId: z.string(),
    instructions: AgentInstructionsSchema,
    visibility: VisibilitySchema.optional().default("private"),
  })
  .strip();
export const AgentUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(8000).optional(),
    icon: z
      .object({
        type: z.literal("emoji"),
        value: z.string(),
        style: z.record(z.string(), z.string()).optional(),
      })
      .optional(),
    instructions: AgentInstructionsSchema.optional(),
    visibility: VisibilitySchema.optional(),
  })
  .strip();

export const AgentQuerySchema = z.object({
  type: z.enum(["all", "mine", "shared"]).default("all"),
  filters: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type AgentVisibility = z.infer<typeof VisibilitySchema>;

export type AgentSummary = {
  id: string;
  name: string;
  description?: string;
  icon?: AgentIcon;
  userId: string;
  visibility: AgentVisibility;
  createdAt: Date;
  updatedAt: Date;
  userName?: string;
  userAvatar?: string;
};

export type Agent = AgentSummary & {
  instructions: z.infer<typeof AgentInstructionsSchema>;
  // Backend API fields
  apis?: string[];
  mcps?: string[];
  context?: string[];
  agent_type?: string;
  created_by?: string;
};

export type AgentRepository = {
  insertAgent(agent: z.infer<typeof AgentCreateSchema>): Promise<Agent>;

  selectAgentById(id: string, userId: string): Promise<Agent | null>;

  selectAgentsByUserId(userId: string): Promise<Agent[]>;

  updateAgent(
    id: string,
    userId: string,
    agent: z.infer<typeof AgentUpdateSchema>,
  ): Promise<Agent>;

  deleteAgent(id: string, userId: string): Promise<void>;

  selectAgents(
    currentUserId: string,
    filters?: ("all" | "mine" | "shared")[],
    limit?: number,
  ): Promise<AgentSummary[]>;

  checkAccess(
    agentId: string,
    userId: string,
    destructive?: boolean,
  ): Promise<boolean>;
};

export const AgentGenerateSchema = z.object({
  name: z.string().describe("Agent name"),
  description: z.string().describe("Agent description"),
  instructions: z.string().describe("Agent instructions"),
  role: z.string().describe("Agent role"),
  tools: z
    .array(z.string())
    .describe("Agent allowed tools name")
    .optional()
    .default([]),
});
