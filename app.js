/* =====================================================
   EDP - Eau de Parfum | app.js
   Reads live data from admin localStorage settings.
   Features: Products, Cart, Animations, Auth, Orders,
             Discount display, Dynamic site branding.
   ===================================================== */

'use strict';

/* â•â• STORAGE KEYS (must match admin.js) â•â• */
const SETTINGS_KEY = 'edp_site_settings';
const PRODUCTS_KEY = 'edp_products';
const CART_KEY = 'edp_cart';
const CHECKOUT_PROFILE_KEY = 'edp_checkout_profile';

/* â•â• FALLBACK DEFAULTS (used if admin never saved) â•â• */
const DEFAULT_SETTINGS = {
  siteName:         'EDP',
  siteTagline:      'Trust Your Own Nose.',
  heroHeadline:     'TRUST',
  heroLine2:        'YOUR OWN',
  heroLine3:        'NOSE.',
  heroSub:          'Premium artisanal fragrances for the souls who dare to be remembered.',
  announcementText: 'FREE SHIPPING ON ORDERS ABOVE Tk 1500 | CASH ON DELIVERY AVAILABLE | AUTHENTIC FRAGRANCES | TRUST YOUR OWN NOSE',
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
    description: "Dark florals meet midnight musk. Nocturne is the scent of secrets - rose absolute on a bed of patchouli, sealed with white cedarwood. It lingers long after you've left.",
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

/* â•â• LOAD FROM LOCALSTORAGE â•â• */
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

/* â•â• PRICE HELPER (apply discount) â•â• */
function finalPrice(size) {
  const disc = size.discountPct || 0;
  return disc > 0 ? Math.round(size.price * (1 - disc / 100)) : size.price;
}

function formatCurrency(value) {
  return `Tk ${Number(value || 0).toLocaleString()}`;
}

function priceHTML(size) {
  const disc = size.discountPct || 0;
  if (disc > 0) {
    return `<span class="price-original">${formatCurrency(size.price)}</span> <span class="price-discounted">${formatCurrency(finalPrice(size))}</span> <span class="price-discount-badge">-${disc}%</span>`;
  }
  return formatCurrency(size.price);
}

/* â•â• STATE â•â• */
let PRODUCTS = [];
let SITE     = {};
let cart     = [];
let currentProduct = null;
let currentSizeIndex = 0;
let testimonialIdx   = 0;
let currentUser      = null;
let fbAuth           = null;
let fbDb             = null;

/* â•â• INIT â•â• */
document.addEventListener('DOMContentLoaded', () => {
  initFirebaseClient();
  SITE     = getSiteSettings();
  PRODUCTS = getProducts();

  applySiteSettings();
  loadCart();
  renderProducts();
  initHeroReveal();
  initScrollReveal();
  initNav();
  initCart();
  initAuth();
  initCheckout();
  initTestimonials();
  initNewsletter();
  initCursorEffects();
});

function initFirebaseClient() {
  try {
    if (!window.firebase || !window.EDP_FIREBASE_CONFIG) return;
    if (!firebase.apps.length) firebase.initializeApp(window.EDP_FIREBASE_CONFIG);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();
  } catch (err) {
    console.error('Firebase init failed', err);
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   APPLY SITE SETTINGS TO DOM
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function applySiteSettings() {
  const s = SITE;

  /* Page title */
  document.title = `${s.siteName} | Eau de Parfum - ${s.siteTagline}`;

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

  const footerPhone = document.getElementById('footer-phone');
  if (footerPhone && s.phoneNumber) footerPhone.href = `tel:${s.phoneNumber}`;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HERO REVEAL
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initHeroReveal() {
  const content = document.querySelector('.hero-content');
  if (!content) return;
  requestAnimationFrame(() => setTimeout(() => content.classList.add('revealed'), 100));
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SCROLL REVEAL
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   NAVBAR SCROLL EFFECT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initNav() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   RENDER PRODUCTS (from localStorage)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
            ? `<s style="color:#aaa;font-size:14px">${formatCurrency(s0.price)}</s> <strong>${formatCurrency(fp)}</strong>`
            : `${formatCurrency(fp)}`
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

    card.querySelector('.product-quick-add').addEventListener('click', async (e) => {
      e.stopPropagation();
      await confirmAndAddToCart(p, s0, true);
    });

    grid.appendChild(card);
  });

  initScrollReveal();
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PRODUCT MODAL
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
          ? `<span class="size-price"><s style="opacity:.5">${formatCurrency(s.price)}</s> ${formatCurrency(fp)} <em style="font-size:9px">-${disc}%</em></span>`
          : `<span class="size-price">${formatCurrency(fp)}</span>`}
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
      <p class="modal-price" id="modalPrice">${formatCurrency(finalPrice(p.sizes[0]))}</p>
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
      document.getElementById('modalPrice').textContent = formatCurrency(finalPrice(currentProduct.sizes[currentSizeIndex]));
    });
  });

  document.getElementById('modalAddToCart').addEventListener('click', async () => {
    const added = await confirmAndAddToCart(currentProduct, currentProduct.sizes[currentSizeIndex], false);
    if (!added) return;
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
  if (!isAnyOverlayOpen()) document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CART
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initCart() {
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.getElementById('placeOrderBtn').addEventListener('click', openCheckoutModal);
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  if (!isAnyOverlayOpen()) document.body.style.overflow = '';
}

function sanitizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice ?? item.price ?? 0));
    const originalPrice = Math.max(0, Number(item.originalPrice ?? unitPrice));
    const discountPct = Math.max(0, Math.min(99, Number(item.discountPct || 0)));
    const productId = item.productId || item.id || '';
    const size = item.size || '';
    const name = item.name || 'Unnamed Product';
    const image = item.image || 'assets/product1.png';
    if (!productId || !size || !Number.isFinite(unitPrice)) return null;
    return { productId, name, size, unitPrice, originalPrice, discountPct, image, qty };
  }).filter(Boolean);
}

