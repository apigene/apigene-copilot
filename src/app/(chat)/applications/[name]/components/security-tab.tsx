"use client";

import { useState, useEffect } from "react";
import { ApplicationData } from "@/types/applications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  X,
  Lightbulb,
  Edit3,
  Save,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { Markdown } from "@/components/markdown";

interface SecurityTabProps {
  application: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => Promise<boolean>;
}

interface SecurityInfo {
  [schemeName: string]: {
    [key: string]: any;
  };
}

export function SecurityTab({ application, onUpdate }: SecurityTabProps) {
  const apiClient = useApigeneApi();
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo>(
    application.security_info || {},
  );
  const [selectedScheme, setSelectedScheme] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Security instructions state
  const [showInstructions, setShowInstructions] = useState(false);
  const [editInstructions, setEditInstructions] = useState(false);
  const [instructionsLoading, setInstructionsLoading] = useState(false);
  const [instructions, setInstructions] = useState("");

  // Set selected scheme when security info changes
  useEffect(() => {
    const schemes = Object.keys(securityInfo);
    if (!schemes.includes(selectedScheme)) {
      setSelectedScheme(schemes.length > 0 ? schemes[0] : "");
    }
  }, [securityInfo, selectedScheme]);

  // Fetch security instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      if (!application.api_name) return;

      setInstructionsLoading(true);
      try {
        const response = await apiClient.specGetInstructions(
          application.api_name,
        );
        setInstructions(response || "");
      } catch (error) {
        console.error("Error fetching security instructions:", error);
        setInstructions("");
      } finally {
        setInstructionsLoading(false);
      }
    };

    fetchInstructions();
  }, [application.api_name, apiClient]);

  // Handle security scheme selection
  const handleSecuritySchemeChange = (scheme: string) => {
    setSelectedScheme(scheme);
    setUpdateStatus("idle");
    setErrorMessage("");
  };

  // Handle field changes
  const handleSecurityInfoChange = (key: string, value: any) => {
    const newSecurityInfo = {
      ...securityInfo,
      [selectedScheme]: {
        ...securityInfo[selectedScheme],
        [key]: value,
      },
    };
    setSecurityInfo(newSecurityInfo);
    setUpdateStatus("idle");
    setErrorMessage("");
  };

  // Security instructions handlers
  const handleViewInstructions = () => {
    setShowInstructions(!showInstructions);
    setEditInstructions(false);
  };

  const handleEditInstructions = () => {
    setEditInstructions(true);
    setShowInstructions(false);
  };

  const handleSaveInstructions = async () => {
    try {
      await apiClient.specCreateInstructions({
        api_name: application.api_name,
        instructions: instructions,
      });
      setEditInstructions(false);
      setShowInstructions(true);
      toast.success("Security instructions updated successfully!");
    } catch (error) {
      console.error("Failed to update security instructions:", error);
      toast.error("Failed to update security instructions");
    }
  };

  const handleCancelEdit = () => {
    setEditInstructions(false);
  };

  // Handle form submission
  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus("idle");
    setErrorMessage("");

    try {
      const updateData: Partial<ApplicationData> = {
        security_info: securityInfo,
        security_info_configured: Object.keys(securityInfo).length > 0,
      };

      const success = await onUpdate(updateData);

      if (success) {
        setUpdateStatus("success");
        toast.success("Security configuration updated successfully!");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Update failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update security configuration. Please try again.",
      );
      setUpdateStatus("error");

      toast.error("Failed to update security configuration. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const schemes = Object.keys(securityInfo);

  return (
    <div className="space-y-6">
      {/* Security Configuration Form */}
      {schemes.length > 0 && (
        <Card>
          <CardContent className="space-y-6">
            {/* Security Scheme Selector */}
            <div className="space-y-2">
              <Label htmlFor="security-scheme">Security Scheme</Label>
              <Select
                value={selectedScheme}
                onValueChange={handleSecuritySchemeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a security scheme" />
                </SelectTrigger>
                <SelectContent>
                  {schemes.map((schemeName) => (
                    <SelectItem key={schemeName} value={schemeName}>
                      {schemeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Fields */}
            {selectedScheme !== "" && securityInfo[selectedScheme] && (
              <div className="space-y-4">
                {Object.entries(securityInfo[selectedScheme]).map(
                  ([key, value]) => (
                    <div key={key}>
                      {key === "scopes" ? (
                        <div className="space-y-2">
                          <Label>Scopes</Label>
                          <div className="space-y-2">
                            {((value as string[]) || []).map((scope, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={scope}
                                  onChange={(e) => {
                                    const newScopes = [
                                      ...((value as string[]) || []),
                                    ];
                                    newScopes[index] = e.target.value;
                                    handleSecurityInfoChange(key, newScopes);
                                  }}
                                  placeholder="Enter scope name..."
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newScopes = (
                                      (value as string[]) || []
                                    ).filter((_, i) => i !== index);
                                    handleSecurityInfoChange(key, newScopes);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const newScopes = [
                                    ...((value as string[]) || []),
                                    "",
                                  ];
                                  handleSecurityInfoChange(key, newScopes);
                                }}
                              >
                                Add Scope
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleSecurityInfoChange(key, [])
                                }
                              >
                                Clear All Scopes
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor={key}>{key}</Label>
                          {typeof value === "string" && value.length > 100 ? (
                            <Textarea
                              id={key}
                              value={value}
                              onChange={(e) =>
                                handleSecurityInfoChange(key, e.target.value)
                              }
                              rows={3}
                            />
                          ) : (
                            <Input
                              id={key}
                              type={
                                key.toLowerCase().includes("password") ||
                                key.toLowerCase().includes("secret")
                                  ? "password"
                                  : "text"
                              }
                              value={value}
                              onChange={(e) =>
                                handleSecurityInfoChange(key, e.target.value)
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Security Configuration Message */}
      {schemes.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Security Configuration
              </h3>
              <p className="text-muted-foreground mb-4">
                This API doesn&apos;t have any security configuration defined.
                Security settings are typically configured when the API is first
                imported or set up.
              </p>
              <p className="text-sm text-muted-foreground">
                If you need to add security configuration, please contact your
                API administrator or check the API specification source.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
            Security configuration updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Update Button */}
      {schemes.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Security"
            )}
          </Button>
        </div>
      )}

      {/* Security Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Security Instructions
            </CardTitle>
            <div className="flex gap-2">
              {instructions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewInstructions}
                  className="flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  {showInstructions ? "Hide Instructions" : "View Instructions"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditInstructions}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                {instructions ? "Edit Instructions" : "Add Instructions"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {editInstructions && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">
                Security Instructions (Markdown)
              </Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter security instructions in Markdown format..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveInstructions}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Instructions
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        )}

        {showInstructions && !editInstructions && (
          <CardContent>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(false)}
                className="absolute top-0 right-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {instructionsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading instructions...
                  </div>
                ) : instructions ? (
                  <Markdown>{instructions}</Markdown>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No security instructions available.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}

        {!showInstructions && !editInstructions && !instructions && (
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No security instructions have been added yet. Click &quot;Add
              Instructions&quot; to create some.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
