/**
 * Metadata Service - Safe event metadata fetching with security measures
 * Prevents SSRF, enforces timeouts, size limits, and extracts OpenGraph tags
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { isValidURL, sanitizeURLForLogging } from './urlValidation';

// Constants for safety
const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB
const MAX_REDIRECTS = 3;

// User agent to avoid blocking
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

/**
 * Metadata extraction result
 */
export interface MetadataResult {
  title?: string;
  description?: string;
  image?: string;
  eventType?: 'Hackathon' | 'Workshop' | 'Conference' | 'Other';
  deadline?: string; // ISO date format (YYYY-MM-DD)
}

/**
 * Keywords for detecting event types
 */
const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
  Hackathon: ['hackathon', 'hack-a-thon'],
  Workshop: ['workshop', 'workshop', 'training', 'bootcamp'],
  Conference: ['conference', 'summit', 'convention', 'congress'],
  Other: ['event', 'meetup', 'gathering'],
};

/**
 * Create axios instance with security measures
 */
function createSafeAxiosInstance(): AxiosInstance {
  return axios.create({
    timeout: REQUEST_TIMEOUT,
    maxRedirects: MAX_REDIRECTS,
    maxContentLength: MAX_RESPONSE_SIZE,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
    },
    validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx
  });
}

/**
 * Detect event date from HTML content
 * Looks for structured data, meta tags, and common date patterns
 */
function detectEventDate(html: string): string | undefined {
  const $ = cheerio.load(html);
  
  try {
    // Try JSON-LD structured data first (most reliable)
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const jsonData = JSON.parse($(scripts[i]).html() || '');
        
        // Check for Event schema
        if (jsonData.startDate) {
          const date = new Date(jsonData.startDate);
          if (!isNaN(date.getTime())) {
            return formatDateISO(date);
          }
        }
        
        // Check if it's an array of events
        if (Array.isArray(jsonData)) {
          for (const item of jsonData) {
            if (item.startDate) {
              const date = new Date(item.startDate);
              if (!isNaN(date.getTime())) {
                return formatDateISO(date);
              }
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON-LD
      }
    }
  } catch (e) {
    console.error('Error parsing JSON-LD:', e);
  }

  // Try meta tags
  try {
    const eventDate = $('meta[name="event_date"]').attr('content') || 
                     $('meta[property="event-date"]').attr('content') ||
                     $('meta[name="date"]').attr('content') ||
                     $('meta[property="og:published_time"]').attr('content') ||
                     $('meta[name="publish_date"]').attr('content') ||
                     $('meta[name="startDate"]').attr('content');
    
    if (eventDate && isValidDate(eventDate)) {
      return formatDateISO(new Date(eventDate));
    }
  } catch (e) {
    console.error('Error parsing meta tags:', e);
  }

  // Try data attributes on elements
  try {
    const dataDateElements = $('[data-date], [data-event-date], [data-start-date], [data-datetime]');
    for (let i = 0; i < dataDateElements.length; i++) {
      const dateStr = 
        $(dataDateElements[i]).attr('data-date') ||
        $(dataDateElements[i]).attr('data-event-date') ||
        $(dataDateElements[i]).attr('data-start-date') ||
        $(dataDateElements[i]).attr('data-datetime');
      
      if (dateStr && isValidDate(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return formatDateISO(date);
        }
      }
    }
  } catch (e) {
    console.error('Error parsing data attributes:', e);
  }

  // Look for common date patterns in page text - more aggressive
  try {
    const pageText = $('body').text();
    
    // More specific date patterns - try these in order
    const datePatterns = [
      // ISO format with time: 2024-12-25T10:00:00 or 2024-12-25 10:00
      { pattern: /(\d{4})-(\d{2})-(\d{2})[T\s]?(\d{2}):(\d{2})/, extract: (m: string) => m.split(/[T\s]/)[0] },
      // ISO format: 2024-12-25 or 2024/12/25
      { pattern: /(\d{4})[-\/](\d{2})[-\/](\d{2})/, extract: (m: string) => m.replace(/\//g, '-') },
      // US format with time: 12/25/2024 10:00 AM
      { pattern: /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s*\d*:?\d*\s*(AM|PM)?/i, extract: (m: string) => {
        const datePart = m.split(/\s/)[0];
        const parts = datePart.split(/[\/-]/);
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }},
      // US format: 12/25/2024 or 12-25-2024
      { pattern: /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/, extract: (m: string) => {
        const parts = m.split(/[\/-]/);
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }},
      // Full month name with time: December 25, 2024 10:00 AM
      { pattern: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\s*\d*:?\d*\s*(AM|PM)?/i, 
        extract: (m: string) => {
          const monthMap: Record<string, string> = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
          };
          const match = m.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
          if (match) {
            const month = monthMap[match[1].toLowerCase()];
            const day = match[2].padStart(2, '0');
            const year = match[3];
            return `${year}-${month}-${day}`;
          }
          return m;
        }
      },
      // Short month: Dec 25, 2024 or Dec 25 2024
      { pattern: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i, 
        extract: (m: string) => {
          const monthMap: Record<string, string> = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
            'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          const match = m.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i);
          const dayMatch = m.match(/(\d{1,2})/);
          const yearMatch = m.match(/(\d{4})/);
          if (match && dayMatch && yearMatch) {
            const month = monthMap[match[1].toLowerCase().substring(0, 3)];
            const day = dayMatch[1].padStart(2, '0');
            const year = yearMatch[1];
            return `${year}-${month}-${day}`;
          }
          return m;
        }
      },
    ];

    // Search in multiple sections of the page
    const searchSections = [
      pageText,
      $('h1, h2, h3, h4').text(),
      $('[class*="date"], [class*="time"], [class*="event"], [id*="date"], [id*="time"]').text(),
    ];

    for (const section of searchSections) {
      for (const { pattern, extract } of datePatterns) {
        const matches = section.match(pattern);
        if (matches) {
          try {
            const dateStr = extract(matches[0]);
            const date = new Date(dateStr);
            
            // Accept any valid date (past or future)
            if (!isNaN(date.getTime())) {
              console.log(`[Metadata] Date found: "${matches[0]}" → "${formatDateISO(date)}"`);
              return formatDateISO(date);
            }
          } catch (e) {
            // Continue to next pattern
          }
        }
      }
    }
  } catch (e) {
    console.error('Error detecting date from text:', e);
  }

  console.log('[Metadata] No date detected from common patterns');
  return undefined;
}

/**
 * Format date to ISO format (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if string is a valid date
 */
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Extract OpenGraph tags and metadata from HTML
 */
function extractMetadata(html: string): MetadataResult {
  const $ = cheerio.load(html);
  const metadata: MetadataResult = {};

  // Try to extract from OpenGraph tags first
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (ogTitle) {
    metadata.title = ogTitle;
  }

  const ogDescription = $('meta[property="og:description"]').attr('content');
  if (ogDescription) {
    metadata.description = ogDescription;
  }

  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    metadata.image = ogImage;
  }

  // Fallback to standard meta tags if OG tags not found
  if (!metadata.title) {
    const metaTitle = $('meta[name="title"]').attr('content');
    if (metaTitle) {
      metadata.title = metaTitle;
    } else {
      const pageTitle = $('title').text();
      if (pageTitle) {
        metadata.title = pageTitle;
      }
    }
  }

  if (!metadata.description) {
    const metaDescription = $('meta[name="description"]').attr('content');
    if (metaDescription) {
      metadata.description = metaDescription;
    }
  }

  // Trim whitespace
  if (metadata.title) {
    metadata.title = metadata.title.trim().substring(0, 200);
  }
  if (metadata.description) {
    metadata.description = metadata.description.trim().substring(0, 500);
  }

  // Try to detect event date
  const eventDate = detectEventDate(html);
  if (eventDate) {
    metadata.deadline = eventDate;
  }

  return metadata;
}

/**
 * Detect event type from text content
 */
function detectEventType(text: string): 'Hackathon' | 'Workshop' | 'Conference' | 'Other' | undefined {
  const lowerText = text.toLowerCase();

  for (const [eventType, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return eventType as 'Hackathon' | 'Workshop' | 'Conference' | 'Other';
      }
    }
  }

  return undefined;
}

