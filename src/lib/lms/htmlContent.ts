/** True when HTML is empty or only an empty TipTap paragraph. */
export function isTrivialLessonHtml(html: string | null | undefined): boolean {
  if (html == null || html.trim() === "") return true;
  const stripped = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/\s/g, "");
  return stripped === "" || stripped === "<p></p>";
}
