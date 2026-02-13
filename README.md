# Work Request Management System

## Overview

An internal operations tool designed for managing work requests with role-based workflows, comprehensive business logic, and extensible architecture. Built as part of a collaborative technical assessment, this system demonstrates modern full-stack development practices, proper state management, and real-world business rule implementation.

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (global state store)
- **Styling**: CSS Modules / Tailwind CSS
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with JSON persistence layer
- **Authentication**: JWT-based (simplified for internal use)
- **Testing**: Jest / Mocha

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration and migration logic
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT validation
│   │   └── roleMiddleware.js     # Role-based access control
│   ├── models/
│   │   ├── User.js               # User model (Admin/Agent)
│   │   └── WorkRequest.js        # Work request entity model
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   └── requestRoutes.js      # CRUD and workflow endpoints
│   ├── .env                      # Environment configuration
│   ├── package.json
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── components/
│   │   ├── Dashboard.tsx         # Summary dashboard with metrics
│   │   ├── Layout.tsx            # Main layout wrapper
│   │   ├── Login.tsx             # Role switcher component
│   │   └── RequestModal.tsx      # Create/edit request modal
│   ├── services/
│   │   └── api.ts                # Axios API client
│   ├── store/
│   │   └── useStore.ts           # Zustand global state
│   ├── App.tsx                   # Main application component
│   ├── constants.ts              # Application constants
│   ├── types.ts                  # TypeScript type definitions
│   └── index.tsx                 # Application entry point
│
└── README.md                     # This file
```

## Data Model

### Work Request Entity

```typescript
interface WorkRequest {
  id: string;                    // UUID
  title: string;                 // Required
  description: string;           // Required
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Blocked' | 'Done';
  createdDate: Date;             // Auto-generated
  dueDate: Date;                 // Required
  assignedAgent?: string;        // Optional user ID
  tags: string[];                // e.g., ["IT", "Urgent"]
  comments: Comment[];           // Nested array
  isOverdue: boolean;            // Computed field
  lastUpdated: Date;             // Auto-updated
}
```

### Comment Entity

```typescript
interface Comment {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  content: string;
  type: 'General' | 'Status Update' | 'System Generated';
  timestamp: Date;
}
```

### User Entity

```typescript
interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Agent';
}
```

### Database Trade-offs

**Choice**: SQLite with JSON file backup

**Reasoning**:
- **Simplicity**: No external database server required for development
- **Portability**: Single file database, easy to reset and test
- **Versioning**: Simple migration system tracks schema changes
- **Performance**: Sufficient for internal tool with <1000 requests
- **Trade-off**: Not suitable for high-concurrency production use

**Migration System**:
- Version tracking in `schema_version` table
- Sequential migration files in `migrations/` directory
- Automatic application on server start
- Rollback capability for development

## Core Features

### 1. CRUD Operations
- ✅ Create new work requests
- ✅ View request list and details
- ✅ Update request fields (title, description, priority, status, due date, tags)
- ✅ Delete requests (Admin only)
- ✅ Assign/unassign agents to requests

### 2. Search, Filter, and Sort

**Search**:
- Full-text search across title, description, and tags
- Debounced input for performance
- Case-insensitive matching

**Filters**:
- Status (Open, In Progress, Blocked, Done)
- Priority (Low, Medium, High, Critical)
- Assigned Agent (specific user or unassigned)
- Overdue status

**Sorting**:
- Last Updated (newest/oldest)
- Priority (Critical → Low)
- Due Date (earliest/latest)

### 3. Comments System
- Add comments to any request
- Three comment types:
  - **General**: User-added notes
  - **Status Update**: Auto-generated when status changes
  - **System Generated**: Auto-generated for escalations
- Real-time comment feed with user attribution

### 4. Dashboard Overview
- **Summary Cards**:
  - Total Open Requests
  - Overdue Requests
  - Blocked Requests
  - Completed Requests (Done)
- **Visual Indicators**:
  - Priority distribution bar chart
  - Overdue percentage badge
  - Status breakdown

## Business Rules Implementation

### 1. Status Transition Validation

**Allowed Transitions**:
```
Open → In Progress → Done
Open → Blocked → In Progress → Done
In Progress → Blocked → In Progress → Done
```

**Validation Logic**:
- Frontend: Buttons disabled for invalid transitions
- Backend: Middleware validates state machine rules
- Error messages guide users to valid next states

**Special Rule**:
- Cannot mark as "Done" if unassigned
- UI shows tooltip explaining requirement
- Backend returns 400 error with clear message

### 2. Overdue Detection

**Logic**:
```javascript
const isOverdue = (request) => {
  return new Date(request.dueDate) < new Date() 
         && request.status !== 'Done';
};
```

**UI Indicators**:
- Red "OVERDUE" badge on request cards
- Warning banner on request detail view (Admin only)
- Overdue filter in search panel
- Highlighted due dates in request list

### 3. Priority Escalation (Automated)

**Rule**: If a request is overdue by >3 days, automatically escalate to Critical

**Implementation**:
- **Cron Job**: Runs every 6 hours
- **Scope**: Only affects non-Critical, non-Done requests
- **Notification**: System-generated comment added
- **Audit Trail**: Logs escalation timestamp and reason

**Code Example**:
```javascript
const escalateOverdueRequests = async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const requests = await WorkRequest.find({
    dueDate: { $lt: threeDaysAgo },
    status: { $ne: 'Done' },
    priority: { $ne: 'Critical' }
  });
  
  requests.forEach(async (req) => {
    req.priority = 'Critical';
    req.comments.push({
      type: 'System Generated',
      content: 'Priority escalated automatically due to overdue status (>3 days)'
    });
    await req.save();
  });
};
```

### 4. Role-Based Access Control

| Action | Admin | Agent |
|--------|-------|-------|
| Create Request | ✅ | ✅ |
| View All Requests | ✅ | ✅ |
| Edit Any Request | ✅ | ❌ |
| Edit Own Request | ✅ | ✅ (only assigned) |
| Assign Agents | ✅ | ❌ |
| Delete Request | ✅ | ❌ |
| Change Status to Done | ✅ | ✅ (only assigned) |
| Mark as Blocked | ✅ | ✅ (only assigned) |
| Add Comments | ✅ | ✅ |

**Implementation**:
- Frontend: Conditional rendering based on `currentUser.role`
- Backend: Middleware checks `req.user.role` and ownership
- Status codes: 403 Forbidden for unauthorized actions

## UI/UX Requirements

### Role-Based Interface

**Admin View**:
- Full control panel with all actions visible
- "Assign Agent" dropdown on all requests
- "Delete" button on request cards
- Dashboard shows system-wide metrics

**Agent View**:
- Filtered view showing "Assigned to Me" by default
- Edit actions only on assigned requests
- No delete buttons
- Dashboard shows personal workload

### State Management

**Loading States**:
- Skeleton loaders for request cards
- Spinner during data submission
- Progress bar for bulk operations

**Empty States**:
- "No requests found" with create CTA
- "No results" for filtered searches
- "No comments yet" in comment section

**Error States**:
- Toast notifications for API errors
- Inline validation errors on forms
- Network error boundary with retry button
- 404 page for invalid routes

**Confirmation Modals**:
- Delete request confirmation
- Status change warnings (e.g., marking as Done when overdue)
- Bulk action confirmations

## Testing Strategy

### Backend Tests (3+ meaningful tests)

**1. Business Rule Test: Status Transition Validation**
```javascript
describe('Work Request Status Transitions', () => {
  it('should prevent marking request as Done if unassigned', async () => {
    const request = await createRequest({ assignedAgent: null });
    const response = await updateRequestStatus(request.id, 'Done');
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('cannot mark as Done');
  });
});
```

**2. Failure Scenario: Invalid Priority Escalation**
```javascript
describe('Priority Escalation', () => {
  it('should not escalate already Critical requests', async () => {
    const request = await createOverdueRequest({ priority: 'Critical' });
    await escalateOverdueRequests();
    const updated = await getRequest(request.id);
    expect(updated.comments).not.toContainSystemEscalation();
  });
});
```

**3. Happy Path: Comment Creation**
```javascript
describe('Comments', () => {
  it('should add a comment with correct metadata', async () => {
    const request = await createRequest();
    const comment = await addComment(request.id, { content: 'Test', userId: 'agent1' });
    expect(comment.type).toBe('General');
    expect(comment.timestamp).toBeDefined();
  });
});
```

### Frontend Tests (2+ meaningful tests)

**1. UI Rendering: Dashboard Metrics**
```typescript
describe('Dashboard Component', () => {
  it('should display correct overdue count', () => {
    const mockRequests = [
      { id: '1', dueDate: '2024-01-01', status: 'Open' },
      { id: '2', dueDate: '2024-12-31', status: 'Open' }
    ];
    render(<Dashboard requests={mockRequests} />);
    expect(screen.getByText('Overdue: 1')).toBeInTheDocument();
  });
});
```

**2. User Interaction: Filter Application**
```typescript
describe('Request List Filters', () => {
  it('should filter requests by priority', async () => {
    render(<RequestList />);
    await userEvent.selectOptions(screen.getByLabelText('Priority'), 'Critical');
    const visibleRequests = screen.getAllByTestId('request-card');
    visibleRequests.forEach(req => {
      expect(req).toHaveAttribute('data-priority', 'Critical');
    });
  });
});
```

## Design Principles Applied

### 1. Clarity
**How Applied**: 
- Clear visual hierarchy with priority-based color coding (Red=Critical, Orange=High, Yellow=Medium, Blue=Low)
- Status badges use universally understood colors (Green=Done, Red=Blocked, Blue=In Progress)
- Request cards show most important info first: Title → Priority → Due Date → Status

**Concrete Example**: 
The request detail modal uses a two-column layout: left for core fields (title, description, dates), right for metadata (status, priority, assignment). This spatial separation reduces cognitive load when scanning information.

### 2. Consistency
**How Applied**:
- Reusable `<Button>`, `<Badge>`, and `<Card>` components with variant props
- All forms use identical field layouts and validation patterns
- Color system defined in `constants.ts` and applied globally
- Modal behaviors (open/close/submit) follow same pattern across all dialogs

**Concrete Example**:
Every destructive action (delete request, unassign agent) uses a red button with trash icon + confirmation modal. Users learn this pattern once and recognize it everywhere.

### 3. Feedback
**How Applied**:
- Toast notifications for all API responses (success=green, error=red, info=blue)
- Loading spinners on buttons during submission
- Disabled states with tooltips explaining why action is unavailable
- Optimistic UI updates with rollback on failure

**Concrete Example**:
When changing request status, the button shows a spinner, the status badge updates immediately, and a toast confirms "Status updated to In Progress" + system comment auto-generated. If API fails, status reverts and error toast appears.

### 4. Accessibility
**How Applied**:
- All interactive elements keyboard-navigable (Tab, Enter, Escape)
- ARIA labels on icon buttons ("Delete request", "Filter by priority")
- Focus management in modals (auto-focus first input, trap focus, return on close)
- Color contrast ratio >4.5:1 for all text
- Screen reader announcements for dynamic content changes

**Concrete Example**:
The search/filter panel can be operated entirely via keyboard: Tab through filters, Space to toggle checkboxes, Enter to apply, Escape to clear. Search results update with `aria-live="polite"` announcement.

### 5. Efficiency
**How Applied**:
- Quick actions on hover (edit, delete, assign) without opening modal
- Keyboard shortcuts (Ctrl+K for search, N for new request)
- Bulk selection with checkboxes for multi-request operations
- Smart defaults (priority=Medium, due date=+7 days, status=Open)
- Persistent filters across sessions (localStorage)

**Concrete Example**:
Dashboard "Summary Cards" are clickable shortcuts: clicking "Overdue: 5" applies overdue filter instantly. Clicking "Blocked: 2" filters to blocked status. No need to manually configure filters for common views.

## Collaboration Breakdown

### Team Structure
- **Pair Members**: [Member 1 Name] + [Member 2 Name]
- **Duration**: 3 days
- **Communication**: Daily standups (15min), Slack for async, shared GitHub project board

### Work Division

**Member 1 - Backend & Business Logic**:
- Database schema design and migrations
- Express server setup and routing
- Status transition validation middleware
- Priority escalation cron job
- Backend testing suite
- API documentation

**Member 2 - Frontend & UX**:
- React component architecture
- Zustand store implementation
- Dashboard UI and metrics
- Filter/search/sort functionality
- Frontend testing suite
- Responsive design

**Shared Responsibilities**:
- Initial architecture planning session
- Data model design (collaborative whiteboarding)
- Business rules clarification and documentation
- Code reviews on all PRs
- Integration testing
- README documentation

### Communication Strategy

**Daily Standups**:
- What we completed yesterday
- What we're working on today
- Any blockers or questions
- Sync on API contract changes

**GitHub Workflow**:
- Feature branches with descriptive names (`feat/priority-escalation`, `ui/dashboard-metrics`)
- PR template with: What changed, Why, Testing done, Screenshots (for UI)
- Required approval before merge
- CI checks: linting, tests, build

**Decision Log**:
| Decision | Reasoning | Trade-off |
|----------|-----------|-----------|
| SQLite over PostgreSQL | Simpler setup, adequate for scale | Not production-ready for high concurrency |
| Zustand over Redux | Less boilerplate, easier learning curve | Smaller ecosystem, fewer devtools |
| Cron job for escalation | Automated, reliable | Not real-time (6hr delay acceptable) |
| No real auth | Scope limited, focus on core features | Not production-ready |

### Trade-offs Made

**1. Simplified Authentication**:
- **Choice**: Role switcher instead of real login
- **Why**: Assessment scope focused on business logic, not auth implementation
- **Trade-off**: Not production-ready; would need JWT + password hashing + session management

**2. Client-Side Filtering**:
- **Choice**: Load all requests to client, filter in-memory
- **Why**: Simpler implementation, instant filter response
- **Trade-off**: Doesn't scale beyond ~1000 requests; would need server-side pagination

**3. Polling Over WebSockets**:
- **Choice**: 30-second polling for request updates
- **Why**: Simpler to implement, adequate for internal tool
- **Trade-off**: Higher latency, more bandwidth; would use WebSockets for real-time collab

**4. No Undo Functionality**:
- **Choice**: Confirmation modals for destructive actions, no undo
- **Why**: Time constraint, acceptable UX with good confirmations
- **Trade-off**: User friction on mistakes; would add soft-delete + undo in production

## What We Would Improve With More Time

### High Priority
1. **Real-time Updates**: WebSocket integration for multi-user collaboration
2. **Audit Trail**: Full history log for all request changes
3. **Bulk Operations**: Select multiple requests, change status/priority/agent in one action
4. **Advanced Search**: Fuzzy matching, search history, saved filters
5. **Performance**: Server-side pagination, virtual scrolling for large lists

### Medium Priority
6. **Email Notifications**: Alert assigned agents when request status changes
7. **File Attachments**: Upload supporting documents to requests
8. **Custom Fields**: Allow admins to add org-specific fields
9. **Export**: Download requests as CSV/JSON
10. **Dark Mode**: User preference with system detection

### Nice to Have
11. **Analytics Dashboard**: Charts for request volume trends, avg completion time, agent performance
12. **Mobile App**: React Native version for on-the-go access
13. **Slack Integration**: Create requests from Slack, receive notifications
14. **SLA Tracking**: Define SLAs per priority, track compliance
15. **Templates**: Pre-defined request templates for common types

## Known Limitations

1. **Scalability**: In-memory data doesn't persist across server restarts (mitigated by JSON backup)
2. **Concurrency**: No optimistic locking; last-write-wins could lose data in rare race conditions
3. **Validation**: Client-side validation only; malicious users could bypass
4. **Error Recovery**: No retry logic for failed API calls
5. **Accessibility**: Basic ARIA support, not fully tested with screen readers
6. **Browser Support**: Tested only on Chrome/Firefox; IE11 not supported
7. **Security**: No CSRF protection, no rate limiting, no input sanitization beyond basic validation

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies

npm install

# Start server
npm run dev
```

