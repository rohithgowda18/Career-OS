import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
};

interface CalendarEvent {
  id: number;
  eventName: string;
  status: string;
  deadline: Date;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isListView, setIsListView] = useState(false);

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
  });
  const applicationsData = applicationsQuery.data || { content: [] };
  const applications = applicationsData.content || [];

  const events = useMemo(() => {
    return applications
      .filter((app: any) => app.deadline)
      .map((app: any) => ({
        id: app.id,
        eventName: app.eventName,
        status: app.status,
        deadline: new Date(app.deadline!),
      }));
  }, [applications]);

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
        icalContent += `BEGIN:VEVENT\nUID:app-${event.id}@eventtracker\nDTSTART;VALUE=DATE:${dateStr}\nSUMMARY:${event.eventName} - ${event.status}\nEND:VEVENT\n`;
      });
      icalContent += `END:VCALENDAR`;

      const blob = new Blob([icalContent], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `event-applications.ics`;
      link.click();
      toast.success("Calendar exported!");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start bg-bg-card p-1 rounded-xl border border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 hover:bg-bg-elevated"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-black uppercase tracking-widest min-w-[140px] text-center">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 hover:bg-bg-elevated"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsListView(!isListView)}
            className="flex-1 sm:flex-none gap-2 border-border bg-bg-card hover:bg-bg-elevated font-black text-[10px] uppercase tracking-widest h-10"
          >
            {isListView ? (
              <CalendarIcon className="w-3 h-3" />
            ) : (
              <List className="w-3 h-3" />
            )}
            {isListView ? "Grid View" : "List View"}
          </Button>
          <Button
            onClick={handleExportCalendar}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none gap-2 border-border bg-bg-card hover:bg-bg-elevated font-black text-[10px] uppercase tracking-widest h-10"
          >
            <Download className="w-3 h-3" /> Export ICS
          </Button>
        </div>
      </div>

      {!isListView ? (
        <div className="card-premium p-4 overflow-x-auto bg-bg-card/30">
          <div className="min-w-[750px] md:min-w-0">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {DAYS_OF_WEEK.map(day => (
                <div
                  key={day}
                  className="text-center font-black text-[9px] text-text-muted py-2 uppercase tracking-[0.2em]"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isToday =
                  day &&
                  new Date().toDateString() ===
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    ).toDateString();

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[110px] md:min-h-[140px] p-2 rounded-2xl border transition-all duration-300",
                      day
                        ? isToday
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-bg-card/20 hover:border-primary/20 hover:bg-bg-elevated/20"
                        : "border-transparent"
                    )}
                  >
                    {day && (
                      <>
                        <div
                          className={cn(
                            "text-[10px] font-black mb-2.5 px-1.5 transition-colors",
                            isToday ? "text-primary" : "text-text-muted/40"
                          )}
                        >
                          {day}
                        </div>
                        <div className="space-y-1.5">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-[9px] p-1.5 rounded-lg border truncate leading-tight font-black uppercase tracking-tighter transition-all hover:scale-[1.02]",
                                STATUS_COLORS[event.status] ||
                                  "bg-bg-elevated border-border text-text-muted"
                              )}
                              title={event.eventName}
                            >
                              {event.eventName}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[8px] text-center font-black text-text-muted/30 pt-1 tracking-widest">
                              +{dayEvents.length - 3} MORE
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
        </div>
      ) : (
        <div className="space-y-4">
          {events
            .filter(
              e =>
                e.deadline.getMonth() === currentDate.getMonth() &&
                e.deadline.getFullYear() === currentDate.getFullYear()
            )
            .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
            .map(event => (
              <div
                key={event.id}
                className="card-premium p-5 flex items-center justify-between gap-6 group"
              >
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-[1.25rem] bg-bg-elevated border border-border group-hover:border-primary/40 transition-all shadow-inner">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                      {MONTHS[event.deadline.getMonth()].slice(0, 3)}
                    </span>
                    <span className="text-2xl font-black text-text-main tabular-nums">
                      {event.deadline.getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-text-main group-hover:text-primary transition-colors tracking-tight">
                      {event.eventName}
                    </h4>
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mt-2 opacity-50">
                      Application Deadline
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[9px] px-3.5 py-1.5 rounded-lg border font-black uppercase tracking-widest",
                    STATUS_COLORS[event.status]
                  )}
                >
                  {event.status}
                </span>
              </div>
            ))}
          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-bg-card/10">
              <CalendarIcon className="w-16 h-16 text-text-muted/5 mb-6" />
              <h4 className="text-lg font-black text-text-main mb-2 tracking-tight">
                Schedule Clear
              </h4>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-40">
                No application deadlines found for this period.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 md:gap-10 p-7 card-premium bg-bg-card/20 border-dashed">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-3.5 group">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full shadow-lg ring-2 ring-white/5",
                colors.split(" ")[0].replace("/10", "")
              )}
            />
            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] group-hover:text-text-main transition-colors">
              {status === "UnderReview" ? "In Review" : status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
