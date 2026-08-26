"""
INFRA-XRAY — PDF Reader
Extracts raw text from PDFs via pdfplumber, multi-page safe.
"""

import pdfplumber


def extract_text_from_pdf(filepath: str) -> str:
    pages = []
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    return "\n\n".join(pages)
