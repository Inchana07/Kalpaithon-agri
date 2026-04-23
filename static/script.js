/* ============================================
   FARMER DIRECT MARKET — script.js
   ============================================ */

/* ============================================
   🔥 FIREBASE CONFIGURATION
   ============================================
   INSTRUCTIONS TO SETUP YOUR OWN FIREBASE:
   1. Go to https://console.firebase.google.com/
   2. Click "Add Project" → name it (e.g. farmer-direct-market)
   3. Go to Project Settings → General → "Your apps" → click </> (Web)
   4. Register app, copy the firebaseConfig object below
   5. Go to Firestore Database → Create Database → Start in Test Mode
   6. Replace the config values below with your own
   ============================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyDEMO_REPLACE_WITH_YOUR_KEY",
  authDomain:        "your-project-id.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef123456"
};

/* ============================================
   DEMO MODE
   When Firebase is not configured, the app
   runs entirely with demo/local data so you
   can see the full UI working immediately.
   ============================================ */
let useDemoMode = false;

// Detect unconfigured placeholder keys
if (
  firebaseConfig.apiKey.includes("DEMO") ||
  firebaseConfig.projectId === "your-project-id"
) {
  useDemoMode = true;
  console.warn("🌾 Demo mode active — using local data. Replace firebaseConfig with your own Firebase credentials.");
}

/* ---- Demo seed data ---- */
const demoProducts = [];

/* ============================================
   FIREBASE INIT
   ============================================ */
let db = null;
if (!useDemoMode) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

/* ============================================
   STATE
   ============================================ */
let allProducts    = [];
let currentLang    = "en";
let selectedCategory = "Vegetables";

/* ============================================
   LANGUAGE SYSTEM
   ============================================ */
function toggleLanguage() {
  currentLang = currentLang === "en" ? "kn" : "en";
  document.getElementById("langLabel").textContent = currentLang === "en" ? "ಕನ್ನಡ" : "English";
  applyLanguage();
}

function applyLanguage() {
  const lang = currentLang;

  // Static text elements with data-en / data-kn
  document.querySelectorAll("[data-en]").forEach(el => {
    el.textContent = lang === "en" ? el.dataset.en : el.dataset.kn;
  });

  // Placeholder inputs
  document.querySelectorAll("[data-placeholder-en]").forEach(el => {
    el.placeholder = lang === "en" ? el.dataset.placeholderEn : el.dataset.placeholderKn;
  });

  // Location select first option
  const firstOption = document.querySelector("#locationFilter option[value='']");
  if (firstOption) {
    firstOption.textContent = lang === "en" ? "All Locations" : "ಎಲ್ಲಾ ಸ್ಥಳಗಳು";
  }

  // Sort select options
  const sortLabels = {
    newest:     ["Newest First",        "ಹೊಸದು ಮೊದಲು"],
    price_asc:  ["Price: Low to High",  "ಬೆಲೆ: ಕಡಿಮೆ ಮೊದಲು"],
    price_desc: ["Price: High to Low",  "ಬೆಲೆ: ಹೆಚ್ಚು ಮೊದಲು"],
  };
  document.querySelectorAll("#sortSelect option").forEach(opt => {
    const key = opt.value;
    if (sortLabels[key]) opt.textContent = sortLabels[key][lang === "en" ? 0 : 1];
  });

  // Re-render product cards
  renderProducts(getFilteredProducts());
}

/* ============================================
   CATEGORY CHIP
   ============================================ */
function selectChip(el) {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  selectedCategory = el.dataset.value;
}

/* ============================================
   MODAL
   ============================================ */
function openModal() {
  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
  // Reset form
  document.getElementById("successMsg").style.display = "none";
  ["productName","price","location","farmerName","phone","description"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("unit").value = "kg";
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  document.querySelector('.chip[data-value="Vegetables"]').classList.add("active");
  selectedCategory = "Vegetables";
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById("modalOverlay")) closeModal();
}

/* ============================================
   ADD PRODUCT
   ============================================ */
