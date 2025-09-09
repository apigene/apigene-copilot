"use client";

import { useState } from "react";
import PersonalSettings from "./personal-settings";
import OrganizationSettings from "./organization-settings";
import BrandingSettings from "./branding-settings";
import { User, Building2, Palette } from "lucide-react";

const SettingsTable = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Personal",
      icon: <User className="w-4 h-4" />,
      value: "personal",
    },
    {
      label: "Organization",
      icon: <Building2 className="w-4 h-4" />,
      value: "organization",
    },
    {
      label: "Branding",
      icon: <Palette className="w-4 h-4" />,
      value: "branding",
    },
  ];

  return (
    <div className="flex justify-center">
      <div className="w-full mt-4 lg:w-5xl lg:mt-14">
        {/* Mobile: Tabs as horizontal scroll */}
        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tabItem, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tabItem.icon}
                <span>{tabItem.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: Sidebar */}
          <div className="hidden md:block w-64">
            <nav className="px-4 flex flex-col gap-2">
              {tabs.map((tabItem, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === index
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tabItem.icon}
                  <span className="font-medium">{tabItem.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 rounded-lg border max-h-[80vh] overflow-y-auto">
            <div className="p-4 md:p-8">
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold">Settings</h3>
                <p className="text-sm text-muted-foreground py-2 pb-6">
                  Manage your personal preferences, organization settings, and
                  branding.
                </p>

                <div className="flex flex-col gap-6 w-full">
                  {activeTab === 0 && <PersonalSettings />}
                  {activeTab === 1 && <OrganizationSettings />}
                  {activeTab === 2 && <BrandingSettings />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SettingsTable };
