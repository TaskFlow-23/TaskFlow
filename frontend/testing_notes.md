
# Testing Suite Overview

## Backend Logic Tests (Simulated)
1. **Happy Path: Create Task**
   - *Scenario*: Admin sends valid title, priority, and due date.
   - *Expected*: Task generated with UUID starting with `TR-`, status set to `OPEN`, `isOverdue` false.
2. **Failure: Update Status to Done**
   - *Scenario*: User attempts to set status to `DONE` while `assignedAgent` is null.
   - *Expected*: Error thrown: "Validation Error: Task cannot be marked 'Done' without an assigned agent."

## Frontend Transformation Test
1. **Overdue Countdown Formatting**
   - *Function*: `formatOverdue(dueDate)`
   - *Input*: Date 2 days in the past.
   - *Output*: `2 DAYS OVERDUE` (Red colored, capitalized).

## Migration Script (Mock)
```sql
-- migration_002_add_tags_and_agent.sql
ALTER TABLE work_requests ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE work_requests ADD COLUMN assigned_agent VARCHAR(255) NULL;
-- Versioning check
INSERT INTO schema_version (version, applied_at) VALUES (2, datetime('now'));
```
