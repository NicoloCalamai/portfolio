"""Genera gli asset del sito a partire dal PDF del portfolio e dall'immagine della stanza.

Uso (dalla cartella del repo):
    python tools/build_assets.py

Richiede: PyMuPDF (pip install pymupdf) e Pillow.
"""
import io
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "Portfolio - Calamai Nicolò.pdf"
ROOM = ROOT / "stanza defdef.jpg"
OUT = ROOT / "site" / "assets"

# Pagine mostrate come galleria nelle schede progetto (numerazione del PDF, da 1).
GALLERY_PAGES = [*range(6, 14), 15, 16, 18, *range(22, 26), *range(27, 33), *range(34, 42)]
# Pagine introduttive da cui estrarre l'immagine principale (la più grande della pagina).
HERO_PAGES = {"pensilina": 5, "sgabello": 14, "more": 17, "fanzine": 21, "about": 2}
# Prime pagine dei singoli poster e magliette: il loro titolo viene tolto dall'immagine.
TITLE_PAGES = [27, 29, 31, 34, 36, 38, 40]
WIDTHS = (1920, 1100)


def save_webp(img: Image.Image, path: Path, quality=80):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, method=6)


def render(page, clip=None, width=1920):
    rect = clip or page.rect
    pix = page.get_pixmap(matrix=fitz.Matrix(width / rect.width, width / rect.width), clip=clip)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def remove_titles(page):
    """Toglie il titolo in alto a sinistra (es. "Vectorial Artwork" / "Fiat 131 Abarth"): sul sito è già nell'intestazione."""
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                x0, y0, x1, y1 = span["bbox"]
                if span["size"] >= 31 and y1 <= 160 and x0 < 700:
                    page.add_redact_annot(fitz.Rect(span["bbox"]), fill=False)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)


def main():
    doc = fitz.open(PDF)
    for n in TITLE_PAGES:
        remove_titles(doc[n - 1])

    for n in GALLERY_PAGES:
        big = render(doc[n - 1], width=WIDTHS[0])
        for w in WIDTHS:
            img = big if w == big.width else big.resize((w, round(big.height * w / big.width)), Image.LANCZOS)
            save_webp(img, OUT / "pages" / f"p{n:02d}-{w}.webp")

    for name, n in HERO_PAGES.items():
        page = doc[n - 1]
        boxes = [i["bbox"] for i in page.get_image_info() if i["bbox"]]
        bbox = fitz.Rect(max(boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))) & page.rect
        if name == "about":
            bbox.y1 = 560  # esclude la scritta "CIAO," che si sovrappone alla foto
        save_webp(render(page, clip=bbox, width=1400), OUT / "hero" / f"{name}.webp", quality=82)

    # Icone delle soft skill (pagina 2), in ordine di lettura: righe dall'alto, poi da sinistra.
    about = doc[1]
    icons = [i for i in about.get_image_info(xrefs=True) if i["width"] == 300]
    icons.sort(key=lambda i: (i["bbox"][1] // 100, i["bbox"][0]))
    for n, info in enumerate(icons, 1):
        save_webp(render(about, clip=fitz.Rect(info["bbox"]), width=160), OUT / "icons" / f"skill-{n}.webp", quality=90)

    # Copertine dei 6 progetti, ritagliate dall'indice a pagina 3.
    index = doc[2]
    for i in range(6):
        x = 36 + 310 * i
        save_webp(render(index, clip=fitz.Rect(x, 222, x + 298, 584), width=600), OUT / "thumbs" / f"{i + 1:02d}.webp")

    room = Image.open(ROOM).convert("RGB")
    save_webp(room, OUT / "room.webp", quality=82)
    save_webp(room.resize((1721, 914), Image.LANCZOS), OUT / "room-1721.webp", quality=82)

    total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
    print(f"asset generati in {OUT} ({total / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
