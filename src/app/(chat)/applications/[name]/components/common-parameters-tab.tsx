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
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CommonParametersTabProps {
  application: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => Promise<boolean>;
}

interface ParamItem {
  key: string;
  values: string[];
  isEditing?: boolean;
  isNew?: boolean;
  editKey?: string;
  editValue?: string;
}

export function CommonParametersTab({
  application,
  onUpdate,
}: CommonParametersTabProps) {
  const [parameters, setParameters] = useState<ParamItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize parameters from application data
  useEffect(() => {
    if (application.common_parameters) {
      const params = Object.entries(application.common_parameters).map(
        ([key, value]) => ({
          key,
          values: Array.isArray(value) ? value.map(String) : [String(value)],
          isEditing: false,
          isNew: false,
        }),
      );
      setParameters(params);
    }
  }, [application.common_parameters]);

  // Filter parameters based on search term
  const filteredParams = useMemo(
    () =>
      parameters.filter((param) =>
        param.key.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [parameters, searchTerm],
  );

  // Start editing a parameter
  const startEditing = (index: number) => {
    setParameters((prev) => {
      const updated = [...prev];
      updated[index].isEditing = true;
      updated[index].editValue = updated[index].values.join("; ");
      if (updated[index].isNew) {
        updated[index].editKey = updated[index].key;
      }
      return updated;
    });
  };

  // Cancel editing
  const cancelEditing = (index: number) => {
    setParameters((prev) => {
      const updated = [...prev];
      if (updated[index].isNew) {
        updated.splice(index, 1);
      } else {
        updated[index].isEditing = false;
        updated[index].editValue = undefined;
      }
      return updated;
    });
  };

  // Save row changes
  const saveRow = (index: number) => {
    setParameters((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newKey = item.isNew ? (item.editKey || "").trim() : item.key;

      if (item.isNew && !newKey) {
        toast.error("Parameter key cannot be empty");
        return prev;
      }

      const newValues = (item.editValue || "")
        .split(";")
        .map((val) => val.trim())
        .filter((val) => val);

      updated[index] = {
        key: newKey,
        values: newValues,
        isEditing: false,
        isNew: false,
      };
      return updated;
    });
  };

  // Remove a parameter
  const removeRow = (index: number) => {
    setParameters((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Add new parameter
  const addParameter = () => {
    setParameters((prev) => [
      ...prev,
      {
        key: "",
        values: [],
        isEditing: true,
        isNew: true,
        editKey: "",
        editValue: "",
      },
    ]);
  };

  // Handle update
  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus("idle");
    setErrorMessage("");

    try {
      const updatedParams = parameters.reduce(
        (acc, { key, values }) => {
          acc[key] = values;
          return acc;
        },
        {} as Record<string, any>,
      );

      const updateData: Partial<ApplicationData> = {
        common_parameters: updatedParams,
      };

      const success = await onUpdate(updateData);

      if (success) {
        setUpdateStatus("success");
        toast.success("Common parameters updated successfully!");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Update failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update common parameters. Please try again.",
      );
      setUpdateStatus("error");
      toast.error("Failed to update common parameters. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              onClick={addParameter}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-9 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Parameter
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="flex items-center gap-2 h-9 w-full sm:w-auto"
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
              Common parameters updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Parameters Table */}
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Parameter</TableHead>
                    <TableHead className="w-[40%]">Values</TableHead>
                    <TableHead className="w-[20%] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParams.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        {searchTerm
                          ? "No parameters found matching your search."
                          : "No common parameters configured."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParams.map((param, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {param.isEditing && param.isNew ? (
                            <div className="space-y-1">
                              <Label
                                htmlFor={`edit-key-${index}`}
                                className="text-xs text-muted-foreground"
                              >
                                Parameter Key
                              </Label>
                              <Input
                                id={`edit-key-${index}`}
                                value={param.editKey}
                                onChange={(e) =>
                                  setParameters((prev) => {
                                    const updated = [...prev];
                                    updated[index].editKey = e.target.value;
                                    return updated;
                                  })
                                }
                                placeholder="Enter parameter key..."
                                className="h-8"
                              />
                            </div>
                          ) : (
                            <span className="font-medium">{param.key}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {param.isEditing ? (
                            <div className="space-y-1">
                              <Label
                                htmlFor={`edit-value-${index}`}
                                className="text-xs text-muted-foreground"
                              >
                                Values (separated by &apos;;&apos;)
                              </Label>
                              <Input
                                id={`edit-value-${index}`}
                                value={param.editValue}
                                onChange={(e) =>
                                  setParameters((prev) => {
                                    const updated = [...prev];
                                    updated[index].editValue = e.target.value;
                                    return updated;
                                  })
                                }
                                placeholder="Enter values separated by ';'"
                                className="h-8"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {param.values.length > 0
                                ? param.values.join("; ")
                                : "No values"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {param.isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveRow(index)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelEditing(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(index)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRow(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden p-4 space-y-3">
              {filteredParams.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchTerm
                    ? "No parameters found matching your search."
                    : "No common parameters configured."}
                </div>
              ) : (
                filteredParams.map((param, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    {/* Parameter Key */}
                    <div>
                      {param.isEditing && param.isNew ? (
                        <div className="space-y-1">
                          <Label
                            htmlFor={`edit-key-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            Parameter Key
                          </Label>
                          <Input
                            id={`edit-key-${index}`}
                            value={param.editKey}
                            onChange={(e) => {
                              const newParams = [...parameters];
                              newParams[index].editKey = e.target.value;
                              setParameters(newParams);
                            }}
                            placeholder="Enter parameter key..."
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Parameter
                          </Label>
                          <p className="font-medium text-sm">{param.key}</p>
                        </div>
                      )}
                    </div>

                    {/* Parameter Values */}
                    <div>
                      {param.isEditing ? (
                        <div className="space-y-1">
                          <Label
                            htmlFor={`edit-value-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            Values (comma-separated)
                          </Label>
                          <Input
                            id={`edit-value-${index}`}
                            value={param.editValue}
                            onChange={(e) => {
                              const newParams = [...parameters];
                              newParams[index].editValue = e.target.value;
                              setParameters(newParams);
                            }}
                            placeholder="Enter values separated by commas..."
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Values
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {param.values.join("; ")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      {param.isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveRow(index)}
                            className="flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelEditing(index)}
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(index)}
                            className="flex items-center gap-1"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRow(index)}
                            className="flex items-center gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
