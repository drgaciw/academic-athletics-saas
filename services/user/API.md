# User Service API Reference

## Base URL
- Development: `http://localhost:3001`
- Production: `https://your-domain.com`

## Authentication
All endpoints (except webhooks and health check) require a valid JWT token from Clerk in the Authorization header:

```
Authorization: Bearer {jwt_token}
```

## Endpoints

### Health Check

#### GET /health
Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "user-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0"
}
```

---

### Profile Management

#### GET /api/user/profile/:id
Get a user's profile.

**Parameters:**
- `id` (path) - User ID

**Authorization:**
- User can access their own profile
- Admin role can access any profile

**Response:**
```json
{
  "id": "cuid123",
  "clerkId": "clerk_123",
  "email": "user@example.com",
  "role": "STUDENT_ATHLETE",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "studentProfile": {
    "id": "profile123",
    "userId": "cuid123",
    "studentId": "SA12345",
    "sport": "Basketball",
    "gpa": 3.5,
    "creditHours": 60,
    "eligibilityStatus": "ELIGIBLE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

---

#### PUT /api/user/profile/:id
Update a user's profile.

**Parameters:**
- `id` (path) - User ID

**Authorization:**
- User can update their own profile
- Admin role can update any profile

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "role": "STUDENT_ATHLETE"
}
```

**Validation Rules:**
- `firstName` (optional) - Minimum 1 character
- `lastName` (optional) - Minimum 1 character
- `email` (optional) - Valid email format
- `role` (optional) - Must be valid UserRole enum value

**Response:**
```json
{
  "id": "cuid123",
  "clerkId": "clerk_123",
  "email": "jane.smith@example.com",
  "role": "STUDENT_ATHLETE",
  "firstName": "Jane",
  "lastName": "Smith",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found
- `409 Conflict` - Email already in use

---

### Roles & Permissions

#### GET /api/user/roles/:id
Get a user's roles and permissions.

**Parameters:**
- `id` (path) - User ID

**Authorization:**
- User can access their own roles
- Admin role can access any user's roles

**Response:**
```json
{
  "userId": "cuid123",
  "role": "STUDENT_ATHLETE",
  "permissions": [
    "read:own_profile",
    "update:own_profile",
    "read:own_schedule",
    "read:own_compliance",
    "create:support_request",
    "read:own_conversations"
  ],
  "studentProfile": {
    "id": "profile123",
    "studentId": "SA12345",
    "sport": "Basketball"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

---

### Clerk Synchronization

#### POST /api/user/sync-clerk
Webhook endpoint for Clerk user synchronization.

**Headers:**
```
svix-id: msg_...
svix-timestamp: 1234567890
svix-signature: v1,signature...
Content-Type: application/json
```

**Request Body (user.created / user.updated):**
```json
{
  "type": "user.created",
  "data": {
    "id": "clerk_123",
    "email_addresses": [
      {
        "id": "email_123",
        "email_address": "user@example.com"
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "public_metadata": {
      "role": "STUDENT_ATHLETE"
    }
  }
}
```

**Request Body (user.deleted):**
```json
{
  "type": "user.deleted",
  "data": {
    "id": "clerk_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid webhook data
- `401 Unauthorized` - Invalid signature
- `500 Internal Server Error` - Processing error

---

## User Roles

### STUDENT_ATHLETE
Permissions:
- `read:own_profile` - View own profile
- `update:own_profile` - Update own profile
- `read:own_schedule` - View own schedule
- `read:own_compliance` - View own compliance status
- `create:support_request` - Create support requests
- `read:own_conversations` - View own AI conversations

### ADMIN
Permissions:
- `read:all_profiles` - View all user profiles
- `update:all_profiles` - Update any user profile
- `delete:profiles` - Delete user profiles
- `read:all_schedules` - View all schedules
- `update:all_schedules` - Update any schedule
- `read:all_compliance` - View all compliance records
- `update:compliance_rules` - Update compliance rules
- `read:all_support` - View all support requests
- `update:all_support` - Update any support request
- `read:all_conversations` - View all AI conversations
- `manage:users` - Manage user accounts
- `manage:roles` - Manage user roles

### COACH
Permissions:
- `read:team_profiles` - View team member profiles
- `read:team_schedules` - View team schedules
- `read:team_compliance` - View team compliance
- `create:intervention` - Create intervention plans
- `read:team_analytics` - View team analytics
- `update:team_profiles` - Update team member profiles

### FACULTY
Permissions:
- `read:student_profiles` - View student profiles
- `submit:progress_report` - Submit progress reports
- `read:assigned_students` - View assigned students
- `create:absence_notification` - Create absence notifications

### MENTOR
Permissions:
- `read:mentee_profiles` - View mentee profiles
- `read:mentee_schedules` - View mentee schedules
- `create:mentoring_session` - Create mentoring sessions
- `read:mentee_compliance` - View mentee compliance

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "fieldName",
      "message": "Specific validation error"
    },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123abc"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed
- `INVALID_SIGNATURE` - Invalid webhook signature
- `SYNC_ERROR` - User synchronization failed

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production:
- 100 requests per minute per user
- 1000 requests per minute per IP
- 10 webhook requests per minute

---

## Examples

### cURL Examples

**Get user profile:**
```bash
curl -X GET http://localhost:3001/api/user/profile/cuid123 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Update user profile:**
```bash
curl -X PUT http://localhost:3001/api/user/profile/cuid123 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Get user roles:**
```bash
curl -X GET http://localhost:3001/api/user/roles/cuid123 \
  -H "Authorization: Bearer eyJhbGc..."
```

### JavaScript/TypeScript Examples

**Using fetch:**
```typescript
// Get user profile
const response = await fetch('http://localhost:3001/api/user/profile/cuid123', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
const profile = await response.json()

// Update user profile
const response = await fetch('http://localhost:3001/api/user/profile/cuid123', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firstName: 'Jane',
    lastName: 'Smith',
  }),
})
const updatedProfile = await response.json()
```

**Using axios:**
```typescript
import axios from 'axios'

// Get user profile
const { data } = await axios.get(
  'http://localhost:3001/api/user/profile/cuid123',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
)

// Update user profile
const { data } = await axios.put(
  'http://localhost:3001/api/user/profile/cuid123',
  {
    firstName: 'Jane',
    lastName: 'Smith',
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
)
```

---

## Webhooks

### Clerk Webhook Configuration

1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Enter endpoint URL: `https://your-domain.com/api/user/sync-clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret to `CLERK_WEBHOOK_SECRET` environment variable

### Testing Webhooks Locally

Use ngrok or similar tool to expose local server:

```bash
ngrok http 3001
```

Then configure Clerk webhook with the ngrok URL:
```
https://abc123.ngrok.io/api/user/sync-clerk
```
