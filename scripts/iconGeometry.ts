// Geometry for placing the Kira mark inside a square icon canvas.
//
// Split out from `generate-icons.ts` so the sizing maths is a pure function that
// can be unit-tested without rasterizing anything.

/**
 * Android's adaptive-icon safe zone: launchers mask the 108dp foreground down to
 * an inner 66dp circle/squircle/rounded square. Anything outside that circle may
 * be clipped, so the foreground glyph is scaled to fit within it.
 */
export const ANDROID_SAFE_ZONE_RATIO = 66 / 108;

export interface MarkLayout {
  /** Rendered width/height of the (square) mark, in pixels. */
  markSize: number;
  /** Left/top inset that centers the mark on the canvas, in pixels. */
  offset: number;
}

/**
 * Size the mark to `ratio` of a square `canvasSize` canvas and center it.
 *
 * The mark size is forced even so the two margins are exactly equal after
 * rounding — an odd size would leave the glyph a pixel off-center, which is
 * visible at favicon sizes.
 */
export function centeredMarkLayout(canvasSize: number, ratio: number): MarkLayout {
  if (!Number.isInteger(canvasSize) || canvasSize <= 0) {
    throw new Error(`canvasSize must be a positive integer, got ${canvasSize}`);
  }
  if (!(ratio > 0) || ratio > 1) {
    throw new Error(`ratio must be within (0, 1], got ${ratio}`);
  }

  // Round down to the nearest size that shares the canvas's parity, so
  // (canvasSize - markSize) is even and splits into two equal margins.
  const scaled = Math.floor(canvasSize * ratio);
  const markSize = scaled % 2 === canvasSize % 2 ? scaled : scaled - 1;
  if (markSize <= 0) {
    throw new Error(`canvasSize ${canvasSize} is too small for ratio ${ratio}`);
  }

  return { markSize, offset: (canvasSize - markSize) / 2 };
}

/**
 * Lay out the Android adaptive-icon foreground: the mark centered within the
 * safe zone, with transparent bleed around it for the launcher's mask.
 */
export function adaptiveIconLayout(canvasSize: number): MarkLayout {
  return centeredMarkLayout(canvasSize, ANDROID_SAFE_ZONE_RATIO);
}
