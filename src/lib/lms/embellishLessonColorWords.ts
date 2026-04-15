/**
 * Wraps common color words in module HTML with bold, colored `<span>`s.
 * Splits on tags so we only touch visible text (not attributes).
 */
const COLOR_WORDS: Record<string, string> = {
  red: "rgb(220, 38, 38)",
  orange: "rgb(234, 88, 12)",
  yellow: "rgb(202, 138, 4)",
  gold: "rgb(180, 134, 11)",
  green: "rgb(22, 163, 74)",
  lime: "rgb(101, 163, 13)",
  blue: "rgb(37, 99, 235)",
  cyan: "rgb(6, 182, 212)",
  indigo: "rgb(67, 56, 202)",
  violet: "rgb(109, 40, 217)",
  purple: "rgb(126, 34, 206)",
  magenta: "rgb(192, 38, 211)",
  pink: "rgb(219, 39, 119)",
  brown: "rgb(120, 53, 15)",
  black: "rgb(17, 24, 39)",
  gray: "rgb(107, 114, 128)",
  grey: "rgb(107, 114, 128)",
  silver: "rgb(148, 163, 184)",
  white: "rgb(71, 85, 105)",
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Longest keys first so "dark green" doesn't match "green" first incorrectly — we only match whole words. */
const SORTED_COLOR_NAMES = Object.keys(COLOR_WORDS).sort(
  (a, b) => b.length - a.length,
);

const COLOR_WORD_PATTERN = new RegExp(
  `\\b(${SORTED_COLOR_NAMES.map(escapeRegExp).join("|")})\\b`,
  "gi",
);

function embellishTextSegment(text: string): string {
  return text.replace(COLOR_WORD_PATTERN, (match) => {
    const key = match.toLowerCase();
    const color = COLOR_WORDS[key];
    if (!color) return match;
    return `<span style="color: ${color}; font-weight: 700">${match}</span>`;
  });
}

/**
 * Color-name words in lesson module HTML render in that color (bold).
 * Safe for strings that already contain HTML tags.
 */
export function embellishLessonColorWords(html: string | null | undefined): string {
  if (html == null || html.trim() === "") return html ?? "";
  const parts = html.split(/(<[^>]+>)/);
  return parts
    .map((part) => (part.startsWith("<") ? part : embellishTextSegment(part)))
    .join("");
}
