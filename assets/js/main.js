const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const setYear = () => {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
};

const initStickyHeader = () => {
  const header = $(".site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-elevated", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
};

const initMobileNav = () => {
  const toggle = $(".nav-toggle");
  const links = $("#nav-links");
  if (!toggle || !links) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const next = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(next));
    links.classList.toggle("is-open", next);
  });

  document.addEventListener("click", (e) => {
    if (!links.classList.contains("is-open")) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (links.contains(target) || toggle.contains(target)) return;
    close();
  });

  $$("#nav-links a").forEach((a) => a.addEventListener("click", close));
};

const initReveal = () => {
  const items = $$(".reveal");
  if (!items.length) return;

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
  );

  items.forEach((el) => observer.observe(el));
};

const initMailtoForm = () => {
  const form = $("#contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const type = String(data.get("type") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !email || !message) {
      alert("Please fill in your name, email, and message.");
      return;
    }

    const subject = encodeURIComponent(`Project enquiry — ${type}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\nMessage:\n${message}\n`
    );

    window.location.href = `mailto:sam29rao@gmail.com?subject=${subject}&body=${body}`;
  });
};

setYear();
initStickyHeader();
initMobileNav();
initReveal();
initMailtoForm();

