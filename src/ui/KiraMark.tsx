// The Kira brand glyph, on its own and on a transparent background.
//
// The geometry below is a transcription of `assets/brand/kira-mark.svg` — the
// single source of truth. If the mark changes, edit that file, re-run
// `npm run generate:icons`, and mirror the new coordinates here; never redraw
// them by hand.

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { brandColors } from '../design/tokens';

export interface KiraMarkProps {
  /** Rendered width and height in pixels; the mark is square. */
  size: number;
  /**
   * Outline and stem color — the SVG source's `currentColor`. Defaults to white
   * for the mark's home surface, the brand-primary tile. Pass a darker value to
   * keep the glyph legible on a light background.
   */
  color?: string;
}

export function KiraMark({ size, color = '#FFFFFF' }: KiraMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M30 22 H70 V72 L63.3 77 L56.7 72 L50 77 L43.3 72 L36.7 77 L30 72 Z"
        stroke={color}
        strokeWidth={5.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <Rect x={38} y={32.5} width={6} height={30.5} rx={3} fill={color} />
      {/* The three sticker bars are fixed brand colors — they never take `color`. */}
      <Rect x={47} y={32.5} width={15} height={6.5} rx={3.25} fill={brandColors.sky} />
      <Rect x={47} y={44.5} width={8} height={6.5} rx={3.25} fill={brandColors.purple} />
      <Rect x={47} y={56.5} width={15} height={6.5} rx={3.25} fill={brandColors.pink} />
    </Svg>
  );
}
