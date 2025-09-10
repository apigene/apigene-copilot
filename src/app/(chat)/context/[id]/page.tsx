"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { ContextCreateRequest } from "@/types/context";
import { ApplicationData } from "@/types/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Edit, Eye, X } from "lucide-react";
import dynamic from "next/dynamic";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

// Dynamic import for MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false },
);

// Simple token counting function (approximation)
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

export default function ContextDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apiClient = useApigeneApi();

  const contextId = params.id as string;
  const isNewContext = contextId === "new";

  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch context data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch applications
        console.log("[ContextPage] Starting to fetch specs data...");
        const appsResponse = await apiClient.get("/api/specs", {
          queryParams: { include_all: true },
        });
        console.log("[ContextPage] Received specs data:", appsResponse);

        // Check if result is an array
        if (Array.isArray(appsResponse)) {
          setApplications(appsResponse);
          console.log(
            "[ContextPage] Set applications with",
            appsResponse.length,
            "items",
          );
        } else {
          console.error(
            "[ContextPage] Expected array but got:",
            typeof appsResponse,
            appsResponse,
          );
          throw new Error("Invalid data format received from API");
        }

        // Fetch context if editing existing one
        if (!isNewContext) {
          const contextResponse = await apiClient.get(
            `/api/context/${contextId}`,
          );
          setName(contextResponse.name);
          setDescription(contextResponse.description);
          setSelectedApps(contextResponse.apps || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contextId, isNewContext]); // Remove apiClient dependency to prevent infinite loop

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const contextData: ContextCreateRequest = {
        name,
        description,
        apps: selectedApps,
      };

      if (isNewContext) {
        await apiClient.post("/api/context", contextData);
      } else {
        await apiClient.put(`/api/context/${contextId}`, contextData);
      }

      router.push("/context");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save context");
    } finally {
      setSaving(false);
    }
  };

  const handleEditMode = () => {
    setIsEditMode(true);
  };

  const handleViewMode = () => {
    setIsEditMode(false);
  };

  const characterCount = description.length;
  const tokenCount = estimateTokens(description);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-4">Error: {error}</div>
            <Button onClick={() => router.push("/context")} variant="outline">
              Back to Contexts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <button
          onClick={() => router.push("/context")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Context
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">
          {isNewContext ? "New Context" : name || "Loading..."}
        </span>
      </div>
      {/* Name Section */}
      <Card>
        <CardHeader>
          <CardTitle>Context Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a descriptive name for this context"
          />
        </CardContent>
      </Card>

      {/* Applications Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            Associated Applications
            <span className="text-muted-foreground font-normal ml-2">
              ({selectedApps.length}/{applications.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Applications Display */}
            {selectedApps.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedApps.map((appName) => {
                  const app = applications.find((a) => a.api_name === appName);
                  return (
                    <div
                      key={appName}
                      className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={
                            app?.domain_url
                              ? `https://logo.clearbit.com/${app.domain_url}`
                              : ""
                          }
                          alt={app?.api_title || appName}
                        />
                        <AvatarFallback className="text-xs">
                          {app?.api_title?.charAt(0) || appName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {app?.api_title || appName}
                      </span>
                      <button
                        onClick={() =>
                          setSelectedApps(
                            selectedApps.filter((a) => a !== appName),
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Application Selector */}
            <Select
              onValueChange={(value) => {
                if (!selectedApps.includes(value)) {
                  setSelectedApps([...selectedApps, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select applications to associate with this context" />
              </SelectTrigger>
              <SelectContent>
                {applications
                  .filter((app) => !selectedApps.includes(app.api_name))
                  .map((app) => (
                    <SelectItem key={app.api_name} value={app.api_name}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-4 w-4">
                          <AvatarImage
                            src={
                              app.domain_url
                                ? `https://logo.clearbit.com/${app.domain_url}`
                                : ""
                            }
                            alt={app.api_title}
                          />
                          <AvatarFallback className="text-xs">
                            {app.api_title.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{app.api_title}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Instructions</CardTitle>
            <div className="flex items-center space-x-4">
              {/* Character and Token Counters */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">Characters:</span>
                  <span className="font-semibold">
                    {characterCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-muted-foreground">Tokens:</span>
                  <span className="font-semibold">
                    ~{tokenCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Edit/View Toggle */}
              {description && (
                <div className="flex space-x-2">
                  {!isEditMode ? (
                    <Button
                      onClick={handleEditMode}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      onClick={handleViewMode}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditMode || !description ? (
            <div className="h-[500px]" data-color-mode="dark">
              <MDEditor
                value={description}
                onChange={(val) => setDescription(val || "")}
                preview="live"
                height="100%"
                data-color-mode="dark"
                visibleDragbar={false}
                textareaProps={{
                  placeholder:
                    "Enter detailed instructions for this context (supports Markdown)",
                }}
              />
            </div>
          ) : (
            <div className="border rounded-lg bg-muted/50 p-6 min-h-[300px] max-h-[500px] overflow-auto">
              <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      {props.children}
                    </a>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold mb-2">{children}</h3>
                  ),
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="mb-3 list-disc list-inside">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 list-decimal list-inside">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-3">
                      {children}
                    </pre>
                  ),
                }}
              >
                {description}
              </Markdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="flex justify-end space-x-4">
          <Button onClick={() => router.push("/context")} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !name || selectedApps.length === 0 || !description || saving
            }
          >
            {saving
              ? "Saving..."
              : isNewContext
                ? "Create Context"
                : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
