"""Genera tutto ciò che serve ai motori di ricerca a partire dai contenuti di site/projects.js e site/pages-phone.js.

Uso (dalla cartella del repo), da rilanciare ogni volta che cambiano testi o progetti:
    python tools/build_seo.py

Richiede: Node.js (per leggere i file .js dei contenuti) e Pillow.

Produce:
- in site/index.html: titolo, descrizione, Open Graph e dati strutturati (tra <!--seo--> e <!--/seo-->);
- una pagina vera per ogni progetto, elemento di collezione e per l'About (site/progetti/…/index.html, site/about/index.html).
  Sono copie di index.html con i propri metadati e con il testo della scheda già scritto nell'HTML:
  il visitatore vede il sito di sempre con la scheda aperta, Google trova una pagina con il suo contenuto;
- site/404.html, site/sitemap.xml, site/robots.txt e le immagini di anteprima per i social (site/assets/og/).
"""
import json
import re
import shutil
import subprocess
from datetime import date
from html import escape
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
BASE = "https://nicolocalamai.com"
NAME = "Nicolò Calamai"
OG_SIZE = (1200, 630)
CATEGORY = {"product": "Product design", "graphic": "Graphic design"}

HOME_TITLE = f"{NAME} — Product e Graphic Designer | Portfolio"
HOME_DESC = (
    f"Portfolio di {NAME}, product e graphic designer di Bisuschio (Varese), laureato in Design alla LABA di Brescia. "
    "Prototipi in scala reale, arredo, mobilità, fanzine, t-shirt e poster automotive."
)


def load_content():
    script = """
      const vm = require("vm"), fs = require("fs");
      const ctx = { window: {} };
      for (const f of ["projects.js", "pages-phone.js"]) vm.runInNewContext(fs.readFileSync(f, "utf8"), ctx);
      process.stdout.write(JSON.stringify(ctx.window));
    """
    out = subprocess.run(["node", "-e", script], cwd=SITE, capture_output=True, check=True)
    return json.loads(out.stdout.decode("utf-8"))


# ---------- testo ----------
def inline(s):
    s = escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    return re.sub(r"\[\[(.+?)\]\]", r"\1", s)


def plain(s):
    return re.sub(r"\*\*|\[\[|\]\]", "", s).replace("\n- ", " ").lstrip("- ")


def blocks(paragraphs):
    out = []
    for block in paragraphs:
        lines = block.split("\n")
        if all(l.startswith("- ") for l in lines):
            out.append("<ul>" + "".join(f"<li>{inline(l[2:])}</li>" for l in lines) + "</ul>")
        else:
            out.append(f"<p>{inline(block)}</p>")
    return "".join(out)


def clip(text, n=158):
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= n:
        return text
    return text[: n - 1].rsplit(" ", 1)[0].rstrip(",;:") + "…"


def info_line(entry):
    return f"<strong>{escape(entry[0])}:</strong> {inline(entry[1])}" if isinstance(entry, list) else inline(entry)


def page_src(n, w=1100):
    return f"assets/pages/p{n:02d}-{w}.webp?v=2"


def project_name(p):
    return " ".join(p["title"])


def project_path(p, item=None):
    return f"/progetti/{p['id']}/" + (f"{item['id']}/" if item else "")


# ---------- immagini di anteprima (1200 × 630, JPG: va bene per WhatsApp, LinkedIn, Facebook, X) ----------
def og_image(src, name, mode):
    out = SITE / "assets" / "og" / f"{name}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(SITE / src.split("?")[0]).convert("RGB")
    W, H = OG_SIZE
    if mode == "contain":  # immagine intera su sfondo del suo stesso colore (le foto dei progetti)
        bg = Image.new("RGB", OG_SIZE, im.getpixel((2, 2)))
        im.thumbnail((W - 80, H - 60), Image.LANCZOS)
        bg.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
        im = bg
    else:  # riempie tagliando i bordi (tavole e stanza)
        k = max(W / im.width, H / im.height)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        x, y = (im.width - W) // 2, (im.height - H) // 2
        im = im.crop((x, y, x + W, y + H))
    im.save(out, "JPEG", quality=84, optimize=True, progressive=True)
    return f"{BASE}/assets/og/{name}.jpg"


