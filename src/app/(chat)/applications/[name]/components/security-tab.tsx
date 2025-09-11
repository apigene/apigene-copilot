"use client";

import { useState, useEffect } from "react";
import { ApplicationData } from "@/types/applications";
import { Card, CardContent } from "@/components/ui/card";
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
import { AlertCircle, CheckCircle, Loader2, Shield, X } from "lucide-react";
import { toast } from "sonner";

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
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo>(
    application.security_info || {},
  );
  const [selectedScheme, setSelectedScheme] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Set selected scheme when security info changes
  useEffect(() => {
    const schemes = Object.keys(securityInfo);
    if (!schemes.includes(selectedScheme)) {
      setSelectedScheme(schemes.length > 0 ? schemes[0] : "");
    }
  }, [securityInfo, selectedScheme]);

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
    </div>
  );
}
