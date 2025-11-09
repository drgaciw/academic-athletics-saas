# Task 2.2: Service Integration - Student Data Tools

**Status**: ✅ Complete  
**Date**: November 8, 2025  
**Related Tasks**: 2.2, 2.3, 2.4, 2.5

## Overview

Integrated student data tools with actual backend microservices, replacing mock data with real API calls. Created a comprehensive service client library for HTTP communication across all microservices.

## Deliverables

### 1. Service Client Library (`packages/ai/lib/service-client.ts`)

Created a centralized HTTP client for all backend services with:

**Features**:
- Type-safe API calls with TypeScript
- Automatic error handling and formatting
- Context-aware authentication (userId passing)
- Environment-based service URL configuration
- Consistent error responses

**Services Covered**:
- **User Service**: Profile management, roles, permissions
- **Monitoring Service**: Academic records, performance metrics, attendance
- **Compliance Service**: Eligibility checks, NCAA rules, scenarios
- **Advising Service**: Course search, conflicts, degree requirements
- **Integration Service**: Email, documents, calendar, athletic schedule
- **Support Service**: Support requests, tutoring, resources

**API Structure**:
```typescript
// Example usage
import { userService, monitoringService } from '@aah/ai'

// Get user profile
const profile = await userService.getProfile('user123', context)

// Get academic records
const records = await monitoringService.getAcademicRecords(
  'S12345',
  { semester: 'Fall 2024', includeInProgress: true },
  context
)
```

### 2. Updated Student Data Tools

**Modified Tools**:
1. **getStudentProfile** - Now calls User Service API
   - Fetches real user and student profile data
   - Returns XML-formatted results for Claude
   - Includes error handling with graceful degradation
   
2. **getAcademicRecords** - Now calls Monitoring Service API
   - Retrieves actual course history and grades
   - Supports semester filtering
   - Includes in-progress courses option

3. **getAthleticSchedule** - Now calls Integration Service API
   - Fetches real athletic events
   - Supports date range and event type filtering
   - Returns practices, games, and travel events

4. **getPerformanceMetrics** - Now calls Monitoring Service API
   - Retrieves actual performance data
   - Supports multiple timeframes
   - Includes attendance and completion rates

5. **getDegreeProgress** - Now calls Advising Service API
   - Calculates real degree completion status
   - Shows remaining requirements
   - Provides graduation projections

### 3. TypeScript Configuration

Created `packages/ai/tsconfig.json` for proper type checking:
- Node.js types support
- ES2022 target for modern features
- Strict type checking enabled
- Declaration files generation

### 4. Error Handling

**ServiceClientError Class**:
```typescript
class ServiceClientError extends Error {
  constructor(
    message: string,
    public service: string,
    public statusCode?: number,
    public details?: unknown
  )
}
```

**Error Handling Strategy**:
- Network errors caught and wrapped
- HTTP errors with status codes
- Graceful degradation (tools return error objects instead of throwing)
- Detailed error messages for debugging

## Integration Points

### User Service
**Endpoint**: `http://localhost:3001`  
**Used By**: getStudentProfile  
**Methods**:
- `GET /api/user/profile/:id` - Get user profile
- `GET /api/user/roles/:id` - Get roles and permissions
- `PUT /api/user/profile/:id` - Update profile

### Monitoring Service
**Endpoint**: `http://localhost:3004`  
**Used By**: getAcademicRecords, getPerformanceMetrics  
**Methods**:
- `GET /api/monitoring/records/:studentId` - Get academic records
- `GET /api/monitoring/performance/:studentId` - Get performance metrics
- `GET /api/monitoring/attendance/:studentId` - Get attendance

### Advising Service
**Endpoint**: `http://localhost:3003`  
**Used By**: getDegreeProgress  
**Methods**:
- `GET /api/advising/progress/:studentId` - Calculate degree progress
- `POST /api/advising/courses/search` - Search courses
- `POST /api/advising/conflicts/:studentId` - Check conflicts

### Integration Service
**Endpoint**: `http://localhost:3006`  
**Used By**: getAthleticSchedule  
**Methods**:
- `GET /api/integration/athletics/schedule/:studentId` - Get athletic schedule
- `POST /api/integration/email/send` - Send email
- `POST /api/integration/calendar/schedule` - Schedule event

## Environment Variables

Required environment variables for service URLs:

```bash
# Service URLs (with defaults)
USER_SERVICE_URL=http://localhost:3001
COMPLIANCE_SERVICE_URL=http://localhost:3002
ADVISING_SERVICE_URL=http://localhost:3003
MONITORING_SERVICE_URL=http://localhost:3004
SUPPORT_SERVICE_URL=http://localhost:3005
INTEGRATION_SERVICE_URL=http://localhost:3006
```