# ---------- dati strutturati ----------
def person(about):
    instagram = [c["value"] for c in about["contacts"] if c["type"] == "instagram" and c.get("value")]
    return {
        "@type": "Person",
        "@id": f"{BASE}/#nicolo",
        "name": NAME,
        "givenName": "Nicolò",
        "familyName": "Calamai",
        "url": f"{BASE}/",
        "image": f"{BASE}/assets/hero/about.webp",
        "jobTitle": "Product Designer e Graphic Designer",
        "email": f"mailto:{about['email']}",
        "address": {"@type": "PostalAddress", "addressLocality": "Bisuschio", "addressRegion": "VA", "addressCountry": "IT"},
        "homeLocation": {"@type": "Place", "name": "Bisuschio, Varese, Lombardia, Italia"},
        "alumniOf": [
            {"@type": "CollegeOrUniversity", "name": "LABA – Libera Accademia di Belle Arti di Brescia"},
            {"@type": "HighSchool", "name": "Liceo Artistico A. Frattini, Varese"},
        ],
        "hasCredential": {"@type": "EducationalOccupationalCredential", "name": "Laurea triennale in Design", "credentialCategory": "degree"},
        "knowsAbout": ["Product design", "Graphic design", "Industrial design", "Prototipazione", "Modellazione 3D", "Stampa 3D", *about["software"]],
        "sameAs": [f"https://www.instagram.com/{v.lstrip('@')}/" for v in instagram],
    }


def website():
    return {"@type": "WebSite", "@id": f"{BASE}/#website", "url": f"{BASE}/", "name": f"{NAME} — Portfolio", "inLanguage": "it-IT", "author": {"@id": f"{BASE}/#nicolo"}}


def breadcrumbs(trail):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": name, "item": f"{BASE}{path}"} for i, (name, path) in enumerate(trail)],
    }


# ---------- <head> ----------
def head(title, desc, path, image, graph, og_type="website", noindex=False):
    url = f"{BASE}{path}"
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    lines = [
        f"<title>{escape(title)}</title>",
        f'<meta name="description" content="{escape(desc)}">',
    ]
    if noindex:
        lines.append('<meta name="robots" content="noindex">')
    else:
        lines += [
            f'<link rel="canonical" href="{url}">',
            f'<meta name="author" content="{NAME}">',
            f'<meta property="og:type" content="{og_type}">',
            f'<meta property="og:site_name" content="{NAME} — Portfolio">',
            '<meta property="og:locale" content="it_IT">',
            f'<meta property="og:url" content="{url}">',
            f'<meta property="og:title" content="{escape(title)}">',
            f'<meta property="og:description" content="{escape(desc)}">',
            f'<meta property="og:image" content="{image}">',
            f'<meta property="og:image:width" content="{OG_SIZE[0]}">',
            f'<meta property="og:image:height" content="{OG_SIZE[1]}">',
            '<meta name="twitter:card" content="summary_large_image">',
            f'<script type="application/ld+json">{ld}</script>',
        ]
    return "<!--seo-->\n  " + "\n  ".join(lines) + "\n  <!--/seo-->"


# ---------- contenuto già scritto nell'HTML (lo stesso che app.js mostra nella scheda) ----------
def tavole(nums, alt, phone):
    out = []
    for n in nums:
        text = "".join(b["html"] for b in phone.get(str(n), []) if "html" in b)
        out.append(f'<section>{text}<img src="{page_src(n)}" width="1100" height="619" loading="lazy" alt="{escape(alt)} — tavola {n}"></section>')
    return "".join(out)


