import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  created_at: string;
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

  const parseFile = async (selectedFile: File) => {
    setIsParsing(true);
    setParsedLeads([]);

    try {
      const text = await selectedFile.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());

      // Check if first line is a header
      const firstLine = lines[0]?.toLowerCase() || "";
      const hasHeader = firstLine.includes("name") || firstLine.includes("phone") || firstLine.includes("email");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const leads: ParsedLead[] = dataLines.map((line) => {
        const parts = line.split("|").map((p) => p.trim());
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

        // Validate phone
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
      if (!["txt", "doc", "docx"].includes(ext || "")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .txt, .doc, or .docx file",
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
              Upload a .txt file with one lead per line. Format: Name | Phone | Email | Website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept=".txt,.doc,.docx"
                onChange={handleFileChange}
                disabled={isParsing || isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: .txt, .doc, .docx
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
            <CardDescription>Previous lead imports</CardDescription>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Imported</TableHead>
                    <TableHead className="text-right">Duplicates</TableHead>
                    <TableHead className="text-right">Invalid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadHistory.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="font-medium">{upload.filename}</TableCell>
                      <TableCell>{format(new Date(upload.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell className="text-right text-green-600">{upload.imported_count}</TableCell>
                      <TableCell className="text-right text-yellow-600">{upload.duplicate_count}</TableCell>
                      <TableCell className="text-right text-destructive">{upload.invalid_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
