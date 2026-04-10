import { describe, expect, it } from "vitest";
import { generateICalContent, generateCalendarFilename } from "./_core/icalExport";

describe("calendar export", () => {
  describe("iCal generation", () => {
    it("generates valid iCal format with events", () => {
      const events = [
        {
          id: 1,
          eventName: "TechConf 2026",
          status: "Applied",
          deadline: new Date("2026-05-15"),
          notes: "Test application",
          url: "https://techconf.example.com",
        },
      ];

      const ical = generateICalContent(events);

      expect(ical).toContain("BEGIN:VCALENDAR");
      expect(ical).toContain("END:VCALENDAR");
      expect(ical).toContain("VERSION:2.0");
      expect(ical).toContain("PRODID:-//Event Tracker//Event Application Tracker//EN");
    });

    it("includes event details in iCal", () => {
      const events = [
        {
          id: 1,
          eventName: "HackMIT 2026",
          status: "Accepted",
          deadline: new Date("2026-09-20"),
          notes: "Great opportunity",
          url: "https://hackmit.org",
        },
      ];

      const ical = generateICalContent(events);

      expect(ical).toContain("HackMIT 2026");
      expect(ical).toContain("Accepted");
      expect(ical).toContain("BEGIN:VEVENT");
      expect(ical).toContain("END:VEVENT");
    });

    it("includes alarm for deadline reminders", () => {
      const events = [
        {
          id: 1,
          eventName: "PyConf 2026",
          status: "Interested",
          deadline: new Date("2026-07-10"),
        },
      ];

      const ical = generateICalContent(events);

      expect(ical).toContain("BEGIN:VALARM");
      expect(ical).toContain("END:VALARM");
      expect(ical).toContain("TRIGGER:-PT24H");
      expect(ical).toContain("ACTION:DISPLAY");
    });

    it("handles multiple events", () => {
      const events = [
        {
          id: 1,
          eventName: "Event 1",
          status: "Applied",
          deadline: new Date("2026-05-15"),
        },
        {
          id: 2,
          eventName: "Event 2",
          status: "Accepted",
          deadline: new Date("2026-06-20"),
        },
        {
          id: 3,
          eventName: "Event 3",
          status: "Rejected",
          deadline: new Date("2026-07-10"),
        },
      ];

      const ical = generateICalContent(events);

      expect(ical).toContain("Event 1");
      expect(ical).toContain("Event 2");
      expect(ical).toContain("Event 3");
      expect((ical.match(/BEGIN:VEVENT/g) || []).length).toBe(3);
    });

    it("escapes special characters in text fields", () => {
      const events = [
        {
          id: 1,
          eventName: "Test; Event, With\\Special",
          status: "Applied",
          deadline: new Date("2026-05-15"),
          notes: "Notes with\nnewlines",
        },
      ];

      const ical = generateICalContent(events);

      // Should escape special characters
      expect(ical.includes("Test\\;")).toBe(true);
      expect(ical.includes("Event\\,")).toBe(true);
      expect(ical.includes("With\\\\Special")).toBe(true);
    });

    it("includes URL when provided", () => {
      const events = [
        {
          id: 1,
          eventName: "Event with URL",
          status: "Applied",
          deadline: new Date("2026-05-15"),
          url: "https://example.com/apply",
        },
      ];

      const ical = generateICalContent(events);

      expect(ical.includes("URL:https://example.com/apply")).toBe(true);
    });

    it("omits URL when not provided", () => {
      const events = [
        {
          id: 1,
          eventName: "Event without URL",
          status: "Applied",
          deadline: new Date("2026-05-15"),
        },
      ];

      const ical = generateICalContent(events);

      expect(ical.includes("URL:")).toBe(false);
    });

    it("handles empty events array", () => {
      const ical = generateICalContent([]);

      expect(ical.includes("BEGIN:VCALENDAR")).toBe(true);
      expect(ical.includes("END:VCALENDAR")).toBe(true);
      expect(ical.includes("BEGIN:VEVENT")).toBe(false);
    });

    it("includes timezone information", () => {
      const ical = generateICalContent([]);

      expect(ical.includes("BEGIN:VTIMEZONE")).toBe(true);
      expect(ical.includes("END:VTIMEZONE")).toBe(true);
      expect(ical.includes("TZID:UTC")).toBe(true);
    });

    it("includes calendar metadata", () => {
      const ical = generateICalContent([]);

      expect(ical.includes("X-WR-CALNAME:Event Applications")).toBe(true);
      expect(ical.includes("X-WR-TIMEZONE:UTC")).toBe(true);
      expect(ical.includes("X-WR-CALDESC:Application deadlines and status tracking")).toBe(true);
    });
  });

  describe("filename generation", () => {
    it("generates filename with current date", () => {
      const filename = generateCalendarFilename();

      expect(filename).toMatch(/^event-applications-\d{4}-\d{2}-\d{2}\.ics$/);
      expect(filename.endsWith(".ics")).toBe(true);
    });

    it("generates consistent filename format", () => {
      const filename1 = generateCalendarFilename();
      const filename2 = generateCalendarFilename();

      // Should have same format (date might differ by seconds)
      expect(filename1).toMatch(/^event-applications-\d{4}-\d{2}-\d{2}\.ics$/);
      expect(filename2).toMatch(/^event-applications-\d{4}-\d{2}-\d{2}\.ics$/);
      expect(filename1.endsWith(".ics")).toBe(true);
      expect(filename2.endsWith(".ics")).toBe(true);
    });
  });

  describe("calendar status categories", () => {
    it("categorizes events by status", () => {
      const statuses = ["Interested", "Applied", "Under Review", "Accepted", "Rejected", "Withdrawn"];
      
      statuses.forEach(status => {
        const events = [
          {
            id: 1,
            eventName: "Test Event",
            status,
            deadline: new Date("2026-05-15"),
          },
        ];

        const ical = generateICalContent(events);
        expect(ical.includes(`CATEGORIES:${status}`)).toBe(true);
      });
    });
  });

  describe("date formatting", () => {
    it("formats dates correctly for iCal", () => {
      const events = [
        {
          id: 1,
          eventName: "Event",
          status: "Applied",
          deadline: new Date("2026-05-15"),
        },
      ];

      const ical = generateICalContent(events);

      // Should contain date in YYYYMMDD format
      expect(ical).toContain("DTSTART;VALUE=DATE:20260515");
    });

    it("handles different dates", () => {
      const events = [
        {
          id: 1,
          eventName: "Event 1",
          status: "Applied",
          deadline: new Date("2026-01-01"),
        },
        {
          id: 2,
          eventName: "Event 2",
          status: "Applied",
          deadline: new Date("2026-12-31"),
        },
      ];

      const ical = generateICalContent(events);

      expect(ical.includes("20260101")).toBe(true);
      expect(ical.includes("20261231")).toBe(true);
    });
  });
});
