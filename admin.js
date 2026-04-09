'use strict';

/* =====================================================
   EDP Admin Panel â€” admin.js
   All data saved to localStorage, main site reads it
   ===================================================== */

const SETTINGS_KEY = 'edp_site_settings';
const PRODUCTS_KEY  = 'edp_products';
const ORDERS_COLLECTION = 'orders';

/* â”€â”€ DEFAULT PRODUCTS (mirrors app.js) â”€â”€ */
const DEFAULT_PRODUCTS = [
  {
    id: 'aurevo',
    name: 'AUREVO',
    type: 'Eau de Parfum',
    badge: 'BESTSELLER',
    description: 'A bold alchemy of black pepper, smoky vetiver, and warm amber. Aurevo was crafted for those who walk into a room and own it. A singular, confident scent that refuses to apologise.',
    notes: ['Black Pepper', 'Vetiver', 'Amber', 'Oud', 'Bergamot'],
    image: 'assets/product1.png',
    sizes: [
      { ml: '15ml', price: 650, discountPct: 0 },
      { ml: '30ml', price: 1150, discountPct: 0 },
    ],
  },
  {
    id: 'nocturne',
    name: 'NOCTURNE',
    type: 'Eau de Parfum',
    badge: 'NEW',
    description: "Dark florals meet midnight musk. Nocturne is the scent of secrets - rose absolute on a bed of patchouli, sealed with white cedarwood. It lingers long after you've left.",
    notes: ['Rose Absolute', 'Patchouli', 'White Cedar', 'Musk', 'Sandalwood'],
    image: 'assets/product2.png',
    sizes: [
      { ml: '15ml', price: 700, discountPct: 0 },
      { ml: '30ml', price: 1250, discountPct: 0 },
    ],
  },
  {
    id: 'obsidia',
    name: 'OBSIDIA',
    type: 'Eau de Parfum',
    badge: '',
    description: 'Cold and crystalline. Obsidia opens with a sharp citrus burst before settling into an earthy, volcanic depth. A unisex composition built for any season, any moment.',
    notes: ['Citrus', 'Rock Salt', 'Iris', 'Cedarwood', 'Grey Amber'],
    image: 'assets/product3.png',
    sizes: [
      { ml: '15ml', price: 600, discountPct: 0 },
      { ml: '30ml', price: 1100, discountPct: 0 },
    ],
  },
  {
    id: 'velvet-noir',
    name: 'VELVET NOIR',
    type: 'Eau de Parfum',
    badge: 'LIMITED',
    description: 'An opulent, velvety embrace. Dark plum and saffron heart resting on Tonka bean and black vanilla. A luxury composition inspired by the quietest hours of a winter night.',
    notes: ['Dark Plum', 'Saffron', 'Tonka Bean', 'Black Vanilla', 'Labdanum'],
    image: 'assets/product4.png',
    sizes: [
      { ml: '15ml', price: 800, discountPct: 0 },
      { ml: '30ml', price: 1450, discountPct: 0 },
    ],
  },
];

/* â”€â”€ DEFAULT SITE SETTINGS â”€â”€ */
const DEFAULT_SETTINGS = {
  siteName: 'EDP',
  siteTagline: 'Trust Your Own Nose.',
  heroHeadline: 'TRUST',
  heroLine2: 'YOUR OWN',
  heroLine3: 'NOSE.',
  heroSub: 'Premium artisanal fragrances for the souls who dare to be remembered.',
  announcementText: 'FREE SHIPPING ON ORDERS ABOVE Tk 1500 | CASH ON DELIVERY AVAILABLE | AUTHENTIC FRAGRANCES | TRUST YOUR OWN NOSE',
  phoneNumber: '8801712345678',
  emailAddress: 'hello@edperfume.com',
  businessAddress: 'Dhaka, Bangladesh',
  instagramUrl: '#',
  facebookUrl: '#',
  tiktokUrl: '#',
  freeShippingMin: 1500,
  codAvailable: 'yes',
};

