"""Clause extraction from digital PDF pages using pymupdf.

Algorithm:
  - Detect headings by bold font flag + font size > body average
  - Clause numbers: r'^\\d+(\\.\\d+)*\\s' pattern at heading start
  - Multi-column layout: sort=True in get_text reorders left-to-right
  - Table-of-contents pages: skipped when >60% lines match TOC pattern
"""

import re
from pathlib import Path
import fitz
import yaml

CLAUSE_NUM_RE = re.compile(r"^(\d+(?:\.\d+)*)\s+\w")
TOC_LINE_RE = re.compile(r"^\s*\d+(?:\.\d+)?\s+.{5,80}\s+\d+\s*$")
BOLD_FLAG = 2**4


def _estimate_body_size(blocks: list) -> float:
    sizes = []
    for block in blocks:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                if span["text"].strip():
                    sizes.append(span["size"])
    if not sizes:
        return 10.0
    sizes.sort()
    return sizes[len(sizes) // 2]


def _is_toc_page(page: fitz.Page) -> bool:
    lines = [l.strip() for l in page.get_text().splitlines() if l.strip()]
    if not lines:
        return False
    toc_lines = sum(1 for l in lines if TOC_LINE_RE.match(l))
    return toc_lines / len(lines) > 0.6


def _is_heading(span: dict, body_size: float) -> bool:
    is_bold = bool(span["flags"] & BOLD_FLAG)
    is_larger = span["size"] > body_size * 1.05
    return is_bold or is_larger


def extract_clauses_from_pages(doc: fitz.Document, page_texts: list[str]) -> list[dict]:
    """Extract clauses from pre-collected per-page text strings.

    page_texts: list of text strings (one per page, already OCR'd or digital).
    Returns list of clause dicts with keys: id, title, page, content.
    """
    clauses = []
    current_id = None
    current_title = ""
    current_content_lines = []
    current_page = 1

    for page_num, (page, page_text) in enumerate(zip(doc, page_texts), start=1):
        if _is_toc_page(page):
            continue

        blocks = page.get_text("dict", sort=True)["blocks"]
        body_size = _estimate_body_size(blocks)

        for block in blocks:
            for line in block.get("lines", []):
                line_text = " ".join(s["text"] for s in line["spans"]).strip()
                if not line_text:
                    continue

                # Check if any span in this line is a heading
                is_head = any(_is_heading(s, body_size) for s in line["spans"] if s["text"].strip())
                clause_match = CLAUSE_NUM_RE.match(line_text) if is_head else None

                if clause_match:
                    # Save previous clause
                    if current_id and current_content_lines:
                        clauses.append({
                            "id": current_id,
                            "title": current_title,
                            "page": current_page,
                            "content": "\n".join(current_content_lines).strip(),
                        })
                    current_id = clause_match.group(1)
                    current_title = line_text.strip()
                    current_content_lines = []
                    current_page = page_num
                elif current_id:
                    # Check for footnote (small font at page bottom — font < body*0.85)
                    avg_size = sum(s["size"] for s in line["spans"] if s["text"].strip()) / max(
                        len([s for s in line["spans"] if s["text"].strip()]), 1
                    )
                    if avg_size < body_size * 0.85:
                        current_content_lines.append(f"[Note: {line_text}]")
                    else:
                        current_content_lines.append(line_text)

    if current_id and current_content_lines:
        clauses.append({
            "id": current_id,
            "title": current_title,
            "page": current_page,
            "content": "\n".join(current_content_lines).strip(),
        })

    return clauses


def write_clause_files(clauses: list[dict], code: str, edition_year: int, out_dir: Path) -> list[dict]:
    """Write each clause to a markdown file with YAML frontmatter.

    Returns list of clause manifest entries for index.json.
    """
    clauses_dir = out_dir / "clauses"
    clauses_dir.mkdir(exist_ok=True)
    manifest = []

    for clause in clauses:
        safe_id = clause["id"].replace(".", "_")
        filename = f"clause_{safe_id}.md"
        filepath = clauses_dir / filename

        frontmatter = {
            "code": code,
            "clause": clause["id"],
            "edition_year": edition_year,
            "title": clause["title"],
            "page": clause["page"],
        }
        content = f"---\n{yaml.dump(frontmatter, default_flow_style=False)}---\n\n{clause['content']}\n"
        filepath.write_text(content, encoding="utf-8")

        manifest.append({
            "id": clause["id"],
            "title": clause["title"],
            "page": clause["page"],
            "file": f"clauses/{filename}",
        })

    return manifest
