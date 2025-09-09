"use client";

import { useState, useEffect, useMemo } from "react";
import { ApplicationData } from "@/types/applications";
import { ApplicationIcon } from "./application-icon";
import { useApigeneApi } from "@/lib/api/apigene-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Lock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SortDirection = "asc" | "desc" | null;

function ApplicationsTableSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Applications</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search bar skeleton */}
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-md border">
          {/* Table header skeleton */}
          <div className="border-b bg-muted/50">
            <div className="flex items-center px-4 py-3">
              <Skeleton className="h-4 w-4 mr-3" />
              <Skeleton className="h-4 w-32 mr-6" />
              <Skeleton className="h-4 w-24 mr-6" />
              <Skeleton className="h-4 w-20 mr-6" />
              <Skeleton className="h-4 w-16 mr-6" />
              <Skeleton className="h-4 w-20 mr-6" />
              <Skeleton className="h-4 w-16 mr-6" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>

          {/* Table rows skeleton */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b last:border-b-0">
              <div className="flex items-center px-4 py-3">
                <Skeleton className="h-8 w-8 mr-3 rounded-full" />
                <Skeleton className="h-4 w-32 mr-6" />
                <Skeleton className="h-4 w-24 mr-6" />
                <Skeleton className="h-4 w-20 mr-6" />
                <Skeleton className="h-4 w-16 mr-6" />
                <Skeleton className="h-4 w-20 mr-6" />
                <Skeleton className="h-4 w-16 mr-6" />
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ApplicationsTable() {
  const [data, setData] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set([
      "icon",
      "name",
      "version",
      "created_by",
      "created_at",
      "updated_at",
      "scope",
      "actions",
    ]),
  );

  const pageSize = 20;
  const apiClient = useApigeneApi();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.get("/api/specs", { include_all: true });

        // Check if result is an array
        if (Array.isArray(result)) {
          setData(result);
        } else {
          console.error(
            "[ApplicationsTable] Expected array but got:",
            typeof result,
            result,
          );
          setError("Invalid data format received from API");
        }
      } catch (err) {
        console.error("[ApplicationsTable] Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Remove apiClient dependency to prevent infinite loop

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        relative: date.toLocaleDateString(),
        full: date.toLocaleString(),
      };
    } catch {
      return { relative: "Invalid date", full: "Invalid date" };
    }
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case "name":
            aValue = a.api_name;
            bValue = b.api_name;
            break;
          case "version":
            aValue = a.api_version;
            bValue = b.api_version;
            break;
          case "created_by":
            aValue = a.created_by;
            bValue = b.created_by;
            break;
          case "created_at":
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case "updated_at":
            aValue = new Date(a.updated_at).getTime();
            bValue = new Date(b.updated_at).getTime();
            break;
          case "scope":
            aValue = a.global_spec ? 1 : 0;
            bValue = b.global_spec ? 1 : 0;
            break;
          default:
            return 0;
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : sortDirection === "desc"
            ? null
            : "asc",
      );
      if (sortDirection === "desc") {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  // Column definitions
  const columns = [
    { key: "icon", label: "", width: "w-16" },
    { key: "name", label: "Application Name", width: "w-48" },
    { key: "version", label: "API Version", width: "w-32" },
    { key: "created_by", label: "Created By", width: "w-40" },
    { key: "created_at", label: "Created At", width: "w-32" },
    { key: "updated_at", label: "Updated At", width: "w-32" },
    { key: "scope", label: "Scope", width: "w-16" },
    { key: "actions", label: "Actions", width: "w-24" },
  ];

  const visibleColumnsArray = columns.filter((col) =>
    visibleColumns.has(col.key),
  );

  if (loading) {
    return <ApplicationsTableSkeleton />;
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Applications ({data.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {columns.map((column) => (
                  <DropdownMenuItem
                    key={column.key}
                    onClick={() => {
                      const newVisible = new Set(visibleColumns);
                      if (newVisible.has(column.key)) {
                        newVisible.delete(column.key);
                      } else {
                        newVisible.add(column.key);
                      }
                      setVisibleColumns(newVisible);
                    }}
                  >
                    {visibleColumns.has(column.key) ? "✓" : "○"} {column.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumnsArray.map((column) => (
                <TableHead key={column.key} className={column.width}>
                  {column.key === "icon" ? (
                    ""
                  ) : column.key === "actions" ? (
                    ""
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:text-primary"
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnsArray.length}
                  className="text-center h-32"
                >
                  No applications found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={index}>
                  {visibleColumnsArray.map((column) => (
                    <TableCell key={column.key} className={column.width}>
                      {column.key === "icon" && (
                        <ApplicationIcon
                          domainUrl={item.domain_url}
                          apiName={item.api_name}
                        />
                      )}
                      {column.key === "name" && (
                        <div className="font-medium">{item.api_name}</div>
                      )}
                      {column.key === "version" && (
                        <Badge variant="secondary">{item.api_version}</Badge>
                      )}
                      {column.key === "created_by" && (
                        <div className="text-sm text-muted-foreground">
                          {item.created_by}
                        </div>
                      )}
                      {column.key === "created_at" && (
                        <div className="text-sm">
                          {formatDate(item.created_at).relative}
                        </div>
                      )}
                      {column.key === "updated_at" && (
                        <div className="text-sm">
                          {formatDate(item.updated_at).relative}
                        </div>
                      )}
                      {column.key === "scope" && (
                        <div
                          className="flex items-center justify-center"
                          title={item.global_spec ? "Public" : "Private"}
                        >
                          {item.global_spec ? (
                            <Globe className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      )}
                      {column.key === "actions" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => console.log("View details", item)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => console.log("Edit", item)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => console.log("Delete", item)}
                            >
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => console.log("Copy API Key", item)}
                            >
                              Copy API Key
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, processedData.length)} of{" "}
              {processedData.length} applications
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
