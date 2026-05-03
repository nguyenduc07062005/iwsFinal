const SUMMARY_TEXT_FIELDS = [
  'text',
  'content',
  'point',
  'title',
  'description',
  'summary',
  'label',
  'value',
];

const normalizeSummaryText = (value) => {
  if (typeof value === 'string') {
    return value.replace(/\s+/g, ' ').trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

const normalizeSummaryPoint = (point) => {
  const directText = normalizeSummaryText(point);

  if (directText) {
    return directText;
  }

  if (!point || typeof point !== 'object' || Array.isArray(point)) {
    return '';
  }

  const candidate = point;
  const title = normalizeSummaryText(candidate.title);
  const description =
    normalizeSummaryText(candidate.description) ||
    normalizeSummaryText(candidate.content) ||
    normalizeSummaryText(candidate.text);

  if (title && description && title !== description) {
    return `${title}: ${description}`;
  }

  if (title || description) {
    return title || description;
  }

  for (const field of SUMMARY_TEXT_FIELDS) {
    const fieldText = normalizeSummaryText(candidate[field]);

    if (fieldText) {
      return fieldText;
    }
  }

  return '';
};

const getSummaryKeyPoints = (summary) => {
  const rawKeyPoints = Array.isArray(summary?.key_points)
    ? summary.key_points
    : Array.isArray(summary?.keyPoints)
      ? summary.keyPoints
      : [];

  return rawKeyPoints
    .map((point) => normalizeSummaryPoint(point))
    .filter(Boolean);
};

const getSummaryVersions = (summary) => {
  const versions = summary?.versions;

  if (Array.isArray(versions)) {
    return versions.filter(
      (version) =>
        version && typeof version === 'object' && !Array.isArray(version),
    );
  }

  if (versions && typeof versions === 'object') {
    return Object.values(versions).filter(
      (version) =>
        version && typeof version === 'object' && !Array.isArray(version),
    );
  }

  return [];
};

const getActiveSummary = (summary) => {
  const versions = getSummaryVersions(summary);

  if (versions.length > 0) {
    return versions.find((version) => version.active) || versions[0];
  }

  return summary && typeof summary === 'object' && !Array.isArray(summary)
    ? summary
    : null;
};

export {
  getActiveSummary,
  getSummaryKeyPoints,
  getSummaryVersions,
  normalizeSummaryPoint,
  normalizeSummaryText,
};
