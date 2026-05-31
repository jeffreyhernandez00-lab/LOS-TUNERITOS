document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".menu a");
  const internalLinks = document.querySelectorAll("a[href$='.HTML'], a[href$='.html']");
  const currentPage = getCurrentPageName();

  setActiveNavigation(navLinks, currentPage);
  enablePageTransitions(internalLinks, currentPage);
  enableHeaderResponsiveScroll();
  enableHistoriaEffects();
  enableOrderSystem();
  enableHarvestTopics();
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

function enableOrderSystem() {
  const orderApp = document.getElementById("pedidoApp");
  if (!orderApp) {
    return;
  }

  const productCards = Array.from(document.querySelectorAll(".product-card"));
  const orderList = document.getElementById("pedidoItems");
  const emptyState = document.getElementById("pedidoEmpty");
  const totalItemsEl = document.getElementById("totalItems");
  const totalPriceEl = document.getElementById("totalPrice");
  const counterPill = document.getElementById("orderCounterPill");
  const whatsappBtn = document.getElementById("whatsappOrderBtn");
  const whatsappNumber = sanitizePhone(orderApp.dataset.whatsapp || "");

  if (!orderList || !emptyState || !totalItemsEl || !totalPriceEl || !counterPill || !whatsappBtn) {
    return;
  }

  const cart = new Map();

  productCards.forEach((card) => {
    const addBtn = card.querySelector(".add-to-order-btn");
    if (!addBtn) {
      return;
    }

    if (card.dataset.comingSoon === "true") {
      addBtn.disabled = true;
      addBtn.setAttribute("aria-disabled", "true");
      return;
    }

    addBtn.addEventListener("click", () => {
      const item = readProductData(card);
      if (!item) {
        return;
      }

      const existing = cart.get(item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.set(item.id, { ...item, quantity: 1 });
      }

      renderOrder();
    });
  });

  orderList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionButton = target.closest("[data-action]");
    if (!(actionButton instanceof HTMLElement)) {
      return;
    }

    const action = actionButton.getAttribute("data-action");
    const productId = actionButton.getAttribute("data-product-id");
    if (!action || !productId || !cart.has(productId)) {
      return;
    }

    const item = cart.get(productId);
    if (!item) {
      return;
    }

    if (action === "increase") {
      item.quantity += 1;
    }

    if (action === "decrease") {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        cart.delete(productId);
      }
    }

    if (action === "remove") {
      cart.delete(productId);
    }

    renderOrder();
  });

  whatsappBtn.addEventListener("click", (event) => {
    if (whatsappBtn.classList.contains("disabled") || cart.size === 0) {
      event.preventDefault();
      return;
    }

    window.setTimeout(() => {
      cart.clear();
      renderOrder();
    }, 250);
  });

  renderOrder();

  function renderOrder() {
    const items = Array.from(cart.values());
    const hasItems = items.length > 0;

    emptyState.style.display = hasItems ? "none" : "block";
    orderList.innerHTML = hasItems ? items.map(renderItem).join("") : "";

    const totals = items.reduce(
      (acc, item) => {
        const lineTotal = item.price * item.quantity;
        acc.items += item.quantity;
        acc.total += lineTotal;
        return acc;
      },
      { items: 0, total: 0 }
    );

    totalItemsEl.textContent = String(totals.items);
    totalPriceEl.textContent = formatCurrency(totals.total);
    counterPill.textContent = `${totals.items} ${totals.items === 1 ? "producto" : "productos"} en tu pedido`;
    whatsappBtn.classList.toggle("disabled", !hasItems || !whatsappNumber);
    whatsappBtn.setAttribute("aria-disabled", (!hasItems || !whatsappNumber) ? "true" : "false");
    whatsappBtn.href = hasItems && whatsappNumber ? createWhatsAppLink(items, totals.total, whatsappNumber) : "#";
  }
}