function computeCartSummary(items = cart) {
  let subtotal = 0;
  let grandTotal = 0;
  let totalQty = 0;
  items.forEach((item) => {
    subtotal += item.originalPrice * item.qty;
    grandTotal += item.unitPrice * item.qty;
    totalQty += item.qty;
  });
  return {
    subtotal,
    discountTotal: subtotal - grandTotal,
    grandTotal,
    totalQty,
  };
}

async function confirmAndAddToCart(product, size, quickAdd = false) {
  const productName = product?.name || 'Product';
  const sizeLabel = size?.ml || '';
  const price = finalPrice(size || { price: 0, discountPct: 0 });

  let confirmed = false;
  if (window.Swal) {
    const result = await Swal.fire({
      title: 'Confirm Add to Cart',
      html: `<strong>${productName}</strong><br/>${sizeLabel} | ${formatCurrency(price)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Add To Cart',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#111111',
      cancelButtonColor: '#6b7280',
    });
    confirmed = !!result.isConfirmed;
  } else {
    confirmed = window.confirm(`Add ${productName} (${sizeLabel}) to cart?`);
  }

  if (!confirmed) return false;
  addToCart(product, size, quickAdd);
  return true;
}

function addToCart(product, size, quickAdd = false) {
  const fp = finalPrice(size);
  const existing = cart.find((item) => item.productId === product.id && item.size === size.ml);

  if (existing) existing.qty += 1;
  else {
    cart.push({
      productId: product.id, name: product.name,
      size: size.ml, unitPrice: fp,
      originalPrice: size.price,
      discountPct: size.discountPct || 0,
      image: product.image, qty: 1,
    });
  }

  cart = sanitizeCart(cart);
  saveCart(); renderCart(); updateCartCount(true);
  showToast(`${product.name} (${size.ml}) added to cart`);
  if (quickAdd) setTimeout(() => openCart(), 300);
}

function removeFromCart(productId, size) {
  cart = cart.filter((item) => !(item.productId === productId && item.size === size));
  saveCart(); renderCart(); updateCartCount(false);
}

function updateQty(productId, size, delta) {
  const item = cart.find((x) => x.productId === productId && x.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(productId, size); return; }
  saveCart(); renderCart(); updateCartCount(false);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const empty     = document.getElementById('cartEmpty');
  const footer    = document.getElementById('cartFooter');
  const totalEl   = document.getElementById('cartTotal');
  const orderBtn  = document.getElementById('placeOrderBtn');

  if (cart.length === 0) {
    container.innerHTML = '';
    container.appendChild(empty);
    empty.style.display = 'block';
    footer.style.display = 'none';
    if (orderBtn) orderBtn.disabled = true;
    return;
  }

  empty.style.display = 'none';
  footer.style.display = 'block';
  container.innerHTML = '';
  if (orderBtn) orderBtn.disabled = false;

  const summary = computeCartSummary();
  totalEl.textContent = formatCurrency(summary.grandTotal);

  cart.forEach((item) => {
    const lineTotal = item.unitPrice * item.qty;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='assets/product1.png'" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-size">${item.size} | EDP${item.discountPct > 0 ? ` | <span style="color:#3ecf8e;font-size:9px">-${item.discountPct}% OFF</span>` : ''}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" aria-label="Decrease quantity">-</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" aria-label="Increase quantity">+</button>
        </div>
        <span class="cart-item-remove">REMOVE</span>
      </div>
      <span class="cart-item-price">${formatCurrency(lineTotal)}</span>
    `;

    const [minus, plus] = el.querySelectorAll('.qty-btn');
    minus.addEventListener('click', () => updateQty(item.productId, item.size, -1));
    plus.addEventListener('click',  () => updateQty(item.productId, item.size, 1));
    el.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(item.productId, item.size));
    container.appendChild(el);
  });

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

function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    cart = sanitizeCart(saved ? JSON.parse(saved) : []);
  } catch { cart = []; }
  renderCart();
  updateCartCount(false);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TESTIMONIALS SLIDER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initAuth() {
  const accountBtn = document.getElementById('accountBtn');
  const authOverlay = document.getElementById('authOverlay');
  const authClose = document.getElementById('authClose');

  accountBtn?.addEventListener('click', openAuthModal);
  authOverlay?.addEventListener('click', closeAuthModal);
  authClose?.addEventListener('click', closeAuthModal);
  document.getElementById('authTabLogin')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('authTabSignup')?.addEventListener('click', () => switchAuthTab('signup'));
  document.getElementById('authLoginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('authSignupForm')?.addEventListener('submit', handleSignup);
  document.getElementById('authGoogleBtn')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('authLogoutBtn')?.addEventListener('click', handleLogout);

  if (!fbAuth) {
    const statusEl = document.getElementById('authStatusText');
    if (statusEl) statusEl.textContent = 'Auth service is not configured. Guest checkout is available.';
    return;
  }

  fbAuth.onAuthStateChanged((user) => {
    currentUser = user || null;
    updateAuthUI();
    prefillCheckoutForm();
  });
}

function openAuthModal() {
  document.getElementById('authOverlay')?.classList.add('open');
  document.getElementById('authModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authOverlay')?.classList.remove('open');
  document.getElementById('authModal')?.classList.remove('open');
  if (!isAnyOverlayOpen()) document.body.style.overflow = '';
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('authTabLogin')?.classList.toggle('active', isLogin);
  document.getElementById('authTabSignup')?.classList.toggle('active', !isLogin);
  document.getElementById('authLoginForm')?.classList.toggle('active', isLogin);
  document.getElementById('authSignupForm')?.classList.toggle('active', !isLogin);
}

function updateAuthUI() {
  const accountBtn = document.getElementById('accountBtn');
  const statusEl = document.getElementById('authStatusText');
  const logoutBtn = document.getElementById('authLogoutBtn');
  if (!accountBtn) return;

  if (currentUser) {
    const label = currentUser.displayName || currentUser.email || 'ACCOUNT';
    accountBtn.textContent = label.length > 14 ? `${label.slice(0, 14)}...` : label;
    if (statusEl) statusEl.textContent = `Logged in as ${currentUser.email || 'user'}`;
    if (logoutBtn) logoutBtn.style.display = 'block';
  } else {
    accountBtn.textContent = 'ACCOUNT';
    if (statusEl) statusEl.textContent = 'Continue as guest or login for faster checkout.';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  if (!fbAuth) return showServiceError('Login unavailable right now');

  const email = document.getElementById('authLoginEmail')?.value.trim();
  const password = document.getElementById('authLoginPassword')?.value;
  try {
    await fbAuth.signInWithEmailAndPassword(email, password);
    closeAuthModal();
    showToast('Login successful');
  } catch (err) {
    notifyError(getFriendlyError(err));
  }
}

async function handleSignup(e) {
  e.preventDefault();
  if (!fbAuth) return showServiceError('Sign up unavailable right now');

  const email = document.getElementById('authSignupEmail')?.value.trim();
  const password = document.getElementById('authSignupPassword')?.value;
  const confirm = document.getElementById('authSignupPasswordConfirm')?.value;
  if (password !== confirm) return notifyError('Password confirmation does not match');

  try {
    await fbAuth.createUserWithEmailAndPassword(email, password);
    closeAuthModal();
    showToast('Account created');
  } catch (err) {
    notifyError(getFriendlyError(err));
  }
}

async function handleGoogleSignIn() {
  if (!fbAuth) return showServiceError('Google login unavailable right now');
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await fbAuth.signInWithPopup(provider);
    closeAuthModal();
    showToast('Login successful');
  } catch (err) {
    notifyError(getFriendlyError(err));
  }
}

async function handleLogout() {
  if (!fbAuth) return;
  try {
    await fbAuth.signOut();
    showToast('Logged out');
  } catch (err) {
    notifyError(getFriendlyError(err));
  }
}
function initCheckout() {
  document.getElementById('checkoutOverlay')?.addEventListener('click', closeCheckoutModal);
  document.getElementById('checkoutClose')?.addEventListener('click', closeCheckoutModal);
  document.getElementById('checkoutForm')?.addEventListener('submit', submitOrder);
  ['orderName', 'orderPhone', 'orderAddress', 'orderLocation', 'orderNote'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => setCheckoutFieldErrors({}));
  });
}