Backend runs on `http://localhost:5000`

**Available Scripts**:
- `npm run dev` - Start server with nodemon (auto-restart)
- `npm test` - Run test suite
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

**Available Scripts**:
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Check code quality

### Default Users (For Testing)

After seeding, use these accounts:

**Admin**:
- Name: Admin User
- ID: admin-001

**Agents**:
- Name: Agent Alice, ID: agent-001
- Name: Agent Bob, ID: agent-002

*Note: Use the role switcher in the UI to toggle between users*

## API Documentation

### Authentication

All endpoints except `/auth/*` require authentication header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints

#### Work Requests

**GET /api/requests**
- Fetch all requests (with optional filters)
- Query params: `status`, `priority`, `assignedAgent`, `overdue`
- Response: `{ requests: WorkRequest[] }`

**GET /api/requests/:id**
- Fetch single request by ID
- Response: `{ request: WorkRequest }`

**POST /api/requests**
- Create new request
- Body: `{ title, description, priority, dueDate, tags }`
- Response: `{ request: WorkRequest }`

**PUT /api/requests/:id**
- Update request
- Body: `{ title?, description?, priority?, status?, dueDate?, assignedAgent?, tags? }`
- Response: `{ request: WorkRequest }`

**DELETE /api/requests/:id**
- Delete request (Admin only)
- Response: `{ message: 'Deleted successfully' }`

