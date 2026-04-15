/* ── Hero Particle System ── */
(function () {
  const canvas = document.getElementById("hero-particles");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  let w, h, particles, mouse, animId;

  const PARTICLE_COUNT = 80;
  const CONNECT_DIST = 140;
  const MOUSE_RADIUS = 200;

  const COLORS = [
    { r: 242, g: 202, b: 80 },   // gold
    { r: 212, g: 175, b: 55 },   // gold-2
    { r: 80, g: 223, b: 56 },    // green
    { r: 223, g: 226, b: 243 },  // text/white
  ];

  mouse = { x: -9999, y: -9999 };

  function resize() {
    const hero = canvas.closest(".hero");
    w = canvas.width = hero.offsetWidth;
    h = canvas.height = hero.offsetHeight;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = COLORS[Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : Math.random() < 0.7 ? 2 : 3];
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.8,
        color,
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.01 + 0.005,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      // Mouse interaction — gentle push
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS) {
        const force = (1 - dist / MOUSE_RADIUS) * 0.02;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      // Dampen velocity
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Pulsing alpha
      const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.15;
      const alpha = Math.max(0.05, p.alpha + pulse);

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
      ctx.fill();

      // Glow effect for larger particles
      if (p.r > 1.4) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.08})`;
        ctx.fill();
      }

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const ddx = p.x - p2.x;
        const ddy = p.y - p2.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < CONNECT_DIST) {
          const lineAlpha = (1 - d / CONNECT_DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(242, 202, 80, ${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  // Mouse tracking (relative to canvas)
  canvas.closest(".hero").addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  canvas.closest(".hero").addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Init
  resize();
  createParticles();
  draw(0);

  // Handle resize
  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });

  // Pause when not visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      draw(0);
    }
  });
})();

/* ── Product Tabs ── */
const productTabs = document.querySelectorAll(".product-tab");
const productPanels = document.querySelectorAll(".product-panel");

if (productTabs.length) {
  productTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      productTabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      productPanels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.panel === target);
      });
    });
  });
}

/* ── FAQ Accordion ── */
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const trigger = item.querySelector(".faq-item__trigger");
  if (!trigger) return;

  trigger.addEventListener("click", () => {
    const isOpen = item.classList.contains("is-open");

    faqItems.forEach((entry) => {
      entry.classList.remove("is-open");
      const btn = entry.querySelector(".faq-item__trigger");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }
  });
});

/* ── Mobile Navigation Toggle ── */
const navToggle = document.getElementById("nav-toggle");
const siteNav = document.getElementById("site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  // Close mobile nav when a link is clicked
  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && siteNav.classList.contains("is-open")) {
      siteNav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      navToggle.focus();
    }
  });
}

/* ── Published Media Hydration ── */
/* Dynamic Products Hydration */
(async function () {
  if (!window.fetch) return;

  try {
    const productsApi = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://127.0.0.1:8787"
      : "https://api.romanagency.net";

    const res = await fetch(productsApi + "/api/products?lang=" + getCurrentLang(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;

    const payload = await res.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];
    if (!items.length) return;

    hydrateProducts(items);
  } catch {
    // Keep hardcoded products as fallback
  }

  function hydrateProducts(items) {
    const panels = {
      personal: document.querySelector('.product-panel[data-panel="personal"]'),
      bm: document.querySelector('.product-panel[data-panel="bm"]'),
      fanpage: document.querySelector('.product-panel[data-panel="fanpage"]'),
      profile: document.querySelector('.product-panel[data-panel="profile"]'),
    };

    Object.entries(panels).forEach(([category, panel]) => {
      if (!panel) return;

      const categoryItems = items.filter((item) => item.category === category);
      if (!categoryItems.length) {
        panel.innerHTML = '<div class="product-grid"></div>';
        return;
      }

      panel.innerHTML = buildCategoryMarkup(category, categoryItems);
    });
  }

  function buildCategoryMarkup(category, items) {
    const groups = new Map();

    items.forEach((item) => {
      const key = item.sub_group || "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    return Array.from(groups.entries()).map(([subGroup, groupItems]) => {
      const labelMarkup = subGroup
        ? `<div class="product-row-label">${escapeHtml(getSubGroupLabel(category, subGroup, groupItems[0]))}</div>`
        : "";

      const gridMarkup = `
        <div class="product-grid">
          ${groupItems.map((item) => buildProductCard(item)).join("")}
        </div>
      `;

      return labelMarkup + gridMarkup;
    }).join("");
  }

  function buildProductCard(item) {
    const goldClass = item.is_gold ? " product-card--gold" : "";

    return `
      <article class="product-card${goldClass}">
        <div class="product-card__header">
          ${getProductIconSvg(item.icon_key || item.category)}
          <span>${escapeHtml(item.name || "")}</span>
        </div>
        <div class="product-card__limit">${escapeHtml(item.limit_text || "")}</div>
        <p>${escapeHtml(item.description || "")}</p>
      </article>
    `;
  }

  function getSubGroupLabel(category, subGroup, item) {
    const normalized = String(subGroup || "").toLowerCase();

    if (category === "personal") {
      if (normalized === "new") return "Personal account (new)";
      if (normalized === "old") return "Personal account (old)";
    }

    if (item?.name) return item.name;
    return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
  }

  function getProductIconSvg(iconKey) {
    const key = String(iconKey || "").toLowerCase();
    const svgClass = "product-card__fb";

    if (key === "house" || key === "bm") {
      return `<svg class="${svgClass}" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    if (key === "page" || key === "fanpage") {
      return `<svg class="${svgClass}" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    if (key === "profile" || key === "user") {
      return `<svg class="${svgClass}" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    return `<svg class="${svgClass}" viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();

/* Dynamic Payments Hydration */
(async function () {
  if (!window.fetch) return;

  const paymentGrid = document.querySelector(".payment-grid");
  if (!paymentGrid) return;

  try {
    const paymentsApi = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://127.0.0.1:8787"
      : "https://api.romanagency.net";

    const res = await fetch(paymentsApi + "/api/payments?lang=" + getCurrentLang(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;

    const payload = await res.json();
    const methods = Array.isArray(payload?.data) ? payload.data : [];
    if (!methods.length) {
      paymentGrid.innerHTML = "";
      return;
    }

    paymentGrid.innerHTML = methods.map((method) => buildPaymentCard(method)).join("");
  } catch {
    // Keep hardcoded payment methods as fallback
  }

  function buildPaymentCard(method) {
    const wallets = Array.isArray(method.wallets) ? method.wallets : [];

    return `
      <article class="payment-card">
        <div class="payment-card__header">
          <div class="payment-card__icon ${getPaymentIconClass(method.icon_key)}">
            ${getPaymentIconSvg(method.icon_key)}
          </div>
          <div class="payment-card__info">
            <h3>${escapeHtml(method.name || "")}</h3>
            <p>${escapeHtml(method.label || "")}</p>
          </div>
        </div>
        <div class="wallet-addresses">
          ${wallets.map((wallet) => `
            <div class="wallet-item">
              <span class="wallet-label">${escapeHtml(wallet.network || "")}</span>
              <code class="wallet-addr" data-copy="${escapeAttr(wallet.address || "")}">${escapeHtml(wallet.address || "")}</code>
              <button class="wallet-copy" aria-label="Copy address">Copy</button>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }

  function getPaymentIconClass(iconKey) {
    const key = String(iconKey || "").toLowerCase();
    if (key === "btc") return "payment-card__icon--btc";
    if (key === "eth") return "payment-card__icon--eth";
    return "payment-card__icon--usdt";
  }

  function getPaymentIconSvg(iconKey) {
    const key = String(iconKey || "").toLowerCase();

    if (key === "btc") {
      return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.5"/><path d="M12 10v12M12 16h5a3 3 0 000-6h-5m0 6h5.5a3 3 0 010 6H12M14 8v2m4-2v2m-4 12v2m4-2v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    if (key === "eth") {
      return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.5"/><path d="M16 6l-7 10 7 4 7-4-7-10zM9 16l7 10 7-10-7 4-7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    }

    return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="1.5"/><path d="M10 10h12M16 10v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M10 17.5c0-1 2.7-2 6-2s6 1 6 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }
})();

/* â”€â”€ Dynamic Settings Hydration (Stats + Contact) â”€â”€ */
(async function () {
  if (!window.fetch) return;

  const bindings = [
    { selector: 'meta[property="og:image"]', section: "meta", slot: "og-image", attr: "content" },
    { selector: 'meta[name="twitter:image"]', section: "meta", slot: "og-image", attr: "content" },
    { selector: 'link[rel="icon"]', section: "favicon", slot: "favicon", attr: "href" },
    { selector: ".hero__media", section: "meta", slot: "og-image", attr: "background-image" },
    { selector: ".brand__logo", section: "brand", slot: "logo", attr: "src", syncAlt: true },
    { selector: ".hero-video-card__media source", section: "hero", slot: "video", attr: "src", reloadMedia: true },
    { selector: ".marquee__logo--image img", section: "marquee", slot: "logo-1", attr: "src", syncAlt: true, all: true },
    { selector: ".service-grid .service-card:nth-child(1) img", section: "services", slot: "card-1", attr: "src", syncAlt: true },
    { selector: ".service-grid .service-card:nth-child(2) img", section: "services", slot: "card-2", attr: "src", syncAlt: true },
    { selector: ".service-grid .service-card:nth-child(3) img", section: "services", slot: "card-3", attr: "src", syncAlt: true },
    { selector: ".resource-visual__gallery .resource-visual__frame:nth-child(1) img", section: "resources", slot: "item-1", attr: "src", syncAlt: true },
    { selector: ".resource-visual__gallery .resource-visual__frame:nth-child(2) img", section: "resources", slot: "item-2", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(1) .proof-grid .proof-card:nth-child(1) img", section: "proof-campaign", slot: "screenshot-1", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(1) .proof-grid .proof-card:nth-child(2) img", section: "proof-campaign", slot: "screenshot-2", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(1) .proof-grid .proof-card:nth-child(3) img", section: "proof-campaign", slot: "screenshot-3", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(2) .proof-grid .proof-card:nth-child(1) img", section: "proof-system", slot: "system-1", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(2) .proof-grid .proof-card:nth-child(2) img", section: "proof-system", slot: "system-2", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(3) .proof-grid .proof-card:nth-child(1) img", section: "proof-bm", slot: "bm-1", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(3) .proof-grid .proof-card:nth-child(2) img", section: "proof-bm", slot: "bm-2", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(3) .proof-grid .proof-card:nth-child(3) img", section: "proof-bm", slot: "bm-3", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(4) .proof-grid .proof-card:nth-child(1) img", section: "proof-sigma", slot: "item-1", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(4) .proof-grid .proof-card:nth-child(2) img", section: "proof-sigma", slot: "item-2", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(4) .proof-grid .proof-card:nth-child(3) img", section: "proof-sigma", slot: "item-3", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(4) .proof-grid .proof-card:nth-child(4) img", section: "proof-sigma", slot: "item-4", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(5) .proof-grid .proof-card:nth-child(1) img", section: "proof-affiliate", slot: "item-1", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(5) .proof-grid .proof-card:nth-child(2) img", section: "proof-affiliate", slot: "item-2", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(5) .proof-grid .proof-card:nth-child(3) img", section: "proof-affiliate", slot: "item-3", attr: "src", syncAlt: true },
    { selector: "#proof .proof-group:nth-of-type(5) .proof-grid .proof-card:nth-child(4) img", section: "proof-affiliate", slot: "item-4", attr: "src", syncAlt: true },
  ];

  const ROMAN_API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8787"
    : "https://api.romanagency.net";

  const PUBLISHED_CONFIG_URL = ROMAN_API_BASE + "/api/published-config";

  try {
    const response = await fetch(PUBLISHED_CONFIG_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return;

    const payload = await response.json();
    const media = payload?.data?.media;
    if (!media) return;

    bindings.forEach((binding) => {
      const entry = getPublishedMediaEntry(media, binding.section, binding.slot);
      if (!entry?.url) return;

      const elements = binding.all
        ? document.querySelectorAll(binding.selector)
        : [document.querySelector(binding.selector)].filter(Boolean);

      elements.forEach((element) => {
        applyPublishedMedia(element, entry, binding);
      });
    });
  } catch {
    // Keep bundled assets as fallback when the API is unavailable.
  }

  function getPublishedMediaEntry(media, section, slot) {
    const sectionData = media?.[section];
    if (!sectionData) return null;
    if (Array.isArray(sectionData.items)) {
      return sectionData.items.find((item) => item.slot === slot) || null;
    }
    return sectionData[slot] || null;
  }

  function applyPublishedMedia(element, entry, binding) {
    // Rewrite media URL: when running locally, redirect production URLs to local API
    let url = entry.url;
    const PROD_ORIGIN = "https://roman-agency-api.dong141220047.workers.dev";
    if (ROMAN_API_BASE !== PROD_ORIGIN && url.startsWith(PROD_ORIGIN)) {
      url = url.replace(PROD_ORIGIN, ROMAN_API_BASE);
    }

    if (binding.attr === "background-image") {
      element.style.backgroundImage = `url("${url}")`;
    } else {
      element.setAttribute(binding.attr, url);
    }

    if (binding.syncAlt && element.tagName === "IMG" && entry.alt) {
      element.alt = entry.alt;
    }

    if (binding.reloadMedia && element.parentElement?.tagName === "VIDEO") {
      element.parentElement.load();
    }
  }
})();

/* ── Newsletter Form ── */
const ROMAN_API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://127.0.0.1:8787"
  : "https://api.romanagency.net";

function getCurrentLang() {
  const htmlLang = document.documentElement.lang;
  if (htmlLang === "zh-CN" || htmlLang === "zh") return "zh";
  if (htmlLang === "ru") return "ru";
  return "en";
}

const newsletterForm = document.getElementById("newsletter-form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector("input[type='email']");
    const email = emailInput?.value.trim();
    if (!email) return;

    try {
      const res = await fetch(ROMAN_API + "/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        emailInput.value = "";
        emailInput.placeholder = "Thanks! We'll be in touch.";
        setTimeout(() => { emailInput.placeholder = "Your email"; }, 3000);
      } else {
        emailInput.placeholder = data.error?.message || "Something went wrong";
        setTimeout(() => { emailInput.placeholder = "Your email"; }, 3000);
      }
    } catch {
      emailInput.value = "";
      emailInput.placeholder = "Thanks! We'll be in touch.";
      setTimeout(() => { emailInput.placeholder = "Your email"; }, 3000);
    }
  });
}


/* ── Dynamic FAQ Hydration ── */
(async function () {
  if (!window.fetch) return;
  const faqList = document.querySelector("#faq .faq-list");
  if (!faqList) return;

  try {
    const lang = getCurrentLang();
    const res = await fetch(ROMAN_API + "/api/faqs?lang=" + lang, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const payload = await res.json();
    const faqs = payload?.data;
    if (!Array.isArray(faqs) || !faqs.length) return;

    faqList.innerHTML = "";

    faqs.forEach((faq, i) => {
      const article = document.createElement("article");
      article.className = "faq-item" + (i === 0 ? " is-open" : "");
      article.innerHTML = `
        <button class="faq-item__trigger" type="button" aria-expanded="${i === 0 ? 'true' : 'false'}">
          <span>${escapeHtml(faq.question)}</span>
          <span class="faq-item__icon"></span>
        </button>
        <div class="faq-item__panel">
          <p>${escapeHtml(faq.answer)}</p>
        </div>
      `;
      faqList.appendChild(article);
    });

    // Re-bind accordion
    faqList.querySelectorAll(".faq-item").forEach((item) => {
      const trigger = item.querySelector(".faq-item__trigger");
      if (!trigger) return;
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        faqList.querySelectorAll(".faq-item").forEach((entry) => {
          entry.classList.remove("is-open");
          const btn = entry.querySelector(".faq-item__trigger");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
  } catch {
    // Keep hardcoded FAQs as fallback
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }
})();

/* ── Dynamic Testimonials Hydration ── */
(async function () {
  if (!window.fetch) return;
  const grid = document.querySelector("#testimonials .testimonials-grid");
  if (!grid) return;

  try {
    const lang = getCurrentLang();
    const res = await fetch(ROMAN_API + "/api/testimonials?lang=" + lang, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const payload = await res.json();
    const items = payload?.data;
    if (!Array.isArray(items) || !items.length) return;

    grid.innerHTML = "";

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "testimonial-card";
      article.innerHTML = `
        <p class="testimonial-card__text">"${escapeHtml(item.content)}"</p>
        <div class="testimonial-card__author">
          <span class="testimonial-card__name">${escapeHtml(item.author_name)}</span>
          <span class="testimonial-card__role">${escapeHtml(item.author_role || "")}</span>
        </div>
      `;
      grid.appendChild(article);
    });

    // Re-bind tilt effect for new cards
    grid.querySelectorAll(".testimonial-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -4;
        const rotateY = ((x - cx) / cx) * 4;
        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  } catch {
    // Keep hardcoded testimonials as fallback
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }
})();

/* ── Dynamic Settings Hydration (Stats + Contact) ── */
(async function () {
  if (!window.fetch) return;

  try {
    let statsHydrated = false;

    try {
      const statsRes = await fetch(ROMAN_API + "/api/stats?lang=" + getCurrentLang(), {
        headers: { Accept: "application/json" },
      });

      if (statsRes.ok) {
        const statsPayload = await statsRes.json();
        const stats = Array.isArray(statsPayload?.data) ? statsPayload.data : [];
        if (stats.length) {
          hydrateStatsFromApi(stats);
          statsHydrated = true;
        }
      }
    } catch {
      // Fall back to legacy stat_* settings below.
    }

    const res = await fetch(ROMAN_API + "/api/settings?lang=" + getCurrentLang(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const payload = await res.json();
    const raw = payload?.data;
    if (!raw || typeof raw !== "object") return;
    const settings = raw;

    // Stats section — update data-target values for animated counters
    if (!statsHydrated) {
      const statMap = {
        stat_spend: { selector: '[data-i18n="stats.label1"]' },
        stat_accounts: { selector: '[data-i18n="stats.label2"]' },
        stat_support: { selector: '[data-i18n="stats.label3"]' },
        stat_refund: { selector: '[data-i18n="stats.label4"]' },
      };

      Object.entries(statMap).forEach(([key, cfg]) => {
        if (!settings[key]) return;
        const label = document.querySelector(cfg.selector);
        if (!label) return;
        const card = label.closest(".stat-card");
        if (!card) return;
        const numEl = card.querySelector(".stat-item__number[data-target]");
        if (!numEl) return;
        const numericValue = String(settings[key]).replace(/[^0-9]/g, "");
        if (numericValue && numericValue.length > 0) numEl.setAttribute("data-target", numericValue);
      });
    }

    // Contact info
    if (settings.contact_email) {
      const el = document.querySelector('a[href*="romanagency888@gmail.com"]');
      if (el) { el.href = "mailto:" + settings.contact_email; el.textContent = settings.contact_email; }
    }
    if (settings.contact_telegram) {
      const el = document.querySelector('a[href*="t.me/romanwarior"]');
      if (el) el.href = settings.contact_telegram;
    }
    if (settings.contact_channel) {
      const el = document.querySelector('a[href*="t.me/romanagency"]');
      if (el) { el.href = settings.contact_channel; el.textContent = settings.contact_channel; }
    }
    if (settings.contact_website) {
      const el = document.querySelector('a[href*="romanagency.net/"]');
      if (el) { el.href = settings.contact_website; el.textContent = settings.contact_website.replace(/^https?:\/\//, ""); }
    }

    const pricingFee = String(settings.pricing_fee || "").replace(/[^0-9.]/g, "");
    const pricingDeposit = String(settings.pricing_deposit || "").replace(/[^0-9]/g, "");

    if (pricingFee || pricingDeposit) {
      const feeText = pricingFee || "8";
      const depositText = pricingDeposit || "100";
      const formattedDeposit = formatUsdAmount(depositText);

      const heroCta = document.querySelector('a[data-i18n="hero.cta1"]');
      if (heroCta) heroCta.textContent = `Start with $${formattedDeposit} Deposit`;

      const footerCta = document.querySelector('a[data-i18n="footer.ctaBtn"]');
      if (footerCta) footerCta.textContent = `Start With $${formattedDeposit} Deposit`;

      const pricingHeadingCopy = document.querySelector("#pricing .section-heading p");
      if (pricingHeadingCopy) {
        pricingHeadingCopy.textContent = `Current service fee is ${feeText}% with a minimum deposit of $${formattedDeposit}. Contact us for detailed first-month pricing and custom packages.`;
      }

      const pricingHighlightCopy = document.querySelector("#pricing .pricing-highlight p");
      if (pricingHighlightCopy) {
        pricingHighlightCopy.textContent = `Get started with Roman Agency Marketing from a minimum deposit of $${formattedDeposit} and a ${feeText}% service fee. Contact us via Telegram or email for your personalized pricing plan.`;
      }

      const workflowDepositCopy = document.querySelector('.workflow-step:nth-child(3) p[data-i18n="workflow.step3.text"]');
      if (workflowDepositCopy) {
        workflowDepositCopy.textContent = `Make a small deposit ($${formattedDeposit}+) to start. We create a support group (tech + finance + support).`;
      }

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", `Roman Agency Marketing specializes in renting Facebook & TikTok ad accounts. 24/7 support, free replacements, transparent spending reports. Start with $${formattedDeposit} deposit.`);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute("content", `Premium ad account rental for Facebook & TikTok. 24/7 support, free replacements, transparent policy. Start with $${formattedDeposit} deposit.`);
      }
    }
  } catch {
    // Keep hardcoded values as fallback
  }

  function hydrateStatsFromApi(stats) {
    const grid = document.querySelector(".stats-grid");
    if (!grid || !Array.isArray(stats) || !stats.length) return;

    grid.innerHTML = stats.map((stat) => {
      const numericValue = extractNumericTarget(stat.value);
      const targetValue = numericValue !== null ? String(numericValue) : "0";
      const prefix = stat.prefix || "";
      const suffix = stat.suffix || "";
      const styleClass = getStatCardStyleClass(stat.card_style);

      return `
        <article class="stat-card ${styleClass}">
          <div class="stat-card__icon" aria-hidden="true">
            ${getStatIconSvg(stat.icon_key)}
          </div>
          <span class="stat-card__value stat-item__number" data-target="${escapeAttr(targetValue)}" data-prefix="${escapeAttr(prefix)}" data-suffix="${escapeAttr(suffix)}">${escapeHtml(prefix)}0${escapeHtml(suffix)}</span>
          <span class="stat-card__label">${escapeHtml(stat.label || "")}</span>
          <p class="stat-card__desc">${escapeHtml(stat.description || "")}</p>
        </article>
      `;
    }).join("");

    // Re-initialize animated counters for the dynamically created stat cards
    const newNumbers = grid.querySelectorAll(".stat-item__number[data-target]");
    if (newNumbers.length && "IntersectionObserver" in window) {
      const counterObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const pre = el.dataset.prefix || "";
            const suf = el.dataset.suffix || "";
            const duration = 2000;
            const startT = performance.now();
            function update(now) {
              const elapsed = now - startT;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.floor(eased * target);
              const formatted = current >= 1000000
                ? (current / 1000000).toFixed(1) + "M"
                : current >= 1000
                  ? Math.floor(current / 1000) + "K"
                  : current;
              el.textContent = pre + formatted + suf;
              if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
            counterObs.unobserve(el);
          }
        });
      }, { threshold: 0.3 });
      newNumbers.forEach((el) => counterObs.observe(el));
    }
  }

  function extractNumericTarget(value) {
    const digits = String(value ?? "").replace(/[^0-9]/g, "");
    if (!digits) return null;
    return parseInt(digits, 10);
  }

  function getStatCardStyleClass(style) {
    const styleMap = {
      gold: "stat-card--gold",
      dark: "stat-card--dark",
      green: "stat-card--green",
      outline: "stat-card--outline",
    };

    return styleMap[style] || "stat-card--dark";
  }

  function getStatIconSvg(iconKey) {
    const key = String(iconKey || "").toLowerCase();

    if (key === "user" || key === "users") {
      return `<svg viewBox="0 0 24 24" fill="none"><path d="M7 18v-1a4 4 0 014-4h2a4 4 0 014 4v1M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    if (key === "clock" || key === "time") {
      return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    if (key === "shield" || key === "security") {
      return `<svg viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v18M8 7h6a3 3 0 010 6H10a3 3 0 000 6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function formatUsdAmount(value) {
    const digits = String(value ?? "").replace(/[^0-9]/g, "");
    if (!digits) return "0";

    const amount = parseInt(digits, 10);
    if (!Number.isFinite(amount)) return digits;

    return amount.toLocaleString("en-US");
  }
})();

/* ── Scroll Reveal (IntersectionObserver) ── */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion && "IntersectionObserver" in window) {
  // All animatable elements across every section
  const revealSelectors = [
    ".section-heading",
    ".section-heading__eyebrow",
    ".section-heading h2",
    ".section-heading p",
    ".service-card",
    ".workflow-step",
    ".proof-group",
    ".proof-card",
    ".benefit-card",
    ".resources__copy",
    ".resource-visual",
    ".feature-list li",
    ".resources__callout",
    ".faq-item",
    ".footer-cta > div",
    ".footer-cta__action",
    ".footer-grid > div",
    ".footer-brand",
    ".footer-bottom",
    ".hero__content > *",
    ".eyebrow",
    ".hero__title",
    ".hero__copy",
    ".hero__actions",
    ".hero__meta",
  ];

  const revealElements = document.querySelectorAll(revealSelectors.join(", "));

  // Set initial hidden state with stagger per parent
  const parentDelays = new Map();

  revealElements.forEach((el) => {
    // Find closest section/footer parent for stagger grouping
    const parent = el.closest("section, footer, .footer-cta, .footer-grid, .service-grid, .workflow-grid, .proof-grid, .faq-list, .hero__content");
    if (!parentDelays.has(parent)) parentDelays.set(parent, 0);
    const index = parentDelays.get(parent);
    parentDelays.set(parent, index + 1);

    const delay = index * 80; // 80ms stagger between siblings
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    el.style.transition = `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`;
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
}

/* ── Scroll Progress Bar ── */
const scrollBar = document.getElementById("scroll-progress");
if (scrollBar) {
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = ((scrollTop / docHeight) * 100) + "%";
  }, { passive: true });
}

/* ── Cursor Glow ── */
const cursorGlow = document.getElementById("cursor-glow");
if (cursorGlow && window.innerWidth > 1080) {
  document.addEventListener("mousemove", (e) => {
    cursorGlow.style.left = e.clientX + "px";
    cursorGlow.style.top = e.clientY + "px";
    cursorGlow.style.opacity = "1";
  }, { passive: true });
}

/* ── Parallax Hero ── */
const heroMedia = document.querySelector(".hero__media");
if (heroMedia && !reducedMotion) {
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    if (scrollY < 1200) {
      heroMedia.style.transform = `translateY(${scrollY * 0.3}px)`;
    }
  }, { passive: true });
}

/* ── 3D Card Tilt ── */
const tiltCards = document.querySelectorAll(".service-card, .testimonial-card");
if (!reducedMotion) {
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
    });
  });
}

/* ── Magnetic Buttons ── */
const magneticBtns = document.querySelectorAll(".button--solid");
if (!reducedMotion) {
  magneticBtns.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

/* ── Animated Stat Counters ── */
const statNumbers = document.querySelectorAll(".stat-item__number[data-target]");
if (statNumbers.length && "IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        const duration = 2000;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(eased * target);
          // Format large numbers
          const formatted = current >= 1000000
            ? (current / 1000000).toFixed(1) + "M"
            : current >= 1000
              ? Math.floor(current / 1000) + "K"
              : current;
          el.textContent = prefix + formatted + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach((el) => counterObserver.observe(el));
}

/* ── Dynamic Year ── */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Language Switcher (dropdown toggle) ── */
(function () {
  const switcher = document.getElementById("lang-switcher");
  if (!switcher) return;

  // Toggle dropdown
  switcher.querySelector(".lang-switcher__btn").addEventListener("click", (e) => {
    e.stopPropagation();
    switcher.classList.toggle("is-open");
  });

  // Close dropdown on outside click
  document.addEventListener("click", () => {
    switcher.classList.remove("is-open");
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") switcher.classList.remove("is-open");
  });
})();

/* ── Back to Top Button ── */
(function () {
  const btn = document.getElementById("fab-top");
  if (!btn) return;

  const SHOW_AFTER = 600;

  function toggle() {
    if (window.scrollY > SHOW_AFTER) {
      btn.classList.add("is-visible");
    } else {
      btn.classList.remove("is-visible");
    }
  }

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

/* ── Wallet Copy ── */
(function () {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".wallet-copy");
    if (!btn) return;

    var addr = btn.previousElementSibling;
    var text = addr.getAttribute("data-copy") || addr.textContent;

    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = "Copied!";
      btn.classList.add("is-copied");
      setTimeout(function () {
        btn.textContent = "Copy";
        btn.classList.remove("is-copied");
      }, 2000);
    });
  });
})();

/* ── Image Lightbox with Zoom & Pan ── */
(function () {
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbCounter = document.getElementById("lightbox-counter");
  const imgWrap = document.getElementById("lb-img-wrap");
  const zoomLevelEl = document.getElementById("lb-zoom-level");
  if (!lightbox || !lbImg) return;

  const closeBtn = document.getElementById("lb-close");
  const zoomInBtn = document.getElementById("lb-zoomin");
  const zoomOutBtn = document.getElementById("lb-zoomout");
  const resetBtn = document.getElementById("lb-reset");
  const prevBtn = lightbox.querySelector(".lightbox__nav--prev");
  const nextBtn = lightbox.querySelector(".lightbox__nav--next");

  let images = [];
  let currentIndex = 0;

  // Zoom & Pan state
  let zoom = 1;
  let panX = 0, panY = 0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let startPanX = 0, startPanY = 0;
  let zoomLevelTimer = null;

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.5;

  const selectors = ".resource-visual__frame img, .proof-card img, .proof-card--screenshot img";

  function collectImages() {
    images = Array.from(document.querySelectorAll(selectors));
  }

  function applyTransform() {
    lbImg.style.transform = "scale(" + zoom + ") translate(" + (panX / zoom) + "px, " + (panY / zoom) + "px)";

    // Toggle zoomed class
    if (zoom > 1.05) {
      imgWrap.classList.add("is-zoomed");
    } else {
      imgWrap.classList.remove("is-zoomed");
    }
  }

  function showZoomLevel() {
    zoomLevelEl.textContent = Math.round(zoom * 100) + "%";
    zoomLevelEl.classList.add("is-visible");
    clearTimeout(zoomLevelTimer);
    zoomLevelTimer = setTimeout(function () {
      zoomLevelEl.classList.remove("is-visible");
    }, 1200);
  }

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
    showZoomLevel();
  }

  function setZoom(newZoom, centerX, centerY) {
    var old = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    if (centerX !== undefined && centerY !== undefined) {
      var rect = imgWrap.getBoundingClientRect();
      var cx = centerX - rect.left - rect.width / 2;
      var cy = centerY - rect.top - rect.height / 2;
      panX = panX - cx * (zoom / old - 1);
      panY = panY - cy * (zoom / old - 1);
    }
    applyTransform();
    showZoomLevel();
  }

  function show(index) {
    if (images.length === 0) return;
    currentIndex = (index + images.length) % images.length;
    var img = images[currentIndex];
    lbImg.src = img.src;
    lbImg.alt = img.alt || "";
    lbCounter.textContent = (currentIndex + 1) + " / " + images.length;

    var showNav = images.length > 1;
    prevBtn.style.display = showNav ? "" : "none";
    nextBtn.style.display = showNav ? "" : "none";
    lbCounter.style.display = showNav ? "" : "none";

    resetZoom();
    lightbox.classList.add("is-active");
    document.body.style.overflow = "hidden";
  }

  function hide() {
    lightbox.classList.remove("is-active");
    document.body.style.overflow = "";
    resetZoom();
  }

  // Open lightbox on image click
  document.addEventListener("click", function (e) {
    var img = e.target.closest(selectors);
    if (!img) return;
    e.preventDefault();
    collectImages();
    var idx = images.indexOf(img);
    if (idx !== -1) show(idx);
  });

  // Close
  closeBtn.addEventListener("click", hide);

  // Nav
  prevBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    show(currentIndex - 1);
  });
  nextBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    show(currentIndex + 1);
  });

  // Zoom buttons
  zoomInBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    setZoom(zoom + ZOOM_STEP);
  });
  zoomOutBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    setZoom(zoom - ZOOM_STEP);
  });
  resetBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    resetZoom();
  });

  // Mouse wheel zoom
  imgWrap.addEventListener("wheel", function (e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom(zoom + delta, e.clientX, e.clientY);
  }, { passive: false });

  // Double-click to toggle zoom
  imgWrap.addEventListener("dblclick", function (e) {
    e.preventDefault();
    if (zoom > 1.05) {
      resetZoom();
    } else {
      setZoom(2.5, e.clientX, e.clientY);
    }
  });

  // Click on backdrop (outside image) to close
  imgWrap.addEventListener("click", function (e) {
    if (e.target === imgWrap && zoom <= 1.05 && !isDragging) {
      hide();
    }
  });

  // Mouse drag to pan
  imgWrap.addEventListener("mousedown", function (e) {
    if (zoom <= 1.05) return;
    isDragging = true;
    imgWrap.classList.add("is-dragging");
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startPanX = panX;
    startPanY = panY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDragging) return;
    panX = startPanX + (e.clientX - dragStartX);
    panY = startPanY + (e.clientY - dragStartY);
    applyTransform();
  });

  document.addEventListener("mouseup", function () {
    if (isDragging) {
      isDragging = false;
      imgWrap.classList.remove("is-dragging");
    }
  });

  // Touch: pinch-to-zoom + swipe + drag
  var lastTouchDist = 0;
  var touchStartX = 0;
  var touchStartY = 0;
  var touchStartTime = 0;
  var isTouchPanning = false;

  imgWrap.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
      // Pinch start
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      if (zoom > 1.05) {
        isTouchPanning = true;
        startPanX = panX;
        startPanY = panY;
      }
    }
  }, { passive: true });

  imgWrap.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2) {
      // Pinch zoom
      var dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      var scale = dist / lastTouchDist;
      setZoom(zoom * scale, cx, cy);
      lastTouchDist = dist;
      e.preventDefault();
    } else if (e.touches.length === 1 && isTouchPanning) {
      // Pan while zoomed
      panX = startPanX + (e.touches[0].clientX - touchStartX);
      panY = startPanY + (e.touches[0].clientY - touchStartY);
      applyTransform();
      e.preventDefault();
    }
  }, { passive: false });

  imgWrap.addEventListener("touchend", function (e) {
    if (e.touches.length === 0 && !isTouchPanning) {
      // Swipe to navigate (only when not zoomed)
      if (zoom <= 1.05) {
        var diffX = e.changedTouches[0].clientX - touchStartX;
        var elapsed = Date.now() - touchStartTime;
        if (Math.abs(diffX) > 50 && elapsed < 400) {
          diffX > 0 ? show(currentIndex - 1) : show(currentIndex + 1);
        }
      }
    }
    isTouchPanning = false;
  });

  // Keyboard
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-active")) return;
    if (e.key === "Escape") hide();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
    if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom(zoom + ZOOM_STEP); }
    if (e.key === "-" || e.key === "_") { e.preventDefault(); setZoom(zoom - ZOOM_STEP); }
    if (e.key === "0") { e.preventDefault(); resetZoom(); }
  });
})();
