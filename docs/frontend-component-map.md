# StudyVault Frontend Component Map

Last updated: 2026-05-02.

This document describes the component structure that exists in `studyVault-frontend/src` today. It is no longer a future-only refactor target.

## Current Source Layout

```text
src/
  app/
    router.jsx
  assets/
    workspace-hero-ai.png
    workspace-hero-flow.png
    workspace-hero-library.png
    workspace-hero-overview.png
  components/
    auth/
    common/
    documents/
    folders/
    navigation/
    system/
    ui/
    workspace/
    DocumentsContext.jsx
    ToastProvider.jsx
  layouts/
    AppShell.jsx
    AuthLayout.jsx
    DetailLayout.jsx
  pages/
    Admin.jsx
    CompleteRegistration.jsx
    DocumentViewer.jsx
    Favorites.jsx
    ForgotPassword.jsx
    Landing.jsx
    Login.jsx
    Profile.jsx
    Register.jsx
    ResetPassword.jsx
    WorkspacePage.jsx
    landingContent.js
  routes/
    GuestOnlyRoute.jsx
    ProtectedRoute.jsx
  services/
    apiClient.js
    authApi.js
  utils/
```

## Layout Components

| File | Role |
| --- | --- |
| `layouts/AuthLayout.jsx` | Shared shell for login, register, verification, forgot password, and reset password pages |
| `layouts/AppShell.jsx` | Authenticated shell with header, navigation, account menu, and responsive app chrome |
| `layouts/DetailLayout.jsx` | Wide document-detail shell for preview plus assistant |

## Page Components

| Page | Responsibility |
| --- | --- |
| `Landing.jsx` | Public landing page, product hero, feature sections, FAQ, CTA |
| `Login.jsx` | Sign-in flow and logout-success toast handling |
| `Register.jsx` | Start registration and email verification flow |
| `CompleteRegistration.jsx` | Complete verification and set password |
| `ForgotPassword.jsx` | Request reset email |
| `ResetPassword.jsx` | Reset password from token |
| `WorkspacePage.jsx` | Main folder/document workspace |
| `Favorites.jsx` | Favorite document list with URL-backed filters |
| `DocumentViewer.jsx` | Protected file preview, study notes, summary, Ask AI, related documents |
| `Profile.jsx` | Profile information, change password, session cleanup |
| `Admin.jsx` | Admin stats, user management, audit log |

## Component Groups

### `components/ui`

Small reusable UI primitives and utility components. These are used across pages and should stay feature-agnostic.

### `components/common`

Shared app elements such as reusable buttons, empty/loading/error patterns, and layout helpers that are not tied to one feature.

### `components/navigation`

Header, primary navigation, account menu, and responsive navigation behaviors.

### `components/workspace`

Workspace-specific document list controls, upload flow, filter controls, and list/grid presentation pieces.

### `components/folders`

Folder panel, folder tree/list interactions, folder create/update/delete controls, and breadcrumb/back behavior.

### `components/documents`

Document-facing UI pieces such as document cards, metadata surfaces, preview support, and document action controls.

### `components/auth`

Auth-specific form helpers and account-flow presentation components.

### `components/system`

Route fallback, error boundary, and system-level state components.

## Shared State

| File | Purpose |
| --- | --- |
| `components/DocumentsContext.jsx` | Workspace document/folder state, active folder, pagination, refresh and page navigation |
| `components/ToastProvider.jsx` | Shared toast configuration |

## Services

| File | Purpose |
| --- | --- |
| `services/apiClient.js` | Axios client, bearer token attachment, refresh handling, CSRF-aware auth requests |
| `services/authApi.js` | Auth API helpers and session state helpers |

## Current UX Decisions

- The theme now uses stronger contrast and a clearer StudyVault visual direction.
- The landing page is intentionally kept as the public first screen.
- Workspace hero keeps the "Study smarter" headline and uses a rotating horizontal image panel.
- Folder names are constrained so long names do not visually cut off the folder header.
- Folder navigation/back uses smoother loading and skeleton states.
- Document detail prevents stale async file loads from replacing the current preview.

## Maintenance Rules

- Page files can compose behavior but should not duplicate shared primitives.
- New cross-feature UI should go into `components/ui` or `components/common`.
- New workspace-only UI should stay under `components/workspace`, `components/folders`, or `components/documents`.
- Avoid creating a `features/` tree unless the codebase is intentionally migrated in one coordinated refactor.
- Keep route changes synchronized with `docs/frontend-route-map.md`.
