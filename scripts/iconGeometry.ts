// Geometry for placing the Kira mark inside a square icon canvas.
//
// Split out from `generate-icons.ts` so the sizing maths is a pure function that
// can be unit-tested without rasterizing anything.

/**
 * Android's adaptive-icon safe zone: of the 108dp foreground canvas, only the
 * inner **66dp circle** is guaranteed visible under every launcher mask. Note
 * this is a diameter, not an edge length — a glyph whose *height* is 66dp still
 * pushes its corners outside the circle and gets clipped.
 */
export const ANDROID_SAFE_ZONE_RATIO = 66 / 108;

/** A glyph's dimensions in pixels. */
export interface Size {
  width: number;
  height: number;
}

/** Where to composite a glyph so it lands centered on a square canvas. */
export interface Placement {
  left: number;
  top: number;
}

function assertCanvas(canvasSize: number): void {
  if (!Number.isInteger(canvasSize) || canvasSize <= 0) {
    throw new Error(`canvasSize must be a positive integer, got ${canvasSize}`);
  }
}

function assertSize({ width, height }: Size): void {
  if (!(width > 0) || !(height > 0)) {
    throw new Error(`glyph must have positive dimensions, got ${width}x${height}`);
  }
}

function scaleBy(glyph: Size, factor: number): Size {
  return {
    width: Math.max(1, Math.round(glyph.width * factor)),
    height: Math.max(1, Math.round(glyph.height * factor)),
  };
}

/**
 * Scale `glyph` to fit inside a square of `boxSize`, preserving aspect ratio.
 * Only ever scales down to the box; a glyph already smaller is left alone so the
 * rasterizer never upscales.
 */
export function fitWithinBox(glyph: Size, boxSize: number): Size {
  assertSize(glyph);
  if (!(boxSize > 0)) {
    throw new Error(`boxSize must be positive, got ${boxSize}`);
  }
  return scaleBy(glyph, Math.min(boxSize / glyph.width, boxSize / glyph.height));
}

/**
 * Scale `glyph` to fit inside a circle of `diameter`, preserving aspect ratio.
 *
 * The binding constraint is the glyph's **diagonal**, not its width or height:
 * a rectangle inscribed in a circle touches it at the corners. This is what
 * keeps the mark clear of a circular or squircle launcher mask.
 */
export function fitWithinCircle(glyph: Size, diameter: number): Size {
  assertSize(glyph);
  if (!(diameter > 0)) {
    throw new Error(`diameter must be positive, got ${diameter}`);
  }
  const diagonal = Math.hypot(glyph.width, glyph.height);
  return scaleBy(glyph, diameter / diagonal);
}

/**
 * Scale `glyph` to sit inside the Android adaptive-icon safe zone of a
 * `canvasSize` foreground.
 */
export function fitWithinSafeZone(glyph: Size, canvasSize: number): Size {
  assertCanvas(canvasSize);
  return fitWithinCircle(glyph, canvasSize * ANDROID_SAFE_ZONE_RATIO);
}

/** Where `glyph` goes to be centered on a `canvasSize` square canvas. */
export function centerOn(glyph: Size, canvasSize: number): Placement {
  assertCanvas(canvasSize);
  assertSize(glyph);
  return {
    left: Math.round((canvasSize - glyph.width) / 2),
    top: Math.round((canvasSize - glyph.height) / 2),
  };
}
