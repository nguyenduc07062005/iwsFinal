# StudyVault Authorization Matrix

This document defines who can call each backend API group and how user-owned resources are isolated. It is intended for the Security, Authentication, and Authorization section of the final project report.

For the complete security narrative, demo script, and automated evidence map, see `docs/security-architecture-and-demo.md`.

## Authorization Model

| Actor | Meaning | Authentication requirement |
| --- | --- | --- |
| Guest | Visitor without a valid access token | No JWT required |
| User | Active account with role `user` | Valid JWT required |
| Admin | Active account with role `admin` | Valid JWT required; admin-only APIs also require `RolesGuard` |
| Locked account | Account with a valid identity but inactive status | Blocked before protected services execute |

## High-Level Access Matrix

| API area | Guest | User | Admin | Notes |
| --- | --- | --- | --- | --- |
| Registration and password recovery | Allowed | Allowed | Allowed | Public flows needed before login or during recovery |
| Own profile and password | Blocked | Allowed | Allowed | Scoped to the authenticated account |
| Document library | Blocked | Allowed, owner-only | Allowed, owner-only | Admin role does not bypass document ownership |
| Folder management | Blocked | Allowed, owner-only | Allowed, owner-only | Folder queries include `ownerId` |
| Tag management | Blocked | Allowed, owner-only | Allowed, owner-only | Tags are private per owner |
| Study notes | Blocked | Allowed, owner-only | Allowed, owner-only | Notes are tied to the authenticated user's document relation |
| RAG / AI document features | Blocked | Allowed, owner-only | Allowed, owner-only | Ask, summary, mind map, diagram use authenticated `ownerId` |
| Admin user management | Blocked | Blocked | Allowed | Admin-only via `JwtAuthGuard + RolesGuard` |
| LLM debug endpoints | Blocked | Blocked | Allowed | Admin-only diagnostic endpoints |

## Guest API Matrix

Guest can only call public authentication flows. Guest cannot call workspace, document, folder, tag, note, RAG, admin, or LLM debug APIs.

| Method | Endpoint | Guest access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Allowed | Start account registration |
| `POST` | `/api/auth/login` | Allowed | Login, receive short-lived access token, and set HttpOnly refresh cookie |
| `POST` | `/api/auth/refresh` | Allowed with valid refresh cookie and CSRF header | Rotate refresh session, rotate CSRF token, and issue a new access token |
| `POST` | `/api/auth/logout` | Allowed with valid refresh cookie and CSRF header | Revoke current refresh session when cookie is present |
| `POST` | `/api/auth/forgot-password` | Allowed | Request password reset email |
| `POST` | `/api/auth/complete-registration` | Allowed | Set password from verification token |
| `POST` | `/api/auth/resend-verification` | Allowed | Resend verification email |
| `POST` | `/api/auth/reset-password` | Allowed | Set a new password from reset token |
| Any | `/api/auth/profile`, `/api/documents/*`, `/api/folders/*`, `/api/tags/*`, `/api/rag/*`, `/api/admin/*`, `/api/llm/*` | Blocked | Requires JWT and, where applicable, role checks |

## User API Matrix

An active user can call their own workspace APIs. Every resource operation must be scoped by the authenticated user's `ownerId` or `userId`.

