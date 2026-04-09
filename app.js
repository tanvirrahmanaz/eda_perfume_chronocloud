/* =====================================================
   EDP — Eau de Parfum | app.js
   Reads live data from admin localStorage settings.
   Features: Products, Cart, Animations, WhatsApp,
             Discount display, Dynamic site branding.
   ===================================================== */

'use strict';

/* ══ STORAGE KEYS (must match admin.js) ══ */
const SETTINGS_KEY = 'edp_site_settings';
const PRODUCTS_KEY = 'edp_products';
const STORE_WHATSAPP_NUMBER = '8801537237191';

/* ══ FALLBACK DEFAULTS (used if admin never saved) ══ */
const DEFAULT_SETTINGS = {
  siteName:         'EDP',
  siteTagline:      'Trust Your Own Nose.',
  heroHeadline:     'TRUST',
  heroLine2:        'YOUR OWN',
  heroLine3:        'NOSE.',
  heroSub:          'Premium artisanal fragrances for the souls who dare to be remembered.',
  announcementText: 'FREE SHIPPING ON ORDERS ABOVE ৳1500 · CASH ON DELIVERY AVAILABLE · AUTHENTIC FRAGRANCES · TRUST YOUR OWN NOSE',
  whatsappNumber:   '01537237191',
  emailAddress:     'hello@edperfume.com',
  businessAddress:  'Dhaka, Bangladesh',
  instagramUrl:     '#',
  facebookUrl:      '#',
  tiktokUrl:        '#',
  freeShippingMin:  1500,
  codAvailable:     'yes',
};

const DEFAULT_PRODUCTS = [
  {
    id: 'aurevo', name: 'AUREVO', type: 'Eau de Parfum', badge: 'BESTSELLER',
    description: 'A bold alchemy of black pepper, smoky vetiver, and warm amber. Aurevo was crafted for those who walk into a room and own it. A singular, confident scent that refuses to apologise.',
    notes: ['Black Pepper', 'Vetiver', 'Amber', 'Oud', 'Bergamot'],
    image: 'assets/product1.png',
    sizes: [{ ml: '15ml', price: 650, discountPct: 0 }, { ml: '30ml', price: 1150, discountPct: 0 }],
  },
  {
    id: 'nocturne', name: 'NOCTURNE', type: 'Eau de Parfum', badge: 'NEW',
    description: "Dark florals meet midnight musk. Nocturne is the scent of secrets — rose absolute on a bed of patchouli, sealed with white cedarwood. It lingers long after you've left.",
    notes: ['Rose Absolute', 'Patchouli', 'White Cedar', 'Musk', 'Sandalwood'],
    image: 'assets/product2.png',
    sizes: [{ ml: '15ml', price: 700, discountPct: 0 }, { ml: '30ml', price: 1250, discountPct: 0 }],
  },
  {
    id: 'obsidia', name: 'OBSIDIA', type: 'Eau de Parfum', badge: '',
    description: 'Cold and crystalline. Obsidia opens with a sharp citrus burst before settling into an earthy, volcanic depth. A unisex composition built for any season, any moment.',
    notes: ['Citrus', 'Rock Salt', 'Iris', 'Cedarwood', 'Grey Amber'],
    image: 'assets/product3.png',
    sizes: [{ ml: '15ml', price: 600, discountPct: 0 }, { ml: '30ml', price: 1100, discountPct: 0 }],
  },
  {
    id: 'velvet-noir', name: 'VELVET NOIR', type: 'Eau de Parfum', badge: 'LIMITED',
    description: 'An opulent, velvety embrace. Dark plum and saffron heart resting on Tonka bean and black vanilla. A luxury composition inspired by the quietest hours of a winter night.',
    notes: ['Dark Plum', 'Saffron', 'Tonka Bean', 'Black Vanilla', 'Labdanum'],
    image: 'assets/product4.png',
    sizes: [{ ml: '15ml', price: 800, discountPct: 0 }, { ml: '30ml', price: 1450, discountPct: 0 }],
  },
];

