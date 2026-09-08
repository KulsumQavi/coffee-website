(() => {
  'use strict';

  /* ---------- Mobile nav toggle ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  menuToggle?.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    });
  });

  /* ---------- Shop dropdown (click + keyboard, works alongside CSS hover) ---------- */
  const shopToggle = document.getElementById('shopToggle');
  const shopMenu = document.getElementById('shopMenu');

  const closeShopMenu = () => {
    shopMenu?.classList.remove('open');
    shopToggle?.setAttribute('aria-expanded', 'false');
  };

  shopToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = shopMenu.classList.toggle('open');
    shopToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!shopToggle?.contains(e.target) && !shopMenu?.contains(e.target)) {
      closeShopMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeShopMenu();
  });

  /* ---------- Sticky header shadow on scroll ---------- */
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');

  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    header?.classList.toggle('scrolled', scrolled);
    if (backToTop) backToTop.hidden = window.scrollY < 600 ? true : false;
    backToTop?.classList.toggle('visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Cart ---------- */
  const CART_KEY = 'brewhaven_cart';
  const cartBtn = document.getElementById('cartBtn');
  const cartPanel = document.getElementById('cartPanel');
  const cartClose = document.getElementById('cartClose');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartCountEl = document.getElementById('cartCount');
  const cartCheckout = document.getElementById('cartCheckout');
  const scrim = document.getElementById('scrim');

  const loadCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveCart = (cart) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable — cart still works in-memory for this session */
    }
  };

  let cart = loadCart();

  const formatPrice = (n) => `$${n.toFixed(2)}`;

  const renderCart = () => {
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = '';

    if (cart.length === 0) {
      const li = document.createElement('li');
      li.className = 'cart-empty';
      li.textContent = 'Your cart is waiting. Add something worth savouring.';
      cartItemsEl.appendChild(li);
    } else {
      cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-qty">Qty ${item.qty}</div>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">${formatPrice(item.price * item.qty)}</span>
            <button class="cart-item-remove" aria-label="Remove ${item.name} from cart" data-index="${index}">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="none" aria-hidden="true"><path d="M200 56 56 200M56 56l144 144" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>
            </button>
          </div>`;
        cartItemsEl.appendChild(li);
      });
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);
    if (cartCountEl) {
      cartCountEl.textContent = String(count);
      cartCountEl.hidden = count === 0;
    }
  };

  const addToCart = (name, price) => {
    const existing = cart.find((item) => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    saveCart(cart);
    renderCart();
    openCart();
  };

  const removeFromCart = (index) => {
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
  };

  const openCart = () => {
    cartPanel.hidden = false;
    requestAnimationFrame(() => cartPanel.setAttribute('data-open', 'true'));
    scrim?.classList.add('open');
    cartBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeCart = () => {
    cartPanel.setAttribute('data-open', 'false');
    scrim?.classList.remove('open');
    cartBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (cartPanel.getAttribute('data-open') === 'false') cartPanel.hidden = true;
    }, 400);
  };

  cartBtn?.addEventListener('click', () => {
    const isOpen = cartPanel.getAttribute('data-open') === 'true';
    isOpen ? closeCart() : openCart();
  });
  cartClose?.addEventListener('click', closeCart);
  scrim?.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartPanel.getAttribute('data-open') === 'true') closeCart();
  });

  cartItemsEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('.cart-item-remove');
    if (!btn) return;
    removeFromCart(Number(btn.dataset.index));
  });

  cartCheckout?.addEventListener('click', () => {
    if (cart.length === 0) return;
    cart = [];
    saveCart(cart);
    renderCart();
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(0);
    closeCart();
  });

  document.querySelectorAll('.add-to-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-name][data-price]') || btn;
      const name = card.dataset.name || btn.dataset.name;
      const price = parseFloat(card.dataset.price || btn.dataset.price);
      if (name && !Number.isNaN(price)) addToCart(name, price);
    });
  });

  renderCart();

  /* ---------- Newsletter form ---------- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterStatus = document.getElementById('newsletterStatus');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletterEmail');
    const email = input?.value.trim() || '';

    if (!emailPattern.test(email)) {
      newsletterStatus.textContent = 'That doesn’t look quite right — please check your email address.';
      return;
    }

    newsletterStatus.textContent = `Welcome to the table — we'll write to ${email} soon.`;
    newsletterForm.reset();
  });
})();
