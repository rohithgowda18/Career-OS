/**
 * iCal (iCalendar) export utility for generating calendar files
 * Supports import into Google Calendar, Outlook, Apple Calendar, etc.
 */

export interface CalendarEvent {
  id: number;
  eventName: string;
  status: string;
  deadline: Date;
  notes?: string;
  url?: string;
}

/**
 * Generate iCal format string from events
 * RFC 5545 compliant format
 */
export function generateICalContent(events: CalendarEvent[]): string {
  const now = new Date();
  const timestamp = formatICalDate(now);

  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Tracker//Event Application Tracker//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Event Applications
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Application deadlines and status tracking
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

  // Add each event
  events.forEach(event => {
    const eventId = `app-${event.id}-${Date.now()}@eventtracker`;
    const dateStr = formatICalDate(event.deadline);
    const summary = `${event.eventName} - ${event.status}`;
    const description = event.notes
      ? `Application Status: ${event.status}\\n\\nNotes: ${event.notes}`
      : `Application Status: ${event.status}`;

    ical += `BEGIN:VEVENT
UID:${eventId}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${dateStr.split('T')[0]}
SUMMARY:${escapeICalText(summary)}
DESCRIPTION:${escapeICalText(description)}
CATEGORIES:${event.status}
STATUS:CONFIRMED
`;

    // Add URL if available
    if (event.url) {
      ical += `URL:${event.url}\n`;
    }

    // Add alarm for deadline reminders (24 hours before)
    ical += `BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${event.eventName} deadline
END:VALARM
`;

    ical += `END:VEVENT
`;
  });

  ical += `END:VCALENDAR`;

  return ical;
}

/**
 * Format date to iCal format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters in iCal text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Generate filename for calendar export
 */
export function generateCalendarFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `event-applications-${date}.ics`;
}
