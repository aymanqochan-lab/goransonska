import { getFullMenu } from "./src/rest/wix-restaurants-menu.js";
import {
  listReservationLocations,
  getTimeSlots,
  createHeldReservation,
  reserveReservation,
} from "./src/rest/wix-restaurants-reservations.js";

const $ = (s, el = document) => el.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kr = (p) => {
  if (p == null || p === "") return "";
  const n = Number(p);
  return Number.isFinite(n) ? `${n % 1 ? n.toFixed(2).replace(".", ",") : n} kr` : `${p} kr`;
};
const priceOf = (it) => {
  if (it.price != null) return kr(it.price);
  const vs = (it.variants || []).map((v) => Number(v.price)).filter(Number.isFinite);
  return vs.length ? `från ${kr(Math.min(...vs))}` : "";
};
const img = (url, w, h) => {
  if (!url) return "";
  let id = null;
  const m1 = url.match(/^wix:image:\/\/v1\/([^/#]+)/);
  const m2 = url.match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  if (m1) id = m1[1]; else if (m2) id = m2[1]; else if (/^[\w-]+~mv2\.\w+$/.test(url)) id = url;
  if (!id) return url;
  return `https://static.wixstatic.com/media/${id}/v1/fill/w_${w},h_${h},q_82/i.jpg`;
};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- header ---------- */
const top = $("#top");
const onScroll = () => top.classList.toggle("solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- reviews (real Google reviews, quoted as written) ---------- */
const REVIEWS = [
  ["Snyggt inrett lokal med blandning av rustikt och modernt med ypperligt proffsig och serviceinriktad personal. Supergod och estetisk mat.", "Lukas K."],
  ["Tack för en supertrevlig quizkväll. Mycket god mat, trevlig och hjälpsam personal, kul med quiz och livemusik!", "Erika L."],
  ["Glad överraskning att hitta denna restaurang som bjöd på trubadurer helgen vi besökte Lindesberg. Bra mat och service.", "Gunnar N."],
  ["Väldigt trevlig och go servitör, bra burgare, kanonfin och avslappnad innergård och prisvärd meny.", "Jerns W."],
  ["Härligt miljö och trevlig personal. Jag åt en hamburgare till lunch, denna var mycket god och vällagad. Rekommenderas.", "Jörgen N."],
  ["Mycket trevligt, god mat och bra priser!", "Isabelle S."],
];
{
  const q = $("#quote");
  let i = 0;
  const stars = $("#stars");
  let seen = false;
  const replayStars = () => {
    if (!seen) return;
    stars.classList.remove("go");
    void stars.offsetWidth;
    stars.classList.add("go");
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es, o) => {
      if (es.some((e) => e.isIntersecting)) { seen = true; replayStars(); o.disconnect(); }
    }, { threshold: 0.4 }).observe(stars);
  } else { seen = true; stars.classList.add("go"); }
  const show = () => {
    const [t, a] = REVIEWS[i % REVIEWS.length];
    q.style.opacity = 0;
    q.style.transform = "translateY(10px)";
    setTimeout(() => {
      q.innerHTML = `“${esc(t)}”<cite>${esc(a)}</cite>`;
      q.style.opacity = 1;
      q.style.transform = "none";
      if (i > 1) replayStars();
    }, reduceMotion ? 0 : 450);
    i++;
  };
  show();
  setInterval(show, 7000);
}

/* ---------- menu ---------- */
let MENU = null;
const MENU_KEY = "gs-menu-v1", LOC_KEY = "gs-loc-v1";
const readCache = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const writeCache = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
function showMenus(menus) {
  MENU = menus;
  const lunch = menus.find((m) => /lunch/i.test(m.name));
  const carte = menus.find((m) => !/lunch/i.test(m.name)) || menus[0];
  renderLunch(lunch);
  renderBordet(carte);
  renderFullList(menus);
}
async function loadMenu() {
  // show the last copy instantly, then refresh quietly from Wix
  const cached = readCache(MENU_KEY);
  if (cached?.menus?.length) showMenus(cached.menus);
  try {
    const { menus } = await getFullMenu();
    writeCache(MENU_KEY, { menus });
    if (cached && JSON.stringify(cached.menus) === JSON.stringify(menus)) return;
    const keepTab = $("#tabs .tab[aria-selected='true']")?.textContent;
    showMenus(menus);
    if (keepTab) [...document.querySelectorAll("#tabs .tab")].find((t) => t.textContent === keepTab)?.click();
  } catch (e) {
    console.error(e);
    if (cached?.menus?.length) return;
    $("#lunch-list").innerHTML = `<li><p class="ds">Lunchmenyn kunde inte hämtas just nu. Ladda om sidan om en stund.</p></li>`;
    $("#now").innerHTML = `<p class="n2">Menyn kunde inte hämtas just nu. Ladda om sidan om en stund.</p>`;
  }
}

function renderLunch(menu) {
  const list = $("#lunch-list");
  list.setAttribute("aria-busy", "false");
  if (!menu || !menu.sections?.length) {
    list.innerHTML = `<li><p class="ds">Veckans lunch publiceras snart.</p></li>`;
    return;
  }
  const sec = menu.sections[0];
  if (sec.name) $("#lunch-time").textContent = sec.name.replace(/^Lunch\s+/i, "").replace(/^./, (c) => c.toUpperCase());
  if (sec.description) $("#lunch-incl").textContent = sec.description.split(/Pensionär/i)[0].trim();
  list.innerHTML = "";
  for (const it of sec.items) {
    const li = el("li");
    const ph = it.image?.url ? `<img class="ph" src="${img(it.image.url, 168, 168)}" alt="${esc(it.image.altText || it.name)}" loading="lazy">` : "";
    if (ph) li.classList.add("has-ph");
    li.innerHTML = `${ph}<span class="nm">${esc(it.name)}</span><span class="pr">${it.name === "Super size" ? "+" : ""}${priceOf(it)}</span>${it.description ? `<p class="ds">${esc(it.description)}</p>` : ""}`;
    list.append(li);
  }
}

/* the lazy susan */
const lazy = $("#lazy");
let ring = { items: [], angle: 0, step: 0, radius: 0, section: null };

function renderBordet(menu) {
  const tabs = $("#tabs");
  tabs.innerHTML = "";
  const sections = (menu?.sections || []).filter((s) => s.items?.length);
  if (!sections.length) {
    $("#now").innerHTML = `<p class="n2">Menyn publiceras snart.</p>`;
    return;
  }
  const start = sections.find((s) => /varm/i.test(s.name)) || sections[0];
  sections.forEach((s) => {
    const b = el("button", "tab", esc(s.name));
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", s === start ? "true" : "false");
    b.addEventListener("click", () => {
      tabs.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", "false"));
      b.setAttribute("aria-selected", "true");
      buildRing(s);
    });
    tabs.append(b);
  });
  buildRing(start);
}

/* real photos from the restaurant, used behind dishes that have no photo of their own yet */
const AMB = [
  [/sallad/i, "dbb097_c68587be565043c2ba90908005864db0~mv2.webp", true],
  [/förrätt|snacks|dipp/i, "dbb097_bcc069648d0f4c22955aed902b26c108~mv2.jpg"],
  [/varm/i, "dbb097_e53e985a548a4bd2aa88e50caa6056aa~mv2.jpg"],
  [/cocktail|vin|öl|cider|alkohol/i, "dbb097_526f2e6eaca4483b9d5a565873bf7efa~mv2.jpg"],
  [/./, "dbb097_6a6c052538eb473d822f370b7b468570~mv2.jpg"],
];
function photoFor(it, section) {
  if (it.image?.url) return { url: it.image.url, own: true };
  for (const [re, id, byName] of AMB) {
    if (byName ? re.test(it.name) : re.test(section?.name || "")) return { url: id, own: !!byName };
  }
  return null;
}

function cardSize() {
  const w = innerWidth < 640 ? 190 : 240;
  return { w, h: Math.round(w * 1.32) };
}

function buildRing(section) {
  const items = section.items.slice(0, 14);
  const N = Math.max(items.length, 6); // keep a round table even with few dishes
  const { w, h } = cardSize();
  const step = 360 / N;
  const radius = Math.max(w * 0.62 / Math.tan(Math.PI / N), w * 1.1);
  ring = { items, angle: 0, step, radius, N, section };
  lazy.innerHTML = "";
  lazy.style.setProperty("--w", `${w}px`);
  lazy.style.setProperty("--h", `${h}px`);
  items.forEach((it, i) => {
    const c = el("button", "card");
    c.type = "button";
    c.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
    const ph = photoFor(it, section);
    const media = ph?.own
      ? `<img src="${img(ph.url, w * 2, Math.round(h * 1.4))}" alt="${esc(it.image?.altText || it.name)}" loading="lazy" draggable="false">`
      : ph
        ? `<img class="amb" src="${img(ph.url, w, Math.round(h * 0.75)).replace(",q_82/", ",q_70,blur_3/")}" alt="" loading="lazy" draggable="false"><span class="amb-name" aria-hidden="true">${esc(it.name)}</span>`
        : `<span class="mono" aria-hidden="true">${esc(it.name)}</span>`;
    c.innerHTML = `<span class="cm">${media}</span><span class="cb"><span class="cn">${esc(it.name)}</span><span class="cp">${priceOf(it)}</span></span>`;
    c.setAttribute("aria-label", `${it.name}, ${priceOf(it)}`);
    c.addEventListener("click", (e) => {
      if (dragMoved) return;
      if (i === frontIndex()) openDish(it, section);
      else rotateTo(i);
    });
    lazy.append(c);
  });
  applyRing();
}

const frontIndex = () => {
  const n = ring.items.length;
  if (!n) return 0;
  const i = Math.round(-ring.angle / ring.step) % ring.N;
  return ((i % ring.N) + ring.N) % ring.N;
};
function applyRing() {
  lazy.style.transform = `translateZ(${-ring.radius}px) rotateY(${ring.angle}deg)`;
  const fi = frontIndex();
  [...lazy.children].forEach((c, i) => c.classList.toggle("front", i === fi));
  const it = ring.items[fi];
  $("#now").innerHTML = it
    ? `<p class="n1">${esc(it.name)} <span class="muted">· ${priceOf(it)}</span></p>${it.description ? `<p class="n2">${esc(it.description)}</p>` : ""}`
    : `<p class="n2 muted">Snurra vidare.</p>`;
}
function rotateTo(i) {
  // shortest way round
  const target = -i * ring.step;
  let d = ((target - ring.angle) % 360 + 540) % 360 - 180;
  ring.angle += d;
  applyRing();
}
const nudge = (dir) => {
  ring.angle = Math.round(ring.angle / ring.step) * ring.step - dir * ring.step;
  // skip empty seats on small sections
  for (let k = 0; k < ring.N && frontIndex() >= ring.items.length; k++) ring.angle -= dir * ring.step;
  applyRing();
};
$("#prev").addEventListener("click", () => nudge(-1));
$("#next").addEventListener("click", () => nudge(1));
lazy.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { nudge(1); e.preventDefault(); }
  if (e.key === "ArrowLeft") { nudge(-1); e.preventDefault(); }
  if (e.key === "Enter") { const it = ring.items[frontIndex()]; if (it) openDish(it, ring.section); }
});

