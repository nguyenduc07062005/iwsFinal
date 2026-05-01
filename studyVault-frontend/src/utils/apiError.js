const DEFAULT_FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const SERVER_CONNECTION_MESSAGE =
  'Cannot reach the server. Please check that the backend is running and try again.';

const GENERIC_MESSAGES = new Set([
  'internal server error',
  'network error',
  'request failed',
]);

const GENERIC_MESSAGE_PREFIXES = [
  'request failed with status code',
  'timeout of ',
];

const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ERR_NETWORK',
]);

const normalizeMessage = (message) =>
  typeof message === 'string' ? message.trim() : '';

const isGenericMessage = (message) => {
  const normalizedMessage = normalizeMessage(message).toLowerCase();

  return (
    !normalizedMessage ||
    GENERIC_MESSAGES.has(normalizedMessage) ||
    GENERIC_MESSAGE_PREFIXES.some((prefix) =>
      normalizedMessage.startsWith(prefix),
    )
  );
};

const getFallbackMessage = (fallbackMessage) =>
  normalizeMessage(fallbackMessage) || DEFAULT_FALLBACK_MESSAGE;

export const getApiErrorMessage = (error, fallbackMessage) => {
  const responseMessage = error?.response?.data?.message;
  const responseErrors = error?.response?.data?.errors;
  const fallback = getFallbackMessage(fallbackMessage);

  if (Array.isArray(responseMessage) && responseMessage[0]) {
    const message = normalizeMessage(responseMessage[0]);

    return isGenericMessage(message) ? fallback : message;
  }

  if (typeof responseMessage === 'string') {
    const message = normalizeMessage(responseMessage);

    if (message) {
      return isGenericMessage(message) ? fallback : message;
    }
  }

  if (Array.isArray(responseErrors) && responseErrors[0]) {
    const message = normalizeMessage(responseErrors[0]);

    return isGenericMessage(message) ? fallback : message;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (
    NETWORK_ERROR_CODES.has(error?.code) ||
    (!error?.response && error?.request)
  ) {
    return SERVER_CONNECTION_MESSAGE;
  }

  if (typeof error?.message === 'string') {
    const message = normalizeMessage(error.message);

    return isGenericMessage(message) ? fallback : message;
  }

  return fallback;
};
