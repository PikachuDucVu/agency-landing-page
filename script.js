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

/* ── Newsletter Form ── */
const newsletterForm = document.getElementById("newsletter-form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector("input[type='email']");
    if (email && email.value.trim()) {
      // Replace with real API call when backend is ready
      email.value = "";
      email.placeholder = "Thanks! We'll be in touch.";
      setTimeout(() => {
        email.placeholder = "Your email";
      }, 3000);
    }
  });
}

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

/* ── Dynamic Year ── */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