let dragX = null, dragStartAngle = 0, dragMoved = false, dragRaf = 0;
const stage = $("#stage");
stage.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".spin")) return;
  dragX = e.clientX; dragStartAngle = ring.angle; dragMoved = false;
  lazy.classList.add("dragging");
});
addEventListener("pointermove", (e) => {
  if (dragX == null) return;
  const dx = e.clientX - dragX;
  if (Math.abs(dx) > 6) dragMoved = true;
  ring.angle = dragStartAngle + dx * 0.32;
  if (!dragRaf) dragRaf = requestAnimationFrame(() => {
    dragRaf = 0;
    lazy.style.transform = `translateZ(${-ring.radius}px) rotateY(${ring.angle}deg)`;
  });
});
const endDrag = () => {
  if (dragX == null) return;
  dragX = null;
  lazy.classList.remove("dragging");
  ring.angle = Math.round(ring.angle / ring.step) * ring.step;
  if (frontIndex() >= ring.items.length) rotateTo(frontIndex() > ring.items.length / 2 + ring.N / 2 ? 0 : ring.items.length - 1);
  applyRing();
  setTimeout(() => (dragMoved = false), 0);
};
addEventListener("pointerup", endDrag);
addEventListener("pointercancel", endDrag);
let resizeT;
addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => ring.section && buildRing(ring.section), 200);
});

