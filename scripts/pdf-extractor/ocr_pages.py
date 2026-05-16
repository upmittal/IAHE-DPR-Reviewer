"""OCR for scanned/bitmap pages using Tesseract."""

import fitz
from PIL import Image
import pytesseract


SCANNED_CHAR_THRESHOLD = 50


def is_scanned(page: fitz.Page) -> bool:
    """Return True if the page has too little selectable text to be digital."""
    return len(page.get_text().strip()) < SCANNED_CHAR_THRESHOLD


def ocr_page(page: fitz.Page, dpi: int = 300) -> tuple[str, float]:
    """Render page to image and run Tesseract OCR.

    Returns (text, confidence) where confidence is 0–100.
    """
    pix = page.get_pixmap(dpi=dpi)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    data = pytesseract.image_to_data(img, config="--psm 6 -l eng", output_type=pytesseract.Output.DICT)
    text = pytesseract.image_to_string(img, config="--psm 6 -l eng")

    confs = [int(c) for c in data["conf"] if str(c).lstrip("-").isdigit() and int(c) >= 0]
    avg_conf = sum(confs) / len(confs) if confs else 0.0

    return text.strip(), avg_conf
