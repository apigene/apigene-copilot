"use client";

import { useState, useEffect, useMemo } from "react";
import { ApplicationData } from "@/types/applications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  AlertCircle,
  Database,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { MetadataDetailsModal } from "./metadata-details-modal";

interface MetadataTabProps {
  application: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => Promise<boolean>;
}

interface AgenticMetadata {
  operationId: string;
  description: string;
  required_inputs: Record<string, string>;
  optional_inputs: Record<string, string>;
  type: string;
  resource: string;
  frequency?: string;
  response?: {
    summary: string;
    format: string;
    key_parameters: Record<string, string>;
  };
  rating: number;
}

interface MetadataItem extends AgenticMetadata {
  isExpanded?: boolean;
  isEditing?: boolean;
  response: {
    summary: string;
    format: string;
    key_parameters: Record<string, string>;
  };
}

export function MetadataTab({ application }: MetadataTabProps) {
  const apiClient = useApigeneApi();
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] =
    useState<MetadataItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch agentic metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!application.api_name) return;

      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.specGetAgenticMetadata(
          application.api_name,
        );

        // The response is a list of objects directly, not wrapped in agentic_metadata
        if (Array.isArray(response) && response.length > 0) {
          const transformedData = response.map((item: any) => ({
            operationId: item.operationId,
            description: item.description,
            required_inputs: item.required_inputs || {},
            optional_inputs: item.optional_inputs || {},
            type: item.type,
            resource: item.resource,
            frequency: item.frequency,
            response: item.response
              ? {
                  summary: item.response.summary || "",
                  format: item.response.format || "",
                  key_parameters: item.response.key_parameters || {},
                }
              : {
                  summary: "",
                  format: "",
                  key_parameters: {},
                },
            rating: item.rating,
            isExpanded: false,
            isEditing: false,
          }));
          setMetadata(transformedData);
        } else {
          setMetadata([]);
        }
      } catch (err) {
        console.error("Error fetching agentic metadata:", err);
        setError("Failed to load agentic metadata");
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [application.api_name, apiClient]);

  // Filter metadata based on search term
  const filteredMetadata = useMemo(() => {
    if (!searchTerm) return metadata;
    return metadata.filter(
      (item) =>
        item.operationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [metadata, searchTerm]);

  // Paginated metadata
  const paginatedMetadata = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredMetadata.slice(startIndex, endIndex);
  }, [filteredMetadata, currentPage, rowsPerPage]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Open dialog for viewing/editing operation
  const openOperationDialog = (operation: MetadataItem) => {
    setSelectedOperation(operation);
    setIsDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedOperation(null);
  };

  // Refresh metadata after update
  const refreshMetadata = async () => {
    if (!application.api_name) return;

    try {
      const response = await apiClient.specGetAgenticMetadata(
        application.api_name,
      );

      if (Array.isArray(response) && response.length > 0) {
        const transformedData = response.map((item: any) => ({
          operationId: item.operationId,
          description: item.description,
          required_inputs: item.required_inputs || {},
          optional_inputs: item.optional_inputs || {},
          type: item.type,
          resource: item.resource,
          frequency: item.frequency,
          response: item.response
            ? {
                summary: item.response.summary || "",
                format: item.response.format || "",
                key_parameters: item.response.key_parameters || {},
              }
            : {
                summary: "",
                format: "",
                key_parameters: {},
              },
          rating: item.rating,
          isExpanded: false,
          isEditing: false,
        }));
        setMetadata(transformedData);
      } else {
        setMetadata([]);
      }
    } catch (err) {
      console.error("Error refreshing metadata:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading agentic metadata...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Agentic Metadata
            </CardTitle>
            <Badge variant="outline">{metadata.length} operations</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Manage and edit agentic metadata for API operations. This metadata
            helps AI understand how to use your API effectively.
          </p>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredMetadata.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm
                  ? "No matching operations found"
                  : "No agentic metadata available"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Agentic metadata will appear here once it's generated for your API operations."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Operation ID</TableHead>
                    <TableHead className="text-center">Description</TableHead>
                    <TableHead className="text-center w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMetadata.map((item) => (
                    <TableRow key={item.operationId}>
                      <TableCell className="text-center">
                        {item.rating}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.operationId}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOperationDialog(item)}
                          className="flex items-center gap-2"
                        >
                          <MoreVertical className="h-4 w-4" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden p-4 space-y-3">
              {paginatedMetadata.map((item) => (
                <div
                  key={item.operationId}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Rating: {item.rating}
                      </Badge>
                      <span className="font-medium text-sm">
                        {item.operationId}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openOperationDialog(item)}
                      className="flex items-center gap-1"
                    >
                      <MoreVertical className="h-3 w-3" />
                      Details
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {filteredMetadata.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Rows per page:
                </span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) =>
                    handleRowsPerPageChange(Number(value))
                  }
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page info */}
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * rowsPerPage + 1,
                  filteredMetadata.length,
                )}{" "}
                to{" "}
                {Math.min(currentPage * rowsPerPage, filteredMetadata.length)}{" "}
                of {filteredMetadata.length} results
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    {
                      length: Math.ceil(filteredMetadata.length / rowsPerPage),
                    },
                    (_, i) => i + 1,
                  )
                    .filter((page) => {
                      const totalPages = Math.ceil(
                        filteredMetadata.length / rowsPerPage,
                      );
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-1">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage ===
                    Math.ceil(filteredMetadata.length / rowsPerPage)
                  }
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Details Modal */}
      <MetadataDetailsModal
        open={isDialogOpen}
        onClose={closeDialog}
        operation={selectedOperation}
        application={application}
        onUpdate={refreshMetadata}
      />
    </div>
  );
}