/* dish dialog */
const dlg = $("#dish");
function openDish(it, section) {
  const ph = photoFor(it, section);
  $("#dish-media").innerHTML = ph?.own
    ? `<img src="${img(ph.url, 960, 720)}" alt="${esc(it.image?.altText || it.name)}">`
    : "";
  $("#dish-media").hidden = !ph?.own;
  $("#dish-sec").textContent = section?.name || "";
  $("#dish-name").textContent = it.name;
  $("#dish-desc").textContent = it.description || "";
  $("#dish-price").textContent = priceOf(it);
  dlg.showModal();
}
$("#dish-book").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

function renderFullList(menus) {
  const box = $("#fulllist");
  box.innerHTML = "";
  for (const m of menus) {
    for (const s of m.sections) {
      if (!s.items?.length) continue;
      const sec = el("div", "fl-sec");
      sec.innerHTML = `<h3>${esc(s.name)}</h3>${s.description ? `<p class="sd">${esc(s.description)}</p>` : ""}`;
      for (const it of s.items) {
        sec.append(el("div", "fl-row", `<span>${esc(it.name)}</span><span class="p">${priceOf(it)}</span>${it.description ? `<span class="d">${esc(it.description)}</span>` : ""}`));
      }
      box.append(sec);
    }
  }
}

