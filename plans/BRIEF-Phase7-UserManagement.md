# IMPLEMENTATION BRIEF — Phase 7: User Management

**Type:** IMPLEMENTATION
**For:** Claude Code
**Prepared by:** Cowork (Shark framework)
**Date:** 2026-04-23
**Reference:** CLAUDE.md §23, app/layout.tsx, lib/supabase/service.ts, middleware.ts

---

## Universal Debug Rule (§3)
Read the actual files before confirming any approach. The hypothesis
might be wrong. Find edge cases and existing workflow conflicts, and
address them.

## Plan-Before-Build (§5)
Before writing a single line of code, present:
1. Where you intend to create/modify files and why
2. Your proposed implementation plan (numbered steps)
3. Any questions or confirmations needed before proceeding

---

## What you are building

An admin UI at `/admin/users` that lets Dipanshu (the owner) create
new user accounts, view all existing users, and delete users. This
replaces the current workflow of managing users directly in the
Supabase dashboard.

This is an **internal tool** — not public-facing. Minimal styling,
functional over beautiful.

---

## What's already built — read these first

- `app/layout.tsx` — nav bar (you'll add a "Users" link here)
- `lib/supabase/service.ts` — service role client (bypasses RLS,
  needed for admin auth operations)
- `lib/supabase/server.ts` — user session client
- `middleware.ts` — protects all routes except `/login`
- `app/admin/portfolio/actions.ts` — example server action pattern
  to follow

---

## Deliverables

### 1. Users list page — `app/admin/users/page.tsx`

A **server component** that:
- Uses the **service role client** (`createServiceClient`) to call
  `supabase.auth.admin.listUsers()`
- Renders a table of all users with columns:
  - Email
  - Created at (formatted nicely, e.g. "22 Apr 2026, 10:15 PM")
  - Last sign in (formatted, or "Never" if null)
  - A "Delete" button (client interaction — see below)
- Shows a count: "N users"
- Has an "Add user" button/link that opens the add form

### 2. Add user form — `app/admin/users/AddUserForm.tsx`

A `'use client'` component (or use a server action with a form):
- Fields: Email (required), Password (required, min 8 chars)
- On submit: calls a server action `createUser`
- Shows success ("User created") or error message inline
- On success: clears the form

### 3. Server actions — `app/admin/users/actions.ts`

Two server actions, both using the **service role client**:

**`createUser(formData: FormData)`**
```typescript
// Uses supabase.auth.admin.createUser({ email, password, email_confirm: true })
// email_confirm: true skips the email verification step
// Returns { ok: true } or { ok: false, error: string }
```

**`deleteUser(userId: string)`**
```typescript
// Uses supabase.auth.admin.deleteUser(userId)
// Returns { ok: true } or { ok: false, error: string }
```

### 4. Delete button — `app/admin/users/DeleteUserButton.tsx`

A `'use client'` component:
- Renders a "Delete" button next to each user row
- On click: shows a `window.confirm("Delete [email]? This cannot be
  undone.")` dialog
- If confirmed: calls the `deleteUser` server action
- Shows "Deleting..." while in-flight
- On success: triggers a page refresh (`router.refresh()`)
- On error: shows the error message inline

**Important:** Do NOT allow deleting the currently logged-in user.
Compare the row's user ID against the session user's ID and hide/
disable the Delete button for the current user's row.

### 5. Nav link — `app/layout.tsx`

Add a "Users" link to the nav bar between "Portfolio" and the
sign-out button:
```
Chat | History | Portfolio | Users
```

---

## What Phase 7 does NOT include

- No role system (all authenticated users have the same access in v1)
- No edit user (change email or password) — Supabase dashboard handles
  edge cases
- No invite-by-email flow — direct password creation only
- No pagination (< 50 users expected; flat list is fine)
- No user profile pages

---

## Architectural rules

**§3 Universal Debug Rule:** Read `lib/supabase/service.ts` and
`middleware.ts` before starting. Confirm the service client is
correctly initialised for server actions (it needs the service role
key, not the anon key).

**§5 Plan-Before-Build:** Present file plan and questions first.

**§6 Fail-open:** If `listUsers` fails, show an error state ("Could
not load users") rather than crashing the page.

**§10 Ship-clean:** `tsc --noEmit` + `next lint` before commit.

**§11 Secret hygiene:** Service role key is already in `.env.local`
as `SUPABASE_SERVICE_ROLE_KEY`. Never expose it client-side.

---

## Success criteria — Phase 7 is complete when ALL pass

1. Navigate to `/admin/users` → see a table of all current users
   with email, created date, last sign in
2. Fill in the Add User form with a new email + password → user
   appears in the list and can log in at `/login`
3. Click Delete on a user → confirm dialog appears → user is removed
   from the list and can no longer log in
4. The Delete button is absent/disabled for the currently logged-in
   user's row (cannot self-delete)
5. `npx tsc --noEmit` exits 0
6. `npx next lint` exits clean
