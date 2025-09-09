import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import SettingsList from "@/components/settings/settings-list";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  return <SettingsList />;
}