/* ---------- hours + status from the reservation schedule ---------- */
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_SV = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const dayIdx = (d) => (d.getDay() + 6) % 7; // Monday = 0
let LOC = null, PERIODS = [];

function periodsFor(i) {
  return PERIODS.filter((p) => p.openDay === DAYS[i]);
}
function renderHours() {
  const dl = $("#hours-list");
  dl.innerHTML = "";
  const t = dayIdx(new Date());
  DAY_SV.forEach((name, i) => {
    const ps = periodsFor(i);
    const cls = i === t ? ' class="today"' : "";
    dl.insertAdjacentHTML("beforeend", `<dt${cls}>${name}</dt><dd${cls}>${ps.length ? ps.map((p) => `${p.openTime}–${p.closeTime}`).join(", ") : "Stängt"}</dd>`);
  });
}
function renderStatus() {
  const st = $("#status");
  const now = new Date();
  const hm = now.toTimeString().slice(0, 5);
  const today = periodsFor(dayIdx(now));
  const openP = today.find((p) => p.openTime <= hm && hm < p.closeTime);
  if (openP) {
    st.className = "status open";
    st.innerHTML = `<span class="dot"></span><b>Öppet nu</b> – till ${openP.closeTime}`;
    return;
  }
  for (let k = 0; k < 8; k++) {
    const i = (dayIdx(now) + k) % 7;
    const next = periodsFor(i).find((p) => k > 0 || p.openTime > hm);
    if (next) {
      st.className = "status";
      const when = k === 0 ? "i dag" : k === 1 ? "i morgon" : DAY_SV[i].toLowerCase();
      st.innerHTML = `<span class="dot"></span>Stängt just nu – öppnar ${when} kl ${next.openTime}`;
      return;
    }
  }
  st.textContent = "";
}

