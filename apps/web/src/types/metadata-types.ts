/**
 * Metadata-related type definitions
 */

export type EventType = 'Hackathon' | 'Workshop' | 'Conference' | 'Internship' | 'Other';

/**
 * Metadata extracted from event URL
 */
export interface ExtractedMetadata {
  title?: string;
  description?: string;
  image?: string;
  eventType?: EventType;
  deadline?: string; // ISO date format (YYYY-MM-DD)
}

/**
 * Metadata fetch API response
 */
export interface MetadataFetchResponse {
  success: boolean;
  data?: ExtractedMetadata;
  error?: string;
}

/**
 * URL validation result
 */
export interface URLValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}
