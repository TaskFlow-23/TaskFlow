# TaskFlow - Operational Command System

> A cyberpunk-themed work request management platform built with React, TypeScript,
> Zustand, and Tailwind CSS. Designed for administrators and field agents to manage,
> track, and resolve operational protocols in real time.

---

## Table of Contents

- [Folder Structure](#folder-structure)
- [Overview](#overview)
- [Live Deployment](#live-deployment)
- [Features](#features)
- [API Choice](#api-choice)
- [Architecture Decisions](#architecture-decisions)
- [Data Transformations](#data-transformations)
- [Caching Strategy](#caching-strategy)
- [Design Principles Applied](#design-principles-applied)
- [Technologies](#technologies)
- [Installation](#installation)
- [Known Limitations](#known-limitations)
- [What I Would Add With More Time](#what-i-would-add-with-more-time)
- [Contributing](#contributing)

---

## FOLDER STRUCTURE

TaskFlow/
│
├── backend/
│   ├── config/
│   │   └── db.js                    MongoDB connection setup
│   ├── middleware/
│   │   ├── authMiddleware.js         JWT token verification
│   │   └── roleMiddleware.js         Role-based route protection
│   ├── models/
│   │   ├── User.js                   User schema (name, role, password)
│   │   └── WorkRequest.js            Protocol schema (all fields)
│   ├── routes/
│   │   ├── authRoutes.js             POST /auth/login and /auth/register
│   │   └── requestRoutes.js          GET, POST, PATCH, DELETE /requests
│   ├── .env                          Environment variables (not committed)
│   ├── package-lock.json
│   ├── package.json
│   └── server.js                     Express entry point
│
├── frontend/
│   ├── components/
│   │   ├── Dashboard.tsx             Card grid, filters, stats, sort
│   │   ├── Layout.tsx                Sidebar, header, responsive shell
│   │   ├── Login.tsx                 Auth screen with agent selector
│   │   └── RequestModal.tsx          Create, edit, delete, comment modal
│   ├── services/
│   │   └── api.ts                    Mock API, localStorage, escalation
│   ├── store/
│   │   └── useStore.ts               Zustand global state store
│   ├── .gitignore
│   ├── App.tsx                       View routing, agent management modal
│   ├── constants.ts                  Agent list, color maps, cache TTL
│   ├── eslint.config.js
│   ├── index.html                    HTML entry point
│   ├── index.tsx                     React bootstrap
│   ├── metadata.json                 Application metadata
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md                     Frontend-specific documentation
│   ├── testing_notes.md              Manual testing observations
│   ├── tsconfig.json
│   ├── types.ts                      TypeScript enums and interfaces
│   └── vite.config.js                Vite configuration
│
└── README.md                         This file


---

## OVERVIEW

TaskFlow is a single-page application that provides an operational interface for
creating, assigning, tracking, and resolving work request protocols. The application
features a distinctive cyberpunk aesthetic built on deep black, neon blue, and stark
white, with role-based access control separating administrator and field agent
experiences.

---

## LIVE DEPLOYMENT

Local Frontend:   http://localhost:5173
Local Backend:    http://localhost:3000

The frontend development server is started with npm run dev inside the frontend
directory. The backend Express server is started with node server.js inside the
backend directory.

---

## FEATURES


CORE FUNCTIONALITY

Protocol Management:
    Create, read, update, and delete work request protocols with full
    audit trail via comment threads.

Role-Based Access Control:
    Administrators access all protocols globally while agents see only
    their assigned work.

Agent Login Selection:
    Agents choose their specific ID from a dropdown at login from
    AGT-101 through AGT-110.

Admin Agent Registration:
    Administrators register new agents directly from the dashboard
    without touching code.

Search and Filter:
    Real-time search by title, ID, description, agent, and tags with
    multi-select status, priority, and agent filters.

Overdue Escalation:
    Protocols overdue by more than 7 days are automatically escalated
    to CRITICAL priority with a system comment appended.

Sort Controls:
    Sort by last updated, priority level, or due date with a one-click
    ascending and descending toggle.

Comment Threads:
    Three-tier comment system with general notes, status updates, and
    system-generated escalation logs rendered with distinct visual
    treatment.


ADVANCED FEATURES

Auto-Escalation Engine:
    Runs on every data fetch, dynamically setting isOverdue flags and
    escalating priority based on real-time date comparison.

Stats Dashboard:
    Live calculation of total protocols, completion rate, and overdue
    count scoped to the current user role.

Responsive Design:
    Fully responsive interface with collapsible sidebar on desktop and
    hamburger navigation on mobile.

Persistent Storage:
    All protocol data stored in localStorage with schema versioning
    and migration support.

---

## API CHOICE


WHY A CUSTOM MOCK API

TaskFlow uses a custom API service (services/api.ts) backed by localStorage
rather than a live external API. This was a deliberate architectural choice.

Zero Backend Dependency:
    The frontend runs fully offline in any environment without requiring
    a running database or live server. The application is instantly
    runnable after a single npm install and npm run dev with no
    environment configuration required.

Realistic Simulation:
    All operations behave identically to real async API calls. Every
    method returns a Promise with a simulated network delay using
    setTimeout, meaning loading states, error boundaries, and success
    flows are all exercised exactly as they would be against a real
    endpoint.

Controlled Seed Data:
    Predefined protocols with realistic February 2026 dates allow
    meaningful demo scenarios. Priority escalation, overdue detection,
    and RBAC filtering all behave correctly against this seeded dataset
    out of the box.

Fully Swappable:
    The mock service is designed to be replaced. Swapping services/api.ts
    for an Axios or fetch client targeting the Express backend requires
    no changes to the Zustand store interface or any component.


MOCK API SERVICE STRUCTURE

    getWorkRequests()
        GET all protocols with auto-escalation check applied

    createWorkRequest(data, user)
        POST new protocol with ownership and defaults applied

    updateWorkRequest(id, updates, user)
        PATCH protocol with RBAC field validation enforced

    deleteWorkRequest(id, user)
        DELETE admin only, throws on non-admin caller

    addComment(requestId, content, type, user)
        POST comment to protocol thread with access check


BACKEND ROUTES (EXPRESS)

    POST   /auth/register      Create a new user account
    POST   /auth/login         Authenticate and receive JWT token
    GET    /requests           Fetch all visible protocols
    POST   /requests           Create a new protocol
    PATCH  /requests/:id       Update an existing protocol
    DELETE /requests/:id       Delete a protocol (Admin only)

---

## ARCHITECTURE DECISIONS


1. ZUSTAND OVER REDUX

Zustand was chosen for global state management because it requires zero
boilerplate. There are no actions, reducers, or provider wrappers.
Components subscribe directly to slices of state via selector functions
and re-render only when that specific slice changes.

    const currentUser = useStore((state) => state.currentUser);
    const fetchRequests = useStore((state) => state.fetchRequests);


2. LOCALSTORAGE AS THE PERSISTENT LAYER

All protocol data is written to and read from localStorage via the mock
API service. A versioned schema object wraps the array:

    { version: 1, requests: WorkRequest[] }

On every read, the version is checked and migrateData() runs field
backfills if the stored schema is outdated. Data created in earlier
sessions continues to work after code updates.


3. FIXED-POSITION MODALS WITH HIGH Z-INDEX

The RequestModal renders as a fixed full-screen overlay at z-index 200.
The sidebar sits at z-index 95. This ensures the modal always appears
above the sidebar regardless of scroll position or layout, fixing the
visual overlap issue visible in earlier versions.


4. ROLE-BASED ACCESS CONTROL AT TWO LAYERS

Permissions are enforced twice. First at the UI layer, where fields are
conditionally disabled and buttons are conditionally hidden based on
currentUser.role. Second at the service layer, where updateWorkRequest
and deleteWorkRequest throw descriptive errors if the caller lacks the
required role. This prevents bypass via console manipulation.


5. STANDALONE REACT COMPONENTS

Each component file contains all related logic, state, and JSX in a
single file. No separate container and presentational component split
is used. This reduces file count and keeps the mental model simple for
a project of this scope.


6. TAILWIND CSS UTILITY-FIRST STYLING

Tailwind was chosen over a component library or custom CSS architecture.
All visual tokens such as spacing, radius, opacity, and color are drawn
from the Tailwind scale, ensuring consistency without a design system
overhead. Responsive variants (sm:, md:, lg:, xl:) handle all breakpoints
inline.

---

## DATA TRANSFORMATIONS


1. PRIORITY ESCALATION TRANSFORM

    Raw stored priority:    Priority.HIGH
    Condition:              isOverdue is true AND diffDays is greater than 7
    Transformed to:         Priority.CRITICAL
    Side effect:            System comment appended to protocol thread


2. DATE NORMALIZATION

    All dates stored as ISO 8601 strings:

        date2026(month, day) => new Date(2026, month - 1, day).toISOString()

    Displayed as locale-aware short format:

        new Date(req.dueDate).toLocaleDateString(
            undefined,
            { month: 'short', day: 'numeric' }
        )
        Output: "Feb 14"


3. AGENT LIST MERGING

    Default agents from constants.ts are merged with runtime additions
    stored in localStorage:

        getAuthorizedAgents(): string[] {
            const stored = localStorage.getItem('authorized_agents');
            return stored ? JSON.parse(stored) : DEFAULT_AGENTS;
        }

    New agents registered by an admin appear immediately in the
    assignment dropdown, the login agent selector, and the agent filter
    without a page reload.


4. RBAC FIELD FILTERING

    Fields blocked for Agent role:   assignedAgent, createdBy, dueDate
    Fields permitted for Agent role: status, comments
    Fields permitted for Admin role: all fields


5. COMMENT TYPE CLASSIFICATION

    CommentType.GENERAL           Blue border   - user-authored notes
    CommentType.STATUS_UPDATE     Yellow border - lifecycle transitions
    CommentType.SYSTEM_GENERATED  Red border    - auto-escalation records


6. SEARCH AND FILTER PIPELINE

    Raw protocol array
        -> Role scope filter     admin sees all | agent sees assigned only
        -> Text search           title, id, description, agent, tags
        -> Status filter         multi-select OR condition
        -> Priority filter       multi-select OR condition
        -> Agent filter          multi-select OR condition, admin only
        -> Overdue toggle        isOverdue === true
        -> Sort                  lastUpdated | priority | dueDate
                                 x ascending | descending
        -> Rendered card grid

---

## CACHING STRATEGY


LAYER 1 - IN-MEMORY ZUSTAND CACHE (SESSION)

Once protocols are fetched and stored in the Zustand requests array,
they remain in memory for the lifetime of the browser session. A
lastFetched timestamp guards against redundant fetches:

    fetchRequests: async (force = false) => {
        const { lastFetched } = get();
        const now = Date.now();

        if (!force && lastFetched && now - lastFetched < CACHE_TIME) {
            return;
        }
        // Proceed with fetch...
    }

Trade-off: Cleared on page refresh. Does not persist across sessions
at the Zustand level, only at the localStorage level.


LAYER 2 - LOCALSTORAGE (PERSISTENT)

The mock API service reads from and writes to localStorage on every
operation. Protocol data survives page refreshes, browser restarts,
and tab closures:

    private getFromStorage(): WorkRequest[] {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return data.requests || [];
    }

Trade-off: Cleared when the user wipes browser data. Device-specific.
Not shared across tabs in real time.


CACHE INVALIDATION

The lastFetched timestamp is set to null after every mutation, forcing
the next fetchRequests call to bypass the in-memory cache and re-read
from localStorage:

    // After create, update, or delete:
    set({ lastFetched: null })


SUMMARY

    Layer             Scope    Duration          What It Caches
    -----------------------------------------------------------
    Zustand store     Session  Until refresh     All loaded protocols
    localStorage      Device   Permanent         All protocol data

---

## DESIGN PRINCIPLES APPLIED


1. CLARITY - REDUCING COGNITIVE LOAD

How it was applied:

TaskFlow uses a strict three-color visual hierarchy. Deep Black (#000000),
Neon Blue (#00E5FF), and Stark White (#FFFFFF). Every element's importance
is communicated through opacity, size, and color saturation rather than
decorative noise. Critical information surfaces immediately. Secondary
metadata recedes into lower-opacity text.

Concrete example - Dashboard Request Cards:

Each card follows a strict top-to-bottom importance hierarchy:

    [TR-2026-04]                         [BLOCKED]
        Protocol ID and status badge at the top, highest contrast

    EMERGENCY DB RECOVERY PROTOCOL
        Title below, large bold uppercase white text

    [IT]  [Urgent]  [Database]
        Tags below title, muted and small

    "Restore corrupted index in production cluster..."
        Description below tags, dimmed to 30% opacity

    ---------------------------------------------------

    [AGT-109]                         Due: Feb 14
        Personnel and deadline, lowest opacity layer

    (red dot)  CRITICAL
        Priority dot, color-coded with pulse animation on critical

Users never need to hunt for key information. The card communicates
identity, urgency, and assignment in under two seconds of scanning.


2. CONSISTENCY - REUSABLE PATTERNS AND BEHAVIORS

How it was applied:

All interactive elements follow an identical behavioral contract
throughout the entire application without exception.

    Hover state:     border shifts to neon-blue/30
    Active press:    scale-95 transform
    Disabled state:  opacity-30
    Focus state:     neon-blue ring

Custom components are built once and reused everywhere:

    CheckboxDropdown    Used for Status, Priority, and Agent filters
    CheckboxSelect      Used for Priority and Status in the modal
    SortDropdown        Sort field selector with direction toggle
    ConfirmationModal   Reused for delete confirmation

Concrete example - Filter Dropdowns on the Dashboard:

The Status, Priority, and Agent filters all use the identical
CheckboxDropdown component. A user who learns to use the Status filter
immediately knows how to operate the Priority and Agent filters with
zero additional learning. Same open and close animation, same checkmark
rendering, same Clear Selection footer, same z-index stacking.


3. FEEDBACK - COMMUNICATING SYSTEM STATE

How it was applied:

TaskFlow covers every possible state a user might encounter with an
explicit visual response. No state is silent.

    Loading       Shimmer skeleton cards with 6 animated placeholders
    Empty         Icon, contextual message, clear-filters call to action
    Error         Red error panel with retry button
    Success       Green toast, bottom-right, auto-dismisses after 4s
    Failure       Red toast with exact error message from service layer
    Processing    Button becomes disabled and shows "Processing..."
    Overdue       Red border on card and pulsing Escalated badge
    Refreshing    Spinning icon on the refresh button

Concrete example - Request Modal submission:

When an admin clicks Sync Changes, the button immediately becomes
disabled and displays "Processing..." to block double-submission. On
success, a green toast slides up reading "Changes synchronized
successfully". On failure, a red toast shows the exact service error.
The user always knows what happened and why.


4. ACCESSIBILITY - SUPPORTING DIVERSE USERS

How it was applied:

Keyboard navigation:
    All interactive elements are native button or input elements,
    ensuring full tab-order traversal. No div-based click traps
    exist anywhere in the codebase.

Color contrast:
    Neon Blue (#00E5FF) on Deep Black (#000000) achieves a contrast
    ratio of approximately 12:1, exceeding WCAG AA (4.5:1) and
    AAA (7:1) for normal text.

Semantic HTML:
    header, nav, aside, main, section, and table elements are used
    throughout every view, providing meaningful document structure
    for screen readers.

Title attributes:
    Icon-only buttons include title props so screen reader users
    receive the full label when visible text is hidden.

Disabled states:
    Form controls locked by RBAC are genuinely disabled at the HTML
    level, not just styled. Keyboard and assistive technology
    interaction is blocked at the element level.

Responsive design:
    Mobile users receive a hamburger sidebar, single-column card
    grid, and full-screen modal. No functionality is lost on
    any viewport.

Concrete example - Collapsible Sidebar:

When the sidebar collapses to icon-only mode, each navigation button
retains its title attribute. Screen readers receive the full label
(Dashboard, Work Queue, Analytics) even when the text is visually
hidden from sighted users.


5. EFFICIENCY - COMPLETING TASKS WITH MINIMAL FRICTION

How it was applied:

Every workflow is optimized for the minimum number of interactions
required.

One-click new protocol:
    The Initialize Protocol button is always visible in the dashboard
    header, never buried in a submenu.

Inline status updates:
    Agents update protocol status directly inside the modal without
    navigating away.

Persistent filters:
    Filter state survives opening and closing modals within a session.
    Users never need to re-apply filters.

Sort direction toggle:
    A single arrow button reverses sort order without opening a
    dropdown.

Agent pre-selection at login:
    Agents select their ID at login. The dashboard immediately shows
    only their protocols with no post-login filtering required.

Debounced search:
    300ms debounce prevents unnecessary processing while keeping
    results near-instant.

Concrete example - Sort Direction Toggle:

The arrow button beside Sort By reverses sort in one click. Without
it, reversing sort requires opening the dropdown, selecting a different
field, then re-selecting the original. That is three clicks reduced
to one.

---

## TECHNOLOGIES


FRONTEND STACK

    React             18          UI component framework
    TypeScript        5           Type safety across all files
    Zustand           4           Global state management
    Tailwind CSS      3           Utility-first styling system
    Lucide React      Latest      Consistent icon system
    Vite              5           Build tool and development server
    localStorage      Browser     Persistent mock database


BACKEND STACK

    Node.js           18+         Runtime environment
    Express           4.18        HTTP server and static file serving
    MongoDB           Latest      Database
    Mongoose          Latest      ODM for schema modeling
    JSON Web Token    Latest      Authentication tokens
    bcrypt            Latest      Password hashing

---

## INSTALLATION


PREREQUISITES

    Node.js 18 or higher
    npm or yarn
    MongoDB (for backend)


QUICK START - FRONTEND ONLY

    git clone <your-repo-url>
    cd TaskFlow/frontend
    npm install
    npm run dev

    Open http://localhost:5173
    Log in with admin / admin or agent / agent


FULL STACK SETUP

    Terminal 1 - Backend
        cd TaskFlow/backend
        npm install
        node server.js
        Runs on http://localhost:3000

    Terminal 2 - Frontend
        cd TaskFlow/frontend
        npm install
        npm run dev
        Runs on http://localhost:5173


DEMO CREDENTIALS

    Administrator
        Username:  admin
        Password:  admin
        Access:    Full access, all protocols, delete, assign agents

    Field Agent
        Username:  agent
        Password:  agent
        Access:    Scoped to assigned protocols, status updates only
        Note:      Select agent ID from dropdown (AGT-101 to AGT-110)

---

## KNOWN LIMITATIONS

No real authentication:
    Credentials are hardcoded demo values. There is no JWT token
    issuance, session management, or token refresh on the frontend.

No multi-tab sync:
    Changes in one browser tab do not propagate to another open tab
    in real time. Each tab maintains its own Zustand state.

No file attachments:
    Protocol threads support text comments only. No document, image,
    or log file uploads are supported.

No email or push notifications:
    Escalation events are recorded as in-system comments only. No
    external delivery channel exists.

No pagination in Work Queue:
    The Work Queue table renders all visible protocols without
    pagination or virtual scrolling. Large datasets will render
    long tables.

Agent format constraint:
    New agents registered via the admin panel must follow the AGT-XXX
    format with exactly three digits.

Search scope limited:
    The dashboard search covers title, ID, description, agent, and
    tags. Comment content is not searchable.

No offline support:
    The application requires a running dev server. No service worker
    or offline cache exists.

---

## WHAT I WOULD ADD WITH MORE TIME


HIGH PRIORITY

Real backend integration:
    Connect the frontend to the Express and MongoDB backend already
    scaffolded in the repository. Implement real JWT authentication
    with token storage, refresh, and protected route guards.

Real-time updates via WebSockets:
    Socket.io integration so that when an admin assigns or updates a
    protocol, the assigned agent's dashboard updates immediately
    without a manual refresh.

Email notifications:
    Nodemailer integration for deadline reminders, escalation alerts,
    and new assignment notifications delivered to agent inboxes.


FEATURE ADDITIONS

File attachments:
    Allow upload of supporting documents, screenshots, and logs
    directly to protocol comment threads.

Advanced analytics:
    Chart.js or Recharts integration showing protocol volume over
    time, per-agent resolution rates, average time to resolution,
    and SLA compliance percentages.

Protocol templates:
    Pre-filled protocol types such as Security Audit, DB Recovery,
    and Infrastructure Maintenance to reduce repetitive data entry.

Bulk operations:
    Multi-select protocols for bulk status changes, bulk agent
    assignment, or bulk CSV export.

Full audit trail:
    Immutable, append-only change log recording every field
    modification with before and after values, timestamp, and
    acting user identity.


TECHNICAL IMPROVEMENTS

React Query / TanStack Query:
    Replace the manual lastFetched cache with battle-tested server
    state management including stale-while-revalidate, background
    refetching, and automatic retry on failure.

End-to-end testing with Playwright:
    Cover the critical admin workflows (create, assign, escalate,
    delete) and agent workflows (view, update status, comment) with
    automated browser tests.

Unit testing with Vitest:
    Test the Zustand store actions, the escalation engine logic, and
    the full filter and sort pipeline in isolation.

Progressive Web App:
    Add a Service Worker for offline capability and a manifest.json
    for home screen installation on mobile devices.

Formal WCAG 2.1 AA audit:
    Screen reader testing with NVDA and VoiceOver, axe-core automated
    scanning, and manual keyboard-only navigation across every view.

---

## CONTRIBUTING

1. Fork the repository
2. Create a feature branch:   git checkout -b feat/your-feature
3. Commit using Conventional Commits format
4. Push to your fork and open a pull request


COMMIT FORMAT EXAMPLES

    feat: add bulk status update for admin protocols
    fix: resolve modal z-index overlap with sidebar
    docs: update caching strategy in README
    refactor: extract escalation logic into standalone utility
    style: align filter dropdown spacing on mobile viewports

---

TaskFlow Operational Command
Built with React, TypeScript, Tailwind CSS, Node.js, Express, and MongoDB
Cyberpunk aesthetic. Production-grade patterns. Zero compromise on UX.

Last Updated: February 2026
