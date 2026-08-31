import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, JobDTO, JobSearchParams } from "@/lib/api/jobsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import JobDetailsModal from "@/components/JobDetailsModal";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Layers,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Compass,
  AlertCircle,
  Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"discover" | "saved">("discover");

  // Search & Filter State
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<string>("ALL");
  const [workMode, setWorkMode] = useState<string>("ALL");
  const [experienceLevel, setExperienceLevel] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Selected job for modal details view
  const [selectedJob, setSelectedJob] = useState<JobDTO | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Queries
  const searchParams: JobSearchParams = {
    keyword: keyword.trim() || undefined,
    location: location.trim() || undefined,
    jobType: jobType !== "ALL" ? jobType : undefined,
    workMode: workMode !== "ALL" ? workMode : undefined,
    experienceLevel: experienceLevel !== "ALL" ? experienceLevel : undefined,
    page,
    size: PAGE_SIZE,
  };

  const discoverQuery = useQuery({
    queryKey: ["jobs", "discover", searchParams],
    queryFn: () => jobsApi.searchJobs(searchParams),
    enabled: activeTab === "discover",
    retry: 1,
  });

  const savedQuery = useQuery({
    queryKey: ["jobs", "saved", page],
    queryFn: () => jobsApi.getSavedJobs(page, PAGE_SIZE),
    enabled: activeTab === "saved",
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (job: JobDTO) => jobsApi.saveJob(job),
    onSuccess: (_, job) => {
      toast.success(`Saved "${job.title}"`);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      if (selectedJob && selectedJob.externalJobId === job.externalJobId) {
        setSelectedJob((prev) => prev ? { ...prev, saved: true } : null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save job");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (savedJobId: number) => jobsApi.deleteSavedJob(savedJobId),
    onSuccess: () => {
      toast.success("Job removed from saved list");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      if (selectedJob) {
        setSelectedJob((prev) => prev ? { ...prev, saved: false, savedJobId: undefined } : null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove saved job");
    },
  });

  const trackMutation = useMutation({
    mutationFn: (job: JobDTO) => jobsApi.trackApplication(job, "Applied"),
    onSuccess: (_, job) => {
      toast.success(`Added "${job.company} - ${job.title}" to Applications tracker!`);
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Could not track application");
    },
  });

  const handleSaveToggle = (job: JobDTO) => {
    if (job.saved && job.savedJobId) {
      unsaveMutation.mutate(job.savedJobId);
    } else {
      saveMutation.mutate(job);
    }
  };

  const handleTrackApplication = (job: JobDTO) => {
    trackMutation.mutate(job);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    queryClient.invalidateQueries({ queryKey: ["jobs", "discover"] });
  };

  const handleOpenDetails = (job: JobDTO) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const currentData = activeTab === "discover" ? discoverQuery.data?.content : savedQuery.data?.content;
  const isLoading = activeTab === "discover" ? discoverQuery.isLoading : savedQuery.isLoading;
  const isError = activeTab === "discover" ? discoverQuery.isError : savedQuery.isError;
  const totalPages = activeTab === "discover" ? (discoverQuery.data?.totalPages || 0) : (savedQuery.data?.totalPages || 0);
  const totalElements = activeTab === "discover" ? (discoverQuery.data?.totalElements || 0) : (savedQuery.data?.totalElements || 0);

  return (
    <DashboardLayout activeTab="jobs" activeTabName="Jobs">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-main">Job Opportunities</h2>
              <p className="text-xs text-text-dim mt-0.5">
                Discover live internships, fresher roles, and engineering opportunities
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-bg-elevated border border-border p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => {
                setActiveTab("discover");
                setPage(0);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "discover"
                  ? "bg-bg-card text-primary shadow-sm"
                  : "text-text-dim hover:text-text-main"
              )}
            >
              Discover
            </button>
            <button
              onClick={() => {
                setActiveTab("saved");
                setPage(0);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "saved"
                  ? "bg-bg-card text-primary shadow-sm"
                  : "text-text-dim hover:text-text-main"
              )}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved
            </button>
          </div>
        </div>

        {/* Search & Filters Bar (Only on Discover tab) */}
        {activeTab === "discover" && (
          <div className="space-y-3.5 bg-bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, skills (e.g. Software Engineer, React, Java)..."
                  className="pl-10 h-10 bg-bg-elevated/60 border-border text-xs focus:border-primary/50 text-text-main"
                />
              </div>

              <div className="md:col-span-4 relative">
                <MapPin className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or region (e.g. Bangalore, Remote, India)..."
                  className="pl-10 h-10 bg-bg-elevated/60 border-border text-xs focus:border-primary/50 text-text-main"
                />
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full h-10 bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4 mr-1.5" />
                  Search
                </Button>
              </div>
            </form>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
              <span className="text-[11px] font-semibold text-text-dim flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3 h-3" />
                Filters:
              </span>

              {/* Job Type */}
              <select
                value={jobType}
                onChange={(e) => {
                  setJobType(e.target.value);
                  setPage(0);
                }}
                className="text-xs bg-bg-elevated border border-border rounded-lg px-2.5 py-1 text-text-main focus:outline-none focus:border-primary/50 cursor-pointer h-7"
              >
                <option value="ALL">All Types</option>
                <option value="internship">Internship</option>
                <option value="full_time">Full-time</option>
                <option value="contract">Contract</option>
              </select>

              {/* Experience */}
              <select
                value={experienceLevel}
                onChange={(e) => {
                  setExperienceLevel(e.target.value);
                  setPage(0);
                }}
                className="text-xs bg-bg-elevated border border-border rounded-lg px-2.5 py-1 text-text-main focus:outline-none focus:border-primary/50 cursor-pointer h-7"
              >
                <option value="ALL">All Experience</option>
                <option value="fresher">Fresher / Entry Level</option>
                <option value="0-1 years">0–1 Years</option>
                <option value="1-2 years">1–2 Years</option>
              </select>

              {/* Work Mode */}
              <select
                value={workMode}
                onChange={(e) => {
                  setWorkMode(e.target.value);
                  setPage(0);
                }}
                className="text-xs bg-bg-elevated border border-border rounded-lg px-2.5 py-1 text-text-main focus:outline-none focus:border-primary/50 cursor-pointer h-7"
              >
                <option value="ALL">All Work Modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>

              {(keyword || location || jobType !== "ALL" || workMode !== "ALL" || experienceLevel !== "ALL") && (
                <button
                  onClick={() => {
                    setKeyword("");
                    setLocation("");
                    setJobType("ALL");
                    setWorkMode("ALL");
                    setExperienceLevel("ALL");
                    setPage(0);
                  }}
                  className="text-[11px] text-text-dim hover:text-primary font-medium underline ml-auto cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Meta info */}
        {!isLoading && !isError && currentData && currentData.length > 0 && (
          <div className="flex items-center justify-between text-xs text-text-dim px-1">
            <span>
              Showing {currentData.length} of {totalElements} opportunities
              {activeTab === "discover" && " (via Adzuna)"}
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-bg-card border border-border/80 rounded-2xl p-5 animate-pulse space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-bg-elevated rounded w-1/3" />
                    <div className="h-3 bg-bg-elevated rounded w-1/4" />
                  </div>
                  <div className="h-8 w-24 bg-bg-elevated rounded-lg" />
                </div>
                <div className="h-10 bg-bg-elevated/50 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-bg-card border border-danger/20 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text-main">Unable to load jobs right now</h3>
            <p className="text-xs text-text-dim max-w-md mx-auto">
              We encountered an issue connecting to the live job discovery provider. Please verify your internet connection or try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => discoverQuery.refetch()}
              className="mt-2 text-xs font-semibold cursor-pointer border-border"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && currentData && currentData.length === 0 && (
          <div className="bg-bg-card border border-border rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-bg-elevated text-text-dim flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text-main">
              {activeTab === "discover" ? "No opportunities found" : "No saved jobs yet"}
            </h3>
            <p className="text-xs text-text-dim max-w-md mx-auto">
              {activeTab === "discover"
                ? "Try searching for broader keywords, different job types, or clearing location filters."
                : "When browsing jobs, click the Save icon to keep track of opportunities you want to revisit."}
            </p>
            {activeTab === "saved" && (
              <Button
                size="sm"
                onClick={() => setActiveTab("discover")}
                className="mt-2 bg-primary text-white text-xs font-semibold"
              >
                Browse Jobs
              </Button>
            )}
          </div>
        )}

        {/* Jobs Card List */}
        {!isLoading && !isError && currentData && currentData.length > 0 && (
          <div className="space-y-3">
            {currentData.map((job) => (
              <div
                key={job.externalJobId}
                className="group bg-bg-card hover:bg-bg-elevated/40 border border-border/80 hover:border-primary/30 rounded-2xl p-5 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => handleOpenDetails(job)}
                        className="text-base font-bold text-text-main group-hover:text-primary transition-colors cursor-pointer truncate"
                      >
                        {job.title}
                      </h3>
                      {job.postedAt && (
                        <span className="text-[10px] text-text-dim shrink-0">
                          • {job.postedAt.split("T")[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-dim">
                      <span className="font-semibold text-text-main flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {job.company}
                      </span>
                      {job.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Top Right Save & Track Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveToggle(job)}
                      title={job.saved ? "Remove from saved" : "Save job"}
                      className={cn(
                        "h-8 px-2.5 text-xs rounded-lg cursor-pointer",
                        job.saved ? "text-primary bg-primary/10" : "text-text-dim hover:text-text-main"
                      )}
                    >
                      {job.saved ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                      <span className="ml-1 text-[11px] font-medium hidden sm:inline">
                        {job.saved ? "Saved" : "Save"}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrackApplication(job)}
                      title="Add to Applications Tracker"
                      className="h-8 px-2.5 text-xs rounded-lg cursor-pointer border-border hover:border-primary/40 text-text-main"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1 text-primary" />
                      <span className="text-[11px] font-medium">Track</span>
                    </Button>

                    <Button
                      size="sm"
                      asChild
                      className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                        Apply
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Badges & Description snippet */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {job.jobType && (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[11px] py-0.5">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {job.jobType}
                    </Badge>
                  )}
                  {job.workMode && (
                    <Badge variant="outline" className="bg-bg-elevated border-border text-text-main text-[11px] py-0.5">
                      {job.workMode}
                    </Badge>
                  )}
                  {job.experienceLevel && (
                    <Badge variant="outline" className="bg-bg-elevated border-border text-text-dim text-[11px] py-0.5">
                      {job.experienceLevel}
                    </Badge>
                  )}
                  {job.salary && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[11px] py-0.5">
                      <Banknote className="w-3 h-3 mr-1" />
                      {job.salary}
                    </Badge>
                  )}
                </div>

                {/* Description Snippet */}
                {job.description && (
                  <p
                    onClick={() => handleOpenDetails(job)}
                    className="text-xs text-text-muted line-clamp-2 cursor-pointer leading-relaxed hover:text-text-main transition-colors"
                  >
                    {job.description}
                  </p>
                )}

                {/* Skills tags */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-bg-elevated text-text-dim font-medium border border-border/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 px-3 text-xs border-border cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <span className="text-text-dim font-medium">
              Page {page + 1} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 px-3 text-xs border-border cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Job Details Modal */}
        <JobDetailsModal
          job={selectedJob}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onSaveToggle={handleSaveToggle}
          onTrack={handleTrackApplication}
          isTracking={trackMutation.isPending}
          isSaving={saveMutation.isPending || unsaveMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
