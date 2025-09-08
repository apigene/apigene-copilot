import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import ApplicationsList from "@/components/applications/applications-list";

export default async function ApplicationsPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return <ApplicationsList accessToken={session?.accessToken} />;
}
