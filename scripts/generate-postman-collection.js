const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'docs', 'postman');
const fixturesDir = path.join(outputDir, 'fixtures');

const collectionPath = path.join(
  outputDir,
  'StudyVault_API_Full.postman_collection.json',
);
const environmentPath = path.join(
  outputDir,
  'StudyVault_Local.postman_environment.json',
);
const readmePath = path.join(outputDir, 'README.md');
const sampleTextPath = path.join(fixturesDir, 'studyvault-sample.txt');
const fakePdfPath = path.join(fixturesDir, 'fake.pdf');

const schema =
  'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

const jsonHeader = {
  key: 'Content-Type',
  value: 'application/json',
};

const csrfHeader = (variableName) => ({
  key: 'X-CSRF-Token',
  value: `{{${variableName}}}`,
});

const bearerAuth = (variableName) => ({
  type: 'bearer',
  bearer: [
    {
      key: 'token',
      value: `{{${variableName}}}`,
      type: 'string',
    },
  ],
});

const rawUrl = (url) => ({ raw: url });

const rawJsonBody = (value) => ({
  mode: 'raw',
  raw: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
  options: {
    raw: {
      language: 'json',
    },
  },
});

const formDataBody = (items) => ({
  mode: 'formdata',
  formdata: items,
});

const script = (...lines) => lines.join('\n');

const expectStatus = (...statuses) =>
  script(
    `const expectedStatuses = [${statuses.join(', ')}];`,
    `pm.test("status is one of " + expectedStatuses.join(", "), function () {`,
    `  pm.expect(expectedStatuses).to.include(pm.response.code);`,
    `});`,
    `pm.test("response is parseable when body is JSON", function () {`,
    `  if (pm.response.text()) {`,
    `    pm.expect(function () { pm.response.json(); }).to.not.throw();`,
    `  }`,
    `});`,
  );

const expectStatusAndMessage = (...statuses) =>
  script(
    expectStatus(...statuses),
    `if (pm.response.text()) {`,
    `  const body = pm.response.json();`,
    `  pm.test("response has message or useful payload", function () {`,
    `    pm.expect(body.message || body.status || body.success || body.document || body.user || body.folder || body.tag || body.documents || body.folders || body.tags).to.exist;`,
    `  });`,
    `}`,
  );

const saveAuth = (accessTokenVar, csrfTokenVar, userIdVar) =>
  script(
    expectStatus(200),
    `const body = pm.response.json();`,
    `pm.test("login returns access token, csrf token and user", function () {`,
    `  pm.expect(body.accessToken).to.be.a("string").and.not.empty;`,
    `  pm.expect(body.csrfToken).to.be.a("string").and.not.empty;`,
    `  pm.expect(body.user).to.be.an("object");`,
    `  pm.expect(body.user.id).to.be.a("string").and.not.empty;`,
    `});`,
    `pm.environment.set("${accessTokenVar}", body.accessToken);`,
    `pm.environment.set("${csrfTokenVar}", body.csrfToken);`,
    `pm.environment.set("${userIdVar}", body.user.id);`,
  );

const saveProfileId = (userIdVar) =>
  script(
    expectStatus(200),
    `const body = pm.response.json();`,
    `pm.test("profile has account state", function () {`,
    `  pm.expect(body.id).to.be.a("string").and.not.empty;`,
    `  pm.expect(body.email).to.be.a("string").and.not.empty;`,
    `  pm.expect(body.role).to.be.a("string").and.not.empty;`,
    `  pm.expect(body).to.have.property("isActive");`,
    `  pm.expect(body).to.have.property("isEmailVerified");`,
    `});`,
    `pm.environment.set("${userIdVar}", body.id);`,
  );

const softAiTest = () =>
  script(
    `const allowedStatuses = [200, 400, 401, 402, 403, 429, 500, 503];`,
    `pm.test("AI endpoint returns success or a controlled error", function () {`,
    `  pm.expect(allowedStatuses).to.include(pm.response.code);`,
    `});`,
    `if (pm.response.code === 200) {`,
    `  const body = pm.response.json();`,
    `  pm.test("AI success body has message or result payload", function () {`,
    `    pm.expect(body.message || body.answer || body.summary || body.mindMap || body.diagram || body.response || body.success).to.exist;`,
    `  });`,
    `} else if (pm.response.text()) {`,
    `  const body = pm.response.json();`,
    `  pm.test("AI error is meaningful", function () {`,
    `    pm.expect(body.message || body.error).to.exist;`,
    `  });`,
    `}`,
  );

