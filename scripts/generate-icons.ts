// Rasterizes the Kira brand mark into every PNG asset the app installs with.
//
//   npm run generate:icons
//
// Re-runnable and deterministic: the four PNGs are derived purely from
// `assets/brand/kira-mark.svg` + `brandColors`, so a design tweak means editing
// the SVG and running this again — never hand-editing a PNG.

import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { brandColors } from '../src/design/tokens';
import { adaptiveIconLayout, centeredMarkLayout } from './iconGeometry';

const ROOT = path.resolve(__dirname, '..');
const SOURCE_SVG = path.join(ROOT, 'assets/brand/kira-mark.svg');
const OUT_DIR = path.join(ROOT, 'assets');

/**
 * How much of an opaque icon canvas the glyph spans. Smaller than the Android
 * safe zone (which has to survive a launcher mask) but close enough that the
 * icon, the splash, and the adaptive icon all read at the same visual weight.
 */
const OPAQUE_GLYPH_RATIO = 0.6;

const MARK_WHITE = '#ffffff';

/** librsvg's baseline: at 96 DPI the SVG renders at its nominal pixel size. */
const SVG_BASE_DPI = 96;
/** The `width` the source SVG declares, which `density` scales against. */
const SVG_NOMINAL_SIZE = 100;

/**
 * Resolve the SVG's `currentColor` to a concrete value. Rasterizers don't
 * inherit a CSS `color` the way a browser does, so the substitution is explicit
 * — the outline and stem take `color`, the three bars keep their own fills.
 */
function tintedMark(color: string): Buffer {
  const svg = readFileSync(SOURCE_SVG, 'utf8');
  return Buffer.from(svg.replaceAll('currentColor', color), 'utf8');
}

interface RenderedMark {
  data: Buffer;
  width: number;
  height: number;
}

/**
 * Render the glyph to fit inside a `boxSize` square, transparent around it.
 *
 * Two things matter here. The SVG is rasterized at a density derived from the
 * target size, so it is drawn at full resolution rather than rendered small and
 * scaled up (which softens the edges). And the result is trimmed to the glyph's
 * own bounds first, so `boxSize` sizes the *visible mark* — the source viewBox
 * carries padding of its own, and sizing by the viewBox would leave every glyph
 * a third smaller than asked for.
 *
 * The glyph is taller than it is wide, so the returned width and height differ;
 * callers center using the actual dimensions.
 */
async function renderMark(boxSize: number, color: string): Promise<RenderedMark> {
  // Render generously (the glyph is ~60% of the viewBox, so ×2 leaves headroom)
  // and let the resize below scale down, never up.
  const density = Math.ceil((SVG_BASE_DPI * boxSize * 2) / SVG_NOMINAL_SIZE);

  const { data, info } = await sharp(tintedMark(color), { density })
    .trim()
    .resize(boxSize, boxSize, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height };
}

/** Where a rendered mark sits so it is centered on a `canvasSize` canvas. */
function centerOn(canvasSize: number, mark: RenderedMark) {
  return {
    left: Math.round((canvasSize - mark.width) / 2),
    top: Math.round((canvasSize - mark.height) / 2),
  };
}

/**
 * A fully opaque square: `brandColors.primary` edge to edge with the white mark
 * centered. No corner radius and no alpha — iOS and the browser apply their own
 * masking, and pre-rounding here would double-round.
 */
async function writeOpaqueIcon(file: string, canvasSize: number): Promise<void> {
  const { markSize } = centeredMarkLayout(canvasSize, OPAQUE_GLYPH_RATIO);
  const mark = await renderMark(markSize, MARK_WHITE);

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: brandColors.primary,
    },
  })
    .composite([{ input: mark.data, ...centerOn(canvasSize, mark) }])
    .flatten({ background: brandColors.primary })
    // Drop the alpha channel outright: iOS rejects app icons carrying one.
    .removeAlpha()
    .png()
    .toFile(path.join(OUT_DIR, file));
}

/**
 * The Android adaptive-icon foreground: white mark on transparency, inset to the
 * safe zone so a circular, squircle, or rounded-square launcher mask can't clip
 * it. The blue behind it comes from `adaptiveIcon.backgroundColor` in app.json.
 */
async function writeAdaptiveIcon(file: string, canvasSize: number): Promise<void> {
  const { markSize } = adaptiveIconLayout(canvasSize);
  const mark = await renderMark(markSize, MARK_WHITE);

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark.data, ...centerOn(canvasSize, mark) }])
    .png()
    .toFile(path.join(OUT_DIR, file));
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  await writeOpaqueIcon('icon.png', 1024);
  await writeAdaptiveIcon('adaptive-icon.png', 1024);
  await writeOpaqueIcon('splash-icon.png', 1024);
  await writeOpaqueIcon('favicon.png', 48);

  console.log(`Generated icon, adaptive-icon, splash-icon and favicon in ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
