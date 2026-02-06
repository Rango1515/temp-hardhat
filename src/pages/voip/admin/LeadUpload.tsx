import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, FileText, Loader2, CheckCircle, XCircle, Trash2, ChevronDown, Phone, Clock, User, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LEAD_CATEGORIES, getCategoryLabel } from "@/lib/leadCategories";

interface ParsedLead {
  name: string;
  phone: string;
  email: string;
  website: string;
  valid: boolean;
  error?: string;
}

interface UploadHistory {
  id: number;
  filename: string;
  total_lines: number;
  imported_count: number;
  duplicate_count: number;
  invalid_count: number;
  called_count: number;
  created_at: string;
}

interface CallRecord {
  id: number;
  lead_name: string;
  lead_phone: string;
  caller: string;
  start_time: string;
  duration_seconds: number | null;
  outcome: string | null;
}

export default function LeadUpload() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<UploadHistory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedUploads, setExpandedUploads] = useState<Set<number>>(new Set());
  const [uploadCalls, setUploadCalls] = useState<Map<number, CallRecord[]>>(new Map());
  const [loadingCalls, setLoadingCalls] = useState<Set<number>>(new Set());
  const [uploadCategory, setUploadCategory] = useState<string>("electricians");

  const fetchHistory = useCallback(async () => {
    const result = await apiCall<{ uploads: UploadHistory[] }>("voip-leads", {
      params: { action: "uploads" },
    });
    if (result.data) setUploadHistory(result.data.uploads);
    setIsLoadingHistory(false);
  }, [apiCall]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const fetchUploadCalls = async (uploadId: number) => {
    if (uploadCalls.has(uploadId)) return;
    
    setLoadingCalls(prev => new Set(prev).add(uploadId));
    
    const result = await apiCall<{ calls: CallRecord[] }>("voip-leads", {
      params: { action: "upload-calls", uploadId: uploadId.toString() },
    });
    
    if (result.data) {
      setUploadCalls(prev => new Map(prev).set(uploadId, result.data!.calls));
    }
    
    setLoadingCalls(prev => {
      const next = new Set(prev);
      next.delete(uploadId);
      return next;
    });
  };

  const toggleExpanded = (uploadId: number) => {
    setExpandedUploads(prev => {
      const next = new Set(prev);
      if (next.has(uploadId)) {
        next.delete(uploadId);
      } else {
        next.add(uploadId);
        fetchUploadCalls(uploadId);
      }
      return next;
    });
  };

  const handleDeleteClick = (upload: UploadHistory) => {
    setUploadToDelete(upload);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!uploadToDelete) return;
    
    setIsDeleting(true);
    
    const result = await apiCall<{ deleted: boolean; leadsRemoved: number }>("voip-leads", {
      method: "POST",
      params: { action: "delete-upload" },
      body: { uploadId: uploadToDelete.id },
    });

    if (result.error) {
      toast({
        title: "Delete Failed",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.data) {
      toast({
        title: "Upload Deleted",
        description: `Removed upload and ${result.data.leadsRemoved} unused leads.`,
      });
      fetchHistory();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setUploadToDelete(null);
  };

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null || seconds === undefined) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatOutcome = (outcome: string | null): string => {
    if (!outcome) return "—";
    return outcome.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseFile = async (selectedFile: File) => {
    setIsParsing(true);
    setParsedLeads([]);

    try {
      const text = await selectedFile.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      const isCSV = ext === "csv";

      const firstLine = lines[0]?.toLowerCase() || "";
      const hasHeader = firstLine.includes("name") || firstLine.includes("phone") || firstLine.includes("email");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const leads: ParsedLead[] = dataLines.map((line) => {
        const parts = isCSV ? parseCSVLine(line) : line.split("|").map((p) => p.trim());
        const [name, phone, email, website] = parts;

        const cleanValue = (val: string | undefined) => {
          if (!val) return "";
          const lower = val.toLowerCase();
          if (["none", "null", "—", "-", "n/a"].includes(lower)) return "";
          return val.trim();
        };

        const cleanedPhone = cleanValue(phone)?.replace(/[^\d+]/g, "") || "";
        const cleanedEmail = cleanValue(email)?.toLowerCase() || "";
        const cleanedWebsite = cleanValue(website) || "";

        const lead: ParsedLead = {
          name: cleanValue(name) || "—",
          phone: cleanedPhone,
          email: cleanedEmail,
          website: cleanedWebsite ? (cleanedWebsite.startsWith("http") ? cleanedWebsite : `https://${cleanedWebsite}`) : "",
          valid: true,
        };

        if (!cleanedPhone || cleanedPhone.length < 10) {
          lead.valid = false;
          lead.error = "Invalid phone number";
        }

        return lead;
      });

      setParsedLeads(leads);
    } catch {
      toast({
        title: "Parse Error",
        description: "Failed to parse the file",
        variant: "destructive",
      });
    }

    setIsParsing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!["txt", "doc", "docx", "csv"].includes(ext || "")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .txt, .doc, .docx, or .csv file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || parsedLeads.length === 0) return;

    const validLeads = parsedLeads.filter((l) => l.valid);
    if (validLeads.length === 0) {
      toast({
        title: "No Valid Leads",
        description: "No valid leads to import",
        variant: "destructive",
      });
      return;
    }

    if (!uploadCategory) {
      toast({
        title: "Category Required",
        description: "Please select a lead category before importing",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    const result = await apiCall<{
      imported_count: number;
      duplicate_count: number;
      invalid_count: number;
    }>("voip-leads", {
      method: "POST",
      params: { action: "upload" },
      body: {
        filename: file.name,
        category: uploadCategory,
        leads: validLeads.map((l) => ({
          name: l.name === "—" ? null : l.name,
          phone: l.phone,
          email: l.email || null,
          website: l.website || null,
        })),
      },
    });

    if (result.error) {
      toast({
        title: "Import Failed",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.data) {
      toast({
        title: "Import Complete",
        description: `Imported ${result.data.imported_count} leads. ${result.data.duplicate_count} duplicates skipped.`,
      });
      setFile(null);
      setParsedLeads([]);
      fetchHistory();
    }

    setIsImporting(false);
  };

  const validCount = parsedLeads.filter((l) => l.valid).length;
  const invalidCount = parsedLeads.filter((l) => !l.valid).length;

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lead Upload</h1>
          <p className="text-muted-foreground">Import leads from text files</p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Leads
            </CardTitle>
            <CardDescription>
              Upload a file with one lead per line. Format: Name, Phone, Email, Website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Lead Category <span className="text-destructive">*</span>
              </Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {LEAD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept=".txt,.doc,.docx,.csv"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: .txt, .doc, .docx, .csv (use | for txt/doc, comma for csv)
              </p>
            </div>

            {isParsing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing file...
              </div>
            )}

            {parsedLeads.length > 0 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{validCount} valid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm">{invalidCount} invalid</span>
                  </div>
                </div>

                <div className="max-h-64 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Website</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedLeads.slice(0, 20).map((lead, i) => (
                        <TableRow key={i} className={!lead.valid ? "bg-destructive/5" : ""}>
                          <TableCell>
                            {lead.valid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell>{lead.name}</TableCell>
                          <TableCell className="font-mono text-sm">{lead.phone || "—"}</TableCell>
                          <TableCell>{lead.email || "—"}</TableCell>
                          <TableCell className="max-w-32 truncate">{lead.website || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedLeads.length > 20 && (
                    <div className="p-2 text-center text-sm text-muted-foreground border-t">
                      ...and {parsedLeads.length - 20} more leads
                    </div>
                  )}
                </div>

                <Button onClick={handleImport} disabled={isImporting || validCount === 0}>
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {validCount} Leads
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upload History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Upload History
            </CardTitle>
            <CardDescription>Previous lead imports and call activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : uploadHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No uploads yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadHistory.map((upload) => (
                  <Collapsible
                    key={upload.id}
                    open={expandedUploads.has(upload.id)}
                    onOpenChange={() => toggleExpanded(upload.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{upload.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(upload.created_at), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 text-sm">
                              <span className="text-green-600">{upload.imported_count} imported</span>
                              <span className="text-blue-500">{upload.called_count} called</span>
                              <span className="text-yellow-600">{upload.duplicate_count} dup</span>
                              <span className="text-destructive">{upload.invalid_count} invalid</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(upload);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", expandedUploads.has(upload.id) && "rotate-180")} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t px-4 py-3 bg-muted/30">
                          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Call History
                          </h4>
                          {loadingCalls.has(upload.id) ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : (uploadCalls.get(upload.id)?.length || 0) === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No calls made to leads in this upload yet.</p>
                          ) : (
                            <div className="overflow-auto max-h-64">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Lead</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Called By</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Outcome</TableHead>
                                    <TableHead>Date</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {uploadCalls.get(upload.id)?.map((call) => (
                                    <TableRow key={call.id}>
                                      <TableCell className="font-medium">{call.lead_name || "—"}</TableCell>
                                      <TableCell className="font-mono text-sm">{call.lead_phone}</TableCell>
                                      <TableCell>
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {call.caller}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {formatDuration(call.duration_seconds)}
                                        </span>
                                      </TableCell>
                                      <TableCell>{formatOutcome(call.outcome)}</TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {call.start_time ? format(new Date(call.start_time), "MMM d, h:mm a") : "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the upload record for "{uploadToDelete?.filename}" and remove any leads that haven't been called yet. Leads that have already been called will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VoipLayout>
  );
}
