# TASKFLOW - OPERATIONAL COMMAND SYSTEM

A cyberpunk-themed work request management platform built with React, TypeScript,
Zustand, and Tailwind CSS. Designed for administrators and field agents to manage,
track, and resolve operational protocols in real time.

---

## LIVE DEPLOYMENT

Local: http://localhost:5173
Demo credentials: admin / admin or agent / agent

---

## TABLE OF CONTENTS

1. Architecture Decisions
2. API Choice
3. Data Transformations
4. Caching Strategy
5. Design Principles Applied
6. Known Limitations
7. What I Would Add With More Time
8. Setup and Running

---

## ARCHITECTURE DECISIONS

TaskFlow follows a layered frontend architecture with clear separation of concerns:

src/
├── components/
│   ├── Dashboard.tsx          Admin/agent scoped view, filters, stats
│   ├── RequestModal.tsx       Create/edit/delete protocol modal
│   ├── Login.tsx              Auth screen with agent selection
│   └── Layout.tsx             Collapsible sidebar and responsive shell
├── store/
│   └── useStore.ts            Global state via Zustand
├── services/
│   └── api.ts                 Mock API layer - localStorage-backed data service
├── types/                     Shared TypeScript interfaces and enums
├── constants.ts               Color maps, agent list, cache config
└── App.tsx                    View routing and admin agent management modal


KEY DECISIONS

Decision                          Rationale
------------------------------------------------------------------------------------------
Zustand over Redux                Minimal boilerplate, direct selector subscriptions,
                                  no provider wrappers needed

localStorage as database          Eliminates backend dependency, persists across
                                  sessions, perfect for demo scope

Component-level modals            Modals rendered at root level with fixed positioning
                                  and high z-index to avoid sidebar overlap

Tailwind CSS                      Utility-first approach enables rapid, consistent,
                                  responsive styling without separate CSS files

Role-Based Access Control         Admin vs Agent permissions enforced at both the
                                  UI layer and the service layer

Optimistic UI updates             State updates immediately on action with rollback
                                  on error for a snappy user experience

Single-file component pattern     Related logic, state, and JSX colocated for
                                  easier maintainability

---

## API CHOICE

TaskFlow uses a custom mock API service (services/api.ts) backed by localStorage
rather than a live external API. This was a deliberate architectural choice.


WHY A MOCK API

- Zero backend dependency: The app runs fully offline in any environment
- Persistent demo data: Data survives page refreshes without a server
- Realistic simulation: All operations (create, read, update, delete) behave
  identically to real async API calls using Promise and setTimeout
- Controlled seed data: Predefined protocols with realistic 2026 dates allow
  meaningful demo scenarios


API SERVICE STRUCTURE

class ApiService {
  getWorkRequests()             // GET all protocols with escalation check
  createWorkRequest(data)       // POST new protocol
  updateWorkRequest(id, data)   // PATCH protocol with RBAC enforced
  deleteWorkRequest(id)         // DELETE admin only
  addComment(id, content)       // POST comment to protocol thread
}


ESCALATION ENGINE

On every getWorkRequests() call, the service runs an auto-escalation check:

- Any protocol overdue by more than 7 days is automatically escalated to
  CRITICAL priority
- A system-generated comment is appended to the protocol thread documenting
  the escalation
- The isOverdue flag is set or unset dynamically based on current date vs
  due date


IF REPLACING WITH A REAL API

The mock service is fully swappable. Replace services/api.ts with any HTTP
client (Axios, fetch, React Query) targeting a REST or GraphQL endpoint. The
Zustand store interface remains identical - only the data source changes.

---

## DATA TRANSFORMATIONS

Several transformation layers exist between raw data and the displayed UI.


1. PRIORITY ESCALATION TRANSFORM

Raw stored priority:  Priority.HIGH
After escalation check (more than 7 days overdue):
Transformed to:       Priority.CRITICAL + system comment appended


2. DATE NORMALIZATION

All dates are stored as ISO 8601 strings:

  date2026(month, day) => new Date(2026, month - 1, day).toISOString()

