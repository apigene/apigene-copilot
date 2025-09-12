"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  User,
  AppWindow,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApigeneApi } from "@/lib/api/apigene-client";
import { cn } from "@/lib/utils";

interface Interaction {
  user_id: string;
  api_name: string;
  user_input: string;
  created_at: string;
  duration: number;
  actions_result: Array<{
    status_code: number;
    response_content?: string;
    raw_data?: any;
  }>;
}

const StatusIndicator = ({
  statusCode,
}: { statusCode: number | string | undefined }) => {
  if (!statusCode || statusCode === "N/A") {
    return (
      <Badge variant="secondary" className="text-xs">
        Unknown
      </Badge>
    );
  }

  const code =
    typeof statusCode === "string" ? parseInt(statusCode) : statusCode;

  if (code >= 200 && code < 300) {
    return (
      <Badge
        variant="default"
        className="bg-green-500/20 text-green-400 border-green-500/30"
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        {code}
      </Badge>
    );
  } else if (code >= 400 && code < 500) {
    return (
      <Badge
        variant="default"
        className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        {code}
      </Badge>
    );
  } else if (code >= 500) {
    return (
      <Badge
        variant="default"
        className="bg-red-500/20 text-red-400 border-red-500/30"
      >
        <XCircle className="w-3 h-3 mr-1" />
        {code}
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="default"
        className="bg-blue-500/20 text-blue-400 border-blue-500/30"
      >
        {code}
      </Badge>
    );
  }
};

