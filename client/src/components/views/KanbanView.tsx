import { trpc } from "@/lib/trpc";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AddApplicationModal from "@/components/AddApplicationModal";
import ApplicationCard from "@/components/ApplicationCard";

const STATUSES = ["Interested", "Applied", "Under Review", "Accepted", "Rejected", "Withdrawn"] as const;

export default function KanbanView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const applicationsQuery = trpc.applications.list.useQuery();
  const applications = applicationsQuery.data || [];

  const columnData = useMemo(() => {
    const columns = STATUSES.map((status) => ({
      status,
      applications: applications.filter((app) => app.status === status),
    }));
    return columns;
  }, [applications]);

  if (applicationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Application
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {columnData.map((column) => (
          <div
            key={column.status}
            className="rounded-lg border border-border bg-background/50 p-4 min-h-96"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-foreground text-sm">
                {column.status}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {column.applications.length} item{column.applications.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-3">
              {column.applications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>

            {column.applications.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">
                No applications
              </div>
            )}
          </div>
        ))}
      </div>

      <AddApplicationModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
