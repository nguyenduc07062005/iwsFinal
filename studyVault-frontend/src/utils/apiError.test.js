import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiErrorMessage } from './apiError.js';

test('returns a meaningful API validation message when one is provided', () => {
  const message = getApiErrorMessage(
    {
      response: {
        data: {
          message: 'Invalid email format',
        },
      },
    },
    'Registration failed.',
  );

  assert.equal(message, 'Invalid email format');
});

test('maps network failures to a user-facing server connection message', () => {
  const message = getApiErrorMessage(
    {
      code: 'ERR_NETWORK',
      message: 'Network Error',
      request: {},
    },
    'Could not load documents.',
  );

  assert.equal(
    message,
    'Cannot reach the server. Please check that the backend is running and try again.',
  );
});

test('uses the action fallback instead of generic server errors', () => {
  const message = getApiErrorMessage(
    {
      response: {
        status: 500,
        data: {
          message: 'Internal server error',
        },
      },
    },
    'The document could not be uploaded. Please check the file and try again.',
  );

  assert.equal(
    message,
    'The document could not be uploaded. Please check the file and try again.',
  );
});

test('keeps actionable server errors even when the status is 500', () => {
  const message = getApiErrorMessage(
    {
      response: {
        status: 500,
        data: {
          message:
            'The document could not be saved. Please try again in a moment.',
        },
      },
    },
    'Upload failed.',
  );

  assert.equal(
    message,
    'The document could not be saved. Please try again in a moment.',
  );
});
