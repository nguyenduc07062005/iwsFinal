import { buildContainsLikePattern } from './like-pattern';

describe('buildContainsLikePattern', () => {
  it('escapes SQL LIKE wildcard and escape characters', () => {
    expect(buildContainsLikePattern('a%_b\\')).toBe('%a\\%\\_b\\\\%');
  });
});
