import axios from "axios";

export interface ExtractedMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  eventType: "Hackathon" | "Workshop" | "Conference" | "Other";
}

/**
 * Fetch and extract metadata from a URL
 * Extracts Open Graph tags and fallback to standard HTML tags
 */
export async function fetchMetadata(url: string): Promise<ExtractedMetadata> {
  try {
    // Validate URL format
    if (!isValidUrl(url)) {
      throw new Error("Invalid URL format");
    }

    // Fetch the HTML content
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = response.data;

    // Extract metadata from HTML
    const title = extractTitle(html);
    const description = extractDescription(html);
    const imageUrl = extractImageUrl(html);
    const eventType = suggestEventType(title, description);

    return {
      title,
      description,
      imageUrl,
      eventType,
    };
  } catch (error) {
    console.error("Error fetching metadata from URL:", error);
    throw new Error(
      `Failed to fetch metadata: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract title from HTML
 * Priority: og:title > title tag > h1 tag
 */
function extractTitle(html: string): string | null {
  // Try og:title first
  const ogTitleMatch = html.match(
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
  );
  if (ogTitleMatch && ogTitleMatch[1]) {
    return decodeHtmlEntities(ogTitleMatch[1]);
  }

  // Try standard title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return decodeHtmlEntities(titleMatch[1]).trim();
  }

  // Try h1 tag as fallback
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return decodeHtmlEntities(h1Match[1]).trim();
  }

  return null;
}

/**
 * Extract description from HTML
 * Priority: og:description > meta description > first paragraph
 */
function extractDescription(html: string): string | null {
  // Try og:description first
  const ogDescMatch = html.match(
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
  );
  if (ogDescMatch && ogDescMatch[1]) {
    return decodeHtmlEntities(ogDescMatch[1]);
  }

  // Try meta description
  const metaDescMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
  );
  if (metaDescMatch && metaDescMatch[1]) {
    return decodeHtmlEntities(metaDescMatch[1]);
  }

  // Try first paragraph as fallback
  const pMatch = html.match(/<p[^>]*>([^<]+)<\/p>/i);
  if (pMatch && pMatch[1]) {
    const text = decodeHtmlEntities(pMatch[1]).trim();
    return text.substring(0, 200); // Limit to 200 chars
  }

  return null;
}

/**
 * Extract image URL from HTML
 * Priority: og:image > meta image > first img tag
 */
function extractImageUrl(html: string): string | null {
  // Try og:image first
  const ogImageMatch = html.match(
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
  );
  if (ogImageMatch && ogImageMatch[1]) {
    return ogImageMatch[1];
  }

  // Try twitter:image
  const twitterImageMatch = html.match(
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i
  );
  if (twitterImageMatch && twitterImageMatch[1]) {
    return twitterImageMatch[1];
  }

  // Try first img tag
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Suggest event type based on metadata content
 * Uses keyword matching in title and description
 */
function suggestEventType(
  title: string | null,
  description: string | null
): "Hackathon" | "Workshop" | "Conference" | "Other" {
  const content = `${title || ""} ${description || ""}`.toLowerCase();

  // Check for hackathon keywords
  if (
    /hackathon|hack\s*event|coding\s*challenge|code\s*competition/.test(
      content
    )
  ) {
    return "Hackathon";
  }

  // Check for conference keywords
  if (
    /conference|summit|expo|convention|symposium|congress|forum|meetup/.test(
      content
    )
  ) {
    return "Conference";
  }

  // Check for workshop keywords
  if (
    /workshop|training|course|bootcamp|masterclass|seminar|class|tutorial/.test(
      content
    )
  ) {
    return "Workshop";
  }

  return "Other";
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };

  return text.replace(/&[a-zA-Z]+;/g, (match) => entities[match] || match);
}
