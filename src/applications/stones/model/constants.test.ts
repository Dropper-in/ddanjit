import { describe, it, expect } from 'vitest';
import { getReactions } from './constants';

describe('getReactions', () => {
  it('happy=true면 긍정 반응을 반환한다', () => {
    const reactions = getReactions(true);
    expect(reactions.length).toBeGreaterThan(0);
    expect(reactions).toContain('♥');
  });

  it('happy=false면 부정 반응을 반환한다', () => {
    const reactions = getReactions(false);
    expect(reactions.length).toBeGreaterThan(0);
    expect(reactions).toContain('ㅠㅠ');
  });

  it('happy true/false는 서로 다른 배열을 반환한다', () => {
    expect(getReactions(true)).not.toEqual(getReactions(false));
  });
});
