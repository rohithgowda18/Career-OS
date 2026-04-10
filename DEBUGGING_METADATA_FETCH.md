# Debugging Guide - Metadata Fetching

## How to Test Auto-Fetch with Logging

### 1. Open Browser DevTools
- Press `F12` or Right-click → "Inspect"
- Go to **Console** tab

### 2. Open "Add New Application" Modal
- Click "+ Add Application"
- Paste a URL in the "Event URL" field
- **Wait 1-2 seconds** for auto-fetch to trigger

### 3. Check Console Logs

You should see logs like:

```
[AddApplicationModal] Fetch metadata response: {
  success: true,
  data: {
    title: "AI Hackathon 2024",
    description: "Join us for the largest AI hackathon...",
    deadline: "2024-12-25",
    eventType: "Hackathon"
  }
}
```

### 4. Check Server Logs (Terminal)

In the terminal where you ran `npm run dev`, you should see:

```
[Metadata] Fetching metadata from: https://mlh.io
[Metadata] Extracted data: {
  title: "MLH - Major League Hacking",
  hasDescription: true,
  deadline: "2025-05-15",
  eventType: "Hackathon"
}
[Metadata] Successfully extracted metadata for: https://mlh.io
```

---

## Troubleshooting

### Issue: Console shows `deadline: null`
- The website doesn't have structured date data
- Try: `{deadline: "2024-12-25"}` manually in the field

### Issue: Console shows no logs
- The auto-fetch might not be triggering
- Try: Click the **✨ wand button** manually instead
- Make sure Event Name field is empty

### Issue: Title/Description not filling
- The website might not have OpenGraph tags
- Check: Right-click page → View Page Source
- Search for: `<meta property="og:title"` or `<title>`

---

## Test URLs with Dates

These websites often have date metadata:

1. **MLH** - `mlh.io`
   - Expected: Hackathon event with date

2. **Eventbrite** - `eventbrite.com/e/[event-id]`
   - Expected: Event name + date + description

3. **Meetup** - `meetup.com/[group]/events/[id]`
   - Expected: Event name + date + location

4. **Devpost** - `devpost.com/software/[project]`
   - Expected: Project name + description (might not have date)

---

## What Gets Fetched

The system looks for dates in this order:

1. **JSON-LD Structured Data** (Most reliable)
   ```html
   <script type="application/ld+json">
     { "startDate": "2024-12-25T10:00:00Z" }
   </script>
   ```

2. **Meta Tags**
   ```html
   <meta name="event_date" content="2024-12-25">
   <meta property="og:published_time" content="2024-12-25">
   ```

3. **Page Text Patterns**
   - `2024-12-25` (ISO)
   - `12/25/2024` (US)
   - `December 25, 2024` (Full text)

---

## Manual Testing

If auto-fetch isn't working, manually test the API:

```javascript
// In browser console:
fetch('api/trpc/applications.fetchMetadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://mlh.io' })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
```

Expected response:
```json
{
  "success": true,
  "data": {
    "title": "...",
    "description": "...",
    "deadline": "2024-12-25",
    "eventType": "Hackathon"
  }
}
```

---

## Console Logs Added

**Frontend** (`AddApplicationModal.tsx`):
- `[AddApplicationModal] Fetch metadata response:`
- `[AddApplicationModal] Metadata received:` (with title, description, deadline, eventType)
- `[AddApplicationModal] Updated form data:` (shows what was filled)
- `[AddApplicationModal] Toast message:` (shows user feedback)

**Backend** (`metadataService.ts`):
- `[Metadata] Fetching metadata from: {url}`
- `[Metadata] Extracted data:` (title, hasDescription, deadline, eventType)
- `[Metadata] Successfully extracted metadata for: {url}`

---

## Quick Checklist

- [ ] Server running on http://localhost:3001
- [ ] DevTools Console open (F12)
- [ ] Paste URL in "Event URL" field
- [ ] Wait 1-2 seconds for auto-fetch
- [ ] Check console for logs
- [ ] Check if deadline, title, description populated
- [ ] Check server terminal for extraction logs

**Report any missing fields in the logs!** 🐛
