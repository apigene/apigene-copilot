import { ensureUserExists } from "auth/server";
import { workflowRepository } from "lib/db/repository";
import { validateWorkflowId } from "lib/utils/uuid-validation";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Validate UUID format
  const validationError = validateWorkflowId(id);
  if (validationError) {
    return validationError;
  }

  const user = await ensureUserExists();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const hasAccess = await workflowRepository.checkAccess(id, user.id);
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }
  const workflow = await workflowRepository.selectStructureById(id);
  return Response.json(workflow);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { nodes, edges, deleteNodes, deleteEdges } = await request.json();
  const { id } = await params;

  // Validate UUID format
  const validationError = validateWorkflowId(id);
  if (validationError) {
    return validationError;
  }

  const user = await ensureUserExists();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hasAccess = await workflowRepository.checkAccess(id, user.id, false);
  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }
  await workflowRepository.saveStructure({
    workflowId: id,
    nodes: nodes.map((v) => ({
      ...v,
      workflowId: id,
    })),
    edges: edges.map((v) => ({
      ...v,
      workflowId: id,
    })),
    deleteNodes,
    deleteEdges,
  });

  return Response.json({ success: true });
}
