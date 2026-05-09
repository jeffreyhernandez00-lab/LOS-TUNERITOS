document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".menu a");
  const internalLinks = document.querySelectorAll("a[href$='.HTML'], a[href$='.html']");
  const currentPage = getCurrentPageName();

  setActiveNavigation(navLinks, currentPage);
  enablePageTransitions(internalLinks, currentPage);
  enableHeaderResponsiveScroll();
  enableHistoriaEffects();
});

function getCurrentPageName() {
  const path = window.location.pathname;
  const fileName = path.substring(path.lastIndexOf("/") + 1);
  return (fileName || "INDEX.HTML").toUpperCase();
}

function setActiveNavigation(navLinks, currentPage) {
  navLinks.forEach((link) => {
    const href = (link.getAttribute("href") || "").toUpperCase();
    const isCurrent = href === currentPage;

    link.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function enablePageTransitions(links, currentPage) {
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = (link.getAttribute("href") || "").toUpperCase();
      if (!target || target === currentPage) {
        return;
      }

      event.preventDefault();
      document.body.classList.add("page-leave");
      window.setTimeout(() => {
        window.location.href = link.getAttribute("href");
      }, 160);
    });
  });
}

function enableHeaderResponsiveScroll() {
  const header = document.querySelector("header");
  if (!header) {
    return;
  }

  const maxScroll = 240;
  const easeFactor = 0.24;
  let targetShrink = 0;
  let currentShrink = 0;
  let animating = false;

  const paint = () => {
    header.style.setProperty("--scroll-shrink", String(currentShrink));
  };

  const animate = () => {
    currentShrink += (targetShrink - currentShrink) * easeFactor;

    if (Math.abs(targetShrink - currentShrink) < 0.0015) {
      currentShrink = targetShrink;
      paint();
      animating = false;
      return;
    }

    paint();
    window.requestAnimationFrame(animate);
  };

  const onScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    targetShrink = Math.min(scrollY / maxScroll, 1);

    if (!animating) {
      animating = true;
      window.requestAnimationFrame(animate);
    }
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function enableHistoriaEffects() {
  enableDecorParallax();

  if (!document.body.classList.contains("historia-page")) {
    return;
  }

  enableHistoriaRevealOnScroll();
}

function enableHistoriaRevealOnScroll() {
  const revealItems = document.querySelectorAll(".reveal-on-scroll");
  if (revealItems.length === 0) {
    return;
  }

  revealItems.forEach((item) => {
    const delay = Number(item.getAttribute("data-delay") || 0);
    item.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function enableDecorParallax() {
  const ornaments = Array.from(document.querySelectorAll(".historia-bg [data-parallax]"))
    .map((el) => ({ el, section: el.closest(".page") }))
    .filter((item) => item.section);

  if (ornaments.length === 0) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    return;
  }

  let ticking = false;

  const update = () => {
    ornaments.forEach(({ el, section }) => {
      const rect = section.getBoundingClientRect();
      const sectionCenterOffset = rect.top + rect.height * 0.5 - window.innerHeight * 0.5;
      const normalized = Math.max(-1, Math.min(1, sectionCenterOffset / window.innerHeight));
      const factor = Number(el.getAttribute("data-parallax") || 0);
      const y = normalized * factor * -42;
      const x = normalized * factor * 16;
      el.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
      el.style.setProperty("--parallax-x", `${x.toFixed(2)}px`);
    });

    ticking = false;
  };

  const onScroll = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}
