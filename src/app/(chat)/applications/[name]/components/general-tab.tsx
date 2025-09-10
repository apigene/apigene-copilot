"use client";

import { useState } from "react";
import { ApplicationData } from "@/types/applications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GeneralTabProps {
  application: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => Promise<boolean>;
}

export function GeneralTab({ application, onUpdate }: GeneralTabProps) {
  const [formData, setFormData] = useState({
    server_url: application.server_url || "",
    domain_url: application.domain_url || "",
    domain: application.llm_summary?.domain || "",
    product_name: application.llm_summary?.product_name || "",
    summary: application.llm_summary?.summary || "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  // Validate URL
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty URL
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate URL when server_url changes
    if (field === "server_url") {
      setIsValidUrl(validateUrl(value));
    }

    // Reset status when user starts typing
    if (updateStatus !== "idle") {
      setUpdateStatus("idle");
      setErrorMessage("");
    }
  };

  // Handle form submission
  const handleUpdate = async () => {
    if (!isValidUrl) {
      setErrorMessage(
        "Invalid URL - please ensure the URL is correct and includes the protocol (http or https)",
      );
      setUpdateStatus("error");
      return;
    }

    setIsUpdating(true);
    setUpdateStatus("idle");
    setErrorMessage("");

    try {
      // Prepare update data
      const updateData: Partial<ApplicationData> = {
        server_url: formData.server_url,
        domain_url: formData.domain_url,
        llm_summary: {
          summary: formData.summary,
          keywords: application.llm_summary?.keywords || [],
          domain: formData.domain,
          product_name: formData.product_name,
        },
      };

      const success = await onUpdate(updateData);

      if (success) {
        setUpdateStatus("success");
        toast.success("Application settings updated successfully!");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Update failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update application settings. Please try again.",
      );
      setUpdateStatus("error");

      toast.error("Failed to update application settings. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Server URL */}
        <div className="space-y-2">
          <Label htmlFor="server_url">Server URL</Label>
          <Input
            id="server_url"
            type="url"
            value={formData.server_url}
            onChange={(e) => handleFieldChange("server_url", e.target.value)}
            placeholder="https://api.example.com"
            className={!isValidUrl ? "border-destructive" : ""}
          />
          {!isValidUrl && (
            <p className="text-sm text-destructive">
              Invalid URL - please ensure the URL is correct and includes the
              protocol (http or https)
            </p>
          )}
        </div>

        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* API Name */}
          <div className="space-y-2">
            <Label htmlFor="api_name">API Name</Label>
            <Input
              id="api_name"
              value={application.api_name || ""}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Read-only field</p>
          </div>

          {/* API Version */}
          <div className="space-y-2">
            <Label htmlFor="api_version">API Version</Label>
            <Input
              id="api_version"
              value={application.api_version || ""}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Read-only field</p>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => handleFieldChange("domain", e.target.value)}
              placeholder="e.g., SEO tools, Finance"
            />
          </div>

          {/* Domain URL */}
          <div className="space-y-2">
            <Label htmlFor="domain_url">Domain URL</Label>
            <Input
              id="domain_url"
              value={formData.domain_url}
              onChange={(e) => handleFieldChange("domain_url", e.target.value)}
              placeholder="https://example.com"
              readOnly={!!application.global_spec}
              className={application.global_spec ? "bg-muted" : ""}
            />
            {application.global_spec && (
              <p className="text-xs text-muted-foreground">
                Read-only for global specs
              </p>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="product_name">Product Name</Label>
          <Input
            id="product_name"
            value={formData.product_name}
            onChange={(e) => handleFieldChange("product_name", e.target.value)}
            placeholder="e.g., Site Explorer, Payment API"
          />
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            placeholder="Enter a brief description of this API..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Status Messages */}
        {updateStatus === "error" && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {updateStatus === "success" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Application settings updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Update Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || !isValidUrl}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
