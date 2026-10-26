(() => {
  const { PROJECTS, ROOM, ABOUT, PHONE_PAGES = {} } = window;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const body = document.body;
  const stage = document.querySelector(".room-stage");
  const svg = document.querySelector(".room-svg");
  const label = document.querySelector(".room-label");
  const hint = document.querySelector(".room-hint");
  const sheet = document.querySelector(".sheet");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Telefoni (e tablet in verticale): stanza verticale (ROOM.phone) al posto di quella orizzontale.
  const compactQuery = matchMedia("(max-width: 820px), (pointer: coarse) and (orientation: portrait)");

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  };

  const zones = PROJECTS.flatMap((project) => [
    ...(project.zone ? [{ project, item: null, ...project.zone }] : []),
    ...(project.items || []).filter((item) => item.zone).map((item) => ({ project, item, ...item.zone })),
  ]);

  const projectHref = (project, item) => `#/p/${project.id}${item ? `/${item.id}` : ""}`;
  const projectName = (project) => project.title.join(" ");
  const pageSrc = (n, w) => `assets/pages/p${String(n).padStart(2, "0")}-${w}.webp`;

  // ---------- Testo: **grassetto** e blocchi "- elenco" ----------
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[\[(.+?)\]\]/g, '<span class="accent">$1</span>');
  const blocks = (paragraphs) =>
    paragraphs
      .map((block) => {
        const lines = block.split("\n");
        return lines.every((l) => l.startsWith("- "))
          ? `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`
          : `<p>${inline(block)}</p>`;
      })
      .join("");
  const infoLine = (entry) => (Array.isArray(entry) ? `<strong>${entry[0]}:</strong> ${inline(entry[1])}` : inline(entry));

  const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`;

  // ---------- Vista: stanza / elenco ----------
  // Il passaggio tra le due viste è animato dal CSS (body[data-view]); dopo il ritorno alla stanza l'elenco torna in cima.
  const VIEW_SWITCH_MS = 700;
  let scrollTimer = null;
  function setView(view) {
    body.dataset.view = view;
    document.querySelectorAll("[data-set-view]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.setView === view)));
    placeThumb(view);
    hideLabel();
    clearTimeout(scrollTimer);
    if (view === "room") scrollTimer = setTimeout(() => scrollTo(0, 0), VIEW_SWITCH_MS);
  }
  let preferredView = storage.get("view") === "list" ? "list" : "room";
  function chooseView(view) {
    preferredView = view;
    storage.set("view", view);
    setView(view);
  }

  // ---------- Selettore a bolla: clic su un'opzione, oppure trascinamento / swipe della bolla ----------
  const toggle = document.querySelector(".view-toggle");
  const thumb = toggle.querySelector(".view-toggle-thumb");
  const [roomBtn, listBtn] = ["room", "list"].map((v) => toggle.querySelector(`[data-set-view="${v}"]`));
  const lerp = (a, b, t) => a + (b - a) * t;
  // t = 0 sotto "Stanza", 1 sotto "Overview"
  function setThumb(t) {
    thumb.style.width = `${lerp(roomBtn.offsetWidth, listBtn.offsetWidth, t)}px`;
    thumb.style.transform = `translateX(${lerp(roomBtn.offsetLeft, listBtn.offsetLeft, t)}px)`;
    toggle.classList.toggle("is-over-list", t > 0.5);
  }
  function placeThumb(view) {
    setThumb(view === "list" ? 1 : 0);
  }
  let drag = null;
  let suppressClick = false;
  toggle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, t: body.dataset.view === "list" ? 1 : 0, moved: false, lastX: e.clientX, lastTime: e.timeStamp, v: 0 };
  });
  toggle.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      toggle.setPointerCapture(e.pointerId);
      toggle.classList.add("is-dragging");
    }
    const span = listBtn.offsetLeft - roomBtn.offsetLeft;
    drag.v = (e.clientX - drag.lastX) / Math.max(1, e.timeStamp - drag.lastTime); // px/ms, per lo swipe veloce
    drag.lastX = e.clientX;
    drag.lastTime = e.timeStamp;
    drag.now = Math.min(1, Math.max(0, drag.t + dx / span));
    setThumb(drag.now);
  });
  function endDrag() {
    if (!drag) return;
    if (drag.moved) {
      toggle.classList.remove("is-dragging");
      const t = Math.abs(drag.v) > 0.3 ? (drag.v > 0 ? 1 : 0) : Math.round(drag.now ?? drag.t);
      chooseView(t ? "list" : "room");
      suppressClick = true; // il rilascio del trascinamento non deve valere anche come clic
      setTimeout(() => (suppressClick = false));
    }
    drag = null;
  }
  toggle.addEventListener("pointerup", endDrag);
  toggle.addEventListener("pointercancel", endDrag);
  [roomBtn, listBtn].forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!suppressClick) chooseView(btn.dataset.setView);
    })
  );
  // le larghezze dei bottoni dipendono dal font e dalla dimensione dello schermo
  const replaceThumb = () => placeThumb(body.dataset.view);
  addEventListener("resize", replaceThumb);
  document.fonts?.ready.then(replaceThumb);
  compactQuery.addEventListener("change", buildRoom);

  // ---------- Stanza ----------
  // Geometria della stanza in uso: su telefono l'immagine verticale, con i poligoni `phone` delle zone.
  let room = ROOM;
  const shape = (zone) => (room === ROOM ? zone.points : zone.phone);

  function bbox(points) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }

  function buildRoom() {
    const compact = compactQuery.matches;
    body.classList.toggle("is-compact", compact);
    room = compact ? ROOM.phone : ROOM;
    stage.style.setProperty("--room-ratio", room.width / room.height);
    hint.textContent = `${compact ? "Tocca gli" : "Clicca sugli"} oggetti per esplorare la stanza`;
    deactivate();
    unzoom();
    svg.setAttribute("viewBox", `0 0 ${room.width} ${room.height}`);
    svg.innerHTML = `
      <defs><mask id="spot-mask" maskUnits="userSpaceOnUse">
        <rect width="${room.width}" height="${room.height}" fill="#fff"/><polygon class="spot-hole" fill="#000"/>
      </mask></defs>
      <rect class="dim" width="${room.width}" height="${room.height}" mask="url(#spot-mask)"/>`;
    const dots = document.createElementNS(SVG_NS, "g");
    zones.forEach((zone, i) => {
      if (!shape(zone)) return;
      const a = document.createElementNS(SVG_NS, "a");
      a.setAttribute("class", "zone");
      a.setAttribute("href", projectHref(zone.project, zone.item));
      a.setAttribute("aria-label", zone.item ? `${zone.item.title} — ${projectName(zone.project)}` : projectName(zone.project));
      a.dataset.zone = i;
      const poly = document.createElementNS(SVG_NS, "polygon");
      poly.setAttribute("points", shape(zone).join(" "));
      a.appendChild(poly);
      svg.appendChild(a);

      const b = bbox(shape(zone));
      const dot = document.createElementNS(SVG_NS, "g");
      dot.setAttribute("class", "hint-dot");
      dot.setAttribute("transform", `translate(${b.x + b.w / 2} ${b.y + b.h / 2})`);
      dot.innerHTML = `<circle r="9"/><circle class="pulse" r="22" style="animation-delay:${(i % 5) * 0.35}s"/>`;
      dots.appendChild(dot);

      a.addEventListener("pointerenter", () => activate(i));
      a.addEventListener("focus", () => activate(i));
      a.addEventListener("pointerleave", deactivate);
      a.addEventListener("blur", deactivate);
      a.addEventListener("click", (e) => {
        e.preventDefault();
        enterZone(i);
      });
    });
    svg.appendChild(dots);
  }

  let activeZone = null;
  function activate(i) {
    if (body.classList.contains("is-zoomed")) return;
    activeZone = i;
    body.classList.add("has-explored");
    const zone = zones[i];
    svg.classList.add("has-active");
    svg.querySelector(".spot-hole").setAttribute("points", shape(zone).join(" "));
    svg.querySelectorAll(".zone").forEach((el) => el.classList.toggle("is-active", Number(el.dataset.zone) === i));
    label.querySelector(".room-label-kicker").textContent = `${zone.project.num} · ${zone.item?.kicker || projectName(zone.project)}`;
    label.querySelector(".room-label-title").textContent = zone.item ? zone.item.title : zone.label || projectName(zone.project);
    placeLabel(zone);
    label.classList.add("is-visible");
    const firstPage = (zone.item || zone.project).pages?.[0];
    if (firstPage) new Image().src = pageSrc(firstPage, innerWidth > 1300 ? 1920 : 1100);
  }
  function deactivate() {
    activeZone = null;
    svg.classList.remove("has-active");
    svg.querySelectorAll(".zone.is-active").forEach((el) => el.classList.remove("is-active"));
    hideLabel();
  }
  function hideLabel() {
    label.classList.remove("is-visible");
  }
  function placeLabel(zone) {
    const rect = stage.getBoundingClientRect();
    const k = rect.width / room.width;
    const b = bbox(shape(zone));
    const cx = rect.left + (b.x + b.w / 2) * k;
    let top = rect.top + b.y * k - label.offsetHeight - 14;
    if (top < 70) top = rect.top + (b.y + b.h) * k + 14;
    const left = Math.min(Math.max(cx - label.offsetWidth / 2, 12), innerWidth - label.offsetWidth - 12);
    label.style.transform = `translate(${left}px, ${top}px)`;
  }

  let zoomedZone = null;
  function zoomTo(zone) {
    zoomedZone = zone;
    const W = stage.offsetWidth;
    const H = stage.offsetHeight;
    const k = W / room.width;
    const b = bbox(shape(zone));
    const bw = b.w * k, bh = b.h * k;
    const s = Math.max(1.2, Math.min((innerWidth * 0.5) / bw, (innerHeight * 0.6) / bh, 3.2));
    const dx = (b.x + b.w / 2) * k - W / 2;
    const dy = (b.y + b.h / 2) * k - H / 2;
    stage.style.transform = `translate(${-s * dx}px, ${-s * dy}px) scale(${s})`;
    body.classList.add("is-zoomed");
  }
  function unzoom() {
    zoomedZone = null;
    stage.style.transform = "";
    body.classList.remove("is-zoomed");
  }
  function enterZone(i) {
    const zone = zones[i];
    deactivate();
    zoomTo(zone);
    setTimeout(() => { location.hash = projectHref(zone.project, zone.item); }, reducedMotion.matches ? 0 : 750);
  }
  addEventListener("resize", () => {
    if (zoomedZone) zoomTo(zoomedZone);
    if (activeZone !== null) placeLabel(zones[activeZone]);
  });

  // ---------- Elenco ----------
  function buildList() {
    document.querySelectorAll(".list-cards").forEach((container) => {
      container.innerHTML = PROJECTS.filter((p) => p.category === container.dataset.category)
        .map(
          (p, i) => `
          <div class="card" style="--i:${i}">
            <a class="card-main" href="${projectHref(p)}">
              <div class="card-img"><img src="${p.thumb}" alt="" loading="lazy" width="600" height="729"></div>
              <span class="card-num">${p.num}</span>
              <span class="card-line"></span>
              <span class="card-title">${p.title.join("<br>")}</span>
            </a>
            ${p.items ? `<ul class="card-items">${p.items.map((it) => `<li><a href="${projectHref(p, it)}">${it.title}</a></li>`).join("")}</ul>` : ""}
          </div>`
        )
        .join("");
    });
  }

  // ---------- Schede ----------
  // Su telefono (is-compact) al posto delle tavole intere si mostra la loro versione in colonna (pages-phone.js):
  // testo vero e ritagli delle immagini. Ci sono entrambe nella pagina, il CSS mostra quella giusta.
  // Link trasparenti (es. QR code) sopra un'immagine che mostra il riquadro `frame` della pagina n del PDF.
  const pct = (v) => `${+(v * 100).toFixed(3)}%`;
  const hotspots = (links, n, [x0, y0, x1, y1]) =>
    links
      .filter(({ page, rect: r }) => page === n && r[0] >= x0 && r[1] >= y0 && r[2] <= x1 && r[3] <= y1)
      .map(({ rect: r, href, label }) => {
        const w = x1 - x0, h = y1 - y0;
        const style = `left:${pct((r[0] - x0) / w)};top:${pct((r[1] - y0) / h)};width:${pct((r[2] - r[0]) / w)};height:${pct((r[3] - r[1]) / h)}`;
        return `<a class="hotspot" href="${href}" target="_blank" rel="noopener" aria-label="${label}" style="${style}"><span class="hotspot-dot"></span></a>`;
      })
      .join("");
  const FULL_PAGE = [0, 0, 1920, 1080];
  const phonePageHtml = (n, alt, links) =>
    (PHONE_PAGES[n] || [{ src: pageSrc(n, 1100), w: 1100, h: 619, rect: FULL_PAGE }])
      .map((b) =>
        b.html
          ? `<div class="phone-text prose">${b.html}</div>`
          : `<div class="page-frame"><a href="${b.src}" target="_blank" rel="noopener"><img src="${b.src}" width="${b.w}" height="${b.h}" loading="lazy" decoding="async" alt="${alt} — tavola ${n}"></a>${hotspots(links, n, b.rect)}</div>`
      )
      .join("");
  const pagesHtml = (nums, alt, links = []) =>
    `<div class="pages">${nums
      .map((n) => `<div class="page-frame"><a href="${pageSrc(n, 1920)}" target="_blank" rel="noopener"><img src="${pageSrc(n, 1920)}" srcset="${pageSrc(n, 1100)} 1100w, ${pageSrc(n, 1920)} 1920w" sizes="100vw" width="1920" height="1080" loading="lazy" decoding="async" alt="${alt} — tavola ${n}"></a>${hotspots(links, n, FULL_PAGE)}</div>`)
      .join("")}</div>
    <div class="phone-pages">${nums.map((n) => `<section class="phone-page">${phonePageHtml(n, alt, links)}</section>`).join("")}</div>`;

  const sheetBar = `<div class="sheet-bar"><div class="sheet-bar-left"><button type="button" class="sheet-back" data-back>← Indietro</button><a class="brand" href="#/">Nicolò Calamai</a></div><button type="button" class="sheet-close" data-close>Chiudi ${closeIcon}</button></div>`;

  function renderProject(p) {
    const siblings = PROJECTS.filter((q) => q.category === p.category);
    const i = siblings.indexOf(p);
    const prev = siblings[(i - 1 + siblings.length) % siblings.length];
    const next = siblings[(i + 1) % siblings.length];
    const side = p.hero
      ? `<figure class="proj-hero" style="margin:0"><img src="${p.hero}" alt="${projectName(p)}"></figure>`
      : `<div class="proj-items">${p.items
          .map((it) => `<a class="proj-item-link" href="${projectHref(p, it)}"><img src="${pageSrc(it.pages[1] ?? it.pages[0], 1100)}" alt="" loading="lazy"><span>${it.kicker ? `<small>${it.kicker}</small>` : ""}${it.title}</span></a>`)
          .join("")}</div>`;
    return `
      ${sheetBar}
      <header class="proj-head"${p.accent ? ` style="--accent:${p.accent}"` : ""}>
        <div class="proj-text">
          <div class="proj-title"><h1>${p.title.join("<br>")}</h1><span class="rule"></span><span class="num">${p.num}</span></div>
          <div class="prose">
            ${blocks(p.description)}
            <h2 class="proj-section-title">Informazioni aggiuntive:</h2>
            <ul>${p.info.map((e) => `<li>${infoLine(e)}</li>`).join("")}</ul>
            <h2 class="proj-section-title">Software utilizzati:</h2>
            <ul class="software">${p.software.map((s) => `<li>${s}</li>`).join("")}</ul>
          </div>
        </div>
        ${side}
      </header>
      ${p.pages ? pagesHtml(p.pages, projectName(p), p.links) : ""}
      ${p.nda ? `<section class="nda">
          <p class="nda-kicker">Confidential project</p>
          <h2>${p.nda.title}</h2>
          <div class="prose">${blocks(p.nda.text)}</div>
          <div class="contact-list">${contactsHtml(["email"])}</div>
        </section>` : ""}
      <nav class="proj-nav" aria-label="Altri progetti">
        <a href="${projectHref(prev)}"><small>← ${prev.num}</small><strong>${projectName(prev)}</strong></a>
        <a class="next" href="${projectHref(next)}"><small>${next.num} →</small><strong>${projectName(next)}</strong></a>
      </nav>`;
  }

  // Singolo elemento di una collezione (una maglietta, un poster): solo lui, con la navigazione tra i "fratelli".
  function renderItem(p, item) {
    const i = p.items.indexOf(item);
    const prev = p.items[(i - 1 + p.items.length) % p.items.length];
    const next = p.items[(i + 1) % p.items.length];
    const heading = (item.heading || [[item.title]]).map(([text, color]) => (color ? `<span style="color:${color}">${text}</span>` : text)).join("");
    return `
      ${sheetBar}
      <header class="item-head">
        <a class="item-collection" href="${projectHref(p)}">${p.num} · ${projectName(p)}</a>
        ${item.kicker ? `<span class="kicker">${item.kicker}</span>` : ""}
        <h1><span>${heading}</span></h1>
      </header>
      ${pagesHtml(item.pages, item.title, item.links)}
      <nav class="proj-nav" aria-label="Altri elementi della collezione">
        <a href="${projectHref(p, prev)}"><small>← ${projectName(p)}</small><strong>${prev.title}</strong></a>
        <a class="next" href="${projectHref(p, next)}"><small>${projectName(p)} →</small><strong>${next.title}</strong></a>
      </nav>`;
  }

  // ---------- Contatti ----------
  const contactHref = (c) =>
    c.type === "email" ? `mailto:${c.value}`
    : c.type === "phone" ? `tel:${c.value.replace(/[^\d+]/g, "")}`
    : c.type === "instagram" ? `https://www.instagram.com/${c.value.replace(/^@/, "")}/`
    : c.value;
  const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`;
  // `types`: solo alcuni contatti (es. ["email"]); senza, tutti
  const contactsHtml = (types) =>
    ABOUT.contacts
      .filter((c) => c.value && (!types || types.includes(c.type)))
      .map(
        (c) => `
        <div class="contact-row">
          <span class="contact-label">${c.label}</span>
          <a class="contact-value" href="${contactHref(c)}"${c.type === "instagram" ? ' target="_blank" rel="noopener"' : ""}>${c.value}</a>
          <button type="button" class="contact-copy" data-copy="${c.value}" aria-label="Copia ${c.label.toLowerCase()}">${copyIcon}<span>Copia</span></button>
        </div>`
      )
      .join("");

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = Object.assign(document.createElement("textarea"), { value: text });
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    await copyText(btn.dataset.copy);
    const label = btn.querySelector("span");
    btn.classList.add("is-copied");
    label.textContent = "Copiato";
    setTimeout(() => {
      btn.classList.remove("is-copied");
      label.textContent = "Copia";
    }, 1600);
  });

  const contactsToggle = document.querySelector(".contacts-toggle");
  const contactsPanel = document.querySelector(".contacts-panel");
  contactsPanel.innerHTML = contactsHtml();
  function setContactsOpen(open) {
    contactsPanel.hidden = !open;
    contactsToggle.setAttribute("aria-expanded", String(open));
  }
  contactsToggle.addEventListener("click", () => setContactsOpen(contactsPanel.hidden));
  document.addEventListener("click", (e) => {
    if (!contactsPanel.hidden && !e.target.closest(".contacts")) setContactsOpen(false);
  });

  function renderAbout() {
    const a = ABOUT;
    return `
      ${sheetBar}
      <div class="about">
        <div>
          <div class="about-photo"><img src="${a.photo}" alt="Nicolò Calamai"></div>
          <p class="about-ciao">Ciao,</p>
          <p class="about-iam">Sono <strong>Nicolò Calamai</strong></p>
        </div>
        <div class="about-bio">${blocks(a.bio)}</div>
        <div class="about-sep"></div>
        <div class="about-side prose">
          <section><h2>Formazione</h2><ul>${a.education.map((e) => `<li>${inline(e)}</li>`).join("")}</ul></section>
          <section><h2>Software skills</h2><ul class="software">${a.software.map((s) => `<li>${s}</li>`).join("")}</ul></section>
          <section><h2>Soft skills</h2><ul class="skills">${a.softSkills.map((s, i) => `<li><img src="assets/icons/skill-${i + 1}.webp" alt="" width="80" height="80" loading="lazy"><span>${s}</span></li>`).join("")}</ul></section>
          <section class="about-contact"><h2>Contatti</h2><div class="contact-list">${contactsHtml()}</div></section>
        </div>
      </div>`;
  }

  let sheetKey = null;
  let closeTimer = null;
  function openSheet(key, html, theme) {
    clearTimeout(closeTimer);
    // una scheda diversa, o la stessa riaperta dopo averla chiusa, riparte sempre dalla cima
    const fresh = sheetKey !== key || !sheet.classList.contains("is-open");
    if (sheetKey !== key) {
      sheet.innerHTML = html;
      sheet.className = `sheet theme-${theme}`;
      sheet.setAttribute("aria-label", key === "about" ? "About" : sheet.querySelector("h1")?.textContent || "");
      sheetKey = key;
    }
    sheet.hidden = false;
    // solo ora: finché la scheda è nascosta (hidden) il browser ignora scrollTop
    if (fresh) sheet.scrollTop = 0;
    body.classList.add("is-locked");
    requestAnimationFrame(() => sheet.classList.add("is-open"));
    sheet.focus({ preventScroll: true });
    hideLabel();
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.classList.remove("is-open");
    body.classList.remove("is-locked");
    closeTimer = setTimeout(() => {
      sheet.hidden = true;
      sheet.innerHTML = "";
      sheetKey = null;
    }, 450);
    setTimeout(unzoom, 150);
  }
  sheet.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) location.hash = "#/";
    if (e.target.closest("[data-back]")) goBack();
  });
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!contactsPanel.hidden) setContactsOpen(false);
    else if (!sheet.hidden) location.hash = "#/";
  });

  // ---------- Routing ----------
  // Cronologia interna, per il tasto "Indietro": se si arriva da un'altra pagina del sito si torna lì,
  // altrimenti si sale di un livello (elemento → collezione → overview).
  const visited = [];
  function goBack() {
    if (visited.length > 1) history.back();
    else location.hash = location.hash.split("/").length > 3 ? location.hash.split("/").slice(0, 3).join("/") : "#/";
  }
  function route() {
    setContactsOpen(false);
    if (visited.at(-2) === location.hash) visited.pop();
    else visited.push(location.hash);
    const [, section, id, itemId] = location.hash.replace(/^#\/?/, "#/").split("/");
    if (section === "about") {
      openSheet("about", renderAbout(), "light");
      return;
    }
    const project = section === "p" && PROJECTS.find((p) => p.id === id);
    if (!project) {
      closeSheet();
      return;
    }
    const theme = project.theme || (project.category === "graphic" ? "grey" : "light");
    const item = itemId && project.items?.find((it) => it.id === itemId);
    if (item) openSheet(`${project.id}/${item.id}`, renderItem(project, item), theme);
    else openSheet(project.id, renderProject(project), theme);
  }
  addEventListener("hashchange", route);

  // ---------- Copertina ----------
  function runCover() {
    const cover = document.querySelector(".cover");
    const skip = sessionStorage.getItem?.("cover-seen") || /^#\/(p|about)\//.test(location.hash + "/");
    if (skip) {
      cover.classList.add("is-gone");
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => cover.classList.add("is-ready")));
    const img = document.querySelector(".room-img");
    const loaded = img.complete
      ? Promise.resolve()
      : new Promise((r) => {
          img.addEventListener("load", r, { once: true });
          img.addEventListener("error", r, { once: true });
        });
    const minTime = new Promise((r) => setTimeout(r, 1900));
    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      try { sessionStorage.setItem("cover-seen", "1"); } catch {}
      cover.classList.add("is-leaving");
      setTimeout(() => cover.classList.add("is-gone"), 1500);
    };
    cover.addEventListener("click", leave);
    Promise.all([loaded, minTime]).then(leave);
  }

  buildRoom();
  buildList();
  // al caricamento la vista iniziale compare senza animazioni
  body.classList.add("is-instant");
  setView(preferredView);
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove("is-instant")));
  route();
  try { runCover(); } catch { document.querySelector(".cover").classList.add("is-gone"); }
})();
