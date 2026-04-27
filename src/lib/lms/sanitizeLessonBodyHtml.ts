import sanitizeHtml from "sanitize-html";

/**
 * Server-safe HTML for lesson overview + module copy. Uses `sanitize-html`
 * (no JSDOM) so Next.js does not bundle `isomorphic-dompurify` / jsdom, which
 * can throw ENOENT for default stylesheet paths under Turbopack.
 */
const LESSON_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "srcset", "alt", "title", "width", "height", "loading", "class"],
    p: ["style", "class"],
    span: ["style", "class"],
    div: ["style", "class"],
    li: ["style", "class"],
    ul: ["style", "class"],
    ol: ["style", "class"],
    h1: ["style", "class"],
    h2: ["style", "class"],
    h3: ["style", "class"],
    h4: ["style", "class"],
    strong: ["style", "class"],
    em: ["style", "class"],
    u: ["style", "class"],
    mark: ["style", "class"],
    blockquote: ["style", "class"],
    code: ["class"],
    pre: ["class"],
    table: ["class"],
    thead: ["class"],
    tbody: ["class"],
    tr: ["class"],
    th: ["class"],
    td: ["class"],
  },
  allowedStyles: {
    "*": {
      color: [
        /^#[0-9a-f]{3,8}$/i,
        /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
        /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/,
      ],
      "background-color": [
        /^#[0-9a-f]{3,8}$/i,
        /^rgb\(/,
        /^rgba\(/,
      ],
      "font-family": [/^[\w\s\-'",.:()/,&]+$/],
      "font-size": [/^\d+(?:\.\d+)?(?:px|em|rem|%)?$/],
      "line-height": [/^\d+(?:\.\d+)?(?:px)?$/],
      "text-decoration": [/^[\w\s-]+$/],
      "font-weight": [/^\d+$/, /^(bold|normal|bolder|lighter)$/],
      "font-style": [/^(italic|normal|oblique)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

export function sanitizeLessonBodyHtml(html: string | null | undefined): string {
  return sanitizeHtml(html ?? "", LESSON_HTML_OPTIONS);
}
