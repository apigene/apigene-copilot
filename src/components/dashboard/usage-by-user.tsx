"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Interaction } from "@/app/api/dashboard/summary/route";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Props {
  interactions: Interaction[];
  isLoading: boolean;
}

// Color palette for charts
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

const prepareData = (result: Interaction[]) => {
  const userCounts: Record<string, number> = {};

  result.forEach((entry) => {
    let user = entry.user_id;

    // Check if user_id is a valid email format
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user);

    if (!isEmail) {
      user = "anonymous"; // Group under 'anonymous'
    }

    userCounts[user] = (userCounts[user] || 0) + 1;
  });

  return userCounts;
};

export const UsageByUser = ({ isLoading, interactions }: Props) => {
  const chartData = React.useMemo(() => {
    if (isLoading || !interactions.length) {
      return [];
    }

    const summary = prepareData(interactions);
    const labels = Object.keys(summary);
    const data = Object.values(summary);

    return labels.map((label, index) => ({
      user: label,
      usage: data[index],
      fill: COLORS[index % COLORS.length],
    }));
  }, [interactions, isLoading]);

  // Generate chart configuration
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    config.usage = {
      label: "Usage",
      color: COLORS[0],
    };
    return config;
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage by User</CardTitle>
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
    <Card className="bg-card">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>Usage by User</CardTitle>
        <p className="text-sm text-muted-foreground">
          Shows the distribution of API usage across different users
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={chartData} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                dataKey="usage"
                label={{
                  value: "Number of Interactions",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                type="category"
                dataKey="user"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={120}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar
                layout="vertical"
                dataKey="usage"
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