/* ══ LOAD FROM LOCALSTORAGE ══ */
function getSiteSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return s ? { ...DEFAULT_SETTINGS, ...s } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function getProducts() {
  try {
    const p = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
    return Array.isArray(p) && p.length ? p : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  } catch { return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)); }
}

function resolveWhatsAppNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return STORE_WHATSAPP_NUMBER;

  let normalized = digits;
  if (digits.startsWith('0')) normalized = `88${digits}`;

  if (normalized.length < 11) return STORE_WHATSAPP_NUMBER;
  return normalized;
}

/* ══ PRICE HELPER (apply discount) ══ */
function finalPrice(size) {
  const disc = size.discountPct || 0;
  return disc > 0 ? Math.round(size.price * (1 - disc / 100)) : size.price;
}

function priceHTML(size) {
  const disc = size.discountPct || 0;
  if (disc > 0) {
    return `<span class="price-original">৳${size.price}</span> <span class="price-discounted">৳${finalPrice(size)}</span> <span class="price-discount-badge">-${disc}%</span>`;
  }
  return `৳${size.price}`;
}

/* ══ STATE ══ */
let PRODUCTS = [];
let SITE     = {};
let cart     = [];
let currentProduct = null;
let currentSizeIndex = 0;
let testimonialIdx   = 0;

/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', () => {
  SITE     = getSiteSettings();
  PRODUCTS = getProducts();

  applySiteSettings();
  loadCart();
  renderProducts();
  initHeroReveal();
  initScrollReveal();
  initNav();
  initCart();
  initTestimonials();
  initNewsletter();
  initCursorEffects();
});

/* ─────────────────────────────────────────
   APPLY SITE SETTINGS TO DOM
───────────────────────────────────────── */
function applySiteSettings() {
  const s = SITE;

  /* Page title */
  document.title = `${s.siteName} | Eau de Parfum — ${s.siteTagline}`;

  /* Logo */
  const logoText = document.querySelector('.logo-text');
  const footerLogo = document.querySelector('.footer-logo');
  const sLogo = document.querySelector('.s-logo-text');
  const footerWordmark = document.querySelector('.footer-wordmark');
  if (logoText) logoText.textContent = s.siteName;
  if (footerLogo) footerLogo.textContent = s.siteName;
  if (footerWordmark) footerWordmark.textContent = s.siteName;

  /* Tagline */
  const footerTagline = document.querySelector('.footer-tagline');
  if (footerTagline) footerTagline.textContent = s.siteTagline;

  /* Hero headline */
  const heroLines = document.querySelectorAll('.hero-line');
  if (heroLines[0]) heroLines[0].textContent = s.heroHeadline;
  if (heroLines[1]) heroLines[1].textContent = s.heroLine2;
  if (heroLines[2]) heroLines[2].textContent = s.heroLine3;

  /* Hero subtitle */
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) heroSub.textContent = s.heroSub;

  /* Announcement bar */
  const marquee = document.querySelector('.marquee-track span');
  if (marquee && s.announcementText) {
    const txt = `${s.announcementText} &nbsp;&nbsp;&bull;&nbsp;&nbsp; ${s.announcementText} &nbsp;&nbsp;&bull;&nbsp;&nbsp;`;
    marquee.innerHTML = txt;
  }

  /* Contact links */
  const footerWA = document.getElementById('footer-whatsapp');
  if (footerWA) footerWA.href = `https://wa.me/${resolveWhatsAppNumber(s.whatsappNumber)}`;

  const footerEmail = document.getElementById('footer-email');
  if (footerEmail) { footerEmail.href = `mailto:${s.emailAddress}`; footerEmail.textContent = s.emailAddress; }

  const footerAddr = document.querySelector('.footer-address');
  if (footerAddr) footerAddr.textContent = s.businessAddress;

  /* Social links */
  const ig = document.getElementById('footer-instagram');
  const fb = document.getElementById('footer-facebook');
  const tt = document.getElementById('footer-tiktok');
  if (ig) ig.href = s.instagramUrl || '#';
  if (fb) fb.href = s.facebookUrl  || '#';
  if (tt) tt.href = s.tiktokUrl    || '#';

  /* WhatsApp checkout button number is used at checkout time via SITE.whatsappNumber */
}