## Authentication Flow

Current implementation uses a simplified authentication model:

1. **Context-Based**: Tools receive `ToolExecutionContext` with `userId`
2. **Header Passing**: `X-User-Id` header sent to services
3. **Future Enhancement**: Will be replaced with JWT tokens from Clerk

**Production Authentication** (TODO):
```typescript
// Future implementation
headers['Authorization'] = `Bearer ${context.token}`
```

## Testing

### Manual Testing

```typescript
// Test User Service integration
import { userService } from '@aah/ai'

const profile = await userService.getProfile('user123')
console.log(profile)

// Test Monitoring Service integration
import { monitoringService } from '@aah/ai'

const records = await monitoringService.getAcademicRecords('S12345')
console.log(records)
```

### Integration Testing

```bash
# Start all services
turbo run dev

# Test student data tools
cd packages/ai
npx tsx examples/test-student-tools.ts
```

## Error Scenarios

### Service Unavailable
```typescript
{
  error: true,
  message: 'Failed to retrieve student profile',
  details: 'fetch failed',
  studentId: 'S12345'
}
```

### Invalid Student ID
```typescript
{
  error: true,
  message: 'Failed to retrieve student profile',
  details: 'HTTP 404: Not Found',
  studentId: 'INVALID'
}
```

### Network Timeout
```typescript
{
  error: true,
  message: 'Failed to retrieve academic records',
  details: 'Request timeout',
  studentId: 'S12345'
}
```

## Performance Considerations

### Current Implementation
- Direct HTTP calls (no caching)
- Sequential tool execution
- No request batching

### Future Optimizations
1. **Response Caching**: Cache frequently accessed data (profiles, schedules)
2. **Request Batching**: Batch multiple requests to same service
3. **Parallel Execution**: Execute independent tool calls in parallel
4. **Connection Pooling**: Reuse HTTP connections

## Security Considerations

### Current
- ✅ HTTPS support (production)
- ✅ CORS configuration
- ✅ Error message sanitization
- ✅ Input validation via Zod schemas

### TODO
- [ ] JWT token authentication
- [ ] Rate limiting per user
- [ ] Request signing
- [ ] API key rotation
- [ ] Audit logging

## Next Steps

### Immediate (Task 2.3)
- [ ] Integrate compliance tools with Compliance Service
- [ ] Implement NCAA rule search with vector embeddings
- [ ] Add eligibility scenario simulation

### Short Term (Task 2.4)
- [ ] Integrate advising tools with Advising Service
- [ ] Implement course search and conflict detection
- [ ] Add degree requirement tracking

### Medium Term (Task 2.5)
- [ ] Integrate administrative tools with Integration Service
- [ ] Implement email sending and document generation
- [ ] Add calendar event scheduling

## Code Statistics

| File | Lines | Functions | Exports |
|------|-------|-----------|---------|
| service-client.ts | 450+ | 25+ | 6 services |
| student-data-tools.ts | 250+ | 5 tools | 5 tools |
| tsconfig.json | 30 | - | - |
| **Total** | **730+** | **30+** | **11** |

## Dependencies

**New Dependencies**: None (uses existing fetch API)

**Updated Files**:
- `packages/ai/lib/service-client.ts` (new)
- `packages/ai/tools/student-data-tools.ts` (updated)
- `packages/ai/tsconfig.json` (new)
- `packages/ai/index.ts` (updated - exports service client)

## Verification

### Checklist
- [x] Service client created with all 6 services
- [x] Student data tools updated to use real APIs
- [x] Error handling implemented
- [x] TypeScript configuration added
- [x] Type checking passes
- [x] Service client exported from package
- [x] Documentation complete

### Test Commands
```bash
# Type check
cd packages/ai
npx tsc --noEmit

# Build package
turbo run build --filter=@aah/ai

# Test service client (requires services running)
npx tsx -e "
import { userService } from './lib/service-client'
userService.getProfile('test').then(console.log).catch(console.error)
"
```

## Impact

### Benefits
✅ Real data integration (no more mocks)  
✅ Type-safe API calls  
✅ Centralized service communication  
✅ Consistent error handling  
✅ Easy to test and maintain  
✅ Scalable architecture  

### Risks Mitigated
✅ Service failures handled gracefully  
✅ Network errors don't crash agents  
✅ Invalid data returns error objects  
✅ Type safety prevents runtime errors  

## Conclusion

Task 2.2 successfully integrated student data tools with backend microservices. The service client library provides a robust foundation for all tool-to-service communication. All 5 student data tools now fetch real data from their respective services with proper error handling and type safety.

**Status**: ✅ Ready for Task 2.3 (Compliance Tools Integration)

---

**Next Task**: Task 2.3 - Implement compliance tools integration with Compliance Service
