// Maps core Category icon tokens to Ionicons glyph names (UI-side concern).

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, IoniconName> = {
  cart: 'cart',
  utensils: 'restaurant',
  car: 'car',
  receipt: 'receipt',
  film: 'film',
  bag: 'bag-handle',
  dots: 'ellipsis-horizontal',
  cup: 'cafe',
  mug: 'cafe',
};

export function ioniconFor(token: string): IoniconName {
  return ICONS[token] ?? 'pricetag';
}

/** Icon tokens offered when creating/re-iconing a category. */
export const ICON_CHOICES = Object.keys(ICONS);
