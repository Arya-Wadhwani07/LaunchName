import { describe, expect, it } from "vitest";
import { color } from "@/theme/tokens";

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

function hue(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function saturation(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
}

function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const GOLDEN_ANGLE = 137.5;

describe("golden-ratio palette", () => {
  it("places the contrast (secondary) color one golden angle from the base hue", () => {
    const expected = (hue(color.primary.main) + GOLDEN_ANGLE) % 360;
    expect(Math.abs(hue(color.secondary.main) - expected)).toBeLessThan(2);
  });

  it("derives the support color from the base hue with ~60% less saturation", () => {
    expect(Math.abs(hue(color.support.main) - hue(color.primary.main))).toBeLessThan(2);
    const ratio = saturation(color.support.main) / saturation(color.primary.main);
    expect(ratio).toBeGreaterThan(0.3);
    expect(ratio).toBeLessThan(0.5);
  });

  it("keeps neutral surfaces stepping up in lightness", () => {
    const l = (hex: string) => hexToRgb(hex).reduce((a, b) => a + b, 0);
    expect(l(color.surface.default)).toBeGreaterThan(l(color.canvas));
    expect(l(color.surface.raised)).toBeGreaterThan(l(color.surface.default));
    expect(l(color.surface.border)).toBeGreaterThan(l(color.surface.raised));
  });
});

describe("accessibility (WCAG AA, 4.5:1 for text)", () => {
  const grounds = { canvas: color.canvas, surface: color.surface.default, raised: color.surface.raised };
  const texts = {
    primary: color.ink.primary,
    secondary: color.ink.secondary,
    faint: color.ink.disabled,
    violetLight: color.primary.light,
    amber: color.secondary.main,
    support: color.support.main,
    success: color.success.main,
  };
  for (const [gName, g] of Object.entries(grounds)) {
    for (const [tName, t] of Object.entries(texts)) {
      it(`${tName} text on ${gName} passes AA`, () => {
        expect(contrast(t, g)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