const request = ({
  name,
  method = 'GET',
  url,
  auth,
  headers = [],
  body,
  preRequest,
  tests,
  disabled = false,
}) => {
  const item = {
    name,
    request: {
      method,
      header: headers,
      url: rawUrl(url),
    },
  };

  if (auth) {
    item.request.auth = bearerAuth(auth);
  } else if (auth === null) {
    item.request.auth = { type: 'noauth' };
  }

  if (body) {
    item.request.body = body;
  }

  const events = [];

  if (preRequest) {
    events.push({
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: preRequest.split('\n'),
      },
    });
  }

  if (tests) {
    events.push({
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: tests.split('\n'),
      },
    });
  }

  if (events.length > 0) {
    item.event = events;
  }

  if (disabled) {
    item.disabled = true;
  }

  return item;
};

const folder = (name, items) => ({ name, item: items });

const cleanupVariables = [
  'userAccessToken',
  'userCsrfToken',
  'userId',
  'userBAccessToken',
  'userBCsrfToken',
  'userBId',
  'adminAccessToken',
  'adminCsrfToken',
  'adminUserId',
  'rootFolderId',
  'folderId',
  'subjectTagId',
  'tagId',
  'documentId',
  'noteId',
];

const initializeRun = script(
  `pm.environment.set("runId", Date.now().toString());`,
  ...cleanupVariables.map(
    (variableName) => `pm.environment.unset("${variableName}");`,
  ),
);