| Method | Endpoint | User access | Ownership rule |
| --- | --- | --- | --- |
| `GET` | `/api/auth/profile` | Allowed | Own account only |
| `PATCH` | `/api/auth/profile` | Allowed | Own account only |
| `PATCH` | `/api/auth/password` | Allowed | Own account only |
| `POST` | `/api/auth/logout-all` | Allowed with valid refresh cookie and CSRF header | Revoke all refresh sessions for own account |
| `GET` | `/api/documents` | Allowed | Returns only authenticated owner's documents |
| `POST` | `/api/documents/upload` | Allowed | Uploaded document is attached to authenticated owner |
| `GET` | `/api/documents/favorites` | Allowed | Returns only authenticated owner's favorites |
| `GET` | `/api/documents/search` | Allowed | Searches only authenticated owner's documents |
| `GET` | `/api/documents/:id` | Allowed | Requires document owned by authenticated user |
| `GET` | `/api/documents/:id/file` | Allowed | Requires document owned by authenticated user |
| `GET` | `/api/documents/:id/related` | Allowed | Related results are limited to authenticated owner |
| `PATCH` | `/api/documents/:id` | Allowed | Requires document owned by authenticated user |
| `PATCH` | `/api/documents/:id/update-name` | Allowed | Requires document owned by authenticated user |
| `DELETE` | `/api/documents/:id` | Allowed | Requires document owned by authenticated user |
| `DELETE` | `/api/documents/delete` | Allowed | Requires document owned by authenticated user |
| `POST` | `/api/documents/:id/toggle-favorite` | Allowed | Requires document owned by authenticated user |
| `GET` | `/api/documents/:id/tags` | Allowed | Requires document owned by authenticated user |
| `PATCH` | `/api/documents/:id/tags` | Allowed | Document and selected tags must belong to authenticated user |
| `GET` | `/api/documents/:id/notes` | Allowed | Requires document owned by authenticated user |
| `POST` | `/api/documents/:id/notes` | Allowed | Creates note for authenticated user's document relation |
| `PATCH` | `/api/documents/notes/:noteId` | Allowed | Note must belong to authenticated user |
| `DELETE` | `/api/documents/notes/:noteId` | Allowed | Note must belong to authenticated user |
| `GET` | `/api/folders` | Allowed | Returns only authenticated owner's folders |
| `GET` | `/api/folders/:id` | Allowed | Folder must belong to authenticated user |
| `POST` | `/api/folders` | Allowed | Folder is created for authenticated owner |
| `PATCH` | `/api/folders/update` | Allowed | Folder and parent folder must belong to authenticated user |
| `PATCH` | `/api/folders/:id` | Allowed | Folder and parent folder must belong to authenticated user |
| `PATCH` | `/api/folders/move` | Allowed | Folder and target parent must belong to authenticated user |
| `PATCH` | `/api/folders/:id/move` | Allowed | Folder and target parent must belong to authenticated user |
| `DELETE` | `/api/folders/delete` | Allowed | Folder must belong to authenticated user |
| `DELETE` | `/api/folders/:id` | Allowed | Folder must belong to authenticated user |
| `POST` | `/api/folders/documents/add` | Allowed | Folder and document must belong to authenticated user |
| `DELETE` | `/api/folders/documents/remove` | Allowed | Folder-document relation must belong to authenticated user |
| `GET` | `/api/folders/:folderId/documents` | Allowed | Folder must belong to authenticated user |
| `GET` | `/api/tags` | Allowed | Returns only authenticated owner's tags |
| `POST` | `/api/tags` | Allowed | Tag is created for authenticated owner |
| `PATCH` | `/api/tags/:tagId` | Allowed | Tag must belong to authenticated user |
| `DELETE` | `/api/tags/:tagId` | Allowed | Tag must belong to authenticated user |
| `POST` | `/api/rag/documents/:documentId/ask` | Allowed | Document must belong to authenticated user |
| `GET` | `/api/rag/documents/:documentId/ask/history` | Allowed | Document and ask history must belong to authenticated user |
| `DELETE` | `/api/rag/documents/:documentId/ask/history` | Allowed | Document and ask history must belong to authenticated user |
| `POST` | `/api/rag/documents/:documentId/summary` | Allowed | Document must belong to authenticated user |
| `POST` | `/api/rag/documents/:documentId/mindmap` | Allowed | Document must belong to authenticated user |
| `POST` | `/api/rag/documents/:documentId/diagram` | Allowed | Document must belong to authenticated user |
| Any | `/api/admin/*` | Blocked | Requires role `admin` |
| Any | `/api/llm/*` | Blocked | Requires role `admin` |

## Admin API Matrix

Admin can call admin-only APIs and standard authenticated workspace APIs. Standard workspace APIs remain owner-scoped, so an admin does not automatically gain access to another user's documents, folders, tags, or notes through those endpoints.

