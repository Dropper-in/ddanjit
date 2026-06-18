import { describe, it, expect } from 'vitest';
import { formatClock } from './config';

describe('formatClock', () => {
  it('오전 시간을 올바르게 포맷한다', () => {
    expect(formatClock(new Date(2026, 0, 1, 9, 5))).toBe('오전 9:05');
  });

  it('오후 시간을 올바르게 포맷한다', () => {
    expect(formatClock(new Date(2026, 0, 1, 14, 30))).toBe('오후 2:30');
  });

  it('자정(0시)은 오전 12시로 표시한다', () => {
    expect(formatClock(new Date(2026, 0, 1, 0, 0))).toBe('오전 12:00');
  });

  it('정오(12시)는 오후 12시로 표시한다', () => {
    expect(formatClock(new Date(2026, 0, 1, 12, 0))).toBe('오후 12:00');
  });

  it('분이 한 자리면 0으로 패딩한다', () => {
    expect(formatClock(new Date(2026, 0, 1, 15, 7))).toBe('오후 3:07');
  });
});