/* ─────────────────────────────────────────
   HERO REVEAL
───────────────────────────────────────── */
function initHeroReveal() {
  const content = document.querySelector('.hero-content');
  if (!content) return;
  requestAnimationFrame(() => setTimeout(() => content.classList.add('revealed'), 100));
}

/* ─────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────── */
function initScrollReveal() {
  const revealEls    = document.querySelectorAll('[data-reveal]');
  const productCards = document.querySelectorAll('.product-card');
  const processSteps = document.querySelectorAll('.process-step');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;
        setTimeout(() => el.classList.add('revealed'), delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12 });

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const idx = [...productCards].indexOf(el);
        setTimeout(() => el.classList.add('visible'), idx * 80);
        cardObserver.unobserve(el);
      }
    });
  }, { threshold: 0.1 });

  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;
        setTimeout(() => el.classList.add('visible'), delay);
        stepObserver.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => observer.observe(el));
  productCards.forEach((el) => cardObserver.observe(el));
  processSteps.forEach((el) => stepObserver.observe(el));
}

/* ─────────────────────────────────────────
   NAVBAR SCROLL EFFECT
───────────────────────────────────────── */
function initNav() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });
}

/* ─────────────────────────────────────────
   RENDER PRODUCTS (from localStorage)
───────────────────────────────────────── */
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  PRODUCTS.forEach((p) => {
    const s0   = p.sizes[0];
    const disc = s0.discountPct || 0;
    const fp   = finalPrice(s0);

    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${p.name}`);

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.name} perfume bottle" loading="lazy" onerror="this.src='assets/product1.png'" />
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${disc > 0 ? `<span class="product-badge discount-badge">-${disc}%</span>` : ''}
        <div class="product-overlay">
          <button class="product-quick-add" data-id="${p.id}" aria-label="Quick add ${p.name} to cart">
            + ADD TO CART
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-type">${p.type}</p>
        <div class="product-price-row">
          <span class="product-price">${disc > 0
            ? `<s style="color:#aaa;font-size:14px">৳${s0.price}</s> <strong>৳${fp}</strong>`
            : `৳${fp}`
          }</span>
          <div class="product-sizes">
            ${p.sizes.map((s) => `<span class="size-tag">${s.ml}</span>`).join('')}
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.product-quick-add')) return;
      openModal(p.id);
    });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openModal(p.id); });

    card.querySelector('.product-quick-add').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(p, s0, true);
    });

    grid.appendChild(card);
  });

  initScrollReveal();
}

/* ─────────────────────────────────────────
   PRODUCT MODAL
───────────────────────────────────────── */
function openModal(productId) {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return;

  currentProduct   = p;
  currentSizeIndex = 0;

  const buildSizeBtn = (s, i) => {
    const disc = s.discountPct || 0;
    const fp   = finalPrice(s);
    return `
      <button class="size-option ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-pressed="${i === 0}">
        ${s.ml}
        ${disc > 0
          ? `<span class="size-price"><s style="opacity:.5">৳${s.price}</s> ৳${fp} <em style="font-size:9px">-${disc}%</em></span>`
          : `<span class="size-price">৳${fp}</span>`}
      </button>`;
  };

  document.getElementById('modalInner').innerHTML = `
    <div class="modal-image-wrap">
      <img src="${p.image}" alt="${p.name}" onerror="this.src='assets/product1.png'" />
    </div>
    <div class="modal-details">
      <p class="modal-label">${p.type.toUpperCase()}</p>
      <h2 class="modal-name">${p.name}</h2>
      <p class="modal-type">EDP | Eau de Parfum</p>
      <div class="modal-divider"></div>
      <p class="modal-desc">${p.description}</p>
      <div class="modal-notes">
        <p class="modal-notes-title">FRAGRANCE NOTES</p>
        <div class="notes-list">
          ${p.notes.map((n) => `<span class="note-tag">${n}</span>`).join('')}
        </div>
      </div>
      <div class="modal-size-select">
        <p class="modal-size-title">SELECT SIZE</p>
        <div class="size-options" id="sizeOptions">
          ${p.sizes.map((s, i) => buildSizeBtn(s, i)).join('')}
        </div>
      </div>
      <p class="modal-price" id="modalPrice">৳${finalPrice(p.sizes[0])}</p>
      <button class="btn-add-to-cart" id="modalAddToCart"><span>ADD TO CART</span></button>
    </div>
  `;

  document.querySelectorAll('.size-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-option').forEach((b) => {
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      currentSizeIndex = parseInt(btn.dataset.idx);
      document.getElementById('modalPrice').textContent = `৳${finalPrice(currentProduct.sizes[currentSizeIndex])}`;
    });
  });

  document.getElementById('modalAddToCart').addEventListener('click', () => {
    addToCart(currentProduct, currentProduct.sizes[currentSizeIndex], false);
    closeModal();
    openCart();
  });

  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);

/* ─────────────────────────────────────────
   CART
───────────────────────────────────────── */
function initCart() {
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.getElementById('whatsappCheckout').addEventListener('click', checkoutWhatsApp);
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function addToCart(product, size, quickAdd = false) {
  const fp = finalPrice(size);
  const existing = cart.find((item) => item.id === product.id && item.size === size.ml);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id, name: product.name,
      size: size.ml, price: fp,
      originalPrice: size.price,
      discountPct: size.discountPct || 0,
      image: product.image, qty: 1,
    });
  }

  saveCart(); renderCart(); updateCartCount(true);
  showToast(`${product.name} (${size.ml}) added to cart`);
  if (quickAdd) setTimeout(() => openCart(), 300);
}

function removeFromCart(id, size) {
  cart = cart.filter((item) => !(item.id === id && item.size === size));
  saveCart(); renderCart(); updateCartCount(false);
}

function updateQty(id, size, delta) {
  const item = cart.find((x) => x.id === id && x.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id, size); return; }
  saveCart(); renderCart(); updateCartCount(false);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const empty     = document.getElementById('cartEmpty');
  const footer    = document.getElementById('cartFooter');
  const totalEl   = document.getElementById('cartTotal');

  if (cart.length === 0) {
    container.innerHTML = '';
    container.appendChild(empty);
    empty.style.display = 'block';
    footer.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  footer.style.display = 'block';
  container.innerHTML = '';

  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='assets/product1.png'" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-size">${item.size} · EDP${item.discountPct > 0 ? ` · <span style="color:#3ecf8e;font-size:9px">-${item.discountPct}% OFF</span>` : ''}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" aria-label="Decrease quantity">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" aria-label="Increase quantity">+</button>
        </div>
        <span class="cart-item-remove">REMOVE</span>
      </div>
      <span class="cart-item-price">৳${(item.price * item.qty).toLocaleString()}</span>
    `;

    const [minus, plus] = el.querySelectorAll('.qty-btn');
    minus.addEventListener('click', () => updateQty(item.id, item.size, -1));
    plus.addEventListener('click',  () => updateQty(item.id, item.size, 1));
    el.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(item.id, item.size));
    container.appendChild(el);
  });

  totalEl.textContent = `৳${total.toLocaleString()}`;
}

