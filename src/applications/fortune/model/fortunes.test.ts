import { describe, it, expect } from 'vitest';
import { getTodayFortune } from './fortunes';

describe('getTodayFortune', () => {
  it('같은 날짜로 두 번 호출하면 동일한 운세를 반환한다', () => {
    const date = new Date(2026, 6, 14); // 2026-07-14
    const first = getTodayFortune(date);
    const second = getTodayFortune(new Date(2026, 6, 14));
    expect(second).toEqual(first);
  });

  it('여러 날짜에 걸쳐 항상 유효한 본문과 하단 문구를 반환한다', () => {
    for (let day = 1; day <= 28; day += 1) {
      const fortune = getTodayFortune(new Date(2026, 0, day));
      expect(fortune.text.length).toBeGreaterThan(0);
      expect(fortune.note.length).toBeGreaterThan(0);
    }
  });

  it('날짜가 바뀌면 운세가 최소 한 번은 달라진다', () => {
    const results = new Set<string>();
    for (let day = 1; day <= 28; day += 1) {
      results.add(getTodayFortune(new Date(2026, 0, day)).text);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
