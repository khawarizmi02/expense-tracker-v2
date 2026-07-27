// The one piece of real logic in icon generation: fitting the mark inside a
// canvas (notably Android's adaptive-icon safe zone, which is what keeps the
// glyph from being clipped by a circular launcher mask).

import {
  ANDROID_SAFE_ZONE_RATIO,
  centerOn,
  fitWithinBox,
  fitWithinCircle,
  fitWithinSafeZone,
  type Size,
} from '../iconGeometry';

/** The Kira glyph's real trimmed proportions — taller than it is wide. */
const GLYPH: Size = { width: 470, height: 624 };

/** Half-diagonal from the center: how far the glyph's corners reach. */
function inkRadius(glyph: Size): number {
  return Math.hypot(glyph.width, glyph.height) / 2;
}

describe('fitWithinBox', () => {
  it('scales the longest side down to the box', () => {
    expect(fitWithinBox({ width: 100, height: 200 }, 100)).toEqual({
      width: 50,
      height: 100,
    });
  });

  it('preserves the aspect ratio', () => {
    const fitted = fitWithinBox(GLYPH, 600);
    expect(fitted.width / fitted.height).toBeCloseTo(GLYPH.width / GLYPH.height, 2);
  });

  it('never exceeds the box on either axis', () => {
    const fitted = fitWithinBox(GLYPH, 613);
    expect(fitted.width).toBeLessThanOrEqual(613);
    expect(fitted.height).toBeLessThanOrEqual(613);
  });

  it('rejects a non-positive box or glyph', () => {
    expect(() => fitWithinBox(GLYPH, 0)).toThrow();
    expect(() => fitWithinBox({ width: 0, height: 10 }, 100)).toThrow();
  });
});

describe('fitWithinCircle', () => {
  it('fits a square by its diagonal, not its edge', () => {
    // A square inscribed in a circle of diameter 100 has sides 100/√2 ≈ 70.7.
    expect(fitWithinCircle({ width: 10, height: 10 }, 100)).toEqual({
      width: 71,
      height: 71,
    });
  });

  it('keeps the glyph’s corners inside the circle', () => {
    const fitted = fitWithinCircle(GLYPH, 500);
    // Allow a half-pixel for rounding.
    expect(inkRadius(fitted)).toBeLessThanOrEqual(250.5);
  });

  it('preserves the aspect ratio', () => {
    const fitted = fitWithinCircle(GLYPH, 500);
    expect(fitted.width / fitted.height).toBeCloseTo(GLYPH.width / GLYPH.height, 2);
  });
});

describe('fitWithinSafeZone', () => {
  it('keeps the glyph inside Android’s 66dp safe circle', () => {
    const canvas = 1024;
    const fitted = fitWithinSafeZone(GLYPH, canvas);
    const safeRadius = (canvas * ANDROID_SAFE_ZONE_RATIO) / 2;

    expect(inkRadius(fitted)).toBeLessThanOrEqual(safeRadius + 0.5);
  });

  it('survives the circular mask a launcher actually applies', () => {
    // Launchers show the inner 72dp of the 108dp canvas — wider than the safe
    // zone, so clearing the safe zone must clear the mask with room to spare.
    const canvas = 1024;
    const fitted = fitWithinSafeZone(GLYPH, canvas);
    const visibleRadius = (canvas * (72 / 108)) / 2;

    expect(inkRadius(fitted)).toBeLessThan(visibleRadius);
  });

  it('holds at every canvas size we generate', () => {
    for (const canvas of [48, 192, 512, 1024]) {
      const fitted = fitWithinSafeZone(GLYPH, canvas);
      const safeRadius = (canvas * ANDROID_SAFE_ZONE_RATIO) / 2;

      expect(inkRadius(fitted)).toBeLessThanOrEqual(safeRadius + 0.5);
      expect(fitted.width).toBeGreaterThan(0);
    }
  });

  it('uses the standard 66/108 safe-zone ratio', () => {
    expect(ANDROID_SAFE_ZONE_RATIO).toBeCloseTo(66 / 108, 10);
  });

  it('rejects a canvas that is not a positive integer', () => {
    expect(() => fitWithinSafeZone(GLYPH, 0)).toThrow();
    expect(() => fitWithinSafeZone(GLYPH, -100)).toThrow();
    expect(() => fitWithinSafeZone(GLYPH, 100.5)).toThrow();
  });

  it('is deterministic', () => {
    expect(fitWithinSafeZone(GLYPH, 1024)).toEqual(fitWithinSafeZone(GLYPH, 1024));
  });
});

describe('centerOn', () => {
  it('splits the leftover canvas evenly', () => {
    expect(centerOn({ width: 400, height: 600 }, 1000)).toEqual({ left: 300, top: 200 });
  });

  it('centers a glyph that is taller than it is wide', () => {
    const canvas = 1024;
    const glyph = { width: 470, height: 624 };
    const { left, top } = centerOn(glyph, canvas);

    expect(canvas - glyph.width - left).toBe(left);
    expect(canvas - glyph.height - top).toBe(top);
  });
});
