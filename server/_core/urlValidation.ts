/**
 * URL Validation and Security Utilities
 * Prevents SSRF attacks and validates URL format
 */

/**
 * Reserved IP ranges that could be used for SSRF attacks
 */
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[::\]$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

/**
 * Validate URL format and prevent SSRF attacks
 * @param urlString - URL to validate
 * @returns Boolean indicating if URL is safe
 */
export function isValidURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Check for blocked patterns in hostname
    const hostname = url.hostname;
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    
    // Hostname should not be empty
    if (!hostname) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for logging (remove sensitive query params)
 * @param urlString - URL to sanitize
 * @returns Sanitized URL string
 */
export function sanitizeURLForLogging(urlString: string): string {
  try {
    const url = new URL(urlString);
    // Keep only hostname and pathname for logging
    return `${url.protocol}//${url.hostname}${url.pathname}`;
  } catch {
    return 'invalid-url';
  }
}

/**
 * Get base URL from a full URL
 * @param urlString - Full URL
 * @returns Base URL (protocol + hostname)
 */
export function getBaseURL(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return '';
  }
}

/**
 * Check if URL needs protocol
 * @param urlString - URL string
 * @returns Boolean
 */
export function shouldAddProtocol(urlString: string): boolean {
  return !urlString.startsWith('http://') && !urlString.startsWith('https://');
}

/**
 * Normalize URL (add protocol if missing)
 * @param urlString - URL string
 * @returns Normalized URL or empty string if invalid
 */
export function normalizeURL(urlString: string): string {
  try {
    let normalized = urlString.trim();
    
    if (shouldAddProtocol(normalized)) {
      normalized = `https://${normalized}`;
    }
    
    if (isValidURL(normalized)) {
      return normalized;
    }
    
    return '';
  } catch {
    return '';
  }
}
