"use client";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "ui/dropdown-menu";
import { AvatarFallback, AvatarImage, Avatar } from "ui/avatar";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenu } from "ui/sidebar";
import {
  AppWindow,
  ChevronsUpDown,
  Command,
  LogOutIcon,
  Settings2,
  Palette,
  Sun,
  MoonStar,
  ChevronRight,
  FolderOpen,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { appStore } from "@/app/store";
import { BASE_THEMES } from "lib/const";
import { capitalizeFirstLetter, cn } from "lib/utils";
import { useUser, useClerk } from "auth/client";
import { useTranslations } from "next-intl";
import { useThemeStyle } from "@/hooks/use-theme-style";
import { redirect } from "next/navigation";

export function AppSidebarUser({ userId }: { userId?: string }) {
  // Call all hooks at the top level, before any conditional logic
  const appStoreMutate = appStore((state) => state.mutate);
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
              onClick={() => appStoreMutate({ openChatPreferences: true })}
            >
              <Settings2 className="size-4 text-foreground" />
              <span>{t("chatPreferences")}</span>
            </DropdownMenuItem>
            <SelectTheme />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => appStoreMutate({ openShortcutsPopup: true })}
            >
              <Command className="size-4 text-foreground" />
              <span>{t("keyboardShortcuts")}</span>
            </DropdownMenuItem>
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
              onClick={() => redirect("/context")}
            >
              <FolderOpen className="size-4 text-foreground" />
              <span>Context</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/settings")}
            >
              <Settings2 className="size-4 text-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => redirect("/users")}
            >
              <Users className="size-4 text-foreground" />
              <span>Invite Members</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOutIcon className="size-4 text-foreground" />
              <span>{t("signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function SelectTheme() {
  const t = useTranslations("Layout");

  const { theme = "light", setTheme } = useTheme();

  const { themeStyle = "default", setThemeStyle } = useThemeStyle();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="flex items-center"
        icon={
          <>
            <span className="text-muted-foreground text-xs min-w-0 truncate">
              {`${capitalizeFirstLetter(theme)} ${capitalizeFirstLetter(
                themeStyle,
              )}`}
            </span>
            <ChevronRight className="size-4 ml-2" />
          </>
        }
      >
        <Palette className="mr-2 size-4" />
        <span className="mr-auto">{t("theme")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-48">
          <DropdownMenuLabel className="text-muted-foreground w-full flex items-center">
            <span className="text-muted-foreground text-xs mr-2 select-none">
              {capitalizeFirstLetter(theme)}
            </span>
            <div className="flex-1" />

            <div
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="cursor-pointer border rounded-full flex items-center"
            >
              <div
                className={cn(
                  theme === "dark" &&
                    "bg-accent ring ring-muted-foreground/40 text-foreground",
                  "p-1 rounded-full",
                )}
              >
                <MoonStar className="size-3" />
              </div>
              <div
                className={cn(
                  theme === "light" &&
                    "bg-accent ring ring-muted-foreground/40 text-foreground",
                  "p-1 rounded-full",
                )}
              >
                <Sun className="size-3" />
              </div>
            </div>
          </DropdownMenuLabel>
          <div className="max-h-96 overflow-y-auto">
            {BASE_THEMES.map((t) => (
              <DropdownMenuCheckboxItem
                key={t}
                checked={themeStyle === t}
                onClick={(e) => {
                  e.preventDefault();
                  setThemeStyle(t);
                }}
                className="text-sm"
              >
                {capitalizeFirstLetter(t)}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
