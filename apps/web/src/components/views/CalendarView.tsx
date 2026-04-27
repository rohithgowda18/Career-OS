import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { toast } from "sonner";

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
  Interested: "bg-blue-100 text-blue-900 border-blue-300",
  Applied: "bg-purple-100 text-purple-900 border-purple-300",
  "Under Review": "bg-yellow-100 text-yellow-900 border-yellow-300",
  Accepted: "bg-green-100 text-green-900 border-green-300",
  Rejected: "bg-red-100 text-red-900 border-red-300",
  Withdrawn: "bg-gray-100 text-gray-900 border-gray-300",
};

interface CalendarEvent {
  id: number;
  eventName: string;
  status: string;
  deadline: Date;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
  });
  const applications = applicationsQuery.data || [];

  // Convert applications to calendar events
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

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Get events for a specific day
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

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  // Get all events with type annotations
  const getAllEvents = () => {
    return events.forEach((event: CalendarEvent) => {
      // Process events
    });
  };

  // Export calendar to iCal format
  const handleExportCalendar = async () => {
    try {
      // Generate iCal content
      let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Tracker//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Event Applications
X-WR-TIMEZONE:UTC
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
TZNAME:UTC
END:STANDARD
END:VTIMEZONE
`;

      // Add events
      events.forEach((event: CalendarEvent) => {
        const deadline = event.deadline;
        const dateStr = deadline.toISOString().split("T")[0].replace(/-/g, "");

        icalContent += `BEGIN:VEVENT
UID:app-${event.id}@eventtracker
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART;VALUE=DATE:${dateStr}
SUMMARY:${event.eventName} - ${event.status}
DESCRIPTION:Application Status: ${event.status}
CATEGORIES:${event.status}
STATUS:CONFIRMED
END:VEVENT
`;
      });

      icalContent += `END:VCALENDAR`;

      // Download file
      const blob = new Blob([icalContent], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `event-applications-${new Date().toISOString().split("T")[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        "Calendar exported successfully! You can now import it into Google Calendar, Outlook, or Apple Calendar."
      );
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export calendar");
    }
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold min-w-[200px]">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <Button onClick={handleExportCalendar} className="gap-2">
          <Download className="w-4 h-4" />
          Export to Calendar
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="card-elevated p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="text-center font-semibold text-sm text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday =
              day &&
              new Date().getFullYear() === currentDate.getFullYear() &&
              new Date().getMonth() === currentDate.getMonth() &&
              new Date().getDate() === day;

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 rounded-lg border-2 ${
                  day
                    ? isToday
                      ? "border-accent bg-accent/5"
                      : "border-border bg-background/50"
                    : "border-transparent bg-transparent"
                }`}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm font-semibold mb-2 ${isToday ? "text-accent" : "text-foreground"}`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded border ${STATUS_COLORS[event.status] || "bg-gray-100"}`}
                          title={event.eventName}
                        >
                          <div className="font-medium truncate">
                            {event.eventName}
                          </div>
                          <div className="text-xs opacity-75">
                            {event.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold mb-4">Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${colors.split(" ")[0]}`} />
              <span className="text-sm text-muted-foreground">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="card-elevated p-6 bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          💡 Calendar Export Tips
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Export to Calendar" to download an .ics file</li>
          <li>
            • Import the file into Google Calendar, Outlook, or Apple Calendar
          </li>
          <li>• Your application deadlines will sync as calendar events</li>
          <li>• Color-coded by status for easy visualization</li>
          <li>• Re-export anytime to sync updates</li>
        </ul>
      </div>
    </div>
  );
}
