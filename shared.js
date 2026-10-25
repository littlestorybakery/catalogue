// 顾客页面和 admin 共用的工具
(function () {
  const cfg = window.LSB_CONFIG || {};
  const hasSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

  let client = null;
  function sb() {
    if (!hasSupabase) return null;
    if (!client) client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
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

  function normalizeProduct(p, i) {
    const opts = Array.isArray(p.options) && p.options.length ? p.options : [{ label_zh: "", label_en: "", price: 0, moq: 1 }];
    return {
      id: p.id || ("demo-" + i),
      category_slug: p.category_slug || p.category || "",
      name_zh: p.name_zh || "",
      name_en: p.name_en || "",
      description_zh: p.description_zh || "",
      description_en: p.description_en || "",
      image_url: p.image_url || "",
      thumb_url: p.thumb_url || "",
      options: opts.map(o => ({
        label_zh: o.label_zh || "", label_en: o.label_en || "",
        price: Number(o.price) || 0, moq: Math.max(1, parseInt(o.moq, 10) || 1)
      })),
      flavors: (Array.isArray(p.flavors) ? p.flavors : []).map(f => {
        if (typeof f === "string") { const [zh, en] = f.split("|"); return { zh: (zh || "").trim(), en: (en || "").trim() }; }
        return { zh: (f && f.zh) || "", en: (f && f.en) || "" };
      }).filter(f => f.zh || f.en),
      preorder_days: parseInt(p.preorder_days, 10) || 0,
      sold_out: !!p.sold_out,
      popular: !!p.popular,
      hidden: !!p.hidden,
      quote_only: !!p.quote_only,
      addon: !!p.addon,
      sort: Number(p.sort) || 0,
      updated_at: p.updated_at || undefined   // 用来检查有没有被另一部装置改过
    };
  }

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
    const r = await fetch(base + "rpc/get_catalog", { headers });
    if (r.ok) {
      data = await r.json();
    } else {
      // 旧版资料库（还没有 get_catalog）就分开拿
      const get = async q => { const x = await fetch(base + q, { headers }); if (!x.ok) throw new Error("HTTP " + x.status); return x.json(); };
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
    wa_order: "🤎 *LITTLE STORY BAKERY ORDER CONFIRMATION｜订单确认*\n\n*🧁 Order Details｜订单明细*\n{订单}\n\nSubtotal 小计：{小计}\nDelivery Fee 运费：{运费金额}\n*Total 总额：{总额}*\n\n*{资料标题}*\nName 姓名：{名字}\nAddress 地址：{地址}\nDate 日期：{日期}\nMethod 方式：{方式}\nNotes 备注：{备注}\n\n*💳 Payment Status 付款状态：*\n\nPlease check and confirm your order details. 请确认以上订单资料，谢谢！🤎",
    wa_item: "{产品} × {数量} — {金额}",
    wa_wholesale: "你好 {店名}！我想询问批发 🙂\n公司 / 店名：\n想要的产品：\n大概数量：\n需要日期：",
    wa_school: "你好 {店名}！我想询问学校订单 🙂\n学校名字：\n人数 / 数量：\n需要日期：",
    wa_event: "你好 {店名}！我想询问活动 / 婚礼 / 企业餐点 🙂\n活动类型：\n人数：\n活动日期：",
    wa_custom: "你好 {店名}！我想询问定制：{产品} 🎁\n用途 / 节日：\n数量：\n需要日期：\n（参考图片我会另外发）",
    wa_ask: "你好 {店名}！请问 {产品} 什么时候会再有货？"
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
      "订单": items,
      "小计": money(o.subtotal),
      "运费金额": feeKnown ? money(0) + (o.delivery ? "（免运 Free）" : "") : "待确认 TBC",
      "总额": feeKnown ? money(o.subtotal) : money(o.subtotal) + " + 运费",
      "资料标题": o.delivery ? "📦 Delivery Details｜配送资料" : "🛍️ Pickup Details｜自取资料",
      "方式": o.delivery ? `配送 Delivery — ${o.areaLabel}` : "自取 Self-pickup",
      "地址": o.delivery ? o.address : "",
      "运费": o.delivery ? (o.freeShip ? "免运费" : "Lalamove 运费由顾客承担") : "",
      "日期": o.date,
      "名字": o.name,
      "备注": o.note
    });
  }
  function waTemplate(settings, key) {
    const t = settings && settings[key];
    return (t && String(t).trim()) ? t : WA_DEFAULTS[key];
  }

  window.LSB = { cfg, hasSupabase, sb, ICONS, money, normalizeProduct, loadCatalog, esc, waNumber, store, defaultSettings, WA_DEFAULTS, fillTemplate, waTemplate, buildOrderMessage };
})();
