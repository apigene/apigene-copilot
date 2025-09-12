"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ContextData } from "@/types/context";
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
  Plus,
  Edit,
  Trash2,
  FileText,
  Sparkles,
  Settings,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type SortDirection = "asc" | "desc" | null;

// Empty State Component
function EmptyState({ onCreateContext }: { onCreateContext: () => void }) {
  const features = [
    {
      icon: <FileText className="h-5 w-5 text-green-500" />,
      title: "Organizational Knowledge",
      description:
        "Store company policies, guidelines, and procedures for consistent AI responses",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-blue-500" />,
      title: "Tailored Responses",
      description:
        "Help the Co-pilot understand your organization and provide relevant answers",
    },
    {
      icon: <Settings className="h-5 w-5 text-orange-500" />,
      title: "Context Management",
      description:
        "Organize and manage different contexts for various departments or use cases",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[60vh]">
      {/* Main Illustration */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 border border-white/10">
        <FileText className="h-8 w-8 text-white/70" />
      </div>

      {/* Main Title */}
      <h2 className="text-2xl font-semibold text-white mb-4">
        No contexts yet
      </h2>

      {/* Description */}
      <p className="text-sm text-white/70 mb-8 max-w-md leading-relaxed">
        Create your first context to help the Co-pilot understand your
        organization better. Contexts provide organizational knowledge for
        tailored responses.
      </p>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 bg-white/3 border border-white/10 rounded-xl text-center transition-all duration-200 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1"
          >
            <div className="mb-3">{feature.icon}</div>
            <h3 className="text-sm font-semibold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Button
        onClick={onCreateContext}
        className="px-6 py-2 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Your First Context
      </Button>

      {/* Additional Help Text */}
      <p className="text-xs text-white/50 mt-4 max-w-sm">
        💡 Tip: Start with company policies, guidelines, or frequently asked
        questions to help the Co-pilot provide more relevant responses
      </p>
    </div>
  );
}

function ContextTableSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contexts</CardTitle>
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
              <Skeleton className="h-4 w-32 mr-6" />
              <Skeleton className="h-4 w-48 mr-6" />
              <Skeleton className="h-4 w-24 mr-6" />
              <Skeleton className="h-4 w-32 mr-6" />
              <Skeleton className="h-4 w-32 mr-6" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>

          {/* Table rows skeleton */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b last:border-b-0">
              <div className="flex items-center px-4 py-3">
                <Skeleton className="h-4 w-32 mr-6" />
                <Skeleton className="h-4 w-48 mr-6" />
                <Skeleton className="h-4 w-24 mr-6" />
                <Skeleton className="h-4 w-32 mr-6" />
                <Skeleton className="h-4 w-32 mr-6" />
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

export function ContextTable() {
  const router = useRouter();
  const [data, setData] = useState<ContextData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set([
      "name",
      "status",
      "apps",
      "created_by",
      "created_at",
      "updated_at",
      "actions",
    ]),
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<ContextData | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 20;
  const apiClient = useApigeneApi();
  const hasFetched = useRef(false);

  // Fetch data
  useEffect(() => {
    if (hasFetched.current) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.get("/api/context");
        setData(result);
        hasFetched.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array - only run once

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
            aValue = a.name;
            bValue = b.name;
            break;
          case "description":
            aValue = a.description;
            bValue = b.description;
            break;
          case "apps":
            aValue = a.apps.length;
            bValue = b.apps.length;
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

  // Handle delete context
  const handleDeleteContext = async () => {
    if (!contextToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/context/${contextToDelete.id}`);
      toast.success("Context deleted successfully!");

      // Remove the deleted context from the local state
      setData((prevData) =>
        prevData.filter((context) => context.id !== contextToDelete.id),
      );

      // Close dialog and reset state
      setShowDeleteDialog(false);
      setContextToDelete(null);
    } catch (err) {
      console.error("Error deleting context:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete context",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Column definitions
  const columns = [
    { key: "name", label: "Name", width: "w-48" },
    { key: "status", label: "Status", width: "w-24" },
    { key: "apps", label: "Applied to Apps", width: "w-32" },
    { key: "created_by", label: "Created by", width: "w-40" },
    { key: "created_at", label: "Created at", width: "w-32" },
    { key: "updated_at", label: "Updated at", width: "w-32" },
    { key: "actions", label: "Actions", width: "w-24" },
  ];

  const visibleColumnsArray = columns.filter((col) =>
    visibleColumns.has(col.key),
  );

  if (loading) {
    return <ContextTableSkeleton />;
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Contexts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state when no contexts exist
  if (processedData.length === 0 && searchTerm === "") {
    return (
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Context Management
          </h1>
          <p className="text-gray-400 text-base max-w-2xl">
            Provide organizational knowledge for the Co-pilot so it can tailor
            its responses to specific company policies and guidelines.
          </p>
        </div>
        <EmptyState onCreateContext={() => router.push("/context/new")} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Context Management
        </h1>
        <p className="text-gray-400 text-base max-w-2xl">
          Provide organizational knowledge for the Co-pilot so it can tailor its
          responses to specific company policies and guidelines.
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-6 bg-white/2 border border-white/10 rounded-2xl shadow-lg">
        <div className="relative mb-4 sm:mb-0 sm:w-2/5">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contexts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 w-full bg-white/5 border-white/10 focus:bg-white/10"
          />
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => router.push("/context/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Context
        </Button>
      </div>

      <Card className="w-full bg-white/2 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              Contexts ({data.length})
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                {visibleColumnsArray.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`${column.width} bg-white/5 text-white font-semibold border-white/10`}
                  >
                    {column.key === "actions" ? (
                      ""
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-white/80"
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
                    className="text-center h-32 text-gray-400"
                  >
                    No contexts found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow
                    key={index}
                    className={`border-white/5 cursor-pointer transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-lg ${
                      index % 2 === 0 ? "bg-white/1" : "bg-white/2"
                    }`}
                    onClick={() => router.push(`/context/${item.id}`)}
                  >
                    {visibleColumnsArray.map((column) => (
                      <TableCell
                        key={column.key}
                        className={`${column.width} border-white/5`}
                      >
                        {column.key === "name" && (
                          <div className="font-medium text-white">
                            {item.name}
                          </div>
                        )}
                        {column.key === "status" && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                        )}
                        {column.key === "apps" && (
                          <div className="text-sm text-gray-400">
                            {item.apps.length} apps
                          </div>
                        )}
                        {column.key === "created_by" && (
                          <div className="text-sm text-gray-400">
                            {item.created_by}
                          </div>
                        )}
                        {column.key === "created_at" && (
                          <div className="text-sm text-gray-400">
                            {formatDate(item.created_at).relative}
                          </div>
                        )}
                        {column.key === "updated_at" && (
                          <div className="text-sm text-gray-400">
                            {formatDate(item.updated_at).relative}
                          </div>
                        )}
                        {column.key === "actions" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-900 border-gray-700">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/context/${item.id}`);
                                }}
                                className="text-white hover:bg-gray-800"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/context/${item.id}`);
                                }}
                                className="text-white hover:bg-gray-800"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContextToDelete(item);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, processedData.length)} of{" "}
                {processedData.length} contexts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm px-2 text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Context</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {contextToDelete?.name}
              &quot;? This action cannot be undone and will permanently remove
              the context and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setContextToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContext}
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
                  Delete Context
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
