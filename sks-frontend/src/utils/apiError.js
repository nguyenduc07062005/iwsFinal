export const getApiErrorMessage = (error, fallbackMessage) => {
  const responseMessage = error?.response?.data?.message;
  const responseErrors = error?.response?.data?.errors;

  if (Array.isArray(responseMessage) && responseMessage[0]) {
    return responseMessage[0];
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  if (Array.isArray(responseErrors) && responseErrors[0]) {
    return responseErrors[0];
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};
