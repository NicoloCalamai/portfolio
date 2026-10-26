"""Genera gli asset del sito a partire dal PDF del portfolio e dalle immagini della stanza (orizzontale e per telefono).

Uso (dalla cartella del repo):
    python tools/build_assets.py

Richiede: PyMuPDF (pip install pymupdf) e Pillow.
"""
import io
import json
import re
from html import escape as html_escape
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "Portfolio def.pdf"
ROOM = ROOT / "stanza defdef.jpg"
ROOM_PHONE = ROOT / "grafica telefono def.jpg"
OUT = ROOT / "site" / "assets"

# Pagine mostrate come galleria nelle schede progetto (numerazione del PDF, da 1).
GALLERY_PAGES = [*range(6, 14), 15, 16, 18, *range(22, 26), *range(27, 33), *range(34, 42)]
# Pagine introduttive da cui estrarre l'immagine principale (la più grande della pagina).
HERO_PAGES = {"pensilina": 5, "sgabello": 14, "more": 17, "fanzine": 21, "about": 2}
# Prime pagine dei singoli poster e magliette: il loro titolo viene tolto dall'immagine.
TITLE_PAGES = [27, 29, 31, 34, 36, 38, 40]
WIDTHS = (1920, 1100)

# Versione per telefono delle tavole: ogni pagina diventa una colonna di blocchi, nell'ordine di lettura.
# ("t", x0, y0, x1, y1) = testo estratto dal PDF in quel riquadro; ("i", ...) = ritaglio dell'immagine.
# Coordinate in punti del PDF (pagina 1920 x 1080).
HEAD = ("t", 0, 15, 960, 100)  # titolo di sezione in alto a sinistra ("RENDER", "Mockup", ...)
THREE_TALL = [("i", 35, 35, 645, 1046), ("i", 655, 35, 1265, 1046), ("i", 1275, 35, 1885, 1046)]
THREE_TALL_HEAD = [HEAD, ("i", 35, 118, 645, 1046), ("i", 655, 118, 1265, 1046), ("i", 1275, 118, 1885, 1046)]
SPREADS = [("i", 36, 120, 588, 515), ("i", 684, 118, 1237, 516), ("i", 1332, 120, 1884, 515),
           ("t", 0, 545, 960, 625), ("i", 36, 649, 588, 1045), ("i", 684, 649, 1236, 1045), ("i", 1332, 649, 1884, 1045)]
PHONE_LAYOUT = {
    6: [HEAD, ("i", 25, 100, 975, 1065), ("t", 975, 15, 1920, 370), ("i", 990, 560, 1900, 1065)],
    7: [("t", 0, 15, 640, 200), ("i", 80, 210, 600, 1060), ("i", 650, 75, 1900, 1060)],
    8: [HEAD, ("i", 0, 100, 1920, 1080)],
    9: [HEAD, ("i", 20, 100, 640, 980), ("i", 670, 100, 1900, 1000)],
    10: [HEAD, ("i", 25, 110, 1275, 1055), ("i", 1285, 110, 1900, 1055)],
    11: [HEAD, ("i", 25, 180, 1270, 905), ("i", 1270, 180, 1900, 905)],
    12: [HEAD, ("i", 25, 110, 955, 1055), ("i", 966, 110, 1900, 1055)],
    13: [HEAD, ("i", 25, 110, 1275, 1055), ("t", 1580, 105, 1900, 265), ("i", 1280, 270, 1900, 1055)],
    15: [HEAD, ("i", 25, 100, 900, 480), ("t", 25, 540, 700, 600), ("i", 25, 600, 1240, 1060), ("i", 1250, 90, 1900, 1060)],
    16: THREE_TALL,
    18: [("i", 0, 0, 1920, 1080)],
    22: [HEAD, ("i", 25, 110, 920, 750), ("t", 25, 750, 660, 1060), ("i", 950, 110, 1900, 1055)],
    23: [("t", 0, 15, 960, 100), *SPREADS],
    24: [("t", 0, 15, 960, 100), *SPREADS],
    25: THREE_TALL,
    27: [("t", 25, 105, 660, 600), ("i", 30, 625, 655, 1055), ("i", 690, 50, 1420, 1025), ("i", 1440, 25, 1895, 1055)],
    28: [("i", 35, 175, 1326, 905), ("i", 1384, 15, 1896, 1080)],
    29: [("t", 25, 105, 660, 600), ("i", 30, 625, 655, 1050), ("i", 660, 180, 1435, 900), ("i", 1440, 25, 1895, 1055)],
    30: [("i", 0, 0, 645, 1080), ("i", 655, 36, 1265, 1044), ("i", 1275, 29, 1900, 1080)],
    31: [("t", 25, 155, 660, 640), ("i", 30, 650, 655, 1055), ("i", 660, 25, 1445, 1055), ("i", 1445, 25, 1895, 1055)],
    32: [("i", 25, 25, 1054, 1055), ("i", 1054, 25, 1895, 1055)],
    34: [("t", 25, 165, 660, 475), ("i", 30, 485, 655, 660), ("t", 25, 695, 660, 1060), ("i", 700, 25, 1895, 1060)],
    35: THREE_TALL_HEAD,
    36: [("t", 25, 165, 660, 615), ("i", 30, 630, 655, 775), ("t", 25, 785, 660, 1060), ("i", 690, 25, 1895, 1060)],
    37: THREE_TALL_HEAD,
    38: [("t", 25, 165, 660, 530), ("i", 30, 545, 655, 715), ("t", 25, 750, 660, 1060), ("i", 690, 25, 1895, 1060)],
    39: [HEAD, ("i", 35, 120, 955, 1044), ("i", 965, 120, 1885, 1044)],
    40: [("t", 25, 165, 660, 275), ("i", 30, 280, 655, 545), ("t", 25, 550, 660, 1060), ("i", 690, 40, 1895, 1060)],
    41: [("i", 0, 0, 1920, 1080)],
}
PHONE_WIDTH = 1100  # larghezza massima dei ritagli (un telefono è largo ~390 px x 3)


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