function updateCartCount(bump = false) {
  const count   = cart.reduce((sum, item) => sum + item.qty, 0);
  const countEl = document.getElementById('cartCount');
  countEl.textContent = count;
  if (bump) {
    countEl.classList.add('bump');
    setTimeout(() => countEl.classList.remove('bump'), 400);
  }
}

function saveCart() { localStorage.setItem('edp_cart', JSON.stringify(cart)); }

function loadCart() {
  try {
    const saved = localStorage.getItem('edp_cart');
    if (saved) { cart = JSON.parse(saved); renderCart(); updateCartCount(false); }
  } catch { cart = []; }
}

/* ─────────────────────────────────────────
   WHATSAPP CHECKOUT (uses admin number)
───────────────────────────────────────── */
function checkoutWhatsApp() {
  if (cart.length === 0) return;

  const settings  = getSiteSettings();
  const waNumber  = resolveWhatsAppNumber(settings.whatsappNumber);
  const brandName = settings.siteName       || 'EDP';
  const total     = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  let msg = `🌟 *${brandName} — Eau de Parfum*\n`;
  msg    += `─────────────────────\n`;
  msg    += `*New Order Request*\n\n`;

  cart.forEach((item) => {
    msg += `▸ *${item.name}* (${item.size})\n`;
    if (item.discountPct > 0) {
      msg += `  ~~৳${item.originalPrice}~~ → ৳${item.price} (-${item.discountPct}%)\n`;
    }
    msg += `  Qty: ${item.qty} × ৳${item.price.toLocaleString()} = ৳${(item.price * item.qty).toLocaleString()}\n\n`;
  });

  msg += `─────────────────────\n`;
  msg += `*TOTAL: ৳${total.toLocaleString()}*\n\n`;
  msg += `📍 ${settings.businessAddress || ''}\n`;
  msg += `Please confirm my order. Thank you! 🙏`;

  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ─────────────────────────────────────────
   TESTIMONIALS SLIDER
───────────────────────────────────────── */
function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  const dots  = document.querySelectorAll('.dot');
  let autoSlide;

  function goTo(idx) {
    testimonialIdx = idx;
    track.style.transform = `translateX(calc(-${idx * 100}% - ${idx * 2}px))`;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      clearInterval(autoSlide);
      goTo(parseInt(dot.dataset.idx));
      startAuto();
    });
  });

  function startAuto() {
    autoSlide = setInterval(() => goTo((testimonialIdx + 1) % 3), 4500);
  }

  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => (touchStartX = e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend',   (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      clearInterval(autoSlide);
      goTo(dx < 0 ? Math.min(testimonialIdx + 1, 2) : Math.max(testimonialIdx - 1, 0));
      startAuto();
    }
  });

  startAuto();
}

/* ─────────────────────────────────────────
   NEWSLETTER
───────────────────────────────────────── */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value;
    if (!email) return;
    const btn = document.getElementById('newsletterSubmit');
    btn.textContent = 'SUBSCRIBED ✓';
    btn.style.background = '#111';
    btn.disabled = true;
    showToast('Welcome to the inner circle.');
    form.reset();
    setTimeout(() => {
      btn.textContent = 'SUBSCRIBE';
      btn.style.background = '';
      btn.disabled = false;
    }, 4000);
  });
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

/* ─────────────────────────────────────────
   HERO CURSOR PARALLAX
───────────────────────────────────────── */
function initCursorEffects() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  hero.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = hero.getBoundingClientRect();
    const x = ((e.clientX - left) / width  - 0.5) * 20;
    const y = ((e.clientY - top)  / height - 0.5) * 20;
    const content = hero.querySelector('.hero-content');
    if (content) content.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px)`;
  });

  hero.addEventListener('mouseleave', () => {
    const content = hero.querySelector('.hero-content');
    if (content) content.style.transform = '';
  });
}

/* ─────────────────────────────────────────
   ESC — close overlays
───────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeCart(); }
});
