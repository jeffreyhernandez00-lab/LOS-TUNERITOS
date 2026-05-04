document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".menu a");
  const internalLinks = document.querySelectorAll("a[href$='.HTML'], a[href$='.html']");
  const currentPage = getCurrentPageName();

  setActiveNavigation(navLinks, currentPage);
  enablePageTransitions(internalLinks, currentPage);
  enableHeaderResponsiveScroll();
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
