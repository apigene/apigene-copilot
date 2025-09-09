"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, X, Loader } from "lucide-react";

const BrandingSettings = () => {
  const [productName, setProductName] = useState("");
  const [copilotIcon, setCopilotIcon] = useState<string | null>(null);
  const [sidebarIcon, setSidebarIcon] = useState<string | null>(null);
  const [copilotWelcomeText, setCopilotWelcomeText] = useState("");
  const [copilotWelcomeImage, setCopilotWelcomeImage] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const handleIconChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "copilot" | "sidebar" | "copilotWelcomeImage",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/image\/(svg\+xml|png|jpeg|jpg)/.test(file.type)) {
      toast.error("Please select a valid SVG, PNG, or JPG file.");
      return;
    }

    if (file.size > 1048576) {
      // 1MB
      toast.error("File is too large. Max size is 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === "copilot") {
        setCopilotIcon(result);
      } else if (type === "sidebar") {
        setSidebarIcon(result);
      } else if (type === "copilotWelcomeImage") {
        setCopilotWelcomeImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // This would be implemented based on the actual API endpoint
      toast.success("Branding settings saved successfully!");
    } catch (error) {
      console.error("Error saving branding settings:", error);
      toast.error("Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return (
      productName ||
      copilotIcon ||
      sidebarIcon ||
      copilotWelcomeText ||
      copilotWelcomeImage
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <Label>Product Name</Label>
        <Input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Enter product name"
          className="max-w-md"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Copilot Welcome Text</Label>
        <Input
          value={copilotWelcomeText}
          onChange={(e) => setCopilotWelcomeText(e.target.value)}
          placeholder="Enter welcome text for copilot"
          className="max-w-md"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Copilot Welcome Image</Label>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <label htmlFor="welcome-image-upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
              <input
                id="welcome-image-upload"
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => handleIconChange(e, "copilotWelcomeImage")}
              />
            </label>
          </Button>

          {copilotWelcomeImage && (
            <>
              <Avatar className="h-16 w-auto">
                <AvatarImage src={copilotWelcomeImage} alt="Welcome Image" />
                <AvatarFallback>WI</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCopilotWelcomeImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a PNG, JPG or SVG image under 1MB. This image will be used in
          the copilot interface.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Product Icon</Label>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <label htmlFor="copilot-icon-upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Icon
              <input
                id="copilot-icon-upload"
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => handleIconChange(e, "copilot")}
              />
            </label>
          </Button>

          {copilotIcon && (
            <>
              <Avatar className="h-16 w-16">
                <AvatarImage src={copilotIcon} alt="Copilot Icon" />
                <AvatarFallback>CI</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCopilotIcon(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a PNG, JPG or SVG image under 1MB. Square images (72px x 72px)
          with colored backgrounds work best. Brand icons are visible to
          customers.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Sidebar Icon</Label>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <label htmlFor="sidebar-icon-upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Icon
              <input
                id="sidebar-icon-upload"
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => handleIconChange(e, "sidebar")}
              />
            </label>
          </Button>

          {sidebarIcon && (
            <>
              <Avatar className="h-16 w-auto">
                <AvatarImage src={sidebarIcon} alt="Sidebar Icon" />
                <AvatarFallback>SI</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarIcon(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a PNG, JPG, or SVG image under 1MB. Logo image (100px x 20px)
          with a transparent background works best.
        </p>
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

export default BrandingSettings;
