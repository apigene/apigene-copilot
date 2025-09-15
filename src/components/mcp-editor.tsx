"use client";
import { useState, useMemo } from "react";
import {
  MCPServerConfig,
  MCPRemoteConfigZodSchema,
  MCPStdioConfigZodSchema,
} from "app-types/mcp";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import JsonView from "./ui/json-view";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { useRouter } from "next/navigation";
import { createDebounce, fetcher, isNull, safeJSONParse } from "lib/utils";
import { handleErrorWithToast } from "ui/shared-toast";
import { mutate } from "swr";
import { Loader, Plus, X } from "lucide-react";
import {
  isMaybeMCPServerConfig,
  isMaybeRemoteConfig,
} from "lib/ai/mcp/is-mcp-config";

import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { existMcpClientByServerNameAction } from "@/app/api/mcp/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface MCPEditorProps {
  initialConfig?: MCPServerConfig;
  name?: string;
  id?: string;
}

const STDIO_ARGS_ENV_PLACEHOLDER = `/** STDIO Example */
{
  "command": "node", 
  "args": ["index.js"],
  "env": {
    "OPENAI_API_KEY": "sk-...",
  }
}

/** SSE,Streamable HTTP Example */
{
  "url": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer sk-..."
  }
}`;

interface HeaderPair {
  key: string;
  value: string;
}

