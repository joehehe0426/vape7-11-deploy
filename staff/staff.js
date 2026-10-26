/* Vape7-11 staff stock-take — MySQL via api/staff.php (web or APK) + full audit */
(function () {
  "use strict";

  var API_BASE = (typeof window.VH_API_BASE === "string" && window.VH_API_BASE)
    ? window.VH_API_BASE.replace(/\/+$/, "")
    : "..";
  var API = API_BASE + "/api/staff.php";
  var TOKEN_KEY = "vh_staff_token";
  var NAME_KEY = "vh_staff_name";
  var THEME_KEY = "vh_staff_theme";

  var token = localStorage.getItem(TOKEN_KEY) || "";
  var actorName = localStorage.getItem(NAME_KEY) || "user001";
  var products = [];
  var productIndex = Object.create(null);
  var activeSlug = null;
  var currentTab = "stock";
  var stockPage = "list";
  var logsDirty = true;
  var adjusting = false;
  var adjustQueue = [];

  var loginView = document.getElementById("loginView");
  var pinChangeView = document.getElementById("pinChangeView");
  var mainView = document.getElementById("mainView");
  var pinInput = document.getElementById("pinInput");
  var nameInput = document.getElementById("nameInput");
  var newPinInput = document.getElementById("newPinInput");
  var confirmPinInput = document.getElementById("confirmPinInput");
  var currentPinInput = document.getElementById("currentPinInput");
  var pinChangeTitle = document.getElementById("pinChangeTitle");
  var pinChangeSub = document.getElementById("pinChangeSub");
  var pinChangeCancelBtn = document.getElementById("pinChangeCancelBtn");
  var changePinNavBtn = document.getElementById("changePinNavBtn");
  var pinChangeForced = false;
  var loginErr = document.getElementById("loginErr");
  var pinChangeErr = document.getElementById("pinChangeErr");
  var productList = document.getElementById("productList");
  var variantPanel = document.getElementById("variantPanel");
  var productTitle = document.getElementById("productTitle");
  var moveList = document.getElementById("moveList");
  var auditList = document.getElementById("auditList");
  var actorLabel = document.getElementById("actorLabel");
  var searchInput = document.getElementById("searchInput");
  var catFilter = document.getElementById("catFilter");
  var lowOnly = document.getElementById("lowOnly");
  var serverBtn = document.getElementById("serverBtn");
  var stockListPanel = document.getElementById("stockListPanel");
  var stockDetailPanel = document.getElementById("stockDetailPanel");
  var addProductPanel = document.getElementById("addProductPanel");
  var membersPanel = document.getElementById("membersPanel");
  var memberDetailPanel = document.getElementById("memberDetailPanel");
  var historyPanel = document.getElementById("historyPanel");
  var staffUsersPanel = document.getElementById("staffUsersPanel");
  var mainTabs = document.getElementById("mainTabs");
  var tabStock = document.getElementById("tabStock");
  var tabTotals = document.getElementById("tabTotals");
  var tabMembers = document.getElementById("tabMembers");
  var tabPricing = document.getElementById("tabPricing");
  var tabStatement = document.getElementById("tabStatement");
  var tabHistory = document.getElementById("tabHistory");
  var tabStaff = document.getElementById("tabStaff");
  var totalsPanel = document.getElementById("totalsPanel");
  var totalsMeta = document.getElementById("totalsMeta");
  var totalsList = document.getElementById("totalsList");
  var pricingPanel = document.getElementById("pricingPanel");
  var pricingMeta = document.getElementById("pricingMeta");
  var pricingList = document.getElementById("pricingList");
  var statementPanel = document.getElementById("statementPanel");
  var statementMeta = document.getElementById("statementMeta");
  var statementList = document.getElementById("statementList");
  var statementSummary = document.getElementById("statementSummary");
  var statementDate = document.getElementById("statementDate");
  var statementPrev = document.getElementById("statementPrev");
  var statementNext = document.getElementById("statementNext");
  var statementRefresh = document.getElementById("statementRefresh");
  var staffUsersList = document.getElementById("staffUsersList");
  var staffUsersMeta = document.getElementById("staffUsersMeta");
  var staffUsersRefreshBtn = document.getElementById("staffUsersRefreshBtn");
  var createStaffForm = document.getElementById("createStaffForm");
  var createStaffErr = document.getElementById("createStaffErr");
  var staffRole = localStorage.getItem("vh_staff_role") || "";
  var backBtn = document.getElementById("backBtn");
  var variantSearch = document.getElementById("variantSearch");
  var addProductBtn = document.getElementById("addProductBtn");
  var addVariantBtn = document.getElementById("addVariantBtn");
  var addProductForm = document.getElementById("addProductForm");
  var addProductErr = document.getElementById("addProductErr");
  var memberSearch = document.getElementById("memberSearch");
  var membersList = document.getElementById("membersList");
  var membersMeta = document.getElementById("membersMeta");
  var memberRefreshBtn = document.getElementById("memberRefreshBtn");
  var memberDetailMeta = document.getElementById("memberDetailMeta");
  var deductForm = document.getElementById("deductForm");
  var deductPoints = document.getElementById("deductPoints");
  var deductNote = document.getElementById("deductNote");
  var deductErr = document.getElementById("deductErr");
  var deductBtn = document.getElementById("deductBtn");
  var purchaseForm = document.getElementById("purchaseForm");
  var purchaseAmount = document.getElementById("purchaseAmount");
  var purchaseItems = document.getElementById("purchaseItems");
  var purchasePoints = document.getElementById("purchasePoints");
  var purchaseNote = document.getElementById("purchaseNote");
  var purchaseErr = document.getElementById("purchaseErr");
  var purchaseDeductBtn = document.getElementById("purchaseDeductBtn");
  var purchaseList = document.getElementById("purchaseList");
  var purchaseListMeta = document.getElementById("purchaseListMeta");
  var memberOrdersList = document.getElementById("memberOrdersList");
  var memberPage = "list";
  var activeMemberCode = "";
  var activeMemberPhone = "";
  var activeMemberName = "";
  var loginBtn = document.getElementById("loginBtn");
  var pinChangeBtn = document.getElementById("pinChangeBtn");
  var logoutBtn = document.getElementById("logoutBtn");
  var newPrice = document.getElementById("newPrice");
  var newCost = document.getElementById("newCost");
  var newNameZh = document.getElementById("newNameZh");
  var newNameEn = document.getElementById("newNameEn");
  var newCat = document.getElementById("newCat");
  var newSlug = document.getElementById("newSlug");
  var newVariants = document.getElementById("newVariants");
  var addProductSaveBtn = document.getElementById("addProductSaveBtn");

  if (nameInput) nameInput.value = actorName || "admin";

  var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  var askOverlay = document.getElementById("askOverlay");
  var askTitle = document.getElementById("askTitle");
  var askInput = document.getElementById("askInput");
  var askErr = document.getElementById("askErr");
  var askOk = document.getElementById("askOk");
  var askCancel = document.getElementById("askCancel");
  var askResolver = null;

  function ensureAskUi() {
    if (askOverlay && askInput && askOk && askCancel) return;
    var wrap = document.createElement("div");
    wrap.className = "ask-overlay hidden";
    wrap.id = "askOverlay";
    wrap.innerHTML = '<div class="ask-card" role="dialog" aria-modal="true">' +
      '<p id="askTitle">輸入積分</p>' +
      '<input type="number" id="askInput" inputmode="numeric" step="1">' +
      '<p class="err hidden" id="askErr"></p>' +
      '<div class="row-actions">' +
      '<button type="button" class="btn btn--ghost" id="askCancel">取消</button>' +
      '<button type="button" class="btn btn--primary" id="askOk">確定</button>' +
      "</div></div>";
    document.body.appendChild(wrap);
    askOverlay = wrap;
    askTitle = document.getElementById("askTitle");
    askInput = document.getElementById("askInput");
    askErr = document.getElementById("askErr");
    askOk = document.getElementById("askOk");
    askCancel = document.getElementById("askCancel");
    wireAskUi();
  }

  function closeAsk(value) {
    if (askOverlay) askOverlay.classList.add("hidden");
    var fn = askResolver;
    askResolver = null;
    if (fn) fn(value);
  }

  function wireAskUi() {
    if (askOk) {
      askOk.onclick = function () {
        var n = parseInt(String(askInput.value || "").replace(/[^\d-]/g, ""), 10);
        if (!n || isNaN(n)) {
          if (askErr) {
            askErr.textContent = "請輸入有效數字";
            askErr.classList.remove("hidden");
          }
          return;
        }
        closeAsk(n);
      };
    }
    if (askCancel) askCancel.onclick = function () { closeAsk(null); };
    if (askOverlay) {
      askOverlay.addEventListener("click", function (e) {
        if (e.target === askOverlay) closeAsk(null);
      });
    }
    if (askInput) {
      askInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && askOk) askOk.click();
        if (e.key === "Escape") closeAsk(null);
      });
    }
  }

  function askNumber(title, defVal) {
    ensureAskUi();
    return new Promise(function (resolve) {
      askResolver = resolve;
      if (askTitle) askTitle.textContent = title;
      if (askInput) {
        askInput.value = defVal == null ? "" : String(defVal);
      }
      if (askErr) {
        askErr.textContent = "";
        askErr.classList.add("hidden");
      }
      if (askOverlay) askOverlay.classList.remove("hidden");
      setTimeout(function () {
        if (askInput) {
          askInput.focus();
          askInput.select();
        }
      }, 50);
    });
  }

  wireAskUi();

  function debounce(fn, ms, holder) {
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(holder.id);
      holder.id = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function setProducts(list) {
    products = list || [];
    productIndex = Object.create(null);
    for (var i = 0; i < products.length; i++) {
      productIndex[products[i].slug] = products[i];
    }
  }

  function findProduct(slug) {
    return productIndex[slug] || null;
  }

  function applyTheme(theme) {
    theme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
    var meta = document.getElementById("themeColorMeta");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0d0d0f" : "#fbfbfd");
    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-theme-set") === theme);
    });
  }

  try {
    applyTheme(localStorage.getItem(THEME_KEY) || "light");
  } catch (e) {
    applyTheme("light");
  }
  document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyTheme(btn.getAttribute("data-theme-set"));
    });
  });

  function setHidden(el, hide) {
    if (el) el.classList.toggle("hidden", !!hide);
  }

  function syncStockPanels() {
    var onStock = currentTab === "stock";
    var onMembers = currentTab === "members";
    setHidden(stockListPanel, !onStock || stockPage !== "list");
    setHidden(stockDetailPanel, !onStock || stockPage !== "detail");
    setHidden(addProductPanel, !onStock || stockPage !== "add");
    setHidden(membersPanel, !onMembers || memberPage !== "list");
    setHidden(memberDetailPanel, !onMembers || memberPage !== "detail");
    setHidden(historyPanel, currentTab !== "history");
    setHidden(staffUsersPanel, currentTab !== "staff");
    setHidden(totalsPanel, currentTab !== "totals");
    setHidden(pricingPanel, currentTab !== "pricing");
    setHidden(statementPanel, currentTab !== "statement");
  }

  function updateChrome() {
    var onDetail = currentTab === "stock" && stockPage === "detail" && activeSlug;
    var onAdd = currentTab === "stock" && stockPage === "add";
    var onMemberDetail = currentTab === "members" && memberPage === "detail";
    setHidden(backBtn, !(onDetail || onAdd || onMemberDetail));
    setHidden(mainTabs, onDetail || onAdd || onMemberDetail);
    setHidden(tabHistory, staffRole !== "admin");
    setHidden(tabStaff, staffRole !== "admin");
    setHidden(tabPricing, staffRole !== "admin");
    setHidden(tabStatement, staffRole !== "admin");
    if (!productTitle) return;
    if (onMemberDetail) {
      productTitle.textContent = (activeMemberName || "會員") + " · 消費紀錄";
    } else if (currentTab === "members") {
      productTitle.textContent = "會員資料";
    } else if (currentTab === "totals") {
      productTitle.textContent = "各商品總庫存";
    } else if (currentTab === "pricing") {
      productTitle.textContent = "成本與售價";
    } else if (currentTab === "statement") {
      productTitle.textContent = "每日銷售結算";
    } else if (currentTab === "history") {
      productTitle.textContent = "操作紀錄";
    } else if (currentTab === "staff") {
      productTitle.textContent = "員工帳號";
    } else if (onAdd) {
      productTitle.textContent = "新增商品";
    } else if (onDetail) {
      var p = findProduct(activeSlug);
      productTitle.textContent = p
        ? (p.name_zh + (p.cat === "device" ? " · 顏色" : " · 口味"))
        : "庫存";
    } else {
      productTitle.textContent = "選擇商品";
    }
  }

  function showStockList() {
    stockPage = "list";
    activeSlug = null;
    syncStockPanels();
    updateChrome();
    renderProducts();
  }

  function showAddProduct() {
    stockPage = "add";
    activeSlug = null;
    syncStockPanels();
    setHidden(addProductErr, true);
    if (addProductForm) addProductForm.reset();
    if (newPrice) newPrice.value = "0";
    if (newCost) newCost.value = "0";
    updateChrome();
  }

  function showStockDetail(slug) {
    stockPage = "detail";
    activeSlug = slug;
    if (variantSearch) variantSearch.value = "";
    if (lowOnly) lowOnly.checked = false;
    syncStockPanels();
    updateChrome();
    renderVariants();
  }

  function setTab(tab) {
    if ((tab === "staff" || tab === "history" || tab === "pricing" || tab === "statement") && staffRole !== "admin") tab = "stock";
    currentTab = tab;
    if (tab !== "stock") {
      stockPage = "list";
      activeSlug = null;
    }
    if (tab !== "members") {
      memberPage = "list";
      activeMemberCode = "";
    }
    if (tabStock) tabStock.classList.toggle("is-active", tab === "stock");
    if (tabTotals) tabTotals.classList.toggle("is-active", tab === "totals");
    if (tabMembers) tabMembers.classList.toggle("is-active", tab === "members");
    if (tabPricing) tabPricing.classList.toggle("is-active", tab === "pricing");
    if (tabStatement) tabStatement.classList.toggle("is-active", tab === "statement");
    if (tabHistory) tabHistory.classList.toggle("is-active", tab === "history");
    if (tabStaff) tabStaff.classList.toggle("is-active", tab === "staff");
    syncStockPanels();
    updateChrome();
    if (tab === "stock") renderProducts();
    if (tab === "totals") renderTotals();
    if (tab === "pricing") renderPricing();
    if (tab === "statement") loadDailyStatement();
    if (tab === "members") {
      if (memberPage === "detail" && activeMemberCode) loadMemberPurchases();
      else loadMembers();
    }
    if (tab === "history") refreshLogs(false);
    if (tab === "staff") loadStaffUsers();
  }

  function showMemberList() {
    memberPage = "list";
    activeMemberCode = "";
    activeMemberPhone = "";
    activeMemberName = "";
    syncStockPanels();
    updateChrome();
    loadMembers();
  }

  function showMemberDetail(code, phone, name) {
    memberPage = "detail";
    activeMemberCode = code || "";
    activeMemberPhone = phone || "";
    activeMemberName = name || "";
    if (purchaseForm) purchaseForm.reset();
    setHidden(purchaseErr, true);
    syncStockPanels();
    updateChrome();
    loadMemberPurchases();
  }

  function showOnly(view) {
    setHidden(loginView, true);
    setHidden(pinChangeView, true);
    setHidden(mainView, true);
    setHidden(view, false);
  }

  function showPinChangeErr(msg) {
    if (!pinChangeErr) return;
    pinChangeErr.textContent = msg;
    setHidden(pinChangeErr, false);
  }

  function showErr(msg) {
    loginErr.textContent = msg;
    setHidden(loginErr, false);
  }

  function deviceInfo() {
    try {
      if (window.AndroidStock && AndroidStock.getDeviceInfo) {
        return String(AndroidStock.getDeviceInfo() || "");
      }
    } catch (e) { /* ignore */ }
    return navigator.userAgent ? navigator.userAgent.slice(0, 80) : "web";
  }

  function setActor(name) {
    actorName = name || "staff";
    if (actorLabel) actorLabel.textContent = actorName;
  }

  function api(action, opts) {
    opts = opts || {};
    var url = API + "?action=" + encodeURIComponent(action);
    if (opts.query) url += "&" + opts.query;
    var headers = {};
    if (opts.body) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = "Bearer " + token;
    return fetch(url, {
      method: opts.method || "GET",
      credentials: token ? "omit" : "include",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) {
          throw new Error("伺服器回傳非 JSON（HTTP " + r.status + "）");
        }
        if (!r.ok && !data) throw new Error("HTTP " + r.status);
        if (!data) throw new Error("空回應 HTTP " + r.status);
        return data;
      });
    });
  }

  function loadCatalog() {
    return api("catalog").then(function (res) {
      if (!res.ok) throw new Error(res.error || "Load failed");
      if (res.actor) setActor(res.actor);
      setProducts(res.products || []);
      if (stockPage === "list") renderProducts();
      else if (stockPage === "detail") renderVariants();
      if (currentTab === "totals") renderTotals();
      if (currentTab === "pricing") renderPricing();
    });
  }

  function loadMoves() {
    if (staffRole !== "admin" || !moveList) return Promise.resolve();
    return api("moves").then(function (res) {
      if (!res.ok) return;
      moveList.innerHTML = (res.moves || []).map(function (m) {
        var sign = m.delta > 0 ? "+" + m.delta : String(m.delta);
        return "<li><b>" + escapeHtml(m.actor || "staff") + "</b> · " + escapeHtml(m.created_at) + " · " +
          escapeHtml(m.product_zh) + " / " + escapeHtml(m.variant_zh) +
          " · " + escapeHtml(sign) + " → " + escapeHtml(m.qty_after) +
          " (" + escapeHtml(m.reason) + ")" +
          (m.note ? " · " + escapeHtml(m.note) : "") + "</li>";
      }).join("") || "<li>尚無庫存變動</li>";
    }).catch(function (e) {
      moveList.innerHTML = "<li>無法載入庫存變動：" + escapeHtml(e && e.message ? e.message : "未知錯誤") + "</li>";
    });
  }

  function loadAudit() {
    if (staffRole !== "admin" || !auditList) return Promise.resolve();
    return api("audit").then(function (res) {
      if (!res.ok) return;
      auditList.innerHTML = (res.events || []).map(function (e) {
        var d = e.detail || {};
        var extra = "";
        if (d.product_zh || d.variant_zh) {
          extra = " · " + escapeHtml(d.product_zh || "") + "/" + escapeHtml(d.variant_zh || "");
        }
        if (d.delta != null) extra += " · Δ" + escapeHtml(d.delta);
        if (d.qty != null) extra += " · qty=" + escapeHtml(d.qty);
        if (d.qty_after != null) extra += " → " + escapeHtml(d.qty_after);
        if (d.reason) extra += " · " + escapeHtml(d.reason);
        if (d.error) extra += " · err=" + escapeHtml(d.error);
        return "<li><b>" + escapeHtml(e.actor || "?") + "</b> · " + escapeHtml(e.created_at) +
          " · " + escapeHtml(e.event) + extra +
          (e.ip ? " · IP " + escapeHtml(e.ip) : "") + "</li>";
      }).join("") || "<li>尚無稽核紀錄</li>";
    }).catch(function () { /* table may not exist yet */ });
  }

  function refreshLogs(force) {
    if (staffRole !== "admin") return Promise.resolve();
    if (!force && !logsDirty) return Promise.resolve();
    logsDirty = false;
    return Promise.all([loadMoves(), loadAudit()]);
  }

  function markLogsDirty() {
    logsDirty = true;
  }

  function loadMembers() {
    if (!membersList) return Promise.resolve();
    var q = memberSearch ? memberSearch.value.trim() : "";
    if (membersMeta) membersMeta.textContent = "載入中…";
    return api("members", { query: q ? ("q=" + encodeURIComponent(q)) : "" }).then(function (res) {
      if (!res.ok) {
        if (membersMeta) membersMeta.textContent = "無法載入會員：" + (res.error || "");
        return;
      }
      var members = res.members || [];
      if (membersMeta) {
        membersMeta.textContent = "共 " + (res.total != null ? res.total : members.length) +
          " 位會員" + (q ? " · 顯示 " + members.length + " 筆" : "");
      }
      if (!members.length) {
        membersList.innerHTML = '<p class="empty">尚無會員資料</p>';
        return;
      }
      membersList.innerHTML = members.map(function (m) {
        var tier = m.tier === "gold" ? "金會員" : "會員";
        var tierCls = m.tier === "gold" ? " gold" : "";
        var code = escapeHtml(m.id || "");
        return '<article class="member-card" data-member-code="' + code + '" data-member-phone="' + escapeHtml(m.phone || "") + '">' +
          "<b>" + escapeHtml(m.name) + "</b>" +
          '<span class="pts' + tierCls + '">' + tier + " · " + (m.points || 0) + " 分</span>" +
          "<span>編號 " + code + "</span>" +
          "<span>電話 " + escapeHtml(m.phone) + "</span>" +
          (m.email ? "<span>電郵 " + escapeHtml(m.email) + "</span>" : "") +
          "<span>加入 " + escapeHtml(m.created_at || "—") +
          (m.last_seen_at ? " · 最近 " + escapeHtml(m.last_seen_at) : "") + "</span>" +
          '<div class="row-actions">' +
          '<button type="button" class="btn btn--primary" data-member-act="history">消費紀錄</button>' +
          "</div>" +
          '<form class="pts-deduct" novalidate>' +
          '<input type="tel" inputmode="numeric" placeholder="扣多少分" autocomplete="off" data-pts-input>' +
          '<button type="submit" class="btn btn--ghost">扣積分</button>' +
          '<p class="pts-msg" data-pts-msg></p>' +
          "</form></article>";
      }).join("");
    }).catch(function (e) {
      if (membersMeta) membersMeta.textContent = "無法連線：" + e.message;
    });
  }

  function loadMemberPurchases() {
    if (!activeMemberCode) return Promise.resolve();
    if (memberDetailMeta) {
      memberDetailMeta.textContent = (activeMemberName || "會員") +
        " · " + activeMemberCode +
        (activeMemberPhone ? " · " + activeMemberPhone : "") +
        " · 載入中…";
    }
    if (purchaseListMeta) purchaseListMeta.textContent = "載入中…";
    if (purchaseList) purchaseList.innerHTML = '<p class="empty">載入中…</p>';
    if (memberOrdersList) memberOrdersList.innerHTML = '<p class="empty">載入中…</p>';
    return api("member_purchases", {
      query: "member_code=" + encodeURIComponent(activeMemberCode)
    }).then(function (res) {
      if (!res.ok) {
        if (purchaseListMeta) purchaseListMeta.textContent = "無法載入：" + (res.error || "");
        if (purchaseList) purchaseList.innerHTML = '<p class="empty">無法載入消費紀錄</p>';
        if (memberOrdersList) memberOrdersList.innerHTML = '<p class="empty">無法載入訂單紀錄</p>';
        return;
      }
      if (res.member) {
        activeMemberName = res.member.name || activeMemberName;
        activeMemberPhone = res.member.phone || activeMemberPhone;
        if (memberDetailMeta) {
          var tier = res.member.tier === "gold" ? "金會員" : "會員";
          memberDetailMeta.textContent = (res.member.name || "") +
            " · " + tier + " · " + (res.member.points || 0) + " 分 · " +
            (res.member.phone || "");
        }
        updateChrome();
      }
      var purchases = res.purchases || [];
      if (purchaseListMeta) {
        purchaseListMeta.textContent = purchases.length ? ("共 " + purchases.length + " 筆店員登記") : "尚未有店員登記的消費";
      }
      if (purchaseList) {
        purchaseList.innerHTML = purchases.length
          ? purchases.map(function (p) {
            var pts = p.points_earned || 0;
            var ptsLabel = pts > 0 ? ("+" + pts + " 分") : (pts < 0 ? (pts + " 分") : "0 分");
            return '<article class="purchase-card">' +
              '<b class="amt">HK$ ' + escapeHtml(String(p.amount != null ? p.amount : 0)) +
              " · " + ptsLabel + "</b>" +
              (p.items ? "<span>" + escapeHtml(p.items) + "</span>" : "") +
              (p.note ? "<span>備註 " + escapeHtml(p.note) + "</span>" : "") +
              "<span>" + escapeHtml(p.created_at || "") +
              (p.actor ? " · " + escapeHtml(p.actor) : "") + "</span>" +
              "</article>";
          }).join("")
          : '<p class="empty">尚無消費紀錄 — 用上方表單登記</p>';
      }
      var orders = res.orders || [];
      if (memberOrdersList) {
        memberOrdersList.innerHTML = orders.length
          ? orders.map(function (o) {
            return '<article class="purchase-card">' +
              "<b>" + escapeHtml(o.order_code || "") +
              ' · <span class="amt">HK$ ' + escapeHtml(String(o.amount != null ? o.amount : 0)) + "</span></b>" +
              "<span>" + escapeHtml(o.source || "") + " · " + escapeHtml(o.status || "") + "</span>" +
              (o.items ? "<span>" + escapeHtml(o.items) + "</span>" : "") +
              "<span>" + escapeHtml(o.created_at || "") + "</span>" +
              "</article>";
          }).join("")
          : '<p class="empty">尚無 WhatsApp／網站訂單</p>';
      }
    }).catch(function (e) {
      if (purchaseListMeta) purchaseListMeta.textContent = "無法連線：" + (e && e.message ? e.message : "");
      if (purchaseList) purchaseList.innerHTML = '<p class="empty">無法連線伺服器</p>';
      if (memberOrdersList) memberOrdersList.innerHTML = '<p class="empty">無法連線伺服器</p>';
    });
  }

  function parsePositiveInt(raw) {
    var n = parseInt(String(raw == null ? "" : raw).replace(/[^\d]/g, ""), 10);
    if (!n || isNaN(n) || n <= 0) return 0;
    return n;
  }

  function deductMemberPoints(code, n, note) {
    return api("add_member_purchase", {
      method: "POST",
      body: {
        member_code: code,
        amount: 0,
        items: "扣積分",
        points: -Math.abs(n),
        note: note || "staff_deduct"
      }
    });
  }

  function showFieldErr(el, msg) {
    if (!el) return;
    el.textContent = msg || "";
    setHidden(el, !msg);
  }

  function adjustMemberPoints(code, phone, delta) {
    if (!delta) return Promise.resolve();
    return api("add_member_points", {
      method: "POST",
      body: {
        member_code: code,
        phone: phone,
        points: delta,
        reason: delta > 0 ? "staff_add" : "staff_deduct"
      }
    }).then(function (res) {
      if (!res.ok) {
        var map = {
          bad_points: "積分數量不正確（不可為 0，單次最多 ±20000）",
          not_found: "找不到此會員",
          bad_args: "缺少會員編號",
          unauthorized: "請重新登入",
          must_change_password: "請先更改密碼"
        };
        alert(map[res.error] || ("操作失敗：" + (res.error || "")));
        return;
      }
      loadMembers();
      if (memberPage === "detail") loadMemberPurchases();
    }).catch(function (e) {
      alert("無法連線：" + (e && e.message ? e.message : ""));
    });
  }

  function filteredProducts() {
    var q = (searchInput && searchInput.value || "").trim().toLowerCase();
    var cat = catFilter ? catFilter.value : "all";
    var out = [];
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (cat !== "all" && p.cat !== cat) continue;
      if (!q) {
        out.push(p);
        continue;
      }
      var hay = (p.slug + " " + p.name_zh + " " + p.name_en).toLowerCase();
      if (hay.indexOf(q) !== -1) {
        out.push(p);
        continue;
      }
      var vars = p.variants || [];
      for (var j = 0; j < vars.length; j++) {
        if ((vars[j].name_zh + " " + vars[j].name_en).toLowerCase().indexOf(q) !== -1) {
          out.push(p);
          break;
        }
      }
    }
    return out;
  }

  function lowCount(p) {
    var n = 0;
    var vars = p.variants || [];
    for (var i = 0; i < vars.length; i++) {
      if (+vars[i].qty <= +vars[i].low_at) n++;
    }
    return n;
  }

  function productTotalQty(p) {
    var n = 0;
    var vars = (p && p.variants) || [];
    for (var i = 0; i < vars.length; i++) n += +vars[i].qty || 0;
    return n;
  }

  function catLabel(cat) {
    if (cat === "pod") return "煙彈";
    if (cat === "disposable") return "一次性";
    if (cat === "device") return "煙機";
    return cat || "";
  }

  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) v = 0;
    return "HK$ " + (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, "");
  }

  function safeInt(n) {
    var v = parseInt(n, 10);
    return isFinite(v) ? v : 0;
  }

  var YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
  var STATEMENT_MIN = "2020-01-01";

  function isYmd(s) {
    return YMD_RE.test(String(s || ""));
  }

  function clampStatementDate(ymd) {
    var today = hkToday();
    if (!isYmd(ymd)) return today;
    var p = String(ymd).split("-");
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== ymd) return today;
    if (ymd < STATEMENT_MIN) return STATEMENT_MIN;
    if (ymd > today) return today;
    return ymd;
  }

  function syncStatementDateBounds() {
    if (!statementDate) return;
    statementDate.min = STATEMENT_MIN;
    statementDate.max = hkToday();
  }

  function renderTotals() {
    if (!totalsList) return;
    var grand = 0;
    var html = "";
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var qty = productTotalQty(p);
      grand += qty;
      html += '<article class="total-card">' +
        "<b>" + escapeHtml(p.name_zh) + "</b>" +
        "<span>" + escapeHtml(catLabel(p.cat)) + " · " + (p.variants || []).length + " 款</span>" +
        '<div class="qty-big' + (qty <= 0 ? " is-zero" : "") + '">' + qty + "</div>" +
        "</article>";
    }
    if (totalsMeta) totalsMeta.textContent = "全部庫存合共 " + grand + " 件 · " + products.length + " 款商品";
    totalsList.innerHTML = html || '<p class="empty">未有商品</p>';
  }

  function renderPricing() {
    if (!pricingList) return;
    if (staffRole !== "admin") {
      pricingList.innerHTML = '<p class="empty">需要管理員權限</p>';
      return;
    }
    var html = "";
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var cost = +p.cost || 0;
      var price = +p.price || 0;
      var margin = price - cost;
      var pct = price > 0 ? Math.round((margin / price) * 100) : 0;
      html += '<article class="price-card" data-slug="' + escapeHtml(p.slug) + '">' +
        "<b>" + escapeHtml(p.name_zh) + "</b>" +
        "<span>" + escapeHtml(catLabel(p.cat)) + "</span>" +
        '<div class="price-grid">' +
        '<label>成本<input type="number" min="0" max="99999999.99" step="0.01" inputmode="decimal" data-f="cost" value="' + escapeHtml(String(cost)) + '"></label>' +
        '<label>售價<input type="number" min="0" max="99999999.99" step="0.01" inputmode="decimal" data-f="price" value="' + escapeHtml(String(price)) + '"></label>' +
        "</div>" +
        '<p class="margin" data-margin>毛利 ' + money(margin) + (price > 0 ? "（" + pct + "%）" : "") + "</p>" +
        '<button type="button" class="btn btn--primary" data-save-price>儲存</button>' +
        "</article>";
    }
    pricingList.innerHTML = html || '<p class="empty">未有商品</p>';
  }

  function hkToday() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Hong_Kong",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function shiftYmd(ymd, days) {
    var base = clampStatementDate(ymd);
    var p = base.split("-");
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    var n = parseInt(days, 10);
    if (!isFinite(n)) n = 0;
    d.setUTCDate(d.getUTCDate() + n);
    return clampStatementDate(d.toISOString().slice(0, 10));
  }

  function loadDailyStatement(date) {
    if (staffRole !== "admin") return;
    syncStatementDateBounds();
    var d = clampStatementDate(date || (statementDate && statementDate.value) || hkToday());
    if (statementDate) statementDate.value = d;
    if (statementNext) statementNext.disabled = d >= hkToday();
    if (statementPrev) statementPrev.disabled = d <= STATEMENT_MIN;
    if (statementMeta) statementMeta.textContent = "載入中…";
    api("daily_statement", { query: "date=" + encodeURIComponent(d) }).then(function (res) {
      if (!res.ok) {
        var errMap = {
          forbidden: "需要管理員權限",
          bad_date: "日期無效（只接受 2020 年至今）",
          method: "請重新整理後再試",
          unauthorized: "請重新登入"
        };
        if (statementMeta) statementMeta.textContent = errMap[res.error] || "無法載入日結";
        if (statementSummary) statementSummary.innerHTML = "";
        if (statementList) statementList.innerHTML = "";
        return;
      }
      var shown = clampStatementDate(res.date || d);
      if (statementDate) statementDate.value = shown;
      if (statementNext) statementNext.disabled = shown >= hkToday();
      if (statementPrev) statementPrev.disabled = shown <= STATEMENT_MIN;
      var profit = Number(res.profit);
      if (!isFinite(profit)) profit = 0;
      var profitClass = profit < 0 ? " is-loss" : (profit > 0 ? " is-profit" : "");
      if (statementSummary) {
        statementSummary.innerHTML =
          '<div class="stat-card"><span>銷售</span><b>' + money(res.sales) + "</b></div>" +
          '<div class="stat-card"><span>成本</span><b>' + money(res.cost) + "</b></div>" +
          '<div class="stat-card' + profitClass + '"><span>毛利</span><b>' + money(profit) + "</b></div>";
      }
      var bits = [shown];
      bits.push("訂單 " + safeInt(res.order_count) + " 張 · " + money(res.order_sales));
      if (safeInt(res.staff_count)) bits.push("店員登記 " + safeInt(res.staff_count) + " 筆 · " + money(res.staff_sales));
      if (Number(res.shipping) > 0) bits.push("運費另計 " + money(res.shipping) + "（不計毛利）");
      bits.push("毛利＝銷售－成本");
      if (statementMeta) statementMeta.textContent = bits.join(" · ");
      var html = "";
      var prodRows = Array.isArray(res.products) ? res.products : [];
      if (prodRows.length) {
        html += '<p class="statement-sec">商品明細</p>';
        for (var i = 0; i < prodRows.length; i++) {
          var row = prodRows[i] || {};
          html += '<article class="statement-row">' +
            "<b>" + escapeHtml(row.name_zh || row.slug) + "</b>" +
            "<span>" + safeInt(row.qty) + " 件 · 銷售 " + money(row.sales) +
            " · 成本 " + money(row.cost) + " · 毛利 " + money(row.profit) + "</span>" +
            "</article>";
        }
      }
      var purchases = Array.isArray(res.staff_purchases) ? res.staff_purchases : [];
      if (purchases.length) {
        html += '<p class="statement-sec">店員登記消費（無 SKU，不計成本）</p>';
        for (var j = 0; j < purchases.length; j++) {
          var sp = purchases[j] || {};
          html += '<article class="statement-row">' +
            "<b>" + money(sp.amount) + "</b>" +
            "<span>" + escapeHtml(sp.created_at || "") + " · " + escapeHtml(sp.actor || "staff") +
            (sp.items_text ? " · " + escapeHtml(sp.items_text) : "") + "</span>" +
            "</article>";
        }
      }
      var orders = Array.isArray(res.orders) ? res.orders : [];
      if (orders.length) {
        html += '<p class="statement-sec">訂單</p>';
        for (var k = 0; k < orders.length; k++) {
          var o = orders[k] || {};
          html += '<article class="statement-row">' +
            "<b>" + escapeHtml(o.order_code || "") + " · " + money(o.subtotal) + "</b>" +
            "<span>" + escapeHtml(o.created_at || "") + " · " + escapeHtml(o.source || "") +
            (o.customer_name ? " · " + escapeHtml(o.customer_name) : "") +
            " · " + escapeHtml(o.status || "") +
            (Number(o.shipping_fee) > 0 ? " · 運費 " + money(o.shipping_fee) : "") +
            "</span></article>";
        }
      }
      if (statementList) statementList.innerHTML = html || '<p class="empty">當日無銷售紀錄</p>';
    }).catch(function () {
      if (statementMeta) statementMeta.textContent = "無法連線伺服器";
    });
  }

  function renderProducts() {
    if (!productList || stockPage !== "list") return;
    var list = filteredProducts();
    if (!list.length) {
      productList.innerHTML = '<p class="empty">沒有符合的商品</p>';
      return;
    }
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var low = lowCount(p);
      html += '<button type="button" class="product-btn" data-slug="' + escapeHtml(p.slug) + '">' +
        "<b>" + escapeHtml(p.name_zh) + "</b><span>" + escapeHtml(p.cat) +
        " · " + (p.variants || []).length + " 款" +
        (low ? " · " + low + " 低庫存" : "") + "</span></button>";
    }
    productList.innerHTML = html;
  }

  function renderVariants() {
    if (!variantPanel) return;
    var p = findProduct(activeSlug);
    if (!p) {
      variantPanel.innerHTML = '<p class="empty">請先選擇商品</p>';
      return;
    }
    var q = (variantSearch && variantSearch.value || "").trim().toLowerCase();
    var onlyLow = lowOnly && lowOnly.checked;
    var vars = p.variants || [];
    var html = "";
    for (var i = 0; i < vars.length; i++) {
      var v = vars[i];
      var qty = +v.qty;
      var lowAt = +v.low_at;
      if (onlyLow && qty > lowAt) continue;
      if (q && (v.name_zh + " " + v.name_en + " " + v.variant_key).toLowerCase().indexOf(q) === -1) continue;
      var cls = "variant-card";
      var qtyCls = "qty";
      if (qty <= 0) { cls += " out"; qtyCls += " out"; }
      else if (qty <= lowAt) { cls += " low"; qtyCls += " low"; }
      html += '<article class="' + cls + '" data-key="' + escapeHtml(v.variant_key) + '">' +
        "<h3>" + escapeHtml(v.name_zh) + "<br><small>" + escapeHtml(v.name_en) + "</small></h3>" +
        '<div class="' + qtyCls + '" data-qty>' + qty + "</div>" +
        '<div class="variant-actions">' +
        '<button type="button" class="btn btn--sm" data-d="-1">−1</button>' +
        '<button type="button" class="btn btn--sm" data-d="1">+1</button>' +
        "</div></article>";
    }
    variantPanel.innerHTML = html
      ? '<div class="variant-grid">' + html + "</div>"
      : '<p class="empty">無符合的口味／顏色</p>';
  }

  function patchVariantQty(slug, variantKey, qty) {
    var card = variantPanel && variantPanel.querySelector('article[data-key="' + variantKey.replace(/"/g, '\\"') + '"]');
    if (!card) {
      renderVariants();
      return;
    }
    var p = findProduct(slug);
    var v = p && (p.variants || []).filter(function (x) { return x.variant_key === variantKey; })[0];
    var lowAt = v ? +v.low_at : 5;
    card.classList.toggle("out", qty <= 0);
    card.classList.toggle("low", qty > 0 && qty <= lowAt);
    var qtyEl = card.querySelector("[data-qty]");
    if (qtyEl) {
      qtyEl.textContent = String(qty);
      qtyEl.className = "qty" + (qty <= 0 ? " out" : qty <= lowAt ? " low" : "");
    }
  }

  function adjust(slug, variantKey, body) {
    adjustQueue.push({ slug: slug, variantKey: variantKey, body: body });
    pumpAdjust();
  }

  function pumpAdjust() {
    if (adjusting || !adjustQueue.length) return;
    var job = adjustQueue.shift();
    adjusting = true;
    var body = job.body;
    body.slug = job.slug;
    body.variant_key = job.variantKey;
    api("adjust", { method: "POST", body: body }).then(function (res) {
      adjusting = false;
      if (!res.ok) { alert(res.error || "更新失敗"); pumpAdjust(); return; }
      var p = findProduct(job.slug);
      if (p) {
        var vars = p.variants || [];
        for (var i = 0; i < vars.length; i++) {
          if (vars[i].variant_key === job.variantKey) {
            vars[i].qty = res.qty;
            break;
          }
        }
      }
      if (res.actor) setActor(res.actor);
      markLogsDirty();
      if (stockPage === "detail" && activeSlug === job.slug) patchVariantQty(job.slug, job.variantKey, res.qty);
      if (currentTab === "totals") renderTotals();
      pumpAdjust();
    }).catch(function (e) {
      adjusting = false;
      alert("無法連線伺服器：" + e.message);
      pumpAdjust();
    });
  }

  function enterApp() {
    showOnly(mainView);
    if (actorName) setActor(actorName);
    currentTab = "stock";
    stockPage = "list";
    if (tabStock) tabStock.classList.add("is-active");
    if (tabTotals) tabTotals.classList.remove("is-active");
    if (tabMembers) tabMembers.classList.remove("is-active");
    if (tabPricing) tabPricing.classList.remove("is-active");
    if (tabStatement) tabStatement.classList.remove("is-active");
    if (tabHistory) tabHistory.classList.remove("is-active");
    if (tabStaff) tabStaff.classList.remove("is-active");
    setHidden(tabHistory, staffRole !== "admin");
    setHidden(tabStaff, staffRole !== "admin");
    setHidden(tabPricing, staffRole !== "admin");
    setHidden(tabStatement, staffRole !== "admin");
    showStockList();
    loadCatalog().catch(function (e) {
      alert("無法載入庫存：" + e.message);
    });
  }

  function loadStaffUsers() {
    if (staffRole !== "admin") return;
    if (staffUsersMeta) staffUsersMeta.textContent = "載入中…";
    api("staff_users").then(function (res) {
      if (!res.ok) {
        if (staffUsersMeta) staffUsersMeta.textContent = "無法載入（需要管理員）";
        return;
      }
      var users = res.users || [];
      if (staffUsersMeta) staffUsersMeta.textContent = "共 " + users.length + " 個帳號";
      if (!staffUsersList) return;
      staffUsersList.innerHTML = users.map(function (u) {
        var badge = u.role === "admin" ? "管理員" : "職員";
        var status = u.active ? "" : " · 已停用";
        var must = u.must_change_pin ? " · 須改密碼" : "";
        return '<article class="member-row" data-uid="' + escapeHtml(u.id) + '">' +
          "<div><b>" + escapeHtml(u.display_name) + "</b> <span class=\"muted\">@" + escapeHtml(u.username) + "</span>" +
          "<div class=\"muted\">" + badge + status + must + "</div></div>" +
          '<div class="row-actions">' +
          (u.active
            ? '<button type="button" class="btn btn--ghost" data-staff-act="off">停用</button>'
            : '<button type="button" class="btn btn--ghost" data-staff-act="on">啟用</button>') +
          '<button type="button" class="btn btn--ghost" data-staff-act="reset">重設密碼</button>' +
          "</div></article>";
      }).join("") || "<p class=\"muted\">尚未有員工帳號</p>";
    }).catch(function () {
      if (staffUsersMeta) staffUsersMeta.textContent = "連線失敗";
    });
  }

  function passwordError(pw) {
    if (!pw || pw.length < 8) return "密碼最少 8 位";
    if (pw.length > 72) return "密碼太長（最多 72 位）";
    if (!/[^A-Za-z0-9]/.test(pw)) return "密碼須包含至少一個特殊字元（例如 ! @ # $ %）";
    return null;
  }

  function showChangePin(forced) {
    pinChangeForced = forced !== false;
    showOnly(pinChangeView);
    setHidden(pinChangeErr, true);
    if (newPinInput) newPinInput.value = "";
    if (confirmPinInput) confirmPinInput.value = "";
    if (currentPinInput) currentPinInput.value = "";
    setHidden(currentPinInput, pinChangeForced);
    setHidden(pinChangeCancelBtn, pinChangeForced);
    if (pinChangeTitle) {
      pinChangeTitle.textContent = pinChangeForced ? "請先設定密碼" : "更改密碼";
    }
    if (pinChangeSub) {
      pinChangeSub.textContent = pinChangeForced
        ? "密碼最少 8 位，並須包含特殊字元（例如 ! @ # $ %）。設定後請用新密碼登入。"
        : "請輸入現有密碼，再設定新密碼（最少 8 位＋特殊字元）。";
    }
    var focusEl = pinChangeForced ? newPinInput : currentPinInput;
    if (focusEl) focusEl.focus();
  }

  function afterAuth(res) {
    if (res.token) {
      token = res.token;
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (res.actor) setActor(res.actor);
    if (res.role) {
      staffRole = res.role;
      localStorage.setItem("vh_staff_role", staffRole);
    }
    if (res.username) {
      localStorage.setItem(NAME_KEY, res.username);
      actorName = res.username;
    }
    if (res.must_change_pin || res.must_change_password) {
      showChangePin(true);
      return;
    }
    enterApp();
  }

  if (productList) {
    productList.addEventListener("click", function (e) {
      var btn = e.target.closest(".product-btn");
      if (!btn) return;
      showStockDetail(btn.getAttribute("data-slug"));
    });
  }

  if (variantPanel) {
    variantPanel.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-d]");
      if (!btn || !activeSlug) return;
      var card = btn.closest("article[data-key]");
      if (!card) return;
      var key = card.getAttribute("data-key");
      adjust(activeSlug, key, { delta: +btn.getAttribute("data-d"), reason: "adjust" });
    });
  }

  if (loginBtn) {
    loginBtn.onclick = function () {
      setHidden(loginErr, true);
      var name = (nameInput && nameInput.value || "").trim().toLowerCase();
      if (!name) {
        showErr("請輸入員工帳號（例如 admin）");
        return;
      }
      localStorage.setItem(NAME_KEY, name);
      api("login", {
        method: "POST",
        body: { password: pinInput.value, staff_name: name, device: deviceInfo() }
      }).then(function (res) {
        if (!res.ok) {
          if (res.error === "too_many_attempts") {
            var mins = res.retry_after ? Math.ceil(res.retry_after / 60) : 5;
            showErr("嘗試次數過多，此 IP 已鎖定 " + mins + " 分鐘，請稍後再試。");
            return;
          }
          showErr(res.error === "bad_username" ? "帳號格式不正確" : "帳號或密碼錯誤（已記錄）");
          return;
        }
        afterAuth(res);
      }).catch(function (e) {
        var tip = "無法連線伺服器。請按「更改網站網址」，填 https://www.vape7-11.com";
        if (e && e.message) tip += "（" + e.message + "）";
        showErr(tip);
      });
    };
  }

  if (pinChangeBtn) {
    pinChangeBtn.onclick = function () {
      setHidden(pinChangeErr, true);
      var cur = (currentPinInput && currentPinInput.value || "");
      var a = (newPinInput && newPinInput.value || "");
      var b = (confirmPinInput && confirmPinInput.value || "");
      if (!pinChangeForced && !cur) {
        showPinChangeErr("請輸入現有密碼");
        return;
      }
      var pwErr = passwordError(a);
      if (pwErr) {
        showPinChangeErr(pwErr);
        return;
      }
      if (a !== b) {
        showPinChangeErr("兩次輸入的密碼不一致");
        return;
      }
      var body = { new_password: a, confirm_password: b };
      if (!pinChangeForced) body.current_password = cur;
      api("change_password", {
        method: "POST",
        body: body
      }).then(function (res) {
        if (!res.ok) {
          var map = {
            password_short: "密碼最少 8 位",
            password_long: "密碼太長（最多 72 位）",
            password_special: "密碼須包含至少一個特殊字元",
            password_mismatch: "兩次輸入的密碼不一致",
            password_same: "新密碼不可與舊密碼相同",
            password_default: "請勿使用預設密碼",
            bad_current_password: "現有密碼不正確",
            pin_format: "密碼最少 8 位，並須含特殊字元",
            pin_mismatch: "兩次輸入的密碼不一致",
            pin_same: "新密碼不可與舊密碼相同",
            pin_default: "請勿使用預設密碼",
            bad_current_pin: "現有密碼不正確"
          };
          showPinChangeErr(map[res.error] || ("更改失敗：" + (res.error || "")));
          return;
        }
        afterAuth(res);
      }).catch(function () {
        showPinChangeErr("無法連線伺服器");
      });
    };
  }

  if (pinChangeCancelBtn) {
    pinChangeCancelBtn.onclick = function () {
      enterApp();
    };
  }

  if (changePinNavBtn) {
    changePinNavBtn.onclick = function () {
      showChangePin(false);
    };
  }

  if (pinInput) {
    pinInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && loginBtn) loginBtn.click();
    });
  }
  if (nameInput) {
    nameInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && pinInput) pinInput.focus();
    });
  }

  if (logoutBtn) {
    logoutBtn.onclick = function () {
      api("logout", { method: "POST" }).finally(function () {
        token = "";
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(NAME_KEY);
        localStorage.removeItem("vh_staff_role");
        showOnly(loginView);
        if (pinInput) pinInput.value = "";
      });
    };
  }

  if (serverBtn) {
    if (window.AndroidStock && window.AndroidStock.changeServer) {
      setHidden(serverBtn, false);
      serverBtn.onclick = function () { window.AndroidStock.changeServer(); };
    } else {
      setHidden(serverBtn, true);
    }
  }

  var searchHold = { id: null };
  var variantHold = { id: null };
  if (searchInput) {
    searchInput.oninput = debounce(renderProducts, 160, searchHold);
  }
  if (catFilter) catFilter.onchange = renderProducts;
  if (variantSearch) {
    variantSearch.oninput = debounce(renderVariants, 120, variantHold);
  }
  if (lowOnly) lowOnly.onchange = renderVariants;

  if (backBtn) {
    backBtn.onclick = function () {
      if (currentTab === "members" && memberPage === "detail") {
        showMemberList();
        return;
      }
      showStockList();
    };
  }
  if (tabStock) {
    tabStock.onclick = function () {
      setTab("stock");
      showStockList();
    };
  }
  if (tabTotals) tabTotals.onclick = function () { setTab("totals"); };
  if (tabPricing) tabPricing.onclick = function () { setTab("pricing"); };
  if (tabStatement) tabStatement.onclick = function () { setTab("statement"); };
  if (statementPrev) {
    statementPrev.onclick = function () {
      loadDailyStatement(shiftYmd(currentStatementDate(), -1));
    };
  }
  if (statementNext) {
    statementNext.onclick = function () {
      var next = shiftYmd(currentStatementDate(), 1);
      if (next > hkToday()) return;
      loadDailyStatement(next);
    };
  }
  if (statementRefresh) statementRefresh.onclick = function () { loadDailyStatement(); };
  if (statementDate) {
    statementDate.onchange = function () {
      loadDailyStatement(clampStatementDate(statementDate.value));
    };
  }
  function currentStatementDate() {
    return clampStatementDate((statementDate && statementDate.value) || hkToday());
  }
  if (tabMembers) {
    tabMembers.onclick = function () {
      memberPage = "list";
      setTab("members");
    };
  }
  if (tabHistory) tabHistory.onclick = function () { setTab("history"); };
  if (tabStaff) tabStaff.onclick = function () { setTab("staff"); };
  if (staffUsersRefreshBtn) staffUsersRefreshBtn.onclick = loadStaffUsers;

  function updateCardMargin(card) {
    if (!card) return;
    var costEl = card.querySelector('input[data-f="cost"]');
    var priceEl = card.querySelector('input[data-f="price"]');
    var marginEl = card.querySelector("[data-margin]");
    var cost = parseFloat(costEl && costEl.value || "0");
    var price = parseFloat(priceEl && priceEl.value || "0");
    if (isNaN(cost)) cost = 0;
    if (isNaN(price)) price = 0;
    var margin = price - cost;
    var pct = price > 0 ? Math.round((margin / price) * 100) : 0;
    if (marginEl) marginEl.textContent = "毛利 " + money(margin) + (price > 0 ? "（" + pct + "%）" : "");
  }

  if (pricingList) {
    pricingList.addEventListener("input", function (e) {
      var inp = e.target.closest("input[data-f]");
      if (!inp) return;
      updateCardMargin(inp.closest(".price-card"));
    });
    pricingList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-save-price]");
      if (!btn) return;
      var card = btn.closest(".price-card");
      if (!card) return;
      var slug = card.getAttribute("data-slug") || "";
      if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
        alert("商品編號無效");
        return;
      }
      var costEl = card.querySelector('input[data-f="cost"]');
      var priceEl = card.querySelector('input[data-f="price"]');
      var cost = parseFloat(costEl && costEl.value || "0");
      var price = parseFloat(priceEl && priceEl.value || "0");
      if (!isFinite(cost) || !isFinite(price) || cost < 0 || price < 0 || cost > 99999999.99 || price > 99999999.99) {
        alert("請輸入有效金額（0–99999999.99）");
        return;
      }
      cost = Math.round(cost * 100) / 100;
      price = Math.round(price * 100) / 100;
      btn.disabled = true;
      btn.textContent = "儲存中…";
      api("update_pricing", {
        method: "POST",
        body: { slug: slug, cost: cost, price: price }
      }).then(function (res) {
        btn.disabled = false;
        btn.textContent = "儲存";
        if (!res.ok) {
          alert({
            forbidden: "需要管理員權限",
            not_found: "找不到商品",
            bad_args: "資料不完整",
            bad_amount: "金額無效（須為 0–99999999.99）",
            method: "請重新整理後再試"
          }[res.error] || "儲存失敗");
          return;
        }
        var p = findProduct(slug);
        if (p) {
          p.cost = res.product.cost;
          p.price = res.product.price;
        }
        btn.textContent = "已儲存";
        setTimeout(function () { btn.textContent = "儲存"; }, 1200);
      }).catch(function (err) {
        btn.disabled = false;
        btn.textContent = "儲存";
        alert("無法連線：" + err.message);
      });
    });
  }

  if (staffUsersList) {
    staffUsersList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-staff-act]");
      if (!btn) return;
      var row = btn.closest("[data-uid]");
      if (!row) return;
      var id = +row.getAttribute("data-uid");
      var act = btn.getAttribute("data-staff-act");
      if (act === "on" || act === "off") {
        api("set_staff_active", {
          method: "POST",
          body: { id: id, active: act === "on" }
        }).then(function (res) {
          if (!res.ok) {
            alert({
              cannot_disable_self: "不能停用自己",
              last_admin: "至少要有一位管理員",
              forbidden: "需要管理員權限"
            }[res.error] || ("失敗：" + (res.error || "")));
            return;
          }
          loadStaffUsers();
        });
        return;
      }
      if (act === "reset") {
        var pin = prompt("為此員工設定臨時密碼（最少 8 位＋特殊字元，下次登入須再改）：", "");
        if (pin === null) return;
        pin = String(pin);
        var resetErr = passwordError(pin);
        if (resetErr) {
          alert(resetErr);
          return;
        }
        api("reset_staff_password", {
          method: "POST",
          body: { id: id, new_password: pin }
        }).then(function (res) {
          if (!res.ok) {
            var map = {
              password_short: "密碼最少 8 位",
              password_special: "密碼須包含特殊字元",
              password_long: "密碼太長"
            };
            alert(map[res.error] || ("重設失敗：" + (res.error || "")));
            return;
          }
          alert("已重設。請通知該員工用臨時密碼登入後立刻更改。");
          loadStaffUsers();
        });
      }
    });
  }

  if (createStaffForm) {
    createStaffForm.onsubmit = function (e) {
      e.preventDefault();
      setHidden(createStaffErr, true);
      var username = (document.getElementById("newStaffUsername").value || "").trim().toLowerCase();
      var display = (document.getElementById("newStaffDisplay").value || "").trim();
      var pin = (document.getElementById("newStaffPin").value || "");
      var role = (document.getElementById("newStaffRole").value || "staff");
      var createPwErr = passwordError(pin);
      if (createPwErr) {
        if (createStaffErr) {
          createStaffErr.textContent = createPwErr;
          setHidden(createStaffErr, false);
        }
        return;
      }
      api("create_staff_user", {
        method: "POST",
        body: { username: username, display_name: display, password: pin, role: role }
      }).then(function (res) {
        if (!res.ok) {
          var map = {
            bad_username: "帳號須為英文／數字（至少 2 字）",
            password_short: "密碼最少 8 位",
            password_special: "密碼須包含特殊字元",
            password_long: "密碼太長",
            pin_format: "密碼最少 8 位＋特殊字元",
            username_taken: "帳號已存在",
            forbidden: "需要管理員權限"
          };
          if (createStaffErr) {
            createStaffErr.textContent = map[res.error] || ("失敗：" + (res.error || ""));
            setHidden(createStaffErr, false);
          }
          return;
        }
        createStaffForm.reset();
        loadStaffUsers();
      }).catch(function () {
        if (createStaffErr) {
          createStaffErr.textContent = "無法連線";
          setHidden(createStaffErr, false);
        }
      });
    };
  }

  if (addProductBtn) addProductBtn.onclick = showAddProduct;

  if (addVariantBtn) {
    addVariantBtn.onclick = function () {
      if (!activeSlug) return;
      var name = prompt("新口味／顏色名稱：", "");
      if (name === null) return;
      name = String(name).trim();
      if (!name) return;
      api("add_variant", {
        method: "POST",
        body: { slug: activeSlug, name_zh: name, name_en: name }
      }).then(function (res) {
        if (!res.ok) {
          var map = {
            variant_exists: "此口味代碼已存在",
            product_not_found: "找不到商品",
            bad_args: "資料不完整",
            bad_key: "無法產生代碼，請改用英文名稱"
          };
          alert(map[res.error] || ("新增失敗：" + (res.error || "")));
          return;
        }
        var p = findProduct(activeSlug);
        if (p) {
          p.variants = p.variants || [];
          p.variants.push(res.variant);
        }
        markLogsDirty();
        renderVariants();
      }).catch(function (e) {
        alert("無法連線：" + e.message);
      });
    };
  }

  if (addProductForm) {
    addProductForm.onsubmit = function (e) {
      e.preventDefault();
      setHidden(addProductErr, true);
      var nameZh = (newNameZh && newNameZh.value || "").trim();
      var nameEn = (newNameEn && newNameEn.value || "").trim();
      var cat = newCat ? newCat.value : "pod";
      var price = parseFloat(newPrice && newPrice.value || "0");
      var cost = parseFloat(newCost && newCost.value || "0");
      var slug = (newSlug && newSlug.value || "").trim().toLowerCase();
      var lines = (newVariants && newVariants.value || "").split(/\r?\n/)
        .map(function (l) { return l.trim(); })
        .filter(Boolean);
      if (!nameZh) {
        if (addProductErr) {
          addProductErr.textContent = "請填中文名稱";
          setHidden(addProductErr, false);
        }
        return;
      }
      if (!lines.length) {
        if (addProductErr) {
          addProductErr.textContent = "請至少填一個口味／顏色（每行一個）";
          setHidden(addProductErr, false);
        }
        return;
      }
      var variants = lines.map(function (line) {
        var parts = line.split("|").map(function (x) { return x.trim(); });
        return {
          name_zh: parts[0] || line,
          name_en: parts[1] || parts[0] || line,
          variant_key: parts[2] || ""
        };
      });
      if (addProductSaveBtn) addProductSaveBtn.disabled = true;
      api("add_product", {
        method: "POST",
        body: {
          name_zh: nameZh,
          name_en: nameEn || nameZh,
          cat: cat,
          price: isNaN(price) ? 0 : price,
          cost: isNaN(cost) ? 0 : cost,
          slug: slug,
          variants: variants
        }
      }).then(function (res) {
        if (addProductSaveBtn) addProductSaveBtn.disabled = false;
        if (!res.ok) {
          var map = {
            slug_exists: "商品代碼已存在，請改 slug",
            bad_args: "資料不完整",
            no_variants: "請填口味／顏色"
          };
          var msg = map[res.error] || ("新增失敗：" + (res.error || ""));
          if (addProductErr) {
            addProductErr.textContent = msg;
            setHidden(addProductErr, false);
          } else {
            alert(msg);
          }
          return;
        }
        products.push(res.product);
        productIndex[res.product.slug] = res.product;
        markLogsDirty();
        showStockDetail(res.product.slug);
      }).catch(function (err) {
        if (addProductSaveBtn) addProductSaveBtn.disabled = false;
        if (addProductErr) {
          addProductErr.textContent = "無法連線：" + err.message;
          setHidden(addProductErr, false);
        }
      });
    };
  }

  if (memberRefreshBtn) memberRefreshBtn.onclick = function () { loadMembers(); };
  if (memberSearch) {
    memberSearch.oninput = debounce(loadMembers, 250, { id: null });
  }

  function startPointsAdjust(code, phone, act) {
    askNumber(act === "sub" ? "扣除多少積分？" : "加多少積分？", 100).then(function (n) {
      if (n == null) return;
      if (!n || isNaN(n)) {
        alert("請輸入有效數字");
        return;
      }
      if (act === "sub") n = -Math.abs(n);
      else n = Math.abs(n);
      adjustMemberPoints(code, phone, n);
    });
  }

  var detailPtsAdd = document.getElementById("detailPtsAdd");
  var detailPtsSub = document.getElementById("detailPtsSub");
  if (detailPtsAdd) {
    detailPtsAdd.onclick = function () {
      startPointsAdjust(activeMemberCode, activeMemberPhone, "add");
    };
  }
  if (detailPtsSub) {
    detailPtsSub.onclick = function () {
      startPointsAdjust(activeMemberCode, activeMemberPhone, "sub");
    };
  }

  function runDeduct(code, n, note, errEl, done) {
    showFieldErr(errEl, "");
    if (!code) {
      showFieldErr(errEl, "缺少會員編號");
      return;
    }
    if (!n) {
      showFieldErr(errEl, "請先填要扣的分數，再按扣積分");
      return;
    }
    deductMemberPoints(code, n, note).then(function (res) {
      if (!res.ok) {
        var map = {
          bad_points: "積分數量不正確",
          not_found: "找不到會員",
          bad_args: "請填要扣的分數"
        };
        showFieldErr(errEl, map[res.error] || ("扣分失敗：" + (res.error || "")));
        return;
      }
      if (done) done();
      loadMemberPurchases();
      loadMembers();
    }).catch(function (err) {
      showFieldErr(errEl, "無法連線：" + (err && err.message ? err.message : ""));
    });
  }

  if (membersList) {
    membersList.addEventListener("click", function (e) {
      var histBtn = e.target.closest("[data-member-act='history']");
      if (!histBtn) return;
      var hCard = histBtn.closest(".member-card");
      if (!hCard) return;
      var hName = (hCard.querySelector("b") && hCard.querySelector("b").textContent) || "";
      showMemberDetail(
        hCard.getAttribute("data-member-code") || "",
        hCard.getAttribute("data-member-phone") || "",
        hName
      );
    });
    membersList.addEventListener("submit", function (e) {
      var form = e.target && e.target.closest ? e.target.closest("form.pts-deduct") : null;
      if (!form) return;
      e.preventDefault();
      var card = form.closest(".member-card");
      if (!card) return;
      var msg = form.querySelector("[data-pts-msg]");
      var input = form.querySelector("[data-pts-input]");
      var btn = form.querySelector("button");
      var n = parsePositiveInt(input && input.value);
      if (msg) {
        msg.textContent = "";
        msg.classList.remove("is-ok");
      }
      if (!n) {
        if (msg) msg.textContent = "請先填要扣的分數";
        if (input) input.focus();
        return;
      }
      if (btn) btn.disabled = true;
      deductMemberPoints(card.getAttribute("data-member-code") || "", n, "staff_deduct").then(function (res) {
        if (btn) btn.disabled = false;
        if (!res.ok) {
          if (msg) msg.textContent = "扣分失敗：" + (res.error || "");
          return;
        }
        if (input) input.value = "";
        if (msg) {
          msg.textContent = "已扣除 " + n + " 分";
          msg.classList.add("is-ok");
        }
        loadMembers();
      }).catch(function (err) {
        if (btn) btn.disabled = false;
        if (msg) msg.textContent = "無法連線：" + (err && err.message ? err.message : "");
      });
    });
  }

  function submitDeductForm() {
    runDeduct(
      activeMemberCode,
      parsePositiveInt(deductPoints && deductPoints.value),
      (deductNote && deductNote.value || "").trim(),
      deductErr,
      function () { if (deductForm) deductForm.reset(); }
    );
  }
  if (deductForm) {
    deductForm.onsubmit = function (e) {
      e.preventDefault();
      submitDeductForm();
    };
  }
  if (deductBtn) deductBtn.onclick = submitDeductForm;
  if (purchaseDeductBtn) {
    purchaseDeductBtn.onclick = function () {
      runDeduct(
        activeMemberCode,
        parsePositiveInt(purchasePoints && purchasePoints.value),
        (purchaseNote && purchaseNote.value || "").trim() || "staff_deduct",
        purchaseErr,
        function () {
          if (purchasePoints) purchasePoints.value = "";
          showFieldErr(purchaseErr, "");
        }
      );
    };
  }

  if (purchaseForm) {
    purchaseForm.onsubmit = function (e) {
      e.preventDefault();
      setHidden(purchaseErr, true);
      if (!activeMemberCode) {
        if (purchaseErr) {
          purchaseErr.textContent = "缺少會員編號";
          setHidden(purchaseErr, false);
        }
        return;
      }
      var amount = parseFloat(purchaseAmount && purchaseAmount.value ? purchaseAmount.value : "0");
      if (isNaN(amount) || amount < 0) {
        if (purchaseErr) {
          purchaseErr.textContent = "請輸入有效金額";
          setHidden(purchaseErr, false);
        }
        return;
      }
      var items = (purchaseItems && purchaseItems.value || "").trim();
      var note = (purchaseNote && purchaseNote.value || "").trim();
      var ptsRaw = purchasePoints && purchasePoints.value !== "" ? purchasePoints.value : null;
      if (!items && amount <= 0 && !note && ptsRaw === null) {
        if (purchaseErr) {
          purchaseErr.textContent = "請填金額、購買內容或積分";
          setHidden(purchaseErr, false);
        }
        return;
      }
      var body = {
        member_code: activeMemberCode,
        amount: amount,
        items: items,
        note: note
      };
      if (ptsRaw !== null) body.points = parseInt(ptsRaw, 10) || 0;
      api("add_member_purchase", { method: "POST", body: body }).then(function (res) {
        if (!res.ok) {
          var map = {
            bad_amount: "金額不正確",
            bad_points: "積分數量不正確",
            bad_args: "請填金額或購買內容",
            not_found: "找不到會員"
          };
          if (purchaseErr) {
            purchaseErr.textContent = map[res.error] || ("儲存失敗：" + (res.error || ""));
            setHidden(purchaseErr, false);
          }
          return;
        }
        purchaseForm.reset();
        loadMemberPurchases();
      }).catch(function (err) {
        if (purchaseErr) {
          purchaseErr.textContent = "無法連線：" + (err && err.message ? err.message : "");
          setHidden(purchaseErr, false);
        }
      });
    };
  }

  api("session").then(function (res) {
    if (res.ok && res.logged_in) {
      if (res.actor) setActor(res.actor);
      if (res.role) {
        staffRole = res.role;
        localStorage.setItem("vh_staff_role", staffRole);
      }
      if (res.must_change_pin || res.must_change_password) {
        showChangePin(true);
        return;
      }
      enterApp();
    }
  }).catch(function () { /* stay on login */ });
})();
