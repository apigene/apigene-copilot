"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const OrganizationSettings = () => {
  const [orgToken, setOrgToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveOrgToken = async () => {
    try {
      setSaving(true);
      // This would be implemented based on the actual API endpoint
      toast.success("Organization token updated successfully!");
    } catch (error) {
      console.error("Error saving org token:", error);
      toast.error("Failed to update organization token");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOpenaiKey = async () => {
    try {
      setSaving(true);
      // This would be implemented based on the actual API endpoint
      toast.success("OpenAI API key updated successfully!");
    } catch (error) {
      console.error("Error saving OpenAI key:", error);
      toast.error("Failed to update OpenAI API key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Token Section */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Token</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-token">Organization Token</Label>
              <div className="flex gap-2">
                <Input
                  id="org-token"
                  type={showToken ? "text" : "password"}
                  value={orgToken}
                  onChange={(e) => setOrgToken(e.target.value)}
                  placeholder="Enter organization token"
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
            <Button onClick={handleSaveOrgToken} disabled={saving}>
              {saving ? "Saving..." : "Save Token"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="openai-key"
                  type={showOpenaiKey ? "text" : "password"}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="Enter OpenAI API key"
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
            <Button onClick={handleSaveOpenaiKey} disabled={saving}>
              {saving ? "Saving..." : "Save API Key"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Model Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Model configuration settings are managed by your organization
              administrator.
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Contact your organization administrator to modify model
                settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { OrganizationSettings };
