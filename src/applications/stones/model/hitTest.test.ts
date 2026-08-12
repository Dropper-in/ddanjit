import { describe, expect, it } from 'vitest';
import { ALPHA_HIT_THRESHOLD, isOpaquePixel } from './hitTest';

function imageData(width: number, height: number, alphas: number[]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  alphas.forEach((alpha, index) => {
    data[index * 4 + 3] = alpha;
  });

  return { width, height, data } as ImageData;
}

describe('isOpaquePixel', () => {
  it('exports the alpha threshold', () => {
    expect(ALPHA_HIT_THRESHOLD).toBe(10);
  });

  it('returns true only when the target pixel alpha exceeds the threshold', () => {
    const data = imageData(3, 1, [ALPHA_HIT_THRESHOLD, ALPHA_HIT_THRESHOLD + 1, 255]);

    expect(isOpaquePixel(data, 0, 0)).toBe(false);
    expect(isOpaquePixel(data, 1, 0)).toBe(true);
    expect(isOpaquePixel(data, 2, 0)).toBe(true);
  });

  it('floors fractional coordinates to their pixel and rejects out-of-bounds coordinates', () => {
    const data = imageData(2, 2, [0, 0, 0, 255]);

    expect(isOpaquePixel(data, 1.9, 1.1)).toBe(true);
    expect(isOpaquePixel(data, -0.1, 0)).toBe(false);
    expect(isOpaquePixel(data, 2, 0)).toBe(false);
    expect(isOpaquePixel(data, 0, 2)).toBe(false);
  });
});
