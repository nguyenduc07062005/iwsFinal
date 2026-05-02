export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');

export const buildContainsLikePattern = (value: string): string =>
  `%${escapeLikePattern(value)}%`;
