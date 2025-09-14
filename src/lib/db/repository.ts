import { pgChatRepository } from "./pg/repositories/chat-repository.pg";
import { pgUserRepository } from "./pg/repositories/user-repository.pg";
import { pgMcpRepository } from "./pg/repositories/mcp-repository.pg";
import { pgMcpMcpToolCustomizationRepository } from "./pg/repositories/mcp-tool-customization-repository.pg";
import { pgMcpServerCustomizationRepository } from "./pg/repositories/mcp-server-customization-repository.pg";
import { pgWorkflowRepository } from "./pg/repositories/workflow-repository.pg";
import { pgAgentRepository } from "./pg/repositories/agent-repository.pg";
import { pgArchiveRepository } from "./pg/repositories/archive-repository.pg";
import { pgMcpOAuthRepository } from "./pg/repositories/mcp-oauth-repository.pg";
import { pgBookmarkRepository } from "./pg/repositories/bookmark-repository.pg";

// MongoDB repository imports
import { mongoUserRepository } from "./mongo/repositories/user-repository.mongo";
import { mongoMcpRepository } from "./mongo/repositories/mcp-repository.mongo";
import { mongoMcpOAuthRepository } from "./mongo/repositories/mcp-oauth-repository.mongo";
import { mongoMcpServerCustomizationRepository } from "./mongo/repositories/mcp-server-customization-repository.mongo";
import { mongoMcpToolCustomizationRepository } from "./mongo/repositories/mcp-tool-customization-repository.mongo";
import { mongoAgentRepository } from "./mongo/repositories/agent-repository.mongo";
import { mongoArchiveRepository } from "./mongo/repositories/archive-repository.mongo";
import { mongoBookmarkRepository } from "./mongo/repositories/bookmark-repository.mongo";
import { mongoChatRepository } from "./mongo/repositories/chat-repository.mongo";
import { mongoWorkflowRepository } from "./mongo/repositories/workflow-repository.mongo";

// Database adapter logic - select repository based on environment
const getUserRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoUserRepository
    : pgUserRepository;
};

const getMcpRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoMcpRepository
    : pgMcpRepository;
};

const getMcpOAuthRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoMcpOAuthRepository
    : pgMcpOAuthRepository;
};

const getMcpServerCustomizationRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoMcpServerCustomizationRepository
    : pgMcpServerCustomizationRepository;
};

const getMcpToolCustomizationRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoMcpToolCustomizationRepository
    : pgMcpMcpToolCustomizationRepository;
};

const getAgentRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoAgentRepository
    : pgAgentRepository;
};

const getArchiveRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoArchiveRepository
    : pgArchiveRepository;
};

const getBookmarkRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoBookmarkRepository
    : pgBookmarkRepository;
};

const getChatRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoChatRepository
    : pgChatRepository;
};

const getWorkflowRepository = () => {
  return process.env.REPOSITORY_DB === "mongodb"
    ? mongoWorkflowRepository
    : pgWorkflowRepository;
};

export const chatRepository = getChatRepository();
export const userRepository = getUserRepository();
export const mcpRepository = getMcpRepository();
export const mcpMcpToolCustomizationRepository =
  getMcpToolCustomizationRepository();
export const mcpServerCustomizationRepository =
  getMcpServerCustomizationRepository();
export const mcpOAuthRepository = getMcpOAuthRepository();

export const workflowRepository = getWorkflowRepository();
export const agentRepository = getAgentRepository();
export const archiveRepository = getArchiveRepository();
export const bookmarkRepository = getBookmarkRepository();