const collection = {
  info: {
    name: 'StudyVault API Full System Tests',
    description:
      'Full Postman regression collection for StudyVault API: auth, sessions, folders, tags, documents, notes, RAG, admin, ownership, and validation branches.',
    schema,
  },
  item: [
    folder('00 - Setup & System', [
      request({
        name: 'Initialize run variables',
        url: '{{baseUrl}}/health',
        auth: null,
        preRequest: initializeRun,
        tests: script(
          expectStatus(200, 503),
          `pm.test("run id was generated", function () {`,
          `  pm.expect(pm.environment.get("runId")).to.be.a("string").and.not.empty;`,
          `});`,
        ),
      }),
      request({
        name: 'API root smoke',
        url: '{{baseUrl}}',
        auth: null,
        tests: expectStatus(200),
      }),
      request({
        name: 'Health check',
        url: '{{baseUrl}}/health',
        auth: null,
        tests: script(
          expectStatus(200, 503),
          `const body = pm.response.json();`,
          `pm.test("health has status", function () {`,
          `  pm.expect(body.status).to.exist;`,
          `});`,
        ),
      }),
    ]),
    folder('01 - Auth Public Branches', [
      request({
        name: 'Register new account smoke',
        method: 'POST',
        url: '{{baseUrl}}/auth/register',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: 'postman.user.{{runId}}@example.com',
          name: 'Postman Generated User',
        }),
        tests: script(
          `const allowedStatuses = [201, 400, 429, 500];`,
          `pm.test("registration returns expected status for configured environment", function () {`,
          `  pm.expect(allowedStatuses).to.include(pm.response.code);`,
          `});`,
          `if (pm.response.code === 201) {`,
          `  const body = pm.response.json();`,
          `  pm.expect(body.message || body.user).to.exist;`,
          `}`,
        ),
      }),
      request({
        name: 'Register invalid email',
        method: 'POST',
        url: '{{baseUrl}}/auth/register',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: 'not-an-email',
          name: 'Invalid Email',
        }),
        tests: expectStatusAndMessage(400),
      }),
      request({
        name: 'Login invalid credentials',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: '{{userEmail}}',
          password: 'WrongPassword123!',
        }),
        tests: expectStatusAndMessage(401, 429),
      }),
      request({
        name: 'Forgot password neutral response - unknown email',
        method: 'POST',
        url: '{{baseUrl}}/auth/forgot-password',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: 'unknown.{{runId}}@example.com',
        }),
        tests: expectStatusAndMessage(200, 429),
      }),
      request({
        name: 'Resend verification neutral response - unknown email',
        method: 'POST',
        url: '{{baseUrl}}/auth/resend-verification',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: 'unknown.{{runId}}@example.com',
        }),
        tests: expectStatusAndMessage(200, 429),
      }),
      request({
        name: 'Complete registration invalid token',
        method: 'POST',
        url: '{{baseUrl}}/auth/complete-registration',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          token: 'invalid-token',
          password: 'StrongPass123!',
        }),
        tests: expectStatusAndMessage(400, 429),
      }),
      request({
        name: 'Reset password invalid token',
        method: 'POST',
        url: '{{baseUrl}}/auth/reset-password',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          token: 'invalid-token',
          password: 'StrongPass123!',
        }),
        tests: expectStatusAndMessage(400, 429),
      }),
    ]),
    folder('02 - User A Session & Profile', [
      request({
        name: 'Login User A',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: '{{userEmail}}',
          password: '{{userPassword}}',
        }),
        tests: saveAuth('userAccessToken', 'userCsrfToken', 'userId'),
      }),
      request({
        name: 'Refresh User A session',
        method: 'POST',
        url: '{{baseUrl}}/auth/refresh',
        auth: null,
        headers: [csrfHeader('userCsrfToken')],
        tests: script(
          expectStatus(200),
          `const body = pm.response.json();`,
          `pm.environment.set("userAccessToken", body.accessToken);`,
          `pm.environment.set("userCsrfToken", body.csrfToken);`,
          `pm.test("refresh rotated access and csrf token", function () {`,
          `  pm.expect(body.accessToken).to.be.a("string").and.not.empty;`,
          `  pm.expect(body.csrfToken).to.be.a("string").and.not.empty;`,
          `});`,
        ),
      }),
      request({
        name: 'Refresh without CSRF is blocked',
        method: 'POST',
        url: '{{baseUrl}}/auth/refresh',
        auth: null,
        tests: expectStatusAndMessage(401),
      }),
      request({
        name: 'Get User A profile',
        url: '{{baseUrl}}/auth/profile',
        auth: 'userAccessToken',
        tests: saveProfileId('userId'),
      }),
      request({
        name: 'Update User A profile',
        method: 'PATCH',
        url: '{{baseUrl}}/auth/profile',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Postman User A {{runId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Change password wrong current password',
        method: 'PATCH',
        url: '{{baseUrl}}/auth/password',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          currentPassword: 'WrongPassword123!',
          newPassword: 'AnotherStrong123!',
        }),
        tests: expectStatusAndMessage(400, 401),
      }),
    ]),
    folder('03 - Folders', [
      request({
        name: 'List folders',
        url: '{{baseUrl}}/folders',
        auth: 'userAccessToken',
        tests: script(
          expectStatus(200),
          `const body = pm.response.json();`,
          `pm.test("folders array is returned", function () {`,
          `  pm.expect(body.folders).to.be.an("array");`,
          `});`,
          `const root = body.folders.find((folder) => folder.parentId === null || folder.parentId === undefined) || body.folders[0];`,
          `if (root?.id) pm.environment.set("rootFolderId", root.id);`,
        ),
      }),
      request({
        name: 'Create child folder',
        method: 'POST',
        url: '{{baseUrl}}/folders',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Postman Folder {{runId}}',
          parentId: '{{rootFolderId}}',
        }),
        tests: script(
          expectStatus(201),
          `const body = pm.response.json();`,
          `pm.test("folder was created", function () {`,
          `  pm.expect(body.folder.id).to.be.a("string").and.not.empty;`,
          `});`,
          `pm.environment.set("folderId", body.folder.id);`,
        ),
      }),
      request({
        name: 'Get folder by id',
        url: '{{baseUrl}}/folders/{{folderId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Update folder by REST alias',
        method: 'PATCH',
        url: '{{baseUrl}}/folders/{{folderId}}',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Postman Folder Updated {{runId}}',
          parentId: '{{rootFolderId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Move folder by REST alias',
        method: 'PATCH',
        url: '{{baseUrl}}/folders/{{folderId}}/move',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          newParentId: '{{rootFolderId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Legacy move folder endpoint',
        method: 'PATCH',
        url: '{{baseUrl}}/folders/move',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          folderId: '{{folderId}}',
          newParentId: '{{rootFolderId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Legacy update folder endpoint',
        method: 'PATCH',
        url: '{{baseUrl}}/folders/update',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          folderId: '{{folderId}}',
          name: 'Postman Folder Legacy {{runId}}',
          parentId: '{{rootFolderId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Invalid folder UUID returns 400',
        url: '{{baseUrl}}/folders/not-a-uuid',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(400),
      }),
    ]),
    folder('04 - Tags', [
      request({
        name: 'List all tags',
        url: '{{baseUrl}}/tags',
        auth: 'userAccessToken',
        tests: script(
          expectStatus(200),
          `const body = pm.response.json();`,
          `pm.test("tags array is returned", function () {`,
          `  pm.expect(body.tags).to.be.an("array");`,
          `});`,
        ),
      }),
      request({
        name: 'Create subject tag',
        method: 'POST',
        url: '{{baseUrl}}/tags',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Postman Subject {{runId}}',
          type: 'SUBJECT',
          color: '#3b82f6',
        }),
        tests: script(
          expectStatus(201),
          `const body = pm.response.json();`,
          `pm.environment.set("subjectTagId", body.tag.id);`,
          `pm.test("subject tag created", function () {`,
          `  pm.expect(body.tag.type).to.eql("SUBJECT");`,
          `});`,
        ),
      }),
      request({
        name: 'Create normal tag',
        method: 'POST',
        url: '{{baseUrl}}/tags',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Postman Tag {{runId}}',
          type: 'TAG',
          color: '#9b3f36',
        }),
        tests: script(
          expectStatus(201),
          `const body = pm.response.json();`,
          `pm.environment.set("tagId", body.tag.id);`,
          `pm.test("tag created", function () {`,
          `  pm.expect(body.tag.id).to.be.a("string").and.not.empty;`,
          `});`,
        ),
      }),
      request({
        name: 'List tags by type',
        url: '{{baseUrl}}/tags?type=SUBJECT',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Update normal tag',
        method: 'PATCH',
        url: '{{baseUrl}}/tags/{{tagId}}',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Postman Tag Updated {{runId}}',
          color: '#16a34a',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Create tag invalid color',
        method: 'POST',
        url: '{{baseUrl}}/tags',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Invalid Color Tag',
          color: 'not-a-color',
        }),
        tests: expectStatusAndMessage(400),
      }),
    ]),
    folder('05 - Documents & Notes', [
      request({
        name: 'List documents default',
        url: '{{baseUrl}}/documents?page=1&limit=10&sortBy=createdAt&sortOrder=desc',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Upload TXT document',
        method: 'POST',
        url: '{{baseUrl}}/documents/upload',
        auth: 'userAccessToken',
        body: formDataBody([
          {
            key: 'file',
            type: 'file',
            src: '{{documentFilePath}}',
          },
          {
            key: 'title',
            value: 'Postman API Document {{runId}}',
            type: 'text',
          },
          {
            key: 'folderId',
            value: '{{folderId}}',
            type: 'text',
          },
          {
            key: 'tagIds',
            value: '{{tagId}},{{subjectTagId}}',
            type: 'text',
          },
        ]),
        tests: script(
          expectStatus(200, 429),
          `if (pm.response.code === 200) {`,
          `  const body = pm.response.json();`,
          `  const documentId = body.document?.id || body.uploaded?.id;`,
          `  pm.test("upload returns document id", function () {`,
          `    pm.expect(documentId).to.be.a("string").and.not.empty;`,
          `  });`,
          `  pm.environment.set("documentId", documentId);`,
          `}`,
        ),
      }),
      request({
        name: 'Upload fake PDF is rejected',
        method: 'POST',
        url: '{{baseUrl}}/documents/upload',
        auth: 'userAccessToken',
        body: formDataBody([
          {
            key: 'file',
            type: 'file',
            src: '{{fakePdfFilePath}}',
          },
          {
            key: 'title',
            value: 'Fake PDF {{runId}}',
            type: 'text',
          },
        ]),
        tests: expectStatusAndMessage(400, 429),
      }),
      request({
        name: 'List documents with filters',
        url: '{{baseUrl}}/documents?page=1&limit=10&sortBy=title&sortOrder=asc&type=txt&keyword=Postman&folderId={{folderId}}&tagId={{tagId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Add document to folder legacy endpoint',
        method: 'POST',
        url: '{{baseUrl}}/folders/documents/add',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          folderId: '{{folderId}}',
          documentId: '{{documentId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'List documents by folder',
        url: '{{baseUrl}}/folders/{{folderId}}/documents?page=1&limit=10',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Get document by id',
        url: '{{baseUrl}}/documents/{{documentId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Preview/download document file',
        url: '{{baseUrl}}/documents/{{documentId}}/file',
        auth: 'userAccessToken',
        tests: script(
          `pm.test("file request returns a file response", function () {`,
          `  pm.expect([200, 404]).to.include(pm.response.code);`,
          `});`,
        ),
      }),
      request({
        name: 'Update document name',
        method: 'PATCH',
        url: '{{baseUrl}}/documents/{{documentId}}',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          newDocumentName: 'Postman API Document Renamed {{runId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Legacy update document name',
        method: 'PATCH',
        url: '{{baseUrl}}/documents/{{documentId}}/update-name',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          newDocumentName: 'Postman API Document Legacy {{runId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Update document tags',
        method: 'PATCH',
        url: '{{baseUrl}}/documents/{{documentId}}/tags',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          tagIds: ['{{tagId}}', '{{subjectTagId}}'],
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Get document tags',
        url: '{{baseUrl}}/documents/{{documentId}}/tags',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Toggle favorite on',
        method: 'POST',
        url: '{{baseUrl}}/documents/{{documentId}}/toggle-favorite',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'List favorite documents',
        url: '{{baseUrl}}/documents/favorites?page=1&limit=10',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Search documents',
        url: '{{baseUrl}}/documents/search?q=Postman&page=1&limit=10',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 429, 500),
      }),
      request({
        name: 'Get related documents',
        url: '{{baseUrl}}/documents/{{documentId}}/related?limit=6',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 429, 500),
      }),
      request({
        name: 'List document notes',
        url: '{{baseUrl}}/documents/{{documentId}}/notes',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Create document note',
        method: 'POST',
        url: '{{baseUrl}}/documents/{{documentId}}/notes',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          content: 'Postman note created at {{runId}}',
        }),
        tests: script(
          expectStatus(201),
          `const body = pm.response.json();`,
          `pm.environment.set("noteId", body.note.id);`,
          `pm.test("note was created", function () {`,
          `  pm.expect(body.note.content).to.include("Postman note");`,
          `});`,
        ),
      }),
      request({
        name: 'Update document note',
        method: 'PATCH',
        url: '{{baseUrl}}/documents/notes/{{noteId}}',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          content: 'Postman note updated at {{runId}}',
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Invalid document UUID returns 400',
        url: '{{baseUrl}}/documents/not-a-uuid',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(400),
      }),
    ]),
    folder('06 - RAG & AI Branches', [
      request({
        name: 'Ask document question',
        method: 'POST',
        url: '{{baseUrl}}/rag/documents/{{documentId}}/ask',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          question: 'What is this document about?',
        }),
        tests: softAiTest(),
      }),
      request({
        name: 'Get ask history',
        url: '{{baseUrl}}/rag/documents/{{documentId}}/ask/history',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 429),
      }),
      request({
        name: 'Generate summary',
        method: 'POST',
        url: '{{baseUrl}}/rag/documents/{{documentId}}/summary',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          language: 'en',
          forceRefresh: false,
          slot: 'default',
          instruction: 'Summarize this document for a student.',
        }),
        tests: softAiTest(),
      }),
      request({
        name: 'Generate mind map',
        method: 'POST',
        url: '{{baseUrl}}/rag/documents/{{documentId}}/mindmap',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          language: 'en',
          forceRefresh: false,
        }),
        tests: softAiTest(),
      }),
      request({
        name: 'Generate diagram',
        method: 'POST',
        url: '{{baseUrl}}/rag/documents/{{documentId}}/diagram',
        auth: 'userAccessToken',
        tests: softAiTest(),
      }),
      request({
        name: 'Clear ask history',
        method: 'DELETE',
        url: '{{baseUrl}}/rag/documents/{{documentId}}/ask/history',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 429),
      }),
    ]),
    folder('07 - Authorization & Ownership', [
      request({
        name: 'Profile without token is blocked',
        url: '{{baseUrl}}/auth/profile',
        auth: null,
        tests: expectStatusAndMessage(401),
      }),
      request({
        name: 'Documents without token is blocked',
        url: '{{baseUrl}}/documents',
        auth: null,
        tests: expectStatusAndMessage(401),
      }),
      request({
        name: 'Login User B',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: '{{userBEmail}}',
          password: '{{userBPassword}}',
        }),
        tests: saveAuth('userBAccessToken', 'userBCsrfToken', 'userBId'),
      }),
      request({
        name: 'User B cannot read User A document',
        url: '{{baseUrl}}/documents/{{documentId}}',
        auth: 'userBAccessToken',
        tests: expectStatusAndMessage(403, 404),
      }),
      request({
        name: 'User B cannot read User A folder',
        url: '{{baseUrl}}/folders/{{folderId}}',
        auth: 'userBAccessToken',
        tests: expectStatusAndMessage(403, 404),
      }),
      request({
        name: 'User B cannot update User A tag',
        method: 'PATCH',
        url: '{{baseUrl}}/tags/{{tagId}}',
        auth: 'userBAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          name: 'Should Not Update {{runId}}',
        }),
        tests: expectStatusAndMessage(403, 404),
      }),
      request({
        name: 'User B cannot update User A note',
        method: 'PATCH',
        url: '{{baseUrl}}/documents/notes/{{noteId}}',
        auth: 'userBAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          content: 'Should not update another user note',
        }),
        tests: expectStatusAndMessage(403, 404),
      }),
      request({
        name: 'User B cannot call admin stats',
        url: '{{baseUrl}}/admin/stats',
        auth: 'userBAccessToken',
        tests: expectStatusAndMessage(403),
      }),
    ]),
    folder('08 - Admin', [
      request({
        name: 'Login Admin',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: '{{adminEmail}}',
          password: '{{adminPassword}}',
        }),
        tests: saveAuth('adminAccessToken', 'adminCsrfToken', 'adminUserId'),
      }),
      request({
        name: 'Get admin profile',
        url: '{{baseUrl}}/auth/profile',
        auth: 'adminAccessToken',
        tests: saveProfileId('adminUserId'),
      }),
      request({
        name: 'Admin stats',
        url: '{{baseUrl}}/admin/stats',
        auth: 'adminAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Admin list users',
        url: '{{baseUrl}}/admin/users?page=1&limit=10&status=all',
        auth: 'adminAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Admin list users by keyword',
        url: '{{baseUrl}}/admin/users?page=1&limit=10&status=all&keyword={{userBEmail}}',
        auth: 'adminAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Admin cannot lock own account',
        method: 'PATCH',
        url: '{{baseUrl}}/admin/users/{{adminUserId}}/status',
        auth: 'adminAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          isActive: false,
        }),
        tests: expectStatusAndMessage(400),
      }),
      request({
        name: 'Admin locks User B',
        method: 'PATCH',
        url: '{{baseUrl}}/admin/users/{{userBId}}/status',
        auth: 'adminAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          isActive: false,
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Locked User B cannot login',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: '{{userBEmail}}',
          password: '{{userBPassword}}',
        }),
        tests: expectStatusAndMessage(401, 429),
      }),
      request({
        name: 'Admin unlocks User B',
        method: 'PATCH',
        url: '{{baseUrl}}/admin/users/{{userBId}}/status',
        auth: 'adminAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          isActive: true,
        }),
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Admin audit logs',
        url: '{{baseUrl}}/admin/audit-logs?page=1&limit=10',
        auth: 'adminAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Admin audit logs filtered by action',
        url: '{{baseUrl}}/admin/audit-logs?page=1&limit=10&action=USER_LOCKED',
        auth: 'adminAccessToken',
        tests: expectStatusAndMessage(200),
      }),
      request({
        name: 'Admin LLM test',
        url: '{{baseUrl}}/llm/test?prompt=Say%20hello%20from%20StudyVault',
        auth: 'adminAccessToken',
        tests: softAiTest(),
      }),
      request({
        name: 'Admin embedding test',
        url: '{{baseUrl}}/llm/test-embedding?text=StudyVault%20embedding%20test',
        auth: 'adminAccessToken',
        tests: softAiTest(),
      }),
    ]),
    folder('09 - Cleanup', [
      request({
        name: 'Delete document note',
        method: 'DELETE',
        url: '{{baseUrl}}/documents/notes/{{noteId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Remove document from folder legacy endpoint',
        method: 'DELETE',
        url: '{{baseUrl}}/folders/documents/remove',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          folderId: '{{folderId}}',
          documentId: '{{documentId}}',
        }),
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Delete document by REST alias',
        method: 'DELETE',
        url: '{{baseUrl}}/documents/{{documentId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Legacy delete document endpoint',
        method: 'DELETE',
        url: '{{baseUrl}}/documents/delete',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          documentId: '{{documentId}}',
        }),
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Delete normal tag',
        method: 'DELETE',
        url: '{{baseUrl}}/tags/{{tagId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Delete subject tag',
        method: 'DELETE',
        url: '{{baseUrl}}/tags/{{subjectTagId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Delete folder by REST alias',
        method: 'DELETE',
        url: '{{baseUrl}}/folders/{{folderId}}',
        auth: 'userAccessToken',
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Legacy delete folder endpoint',
        method: 'DELETE',
        url: '{{baseUrl}}/folders/delete',
        auth: 'userAccessToken',
        headers: [jsonHeader],
        body: rawJsonBody({
          folderId: '{{folderId}}',
        }),
        tests: expectStatusAndMessage(200, 404),
      }),
      request({
        name: 'Logout all current admin sessions',
        method: 'POST',
        url: '{{baseUrl}}/auth/logout-all',
        auth: 'adminAccessToken',
        headers: [csrfHeader('adminCsrfToken')],
        tests: expectStatusAndMessage(200, 401),
      }),
      request({
        name: 'Login Admin for logout endpoint',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        auth: null,
        headers: [jsonHeader],
        body: rawJsonBody({
          email: '{{adminEmail}}',
          password: '{{adminPassword}}',
        }),
        tests: saveAuth('adminAccessToken', 'adminCsrfToken', 'adminUserId'),
      }),
      request({
        name: 'Logout current admin session',
        method: 'POST',
        url: '{{baseUrl}}/auth/logout',
        auth: null,
        headers: [csrfHeader('adminCsrfToken')],
        tests: expectStatusAndMessage(200),
      }),
    ]),
  ],
};

