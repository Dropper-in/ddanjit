import { describe, it, expect } from 'vitest';
import { wobbleRotation, jellyTransform } from './canvasConfig';

describe('keyframe lerp', () => {
  it('키프레임 양끝값을 정확히 반환', () => {
    expect(wobbleRotation(0)).toBe(0);
    expect(wobbleRotation(1)).toBe(0);
    expect(jellyTransform(0)).toEqual({ sx: 1, sy: 1, skx: 0 });
    expect(jellyTransform(1)).toEqual({ sx: 1, sy: 1, skx: 0 });
  });

  it('구간 중간을 선형보간', () => {
    // WOBBLE_KF: t=0 r=0 → t=0.12 r=-5, 절반(0.06)이면 -2.5
    expect(wobbleRotation(0.06)).toBeCloseTo(-2.5, 5);
  });

  it('범위 밖은 클램프', () => {
    expect(wobbleRotation(-1)).toBe(0);
    expect(wobbleRotation(2)).toBe(0);
  });
});
