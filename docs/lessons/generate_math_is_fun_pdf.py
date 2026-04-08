#!/usr/bin/env python3
"""Build Math is Fun lesson PDF from markdown (no browser required)."""
from __future__ import annotations

import re
from pathlib import Path

from fpdf import FPDF


ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "math-is-fun-age-7.md"
OUT_PATH = ROOT / "math-is-fun-age-7.pdf"


def strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4 :].lstrip("\n")
    return text


def md_to_elements(text: str) -> list[tuple[str, str]]:
    """Return list of (kind, content) where kind is h1|h2|p|hr|tr|table_start|table_end."""
    text = strip_frontmatter(text)
    lines = text.split("\n")
    out: list[tuple[str, str]] = []
    i = 0
    in_table = False
    while i < len(lines):
        line = lines[i].rstrip()
        if not line and not in_table:
            i += 1
            continue
        if line.strip() == "---":
            out.append(("hr", ""))
            i += 1
            continue
        if line.startswith("|") and "|" in line[1:]:
            if not in_table:
                out.append(("table_start", ""))
                in_table = True
            # skip markdown separator |---|---|
            if re.match(r"^\|\s*[-:]+", line):
                i += 1
                continue
            out.append(("tr", line))
            i += 1
            continue
        elif in_table:
            out.append(("table_end", ""))
            in_table = False
        if line.startswith("# "):
            out.append(("h1", line[2:].strip()))
        elif line.startswith("## "):
            out.append(("h2", line[3:].strip()))
        elif line.startswith("### "):
            out.append(("h3", line[4:].strip()))
        elif line.startswith("- "):
            out.append(("li", line[2:].strip()))
        elif re.match(r"^\d+\.\s", line):
            out.append(("li", line))
        elif line.startswith(">"):
            out.append(("quote", line.lstrip("> ").strip()))
        else:
            out.append(("p", line))
        i += 1
    if in_table:
        out.append(("table_end", ""))
    return out


def clean_inline(s: str) -> str:
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = s.replace("`", "")
    # Core PDF fonts: Latin-1 only (avoid smart punctuation from Markdown)
    for a, b in (
        ("\u00b7", " - "),
        ("\u2014", " - "),
        ("\u2013", "-"),
        ("\u201c", '"'),
        ("\u201d", '"'),
        ("\u2018", "'"),
        ("\u2019", "'"),
        ("\u2026", "..."),
        ("\u2192", "->"),
    ):
        s = s.replace(a, b)
    return s


class LessonPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="Letter", unit="mm")
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)

    def header(self) -> None:
        pass

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 4, f"Page {self.page_no()}", align="C")


def build() -> None:
    raw = MD_PATH.read_text(encoding="utf-8")
    elements = md_to_elements(raw)

    pdf = LessonPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(54, 84, 20)
    title_done = False

    for kind, content in elements:
        content = clean_inline(content)
        if kind == "h1":
            if not title_done:
                pdf.multi_cell(0, 10, content, align="C")
                pdf.ln(4)
                title_done = True
            else:
                pdf.set_font("Helvetica", "B", 16)
                pdf.set_text_color(54, 84, 20)
                pdf.ln(6)
                pdf.multi_cell(0, 8, content)
                pdf.ln(2)
        elif kind == "h2":
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(77, 124, 15)
            pdf.ln(4)
            pdf.multi_cell(0, 7, content)
            pdf.ln(1)
        elif kind == "h3":
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(40, 40, 40)
            pdf.ln(2)
            pdf.multi_cell(0, 6, content)
            pdf.ln(1)
        elif kind == "p":
            pdf.set_font("Helvetica", "", 11)
            pdf.set_text_color(26, 26, 26)
            pdf.multi_cell(0, 5.5, content)
            pdf.ln(1)
        elif kind == "li":
            pdf.set_font("Helvetica", "", 11)
            pdf.set_x(pdf.l_margin + 4)
            pdf.multi_cell(0, 5.5, "- " + content)
            pdf.ln(0.5)
        elif kind == "quote":
            pdf.set_font("Helvetica", "I", 10)
            pdf.set_fill_color(247, 254, 231)
            pdf.set_x(pdf.l_margin + 3)
            pdf.multi_cell(0, 5.5, content, fill=True)
            pdf.ln(2)
        elif kind == "hr":
            pdf.ln(2)
            pdf.set_draw_color(200, 200, 200)
            pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
            pdf.ln(4)
        elif kind == "table_start":
            pdf.ln(2)
        elif kind == "tr":
            parts = [clean_inline(c.strip()) for c in content.strip("|").split("|")]
            col_w = (pdf.w - pdf.l_margin - pdf.r_margin) / max(len(parts), 1)
            is_header = "What happens" in content
            pdf.set_font("Helvetica", "B" if is_header else "", 9)
            pdf.set_fill_color(236, 252, 203)
            h = 6
            x0 = pdf.l_margin
            y = pdf.get_y()
            for j, cell in enumerate(parts):
                pdf.set_xy(x0 + j * col_w, y)
                pdf.cell(
                    col_w,
                    h,
                    cell[:85],
                    border=1,
                    fill=is_header,
                )
            pdf.set_y(y + h)
        elif kind == "table_end":
            pdf.ln(2)

    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.ln(6)
    pdf.multi_cell(0, 4, "OllieCode - Math is Fun lesson (age 7)")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT_PATH))


if __name__ == "__main__":
    build()
    print(f"Wrote {OUT_PATH}")
