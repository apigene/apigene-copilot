"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, BarChart3, Users } from "lucide-react";
import { format } from "date-fns";

import { DailyActionUsage } from "@/components/dashboard/daily-action-usage";
import { ActionsByResponseCode } from "@/components/dashboard/actions-by-response-code";
import { UsageByUser } from "@/components/dashboard/usage-by-user";
import { Interaction } from "@/app/api/dashboard/summary/route";

// Dashboard Empty State Component
const DashboardEmptyState = () => {
  const features = [
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      title: "Usage Analytics",
      description:
        "Track API calls, response times, and usage patterns across your applications",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
      title: "Performance Insights",
      description:
        "Monitor success rates, error codes, and identify optimization opportunities",
    },
    {
      icon: <Users className="h-5 w-5 text-orange-500" />,
      title: "User Activity",
      description:
        "See which users are most active and understand usage distribution",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center min-h-[400px]">
      {/* Main Illustration */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-4">
        <TrendingUp className="h-8 w-8 text-primary/70" />
      </div>

      {/* Main Title */}
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Welcome to your Dashboard 👋
      </h2>

      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
        We didn&apos;t find any usage data for your selected time period.
        Configure your apps and start making actions to see comprehensive
        analytics and insights here.
      </p>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-w-2xl">
        {features.map((feature, index) => (
          <Card key={index} className="p-4 text-center">
            <div className="mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Steps to Get Started */}
      <Card className="p-6 max-w-lg">
        <h3 className="font-semibold text-base mb-4 text-center">
          To see analytics data:
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-semibold text-white">
              1
            </div>
            <span className="text-sm text-muted-foreground">
              Configure your apps in the <strong>Apps</strong> section
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white">
              2
            </div>
            <span className="text-sm text-muted-foreground">
              Start making actions in <strong>Copilot</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-semibold text-white">
              3
            </div>
            <span className="text-sm text-muted-foreground">
              View your usage analytics and insights here in{" "}
              <strong>Dashboard</strong>
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const now = new Date();
const initialStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [startDate, setStartDate] = useState<Date>(initialStartDate);
  const [endDate, setEndDate] = useState<Date>(now);

  const getInteractions = useCallback(async () => {
    try {
      setIsLoading(true);
      const requestBody = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };

      console.log("Dashboard frontend: Making request with:", requestBody);

      const response = await fetch("/api/dashboard/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Dashboard frontend: Response status:", response.status);

      const json = await response.json();
      console.log("Dashboard frontend: Received data:", json);
      console.log(
        "Dashboard frontend: Interactions count:",
        json.result?.length || 0,
      );

      setInteractions(json.result || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    getInteractions();
  }, [getInteractions]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>

          {/* Date Pickers */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={format(startDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setStartDate(date);
                  }
                }}
                className="w-[200px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={format(endDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setEndDate(date);
                  }
                }}
                className="w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Conditional rendering: show empty state or grid */}
          {!isLoading && interactions.length === 0 ? (
            <DashboardEmptyState />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DailyActionUsage
                isLoading={isLoading}
                interactions={interactions}
                type="total"
              />
              <DailyActionUsage
                isLoading={isLoading}
                interactions={interactions}
                type="app"
              />
              <ActionsByResponseCode
                isLoading={isLoading}
                interactions={interactions}
              />
              <UsageByUser isLoading={isLoading} interactions={interactions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