function enableHarvestTopics() {
  const buttons = Array.from(document.querySelectorAll(".harvest-tag-btn"));
  const image = document.getElementById("harvestFeatureImage");
  const title = document.getElementById("harvestTopicTitle");
  const text = document.getElementById("harvestTopicText");
  const kicker = document.getElementById("harvestTopicKicker");
  const caption = document.getElementById("harvestFeatureCaption");
  const summary = document.querySelector(".harvest-summary");

  if (!image || !title || !text || !kicker || !caption || !summary || buttons.length === 0) {
    return;
  }

  const topics = {
    zacapa: {
      title: "Valle de La Fragua",
      text: "El melón se asocia al clima cálido de oriente, donde el riego y el cuidado del suelo ayudan al cultivo.",
      image: "cosecha-img/zacapa-motagua.jpg",
      alt: "Paisaje cálido del valle de Zacapa, Guatemala",
      kicker: "Zacapa, Guatemala",
      caption: "Valle agrícola de Zacapa",
    },
    riego: {
      title: "Riego",
      text: "En el corredor seco, el agua se maneja con cuidado para mantener surcos productivos y frutos sanos.",
      image: "cosecha-img/campo-melon.jpg",
      alt: "Campo de melón con surcos verdes y manejo de riego",
      kicker: "La Fragua",
      caption: "Surcos y manejo del agua",
    },
    frescura: {
      title: "Frescura",
      text: "Hojas, guías y frutos muestran el desarrollo del melón antes del corte manual.",
      image: "cosecha-img/planta-con-melon.jpg",
      alt: "Melón creciendo entre hojas verdes",
      kicker: "Cultivo de melón",
      caption: "Melón en planta",
    },
    calidad: {
      title: "Calidad",
      text: "La selección visual prioriza frutos con buen tamaño, color y textura para llegar al producto final.",
      image: "cosecha-img/seleccion-melones.jpg",
      alt: "Melones seleccionados por calidad",
      kicker: "Selección",
      caption: "Revisión y calidad",
    },
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const topicKey = button.dataset.harvestTopic;
      const topic = topics[topicKey];

      if (!topic) {
        return;
      }

      buttons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      image.classList.add("is-changing");
      summary.classList.add("is-changing");

      window.setTimeout(() => {
        image.src = topic.image;
        image.alt = topic.alt;
        caption.textContent = topic.caption;
        kicker.textContent = topic.kicker;
        title.textContent = topic.title;
        text.textContent = topic.text;

        image.classList.remove("is-changing");
        summary.classList.remove("is-changing");
      }, 140);
    });
  });
}

function readProductData(card) {
  const id = card.getAttribute("data-product-id");
  const name = card.getAttribute("data-product-name");
  const price = Number(card.getAttribute("data-price"));

  if (!id || !name || Number.isNaN(price)) {
    return null;
  }

  return { id, name, price };
}

function renderItem(item) {
  const subtotal = item.price * item.quantity;
  return `
    <li class="pedido-item">
      <div class="pedido-item-main">
        <h5>${escapeHtml(item.name)}</h5>
        <p>Unitario: <strong>${formatCurrency(item.price)}</strong> | Subtotal: <strong>${formatCurrency(subtotal)}</strong></p>
      </div>
      <div class="pedido-item-actions">
        <div class="qty-controls" aria-label="Controles de cantidad para ${escapeHtml(item.name)}">
          <button type="button" class="qty-btn" data-action="decrease" data-product-id="${escapeHtml(item.id)}" aria-label="Disminuir cantidad">-</button>
          <span class="qty-value" aria-live="polite">${item.quantity}</span>
          <button type="button" class="qty-btn" data-action="increase" data-product-id="${escapeHtml(item.id)}" aria-label="Aumentar cantidad">+</button>
        </div>
        <button type="button" class="item-remove-btn" data-action="remove" data-product-id="${escapeHtml(item.id)}">Eliminar</button>
      </div>
    </li>
  `;
}

function createWhatsAppLink(items, grandTotal, whatsappNumber) {
  const header = "Hola, quiero realizar este pedido de Los Tuneritos - Melon Gummies:";
  const lines = items.map((item) => {
    const lineTotal = item.price * item.quantity;
    return `- ${item.name} | Cantidad: ${item.quantity} | Unitario: ${formatCurrency(item.price)} | Total: ${formatCurrency(lineTotal)}`;
  });

  const footer = `Total general del pedido: ${formatCurrency(grandTotal)}`;
  const message = [header, "", ...lines, "", footer].join("\n");
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function sanitizePhone(phone) {
  return String(phone).replace(/[^\d]/g, "");
}

function formatCurrency(amount) {
  return `Q.${Number(amount).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

