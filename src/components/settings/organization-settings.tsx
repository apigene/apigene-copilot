"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader, Copy, RefreshCw } from "lucide-react";
import { useApigeneApi } from "@/lib/api/apigene-client";

// Token duration options in seconds
const TOKEN_DURATION_OPTIONS = [
  { label: "1 day", value: 24 * 60 * 60 }, // 24 hours
  { label: "1 week", value: 7 * 24 * 60 * 60 }, // 7 days
  { label: "1 month", value: 30 * 24 * 60 * 60 }, // 30 days
  { label: "1 year", value: 365 * 24 * 60 * 60 }, // 365 days
];

const OrganizationSettings = () => {
  const [orgToken, setOrgToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(
    TOKEN_DURATION_OPTIONS[0].value,
  );
  const [orgName, setOrgName] = useState<string | null>(null);

  const { get, post } = useApigeneApi();

  // Fetch organization name on component mount
  useEffect(() => {
    const fetchOrgName = async () => {
      try {
        const userData = await get("/api/user/me");
        if (userData.org_id) {
          setOrgName(userData.org_id);
        }
      } catch (error) {
        console.error("Failed to fetch organization details:", error);
        toast.error("Failed to fetch organization details");
      }
    };

    fetchOrgName();
  }, [get]);

  const handleGenerateToken = async () => {
    if (!orgName) {
      toast.error("Organization name could not be fetched");
      return;
    }

    try {
      setGeneratingToken(true);
      const response = await post(
        `/api/org/organization/${orgName}/generate_token`,
        {},
        {
          expiry_duration: selectedDuration,
        },
      );

      if (response.org_token) {
        setOrgToken(response.org_token);
        toast.success("Token generated successfully!");
      }
    } catch (error: any) {
      console.error("Failed to generate token:", error);
      toast.error(
        "Failed to generate token: " + (error.message || "Unknown error"),
      );
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyToken = async () => {
    if (!orgToken) return;

    try {
      await navigator.clipboard.writeText(orgToken);
      toast.success("Token copied to clipboard!");
    } catch (_error) {
      toast.error("Failed to copy token");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // This would be implemented based on the actual API endpoint
      toast.success("Organization settings updated successfully!");
    } catch (error) {
      console.error("Error saving organization settings:", error);
      toast.error("Failed to update organization settings");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return openaiApiKey;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <Label>Organization Token</Label>
        {orgToken ? (
          <div className="flex gap-2">
            <Input
              type={showToken ? "text" : "password"}
              value={orgToken}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={handleCopyToken}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleGenerateToken}
              disabled={generatingToken}
            >
              {generatingToken ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Select
              value={selectedDuration.toString()}
              onValueChange={(value) => setSelectedDuration(Number(value))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_DURATION_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerateToken}
              disabled={generatingToken || !orgName}
            >
              {generatingToken ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Token"
              )}
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Generate a new organization token with custom expiry duration. The
          token will be scoped to your organization.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>OpenAI API Key</Label>
        <div className="flex gap-2">
          <Input
            type={showOpenaiKey ? "text" : "password"}
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="Enter OpenAI API key"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowOpenaiKey(!showOpenaiKey)}
          >
            {showOpenaiKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Model Settings</Label>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Model configuration settings are managed by your organization
            administrator. Contact your organization administrator to modify
            model settings.
          </p>
        </div>
      </div>

      {hasChanges() && (
        <div className="flex pt-4 items-center justify-end fade-in animate-in duration-300">
          <Button variant="ghost">Cancel</Button>
          <Button disabled={saving} onClick={handleSave}>
            Save Changes
            {saving && <Loader className="size-4 ml-2 animate-spin" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrganizationSettings;
