/**
 * Checks if a response object contains an error field and throws if found
 * Handles API responses that return 200 status but contain error messages
 * Used by both search and express agent utilities
 */
export const checkResponseForErrors = (responseData: unknown) => {
  if (typeof responseData === 'object' && responseData !== null && 'error' in responseData) {
    const errorMessage =
      typeof responseData.error === 'string' ? responseData.error : JSON.stringify(responseData.error);
    throw new Error(`You.com API Error: ${errorMessage}`);
  }
  return responseData;
};