def render_project(p, projects, phone):
    name = project_name(p)
    siblings = [q for q in projects if q["category"] == p["category"]]
    i = siblings.index(p)
    others = [siblings[(i - 1) % len(siblings)], siblings[(i + 1) % len(siblings)]]
    parts = [
        f'<article><header><h1>{escape(name)}</h1><p>{CATEGORY[p["category"]]} · {NAME}</p></header>',
        blocks(p["description"]),
        "<h2>Informazioni aggiuntive</h2><ul>" + "".join(f"<li>{info_line(e)}</li>" for e in p["info"]) + "</ul>",
        "<h2>Software utilizzati</h2><ul>" + "".join(f"<li>{escape(s)}</li>" for s in p["software"]) + "</ul>",
    ]
    if p.get("hero"):
        parts.append(f'<img src="{p["hero"]}" loading="lazy" alt="{escape(name)} — {NAME}">')
    if p.get("pages"):
        parts.append(tavole(p["pages"], name, phone))
    if p.get("items"):
        parts.append("<h2>Elementi della collezione</h2><ul>" + "".join(f'<li><a href="{project_path(p, it)}">{escape(it["title"])}</a></li>' for it in p["items"]) + "</ul>")
    if p.get("nda"):
        parts.append(f'<h2>{escape(p["nda"]["title"])}</h2>' + blocks(p["nda"]["text"]))
    parts.append('<nav aria-label="Altri progetti"><ul>' + "".join(f'<li><a href="{project_path(q)}">{escape(project_name(q))}</a></li>' for q in others) + "</ul></nav></article>")
    return "".join(parts)


def render_item(p, item, phone):
    name = project_name(p)
    kicker = f"{escape(item['kicker'])} · " if item.get("kicker") else ""
    others = "".join(f'<li><a href="{project_path(p, it)}">{escape(it["title"])}</a></li>' for it in p["items"] if it is not item)
    return (
        f'<article><header><h1>{escape(item["title"])}</h1><p>{kicker}<a href="{project_path(p)}">{escape(name)}</a> · {NAME}</p></header>'
        f"{blocks(p['description'])}{tavole(item['pages'], item['title'], phone)}"
        f'<nav aria-label="Altri elementi della collezione"><ul>{others}</ul></nav></article>'
    )


def render_about(a):
    contacts = "".join(f"<li>{escape(c['label'])}: {escape(c['value'])}</li>" for c in a["contacts"] if c.get("value"))
    return (
        f'<article><header><h1>About — {NAME}</h1><p>Product e graphic designer · Bisuschio (Varese)</p></header>'
        f'<img src="{a["photo"]}" loading="lazy" alt="{NAME}">{blocks(a["bio"])}'
        "<h2>Formazione</h2><ul>" + "".join(f"<li>{inline(e)}</li>" for e in a["education"]) + "</ul>"
        "<h2>Software skills</h2><ul>" + "".join(f"<li>{escape(s)}</li>" for s in a["software"]) + "</ul>"
        "<h2>Soft skills</h2><ul>" + "".join(f"<li>{escape(s)}</li>" for s in a["softSkills"]) + "</ul>"
        f"<h2>Contatti</h2><ul>{contacts}</ul></article>"
    )


def home_intro(projects):
    names = ", ".join(project_name(p) for p in projects)
    return (
        f'<!--intro--><div class="sr-only"><h1>{NAME} — Product e Graphic Designer</h1>'
        f"<p>{escape(HOME_DESC)} Progetti: {escape(names)}.</p></div><!--/intro-->"
    )


def fill(template, seo, intro="", prerender="", base=False):
    html = re.sub(r"<!--seo-->.*?<!--/seo-->", lambda _: seo, template, flags=re.S)
    html = re.sub(r"<!--intro-->.*?<!--/intro-->", lambda _: intro or "<!--intro--><!--/intro-->", html, flags=re.S)
    html = re.sub(r"<!--prerender-->.*?<!--/prerender-->", lambda _: f"<!--prerender-->{prerender}<!--/prerender-->", html, flags=re.S)
    if base:  # le pagine in sottocartelle caricano assets, css e js dalla radice del sito
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <base href="/">', 1)
    return html


