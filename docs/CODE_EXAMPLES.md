# Quick Code Examples - Event Metadata Fetching

## Frontend - Using the Hook

### Basic Usage

```typescript
import { useFetchMetadata } from '@/hooks/useFetchMetadata';

export function MyComponent() {
  const { isLoading, error, data, fetchMetadata } = useFetchMetadata();

  const handleFetch = async () => {
    await fetchMetadata('https://mlh.io');
  };

  return (
    <div>
      <button onClick={handleFetch} disabled={isLoading}>
        {isLoading ? 'Fetching...' : 'Fetch Metadata'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && (
        <div>
          <h3>{data.title}</h3>
          <p>{data.description}</p>
          <p>Type: {data.eventType}</p>
        </div>
      )}
    </div>
  );
}
```

### With Form Integration

```typescript
import { useFetchMetadata } from '@/hooks/useFetchMetadata';

export function EventForm() {
  const [url, setUrl] = useState('');
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'Hackathon',
    description: ''
  });

  const { isLoading, error, data, fetchMetadata } = useFetchMetadata();

  const handleFetchAndAutofill = async () => {
    await fetchMetadata(url);
  };

  // Auto-update form when metadata arrives
  useEffect(() => {
    if (data) {
      setFormData(prev => ({
        ...prev,
        eventName: prev.eventName || data.title || '',
        description: prev.description || data.description || '',
        eventType: prev.eventType === 'Hackathon' 
          ? (data.eventType || 'Hackathon')
          : prev.eventType
      }));
    }
  }, [data]);

  return (
    <form>
      <div>
        <label>Event URL:</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
        <button 
          type="button"
          onClick={handleFetchAndAutofill}
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? 'Fetching...' : 'Fetch Details'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fef3c7', 
          borderRadius: '4px',
          color: 'red'
        }}>
          {error}
        </div>
      )}

      <div>
        <label>Event Name:</label>
        <input
          value={formData.eventName}
          onChange={(e) => 
            setFormData({ ...formData, eventName: e.target.value })
          }
        />
      </div>

      <div>
        <label>Event Type:</label>
        <select
          value={formData.eventType}
          onChange={(e) => 
            setFormData({ ...formData, eventType: e.target.value })
          }
        >
          <option value="Hackathon">Hackathon</option>
          <option value="Workshop">Workshop</option>
          <option value="Conference">Conference</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label>Description:</label>
        <textarea
          value={formData.description}
          onChange={(e) => 
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <button type="submit">Save Event</button>
    </form>
  );
}
```

## Backend - Using the Service Directly

### Basic Fetch

```typescript
import { fetchEventMetadata } from './_core/metadataService';

// In your route handler or procedure
const result = await fetchEventMetadata('https://mlh.io');

if (result.success && result.data) {
  console.log('Title:', result.data.title);
  console.log('Type:', result.data.eventType);
  // Use the data...
} else {
  console.error('Fetch failed:', result.error);
}
```

### Batch Fetch

```typescript
import { fetchMultipleMetadata } from './_core/metadataService';

const urls = [
  'https://mlh.io',
  'https://nodejs.org',
  'https://reactjs.org'
];

const results = await fetchMultipleMetadata(urls);

results.forEach(result => {
  console.log(`URL: ${result.url}`);
  console.log(`Success: ${result.success}`);
  if (result.data) {
    console.log(`Title: ${result.data.title}`);
  }
});
```

### With Error Handling

```typescript
import { fetchEventMetadata } from './_core/metadataService';
import { TRPCError } from '@trpc/server';

async function fetchEventWithFallback(url: string) {
  const result = await fetchEventMetadata(url);

  if (!result.success) {
    // Log error for debugging
    console.warn(`Failed to fetch ${url}: ${result.error}`);
    
    // Throw tRPC error for client
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: result.error || 'Failed to fetch metadata'
    });
  }

  // Return only non-empty fields
  const metadata = {};
  if (result.data?.title) metadata.title = result.data.title;
  if (result.data?.description) metadata.description = result.data.description;
  if (result.data?.image) metadata.image = result.data.image;
  if (result.data?.eventType) metadata.eventType = result.data.eventType;

  return metadata;
}
```

## API Usage Examples

### Using tRPC Client

