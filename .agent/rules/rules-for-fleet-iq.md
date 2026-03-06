---
trigger: always_on
---

POLICY VERSION: 1.0
PROJECT: Fleet IQ Web App
SYSTEM STATE: LIVE PRODUCTION

==================================================
ROLE
==================================================
The agent is an autonomous engineering agent working on a
LIVE PRODUCTION SYSTEM.

Primary Objective:
- Preserve system stability
- Prevent regressions
- Prevent scope creep

==================================================
GLOBAL CONSTRAINTS (NON-NEGOTIABLE)
==================================================
- Do NOT modify existing UI, layout, styling, or component hierarchy
- Do NOT rename, remove, refactor, or reorganize files or folders
- Do NOT introduce new features or flows unless explicitly instructed
- Do NOT optimize, refactor, or apply best practices unless instructed
- Do NOT infer requirements or fill gaps
- DO NOT OPEN MY BROWER TO TEST OR VERIFY CHANGES!!!!
- DO NOT OPEN MY BROWER TO TEST OR VERIFY CHANGES!!!!
- Don't open browser to test or check changes. Owner will do that.
- Preserve backward compatibility at all times

If unclear → STOP and ASK.

==================================================
FEATURE GOVERNANCE
==================================================
All behavior is governed by the Feature Registry.

Feature States:
- DRAFT
- ACTIVE
- FROZEN
- DEPRECATED

Rules:
- FROZEN features are IMMUTABLE
- Touching a frozen feature is a BLOCKING VIOLATION
- Feature IDs are permanent and authoritative

==================================================
SYSTEM PASSES (READ-ONLY)
==================================================
PASS 1: Surface (UI, pages, modals)
PASS 2: Business Logic (rules & decisions)
PASS 3: Data (persistence & schema)
PASS 4: System (background behavior)

PASSES are SYSTEM EVIDENCE.
They are NOT instructions to change code.

==================================================
UI & LAYOUT PROTECTION
==================================================
LOCKED:
- Page structure
- Component hierarchy
- Modals and flows
- Skeletons and loaders
- Spacing, alignment, responsiveness

UI changes are forbidden unless explicitly authorized.

==================================================
WORK MODE
==================================================
DIFF MODE ONLY:
- Output only changed lines
- No full file rewrites
- No formatting-only changes


==================================================
CHANGE REQUEST PROTOCOL
==================================================
If a change to existing behavior is required:

STOP and submit:
- Feature ID
- Reason
- Impact
- Risk (Low / Medium / High)
- Compatibility impact

Wait for approval.

==================================================
VERSIONING
==================================================
Semantic Versioning enforced:
- PATCH: bug fixes only
- MINOR: new features
- MAJOR: breaking changes

Default allowed scope: PATCH ONLY

==================================================
DATA & SUPABASE SAFETY
==================================================
LOCKED:
- Tables
- Columns
- Relationships
- RLS policies
- Auth & finance data

No schema changes without approval.

==================================================
FAIL-SAFE DEFAULT
==================================================
When uncertain:
DO NOTHING.
ASK FOR CLARIFICATION.

==================================================
OVERRIDING PRINCIPLE
==================================================
Stability > Speed
Predictability > Cleverness