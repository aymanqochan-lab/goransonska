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
  const show = () => {
    const [t, a] = REVIEWS[i % REVIEWS.length];
    q.style.opacity = 0;
    setTimeout(() => {
      q.innerHTML = `“${esc(t)}”<cite>${esc(a)}</cite>`;
      q.style.opacity = 1;
    }, reduceMotion ? 0 : 450);
    i++;
  };
  show();
  setInterval(show, 7000);
}

/* ---------- menu ---------- */
let MENU = null;
async function loadMenu() {
  try {
    const { menus } = await getFullMenu();
    MENU = menus;
    const lunch = menus.find((m) => /lunch/i.test(m.name));
    const carte = menus.find((m) => !/lunch/i.test(m.name)) || menus[0];
    renderLunch(lunch);
    renderBordet(carte);
    renderFullList(menus);
  } catch (e) {
    console.error(e);
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
    const media = it.image?.url
      ? `<img src="${img(it.image.url, w * 2, Math.round(h * 1.4))}" alt="${esc(it.image.altText || it.name)}" loading="lazy" draggable="false">`
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

let dragX = null, dragStartAngle = 0, dragMoved = false;
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
  lazy.style.transform = `translateZ(${-ring.radius}px) rotateY(${ring.angle}deg)`;
});
addEventListener("pointerup", () => {
  if (dragX == null) return;
  dragX = null;
  lazy.classList.remove("dragging");
  ring.angle = Math.round(ring.angle / ring.step) * ring.step;
  if (frontIndex() >= ring.items.length) rotateTo(frontIndex() > ring.items.length / 2 + ring.N / 2 ? 0 : ring.items.length - 1);
  applyRing();
  setTimeout(() => (dragMoved = false), 0);
});
let resizeT;
addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => ring.section && buildRing(ring.section), 200);
});

/* dish dialog */
const dlg = $("#dish");
function openDish(it, section) {
  $("#dish-media").innerHTML = it.image?.url
    ? `<img src="${img(it.image.url, 960, 720)}" alt="${esc(it.image.altText || it.name)}">`
    : "";
  $("#dish-media").hidden = !it.image?.url;
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
  partyOut.textContent = S.party;
  $("#party-l").textContent = S.party === 1 ? "gäst" : "gäster";
  $("#minus").disabled = S.party <= S.min;
  $("#plus").disabled = S.party >= S.max;
  if (S.date) loadSlots();
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

async function loadLocation() {
  try {
    const locs = await listReservationLocations();
    LOC = locs.find((l) => l.default) || locs[0] || null;
    const cfg = LOC?.configuration?.onlineReservations || {};
    PERIODS = cfg.businessSchedule?.periods || [];
    S.min = cfg.partySize?.min || 1;
    S.max = cfg.partySize?.max || 20;
    setParty(2);
    renderHours();
    renderStatus();
    renderDays();
    if (cfg.onlineReservationsEnabled === false) $("#slots").innerHTML = `<p class="muted">Onlinebokning är pausad just nu.</p>`;
  } catch (e) {
    console.error(e);
    $("#slots").innerHTML = `<p class="err">Bokningen kunde inte laddas just nu. Ladda om sidan om en stund.</p>`;
  }
}

loadMenu();
loadLocation();
