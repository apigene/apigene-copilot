"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { toast } from "sonner";
import { Plus, Trash2, Loader } from "lucide-react";

interface AdditionalPersonalization {
  name: string;
  value: string;
}

const PersonalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [traits, setTraits] = useState("");
  const [additionalPersonalization, setAdditionalPersonalization] = useState<
    AdditionalPersonalization[]
  >([]);

  const apiClient = useApigeneApi();

  const fetchUserSettings = async () => {
    try {
      const response = await apiClient.get("/api/user/settings");
      if (response.personal_context) {
        setName(response.personal_context.name || "");
        setPosition(response.personal_context.position || "");
        setTraits(response.personal_context.traits || "");
        setAdditionalPersonalization(
          response.personal_context.additional_personalization || [],
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveUserSettings = async () => {
    try {
      setSaving(true);
      await apiClient.post("/api/user/settings/update", {
        personal_context: {
          name,
          position,
          traits,
          additional_personalization: additionalPersonalization.filter(
            (field) => field.name && field.value,
          ),
        },
      });
      toast.success("Personal context updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update personal context. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addPersonalizationField = () => {
    setAdditionalPersonalization([
      ...additionalPersonalization,
      { name: "", value: "" },
    ]);
  };

  const removePersonalizationField = (index: number) => {
    setAdditionalPersonalization(
      additionalPersonalization.filter((_, i) => i !== index),
    );
  };

  const updatePersonalizationField = (
    index: number,
    field: "name" | "value",
    value: string,
  ) => {
    const updated = [...additionalPersonalization];
    updated[index][field] = value;
    setAdditionalPersonalization(updated);
  };

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const hasChanges = () => {
    // This would need to track original values to determine if there are changes
    return true; // For now, always show save button
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2">
          <Label>What should Apigene call you?</Label>
          <Skeleton className="h-9" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>What do you do?</Label>
          <Skeleton className="h-9" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>What characteristics should Apigene Co-pilot have?</Label>
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <Label>What should Apigene call you?</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>What do you do?</Label>
        <Input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Enter your position or role"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>What characteristics should Apigene Co-pilot have?</Label>
        <Textarea
          value={traits}
          onChange={(e) => setTraits(e.target.value)}
          placeholder="Enter the key characteristics you want Apigene Co-pilot to have, such as clarity, creativity, empathy, efficiency, or formality. You can also specify tone, depth of responses, or interaction style to tailor the AI's behavior to your needs."
          className="h-32 resize-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Additional Personalization</Label>
        <div className="space-y-4">
          {additionalPersonalization.map((field, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  value={field.name}
                  onChange={(e) =>
                    updatePersonalizationField(index, "name", e.target.value)
                  }
                  placeholder="Field name"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={field.value}
                  onChange={(e) =>
                    updatePersonalizationField(index, "value", e.target.value)
                  }
                  placeholder="Field value"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removePersonalizationField(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addPersonalizationField}
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add field
          </Button>
        </div>
      </div>

      {hasChanges() && (
        <div className="flex pt-4 items-center justify-end fade-in animate-in duration-300">
          <Button variant="ghost">Cancel</Button>
          <Button disabled={saving} onClick={saveUserSettings}>
            Save Changes
            {saving && <Loader className="size-4 ml-2 animate-spin" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PersonalSettings;
