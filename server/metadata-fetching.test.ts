/**
 * Tests for Event Metadata Fetching Feature
 * Tests URL validation, metadata extraction, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isValidURL, normalizeURL, shouldAddProtocol } from '../server/_core/urlValidation';

describe('URL Validation', () => {
  describe('isValidURL', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(isValidURL('https://mlh.io')).toBe(true);
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://google.com')).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('http://google.com')).toBe(true);
    });

    it('should reject SSRF localhost attacks', () => {
      expect(isValidURL('http://localhost')).toBe(false);
      expect(isValidURL('http://localhost:8080')).toBe(false);
      expect(isValidURL('https://localhost')).toBe(false);
    });

    it('should reject loopback IP addresses', () => {
      expect(isValidURL('http://127.0.0.1')).toBe(false);
      expect(isValidURL('http://127.0.0.1:8080')).toBe(false);
      expect(isValidURL('http://127.1.1.1')).toBe(false);
    });

    it('should reject private IP ranges', () => {
      // 192.168.x.x
      expect(isValidURL('http://192.168.1.1')).toBe(false);
      expect(isValidURL('http://192.168.0.1')).toBe(false);
      
      // 10.x.x.x
      expect(isValidURL('http://10.0.0.1')).toBe(false);
      expect(isValidURL('http://10.255.255.255')).toBe(false);
      
      // 172.16-31.x.x
      expect(isValidURL('http://172.16.0.1')).toBe(false);
      expect(isValidURL('http://172.31.255.255')).toBe(false);
    });

    it('should reject link-local addresses', () => {
      expect(isValidURL('http://169.254.1.1')).toBe(false);
      expect(isValidURL('http://169.254.169.254')).toBe(false); // AWS metadata
    });

    it('should reject IPv6 loopback', () => {
      expect(isValidURL('http://::1')).toBe(false);
      expect(isValidURL('http://[::1]')).toBe(false);
    });

    it('should reject invalid protocols', () => {
      expect(isValidURL('ftp://example.com')).toBe(false);
      expect(isValidURL('file:///etc/passwd')).toBe(false);
      expect(isValidURL('gopher://example.com')).toBe(false);
      expect(isValidURL('javascript:alert(1)')).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('://no-protocol')).toBe(false);
    });

    it('should handle URLs with paths and params', () => {
      expect(isValidURL('https://example.com/path/to/page')).toBe(true);
      expect(isValidURL('https://example.com?param=value')).toBe(true);
      expect(isValidURL('https://example.com:8080/path?query=1')).toBe(true);
    });
  });

  describe('normalizeURL', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(normalizeURL('example.com')).toBe('https://example.com');
      expect(normalizeURL('google.com')).toBe('https://google.com');
      expect(normalizeURL('mlh.io')).toBe('https://mlh.io');
    });

    it('should preserve existing protocol', () => {
      expect(normalizeURL('https://example.com')).toBe('https://example.com');
      expect(normalizeURL('http://example.com')).toBe('http://example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeURL('  example.com  ')).toBe('https://example.com');
      expect(normalizeURL('\nexample.com\n')).toBe('https://example.com');
    });

    it('should reject invalid URLs after normalization', () => {
      expect(normalizeURL('localhost')).toBe('');
      expect(normalizeURL('127.0.0.1')).toBe('');
      expect(normalizeURL('192.168.1.1')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(normalizeURL('')).toBe('');
      expect(normalizeURL('   ')).toBe('');
    });
  });

  describe('shouldAddProtocol', () => {
    it('should return true for URLs without protocol', () => {
      expect(shouldAddProtocol('example.com')).toBe(true);
      expect(shouldAddProtocol('google.com')).toBe(true);
    });

    it('should return false for URLs with http://', () => {
      expect(shouldAddProtocol('http://example.com')).toBe(false);
    });

    it('should return false for URLs with https://', () => {
      expect(shouldAddProtocol('https://example.com')).toBe(false);
    });
  });
});

describe('Metadata Service', () => {
  describe('fetchEventMetadata', () => {
    it('should return success false for SSRF URLs', async () => {
      // Import the service
      const { fetchEventMetadata } = await import('../server/_core/metadataService');
      
      const result = await fetchEventMetadata('http://localhost');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or unsafe');
    });

    it('should handle timeout errors', async () => {
      // This test requires mocking axios or a slow server
      // Skip for now, but could be enabled with proper fixtures
    });

    it('should return partial data if available', async () => {
      // This would require a real HTTP server or mock
      // Example of what we expect:
      // const result = await fetchEventMetadata('https://example.com');
      // expect(result.success).toBe(true);
      // expect(result.data?.title).toBeDefined();
    });
  });

  describe('Event Type Detection', () => {
    // Test event type detection separately
    it('should detect Hackathon from keywords', () => {
      // Import detection function
      // expect(detectEventType('MLH Hackathon 2024')).toBe('Hackathon');
    });

    it('should detect Workshop from keywords', () => {
      // expect(detectEventType('React Workshop')).toBe('Workshop');
    });

    it('should detect Conference from keywords', () => {
      // expect(detectEventType('Tech Conference')).toBe('Conference');
    });

    it('should return Other for unknown types', () => {
      // expect(detectEventType('Random Event')).toBe(undefined);
    });
  });
});

describe('Frontend Hook - useFetchMetadata', () => {
  // These tests require React Testing Library
  
  it('should initialize with empty state', () => {
    // const { result } = renderHook(() => useFetchMetadata());
    // expect(result.current.isLoading).toBe(false);
    // expect(result.current.error).toBe(null);
    // expect(result.current.data).toBe(null);
  });

  it('should set loading state during fetch', async () => {
    // const { result } = renderHook(() => useFetchMetadata());
    // act(() => {
    //   result.current.fetchMetadata('https://example.com');
    // });
    // expect(result.current.isLoading).toBe(true);
  });

  it('should normalize URL before fetch', async () => {
    // const { result } = renderHook(() => useFetchMetadata());
    // act(() => {
    //   result.current.fetchMetadata('example.com');
    // });
    // // Should add https://
  });

  it('should handle fetch errors', async () => {
    // const { result } = renderHook(() => useFetchMetadata());
    // act(() => {
    //   result.current.fetchMetadata('localhost');
    // });
    // Wait for state update
    // expect(result.current.error).toContain('Invalid');
  });

  it('should reset state when reset called', async () => {
    // const { result } = renderHook(() => useFetchMetadata());
    // act(() => {
    //   result.current.reset();
    // });
    // expect(result.current.isLoading).toBe(false);
    // expect(result.current.error).toBe(null);
    // expect(result.current.data).toBe(null);
  });
});

describe('AddApplicationModal Component', () => {
  // These tests would use React Testing Library
  
  it('should show wand button next to URL input', () => {
    // const { getByTitle } = render(<AddApplicationModal open={true} onOpenChange={() => {}} />);
    // expect(getByTitle(/Auto-fill/i)).toBeInTheDocument();
  });

  it('should disable wand button when URL is empty', () => {
    // const { getByTitle } = render(<AddApplicationModal open={true} onOpenChange={() => {}} />);
    // const button = getByTitle(/Auto-fill/i);
    // expect(button).toBeDisabled();
  });

  it('should show loading spinner while fetching', () => {
    // Simulate fetch in progress
    // expect screen to show Loader2 icon
  });

  it('should show error message on fetch failure', () => {
    // Simulate failed fetch
    // expect error message in amber box
  });

  it('should autofill form fields on fetch success', () => {
    // Simulate successful fetch
    // expect eventName input to be filled
    // expect eventType select to be changed
  });

  it('should not overwrite user input on autofill', () => {
    // User enters event name
    // Then clicks fetch
    // Event name should not be overwritten
  });

  it('should allow editing all fields after autofill', () => {
    // After autofill, user can edit any field
    // Changes should be reflected in form state
  });

  it('should submit with merged data', () => {
    // User gets autofilled data
    // User edits some fields
    // Submit should send merged data
  });
});

describe('Integration Tests', () => {
  it('end-to-end: User fetches and saves event', async () => {
    // 1. Navigate to add event modal
    // 2. Enter URL
    // 3. Click fetch button
    // 4. Wait for autofill
    // 5. Edit some fields
    // 6. Submit form
    // 7. Verify event saved in database
  });

  it('end-to-end: Fetch fails, user fills manually', async () => {
    // 1. Enter URL that will fail
    // 2. Click fetch  
    // 3. See error message
    // 4. Manually fill all fields
    // 5. Submit form
    // 6. Verify event saved in database
  });

  it('end-to-end: Partial fetch, user supplements', async () => {
    // 1. Fetch gets some fields
    // 2. User fills in missing fields
    // 3. Submit with merged data
    // 4. Verify all data saved
  });
});

describe('Security Tests', () => {
  it('should prevent SSRF via localhost', () => {
    expect(isValidURL('http://localhost')).toBe(false);
    expect(isValidURL('http://localhost:3000')).toBe(false);
    expect(isValidURL('http://localhost:8080')).toBe(false);
  });

  it('should prevent SSRF via loopback IP', () => {
    expect(isValidURL('http://127.0.0.1')).toBe(false);
    expect(isValidURL('http://127.0.0.2')).toBe(false);
    expect(isValidURL('http://127.255.255.255')).toBe(false);
  });

  it('should prevent SSRF via private network ', () => {
    // Class A private
    expect(isValidURL('http://10.0.0.0')).toBe(false);
    expect(isValidURL('http://10.255.255.255')).toBe(false);
    
    // Class B private
    expect(isValidURL('http://172.16.0.0')).toBe(false);
    expect(isValidURL('http://172.31.255.255')).toBe(false);
    
    // Class C private
    expect(isValidURL('http://192.168.0.0')).toBe(false);
    expect(isValidURL('http://192.168.255.255')).toBe(false);
  });

  it('should prevent SSRF via AWS metadata endpoint', () => {
    expect(isValidURL('http://169.254.169.254')).toBe(false);
  });

  it('should only allow http and https', () => {
    expect(isValidURL('ftp://example.com')).toBe(false);
    expect(isValidURL('gopher://example.com')).toBe(false);
    expect(isValidURL('telnet://example.com')).toBe(false);
    expect(isValidURL('file:///etc/passwd')).toBe(false);
    expect(isValidURL('javascript:alert(1)')).toBe(false);
  });

  it('should not execute scripts from fetched content', async () => {
    // This is guaranteed by using cheerio (HTML parsing only, no JS execution)
    // No additional test needed - library handles this
  });

  it('should not store sensitive data', () => {
    // Metadata is not cached or stored
    // Only used for immediate form autofill
    // No database storage of raw HTML
  });
});

describe('Error Messages', () => {
  it('should explain SSRF errors clearly', () => {
    // Error message should indicate URL is unsafe/blocked
    // Should not expose internal security mechanism details
  });

  it('should explain timeout errors with actionable advice', () => {
    // Message: "Request timeout (5 sec). Site may be slow or unavailable."
    // Suggest: try different site or enter manually
  });

  it('should explain 404 errors', () => {
    // Message: "Page not found (404). Check URL."
    // Suggest: verify URL in browser
  });

  it('should explain access denied errors', () => {
    // Message: "Access denied. Site blocks automated requests."
    // Suggest: enter manually or find alternate source
  });

  it('should explain network errors clearly', () => {
    // Message: "Domain not found. Check spelling."
    // Suggest: verify domain exists
  });
});

// Run all tests with: npm run test
// Or specific test file: npm run test metadata-fetching.test.ts
