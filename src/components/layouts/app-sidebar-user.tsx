"use client";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
} from "ui/dropdown-menu";
import { AvatarFallback, AvatarImage, Avatar } from "ui/avatar";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenu } from "ui/sidebar";
import {
  AppWindow,
  ChevronsUpDown,
  LogOutIcon,
  Settings2,
  Brain,
  Users,
  Bot,
  Activity,
  BarChart3,
  Waypoints,
} from "lucide-react";
import { MCPIcon } from "ui/mcp-icon";
import { useUser, useClerk } from "auth/client";
import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { TrialNotice } from "./trial-notice";

export function AppSidebarUser({ userId }: { userId?: string }) {
  // Call all hooks at the top level, before any conditional logic
  const t = useTranslations("Layout");
  const { user } = useUser();
  const { signOut } = useClerk();

  // If no userId provided, don't render anything
  if (!userId) {
    return null;
  }

  const logout = async () => {
    try {
      // Use Clerk's signOut method with explicit redirect
      await signOut({
        redirectUrl: window.location.origin + "/sign-in",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback: redirect to sign-in page
      window.location.href = "/sign-in";
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-input/30 border"
              size={"lg"}
            >
              <Avatar className="rounded-full size-8 border">
                <AvatarImage
                  className="object-cover"
                  src={user?.imageUrl || "/pf.png"}
                  alt={user?.fullName || ""}
                />
                <AvatarFallback>
                  {user?.fullName?.slice(0, 1) || ""}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="bg-background w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
            align="center"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={user?.imageUrl || "/pf.png"}
                    alt={user?.fullName || ""}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user?.fullName?.slice(0, 1) || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/applications")}
            >
              <AppWindow className="size-4 text-foreground" />
              <span>Applications</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/mcp")}
            >
              <MCPIcon className="size-4 fill-accent-foreground" />
              <span>{t("mcpConfiguration")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/workflow")}
            >
              <Waypoints className="size-4 text-foreground" />
              <span>{t("workflow")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/agents")}
            >
              <Bot className="size-4 text-foreground" />
              <span>{t("agents")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/context")}
            >
              <Brain className="size-4 text-foreground" />
              <span>Context</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/actions")}
            >
              <Activity className="size-4 text-foreground" />
              <span>Actions</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/dashboard")}
            >
              <BarChart3 className="size-4 text-foreground" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/users")}
            >
              <Users className="size-4 text-foreground" />
              <span>Invite Members</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/settings")}
            >
              <Settings2 className="size-4 text-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOutIcon className="size-4 text-foreground" />
              <span>{t("signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Trial Notice */}
      <TrialNotice className="mt-2" />
    </SidebarMenu>
  );
}