function openCheckoutModal() {
  if (!cart.length) return notifyError('Cart is empty');
  prefillCheckoutForm();
  setCheckoutFieldErrors({});
  document.getElementById('checkoutOverlay')?.classList.add('open');
  document.getElementById('checkoutModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutOverlay')?.classList.remove('open');
  document.getElementById('checkoutModal')?.classList.remove('open');
  if (!isAnyOverlayOpen()) document.body.style.overflow = '';
}

function getCheckoutProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHECKOUT_PROFILE_KEY) || '{}');
    return {
      name: String(raw.name || ''),
      phone: String(raw.phone || ''),
      address: String(raw.address || ''),
      location: String(raw.location || ''),
      note: String(raw.note || ''),
    };
  } catch {
    return { name: '', phone: '', address: '', location: '', note: '' };
  }
}

function persistCheckoutProfile(profile) {
  localStorage.setItem(CHECKOUT_PROFILE_KEY, JSON.stringify(profile));
}

function prefillCheckoutForm() {
  const profile = getCheckoutProfile();
  const nameEl = document.getElementById('orderName');
  const phoneEl = document.getElementById('orderPhone');
  const addressEl = document.getElementById('orderAddress');
  const locationEl = document.getElementById('orderLocation');
  const noteEl = document.getElementById('orderNote');
  if (!nameEl || !phoneEl || !addressEl || !locationEl || !noteEl) return;

  nameEl.value = profile.name || currentUser?.displayName || nameEl.value || '';
  phoneEl.value = profile.phone || phoneEl.value || '';
  addressEl.value = profile.address || addressEl.value || '';
  locationEl.value = profile.location || locationEl.value || '';
  noteEl.value = profile.note || noteEl.value || '';
}

