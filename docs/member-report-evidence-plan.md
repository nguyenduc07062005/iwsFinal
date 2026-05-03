# StudyVault - Group 4 Personal Report Evidence Plan

This file explains how Group 4 should prepare four separate personal reports for the IWS final project.

The lecturer requires personal reports from all group members. Therefore, Group 4 should submit four individual reports, not one shared report as a replacement.

## 1. Report Files To Use

Use these English black-and-white Word files:

- `docs/personal-reports/Group4_Member1_Authentication_Security_Admin_Report_EN_Black.docx`
- `docs/personal-reports/Group4_Member2_Document_Workspace_CRUD_Report_EN_Black.docx`
- `docs/personal-reports/Group4_Member3_AI_RAG_Document_Assistant_Report_EN_Black.docx`
- `docs/personal-reports/Group4_Member4_Frontend_Responsive_Docs_Testing_Report_EN_Black.docx`

The older files without `_EN_Black` are previous drafts. Prefer the `_EN_Black` files because they use English, black text, and plain black table borders.

`docs/StudyVault_Final_Report_Template_EN_Black.docx` is only a reference template. The personal reports above are the files each member should fill in.

## 2. What Can Be The Same Across Reports

These sections may be similar or identical in all four reports:

- Project Overview.
- Main Functions.
- Technology Stack.
- Architecture and Database Overview.
- Requirement Mapping.
- Shared Verification Plan.

## 3. What Must Be Different Across Reports

These sections must be specific to each member:

- Individual Contribution.
- Assigned Tasks.
- Detailed Technical Contribution.
- Evidence Screenshots.
- Challenges and Solutions.
- Collaboration With Other Members.
- Personal Reflection.

Do not copy another member's personal section. Each member must describe their own work and insert their own screenshots.

## 4. Member Assignment Summary

| Member | Main responsibility | Related repo modules | Required proof |
| --- | --- | --- | --- |
| Member 1 | Authentication, security, admin | `authentication`, `admin`, JWT, CSRF, sessions, role guards | Auth UI/API, admin UI/API, users/session/audit DB evidence |
| Member 2 | Document workspace CRUD, folders, tags | `document`, `folder`, `tag`, upload, search/filter/sort/pagination | Workspace UI, document/folder/tag APIs, document/folder/tag DB evidence |
| Member 3 | AI/RAG and Document Assistant | `rag`, Gemini service, summary, Q&A, notes, related docs | Summary/Ask AI UI, RAG APIs, chunks/history/notes DB evidence |
| Member 4 | Frontend UX, responsive, integration, docs/testing | React routes, layouts, pages, services, README/docs | Responsive UI, Network tab, frontend lint/test/build, docs evidence |

Replace placeholders in the Word files:

- `[FULL NAME]`
- `[STUDENT ID]`
- `[DATE]`
- Figure captions.
- Collaboration names.

## 5. Member 1 Evidence Checklist - Authentication, Security, Admin

### UI screenshots

- Register or complete-registration screen.
- Login success screen.
- Profile page.
- Change password evidence.
- Admin dashboard stats.
- Admin users list.
- Lock/unlock user action.
- Audit log after lock/unlock.

### API screenshots

- `POST /api/auth/register`
- `POST /api/auth/complete-registration`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/profile`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`
- `GET /api/admin/stats`
- `GET /api/admin/users?page=1&limit=10`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/audit-logs?page=1&limit=10`

### Database screenshots

```sql
select id, email, role, is_active, is_email_verified, created_at
from users
order by created_at desc
limit 10;

select user_id, expires_at, revoked_at, created_at
from user_sessions
order by created_at desc
limit 10;

select admin_id, target_user_id, action, metadata, created_at
from admin_audit_logs
order by created_at desc
limit 10;
```

### Code files to reference

- `studyVault-backend/src/modules/authentication/authentication.controller.ts`
- `studyVault-backend/src/modules/authentication/authentication.service.ts`
- `studyVault-backend/src/modules/authentication/admin-bootstrap.service.ts`
- `studyVault-backend/src/modules/authentication/jwt/jwt.strategy.ts`
- `studyVault-backend/src/modules/authentication/roles/roles.guard.ts`
- `studyVault-backend/src/modules/admin/admin.controller.ts`
- `studyVault-backend/src/modules/admin/admin.service.ts`

## 6. Member 2 Evidence Checklist - Document Workspace CRUD

### UI screenshots

- Workspace document library.
- Upload modal with PDF/DOCX/TXT.
- Successful upload.
- Document preview/download.
- Rename/delete/favorite document.
- Search/filter/sort/pagination controls.
- Folder CRUD and move document to folder.
- Tag creation and tag assignment.

### API screenshots

- `POST /api/documents/upload`
- `GET /api/documents?page=1&limit=10&sortBy=createdAt&sortOrder=DESC`
- `GET /api/documents/:id`
- `PATCH /api/documents/:id`
- `DELETE /api/documents/:id`
- `POST /api/documents/:id/toggle-favorite`
- `GET /api/documents/favorites?page=1&limit=10`
- `GET /api/documents/search?q=lecture&page=1&limit=10`
- `GET /api/documents/:id/file`
- `GET /api/documents/:id/preview-html`
- `GET/POST/PATCH/DELETE /api/folders`
- `POST /api/folders/documents/add`
- `DELETE /api/folders/documents/remove`
- `GET/POST/PATCH/DELETE /api/tags`
- `PATCH /api/documents/:id/tags`

### Database screenshots

```sql
select id, title, original_name, mime_type, file_size, created_at
from document
order by created_at desc
limit 10;