/**
 * Fetch metadata from event URL safely
 * @param url - URL to fetch metadata from
 * @returns Metadata result or error
 */
export async function fetchEventMetadata(url: string): Promise<{
  success: boolean;
  data?: MetadataResult;
  error?: string;
}> {
  try {
    // Validate URL first
    if (!isValidURL(url)) {
      return {
        success: false,
        error: 'Invalid or unsafe URL. Please provide a valid http/https URL.',
      };
    }

    const safeUrl = sanitizeURLForLogging(url);
    console.log(`[Metadata] Fetching metadata from: ${safeUrl}`);

    // Create safe axios instance
    const client = createSafeAxiosInstance();

    // Fetch the page
    const response = await client.get(url);

    if (!response.data) {
      return {
        success: false,
        error: 'No content received from URL',
      };
    }

    // Extract metadata from HTML
    const metadata = extractMetadata(response.data as string);

    // Detect event type from title and description
    const combinedText = `${metadata.title || ''} ${metadata.description || ''}`;
    metadata.eventType = detectEventType(combinedText);

    // Log what was extracted
    console.log(`[Metadata] Extracted data:`, {
      title: metadata.title,
      hasDescription: !!metadata.description,
      deadline: metadata.deadline,
      eventType: metadata.eventType,
    });

    console.log(`[Metadata] Successfully extracted metadata for: ${safeUrl}`);

    return {
      success: true,
      data: metadata,
    };
  } catch (error) {
    let errorMessage = 'Failed to fetch metadata from URL';

    if (error instanceof axios.AxiosError) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout (5 seconds). The website may be slow or unavailable.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Page not found (404). Please check the URL.';
      } else if (error.response?.status === 403 || error.response?.status === 401) {
        errorMessage = 'Access denied. The website blocks automated requests.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Domain not found. Please check the URL.';
      } else if (error.message.includes('size of response')) {
        errorMessage = 'Page is too large to process. Please enter details manually.';
      } else {
        errorMessage = error.message || errorMessage;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`[Metadata] Error fetching metadata:`, error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Batch fetch metadata for multiple URLs
 * @param urls - Array of URLs to fetch
 * @returns Array of results
 */
export async function fetchMultipleMetadata(urls: string[]): Promise<Array<{
  url: string;
  success: boolean;
  data?: MetadataResult;
  error?: string;
}>> {
  const results = await Promise.all(
    urls.map(async (url) => ({
      url,
      ...(await fetchEventMetadata(url)),
    }))
  );

  return results;
}