const environment = {
  id: 'fe0ad87d-1f51-4622-ae87-000000000001',
  name: 'StudyVault Local',
  values: [
    ['baseUrl', 'http://localhost:8000/api', true],
    ['userEmail', 'student@example.com', true],
    ['userPassword', 'StrongPass123!', true],
    ['userBEmail', 'student.b@example.com', true],
    ['userBPassword', 'StrongPass123!', true],
    ['adminEmail', 'admin@example.com', true],
    ['adminPassword', 'ChangeMe123!', true],
    ['documentFilePath', 'docs/postman/fixtures/studyvault-sample.txt', true],
    ['fakePdfFilePath', 'docs/postman/fixtures/fake.pdf', true],
    ['runId', '', true],
    ...cleanupVariables.map((variableName) => [variableName, '', true]),
  ].map(([key, value, enabled]) => ({
    key,
    value,
    type: 'default',
    enabled,
  })),
  _postman_variable_scope: 'environment',
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: 'StudyVault generator script',
};

const readme = `# StudyVault Postman API Tests

Thu muc nay chua bo test API day du cho StudyVault hien tai.

## Files

- \`StudyVault_API_Full.postman_collection.json\`: Postman collection chay full luong API.
- \`StudyVault_Local.postman_environment.json\`: Postman environment mau cho local Docker/local backend.
- \`fixtures/studyvault-sample.txt\`: file TXT hop le de test upload.
- \`fixtures/fake.pdf\`: file gia PDF de test upload hardening.

## Cach dung trong Postman

1. Import collection \`StudyVault_API_Full.postman_collection.json\`.
2. Import environment \`StudyVault_Local.postman_environment.json\`.
3. Chon environment \`StudyVault Local\`.
4. Sua cac bien quan trong:
   - \`baseUrl\`: mac dinh \`http://localhost:8000/api\`.
   - \`userEmail\`, \`userPassword\`: tai khoan user da verify.
   - \`userBEmail\`, \`userBPassword\`: tai khoan user thu hai da verify, dung de test ownership.
   - \`adminEmail\`, \`adminPassword\`: tai khoan admin.
   - \`documentFilePath\`, \`fakePdfFilePath\`: neu Postman khong doc duoc relative path, hay chon file thu cong trong request upload.
5. Mo Collection Runner va chay tu folder \`00 - Setup & System\` den \`09 - Cleanup\`.

## Yeu cau truoc khi chay full

- Backend dang chay va ket noi database thanh cong.
- Co it nhat 1 admin va 2 user thuong da verify email.
- Neu test AI/RAG can pass success 200 thi can cau hinh API key AI va quota con du.
- Neu AI het quota hoac chua cau hinh, folder \`06 - RAG & AI Branches\` va endpoint \`/llm/test\` co test mem: chap nhan response loi co y nghia thay vi fail ca bo collection.

## Cac nhanh da bao phu

- System: root API, health.
- Auth public: register, validation, login sai, forgot password neutral, resend verification neutral, invalid token.
- Session: login, refresh token + CSRF, refresh thieu CSRF bi chan.
- Profile: get/update, doi password sai current password.
- Folder: list/create/get/update/move/legacy update/invalid UUID.
- Tag: list/create/update/filter/invalid color.
- Document: list/upload/upload fake file/get/file/update name/update tags/favorite/search/related/delete.
- Note: list/create/update/delete.
- RAG: ask/history/summary/mindmap/diagram/clear history.
- Authorization: unauthenticated bi chan, User B khong doc/sua data cua User A, user thuong khong goi admin.
- Admin: stats/list users/audit logs/lock-unlock user/self-lock blocked/LLM admin endpoint.
- Cleanup: xoa note/document/tag/folder va logout.

## Luu y

- Request \`Admin locks User B\` se khoa tam thoi tai khoan User B, request ke tiep se mo khoa lai. Nen dung tai khoan test, khong dung tai khoan ca nhan quan trong.
- Request upload trong Postman app co the can ban chon lai file bang UI vi Postman han che duong dan file local khi import.
- Script sinh collection nam o \`scripts/generate-postman-collection.js\`. Chay lai bang:

\`\`\`powershell
node scripts/generate-postman-collection.js
\`\`\`
`;