```typescript
// Direct mutation
const result = await trpc.applications.fetchMetadata.mutate({
  url: 'https://mlh.io'
});

if (result.success) {
  console.log('Fetched:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Using tRPC Hook in Component

```typescript
import { trpc } from '@/lib/trpc';

export function MetadataFetcher() {
  const mutation = trpc.applications.fetchMetadata.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        console.log('Success:', data.data);
        // Update UI
      } else {
        console.error('Failed:', data.error);
        // Show error to user
      }
    },
    onError: (error) => {
      console.error('Request error:', error.message);
    }
  });

  const handleFetch = () => {
    mutation.mutate({ url: 'https://example.com' });
  };

  return (
    <div>
      <button onClick={handleFetch} disabled={mutation.isPending}>
        {mutation.isPending ? 'Loading...' : 'Fetch'}
      </button>
      {mutation.status === 'error' && (
        <p>Error: {mutation.error?.message}</p>
      )}
    </div>
  );
}
```

### Using Fetch API (Generic HTTP)

```typescript
// If using raw HTTP instead of tRPC

async function fetchMetadataHttp(url) {
  const response = await fetch('/api/trpc/applications.fetchMetadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Usage
const result = await fetchMetadataHttp('https://mlh.io');
```

## URL Validation Examples

### Using the Validation Service

```typescript
import { isValidURL, normalizeURL } from './_core/urlValidation';

// Check if URL is valid
if (isValidURL('https://mlh.io')) {
  console.log('✅ Valid URL');
} else {
  console.log('❌ Invalid or unsafe URL');
}

// Normalize user input
const userInput = 'example.com';
const normalized = normalizeURL(userInput);
console.log(normalized); // 'https://example.com'

// Invalid URLs
console.log(isValidURL('http://localhost'));      // false (SSRF)
console.log(isValidURL('http://192.168.1.1'));   // false (SSRF)
console.log(isValidURL('http://127.0.0.1'));     // false (SSRF)
console.log(isValidURL('https://mlh.io'));       // true ✅
```

## Error Handling Patterns

### Pattern 1: Graceful Degradation

```typescript
async function getEventMetadata(url: string) {
  try {
    const result = await fetchEventMetadata(url);
    
    if (result.success) {
      return result.data;
    } else {
      // Fetch failed, return empty but safe object
      console.warn(`Fetch failed for ${url}`);
      return {
        title: undefined,
        description: undefined,
        eventType: undefined
      };
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return {}; // Return empty object, let user fill manually
  }
}
```

### Pattern 2: Partial Data Processing

```typescript
async function processMetadata(url: string) {
  const result = await fetchEventMetadata(url);

  if (result.success && result.data) {
    const metadata = result.data;
    
    // Process each field independently
    const eventName = metadata.title?.trim().substring(0, 200);
    const description = metadata.description?.trim().substring(0, 500);
    const eventType = metadata.eventType || 'Other';

    return {
      eventName,
      description,
      eventType,
      hasTitle: !!metadata.title,
      hasDescription: !!metadata.description,
      hasImage: !!metadata.image
    };
  } else {
    return {
      eventName: undefined,
      description: undefined,
      eventType: undefined,
      error: result.error || 'Unknown error'
    };
  }
}
```

### Pattern 3: Retry Logic

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchEventMetadata(url);
      
      if (result.success) {
        return result.data;
      }
      
      // Don't retry for SSRF or validation errors
      if (result.error?.includes('Invalid') || 
          result.error?.includes('unsafe')) {
        throw new Error(result.error);
      }
      
      // Retry for timeout/network errors
      if (attempt < maxRetries) {
        console.log(`Retry attempt ${attempt} for ${url}`);
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      continue;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Testing Examples

### Unit Test for Validation

```typescript
import { isValidURL, normalizeURL } from './_core/urlValidation';
import { describe, it, expect } from 'vitest';

describe('URL Validation', () => {
  it('should accept valid public URLs', () => {
    expect(isValidURL('https://mlh.io')).toBe(true);
    expect(isValidURL('http://example.com')).toBe(true);
  });

  it('should reject SSRF attacks', () => {
    expect(isValidURL('http://localhost')).toBe(false);
    expect(isValidURL('http://127.0.0.1')).toBe(false);
    expect(isValidURL('http://192.168.1.1')).toBe(false);
    expect(isValidURL('http://10.0.0.1')).toBe(false);
  });

  it('should normalize URLs', () => {
    expect(normalizeURL('example.com')).toBe('https://example.com');
    expect(normalizeURL('https://example.com')).toBe('https://example.com');
    expect(normalizeURL('EXAMPLE.COM')).toBe('https://example.com');
  });

  it('should reject invalid URLs', () => {
    expect(normalizeURL('not a url')).toBe('');
    expect(normalizeURL('ftp://example.com')).toBe('');
  });
});
```

### Integration Test for Metadata Fetch

```typescript
import { fetchEventMetadata } from './_core/metadataService';
import { describe, it, expect } from 'vitest';

describe('Metadata Fetching', () => {
  it('should fetch metadata from valid URL', async () => {
    const result = await fetchEventMetadata('https://mlh.io');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBeTruthy();
  });

  it('should handle timeouts gracefully', async () => {
    const result = await fetchEventMetadata('https://slowserver.example.com');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });

  it('should block SSRF attacks', async () => {
    const result = await fetchEventMetadata('http://localhost');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid or unsafe');
  });

  it('should detect event type', async () => {
    const result = await fetchEventMetadata('https://mlh.io');
    
    if (result.success && result.data) {
      expect(['Hackathon', 'Workshop', 'Conference', 'Other'])
        .toContain(result.data.eventType || 'Other');
    }
  });
});
```

## Common Patterns

### Pattern: Auto-Save After Fetch

```typescript
const { data } = useFetchMetadata();

useEffect(() => {
  if (data && !isFormDirty) {
    // Auto-populate form after fetch
    setFormData(prev => ({
      ...prev,
      eventName: prev.eventName || data.title,
      description: prev.description || data.description,
      eventType: prev.eventType === 'Hackathon' 
        ? (data.eventType || 'Hackathon')
        : prev.eventType
    }));
    
    // Could also auto-save if desired
    // submitForm();
  }
}, [data, isFormDirty]);
```

### Pattern: Progressive Enhancement

```typescript
// Component works even if metadata service fails
export function EventForm() {
  const [formData, setFormData] = useState(initialData);
  const { fetchMetadata, isLoading, error } = useFetchMetadata();

  const handleFetch = async () => {
    const result = await fetchMetadata(formData.url);
    // If fails, form still works - user fills manually
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields always available */}
      <input value={formData.eventName} />
      
      {/* Optional enhancement for metadata fetch */}
      <button type="button" onClick={handleFetch}>
        {isLoading ? 'Fetching...' : 'Auto-fill'}
      </button>
      
      {error && <p className="error">{error}</p>}
      
      <button type="submit">Save</button>
    </form>
  );
}
```

---

## Troubleshooting Code Issues

### Issue: URL not fetching

```typescript
// ✅ DO
const normalized = normalizeURL(userInput);
const result = await fetchEventMetadata(normalized);

// ❌ DON'T  
const result = await fetchEventMetadata(userInput); // May be invalid format
```

### Issue: Form data getting overwritten

```typescript
// ✅ DO - Merge carefully
setFormData(prev => ({
  ...prev,
  eventName: prev.eventName || fetchedTitle, // Only fill if empty
  description: prev.description || fetchedDesc
}));

// ❌ DON'T - Always overwrite
setFormData({
  ...formData,
  eventName: fetchedTitle, // Overwrites existing input!
  description: fetchedDesc
});
```

### Issue: Too many retries

```typescript
// ✅ DO
for (let i = 0; i < 3; i++) {
  const result = await fetchEventMetadata(url);
  if (result.success) return result.data;
  if (result.error?.includes('Invalid')) break; // Don't retry invalid
  await delay(1000 * i); // Exponential backoff
}

// ❌ DON'T
while (true) {
  const result = await fetchEventMetadata(url);
  if (!result.success) continue; // Infinite loop!
}
```

---

## API Response Status Codes

| Status | Meaning | Next Step |
|--------|---------|-----------|
| success: true | Metadata fetched | Use data, let user edit |
| success: false + error | Fetch failed | Show error, let user fill manually |
| (exception) | Server error | Show generic error, retry |

---

**Last Updated**: April 10, 2026  
**Library Version**: 1.0.0
