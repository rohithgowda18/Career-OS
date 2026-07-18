import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumesApi, ResumeData } from "@/lib/api/resumesApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";

export default function ResumesView() {
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch resumes list
  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: resumesApi.list,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please select a file");
      setIsUploading(true);
      return resumesApi.upload(resumeName, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume uploaded successfully");
      setShowUploadModal(false);
      resetUploadForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload resume");
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async () => {
      if (!selectedResume) return;
      return resumesApi.rename(selectedResume.id, renameName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume renamed successfully");
      setShowRenameModal(false);
      setSelectedResume(null);
      setRenameName("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to rename resume");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: resumesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete resume");
    }
  });

  const resetUploadForm = () => {
    setResumeName("");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      setFile(selectedFile);
      if (!resumeName) {
        // Pre-fill name from file name without extension
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setResumeName(cleanName);
      }
    }
  };

  const handleView = async (resume: ResumeData) => {
    try {
      toast.loading("Opening resume...", { id: "view-resume" });
      const response = await fetch(`/api/resumes/${resume.id}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Could not fetch file");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.dismiss("view-resume");
    } catch (e) {
      toast.error("Failed to view resume file", { id: "view-resume" });
    }
  };

  const handleDownload = async (resume: ResumeData) => {
    try {
      toast.loading("Downloading resume...", { id: "download-resume" });
      await resumesApi.download(resume.id, resume.fileName);
      toast.success("Downloaded successfully", { id: "download-resume" });
    } catch (e) {
      toast.error("Failed to download resume file", { id: "download-resume" });
    }
  };

  const handleRenameClick = (resume: ResumeData) => {
    setSelectedResume(resume);
    setRenameName(resume.name);
    setShowRenameModal(true);
  };

  const handleDeleteClick = (id: number) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Title / Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Resume Vault</h2>
            <p className="text-[10px] text-text-dim hidden sm:block mt-0.5">
              Securely store and retrieve your resume PDFs for applications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary h-8 px-3 text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Upload Resume
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : resumes.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border/60 rounded-xl bg-bg-card/25 flex flex-col items-center justify-center">
          <FileText className="w-7 h-7 text-text-dim/60 mb-2" />
          <h3 className="text-xs font-semibold text-text-main">No Resumes Uploaded</h3>
          <p className="text-[10px] text-text-dim max-w-xs mt-1">
            Store your Software Engineer, Backend, or other resumes here for easy access.
          </p>
          <Button
            onClick={() => setShowUploadModal(true)}
            variant="outline"
            className="mt-3 text-[10px] font-semibold h-7.5 px-3 cursor-pointer"
          >
            <Plus className="w-3 h-3 mr-1" />
            Upload Your First Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-bg-card border border-border rounded-xl p-3.5 flex flex-col justify-between hover:border-primary/45 transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-text-main truncate group-hover:text-primary transition-colors">
                      {resume.name}
                    </h4>
                    <p className="text-[9px] text-text-dim truncate mt-0.5">
                      {resume.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-text-dim border-t border-border/40 pt-2">
                  <span>{formatSize(resume.fileSize)}</span>
                  <span>
                    Uploaded: {format(new Date(resume.createdAt), "dd MMM yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1 border-t border-border/40 pt-2.5 mt-3">
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handleView(resume)}
                    size="sm"
                    variant="ghost"
                    className="h-6.5 px-1.5 text-[9px] font-semibold text-text-muted hover:text-text-main hover:bg-bg-elevated cursor-pointer"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownload(resume)}
                    size="sm"
                    variant="ghost"
                    className="h-6.5 px-1.5 text-[9px] font-semibold text-text-muted hover:text-text-main hover:bg-bg-elevated cursor-pointer"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    onClick={() => handleRenameClick(resume)}
                    size="sm"
                    variant="ghost"
                    className="h-6.5 w-6.5 p-0 hover:bg-bg-elevated cursor-pointer text-text-dim hover:text-text-main"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(resume.id)}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-danger/10 hover:text-danger cursor-pointer text-text-dim"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl">
          <DialogHeader className="p-5 border-b border-border bg-bg-elevated/20">
            <DialogTitle className="text-sm font-semibold">Upload Resume PDF</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              uploadMutation.mutate();
            }}
            className="p-5 space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-text-muted">Resume Name *</Label>
              <Input
                placeholder="e.g. Software Engineer Resume"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                required
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-text-muted">Upload PDF *</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65 cursor-pointer file:bg-bg-elevated file:text-text-main file:border-none file:h-full file:-ml-3 file:mr-3 file:px-3 file:text-xs file:font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="text-text-muted hover:text-text-main hover:bg-bg-elevated text-xs font-semibold h-9.5 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-9.5 px-5 cursor-pointer"
              >
                {isUploading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Upload
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Modal */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl">
          <DialogHeader className="p-5 border-b border-border bg-bg-elevated/20">
            <DialogTitle className="text-sm font-semibold">Rename Resume</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              renameMutation.mutate();
            }}
            className="p-5 space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-text-muted">New Name *</Label>
              <Input
                placeholder="e.g. Software Engineer Resume"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                required
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRenameModal(false)}
                className="text-text-muted hover:text-text-main hover:bg-bg-elevated text-xs font-semibold h-9.5 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={renameMutation.isPending}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-9.5 px-5 cursor-pointer"
              >
                {renameMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
