/* ============================================================
   Studio Neralu — Main JS (Cuberto-inspired)
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Year ---------- */
const setYear = () => {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
};

/* Lenis smooth scroll removed — using native browser scroll */

/* ---------- Sticky Header ---------- */
const initStickyHeader = () => {
  const header = $('#site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
};

/* ---------- Mobile Nav ---------- */
const initMobileNav = () => {
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  const hamburger = toggle ? toggle.querySelector('.hamburger') : null;
  if (!toggle || !links) return;

  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
    if (hamburger) hamburger.classList.remove('is-open');
  };

  toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(next));
    links.classList.toggle('is-open', next);
    if (hamburger) hamburger.classList.toggle('is-open', next);
  });

  document.addEventListener('click', (e) => {
    if (!links.classList.contains('is-open')) return;
    if (!(e.target instanceof Element)) return;
    if (links.contains(e.target) || toggle.contains(e.target)) return;
    close();
  });

  $$('#nav-links a').forEach((a) => a.addEventListener('click', close));
};

/* ---------- Custom Cursor ---------- */
const initCursor = () => {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = $('#cursor');
  if (!cursor) return;

  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (dot) {
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    }
  });

  // Ring lerps behind
  const animateRing = () => {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    if (ring) {
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
    }
    rafId = requestAnimationFrame(animateRing);
  };
  animateRing();

  // Hover states
  const hoverEls = 'a, button, .work-card, .service-item, .tag, .btn';
  $$(hoverEls).forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  });
};

/* ---------- GSAP Scroll Reveal ---------- */
const initScrollReveal = () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Fallback: IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
    );
    $$('.reveal-up').forEach((el) => {
      if (!el.classList.contains('is-in')) observer.observe(el);
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  $$('.reveal-up').forEach((el) => {
    const delay = parseFloat(el.dataset.delay || 0) / 1000;

    gsap.fromTo(
      el,
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });
};

/* ---------- Mailto Form ---------- */
const initMailtoForm = () => {
  const form = $('#contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const type = String(data.get('type') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!name || !email || !message) {
      alert('Please fill in your name, email, and message.');
      return;
    }

    const subject = encodeURIComponent(`Project enquiry — ${type}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\nMessage:\n${message}\n`
    );

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'contact_form_submit', {
        event_category: 'Contact',
        event_label: type,
      });
    }

    window.location.href = `mailto:ar.sampreethrao@studioneralu.com?subject=${subject}&body=${body}`;
  });
};

/* ---------- Default Works ---------- */
const DEFAULT_WORKS = [
  {
    id: '1',
    title: 'Parashurama Theme Park',
    description: 'Karkala — a panoramic setting with a strong cultural centerpiece.',
    category: 'Public',
    location: 'Karkala',
    image: 'assets/img/work-parashurama.jpg',
  },
  {
    id: '2',
    title: 'Bhagavathi Mane / Devi Nilaya',
    description: 'A home shaped by deep shade, layered roofs, and a calm courtyard rhythm.',
    category: 'Residence',
    location: 'India',
    image: 'assets/img/work-bhagavathi.jpg',
  },
  {
    id: '3',
    title: 'Bhagavathi Mane / Devi Nilaya',
    description: 'Traditional lines with a contemporary calm — crafted for everyday shade.',
    category: 'Residence',
    location: 'India',
    image: 'assets/img/work-bhagavathi-2.jpg',
  },
  {
    id: '4',
    title: 'Kadu Mane / Kutira',
    description: 'A humble home set within lush greens — quiet, grounded, and warm.',
    category: 'Residence',
    location: 'Kapoli',
    image: 'assets/img/work-kadu.jpg',
  },
];

/* ---------- Render Works ---------- */
const renderWorks = (works, container) => {
  if (!works || works.length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <p>No projects uploaded yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = works
    .map(
      (work, i) => `
    <article class="work-card reveal-up" data-delay="${i * 80}" style="opacity:0">
      <div class="work-media">
        <img
          class="work-img"
          src="${work.image}"
          alt="${work.title}"
          loading="${i < 2 ? 'eager' : 'lazy'}"
        />
      </div>
      <div class="work-body">
        <div class="work-meta">
          <span>${work.category}</span>
          <span>•</span>
          <span style="color:var(--muted)">${work.location}</span>
        </div>
        <h3 class="work-title">${work.title}</h3>
        <p class="work-desc">${work.description}</p>
      </div>
    </article>
  `
    )
    .join('');

  // Re-init scroll reveals for newly rendered cards
  initScrollReveal();

  // Re-init cursor hover for new cards
  if (!window.matchMedia('(pointer: coarse)').matches) {
    $$('.work-card').forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }
};

const sortWorksNewestFirst = (works) => {
  if (!Array.isArray(works)) return [];

  return [...works].sort((a, b) => {
    const aTime = a?.created_at
      ? new Date(a.created_at).getTime()
      : Number(a?.id || 0);
    const bTime = b?.created_at
      ? new Date(b.created_at).getTime()
      : Number(b?.id || 0);

    return bTime - aTime;
  });
};

const loadWorksFromLocalApi = async () => {
  const response = await fetch('/api/works');
  if (!response.ok) return null;
  const works = await response.json();
  return sortWorksNewestFirst(works);
};

/* ---------- Dynamic Works (Supabase) ---------- */
const initDynamicWorks = async () => {
  const container = $('#works-container');
  if (!container) return;

  try {
    const localWorks = await loadWorksFromLocalApi();
    if (localWorks) {
      if (localWorks.length === 0) {
        console.log('Local works DB empty — rendering offline defaults.');
        renderWorks(DEFAULT_WORKS, container);
        return;
      }

      renderWorks(localWorks, container);
      return;
    }
  } catch (err) {
    console.log('Local API unavailable — trying Supabase.', err);
  }

  const creds = window.getSupabaseCredentials
    ? window.getSupabaseCredentials()
    : { isConfigured: false };

  if (!creds.isConfigured) {
    console.log('Supabase not configured — rendering offline defaults.');
    renderWorks(DEFAULT_WORKS, container);
    return;
  }

  try {
    const supabaseClient = supabase.createClient(creds.url, creds.anonKey);
    const { data: works, error } = await supabaseClient.from('works').select('*');

    if (error) throw error;

    const sortedWorks = sortWorksNewestFirst(works);

    if (sortedWorks.length === 0) {
      console.log('Supabase DB empty — rendering offline defaults.');
      renderWorks(DEFAULT_WORKS, container);
      return;
    }

    renderWorks(sortedWorks, container);
  } catch (err) {
    console.error('Supabase error — falling back to local defaults:', err);
    renderWorks(DEFAULT_WORKS, container);
  }
};

/* ---------- Boot ---------- */
setYear();

initStickyHeader();
initMobileNav();
initCursor();
initScrollReveal();
initDynamicWorks();
initMailtoForm();
