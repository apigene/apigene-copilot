"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CloudUpload,
  Link,
  CheckCircle,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InstallApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (apiName: string) => void;
}

const InstallApplicationDialog: React.FC<InstallApplicationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const _router = useRouter();
  const [activeTab, setActiveTab] = useState("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  const [error, setError] = useState("");
  const [installedApiName, setInstalledApiName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiClient = useApigeneApi();

  const steps = [
    "Installing Application",
    "Creating Agentic Metadata",
    "Finalizing Setup",
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError("");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError("");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInstall = async () => {
    setError("");
    setIsInstalling(true);
    setInstallStep(0);

    try {
      let result: any;

      if (activeTab === "url") {
        // Install from URL
        if (!url.trim()) {
          throw new Error("Please enter a valid URL");
        }
        if (!validateUrl(url)) {
          throw new Error("Please enter a valid URL format");
        }

        setInstallStep(1);
        result = await apiClient.post("/api/specs/from-url", {
          url: url.trim(),
          global_spec: false,
          shared_security_info: false,
        });
      } else {
        // Install from file
        if (!file) {
          throw new Error("Please select a file");
        }

        setInstallStep(1);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("global_spec", "false");
        formData.append("shared_security_info", "false");

        result = await apiClient.post("/api/specs/from-file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      const apiName = result?.api_name;
      if (!apiName) {
        throw new Error("Failed to get API name from installation");
      }

      setInstalledApiName(apiName);

      // Create agentic metadata
      setInstallStep(2);
      await apiClient.post(`/api/specs/${apiName}/agentic-metadata`, []);

      setInstallStep(3);

      // Small delay to show completion
      setTimeout(() => {
        onSuccess(apiName);
        handleClose();
      }, 1000);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || err?.message || "Installation failed",
      );
      setIsInstalling(false);
      setInstallStep(0);
    }
  };

  const handleClose = () => {
    if (!isInstalling) {
      setActiveTab("url");
      setUrl("");
      setFile(null);
      setFileName("");
      setError("");
      setInstallStep(0);
      setInstalledApiName("");
      onClose();
    }
  };

  const isFormValid = () => {
    if (activeTab === "url") {
      return url.trim() && validateUrl(url);
    } else {
      return file !== null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5" />
            Install New Application
          </DialogTitle>
          <DialogDescription>
            Install a new application by providing an OpenAPI specification URL
            or uploading a file.
          </DialogDescription>
        </DialogHeader>

        {isInstalling ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">
                {installStep < 3
                  ? steps[installStep]
                  : "Installation Complete!"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {installStep < 3
                  ? "Please wait while we set up your application..."
                  : `Successfully installed ${installedApiName}`}
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={(installStep / 3) * 100} className="h-2" />
              <div className="flex justify-center gap-2">
                {steps.map((_, index) => (
                  <Badge
                    key={index}
                    variant={index <= installStep ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {index + 1}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  From URL
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  From File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">OpenAPI Specification URL</Label>
                  <Input
                    id="url"
                    placeholder="https://api.example.com/openapi.json"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the URL of an OpenAPI specification file (JSON or
                    YAML)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="file" className="space-y-4">
                <div className="space-y-2">
                  <Label>OpenAPI Specification File</Label>
                  <Card
                    className="border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CardContent className="p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.yaml,.yml"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                      />
                      {file ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                          <p className="font-medium">{fileName}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile();
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="font-medium">Click to select file</p>
                          <p className="text-sm text-muted-foreground">
                            Supports JSON, YAML files
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!isInstalling && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleInstall} disabled={!isFormValid()}>
              Install
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstallApplicationDialog;