async function addProduct() {
  const name       = document.getElementById("productName").value.trim();
  const price      = parseFloat(document.getElementById("price").value);
  const unit       = document.getElementById("unit").value;
  const location   = document.getElementById("location").value.trim();
  const farmerName = document.getElementById("farmerName").value.trim();
  const phone      = document.getElementById("phone").value.trim();
  const description= document.getElementById("description").value.trim();

  // Validation
  if (!name || !location || !farmerName || !phone) {
    showToast("⚠️ Please fill in all required fields.");
    return;
  }
  if (isNaN(price) || price < 0) {
    showToast("⚠️ Please enter a valid price.");
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    showToast("⚠️ Enter a valid 10-digit phone number.");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Listing...</span>';

  const product = {
    name,
    price,
    unit,
    location,
    farmerName,
    phone,
    category:    selectedCategory,
    description,
    createdAt:   useDemoMode
                   ? { seconds: Date.now() / 1000 }
                   : firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    if (useDemoMode) {
      // In demo mode, add locally
      const newProduct = { ...product, id: "local_" + Date.now() };
      allProducts.unshift(newProduct);
      updateLocationFilter();
      updateStats();
      renderProducts(getFilteredProducts());
    } else {
      await db.collection("products").add(product);
      // Real-time listener will update the UI automatically
    }

    // Show success
    const successMsg = document.getElementById("successMsg");
    successMsg.style.display = "flex";
    successMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("🎉 Your product is now live!");

    // Reset form
    setTimeout(() => {
      ["productName","price","location","farmerName","phone","description"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      document.getElementById("unit").value = "kg";
    }, 300);

  } catch (err) {
    console.error("Error adding product:", err);
    showToast("❌ Failed to add product. Check Firebase config.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-upload"></i> <span data-en="List My Product" data-kn="ನನ್ನ ಉತ್ಪನ್ನ ಪಟ್ಟಿ ಮಾಡಿ">List My Product</span>';
    applyLanguage();
  }
}

/* ============================================
   LOAD PRODUCTS
   ============================================ */
function loadProducts() {
  if (useDemoMode) {
    allProducts = [...demoProducts];
    document.getElementById("loadingWrap").style.display = "none";
    updateLocationFilter();
    updateStats();
    renderProducts(allProducts);
    return;
  }

  // Real-time Firestore listener
  db.collection("products")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      snapshot => {
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        document.getElementById("loadingWrap").style.display = "none";
        updateLocationFilter();
        updateStats();
        renderProducts(getFilteredProducts());
      },
      err => {
        console.error("Firestore error:", err);
        document.getElementById("loadingWrap").style.display = "none";
        showToast("❌ Could not connect to Firebase. Running in demo mode.");
        // Fall back to demo
        allProducts = [...demoProducts];
        updateLocationFilter();
        updateStats();
        renderProducts(allProducts);
      }
    );
}

/* ============================================
   RENDER PRODUCTS
   ============================================ */
const CATEGORY_EMOJI = {
  Vegetables: "🥦",
  Fruits:     "🍎",
  Grains:     "🌾",
  Dairy:      "🥛",
  Spices:     "🌶️",
  Other:      "📦",
};

const PRODUCT_EMOJI = {
  tomato:"🍅", tomatoes:"🍅",
  potato:"🥔", potatoes:"🥔",
  onion:"🧅", onions:"🧅",
  carrot:"🥕", carrots:"🥕",
  spinach:"🥬", cabbage:"🥬",
  brinjal:"🍆", eggplant:"🍆",
  corn:"🌽", maize:"🌽",
  mango:"🥭", mangoes:"🥭",
  apple:"🍎", apples:"🍎",
  banana:"🍌", bananas:"🍌",
  grape:"🍇", grapes:"🍇",
  orange:"🍊", oranges:"🍊",
  watermelon:"🍉",
  rice:"🍚", wheat:"🌾",
  milk:"🥛", curd:"🫙", ghee:"🫙",
  chilli:"🌶️", pepper:"🌶️",
  turmeric:"🟡", ginger:"🫚",
  coconut:"🥥",
};

function getProductEmoji(name, category) {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(PRODUCT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return CATEGORY_EMOJI[category] || "🌱";
}

function timeAgo(seconds) {
  if (!seconds) return "";
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function isFresh(seconds) {
  if (!seconds) return false;
  return (Date.now() / 1000 - seconds) < 86400; // < 24h
}

function renderProducts(products) {
  const grid       = document.getElementById("productsGrid");
  const emptyState = document.getElementById("emptyState");
  const resultsText= document.getElementById("resultsText");
  const lang       = currentLang;

  grid.innerHTML = "";

  if (products.length === 0) {
    emptyState.style.display = "block";
    resultsText.textContent = lang === "en" ? "No products found" : "ಯಾವುದೇ ಉತ್ಪನ್ನ ಕಂಡುಬಂದಿಲ್ಲ";
    applyLanguage();
    return;
  }

  emptyState.style.display = "none";
  resultsText.textContent = lang === "en"
    ? `Showing ${products.length} product${products.length !== 1 ? "s" : ""}`
    : `${products.length} ಉತ್ಪನ್ನ${products.length !== 1 ? "ಗಳು" : ""} ತೋರಿಸಲಾಗುತ್ತಿದೆ`;

  products.forEach((p, i) => {
    const emoji    = getProductEmoji(p.name, p.category);
    const catEmoji = CATEGORY_EMOJI[p.category] || "📦";
    const createdSecs = p.createdAt?.seconds;
    const fresh    = isFresh(createdSecs);
    const ago      = timeAgo(createdSecs);

    const whatsappText = encodeURIComponent(
      `Hello ${p.farmerName}! I saw your listing for ${p.name} at ₹${p.price}/${p.unit} on Farmer Direct Market. I'm interested in buying.`
    );

    const card = document.createElement("div");
    card.className = "product-card";
    card.style.animationDelay = `${i * 0.06}s`;

    card.innerHTML = `
      <div class="card-banner">
        ${fresh ? `<span class="fresh-badge">${lang === "en" ? "✦ Fresh" : "✦ ತಾಜಾ"}</span>` : ""}
        <span class="card-emoji">${emoji}</span>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span class="card-category">${catEmoji} ${p.category || "Other"}</span>
          ${ago ? `<span style="font-size:0.7rem;color:var(--text-light);">${ago}</span>` : ""}
        </div>
      </div>
      <div class="card-body">
        <div class="card-name">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="card-desc">${escapeHtml(p.description)}</div>` : ""}
        <div class="card-price-row">
          <span class="card-price">₹${p.price}</span>
          <span class="card-unit">/ ${p.unit}</span>
        </div>
        <div class="card-divider"></div>
        <div class="card-meta">
          <div class="card-meta-item">
            <i class="fas fa-user-circle"></i>
            <span>${escapeHtml(p.farmerName)}</span>
          </div>
          <div class="card-meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${escapeHtml(p.location)}</span>
          </div>
          <div class="card-meta-item">
            <i class="fa-comment-dots"></i>
            <span>${escapeHtml(p.phone)}</span>
          </div>
        </div>
      </div>
      <div class="card-footer">
      <a class="btn-sms" href="sms:${p.phone}">
      <i class="fas fa-comment-sms"></i>
      ${lang === "en" ? "SMS" : "ಸಂದೇಶ ಕಳುಹಿಸಿ"}
      </a>  
        </a>
        <a class="btn-whatsapp" href="https://wa.me/91${p.phone}?text=${whatsappText}" target="_blank" rel="noopener">
          <i class="fab fa-whatsapp"></i>
          WhatsApp
        </a>
      </div>
    `;

    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================================
   FILTER & SEARCH
   ============================================ */
function getFilteredProducts() {
  const search   = document.getElementById("searchInput").value.trim().toLowerCase();
  const location = document.getElementById("locationFilter").value.trim().toLowerCase();
  const sort     = document.getElementById("sortSelect").value;

  let filtered = allProducts.filter(p => {
    const matchSearch   = !search   || p.name.toLowerCase().includes(search) || (p.description || "").toLowerCase().includes(search);
    const matchLocation = !location || p.location.toLowerCase().includes(location);
    return matchSearch && matchLocation;
  });

  if (sort === "price_asc")  filtered.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "newest")     filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return filtered;
}

function filterProducts() {
  renderProducts(getFilteredProducts());
}

function clearFilters() {
  document.getElementById("searchInput").value   = "";
  document.getElementById("locationFilter").value = "";
  document.getElementById("sortSelect").value     = "newest";
  filterProducts();
}

/* ============================================
   LOCATION FILTER
   ============================================ */
function updateLocationFilter() {
  const select     = document.getElementById("locationFilter");
  const currentVal = select.value;

  // Collect unique locations
  const locations  = [...new Set(allProducts.map(p => p.location).filter(Boolean))].sort();

  // Keep "All Locations" option
  select.innerHTML = `<option value="">${currentLang === "en" ? "All Locations" : "ಎಲ್ಲಾ ಸ್ಥಳಗಳು"}</option>`;
  locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value       = loc;
    opt.textContent = loc;
    if (loc === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

/* ============================================
   STATS COUNTER
   ============================================ */
function animateCount(el, target) {
  let start = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start;
    if (start >= target) clearInterval(timer);
  }, 40);
}

function updateStats() {
  const farmers   = new Set(allProducts.map(p => p.farmerName)).size;
  const locations = new Set(allProducts.map(p => p.location)).size;

  animateCount(document.getElementById("totalProducts"),  allProducts.length);
  animateCount(document.getElementById("totalFarmers"),   farmers);
  animateCount(document.getElementById("totalLocations"), locations);
}

/* ============================================
   TOAST
   ============================================ */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  // Demo mode banner
  if (useDemoMode) {
    const banner = document.createElement("div");
    banner.style.cssText = `
      position:fixed; bottom:0; left:0; right:0; z-index:999;
      background:#1a3d2b; color:#fff; text-align:center;
      padding:10px 1rem; font-size:0.82rem; font-family:'DM Sans',sans-serif;
      display:flex; align-items:center; justify-content:center; gap:10px;
    `;
    banner.innerHTML = `
      🌾 <strong>Demo Mode</strong> — Replace the Firebase config in <code style="background:rgba(255,255,255,0.15);padding:2px 6px;border-radius:4px;">script.js</code> with your own credentials to enable real-time database.
      <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.8rem;">✕ Dismiss</button>
    `;
    document.body.appendChild(banner);
  }
});