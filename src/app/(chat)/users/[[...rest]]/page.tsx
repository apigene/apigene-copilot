import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import ClerkOrganizationProfile from "@/components/users/clerk-organization-profile";

export default async function UsersCatchAllPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return <ClerkOrganizationProfile />;
}
