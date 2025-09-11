"use client";

import { useState, useEffect, useMemo } from "react";
import { ApplicationData } from "@/types/applications";
import { ApplicationIcon } from "./application-icon";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Lock,
  Trash2,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InstallApplicationDialog from "./install-application-dialog";

type SortDirection = "asc" | "desc" | null;

function ApplicationsTableSkeleton() {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* Sticky Header Skeleton */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Scrollable Table Container Skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Sticky Table Header Skeleton */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="rounded-md border border-t-0">
              <div className="border-b bg-muted/50">
                <div className="flex items-center px-4 py-3 w-full">
                  <div className="w-16 flex-shrink-0">
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="w-40 flex-shrink-0">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="w-16 flex-shrink-0">
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Table Body Skeleton */}
          <div className="flex-1 overflow-y-auto">
            <div className="rounded-md border border-t-0">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border-b last:border-b-0">
                  <div className="flex items-center px-4 py-3 w-full">
                    <div className="w-16 flex-shrink-0">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="w-32 flex-shrink-0">
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="w-40 flex-shrink-0">
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="w-32 flex-shrink-0">
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="w-32 flex-shrink-0">
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="w-16 flex-shrink-0">
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <Skeleton className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Skeleton */}
      <div className="sticky bottom-0 z-10 bg-background border-t">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApplicationsTable() {
  const router = useRouter();
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [applicationToDelete, setApplicationToDelete] =
    useState<ApplicationData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  const pageSize = 20;
  const apiClient = useApigeneApi();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.get("/api/specs", {
          queryParams: { include_all: true },
        });

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

  // Handle install dialog
  const handleInstallNewApp = () => {
    setInstallDialogOpen(true);
  };

  const handleInstallDialogClose = () => {
    setInstallDialogOpen(false);
  };

  const handleInstallSuccess = (apiName: string) => {
    setInstallDialogOpen(false);
    // Refresh the data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.get("/api/specs", {
          queryParams: { include_all: true },
        });

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
    router.push(`/applications/${apiName}`); // Navigate to the installed application
  };

  // Handle application deletion
  const handleDeleteApplication = async () => {
    if (!applicationToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.specDelete(applicationToDelete.api_name);
      toast.success("Application deleted successfully!");

      // Remove the deleted application from the local state
      setData((prevData) =>
        prevData.filter((app) => app.api_name !== applicationToDelete.api_name),
      );

      // Close dialog and reset state
      setShowDeleteDialog(false);
      setApplicationToDelete(null);
    } catch (err) {
      console.error("Error deleting application:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete application",
      );
    } finally {
      setIsDeleting(false);
    }
  };

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
    { key: "icon", label: "", width: "w-16 flex-shrink-0" },
    { key: "name", label: "Application Name", width: "flex-1 min-w-0" },
    { key: "version", label: "API Version", width: "w-44 flex-shrink-0" },
    { key: "created_by", label: "Created By", width: "w-44 flex-shrink-0" },
    { key: "created_at", label: "Created At", width: "w-44 flex-shrink-0" },
    { key: "updated_at", label: "Updated At", width: "w-44 flex-shrink-0" },
    { key: "scope", label: "Scope", width: "w-16 flex-shrink-0" },
    { key: "actions", label: "Actions", width: "w-24 flex-shrink-0" },
  ];

  const visibleColumnsArray = columns.filter((col) =>
    visibleColumns.has(col.key),
  );

  if (loading) {
    return <ApplicationsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Applications</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-destructive">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
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
                        {visibleColumns.has(column.key) ? "✓" : "○"}{" "}
                        {column.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleInstallNewApp}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CloudUpload className="h-4 w-4" />
                  New Appplication
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Scrollable Table Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Sticky Table Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="rounded-md border border-t-0">
              <div className="border-b bg-muted/50">
                <div className="flex items-center px-4 py-3 w-full">
                  {visibleColumnsArray.map((column) => (
                    <div
                      key={column.key}
                      className={`${column.width} flex items-center`}
                    >
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Table Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="rounded-md border border-t-0">
              {paginatedData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-center">
                  <div className="text-muted-foreground">
                    No applications found
                  </div>
                </div>
              ) : (
                paginatedData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 w-full"
                    onClick={() =>
                      router.push(`/applications/${item.api_name}`)
                    }
                  >
                    {visibleColumnsArray.map((column) => (
                      <div
                        key={column.key}
                        className={`${column.width} flex items-center`}
                      >
                        {column.key === "icon" && (
                          <ApplicationIcon
                            domainUrl={item.domain_url}
                            apiName={item.api_name}
                          />
                        )}
                        {column.key === "name" && (
                          <div className="font-medium">{item.api_title}</div>
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
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/applications/${item.api_name}`,
                                    )
                                  }
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setApplicationToDelete(item);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer with Pagination */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 z-10 bg-background border-t">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, processedData.length)} of{" "}
                {processedData.length} applications
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {applicationToDelete?.api_title || applicationToDelete?.api_name}
              &quot;? This action cannot be undone and will permanently remove
              the application and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setApplicationToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteApplication}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InstallApplicationDialog
        open={installDialogOpen}
        onClose={handleInstallDialogClose}
        onSuccess={handleInstallSuccess}
      />
    </div>
  );
}