def main():
    data = load_content()
    projects, about, phone = data["PROJECTS"], data["ABOUT"], data.get("PHONE_PAGES", {})
    template = (SITE / "index.html").read_text(encoding="utf-8")
    me = person(about)
    today = date.today().isoformat()
    pages = []  # (path, html, immagini per la sitemap)

    shutil.rmtree(SITE / "progetti", ignore_errors=True)

    home_img = og_image("assets/room-1721.webp", "home", "cover")
    pages.append(("/", fill(template, head(HOME_TITLE, HOME_DESC, "/", home_img, [me, website(), {"@type": "ProfilePage", "@id": f"{BASE}/#page", "url": f"{BASE}/", "name": HOME_TITLE, "mainEntity": {"@id": me["@id"]}, "isPartOf": {"@id": f"{BASE}/#website"}}]), home_intro(projects)), [f"{BASE}/assets/room.webp"]))

    about_desc = clip(f"{NAME}, designer di Bisuschio (Varese). " + plain(about["bio"][0]) + " Laurea in Design alla LABA di Brescia.")
    about_img = og_image("assets/hero/about.webp", "about", "contain")
    pages.append(("/about/", fill(template, head(f"About — {NAME}, designer a Varese", about_desc, "/about/", about_img, [me, website(), breadcrumbs([(NAME, "/"), ("About", "/about/")])], "profile"), prerender=render_about(about), base=True), [f"{BASE}/assets/hero/about.webp"]))

    for p in projects:
        name = project_name(p)
        path = project_path(p)
        cat = CATEGORY[p["category"]]
        desc = clip(f"{name}, progetto di {cat.lower()} di {NAME}. " + " ".join(plain(b) for b in p["description"]))
        first = p.get("pages") or p["items"][0]["pages"]
        img = og_image(p["hero"], p["id"], "contain") if p.get("hero") else og_image(page_src(first[-1], 1920), p["id"], "cover")
        images = ([f"{BASE}/{p['hero']}"] if p.get("hero") else []) + [f"{BASE}/{page_src(n, 1920)}" for n in p.get("pages", [])]
        work = {"@type": "CreativeWork", "@id": f"{BASE}{path}#work", "name": name, "description": desc, "url": f"{BASE}{path}", "image": img, "genre": cat, "inLanguage": "it-IT", "creator": {"@id": me["@id"]}, "isPartOf": {"@id": f"{BASE}/#website"}}
        crumbs = breadcrumbs([(NAME, "/"), (name, path)])
        pages.append((path, fill(template, head(f"{name} — {cat} | {NAME}", desc, path, img, [me, website(), work, crumbs], "article"), prerender=render_project(p, projects, phone), base=True), images))

        for item in p.get("items", []):
            ipath = project_path(p, item)
            kind = item.get("kicker") or name
            idesc = clip(f"{item['title']} — {kind} di {NAME}, dalla collezione {name}. " + plain(p["description"][0]))
            iimg = og_image(page_src(item["pages"][-1], 1920), f"{p['id']}-{item['id']}", "cover")
            iwork = {**work, "@id": f"{BASE}{ipath}#work", "name": item["title"], "description": idesc, "url": f"{BASE}{ipath}", "image": iimg, "isPartOf": {"@id": f"{BASE}{path}#work"}}
            icrumbs = breadcrumbs([(NAME, "/"), (name, path), (item["title"], ipath)])
            pages.append((ipath, fill(template, head(f"{item['title']} — {name} | {NAME}", idesc, ipath, iimg, [me, website(), iwork, icrumbs], "article"), prerender=render_item(p, item, phone), base=True), [f"{BASE}/{page_src(n, 1920)}" for n in item["pages"]]))

    for path, html, _ in pages:
        out = SITE / path.strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8", newline="\n")

    (SITE / "404.html").write_text(fill(template, head(f"Pagina non trovata — {NAME}", HOME_DESC, "/", home_img, [], noindex=True), base=True), encoding="utf-8", newline="\n")

    urls = []
    for path, _, images in pages:
        imgs = "".join(f"<image:image><image:loc>{escape(src)}</image:loc></image:image>" for src in images)
        urls.append(f"  <url><loc>{BASE}{path}</loc><lastmod>{today}</lastmod>{imgs}</url>")
    (SITE / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
        + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8", newline="\n")
    (SITE / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n", encoding="utf-8", newline="\n")
    print(f"{len(pages)} pagine, sitemap e robots.txt generati")


if __name__ == "__main__":
    main()
