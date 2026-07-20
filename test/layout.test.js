import { describe, expect, it } from 'vitest';
import { expandTokenVariants, swapKeyboardEnToRu } from '../lib/layout.js';

describe('expandTokenVariants', () => {
  it('maps EN keyboard layout mistype to RU', () => {
    expect(swapKeyboardEnToRu('ghbdtn')).toBe('привет');
    const variants = expandTokenVariants('ghbdtn', {
      fuzzyLayout: true,
      fuzzyTransliteration: false,
    });
    expect(variants).toContain('привет');
  });

  it('includes original token', () => {
    const variants = expandTokenVariants('hello', { fuzzyLayout: true });
    expect(variants).toContain('hello');
  });

  it('respects disabled fuzzy layout', () => {
    const variants = expandTokenVariants('ghbdtn', {
      fuzzyLayout: false,
      fuzzyTransliteration: false,
    });
    expect(variants).toEqual(['ghbdtn']);
  });
});
