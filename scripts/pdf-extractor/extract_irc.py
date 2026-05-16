#!/usr/bin/env python3
"""IRC PDF Extraction Orchestrator.

Converts a raw IRC PDF into the canonical extracted/ format consumed by ingest.js.

Usage:
    python extract_irc.py --pdf raw/IRC_38_2022.pdf --code "IRC:38" --edition 2022 --out extracted/IRC_38
    python extract_irc.py --pdf ... --code "IRC:38" --edition 2022 --out ... --no-figures
    python extract_irc.py ... --dry-run

System requirements:
    pip install -r requirements.txt
    sudo apt install tesseract-ocr  (or: brew install tesseract)
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

import fitz  # pymupdf

from extract_text import extract_clauses_from_pages, write_clause_files
from extract_tables import extract_tables
from extract_figures import extract_figures
from ocr_pages import is_scanned, ocr_page


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Extract IRC PDF to canonical format")
    p.add_argument("--pdf", required=True, help="Path to source PDF file")
    p.add_argument("--code", required=True, help="IRC code identifier, e.g. 'IRC:38'")
    p.add_argument("--edition", required=True, type=int, help="Edition year, e.g. 2022")
    p.add_argument("--out", required=True, help="Output directory (will be created)")
    p.add_argument("--no-figures", action="store_true", help="Skip figure extraction (Phase 1 default)")
    p.add_argument("--dry-run", action="store_true", help="Validate only; do not write files")
    p.add_argument("--dpi", type=int, default=300, help="DPI for OCR rendering (default 300)")
    p.add_argument("--title", default="", help="Full title of the IRC code (optional)")
    p.add_argument("--supersedes", default="", help="Comma-separated list of superseded editions")
    return p.parse_args()


def collect_page_texts(doc: fitz.Document, dpi: int) -> tuple[list[str], list[int], list[dict]]:
    """Return (page_texts, scanned_page_nums, ocr_quality) for the whole document."""
    page_texts = []
    scanned_pages = []
    ocr_quality = []

    for page_num, page in enumerate(doc, start=1):
        if is_scanned(page):
            scanned_pages.append(page_num)
            text, conf = ocr_page(page, dpi=dpi)
            page_texts.append(text)
            ocr_quality.append({"page": page_num, "confidence": round(conf, 1)})
        else:
            page_texts.append(page.get_text(sort=True))

    return page_texts, scanned_pages, ocr_quality


def build_index(code: str, edition_year: int, title: str, total_pages: int,
                supersedes: list[str], clauses: list[dict],
                tables: list[dict], figures: list[dict]) -> dict:
    return {
        "code": code,
        "full_title": title or code,
        "edition_year": edition_year,
        "total_pages": total_pages,
        "supersedes": supersedes,
        "superseded_by": None,
        "clauses": clauses,
        "tables": tables,
        "figures": figures,
    }


def build_report(code: str, edition_year: int, total_pages: int,
                 scanned_pages: list[int], ocr_quality: list[dict],
                 clauses: list[dict], tables: list[dict], figures: list[dict],
                 warnings: list[str]) -> dict:
    low_conf = [q for q in ocr_quality if q["confidence"] < 70]
    report_warnings = list(warnings)
    if low_conf:
        report_warnings.append(
            f"OCR confidence < 70% on pages: {[q['page'] for q in low_conf]} — verify manually"
        )
    table_strategies = {}
    for t in tables:
        s = t.get("_strategy", "unknown")
        table_strategies[s] = table_strategies.get(s, 0) + 1
    if table_strategies.get("pymupdf-find_tables", 0) > 0:
        report_warnings.append(
            f"{table_strategies['pymupdf-find_tables']} table(s) used pymupdf fallback — check for missed columns"
        )
    return {
        "code": code,
        "edition_year": edition_year,
        "total_pages": total_pages,
        "scanned_pages": scanned_pages,
        "ocr_pages": scanned_pages,
        "ocr_quality": ocr_quality,
        "clauses_extracted": len(clauses),
        "tables_extracted": len(tables),
        "figures_extracted": len(figures),
        "table_extraction_strategies": table_strategies,
        "low_confidence_clauses": [],
        "failed_tables": [],
        "extraction_date": date.today().isoformat(),
        "warnings": report_warnings,
    }


def main() -> None:
    args = parse_args()
    pdf_path = Path(args.pdf).resolve()
    out_dir = Path(args.out).resolve()

    if not pdf_path.exists():
        print(f"ERROR: PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    if not args.dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    supersedes = [s.strip() for s in args.supersedes.split(",") if s.strip()] if args.supersedes else []

    print(f"Opening {pdf_path.name} ...")
    doc = fitz.open(str(pdf_path))
    total_pages = len(doc)
    print(f"  {total_pages} pages")

    print("Step 1/4 — Collecting page text (OCR where needed) ...")
    page_texts, scanned_pages, ocr_quality = collect_page_texts(doc, args.dpi)
    if scanned_pages:
        print(f"  OCR applied to pages: {scanned_pages}")

    print("Step 2/4 — Extracting clauses ...")
    raw_clauses = extract_clauses_from_pages(doc, page_texts)
    print(f"  {len(raw_clauses)} clauses found")

    clause_manifest = []
    if not args.dry_run and raw_clauses:
        clause_manifest = write_clause_files(raw_clauses, args.code, args.edition, out_dir)

    print("Step 3/4 — Extracting tables ...")
    warnings = []
    if not args.dry_run:
        table_manifest = extract_tables(doc, str(pdf_path), args.code, args.edition, out_dir)
    else:
        table_manifest = []
    print(f"  {len(table_manifest)} tables found")

    print("Step 4/4 — Extracting figures ...")
    figure_manifest = []
    if not args.no_figures and not args.dry_run:
        figure_manifest = extract_figures(doc, args.code, args.edition, out_dir)
    print(f"  {len(figure_manifest)} figures found (Phase 1: stub active)")

    doc.close()

    index = build_index(
        args.code, args.edition, args.title, total_pages,
        supersedes, clause_manifest, table_manifest, figure_manifest
    )
    report = build_report(
        args.code, args.edition, total_pages,
        scanned_pages, ocr_quality,
        clause_manifest, table_manifest, figure_manifest, warnings
    )

    if not args.dry_run:
        (out_dir / "index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
        (out_dir / "extraction-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"\nOutput written to: {out_dir}")
    else:
        print("\nDRY RUN — no files written")

    print(f"\nSummary: {len(clause_manifest)} clauses | {len(table_manifest)} tables | "
          f"{len(figure_manifest)} figures | {len(scanned_pages)} OCR pages")
    if report["warnings"]:
        print("Warnings:")
        for w in report["warnings"]:
            print(f"  ⚠  {w}")


if __name__ == "__main__":
    main()
