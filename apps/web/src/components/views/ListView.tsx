import { trpc } from "@/lib/trpc";
import { Loader2, Plus, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AddApplicationModal from "@/components/AddApplicationModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ApplicationCard from "@/components/ApplicationCard";

type SortField = "deadline" | "createdAt" | "eventName";
type SortOrder = "asc" | "desc";

export default function ListView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("deadline");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const applicationsQuery = trpc.applications.list.useQuery();
  const applications = applicationsQuery.data || [];

  const filteredAndSorted = useMemo(() => {
    let filtered = applications;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((app) => app.eventType === typeFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.eventName.toLowerCase().includes(query) ||
          app.notes?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "deadline") {
        aVal = aVal ? new Date(aVal).getTime() : Infinity;
        bVal = bVal ? new Date(bVal).getTime() : Infinity;
      } else if (sortField === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [applications, statusFilter, typeFilter, searchQuery, sortField, sortOrder]);

  if (applicationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Interested">Interested</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Hackathon">Hackathon</SelectItem>
            <SelectItem value="Workshop">Workshop</SelectItem>
            <SelectItem value="Conference">Conference</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Table Header */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-background/50 border-b border-border px-6 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground">
          <button
            onClick={() => toggleSort("eventName")}
            className="col-span-3 flex items-center gap-2 hover:text-foreground transition-colors"
          >
            Event Name
            <SortIcon field="eventName" />
          </button>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <button
            onClick={() => toggleSort("deadline")}
            className="col-span-2 flex items-center gap-2 hover:text-foreground transition-colors"
          >
            Deadline
            <SortIcon field="deadline" />
          </button>
          <button
            onClick={() => toggleSort("createdAt")}
            className="col-span-2 flex items-center gap-2 hover:text-foreground transition-colors"
          >
            Added
            <SortIcon field="createdAt" />
          </button>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredAndSorted.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground">No applications found</p>
            </div>
          ) : (
            filteredAndSorted.map((app) => (
              <div
                key={app.id}
                className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-background/50 transition-colors"
              >
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate flex-1">
                      {app.url ? (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline transition-colors"
                        >
                          {app.eventName}
                        </a>
                      ) : (
                        app.eventName
                      )}
                    </p>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        title="Open event page"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                      </a>
                    )}
                  </div>
                  {app.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {app.notes}
                    </p>
                  )}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {app.eventType}
                </div>
                <div className="col-span-2">
                  <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {app.deadline
                    ? new Date(app.deadline).toLocaleDateString()
                    : "-"}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(app.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-1">
                  {/* Edit functionality handled via ApplicationCard in other views */}
                  <span className="text-xs text-muted-foreground">View Kanban for edit</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddApplicationModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}

function getStatusBadgeClass(status: string): string {
  const baseClass = "badge";
  switch (status) {
    case "Accepted":
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
    case "Rejected":
    case "Withdrawn":
      return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
    case "Under Review":
      return `${baseClass} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
  }
}
