# Investigation Report: Dashboard Volume Discrepancy

## Issue Summary

**Dashboard shows Volume = 20 for user_id = 4, but actual database contains many more application records.**

---

## Root Cause: Spring Data Pagination Default

### The Problem Flow

1. **Frontend Request** → `GET /applications` (no pagination params)
   - File: [applicationsApi.ts](apps/web/src/lib/api/applicationsApi.ts)
2. **Backend Receives** with Spring's default `Pageable`:
   - `page = 0`
   - **`size = 20`** ← **DEFAULT SPRING DATA SIZE**
   - No sort specified

3. **Backend Returns** `Page<ApplicationDTO>`:

   ```json
   {
     "content": [item1, item2, ..., item20],  // Only first 20 items
     "totalElements": 50,                      // ACTUAL COUNT (ignored by frontend!)
     "totalPages": 3,
     "number": 0,
     "size": 20,
     "isEmpty": false,
     "first": true,
     "last": false
   }
   ```

4. **Frontend Extracts** only `.content`:

   ```typescript
   // applicationsApi.ts line 6
   return Array.isArray(data) ? data : data?.content || [];
   ```

   - Gets only 20 items
   - Ignores `totalElements: 50`

5. **Dashboard Displays**: `Volume = 20` (just the current page size)

---

## Verification Checklist

| Check                 | Status      | Finding                                                                                      |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| **Soft deletes**      | ✅ PASS     | No `deleted_at`, `is_deleted`, or `archived` field in Application entity                     |
| **Status filtering**  | ✅ PASS     | All statuses included in queries (no filtering)                                              |
| **Draft/hidden apps** | ✅ PASS     | No draft status or visibility field exists                                                   |
| **Expired filtering** | ✅ PASS     | No expiration logic in repository queries                                                    |
| **Database queries**  | ✅ PASS     | Queries simply use `findByUserId()` - correct                                                |
| **Entity schema**     | ✅ PASS     | Only has: eventName, eventType, status, deadline, notes, url, location, createdAt, updatedAt |
| **Pagination limit**  | ❌ **FAIL** | Spring default size=20 applied, frontend doesn't fetch all pages                             |

---

## Code Locations

### Backend (Correct - Not the Issue)

