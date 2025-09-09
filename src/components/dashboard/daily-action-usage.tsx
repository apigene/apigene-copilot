"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Interaction } from "@/app/api/dashboard/summary/route";
import { addDays, format, isValid, isAfter, parse } from "date-fns";
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
  type: "total" | "app";
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
  const allDates = new Set<string>();
  result.forEach(({ created_at }) => {
    allDates.add(created_at);
  });

  const allDatesArray = [...allDates]
    .map((date) => parse(date, "dd/MM/yyyy", new Date()))
    .sort((a, b) => a.getTime() - b.getTime());

  // If no valid dates exist, return an empty result.
  if (!allDatesArray.length) {
    return {};
  }

  let minDate = allDatesArray[0];
  let maxDate = allDatesArray[allDatesArray.length - 1];

  // If start date is after end date, swap them
  if (minDate.getTime() > maxDate.getTime()) {
    [minDate, maxDate] = [maxDate, minDate];
  }

  const dateSet = new Set<string>();
  let d = minDate;
  while (!isAfter(d, maxDate)) {
    if (!isValid(d)) {
      console.error("Encountered invalid date in loop");
      break;
    }
    dateSet.add(format(d, "dd/MM/yyyy"));
    d = addDays(d, 1);
  }

  const aggregatedResult: Record<string, Record<string, number>> = {};
  dateSet.forEach((date) => {
    aggregatedResult[date] = {};
  });

  result.forEach(({ created_at, api_title }) => {
    if (!aggregatedResult[created_at][api_title]) {
      aggregatedResult[created_at][api_title] = 0;
    }

    aggregatedResult[created_at][api_title]++;
  });

  return aggregatedResult;
};

export const DailyActionUsage = ({ isLoading, type, interactions }: Props) => {
  const chartData = React.useMemo(() => {
    if (isLoading || !interactions.length) {
      return [];
    }

    const summary = prepareData(interactions);
    const labels = Object.keys(summary).sort(
      (a, b) =>
        parse(a, "dd/MM/yyyy", new Date()).getTime() -
        parse(b, "dd/MM/yyyy", new Date()).getTime(),
    );

    const allAPIs = new Set<string>();
    labels.forEach((date) => {
      Object.keys(summary[date]).forEach((api) => allAPIs.add(api));
    });

    if (type === "total") {
      return labels.map((date) => ({
        date: date,
        total: Object.values(summary[date]).reduce(
          (sum, value) => sum + value,
          0,
        ),
      }));
    }

    // For app type, create data for stacked bar chart
    labels.forEach((date) => {
      allAPIs.forEach((api) => {
        if (!summary[date][api]) {
          summary[date][api] = 0;
        }
      });
    });

    return labels.map((date) => {
      const dataPoint: any = { date };
      [...allAPIs].forEach((api) => {
        dataPoint[api] = summary[date][api] || 0;
      });
      return dataPoint;
    });
  }, [interactions, isLoading, type]);

  const allAPIs = React.useMemo(() => {
    if (type !== "app" || !interactions.length) return [];
    const summary = prepareData(interactions);
    const apis = new Set<string>();
    Object.values(summary).forEach((dateData) => {
      Object.keys(dateData).forEach((api) => apis.add(api));
    });
    return Array.from(apis);
  }, [interactions, type]);

  // Generate chart configuration
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    if (type === "total") {
      config.total = {
        label: "Total API Usage",
        color: COLORS[0],
      };
    } else {
      allAPIs.forEach((api, index) => {
        config[api] = {
          label: api,
          color: COLORS[index % COLORS.length],
        };
      });
    }

    return config;
  }, [type, allAPIs]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Daily Action Usage{type === "app" ? " by App" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = `Daily Action Usage${type === "app" ? " by App" : ""}`;
  const description =
    type === "total"
      ? "Shows total API usage over time"
      : "Shows API usage breakdown by application over time";

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                label={{
                  value: "Number of Interactions",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              {type === "total" ? (
                <Bar
                  dataKey="total"
                  fill={`var(--color-total)`}
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                allAPIs.map((api, index) => (
                  <Bar
                    key={api}
                    dataKey={api}
                    stackId="stack"
                    fill={`var(--color-${api})`}
                    radius={index === allAPIs.length - 1 ? [4, 4, 0, 0] : 0}
                  />
                ))
              )}
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