def text_html(page, rect):
    """Testo dei blocchi dentro `rect` come HTML: titoli di sezione (corpo >= 40) in <h3>, sottotitoli (>= 30) in <h4>,
    righe "- " in elenchi, Demi/Medium in grassetto. Uno stacco verticale tra le righe inizia un nuovo paragrafo."""
    out = []
    blocks = [b for b in page.get_text("dict")["blocks"] if b["type"] == 0 and fitz.Rect(b["bbox"]) in fitz.Rect(rect)]
    for block in sorted(blocks, key=lambda b: (round(b["bbox"][1]), b["bbox"][0])):
        items = []  # [tipo, html]: "p" paragrafo, "li" voce di elenco, "h3"/"h4" titoli
        prev_bottom = None
        for line in block["lines"]:
            spans = [s for s in line["spans"] if s["text"].strip()]
            if not spans:
                continue
            size = max(s["size"] for s in spans)
            gap = prev_bottom is not None and line["bbox"][1] - prev_bottom > size * 0.6
            prev_bottom = line["bbox"][3]
            html = ""
            for s in line["spans"]:
                t = html_escape(s["text"])
                html += f"<strong>{t}</strong>" if ("Demi" in s["font"] or "Medium" in s["font"]) and t.strip() else t
            html = re.sub(r"\s+", " ", html.replace("</strong><strong>", "")).strip()
            plain = re.sub(r"<[^>]+>", "", html)
            kind = "h3" if size >= 40 else "h4" if size >= 30 else "li" if plain.startswith("-") else "p"
            if kind == "li":
                html = re.sub(r"^(<strong>)?-\s*", r"\1", html)
            if items and not gap and (kind != "li" and items[-1][0] == kind or kind == "p" and items[-1][0] == "li"):
                items[-1][1] += " " + html
            else:
                items.append([kind, html])
        for kind, html in items:
            html = html.replace("<strong> ", " <strong>").replace(" </strong>", "</strong> ").replace("<strong></strong>", "")
            html = re.sub(r"</strong>\s+<strong>", " ", html)
            html = re.sub(r"\s+", " ", html).strip()
            out.append(f"<li>{html}</li>" if kind == "li" else f"<{kind}>{html}</{kind}>")
    # voci di elenco consecutive in un unico <ul>
    return re.sub(r"((?:<li>.*?</li>)+)", r"<ul>\1</ul>", "".join(out))


def build_phone_pages(doc):
    pages = {}
    for n, layout in PHONE_LAYOUT.items():
        page, blocks = doc[n - 1], []
        for i, (kind, *rect) in enumerate(layout, 1):
            if kind == "t":
                html = text_html(page, rect)
                if html:
                    blocks.append({"html": html})
                continue
            clip = fitz.Rect(rect) & page.rect
            width = min(PHONE_WIDTH, round(clip.width * 2))
            img = render(page, clip=clip, width=width)
            name = f"p{n:02d}-{i}.webp"
            save_webp(img, OUT / "phone" / name, quality=78)
            blocks.append({"src": f"assets/phone/{name}", "w": img.width, "h": img.height, "rect": [round(v) for v in clip]})
        pages[n] = blocks
    js = "// Generato da tools/build_assets.py: tavole del PDF riorganizzate in verticale per telefono.\n"
    js += f"window.PHONE_PAGES = {json.dumps(pages, ensure_ascii=False, indent=1)};\n"
    (ROOT / "site" / "pages-phone.js").write_text(js, encoding="utf-8")


def main():
    doc = fitz.open(PDF)
    for n in TITLE_PAGES:
        remove_titles(doc[n - 1])

    for n in GALLERY_PAGES:
        big = render(doc[n - 1], width=WIDTHS[0])
        for w in WIDTHS:
            img = big if w == big.width else big.resize((w, round(big.height * w / big.width)), Image.LANCZOS)
            save_webp(img, OUT / "pages" / f"p{n:02d}-{w}.webp")
    build_phone_pages(doc)

    for name, n in HERO_PAGES.items():
        page = doc[n - 1]
        boxes = [i["bbox"] for i in page.get_image_info() if i["bbox"]]
        bbox = fitz.Rect(max(boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))) & page.rect
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
    save_webp(Image.open(ROOM_PHONE).convert("RGB"), OUT / "room-phone.webp", quality=82)

    total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
    print(f"asset generati in {OUT} ({total / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
