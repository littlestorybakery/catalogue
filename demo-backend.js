// 示范模式：还没连接 Supabase 时，用这台装置的浏览器储存（localStorage）假装是资料库。
// 只给预览 / 试玩用，资料只存在这台装置，别人看不到。
(function () {
  const KEY = "lsb_demo_db";

  function seedDb() {
    const s = window.LSB_SEED;
    let n = 0;
    return {
      version: s.version,
      settings: [{ id: 1, data: Object.assign({}, s.settings) }],
      categories: s.categories.map(c => Object.assign({ image_url: "" }, c)),
      products: s.products.map(p => {
        const x = window.LSB.normalizeProduct(p, n);
        const out = Object.assign({}, x, window.LSB.productToRow(x));
        delete out.rows;
        out.id = "demo-" + (++n);
        return out;
      }),
      orders: [],
      files: {}
    };
  }

  function load() {
    try {
      const v = localStorage.getItem(KEY);
      if (v) {
        const d = JSON.parse(v);
        // 菜单更新过（seed-data.js 的 version 变了）就重新开始
        if (d && d.version === (window.LSB_SEED && window.LSB_SEED.version)) return d;
      }
    } catch (e) {}
    return null;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return null; }
    catch (e) { return { message: "示范模式的储存空间满了（浏览器限制约 5MB），可以按「重置示范资料」清空。" }; }
  }

  // 示范模式下单：存在这台装置，产生和真的一样格式的订单号码
  function addOrder(o) {
    const db = load() || seedDb();
    db.orders = db.orders || [];
    const now = new Date();
    const same = db.orders.find(x => x.name.toLowerCase() === String(o.name).toLowerCase() &&
      JSON.stringify(x.items) === JSON.stringify(o.items) && now - new Date(x.created_at) < 120000);
    if (same) return same.code;
    const day = String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
    let k = db.orders.filter(x => x.code.startsWith(day + "-")).length + 1, code;
    do { code = day + "-" + String(k++).padStart(2, "0"); } while (db.orders.some(x => x.code === code));
    db.orders.push({
      id: "ord-" + now.getTime(), code, created_at: now.toISOString(), order_date: o.date || null,
      method: o.method || "pickup", area: o.area || "", name: o.name || "", address: o.address || "", note: o.note || "",
      items: o.items || [], subtotal: Number(o.subtotal) || 0, free_ship: !!o.free_ship, delivery_fee: null,
      paid: false, status: "new", store_note: "", updated_at: now.toISOString()
    });
    save(db);
    return code;
  }

  function client() {
    let db = load() || seedDb();
    save(db);
    let n = Date.now();

    function query(table) {
      let op = "select", payload = null, single = false, orderKey = null, asc = true, lim = null;
      const filters = [], ranges = [];
      const b = {
        select() { return b; },
        order(k, o) { orderKey = k; asc = !(o && o.ascending === false); return b; },
        limit(x) { lim = x; return b; },
        gte(k, v) { ranges.push([k, v, 1]); return b; },
        lte(k, v) { ranges.push([k, v, -1]); return b; },
        eq(k, v) { filters.push([k, v]); return b; },
        maybeSingle() { single = true; return b; },
        update(p) { op = "update"; payload = p; return b; },
        insert(p) { op = "insert"; payload = p; return b; },
        upsert(p) { op = "upsert"; payload = p; return b; },
        delete() { op = "delete"; return b; },
        then(res, rej) {
          db = load() || db;                       // 每次都读最新的（顾客页面可能刚下了单）
          db[table] = db[table] || [];
          const rows = db[table];
          const match = r => filters.every(([k, v]) => r[k] === v) &&
            ranges.every(([k, v, d]) => d > 0 ? String(r[k] ?? "") >= String(v) : String(r[k] ?? "") <= String(v));
          let data = null, error = null;
          if (op === "select") {
            data = rows.filter(match);
            if (orderKey) data.sort((a, c) => {
              const x = a[orderKey], y = c[orderKey];
              const r = (typeof x === "number" && typeof y === "number") ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
              return asc ? r : -r;
            });
            if (lim) data = data.slice(0, lim);
            data = JSON.parse(JSON.stringify(data));
            if (single) data = data[0] || null;
          } else {
            if (op === "update") { const hit = rows.filter(match); hit.forEach(r => Object.assign(r, payload)); data = JSON.parse(JSON.stringify(hit)); }
            if (op === "insert") [].concat(payload).forEach(r => rows.push(Object.assign({ id: "demo-" + (++n) }, r)));
            if (op === "upsert") [].concat(payload).forEach(r => {
              const key = r.id !== undefined ? "id" : "slug";
              const ex = rows.find(x => x[key] === r[key]);
              ex ? Object.assign(ex, r) : rows.push(r);
            });
            if (op === "delete") db[table] = rows.filter(r => !match(r));
            error = save(db);
          }
          return Promise.resolve({ data, error }).then(res, rej);
        }
      };
      return b;
    }

    const mem = {};
    const MARK = "#/storage/v1/object/public/product-images/";
    const bucket = {
      async upload(path, blob) {
        const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
        mem[path] = url;
        db.files[path] = { size: blob.size };   // 图片本身只存在产品资料里，避免重复占空间
        return { error: save(db) };
      },
      getPublicUrl(path) { return { data: { publicUrl: (mem[path] || "") + MARK + path } }; },
      async list(folder) {
        return { data: Object.keys(db.files).filter(k => k.startsWith(folder + "/")).map(k => ({ name: k, metadata: { size: db.files[k].size } })), error: null };
      },
      async remove(paths) { paths.forEach(p => delete db.files[p]); return { error: save(db) }; }
    };

    return {
      demo: true,
      from: query,
      rpc: async () => ({ data: true, error: null }),
      storage: { from: () => bucket },
      auth: {
        onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
        signInWithPassword: async () => ({ error: null }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: { user: { email: "demo" } } } }),
        resetPasswordForEmail: async () => ({ error: null }),
        updateUser: async () => ({ error: null })
      },
      reset() { try { localStorage.removeItem(KEY); } catch (e) {} }
    };
  }

  window.LSB_DEMO = { client, load, addOrder, KEY };
})();
