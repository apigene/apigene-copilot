"use client";
import { ArrowUpRight, Loader } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MCPIcon } from "ui/mcp-icon";

import { NotionIcon } from "ui/notion-icon";
import { LinearIcon } from "ui/linear-icon";
import { PlaywrightIcon } from "ui/playwright-icon";
import { NeonIcon } from "ui/neon-icon";
import { StripeIcon } from "ui/stripe-icon";
import { CanvaIcon } from "ui/canva-icon";
import { PaypalIcon } from "ui/paypal-icon";
import { Button } from "ui/button";
import { AtlassianIcon } from "ui/atlassian-icon";
import { AsanaIcon } from "ui/asana-icon";
import { GithubIcon } from "ui/github-icon";
import { useEffect, useState } from "react";
import { useAccessToken } from "ui/access-token-provider";
import { Avatar, AvatarImage } from "ui/avatar";

const BRANDFETCH_CLIENT_ID = "1idy-5x7B4rsvDDat7C";

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

export const RECOMMENDED_MCPS = [
  {
    name: "github",
    label: "GitHub",
    config: {
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        Authorization: "Bearer ${input:your_github_mcp_pat}",
      },
    },
    icon: GithubIcon,
  },
  {
    name: "notion",
    label: "Notion",
    config: {
      url: "https://mcp.notion.com/mcp",
    },
    icon: NotionIcon,
  },

  {
    name: "linear",
    label: "Linear",
    config: {
      url: "https://mcp.linear.app/sse",
    },
    icon: LinearIcon,
  },
  {
    name: "playwright",
    label: "Playwright",
    config: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
    icon: PlaywrightIcon,
  },
  {
    name: "neon",
    label: "Neon",
    config: {
      url: "https://mcp.neon.tech/mcp",
    },
    icon: NeonIcon,
  },
  {
    name: "paypal",
    label: "Paypal",
    config: {
      url: "https://mcp.paypal.com/mcp",
    },
    icon: PaypalIcon,
  },
  {
    name: "stripe",
    label: "Stripe",
    config: {
      url: "https://mcp.stripe.com",
    },
    icon: StripeIcon,
  },
  {
    name: "canva",
    label: "Canva",
    config: {
      url: "https://mcp.canva.com/mcp",
    },
    icon: CanvaIcon,
  },
  {
    name: "atlassian",
    label: "Atlassian",
    icon: AtlassianIcon,
    config: {
      url: "https://mcp.atlassian.com/v1/sse",
    },
  },
  {
    name: "asana",
    label: "Asana",
    icon: AsanaIcon,
    config: {
      url: "https://mcp.asana.com/sse",
    },
  },
];

export function MCPOverview() {
  const [isListLoading, setIsListLoading] = useState(false);
  const [apigeneAgents, setApigeneAgents] = useState<ApigeneAgent[]>([]);
  const { token } = useAccessToken();

  const t = useTranslations("MCP");

  const handleMcpClick = (e: React.MouseEvent, mcp: ApigeneAgent) => {
    e.preventDefault();
    e.stopPropagation();

    const params = new URLSearchParams();
    params.set("name", mcp.name);
    params.set("config", JSON.stringify(mcp.config));

    window.location.href = `/mcp/create?${params.toString()}`;
  };

  useEffect(() => {
    const fetchApigeneAgents = async () => {
      setIsListLoading(true);
      try {
        const response = await fetch(
          "https://dev.apigene.ai/api/gpts/list?include_private_gpts=false&include_public_gpts=true",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        const getIconUrl = (icon_url: string) => {
          const domain = icon_url.replace("https://logo.clearbit.com/", "");
          return `https://cdn.brandfetch.io/${encodeURIComponent(domain)}?c=${BRANDFETCH_CLIENT_ID}&fallback=https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}`;
        };
        const agentConfigs = data.map((agent: any) => ({
          name: agent.gpt_name,
          label: agent.gpt_name,
          config: {
            url: `https://dev.apigene.ai/${agent.gpt_name}/mcp`,
            headers: {
              "apigene-api-key": `${token}`,
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
  }, []);

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

          {!token && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-destructive">
                Please set your access token to see the list of MCP servers
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
