"""Table extraction from IRC PDFs.

Strategy 1 — pdfplumber (grid/line detection): best for bordered tables.
Strategy 2 — pymupdf find_tables() (>=1.23): handles borderless tables.
Post-processing normalises header rows and multi-line cells.
"""

import re
import json
from pathlib import Path
import fitz
import pdfplumber

TABLE_TITLE_RE = re.compile(r"^(Table\s+\d+(?:\.\d+)?)", re.IGNORECASE)
BOLD_FLAG = 2**4


def _find_table_title_above(page: fitz.Page, table_bbox: tuple, max_search_pt: float = 60.0) -> str:
    """Search text blocks immediately above a table bounding box for a title."""
    x0, y0, x1, _ = table_bbox
    search_rect = fitz.Rect(x0 - 20, y0 - max_search_pt, x1 + 20, y0)
    candidates = []
    for block in page.get_text("dict", sort=True)["blocks"]:
        bx0, by0, bx1, by1 = block["bbox"]
        if by1 <= y0 and by1 >= y0 - max_search_pt:
            text = " ".join(
                s["text"] for line in block.get("lines", []) for s in line.get("spans", [])
            ).strip()
            if text:
                candidates.append((by1, text))
    if candidates:
        candidates.sort(key=lambda c: c[0], reverse=True)
        return candidates[0][1]
    return ""


def _normalise_cell(cell) -> str:
    if cell is None:
        return ""
    return " ".join(str(cell).split())


def _detect_header_row(rows: list[list[str]], page: fitz.Page, table_bbox: tuple) -> int:
    """Return index of the header row (usually 0, but detect by bold font if possible)."""
    return 0


def _extract_with_pdfplumber(pdf_path: str, page_num: int) -> list[list[list[str]]]:
    """Extract tables from a page using pdfplumber. Returns list of tables (each is list of rows)."""
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[page_num]
        raw_tables = page.extract_tables({
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "snap_tolerance": 3,
            "join_tolerance": 3,
            "edge_min_length": 3,
            "min_words_vertical": 3,
            "min_words_horizontal": 1,
        })
        result = []
        for table in (raw_tables or []):
            normalised = [[_normalise_cell(cell) for cell in row] for row in table if any(c for c in row)]
            if normalised:
                result.append(normalised)
        return result


def _extract_with_pymupdf(page: fitz.Page) -> list[list[list[str]]]:
    """Extract tables using pymupdf find_tables() (fallback for borderless tables)."""
    try:
        finder = page.find_tables()
        result = []
        for table in finder.tables:
            rows = []
            for row in table.extract():
                normalised = [_normalise_cell(cell) for cell in row]
                if any(normalised):
                    rows.append(normalised)
            if rows:
                result.append(rows)
        return result
    except AttributeError:
        # pymupdf < 1.23 does not have find_tables
        return []


def extract_tables(doc: fitz.Document, pdf_path: str, code: str, edition_year: int, out_dir: Path) -> list[dict]:
    """Extract all tables from a PDF document and write JSON files.

    Returns list of table manifest entries for index.json.
    """
    tables_dir = out_dir / "tables"
    tables_dir.mkdir(exist_ok=True)

    manifest = []
    table_counter = 0

    for page_num, page in enumerate(doc):
        # Try pdfplumber first
        raw_tables = _extract_with_pdfplumber(pdf_path, page_num)
        strategy = "pdfplumber"

        if not raw_tables:
            raw_tables = _extract_with_pymupdf(page)
            strategy = "pymupdf-find_tables"

        for raw_rows in raw_tables:
            if len(raw_rows) < 2:
                continue

            header_idx = _detect_header_row(raw_rows, page, (0, 0, page.rect.width, page.rect.height))
            headers = raw_rows[header_idx]
            data_rows = raw_rows[header_idx + 1:]

            table_counter += 1
            table_id = f"Table {table_counter}"

            title = _find_table_title_above(page, (0, 0, page.rect.width, page.rect.height))
            if TABLE_TITLE_RE.match(title):
                table_id = TABLE_TITLE_RE.match(title).group(1)

            safe_id = table_id.replace(" ", "_").lower()
            filename = f"{safe_id}.json"

            table_data = {
                "code": code,
                "table_id": table_id,
                "edition_year": edition_year,
                "title": title or table_id,
                "page": page_num + 1,
                "headers": headers,
                "rows": data_rows,
                "notes": [],
                "cross_reference": [],
                "_extraction_strategy": strategy,
            }
            (tables_dir / filename).write_text(json.dumps(table_data, indent=2, ensure_ascii=False), encoding="utf-8")

            manifest.append({
                "id": table_id,
                "title": title or table_id,
                "page": page_num + 1,
                "file": f"tables/{filename}",
                "_strategy": strategy,
            })

    return manifest
