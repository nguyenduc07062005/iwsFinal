# StudyVault Final Project Scope

Last updated: 2026-05-02.

## Project Name

StudyVault

## Product Definition

StudyVault is a web application for managing study documents. It gives students a focused workspace to upload files, organize them into folders and tags, preview documents, search and filter their library, save study notes, and use AI-assisted document review.

The system is implemented as a separated React frontend and NestJS REST API backend.

## Core Scope

### Public Entry

- Public landing page at `/`.
- Clear product story, sign-in/sign-up calls to action, feature overview, FAQ, and responsive navbar.
- The landing page is part of the current product, but the main grading/demo flow still centers on the authenticated workspace.

### Authentication

- Register with name and email.
- Email verification and password setup.
- Login.
- Refresh session with HttpOnly cookie and CSRF token.
- Logout and logout-all.
- Forgot password and reset password.
- Change password from profile.
- Profile read/update.

### Workspace And Folder Management

- Workspace route at `/app`.
- Folder create, read, update, move, and delete.
- Folder tree and breadcrumb/back behavior.
- Folder ownership checks.
- Folder move/update guards against invalid parent selections and folder cycles.

### Document Management

- Upload PDF, DOCX, and TXT.
- Validate size, MIME type, extension, filename, file signature, and readable content.
- List documents with pagination metadata.
- Search, filter, and sort documents.
- Open protected document preview.
- Rename and delete documents.
- Toggle favorite.
- Download protected file.
- Assign tags.
- Store study notes per user-document relation.
- Show related documents.

### Upload Duplicate Rule

- A user may upload the same file into different folders.
- A user may not upload the same file twice into the same folder.
- If a file is deleted from a folder, the user can upload that same file into that folder again.
- Per-folder copies keep document-id based frontend routes unambiguous.

### AI / RAG

- Background indexing after upload.
- Upload/view remains usable if AI quota or provider configuration fails.
- Ask AI against a document.
- Ask history.
- Generate and refresh document summary.
- Backend mind-map and diagram endpoints exist as supporting AI capabilities.
- The current frontend document assistant exposes Study notes, Summary, Ask AI, and Related tabs.

### Favorites

- Route `/app/favorites`.
- Search/filter/sort/pagination for favorite documents.
- Same owner-protected document actions as the workspace list.

### Admin

- Admin bootstrap via environment variables.
- Admin route `/admin`.
- User list with pagination/filtering.
- Lock/unlock normal users.
- Audit logs.
- Stats dashboard.
- Admin-only LLM diagnostics.

## Non-Goals For The Current Submission

- Realtime collaboration.
- Native mobile app.
- Multi-tenant organization management.
- Social document sharing.
- OCR for scanned PDFs.
- Full browser-based document editor.
- Production-grade object storage.
- Multi-instance rate limiting with Redis.

## Technology Scope

### Frontend

- React 19.
- Vite.
- React Router DOM.
- Tailwind CSS.
- Axios.
- Motion.
- Lucide icons.
- React Hot Toast.
- React Markdown.

The current frontend is JavaScript/JSX, not TypeScript.

### Backend

- NestJS 11.
- TypeORM.
- PostgreSQL + pgvector.
- JWT authentication.
- HttpOnly refresh cookie and CSRF token.
- class-validator and class-transformer.
- Nodemailer.
- Google Gemini.
- Jest and Supertest.

## Main Demo Flows

### Flow A: Public Entry And Auth

1. Open `http://localhost:3000`.
2. Show the landing page.
3. Register with name and email.
4. Complete email verification and password setup.
5. Login and enter `/app`.
6. Demonstrate logout and session cleanup.

### Flow B: Workspace CRUD

1. Create folders.
2. Upload a PDF, DOCX, or TXT file.
3. Show document list, filters, sorting, and pagination.
4. Open a document.
5. Rename, favorite, tag, download, and delete as needed.
6. Upload the same file to a different folder.
7. Show that uploading the same file twice into one folder is rejected.

### Flow C: Document Detail

1. Open `/app/documents/:id`.
2. Show protected preview.
3. Save study notes.
4. Generate summary if AI quota is available.
5. Ask a question about the document.
6. Show related documents.

### Flow D: Admin

1. Login as an admin account.
2. Open `/admin`.
3. Show stats, users, filters, pagination, and audit logs.
4. Lock/unlock a normal user.
5. Explain that admin does not bypass private document ownership.

## Definition Of Done

The project is considered in-scope and ready for final submission when:

- Frontend and backend can run locally with Docker or local dev setup.
- Core auth, workspace, document, AI assistant, and admin flows work.
- Backend ownership checks prevent cross-user access.
- Upload/view does not depend on AI provider availability.
- Main verification commands pass before demo.
- Documentation matches the current router, API surface, security model, and UX.