function setCheckoutFieldErrors(errors = {}) {
  const fieldMap = {
    name: { inputId: 'orderName', errorId: 'orderNameError' },
    phone: { inputId: 'orderPhone', errorId: 'orderPhoneError' },
    address: { inputId: 'orderAddress', errorId: 'orderAddressError' },
    location: { inputId: 'orderLocation', errorId: 'orderLocationError' },
  };

  Object.values(fieldMap).forEach(({ inputId, errorId }) => {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.remove('input-error');
    if (error) error.textContent = '';
  });

  Object.entries(errors).forEach(([key, message]) => {
    const meta = fieldMap[key];
    if (!meta) return;
    const input = document.getElementById(meta.inputId);
    const error = document.getElementById(meta.errorId);
    if (input) input.classList.add('input-error');
    if (error) error.textContent = message;
  });
}

function validateCheckoutInput(data) {
  const errors = {};
  if (!data.name) errors.name = 'Name is required.';
  if (!data.phone) errors.phone = 'Phone number is required.';
  if (!data.address) errors.address = 'Address is required.';
  if (!data.location) errors.location = 'Location is required.';

  setCheckoutFieldErrors(errors);
  const firstError = Object.values(errors)[0] || '';
  return {
    isValid: Object.keys(errors).length === 0,
    firstError,
  };
}