/* â•â• HELPERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function getSettings() { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || { ...DEFAULT_SETTINGS }; }
function getProducts() { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || 'null') || JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)); }
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
function saveProducts(p) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p)); }

let fbAuth = null;
let fbDb = null;
let ordersUnsubscribe = null;
let allOrders = [];
let adminReady = false;

let adminToastTimer;
function showAdminToast(msg, isError = false) {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(adminToastTimer);
  adminToastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* â•â• LOGIN â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const loginScreen  = document.getElementById('loginScreen');
const adminWrapper = document.getElementById('adminWrapper');
const loginError   = document.getElementById('loginError');

document.getElementById('loginBtn').addEventListener('click', attemptLogin);
document.getElementById('adminPassword').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function showLoginError(message) {
  loginError.textContent = message;
  setTimeout(() => { if (loginError.textContent === message) loginError.textContent = ''; }, 3500);
}

function isAuthorizedAdmin(user) {
  const adminEmail = normalizeEmail(window.EDP_ADMIN_EMAIL);
  const userEmail = normalizeEmail(user?.email);
  return !!adminEmail && adminEmail === userEmail;
}

function hideAdmin() {
  if (typeof ordersUnsubscribe === 'function') {
    ordersUnsubscribe();
    ordersUnsubscribe = null;
  }
  allOrders = [];
  adminWrapper.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginScreen.classList.remove('hidden');
}

function showAdmin() {
  loginScreen.classList.add('hidden');
  setTimeout(() => {
    loginScreen.style.display = 'none';
    adminWrapper.style.display = 'grid';
  }, 350);
}

async function attemptLogin() {
  if (!fbAuth) {
    showLoginError('Firebase auth is not configured.');
    return;
  }

  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  if (!email || !password) {
    showLoginError('Email and password are required.');
    return;
  }

  try {
    const cred = await fbAuth.signInWithEmailAndPassword(email, password);
    if (!isAuthorizedAdmin(cred.user)) {
      await fbAuth.signOut();
      showLoginError('Access denied for this account.');
      return;
    }
  } catch (err) {
    showLoginError(err?.message || 'Login failed.');
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await fbAuth?.signOut();
  } catch {}
});

function initAuthGate() {
  try {
    if (!window.firebase || !window.EDP_FIREBASE_CONFIG) {
      showLoginError('Missing Firebase config. Update firebase-config.js');
      return;
    }

    if (!firebase.apps.length) firebase.initializeApp(window.EDP_FIREBASE_CONFIG);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();

    fbAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        hideAdmin();
        return;
      }

      if (!isAuthorizedAdmin(user)) {
        await fbAuth.signOut();
        showLoginError('Access denied. Admin email mismatch.');
        return;
      }

      showAdmin();
      if (!adminReady) {
        initAdmin();
        adminReady = true;
      } else {
        subscribeOrders();
        renderOrdersAdmin();
      }
    });
  } catch (err) {
    showLoginError('Failed to initialize admin auth.');
    console.error(err);
  }
}

/* â•â• TABS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const tabTitles = {
  site: ['Site Settings', 'Manage your website information'],
  products: ['Products', 'Edit product name, price, images & discounts'],
  orders: ['Orders', 'Track, update and export customer orders'],
  preview: ['Preview', 'See a live preview of your store'],
};

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('pageTitle').textContent = tabTitles[tab][0];
    document.getElementById('pageSub').textContent   = tabTitles[tab][1];

    if (tab === 'preview') {
      document.getElementById('previewFrame').src = 'index.html';
    }
  });
});

/* â•â• INIT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function initAdmin() {
  populateSiteForm();
  renderProductsAdmin();
  resetNewProductForm();
  document.getElementById('saveAllBtn').onclick = saveAll;
  document.getElementById('addProductBtn').onclick = addProductFromForm;
  document.getElementById('orderStatusFilter').onchange = renderOrdersAdmin;
  document.getElementById('exportOrdersCsvBtn').onclick = exportOrdersCsv;
  document.getElementById('exportOrdersPdfBtn').onclick = exportOrdersPdf;
  subscribeOrders();
}

/* â•â• SITE SETTINGS FORM â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function populateSiteForm() {
  const s = getSettings();
  const fields = [
    'siteName','siteTagline','heroHeadline','heroLine2','heroLine3',
    'heroSub','announcementText','phoneNumber','emailAddress',
    'businessAddress','instagramUrl','facebookUrl','tiktokUrl',
    'freeShippingMin','codAvailable',
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && s[id] !== undefined) el.value = s[id];
  });
}

function collectSiteSettings() {
  const fields = [
    'siteName','siteTagline','heroHeadline','heroLine2','heroLine3',
    'heroSub','announcementText','phoneNumber','emailAddress',
    'businessAddress','instagramUrl','facebookUrl','tiktokUrl',
    'freeShippingMin','codAvailable',
  ];
  const s = {};
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'freeShippingMin') {
      s[id] = toSafeNumber(el.value, 0);
      return;
    }
    s[id] = el.value;
  });
  return s;
}

/* â•â• PRODUCTS ADMIN â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function toSafeNumber(value, fallback = 0) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDiscount(value) {
  const n = toSafeNumber(value, 0);
  return Math.max(0, Math.min(99, n));
}

function slugifyProductId(name) {
  const base = String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `product-${Date.now()}`;
}

function buildUniqueProductId(name, products) {
  const base = slugifyProductId(name);
  let id = base;
  let i = 2;
  while (products.some(p => p.id === id)) {
    id = `${base}-${i}`;
    i += 1;
  }
  return id;
}

function resetNewProductForm() {
  const defaults = {
    newProductName: '',
    newProductType: 'Eau de Parfum',
    newProductBadge: '',
    newProductDescription: '',
    newProductImage: 'assets/product1.png',
    newProductNotes: '',
    newProductSize0Ml: '15ml',
    newProductSize0Price: '',
    newProductSize0Discount: '0',
    newProductSize1Ml: '30ml',
    newProductSize1Price: '',
    newProductSize1Discount: '0',
  };

  Object.entries(defaults).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function addProductFromForm() {
  const name = document.getElementById('newProductName')?.value.trim() || '';
  if (!name) {
    showAdminToast('Product name is required', true);
    return;
  }

  const products = collectProducts();
  const productId = buildUniqueProductId(name, products);

  const type = document.getElementById('newProductType')?.value.trim() || 'Eau de Parfum';
  const badge = document.getElementById('newProductBadge')?.value || '';
  const description = document.getElementById('newProductDescription')?.value.trim() || '';
  const image = document.getElementById('newProductImage')?.value.trim() || 'assets/product1.png';
  const notesRaw = document.getElementById('newProductNotes')?.value || '';

  const size0Ml = document.getElementById('newProductSize0Ml')?.value.trim() || '15ml';
  const size0Price = toSafeNumber(document.getElementById('newProductSize0Price')?.value, 0);
  const size0Discount = normalizeDiscount(document.getElementById('newProductSize0Discount')?.value);
  const size1Ml = document.getElementById('newProductSize1Ml')?.value.trim() || '30ml';
  const size1Price = toSafeNumber(document.getElementById('newProductSize1Price')?.value, 0);
  const size1Discount = normalizeDiscount(document.getElementById('newProductSize1Discount')?.value);

  products.push({
    id: productId,
    name,
    type,
    badge,
    description,
    notes: notesRaw.split(',').map(n => n.trim()).filter(Boolean),
    image,
    sizes: [
      { ml: size0Ml, price: size0Price, discountPct: size0Discount },
      { ml: size1Ml, price: size1Price, discountPct: size1Discount },
    ],
  });

  saveProducts(products);
  renderProductsAdmin();
  resetNewProductForm();

  const newCard = document.querySelector(`[data-id="${productId}"]`);
  if (newCard) {
    newCard.classList.add('open');
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  showAdminToast(`Product "${name}" added`);
}

function deleteProductById(productId) {
  const products = collectProducts();
  if (products.length <= 1) {
    showAdminToast('At least one product is required', true);
    return;
  }

  const target = products.find(p => p.id === productId);
  if (!target) return;

  const shouldDelete = window.confirm(`Delete "${target.name}" from products?`);
  if (!shouldDelete) return;

  const filtered = products.filter(p => p.id !== productId);
  saveProducts(filtered);
  renderProductsAdmin();
  showAdminToast(`Deleted "${target.name}"`);
}

function renderProductsAdmin() {
  const list = document.getElementById('productsAdminList');
  list.innerHTML = '';
  const products = getProducts();

  products.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'product-admin-card';
    card.dataset.id = p.id;

    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : [{ ml: '15ml', price: 0, discountPct: 0 }];
    const notes = Array.isArray(p.notes) ? p.notes : [];
    const s0 = sizes[0];
    const s1 = sizes[1] || { ml: '30ml', price: 0, discountPct: 0 };

    card.innerHTML = `
      <div class="product-admin-header">
        <div class="product-admin-meta">
          <img class="product-admin-thumb" id="thumb-${p.id}" src="${p.image}" alt="${p.name}" onerror="this.src='assets/product1.png'" />
          <div>
            <p class="product-admin-name">${p.name}</p>
            <p class="product-admin-price">${s0.ml} Tk ${s0.price} | ${s1.ml} Tk ${s1.price}</p>
          </div>
        </div>
        <div class="product-admin-actions">
          <button class="product-admin-delete" type="button">DELETE</button>
          <span class="product-admin-expand">+</span>
        </div>
      </div>
      <div class="product-admin-body">
        <div class="product-admin-body-inner">

          <!-- Left: Image -->
          <div class="image-upload-area">
            <div class="image-preview-box" id="imgBox-${p.id}">
              <img id="imgPreview-${p.id}" src="${p.image}" alt="${p.name}" onerror="this.src='assets/product1.png'" />
              <div class="image-upload-overlay">
                <span class="upload-icon">IMG</span>
                <span>CHANGE IMAGE</span>
              </div>
              <input type="file" class="image-file-input" id="fileInput-${p.id}" accept="image/*" />
            </div>
            <div class="image-url-alt">
              <label>OR PASTE IMAGE URL</label>
              <input type="text" id="imgUrl-${p.id}" value="${p.image}" placeholder="https://... or assets/..." />
              <button class="btn-save-all" style="font-size:10px;padding:9px 14px;margin-top:2px" onclick="applyImageUrl('${p.id}')">APPLY URL</button>
            </div>
          </div>

          <!-- Right: Fields -->
          <div class="product-fields">
            <div class="form-group">
              <label>PRODUCT NAME</label>
              <input type="text" id="pname-${p.id}" value="${p.name}" />
            </div>
            <div class="form-group">
              <label>TYPE / CATEGORY</label>
              <input type="text" id="ptype-${p.id}" value="${p.type}" />
            </div>
            <div class="form-group badge-select">
              <label>BADGE LABEL</label>
              <select id="pbadge-${p.id}">
                <option value="" ${!p.badge?'selected':''}>No Badge</option>
                <option value="BESTSELLER" ${p.badge==='BESTSELLER'?'selected':''}>BESTSELLER</option>
                <option value="NEW" ${p.badge==='NEW'?'selected':''}>NEW</option>
                <option value="LIMITED" ${p.badge==='LIMITED'?'selected':''}>LIMITED</option>
                <option value="SALE" ${p.badge==='SALE'?'selected':''}>SALE</option>
              </select>
            </div>
            <div class="form-group">
              <label>DESCRIPTION</label>
              <textarea id="pdesc-${p.id}" rows="3">${p.description}</textarea>
            </div>
            <div class="form-group">
              <label>FRAGRANCE NOTES (comma separated)</label>
              <input type="text" id="pnotes-${p.id}" value="${notes.join(', ')}" />
            </div>

            <div class="form-group">
              <label>PRICING</label>
              <div class="size-price-row">
                <div class="size-label-badge">${s0.ml}</div>
                <div class="form-group" style="margin-bottom:0">
                  <label>PRICE (Tk)</label>
                  <input type="number" id="pprice0-${p.id}" value="${s0.price}" min="0" />
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label>DISCOUNT (%)</label>
                  <input type="number" id="pdisc0-${p.id}" value="${s0.discountPct||0}" min="0" max="99" />
                </div>
              </div>
              <div class="size-price-row" style="margin-top:10px">
                <div class="size-label-badge">${s1.ml}</div>
                <div class="form-group" style="margin-bottom:0">
                  <label>PRICE (Tk)</label>
                  <input type="number" id="pprice1-${p.id}" value="${s1.price}" min="0" />
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <label>DISCOUNT (%)</label>
                  <input type="number" id="pdisc1-${p.id}" value="${s1.discountPct||0}" min="0" max="99" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // Toggle expand
    card.querySelector('.product-admin-header').addEventListener('click', () => {
      card.classList.toggle('open');
    });

    card.querySelector('.product-admin-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProductById(p.id);
    });

    // File input -> preview
    card.querySelector('.image-preview-box').addEventListener('click', () => {
      card.querySelector('.image-file-input').click();
    });
    card.querySelector('.image-file-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target.result;
        document.getElementById('imgPreview-' + p.id).src = dataUrl;
        document.getElementById('thumb-' + p.id).src = dataUrl;
        document.getElementById('imgUrl-' + p.id).value = dataUrl;
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    });

    list.appendChild(card);
  });
}

/* apply image from URL input */
window.applyImageUrl = function(pid) {
  const url = document.getElementById('imgUrl-' + pid).value.trim();
  if (!url) return;
  document.getElementById('imgPreview-' + pid).src = url;
  document.getElementById('thumb-' + pid).src = url;
};