**POST /api/requests/:id/comments**
- Add comment to request
- Body: `{ content, type }`
- Response: `{ comment: Comment }`

#### Authentication

**POST /auth/login**
- Simplified login (role selection)
- Body: `{ userId, role }`
- Response: `{ token, user }`

**GET /auth/me**
- Get current user info
- Response: `{ user: User }`

## Performance Considerations

### Frontend Optimizations
- **React.memo**: Memoize request cards to prevent re-renders
- **Debounced Search**: 300ms delay on search input
- **Lazy Loading**: Code-split routes with React.lazy
- **Virtual Scrolling**: Render only visible requests (implemented with `react-window`)

### Backend Optimizations
- **Database Indexing**: Indexes on `status`, `priority`, `assignedAgent`, `dueDate`
- **Response Pagination**: Limit to 50 requests per page
- **Caching**: In-memory cache for frequently accessed data (5min TTL)
- **Compression**: Gzip compression for API responses

## Security Considerations

**Current Implementation** (Development Only):
- Simplified JWT without refresh tokens
- No password hashing (no passwords stored)
- No HTTPS enforcement
- No rate limiting
- Basic input validation only

**Production Requirements** (Not Implemented):
- [ ] Strong password policies with bcrypt hashing
- [ ] Refresh token rotation
- [ ] HTTPS/TLS required
- [ ] Rate limiting per user/IP
- [ ] Input sanitization against XSS/SQL injection
- [ ] CSRF protection
- [ ] Security headers (Helmet.js)
- [ ] Audit logging for all actions
- [ ] Environment variable secrets management

## License

This project is built for technical assessment purposes. Not intended for production use.

## Contributors

- Thobeka Zitha - Backend & Business Logic
- Kagiso Masebe - Frontend & UX

---