| Method | Endpoint | Admin access | Rule |
| --- | --- | --- | --- |
| `GET` | `/api/admin/users` | Allowed | List users with admin role |
| `GET` | `/api/admin/audit-logs` | Allowed | Review admin account-management actions |
| `PATCH` | `/api/admin/users/:id/status` | Allowed with restrictions | Can lock/unlock normal users; cannot lock self or another admin account |
| `GET` | `/api/admin/stats` | Allowed | System statistics for dashboard |
| `GET` | `/api/llm/test` | Allowed | Admin-only LLM text generation diagnostic |
| `GET` | `/api/llm/test-embedding` | Allowed | Admin-only embedding diagnostic |
| Any user workspace endpoint | Allowed | Same owner-only rule as normal users |

## Cross-User Resource Access Matrix

This answers the required question: "Can User A access User B's document, folder, tag, or note?"

| Resource type | User A accessing User B resource | Expected result | Enforcement point |
| --- | --- | --- | --- |
| Document detail | Blocked | `404 Not Found` style response | `DocumentService.findUserDocumentForOwner(documentId, ownerId)` |
| Document file | Blocked | `404 Not Found` style response | `DocumentService.getDocumentFilePath(documentId, ownerId)` |
| Document update/delete/favorite | Blocked | `404 Not Found` style response | Document service queries by `userId` and `documentId` |
| Document tags | Blocked | `404 Not Found` or validation error | Document must belong to owner; selected tags must also belong to owner |
| Folder read/update/move/delete | Blocked | `404 Not Found` style response | `FolderService` queries folders by `{ id, ownerId }` |
| Folder-document assignment | Blocked | `404 Not Found` style response | Both folder and document are checked against same `ownerId` |
| Tag read/update/delete | Blocked | `404 Not Found` style response | `TagService.findOwnedTag(ownerId, tagId)` |
| Study note update/delete | Blocked | `404 Not Found` style response | Study note queries include `{ id: noteId, userId: ownerId }` |
| RAG ask/history/summary/mindmap/diagram | Blocked | `404 Not Found` style response before AI result is returned | RAG services receive and enforce authenticated `ownerId` |

The system generally returns not-found style responses for cross-user resources. This is intentional: it avoids confirming whether another user's resource ID exists.

## Current Automated Coverage

| Behavior | Covered by |
| --- | --- |
| Guest cannot call protected APIs | Backend e2e tests |
| Non-admin cannot call admin-only and LLM debug APIs | Backend e2e tests |
| Locked account cannot call protected APIs | Backend e2e tests |
| Admin lock/unlock writes an audit log | Backend unit tests |
| Document read and related routes pass authenticated `ownerId` | Backend e2e tests |
| RAG ask/history/summary/mindmap/diagram pass authenticated `ownerId` | Backend e2e tests |
| Password, registration, and admin status rules | Backend unit/e2e tests |
| Refresh token rotation, CSRF validation, and revoked-token reuse detection | Backend unit/e2e tests |

## Security Notes For Presentation

- Authentication answers: "Who are you?"
- Authorization answers: "What are you allowed to access?"
- StudyVault implements authorization in two layers:
  - Route-level guards: `JwtAuthGuard` blocks guests and inactive accounts; `RolesGuard` blocks non-admin users from admin-only APIs.
  - Data-level ownership checks: services query resources by `ownerId` / `userId`, so valid login alone is not enough to access another user's data.
- Admin is a system-management role, not a global data-owner bypass role. Admin APIs manage users and diagnostics, while document/folder/tag/note APIs remain scoped to the authenticated account.
- Access tokens are short-lived by default (`15m`). Long-lived login continuity is handled by revocable refresh sessions stored server-side, rotated on refresh, and revoked on logout, logout-all, password reset/change, or admin account lock.
- Refresh-cookie actions require a CSRF token in `X-CSRF-Token`. The backend stores only a hash of that CSRF token in the refresh session, and rotates it together with the refresh token.
- If a refresh token that has already been rotated is presented again, the backend treats it as possible token reuse and revokes all active sessions for that user.
