/**
 * Human-readable file size formatting.
 *
 * Shared across DocumentService and FolderService so both use the
 * same implementation (previously duplicated with different size arrays).
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Safely extract an error message from an unknown thrown value.
 */
export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';
