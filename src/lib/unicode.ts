// LinkedIn has no rich text, so "bold" / "italic" use Unicode Mathematical Sans-Serif letters.
const UPPER = 65, LOWER = 97, DIGIT = 48;
const BOLD = { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec };
const ITALIC = { upper: 0x1d608, lower: 0x1d622, digit: null as number | null };

type Style = "bold" | "italic";
const sets: Record<Style, { upper: number; lower: number; digit: number | null }> = { bold: BOLD, italic: ITALIC };

function toPlainChar(cp: number): number {
  for (const s of Object.values(sets)) {
    if (cp >= s.upper && cp < s.upper + 26) return UPPER + (cp - s.upper);
    if (cp >= s.lower && cp < s.lower + 26) return LOWER + (cp - s.lower);
    if (s.digit && cp >= s.digit && cp < s.digit + 10) return DIGIT + (cp - s.digit);
  }
  return cp;
}

export function toPlain(text: string) {
  return Array.from(text).map((c) => String.fromCodePoint(toPlainChar(c.codePointAt(0)!))).join("");
}

function isStyled(text: string, style: Style) {
  const s = sets[style];
  return Array.from(text).some((c) => {
    const cp = c.codePointAt(0)!;
    return (cp >= s.upper && cp < s.upper + 52) || (s.digit !== null && cp >= s.digit && cp < s.digit + 10);
  });
}

/** Toggle a style on a piece of text. */
export function toggleStyle(text: string, style: Style) {
  if (isStyled(text, style)) return toPlain(text);
  const s = sets[style];
  return Array.from(toPlain(text))
    .map((c) => {
      const cp = c.codePointAt(0)!;
      if (cp >= UPPER && cp < UPPER + 26) return String.fromCodePoint(s.upper + cp - UPPER);
      if (cp >= LOWER && cp < LOWER + 26) return String.fromCodePoint(s.lower + cp - LOWER);
      if (s.digit !== null && cp >= DIGIT && cp < DIGIT + 10) return String.fromCodePoint(s.digit + cp - DIGIT);
      return c;
    })
    .join("");
}