const ActionsEmptyState = () => {
  const features = [
    {
      icon: <Clock className="w-5 h-5 text-green-500" />,
      title: "Track User Actions",
      description:
        "See every API call and user interaction for full transparency and auditing.",
    },
    {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      title: "Debug & Troubleshoot",
      description:
        "Quickly debug issues by inspecting detailed request and response data.",
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      title: "Gain Insights",
      description:
        "Understand how users interact with your apps and optimize their experience.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Main Illustration */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6">
        <Clock className="w-8 h-8 text-white/70" />
      </div>

      {/* Main Title */}
      <h2 className="text-2xl font-semibold text-white mb-4">
        Welcome to the Actions Log 👋
      </h2>

      {/* Description */}
      <p className="text-sm text-white/70 mb-8 max-w-2xl leading-relaxed">
        This page shows a detailed log of user actions and API calls from your
        connected applications. Once you or your users start interacting with
        your apps, the data will appear here for review and analysis.
      </p>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-3xl">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 bg-white/5 border border-white/10 rounded-lg text-center transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
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

      {/* Steps to Get Started */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-base font-semibold text-white mb-4">
          To see actions here:
        </h3>
        <div className="space-y-3">
          {[
            {
              step: 1,
              text: "Configure your apps in the Apps section",
              color: "bg-green-500",
            },
            {
              step: 2,
              text: "Start making actions in Copilot",
              color: "bg-blue-500",
            },
            {
              step: 3,
              text: "View your detailed interactions here in Actions",
              color: "bg-yellow-500",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full ${item.color} flex items-center justify-center text-xs font-semibold text-white`}
              >
                {item.step}
              </div>
              <span className="text-sm text-white/80">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ActionsTable = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInteraction, setSelectedInteraction] =
    useState<Interaction | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    request: true,
    response: true,
    responseContent: true,
    rawResponseData: true,
  });
  const [filters, setFilters] = useState({
    statusCode: "all",
    duration: "all",
    fromDate: "",
    toDate: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const { interactionList } = useApigeneApi();

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const backendFilters: Record<string, any> = {};

      if (filters.statusCode && filters.statusCode !== "all") {
        if (filters.statusCode === "2xx") {
          backendFilters.min_status_code = 200;
          backendFilters.max_status_code = 299;
        } else if (filters.statusCode === "4xx") {
          backendFilters.min_status_code = 400;
          backendFilters.max_status_code = 499;
        } else if (filters.statusCode === "5xx") {
          backendFilters.min_status_code = 500;
          backendFilters.max_status_code = 599;
        }
      }

      if (filters.duration && filters.duration !== "all") {
        if (filters.duration === "fast") {
          backendFilters.max_duration = 1;
        } else if (filters.duration === "medium") {
          backendFilters.min_duration = 1;
          backendFilters.max_duration = 5;
        } else if (filters.duration === "slow") {
          backendFilters.min_duration = 5;
        }
      }

      if (filters.fromDate) {
        backendFilters.start_date = new Date(filters.fromDate).toISOString();
      }
      if (filters.toDate) {
        backendFilters.end_date = new Date(filters.toDate).toISOString();
      }

      const requestBody = {
        ...(Object.keys(backendFilters).length > 0 && {
          filters: backendFilters,
        }),
      };

      const params = {
        page: currentPage,
        limit: pageSize,
        sort_by: "created_at",
        sort_order: "desc",
      };

      const response = await interactionList(requestBody, {
        queryParams: params,
      });
      setInteractions(response.interactions || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error("Error fetching interactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [currentPage, pageSize, filters]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatSize = (size: number) => {
    if (size === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredInteractions = useMemo(() => {
    if (!searchTerm) return interactions;

    return interactions.filter(
      (interaction) =>
        interaction.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interaction.api_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interaction.user_input.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [interactions, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchInteractions();
  };

  const handleClearFilters = () => {
    setFilters({
      statusCode: "all",
      duration: "all",
      fromDate: "",
      toDate: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
    fetchInteractions();
  };

  if (interactions.length === 0 && !loading) {
    return <ActionsEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Actions</h1>
        <p className="text-muted-foreground">
          Monitor and analyze API interactions and their performance
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by application name, user input, or user ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInteractions}
              disabled={loading}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  value={filters.statusCode}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, statusCode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status Codes</SelectItem>
                    <SelectItem value="2xx">2xx Success</SelectItem>
                    <SelectItem value="4xx">4xx Client Error</SelectItem>
                    <SelectItem value="5xx">5xx Server Error</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.duration}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, duration: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Durations</SelectItem>
                    <SelectItem value="fast">Fast (&lt; 1s)</SelectItem>
                    <SelectItem value="medium">Medium (1-5s)</SelectItem>
                    <SelectItem value="slow">Slow (&gt; 5s)</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fromDate: e.target.value,
                    }))
                  }
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={filters.toDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
                <Button size="sm" onClick={handleSearch}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">User ID</TableHead>
                <TableHead className="text-center">Application</TableHead>
                <TableHead className="text-center">User Input</TableHead>
                <TableHead className="text-center">Created At</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Response Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInteractions.map((interaction, index) => (
                <TableRow
                  key={index}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedInteraction(interaction)}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{interaction.user_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <AppWindow className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{interaction.api_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center max-w-xs">
                    <span className="text-sm text-foreground truncate block">
                      {interaction.user_input}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">
                      {formatDate(interaction.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{interaction.duration}s</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusIndicator
                      statusCode={interaction.actions_result[0]?.status_code}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">
                      {interaction.actions_result[0]?.response_content &&
                      typeof interaction.actions_result[0].response_content ===
                        "string"
                        ? formatSize(
                            interaction.actions_result[0].response_content
                              .length,
                          )
                        : (interaction.actions_result[0]?.raw_data as any)
                              ?.response?.body
                          ? formatSize(
                              JSON.stringify(
                                (interaction.actions_result[0]?.raw_data as any)
                                  ?.response?.body,
                              ).length,
                            )
                          : "0 B"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 z-10 bg-background border-t">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                  actions
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rows per page:
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1 || loading}
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
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Details Modal */}
      {selectedInteraction && (
        <Dialog
          open={!!selectedInteraction}
          onOpenChange={() => setSelectedInteraction(null)}
        >
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Action Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 overflow-auto">
              {/* Summary Cards */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AppWindow className="w-3 h-3" />
                  {selectedInteraction.api_name}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {selectedInteraction.user_id}
                </Badge>
                <StatusIndicator
                  statusCode={
                    selectedInteraction.actions_result[0]?.status_code
                  }
                />
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedInteraction.duration}s
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(selectedInteraction.created_at)}
                </Badge>
              </div>

              {/* User Input */}
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-sm font-semibold mb-2">User Input</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {selectedInteraction.user_input}
                </p>
              </div>

              {/* Request Data */}
              <Card>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      request: !prev.request,
                    }))
                  }
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Request Data</CardTitle>
                    {expandedSections.request ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.request && (
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                      {JSON.stringify(
                        selectedInteraction.actions_result[0]?.raw_data
                          ?.request || {},
                        null,
                        2,
                      )}
                    </pre>
                  </CardContent>
                )}
              </Card>

              {/* Response Data */}
              <Card>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedSections((prev) => ({
                      ...prev,
                      response: !prev.response,
                    }))
                  }
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Response Data</CardTitle>
                    {expandedSections.response ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.response && (
                  <CardContent className="space-y-4">
                    {/* Response Content */}
                    {selectedInteraction.actions_result[0]?.response_content &&
                      typeof selectedInteraction.actions_result[0]
                        .response_content === "string" && (
                        <div>
                          <div
                            className="flex items-center justify-between cursor-pointer mb-2"
                            onClick={() =>
                              setExpandedSections((prev) => ({
                                ...prev,
                                responseContent: !prev.responseContent,
                              }))
                            }
                          >
                            <h4 className="text-sm font-semibold">
                              Response Content
                            </h4>
                            {expandedSections.responseContent ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                          {expandedSections.responseContent && (
                            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-48 border">
                              {
                                selectedInteraction.actions_result[0]
                                  .response_content
                              }
                            </pre>
                          )}
                        </div>
                      )}

                    {/* Raw Response Data */}
                    <div>
                      <div
                        className="flex items-center justify-between cursor-pointer mb-2"
                        onClick={() =>
                          setExpandedSections((prev) => ({
                            ...prev,
                            rawResponseData: !prev.rawResponseData,
                          }))
                        }
                      >
                        <h4 className="text-sm font-semibold">
                          Raw Response Data
                        </h4>
                        {expandedSections.rawResponseData ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                      {expandedSections.rawResponseData && (
                        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                          {JSON.stringify(
                            selectedInteraction.actions_result[0]?.raw_data
                              ?.response || {},
                            null,
                            2,
                          )}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
