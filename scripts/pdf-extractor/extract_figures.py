"""Figure extraction — Phase 2.

Phase 1: stub that creates the figures/ directory and returns an empty list.
Phase 2: uncomment the full implementation below.
"""

import re
import json
from pathlib import Path
import fitz


CAPTION_PATTERN = re.compile(r"\b(Fig(?:ure)?\.?\s*\d+)", re.IGNORECASE)


def extract_figures(doc: fitz.Document, code: str, edition_year: int, out_dir: Path) -> list[dict]:
    """Extract figures from a PDF document.

    Phase 1: returns [] and creates an empty figures/ directory.
    """
    figures_dir = out_dir / "figures"
    figures_dir.mkdir(exist_ok=True)

    # Phase 2 implementation — uncomment when figure extraction is needed:
    #
    # figures = []
    # for page_num, page in enumerate(doc):
    #     captions = _find_captions(page)
    #     for cap_text, cap_rect in captions:
    #         match = CAPTION_PATTERN.search(cap_text)
    #         if not match:
    #             continue
    #         fig_id = match.group(1).strip()
    #         safe_id = fig_id.replace(" ", "_").replace(".", "")
    #         # Render clip above caption
    #         clip = fitz.Rect(cap_rect.x0, cap_rect.y0 - 300, cap_rect.x1, cap_rect.y0)
    #         clip &= page.rect
    #         pix = page.get_pixmap(clip=clip, dpi=300)
    #         img_file = f"{safe_id}.png"
    #         pix.save(figures_dir / img_file)
    #         sidecar = {
    #             "code": code,
    #             "figure_id": fig_id,
    #             "edition_year": edition_year,
    #             "title": cap_text.strip(),
    #             "page": page_num + 1,
    #             "image_file": f"figures/{img_file}",
    #             "description": "",
    #             "alt_text": "",
    #             "extractable_values": False,
    #             "refer_to_tables": [],
    #         }
    #         (figures_dir / f"{safe_id}.json").write_text(json.dumps(sidecar, indent=2))
    #         figures.append({"id": fig_id, "title": cap_text.strip(),
    #                          "page": page_num + 1, "file": f"figures/{safe_id}.json"})
    # return figures

    return []


def _find_captions(page: fitz.Page) -> list[tuple[str, fitz.Rect]]:
    """Find figure caption spans on a page."""
    results = []
    blocks = page.get_text("dict", sort=True)["blocks"]
    for block in blocks:
        for line in block.get("lines", []):
            line_text = " ".join(s["text"] for s in line["spans"])
            if CAPTION_PATTERN.search(line_text):
                rect = fitz.Rect(line["bbox"])
                results.append((line_text, rect))
    return results