/* ---------- booking ---------- */
const S = { party: 2, date: null, slot: null, min: 1, max: 20 };
const partyOut = $("#party");
function setParty(n) {
  S.party = Math.min(S.max, Math.max(S.min, n));
  if (partyOut.textContent !== String(S.party)) {
    partyOut.textContent = S.party;
    partyOut.classList.remove("bump"); void partyOut.offsetWidth; partyOut.classList.add("bump");
  }
  drawTable(S.party);
  $("#party-l").textContent = S.party === 1 ? "gäst" : "gäster";
  $("#minus").disabled = S.party <= S.min;
  $("#plus").disabled = S.party >= S.max;
  if (S.date) loadSlots();
}
/* the little table: one chair pops up per guest */
const SVGNS = "http://www.w3.org/2000/svg";
const tv = $("#tableviz");
const svgEl = (tag, attrs) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
let tvSeats = [], tvTable, tvCloth, tvGlow;
function initTable() {
  tv.appendChild(svgEl("defs", {})).innerHTML = `<radialGradient id="tvglow"><stop offset="0" stop-color="#f2c76b" stop-opacity=".45"/><stop offset="1" stop-color="#f2c76b" stop-opacity="0"/></radialGradient>`;
  tvTable = tv.appendChild(svgEl("circle", { class: "tv-table", cx: 0, cy: 0, r: 40 }));
  tvCloth = tv.appendChild(svgEl("circle", { class: "tv-cloth", cx: 0, cy: 0, r: 32 }));
  tvGlow = tv.appendChild(svgEl("circle", { class: "tv-glow", cx: 0, cy: -8, r: 22 }));
  tv.append(svgEl("rect", { class: "tv-candle", x: -2.5, y: -9, width: 5, height: 12, rx: 1.5 }));
  tv.append(svgEl("path", { class: "tv-flame", d: "M0 -17 C3 -13 2.5 -10 0 -9.5 C-2.5 -10 -3 -13 0 -17Z" }));
}
function tableRadius(n) { return n <= 2 ? 30 : n <= 4 ? 36 : n <= 6 ? 44 : n <= 8 ? 52 : n <= 12 ? 64 : n <= 16 ? 78 : 90; }
function drawTable(n) {
  if (!tv) return;
  if (!tvTable) initTable();
  const R = tableRadius(n);
  tvTable.setAttribute("r", R); tvTable.style.r = `${R}px`;
  tvCloth.setAttribute("r", R - 8); tvCloth.style.r = `${R - 8}px`;
  const sc = Math.min(1, 84 / (R + 32));
  tv.style.transform = `scale(${sc})`;
  tv.style.transition = "transform .5s cubic-bezier(.3,1.3,.5,1)";
  while (tvSeats.length > n) {
    const g = tvSeats.pop();
    g.classList.add("bye");
    setTimeout(() => g.remove(), 260);
  }
  while (tvSeats.length < n) {
    const g = svgEl("g", { class: "tv-seat" });
    const inner = g.appendChild(svgEl("g", { class: "inner" }));
    inner.append(
      svgEl("rect", { class: "tv-back", x: -10, y: -15, width: 20, height: 6, rx: 3 }),
      svgEl("rect", { class: "tv-chair", x: -8.5, y: -9, width: 17, height: 15, rx: 5 }),
      svgEl("circle", { class: "tv-plate", cx: 0, cy: 26, r: 6.5 }),
      svgEl("circle", { class: "tv-plate-in", cx: 0, cy: 26, r: 4 })
    );
    const prev = tvSeats[tvSeats.length - 1];
    g.style.transform = prev ? prev.style.transform : "rotate(0deg) translate(0px,-60px)";
    tv.insertBefore(g, tvGlow);
    tvSeats.push(g);
    requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add("on")));
  }
  const d = R + 16;
  tvSeats.forEach((g, i) => {
    const a = (360 / n) * i;
    g.style.transform = `rotate(${a}deg) translate(0px,${-d}px)`;
    // keep plates on the table edge whatever the size
    g.querySelectorAll(".tv-plate,.tv-plate-in").forEach((c) => c.setAttribute("cy", 16 + Math.min(12, R * 0.22)));
  });
}

$("#minus").addEventListener("click", () => setParty(S.party - 1));
$("#plus").addEventListener("click", () => setParty(S.party + 1));

function renderDays() {
  const box = $("#days");
  box.innerHTML = "";
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  for (let k = 0; k < 21; k++) {
    const d = new Date(base);
    d.setDate(base.getDate() + k);
    const open = periodsFor(dayIdx(d)).length > 0;
    const b = el("button", `day${open ? "" : " closed"}`);
    b.type = "button";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.disabled = !open;
    const wd = k === 0 ? "I dag" : d.toLocaleDateString("sv-SE", { weekday: "short" });
    b.innerHTML = `<small>${wd}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString("sv-SE", { month: "short" })}</small>`;
    b.setAttribute("aria-label", d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }) + (open ? "" : ", stängt"));
    b.addEventListener("click", () => {
      box.querySelectorAll(".day").forEach((x) => x.setAttribute("aria-checked", "false"));
      b.setAttribute("aria-checked", "true");
      S.date = d;
      loadSlots();
    });
    box.append(b);
  }
}

