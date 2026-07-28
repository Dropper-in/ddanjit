import { describe, it, expect } from 'vitest';
import { getFortuneById, getTodayFortune } from './fortunes';

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

  it('같은 날짜라도 기기ID가 다르면 결과가 갈린다', () => {
    const date = new Date(2026, 6, 21);
    const results = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      results.add(getTodayFortune(date, `device-${i}`).text);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('기기ID가 같으면 날짜별로 매일 다시 결정된다(고정되지 않음)', () => {
    const deviceId = 'fixed-device';
    const results = new Set<string>();
    for (let day = 1; day <= 28; day += 1) {
      results.add(getTodayFortune(new Date(2026, 0, day), deviceId).text);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('같은 날짜 + 같은 기기ID면 항상 동일하다', () => {
    const a = getTodayFortune(new Date(2026, 6, 21), 'same-device');
    const b = getTodayFortune(new Date(2026, 6, 21), 'same-device');
    expect(b).toEqual(a);
  });

  it('같은 운세 조합은 안정적인 ID를 가진다', () => {
    const first = getTodayFortune(new Date(2026, 6, 21), 'same-device');
    const second = getTodayFortune(new Date(2026, 6, 21), 'same-device');
    expect(first.id).toBe(second.id);
  });

  it('ID로 본문과 하단 문구를 함께 복원한다', () => {
    const fortune = getTodayFortune(new Date(2026, 6, 21), 'share-device');
    expect(getFortuneById(fortune.id)).toEqual(fortune);
  });

  it('존재하지 않는 ID는 undefined를 반환한다', () => {
    expect(getFortuneById('fortune-not-found')).toBeUndefined();
  });
});
