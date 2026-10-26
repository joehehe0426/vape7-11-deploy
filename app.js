/* Vape7-11 — age gate, membership, i18n, catalog, cart, WhatsApp */
(function () {
"use strict";

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const BASE = document.body.dataset.base || "";
  const asset = (p) => BASE + p;
  const scrollTo = (el) => { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const LS_AGE = "vs18";
  const LS_CART = "vscart";
  const LS_FLAVOR = "vscartflavor";
  const LS_FLAVOR_KEY = "vscartflavorkey";
  const LS_LANG = "vslang";
  const LS_MEMBER = "vsmember";
  const LS_NEWS = "vsnews";
  const LS_COMBOS = "vscombos";
  const COMBO_GIFT_SLUG = "floral-pen-700";
  let comboBag = {};
  let comboDraft = null;

  let lang = localStorage.getItem(LS_LANG) || "zh";
  if (lang !== "en" && lang !== "zh") lang = "zh";
  document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
let cart = {};
  let member = null;
  /* pending until lookup confirms the cached profile, or the network fails. */
  let memberSync = "pending";
  let newsEmail = localStorage.getItem(LS_NEWS) || "";
  let flavors = {};
  let flavorKeys = {};
  let orderName = "";
  let orderArea = "";
  try { cart = JSON.parse(localStorage.getItem(LS_CART) || "{}"); } catch (e) {}
  try { flavors = JSON.parse(localStorage.getItem(LS_FLAVOR) || "{}"); } catch (e) {}
  try { flavorKeys = JSON.parse(localStorage.getItem(LS_FLAVOR_KEY) || "{}"); } catch (e) {}
  try { comboBag = JSON.parse(localStorage.getItem(LS_COMBOS) || "{}"); } catch (e) {}
  try { member = JSON.parse(localStorage.getItem(LS_MEMBER) || "null"); } catch (e) {}
  try { orderName = localStorage.getItem("vorder_name") || ""; } catch (e) {}
  try { orderArea = localStorage.getItem("vorder_area") || ""; } catch (e) {}

  const memCfg = STORE.membership || { discountPercent: 0, pointsPerHKD: 1, goldAt: 3000 };
  const pointsRate = memCfg.pointsPerHKD || memCfg.pointsPerRM || 1;

  /* ---------- age gate: "Are you 18 or older?" ---------- */
  const gate = $("#agegate");
  const ageStatus = localStorage.getItem(LS_AGE);
  let catalogReady = false;
  function markAgeOk() {
    document.documentElement.classList.add("age-ok");
    const hero = $("#heroBg");
    if (hero) {
      hero.setAttribute("fetchpriority", "high");
      hero.removeAttribute("loading");
    }
  }
  /* Grant Google Analytics 4 analytics_storage consent — only after 18+ is verified. */
  function grantAnalytics() {
    try { if (window.gtag) window.gtag("consent", "update", { analytics_storage: "granted" }); } catch (e) {}
  }
  function startCatalog() {
    if (catalogReady) return;
    catalogReady = true;
    renderCats("all");
    renderProducts("all");
  }
  function confirmAgeYes() {
    localStorage.setItem(LS_AGE, "1");
    if (gate) gate.classList.add("hidden");
    markAgeOk();
    grantAnalytics();
    startCatalog();
  }
  function confirmAgeNo() {
    localStorage.setItem(LS_AGE, "0");
    const ask = $("#ageAsk");
    const blocked = $("#ageBlocked");
    if (ask) ask.classList.add("hidden");
    if (blocked) blocked.classList.remove("hidden");
    if (gate) gate.classList.remove("hidden");
  }
  function resetAge() {
    localStorage.removeItem(LS_AGE);
    location.reload();
  }
  /* Bind even when vs18 is already set. Product pages put #ageReset after an
     inline script that runs too early, so the retry button otherwise does nothing. */
  if (gate) {
    if (ageStatus === "1") {
      gate.classList.add("hidden");
      markAgeOk();
      grantAnalytics();
    } else if (ageStatus === "0") {
      confirmAgeNo();
    } else {
      gate.classList.remove("hidden");
    }
  }
  const ageYesBtn = $("#ageYes");
  const ageNoBtn = $("#ageNo");
  const ageResetBtn = $("#ageReset");
  if (ageYesBtn) ageYesBtn.addEventListener("click", confirmAgeYes);
  if (ageNoBtn) ageNoBtn.addEventListener("click", confirmAgeNo);
  if (ageResetBtn) ageResetBtn.addEventListener("click", resetAge);

  /* ---------- i18n (EN / 繁中) ---------- */
  const copy = {
    brand_en: "Vape7-11", brand_zh: "Vape7-11",
    heroTitle_en: "Vape Hong Kong · Vape7-11 in stock",
    heroTitle_zh: "Vape 香港 · Vape7-11 現貨專門店",
    aboutKicker_en: "About", aboutKicker_zh: "關於",
    aboutTitle_en: "Vape Hong Kong — Vape7-11 store", aboutTitle_zh: "Vape 香港 · Vape7-11 專門店",
    aboutBody_en: "Looking for Vape Hong Kong stock? Vape7-11 takes WhatsApp orders. Stock includes GRID, FLORAL, DAESIN, SUKI, LANA and ZGAR pods and disposables. Orders ship from outside Hong Kong — usually about 2 working days; free over HK$500, HK$80 below. Pay by FPS, PayMe, Alipay or WeChat Pay. 18+ only.",
    aboutBody_zh: "搵 Vape 香港現貨？Vape7-11 係香港電子煙網店，經 WhatsApp 落單。現貨包括 GRID、FLORAL、DAESIN、SUKI、LANA、ZGAR 煙彈同一次性電子煙。貨品由香港以外地區發出，配送一般約 2 個工作日；滿 HK$500 免運，未滿運費 HK$80。付款用 FPS、PayMe、Alipay 或 WeChat Pay。只限 18 歲或以上。",
    faqKicker_en: "FAQ", faqKicker_zh: "常見問題",
    faqTitle_en: "Vape HK — Frequently Asked Questions", faqTitle_zh: "Vape 香港常見問題",
    faqQ1_en: "Where to buy vape?", faqQ1_zh: "Vape 邊度買？",
    faqA1_en: "Vape7-11 stocks GRID, ZGAR, FLORAL, DAESIN, SUKI and LANA pods and disposables. Order on WhatsApp. Goods ship from outside Hong Kong and usually arrive in about 2 working days.",
    faqA1_zh: "Vape7-11提供 GRID、ZGAR、FLORAL、DAESIN、SUKI、LANA 煙彈及一次性電子煙，經 WhatsApp 落單。貨品由香港以外地區發出，配送一般約 2 個工作日。",
    faqQ2_en: "How long does delivery take?", faqQ2_zh: "電子煙送貨要幾耐？",
    faqA2_en: "Orders now ship from outside Hong Kong — usually about 2 working days. Free shipping over HK$500; HK$80 below.",
    faqA2_zh: "貨品由香港以外地區發出，配送一般約 2 個工作日；滿 HK$500 免運費，未滿 HK$500 運費 HK$80。",
    faqA2link_en: "See delivery page",
    faqA2link_zh: "詳見關於送貨",
    faqQ3_en: "How do I place an order?", faqQ3_zh: "點樣落單？",
    faqA3_en: "Add items to the cart, send the order via WhatsApp, then pay by FPS, PayMe, Alipay or WeChat Pay.",
    faqA3_zh: "喺網站加入購物車，經 WhatsApp 送出訂單，再用 FPS、PayMe、Alipay 或 WeChat Pay 付款即可。",
    faqQ4_en: "Which disposables do you carry?", faqQ4_zh: "一次性電子煙有咩選擇？",
    faqA4_en: "FLORAL Pen 700, LANA Pen 2000, DAESIN Crystal 12000, ZGAR Retro 10000 and SUKI Pen 10000 — many flavours in stock.",
    faqA4_zh: "FLORAL Pen 700、LANA Pen 2000、DAESIN Crystal 12000、ZGAR Retro 10000 及 SUKI Pen 10000，多款口味現貨。",
    faqQ5_en: "What flavours are available?", faqQ5_zh: "有咩口味揀？",
    faqA5_en: "GRID Gen-1 pods: 72 flavours in stock (including ZERO 0% nicotine); FLORAL, DAESIN, SUKI, LANA and ZGAR all carry fruit, drink and dessert flavours. Ask on WhatsApp for current stock.",
    faqA5_zh: "GRID 一代彈現貨 72 款口味（含 ZERO 0% 尼古丁）；FLORAL、DAESIN、SUKI、LANA、ZGAR 各系列都有水果、飲料、甜品等口味，部分口味可喺 WhatsApp 查詢現貨。",
    faqQ6_en: "How do I choose the right pods?", faqQ6_zh: "點知邊款煙彈啱我？",
    faqA6_en: "First-timers: GRID or FLORAL Gen-1 pods (largest flavour range). Bigger clouds: DAESIN Gen-5 pods. Grab-and-go: FLORAL Pen, LANA Pen or DAESIN Crystal disposables. WhatsApp us and we'll help you pick.",
    faqA6_zh: "第一次買可以揀 GRID 或 FLORAL 一代彈（彈機款式，口味最多）；鍾意大煙量可以試 DAESIN 五代彈；想即開即用就揀 FLORAL Pen、LANA Pen 或 DAESIN Crystal 一次性系列。WhatsApp 問我哋都會幫你揀。",
    faqQ7_en: "Can you deliver same-day?", faqQ7_zh: "可唔可以當日送？",
    faqA7_en: "Delivery within 1–2 working days; confirm same-day arrangements on WhatsApp before ordering.",
    faqA7_zh: "1-2 個工作天內送達, 落單前可以 WhatsApp 確認當日送貨安排。",
    faqQ8_en: "How is shipping calculated?", faqQ8_zh: "運費點計？",
    faqA8_en: "Free shipping on orders over HK$500; HK$80 below that.",
    faqA8_zh: "滿 HK$500 免運費；未滿 HK$500 運費 HK$80。",
    faqQ9_en: "How do I pay?", faqQ9_zh: "點樣俾錢？",
    faqA9_en: "After ordering on WhatsApp, pay by FPS, PayMe, Alipay or WeChat Pay.",
    faqA9_zh: "WhatsApp 落單後，可以用 FPS 轉數快、PayMe、Alipay 支付寶或 WeChat Pay 微信支付付款。",
    faqQ10_en: "Are there membership benefits?", faqQ10_zh: "有冇會員優惠？",
    faqA10_en: "Members earn 1 point per HK$1 spent; new members get 1,000 bonus points (worth HK$50); 1,000 points redeem for HK$50.",
    faqA10_zh: "會員每消費 HK$1 儲 1 分；新會員送 1,000 分（等值 HK$50）；累積 1,000 分可兌換 HK$50。",
    faqQ11_en: "How do I know if it's in stock?", faqQ11_zh: "點知有冇現貨？",
    faqA11_en: "Product pages show live stock status; we confirm availability and dispatch on WhatsApp after you order.",
    faqA11_zh: "產品頁會顯示庫存狀態；落單後我哋會喺 WhatsApp 再確認現貨同發貨安排。",
    faqQ12_en: "What is the WhatsApp ordering flow?", faqQ12_zh: "WhatsApp 落單流程係點？",
    faqA12_en: "Add to cart, send the order via WhatsApp, confirm you are 18+ and your delivery address, pay by FPS, PayMe, Alipay or WeChat Pay, then get notified when dispatched.",
    faqA12_zh: "加入購物車，經 WhatsApp 送出訂單，確認 18+ 同送貨地址，用 FPS、PayMe、Alipay 或 WeChat Pay 付款，發貨後通知你。",
    tag_en: "E-cigarettes & accessories", tag_zh: "電子煙及配件",
    heroSub_en: "Curated devices and disposables. Order on WhatsApp.",
    heroSub_zh: "精選煙機與一次性電子煙。經 WhatsApp 落單。",
    shopNow_en: "Shop catalog", shopNow_zh: "瀏覽商品",
    waOrder_en: "WhatsApp order", waOrder_zh: "WhatsApp 落單",
    navAll_en: "All", navAll_zh: "全部",
    navDisp_en: "Disposable", navDisp_zh: "一次性",
    navDev_en: "Devices", navDev_zh: "煙機",
    navFaq_en: "FAQ", navFaq_zh: "常見問題",
    navMember_en: "Membership", navMember_zh: "會員",
    navPay_en: "Payment methods", navPay_zh: "付款方式",
    footFaq_en: "Read the FAQ", footFaq_zh: "常見問題解答",
    footPay_en: "See payment options", footPay_zh: "查看付款方式",
    hotTitle_en: "Hot picks", hotTitle_zh: "熱賣精選",
    hotSub_en: "Tap a product to add it to your cart.",
    hotSub_zh: "點擊商品加入購物車。",
    orderTitle_en: "Ready to order?", orderTitle_zh: "準備落單？",
    orderSub_en: "Add items to your cart, then send the list on WhatsApp. Pay by WeChat, Alipay, PayMe or FPS after we confirm.",
    orderSub_zh: "將商品加入購物車，再經 WhatsApp 傳送訂單。確認後可用 WeChat、Alipay、PayMe 或 FPS 付款。",
    strip1t_en: "WhatsApp checkout", strip1t_zh: "WhatsApp 落單",
    strip1d_en: "No credit card — WeChat / Alipay / PayMe / FPS",
    strip1d_zh: "無需信用卡 — WeChat／Alipay／PayMe／FPS",
    strip2t_en: "18+ only", strip2t_zh: "只限 18+",
    strip2d_en: "Age check before entry", strip2d_zh: "進入前需確認年齡",
    strip3t_en: "New members +1,000 pts", strip3t_zh: "新會員送1000分",
    strip3d_en: "Earn 1 point per HK$1", strip3d_zh: "每消費 HK$1 獲 1 分",
    memTitle_en: "Limited-time value offers!", memTitle_zh: "限時超值優惠大賞!",
    memSub_en: "HK$1 = 1 point · 1,000 points = HK$50",
    memSub_zh: "1蚊=1分 · 1000分=50蚊",
    perk1_en: "HK$1 = 1 point",
    perk1_zh: "1蚊=1分",
    perk2_en: "1,000 points = HK$50 — redeem with staff on WhatsApp",
    perk2_zh: "1000分=50蚊 — 經 WhatsApp 向店員兌換",
    memBonus_en: "New members get 1,000 points now",
    memBonus_zh: "新會員即送1000分",
    memBonusNote_en: "Equal to a HK$50 coupon",
    memBonusNote_zh: "相等於 $50 優惠 coupon",
    heroPromoKicker_en: "Limited-time offers",
    heroPromoKicker_zh: "限時優惠",
    heroPromoMore_en: "See all offers ›",
    heroPromoMore_zh: "查看全部優惠 ›",
    comboTitle_en: "Device + pod combos",
    comboTitle_zh: "煙機配彈套餐",
    podPlanTitle_en: "Pod-only bundles",
    podPlanTitle_zh: "全彈套餐",
    podPlanNote_en: "Mix & match · free FLORAL disposable with any plan while stocks last",
    podPlanNote_zh: "可混搭 · 套餐送 floral 一次性一支（送完即止）",
    dispPlanTitle_en: "Disposable bundles",
    dispPlanTitle_zh: "一次性套餐",
    dispPlanNote_en: "Mix & match · LANA Pen −$10 each (max −$50 on 5+1 / −$100 on 10+3)",
    dispPlanNote_zh: "可混搭 · 選購 LANA Pen 每支減 $10（5送1最多減 $50；10送3最多減 $100）",
    floralPlanTitle_en: "FLORAL Pen (separate)",
    floralPlanTitle_zh: "FLORAL Pen 獨立套餐",
    comboColContent_en: "Combo", comboColContent_zh: "組合內容",
    comboColPrice_en: "Price", comboColPrice_zh: "價格",
    comboAddon_en: "Add-on device with a combo: HK$180 each",
    comboAddon_zh: "機彈加購機優惠為 $180 一部",
    comboGift_en: "Any combo includes 1 free FLORAL disposable · while stocks last",
    comboGift_zh: "購買所有套餐即送 floral 一次性一支 · 送完即止",
    comboPickHint_en: "Tap a combo to pick device colours and pod flavours, then add to cart. WhatsApp opens only at checkout.",
    comboPickHint_zh: "點選套餐後先揀煙機顏色同煙彈口味，再加入購物車。確認訂單先經 WhatsApp 送出。",
    comboModalTitle_en: "Choose combo flavours",
    comboModalTitle_zh: "揀套餐口味／顏色",
    comboDevHead_en: "Devices", comboDevHead_zh: "煙機",
    comboPodHead_en: "Pods", comboPodHead_zh: "煙彈",
    comboGiftHead_en: "Free FLORAL disposable", comboGiftHead_zh: "贈品 floral 一次性",
    comboSearch_en: "Search flavour", comboSearch_zh: "搜尋口味",
    comboNeedMore_en: "Please finish selecting colours and flavours first.",
    comboNeedMore_zh: "請先揀齊煙機顏色同煙彈口味。",
    comboAddCart_en: "Add combo to cart", comboAddCart_zh: "加入購物車",
    comboGiftSkip_en: "Gift sold out — combo still applies",
    comboGiftSkip_zh: "贈品已送完，套餐照常",
    featFlex_en: "Flexible choice", featFlex_zh: "彈性選擇",
    featDisp_en: "Disposable vapes", featDisp_zh: "一次性電子煙",
    featMix_en: "Mix & match", featMix_zh: "可混搭",
    joinMember_en: "Join membership", joinMember_zh: "加入會員",
    memberLogin_en: "Member login", memberLogin_zh: "會員登入",
    loginNow_en: "Log in", loginNow_zh: "登入",
    myMember_en: "My member", myMember_zh: "我的會員",
    memModalTitle_en: "Membership", memModalTitle_zh: "會員",
    memFormLead_en: "Create your free member profile. New members get 1,000 points (HK$50 coupon). Must be 18+.",
    memFormLead_zh: "建立免費會員資料。新會員即送 1000 分（相等於 $50 coupon）。必須年滿 18 歲。",
    memLoginLead_en: "Already a member? Sign in with phone + member ID to view points.",
    memLoginLead_zh: "已是會員？輸入電話及會員編號即可登入查看積分。",
    memLoginHint_en: "Member ID is on your VIP card after signup. Lost it? Ask us on WhatsApp.",
    memLoginHint_zh: "會員編號印在會員卡／註冊後顯示。忘記可 WhatsApp 查詢。",
    labelMemberCode_en: "Member ID", labelMemberCode_zh: "會員編號",
    memLoginErr_en: "Phone or member ID incorrect.",
    memLoginErr_zh: "電話或會員編號不正確。",
    labelName_en: "Full name", labelName_zh: "姓名",
    labelPhone_en: "WhatsApp / phone", labelPhone_zh: "WhatsApp／電話",
    labelEmail_en: "Email (optional)", labelEmail_zh: "電郵（選填）",
    memAgeConfirm_en: "I confirm I am 18 years or older",
    memAgeConfirm_zh: "我確認已年滿 18 歲",
    joinNow_en: "Join now", joinNow_zh: "立即加入",
    logout_en: "Sign out", logout_zh: "登出",
    memErr_en: "Please fill name, phone, and confirm you are 18+.",
    memErr_zh: "請填寫姓名、電話，並確認已滿 18 歲。",
    memErrBadPhone_en: "Phone number looks invalid. Use a Hong Kong mobile (e.g. 9 digits) or include country code.",
    memErrBadPhone_zh: "電話格式不正確。請用香港手機號碼（約 8–9 位）或加上國家碼。",
    memErrBadArgs_en: "Missing or invalid details. Check name, phone, and age confirmation.",
    memErrBadArgs_zh: "資料不完整或格式錯誤。請檢查姓名、電話及年齡確認。",
    memErrServer_en: "Server error. Please try again or WhatsApp us.",
    memErrServer_zh: "伺服器暫時未能處理。請稍後再試或 WhatsApp 聯絡我們。",
    memRecoverWa_en: "Forgot member ID? WhatsApp us to recover →",
    memRecoverWa_zh: "忘記會員編號？WhatsApp 查回 →",
    headerJoinSep_en: "|", headerJoinSep_zh: "｜",
    points_en: "Points", points_zh: "積分",
    tier_en: "Tier", tier_zh: "等級",
    tierMember_en: "Member", tierMember_zh: "會員",
    tierGold_en: "Gold", tierGold_zh: "金會員",
    cartMember_en: "Member · earn 1 point per HK$1 on checkout",
    cartMember_zh: "會員 · 結帳每 HK$1 獲 1 分",
    cartGuest_en: "Join membership — new members get 1,000 points",
    cartGuest_zh: "加入會員 — 新會員即送 1000 分",
    navPodsGen1_en: "Gen-1 pods", navPodsGen1_zh: "一代煙彈",
    navPodsGen5_en: "Gen-5 pods", navPodsGen5_zh: "五代煙彈",
    hotCombos_en: "Combo deals", hotCombos_zh: "熱賣套餐",
    shipOverseas_en: "Shipping notice", shipOverseas_zh: "海外送貨聲明",
    shipOverseasBody_en: "All orders now ship from outside Hong Kong. Delivery usually takes about 2 working days.",
    shipOverseasBody_zh: "目前所有貨品的發出地點已搬遷至香港以外地區，配送時間一般是 2 個工作日。",
    add_en: "Add", add_zh: "加入",
    addCart_en: "Add to cart", addCart_zh: "加入購物車",
    soldOut_en: "Sold out", soldOut_zh: "缺貨",
    cart_en: "Cart", cart_zh: "購物車",
    empty_en: "Your cart is empty", empty_zh: "購物車是空的",
    total_en: "Total", total_zh: "合計",
    checkout_en: "Checkout", checkout_zh: "結帳",
    yes_en: "Yes, I am 18 or older", yes_zh: "是，我已年滿 18 歲",
    no_en: "No, I am under 18", no_zh: "否，我未滿 18 歲",
    gateAsk_en: "Are you 18 years or older?",
    gateAsk_zh: "你是否已年滿 18 歲？",
    gateWhy_en: "This store sells nicotine products. You must be 18 or older to enter.",
    gateWhy_zh: "本店售賣尼古丁產品，必須年滿 18 歲方可進入。",
    gateBlocked_en: "Sorry — you must be 18 or older.",
    gateBlocked_zh: "抱歉 — 必須年滿 18 歲。",
    gateBlocked2_en: "Access to this store is restricted to adults only.",
    gateBlocked2_zh: "本店只供成年人進入。",
    foot18_en: "STRICTLY 18+. By ordering you confirm you are 18 or older.",
    foot18_zh: "嚴格 18+。落單即表示你確認已年滿 18 歲。",
    footcr_en: "© 2026 Vape7-11. All rights reserved.",
    footcr_zh: "© 2026 Vape7-11. 版權所有。",

    thProduct_en: "Product", thProduct_zh: "產品",
    thPrice_en: "Price", thPrice_zh: "價格",
    thFlavor_en: "Flavours", thFlavor_zh: "口味",
    thColor_en: "Colours", thColor_zh: "顏色",
    catH1PodGen1_en: "Gen-1 pods in Hong Kong", catH1PodGen1_zh: "一代煙彈現貨",
    catH1PodGen5_en: "Gen-5 pods in Hong Kong", catH1PodGen5_zh: "五代煙彈現貨",
    catH1Disp_en: "Disposable vapes in Hong Kong", catH1Disp_zh: "香港一次性電子煙",
    catH1Device_en: "Vape devices", catH1Device_zh: "電子煙煙機",
    catPriceH2PodGen1_en: "Gen-1 pods price list", catPriceH2PodGen1_zh: "一代煙彈現貨價格表",
    catPriceH2PodGen5_en: "Gen-5 pods price list", catPriceH2PodGen5_zh: "五代煙彈現貨價格表",
    catPriceH2Disp_en: "Disposable vapes price list", catPriceH2Disp_zh: "香港一次性電子煙價格表",
    catPriceH2Device_en: "Devices price list", catPriceH2Device_zh: "電子煙煙機價格表",
    footHome_en: "Home", footHome_zh: "首頁",
    footSitemap_en: "Sitemap", footSitemap_zh: "網站地圖",
    footDisp_en: "Disposable vapes", footDisp_zh: "一次性電子煙",
    footWa_en: "WhatsApp · Order / Pay / Support", footWa_zh: "WhatsApp · 落單／付款／售後",
    footAreaTst_en: "Tsim Sha Tsui", footAreaTst_zh: "尖沙咀",
    footAreaCwb_en: "Causeway Bay", footAreaCwb_zh: "銅鑼灣",
    footAreaMk_en: "Mong Kok", footAreaMk_zh: "旺角",
    footAreaCentral_en: "Central", footAreaCentral_zh: "中環",
    guidePodCompare_en: "HK pod brand comparison 2026", guidePodCompare_zh: "香港煙彈品牌比較 2026",
    guidePrice2026_en: "HK vape price list 2026", guidePrice2026_zh: "香港電子煙價錢表 2026",
    guideGen1vs5_en: "Gen-1 vs Gen-5 pods", guideGen1vs5_zh: "一代煙彈 vs 五代煙彈",
    notify_en: "18+ only. Vape7-11 is a Hong Kong online store — orders via WhatsApp. E-cigarette sale and use are restricted in Hong Kong (Cap. 598E) and Malaysia (Act 852); buyers are responsible for complying with local law.",
    notify_zh: "只限 18+。Vape7-11 為香港網店，經 WhatsApp 落單。香港（Cap. 598E）及馬來西亞（Act 852）對電子煙銷售及使用均有規管，買家須自行遵守當地法例。",
    newsKicker_en: "Newsletter", newsKicker_zh: "電子報",
    newsTitle_en: "Subscribe to our newsletter", newsTitle_zh: "訂閱電子報",
    newsSub_en: "New arrivals, member promos, and restocks — sent to your inbox. 18+ only.",
    newsSub_zh: "新品、會員優惠與補貨資訊直送電郵。只限 18+。",
    newsEmailLabel_en: "Email", newsEmailLabel_zh: "電郵",
    newsAgeConfirm_en: "I am 18 or older and agree to receive emails",
    newsAgeConfirm_zh: "我已年滿 18 歲，並同意接收電郵",
    newsSubmit_en: "Subscribe", newsSubmit_zh: "訂閱",
    newsOk_en: "Thanks — open WhatsApp to confirm your subscription with the store.",
    newsOk_zh: "多謝 — 請開啟 WhatsApp 向本店確認訂閱。",
    newsErr_en: "Enter a valid email and confirm you are 18+.",
    newsErr_zh: "請輸入有效電郵並確認已滿 18 歲。",
    newsFooterLink_en: "Subscribe to newsletter",
    newsFooterLink_zh: "訂閱電子報",
    newsWa_en: "Newsletter subscribe",
    newsWa_zh: "訂閱電子報",
    payTitle_en: "Payment methods", payTitle_zh: "付款方式",
    paySub_en: "No credit card. After WhatsApp confirmation, pay with:",
    paySub_zh: "不設信用卡。WhatsApp 確認訂單後，可用以下方式付款：",
    payNote_en: "We will send QR / FPS details on WhatsApp. Please send a payment screenshot after transfer.",
    payNote_zh: "我們會經 WhatsApp 傳送收款碼／FPS 資料。轉帳後請傳付款截圖。",
    priceAsk_en: "Price on request", priceAsk_zh: "價格請查詢",
    promoTitle_en: "Offers & delivery", promoTitle_zh: "優惠與送貨",
    promoView_en: "View", promoView_zh: "瀏覽",
    promoNav_en: "Promotions", promoNav_zh: "優惠",
    navDelivery_en: "Delivery", navDelivery_zh: "關於送貨",
    navPods_en: "Pods", navPods_zh: "煙彈",
    quickTitle_en: "Product details", quickTitle_zh: "商品詳情"
  };

  const t = (key) => copy[key + "_" + lang] || key;

  function applyI18n() {
    $$("[data-t]").forEach((el) => {
      const val = t(el.dataset.t);
      if (val === el.dataset.t) return;
      if (el.children.length) return;
      el.textContent = val;
    });
    $$("[data-lang]").forEach((el) => {
      el.hidden = el.getAttribute("data-lang") !== lang;
    });
  }

  function waLink(text) {
    const num = (STORE && STORE.whatsapp) || "447477747855";
    if (text === "") return "https://wa.me/" + num;
    const shop = (STORE && STORE.name) || "Vape7-11";
    const msg = text || (lang === "zh"
      ? "你好，我想向 " + shop + " 落單"
      : "Hi, I want to order from " + shop);
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(msg);
  }

  function wireWaButtons() {
    ["#heroWa", "#orderWa", "#fabWa", "#sitemapWa"].forEach((sel) => {
      const el = $(sel);
      if (el) el.href = waLink();
    });
  }

  /* ---------- membership (MySQL via /api/member.php) ---------- */
  const MEMBER_API = (document.body.dataset.base || "./").replace(/\/?$/, "/") + "api/member.php";

  function memberApi(action, opts) {
    opts = opts || {};
    const url = MEMBER_API + "?action=" + encodeURIComponent(action) +
      (opts.query ? "&" + opts.query : "");
    return fetch(url, {
      method: opts.method || "GET",
      headers: opts.body ? { "Content-Type": "application/json" } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then((r) => r.json().then((data) => {
      if (!r.ok && !data) throw new Error("HTTP " + r.status);
      return data;
    }));
  }

  function applyMemberPayload(payload) {
    if (!payload) {
      member = null;
      localStorage.removeItem(LS_MEMBER);
      return;
    }
    const prev = member || {};
    member = {
      id: payload.id || prev.id || "",
      name: payload.name || prev.name || "",
      phone: payload.phone || prev.phone || "",
      email: payload.email !== undefined && payload.email !== ""
        ? payload.email
        : (prev.email || ""),
      points: (function () {
        if (payload.points == null) return prev.points || 0;
        const n = Number(payload.points);
        return Number.isFinite(n) ? n : (prev.points || 0);
      })(),
      joinedAt: payload.joinedAt || prev.joinedAt || new Date().toISOString(),
      ageConfirmed: payload.ageConfirmed != null ? !!payload.ageConfirmed : !!prev.ageConfirmed
    };
    memberSync = "ok";
    saveMember();
  }

  function saveMember() {
    if (member) localStorage.setItem(LS_MEMBER, JSON.stringify(member));
    else localStorage.removeItem(LS_MEMBER);
  }

  function clearMember() {
    member = null;
    saveMember();
  }

  function refreshMemberFromServer() {
    if (!member || !member.phone || !member.id) {
      if (member) clearMember();
      memberSync = "ok";
      updateMemberUI();
      renderCart();
      return Promise.resolve();
    }
    return memberApi("lookup", {
      query: "phone=" + encodeURIComponent(member.phone)
        + "&member_code=" + encodeURIComponent(member.id)
    })
      .then((res) => {
        if (res && res.ok && res.member) {
          applyMemberPayload(res.member);
          memberSync = "ok";
        } else {
          /* Explicit miss. Network failures reject and keep the offline cache. */
          const rejected = res && (res.ok === true && !res.member
            || res.error === "bad_credentials"
            || res.error === "not_found"
            || res.error === "bad_phone"
            || res.error === "member_code_required");
          if (rejected) {
            clearMember();
            memberSync = "ok";
          } else {
            memberSync = "offline";
          }
        }
        updateMemberUI();
        renderCart();
      })
      .catch(() => { memberSync = "offline"; });
  }

  function memberTier() {
    if (!member) return "";
    return (member.points || 0) >= memCfg.goldAt ? t("tierGold") : t("tierMember");
  }

  function isMember() {
    return memberSync !== "pending" && !!(member && member.id && member.name && member.phone);
  }

  function unitPrice(p) {
    if (!p || p.price == null) return 0;
    const disc = Number(memCfg.discountPercent) || 0;
    if (!isMember() || disc <= 0) return p.price;
    return Math.round(p.price * (100 - disc)) / 100;
  }

  function setMemberAuthTab(tab) {
    const loginTab = $("#memTabLogin");
    const joinTab = $("#memTabJoin");
    const loginView = $("#memberLoginView");
    const joinView = $("#memberJoinView");
    const isLogin = tab !== "join";
    if (loginTab) {
      loginTab.classList.toggle("is-active", isLogin);
      loginTab.setAttribute("aria-selected", isLogin ? "true" : "false");
    }
    if (joinTab) {
      joinTab.classList.toggle("is-active", !isLogin);
      joinTab.setAttribute("aria-selected", !isLogin ? "true" : "false");
    }
    if (loginView) {
      loginView.classList.toggle("hidden", !isLogin);
      loginView.hidden = !isLogin;
    }
    if (joinView) {
      joinView.classList.toggle("hidden", isLogin);
      joinView.hidden = isLogin;
    }
    const title = $("#memModalTitle");
    if (title) title.textContent = isLogin ? t("memberLogin") : t("joinMember");
  }

  function openMemberModal(mode) {
    const modal = $("#memberModal");
    modal.classList.remove("hidden");
    if (isMember()) {
      $("#memberAuthView") && $("#memberAuthView").classList.add("hidden");
      $("#memberProfileView").classList.remove("hidden");
      const title = $("#memModalTitle");
      if (title) title.textContent = t("myMember");
      renderMemberCard();
    } else {
      $("#memberAuthView") && $("#memberAuthView").classList.remove("hidden");
      $("#memberProfileView").classList.add("hidden");
      setMemberAuthTab(mode === "join" ? "join" : "login");
    }
  }

  function closeMemberModal() {
    $("#memberModal").classList.add("hidden");
  }

  function renderMemberCard() {
    if (!isMember()) return;
    const gold = memberTier() === t("tierGold") || (member.points || 0) >= (memCfg.goldAt || 3000);
    const tierLabel = memberTier();
    $("#memberCard").innerHTML = `
      <div class="member-card__shine" aria-hidden="true"></div>
      <div class="member-card__top">
        <span class="vip-tag${gold ? " vip-tag--gold" : ""}">${gold ? "VIP GOLD" : "VIP"}</span>
        <span class="member-card__brand">Vape7-11</span>
      </div>
      <div class="member-card__name">${escapeHtml(member.name)}</div>
      <div class="member-card__meta">${escapeHtml(member.phone)}${member.email ? " · " + escapeHtml(member.email) : ""}</div>
      <div class="member-card__row">
        <span class="member-card__tier">${escapeHtml(tierLabel)}</span>
        <span class="member-card__id">ID ${escapeHtml(member.id)}</span>
      </div>
      <div class="member-card__points">${t("points")} <b>${Math.trunc(Number(member.points) || 0)}</b></div>`;
    $("#memberCard").classList.toggle("is-gold", !!gold);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function setMemberLabel(el, text) {
    if (!el) return;
    const label = el.querySelector("[data-member-label]");
    if (label) label.textContent = text;
    else el.textContent = text;
  }

  function updateMemberUI() {
    const joinBtn = $("#memJoinBtn");
    const loginBtn = $("#memLoginBtn");
    const summary = $("#memberSummary");
    const split = $("#memberAuthSplit");
    const headerJoin = $("#memberJoinHeaderBtn");
    const memberBtns = $$("#memberBtn, [data-open-member]");
    const bonusJoin = $("#memBonusJoinBtn");
    if (isMember()) {
      memberBtns.forEach((btn) => {
        setMemberLabel(btn, t("myMember"));
        btn.classList.add("is-member");
      });
      setMemberLabel(joinBtn, t("myMember"));
      if (loginBtn) {
        setMemberLabel(loginBtn, t("myMember"));
        loginBtn.classList.add("is-member");
      }
      if (split) split.classList.add("is-member");
      if (headerJoin) headerJoin.hidden = true;
      if (bonusJoin) bonusJoin.hidden = true;
      if (summary) {
        summary.classList.remove("hidden");
        summary.innerHTML = `
          <strong>${escapeHtml(member.name)}</strong>
          <span>${t("tier")}: ${memberTier()} · ${t("points")}: ${Math.trunc(Number(member.points) || 0)}</span>
          <span>${lang === "zh" ? "1蚊=1分 · 新會員送1000分" : "HK$1 = 1 pt · new members +1000"}</span>`;
      }
    } else {
      memberBtns.forEach((btn) => {
        setMemberLabel(btn, t("loginNow"));
        btn.classList.remove("is-member");
      });
      setMemberLabel(joinBtn, t("joinMember"));
      if (loginBtn) {
        setMemberLabel(loginBtn, t("memberLogin"));
        loginBtn.classList.remove("is-member");
      }
      if (split) split.classList.remove("is-member");
      if (headerJoin) {
        headerJoin.hidden = false;
        setMemberLabel(headerJoin, t("joinNow"));
      }
      if (bonusJoin) {
        bonusJoin.hidden = false;
        setMemberLabel(bonusJoin, t("joinNow"));
      }
      if (summary) {
        summary.classList.add("hidden");
        summary.innerHTML = "";
      }
    }
  }

  function loginMember(e) {
    e.preventDefault();
    const phone = ($("#memLoginPhone") && $("#memLoginPhone").value || "").trim();
    const code = ($("#memLoginCode") && $("#memLoginCode").value || "").trim();
    const err = $("#memLoginError");
    if (!phone || !code) {
      if (err) {
        err.textContent = t("memLoginErr");
        err.classList.remove("hidden");
      }
      return;
    }
    if (err) err.classList.add("hidden");
    const submitBtn = e.target && e.target.querySelector
      ? e.target.querySelector('[type="submit"]')
      : null;
    if (submitBtn) submitBtn.disabled = true;
    memberApi("login", {
      method: "POST",
      body: { phone, member_code: code }
    }).then((res) => {
      if (!res.ok || !res.member) {
        if (err) {
          if (res.error === "bad_credentials" || res.error === "not_found" || !res.error) {
            const recoverHref = memRecoverWaHref(phone);
            err.innerHTML = escapeHtml(t("memLoginErr")) + " "
              + '<a class="mem-recover-wa" href="' + recoverHref + '" target="_blank" rel="noopener">'
              + escapeHtml(t("memRecoverWa")) + "</a>";
          } else {
            err.textContent = memApiErrorMessage(res.error);
          }
          err.classList.remove("hidden");
        }
        return;
      }
      applyMemberPayload(res.member);
      updateMemberUI();
      renderCart();
      openMemberModal();
    }).catch(() => {
      if (err) {
        err.textContent = lang === "zh"
          ? "無法連線伺服器，請稍後再試。"
          : "Could not reach server. Try again.";
        err.classList.remove("hidden");
      }
    }).finally(() => {
      if (submitBtn) submitBtn.disabled = false;
    });
  }


  function memApiErrorMessage(code) {
    if (code === "bad_phone") return t("memErrBadPhone");
    if (code === "bad_args") return t("memErrBadArgs");
    if (code === "server_error") return t("memErrServer");
    if (code === "rate_limited") {
      return lang === "zh" ? "嘗試次數過多，請稍後再試。" : "Too many attempts. Try later.";
    }
    if (code === "bad_credentials" || code === "not_found") return t("memLoginErr");
    return t("memErr");
  }

  function memRecoverWaHref(phone) {
    const p = (phone || "").trim();
    const msg = lang === "zh"
      ? ("你好，我電話 " + p + " 已係 Vape7-11 會員，想找回會員編號。")
      : ("Hi, my phone " + p + " is already a Vape7-11 member. Please help me recover my member ID.");
    return waLink(msg);
  }
  function joinMember(e) {
    e.preventDefault();
    const name = $("#memName").value.trim();
    const phone = $("#memPhone").value.trim();
    const email = $("#memEmail").value.trim();
    const ageOk = $("#memAge").checked;
    const err = $("#memError");
    if (!name || !phone || !ageOk) {
      err.textContent = t("memErr");
      err.classList.remove("hidden");
      return;
    }
    err.classList.add("hidden");
    const submitBtn = e.target && e.target.querySelector
      ? e.target.querySelector('[type="submit"]')
      : null;
    if (submitBtn) submitBtn.disabled = true;
    memberApi("register", {
      method: "POST",
      body: { name, phone, email, age_confirmed: true }
    }).then((res) => {
      if (!res.ok || !res.member) {
        if (res.error === "already_registered") {
          setMemberAuthTab("login");
          if ($("#memLoginPhone") && phone) $("#memLoginPhone").value = phone;
          const recoverHref = memRecoverWaHref(phone);
          const lead = lang === "zh"
            ? "此電話已註冊。請用「會員登入」（電話＋會員編號）。"
            : "This phone is already registered. Use Member login (phone + member ID).";
          const linkLabel = t("memRecoverWa");
          const html = escapeHtml(lead) + " "
            + '<a class="mem-recover-wa" href="' + recoverHref + '" target="_blank" rel="noopener">'
            + escapeHtml(linkLabel) + "</a>";
          // Show on login panel (join panel is hidden after tab switch)
          const loginErr = $("#memLoginError");
          if (loginErr) {
            loginErr.innerHTML = html;
            loginErr.classList.remove("hidden");
          }
          err.innerHTML = html;
          err.classList.remove("hidden");
          return;
        }
        err.textContent = memApiErrorMessage(res.error);
        err.classList.remove("hidden");
        return;
      }
      applyMemberPayload(res.member);
      updateMemberUI();
      renderCart();
      openMemberModal();
    }).catch(() => {
      err.textContent = lang === "zh"
        ? "無法連線伺服器，請稍後再試。"
        : "Could not reach server. Try again.";
      err.classList.remove("hidden");
    }).finally(() => {
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  function logoutMember() {
    member = null;
    memberSync = "ok";
    localStorage.removeItem(LS_MEMBER);
    updateMemberUI();
    renderCart();
    closeMemberModal();
  }

  /* ---------- newsletter ---------- */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function syncNewsForm() {
    const emailInput = $("#newsEmail");
    const ok = $("#newsOk");
    if (!emailInput) return;
    if (newsEmail) {
      emailInput.value = newsEmail;
      ok.classList.remove("hidden");
    }
  }

  function submitNewsletter(e) {
    e.preventDefault();
    const email = ($("#newsEmail").value || "").trim().toLowerCase();
    const ageOk = $("#newsAge").checked;
    const err = $("#newsError");
    const ok = $("#newsOk");
    if (!isValidEmail(email) || !ageOk) {
      err.textContent = t("newsErr");
      err.classList.remove("hidden");
      ok.classList.add("hidden");
      return;
    }
    err.classList.add("hidden");
    newsEmail = email;
    localStorage.setItem(LS_NEWS, email);
    ok.classList.remove("hidden");

    memberApi("newsletter", {
      method: "POST",
      body: {
        email,
        age_confirmed: true,
        phone: isMember() ? member.phone : ""
      }
    }).catch(() => { /* still open WA even if API fails */ });

    let msg = `*${t("newsWa")} — ${STORE.name}*\n`;
    msg += `Email: ${email}\n`;
    msg += `18+ confirmed.\n`;
    if (isMember()) {
      msg += `Member: ${member.name} (${member.id})\nPhone: ${member.phone}\n`;
    }
    window.open(waLink(msg), "_blank");
  }

  /* ---------- hero carousel ---------- */
  function initHero() {
    const slides = $$("#heroSlides .hero__slide");
    const dots = $("#heroDots");
    if (slides.length < 2) return;
    slides.forEach((s, idx) => s.setAttribute("aria-hidden", idx === 0 ? "false" : "true"));
    if (dots) {
      dots.innerHTML = slides.map((_, i) =>
        `<button type="button" aria-label="Slide ${i + 1}" class="${i === 0 ? "is-active" : ""}"></button>`
      ).join("");
    }
    let i = 0;
    let timer = null;
    const go = (n) => {
      slides[i].classList.remove("is-active");
      slides[i].setAttribute("aria-hidden", "true");
      if (dots) {
        const btns = $$("button", dots);
        if (btns[i]) btns[i].classList.remove("is-active");
      }
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active");
      slides[i].setAttribute("aria-hidden", "false");
      if (dots) {
        const btns = $$("button", dots);
        if (btns[i]) btns[i].classList.add("is-active");
      }
    };
    const play = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => go(i + 1), 4000);
    };
    if (dots) {
      $$("button", dots).forEach((b, idx) => {
        b.onclick = () => { go(idx); play(); };
      });
    }
    play();
  }

  /* ---------- catalog ---------- */
  const grid = $("#grid");
  const catsEl = $("#cats");

  function renderCats(active) {
    if (!catsEl) return;
    catsEl.innerHTML = CATEGORIES.map((c) =>
      `<button type="button" class="cat ${c.id === active ? "active" : ""}" data-cat="${c.id}">${c[lang]}</button>`
    ).join("");
    $$(".cat", catsEl).forEach((b) => {
      b.onclick = () => {
        if (b.dataset.cat === "promo") {
          goPromo("promo");
          return;
        }
        setNavActive(b.dataset.cat);
        renderCats(b.dataset.cat);
        renderProducts(b.dataset.cat);
      };
    });
  }

  function setNavActive(cat) {
    $$(".site-nav__link[data-jump]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.jump === cat);
    });
  }

  function priceBlock(p) {
    if (p.price == null) return `<span class="price">${t("priceAsk")}</span>`;
    const price = unitPrice(p);
    if (isMember() && price < p.price) {
      return `<span class="price">${STORE.currency} ${price}<small class="price-was">${STORE.currency} ${p.price}</small></span>`;
    }
    return `<span class="price">${STORE.currency} ${p.price}</span>`;
  }

  function productImg(p, name, eager) {
    const jpg = escapeHtml(asset(p.img));
    const webpPath = String(p.img || "").replace(/\.(jpe?g|png)$/i, ".webp");
    const webp = escapeHtml(asset(webpPath));
    const base = String(p.img || "").replace(/^.*\//, "").replace(/\.(jpe?g|png|webp)$/i, "");
    const card = escapeHtml(asset(`img/card/${base}.webp`));
    const lazy = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
    // Card thumbs (~360) for catalog density; full webp only on larger viewports / 2x.
    if (/\.(jpe?g|png)$/i.test(p.img || "")) {
      return `<picture><source type="image/webp" srcset="${card} 360w, ${webp} 720w" sizes="(max-width: 768px) 45vw, 280px"><img src="${jpg}" alt="${name}" width="600" height="600" ${lazy}></picture>`;
    }
    return `<img src="${jpg}" alt="${name}" width="600" height="600" ${lazy}>`;
  }

  function productCard(p, idx) {
    const n = p[lang];
    const layout = document.body.dataset.layout || "grid";
    const delay = `style="animation-delay:${Math.min(idx, 8) * 40}ms"`;
    const name = escapeHtml(n.name);
    const desc = escapeHtml(n.desc || "");
    const slug = escapeHtml(p.slug);
    const media = productImg(p, name, idx < 2);
    const canCart = p.price != null;
    const addCtl = canCart
      ? `<button type="button" class="add" data-slug="${slug}">${t("add")}</button>`
      : "";
    const orderMsg = canCart
      ? `Hi, I want to order: ${n.name} (${STORE.currency} ${p.price})`
      : `Hi, I want to ask about: ${n.name}`;
    const waBtn = `<a class="wa-card-btn" href="${waLink(orderMsg)}" target="_blank" rel="noopener" aria-label="${canCart ? "Order" : "Ask about"} ${name} on WhatsApp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.7L2 22l4.4-1.1A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.6.7.7-2.5-.2-.3A9 9 0 1 1 12 20.5zm5.2-6.7c-.3-.1-1.7-.8-1.9-.9s-.5-.1-.6.1-.7.9-.9 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.5-.6c.1-.2.1-.3 0-.5l-.9-2.1c-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3s-1 1-1 2.4 1 2.8 1.2 3 .9 1.8 3.7 3.1c2 .9 2.6.9 3 .8.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2s-.2-.2-.5-.3z"/></svg>
          </a>`;

    if (layout === "rows") {
      return `<article class="row-item" ${delay}>
        <div class="row-item__media">${media}</div>
        <div class="row-item__body">
          <div class="row-item__top"><h3>${name}</h3></div>
          <p class="row-item__desc">${desc}</p>
          <div class="row-item__row">${priceBlock(p)}${waBtn}${addCtl}</div>
        </div>
      </article>`;
    }

    if (layout === "magazine") {
      const featured = idx === 0 ? " is-featured" : "";
      return `<article class="mag-card${featured}" ${delay}>
        <div class="mag-card__media">${media}</div>
        <div class="mag-card__body">
          <h3>${name}</h3>
          <p>${desc}</p>
          <div class="mag-card__row">${priceBlock(p)}${waBtn}${addCtl}</div>
        </div>
      </article>`;
    }

    return `<article class="card" id="${slug}" data-slug="${slug}" ${delay}>
      <div class="ph">${media}</div>
    <div class="body">
        <h3><a class="card__name" href="${escapeHtml(asset("products/" + p.slug + ".html"))}">${name}</a></h3>
        <span class="puffs">${desc}</span>
        <div class="row">${priceBlock(p)}
          ${waBtn}
          ${addCtl}
        </div>
      </div>
    </article>`;
  }

  function productBrand(p) {
    if (p && p.brand) return p.brand;
    const s = String((p && p.slug) || "").toLowerCase();
    if (s.indexOf("grid") === 0) return "GRID";
    if (s.indexOf("floral") === 0) return "FLORAL";
    if (s.indexOf("suki") === 0) return "SUKI";
    if (s.indexOf("lana") === 0) return "LANA";
    if (s.indexOf("dasein") === 0 || s.indexOf("r5-") === 0) return "DAESIN";
    if (s.indexOf("zgar") === 0) return "ZGAR";
    if (s.indexOf("saico") === 0) return "SAICO";
    if (s.indexOf("mega") === 0) return "MEGA VAPEZ";
    return "OTHER";
  }

  function sortByBrand(list) {
    const order = (typeof BRAND_ORDER !== "undefined" && BRAND_ORDER) || [
      "GRID", "FLORAL", "SUKI", "LANA", "DAESIN", "ZGAR", "SAICO", "MEGA VAPEZ"
    ];
    const catRank = { "pod-gen1": 0, "pod-gen5": 1, pod: 1, disposable: 2, device: 3 };
    return list.slice().sort((a, b) => {
      const ia = order.indexOf(productBrand(a));
      const ib = order.indexOf(productBrand(b));
      const da = ia < 0 ? 999 : ia;
      const db = ib < 0 ? 999 : ib;
      if (da !== db) return da - db;
      return (catRank[a.cat] ?? 9) - (catRank[b.cat] ?? 9);
    });
  }

  function renderCatalogHtml(list) {
    let html = "";
    let lastBrand = null;
    list.forEach((p, idx) => {
      const brand = productBrand(p);
      if (brand !== lastBrand) {
        html += `<div class="brand-head" role="heading" aria-level="3"><span>${escapeHtml(brand)}</span></div>`;
        lastBrand = brand;
      }
      html += productCard(p, idx);
    });
    return html;
  }

  var catalogShown = 12;
  var catalogList = [];

  function catalogRoots() {
    const roots = [];
    $$(".cards").forEach((el) => roots.push(el));
    if (grid && roots.indexOf(grid) < 0) roots.push(grid);
    return roots;
  }

  function wireCatalogAdds() {
    catalogRoots().forEach((root) => {
      $$(".add", root).forEach((b) => {
        if (b.dataset.wired === "1") return;
        b.dataset.wired = "1";
        b.onclick = () => {
          const p = PRODUCTS.find((x) => x.slug === b.dataset.slug);
          if (p && p.cat === "device") {
            document.dispatchEvent(new CustomEvent("vape:open", { detail: { slug: b.dataset.slug } }));
            return;
          }
          addToCart(b.dataset.slug);
        };
      });
    });
  }

  function renderProducts(cat) {
    if (!grid) return;
    let list;
    if (cat === "all" || cat === "promo") list = PRODUCTS.slice();
    else if (cat === "pod") list = PRODUCTS.filter((p) => p.cat === "pod-gen1" || p.cat === "pod-gen5" || p.cat === "pod");
    else list = PRODUCTS.filter((p) => p.cat === cat);
    catalogList = sortByBrand(list);
    catalogShown = catalogList.length; // small catalog — show full brand groups
    const visible = catalogList.slice(0, catalogShown);
    grid.innerHTML = renderCatalogHtml(visible);
    wireCatalogAdds();
    applyCatalogStock();
    const moreBtn = document.getElementById("catalogMoreBtn");
    if (moreBtn) {
      moreBtn.classList.add("hidden");
    }
  }

  function renderHotCombos() {
    const wrap = document.getElementById("hotCombos");
    if (!wrap) return;
    const combos = (STORE.membership && STORE.membership.combos) || [];
    if (!combos.length) {
      wrap.classList.add("hidden");
      return;
    }
    wrap.classList.remove("hidden");
    const title = document.getElementById("hotCombosTitle");
    if (title) title.textContent = t("hotCombos");
    wrap.querySelector(".hot-combos__grid").innerHTML = combos.map((c, i) => {
      const label = lang === "zh" ? (c.devices + "機" + c.pods + "盒") : (c.devices + " device(s) + " + c.pods + " pods");
      const img = asset(c.img || "img/product-grid-gen1-pod.jpg");
      return `<button type="button" class="hot-combo" data-combo-i="${i}">
        <img src="${escapeHtml(img)}" alt="" width="160" height="160" loading="lazy">
        <b>${escapeHtml(label)}</b>
        <span>$${c.price}</span>
      </button>`;
    }).join("");
    $$(".hot-combo", wrap).forEach((b) => {
      b.onclick = () => {
        const c = combos[Number(b.dataset.comboI)];
        if (c && typeof openComboBuilder === "function") openComboBuilder(c);
        else {
          const m = document.getElementById("membership");
          if (m) m.scrollIntoView({ behavior: "smooth" });
        }
      };
    });
  }

  function renderPdpFlavorList(slug) {
    const wrap = $("#pdpFlavors");
    if (!wrap || !slug || typeof getProductVariants !== "function") return;
    const list = getProductVariants(slug) || [];
    if (!list.length) return;
    const selected = flavorKeys[slug];
    const labelOf = (v) => (lang === "zh" ? v.zh : v.en);
    if (wrap.children.length) {
      $$("[data-f]", wrap).forEach((b) => {
        const v = list.find((x) => x.key === b.dataset.f);
        if (v) {
          const label = labelOf(v);
          b.dataset.name = label;
          b.title = v.en && v.en !== v.zh ? v.zh + " (" + v.en + ")" : label;
          const lab = b.querySelector(".pdp-chip__label");
          if (lab) lab.textContent = label;
        }
        b.classList.toggle("is-on", b.dataset.f === selected);
        markChipOos(b, slug, b.dataset.f);
      });
      syncPdpAddState(slug);
      return;
    }
    wrap.innerHTML = list.map((v) => {
      const on = v.key === selected ? " is-on" : "";
      const label = labelOf(v);
      return `<li><button type="button" class="pdp-chip${on}" data-f="${escapeHtml(v.key)}" data-name="${escapeHtml(label)}" title="${escapeHtml(v.en && v.en !== v.zh ? v.zh + " (" + v.en + ")" : label)}"><span class="pdp-chip__label">${escapeHtml(label)}</span></button></li>`;
    }).join("");
    $$("[data-f]", wrap).forEach((b) => markChipOos(b, slug, b.dataset.f));
    syncPdpAddState(slug);
  }

  function pdpExtraCopy(p) {
    if (!p) return "";
    if (p.cat === "pod") {
      return lang === "zh"
        ? p.zh.name + " — " + p.zh.desc + " 香港現貨煙彈，適合已有對應主機嘅用家，WhatsApp 落單，滿 HK$500 免運。只限 18 歲或以上。"
        : p.en.name + " — " + p.en.desc + " In stock in Hong Kong for matching devices. Order on WhatsApp, free shipping over HK$500. 18+ only.";
    }
    if (p.cat === "disposable") {
      return lang === "zh"
        ? p.zh.name + " — " + p.zh.desc + " 即開即用嘅一次性電子煙，唔使另配主機。香港現貨，經 WhatsApp 落單，可用 FPS、PayMe、Alipay 或 WeChat Pay。"
        : p.en.name + " — " + p.en.desc + " A ready-to-use disposable — no separate device needed. In stock in Hong Kong. Order on WhatsApp, pay by FPS, PayMe, Alipay or WeChat Pay.";
    }
    return lang === "zh"
      ? p.zh.name + " — " + p.zh.desc + " 香港現貨，可經 WhatsApp 落單，亦可搭配煙彈套餐。"
      : p.en.name + " — " + p.en.desc + " In stock in Hong Kong. Order on WhatsApp or pair with a pod combo.";
  }

  function applyCatI18n() {
    $$(".cards .card[id]").forEach((card) => {
      const p = PRODUCTS.find((x) => x.slug === card.id);
      if (!p) return;
      const n = p[lang] || p.zh || {};
      const name = card.querySelector(".card__name");
      if (name && n.name) name.textContent = n.name;
      const puffs = card.querySelector(".puffs");
      if (puffs && n.desc) puffs.textContent = n.desc;
      const img = card.querySelector("img");
      if (img && n.name) img.alt = n.name;
    });
    $$(".section-head > p[lang='en']").forEach((el) => { el.hidden = lang !== "en"; });
    const zhLead = $(".section-head > h1 + p:not([lang])");
    if (zhLead) zhLead.hidden = lang === "en";
    const catWa = $("#catWa");
    if (catWa) catWa.textContent = lang === "zh" ? "WhatsApp 落單" : "Order on WhatsApp";
  }

  function applyPdpI18n() {
    const wrap = $("#pdpFlavors");
    const add = $("#pdpAdd") || $("#pdpAddAfter") || $("#pdpStickyAdd");
    const slug = (add && add.dataset.slug) || (wrap && wrap.dataset.slug);
    if (!slug) return;
    const product = PRODUCTS.find((x) => x.slug === slug);
    if (!product) return;
    const n = product[lang] || product.zh || {};
    const info = $(".pdp__info");
    if (info) {
      const h1 = $("h1", info);
      if (h1) h1.textContent = n.name || h1.textContent;
      const alt = $(".pdp__en", info);
      if (alt) {
        alt.textContent = (product.en && product.en.name) || alt.textContent;
        alt.hidden = lang === "en";
      }
      $$("p[lang='en']", info).forEach((el) => {
        if (el.classList.contains("pdp__en")) return;
        if (product.en && product.en.desc) el.textContent = product.en.desc;
        el.hidden = lang !== "en";
      });
      const plain = $$("p", info).filter((el) =>
        !el.classList.contains("section-kicker") &&
        !el.classList.contains("pdp__en") &&
        !el.classList.contains("pdp__price") &&
        el.getAttribute("lang") !== "en"
      );
      if (plain[0] && product.zh) {
        plain[0].textContent = lang === "zh" ? product.zh.desc : (product.en && product.en.desc) || product.zh.desc;
        plain[0].hidden = false;
      }
      if (plain[1]) {
        plain[1].textContent = pdpExtraCopy(product);
        plain[1].hidden = false;
      }
      // when EN, hide the duplicate en paragraph (already shown via plain[0])
      $$("p[lang='en']", info).forEach((el) => {
        if (!el.classList.contains("pdp__en")) el.hidden = true;
      });
      if (lang === "en" && plain[0] && product.en) plain[0].textContent = product.en.desc;
    }

    const list = (typeof getProductVariants === "function") ? (getProductVariants(slug) || []) : [];
    const isColor = !!(list[0] && list[0].type === "color");
    const varTitle = $("#pdpVariants h2") || $(".pdp__variants h2");
    if (varTitle) {
      varTitle.textContent = lang === "zh"
        ? (isColor ? "可選顏色" : "可選口味")
        : (isColor ? "Colours" : "Flavours");
    }
    const varSec = $("#pdpVariants") || $(".pdp__variants");
    if (varSec) varSec.setAttribute("aria-label", lang === "zh" ? (isColor ? "顏色" : "口味") : (isColor ? "Colour" : "Flavour"));

    const addLabel = lang === "zh" ? "加入購物車" : "Add to cart";
    const askLabel = lang === "zh" ? "WhatsApp 查詢" : "Ask on WhatsApp";
    const orderLabel = lang === "zh" ? "WhatsApp 落單" : "Order on WhatsApp";
    ["#pdpAdd", "#pdpAddAfter", "#pdpStickyAdd"].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      if (el.tagName === "A") {
        el.textContent = isUnpriced(product) ? askLabel : orderLabel;
      } else {
        el.setAttribute("data-label", addLabel);
        el.textContent = addLabel;
      }
    });
    const wa = $("#pdpAskWa");
    if (wa) wa.textContent = isUnpriced(product) ? askLabel : orderLabel;
    $$(".pdp__cta .textlink").forEach((el) => {
      if (/目錄|catalog/i.test(el.textContent) || el.getAttribute("href") === "../#catalog") {
        el.textContent = lang === "zh" ? "返回目錄" : "Back to catalog";
      }
    });

    const faqH = $(".pdp__faq h2");
    if (faqH) faqH.textContent = lang === "zh" ? (n.name + "常見問題") : (n.name + " FAQ");
    const relH = $(".pdp__related h2");
    if (relH) relH.textContent = lang === "zh" ? "相關產品" : "Related products";

    if (wrap) renderPdpFlavorList(slug);
    syncPdpStickyFlavor(slug);
  }

  function pdpFlavorLabel(slug) {
    const list = (typeof getProductVariants === "function") ? (getProductVariants(slug) || []) : [];
    const key = flavorKeys[slug];
    const hit = key ? list.find((v) => v.key === key) : null;
    if (hit) return lang === "zh" ? hit.zh : hit.en;
    return flavors[slug] || "";
  }

  function syncPdpStickyFlavor(slug) {
    const el = $("#pdpStickyFlavor");
    if (!el) return;
    const list = (typeof getProductVariants === "function") ? (getProductVariants(slug) || []) : [];
    const isColor = !!(list[0] && list[0].type === "color");
    const picked = pdpFlavorLabel(slug);
    if (picked) {
      el.textContent = picked;
      el.classList.add("is-picked");
    } else {
      el.textContent = lang === "zh"
        ? (isColor ? "請選擇顏色" : "請選擇口味")
        : (isColor ? "Choose a colour" : "Choose a flavour");
      el.classList.remove("is-picked");
    }
  }

  function syncPdpStickyBar() {
    const sticky = $("#pdpSticky");
    const variants = $("#pdpVariants") || $(".pdp__variants");
    if (!sticky || !variants) return;
    const v = variants.getBoundingClientRect();
    const flavorsInView = v.top < window.innerHeight - 48 && v.bottom > 72;
    const heroCta = $(".pdp__info .pdp__cta");
    let heroVisible = false;
    if (heroCta) {
      const h = heroCta.getBoundingClientRect();
      heroVisible = h.bottom > 64 && h.top < window.innerHeight;
    }
    const after = $("#pdpAddAfter") || $("#pdpAskWaAfter");
    let afterVisible = false;
    if (after) {
      const a = after.getBoundingClientRect();
      afterVisible = a.top < window.innerHeight - 12 && a.bottom > 0;
    }
    const show = flavorsInView && !heroVisible && !afterVisible;
    sticky.hidden = !show;
    document.body.classList.toggle("has-pdp-sticky", show);
  }

  function flashPdpAddButtons() {
    ["#pdpAdd", "#pdpAddAfter", "#pdpStickyAdd"].forEach((sel) => {
      const el = $(sel);
      if (!el || el.tagName === "A") return;
      const orig = el.getAttribute("data-label") || el.textContent;
      el.setAttribute("data-label", orig);
      el.textContent = "✓";
      setTimeout(() => { el.textContent = orig; }, 900);
    });
  }

  function wirePdp() {
    const add = $("#pdpAdd");
    const wrap = $("#pdpFlavors");
    const slug = (add && add.dataset.slug)
      || ($("#pdpAddAfter") && $("#pdpAddAfter").dataset.slug)
      || (wrap && wrap.dataset.slug);
    const product = slug ? PRODUCTS.find((x) => x.slug === slug) : null;
    applyPdpI18n();
    if (wrap && slug) renderPdpFlavorList(slug);
    const bindAdd = (el) => {
      if (!el || el.tagName === "A") return;
      if (isUnpriced(product)) {
        el.textContent = lang === "zh" ? "WhatsApp 查詢" : "Ask on WhatsApp";
        el.onclick = () => {
          const n = product[lang] || product.zh || {};
          const fl = flavors[slug] || "";
          const ask = lang === "zh"
            ? `你好，想查詢：${n.name || slug}${fl ? "（" + fl + "）" : ""}`
            : `Hi, I'd like to ask about: ${n.name || slug}${fl ? " (" + fl + ")" : ""}`;
          window.open(waLink(ask), "_blank", "noopener");
        };
      } else {
        el.onclick = () => addToCart(el.dataset.slug || slug);
      }
    };
    bindAdd(add);
    bindAdd($("#pdpAddAfter"));
    bindAdd($("#pdpStickyAdd"));
    $$("#pdpFlavors [data-f]").forEach((b) => {
      b.onclick = () => {
        if (slug) setFlavor(slug, b.dataset.name || b.textContent.trim(), b.dataset.f);
        $$("#pdpFlavors [data-f]").forEach((x) => x.classList.toggle("is-on", x === b));
        syncPdpStickyFlavor(slug);
        syncPdpAddState(slug);
      };
    });
    if (slug) syncPdpStickyFlavor(slug);
    if (slug) syncPdpAddState(slug);
    if ($("#pdpSticky")) {
      syncPdpStickyBar();
      window.addEventListener("scroll", syncPdpStickyBar, { passive: true });
      window.addEventListener("resize", syncPdpStickyBar);
    }
  }

/* ---------- cart ---------- */
  function saveCart() {
    try { localStorage.setItem(LS_CART, JSON.stringify(cart)); } catch (e) {}
  }
  function saveFlavors() {
    try {
      localStorage.setItem(LS_FLAVOR, JSON.stringify(flavors));
      localStorage.setItem(LS_FLAVOR_KEY, JSON.stringify(flavorKeys));
    } catch (e) {}
  }
  function cartLineKey(slug, variantKey) {
    return variantKey ? slug + "::" + variantKey : slug;
  }
  function cartLineParts(lineKey) {
    const raw = String(lineKey || "");
    const i = raw.indexOf("::");
    if (i === -1) return { slug: raw, variantKey: flavorKeys[raw] || "" };
    return { slug: raw.slice(0, i), variantKey: raw.slice(i + 2) };
  }
  function isComboLine(lineKey) {
    return String(lineKey || "").indexOf("combo::") === 0;
  }
  function saveCombos() {
    try { localStorage.setItem(LS_COMBOS, JSON.stringify(comboBag)); } catch (e) {}
  }
  function isPricedLine(lineKey) {
    if (isComboLine(lineKey)) return !!(comboBag[lineKey] && comboBag[lineKey].price);
    const p = PRODUCTS.find((x) => x.slug === cartLineParts(lineKey).slug);
    return !!(p && p.price != null);
  }
  function comboSummaryText(meta) {
    if (!meta) return "";
    const group = (arr) => {
      const map = {};
      (arr || []).forEach((x) => {
        const label = (x.product || "") + (x.name ? " " + x.name : "");
        map[label] = (map[label] || 0) + 1;
      });
      return Object.entries(map).map(([k, n]) => n > 1 ? k + " ×" + n : k).join("、");
    };
    const parts = [];
    if (meta.devices && meta.devices.length) {
      parts.push((lang === "zh" ? "煙機：" : "Devices: ") + group(meta.devices));
    }
    if (meta.pods && meta.pods.length) {
      parts.push((lang === "zh" ? "煙彈：" : "Pods: ") + group(meta.pods));
    }
    if (meta.gift) {
      parts.push((lang === "zh" ? "贈品：" : "Gift: ") + (meta.gift.product || "") + " " + (meta.gift.name || ""));
    }
    return parts.join(" · ");
  }
  function lineFlavorName(lineKey) {
    if (flavors[lineKey]) return flavors[lineKey];
    const { slug, variantKey } = cartLineParts(lineKey);
    if (variantKey && typeof getProductVariants === "function") {
      const hit = (getProductVariants(slug) || []).find((v) => v.key === variantKey);
      if (hit) return lang === "zh" ? hit.zh : hit.en;
    }
    return flavors[slug] || "";
  }
  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }
  function cartTotal() {
    return Object.entries(cart).reduce((sum, [lineKey, q]) => {
      if (isComboLine(lineKey)) {
        const meta = comboBag[lineKey];
        return sum + (meta && meta.price ? meta.price * q : 0);
      }
      const p = PRODUCTS.find((x) => x.slug === cartLineParts(lineKey).slug);
      return sum + q * (p ? unitPrice(p) : 0);
    }, 0);
  }

  function stockReady() {
    return !!(window.VapehouseStock && window.VapehouseStock.ready());
  }
  function stockFailed() {
    return !!(window.VapehouseStock && window.VapehouseStock.failed && window.VapehouseStock.failed());
  }
  function stockItemName(slug, key) {
    const p = PRODUCTS.find((x) => x.slug === slug);
    const pname = p ? ((p[lang] || p.zh || {}).name || slug) : slug;
    let vname = "";
    if (key) {
      const hit = variantList(slug).find((v) => v.key === key);
      if (hit) vname = lang === "zh" ? hit.zh : hit.en;
    }
    if (!vname) vname = flavors[cartLineKey(slug, key)] || flavors[slug] || "";
    return vname ? pname + " · " + vname : pname;
  }
  function stockLeft(slug, key) {
    if (!stockReady()) return null;
    if (key) {
      const n = window.VapehouseStock.maxOrderQty(slug, key);
      return n == null ? null : n;
    }
    return window.VapehouseStock.hasAnyStock(slug) ? null : 0;
  }
  function stockMsgOos(slug, key) {
    if (!slug) return lang === "zh" ? "此商品暫時缺貨，無法加入購物車" : "This item is out of stock";
    const name = stockItemName(slug, key);
    return lang === "zh"
      ? "「" + name + "」暫時缺貨，無法加入購物車"
      : "\"" + name + "\" is out of stock";
  }
  function stockMsgLimit(slug, key) {
    if (!slug) return lang === "zh" ? "已達庫存上限，無法再增加" : "No more stock available for this item";
    const name = stockItemName(slug, key);
    const left = stockLeft(slug, key);
    if (lang === "zh") {
      if (left === 0) return "「" + name + "」暫時缺貨，無法再增加";
      if (left != null) return "「" + name + "」庫存只剩 " + left + "，無法再增加";
      return "「" + name + "」已達庫存上限，無法再增加";
    }
    if (left === 0) return "\"" + name + "\" is out of stock";
    if (left != null) return "\"" + name + "\" only has " + left + " left — cannot add more";
    return "\"" + name + "\" has no more stock";
  }
  function stockMsgComboLimit(rows) {
    if (!rows || !rows.length) return stockMsgLimit();
    if (rows.length === 1) return stockMsgLimit(rows[0].slug, rows[0].key);
    const lines = rows.map((r) => {
      if (lang === "zh") return "• " + r.name + "（要 " + r.need + "，只剩 " + r.left + "）";
      return "• " + r.name + " (need " + r.need + ", only " + r.left + " left)";
    });
    return (lang === "zh" ? "以下口味／顏色庫存唔夠：\n" : "Not enough stock for:\n") + lines.join("\n");
  }
  function stockMsgWait() {
    return lang === "zh" ? "正在確認庫存，請稍候再試" : "Checking stock — please try again in a moment";
  }
  function stockMsgFail() {
    return lang === "zh" ? "暫時無法確認庫存，請經 WhatsApp 查詢" : "Unable to confirm stock. Please message us on WhatsApp.";
  }
  function stockMsgCart() {
    return lang === "zh"
      ? "購物車含缺貨商品，已移除／調整。請再確認後下單。"
      : "Some items are out of stock and were removed or adjusted. Please review your cart.";
  }
  function variantList(slug) {
    return (typeof getProductVariants === "function") ? (getProductVariants(slug) || []) : [];
  }
  function resolveVariantKey(slug) {
    if (flavorKeys[slug]) return flavorKeys[slug];
    const name = flavors[slug];
    if (!name) return null;
    const hit = variantList(slug).find((v) => v.zh === name || v.en === name);
    return hit ? hit.key : null;
  }
  function canAddQty(slug, nextQty, variantKey) {
    if (!stockReady()) return false;
    const key = variantKey || resolveVariantKey(slug);
    if (variantList(slug).length && !key) return false;
    if (key) {
      const max = window.VapehouseStock.maxOrderQty(slug, key);
      if (max == null) return false;
      const comboUsed = cartQtyOfVariant(slug, key) - (cart[cartLineKey(slug, key)] || 0);
      return nextQty + comboUsed <= max;
    }
    return window.VapehouseStock.hasAnyStock(slug);
  }
  function lineOrderable(lineKey, qty) {
    if (!stockReady()) return false;
    if (isComboLine(lineKey)) return comboLineOrderable(lineKey);
    const { slug, variantKey } = cartLineParts(lineKey);
    const key = variantKey || resolveVariantKey(slug);
    if (variantList(slug).length && !key) return false;
    if (key) {
      if (!window.VapehouseStock.isAvailable(slug, key)) return false;
      return canAddQty(slug, qty, key);
    }
    return window.VapehouseStock.hasAnyStock(slug);
  }
  function cartQtyOfVariant(slug, key, skipComboKey) {
    const line = cartLineKey(slug, key);
    let n = cart[line] || 0;
    Object.keys(comboBag).forEach((ck) => {
      if (ck === skipComboKey || !cart[ck]) return;
      const meta = comboBag[ck];
      if (!meta) return;
      const parts = [].concat(meta.devices || [], meta.pods || [], meta.gift ? [meta.gift] : []);
      n += parts.filter((p) => p.slug === slug && p.key === key).length * (cart[ck] || 1);
    });
    return n;
  }
  function comboShortageList(meta, skipComboKey) {
    if (!meta) return [];
    const counts = {};
    const bump = (part) => {
      if (!part || !part.slug || !part.key) return;
      const k = cartLineKey(part.slug, part.key);
      counts[k] = (counts[k] || 0) + 1;
    };
    (meta.devices || []).forEach(bump);
    (meta.pods || []).forEach(bump);
    if (meta.gift) bump(meta.gift);
    const out = [];
    Object.entries(counts).forEach(([k, n]) => {
      const { slug, variantKey } = cartLineParts(k);
      const already = cartQtyOfVariant(slug, variantKey, skipComboKey);
      const left = stockLeft(slug, variantKey);
      const need = already + n;
      if (left != null && need > left) {
        out.push({
          slug: slug,
          key: variantKey,
          need: need,
          left: left == null ? 0 : left,
          name: stockItemName(slug, variantKey)
        });
      }
    });
    return out;
  }
  function comboLineOrderable(lineKey) {
    const meta = comboBag[lineKey];
    if (!meta) return false;
    return comboShortageList(meta, lineKey).length === 0;
  }
  function markChipOos(btn, slug, key) {
    if (!btn) return;
    const oos = stockReady() && key && !window.VapehouseStock.isAvailable(slug, key);
    btn.classList.toggle("is-oos", oos);
    btn.setAttribute("aria-disabled", oos ? "true" : "false");
  }
  function syncPdpAddState(slug) {
    if (!slug) return;
    const product = PRODUCTS.find((x) => x.slug === slug);
    const unpriced = isUnpriced(product);
    const key = flavorKeys[slug] || "";
    let blocked = false;
    if (!unpriced) {
      if (!stockReady() || stockFailed()) blocked = true;
      else if (!window.VapehouseStock.hasAnyStock(slug)) blocked = true;
      else if (key && !window.VapehouseStock.isAvailable(slug, key)) blocked = true;
    }
    ["#pdpAdd", "#pdpAddAfter", "#pdpStickyAdd"].forEach((sel) => {
      const el = $(sel);
      if (!el || el.tagName === "A") return;
      el.disabled = blocked;
      if (unpriced) return;
      let orig = el.getAttribute("data-label");
      if (!orig) {
        const txt = el.textContent.trim();
        orig = (txt && txt !== t("soldOut") && txt !== "✓") ? txt : t("addCart");
        el.setAttribute("data-label", orig);
      }
      el.textContent = (blocked && stockReady()) ? t("soldOut") : orig;
    });
  }
  function applyCatalogStock() {
    const roots = catalogRoots();
    if (!roots.length) {
      syncCheckoutBtn();
      return;
    }
    roots.forEach((root) => $$(".card, .row-item, .mag-card", root).forEach((card) => {
      const add = card.querySelector(".add");
      const slug = (add && add.dataset.slug) || card.getAttribute("data-slug") || card.id;
      if (!slug) return;
      const p = PRODUCTS.find((x) => x.slug === slug);
      if (!p || p.price == null) return;
      const oos = stockReady() && !window.VapehouseStock.hasAnyStock(slug);
      card.classList.toggle("is-oos", oos);
      if (add) {
        add.disabled = !stockReady() || oos || stockFailed();
        add.textContent = oos ? t("soldOut") : t("add");
      }
      const wa = card.querySelector(".wa-card-btn");
      if (wa && oos) {
        const n = p[lang] || {};
        const ask = lang === "zh"
          ? `你好，想查詢何時補貨：${n.name || slug}`
          : `Hi, I'd like to ask when this will be back in stock: ${n.name || slug}`;
        wa.setAttribute("href", waLink(ask));
        wa.setAttribute("aria-label", lang === "zh" ? "查詢補貨 " + (n.name || slug) : "Ask about restock " + (n.name || slug));
      }
    }));
    const pdpSlug = ($("#pdpAdd") && $("#pdpAdd").dataset.slug)
      || ($("#pdpAddAfter") && $("#pdpAddAfter").dataset.slug)
      || ($("#pdpFlavors") && $("#pdpFlavors").dataset.slug);
    if (pdpSlug) {
      renderPdpFlavorList(pdpSlug);
      syncPdpAddState(pdpSlug);
    }
    syncCheckoutBtn();
  }
  function syncCheckoutBtn() {
    const btn = $("#checkoutBtn");
    if (!btn) return;
    const hasItems = Object.keys(cart).some(isPricedLine);
    btn.disabled = !hasItems || !canPlaceOrder();
  }
  function canPlaceOrder() {
    const lines = Object.entries(cart).filter(([lineKey]) => isPricedLine(lineKey));
    if (!lines.length) return false;
    if (!stockReady()) return false;
    return lines.every(([lineKey, q]) => lineOrderable(lineKey, q));
  }
  function ensureOrderableCart() {
    pruneUnpricedCart();
    const priced = Object.keys(cart).filter(isPricedLine);
    if (!priced.length) return false;
    if (!stockReady()) {
      alert(stockFailed() ? stockMsgFail() : stockMsgWait());
      return false;
    }
    const before = JSON.stringify(cart);
    pruneOosCart();
    if (!canPlaceOrder()) {
      alert(Object.keys(cart).length ? stockMsgCart() : stockMsgOos());
      return false;
    }
    if (before !== JSON.stringify(cart)) {
      alert(stockMsgCart());
      return false;
    }
    return true;
  }

  function setFlavor(slug, name, key) {
    if (name) flavors[slug] = name;
    else delete flavors[slug];
    if (key) flavorKeys[slug] = key;
    else if (!name) delete flavorKeys[slug];
    saveFlavors();
    renderCart();
  }

  function clearCart() {
    cart = {};
    flavors = {};
    flavorKeys = {};
    comboBag = {};
    saveCart();
    saveFlavors();
    saveCombos();
    renderCart();
  }

  function isUnpriced(p) {
    return !p || p.price == null;
  }

  function addToCart(slug, opts) {
    opts = opts || {};
    const variantKey = opts.variantKey || flavorKeys[slug] || null;
    const flavorName = opts.flavorName || flavors[slug] || null;
    const product = PRODUCTS.find((x) => x.slug === slug);
    if (isUnpriced(product)) {
      const n = product[lang] || product.zh || {};
      const ask = lang === "zh"
        ? `你好，想查詢：${n.name || slug}${flavorName ? "（" + flavorName + "）" : ""}`
        : `Hi, I'd like to ask about: ${n.name || slug}${flavorName ? " (" + flavorName + ")" : ""}`;
      window.open(waLink(ask), "_blank", "noopener");
      return false;
    }

    const variants = variantList(slug);
    if (!variantKey && variants.length) {
      if ($("#pdpFlavors")) {
        const isColor = variants[0].type === "color";
        alert(lang === "zh"
          ? (isColor ? "請先選擇顏色" : "請先選擇口味")
          : (isColor ? "Please choose a colour first" : "Please choose a flavour first"));
        $("#pdpFlavors").scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
      document.dispatchEvent(new CustomEvent("vape:open", { detail: { slug: slug } }));
      return false;
    }

    if (!stockReady()) {
      alert(stockFailed() ? stockMsgFail() : stockMsgWait());
      return false;
    }
    if (variantKey) {
      if (!window.VapehouseStock.isAvailable(slug, variantKey)) {
        alert(stockMsgOos(slug, variantKey));
        return false;
      }
    } else if (!window.VapehouseStock.hasAnyStock(slug)) {
      alert(stockMsgOos(slug));
      return false;
    }

    if (variantKey && flavorName) {
      flavors[slug] = flavorName;
      flavorKeys[slug] = variantKey;
      saveFlavors();
    }

    const lineKey = cartLineKey(slug, variantKey);
    if (variantKey && flavorName) flavors[lineKey] = flavorName;
    const next = (cart[lineKey] || 0) + 1;
    if (!canAddQty(slug, next, variantKey)) {
      alert(stockMsgLimit(slug, variantKey));
      return false;
    }
    cart[lineKey] = next;
    saveCart();
    renderCart();
    flashPdpAddButtons();
    const btn = $(`.add[data-slug="${slug}"]`);
    if (btn && !btn.disabled) {
      btn.textContent = "✓";
      setTimeout(() => { btn.textContent = t("add"); }, 900);
    }
    return true;
  }

  function pruneUnpricedCart() {
    let changed = false;
    Object.keys(cart).forEach((lineKey) => {
      if (isComboLine(lineKey)) {
        if (!comboBag[lineKey]) {
          delete cart[lineKey];
          changed = true;
        }
        return;
      }
      const { slug } = cartLineParts(lineKey);
      const p = PRODUCTS.find((x) => x.slug === slug);
      if (isUnpriced(p)) {
        delete cart[lineKey];
        delete flavors[lineKey];
        delete flavorKeys[lineKey];
        changed = true;
      }
    });
    if (changed) {
      saveCart();
      saveFlavors();
      renderCart();
    }
  }

  function pruneOosCart() {
    pruneUnpricedCart();
    if (!stockReady()) return;
    let changed = false;
    Object.keys(cart).forEach((lineKey) => {
      if (isComboLine(lineKey)) {
        if (!comboLineOrderable(lineKey)) {
          delete cart[lineKey];
          delete comboBag[lineKey];
          changed = true;
        }
        return;
      }
      const { slug, variantKey } = cartLineParts(lineKey);
      const key = variantKey || resolveVariantKey(slug);
      if (variantList(slug).length && !key) {
        delete cart[lineKey];
        delete flavors[lineKey];
        delete flavorKeys[lineKey];
        changed = true;
        return;
      }
      if (key) {
        const max = window.VapehouseStock.maxOrderQty(slug, key);
        if (max == null) return;
        const usedByCombos = cartQtyOfVariant(slug, key) - (cart[lineKey] || 0);
        const avail = max - usedByCombos;
        if (avail <= 0) {
          delete cart[lineKey];
          delete flavors[lineKey];
          delete flavorKeys[lineKey];
          changed = true;
        } else if (cart[lineKey] > avail) {
          cart[lineKey] = avail;
          changed = true;
        }
      } else if (!window.VapehouseStock.hasAnyStock(slug)) {
        delete cart[lineKey];
        delete flavors[lineKey];
        delete flavorKeys[lineKey];
        changed = true;
      }
    });
    if (changed) {
      saveCart();
      saveFlavors();
      saveCombos();
      renderCart();
    }
  }

  function closeNav() {
    const drawer = $("#navDrawer");
    const overlay = $("#navOverlay");
    const btn = $("#menuBtn");
    if (drawer) {
      drawer.classList.remove("show");
      drawer.setAttribute("aria-hidden", "true");
    }
    if (overlay) overlay.classList.remove("show");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (!($("#drawer") && $("#drawer").classList.contains("show"))) {
      document.body.style.overflow = "";
    }
  }

  function injectBrandNav() {
    const header = document.querySelector(".site-header");
    if (!header || header.querySelector(".brand-nav")) return;
    const base = (document.body.dataset.base || "./").replace(/\/?$/, "/");
    const path = (location.pathname || "/").replace(/\/+$/, "") || "/";
    const brands = [
      ["grid", "GRID"],
      ["lana", "LANA"],
      ["floral", "FLORAL"],
      ["daesin", "DAESIN"],
      ["zgar", "ZGAR"],
      ["suki", "SUKI"],
      ["saico", "SAICO"],
      ["mega-vapez", "MEGA-VAPEZ"]
    ];
    const nav = document.createElement("nav");
    nav.className = "brand-nav";
    nav.setAttribute("aria-label", "Brands");
    nav.innerHTML = brands.map(([slug, name]) => {
      const href = base + slug;
      const active = path === "/" + slug || path.endsWith("/" + slug) || path.endsWith("/" + slug + ".html");
      return `<a class="brand-nav__link${active ? " is-active" : ""}" href="${href}">${name}</a>`;
    }).join("");
    header.appendChild(nav);
  }

  function populateNavDrawer() {
    const srcNav = document.querySelector(".site-header .site-nav");
    const dst = $("#navDrawerLinks");
    if (!srcNav || !dst || dst.children.length) return;
    const brands = document.querySelector(".brand-nav");
    if (brands) {
      brands.querySelectorAll("a").forEach((a) => {
        const clone = a.cloneNode(true);
        clone.classList.remove("brand-nav__link");
        clone.classList.add("nav-drawer__link");
        dst.appendChild(clone);
      });
    }
    srcNav.querySelectorAll(".site-nav__link").forEach((a) => {
      if (brands && a.hasAttribute("data-brand")) return;
      const clone = a.cloneNode(true);
      clone.classList.add("nav-drawer__link");
      dst.appendChild(clone);
    });
  }

  function openNav() {
    closeCart();
    const drawer = $("#navDrawer");
    const overlay = $("#navOverlay");
    const btn = $("#menuBtn");
    if (!drawer || !overlay) return;
    populateNavDrawer();
    drawer.classList.add("show");
    overlay.classList.add("show");
    drawer.setAttribute("aria-hidden", "false");
    if (btn) btn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function initMobileNav() {
    const drawer = $("#navDrawer");
    if (!$("#menuBtn") || !drawer) return;
    populateNavDrawer();
    on("#menuBtn", "click", openNav);
    on("#navDrawerClose", "click", closeNav);
    on("#navOverlay", "click", closeNav);
    drawer.addEventListener("click", (e) => {
      if (e.target.closest(".nav-drawer__links a, .nav-drawer__links button, .nav-drawer__brand")) {
        closeNav();
      }
    });
  }

  function initDrawerEscape() {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if ($("#navDrawer") && $("#navDrawer").classList.contains("show")) closeNav();
      else if ($("#drawer") && $("#drawer").classList.contains("show")) closeCart();
    });
  }

  function initCartBar() {
    const bar = $("#cartBar");
    if (!bar) return;
    const countEl = $("#cartBarCount");
    const totalEl = $("#cartBarTotal");
    function update() {
      const n = cartCount();
      if (n > 0) {
        bar.classList.remove("hidden");
        if (countEl) countEl.textContent = n;
        if (totalEl) totalEl.textContent = formatMoney(cartTotal());
      } else {
        bar.classList.add("hidden");
      }
    }
    bar.addEventListener("click", openCart);
    document.addEventListener("vape:cart", update);
    update();
  }

  function handleJumpClick(e) {
    const el = e.target.closest("[data-jump]");
    if (!el) return;
    const cat = el.dataset.jump;
    if (cat === "promo") {
      e.preventDefault();
      goPromo("promo");
      return;
    }
    if (!cat || !CATEGORIES.some((c) => c.id === cat)) {
      const href = el.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = $(href);
        scrollTo(target);
      }
      return;
    }
    const href = el.getAttribute("href") || "";
    if (/\.html($|[?#])/i.test(href)) return;
    e.preventDefault();
    setNavActive(cat);
    renderCats(cat);
    renderProducts(cat);
    const catalog = $("#catalog");
    scrollTo(catalog);
  }

  function openCart() {
    closeNav();
    const drawer = $("#drawer");
    const overlay = $("#overlay");
    if (drawer) drawer.classList.add("show");
    if (overlay) overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    const drawer = $("#drawer");
    const overlay = $("#overlay");
    if (drawer) drawer.classList.remove("show");
    if (overlay) overlay.classList.remove("show");
    if (!($("#navDrawer") && $("#navDrawer").classList.contains("show"))) {
      document.body.style.overflow = "";
    }
  }

  function formatMoney(n) {
    return STORE.currency + " " + Number(n).toFixed(2).replace(/\.00$/, "");
  }

  function renderCart() {
    const box = $("#cartItems");
    const wrap = $("#cartWrap");
    const note = $("#cartMemberNote");
    const n = cartCount();
    const total = cartTotal();
    const totalLabel = formatMoney(total);
    $$("#cartCount, .cartbtn__count").forEach((count) => {
      count.textContent = n;
      count.classList.toggle("show", n > 0);
    });
    $$("#cartHeaderTotal, .cartbtn__total").forEach((el) => {
      el.textContent = totalLabel;
      el.hidden = n <= 0;
      el.classList.toggle("show", n > 0);
    });
    const drawerTotal = $("#cartTotal");
    if (drawerTotal) drawerTotal.textContent = totalLabel;
    if (note) {
      note.textContent = isMember() ? t("cartMember") : t("cartGuest");
      note.classList.toggle("cart-note--join", !isMember());
      note.setAttribute("role", isMember() ? "note" : "button");
      note.tabIndex = isMember() ? -1 : 0;
      note.onclick = isMember() ? null : function () { openMemberModal("join"); };
      note.onkeydown = isMember() ? null : function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openMemberModal("join"); }
      };
    }
    renderShipRule();
    syncCheckoutBtn();
    if (!box) return;

    const lines = Object.entries(cart);
    if (!lines.length) {
      box.innerHTML = `<div class="empty">${t("empty")}</div>`;
      if (wrap) wrap.style.display = "none";
      document.dispatchEvent(new CustomEvent("vape:cart"));
      return;
    }
    if (wrap) wrap.style.display = "block";
    box.innerHTML = lines.map(([lineKey, q]) => {
      if (isComboLine(lineKey)) {
        const meta = comboBag[lineKey];
        if (!meta) return "";
        const attr = escapeHtml(lineKey);
        const img = (PRODUCTS.find((x) => x.slug === "grid-gen1-pod") || PRODUCTS[0] || {}).img || "";
        const fl = comboSummaryText(meta);
        return `<div class="item">
        <img src="${escapeHtml(asset(img))}" alt="">
        <div class="info"><b>${escapeHtml(meta.label || t("comboTitle"))}</b><span>${STORE.currency} ${meta.price} × ${q}</span>${fl ? `<span class="item-flavor">${escapeHtml(fl)}</span>` : ""}
          <button type="button" class="item-x" data-x="${attr}" aria-label="Remove">✕</button>
        </div>
      <div class="qty">
          <button type="button" data-d="${attr}">−</button><b>${q}</b>
        </div>
      </div>`;
      }
      const { slug } = cartLineParts(lineKey);
      const p = PRODUCTS.find((x) => x.slug === slug);
      if (!p) return "";
      const price = unitPrice(p);
      const fl = lineFlavorName(lineKey);
      const attr = escapeHtml(lineKey);
      const priceLine = p.price == null
        ? `${t("priceAsk")} × ${q}`
        : `${STORE.currency} ${price} × ${q}`;
      return `<div class="item">
        <img src="${escapeHtml(asset(p.img))}" alt="">
        <div class="info"><b>${escapeHtml(p[lang].name)}</b><span>${priceLine}</span>${fl ? `<span class="item-flavor">${escapeHtml(fl)}</span>` : ""}
          <button type="button" class="item-x" data-x="${attr}" aria-label="Remove ${escapeHtml(p[lang].name)}">✕</button>
        </div>
      <div class="qty">
          <button type="button" data-d="${attr}">−</button><b>${q}</b><button type="button" data-a="${attr}">+</button>
        </div>
      </div>`;
  }).join("");
    if (!document.getElementById("vp-itemx-css")) {
      const st = document.createElement("style");
      st.id = "vp-itemx-css";
      st.textContent = ".item{position:relative}.info{position:relative;padding-right:44px}.item-x{position:absolute;top:0;right:0;width:40px;height:40px;min-height:40px;border:0;background:none;color:inherit;opacity:.55;font-size:1.05rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%}.item-x:hover{opacity:1;background:rgba(128,128,128,.18)}";
      document.head.appendChild(st);
    }
    $$("[data-d]", box).forEach((b) => {
      b.onclick = () => {
        const lineKey = b.dataset.d;
        if (isComboLine(lineKey)) {
          delete cart[lineKey];
          delete comboBag[lineKey];
          saveCombos();
          saveCart();
          renderCart();
          return;
        }
        cart[lineKey]--;
        if (cart[lineKey] <= 0) {
          delete cart[lineKey];
          delete flavors[lineKey];
          delete flavorKeys[lineKey];
          saveFlavors();
        }
        saveCart();
        renderCart();
      };
    });
    $$("[data-a]", box).forEach((b) => {
      b.onclick = () => {
        const lineKey = b.dataset.a;
        if (isComboLine(lineKey)) return;
        const { slug, variantKey } = cartLineParts(lineKey);
        const p = PRODUCTS.find((x) => x.slug === slug);
        if (isUnpriced(p)) {
          delete cart[lineKey];
          delete flavors[lineKey];
          delete flavorKeys[lineKey];
          saveFlavors();
          saveCart();
          renderCart();
          return;
        }
        const next = (cart[lineKey] || 0) + 1;
        if (!canAddQty(slug, next, variantKey)) {
          alert(stockMsgLimit(slug, variantKey));
          return;
        }
        cart[lineKey] = next;
        saveCart();
        renderCart();
      };
    });
    $$("[data-x]", box).forEach((b) => {
      b.onclick = () => {
        const lineKey = b.dataset.x;
        delete cart[lineKey];
        delete flavors[lineKey];
        delete flavorKeys[lineKey];
        if (isComboLine(lineKey)) {
          delete comboBag[lineKey];
          saveCombos();
        }
        saveFlavors();
        saveCart();
        renderCart();
      };
    });

    document.dispatchEvent(new CustomEvent("vape:cart"));
    syncCheckoutBtn();
  }

  function buildOrderMessage() {
    pruneUnpricedCart();
    const lines = Object.entries(cart).filter(([lineKey]) => isPricedLine(lineKey));
    if (!lines.length) return "";
    const total = cartTotal();
    const earn = Math.floor(total * pointsRate);
    const shipCfg = STORE.shipping || {};
    const shippingFee = total >= (shipCfg.freeAbove || Infinity) ? 0 : (shipCfg.fee || 0);

    let msg = `*New Order — ${STORE.name}*\n`;
    if (isMember()) {
      msg += `Member: ${member.name} (${member.id})\nPhone: ${member.phone}\n`;
      if ((memCfg.discountPercent || 0) > 0) msg += `Discount: ${memCfg.discountPercent}%\n`;
    }
    lines.forEach(([lineKey, q]) => {
      if (isComboLine(lineKey)) {
        const meta = comboBag[lineKey];
        if (!meta) return;
        msg += `• ${q} × ${meta.label} — ${STORE.currency} ${meta.price}\n`;
        const detail = comboSummaryText(meta);
        if (detail) msg += `  ${detail}\n`;
        return;
      }
      const { slug } = cartLineParts(lineKey);
      const p = PRODUCTS.find((x) => x.slug === slug);
      const fl = lineFlavorName(lineKey);
      const lineAmt = `${STORE.currency} ${(unitPrice(p) * q).toFixed(2).replace(/\.00$/, "")}`;
      msg += `• ${q} × ${p[lang].name}${fl ? ` (${fl})` : ""} — ${lineAmt}\n`;
    });
    msg += `Shipping: ${shippingFee ? STORE.currency + " " + shippingFee : "FREE"}${shipCfg.freeAbove ? " (free over " + STORE.currency + shipCfg.freeAbove + ")" : ""}\n`;
    msg += `*Total: ${STORE.currency} ${(total + shippingFee).toFixed(2).replace(/\.00$/, "")}*\n`;
    if (isMember()) msg += `Points estimate from this order: +${earn} (confirm balance in store)\n`;
    msg += `Name: ${orderName || (isMember() ? member.name : "—")}\n`;
    msg += `Delivery: ${orderArea || "To be confirmed / 待確認"}\n`;
    msg += `Payment: WeChat / Alipay / PayMe / FPS\n`;
    msg += `\nAge: I confirm I am 18 or older (18+)`;
    return msg;
  }

  function sendOrderWhatsApp() {
    if (!ensureOrderableCart()) return false;
    const msg = buildOrderMessage();
    if (!msg) return false;
    /* 'noopener' in the features string makes Chrome return null even when
       the tab opens, so a null check would keep the cart forever. Set
       opener = null after a normal open instead. */
    const opened = window.open(waLink(msg), "_blank");
    if (!opened) {
      alert(lang === "zh"
        ? "瀏覽器封鎖了 WhatsApp 視窗，購物車已保留。請允許彈出視窗後再送出。"
        : "The browser blocked the WhatsApp window. Your cart is still here — allow pop-ups and send again.");
      return false;
    }
    try { opened.opener = null; } catch (e) {}
    clearCart();
    return true;
  }

  function checkout() {
    if (!ensureOrderableCart()) return;
    const sheet = $("#waOrderSheet");
    if (sheet) {
      if (window.VapehouseOrderSheet && window.VapehouseOrderSheet.open) window.VapehouseOrderSheet.open();
      return;
    }
    sendOrderWhatsApp();
  }

  function on(sel, ev, fn) {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (el) el.addEventListener(ev, fn);
  }

  /* ---------- floating WhatsApp widget (every page) ---------- */
  function injectWaWidget() {
    if (document.querySelector(".wa-widget")) return;

    const style = document.createElement("style");
    style.id = "vw-widget-css";
    style.textContent = [
      ".wa-widget{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:150;display:flex;flex-direction:column;align-items:flex-end;gap:12px}",
      ".wa-fab{width:58px;height:58px;border:0;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 12px 30px rgba(37,211,102,.4);transition:transform .15s ease}",
      ".wa-fab:hover{transform:scale(1.06)}",
      ".wa-card{width:min(86vw,320px);background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,.18);padding:18px;display:none;flex-direction:column;gap:10px}",
      ".wa-card.show{display:flex;animation:waUp .2s ease both}",
      "@keyframes waUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}",
      ".wa-card__head{display:flex;align-items:center;justify-content:space-between}",
      ".wa-card__head p{font-weight:700;font-size:1rem;color:#1d1d1f}",
      ".wa-card__head b{color:#25d366}",
      ".wa-close{border:0;background:none;font-size:1rem;color:#6e6e73;cursor:pointer;width:32px;height:32px;border-radius:50%}",
      ".wa-close:hover{background:rgba(0,0,0,.05)}",
      ".wa-card__sub{font-size:.82rem;color:#6e6e73;line-height:1.5}",
      ".wa-card__actions{display:grid;gap:8px}",
      ".wa-action{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(0,0,0,.08);background:#f5f5f7;color:#1d1d1f;font-weight:500;font-size:.92rem;text-decoration:none;transition:border-color .15s ease,background .15s ease}",
      ".wa-action:hover{border-color:#25d366;background:#f2fcf6}",
      ".wa-dot{width:9px;height:9px;border-radius:50%;background:#25d366;flex-shrink:0}",
      ".wa-card__foot{border-top:1px solid rgba(0,0,0,.06);padding-top:10px;text-align:center}",
      ".wa-card__foot a{color:#06c;text-decoration:none;font-size:.92rem;font-weight:600}",
      ".wa-card__foot a:hover{text-decoration:underline}"
    ].join("");
    document.head.appendChild(style);

    const wa = "https://wa.me/" + ((STORE && STORE.whatsapp) || "447477747855");
    const enc = (s) => (s ? "?text=" + encodeURIComponent(s) : "");
    const orderMsg = "Hi, I want to order from " + STORE.name;

    // Localized widget copy
    const zh = lang === "zh";
    const waT = {
      head: zh ? "與 <b>" + STORE.name + "</b> 對話" : "Chat with <b>" + STORE.name + "</b>",
      sub: zh ? "落單 · 付款 · 售後 — WhatsApp 回覆" : "Orders · Payments · After-sales — we reply on WhatsApp",
      pay: zh ? "為我的訂單付款" : "Pay for my order",
      payMsg: zh ? "你好，我想為訂單付款（PayMe／FPS／Alipay／WeChat Pay）。" : "Hi, I would like to pay for my order (PayMe / FPS / Alipay / WeChat Pay).",
      after: zh ? "售後支援" : "After-sales support",
      afterMsg: zh ? "你好，我需要訂單的售後協助。" : "Hi, I need after-sales help with an order.",
      channel: zh ? "追蹤 WhatsApp 頻道" : "Follow WhatsApp Channel",
      start: zh ? "開始對話" : "Start chat"
    };
    const orderMsgZh = "你好，我想向 " + STORE.name + " 落單";
    const orderHref = wa + enc(zh ? orderMsgZh : orderMsg);
    const actions = [
      '<a class="wa-action" href="' + orderHref + '" target="_blank" rel="noopener"><span class="wa-dot"></span>' + (zh ? "WhatsApp 落單" : "Place an order") + "</a>",
      '<a class="wa-action" href="' + wa + enc(waT.payMsg) + '" target="_blank" rel="noopener"><span class="wa-dot"></span>' + waT.pay + "</a>",
      '<a class="wa-action" href="' + wa + enc(waT.afterMsg) + '" target="_blank" rel="noopener"><span class="wa-dot"></span>' + waT.after + "</a>"
    ];

    const wrap = document.createElement("div");
    wrap.className = "wa-widget";
    wrap.innerHTML = [
      '<div class="wa-card" role="dialog" aria-label="WhatsApp chat">',
      '  <div class="wa-card__head"><p>' + waT.head + '</p><button type="button" class="wa-close" aria-label="Close">✕</button></div>',
      '  <p class="wa-card__sub">' + waT.sub + '</p>',
      '  <div class="wa-card__actions">' + actions.join("") + "</div>",
      '  <div class="wa-card__foot"><a href="' + orderHref + '" target="_blank" rel="noopener">' + waT.start + "</a></div>",
      "</div>",
      '<button type="button" class="wa-fab" aria-label="WhatsApp chat" aria-expanded="false">',
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.7L2 22l4.4-1.1A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.6.7.7-2.5-.2-.3A9 9 0 1 1 12 20.5zm5.2-6.7c-.3-.1-1.7-.8-1.9-.9s-.5-.1-.6.1-.7.9-.9 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.5-.6c.1-.2.1-.3 0-.5l-.9-2.1c-.2-.5-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3s-1 1-1 2.4 1 2.8 1.2 3 .9 1.8 3.7 3.1c2 .9 2.6.9 3 .8.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2s-.2-.2-.5-.3z"/></svg>',
      "</button>"
    ].join("");
    document.body.appendChild(wrap);

    const toggle = wrap.querySelector(".wa-fab");
    const card = wrap.querySelector(".wa-card");
    const close = wrap.querySelector(".wa-close");
    if (toggle && card) {
      const hide = () => { card.classList.remove("show"); toggle.setAttribute("aria-expanded", "false"); };
      toggle.addEventListener("click", () => {
        const show = card.classList.toggle("show");
        toggle.setAttribute("aria-expanded", show ? "true" : "false");
      });
      if (close) close.addEventListener("click", hide);
      document.addEventListener("click", (e) => {
        if (!card.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) hide();
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
    }
  }

  function wireSectionWa() {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.href = waLink(text); };
    const zh = lang === "zh";
    set("srWa", zh
      ? "你好，我想查詢 Vape Showroom 產品。"
      : "Hi, I have a question about the Vape Showroom device.");
    set("memWa", zh
      ? "你好，我想了解 Vape7-11 會員計劃同積分優惠。"
      : "Hi, I'd like to know more about Vape7-11 membership and points.");
    set("payWa", zh
      ? "你好，我想為訂單付款（PayMe／FPS／Alipay／WeChat Pay）。"
      : "Hi, I would like to pay for my order (PayMe / FPS / Alipay / WeChat Pay).");
    set("footWa", "");
    set("deliveryWa", zh
      ? "你好，想查詢送貨／運費安排"
      : "Hi, I'd like to ask about delivery.");
    set("catWa", zh
      ? "你好，我想向 Vape7-11 落單。"
      : "Hi, I want to order from Vape7-11.");
  }

  function comboLabel(c) {
    if (lang === "zh") return c.devices + "機" + c.pods + "盒";
    const d = c.devices === 1 ? "1 device" : c.devices + " devices";
    return d + " + " + c.pods + " pods";
  }

  function comboShortName(p) {
    return productBrand(p) || ((p && p.en && p.en.name) ? p.en.name.split(" ")[0] : (p ? p.slug : ""));
  }

  function comboGenLabel(p) {
    if (!p) return "";
    if (p.cat === "pod-gen1") return lang === "zh" ? "一代" : "Gen-1";
    if (p.cat === "pod-gen5") return lang === "zh" ? "五代" : "Gen-5";
    const blob = (
      String(p.slug || "") + " " +
      String(p.badge || "") + " " +
      String((p.en && p.en.name) || "")
    ).toLowerCase();
    if (blob.indexOf("gen-1") !== -1 || blob.indexOf("gen1") !== -1) {
      return lang === "zh" ? "一代" : "Gen-1";
    }
    if (
      blob.indexOf("gen-5") !== -1 ||
      blob.indexOf("gen5") !== -1 ||
      /(^|[\s-])r5([\s-]|$)/.test(blob)
    ) {
      return lang === "zh" ? "五代" : "Gen-5";
    }
    return "";
  }

  /** Brand (+ 一代/五代) for combo UI */
  function comboProductLabel(p) {
    const brand = comboShortName(p);
    const gen = comboGenLabel(p);
    return gen ? brand + " " + gen : brand;
  }

  function comboVariantName(v) {
    return lang === "zh" ? v.zh : v.en;
  }

  function comboVariantOos(slug, key) {
    return stockReady() && key && !window.VapehouseStock.isAvailable(slug, key);
  }

  function comboProducts(cat) {
    if (cat === "pod") {
      return PRODUCTS.filter(
        (p) => p.cat === "pod" || p.cat === "pod-gen1" || p.cat === "pod-gen5"
      );
    }
    return PRODUCTS.filter((p) => p.cat === cat);
  }

  function comboPickedGroupHtml(arr, kind) {
    const map = [];
    const index = {};
    (arr || []).forEach((x) => {
      const id = x.slug + "::" + x.key;
      if (index[id] == null) {
        index[id] = map.length;
        map.push({ slug: x.slug, key: x.key, name: x.name, product: x.product, n: 1 });
      } else {
        map[index[id]].n++;
      }
    });
    if (!map.length) {
      return `<p class="combo-picked__empty">${lang === "zh" ? "尚未選擇" : "None yet"}</p>`;
    }
    return map.map((x) => {
      // Pods / gift: flavour first, then brand (+ gen). Devices: colour · brand (+ gen).
      const label = (kind === "pod" || kind === "gift")
        ? (x.name + (x.product ? " · " + x.product : ""))
        : (x.name + (x.product ? " · " + x.product : ""));
      return `<button type="button" class="combo-pill" data-combo-remove="${kind}" data-slug="${escapeHtml(x.slug)}" data-key="${escapeHtml(x.key)}">${escapeHtml(label)}${x.n > 1 ? " ×" + x.n : ""} −</button>`;
    }).join("");
  }

  function comboRemovePicked(kind, slug, key) {
    if (!comboDraft) return;
    if (kind === "gift") {
      comboDraft.gift = null;
      renderComboBuilder();
      return;
    }
    const arr = kind === "device" ? comboDraft.devices : comboDraft.pods;
    const i = arr.findIndex((x) => x.slug === slug && x.key === key);
    if (i >= 0) arr.splice(i, 1);
    renderComboBuilder();
  }

  function comboAddPart(kind, slug, v) {
    if (!comboDraft || !v) return;
    const p = PRODUCTS.find((x) => x.slug === slug);
    const part = {
      slug: slug,
      key: v.key,
      name: comboVariantName(v),
      product: comboProductLabel(p)
    };
    if (comboVariantOos(slug, v.key)) {
      alert(stockMsgOos(slug, v.key));
      return;
    }
    if (kind === "gift" && comboDraft.gift && comboDraft.gift.slug === slug && comboDraft.gift.key === v.key) {
      return;
    }
    const arr = kind === "device" ? comboDraft.devices : kind === "pod" ? comboDraft.pods : null;
    if (arr && kind === "device" && comboDraft.devices.length >= comboDraft.devicesNeed) return;
    if (arr && kind === "pod" && comboDraft.pods.length >= comboDraft.podsNeed) return;
    const inDraft = kind === "gift"
      ? (comboDraft.gift && comboDraft.gift.slug === slug && comboDraft.gift.key === v.key ? 1 : 0)
      : arr.filter((x) => x.slug === slug && x.key === v.key).length;
    const left = stockLeft(slug, v.key);
    if (left != null && cartQtyOfVariant(slug, v.key) + inDraft + 1 > left) {
      alert(stockMsgLimit(slug, v.key));
      return;
    }
    if (kind === "device") {
      comboDraft.devices.push(part);
    } else if (kind === "pod") {
      comboDraft.pods.push(part);
    } else {
      comboDraft.gift = part;
    }
    renderComboBuilder();
  }

  function comboBrandButtons(cat, selectedSlug, attr) {
    return comboProducts(cat).map((p) =>
      `<button type="button" class="combo-brand${p.slug === selectedSlug ? " is-on" : ""}" data-${attr}="${escapeHtml(p.slug)}">${escapeHtml(comboProductLabel(p))}</button>`
    ).join("");
  }

  function comboOptionButtons(slug, kind) {
    const list = variantList(slug);
    const q = (comboDraft && comboDraft.podQuery || "").trim().toLowerCase();
    const p = PRODUCTS.find((x) => x.slug === slug);
    const brandLabel = comboProductLabel(p);
    const filtered = kind === "pod" && q
      ? list.filter((v) => {
          const label = ((v.zh || "") + " " + (v.en || "") + " " + brandLabel).toLowerCase();
          return label.indexOf(q) !== -1;
        })
      : list;
    const isColor = kind === "device";
    if (!filtered.length) {
      return `<p class="combo-picked__empty">${lang === "zh" ? "沒有符合的口味" : "No matching flavours"}</p>`;
    }
    return filtered.map((v) => {
      const oos = comboVariantOos(slug, v.key);
      const flavor = comboVariantName(v);
      // Pods: flavour · brand 一代/五代（無獨立牌子列時仍可分辨）
      const label = kind === "pod" && brandLabel
        ? flavor + " · " + brandLabel
        : flavor;
      return `<button type="button" class="quick-flavor${isColor ? " is-color" : ""}${oos ? " is-oos" : ""}" data-combo-opt="${kind}" data-slug="${escapeHtml(slug)}" data-key="${escapeHtml(v.key)}" title="${escapeHtml(label)}"${oos ? " disabled" : ""} style="--fc:${escapeHtml(v.color || "#888")}"><span class="dot" aria-hidden="true"></span><span class="quick-flavor__label">${escapeHtml(label)}</span></button>`;
    }).join("");
  }

  function comboGiftAvailable() {
    const list = variantList(COMBO_GIFT_SLUG);
    if (!list.length) return false;
    if (!stockReady()) return true;
    return list.some((v) => window.VapehouseStock.isAvailable(COMBO_GIFT_SLUG, v.key));
  }

  function comboReady() {
    if (!comboDraft) return false;
    if (comboDraft.devices.length !== comboDraft.devicesNeed) return false;
    if (comboDraft.pods.length !== comboDraft.podsNeed) return false;
    if (comboDraft.giftRequired && !comboDraft.gift) return false;
    return true;
  }

  function renderComboBuilder() {
    if (!comboDraft) return;
    const deal = $("#comboDeal");
    if (deal) deal.textContent = comboDraft.label + " · $" + comboDraft.price;
    const dh = $("#comboDevHead");
    if (dh) dh.textContent = t("comboDevHead") + " " + comboDraft.devices.length + "/" + comboDraft.devicesNeed;
    const ph = $("#comboPodHead");
    if (ph) ph.textContent = t("comboPodHead") + " " + comboDraft.pods.length + "/" + comboDraft.podsNeed;
    const dp = $("#comboDevPicked");
    if (dp) dp.innerHTML = comboPickedGroupHtml(comboDraft.devices, "device");
    const pp = $("#comboPodPicked");
    if (pp) pp.innerHTML = comboPickedGroupHtml(comboDraft.pods, "pod");
    const db = $("#comboDevBrands");
    if (db) db.innerHTML = comboBrandButtons("device", comboDraft.devSlug, "combo-dev");
    const pb = $("#comboPodBrands");
    if (pb) pb.innerHTML = comboBrandButtons("pod", comboDraft.podSlug, "combo-pod");
    const dopt = $("#comboDevOpts");
    if (dopt) dopt.innerHTML = comboOptionButtons(comboDraft.devSlug, "device");
    const popt = $("#comboPodOpts");
    if (popt) popt.innerHTML = comboOptionButtons(comboDraft.podSlug, "pod");
    const giftAvail = comboGiftAvailable();
    comboDraft.giftRequired = giftAvail;
    const giftStep = $("#comboGiftStep");
    if (giftStep) giftStep.classList.toggle("hidden", !giftAvail && !comboDraft.gift);
    const gp = $("#comboGiftPicked");
    if (gp) {
      gp.innerHTML = comboDraft.gift
        ? comboPickedGroupHtml([comboDraft.gift], "gift")
        : `<p class="combo-picked__empty">${giftAvail ? (lang === "zh" ? "請選擇贈品口味" : "Choose a gift flavour") : t("comboGiftSkip")}</p>`;
    }
    const gopt = $("#comboGiftOpts");
    if (gopt) gopt.innerHTML = giftAvail ? comboOptionButtons(COMBO_GIFT_SLUG, "gift") : "";
    const add = $("#comboAddBtn");
    if (add) add.disabled = !comboReady();
    const err = $("#comboError");
    if (err) err.classList.add("hidden");
    wireComboBuilderClicks();
  }

  function wireComboBuilderClicks() {
    const modal = $("#comboModal");
    if (!modal) return;
    $$("[data-combo-dev]", modal).forEach((b) => {
      b.onclick = () => { comboDraft.devSlug = b.getAttribute("data-combo-dev"); renderComboBuilder(); };
    });
    $$("[data-combo-pod]", modal).forEach((b) => {
      b.onclick = () => { comboDraft.podSlug = b.getAttribute("data-combo-pod"); renderComboBuilder(); };
    });
    $$("[data-combo-opt]", modal).forEach((b) => {
      b.onclick = () => {
        const kind = b.getAttribute("data-combo-opt");
        const slug = b.getAttribute("data-slug");
        const key = b.getAttribute("data-key");
        const v = variantList(slug).find((x) => x.key === key);
        if (v) comboAddPart(kind, slug, v);
      };
    });
    $$("[data-combo-remove]", modal).forEach((b) => {
      b.onclick = () => comboRemovePicked(b.getAttribute("data-combo-remove"), b.dataset.slug, b.dataset.key);
    });
  }

  function openComboBuilder(combo) {
    const modal = $("#comboModal");
    if (!modal) return;
    const devices = comboProducts("device");
    const pods = comboProducts("pod");
    comboDraft = {
      devicesNeed: combo.devices,
      podsNeed: combo.pods,
      price: combo.price,
      label: comboLabel(combo),
      devices: [],
      pods: [],
      gift: null,
      giftRequired: true,
      devSlug: (devices[0] && devices[0].slug) || "grid-gen1-device",
      podSlug: (pods[0] && pods[0].slug) || "grid-gen1-pod",
      podQuery: ""
    };
    const search = $("#comboPodSearch");
    if (search) {
      search.value = "";
      search.placeholder = t("comboSearch");
    }
    renderComboBuilder();
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeComboBuilder() {
    const modal = $("#comboModal");
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "";
    comboDraft = null;
  }

  function addComboToCart() {
    if (!comboDraft || !comboReady()) {
      const err = $("#comboError");
      if (err) {
        err.textContent = t("comboNeedMore");
        err.classList.remove("hidden");
      }
      return;
    }
    if (!stockReady()) {
      alert(stockFailed() ? stockMsgFail() : stockMsgWait());
      return;
    }
    const key = "combo::" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    comboBag[key] = {
      label: comboDraft.label,
      price: comboDraft.price,
      devices: comboDraft.devices.slice(),
      pods: comboDraft.pods.slice(),
      gift: comboDraft.gift || null
    };
    if (!comboLineOrderable(key)) {
      const rows = comboShortageList(comboBag[key], key);
      delete comboBag[key];
      alert(stockMsgComboLimit(rows));
      return;
    }
    cart[key] = 1;
    saveCombos();
    saveCart();
    closeComboBuilder();
    renderCart();
    openCart();
  }

  function wireComboModal() {
    const modal = $("#comboModal");
    if (!modal || modal.dataset.wired) return;
    modal.dataset.wired = "1";
    on("#comboModalClose", "click", closeComboBuilder);
    on("#comboBackdrop", "click", closeComboBuilder);
    on("#comboAddBtn", "click", addComboToCart);
    const search = $("#comboPodSearch");
    if (search) {
      search.addEventListener("input", () => {
        if (!comboDraft) return;
        comboDraft.podQuery = search.value;
        const popt = $("#comboPodOpts");
        if (popt) popt.innerHTML = comboOptionButtons(comboDraft.podSlug, "pod");
        wireComboBuilderClicks();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) closeComboBuilder();
    });
  }

  function planRowLabel(p) {
    if (lang === "zh") return `${p.buy}送${p.free}${p.total ? `（共${p.total}盒）` : ""}`;
    return `${p.buy}+${p.free}${p.total ? ` (${p.total} boxes)` : ""}`;
  }

  function fillPlanTable(tbodyId, plans) {
    const body = document.getElementById(tbodyId);
    if (!body || !plans || !plans.length) return;
    body.innerHTML = plans.map((p) =>
      `<tr><td>${escapeHtml(planRowLabel(p))}</td><td>$${Number(p.price).toLocaleString("en-US")}</td></tr>`
    ).join("");
  }

  function renderMemberCombos() {
    wireComboModal();
    const body = document.getElementById("comboTableBody");
    if (!body) return;
    const mem = (STORE && STORE.membership) || {};
    const combos = mem.combos || [];
    if (combos.length) {
      body.innerHTML = combos.map((c, i) => {
        const label = comboLabel(c);
        return `<tr class="combo-row" tabindex="0" data-combo-i="${i}"><td>${escapeHtml(label)}</td><td>$${c.price}</td></tr>`;
      }).join("");
    }
    body.querySelectorAll(".combo-row").forEach((row) => {
      const open = () => {
        const list = (STORE && STORE.membership && STORE.membership.combos) || [];
        const c = list[Number(row.dataset.comboI)];
        if (c) openComboBuilder(c);
      };
      row.addEventListener("click", open);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
    fillPlanTable("podPlanTableBody", mem.podPlans);
    fillPlanTable("dispPlanTableBody", mem.dispPlans);
    fillPlanTable("floralPlanTableBody", mem.floralPenPlans);
  }

  /* ---------- promos & delivery strip ---------- */
  function goPromo(target) {
    if (target === "promo") {
      scrollTo(document.getElementById("promos"));
      return;
    }
    if (target === "membership") {
      const m = $("#membership");
      scrollTo(m);
      return;
    }
    if (target && CATEGORIES.some((c) => c.id === target)) {
      setNavActive(target);
      renderCats(target);
      renderProducts(target);
    } else {
      setNavActive("all");
      renderCats("all");
      renderProducts("all");
    }
    const catalog = $("#catalog");
    scrollTo(catalog);
  }

  function renderShipRule() {
    const totalEl = $("#cartTotal");
    if (!totalEl) return;
    const cfg = STORE.shipping || {};
    if (!document.getElementById("vp-ship-css")) {
      const style = document.createElement("style");
      style.id = "vp-ship-css";
      style.textContent = ".ship-rule{font-size:.82rem;opacity:.8;margin-top:8px;line-height:1.5}";
      document.head.appendChild(style);
    }
    let el = document.getElementById("shipRule");
    if (!el) {
      el = document.createElement("div");
      el.id = "shipRule";
      el.className = "ship-rule";
      const row = totalEl.closest(".total") || totalEl.parentNode;
      row.insertAdjacentElement("afterend", el);
    }
    const t = cartTotal();
    const n = cartCount();
    let msg;
    if (n === 0) {
      msg = lang === "zh"
        ? `運費：滿 $${cfg.freeAbove} 免運 · 未滿 $${cfg.freeAbove} 運費 $${cfg.fee}`
        : `Shipping: FREE over $${cfg.freeAbove} · $${cfg.fee} below`;
    } else if (t >= cfg.freeAbove) {
      msg = lang === "zh"
        ? `本單免運費（滿 $${cfg.freeAbove}）`
        : `This order ships FREE (over $${cfg.freeAbove})`;
    } else {
      msg = lang === "zh"
        ? `本單運費 $${cfg.fee}（未滿 $${cfg.freeAbove}）`
        : `Shipping $${cfg.fee} for this order (under $${cfg.freeAbove})`;
    }
    el.textContent = msg;
  }

  function renderPromos() {
    /* 「優惠與送貨」獨立區塊已取消；優惠內容改喺 #membership / 熱賣套餐顯示 */
    return;
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initHero();
    applyI18n();
    applyCatI18n();
    wireWaButtons();
    /* Render catalog even behind the 18+ overlay so Google sees the same HTML as users. */
    if (ageStatus !== "0") startCatalog();
    wirePdp();
    renderPromos();
    renderHotCombos();
    pruneUnpricedCart();
    renderCart();
    updateMemberUI();
    refreshMemberFromServer();
    injectWaWidget();
    wireSectionWa();
    renderMemberCombos();

    $$(".langbtn").forEach((btn) => {
      btn.textContent = lang === "en" ? "繁" : "EN";
      btn.onclick = () => {
        lang = lang === "en" ? "zh" : "en";
        localStorage.setItem(LS_LANG, lang);
        location.reload();
      };
    });

    injectBrandNav();
    initMobileNav();
    initDrawerEscape();
    initCartBar();
    wireCatalogAdds();
    applyCatalogStock();
    document.addEventListener("click", handleJumpClick);

    $$(".cartbtn").forEach((btn) => { btn.onclick = openCart; });
    on("#drawerClose", "click", closeCart);
    on("#overlay", "click", closeCart);
    on("#checkoutBtn", "click", checkout);

    $$("#memberBtn, #memLoginBtn, [data-open-member]").forEach((el) => {
      el.onclick = () => openMemberModal("login");
    });
    $$("#memJoinBtn, #memberJoinHeaderBtn, #memBonusJoinBtn, [data-open-member-join]").forEach((el) => {
      el.onclick = () => openMemberModal("join");
    });
    $$("[data-mem-tab]").forEach((el) => {
      el.onclick = () => setMemberAuthTab(el.getAttribute("data-mem-tab") || "login");
    });
    on("#memberModalClose", "click", closeMemberModal);
    on("#memberBackdrop", "click", closeMemberModal);
    on("#memberForm", "submit", joinMember);
    on("#memberLoginForm", "submit", loginMember);
    on("#memberLogout", "click", logoutMember);
    on("#newsForm", "submit", submitNewsletter);
    syncNewsForm();

    if (STORE.notice) {
      const n = document.createElement("div");
      n.className = "notice";
      n.textContent = t("notify");
      const header = $(".site-header") || $(".topbar") || $(".appbar");
      if (header && header.after) header.after(n);
      else document.body.prepend(n);
    }
  });

  /* expose cart for optional feature scripts (e.g. 3D showroom, view-cart bar, checkout) */
  window.Vapehouse = {
    add: addToCart,
    openCart: openCart,
    closeCart: closeCart,
    renderCart: renderCart,
    count: cartCount,
    total: cartTotal,
    wa: (msg) => waLink(msg),
    sendOrder: sendOrderWhatsApp,
    buildOrderMessage: buildOrderMessage,
    setOrderDetails: (name, area) => {
      orderName = name;
      orderArea = area;
      try { localStorage.setItem("vorder_name", name); } catch (e) {}
      try { localStorage.setItem("vorder_area", area); } catch (e) {}
    },
    setFlavor: setFlavor,
    getFlavor: (slug) => flavors[slug] || "",
    clearCart: clearCart,
    canCheckout: canPlaceOrder,
    ensureOrderable: ensureOrderableCart,
    memberActive: isMember,
    items: () => {
      pruneUnpricedCart();
      return Object.entries(cart).map(([lineKey, q]) => {
        if (isComboLine(lineKey)) {
          const meta = comboBag[lineKey];
          if (!meta) return null;
          return {
            slug: lineKey,
            qty: q,
            price: meta.price,
            name: meta.label || t("comboTitle"),
            flavor: comboSummaryText(meta),
            variantKey: ""
          };
        }
        const { slug, variantKey } = cartLineParts(lineKey);
        const p = PRODUCTS.find((x) => x.slug === slug);
        return {
          slug,
          qty: q,
          price: p ? unitPrice(p) : 0,
          name: p ? p[lang].name : slug,
          flavor: lineFlavorName(lineKey),
          variantKey: variantKey || flavorKeys[slug] || ""
        };
      }).filter((it) => {
        if (!it) return false;
        if (isComboLine(it.slug)) return true;
        const p = PRODUCTS.find((x) => x.slug === it.slug);
        return p && p.price != null;
      });
    }
  };
  window.VapehouseAdd = addToCart;

  document.addEventListener("vh-stock-ready", function () {
    pruneOosCart();
    applyCatalogStock();
  });
  document.addEventListener("vh-stock-error", function () {
    applyCatalogStock();
  });
})();
