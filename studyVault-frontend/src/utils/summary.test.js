import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getActiveSummary,
  getSummaryKeyPoints,
  getSummaryVersions,
  normalizeSummaryPoint,
  normalizeSummaryText,
} from './summary.js';

test('normalizes summary text fields to safe renderable strings', () => {
  assert.equal(normalizeSummaryText('  Core   ideas  '), 'Core ideas');
  assert.equal(normalizeSummaryText(42), '42');
  assert.equal(normalizeSummaryText({ title: 'Invalid child' }), '');
});

test('normalizes mixed legacy key point shapes to strings', () => {
  assert.deepEqual(
    getSummaryKeyPoints({
      key_points: [
        ' Direct point ',
        { title: 'Architecture', description: 'Layered services' },
        { text: 'Text field point' },
        { content: 'Content field point' },
        null,
        { nested: { value: 'ignored' } },
      ],
    }),
    [
      'Direct point',
      'Architecture: Layered services',
      'Text field point',
      'Content field point',
    ],
  );
});

test('supports camelCase key point responses', () => {
  assert.deepEqual(
    getSummaryKeyPoints({
      keyPoints: [{ point: 'Camel case point' }],
    }),
    ['Camel case point'],
  );
});

test('filters invalid summary versions before choosing the active summary', () => {
  const summary = {
    versions: [
      null,
      { title: 'Default summary' },
      { title: 'Custom summary', active: true },
    ],
  };

  assert.deepEqual(getSummaryVersions(summary), [
    { title: 'Default summary' },
    { title: 'Custom summary', active: true },
  ]);
  assert.deepEqual(getActiveSummary(summary), {
    title: 'Custom summary',
    active: true,
  });
});

test('normalizes object-shaped key points without returning React children objects', () => {
  assert.equal(
    normalizeSummaryPoint({ label: 'Fallback label', detail: 'ignored' }),
    'Fallback label',
  );
  assert.equal(normalizeSummaryPoint({ nested: { value: 'ignored' } }), '');
});