export default function MCPEditor({
  initialConfig,
  name: initialName,
  id,
}: MCPEditorProps) {
  const t = useTranslations();
  const shouldInsert = useMemo(() => isNull(id), [id]);

  const [isLoading, setIsLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const errorDebounce = useMemo(() => createDebounce(), []);

  // State for form fields
  const [name, setName] = useState<string>(initialName ?? "");
  const router = useRouter();
  const [config, setConfig] = useState<MCPServerConfig>(
    initialConfig as MCPServerConfig,
  );
  const [jsonString, setJsonString] = useState<string>(
    initialConfig ? JSON.stringify(initialConfig, null, 2) : "",
  );

  // New form fields for URL-based configuration
  const [serverUrl, setServerUrl] = useState<string>(
    initialConfig && "url" in initialConfig ? initialConfig.url : "",
  );
  const [headers, setHeaders] = useState<HeaderPair[]>(
    initialConfig && "url" in initialConfig && initialConfig.headers
      ? Object.entries(initialConfig.headers).map(([key, value]) => ({
          key,
          value,
        }))
      : [{ key: "", value: "" }],
  );

  // Name validation schema
  const nameSchema = z.string().regex(/^[a-zA-Z0-9\-]+$/, {
    message: t("MCP.nameMustContainOnlyAlphanumericCharactersAndHyphens"),
  });

  // URL validation schema
  const urlSchema = z.string().url({
    message: "Please enter a valid URL",
  });

  const validateName = (nameValue: string): boolean => {
    const result = nameSchema.safeParse(nameValue);
    if (!result.success) {
      setNameError(
        t("MCP.nameMustContainOnlyAlphanumericCharactersAndHyphens"),
      );
      return false;
    }
    setNameError(null);
    return true;
  };

  const validateUrl = (urlValue: string): boolean => {
    if (!urlValue.trim()) {
      setUrlError("Server URL is required");
      return false;
    }
    const result = urlSchema.safeParse(urlValue);
    if (!result.success) {
      setUrlError("Please enter a valid URL");
      return false;
    }
    setUrlError(null);
    return true;
  };

  // Convert form data to MCP config
  const convertFormToConfig = (): MCPServerConfig | null => {
    if (!serverUrl.trim()) return null;

    const headersObj: Record<string, string> = {};
    headers.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        headersObj[key.trim()] = value.trim();
      }
    });

    return {
      url: serverUrl.trim(),
      headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
    };
  };

  // Update config when form fields change
  const updateConfigFromForm = () => {
    const newConfig = convertFormToConfig();
    if (newConfig) {
      setConfig(newConfig);
      setJsonString(JSON.stringify(newConfig, null, 2));
    }
  };

  const saveDisabled = useMemo(() => {
    return (
      name.trim() === "" ||
      serverUrl.trim() === "" ||
      isLoading ||
      !!jsonError ||
      !!nameError ||
      !!urlError ||
      !isMaybeMCPServerConfig(config)
    );
  }, [isLoading, jsonError, nameError, urlError, config, name, serverUrl]);

  // Header management functions
  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  // Validate
  const validateConfig = (jsonConfig: unknown): boolean => {
    const result = isMaybeRemoteConfig(jsonConfig)
      ? MCPRemoteConfigZodSchema.safeParse(jsonConfig)
      : MCPStdioConfigZodSchema.safeParse(jsonConfig);
    if (!result.success) {
      handleErrorWithToast(result.error, "mcp-editor-error");
    }
    return result.success;
  };

  // Handle save button click
  const handleSave = async () => {
    // Update config from form before validation
    updateConfigFromForm();

    // Perform validation
    if (!validateConfig(config)) return;
    if (!name) {
      return handleErrorWithToast(
        new Error(t("MCP.nameIsRequired")),
        "mcp-editor-error",
      );
    }

    if (!validateName(name)) {
      return handleErrorWithToast(
        new Error(t("MCP.nameMustContainOnlyAlphanumericCharactersAndHyphens")),
        "mcp-editor-error",
      );
    }

    if (!validateUrl(serverUrl)) {
      return handleErrorWithToast(
        new Error("Please enter a valid server URL"),
        "mcp-editor-error",
      );
    }

    safe(() => setIsLoading(true))
      .map(async () => {
        if (shouldInsert) {
          const exist = await existMcpClientByServerNameAction(name);
          if (exist) {
            throw new Error(t("MCP.nameAlreadyExists"));
          }
        }
      })
      .map(() =>
        fetcher("/api/mcp", {
          method: "POST",
          body: JSON.stringify({
            name,
            config,
            id,
          }),
        }),
      )
      .ifOk(() => {
        toast.success(t("MCP.configurationSavedSuccessfully"));
        mutate("/api/mcp/list");
        router.push("/mcp");
      })
      .ifFail(handleErrorWithToast)
      .watch(() => setIsLoading(false));
  };

  const handleConfigChange = (data: string) => {
    setJsonString(data);
    const result = safeJSONParse(data);
    errorDebounce.clear();
    if (result.success) {
      setConfig(result.value as MCPServerConfig);
      setJsonError(null);
    } else if (data.trim() !== "") {
      errorDebounce(() => {
        setJsonError(
          (result.error as Error)?.message ??
            JSON.stringify(result.error, null, 2),
        );
      }, 1000);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            disabled={!shouldInsert}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value) validateName(e.target.value);
            }}
            placeholder={t("MCP.enterMcpServerName")}
            className={nameError ? "border-destructive" : ""}
          />
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>

        {/* Configuration tabs */}
        <div className="space-y-4">
          <Label htmlFor="config">Configuration</Label>
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Server Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your MCP server using a simple form interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Server URL */}
                  <div className="space-y-2">
                    <Label htmlFor="server-url">Server URL *</Label>
                    <Input
                      id="server-url"
                      type="url"
                      value={serverUrl}
                      onChange={(e) => {
                        setServerUrl(e.target.value);
                        validateUrl(e.target.value);
                        updateConfigFromForm();
                      }}
                      placeholder="https://api.example.com/mcp"
                      className={urlError ? "border-destructive" : ""}
                    />
                    {urlError && (
                      <p className="text-xs text-destructive">{urlError}</p>
                    )}
                  </div>

                  {/* Headers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Headers (Optional)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addHeader}
                        className="h-8"
                      >
                        <Plus className="size-3 mr-1" />
                        Add Header
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {headers.map((header, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Header name"
                            value={header.key}
                            onChange={(e) => {
                              updateHeader(index, "key", e.target.value);
                              updateConfigFromForm();
                            }}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Header value"
                            value={header.value}
                            onChange={(e) => {
                              updateHeader(index, "value", e.target.value);
                              updateConfigFromForm();
                            }}
                            className="flex-1"
                          />
                          {headers.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeHeader(index)}
                              className="h-10 px-2"
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">JSON Configuration</CardTitle>
                  <CardDescription>
                    Configure your MCP server using raw JSON (advanced)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Split view for config editor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left side: Textarea for editing */}
                    <div className="space-y-2">
                      <Textarea
                        id="config-editor"
                        value={jsonString}
                        onChange={(e) => handleConfigChange(e.target.value)}
                        className="font-mono h-[40vh] resize-none overflow-y-auto"
                        placeholder={STDIO_ARGS_ENV_PLACEHOLDER}
                      />
                    </div>

                    {/* Right side: JSON view */}
                    <div className="space-y-2 hidden sm:block">
                      <div className="border border-input rounded-md p-4 h-[40vh] overflow-auto relative bg-secondary">
                        <Label
                          htmlFor="config-view"
                          className="text-xs text-muted-foreground mb-2"
                        >
                          preview
                        </Label>
                        <JsonView data={config} initialExpandDepth={3} />
                        {jsonError && jsonString && (
                          <div className="absolute w-full bottom-0 right-0 px-2 pb-2 animate-in fade-in-0 duration-300">
                            <Alert
                              variant="destructive"
                              className="border-destructive"
                            >
                              <AlertTitle className="text-xs font-semibold">
                                Parsing Error
                              </AlertTitle>
                              <AlertDescription className="text-xs">
                                {jsonError}
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" disabled={saveDisabled}>
          {isLoading ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <span className="font-bold">{t("MCP.saveConfiguration")}</span>
          )}
        </Button>
      </div>
    </>
  );
}
