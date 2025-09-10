"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Link, Loader2 } from "lucide-react";
import { toast } from "sonner";

enum ImportOptions {
  URL = "url",
  File = "file",
}

export default function NewApplicationPage() {
  const router = useRouter();
  const apiClient = useApigeneApi();

  const [importType, setImportType] = useState<ImportOptions | null>(null);
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGlobalSpec, setIsGlobalSpec] = useState(false);
  const [showGlobalSpecOption, setShowGlobalSpecOption] = useState(false);

  const isFileImportType = importType === ImportOptions.File;

  const handleImportChange = (type: ImportOptions) => {
    setImportType(type);
    setUrl("");
    setSelectedFile(null);
    setError("");
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setError("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event?.target?.files?.[0]) {
      const file = event.target.files[0];
      setImportType(ImportOptions.File);
      setSelectedFile(file);
      setError("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " Bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleSpecProcessError = (error: any) => {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      setError(
        "Error during import: " +
          (error.response.data.detail || "Unknown error"),
      );
    } else if (error.request) {
      console.error("Error request data:", error.request);
      setError("Error during import: No response received from the server.");
    } else {
      console.error("Error message:", error.message);
      setError("Error during import: " + error.message);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    if (isFileImportType) {
      if (!selectedFile) {
        setError("Please select a file");
        setLoading(false);
        return;
      }
      try {
        console.log("Submitting file:", selectedFile);
        console.log("Global spec:", isGlobalSpec);
        const response: any = await apiClient.specCreateFromFile({
          file: selectedFile,
          global_spec: isGlobalSpec,
        });
        console.log("Response:", response);
        setLoading(false);
        setSelectedFile(null);
        toast.success("Application created successfully!");
        router.push(`/applications/${response.api_name}`);
      } catch (error) {
        console.error("Error creating spec from FILE", error);
        handleSpecProcessError(error);
        setLoading(false);
      }
    } else {
      if (!url) {
        setError("Please enter a URL");
        setLoading(false);
        return;
      }
      try {
        const response: any = await apiClient.specCreateFromUrl({
          url,
          global_spec: isGlobalSpec,
        });
        toast.success("Application created successfully!");
        router.push(`/applications/${response.api_name}`);
        setLoading(false);
        setUrl("");
      } catch (error) {
        console.error("Error creating spec from URL", error);
        handleSpecProcessError(error);
        setLoading(false);
      }
    }
  };

  // Check user features to show global spec option
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await apiClient.get("/api/user/me");
        if (userData?.features?.apigene_internal_features) {
          setShowGlobalSpecOption(true);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, [apiClient]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/applications")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Applications
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Application</h1>
        <p className="text-muted-foreground">
          Choose how you want to import your OpenAPI specification
        </p>
      </div>

      <div className="space-y-6">
        {/* Import Method Selection - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            onClick={() => handleImportChange(ImportOptions.URL)}
            className={`cursor-pointer transition-colors ${
              importType === ImportOptions.URL
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Link className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Import from URL</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the URL of the OpenAPI specification
              </p>
            </CardHeader>
          </Card>

          <label htmlFor="file-input" className="cursor-pointer">
            <Card
              className={`transition-colors h-full ${
                importType === ImportOptions.File
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Upload a file</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose a JSON or YAML file
                </p>
              </CardHeader>
              <input
                type="file"
                id="file-input"
                hidden
                onClick={(event) => (event.currentTarget.value = "")}
                onChange={handleFileChange}
                accept=".json,.yaml,.yml"
              />
            </Card>
          </label>
        </div>

        {/* Import Form - Nested Container */}
        {(importType === ImportOptions.URL ||
          importType === ImportOptions.File) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isFileImportType
                  ? "Upload OpenAPI Specification"
                  : "Import from URL"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spec-input">
                  {isFileImportType ? "OpenAPI Spec File" : "OpenAPI Spec URL"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="spec-input"
                    value={
                      isFileImportType && selectedFile
                        ? `${selectedFile.name} - ${formatFileSize(selectedFile.size)}`
                        : url
                    }
                    onChange={handleUrlChange}
                    disabled={isFileImportType || loading}
                    placeholder={
                      isFileImportType
                        ? "Select a file to upload"
                        : "https://api.example.com/openapi.json"
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={(!selectedFile && !url) || loading}
                    className="px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Application"
                    )}
                  </Button>
                </div>
              </div>

              {showGlobalSpecOption && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="global-spec"
                    checked={isGlobalSpec}
                    onCheckedChange={(checked) =>
                      setIsGlobalSpec(checked as boolean)
                    }
                  />
                  <Label htmlFor="global-spec">Install as global spec</Label>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
