"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader } from "lucide-react";

const OrganizationSettings = () => {
  const [orgToken, setOrgToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [saving, setSaving] = useState(false);

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
    return orgToken || openaiApiKey;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <Label>Organization Token</Label>
        <div className="flex gap-2">
          <Input
            type={showToken ? "text" : "password"}
            value={orgToken}
            onChange={(e) => setOrgToken(e.target.value)}
            placeholder="Enter organization token"
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
        </div>
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
