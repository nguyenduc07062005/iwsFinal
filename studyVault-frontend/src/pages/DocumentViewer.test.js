import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const documentViewerSource = readFileSync(
  new URL("./DocumentViewer.jsx", import.meta.url),
  "utf8",
);
const documentViewerHookSource = readFileSync(
  new URL("../hooks/useDocumentViewer.js", import.meta.url),
  "utf8",
);

test("document viewer guards stale async loads before updating file preview state", () => {
  assert.match(documentViewerHookSource, /loadRequestIdRef = useRef\(0\)/);
  assert.match(documentViewerHookSource, /const requestId = \+\+loadRequestIdRef\.current/);
  assert.match(
    documentViewerHookSource,
    /if \(isStale\(\)\) \{\s*URL\.revokeObjectURL\(nextFileUrl\);\s*return;\s*\}/s,
  );
  assert.match(documentViewerSource, /viewer\.loadRequestIdRef\.current \+= 1/);
});

test("document summary render path uses normalized safe summary fields", () => {
  assert.match(
    documentViewerHookSource,
    /from '..\/utils\/summary\.js'/,
  );
  assert.match(
    documentViewerHookSource,
    /const summaryVersions = useMemo\(\s*\(\) => getSummaryVersions\(summaryState\.data\)/s,
  );
  assert.match(
    documentViewerHookSource,
    /const activeSummary = useMemo\(\s*\(\) => getActiveSummary\(summaryState\.data\)/s,
  );
  assert.match(
    documentViewerHookSource,
    /const summaryTitle = normalizeSummaryText\(activeSummary\?\.title\);/,
  );
  assert.match(documentViewerSource, /viewer\.summaryTitle \|\| viewer\.documentData\?\.title/);
  assert.doesNotMatch(documentViewerSource, /viewer\.activeSummary\.title/);
});

test("document viewer defines the reusable empty state helper", () => {
  assert.match(documentViewerSource, /const EmptyState = \(\{ action, description, icon, title \}\) =>/);
});

test("summary tab auto-generates a saved summary instead of showing manual generate UI", () => {
  assert.doesNotMatch(documentViewerSource, /title="No summary yet"/);
  assert.doesNotMatch(documentViewerSource, /Generate \{selectedLangOption\.label\} summary/);
  assert.doesNotMatch(documentViewerSource, /SUMMARY_LANGUAGE_OPTIONS/);
  assert.doesNotMatch(documentViewerSource, /renderLanguageSelector/);
  assert.doesNotMatch(documentViewerSource, /setSelectedLanguage/);
  assert.doesNotMatch(documentViewerHookSource, /selectedLanguage/);
  assert.match(documentViewerSource, /activeTab !== 'summary'/);
  assert.match(documentViewerSource, /!summaryState\.checked/);
  assert.match(documentViewerSource, /!activeSummary/);
  assert.match(documentViewerSource, /void generateSummary\(\);/);
  assert.match(documentViewerHookSource, /DEFAULT_SUMMARY_LANGUAGE = 'en'/);
});

test("summary regeneration collects a user instruction before forcing refresh", () => {
  assert.match(documentViewerSource, /showSummaryRegenerateModal/);
  assert.match(documentViewerSource, /summaryInstruction/);
  assert.match(documentViewerSource, /value=\{summaryInstruction\}/);
  assert.match(documentViewerSource, /instruction:\s*trimmedInstruction/);
  assert.match(documentViewerSource, /forceRefresh:\s*true/);
  assert.match(documentViewerSource, /language:\s*getInstructionSummaryLanguage\(trimmedInstruction\)/);
  assert.match(documentViewerSource, /setShowSummaryRegenerateModal\(true\)/);
  assert.doesNotMatch(
    documentViewerSource,
    /onClick=\{\(\) => void viewer\.generateSummary\(viewer\.selectedLanguage, \{ forceRefresh: true \}\)\}/,
  );
});

test("summary regenerate action uses a visible label instead of an icon-only button", () => {
  assert.match(
    documentViewerSource,
    /aria-label="Regenerate summary"[\s\S]*<RefreshCcw size=\{14\} \/>[\s\S]*<span>Regenerate<\/span>/,
  );
  assert.doesNotMatch(
    documentViewerSource,
    /aria-label="Regenerate summary" title="Regenerate summary" onClick=\{openSummaryRegenerateModal\} className="flex h-9 w-9/,
  );
});

test("summary regenerate instructions can request Vietnamese without showing a VI tab", () => {
  assert.match(documentViewerSource, /const getInstructionSummaryLanguage = \(instruction\) =>/);
  assert.match(documentViewerSource, /normalize\('NFD'\)/);
  assert.match(documentViewerSource, /return 'vi';/);
  assert.doesNotMatch(documentViewerSource, /label: 'VI'/);
  assert.doesNotMatch(documentViewerSource, /Tiếng Việt/);
});

test("default English summary cache clears stale data while checking", () => {
  assert.match(
    documentViewerHookSource,
    /setSummaryState\(\{\s*loading: true,\s*generating: false,\s*error: '',\s*data: null,\s*checked: false,\s*\}\);/s,
  );
  assert.match(
    documentViewerHookSource,
    /getCachedDocumentSummary\(documentId, DEFAULT_SUMMARY_LANGUAGE\)/,
  );
});
