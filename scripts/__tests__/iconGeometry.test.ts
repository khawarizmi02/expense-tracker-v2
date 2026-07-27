// The one piece of real logic in icon generation: fitting the mark inside a
// canvas (notably Android's adaptive-icon safe zone, which is what keeps the
// glyph from being clipped by a circular launcher mask).

import {
  ANDROID_SAFE_ZONE_RATIO,
  adaptiveIconLayout,
  centeredMarkLayout,
} from '../iconGeometry';

describe('centeredMarkLayout', () => {
  it('scales the mark by the ratio and centers it', () => {
    expect(centeredMarkLayout(1000, 0.5)).toEqual({ markSize: 500, offset: 250 });
  });

  it('keeps the mark centered when rounding is needed', () => {
    const { markSize, offset } = centeredMarkLayout(1024, 0.66);
    // Left and right margins must match, or the glyph sits off-center.
    expect(1024 - markSize - offset).toBe(offset);
  });

  it('fills the canvas at a ratio of 1', () => {
    expect(centeredMarkLayout(512, 1)).toEqual({ markSize: 512, offset: 0 });
  });

  it('never lets the mark exceed the canvas', () => {
    for (const size of [48, 192, 512, 1024, 1284]) {
      const { markSize, offset } = centeredMarkLayout(size, ANDROID_SAFE_ZONE_RATIO);
      expect(markSize + 2 * offset).toBeLessThanOrEqual(size);
      expect(markSize).toBeGreaterThan(0);
      expect(offset).toBeGreaterThanOrEqual(0);
    }
  });

  it('rejects a canvas that is not a positive integer', () => {
    expect(() => centeredMarkLayout(0, 0.5)).toThrow();
    expect(() => centeredMarkLayout(-100, 0.5)).toThrow();
    expect(() => centeredMarkLayout(100.5, 0.5)).toThrow();
  });

  it('rejects a ratio outside (0, 1]', () => {
    expect(() => centeredMarkLayout(100, 0)).toThrow();
    expect(() => centeredMarkLayout(100, 1.2)).toThrow();
  });

  it('is deterministic', () => {
    expect(centeredMarkLayout(1024, 0.66)).toEqual(centeredMarkLayout(1024, 0.66));
  });
});

describe('adaptiveIconLayout', () => {
  it('fits the mark within Android’s ~66% safe zone', () => {
    const canvas = 1024;
    const { markSize } = adaptiveIconLayout(canvas);
    expect(markSize).toBeLessThanOrEqual(Math.round(canvas * ANDROID_SAFE_ZONE_RATIO));
  });

  it('leaves enough bleed that a circular mask cannot clip the glyph', () => {
    // A circular mask inscribes the canvas; the mark's corners must fall inside
    // it, i.e. the mark's diagonal must not exceed the canvas diameter.
    const canvas = 1024;
    const { markSize } = adaptiveIconLayout(canvas);
    expect(markSize * Math.SQRT2).toBeLessThanOrEqual(canvas);
  });

  it('uses the standard 66/108 safe-zone ratio', () => {
    expect(ANDROID_SAFE_ZONE_RATIO).toBeCloseTo(66 / 108, 10);
  });
});