async function submitOrder(e) {
  e.preventDefault();
  if (!cart.length) return notifyError('Cart is empty');
  if (!fbDb) return showServiceError('Order service is not configured');
  const submitBtn = document.querySelector('#checkoutForm .checkout-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'SUBMITTING...';
  }

  const data = {
    name: document.getElementById('orderName')?.value.trim(),
    phone: document.getElementById('orderPhone')?.value.trim(),
    address: document.getElementById('orderAddress')?.value.trim(),
    location: document.getElementById('orderLocation')?.value.trim(),
    note: document.getElementById('orderNote')?.value.trim() || '',
  };

  const validation = validateCheckoutInput(data);
  if (!validation.isValid) {
    notifyError(validation.firstError || 'Please fill all required fields.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SUBMIT ORDER';
    }
    return;
  }

  const summary = computeCartSummary();
  const items = cart.map((item) => ({
    productId: item.productId,
    name: item.name,
    size: item.size,
    qty: item.qty,
    unitPrice: item.unitPrice,
    originalPrice: item.originalPrice,
    discountPct: item.discountPct,
    lineTotal: item.unitPrice * item.qty,
    image: item.image,
  }));

  const now = Date.now();
  const docRef = fbDb.collection('orders').doc();
  const orderId = `EDP-${now.toString(36).toUpperCase()}-${docRef.id.slice(0, 4).toUpperCase()}`;

  const payload = {
    orderId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdAtMs: now,
    status: 'pending',
    customer: {
      name: data.name,
      phone: data.phone,
      address: data.address,
      location: data.location,
      note: data.note,
    },
    customerAuth: {
      isGuest: !currentUser,
      uid: currentUser?.uid || null,
      email: currentUser?.email || null,
    },
    items,
    summary,
    meta: {
      source: 'storefront',
      userAgent: navigator.userAgent,
      appVersion: window.EDP_APP_VERSION || 'v2.0.0',
    },
  };

  try {
    await docRef.set(payload);
    persistCheckoutProfile(data);
    cart = [];
    saveCart();
    renderCart();
    updateCartCount(false);
    closeCheckoutModal();
    closeCart();

    if (window.Swal) {
      await Swal.fire({
        title: 'Order Placed',
        html: `Your order ID: <strong>${orderId}</strong>`,
        icon: 'success',
        confirmButtonColor: '#111111',
      });
    } else {
      window.alert(`Order placed: ${orderId}`);
    }
  } catch (err) {
    console.error(err);
    notifyError('Failed to submit order. Try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SUBMIT ORDER';
    }
  }
}
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   NEWSLETTER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value;
    if (!email) return;
    const btn = document.getElementById('newsletterSubmit');
    btn.textContent = 'SUBSCRIBED';
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   TOAST
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HERO CURSOR PARALLAX
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

function isAnyOverlayOpen() {
  return (
    document.getElementById('productModal')?.classList.contains('open') ||
    document.getElementById('cartDrawer')?.classList.contains('open') ||
    document.getElementById('authModal')?.classList.contains('open') ||
    document.getElementById('checkoutModal')?.classList.contains('open')
  );
}

function notifyError(message) {
  if (window.Swal) {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonColor: '#111111',
    });
  } else {
    window.alert(message);
  }
}

function showServiceError(message) {
  console.error(message);
  notifyError(message);
}

function getFriendlyError(err) {
  const fallback = 'Something went wrong. Please try again.';
  if (!err || !err.code) return fallback;
  const map = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'User not found.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'Email already in use.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google login was canceled.',
  };
  return map[err.code] || fallback;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ESC â€” close overlays
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeCart();
    closeAuthModal();
    closeCheckoutModal();
  }
});



