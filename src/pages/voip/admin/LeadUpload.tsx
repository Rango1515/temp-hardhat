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
import { Badge } from "@/components/ui/badge";
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
import { Upload, FileText, Loader2, CheckCircle, XCircle, Trash2, ChevronDown, Phone, Clock, User, Tag, Wand2, PenLine, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UPLOAD_CATEGORIES, getCategoryLabel, extractCategoryFromFilename } from "@/lib/leadCategories";

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
  category?: string;
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
  const [uploadCategory, setUploadCategory] = useState<string>("uncategorized");
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null);
  const [removeCategoryDialogOpen, setRemoveCategoryDialogOpen] = useState(false);
  const [isRemovingCategory, setIsRemovingCategory] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Auto-detect mode
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  const fetchHistory = useCallback(async () => {
    const result = await apiCall<{ uploads: UploadHistory[] }>("voip-leads", {
      params: { action: "uploads" },
    });
    if (result.data) setUploadHistory(result.data.uploads);
    setIsLoadingHistory(false);
  }, [apiCall]);

  const fetchExistingCategories = useCallback(async () => {
    const result = await apiCall<{ counts: Record<string, number> }>("voip-leads", {
      params: { action: "category-counts" },
    });
    if (result.data?.counts) {
      setCategoryCounts(result.data.counts);
      setExistingCategories(Object.keys(result.data.counts).sort());
    }
  }, [apiCall]);

  useEffect(() => {
    fetchHistory();
    fetchExistingCategories();
  }, [fetchHistory, fetchExistingCategories]);

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
      toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    } else if (result.data) {
      toast({ title: "Upload Deleted", description: `Removed upload and ${result.data.leadsRemoved} unused leads.` });
      fetchHistory();
    }
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setUploadToDelete(null);
  };

  const handleRemoveCategory = async () => {
    if (!categoryToRemove) return;
    setIsRemovingCategory(true);
    const result = await apiCall<{ success: boolean; leadsHidden: number }>("voip-leads", {
      method: "POST",
      params: { action: "hide-category" },
      body: { category: categoryToRemove },
    });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({
        title: "Category Removed",
        description: `"${getCategoryLabel(categoryToRemove)}" removed from dialer. ${result.data?.leadsHidden || 0} leads hidden.`,
      });
      fetchExistingCategories();
    }
    setIsRemovingCategory(false);
    setRemoveCategoryDialogOpen(false);
    setCategoryToRemove(null);
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
      console.log("[LeadUpload] Parsing file:", selectedFile.name, "size:", selectedFile.size, "type:", selectedFile.type);
      const text = await selectedFile.text();
      console.log("[LeadUpload] File text length:", text.length, "first 200 chars:", text.substring(0, 200));
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      console.log("[LeadUpload] Total non-empty lines:", lines.length);
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
      console.log("[LeadUpload] Parsed leads:", leads.length, "valid:", leads.filter(l => l.valid).length, "invalid:", leads.filter(l => !l.valid).length);
      if (leads.length > 0) {
        console.log("[LeadUpload] First lead:", JSON.stringify(leads[0]));
      }
      setParsedLeads(leads);
    } catch (err) {
      console.error("[LeadUpload] Parse error:", err);
      toast({ title: "Parse Error", description: "Failed to parse the file", variant: "destructive" });
    }
    setIsParsing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log("[LeadUpload] File selected:", selectedFile.name, "ext:", selectedFile.name.split(".").pop());
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      // If the filename has no dot, treat it as txt
      const hasExtension = selectedFile.name.includes(".");
      if (hasExtension && !["txt", "doc", "docx", "csv"].includes(ext || "")) {
        toast({ title: "Invalid File Type", description: "Please upload a .txt, .doc, .docx, or .csv file", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);

      // Auto-detect category from filename
      if (autoDetectMode) {
        const detected = extractCategoryFromFilename(selectedFile.name);
        setUploadCategory(detected);
      }
    }
  };

  const handleAddCustomCategory = () => {
    const cat = customCategoryInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cat) return;
    setUploadCategory(cat);
    setCustomCategoryInput("");
    if (!existingCategories.includes(cat)) {
      setExistingCategories(prev => [...prev, cat].sort());
    }
  };

  const handleImport = async () => {
    if (!file || parsedLeads.length === 0) return;
    const validLeads = parsedLeads.filter((l) => l.valid);
    if (validLeads.length === 0) {
      toast({ title: "No Valid Leads", description: "No valid leads to import", variant: "destructive" });
      return;
    }
    if (!uploadCategory) {
      toast({ title: "Category Required", description: "Please select a lead category before importing", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    const result = await apiCall<{ imported_count: number; duplicate_count: number; invalid_count: number }>("voip-leads", {
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
      toast({ title: "Import Failed", description: result.error, variant: "destructive" });
    } else if (result.data) {
      toast({ title: "Import Complete", description: `Imported ${result.data.imported_count} leads as "${getCategoryLabel(uploadCategory)}". ${result.data.duplicate_count} duplicates skipped.` });
      setFile(null);
      setParsedLeads([]);
      setUploadCategory("uncategorized");
      fetchHistory();
      fetchExistingCategories();
    }
    setIsImporting(false);
  };

  const validCount = parsedLeads.filter((l) => l.valid).length;
  const invalidCount = parsedLeads.filter((l) => !l.valid).length;

  // Merge static + dynamic categories for manual mode
  const allCategoryOptions = Array.from(
    new Set([
      ...UPLOAD_CATEGORIES.map(c => c.value),
      ...existingCategories,
    ])
  ).sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)));

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
            {/* Category Mode Toggle */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Lead Category <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={autoDetectMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoDetectMode(true)}
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Auto from Filename
                </Button>
                <Button
                  variant={!autoDetectMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoDetectMode(false)}
                >
                  <PenLine className="w-3 h-3 mr-1" />
                  Manual
                </Button>
              </div>

              {autoDetectMode ? (
                <div className="p-3 rounded-lg bg-muted/50">
                  {file ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Detected category:</span>
                      <Badge variant="secondary" className="text-sm">
                        {getCategoryLabel(uploadCategory)}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAutoDetectMode(false)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Upload a file to auto-detect category from filename (e.g. <code>fitness_leads.txt</code> → Fitness)
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {allCategoryOptions.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Or create new category..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCustomCategory()}
                    />
                    <Button variant="outline" size="sm" onClick={handleAddCustomCategory} disabled={!customCategoryInput.trim()}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}
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
                  <Badge variant="outline" className="ml-auto">
                    <Tag className="w-3 h-3 mr-1" />
                    {getCategoryLabel(uploadCategory)}
                  </Badge>
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
                        <TableHead>Category</TableHead>
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
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(uploadCategory)}
                            </Badge>
                          </TableCell>
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
              </>
            )}

            {/* Upload button — always visible when a file is selected */}
            {file && (
              <Button onClick={handleImport} disabled={isImporting || isParsing} size="lg" className="w-full">
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Parsing file...
                  </>
                ) : validCount > 0 ? (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {validCount} Leads as "{getCategoryLabel(uploadCategory)}"
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Leads
                  </>
                )}
              </Button>
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
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{upload.filename}</p>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {getCategoryLabel(upload.category)}
                                </Badge>
                              </div>
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
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(upload); }}
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
        {/* Manage Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Manage Dialer Categories
            </CardTitle>
            <CardDescription>
              Remove categories from the dialer dropdown. This will hide all leads in that category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingCategories.filter(c => c !== "uncategorized").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories found</p>
            ) : (
              <div className="space-y-2">
                {existingCategories
                  .filter(c => c !== "uncategorized")
                  .map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{getCategoryLabel(cat)}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryCounts[cat] || 0} available leads
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCategoryToRemove(cat);
                          setRemoveCategoryDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Upload Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the upload record for "{uploadToDelete?.filename}" and remove any leads that haven't been called yet.
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

      {/* Remove Category Confirmation Dialog */}
      <AlertDialog open={removeCategoryDialogOpen} onOpenChange={setRemoveCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{categoryToRemove ? getCategoryLabel(categoryToRemove) : ""}" from the dialer dropdown and hide all {categoryToRemove ? (categoryCounts[categoryToRemove] || 0) : 0} leads in this category. This action is logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCategory}
              disabled={isRemovingCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingCategory ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Category"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </VoipLayout>
  );
}