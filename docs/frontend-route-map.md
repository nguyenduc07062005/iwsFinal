# StudyVault Frontend Route Map

Last updated: 2026-05-02.

This document reflects `studyVault-frontend/src/app/router.jsx` after the latest UI/UX refresh.

## Routing Principles

- Public, auth-only, protected app, and protected detail routes are separated.
- `/` is a public product landing page. It is not a protected workspace route.
- Auth pages use `GuestOnlyRoute`; logged-in users are redirected back to `/app`.
- Workspace and favorites share `AppShell`.
- Document detail uses `DetailLayout` so the preview and assistant can use a wider layout.
- Unknown routes redirect to `/app` when authenticated, otherwise to `/`.

## Layout Groups

| Layout | Routes | Purpose |
| --- | --- | --- |
| Public page | `/` | Landing page with product story and call-to-action |
| `AuthLayout` | `/login`, `/register`, `/verify-email`, `/complete-registration`, `/forgot-password`, `/reset-password` | Account access flows |
| `AppShell` | `/app`, `/app/favorites`, `/profile`, `/admin` | Main authenticated application shell |
| `DetailLayout` | `/app/documents/:id` | Document preview and document assistant |

## Current Route Map

| Route | Access | Component | Notes |
| --- | --- | --- | --- |
| `/` | Public | `Landing` | Product landing page, navbar, hero, features, FAQ, CTA |
| `/login` | Guest-only | `Login` | Sign in, forgot-password link, logout success toast support |
| `/register` | Guest-only | `Register` | Starts email verification registration |
| `/verify-email` | Guest-only | `CompleteRegistration` | Compatibility route for email verification links |
| `/complete-registration` | Guest-only | `CompleteRegistration` | Sets password from verification token |
| `/forgot-password` | Guest-only | `ForgotPassword` | Requests reset email with neutral response |
| `/reset-password` | Guest-only | `ResetPassword` | Sets a new password from reset token |
| `/app` | Protected | `WorkspacePage` | Folder panel, document list, upload, filter, sort, pagination |
| `/app/favorites` | Protected | `Favorites` | Favorite documents with search/filter/sort/pagination |
| `/app/documents/:id` | Protected | `DocumentViewer` | File preview, notes, summary, Ask AI, related documents |
| `/profile` | Protected | `Profile` | Profile information, change password, logout-all |
| `/admin` | Protected admin | `Admin` | Stats, user management, audit logs |
| `*` | Conditional | `Navigate` | Redirects to `/app` or `/` based on auth state |

## Route Responsibilities

### `/`

- Presents StudyVault as a focused study workspace.
- Keeps the headline "Study smarter".
- Uses a high-contrast sticky navbar so links remain readable at the top of the hero.
- Links visitors to sign up, sign in, or start the workspace flow.

### Auth Routes

- Login/register/verification/recovery flows live under `AuthLayout`.
- Access tokens stay in memory; refresh continuity comes from the HttpOnly refresh cookie plus CSRF token.
- `GuestOnlyRoute` respects refresh-session hints so users with a valid refresh cookie are routed back into the app instead of being stuck on auth screens.
- Logout success feedback is shown as a toast and auto-dismisses.

### `/app`

- Primary workspace for folders and documents.
- Supports folder navigation, back behavior, upload modal, grid/list view, search, type/tag filters, sorting, and server pagination.
- The workspace hero has a clearer theme and a rotating horizontal study-workspace image panel.

### `/app/favorites`

- Lists only favorited user documents.
- Supports URL-backed search/filter/sort/page state.
- Uses the same ownership-protected document APIs.

### `/app/documents/:id`

- Opens the current document by document id.
- Shows protected file preview and toolbar actions.
- Includes the document assistant tabs: Study notes, Summary, Ask AI, and Related.
- Uses stale async guards while loading files so fast document switching cannot overwrite the active preview with an old response.

### `/profile`

- Shows account information.
- Lets the user change password.
- Provides session cleanup/logout-all behavior without duplicate change-password controls.

### `/admin`

- Requires authenticated admin role.
- Shows user stats, user management, pagination, filtering, and audit logs.
- Normal users receive an access-denied state.

## Responsive Rules

- Below `1024px`, `ShellHeader` uses a compact header and bottom navigation.
- From `1024px`, primary Workspace/Favorites navigation is centered in the top header.
- Below `1280px`, document preview and assistant stack vertically.
- From `1280px`, document detail uses the split preview/assistant layout.
- Auth forms use viewport-safe scrolling so small screens and software keyboards do not hide fields.

## Removed From Main Routing

These routes are not part of the current router:

- `/subjects`
- `/collections`
- standalone AI showcase pages
- standalone mind-map page

Mind map and diagram remain backend capabilities, but they are not separate frontend routes in the current app.
