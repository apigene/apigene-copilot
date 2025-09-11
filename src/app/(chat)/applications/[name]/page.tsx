"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { ApplicationData } from "@/types/applications";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Circle,
  Settings,
  Shield,
  Cog,
  Database,
  Layers,
} from "lucide-react";
import { GeneralTab } from "./components/general-tab";
import { SecurityTab } from "./components/security-tab";
import { MetadataTab } from "./components/metadata-tab";
import { CommonParametersTab } from "./components/common-parameters-tab";
import { OperationsTab } from "./components/operations-tab";

export default function ApplicationEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiClient = useApigeneApi();

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const applicationName = params.name as string;

  // Available tabs
  const availableTabs = [
    "general",
    "security",
    "metadata",
    "common-parameters",
    "operations",
  ];

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && availableTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  // Fetch application data
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiClient.specGet(applicationName);
        setApplication(data);
      } catch (err) {
        console.error("Error fetching application:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch application",
        );
      } finally {
        setLoading(false);
      }
    };

    if (applicationName) {
      fetchApplication();
    }
  }, [applicationName, apiClient]);

  // Handle application update
  const handleApplicationUpdate = async (
    updatedData: Partial<ApplicationData>,
  ) => {
    try {
      // Merge existing application data with updated data to pass ALL fields
      const fullUpdateData = application
        ? { ...application, ...updatedData }
        : updatedData;
      await apiClient.specUpdate(applicationName, fullUpdateData);
      setApplication((prev) => (prev ? { ...prev, ...updatedData } : null));
      return true;
    } catch (err) {
      console.error("Error updating application:", err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Application Not Found</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No application data available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <Button
          variant="ghost"
          onClick={() => router.push("/applications")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-lg font-semibold">
              {application.api_title?.charAt(0) ||
                application.api_name?.charAt(0) ||
                "A"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {application.api_title || application.api_name}
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full flex flex-col flex-1 min-h-0"
      >
        <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Security
            {!application?.security_info_configured && (
              <Circle className="h-2 w-2 fill-red-500 text-red-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Agentic Metadata
          </TabsTrigger>
          <TabsTrigger
            value="common-parameters"
            className="flex items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            Common Parameters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 flex-1 min-h-0">
          <GeneralTab
            application={application}
            onUpdate={handleApplicationUpdate}
          />
        </TabsContent>

        <TabsContent value="security" className="mt-6 flex-1 min-h-0">
          <SecurityTab
            application={application}
            onUpdate={handleApplicationUpdate}
          />
        </TabsContent>

        <TabsContent value="operations" className="mt-6 flex-1 min-h-0">
          <OperationsTab
            application={application}
            onUpdate={handleApplicationUpdate}
          />
        </TabsContent>

        <TabsContent value="metadata" className="mt-6 flex-1 min-h-0">
          <MetadataTab
            application={application}
            onUpdate={handleApplicationUpdate}
          />
        </TabsContent>

        <TabsContent value="common-parameters" className="mt-6 flex-1 min-h-0">
          <CommonParametersTab
            application={application}
            onUpdate={handleApplicationUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
