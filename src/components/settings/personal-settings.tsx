"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Name Section */}
      <Card>
        <CardHeader>
          <CardTitle>What should Apigene call you?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Position Section */}
      <Card>
        <CardHeader>
          <CardTitle>What do you do?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Enter your position or role"
            />
          </div>
        </CardContent>
      </Card>

      {/* Traits Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            What characteristics should Apigene Co-pilot have?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="traits">Traits</Label>
            <Textarea
              id="traits"
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              placeholder="Enter the key characteristics you want Apigene Co-pilot to have, such as clarity, creativity, empathy, efficiency, or formality. You can also specify tone, depth of responses, or interaction style to tailor the AI's behavior to your needs."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Personalization Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Personalization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {additionalPersonalization.map((field, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor={`name-${index}`}>Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={field.name}
                    onChange={(e) =>
                      updatePersonalizationField(index, "name", e.target.value)
                    }
                    placeholder="Field name"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`value-${index}`}>Value</Label>
                  <Input
                    id={`value-${index}`}
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
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveUserSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export { PersonalSettings };
