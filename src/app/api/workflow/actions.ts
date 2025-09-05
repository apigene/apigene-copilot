"use server";
import { getSession } from "auth/server";
import { workflowRepository } from "lib/db/repository";

export async function selectExecuteAbilityWorkflowsAction() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const workflows = await workflowRepository.selectExecuteAbility(
    session.user.id,
  );
  return workflows;
}
