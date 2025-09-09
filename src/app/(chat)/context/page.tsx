import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import ContextList from "@/components/context/context-list";

export default async function ContextPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return <ContextList />;
}