let slotReq = 0;
async function loadSlots() {
  const box = $("#slots");
  const my = ++slotReq;
  S.slot = null;
  $("#s4").disabled = true;
  box.innerHTML = `<p class="muted">Hämtar lediga tider…</p>`;
  const ps = periodsFor(dayIdx(S.date));
  if (!ps.length || !LOC) { box.innerHTML = `<p class="muted">Vi har stängt den här dagen.</p>`; return; }
  // ask around the middle of the opening hours so the whole day comes back
  const [oh, om] = ps[0].openTime.split(":").map(Number);
  const [ch, cm] = ps[ps.length - 1].closeTime.split(":").map(Number);
  const mid = new Date(S.date);
  const midMin = Math.round(((oh * 60 + om) + (ch * 60 + cm)) / 2 / 15) * 15;
  mid.setHours(Math.floor(midMin / 60), midMin % 60, 0, 0);
  const span = Math.ceil(((ch * 60 + cm) - (oh * 60 + om)) / 2 / (LOC.configuration?.onlineReservations?.timeSlotInterval || 15)) + 1;
  try {
    const { availableTimeSlots } = await getTimeSlots(LOC.id, mid.toISOString(), S.party, { slotsBefore: span, slotsAfter: span });
    if (my !== slotReq) return;
    const sameDay = availableTimeSlots.filter((s) => new Date(s.startDate).toDateString() === S.date.toDateString());
    if (!sameDay.length) { box.innerHTML = `<p class="muted">Inga lediga tider för ${S.party} ${S.party === 1 ? "gäst" : "gäster"} den dagen. Prova en annan dag.</p>`; return; }
    box.innerHTML = "";
    for (const s of sameDay) {
      const t = new Date(s.startDate);
      const b = el("button", "slot", t.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      b.addEventListener("click", () => {
        box.querySelectorAll(".slot").forEach((x) => x.setAttribute("aria-checked", "false"));
        b.setAttribute("aria-checked", "true");
        S.slot = s;
        $("#s4").disabled = false;
        $("#s4 input").focus({ preventScroll: true });
      });
      box.append(b);
    }
  } catch (e) {
    console.error(e);
    if (my === slotReq) box.innerHTML = `<p class="err">Kunde inte hämta tider just nu. Försök igen om en stund.</p>`;
  }
}

function toE164(raw) {
  let p = String(raw || "").replace(/[\s\-()]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (p.startsWith("0")) p = "+46" + p.slice(1);
  if (!p.startsWith("+")) p = "+46" + p;
  return /^\+\d{8,15}$/.test(p) ? p : null;
}

$("#ticket").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const err = $("#err");
  err.textContent = "";
  const firstName = f.firstName.value.trim();
  const phone = toE164(f.phone.value);
  if (!S.slot) { err.textContent = "Välj en tid först."; return; }
  if (!firstName) { err.textContent = "Skriv ditt förnamn."; f.firstName.focus(); return; }
  if (!phone) { err.textContent = "Skriv ett mobilnummer, till exempel 070 123 45 67."; f.phone.focus(); return; }
  const btn = $("#confirm");
  btn.disabled = true;
  btn.textContent = "Bokar…";
  try {
    const held = await createHeldReservation(LOC.id, S.slot.startDate, S.party);
    const reservee = { firstName, phone };
    if (f.lastName.value.trim()) reservee.lastName = f.lastName.value.trim();
    if (f.email.value.trim()) reservee.email = f.email.value.trim();
    const r = await reserveReservation(held.id, held.revision, reservee);
    const t = new Date(r.details?.startDate || S.slot.startDate);
    const when = t.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }) + " kl " + t.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    const requested = r.status === "REQUESTED";
    f.querySelectorAll(".step").forEach((s) => (s.hidden = true));
    const done = $("#done");
    done.hidden = false;
    done.innerHTML = `<h3>${requested ? "Förfrågan skickad" : "Bordet är bokat"}</h3>
      <p class="big">${S.party} ${S.party === 1 ? "gäst" : "gäster"}, ${esc(when)}</p>
      <p class="muted">${requested ? "Vi bekräftar större sällskap personligen och hör av oss snart." : `Välkommen, ${esc(firstName)}! Vi ses på Kungsgatan 46.`}</p>`;
    done.focus();
  } catch (e2) {
    console.error(e2);
    err.textContent = "Tiden hann bli upptagen eller något gick fel. Välj en ny tid och försök igen.";
    btn.disabled = false;
    btn.textContent = "Boka bordet";
    loadSlots();
  }
});

function useLocation(loc) {
    LOC = loc;
    const cfg = LOC?.configuration?.onlineReservations || {};
    PERIODS = cfg.businessSchedule?.periods || [];
    S.min = cfg.partySize?.min || 1;
    S.max = cfg.partySize?.max || 20;
    setParty(S.party);
    renderHours();
    renderStatus();
    renderDays();
    if (cfg.onlineReservationsEnabled === false) $("#slots").innerHTML = `<p class="muted">Onlinebokning är pausad just nu.</p>`;
}
async function loadLocation() {
  const cached = readCache(LOC_KEY);
  if (cached) useLocation(cached);
  try {
    const locs = await listReservationLocations();
    const loc = locs.find((l) => l.default) || locs[0] || null;
    writeCache(LOC_KEY, loc);
    if (!cached || JSON.stringify(cached) !== JSON.stringify(loc)) useLocation(loc);
  } catch (e) {
    console.error(e);
    if (!cached) $("#slots").innerHTML = `<p class="err">Bokningen kunde inte laddas just nu. Ladda om sidan om en stund.</p>`;
  }
}

