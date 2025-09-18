import { agentRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { z } from "zod";
import { serverCache } from "lib/cache";
import { CacheKeys } from "lib/cache/cache-keys";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const hasAccess = await agentRepository.checkAccess(id, session.user.id);
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }

  const agent = await agentRepository.selectAgentById(id, session.user.id);
  return Response.json(agent);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Convert API format to frontend format
    const frontendData: any = {};
    if (body.name !== undefined) frontendData.name = body.name;
    if (body.description !== undefined)
      frontendData.description = body.description;
    if (body.icon !== undefined) {
      frontendData.icon = body.icon
        ? { type: "emoji" as const, value: body.icon }
        : undefined;
    }
    if (body.instructions !== undefined) {
      frontendData.instructions = {
        systemPrompt: body.instructions,
        mentions: [],
      };
    }
    if (body.agent_type !== undefined) {
      frontendData.visibility = body.agent_type;
    }

    // Check access for write operations
    const hasAccess = await agentRepository.checkAccess(id, session.user.id);
    if (!hasAccess) {
      return new Response("Unauthorized", { status: 401 });
    }

    // For non-owners of public agents, preserve original visibility
    const existingAgent = await agentRepository.selectAgentById(
      id,
      session.user.id,
    );
    if (existingAgent && existingAgent.userId !== session.user.id) {
      frontendData.visibility = existingAgent.visibility;
    }

    const agent = await agentRepository.updateAgent(
      id,
      session.user.id,
      frontendData,
    );
    serverCache.delete(CacheKeys.agentInstructions(agent.id));

    return Response.json(agent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }

    console.error("Failed to update agent:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const hasAccess = await agentRepository.checkAccess(
      id,
      session.user.id,
      true, // destructive = true for delete operations
    );
    if (!hasAccess) {
      return new Response("Unauthorized", { status: 401 });
    }
    await agentRepository.deleteAgent(id, session.user.id);
    serverCache.delete(CacheKeys.agentInstructions(id));
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete agent:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
