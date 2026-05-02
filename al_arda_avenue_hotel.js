(function () {
  const svg =
    `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" fill="#0D0D0D"/>
    <polygon points="32,4 60,32 32,60 4,32" fill="none" stroke="#C9A84C" stroke-width="2"/>
    <polygon points="32,12 52,32 32,52 12,32" fill="none" stroke="#C9A84C" stroke-width="0.8" opacity="0.4"/>
    <text x="32" y="38" font-family="Georgia,serif" font-size="20" font-weight="400" fill="#C9A84C" text-anchor="middle" letter-spacing="1">AA</text>
  </svg>`;
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  document.head.appendChild(link);
})();

if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 750,
    easing: "ease-out-cubic",
    once: true,
    offset: 60,
  });
}

const LANG_STORAGE = "hotelLang";

function getPack(lang) {
  const dict = window.HOTEL_I18N;
  if (!dict) return {};
  return dict[lang] || dict.uz || {};
}

function applyLang(lang) {
  if (!window.HOTEL_I18N?.[lang]) lang = "uz";
  const pack = getPack(lang);
  localStorage.setItem(LANG_STORAGE, lang);
  document.documentElement.lang = lang === "en" ? "en" : lang === "ru" ? "ru" : "uz";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key != null && pack[key] != null) el.textContent = pack[key];
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key != null && pack[key] != null) el.innerHTML = pack[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key != null && pack[key] != null) el.setAttribute("placeholder", pack[key]);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (key != null && pack[key] != null) el.setAttribute("alt", pack[key]);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key != null && pack[key] != null) el.setAttribute("aria-label", pack[key]);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key != null && pack[key] != null) el.setAttribute("title", pack[key]);
  });

  const mt = pack["meta.title"];
  if (mt) {
    document.title = mt;
    const titleEl = document.getElementById("doc-title");
    if (titleEl) titleEl.textContent = mt;
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const active = btn.getAttribute("data-set-lang") === lang;
    btn.classList.toggle("lang-btn--active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  if (typeof AOS !== "undefined") AOS.refresh();
}

document.getElementById("lang-switch")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-set-lang]");
  if (!btn) return;
  applyLang(btn.getAttribute("data-set-lang"));
});

applyLang(localStorage.getItem(LANG_STORAGE) || "uz");

const nav = document.getElementById("navbar");
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

window.addEventListener("scroll", () =>
  nav.classList.toggle("scrolled", window.scrollY > 60),
);

function setNavOpen(open) {
  nav.classList.toggle("nav-open", open);
  navToggle?.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.style.overflow = open ? "hidden" : "";
}

navToggle?.addEventListener("click", () => setNavOpen(!nav.classList.contains("nav-open")));

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavOpen(false));
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 992) setNavOpen(false);
});

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add("open");
}

function closeLightbox() {
  lightbox.classList.remove("open");
}

lightbox.addEventListener("click", closeLightbox);
lightbox.querySelector(".lightbox-close").addEventListener("click", (e) => {
  e.stopPropagation();
  closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLightbox();
    setNavOpen(false);
  }
});

function openGalleryFromItem(item) {
  const src = item.querySelector("img")?.getAttribute("src");
  if (src) openLightbox(src);
}

const galleryGrid = document.querySelector(".gallery-grid");
galleryGrid?.addEventListener("click", (e) => {
  const item = e.target.closest(".gallery-item");
  if (!item) return;
  openGalleryFromItem(item);
});
galleryGrid?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const item = e.target.closest(".gallery-item");
  if (!item || !galleryGrid.contains(item)) return;
  e.preventDefault();
  openGalleryFromItem(item);
});

const BOOKING_SITE = "https://alardaavenue.uz/en-gb/booking/";
const bkCheckin = document.getElementById("bk-checkin");
const bkCheckout = document.getElementById("bk-checkout");
const bkGuests = document.getElementById("bk-guests");
const bkRoom = document.getElementById("bk-room");
const bkPromo = document.getElementById("bk-promo");

(() => {
  const isoToday = new Date().toISOString().slice(0, 10);
  if (bkCheckin) bkCheckin.min = isoToday;
  if (bkCheckout) bkCheckout.min = isoToday;
})();

bkCheckin?.addEventListener("change", () => {
  if (!bkCheckout || !bkCheckin.value) return;
  bkCheckout.min = bkCheckin.value;
  if (bkCheckout.value && bkCheckout.value <= bkCheckin.value) bkCheckout.value = "";
});

document.querySelector(".booking-submit")?.addEventListener("click", () => {
  const checkin = bkCheckin?.value ?? "";
  const checkout = bkCheckout?.value ?? "";
  if (checkin && checkout && checkout <= checkin) {
    const lang = localStorage.getItem(LANG_STORAGE) || "uz";
    window.alert(getPack(lang)["bk.alert"] || "");
    bkCheckout.focus();
    return;
  }

  const params = new URLSearchParams();
  if (checkin) params.set("check_in", checkin);
  if (checkout) params.set("check_out", checkout);
  const guests = bkGuests?.value?.trim();
  if (guests) params.set("guests", guests);
  const room = bkRoom?.value;
  if (room) params.set("room_type", room);
  const promo = bkPromo?.value?.trim();
  if (promo) params.set("promo", promo);

  const qs = params.toString();
  window.open(qs ? `${BOOKING_SITE}?${qs}` : BOOKING_SITE, "_blank");
});
