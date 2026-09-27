const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// Mobile menu
const toggle = document.querySelector(".nav__toggle");
const links = document.querySelector(".nav__links");

const closeMenu = () => {
  links.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
};

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});

links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") closeMenu();
});

// Scroll-driven effects: nav border, progress bar, contact button, timeline fill
const nav = document.querySelector(".nav");
const progress = document.querySelector(".progress");
const fab = document.querySelector(".fab");
const timeline = document.querySelector(".timeline");
const jobs = document.querySelectorAll(".job");
let ticking = false;

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const vh = window.innerHeight;

  nav.classList.toggle("is-scrolled", y > 8);
  progress.style.setProperty("--p", max > 0 ? y / max : 0);
  fab.classList.toggle("is-visible", y > 400);

  const rect = timeline.getBoundingClientRect();
  const fill = Math.min(Math.max((vh * 0.6 - rect.top) / rect.height, 0), 1);
  timeline.style.setProperty("--fill", fill);
  jobs.forEach((job) => {
    job.classList.toggle("is-passed", job.getBoundingClientRect().top < vh * 0.6);
  });

  ticking = false;
};

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

// Cursor glow and hero parallax
if (finePointer && !reduceMotion) {
  const root = document.documentElement;
  const art = document.querySelector(".hero__art");
  document.body.classList.add("has-pointer");

  window.addEventListener("pointermove", (e) => {
    root.style.setProperty("--cx", `${e.clientX}px`);
    root.style.setProperty("--cy", `${e.clientY}px`);
    art.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
    art.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
  }, { passive: true });
}

// Typing role rotator
const typed = document.querySelector(".typed");
if (typed && !reduceMotion) {
  const words = typed.dataset.words.split("|");
  let word = 0;
  let chars = words[0].length;
  let deleting = true;

  const tick = () => {
    const current = words[word];
    if (deleting) {
      chars--;
      if (chars === 0) {
        deleting = false;
        word = (word + 1) % words.length;
      }
    } else {
      chars++;
    }
    typed.textContent = words[word].slice(0, chars);

    let delay = deleting ? 45 : 90;
    if (!deleting && chars === words[word].length) {
      deleting = true;
      delay = 2200;
    }
    if (current !== words[word]) delay = 350;
    setTimeout(tick, delay);
  };
  setTimeout(tick, 3000);
}

// Count-up stats
if (!reduceMotion) {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    el.textContent = "0";
    setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 700);
  });
}

// Reveal on scroll, staggered within each group
let io;
if ("IntersectionObserver" in window && !reduceMotion) {
  io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  const groups = [
    [".section__head", 1],
    [".game", 4],
    [".skill", 3],
    [".job", 1],
    [".tools li", 12],
    [".edu", 1],
    [".contact__list li", 4],
  ];
  groups.forEach(([selector, perRow]) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--i", i % perRow);
      io.observe(el);
    });
  });
}

// Game genre filter
const chips = document.querySelectorAll(".chip");
const games = document.querySelectorAll(".game");

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    const filter = chip.dataset.filter;
    let shown = 0;
    games.forEach((game) => {
      const match = filter === "all" || game.dataset.genre === filter;
      game.classList.remove("pop");
      game.classList.toggle("is-hidden", !match);
      if (match) {
        if (io) io.unobserve(game);
        game.classList.add("is-visible");
        game.style.setProperty("--i", shown++);
        void game.offsetWidth; // restart the animation
        game.classList.add("pop");
      }
    });
  });
});

// 3D tilt + spotlight on game cards
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".game a").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--x", `${x * 100}%`);
      card.style.setProperty("--y", `${y * 100}%`);
      card.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
      card.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}

// Contact drawer
const drawer = document.getElementById("contact-drawer");
const backdrop = document.querySelector(".drawer-backdrop");
let lastFocus = null;
let closeTimer = null;

const openDrawer = (trigger) => {
  clearTimeout(closeTimer);
  closeMenu();
  lastFocus = trigger;
  drawer.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("drawer-open")));
  drawer.querySelector(".drawer__close").focus({ preventScroll: true });
};

const closeDrawer = () => {
  document.body.classList.remove("drawer-open");
  closeTimer = setTimeout(() => {
    drawer.hidden = true;
    backdrop.hidden = true;
  }, reduceMotion ? 0 : 450);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
};

document.querySelectorAll("[data-open-contact]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openDrawer(el);
  });
});
document.querySelectorAll("[data-close-contact]").forEach((el) => el.addEventListener("click", closeDrawer));

document.addEventListener("keydown", (e) => {
  if (drawer.hidden) return;
  if (e.key === "Escape") closeDrawer();
  if (e.key === "Tab") {
    const focusable = drawer.querySelectorAll("a, button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Copy email
const toast = document.querySelector(".toast");
let toastTimer = null;
const showToast = (msg) => {
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2000);
};

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      showToast("Email copied");
    } catch {
      showToast(btn.dataset.copy);
    }
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
