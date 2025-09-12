"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface MCPServer {
  name: string;
  description?: string;
  version?: string;
  status?: string;
  repository?: {
    url?: string;
    source?: string;
    id?: string;
    subfolder?: string;
  };
  packages?: Array<{
    registry_type?: string;
    registry_base_url?: string;
    identifier?: string;
    version?: string;
    transport?: {
      type?: string;
    };
    package_arguments?: Array<{
      value?: string;
      type?: string;
      value_hint?: string;
      description?: string;
      is_required?: boolean;
      name?: string;
      format?: string;
      choices?: string[];
      default?: string;
    }>;
    environment_variables?: Array<{
      description?: string;
      format?: string;
      is_secret?: boolean;
      name?: string;
      is_required?: boolean;
      default?: string;
      choices?: string[];
      variables?: Record<string, any>;
    }>;
    runtime_hint?: string;
    runtime_arguments?: Array<{
      is_required?: boolean;
      value?: string;
      type?: string;
      name?: string;
    }>;
    file_sha256?: string;
  }>;
  remotes?: Array<{
    type?: string;
    url?: string;
    headers?: Array<{
      description?: string;
      is_required?: boolean;
      value?: string;
      is_secret?: boolean;
      name?: string;
    }>;
  }>;
  _meta?: {
    "io.modelcontextprotocol.registry/official"?: {
      id?: string;
      published_at?: string;
      updated_at?: string;
      is_latest?: boolean;
    };
  };
}

type MCPServerDetails = MCPServer;

