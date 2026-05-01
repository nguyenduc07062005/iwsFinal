import assert from 'node:assert/strict';
import test from 'node:test';
import {
  landingFeatureCards,
  landingHero,
  landingProofPoints,
  landingSecurityPoints,
  landingWorkflowSteps,
} from './landingContent.js';

test('landing hero points guests to registration and returning users to the app', () => {
  assert.equal(landingHero.primaryCta.href, '/register');
  assert.equal(landingHero.secondaryCta.href, '/login');
  assert.equal(landingHero.authenticatedCta.href, '/app');
  assert.match(landingHero.title, /study/i);
});

test('landing page covers the core StudyVault product pillars', () => {
  assert.equal(landingFeatureCards.length >= 4, true);
  assert.equal(landingWorkflowSteps.length, 4);
  assert.equal(landingProofPoints.length >= 3, true);

  const featureText = landingFeatureCards
    .map((feature) => `${feature.title} ${feature.description}`)
    .join(' ');

  assert.match(featureText, /document/i);
  assert.match(featureText, /folder/i);
  assert.match(featureText, /AI|summar/i);
  assert.match(featureText, /private|privacy|account/i);
});

test('landing copy is business-facing instead of implementation-facing', () => {
  const publicCopy = [
    landingHero.eyebrow,
    landingHero.title,
    landingHero.subtitle,
    ...landingHero.metrics.flatMap((metric) => [metric.label, metric.value]),
    ...landingFeatureCards.flatMap((feature) => [
      feature.title,
      feature.description,
    ]),
    ...landingWorkflowSteps.flatMap((step) => [step.title, step.description]),
    ...landingProofPoints.flatMap((point) => [point.label, point.value]),
    ...landingSecurityPoints,
  ].join(' ');

  assert.match(publicCopy, /study smarter|review faster|exam|project/i);
  assert.match(publicCopy, /organize|summarize|ask AI|workspace/i);
  assert.doesNotMatch(
    publicCopy,
    /JWT|CSRF|HttpOnly|RAG|pgvector|PostgreSQL|Docker|backend|frontend|MIME|magic bytes|authenticated owner id/i,
  );
});
