export const extractErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'error' in error.response.data
  ) {
    if (typeof error.response.data.error === 'string') return error.response.data.error;
    try {
      return JSON.stringify(error.response.data.error);
    } catch {
      // ignore serialization failure and return fallback
    }
  }

  return fallbackMessage;
};