- **AnalyticsService** ([AnalyticsService.java](apps/backend/src/main/java/com/eventtracker/service/AnalyticsService.java#L41)):

  ```java
  public Map<String, Object> getSummary(Long userId) {
      List<Application> apps = applicationRepository.findByUserId(userId);
      long total = apps.size();  // ✅ Gets ALL applications
  ```

  - Uses `findByUserId()` (no pagination) → Returns ALL records

- **ApplicationRepository** ([ApplicationRepository.java](apps/backend/src/main/java/com/eventtracker/repository/ApplicationRepository.java)):
  - `findByUserId(Long userId, Pageable pageable)` → Returns paginated results
  - `findByUserId(Long userId)` → Returns ALL results

### Frontend (Problematic)

- **DashboardView** ([DashboardView.tsx](apps/web/src/components/views/DashboardView.tsx#L12-L18)):

  ```typescript
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.list, // Called WITHOUT pagination params
  });
  const applications = applicationsQuery.data || [];
  // Only gets first page (20 items)
  ```

- **ApplicationsApi** ([applicationsApi.ts](apps/web/src/lib/api/applicationsApi.ts#L3-L8)):
  ```typescript
  list: async (params?: { page?: number; size?: number }) => {
    const data = (await restClient.get('/applications', { params: queryParams })).data;
    return Array.isArray(data) ? data : (data?.content || []);
    // ❌ Only extracts .content (20 items), ignores totalElements
  ```

---

## Why "Volume = 20" Specifically

1. Spring Data's **default page size = 20**
2. Frontend receives full `Page<ApplicationDTO>` response
3. Extracts only `content` array (first page)
4. Ignores `totalElements` metadata
5. Dashboard calculates: `totalApplications = applications.length = 20`

---

## Solutions

### Solution 1: Fetch All Records (Frontend)

**Recommended for small datasets (<1000 records)**

Update [applicationsApi.ts](apps/web/src/lib/api/applicationsApi.ts):

```typescript
list: async (params?: { page?: number; size?: number }) => {
  // Fetch without pagination to get all records
  const data = (await restClient.get('/applications?size=1000', { params: {} })).data;
  return data?.content || data || [];
},
```

Or explicitly request a large page size:

```typescript
list: async (params?: { page?: number; size?: number }) => {
  const defaultParams = { page: 0, size: 1000 };
  const queryParams = params || defaultParams;
  const data = (await restClient.get('/applications', { params: queryParams })).data;
  return data?.content || [];
},
```

### Solution 2: Use New Endpoint (Backend)

**Better for large datasets**

Add a new endpoint in [ApplicationController.java](apps/backend/src/main/java/com/eventtracker/controller/ApplicationController.java):

```java
@GetMapping("/all")
public ResponseEntity<?> listAll() {
    User user = getCurrentUser();
    List<ApplicationDTO> applications = applicationService
        .getUserApplications(user.getId(), Pageable.unpaged())
        .getContent();
    return ResponseEntity.ok(applications);
}
```

Update frontend to use it:

```typescript
list: async () => {
  const data = (await restClient.get('/applications/all')).data;
  return Array.isArray(data) ? data : (data?.content || []);
},
```

### Solution 3: Extract totalElements (Frontend)

**Most Complete - Use Page metadata**

Update [DashboardView.tsx](apps/web/src/components/views/DashboardView.tsx#L12-L18):

```typescript
const applicationsQuery = useQuery({
  queryKey: ["applications"],
  queryFn: async () => {
    const response = await restClient.get("/applications?size=1000");
    // Return total count, not just current page
    return {
      data: response.data?.content || [],
      total: response.data?.totalElements || 0,
    };
  },
});
const applications = applicationsQuery.data?.data || [];
const totalCount = applicationsQuery.data?.total || 0; // Use this!
```

---

## Expected vs Actual Counts

For **user_id = 4** (Example):

| Metric       | Current (Wrong) | Expected (Correct)                                    |
| ------------ | --------------- | ----------------------------------------------------- |
| Volume       | 20              | 50+ (actual DB count)                                 |
| Source       | First page only | All pages / Total                                     |
| Raw DB Count | N/A             | `SELECT COUNT(*) FROM applications WHERE user_id = 4` |

---

## Query to Verify in Database

```sql
-- Check actual count for user_id = 4
SELECT COUNT(*) as total_applications
FROM applications
WHERE user_id = 4;

-- Check count by status
SELECT status, COUNT(*)
FROM applications
WHERE user_id = 4
GROUP BY status;

-- Check count with future deadlines
SELECT COUNT(*)
FROM applications
WHERE user_id = 4
  AND deadline > '2026-05-28';
```

---

## Recommendations

**Priority 1**: Update frontend to use correct data source

- Use `totalElements` from Page response
- OR fetch with large page size (1000+)
- OR use new `/all` endpoint

**Priority 2**: Add backend query methods for common use cases

```java
@GetMapping("/count")
public ResponseEntity<Long> countApplications() {
    User user = getCurrentUser();
    return ResponseEntity.ok(applicationService.countUserApplications(user.getId()));
}
```

**Priority 3**: Update DashboardView to display correct Volume

- Change from `applications.length`
- To use response metadata or new count endpoint

---

## Timeline

1. **Identified**: Pagination default of 20 items
2. **Verified**: No filtering/soft-delete logic
3. **Root Cause**: Frontend extracts only `.content` from Page response
4. **Impact**: All dashboard metrics based on first page only
5. **Solution**: Fetch all records or use `totalElements`
