// 顾客页面和 admin 共用的工具
(function () {
  const cfg = window.LSB_CONFIG || {};
  const hasSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

  // ---------- 网络：最多等几秒，失败自动再试一次（解决 iPhone 放久了回来会卡住） ----------
  function netFetch(input, init) {
    init = Object.assign({}, init || {});
    const method = String(init.method || (input && input.method) || "GET").toUpperCase();
    const isRead = method === "GET" || method === "HEAD";
    const url = typeof input === "string" ? input : (input && input.url) || "";
    const ms = isRead ? 12000 : (/\/storage\//.test(url) ? 60000 : 20000);
    const attempt = () => {
      const ctrl = new AbortController();
      const outer = init.signal;
      if (outer) { if (outer.aborted) ctrl.abort(); else outer.addEventListener("abort", () => ctrl.abort()); }
      const t = setTimeout(() => ctrl.abort(), ms);
      return fetch(input, Object.assign({}, init, { signal: ctrl.signal })).finally(() => clearTimeout(t));
    };
    return attempt().catch(err => {
      if (!isRead || (init.signal && init.signal.aborted)) throw err;
      return new Promise(r => setTimeout(r, 600)).then(attempt);   // 读取类的请求自动再试一次
    });
  }
  function isNetErr(e) {
    const m = String((e && (e.message || e.name)) || e || "");
    return /Load failed|Failed to fetch|NetworkError|network|AbortError|aborted|timeout/i.test(m);
  }

  let client = null;
  function sb() {
    if (!hasSupabase) return null;
    if (!client) client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { global: { fetch: netFetch } });
    return client;
  }

  const ICONS = {
    bread: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 34c-3-9 6-17 22-17s25 8 22 17c-1 3-3 4-6 4v12c0 2-2 4-4 4H20c-2 0-4-2-4-4V38c-3 0-5-1-6-4z"/><path d="M24 26l-3 6M33 25l-2 7M42 26l-2 6"/></svg>',
    cake: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 52V34c0-3 2-5 5-5h30c3 0 5 2 5 5v18"/><path d="M8 52h48"/><path d="M12 40c4 3 7 3 10 0s7-3 10 0 7 3 10 0 7-3 10 0"/><path d="M32 29v-7"/><path d="M32 22c-2-2-2-5 0-8 2 3 2 6 0 8z"/></svg>',
    sandwich: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40L34 14l22 22"/><path d="M8 40c6 1 10 3 14 2s8-5 12-4 8 3 12 1 7-3 10-3"/><path d="M8 40v6l26 4 22-10v-4"/><path d="M14 34l20-20"/></svg>',
    cookie: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="22"/><circle cx="24" cy="25" r="2.5"/><circle cx="38" cy="22" r="2"/><circle cx="40" cy="36" r="2.5"/><circle cx="26" cy="40" r="2"/><circle cx="33" cy="31" r="1.5"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-1.6 19.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 12 2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16l-1.5 10.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5z"/><path d="M8.5 7a3.5 3.5 0 0 1 7 0"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    school: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 42V22l18-12 18 12v20"/><path d="M4 42h40"/><rect x="19" y="30" width="10" height="12"/><circle cx="24" cy="21" r="4"/></svg>',
    catering: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 34h36"/><path d="M9 34a15 15 0 0 1 30 0"/><path d="M24 16v-3"/><path d="M4 40h40"/></svg>',
    box: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 15l18-9 18 9v18l-18 9-18-9z"/><path d="M6 15l18 9 18-9M24 24v18"/></svg>',
    leaf: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M32 60V10"/><path d="M32 18c-6-4-10-4-12 0 4 3 8 3 12 0zM32 18c6-4 10-4 12 0-4 3-8 3-12 0zM32 30c-6-4-10-4-12 0 4 3 8 3 12 0zM32 30c6-4 10-4 12 0-4 3-8 3-12 0zM32 42c-6-4-10-4-12 0 4 3 8 3 12 0zM32 42c6-4 10-4 12 0-4 3-8 3-12 0z"/></svg>',
    bagel: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><ellipse cx="32" cy="34" rx="24" ry="17"/><ellipse cx="32" cy="32" rx="7" ry="4.5"/><path d="M16 27l2-1M22 22l2 0M40 21l2 1M47 26l1 2M45 42l1-1M20 41l2 0"/></svg>',
    jar: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><rect x="20" y="10" width="24" height="8" rx="2"/><path d="M18 22c0-2 2-4 4-4h20c2 0 4 2 4 4v28c0 3-2 5-5 5H23c-3 0-5-2-5-5z"/><path d="M18 30h28M18 44h28"/></svg>',
    bag: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M16 22h32l-3 32H19z"/><path d="M24 22c0-6 4-10 8-10s8 4 8 10"/><circle cx="27" cy="36" r="4"/><circle cx="37" cy="40" r="4"/></svg>',
    loaf: '<svg viewBox="0 0 120 50" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 30C4 18 22 8 60 8s58 10 52 22c-3 7-16 12-52 12S11 37 8 30z"/><path d="M34 16l-6 14M54 14l-5 16M74 14l-5 16M94 17l-5 13"/></svg>'
  };

  function money(n) {
    return "RM " + (Number(n) || 0).toFixed(2);
  }

  // ---------- 产品资料 ----------
  // 新格式：specs = 规格 [{zh, en}]；options = 口味（每一行）[{label_zh, label_en, prices:[每个规格的价钱或 null], moq, sold_out, image_url, thumb_url}]
  // 旧格式（options 只有 price、flavors 是同价口味）会自动转换，不会坏掉
  const num = v => (v === null || v === undefined || v === "" || isNaN(Number(v))) ? null : Math.round(Number(v) * 100) / 100;
  function cleanRow(o, n) {
    const prices = [];
    for (let i = 0; i < n; i++) prices.push(num(o.prices ? o.prices[i] : (i === 0 ? o.price : null)));
    return {
      label_zh: o.label_zh || "", label_en: o.label_en || "", prices,
      moq: Math.max(1, parseInt(o.moq, 10) || 1), sold_out: !!o.sold_out,
      image_url: o.image_url || "", thumb_url: o.thumb_url || ""
    };
  }
  function convertLegacy(p) {
    const opts = Array.isArray(p.options) && p.options.length ? p.options : [{ label_zh: "", label_en: "", price: 0, moq: 1 }];
    const flavors = (Array.isArray(p.flavors) ? p.flavors : []).map(f => {
      if (typeof f === "string") { const [zh, en] = f.split("|"); return { zh: (zh || "").trim(), en: (en || "").trim() }; }
      return { zh: (f && f.zh) || "", en: (f && f.en) || "" };
    }).filter(f => f.zh || f.en);
    const lab = o => o.label_zh || o.label_en;
    if (flavors.length) {
      const specs = (opts.length > 1 || lab(opts[0])) ? opts.map(o => ({ zh: o.label_zh || o.label_en, en: o.label_en || "" })) : [];
      const moq = Math.max(...opts.map(o => parseInt(o.moq, 10) || 1));
      return { specs, rows: flavors.map(f => ({ label_zh: f.zh, label_en: f.en, prices: opts.map(o => o.price), moq, sold_out: !!p.sold_out })) };
    }
    if (opts.length > 1) return { specs: [], rows: opts.map(o => Object.assign({}, o, { prices: [o.price], sold_out: !!p.sold_out })) };
    const o = opts[0];
    return { specs: lab(o) ? [{ zh: o.label_zh || o.label_en, en: o.label_en || "" }] : [], rows: [{ label_zh: "", label_en: "", prices: [o.price], moq: o.moq, sold_out: !!p.sold_out }] };
  }
  function normalizeProduct(p, i) {
    const isNew = Array.isArray(p.options) && p.options.length && p.options.every(o => Array.isArray(o.prices));
    let specs, rows;
    if (isNew) { specs = Array.isArray(p.specs) ? p.specs : []; rows = p.options; }
    else ({ specs, rows } = convertLegacy(p));
    specs = specs.map(x => ({ zh: (x && (x.zh || x.label_zh)) || "", en: (x && (x.en || x.label_en)) || "" })).filter(x => x.zh || x.en);
    const n = Math.max(1, specs.length);
    rows = rows.map(r => cleanRow(r, n));
    return {
      id: p.id || ("demo-" + i),
      category_slug: p.category_slug || p.category || "",
      name_zh: p.name_zh || "",
      name_en: p.name_en || "",
      description_zh: p.description_zh || "",
      description_en: p.description_en || "",
      image_url: p.image_url || "",
      thumb_url: p.thumb_url || "",
      specs, rows,
      preorder_days: parseInt(p.preorder_days, 10) || 0,
      sold_out: rows.every(r => r.sold_out),
      popular: !!p.popular,
      hidden: !!p.hidden,
      quote_only: !!p.quote_only,
      addon: !!p.addon,
      sort: Number(p.sort) || 0,
      updated_at: p.updated_at || undefined   // 用来检查有没有被另一部装置改过
    };
  }
  // 存回资料库时的格式
  function productToRow(p) {
    return {
      specs: p.specs, options: p.rows, flavors: [], sold_out: p.rows.every(r => r.sold_out)
    };
  }
  // 小工具
  const P = {
    nSpec: p => Math.max(1, p.specs.length),
    price: (p, ri, si) => { const r = p.rows[ri]; return r ? r.prices[si || 0] : null; },
    sells: (p, ri, si) => { const v = P.price(p, ri, si); return v !== null && v !== undefined; },
    ok: (p, ri, si) => P.sells(p, ri, si) && !p.rows[ri].sold_out,
    single: p => p.rows.length === 1 && !(p.rows[0].label_zh || p.rows[0].label_en),
    rowName: r => r.label_zh || r.label_en || "",
    specName: (p, si) => { const s = p.specs[si || 0]; return s ? (s.zh || s.en) : ""; },
    label: (p, ri, si) => [P.single(p) ? "" : P.rowName(p.rows[ri] || {}), P.specName(p, si)].filter(Boolean).join(" · "),
    range: p => {
      const all = []; p.rows.forEach(r => r.prices.forEach(v => { if (v !== null) all.push(v); }));
      return all.length ? { min: Math.min(...all), max: Math.max(...all) } : { min: 0, max: 0 };
    },
    flavourCount: p => P.single(p) ? 0 : p.rows.length
  };

  function defaultSettings() {
    return Object.assign({}, (window.LSB_SEED && window.LSB_SEED.settings) || {});
  }

  // 读取全部资料（顾客页面用）
  async function loadCatalog() {
    if (!hasSupabase) {
      // 如果在 admin 示范模式改过资料，就用那份
      const d = window.LSB_DEMO && window.LSB_DEMO.load();
      if (d) {
        return {
          demo: true,
          settings: Object.assign(defaultSettings(), (d.settings[0] && d.settings[0].data) || {}),
          categories: d.categories.slice().sort((a, b) => a.sort - b.sort),
          products: d.products.map(normalizeProduct)
        };
      }
      const s = window.LSB_SEED;
      return {
        demo: true,
        settings: defaultSettings(),
        categories: s.categories.slice().sort((a, b) => a.sort - b.sort),
        products: s.products.map(normalizeProduct)
      };
    }
    // 顾客页面不载入 supabase-js（省流量），直接用一个请求拿全部菜单
    const base = cfg.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/";
    const headers = { apikey: cfg.SUPABASE_ANON_KEY };
    // 旧版 anon key（eyJ… 开头）还需要 Authorization；新版 publishable key 只要 apikey
    if (/^eyJ/.test(cfg.SUPABASE_ANON_KEY)) headers.Authorization = "Bearer " + cfg.SUPABASE_ANON_KEY;
    let data;
    const r = await netFetch(base + "rpc/get_catalog", { headers });
    if (r.ok) {
      data = await r.json();
    } else {
      // 旧版资料库（还没有 get_catalog）就分开拿
      const get = async q => { const x = await netFetch(base + q, { headers }); if (!x.ok) throw new Error("HTTP " + x.status); return x.json(); };
      const [st, cats, prods] = await Promise.all([
        get("settings?select=data&id=eq.1"), get("categories?select=*&order=sort"), get("products?select=*&hidden=eq.false&order=sort")
      ]);
      data = { settings: st[0] ? st[0].data : {}, categories: cats, products: prods };
    }
    return {
      demo: false,
      settings: Object.assign(defaultSettings(), data.settings || {}),
      categories: data.categories || [],
      products: (data.products || []).map(normalizeProduct)
    };
  }

  // ---------- 下单：存进后台，拿回订单号码 ----------
  async function placeOrder(order) {
    if (!hasSupabase) return window.LSB_DEMO ? window.LSB_DEMO.addOrder(order) : "";
    const headers = { apikey: cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json" };
    if (/^eyJ/.test(cfg.SUPABASE_ANON_KEY)) headers.Authorization = "Bearer " + cfg.SUPABASE_ANON_KEY;
    const r = await netFetch(cfg.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/rpc/place_order", { method: "POST", headers, body: JSON.stringify({ p: order }) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const code = await r.json();
    return typeof code === "string" ? code : "";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function waNumber(n) {
    let d = String(n || "").replace(/\D/g, "");
    if (d.startsWith("0")) d = "6" + d;           // 018xxxx → 6018xxxx
    return d;
  }

  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- WhatsApp 讯息格式 ----------
  // {名称} 会自动换成实际内容；某一行里的 {名称} 没有内容（例如自取没有地址），那一整行会自动省略
  const WA_DEFAULTS = {
    wa_order: "🤎 *LITTLE STORY BAKERY ORDER CONFIRMATION｜订单确认*\n🧾 *Order No. 订单号：{订单号}*\n\n*🧁 Order Details｜订单明细*\n{订单}\n\nSubtotal 小计：{小计}\nDelivery Fee 运费：{运费金额}\n*Total 总额：{总额}*\n\n*{资料标题}*\nName 姓名：{名字}\nAddress 地址：{地址}\nDate 日期：{日期}\nMethod 方式：{方式}\nNotes 备注：{备注}\n\n*💳 Payment Status 付款状态：*\n\nPlease check and confirm your order details. 请确认以上订单资料，谢谢！🤎",
    wa_item: "{产品} × {数量} — {金额}",
    wa_wholesale: "你好 {店名}！我想询问批发 🙂\nHi {店名}! I'd like to ask about wholesale.\n公司 / 店名 Company：\n想要的产品 Items：\n大概数量 Quantity：\n需要日期 Date needed：",
    wa_school: "你好 {店名}！我想询问学校订单 🙂\nHi {店名}! I'd like to ask about a school order.\n学校名字 School：\n人数 / 数量 Quantity：\n需要日期 Date needed：",
    wa_event: "你好 {店名}！我想询问活动 / 婚礼 / 企业餐点 🙂\nHi {店名}! I'd like to ask about catering for an event.\n活动类型 Event type：\n人数 Pax：\n活动日期 Event date：",
    wa_custom: "你好 {店名}！我想询问定制：{产品} 🎁\nHi {店名}! I'd like to ask about a custom order: {产品}\n用途 / 节日 Occasion：\n数量 Quantity：\n需要日期 Date needed：\n（参考图片我会另外发 I'll send reference photos separately）",
    wa_ask: "你好 {店名}！请问 {产品} 什么时候会再有货？\nHi {店名}! When will {产品} be available again?"
  };
  function fillTemplate(tpl, vars) {
    const out = [];
    String(tpl || "").replace(/\r/g, "").split("\n").forEach(line => {
      let missing = false;
      const done = line.replace(/\{([^{}\n]+)\}/g, (m, k) => {
        k = k.trim();
        if (!(k in vars)) return m;               // 不认识的 {..} 原样保留
        const v = vars[k];
        if (v == null || v === "") { missing = true; return ""; }
        return String(v);
      });
      if (!missing) out.push(done);
    });
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  // 组合下单讯息（顾客页面和 admin 预览共用，保证两边一模一样）
  // o = { items:[{name, opt, qty, amount}], subtotal, delivery, areaLabel, address, freeShip, date, name, note }
  function buildOrderMessage(settings, o) {
    const itemTpl = waTemplate(settings, "wa_item");
    const items = o.items.map((it, i) => fillTemplate(itemTpl, {
      "序号": String(i + 1),
      "产品": it.name + (it.opt ? ` (${it.opt})` : ""),
      "数量": String(it.qty),
      "金额": money(it.amount),
      "单价": money(it.amount / (it.qty || 1))
    })).join("\n");
    const feeKnown = !o.delivery || o.freeShip;
    return fillTemplate(waTemplate(settings, "wa_order"), {
      "店名": settings.shop_name || "Little Story Bakery",
      "订单号": o.code ? "#" + o.code : "",
      "订单": items,
      "小计": money(o.subtotal),
      "运费金额": feeKnown ? money(0) + (o.delivery ? "（免运 Free）" : "") : "待确认 TBC",
      "总额": feeKnown ? money(o.subtotal) : money(o.subtotal) + " + 运费 delivery",
      "资料标题": o.delivery ? "📦 Delivery Details｜配送资料" : "🛍️ Pickup Details｜自取资料",
      "方式": o.delivery ? `配送 Delivery — ${o.areaLabel}` : "自取 Self-pickup",
      "地址": o.delivery ? o.address : "",
      "运费": o.delivery ? (o.freeShip ? "免运费 Free delivery" : "Lalamove 运费由顾客承担 Delivery fee paid by customer") : "",
      "日期": o.date,
      "名字": o.name,
      "备注": o.note
    });
  }
  function waTemplate(settings, key) {
    const t = settings && settings[key];
    if (!(t && String(t).trim())) return WA_DEFAULTS[key];
    // 以前自己改过格式、里面没有 {订单号} 的，自动加在最上面
    if (key === "wa_order" && !/\{\s*订单号\s*\}/.test(t)) return "🧾 *Order No. 订单号：{订单号}*\n" + t;
    return t;
  }

  // ---------- 新版本提示 ----------
  // 定时检查 GitHub 上的档案有没有变；有变就在上方显示"有新版本 · 重新载入"
  // files：要检查的档案；beforeReload()：回传 false 就不重新载入（例如还有没保存的修改）
  function watchUpdates(files, beforeReload) {
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return;
    const hash = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return h; };
    const read = async () => {
      const parts = await Promise.all(files.map(f => fetch(f, { cache: "no-cache" }).then(r => r.ok ? r.text() : "")));
      return hash(parts.join("\u0000"));
    };
    let base = null, shown = false, checking = false, last = 0;
    async function check(force) {
      if (shown || checking || document.hidden) return;
      if (!force && Date.now() - last < 60000) return;
      checking = true; last = Date.now();
      try {
        const h = await read();
        if (base === null) base = h;
        else if (h !== base) show();
      } catch (e) {}
      checking = false;
    }
    function show() {
      shown = true;
      if (!document.getElementById("lsbUpd")) {
        const st = document.createElement("style");
        st.textContent = "#lsbUpd{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translate(-50%,-140%);z-index:200;display:flex;align-items:center;gap:10px;background:#4C3320;color:#FFF6EA;padding:8px 8px 8px 16px;border-radius:999px;box-shadow:0 10px 30px rgba(40,26,16,.3);font-size:13.5px;transition:transform .35s cubic-bezier(.2,.8,.2,1);max-width:calc(100% - 24px);white-space:nowrap}#lsbUpd.on{transform:translate(-50%,0)}#lsbUpd button{font:inherit;border:0;cursor:pointer;border-radius:999px}#lsbUpd .go{background:#FFF6EA;color:#4C3320;padding:7px 14px;font-weight:600}#lsbUpd .no{background:none;color:#D9C3A6;padding:4px 6px;font-size:16px;line-height:1}";
        document.head.appendChild(st);
        const el = document.createElement("div");
        el.id = "lsbUpd"; el.setAttribute("role", "status");
        el.innerHTML = '<span>✨ 有新版本 · New version</span><button class="go" type="button">重新载入</button><button class="no" type="button" aria-label="稍后">✕</button>';
        document.body.appendChild(el);
        el.querySelector(".go").onclick = () => { if (beforeReload && beforeReload() === false) return; location.reload(); };
        el.querySelector(".no").onclick = () => { el.classList.remove("on"); setTimeout(() => { shown = false; base = null; }, 600000); };
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on")));
      } else document.getElementById("lsbUpd").classList.add("on");
    }
    check(true);
    document.addEventListener("visibilitychange", () => check(false));
    window.addEventListener("focus", () => check(false));
    setInterval(() => check(true), 300000);
    return { check: () => check(true) };
  }

  // ---------- 公告 & 不能取货的日子（顾客页面和 admin 共用） ----------
  // S.weekly   = { rest:[5], block:[6], msg_zh, msg_en }       数字 0=星期日 … 6=星期六
  // S.holidays = [{ id, rest_from, rest_to, from, to, reason_zh, reason_en }]   from/to = 顾客不能取货的日子
  // S.notices  = [{ id, title_zh, title_en, body_zh, body_en, star, until, created }]
  const WD_ZH = ["日", "一", "二", "三", "四", "五", "六"];
  const WD_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const D = {
    ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); },
    parse(s) { const [y, m, d] = String(s || "").split("-").map(Number); return y ? new Date(y, m - 1, d, 12) : null; },
    add(s, n) { const d = D.parse(s); d.setDate(d.getDate() + n); return D.ymd(d); },
    today() { return D.ymd(new Date()); },
    zh(s) { const d = D.parse(s); return d ? d.getDate() + "/" + (d.getMonth() + 1) : ""; },
    en(s) { const d = D.parse(s); return d ? d.getDate() + " " + MON_EN[d.getMonth()] : ""; },
    wd(s) { const d = D.parse(s); return d ? d.getDay() : -1; }
  };
  const sched = {
    D, WD_ZH, WD_EN,
    weekly(S) { const w = (S && S.weekly) || {}; return { rest: Array.isArray(w.rest) ? w.rest : [], block: Array.isArray(w.block) ? w.block : [], msg_zh: w.msg_zh || "", msg_en: w.msg_en || "", title_zh: w.title_zh || "", title_en: w.title_en || "" }; },
    // 建议的标题（自己没写标题时用这个）
    weeklyTitle(block) { return { zh: sched.days(block) + "没有货，不能取货 / 配送", en: "No pickup or delivery on " + sched.days(block, true) }; },
    holidayTitle(from, to) { return { zh: sched.rangeZh(from, to) + " 不能取货 / 配送", en: "No pickup or delivery " + sched.rangeEn(from, to) }; },
    holidays(S) { return ((S && S.holidays) || []).filter(h => h && h.from && h.to).slice().sort((a, b) => a.from < b.from ? -1 : 1); },
    notices(S) { return ((S && S.notices) || []).filter(n => n && (n.title_zh || n.title_en || n.body_zh || n.body_en)); },
    // 这一天顾客能不能取货
    blocked(S, day) {
      if (!day) return false;
      if (sched.weekly(S).block.includes(D.wd(day))) return true;
      return sched.holidays(S).some(h => day >= h.from && day <= h.to);
    },
    nextOpen(S, day) { let d = day; for (let i = 0; i < 120 && sched.blocked(S, d); i++) d = D.add(d, 1); return d; },
    rangeZh(a, b) { return a === b ? D.zh(a) : D.zh(a) + " – " + D.zh(b); },
    rangeEn(a, b) { if (a === b) return D.en(a); const x = D.parse(a), y = D.parse(b); return x.getMonth() === y.getMonth() ? x.getDate() + " – " + D.en(b) : D.en(a) + " – " + D.en(b); },
    days(list, en) { return list.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => en ? WD_EN[d] + "s" : "星期" + WD_ZH[d]).join(en ? " & " : "、"); },
    autoMsg(rest, block) {
      if (!block.length) return { zh: "", en: "" };
      if (!rest.length) return { zh: "", en: "" };
      return {
        zh: "我们" + sched.days(rest) + "休息不做面包，所以" + sched.days(block) + "没有新鲜面包。" + (rest.some(r => !block.includes(r)) ? sched.days(rest.filter(r => !block.includes(r))) + "可以照常取货 🙂" : ""),
        en: "We rest on " + sched.days(rest, true) + " (no baking), so there's no fresh bread on " + sched.days(block, true) + "." + (rest.some(r => !block.includes(r)) ? " " + sched.days(rest.filter(r => !block.includes(r)), true).replace(/s\b/g, "").replace(/day\b/g, "day") + " pickup is fine." : "")
      };
    },
    // 公告板上要显示的卡片（已经排好顺序）
    board(S, today) {
      today = today || D.today();
      const out = [];
      const live = sched.notices(S).filter(n => !n.until || n.until >= today);
      const star = live.find(n => n.star);
      if (star) out.push({ kind: "star", n: star });
      const w = sched.weekly(S);
      if (w.block.length) { const t = sched.weeklyTitle(w.block); out.push({ kind: "weekly", w,
        title_zh: w.title_zh || t.zh, title_en: w.title_zh ? w.title_en : (w.title_en || t.en) }); }
      sched.holidays(S).filter(h => h.to >= today).forEach(h => {
        const back = sched.nextOpen(S, D.add(h.to, 1));
        const t = sched.holidayTitle(h.from, h.to);
        out.push({ kind: "holiday", h, back,
          title_zh: h.title_zh || t.zh, title_en: h.title_zh ? (h.title_en || "") : (h.title_en || t.en),
          body_zh: [h.reason_zh, D.zh(back) + " 起照常"].filter(Boolean).join("，") + "。",
          body_en: [h.reason_en, "Back on " + D.en(back)].filter(Boolean).join(". ") + "." });
      });
      live.filter(n => n !== star).sort((a, b) => String(b.created || "").localeCompare(String(a.created || ""))).forEach(n => out.push({ kind: "notice", n }));
      return out;
    },
    // 网站最上面的横条：重要公告 > 14 天内的放假 > 旧版公告横幅
    topBar(S, today) {
      today = today || D.today();
      const star = sched.notices(S).find(n => n.star && (!n.until || n.until >= today));
      if (star) return { zh: "⭐ " + (star.title_zh || star.title_en), en: star.title_zh ? star.title_en : "" };
      const h = sched.holidays(S).find(h => h.to >= today && h.from <= D.add(today, 14));
      if (h) return { zh: "🛌 " + sched.rangeZh(h.from, h.to) + " 不能取货", en: "Closed " + sched.rangeEn(h.from, h.to) };
      if (!Array.isArray(S.notices) && S.announcement) return { zh: S.announcement, en: "" };
      return null;
    },
    // 选日期下面的一行提示
    hint(S, today) {
      today = today || D.today();
      const zh = [], en = [];
      const w = sched.weekly(S);
      if (w.block.length) { zh.push(sched.days(w.block) + "没有货"); en.push("No pickup on " + sched.days(w.block, true)); }
      sched.holidays(S).filter(h => h.to >= today && h.from <= D.add(today, 90)).forEach(h => {
        zh.push(sched.rangeZh(h.from, h.to) + " " + (h.reason_zh || "休息")); en.push("Closed " + sched.rangeEn(h.from, h.to));
      });
      return zh.length ? { zh: zh.join(" · "), en: en.join(" · ") } : null;
    }
  };

  window.LSB = { cfg, hasSupabase, sb, ICONS, money, normalizeProduct, productToRow, P, loadCatalog, placeOrder, netFetch, isNetErr, esc, waNumber, store, defaultSettings, WA_DEFAULTS, fillTemplate, waTemplate, buildOrderMessage, watchUpdates, sched };
})();
