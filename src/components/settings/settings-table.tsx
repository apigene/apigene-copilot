"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalSettings } from "./personal-settings";
import { OrganizationSettings } from "./organization-settings";
import { BrandingSettings } from "./branding-settings";

const SettingsTable = () => {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal preferences, organization settings, and branding.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalSettings />
        </TabsContent>

        <TabsContent value="organization" className="mt-6">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { SettingsTable };