/* ---------- motion: parallax, magnetic buttons, reveals, active nav ---------- */
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
if (!reduceMotion && finePointer) {
  const hero = $(".hero"), ringW = $(".ring-wrap"), photo = $(".hero-photo");
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ringW.style.setProperty("--mx", `${x * -26}px`); ringW.style.setProperty("--my", `${y * -18}px`);
    photo.style.setProperty("--px", `${x * 22}px`); photo.style.setProperty("--py", `${y * 16}px`);
  });
  hero.addEventListener("pointerleave", () => {
    ["--mx", "--my"].forEach((k) => ringW.style.setProperty(k, "0px"));
    ["--px", "--py"].forEach((k) => photo.style.setProperty(k, "0px"));
  });
  document.querySelectorAll(".btn, .spin, .round").forEach((b) => {
    b.style.transition += ",translate .35s cubic-bezier(.2,.8,.3,1)";
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.22}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`;
    });
    b.addEventListener("pointerleave", () => (b.style.translate = "0 0"));
  });
}
if ("IntersectionObserver" in window && !reduceMotion) {
  const targets = document.querySelectorAll(".lunch-intro, .lunch-list, .bordet-head, .kvallar h2, .kv-lede, .film figure, .quotes .wrap, .boka-intro, .ticket, .hitta-grid > *");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  targets.forEach((t, i) => {
    t.classList.add("rv");
    if (t.matches(".film figure")) t.style.transitionDelay = `${(i % 6) * 0.08}s`;
    io.observe(t);
  });
  const links = [...document.querySelectorAll(".nav a")];
  const secs = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const nio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach((s) => nio.observe(s));
}

if ("IntersectionObserver" in window) {
  const film = $("#film");
  new IntersectionObserver((es) => film.classList.toggle("live", es[0].isIntersecting)).observe(film);
} else $("#film").classList.add("live");

/* kvällar: slides along by itself, one photo at a time; any touch pauses it */
{
  const film = $("#film");
  const figs = [...film.querySelectorAll("figure")];
  const dots = el("div", "film-dots");
  let idx = 0, pausedUntil = 0, hovering = false, visible = false;
  const maxLeft = () => film.scrollWidth - film.clientWidth - 4;
  const leftOf = (i) => figs[i].offsetLeft - figs[0].offsetLeft;
  const mark = () => {
    [...dots.children].forEach((d, i) => d.setAttribute("aria-current", i === idx ? "true" : "false"));
  };
  const go = (i) => {
    idx = (i + figs.length) % figs.length;
    film.scrollTo({ left: leftOf(idx), behavior: reduceMotion ? "auto" : "smooth" });
    mark();
  };
  const hold = (ms = 8000) => (pausedUntil = Date.now() + ms);
  figs.forEach((f, i) => {
    const b = el("button");
    b.type = "button";
    b.setAttribute("aria-label", `Visa ${f.querySelector("figcaption")?.textContent || "bild " + (i + 1)}`);
    b.addEventListener("click", () => { hold(); go(i); });
    dots.append(b);
  });
  film.after(dots);
  mark();
  let st;
  film.addEventListener("scroll", () => {
    clearTimeout(st);
    st = setTimeout(() => {
      const x = film.scrollLeft;
      let best = 0;
      figs.forEach((_, i) => { if (Math.abs(leftOf(i) - x) < Math.abs(leftOf(best) - x)) best = i; });
      idx = x >= maxLeft() ? figs.length - 1 : best;
      mark();
    }, 120);
  }, { passive: true });
  ["pointerdown", "touchstart", "wheel"].forEach((ev) => film.addEventListener(ev, () => hold(), { passive: true }));
  film.addEventListener("mouseenter", () => (hovering = true));
  film.addEventListener("mouseleave", () => (hovering = false));
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.35 }).observe(film);
  else visible = true;
  if (!reduceMotion) setInterval(() => {
    if (!visible || hovering || Date.now() < pausedUntil || document.hidden) return;
    go(film.scrollLeft >= maxLeft() ? 0 : idx + 1);
  }, 2600);
}

drawTable(S.party);
loadMenu();
loadLocation();
