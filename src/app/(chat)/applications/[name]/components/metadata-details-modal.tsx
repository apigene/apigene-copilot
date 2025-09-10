"use client";

import { useState, useEffect } from "react";
import { ApplicationData } from "@/types/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Save, X, Loader2, Database, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useApigeneApi } from "@/lib/api/apigene-client";

interface MetadataDetailsModalProps {
  open: boolean;
  onClose: () => void;
  operation: any;
  application: ApplicationData;
  onUpdate: () => void;
}

export function MetadataDetailsModal({
  open,
  onClose,
  operation,
  application,
  onUpdate,
}: MetadataDetailsModalProps) {
  const apiClient = useApigeneApi();
  const [editMetadata, setEditMetadata] = useState(false);
  const [updatingOperation, setUpdatingOperation] = useState<string | null>(
    null,
  );
  const [editingOperation, setEditingOperation] = useState<any>(null);

  // Initialize editing operation when modal opens
  useEffect(() => {
    if (operation && open) {
      setEditingOperation({ ...operation });
      setEditMetadata(false);
      // Reset editing states
      setEditKey(null);
      setEditValue("");
      setEditOptionalKey(null);
      setEditOptionalValue("");
      setEditResponseKPKey(null);
      setEditResponseKPValue("");
      setNewResponseKPKey("");
      setNewResponseKPValue("");
      setNewInputKey("");
      setNewInputValue("");
      setNewInputIsRequired(true);
    }
  }, [operation, open]);

  // States for editing individual fields
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // States for optional inputs editing
  const [editOptionalKey, setEditOptionalKey] = useState<string | null>(null);
  const [editOptionalValue, setEditOptionalValue] = useState("");

  // States for response key_parameters editing
  const [editResponseKPKey, setEditResponseKPKey] = useState<string | null>(
    null,
  );
  const [editResponseKPValue, setEditResponseKPValue] = useState("");
  const [newResponseKPKey, setNewResponseKPKey] = useState("");
  const [newResponseKPValue, setNewResponseKPValue] = useState("");

  // States for combined inputs
  const [newInputKey, setNewInputKey] = useState("");
  const [newInputValue, setNewInputValue] = useState("");
  const [newInputIsRequired, setNewInputIsRequired] = useState(true);

  // Required inputs handlers
  const handleDelete = (key: string) => {
    if (!editingOperation) return;
    setEditingOperation((prev) => ({
      ...prev!,
      required_inputs: Object.fromEntries(
        Object.entries(prev!.required_inputs).filter(([k]) => k !== key),
      ),
    }));
  };

  const handleEdit = (key: string) => {
    setEditKey(key);
    setEditValue(editingOperation?.required_inputs[key] || "");
  };

  const handleEditSubmit = (key: string) => {
    if (!editingOperation) return;
    setEditingOperation((prev) => ({
      ...prev!,
      required_inputs: { ...prev!.required_inputs, [key]: editValue },
    }));
    setEditKey(null);
  };

  // Move functionality
  const handleMoveToOptional = (key: string) => {
    if (!editingOperation) return;
    const value = editingOperation.required_inputs[key];
    setEditingOperation((prev) => ({
      ...prev!,
      required_inputs: Object.fromEntries(
        Object.entries(prev!.required_inputs).filter(([k]) => k !== key),
      ),
      optional_inputs: { ...prev!.optional_inputs, [key]: value },
    }));
  };

  const handleMoveToRequired = (key: string) => {
    if (!editingOperation) return;
    const value = editingOperation.optional_inputs[key];
    setEditingOperation((prev) => ({
      ...prev!,
      optional_inputs: Object.fromEntries(
        Object.entries(prev!.optional_inputs).filter(([k]) => k !== key),
      ),
      required_inputs: { ...prev!.required_inputs, [key]: value },
    }));
  };

  // Combined add function
  const handleAddInput = () => {
    if (newInputKey.trim() && editingOperation) {
      if (newInputIsRequired) {
        setEditingOperation((prev) => ({
          ...prev!,
          required_inputs: {
            ...prev!.required_inputs,
            [newInputKey]: newInputValue,
          },
        }));
      } else {
        setEditingOperation((prev) => ({
          ...prev!,
          optional_inputs: {
            ...prev!.optional_inputs,
            [newInputKey]: newInputValue,
          },
        }));
      }
      setNewInputKey("");
      setNewInputValue("");
    }
  };

  // Optional inputs handlers
  const handleDeleteOptional = (key: string) => {
    if (!editingOperation) return;
    setEditingOperation((prev) => ({
      ...prev!,
      optional_inputs: Object.fromEntries(
        Object.entries(prev!.optional_inputs).filter(([k]) => k !== key),
      ),
    }));
  };

  const handleEditOptional = (key: string) => {
    setEditOptionalKey(key);
    setEditOptionalValue(editingOperation?.optional_inputs[key] || "");
  };

  const handleEditOptionalSubmit = (key: string) => {
    if (!editingOperation) return;
    setEditingOperation((prev) => ({
      ...prev!,
      optional_inputs: { ...prev!.optional_inputs, [key]: editOptionalValue },
    }));
    setEditOptionalKey(null);
  };

  // Response key parameters handlers
  const handleDeleteResponseKP = (key: string) => {
    if (!editingOperation) return;
    setEditingOperation((prev) => ({
      ...prev!,
      response: {
        ...prev!.response,
        key_parameters: Object.fromEntries(
          Object.entries(prev!.response.key_parameters).filter(
            ([k]) => k !== key,
          ),
        ),
      },
    }));
  };

  const handleEditResponseKP = (key: string) => {
    setEditResponseKPKey(key);
    setEditResponseKPValue(
      editingOperation?.response?.key_parameters[key] || "",
    );
  };

  const handleEditResponseKPSubmit = (key: string) => {
    if (!editingOperation) return;
    setEditingOperation((prev) => ({
      ...prev!,
      response: {
        ...prev!.response,
        key_parameters: {
          ...prev!.response.key_parameters,
          [key]: editResponseKPValue,
        },
      },
    }));
    setEditResponseKPKey(null);
  };

  const handleAddResponseKP = () => {
    if (newResponseKPKey.trim() && editingOperation) {
      setEditingOperation((prev) => ({
        ...prev!,
        response: {
          ...prev!.response,
          key_parameters: {
            ...prev!.response.key_parameters,
            [newResponseKPKey]: newResponseKPValue,
          },
        },
      }));
      setNewResponseKPKey("");
      setNewResponseKPValue("");
    }
  };

  // Update metadata item
  const updateMetadataItem = async () => {
    if (!editingOperation) return;

    setUpdatingOperation(editingOperation.operationId);
    try {
      await apiClient.specUpdateAgenticMetadata(application.api_name!, {
        operationId: editingOperation.operationId,
        description: editingOperation.description,
        required_inputs: editingOperation.required_inputs,
        optional_inputs: editingOperation.optional_inputs,
        response: editingOperation.response,
        type: editingOperation.type,
        rating: editingOperation.rating,
      });

      toast.success("Metadata updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Error updating metadata:", err);
      toast.error("Failed to update metadata");
    } finally {
      setUpdatingOperation(null);
    }
  };

  if (!operation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {operation.operationId} - Metadata Details
            </DialogTitle>
            <Button
              variant="outline"
              onClick={() => setEditMetadata(!editMetadata)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {editMetadata ? "Cancel Edit" : "Edit"}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Type</Label>
              {editMetadata ? (
                <Input
                  value={editingOperation?.type || ""}
                  onChange={(e) => {
                    if (editingOperation) {
                      setEditingOperation({
                        ...editingOperation,
                        type: e.target.value,
                      });
                    }
                  }}
                  placeholder="Enter type..."
                />
              ) : (
                <p className="text-base">
                  {editingOperation?.type || "Not specified"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">Rating</Label>
              {editMetadata ? (
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={editingOperation?.rating || ""}
                  onChange={(e) => {
                    if (editingOperation) {
                      setEditingOperation({
                        ...editingOperation,
                        rating: parseInt(e.target.value) || 0,
                      });
                    }
                  }}
                  placeholder="Enter rating (1-10)..."
                />
              ) : (
                <p className="text-base">
                  {editingOperation?.rating || "Not rated"}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Description</Label>
            {editMetadata ? (
              <Textarea
                value={editingOperation?.description || ""}
                onChange={(e) => {
                  if (editingOperation) {
                    setEditingOperation({
                      ...editingOperation,
                      description: e.target.value,
                    });
                  }
                }}
                placeholder="Enter description..."
                rows={3}
              />
            ) : (
              <p className="text-base">
                {editingOperation?.description || "No description available"}
              </p>
            )}
          </div>

          {/* Combined Inputs */}
          <Accordion type="single" collapsible defaultValue="inputs">
            <AccordionItem value="inputs">
              <AccordionTrigger className="text-base font-medium">
                Inputs
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {/* Required Inputs */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-emerald-400">
                      Required Inputs
                    </Label>
                    {Object.entries(
                      editingOperation?.required_inputs || {},
                    ).map(([key, value]) => (
                      <div
                        key={`required-${key}`}
                        className="flex items-center gap-2"
                      >
                        {editMetadata && editKey === key ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 bg-background border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-400/20"
                              placeholder="Enter value..."
                              autoFocus
                            />
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEditSubmit(key)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditKey(null)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            {editMetadata ? (
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 flex-1 cursor-pointer text-left bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 rounded-sm"
                                onClick={() => handleEdit(key)}
                              >
                                <span className="font-medium text-sm">
                                  {key}:
                                </span>
                                <span className="text-sm">{String(value)}</span>
                              </Badge>
                            ) : (
                              <div className="flex-1 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-sm">
                                <span className="font-medium text-emerald-400">
                                  {key}:
                                </span>
                                <span className="text-emerald-300 ml-1">
                                  {String(value)}
                                </span>
                              </div>
                            )}
                            {editMetadata && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMoveToOptional(key)}
                                  className="p-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-500/20 transition-colors"
                                  title="Move to Optional"
                                >
                                  →
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(key)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                                  title="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Optional Inputs */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-400">
                      Optional Inputs
                    </Label>
                    {Object.entries(
                      editingOperation?.optional_inputs || {},
                    ).map(([key, value]) => (
                      <div
                        key={`optional-${key}`}
                        className="flex items-center gap-2"
                      >
                        {editMetadata && editOptionalKey === key ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editOptionalValue}
                              onChange={(e) =>
                                setEditOptionalValue(e.target.value)
                              }
                              className="flex-1 bg-background border-slate-500/50 focus:border-slate-400 focus:ring-slate-400/20"
                              placeholder="Enter value..."
                              autoFocus
                            />
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleEditOptionalSubmit(key)}
                              className="bg-slate-600 hover:bg-slate-700 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditOptionalKey(null)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            {editMetadata ? (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 flex-1 cursor-pointer text-left bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30 rounded-sm"
                                onClick={() => handleEditOptional(key)}
                              >
                                <span className="font-medium text-sm">
                                  {key}:
                                </span>
                                <span className="text-sm">{String(value)}</span>
                              </Badge>
                            ) : (
                              <div className="flex-1 p-2 bg-slate-500/10 border border-slate-500/20 rounded-sm text-sm">
                                <span className="font-medium text-slate-400">
                                  {key}:
                                </span>
                                <span className="text-slate-300 ml-1">
                                  {String(value)}
                                </span>
                              </div>
                            )}
                            {editMetadata && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMoveToRequired(key)}
                                  className="p-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                                  title="Move to Required"
                                >
                                  ←
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteOptional(key)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                                  title="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add New Input */}
                  {editMetadata && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <Label className="text-sm font-medium text-foreground">
                        Add New Input
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter key name..."
                          value={newInputKey}
                          onChange={(e) => setNewInputKey(e.target.value)}
                          className="flex-1 bg-background border-border focus:border-primary focus:ring-primary/20"
                        />
                        <Input
                          placeholder="Enter value..."
                          value={newInputValue}
                          onChange={(e) => setNewInputValue(e.target.value)}
                          className="flex-1 bg-background border-border focus:border-primary focus:ring-primary/20"
                        />
                        <Button
                          variant={newInputIsRequired ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setNewInputIsRequired(!newInputIsRequired)
                          }
                          className={`px-4 transition-colors ${
                            newInputIsRequired
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "border-slate-500/50 text-slate-400 hover:bg-slate-500/10"
                          }`}
                        >
                          {newInputIsRequired ? "Required" : "Optional"}
                        </Button>
                        <Button
                          onClick={handleAddInput}
                          variant="default"
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={!newInputKey.trim()}
                        >
                          Add Input
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Response */}
          <Accordion type="single" collapsible>
            <AccordionItem value="response">
              <AccordionTrigger className="text-base font-medium">
                Response
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Summary</Label>
                    {editMetadata ? (
                      <Textarea
                        value={editingOperation?.response?.summary || ""}
                        onChange={(e) => {
                          if (editingOperation) {
                            setEditingOperation({
                              ...editingOperation,
                              response: {
                                ...editingOperation.response,
                                summary: e.target.value,
                              },
                            });
                          }
                        }}
                        placeholder="Enter response summary..."
                        rows={2}
                      />
                    ) : (
                      <p className="text-base">
                        {editingOperation?.response?.summary ||
                          "No summary available"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Format</Label>
                    {editMetadata ? (
                      <Input
                        value={editingOperation?.response?.format || ""}
                        onChange={(e) => {
                          if (editingOperation) {
                            setEditingOperation({
                              ...editingOperation,
                              response: {
                                ...editingOperation.response,
                                format: e.target.value,
                              },
                            });
                          }
                        }}
                        placeholder="Enter response format..."
                      />
                    ) : (
                      <p className="text-base">
                        {editingOperation?.response?.format ||
                          "No format specified"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Key Parameters
                    </Label>
                    <div className="space-y-2">
                      {Object.entries(
                        editingOperation?.response?.key_parameters || {},
                      ).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          {editMetadata && editResponseKPKey === key ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editResponseKPValue}
                                onChange={(e) =>
                                  setEditResponseKPValue(e.target.value)
                                }
                                className="flex-1 bg-background border-blue-500/50 focus:border-blue-400 focus:ring-blue-400/20"
                                placeholder="Enter value..."
                                autoFocus
                              />
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleEditResponseKPSubmit(key)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditResponseKPKey(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1">
                              {editMetadata ? (
                                <Badge
                                  variant="secondary"
                                  className="flex items-center gap-1 flex-1 cursor-pointer text-left bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30 rounded-sm"
                                  onClick={() => handleEditResponseKP(key)}
                                >
                                  <span className="font-medium text-sm">
                                    {key}:
                                  </span>
                                  <span className="text-sm">
                                    {String(value)}
                                  </span>
                                </Badge>
                              ) : (
                                <div className="flex-1 p-2 bg-blue-500/10 border border-blue-500/20 rounded-sm text-sm">
                                  <span className="font-medium text-blue-400">
                                    {key}:
                                  </span>
                                  <span className="text-blue-300 ml-1">
                                    {String(value)}
                                  </span>
                                </div>
                              )}
                              {editMetadata && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteResponseKP(key)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                                  title="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {editMetadata && (
                        <div className="flex gap-2 pt-2 border-t border-border/30">
                          <Input
                            placeholder="Enter key name..."
                            value={newResponseKPKey}
                            onChange={(e) =>
                              setNewResponseKPKey(e.target.value)
                            }
                            className="flex-1 bg-background border-border focus:border-primary focus:ring-primary/20"
                          />
                          <Input
                            placeholder="Enter value..."
                            value={newResponseKPValue}
                            onChange={(e) =>
                              setNewResponseKPValue(e.target.value)
                            }
                            className="flex-1 bg-background border-border focus:border-primary focus:ring-primary/20"
                          />
                          <Button
                            onClick={handleAddResponseKP}
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!newResponseKPKey.trim()}
                          >
                            Add Parameter
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {editMetadata && (
              <Button
                onClick={updateMetadataItem}
                disabled={updatingOperation === editingOperation?.operationId}
                className="flex items-center gap-2"
              >
                {updatingOperation === editingOperation?.operationId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
