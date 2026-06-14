import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  List,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { placementsApi } from "@/lib/api/placementsApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import EmptyState from "@/components/ui/EmptyState";
import { useLocation } from "wouter";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_COLORS: Record<string, string> = {
  Interested: "bg-bg-elevated text-text-muted border-border",
  Applied: "bg-primary/10 text-primary border-primary/20",
  UnderReview: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Accepted: "bg-success/10 text-success border-success/20",
  Rejected: "bg-danger/10 text-danger border-danger/20",
  PlacementAssessment: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  PlacementInterview: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

interface CalendarEvent {
  id: string | number;
  eventName: string;
  status: string;
  deadline: Date;
}

export default function CalendarView() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);

  // Sync mobile state
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const applicationsQuery = useQuery({
    queryKey: ["applications", { page: 0, size: 100, sort: "deadline,asc" }],
    queryFn: () =>
      applicationsApi.list({ page: 0, size: 100, sort: "deadline,asc" }),
  });
  const applicationsData = applicationsQuery.data || { content: [] };
  const applications = applicationsData.content || [];

  const placementsQuery = useQuery({
    queryKey: ["placements", { page: 0, size: 100, sort: "id,desc" }],
    queryFn: () =>
      placementsApi.list({ page: 0, size: 100, sort: "id,desc" }),
  });
  const placementsData = placementsQuery.data || { content: [] };
  const placements = placementsData.content || [];

  const events = useMemo(() => {
    const appEvents = applications
      .filter((app: any) => app.deadline)
      .map((app: any) => ({
        id: `app-${app.id}`,
        eventName: app.eventName,
        status: app.status,
        deadline: new Date(app.deadline!),
      }));

    const placementEvents = placements.flatMap((p: any) => {
      const items: any[] = [];
      if (p.assessmentDate) {
        items.push({
          id: `place-as-${p.id}`,
          eventName: `${p.companyName} - Assessment`,
          status: "PlacementAssessment",
          deadline: new Date(p.assessmentDate),
        });
      }
      if (p.interviewDate) {
        items.push({
          id: `place-it-${p.id}`,
          eventName: `${p.companyName} - Interview`,
          status: "PlacementInterview",
          deadline: new Date(p.interviewDate),
        });
      }
      return items;
    });

    return [...appEvents, ...placementEvents];
  }, [applications, placements]);

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getEventsForDay = (day: number | null): CalendarEvent[] => {
    if (!day) return [];
    return events.filter((event: CalendarEvent) => {
      return (
        event.deadline.getFullYear() === currentDate.getFullYear() &&
        event.deadline.getMonth() === currentDate.getMonth() &&
        event.deadline.getDate() === day
      );
    });
  };

  const handlePrevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );

  const handleExportCalendar = async () => {
    try {
      let icalContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Event Tracker//EN\nMETHOD:PUBLISH\n`;
      events.forEach((event: CalendarEvent) => {
        const dateStr = event.deadline
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "");
        icalContent += `BEGIN:VEVENT\nUID:${event.id}@eventtracker\nDTSTART;VALUE=DATE:${dateStr}\nSUMMARY:${event.eventName} - ${event.status}\nEND:VEVENT\n`;
      });
      icalContent += `END:VCALENDAR`;

      const blob = new Blob([icalContent], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `event-applications.ics`;
      link.click();
      toast.success("Calendar exported successfully");
    } catch (error) {
      toast.error("Failed to export calendar");
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  // Filter current month events for the side timeline agenda
  const currentMonthEvents = useMemo(() => {
    return events
      .filter(
        e =>
          e.deadline.getMonth() === currentDate.getMonth() &&
          e.deadline.getFullYear() === currentDate.getFullYear()
      )
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [events, currentDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Calendar View Control Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3 bg-bg-card p-1 rounded-lg border border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 hover:bg-bg-elevated cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xs font-semibold uppercase tracking-wider min-w-[120px] text-center text-text-main">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 hover:bg-bg-elevated cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExportCalendar}
            variant="outline"
            className="flex-1 sm:flex-none gap-2 border-border bg-bg-card hover:bg-bg-elevated font-semibold text-xs h-9 px-4 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> <span>Export ICS</span>
          </Button>
        </div>
      </div>

      {/* Main Layout Area */}
      {isMobile ? (
        /* Mobile Default: Agenda View */
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim px-1">Upcoming Agenda</h3>
          {currentMonthEvents.map(event => (
            <div
              key={event.id}
              className="card-premium p-4 flex items-center justify-between gap-4 bg-bg-card border-border/70 hover:border-border"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-bg-elevated border border-border shrink-0">
                  <span className="text-[9px] font-semibold text-primary uppercase">
                    {MONTHS[event.deadline.getMonth()].slice(0, 3)}
                  </span>
                  <span className="text-lg font-bold text-text-main tabular-nums leading-none mt-0.5">
                    {event.deadline.getDate()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-text-main tracking-tight line-clamp-1">
                    {event.eventName}
                  </h4>
                  <p className="text-[9px] text-text-dim font-semibold uppercase tracking-wider mt-1">
                    Deadline / Event
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-[9px] px-2.5 py-0.5 rounded-full border font-semibold uppercase tracking-wider shrink-0",
                  STATUS_COLORS[event.status] || "bg-bg-elevated text-text-muted border-border"
                )}
              >
                {event.status === "UnderReview" ? "In Review" : event.status}
              </span>
            </div>
          ))}

          {currentMonthEvents.length === 0 && (
            <EmptyState
              title="No Events Scheduled"
              description="Your calendar schedule is clear. Add deadlines, tests, and interview schedules to visualize your timeline."
              icon={CalendarIcon}
              actionLabel="Add Event"
              onAction={() => setLocation("/add")}
            />
          )}
        </div>
      ) : (
        /* Desktop: Calendar + Agenda Hybrid View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2/3 Column: Monthly Grid Calendar */}
          <div className="lg:col-span-2 bg-bg-card border border-border rounded-xl p-4.5 space-y-4">
            <div className="grid grid-cols-7 gap-1.5 mb-1">
              {DAYS_OF_WEEK.map(day => (
                <div
                  key={day}
                  className="text-center font-semibold text-[10px] text-text-dim py-1 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isTodayDate =
                  day &&
                  isToday(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[75px] p-1.5 rounded-lg border transition-all duration-200 flex flex-col justify-between",
                      day
                        ? isTodayDate
                          ? "border-primary bg-primary/[0.03] ring-1 ring-primary/10"
                          : "border-border bg-bg-main/30 hover:border-border/80"
                        : "border-transparent"
                    )}
                  >
                    {day && (
                      <>
                        <div
                          className={cn(
                            "text-[10px] font-semibold transition-colors self-start px-0.5",
                            isTodayDate ? "text-primary" : "text-text-muted/60"
                          )}
                        >
                          {day}
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-[9px] px-1 py-0.5 rounded border truncate leading-tight font-medium transition-all",
                                STATUS_COLORS[event.status] ||
                                  "bg-bg-elevated border-border text-text-muted"
                              )}
                              title={event.eventName}
                            >
                              {event.eventName}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[8px] text-center font-bold text-text-dim select-none tracking-wider pt-0.5">
                              +{dayEvents.length - 2} MORE
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1/3 Column: Agenda Timeline panel */}
          <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Month's Agenda
            </h3>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-0.5 scrollbar-thin">
              {currentMonthEvents.map(event => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-bg-main border border-border/80 hover:border-border transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <p className="text-xs font-semibold text-text-main line-clamp-1">{event.eventName}</p>
                    <span
                      className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider shrink-0",
                        STATUS_COLORS[event.status] || "bg-bg-elevated text-text-muted border-border"
                      )}
                    >
                      {event.status === "UnderReview" ? "In Review" : event.status}
                    </span>
                  </div>
                  <div className="mt-3 text-[10px] text-text-dim flex items-center justify-between">
                    <span>Due Date</span>
                    <span className="font-semibold text-text-main">{format(event.deadline, "MMM dd, yyyy")}</span>
                  </div>
                </div>
              ))}

              {currentMonthEvents.length === 0 && (
                <EmptyState
                  title="No Events Scheduled"
                  description="Your calendar schedule is clear. Add deadlines, tests, and interview schedules to visualize your timeline."
                  icon={CalendarIcon}
                  actionLabel="Add Event"
                  onAction={() => setLocation("/add")}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categories Legend Grid */}
      <div className="flex flex-wrap gap-x-6 gap-y-2.5 p-4.5 bg-bg-card/50 border border-border border-dashed rounded-xl">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => {
          let label = status;
          if (status === "UnderReview") label = "In Review";
          else if (status === "PlacementAssessment") label = "Placement Assessment";
          else if (status === "PlacementInterview") label = "Placement Interview";

          return (
            <div key={status} className="flex items-center gap-2 group text-xs text-text-muted">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  colors.split(" ")[0].replace("/10", "")
                )}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider group-hover:text-text-main transition-colors">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