Displayed as locale-aware short format:

  new Date(req.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  Output: "Feb 14"


3. AGENT LIST - DYNAMIC VS STATIC

Default agents are seeded from constants.ts. Runtime additions are stored in
localStorage under the key 'authorized_agents'. The getAuthorizedAgents()
function merges both sources:

  getAuthorizedAgents(): string[] {
    const stored = localStorage.getItem('authorized_agents');
    return stored ? JSON.parse(stored) : DEFAULT_AGENTS;
  }


4. RBAC FIELD FILTERING

Agent users receive a filtered update payload:
  - Blocked:  assignedAgent, createdBy, dueDate
  - Permitted: status, comments

Admin users receive full update access with no restrictions.


5. COMMENT TYPE CLASSIFICATION

Three comment types are rendered with distinct visual treatment:

  CommentType.GENERAL           Blue border  - user-authored notes
  CommentType.STATUS_UPDATE     Yellow border - lifecycle transitions
  CommentType.SYSTEM_GENERATED  Red border   - automated escalation logs


6. SEARCH AND FILTER PIPELINE (DASHBOARD)

Raw requests
  -> Role scope filter (admin: all | agent: assigned only)
  -> Text search (title, id, description, agent, tags)
  -> Status filter (multi-select)
  -> Priority filter (multi-select)
  -> Agent filter (admin only, multi-select)
  -> Overdue toggle
  -> Sort (lastUpdated | priority | dueDate) x (ascending | descending)
  -> Rendered grid

---

## CACHING STRATEGY

TaskFlow implements a time-based in-memory cache with localStorage as the
persistent backing store.


CACHE LAYERS

Layer               Mechanism              TTL                Purpose
------------------------------------------------------------------------------------------
Zustand store       In-memory signal       Session lifetime   Prevents redundant fetches
                                                              within a session

localStorage        Browser storage        Permanent          Persists data across
                                                              page refreshes

Fetch guard         lastFetched timestamp  5 minutes          Prevents refetch if data
                                                              is fresh


CACHE FLOW

fetchRequests(force = false)
    |
    |-- force === false AND lastFetched within 5 minutes
    |       └── Skip fetch, use existing Zustand state
    |
    └── force === true OR cache is stale
            |-- Set isLoading = true
            |-- Call apiService.getWorkRequests()
            |-- apiService reads from localStorage
            |-- Runs escalation check and mutates if needed
            └── Returns fresh data and updates Zustand state


CACHE INVALIDATION

The cache is force-refreshed after:
  - Creating a new protocol
  - Updating an existing protocol
  - Deleting a protocol
  - Manual refresh button click
  - User login

After any mutation:
  set({ lastFetched: null })  // Forces next fetchRequests() to bypass cache


VERSION MIGRATION

The localStorage schema includes a version key to handle data migrations:

  { version: 1, requests: WorkRequest[] }

On version mismatch, migrateData() runs field backfills before returning data.

---

## DESIGN PRINCIPLES APPLIED


1. CLARITY - REDUCING COGNITIVE LOAD

How it was applied:
TaskFlow uses a strict visual hierarchy built on three colors only: Deep Black
(#000000), Neon Blue (#00E5FF), and Stark White (#FFFFFF). Every element's
importance is communicated through opacity, size, and color saturation rather
than decorative noise. Critical information surfaces immediately; secondary
metadata recedes into lower-opacity text. Labels are written in uppercase
tracking-widest style to reinforce the information tier they belong to.

Concrete UI example - Dashboard Request Cards:
Each card follows a strict top-to-bottom importance hierarchy so users never
need to hunt for key information.

  [TR-2026-04]               [BLOCKED]      <- Identity and state, high contrast
  EMERGENCY DB RECOVERY PROTOCOL            <- Title, large and white
  [IT] [Urgent] [Database]                  <- Tags, muted and small
  "Restore corrupted index..."              <- Description, dimmed
  -----------------------------------------------
  [AGT-109]               Due: Feb 14       <- Metadata, dimmest layer
  (red dot) CRITICAL                        <- Priority, color-coded dot


2. CONSISTENCY - REUSABLE PATTERNS AND BEHAVIORS

How it was applied:
All interactive elements follow an identical behavioral contract throughout the
entire application. Hover always triggers a subtle border shift to neon-blue/30.
Active press always triggers scale-95. Disabled states always use opacity-30.
This contract is never broken across any button, card, dropdown, or input.

Custom components (CheckboxDropdown, CheckboxSelect, SortDropdown,
ConfirmationModal) are built once and reused everywhere. Typography scale,
border-radius tokens (rounded-xl, rounded-2xl, rounded-3xl), and spacing
increments are drawn from the same Tailwind scale throughout every screen.

Concrete UI example - Filter Dropdowns on the Dashboard:
The Status, Priority, and Agent filters all use the identical CheckboxDropdown
component. A user who learns to use the Status filter immediately knows how
to operate the Priority and Agent filters without any additional learning.
They share the same open/close behavior, the same checkmark rendering, the
same "Clear Selection" footer, and the same z-index stacking behavior.


3. FEEDBACK - COMMUNICATING SYSTEM STATE

How it was applied:
TaskFlow implements a four-tier feedback system covering every possible state
a user might encounter during their session.

State               Feedback Mechanism
------------------------------------------------------------------------------------------
Loading             Shimmer skeleton cards, 6 animated placeholders
Empty               Contextual icon and message with clear-filters call to action
Error               Red-themed error panel with a retry button
Success             Green toast notification, bottom-right, auto-dismisses after 4s
Failure             Red toast notification with the exact error message
Processing          Button text changes to "Processing..." and becomes disabled
Overdue             Red border on card and a pulsing "Escalated" badge
Refreshing          Spinning RefreshCw icon on the refresh button

Concrete UI example - Request Modal submission:
When an admin clicks "Sync Changes", the button immediately becomes disabled
and displays "Processing..." to prevent double-submission. On success, a green
toast slides up from the bottom reading "Changes synchronized successfully".
On failure, a red toast displays the exact error message from the service layer.
The user always knows what happened and why.


4. ACCESSIBILITY - SUPPORTING DIVERSE USERS

How it was applied:

Keyboard navigation:
All interactive elements are native button or input elements, ensuring full
tab-order traversal without custom keyboard handlers. No div-based click
traps exist in the codebase.

Color contrast:
Neon Blue (#00E5FF) on Deep Black (#000000) achieves a contrast ratio of
approximately 12:1, exceeding both WCAG AA (4.5:1) and AAA (7:1) standards
for normal text. White on black body text similarly exceeds all thresholds.

Semantic HTML:
The header, nav, aside, main, section, and table elements are used throughout
the Layout, Dashboard, and Work Queue views, providing meaningful document
structure for screen readers.

Title attributes:
Icon-only buttons (collapse sidebar, refresh, sort direction toggle) include
title props so screen reader users and keyboard users receive the full label
even when text is visually hidden.

Disabled states:
Form controls that are not editable by the current role are genuinely disabled
at the HTML level, not just visually styled. This prevents interaction via
keyboard or assistive technology.

Responsive design:
Mobile users receive a hamburger-menu sidebar, a single-column card grid, and
a full-screen modal, ensuring the application is fully usable on any device
and viewport without loss of functionality.

Concrete UI example - Collapsible Sidebar:
When the sidebar collapses to icon-only mode, each navigation button retains
its title attribute with the full label ("Dashboard", "Work Queue",
"Analytics"). Screen readers and keyboard users still receive the complete
label even though the visible text is hidden from sighted users.


5. EFFICIENCY - COMPLETING TASKS WITH MINIMAL FRICTION

How it was applied:
Every workflow is optimized for the minimum number of interactions required
to complete a meaningful action.

One-click new protocol:
The "Initialize Protocol" button is always visible in the dashboard header
and is never buried inside a submenu or secondary screen.

Inline status updates:
Agents can change a protocol's status directly inside the detail modal without
navigating away from their current context.

Persistent filters:
Filter state is maintained within the session so users do not need to
re-apply their filters after opening and closing a request modal.

Sort and direction toggle:
A single arrow button toggles ascending/descending order without requiring
the user to open a dropdown, saving one click per sort reversal.

Agent pre-selection at login:
Agents select their ID at the login screen so the dashboard immediately shows
only their assigned protocols. No additional filtering is required after login.

Debounced search:
A 300ms debounce on the search input prevents unnecessary processing while
keeping results near-instant for the user.

Force refresh without reload:
A single click on the refresh button force-fetches all data without requiring
a full browser page reload.

Concrete UI example - Sort Direction Toggle:
The up/down arrow button beside the Sort By dropdown lets users reverse their
current sort order in a single click. Without this control, reversing sort
would require opening the dropdown, selecting a different field, and then
re-selecting the original field - three clicks instead of one.

---

## KNOWN LIMITATIONS

Limitation                    Detail
------------------------------------------------------------------------------------------
No real backend               All data lives in localStorage and is cleared on
                              browser data wipe

No real authentication        Credentials (admin/admin, agent/agent) are hardcoded
                              demo values with no token or session management

No multi-tab sync             Changes made in one browser tab do not propagate
                              to another open tab in real time

No file attachments           Protocol threads support text comments only,
                              no document or image uploads

No email or push              Escalation events are logged in-system only,
notifications                 no external notification delivery

No pagination in              The Work Queue table renders all visible protocols
Work Queue                    without pagination or virtual scrolling

Agent format                  New agents registered via the admin panel must
constraint                    follow the AGT-XXX format with exactly 3 digits

First-load data seed          If localStorage already contains old schema data,
                              a migration runs but may miss edge cases in
                              heavily modified datasets

No offline PWA support        The application requires a running dev server
                              and has no service worker for offline use

Search scope limited          Dashboard search covers title, ID, description,
                              agent, and tags but does not search comment content

---

## WHAT I WOULD ADD WITH MORE TIME


HIGH PRIORITY

Real backend (Node.js + Express + PostgreSQL):
Replace the mock API with persistent server-side storage and real JWT
authentication including token refresh and session management.

Real-time updates via WebSockets:
Live protocol updates across all connected users via Socket.io so that
when an admin assigns a protocol, the assigned agent sees it immediately.

Email notifications:
Nodemailer integration for deadline reminders, escalation alerts, and
assignment notifications delivered directly to agent inboxes.


FEATURE ADDITIONS

File attachments on protocols:
Allow agents and admins to upload supporting documents (PDFs, images,
logs) directly to protocol threads as evidence or reference material.

Advanced analytics with charts:
Recharts or Chart.js integration showing protocol volume over time, agent
performance metrics, average resolution times, and SLA compliance rates.

Protocol templates:
Predefined protocol types (Security Audit, DB Recovery, Infrastructure
Maintenance) that pre-fill common fields to reduce data entry time.

Bulk operations:
Select multiple protocols for bulk status changes, bulk assignment, or
bulk export without opening each one individually.

Full audit trail:
An immutable, append-only log of every change made to every protocol,
including who changed what field, from what value, to what value, and when.

Dark and light mode toggle:
Currently dark-only. A light mode variant would improve accessibility
for users in brightly lit environments or with certain visual conditions.

CSV and PDF export:
Export the currently filtered protocol list as a CSV for spreadsheet
import or as a formatted PDF for reporting and stakeholder communication.


TECHNICAL IMPROVEMENTS

React Query / TanStack Query:
Replace the manual caching implementation with battle-tested server state
management that handles stale-while-revalidate, background refetching,
and optimistic updates automatically.

End-to-end testing with Playwright:
Full user journey tests covering critical admin workflows (create, assign,
escalate, delete) and agent workflows (view, update status, comment).

Unit testing with Vitest:
Coverage of the Zustand store logic, the escalation engine, and the
multi-step filter and sort pipeline in Dashboard.

Progressive Web App with Service Worker:
Offline capability and an installable app experience so field agents can
access their assigned protocols even without a network connection.

Internationalization with react-i18next:
Multi-language support to make the platform accessible to teams operating
across different regions and language preferences.

Formal WCAG 2.1 AA accessibility audit:
Screen reader testing with NVDA and VoiceOver, automated axe-core scanning,
and manual keyboard-only navigation testing across all views.

---

## SETUP AND RUNNING


PREREQUISITES

Node.js 18 or higher
npm or yarn


INSTALLATION

  git clone <your-repo-url>
  cd taskflow
  npm install
  npm run dev
  npm run build    (for production build)


DEMO CREDENTIALS

Role              Username    Password    Access
------------------------------------------------------------------------------------------
Administrator     admin       admin       Full access - all protocols, delete, assign
Field Agent       agent       agent       Scoped - own protocols only, status updates

When logging in as Agent, select any of the 10 agent IDs from the dropdown
(AGT-101 through AGT-110).


TECH STACK

Technology        Version       Purpose
------------------------------------------------------------------------------------------
React             18            UI framework
TypeScript        5             Type safety across all components and services
Zustand           4             Global state management with minimal boilerplate
Tailwind CSS      3             Utility-first styling system
Lucide React      Latest        Consistent icon system throughout the UI
Vite              5             Build tool and development server
localStorage      Browser API   Persistent mock database


FILE REFERENCE

File                          Description
------------------------------------------------------------------------------------------
App.tsx                       Root component, view routing, agent management modal
components/Layout.tsx         Responsive sidebar shell, collapsible nav, header
components/Dashboard.tsx      Request cards grid, filters, stats, sort controls
components/RequestModal.tsx   Protocol create/edit/delete modal with comments
components/Login.tsx          Auth screen with agent selector dropdown
store/useStore.ts             Zustand store - all global state and async actions
services/api.ts               Mock API - localStorage CRUD and escalation engine
constants.ts                  Agent list, color maps, cache TTL configuration
types/index.ts                TypeScript enums and interfaces

---

TaskFlow Operational Command
Built with React, TypeScript, and Tailwind CSS
Cyberpunk aesthetic. Production-grade patterns. Zero compromise on UX.