export default function MCPRegistryPage() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServer, setSelectedServer] = useState<MCPServerDetails | null>(
    null,
  );
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [cursors, setCursors] = useState<string[]>([]); // Track cursors for navigation

  useEffect(() => {
    fetchServers();
  }, [pageSize, currentPage]);

  const fetchServers = async (cursor?: string | null, resetPage = false) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      if (cursor) {
        params.set("cursor", cursor);
      }

      const response = await fetch(`/api/mcp-registry?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setServers(data.servers || []);

      // Update pagination metadata
      if (data.metadata) {
        setNextCursor(data.metadata.next_cursor || null);
        setHasNextPage(!!data.metadata.next_cursor);
      }

      // Update cursor tracking for navigation
      if (resetPage) {
        setCursors([cursor || ""]);
        setCurrentPage(1);
      } else if (cursor && !cursors.includes(cursor)) {
        setCursors((prev) => [...prev, cursor]);
      }

      setHasPreviousPage(cursors.length > 0);
    } catch (error) {
      console.error("Failed to fetch MCP servers:", error);
      toast.error("Failed to load MCP servers from registry");
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && nextCursor) {
      fetchServers(nextCursor);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage && cursors.length > 1) {
      const previousCursor = cursors[cursors.length - 2] || "";
      setCursors((prev) => prev.slice(0, -1));
      fetchServers(previousCursor);
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize);
    setPageSize(size);
    setCurrentPage(1);
    setCursors([]);
    fetchServers(null, true);
  };

  const fetchServerDetails = async (serverId: string) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(
        `/api/mcp-registry?id=${encodeURIComponent(serverId)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedServer(data);
    } catch (error) {
      console.error("Failed to fetch server details:", error);
      toast.error("Failed to load server details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddServer = (server: MCPServerDetails) => {
    // Navigate to create page with server details
    const params = new URLSearchParams();
    params.set("name", server.name);

    // Try to extract configuration from packages or remotes
    const config: any = {};

    if (server.packages && server.packages.length > 0) {
      const pkg = server.packages[0];
      if (pkg.transport?.type === "stdio") {
        config.command = pkg.runtime_hint || "npx";
        config.args = [pkg.identifier || server.name];
        if (pkg.version) {
          config.args[0] += `@${pkg.version}`;
        }
      }
    } else if (server.remotes && server.remotes.length > 0) {
      const remote = server.remotes[0];
      config.url = remote.url;
      if (remote.headers) {
        config.headers = {};
        remote.headers.forEach((header) => {
          if (header.name && header.value) {
            config.headers[header.name] = header.value;
          }
        });
      }
    }

    params.set("config", JSON.stringify(config));

    window.location.href = `/mcp/create?${params.toString()}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="pt-8 flex-1 relative flex flex-col gap-4 px-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 pb-8">
            <Link
              href="/mcp"
              className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3" />
              Back to MCP Servers
            </Link>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">MCP Registry</h1>
              <p className="text-muted-foreground">
                Discover and add MCP servers from the official registry
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Search MCP servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 max-w-6xl mx-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin" />
              <span className="ml-2">Loading MCP servers...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server, index) => (
                <Card
                  key={`${server.name}-${server.version || "no-version"}-${index}`}
                  className="hover:shadow-lg transition-shadow h-full flex flex-col"
                >
                  <CardHeader className="flex-1">
                    <div className="space-y-3">
                      <div>
                        <CardTitle
                          className="text-lg break-words leading-tight"
                          style={{
                            wordBreak: "break-word",
                            hyphens: "auto",
                            overflowWrap: "break-word",
                          }}
                        >
                          {server.name}
                        </CardTitle>
                        {server.version && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            v{server.version}
                          </Badge>
                        )}
                      </div>

                      {server.description && (
                        <CardDescription className="text-sm line-clamp-3">
                          {server.description}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchServerDetails(
                          server._meta?.[
                            "io.modelcontextprotocol.registry/official"
                          ]?.id || server.name,
                        )
                      }
                      disabled={loadingDetails}
                      className="w-full"
                    >
                      {loadingDetails ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : (
                        "View Details"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredServers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No servers found matching your search."
                  : "No MCP servers available."}
              </p>
            </div>
          )}

          {/* Server Details Modal */}
          {selectedServer && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {selectedServer.name}
                      </CardTitle>
                      {selectedServer.version && (
                        <Badge variant="secondary" className="mt-1">
                          v{selectedServer.version}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedServer(null)}
                    >
                      ×
                    </Button>
                  </div>
                  {selectedServer.description && (
                    <CardDescription className="mt-2">
                      {selectedServer.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="overflow-y-auto">
                  <div className="space-y-4">
                    {selectedServer.repository && (
                      <div>
                        <h4 className="font-semibold mb-1">Repository</h4>
                        <a
                          href={selectedServer.repository?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {selectedServer.repository?.url}
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}

                    {selectedServer.packages &&
                      selectedServer.packages.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Installation</h4>
                          <div className="space-y-2">
                            {selectedServer.packages.map((pkg, index) => (
                              <div key={index} className="bg-muted p-3 rounded">
                                <div className="text-sm font-medium mb-2">
                                  {pkg.registry_type?.toUpperCase()} Package
                                </div>
                                <div className="text-sm font-mono mb-2">
                                  {pkg.identifier}@{pkg.version}
                                </div>
                                {pkg.environment_variables &&
                                  pkg.environment_variables.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs font-medium mb-1">
                                        Environment Variables:
                                      </div>
                                      {pkg.environment_variables.map(
                                        (env, envIndex) => (
                                          <div
                                            key={envIndex}
                                            className="text-xs text-muted-foreground"
                                          >
                                            {env.name}: {env.description}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedServer.remotes &&
                      selectedServer.remotes.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Remote Access</h4>
                          <div className="space-y-2">
                            {selectedServer.remotes.map((remote, index) => (
                              <div key={index} className="bg-muted p-3 rounded">
                                <div className="text-sm font-medium mb-1">
                                  {remote.type?.toUpperCase()} Endpoint
                                </div>
                                <div className="text-sm font-mono mb-2">
                                  {remote.url}
                                </div>
                                {remote.headers &&
                                  remote.headers.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs font-medium mb-1">
                                        Required Headers:
                                      </div>
                                      {remote.headers.map(
                                        (header, headerIndex) => (
                                          <div
                                            key={headerIndex}
                                            className="text-xs text-muted-foreground"
                                          >
                                            {header.name}: {header.description}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedServer.status && (
                      <div>
                        <h4 className="font-semibold mb-2">Status</h4>
                        <Badge
                          variant={
                            selectedServer.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedServer.status}
                        </Badge>
                      </div>
                    )}

                    {selectedServer._meta?.[
                      "io.modelcontextprotocol.registry/official"
                    ] && (
                      <div>
                        <h4 className="font-semibold mb-2">Registry Info</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            ID:{" "}
                            {
                              selectedServer._meta[
                                "io.modelcontextprotocol.registry/official"
                              ].id
                            }
                          </div>
                          <div>
                            Published:{" "}
                            {new Date(
                              selectedServer._meta[
                                "io.modelcontextprotocol.registry/official"
                              ].published_at || "",
                            ).toLocaleDateString()}
                          </div>
                          <div>
                            Updated:{" "}
                            {new Date(
                              selectedServer._meta[
                                "io.modelcontextprotocol.registry/official"
                              ].updated_at || "",
                            ).toLocaleDateString()}
                          </div>
                          <div>
                            Latest:{" "}
                            {selectedServer._meta[
                              "io.modelcontextprotocol.registry/official"
                            ].is_latest
                              ? "Yes"
                              : "No"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="p-6 border-t">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddServer(selectedServer)}
                      className="flex-1"
                    >
                      Add This Server
                    </Button>
                    {selectedServer.repository?.url && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selectedServer.repository?.url, "_blank")
                        }
                      >
                        <ExternalLink className="size-4 mr-2" />
                        Visit Repository
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer with Pagination */}
      <div className="sticky bottom-0 z-10 bg-background border-t">
        <div className="px-8 max-w-6xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Items per page:
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {servers.length} servers
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage || loading}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNextPage || loading}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
