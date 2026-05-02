import assert from 'node:assert/strict';
import test from 'node:test';
import {
  landingFaq,
  landingFeatures,
  landingHero,
  landingStats,
} from './landingContent.js';

test('landing hero points guests to registration and returning users to the app', () => {
  assert.equal(landingHero.primaryCta.href, '/register');
  assert.equal(landingHero.authenticatedCta.href, '/app');
  assert.match(landingHero.title, /study/i);
});

test('landing page covers the core StudyVault product pillars', () => {
  assert.equal(landingFeatures.length >= 4, true);
  assert.equal(landingStats.length >= 3, true);
  assert.equal(landingFaq.length >= 3, true);

  const featureText = landingFeatures
    .map((feature) => `${feature.title} ${feature.description}`)
    .join(' ');

  assert.match(featureText, /PDF|document|library/i);
  assert.match(featureText, /folder/i);
  assert.match(featureText, /AI|summar/i);
  assert.match(featureText, /private|secure/i);
});

test('landing copy is business-facing instead of implementation-facing', () => {
  const publicCopy = [
    landingHero.title,
    landingHero.subtitle,
    ...landingStats.flatMap((stat) => [stat.label, stat.value]),
    ...landingFeatures.flatMap((feature) => [
      feature.title,
      feature.description,
    ]),
    ...landingFaq.flatMap((item) => [item.question, item.answer]),
  ].join(' ');

  assert.match(publicCopy, /study|coursework|exam|university/i);
  assert.match(publicCopy, /organize|summarize|AI|workspace/i);
  assert.doesNotMatch(
    publicCopy,
    /JWT|CSRF|HttpOnly|RAG|pgvector|PostgreSQL|Docker|backend|frontend|MIME|magic bytes|authenticated owner id/i,
  );
});
