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
        x.id = "demo-" + (++n);
        return x;
      }),
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

  function client() {
    let db = load() || seedDb();
    save(db);
    let n = Date.now();

    function query(table) {
      let op = "select", payload = null, single = false, orderKey = null;
      const filters = [];
      const b = {
        select() { return b; },
        order(k) { orderKey = k; return b; },
        eq(k, v) { filters.push([k, v]); return b; },
        maybeSingle() { single = true; return b; },
        update(p) { op = "update"; payload = p; return b; },
        insert(p) { op = "insert"; payload = p; return b; },
        upsert(p) { op = "upsert"; payload = p; return b; },
        delete() { op = "delete"; return b; },
        then(res, rej) {
          const rows = db[table];
          const match = r => filters.every(([k, v]) => r[k] === v);
          let data = null, error = null;
          if (op === "select") {
            data = rows.filter(match);
            if (orderKey) data.sort((a, c) => (a[orderKey] || 0) - (c[orderKey] || 0));
            data = JSON.parse(JSON.stringify(data));
            if (single) data = data[0] || null;
          } else {
            if (op === "update") rows.filter(match).forEach(r => Object.assign(r, payload));
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

  window.LSB_DEMO = { client, load, KEY };
})();