function collectProducts() {
  const products = getProducts();
  return products.map(p => {
    const nameEl  = document.getElementById('pname-' + p.id);
    if (!nameEl) return p; // not rendered yet

    const baseSizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : [{ ml: '15ml', price: 0, discountPct: 0 }];
    const firstSize = baseSizes[0] || { ml: '15ml', price: 0, discountPct: 0 };
    const secondSize = baseSizes[1] || { ml: '30ml', price: 0, discountPct: 0 };

    const imgUrl   = document.getElementById('imgUrl-' + p.id)?.value.trim() || p.image;
    const name     = document.getElementById('pname-' + p.id)?.value.trim() || p.name;
    const type     = document.getElementById('ptype-' + p.id)?.value.trim() || p.type;
    const badge    = document.getElementById('pbadge-' + p.id)?.value   || '';
    const desc     = document.getElementById('pdesc-' + p.id)?.value.trim() || p.description;
    const notesRaw = document.getElementById('pnotes-' + p.id)?.value   || '';
    const price0   = toSafeNumber(document.getElementById('pprice0-' + p.id)?.value, firstSize.price);
    const disc0    = normalizeDiscount(document.getElementById('pdisc0-' + p.id)?.value);
    const price1   = toSafeNumber(document.getElementById('pprice1-' + p.id)?.value, secondSize.price);
    const disc1    = normalizeDiscount(document.getElementById('pdisc1-' + p.id)?.value);

    return {
      ...p,
      image: imgUrl,
      name,
      type,
      badge,
      description: desc,
      notes: notesRaw.split(',').map(n => n.trim()).filter(Boolean),
      sizes: [
        { ml: firstSize.ml || '15ml', price: price0, discountPct: disc0 },
        { ml: secondSize.ml || '30ml', price: price1, discountPct: disc1 },
      ],
    };
  });
}

