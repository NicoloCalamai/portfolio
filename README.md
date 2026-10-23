# Portfolio — Nicolò Calamai

Sito statico (HTML/CSS/JS, nessun build, nessun database). Tutto ciò che viene pubblicato sta in `site/`.

- `site/index.html`, `site/styles.css`, `site/app.js`: pagina, stile e logica (stanza interattiva, elenco, schede progetto).
- `site/projects.js`: **contenuti** — testi dei progetti, pagine del PDF da mostrare e zone cliccabili della stanza.
- `site/assets/`: immagini generate da `tools/build_assets.py` a partire dal PDF e dall'immagine della stanza.

## Anteprima in locale

```
cd site
python -m http.server 8000
```
poi apri http://localhost:8000

## Aggiornare le immagini dopo aver modificato il PDF

```
pip install pymupdf pillow
python tools/build_assets.py
```
Se cambia la numerazione delle pagine, aggiorna `GALLERY_PAGES` nello script e `pages` in `site/projects.js`.

## Zone cliccabili

Ogni zona è un poligono in pixel dell'immagine `site/assets/room.webp` (3442 × 1828), definito in `site/projects.js` (`zone.points`).

## Pubblicazione su Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → repo `portfolio`.
2. Framework preset: **None** · Build command: *(vuoto)* · Build output directory: **`site`**.
3. Dopo il primo deploy: Custom domains → aggiungi il dominio.

Ogni push su `main` ripubblica il sito.

## Font

Il PDF usa **Futura PT** (Adobe Fonts). Il sito usa Jost (Google Fonts), quasi identico. Per usare Futura PT originale:
crea un Web Project su fonts.adobe.com con Futura PT (Book, Medium, Demi) e aggiungi il `<link>` del kit in `index.html`:
il CSS lo usa automaticamente (`font-family: "futura-pt", ...`).
