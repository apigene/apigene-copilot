"use client";

import { useState, useEffect, useMemo } from "react";
import { ApplicationData } from "@/types/applications";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useApigeneApi } from "@/lib/api/apigene-client";

interface OperationsTabProps {
  application: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => Promise<boolean>;
}

interface Operation {
  id: string;
  path: string;
  operationType: string;
  apiPath: string;
  description: string | null;
  state: string;
  tags: string[];
}

interface OperationsResponse {
  operations: Array<{
    name: string;
    state: string;
    tags: string[];
    description: string | null;
    method: string;
    path: string;
    scopes: string[];
    user_input_template: any;
  }>;
  operation_tags: string[];
  categorized_paths: string[];
  common_parameters: Record<string, any>;
  global_tags: string[];
  scopes: string[];
}

const getOperationTypeColor = (operationType: string): string => {
  switch (operationType.toLowerCase()) {
    case "get":
      return "bg-blue-500";
    case "post":
      return "bg-green-500";
    case "put":
      return "bg-yellow-500";
    case "delete":
      return "bg-red-500";
    case "patch":
      return "bg-purple-500";
    case "options":
      return "bg-gray-500";
    case "head":
      return "bg-slate-600";
    case "trace":
      return "bg-indigo-500";
    case "connect":
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
};

export function OperationsTab({ application, onUpdate }: OperationsTabProps) {
  const apiClient = useApigeneApi();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<
    string[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState("");

  // Available filter options
  const [operationTypesList, setOperationTypesList] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [apiPathsList, setApiPathsList] = useState<string[]>([]);

  // Selected operations state
  const [selectedOperations, setSelectedOperations] = useState<Set<string>>(
    new Set(),
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mobile UI state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch operations data
  useEffect(() => {
    const fetchOperations = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response: OperationsResponse = await apiClient.specGetOperations(
          application.api_name,
        );

        // Transform data to match our interface
        const transformedOperations = response.operations.map((item) => ({
          id: item.name,
          path: item.path,
          operationType: item.method,
          apiPath: item.name,
          description: item.description || null,
          state: item.state,
          tags: item.tags || [],
        }));

        setOperations(transformedOperations);

        // Extract unique operation types
        const uniqueOperationTypes = [
          ...new Set(transformedOperations.map((op) => op.operationType)),
        ];
        setOperationTypesList(uniqueOperationTypes);

        // Set available tags and paths
        setTagsList(response.operation_tags || []);
        setApiPathsList(response.categorized_paths || []);

        // Initialize selected operations based on current state
        const enabledOperations = new Set(
          transformedOperations
            .filter((op) => op.state === "enabled")
            .map((op) => op.id),
        );
        setSelectedOperations(enabledOperations);
      } catch (error) {
        console.error("Error fetching operations:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to fetch operations. Please try again.",
        );
        setUpdateStatus("error");
      } finally {
        setLoading(false);
      }
    };

    if (application.api_name) {
      fetchOperations();
    }
  }, [application.api_name, apiClient]);

  // Filter operations based on search and filters
  const filteredOperations = useMemo(() => {
    return operations.filter((operation) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        operation.apiPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (operation.description &&
          operation.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Operation type filter
      const matchesOperationType =
        selectedOperationTypes.length === 0 ||
        selectedOperationTypes.includes(operation.operationType);

      // Tags filter
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => operation.tags.includes(tag));

      // Path filter
      const matchesPath =
        !selectedPath || operation.path.startsWith(selectedPath);

      return (
        matchesSearch && matchesOperationType && matchesTags && matchesPath
      );
    });
  }, [
    operations,
    searchTerm,
    selectedOperationTypes,
    selectedTags,
    selectedPath,
  ]);

  // Paginated operations
  const paginatedOperations = useMemo(() => {
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredOperations.slice(startIndex, endIndex);
  }, [filteredOperations, currentPage, rowsPerPage]);

  // Handle operation selection
  const handleOperationSelect = (operationId: string, checked: boolean) => {
    setSelectedOperations((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(operationId);
      } else {
        newSet.delete(operationId);
      }
      return newSet;
    });
  };

  // Handle select all (for current page)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set(selectedOperations);
      paginatedOperations.forEach((op) => newSet.add(op.id));
      setSelectedOperations(newSet);
    } else {
      const newSet = new Set(selectedOperations);
      paginatedOperations.forEach((op) => newSet.delete(op.id));
      setSelectedOperations(newSet);
    }
  };

  // Check if all operations on current page are selected
  const allSelected =
    paginatedOperations.length > 0 &&
    paginatedOperations.every((op) => selectedOperations.has(op.id));

  // Handle update
  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus("idle");
    setErrorMessage("");

    try {
      // Create operations state object
      const operationsState = operations.reduce(
        (acc, operation) => {
          acc[operation.id] = selectedOperations.has(operation.id)
            ? "enabled"
            : "disabled";
          return acc;
        },
        {} as Record<string, string>,
      );

      const updateData: Partial<ApplicationData> = {
        operations_state: operationsState,
      };

      const success = await onUpdate(updateData);

      if (success) {
        setUpdateStatus("success");
        toast.success("Operations updated successfully!");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Update failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update operations. Please try again.",
      );
      setUpdateStatus("error");
      toast.error("Failed to update operations. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOperationTypes([]);
    setSelectedTags([]);
    setSelectedPath("");
    setCurrentPage(0); // Reset to first page when clearing filters
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0); // Reset to first page when changing rows per page
  };

  // Check if there are active filters
  const hasActiveFilters =
    selectedOperationTypes.length > 0 ||
    selectedTags.length > 0 ||
    selectedPath !== "" ||
    searchTerm !== "";

  // Get count of active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedOperationTypes.length > 0) count++;
    if (selectedTags.length > 0) count++;
    if (selectedPath !== "") count++;
    if (searchTerm !== "") count++;
    return count;
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search operations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-9"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Filters
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                size="sm"
                className="flex items-center gap-2 h-9"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="space-y-4">
            {/* Filter Toggle for screens < 1024px */}
            <div className="block lg:hidden">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter Controls */}
            <div
              className={`space-y-4 ${
                showMobileFilters ? "block" : "hidden lg:block"
              }`}
            >
              {/* Desktop Filter Layout - Full Width 3 Columns */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                {/* Operation Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Operation Type</Label>
                  <Select
                    value={
                      selectedOperationTypes.length > 0
                        ? selectedOperationTypes.join(",")
                        : "all"
                    }
                    onValueChange={(value) =>
                      setSelectedOperationTypes(
                        value === "all" ? [] : value.split(","),
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All operation types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All operation types</SelectItem>
                      {operationTypesList.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Path Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Path</Label>
                  <Select
                    value={selectedPath || "all"}
                    onValueChange={(value) =>
                      setSelectedPath(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All paths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All paths</SelectItem>
                      {apiPathsList.map((path) => (
                        <SelectItem key={path} value={path}>
                          {path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <Select
                    value={
                      selectedTags.length > 0 ? selectedTags.join(",") : "all"
                    }
                    onValueChange={(value) =>
                      setSelectedTags(value === "all" ? [] : value.split(","))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {tagsList.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mobile/Tablet Filter Layout - Stacked */}
              <div className="block lg:hidden space-y-4">
                {/* Operation Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Operation Type</Label>
                  <Select
                    value={
                      selectedOperationTypes.length > 0
                        ? selectedOperationTypes.join(",")
                        : "all"
                    }
                    onValueChange={(value) =>
                      setSelectedOperationTypes(
                        value === "all" ? [] : value.split(","),
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All operation types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All operation types</SelectItem>
                      {operationTypesList.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Path Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Path</Label>
                  <Select
                    value={selectedPath || "all"}
                    onValueChange={(value) =>
                      setSelectedPath(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All paths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All paths</SelectItem>
                      {apiPathsList.map((path) => (
                        <SelectItem key={path} value={path}>
                          {path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <Select
                    value={
                      selectedTags.length > 0 ? selectedTags.join(",") : "all"
                    }
                    onValueChange={(value) =>
                      setSelectedTags(value === "all" ? [] : value.split(","))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {tagsList.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {updateStatus === "error" && errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {updateStatus === "success" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Operations updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Operations Display */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading operations...</span>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block border-b overflow-x-auto">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[5%] px-2 py-3">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="w-[10%] px-2 py-3">
                            Type
                          </TableHead>
                          <TableHead className="w-[20%] px-2 py-3">
                            Operation Name
                          </TableHead>
                          <TableHead className="w-[50%] px-2 py-3">
                            Description
                          </TableHead>
                          <TableHead className="w-[20%] px-2 py-3">
                            Tags
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOperations.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground py-12"
                            >
                              {loading
                                ? "Loading operations..."
                                : "No operations found matching your filters."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedOperations.map((operation) => (
                            <TableRow
                              key={operation.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="px-2 py-3">
                                <Checkbox
                                  checked={selectedOperations.has(operation.id)}
                                  onCheckedChange={(checked) =>
                                    handleOperationSelect(
                                      operation.id,
                                      checked as boolean,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="px-2 py-3">
                                <Badge
                                  className={`${getOperationTypeColor(
                                    operation.operationType,
                                  )} text-white text-xs font-medium px-2 py-1`}
                                >
                                  {operation.operationType.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-2 py-3 font-medium text-sm">
                                {operation.apiPath}
                              </TableCell>
                              <TableCell className="px-2 py-3 text-sm text-muted-foreground">
                                {operation.description ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="cursor-pointer">
                                          {operation.description.length >
                                          100 ? (
                                            <div className="truncate">
                                              {operation.description.substring(
                                                0,
                                                100,
                                              )}
                                              ...
                                            </div>
                                          ) : (
                                            <div className="whitespace-pre-wrap">
                                              {operation.description}
                                            </div>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="max-w-md p-3 bg-slate-900 text-slate-100 border-slate-700"
                                      >
                                        <div className="whitespace-pre-wrap text-sm">
                                          {operation.description}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">
                                    No description available
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-2 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {operation.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-xs px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {operation.tags.length > 3 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                      +{operation.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="block lg:hidden p-4">
                    {paginatedOperations.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        {loading
                          ? "Loading operations..."
                          : "No operations found matching your filters."}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paginatedOperations.map((operation) => (
                          <Card key={operation.id} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Checkbox
                                  checked={selectedOperations.has(operation.id)}
                                  onCheckedChange={(checked) =>
                                    handleOperationSelect(
                                      operation.id,
                                      checked as boolean,
                                    )
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      className={`${getOperationTypeColor(
                                        operation.operationType,
                                      )} text-white text-xs font-medium px-2 py-1`}
                                    >
                                      {operation.operationType.toUpperCase()}
                                    </Badge>
                                    <span className="font-medium text-sm truncate">
                                      {operation.apiPath}
                                    </span>
                                  </div>

                                  {operation.description && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="cursor-pointer">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                              {operation.description.length > 80
                                                ? `${operation.description.substring(
                                                    0,
                                                    80,
                                                  )}...`
                                                : operation.description}
                                            </p>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="top"
                                          className="max-w-xs p-3 bg-slate-900 text-slate-100 border-slate-700"
                                        >
                                          <div className="whitespace-pre-wrap text-sm">
                                            {operation.description}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {!operation.description && (
                                    <p className="text-sm text-muted-foreground italic">
                                      No description available
                                    </p>
                                  )}

                                  {operation.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {operation.tags.slice(0, 2).map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className="text-xs px-1 py-0.5"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                      {operation.tags.length > 2 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs px-1 py-0.5"
                                        >
                                          +{operation.tags.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {filteredOperations.length > 0 && (
                    <div className="border-t">
                      {/* Mobile/Tablet Pagination */}
                      <div className="block lg:hidden p-4 space-y-4">
                        <div className="text-center text-sm text-muted-foreground">
                          Showing {currentPage * rowsPerPage + 1} to{" "}
                          {Math.min(
                            (currentPage + 1) * rowsPerPage,
                            filteredOperations.length,
                          )}{" "}
                          of {filteredOperations.length} operations
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="flex items-center gap-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          <span className="text-sm font-medium">
                            {currentPage + 1} /{" "}
                            {Math.ceil(filteredOperations.length / rowsPerPage)}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={
                              currentPage >=
                              Math.ceil(
                                filteredOperations.length / rowsPerPage,
                              ) -
                                1
                            }
                            className="flex items-center gap-2"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Show:
                          </span>
                          <Select
                            value={rowsPerPage.toString()}
                            onValueChange={(value) =>
                              handleRowsPerPageChange(Number(value))
                            }
                          >
                            <SelectTrigger className="h-8 w-[70px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                              {[5, 10, 20, 30, 50].map((pageSize) => (
                                <SelectItem
                                  key={pageSize}
                                  value={pageSize.toString()}
                                >
                                  {pageSize}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Desktop Pagination */}
                      <div className="hidden lg:flex lg:items-center lg:justify-between gap-4 px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          Showing {currentPage * rowsPerPage + 1} to{" "}
                          {Math.min(
                            (currentPage + 1) * rowsPerPage,
                            filteredOperations.length,
                          )}{" "}
                          of {filteredOperations.length} operations
                        </div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium whitespace-nowrap">
                              Rows per page
                            </p>
                            <Select
                              value={rowsPerPage.toString()}
                              onValueChange={(value) =>
                                handleRowsPerPageChange(Number(value))
                              }
                            >
                              <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent side="top">
                                {[5, 10, 20, 30, 50].map((pageSize) => (
                                  <SelectItem
                                    key={pageSize}
                                    value={pageSize.toString()}
                                  >
                                    {pageSize}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium whitespace-nowrap">
                                Page {currentPage + 1} of{" "}
                                {Math.ceil(
                                  filteredOperations.length / rowsPerPage,
                                )}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={
                                currentPage >=
                                Math.ceil(
                                  filteredOperations.length / rowsPerPage,
                                ) -
                                  1
                              }
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {!loading && filteredOperations.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedOperations.size} of {operations.length} operations
              selected.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
