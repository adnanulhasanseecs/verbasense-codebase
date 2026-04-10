# CourtSense Dashboard UI Specification

## Purpose
Define a concrete, implementation-ready UI specification for the CourtSense operational dashboard using VerbaSense branding, role-aware visibility, and enterprise information hierarchy.

## Design Tokens
- `bg-base`: `#0B0F19`
- `bg-surface`: `#121826`
- `text-primary`: `#E5E7EB`
- `text-secondary`: `#9CA3AF`
- `accent-primary`: `#3B82F6`
- `accent-secondary`: `#6366F1`
- `border-soft`: `rgba(255,255,255,0.08)`
- Card radius: `rounded-2xl`
- Card shadow: `shadow-[0_18px_52px_-26px_rgba(245,158,11,0.38)]`

## Dashboard Shell
- Sticky top bar with:
  - Brand mark + product label
  - Global search input
  - Role badge + quick nav
- Left sticky navigation rail with sections:
  - Overview (`/dashboard`)
  - Live Session (`/live`)
  - Transcribe (`/transcribe`)
  - Documents (`/documents`)
  - Sessions (`/sessions`)
  - RBAC / Admin (`/admin/rbac`, admin-only)
- Content container: `max-w-7xl`, centered.

## Information Architecture
1. Hero strip: current workspace context and role context.
2. KPI row: 4 cards (`Active Sessions`, `Sessions Today`, `Documents Processed`, `Pending Actions`).
3. Live + Activity row:
   - Left: `LiveSessionCard`
   - Right: `ActivityFeed`
4. Main workspace row:
   - Left: `SessionsTable` with search and status badges.
   - Left bottom: `DocumentsPanel` (role-based).
   - Right rail (sticky): `IntelligencePanel`, `ActionsPanel`, `AdminCards` (role-based).

## Role Visibility Matrix
- `admin`: all sections, includes `RBAC management` and `System health`.
- `judge`: KPI, live, sessions, intelligence, actions.
- `clerk`: KPI, sessions, documents, limited intelligence, no admin cards/actions.
- `viewer`: KPI, sessions read-only, no documents/actions/admin.

## Component Contracts
- `SummaryCard(title, value)`
- `LiveSessionCard(active, room?, detail?)`
- `ActivityFeed(items[])`
- `SessionsTable(rows, query, onQuery, readOnly)`
- `IntelligencePanel(limited)`
- `DocumentsPanel()`
- `ActionsPanel()`
- `DashboardShell(children)` for top/side chrome.

## Interaction and States
- Search filters session rows by case id, session id, or status.
- Session rows navigate to `/sessions/[id]`.
- Live CTA navigates to `/live`.
- Role-specific content hidden through role-aware rendering.
- Empty-state text shown where sections are not permitted.

## Responsive Rules
- Desktop: 2-column layout with sticky right rail.
- Tablet: right rail drops below sessions table.
- Mobile: stacked cards and full-width table container.

## Accessibility
- Search input labeled and keyboard reachable.
- Focus ring on all actionable controls.
- Buttons and links maintain color contrast on dark surfaces.
- Status badges use both color and text labels.

## Test Scope
- Role-based visibility for admin/judge/clerk/viewer.
- Live session card active/inactive states.
- Dashboard section rendering smoke test.
