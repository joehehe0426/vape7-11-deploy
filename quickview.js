(function () {
  "use strict";

  var modal = document.getElementById("quickModal");
  if (!modal) return;

  var BASE = document.body.dataset.base || "";
  var lang = localStorage.getItem("vslang") || "zh";
  if (lang !== "en" && lang !== "zh") lang = "zh";

  var img = document.getElementById("quickImg");
  var badge = document.getElementById("quickBadge");
  var nameEl = document.getElementById("quickName");
  var descEl = document.getElementById("quickDesc");
  var priceEl = document.getElementById("quickPrice");
  var variantLabelEl = document.getElementById("quickVariantLabel");
  var flavorNameEl = document.getElementById("quickFlavorName");
  var flavorsWrap = document.getElementById("quickFlavors");
  var addBtn = document.getElementById("quickAdd");
  var currentFlavor = "";
  var currentFlavorKey = "";
  var options = [];
  var currentSlug = null;

  function memberDiscount() {
    var m = null;
    try { m = JSON.parse(localStorage.getItem("vsmember") || "null"); } catch (e) {}
    if (!m || !m.id || !m.name || !m.phone || !STORE.membership) return 0;
    return Number(STORE.membership.discountPercent) || 0;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function safeColor(c) {
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(String(c || ""))
      ? c
      : "#888888";
  }

  function fmt(n) { return STORE.currency + " " + n.toFixed(2).replace(/\.00$/, ""); }

  function priceHTML(p) {
    if (p.price == null) return lang === "zh" ? "WhatsApp 查詢" : "Ask on WhatsApp";
    var disc = memberDiscount();
    if (disc > 0) {
      var d = Math.round(p.price * (100 - disc)) / 100;
      return fmt(d) + ' <s>' + fmt(p.price) + "</s>";
    }
    return fmt(p.price);
  }

  function badgeText(p) {
    if (p.puffs === "—") return lang === "zh" ? "煙機" : "Device";
    return lang === "zh" ? p.puffs : (p.puffs + " puffs");
  }

  function variantListForProduct(p) {
    var list = (typeof getProductVariants === "function") ? getProductVariants(p.slug) : [];
    return list.map(function (v) {
      return {
        key: v.key,
        name: lang === "zh" ? v.zh : v.en,
        color: v.color || "#888",
        type: v.type
      };
    });
  }

  function variantKind(p, list) {
    var t0 = list && list.length ? list[0].type : "";
    if (p && p.cat === "device") {
      return t0 === "model" ? "model" : "color";
    }
    if (t0 === "color" || t0 === "model") return t0;
    return "flavor";
  }

  function kindLabel(kind) {
    if (kind === "color") return lang === "zh" ? "選擇顏色" : "Choose color";
    if (kind === "model") return lang === "zh" ? "選擇型號" : "Choose model";
    return lang === "zh" ? "選擇口味" : "Choose flavor";
  }

  function variantInStock(slug, key) {
    return !!(window.VapehouseStock && window.VapehouseStock.ready() && window.VapehouseStock.isAvailable(slug, key));
  }

  function stockKnown() {
    return !!(window.VapehouseStock && window.VapehouseStock.ready());
  }

  function oosLabel() {
    return lang === "zh" ? "缺貨" : "Sold out";
  }

  function renderOptions(list, kind) {
    options = list;
    var isSwatch = kind === "color" || kind === "model";
    flavorsWrap.innerHTML = list.map(function (o) {
      var oos = stockKnown() && currentSlug && !variantInStock(currentSlug, o.key);
      return '<button type="button" class="quick-flavor' + (isSwatch ? " is-color" : "") + (oos ? " is-oos" : "") +
        '" data-f="' + esc(o.key) + '" title="' + esc(o.name) + '" style="--fc:' + safeColor(o.color) + '"><span class="dot" aria-hidden="true"></span><span class="quick-flavor__label">' + esc(o.name) +
        (oos ? " · " + esc(oosLabel()) : "") + "</span></button>";
    }).join("");
    flavorsWrap.querySelectorAll(".quick-flavor").forEach(function (b) {
      b.addEventListener("click", function () { setFlavor(b.dataset.f); });
    });
    if (variantLabelEl) variantLabelEl.textContent = kindLabel(kind);
    flavorsWrap.classList.toggle("is-grid", kind === "flavor" || kind === "color" || kind === "model");
  }

  function syncQuickAdd() {
    var unpriced = addBtn.dataset.unpriced === "1";
    if (unpriced) {
      addBtn.disabled = false;
      addBtn.textContent = askLabel();
      return;
    }
    var stock = window.VapehouseStock;
    if (!stock || !stock.ready()) {
      addBtn.disabled = true;
      addBtn.textContent = addLabel();
      return;
    }
    var oos = currentFlavorKey
      ? !variantInStock(currentSlug, currentFlavorKey)
      : !stock.hasAnyStock(currentSlug);
    addBtn.disabled = oos;
    addBtn.textContent = oos ? oosLabel() : addLabel();
  }

  function setFlavor(key) {
    var f = options.find(function (x) { return x.key === key; }) || null;
    if (!f) {
      currentFlavor = "";
      currentFlavorKey = "";
      if (flavorNameEl) {
        flavorNameEl.textContent = "—";
        flavorNameEl.style.color = "";
      }
      syncQuickAdd();
      return;
    }
    flavorsWrap.querySelectorAll(".quick-flavor").forEach(function (b) {
      b.classList.toggle("active", b.dataset.f === f.key);
    });
    if (flavorNameEl) {
      flavorNameEl.textContent = f.name;
      flavorNameEl.style.color = f.color;
    }
    currentFlavor = f.name;
    currentFlavorKey = f.key;
    syncQuickAdd();
  }

  function askLabel() {
    return lang === "zh" ? "WhatsApp 查詢" : "Ask on WhatsApp";
  }
  function addLabel() {
    return lang === "zh" ? "加入購物車" : "Add to cart";
  }

  function open(slug) {
    var p = (PRODUCTS || []).find(function (x) { return x.slug === slug; });
    if (!p) return;
    currentSlug = slug;
    currentFlavorKey = "";
    var n = p[lang];
    var unpriced = p.price == null;
    img.src = BASE + p.img;
    img.alt = n.name;
    badge.textContent = badgeText(p);
    nameEl.textContent = n.name;
    descEl.textContent = n.desc;
    priceEl.innerHTML = priceHTML(p);
    addBtn.dataset.slug = slug;
    addBtn.dataset.unpriced = unpriced ? "1" : "";
    addBtn.textContent = unpriced ? askLabel() : addLabel();
    addBtn.disabled = false;

    var list = variantListForProduct(p);
    var kind = variantKind(p, list);
    renderOptions(list, kind);
    var pick = list.find(function (o) { return variantInStock(slug, o.key); }) || list[0];
    if (pick) setFlavor(pick.key);
    else syncQuickAdd();

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function close() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  addBtn.addEventListener("click", function () {
    if (addBtn.disabled) return;
    var p = (PRODUCTS || []).find(function (x) { return x.slug === currentSlug; });
    var unpriced = p && p.price == null;
    var added = false;
    if (window.Vapehouse && currentSlug) {
      added = window.Vapehouse.add(currentSlug, {
        variantKey: currentFlavorKey || null,
        flavorName: currentFlavor || null
      }) === true;
    }
    if (unpriced) {
      close();
      return;
    }
    if (!added) return;
    addBtn.textContent = "✓";
    setTimeout(function () {
      addBtn.textContent = addLabel();
      close();
    }, 350);
  });

  document.getElementById("quickClose").addEventListener("click", close);
  document.getElementById("quickBackdrop").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  document.addEventListener("vape:open", function (e) {
    if (e.detail && e.detail.slug) open(e.detail.slug);
  });
  document.addEventListener("vh-stock-ready", function () {
    if (!modal.classList.contains("hidden") && currentSlug) open(currentSlug);
  });

  function onCatalogClick(e) {
    if (e.target.closest(".add") || e.target.closest(".card__name")) return;
    var card = e.target.closest(".card");
    if (!card) return;
    var ph = e.target.closest(".ph");
    var wa = e.target.closest(".wa-card-btn");
    var isDevice = !card.querySelector(".add");
    if (!ph && !(wa && isDevice)) return;
    var slug = card.getAttribute("data-slug") || card.id;
    var add = card.querySelector(".add");
    if (!slug && add) slug = add.dataset.slug;
    if (!slug) return;
    e.preventDefault();
    open(slug);
  }

  function bindCatalogRoot(root) {
    if (!root || root.dataset.qvBound === "1") return;
    root.dataset.qvBound = "1";
    root.addEventListener("click", onCatalogClick);
  }

  document.querySelectorAll(".cards").forEach(bindCatalogRoot);
  bindCatalogRoot(document.getElementById("grid"));
})();