select id, user_id, document_id, folder_id, display_name, is_favorite, created_at
from user_documents
order by created_at desc
limit 10;

select id, owner_id, name, parent_id, created_at
from folder
order by created_at desc
limit 10;

select id, owner_id, name, type, color, created_at
from tags
order by created_at desc
limit 10;

select user_document_id, tag_id
from user_document_tags
limit 20;
```

### Code files to reference

- `studyVault-backend/src/modules/document/document.controller.ts`
- `studyVault-backend/src/modules/document/document.service.ts`
- `studyVault-backend/src/modules/folder/folder.controller.ts`
- `studyVault-backend/src/modules/folder/folder.service.ts`
- `studyVault-backend/src/modules/tag/tag.controller.ts`
- `studyVault-backend/src/modules/tag/tag.service.ts`
- `studyVault-frontend/src/pages/WorkspacePage.jsx`
- `studyVault-frontend/src/components/documents/UploadModal.jsx`
- `studyVault-frontend/src/components/workspace/DocumentLibraryPanel.jsx`

## 7. Member 3 Evidence Checklist - AI/RAG and Document Assistant

### UI screenshots

- Document Assistant panel.
- Summary tab before and after generation.
- English summary.
- Vietnamese summary.
- Ask AI conversation.
- Ask history after reload.
- Clear conversation result.
- Related documents tab.
- Study notes create/update/delete.

### API screenshots

- `POST /api/rag/documents/:documentId/summary`
- `GET /api/rag/documents/:documentId/summary?language=en`
- `GET /api/rag/documents/:documentId/summary?language=vi`
- `POST /api/rag/documents/:documentId/ask`
- `GET /api/rag/documents/:documentId/ask/history`
- `DELETE /api/rag/documents/:documentId/ask/history`
- `POST /api/rag/documents/:documentId/mindmap`
- `POST /api/rag/documents/:documentId/diagram`
- `GET /api/documents/:id/related?limit=6`
- Document notes endpoints.

### Database screenshots

```sql
select id, document_id, chunk_index, token_count, embedding_model, created_at
from chunks
order by created_at desc
limit 10;

select id, user_id, document_id, question, answer, created_at
from document_ask_history
order by created_at desc
limit 10;

select id, user_id, user_document_id, content, created_at, updated_at
from study_notes
order by updated_at desc
limit 10;
```

### Code files to reference

- `studyVault-backend/src/modules/rag/rag.controller.ts`
- `studyVault-backend/src/modules/rag/rag.service.ts`
- `studyVault-backend/src/modules/rag/services/rag-indexing.service.ts`
- `studyVault-backend/src/modules/rag/services/rag-question-answering.service.ts`
- `studyVault-backend/src/modules/rag/services/rag-summary.service.ts`
- `studyVault-backend/src/common/llm/gemini.service.ts`
- `studyVault-frontend/src/pages/DocumentViewer.jsx`
- `studyVault-frontend/src/service/ragAPI.js`

## 8. Member 4 Evidence Checklist - Frontend, Responsive, Docs, Testing

### UI screenshots

- Landing page desktop.
- Login/Register mobile.
- Workspace at `768x1024` iPad portrait.
- Workspace at `1024x768` iPad landscape.
- Document Viewer stacked layout on tablet/mobile.
- Document Viewer split layout on desktop.
- Favorites page.
- Profile page.
- Admin dashboard.
- Bottom navigation on mobile/tablet.
- Desktop top navigation.

### Browser Network screenshots

- `GET /api/auth/profile`
- `GET /api/documents`
- `POST /api/documents/upload`
- `GET /api/documents/:id/file`
- `POST /api/rag/documents/:id/ask`
- `GET /api/admin/stats`
- `GET /api/admin/users`

### Test/build screenshots

```powershell
cd studyVault-frontend
npm run lint
npm test
npm run build
```

Optional:

```powershell
docker compose up --build
powershell -ExecutionPolicy Bypass -File .\scripts\demo-readiness.ps1
```

### Code/docs files to reference

- `studyVault-frontend/src/app/router.jsx`
- `studyVault-frontend/src/layouts/AppShell.jsx`
- `studyVault-frontend/src/layouts/AuthLayout.jsx`
- `studyVault-frontend/src/layouts/DetailLayout.jsx`
- `studyVault-frontend/src/components/navigation/ShellHeader.jsx`
- `studyVault-frontend/src/pages/WorkspacePage.jsx`
- `studyVault-frontend/src/pages/DocumentViewer.jsx`
- `README.md`
- `studyVault-frontend/README.md`
- `docs/frontend-route-map.md`
- `docs/frontend-component-map.md`
- `docs/member-report-evidence-plan.md`

## 9. Final Submission Checklist

- [ ] Four personal reports exist and are filled in.
- [ ] Each report has a different individual contribution section.
- [ ] Each report has member-specific screenshots.
- [ ] Each screenshot has a caption.
- [ ] No API key, full access token, refresh cookie, database password, or real `.env` content is visible.
- [ ] Frontend and backend tests/builds have been verified.
- [ ] Final zip name follows the lecturer's required format.
