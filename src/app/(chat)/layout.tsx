import { SidebarProvider } from "ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { cookies } from "next/headers";
import { AccessTokenProvider } from "ui/access-token-provider";

import { ensureUserExists } from "auth/server";
import { COOKIE_KEY_SIDEBAR_STATE } from "lib/const";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { SWRConfigProvider } from "./swr-config";
import { redirect } from "next/navigation";

export const experimental_ppr = true;

export default async function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await ensureUserExists();

  // Redirect to sign-in if user is not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const isCollapsed =
    cookieStore.get(COOKIE_KEY_SIDEBAR_STATE)?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AccessTokenProvider>
        <SWRConfigProvider>
          <AppPopupProvider />
          <AppSidebar userId={user.id} />
          <main className="relative bg-background w-full flex flex-col h-screen">
            <AppHeader />
            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </SWRConfigProvider>
      </AccessTokenProvider>
    </SidebarProvider>
  );
}
