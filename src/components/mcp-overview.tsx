"use client";
import { ArrowUpRight, Loader } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MCPIcon } from "ui/mcp-icon";

import { Button } from "ui/button";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "ui/avatar";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { useAuth } from "@clerk/nextjs";

export type ApigeneAgent = {
  name: string;
  label: string;
  config: {
    url: string;
    headers: {
      "apigene-api-key": string;
    };
  };
  icon: () => React.ReactNode;
};

export function MCPOverview() {
  const [isListLoading, setIsListLoading] = useState(false);
  const [apigeneAgents, setApigeneAgents] = useState<ApigeneAgent[]>([]);
  const { getToken } = useAuth();
  const [userToken, setUserToken] = useState<string | null>(null);
  const apiClient = useApigeneApi();

  const t = useTranslations("MCP");

  const handleMcpClick = (e: React.MouseEvent, mcp: ApigeneAgent) => {
    e.preventDefault();
    e.stopPropagation();

    const params = new URLSearchParams();
    params.set("name", mcp.name);
    params.set("config", JSON.stringify(mcp.config));

    window.location.href = `/mcp/create?${params.toString()}`;
  };

  // Get user session token
  useEffect(() => {
    const fetchUserToken = async () => {
      try {
        const token = await getToken({
          template: process.env.NEXT_PUBLIC_AUTH_CLERK_JWT_TPL,
        });
        setUserToken(token);
      } catch (error) {
        console.error("Failed to get user token:", error);
        setUserToken(null);
      }
    };
    fetchUserToken();
  }, [getToken]);

  useEffect(() => {
    const fetchApigeneAgents = async () => {
      if (!userToken) return;

      setIsListLoading(true);
      try {
        const response = await apiClient.get(
          `api/gpts/list?include_private_gpts=true&include_public_gpts=true`,
        );

        if (!Array.isArray(response)) {
          console.error(
            "Invalid response format: expected array, got",
            typeof response,
          );
          return;
        }
        const getIconUrl = (icon_url: string) => {
          const domain = icon_url.replace("https://logo.clearbit.com/", "");
          const brandfetchClientId =
            process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;
          return `https://cdn.brandfetch.io/${encodeURIComponent(domain)}?c=${brandfetchClientId}`;
        };
        const agentConfigs = response.map((agent: any) => ({
          name: agent.gpt_name,
          label: agent.gpt_name,
          config: {
            url: `${apiClient.getBaseUrl()}/${agent.gpt_name}/mcp`,
            headers: {
              "apigene-api-key": `${userToken}`,
            },
          },
          icon: () => (
            <Avatar className="size-5 rounded-full">
              <AvatarImage src={getIconUrl(agent.icon)} />
            </Avatar>
          ),
        }));
        setApigeneAgents(agentConfigs);
        setIsListLoading(false);
      } catch (_error) {
        setIsListLoading(false);
      }
    };
    fetchApigeneAgents();
  }, [userToken, apiClient]);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/mcp/create"
        className="rounded-lg overflow-hidden cursor-pointer p-12 text-center relative group transition-all duration-300 "
      >
        <div className="flex flex-col items-center justify-center space-y-4 my-20">
          <h3 className="text-2xl md:text-4xl font-semibold flex items-center gap-3">
            <MCPIcon className="fill-foreground size-6 hidden sm:block" />
            {t("overviewTitle")}
          </h3>

          <p className="text-muted-foreground max-w-md">
            {t("overviewDescription")}
          </p>

          <div className="flex items-center gap-2 text-xl font-bold">
            {t("addMcpServer")}
            <ArrowUpRight className="size-6" />
          </div>

          {!userToken && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-destructive">
                Please sign in to see the list of MCP servers
              </p>
            </div>
          )}

          {/* While Agents list is loading, show a loading spinner */}
          {isListLoading && <Loader className="size-8 z-20 animate-spin" />}
        </div>

        <div className="flex gap-2 flex-wrap">
          {apigeneAgents.map((mcp) => (
            <Button
              key={mcp.name}
              variant={"secondary"}
              className="hover:translate-y-[-2px] transition-all duration-300"
              onClick={(e) => handleMcpClick(e, mcp)}
            >
              <mcp.icon />
              {mcp.label}
            </Button>
          ))}
        </div>
      </Link>
    </div>
  );
}
