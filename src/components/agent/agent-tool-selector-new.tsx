"use client";

import { useCallback, useMemo, useState } from "react";
import { ChatMention } from "app-types/chat";
import { Loader, XIcon, PlusIcon } from "lucide-react";
import { MCPIcon } from "ui/mcp-icon";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { ScrollArea } from "ui/scroll-area";
import { useMcpList } from "@/hooks/queries/use-mcp-list";
import { MCPServerInfo } from "app-types/mcp";

interface AgentToolSelectorNewProps {
  mentions: ChatMention[];
  mcps: string[];
  context: string[];
  disabled?: boolean;
  hasEditAccess?: boolean;
  onChange: (
    mentions: ChatMention[],
    mcps: string[],
    context: string[],
  ) => void;
}

export function AgentToolSelectorNew({
  mentions,
  mcps,
  context,
  disabled = false,
  hasEditAccess = true,
  onChange,
}: AgentToolSelectorNewProps) {
  const { data: mcpList, isLoading: isMcpLoading } = useMcpList();
  const [showMcpSelector, setShowMcpSelector] = useState(false);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [newContext, setNewContext] = useState("");

  const handleSelectMcp = useCallback(
    (mcpServer: MCPServerInfo & { id: string }) => {
      if (!mcps.includes(mcpServer.name)) {
        const newMcps = [...mcps, mcpServer.name];

        // Add MCP tools to mentions
        const mcpMentions = mcpServer.toolInfo.map((tool) => ({
          type: "mcpTool" as const,
          serverName: mcpServer.name,
          name: tool.name,
          serverId: mcpServer.id,
        }));

        const newMentions = [...mentions, ...mcpMentions];
        onChange(newMentions, newMcps, context);
      }
      setShowMcpSelector(false);
    },
    [mcps, mentions, context, onChange],
  );

  const handleRemoveMcp = useCallback(
    (mcpName: string) => {
      const newMcps = mcps.filter((m) => m !== mcpName);

      // Remove MCP tools from mentions
      const newMentions = mentions.filter(
        (m) => !(m.type === "mcpTool" && m.serverName === mcpName),
      );

      onChange(newMentions, newMcps, context);
    },
    [mcps, mentions, context, onChange],
  );

  const handleAddContext = useCallback(() => {
    if (newContext.trim() && !context.includes(newContext.trim())) {
      const newContextList = [...context, newContext.trim()];
      onChange(mentions, mcps, newContextList);
      setNewContext("");
    }
    setShowContextSelector(false);
  }, [newContext, context, mentions, mcps, onChange]);

  const handleRemoveContext = useCallback(
    (contextName: string) => {
      const newContextList = context.filter((c) => c !== contextName);
      onChange(mentions, mcps, newContextList);
    },
    [context, mentions, mcps, onChange],
  );

  const availableMcps = useMemo(() => {
    return (
      (mcpList as (MCPServerInfo & { id: string })[])?.filter(
        (mcp) => !mcps.includes(mcp.name),
      ) || []
    );
  }, [mcpList, mcps]);

  const isLoadingTool = useMemo(() => {
    return isMcpLoading;
  }, [isMcpLoading]);

  return (
    <div className="space-y-4">
      {/* MCP Servers Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">MCP Servers</Label>
        <div className="flex flex-wrap gap-2">
          {mcps.map((mcpName) => (
            <div
              key={mcpName}
              className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
            >
              <MCPIcon className="size-4" />
              <span className="text-sm">{mcpName}</span>
              {hasEditAccess && (
                <button
                  onClick={() => handleRemoveMcp(mcpName)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          ))}

          {hasEditAccess && !disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMcpSelector(true)}
              disabled={isLoadingTool}
              className="h-8"
            >
              <PlusIcon className="size-3 mr-1" />
              Add MCP Server
            </Button>
          )}
        </div>

        {isLoadingTool && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="size-4 animate-spin" />
            Loading MCP servers...
          </div>
        )}
      </div>

      {/* Context Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Context</Label>
        <div className="flex flex-wrap gap-2">
          {context.map((contextName) => (
            <div
              key={contextName}
              className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
            >
              <span className="text-sm">{contextName}</span>
              {hasEditAccess && (
                <button
                  onClick={() => handleRemoveContext(contextName)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          ))}

          {hasEditAccess && !disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContextSelector(true)}
              className="h-8"
            >
              <PlusIcon className="size-3 mr-1" />
              Add Context
            </Button>
          )}
        </div>
      </div>

      {/* MCP Server Selector Modal */}
      {showMcpSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Select MCP Server</h3>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {availableMcps.map((mcp) => (
                  <button
                    key={mcp.id}
                    onClick={() => handleSelectMcp(mcp)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary rounded-lg text-left"
                  >
                    <MCPIcon className="size-5" />
                    <div>
                      <div className="font-medium">{mcp.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {mcp.toolInfo.length} tools
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowMcpSelector(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Context Input Modal */}
      {showContextSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Context</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="context-name">Context Name</Label>
                <Input
                  id="context-name"
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  placeholder="Enter context name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddContext();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowContextSelector(false);
                  setNewContext("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddContext} disabled={!newContext.trim()}>
                Add Context
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
