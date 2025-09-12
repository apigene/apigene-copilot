"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "@/components/tool-invocation/pie-chart";
import { Interaction } from "@/app/api/dashboard/summary/route";

interface Props {
  interactions: Interaction[];
  isLoading: boolean;
}

const prepareData = (result: Interaction[]) => {
  const statusCounts: Record<number, number> = {};

  result.forEach((entry) => {
    entry.actions_result.forEach((action) => {
      const statusCode = action.status_code;
      statusCounts[statusCode] = (statusCounts[statusCode] || 0) + 1;
    });
  });

  return statusCounts;
};

export const ActionsByResponseCode = ({ isLoading, interactions }: Props) => {
  const chartData = React.useMemo(() => {
    if (isLoading || !interactions.length) {
      return [];
    }

    const summary = prepareData(interactions);
    const labels = Object.keys(summary);
    const data = Object.values(summary);

    const backgroundColors: Record<number, string> = {
      // 2xx - Green tones (success)
      200: "#4caf50", // Bright green
      201: "#66bb6a", // Medium green
      202: "#81c784", // Light green
      204: "#a5d6a7", // Very light green

      // 3xx - Yellow tones (redirection)
      300: "#fff176", // Light yellow
      301: "#ffeb3b", // Medium yellow
      302: "#fdd835", // Darker yellow
      304: "#f9a825", // Dark yellow

      // 4xx - Yellow/Orange tones (client error)
      400: "#ffeb3b", // Yellow
      401: "#ffc107", // Amber
      403: "#ff9800", // Orange
      404: "#ff5722", // Deep orange

      // 5xx - Red tones (server error)
      500: "#f44336", // Bright red
      502: "#e53935", // Medium red
      503: "#d32f2f", // Dark red
      504: "#c62828", // Very dark red
    };

    return labels.map((label, index) => ({
      label: `Status ${label}`,
      value: data[index],
      fill: backgroundColors[Number(label)] || "#9e9e9e", // Neutral gray for unknown status codes
    }));
  }, [interactions, isLoading]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actions by Response Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PieChart
      title="Actions by Response Code"
      data={chartData}
      description="Shows the distribution of API responses by status code"
    />
  );
};
