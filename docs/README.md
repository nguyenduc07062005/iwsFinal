# StudyVault Documentation Index

Last updated: 2026-05-02. The tracked Markdown documents have been reviewed against the current router, backend API surface, upload behavior, security model, and frontend UI/UX refresh.

Start here for final submission:

- [final-project-submission.vi.md](./final-project-submission.vi.md) - Vietnamese main report packet for submission.
- [final-project-submission.md](./final-project-submission.md) - English version of the same report packet.
- [StudyVault_Final_Report_Template_EN_Black.docx](./StudyVault_Final_Report_Template_EN_Black.docx) - English black-and-white reference template.
- [StudyVault_Final_Report_Template.docx](./StudyVault_Final_Report_Template.docx) - older draft template kept for reference.
- [member-report-evidence-plan.md](./member-report-evidence-plan.md) - per-member contribution split and required UI/API/DB screenshots.
- [personal-reports/Group4_Member1_Authentication_Security_Admin_Report_EN_Black.docx](./personal-reports/Group4_Member1_Authentication_Security_Admin_Report_EN_Black.docx) - English black-and-white individual report for member 1.
- [personal-reports/Group4_Member2_Document_Workspace_CRUD_Report_EN_Black.docx](./personal-reports/Group4_Member2_Document_Workspace_CRUD_Report_EN_Black.docx) - English black-and-white individual report for member 2.
- [personal-reports/Group4_Member3_AI_RAG_Document_Assistant_Report_EN_Black.docx](./personal-reports/Group4_Member3_AI_RAG_Document_Assistant_Report_EN_Black.docx) - English black-and-white individual report for member 3.
- [personal-reports/Group4_Member4_Frontend_Responsive_Docs_Testing_Report_EN_Black.docx](./personal-reports/Group4_Member4_Frontend_Responsive_Docs_Testing_Report_EN_Black.docx) - English black-and-white individual report for member 4.

Supporting documents:

- [authorization-matrix.md](./authorization-matrix.md) - detailed role and ownership access matrix.
- [security-architecture-and-demo.md](./security-architecture-and-demo.md) - security architecture and evidence map.
- [demo-runbook.md](./demo-runbook.md) - step-by-step demo checklist.
- [production-deployment.md](./production-deployment.md) - Docker deployment notes.
- [project-scope-final.md](./project-scope-final.md) - final project scope.
- [frontend-route-map.md](./frontend-route-map.md) - frontend route overview.
- [frontend-component-map.md](./frontend-component-map.md) - frontend component overview.
- [implementation-roadmap.md](./implementation-roadmap.md) - implementation roadmap and remaining work.
- [postman/README.md](./postman/README.md) - Postman collection and local environment guide.

Responsive QA references:

- The frontend uses mobile/tablet behavior below `1024px`, desktop navigation from `1024px`, and the wide split document viewer from `1280px`.
- Required manual viewport checks before submission: `375x667`, `768x1024`, `1024x768`, `1366x768`, and `1440x900`.
- Capture evidence for `/`, `/login`, `/register`, `/verify-email` or `/complete-registration`, `/app`, `/app/favorites`, `/app/documents/:id`, `/profile`, and `/admin` if admin access is part of the demo.

Current product notes:

- `/` is the public landing page.
- `/app` is the authenticated workspace.
- The frontend is JavaScript/JSX, not TypeScript.
- Upload duplicate policy is per folder: the same file can be uploaded into different folders, but not twice into the same folder.
- Document detail currently exposes Study notes, Summary, Ask AI, and Related tabs.
