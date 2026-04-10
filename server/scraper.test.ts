import { describe, it, expect, vi } from "vitest";
import { fetchMetadata, ExtractedMetadata } from "./_core/scraper";

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

import axios from "axios";

const mockedAxios = axios as any;

describe("Scraper Utility", () => {
  describe("fetchMetadata", () => {
    it("should extract metadata from HTML with Open Graph tags", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="HackMIT 2024" />
            <meta property="og:description" content="Join us for the best hackathon" />
            <meta property="og:image" content="https://example.com/image.jpg" />
            <title>HackMIT</title>
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://hackmit.org");

      expect(metadata.title).toBe("HackMIT 2024");
      expect(metadata.description).toBe("Join us for the best hackathon");
      expect(metadata.imageUrl).toBe("https://example.com/image.jpg");
      expect(metadata.eventType).toBe("Hackathon");
    });

    it("should fallback to title tag when og:title is missing", async () => {
      const html = `
        <html>
          <head>
            <title>ReactConf 2024</title>
            <meta name="description" content="React conference" />
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://reactconf.com");

      expect(metadata.title).toBe("ReactConf 2024");
      expect(metadata.description).toBe("React conference");
    });

    it("should detect hackathon event type from keywords", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Tech Hackathon 2024" />
            <meta property="og:description" content="Annual coding competition" />
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://example.com");

      expect(metadata.eventType).toBe("Hackathon");
    });

    it("should detect conference event type from keywords", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Tech Summit 2024" />
            <meta property="og:description" content="Annual technology conference" />
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://example.com");

      expect(metadata.eventType).toBe("Conference");
    });

    it("should detect workshop event type from keywords", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="React Workshop" />
            <meta property="og:description" content="Learn React in this hands-on workshop" />
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://example.com");

      expect(metadata.eventType).toBe("Workshop");
    });

    it("should return Other type when no keywords match", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Tech Event 2024" />
            <meta property="og:description" content="Some generic event" />
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://example.com");

      expect(metadata.eventType).toBe("Other");
    });

    it("should handle HTML entities in metadata", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="HackMIT &amp; Friends" />
            <meta property="og:description" content="Join &quot;us&quot; for fun" />
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://example.com");

      expect(metadata.title).toContain("&");
      expect(metadata.description).toContain('"');
    });

    it("should throw error for invalid URL", async () => {
      await expect(fetchMetadata("not a valid url")).rejects.toThrow();
    });

    it("should throw error when fetch fails", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      await expect(fetchMetadata("https://example.com")).rejects.toThrow();
    });

    it("should handle missing metadata gracefully", async () => {
      const html = `
        <html>
          <head>
            <title></title>
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://example.com");

      expect(metadata.title).toBeNull();
      expect(metadata.description).toBeNull();
      expect(metadata.imageUrl).toBeNull();
      expect(metadata.eventType).toBe("Other");
    });

    it("should limit description to 200 characters", async () => {
      const longDescription = "A".repeat(300);
      const html = `
        <html>
          <head>
            <title>Event</title>
            <p>${longDescription}</p>
          </head>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: html });

      const metadata = await fetchMetadata("https://example.com");

      expect(metadata.description?.length).toBeLessThanOrEqual(200);
    });
  });
});
