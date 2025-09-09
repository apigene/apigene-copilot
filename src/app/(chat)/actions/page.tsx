import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import ActionsList from "@/components/actions/actions-list";

export default async function ActionsPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return <ActionsList />;
}
