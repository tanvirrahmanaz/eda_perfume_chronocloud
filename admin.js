'use strict';

/* =====================================================
   EDP Admin Panel — admin.js
   All data saved to localStorage, main site reads it
   ===================================================== */

const DEFAULT_PASSWORD = 'edpadmin2024';
const PASS_KEY = 'edp_admin_pass';
const SETTINGS_KEY = 'edp_site_settings';
const PRODUCTS_KEY  = 'edp_products';

/* ── DEFAULT PRODUCTS (mirrors app.js) ── */
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
    description: "Dark florals meet midnight musk. Nocturne is the scent of secrets — rose absolute on a bed of patchouli, sealed with white cedarwood. It lingers long after you've left.",
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

/* ── DEFAULT SITE SETTINGS ── */
const DEFAULT_SETTINGS = {
  siteName: 'EDP',
  siteTagline: 'Trust Your Own Nose.',
  heroHeadline: 'TRUST',
  heroLine2: 'YOUR OWN',
  heroLine3: 'NOSE.',
  heroSub: 'Premium artisanal fragrances for the souls who dare to be remembered.',
  announcementText: 'FREE SHIPPING ON ORDERS ABOVE ৳1500 · CASH ON DELIVERY AVAILABLE · AUTHENTIC FRAGRANCES · TRUST YOUR OWN NOSE',
  whatsappNumber: '8801XXXXXXXXX',
  emailAddress: 'hello@edperfume.com',
  businessAddress: 'Dhaka, Bangladesh',
  instagramUrl: '#',
  facebookUrl: '#',
  tiktokUrl: '#',
  freeShippingMin: 1500,
  codAvailable: 'yes',
};

/* ══ HELPERS ══════════════════════════════════════ */

function getPass()     { return localStorage.getItem(PASS_KEY) || DEFAULT_PASSWORD; }
function getSettings() { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || { ...DEFAULT_SETTINGS }; }
function getProducts() { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || 'null') || JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)); }
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
function saveProducts(p) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p)); }

let adminToastTimer;
function showAdminToast(msg, isError = false) {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(adminToastTimer);
  adminToastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ══ LOGIN ══════════════════════════════════════ */

const loginScreen  = document.getElementById('loginScreen');
const adminWrapper = document.getElementById('adminWrapper');
const loginError   = document.getElementById('loginError');

document.getElementById('loginBtn').addEventListener('click', attemptLogin);
document.getElementById('adminPass').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

function attemptLogin() {
  const val = document.getElementById('adminPass').value; 
  if (val === getPass()) {
    loginScreen.classList.add('hidden');
    setTimeout(() => {
      loginScreen.style.display = 'none';
      adminWrapper.style.display = 'grid';
      initAdmin();
    }, 500);
  } else {
    loginError.textContent = 'Incorrect password. Please try again.';
    document.getElementById('adminPass').value = '';
    document.getElementById('adminPass').focus();
    setTimeout(() => loginError.textContent = '', 3000);
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  adminWrapper.style.display = 'none';
  loginScreen.style.display = 'flex';
  loginScreen.classList.remove('hidden');
  document.getElementById('adminPass').value = '';
});

/* ══ TABS ══════════════════════════════════════ */

const tabTitles = {
  site: ['Site Settings', 'Manage your website information'],
  products: ['Products', 'Edit product name, price, images & discounts'],
  password: ['Change Password', 'Update your admin panel password'],
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

/* ══ INIT ══════════════════════════════════════ */

function initAdmin() {
  populateSiteForm();
  renderProductsAdmin();
  resetNewProductForm();
  document.getElementById('saveAllBtn').onclick = saveAll;
  document.getElementById('addProductBtn').onclick = addProductFromForm;
}

/* ══ SITE SETTINGS FORM ══════════════════════ */

function populateSiteForm() {
  const s = getSettings();
  const fields = [
    'siteName','siteTagline','heroHeadline','heroLine2','heroLine3',
    'heroSub','announcementText','whatsappNumber','emailAddress',
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
    'heroSub','announcementText','whatsappNumber','emailAddress',
    'businessAddress','instagramUrl','facebookUrl','tiktokUrl',
    'freeShippingMin','codAvailable',
  ];
  const s = {};
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) s[id] = el.value;
  });
  return s;
}

/* ══ PRODUCTS ADMIN ══════════════════════════ */

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
            <p class="product-admin-price">${s0.ml} ৳${s0.price} · ${s1.ml} ৳${s1.price}</p>
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
                <span class="upload-icon">📷</span>
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
                  <label>PRICE (৳)</label>
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
                  <label>PRICE (৳)</label>
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

    // File input → preview
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

/* ══ SAVE ALL ══════════════════════════════════ */

function saveAll() {
  const settings = collectSiteSettings();
  const products = collectProducts();
  saveSettings(settings);
  saveProducts(products);
  showAdminToast('✓  All changes saved & applied to your store');
  // Refresh product headers summary
  products.forEach(p => {
    const priceEl = document.querySelector(`[data-id="${p.id}"] .product-admin-price`);
    if (priceEl) {
      const s0 = p.sizes[0]; const s1 = p.sizes[1];
      priceEl.textContent = `${s0.ml} ৳${s0.price} · ${s1.ml} ৳${s1.price}`;
    }
    const nameEl = document.querySelector(`[data-id="${p.id}"] .product-admin-name`);
    if (nameEl) nameEl.textContent = p.name;
  });
}

/* ══ CHANGE PASSWORD ══════════════════════════ */

document.getElementById('changePassBtn').addEventListener('click', () => {
  const current  = document.getElementById('currentPass').value;
  const newP     = document.getElementById('newPass').value;
  const confirm  = document.getElementById('confirmPass').value;
  const errEl    = document.getElementById('passError');

  if (current !== getPass()) {
    errEl.textContent = 'Current password is incorrect.';
    return;
  }
  if (newP.length < 6) {
    errEl.textContent = 'New password must be at least 6 characters.';
    return;
  }
  if (newP !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    return;
  }

  localStorage.setItem(PASS_KEY, newP);
  errEl.textContent = '';
  document.getElementById('currentPass').value = '';
  document.getElementById('newPass').value = '';
  document.getElementById('confirmPass').value = '';
  showAdminToast('✓  Password updated successfully');
});
