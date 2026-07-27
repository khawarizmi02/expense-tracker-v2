// The Kira lockup: the brand tile, the mark inside it, and the "Kira" wordmark.
//
// Everything scales continuously from `size` (the tile's edge length) so the
// lockup is correct at any size, not just the two the design doc drew.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brandColors, typography } from '../design/tokens';
import { KiraMark } from './KiraMark';

export interface KiraWordmarkProps {
  /** Edge length of the brand tile in pixels; the rest of the lockup follows. */
  size: number;
}

/**
 * How much of the tile the mark's viewBox spans. The viewBox carries its own
 * padding — the glyph fills roughly 60% of it — so drawing it near full-bleed
 * lands the visible mark at about 60% of the tile, matching the app icon.
 */
const GLYPH_RATIO = 0.98;

/**
 * Text size as a function of tile size, fitted through the design doc's two
 * reference lockups: a 40px tile with 28px text, and a 26px tile with 18px text.
 */
function textSizeFor(tileSize: number): number {
  const slope = (28 - 18) / (40 - 26);
  return slope * tileSize + (28 - slope * 40);
}

export function KiraWordmark({ size }: KiraWordmarkProps) {
  const fontSize = textSizeFor(size);
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            // Squircle-ish corner, proportional so it holds at every size.
            borderRadius: size * 0.28,
          },
        ]}
      >
        <KiraMark size={size * GLYPH_RATIO} />
      </View>
      <Text
        style={{
          marginLeft: size * 0.3,
          fontFamily: typography.fontFamily.bold,
          fontSize,
          lineHeight: fontSize * 1.2,
          // Tight tracking: the wordmark reads as one unit, not four letters.
          letterSpacing: fontSize * -0.03,
          color: brandColors.primary,
        }}
      >
        Kira
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  tile: {
    backgroundColor: brandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