/* â•â• SAVE ALL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function saveAll() {
  const settings = collectSiteSettings();
  const products = collectProducts();
  saveSettings(settings);
  saveProducts(products);
  showAdminToast('All changes saved and applied to your store');
  // Refresh product headers summary
  products.forEach(p => {
    const priceEl = document.querySelector(`[data-id="${p.id}"] .product-admin-price`);
    if (priceEl) {
      const s0 = p.sizes[0]; const s1 = p.sizes[1];
      priceEl.textContent = `${s0.ml} Tk ${s0.price} | ${s1.ml} Tk ${s1.price}`;
    }
    const nameEl = document.querySelector(`[data-id="${p.id}"] .product-admin-name`);
    if (nameEl) nameEl.textContent = p.name;
  });
}


function formatMoney(value) {
  return `Tk ${Number(value || 0).toLocaleString()}`;
}

function formatOrderDate(order) {
  if (order.createdAt?.toDate) return order.createdAt.toDate().toLocaleString();
  if (order.createdAtMs) return new Date(order.createdAtMs).toLocaleString();
  return 'N/A';
}

function normalizeOrderData(doc) {
  const data = doc.data() || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const summary = data.summary || {};
  return {
    docId: doc.id,
    orderId: data.orderId || doc.id,
    status: data.status || 'pending',
    createdAt: data.createdAt,
    createdAtMs: data.createdAtMs || 0,
    customer: data.customer || {},
    customerAuth: data.customerAuth || {},
    items,
    summary: {
      subtotal: Number(summary.subtotal || 0),
      discountTotal: Number(summary.discountTotal || 0),
      grandTotal: Number(summary.grandTotal || 0),
      totalQty: Number(summary.totalQty || 0),
    },
  };
}

function getFilteredOrders() {
  const status = document.getElementById('orderStatusFilter')?.value || 'all';
  if (status === 'all') return allOrders;
  return allOrders.filter((o) => o.status === status);
}

function renderOrdersAdmin() {
  const list = document.getElementById('ordersAdminList');
  const meta = document.getElementById('ordersMeta');
  if (!list) return;

  const orders = getFilteredOrders();
  meta.textContent = `${orders.length} order(s) found`;

  if (!orders.length) {
    list.innerHTML = '<div class="order-empty">No orders found for this filter.</div>';
    return;
  }

  list.innerHTML = orders.map((order) => {
    const customer = order.customer || {};
    const itemsHtml = order.items.map((it) => `
      <div class="order-item-row">
        <strong>${it.name || 'Item'}</strong> (${it.size || ''}) | ${it.qty || 0} x ${formatMoney(it.unitPrice)}
      </div>
    `).join('');

    return `
      <div class="order-admin-card" data-order-id="${order.docId}">
        <div class="order-admin-top">
          <div>
            <p class="order-admin-id">${order.orderId}</p>
            <p class="order-admin-sub">${formatOrderDate(order)} | ${formatMoney(order.summary.grandTotal)}</p>
          </div>
          <div class="order-admin-controls">
            <select class="order-status-select" data-doc-id="${order.docId}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            </select>
            <button class="btn-outline order-pdf-btn" data-doc-id="${order.docId}" type="button">PDF</button>
          </div>
        </div>
        <div class="order-admin-body">
          <div class="order-admin-customer">
            <p><strong>Name:</strong> ${customer.name || ''}</p>
            <p><strong>Phone:</strong> ${customer.phone || ''}</p>
            <p><strong>Address:</strong> ${customer.address || ''}</p>
            <p><strong>Location:</strong> ${customer.location || ''}</p>
            <p><strong>Note:</strong> ${customer.note || '-'}</p>
          </div>
          <div class="order-admin-items">${itemsHtml}</div>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.order-status-select').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const docId = e.target.dataset.docId;
      const status = e.target.value;
      await updateOrderStatus(docId, status);
    });
  });

  list.querySelectorAll('.order-pdf-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.dataset.docId;
      const order = allOrders.find((o) => o.docId === docId);
      if (order) exportSingleOrderPdf(order);
    });
  });
}

async function updateOrderStatus(docId, status) {
  if (!fbDb) return;
  try {
    await fbDb.collection(ORDERS_COLLECTION).doc(docId).update({ status });
    showAdminToast(`Status updated: ${status}`);
  } catch (err) {
    showAdminToast('Failed to update status', true);
    console.error(err);
  }
}

function subscribeOrders() {
  if (!fbDb || ordersUnsubscribe) return;
  ordersUnsubscribe = fbDb
    .collection(ORDERS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .onSnapshot((snap) => {
      allOrders = snap.docs.map(normalizeOrderData);
      renderOrdersAdmin();
    }, (err) => {
      console.error(err);
      showAdminToast('Unable to load orders', true);
    });
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(v) {
  const str = String(v ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

function exportOrdersCsv() {
  const rows = getFilteredOrders();
  if (!rows.length) {
    showAdminToast('No orders to export', true);
    return;
  }

  const header = ['Order ID', 'Date', 'Status', 'Name', 'Phone', 'Address', 'Location', 'Note', 'Items', 'Qty', 'Total', 'User Email', 'Guest'];
  const lines = [header.map(csvCell).join(',')];

  rows.forEach((o) => {
    const itemsText = o.items.map((it) => `${it.name} (${it.size}) x${it.qty}`).join(' | ');
    lines.push([
      o.orderId,
      formatOrderDate(o),
      o.status,
      o.customer?.name || '',
      o.customer?.phone || '',
      o.customer?.address || '',
      o.customer?.location || '',
      o.customer?.note || '',
      itemsText,
      o.summary.totalQty,
      o.summary.grandTotal,
      o.customerAuth?.email || '',
      o.customerAuth?.isGuest ? 'yes' : 'no',
    ].map(csvCell).join(','));
  });

  downloadBlob(`orders-${Date.now()}.csv`, lines.join('\n'), 'text/csv;charset=utf-8;');
}

function exportOrdersPdf() {
  const rows = getFilteredOrders();
  if (!rows.length) return showAdminToast('No orders to export', true);
  if (!window.jspdf?.jsPDF) return showAdminToast('jsPDF not loaded', true);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(12);
  doc.text('EDP Orders', 12, 12);

  const body = rows.map((o) => [
    o.orderId,
    formatOrderDate(o),
    o.status,
    o.customer?.name || '',
    o.customer?.phone || '',
    o.summary.totalQty,
    formatMoney(o.summary.grandTotal),
  ]);

  doc.autoTable({
    startY: 18,
    head: [['Order', 'Date', 'Status', 'Customer', 'Phone', 'Qty', 'Total']],
    body,
    styles: { fontSize: 9 },
  });

  doc.save(`orders-${Date.now()}.pdf`);
}

function exportSingleOrderPdf(order) {
  if (!window.jspdf?.jsPDF) return showAdminToast('jsPDF not loaded', true);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(15);
  doc.text('EDP Order Details', 14, 14);
  doc.setFontSize(10);
  doc.text(`Order ID: ${order.orderId}`, 14, 24);
  doc.text(`Date: ${formatOrderDate(order)}`, 14, 30);
  doc.text(`Status: ${order.status}`, 14, 36);

  doc.text(`Customer: ${order.customer?.name || ''}`, 14, 46);
  doc.text(`Phone: ${order.customer?.phone || ''}`, 14, 52);
  doc.text(`Address: ${order.customer?.address || ''}`, 14, 58);
  doc.text(`Location: ${order.customer?.location || ''}`, 14, 64);
  doc.text(`Note: ${order.customer?.note || '-'}`, 14, 70);

  const body = order.items.map((it) => [
    it.name || '',
    it.size || '',
    it.qty || 0,
    formatMoney(it.unitPrice),
    formatMoney((it.unitPrice || 0) * (it.qty || 0)),
  ]);

  doc.autoTable({
    startY: 78,
    head: [['Item', 'Size', 'Qty', 'Unit Price', 'Line Total']],
    body,
    styles: { fontSize: 9 },
  });

  doc.text(`Grand Total: ${formatMoney(order.summary.grandTotal)}`, 14, doc.lastAutoTable.finalY + 10);
  doc.save(`${order.orderId}.pdf`);
}

initAuthGate();
