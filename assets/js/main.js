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

  items.forEach((el) => {
    if (!el.classList.contains("is-in")) {
      observer.observe(el);
    }
  });
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

    // Google Analytics Event Tracking
    if (typeof window.gtag === "function") {
      window.gtag("event", "contact_form_submit", {
        event_category: "Contact",
        event_label: type
      });
    }

    window.location.href = `mailto:sam29rao@gmail.com?subject=${subject}&body=${body}`;
  });
};

// Resilient Offline/Placeholder Works in Case of Setup/Network Lag
const DEFAULT_WORKS = [
  {
    id: "1",
    title: "Parashurama Theme Park",
    description: "Karkala — a panoramic setting with a strong cultural centerpiece.",
    category: "Public",
    location: "Karkala",
    image: "assets/img/work-parashurama.jpg"
  },
  {
    id: "2",
    title: "Bhagavathi Mane / Devi Nilaya",
    description: "A home shaped by deep shade, layered roofs, and a calm courtyard rhythm.",
    category: "Residence",
    location: "India",
    image: "assets/img/work-bhagavathi.jpg"
  },
  {
    id: "3",
    title: "Bhagavathi Mane / Devi Nilaya",
    description: "Traditional lines with a contemporary calm—crafted for everyday shade.",
    category: "Residence",
    location: "India",
    image: "assets/img/work-bhagavathi-2.jpg"
  },
  {
    id: "4",
    title: "Kadu Mane / Kutira",
    description: "A humble home set within lush greens—quiet, grounded, and warm.",
    category: "Residence",
    location: "Kapoli",
    image: "assets/img/work-kadu.jpg"
  }
];

// Helper to inject HTML cards into grid
const renderWorks = (works, container) => {
  if (!works || works.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 3rem 1rem;">
        <p>No projects uploaded yet. Visit the admin dashboard to add works.</p>
      </div>`;
    return;
  }

  container.innerHTML = works
    .map(
      (work) => `
    <article class="card reveal">
      <div class="card-media" style="background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.28)), url('${work.image}') center/cover no-repeat;" role="img" aria-label="${work.title} — ${work.description}"></div>
      <div class="card-body">
        <h3>${work.title}</h3>
        <p>${work.description}</p>
        <div class="card-meta">
          <span>${work.category}</span>
          <span>•</span>
          <span>${work.location}</span>
        </div>
      </div>
    </article>
  `
    )
    .join("");

  // Trigger scroll reveals for dynamic elements
  initReveal();
};

const initDynamicWorks = async () => {
  const container = $("#works-container");
  if (!container) return;

  // 1. Resolve Supabase config dynamically
  const creds = window.getSupabaseCredentials ? window.getSupabaseCredentials() : { isConfigured: false };

  if (!creds.isConfigured) {
    console.log("Supabase is not configured yet. Rendering offline defaults.");
    renderWorks(DEFAULT_WORKS, container);
    return;
  }

  try {
    // 2. Initialize Supabase Client
    const supabaseClient = supabase.createClient(creds.url, creds.anonKey);
    
    // 3. Fetch from Postgres works table
    const { data: works, error } = await supabaseClient
      .from("works")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // If table is newly created but empty, render default works so the site remains beautiful!
    if (!works || works.length === 0) {
      console.log("Supabase database empty. Rendering offline defaults.");
      renderWorks(DEFAULT_WORKS, container);
      return;
    }

    renderWorks(works, container);
  } catch (err) {
    console.error("Supabase load error. Falling back to local default works:", err);
    // Keep user site 100% active even in case of database or connection limits
    renderWorks(DEFAULT_WORKS, container);
  }
};

// Initializers
setYear();
initStickyHeader();
initMobileNav();
initReveal();
initDynamicWorks();
initMailtoForm();