const sampleText = `StudyVault API fixture

This is a valid TXT document used by the Postman API regression collection.
It contains enough plain text for upload, preview, notes, search, and AI/RAG smoke requests.

Topic: Internet and Web Services final project.
Purpose: verify document upload, ownership, tags, folders, notes, and AI workflows.
`;

const fakePdf = `%PDF-1.7
This file is intentionally not a valid PDF body.
It is used to confirm that StudyVault rejects fake or unreadable PDF uploads.
`;

fs.mkdirSync(fixturesDir, { recursive: true });
fs.writeFileSync(collectionPath, `${JSON.stringify(collection, null, 2)}\n`);
fs.writeFileSync(environmentPath, `${JSON.stringify(environment, null, 2)}\n`);
fs.writeFileSync(readmePath, readme);
fs.writeFileSync(sampleTextPath, sampleText);
fs.writeFileSync(fakePdfPath, fakePdf);

console.log(`Generated ${path.relative(repoRoot, collectionPath)}`);
console.log(`Generated ${path.relative(repoRoot, environmentPath)}`);
console.log(`Generated ${path.relative(repoRoot, readmePath)}`);
console.log(`Generated ${path.relative(repoRoot, sampleTextPath)}`);
console.log(`Generated ${path.relative(repoRoot, fakePdfPath)}`);
