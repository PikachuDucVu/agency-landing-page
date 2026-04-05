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
