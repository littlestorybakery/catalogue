// 初始菜单资料 —— 网站还没连上 Supabase 时用来预览（示范模式），
// admin 页面也可以一键把这些资料导入 Supabase。
// 价钱来自店家的零售价目表（2026）。部分中英文名称、介绍是整理 / 翻译的，可以在 admin 里改。
(function () {
  // 小工具：P(分类, 中文名, 英文名, 价钱或规格, 其他设定)
  let sortN = {};
  function P(cat, zh, en, price, x) {
    sortN[cat] = (sortN[cat] || 0) + 1;
    x = x || {};
    const options = Array.isArray(price)
      ? price.map(o => ({ label_zh: o[0], label_en: o[1], price: o[2], moq: o[3] || 1 }))
      : [{ label_zh: "", label_en: "", price: price, moq: 1 }];
    return {
      category: cat, name_zh: zh, name_en: en, options,
      description_zh: x.d || "", description_en: x.de || "",
      image_url: x.img ? "images/" + x.img + ".webp" : "",
      thumb_url: x.img ? "images/t/" + x.img + ".webp" : "",
      flavors: x.f || [], popular: !!x.pop, quote_only: !!x.quote, hidden: !!x.hidden, addon: !!x.addon,
      preorder_days: x.pre || 0, sort: sortN[cat]
    };
  }

  let buns = [
    ["红豆面包", "Red Bean Bun", 4.00, "bun-red-bean"], ["咖椰牛油面包", "Kaya Butter Bun", 4.00, "bun-kaya-butter"], ["马六甲糖椰丝面包", "Gula Melaka Coconut Bun", 4.00, "bun-gula-melaka"],
    ["牛油面包", "Butter Sugar Bun", 4.00, "bun-butter-sugar"], ["蒜蓉面包", "Garlic Bun", 4.00, "bun-garlic"], ["美乃滋鸡丝面包", "Chicken Floss Mayo Bun", 4.00, "bun-chicken-floss-mayo"],
    ["原味香肠面包", "Hotdog Bun (Original)", 4.00, "bun-hotdog"], ["原味火腿面包", "Ham Bun (Original)", 4.00], ["牛油花生面包", "Peanut Butter Bun", 4.00, "bun-peanut-butter"],
    ["甜起司面包 (2粒)", "Sugar Cheese Bun (2 pcs)", 4.00, "bun-sugar-cheese"], ["黑芝麻面包", "Black Sesame Bun", 4.00, "bun-black-sesame"], ["巧克力米面包", "Chocolate Rice Bun", 4.00, "bun-chocolate-rice"],
    ["蓝莓果酱面包", "Blueberry Bun", 4.00, "bun-blueberry"], ["迷你香肠 (2粒)", "Mini Hotdog (2 pcs)", 4.00, "bun-mini-hotdog"], ["迷你火腿 (2粒)", "Mini Ham (2 pcs)", 4.00, "bun-mini-ham"],
    ["迷你披萨 (2粒)", "Mini Pizza (2 pcs)", 4.00],
    ["起司面包", "Butter Cheese Bun", 4.30, "bun-butter-cheese"], ["火腿起司面包", "Ham Cheese Bun", 4.30, "bun-ham-cheese"], ["香肠起司面包", "Hotdog Cheese Bun", 4.30, "bun-hotdog-cheese"],
    ["原味火腿鸡丝面包", "Chicken Floss Ham (Original)", 4.30], ["辣味火腿鸡丝面包", "Chicken Floss Ham (Spicy)", 4.30, "bun-spicy-floss-ham"],
    ["墨西哥面包", "Mexican Bun", 4.30, "bun-mexican"], ["核桃香草面包", "Walnut Vanilla Bun", 4.30, "bun-walnut-vanilla"], ["金枪鱼面包", "Tuna Bun", 4.30, "bun-tuna"],
    ["鱼柳起司面包", "Fish Fillet Cheese Bun", 4.30, "bun-fish-fillet"], ["帕马森香肠面包", "Parmesan Sausage Bun", 4.30, "bun-parmesan-sausage"], ["起司条", "Cheese Stick", 4.30, "bun-cheese-stick"],
    ["洋葱起司面包", "Onion Cheese Bun", 4.30, "bun-onion-cheese"], ["原味肉松面包", "Floss Bun (Original)", 4.30, "bun-floss-ori"], ["辣味肉松面包", "Floss Bun (Spicy)", 4.30, "bun-floss-spicy"],
    ["菠萝包", "Polo Bun", 4.30, "bun-polo"], ["香肠金枪鱼面包", "Hotdog Tuna Bun", 4.30], ["香肠美乃滋蛋面包", "Hotdog Mayo Egg Bun", 4.30],
    ["蒜香香肠面包", "Garlic Hotdog Bun", 4.30, "bun-garlic-hotdog"], ["沙丁鱼面包", "Fluffy Sardine Bun", 4.30, "bun-sardine"], ["夏威夷披萨", "Hawaiian Pizza Bun", 4.30, "bun-hawaiian"],
    ["肉桂葡萄干面包", "Raisin Cinnamon Bun", 4.30, "bun-raisin-cinnamon"], ["紫薯面包", "Purple Sweet Potato Bun", 4.30, "bun-purple-sweet-potato"], ["斑斓莲蓉面包", "Pandan Lotus Bun", 4.30],
    ["马铃薯咖喱面包", "Curry Potato Bun", 4.30, "bun-curry-potato"], ["蘑菇洋葱披萨", "Mushroom Onion Pizza Bun", 4.30, "bun-mushroom-pizza"], ["参巴江鱼仔面包", "Sambal Ikan Bilis Bun", 4.30, "bun-sambal-ikan-bilis"],
    ["巧克力酱面包", "Chocolate Jam Bun", 4.70, "bun-chocolate-jam"], ["芋头麻薯面包", "Yam Mochi Bun", 4.90, "bun-yam-mochi"],
    ["奶酪酱香肠面包", "Nacho Cheese Sausage Bun", 5.20, "bun-nacho-sausage"], ["抹茶麻薯大红豆面包", "Matcha Red Bean Mochi Bun", 5.20]
   ].map(b => P("buns", b[0], b[1], b[2], { img: b[3] }));
  // 有照片但价目表没有价钱 —— 先隐藏，在 admin 填价钱、关掉"隐藏"就会出现
  buns.push(
    P("buns", "奶油椰丝面包", "Butter Coconut Bun", 0, { img: "bun-butter-coconut", hidden: true }),
    P("buns", "谷粮面包", "Multigrain / Oat Bun", 0, { img: "bun-multigrain", hidden: true, d: "低糖、健康、微软", de: "Low sugar, wholesome" }),
    P("buns", "香肠花面包", "Hotdog Flower Bun", 0, { img: "bun-hotdog-flower", hidden: true })
  );

  const products = buns.concat([
    // ---- 包装面包 & 吐司 ----
    P("packs", "4粒装小面包", "4-pc Filled Buns", 7.20, { d: "4粒装 · 有馅", de: "4 buns per pack, with filling",
      f: ["红豆 | Red bean", "咖椰牛油 | Kaya butter", "黑芝麻 | Black sesame", "起司 | Cheese", "糖牛油 | Butter sugar", "椰子 | Coconut"] }),
    P("packs", "5粒装原味小餐包", "5-pc Kosong Buns", 8.70, { d: "5粒装 · 无馅，适合早餐", de: "5 plain buns per pack",
      f: ["全麦 | Wholemeal", "南瓜 | Pumpkin", "马铃薯 | Potato", "斑斓葡萄干 | Pandan raisin", "南瓜葡萄干 | Pumpkin raisin", "黑芝麻 | Black sesame"] }),
    P("packs", "盐面包", "Salted Butter Roll", 10.00, { img: "salted-butter-roll", pop: true,
      d: "2粒装。100% 纯牛油，外脆内软，咸香牛油味", de: "2 pcs/pack. 100% pure butter, crisp outside & soft inside" }),
    P("packs", "韩国麻薯面包", "Korean Mochi Bun", 7.50, { img: "mochi-bun",
      d: "4粒装。韧口有嚼劲的麻薯口感，黑芝麻香，带微微咸口", de: "4 pcs/pack. Chewy mochi texture with black sesame" }),
    P("packs", "巧克力坚果扭扭棒", "Chocolate Nut Energy Bar", 8.50, { img: "energy-bar",
      d: "约 130–150g。核桃、开心果、巧克力豆、美国黑葡萄干；无蛋、无糖、无油，有饱腹感，适合早餐或健身",
      de: "Approx. 130–150g. Walnut, pistachio, dark choc chips, raisins. No egg, sugar or oil" }),
    P("packs", "黑麦核桃葡萄干面包", "Rye Wholemeal Walnut Raisin Bun", 10.50, { img: "rye-walnut-raisin",
      d: "约 200g。黑麦面粉加多种谷粮，无蛋、少糖、少油，饱腹感满满", de: "Approx. 200g. Rye & multigrain, no egg, low sugar" }),
    P("packs", "斑斓椰油吐司", "Pandan Coconut Oil Loaf", [["红糖", "Brown sugar", 12.00], ["葡萄干", "Raisin", 10.50]], { img: "pandan-loaf",
      d: "约 250g。斑斓汁、100% 椰油和椰浆，无蛋，椰香浓、微甜", de: "Approx. 250g. Pandan, 100% coconut oil & coconut milk, egg-free" }),
    P("packs", "蒜蓉面包", "Garlic Bread", 19.00, { d: "4粒装一袋", de: "4 pcs per bag" }),

    // ---- 贝果 ----
    P("bagels", "原味贝果", "Plain Bagel", 4.50, { img: "bagel-pumpkin-plain" }),
    P("bagels", "黑白芝麻贝果", "Black & White Sesame Bagel", 5.50, { img: "bagel-sesame-oat" }),
    P("bagels", "燕麦贝果", "Oat Bagel", 5.50, { img: "bagel-sesame-oat" }),
    P("bagels", "罂粟籽贝果", "Poppy Seed Bagel", 5.50, { img: "bagel-mix" }),
    P("bagels", "南瓜子贝果", "Pumpkin Seed Bagel", 5.30, { img: "bagel-pumpkin-plain" }),
    P("bagels", "紫薯贝果（馅）", "Purple Sweet Potato Bagel", 6.00, { img: "bagel-mix", d: "有馅", de: "With filling" }),
    P("bagels", "巧克力贝果", "Chocolate Plain Bagel", 5.80, { img: "bagel-mix" }),
    P("bagels", "双重巧克力贝果（馅）", "Double Chocolate Chips Bagel", 7.50, { img: "bagel-mix", d: "有馅", de: "With filling" }),
    P("bagels", "墨西哥辣椒美式腊肠贝果（馅）", "Jalapeño Pepperoni Bagel", 8.00, { img: "bagel-mix", pop: true, d: "有馅，微辣", de: "With filling, mildly spicy" }),

    // ---- 蛋糕 & 甜点 ----
    P("cakes", "咖啡提拉米苏", "Coffee Tiramisu", 12.00, { img: "tiramisu-coffee", pop: true,
      d: "手指饼干制作。浓郁咖啡香，经典原味，低糖", de: "Made with ladyfingers. Classic coffee, low sugar" }),
    P("cakes", "抹茶提拉米苏", "Matcha Tiramisu", 13.00, { img: "tiramisu-matcha",
      d: "手指饼干制作。清香抹茶配奶香，微苦回甘，低糖", de: "Made with ladyfingers. Fragrant matcha, low sugar" }),
    P("cakes", "芒果提拉米苏", "Mango Tiramisu", 12.00, { img: "tiramisu-mango",
      d: "手指饼干制作。芒果果酱和果肉，清新不腻", de: "Made with ladyfingers. Mango jam & fruit" }),
    P("cakes", "蓝莓提拉米苏", "Blueberry Tiramisu", 12.00, { img: "tiramisu-blueberry",
      d: "手指饼干制作。酸甜蓝莓果酱，清爽开胃", de: "Made with ladyfingers. Sweet-tangy blueberry" }),
    P("cakes", "焦糖饼提拉米苏", "Lotus Biscoff Tiramisu", 12.00, { img: "tiramisu-lotus",
      d: "手指饼干制作。焦糖饼干碎铺满表面，香脆咸香", de: "Made with ladyfingers. Topped with Biscoff crumbs" }),
    P("cakes", "奥利奥提拉米苏", "Oreo Tiramisu", 12.00, { img: "tiramisu-oreo",
      d: "手指饼干制作。奥利奥碎配奶香，层层交融", de: "Made with ladyfingers. Oreo crumbs & cream" }),
    P("cakes", "低糖蛋糕卷", "Low-Sugar Swiss Roll", [["2片", "2 pcs", 5.00], ["盒装", "Box", 15.00]], {
      f: ["原味 | Original", "班兰 | Pandan", "巧克力 | Chocolate", "咖啡 | Coffee", "柠檬 | Lemon"] }),
    P("cakes", "宇治抹茶红豆蛋糕卷", "Uji Matcha Red Bean Swiss Roll", [["2片", "2 pcs", 7.00], ["盒装", "Box", 18.00]]),
    P("cakes", "特色蛋糕卷", "Special Swiss Roll", [["2片", "2 pcs", 6.00], ["盒装", "Box", 16.00]], {
      f: ["咸口黑芝麻 | Salty black sesame", "蓝莓果酱 | Blueberry"] }),
    P("cakes", "迷你水果塔", "Mini Fruit Tart", 30.00, { img: "fruit-tart", d: "8粒装。奶香微甜，新鲜水果", de: "8 pcs. Custard cream & fresh fruit" }),
    P("cakes", "葡挞", "Portuguese Tart", [["原味", "Original", 3.80], ["巧克力", "Chocolate", 4.20]]),
    P("cakes", "香蕉蛋糕", "Banana Cake", [["整条 (32cm)", "Block (32cm)", 22.00], ["盒装 (2片)", "Box (2 pcs)", 6.50, 2]], { img: "banana-cake", pop: true }),
    P("cakes", "双倍香蕉蛋糕", "Double Banana Cake", [["整条 (19cm)", "Block (19cm)", 25.00], ["盒装 (2片)", "Box (2 pcs)", 7.50]], { img: "double-banana-cake" }),

    // ---- 三明治 ----
    P("sandwiches", "鸡蛋芝士三明治", "Egg & Cheese", 7.00, { img: "sw-egg-cheese", d: "番茄、芝士、生菜、美乃滋、黄瓜、鸡蛋", de: "Tomato, cheese, lettuce, mayo, cucumber, egg" }),
    P("sandwiches", "鸡胸肉三明治", "Chicken Breast", 10.00, { img: "sw-chicken-breast", pop: true, d: "番茄、鸡胸肉、生菜、美乃滋", de: "Tomato, chicken breast, lettuce, mayo" }),
    P("sandwiches", "马铃薯沙拉三明治", "Potato Salad", 6.00, { img: "sw-potato-salad", d: "鸡蛋、红萝卜、生菜、美乃滋、黄瓜", de: "Egg, carrot, lettuce, mayo, cucumber" }),
    P("sandwiches", "鸡肉火腿蛋三明治", "Chicken Ham & Egg", 8.00, { img: "sw-chicken-ham-egg", d: "番茄、鸡蛋、鸡肉火腿、生菜、美乃滋、黄瓜", de: "Tomato, egg, chicken ham, lettuce, mayo, cucumber" }),
    P("sandwiches", "金枪鱼三明治", "Tuna", 7.00, { img: "sw-tuna", d: "金枪鱼、生菜、美乃滋、黄瓜、黑胡椒", de: "Tuna, lettuce, mayo, cucumber, black pepper" }),
    P("sandwiches", "蛋沙拉三明治", "Egg Mayo", 5.00, { img: "sw-egg-mayo", d: "生菜、美乃滋、鸡蛋、黑胡椒", de: "Lettuce, mayo, egg, black pepper" }),

    // ---- 抹酱 (50g)：和贝果放同一个分类 ----
    P("bagels", "8口味奶酪酱礼盒", "8-Flavour Cream Cheese Pack", 40.00, { img: "cream-cheese-gift", pop: true,
      d: "蓝莓、奥利奥、蔓越莓、焦糖饼干、焙茶、开心果、茉莉绿茶、草莓各一盒，适合分享和送礼", de: "One of each cream cheese flavour — perfect for sharing & gifting" }),
    P("bagels", "蓝莓奶酪酱", "Blueberry Cream Cheese", 4.50, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "蔓越莓奶酪酱", "Cranberry Cream Cheese", 4.00, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "奥利奥奶酪酱", "Oreo Cream Cheese", 4.80, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "焦糖饼干奶酪酱", "Lotus Biscoff Cream Cheese", 4.80, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "焙茶奶酪酱", "Hojicha Cream Cheese", 6.00, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "茉莉绿茶奶酪酱", "Jasmine Green Tea Cream Cheese", 6.00, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "草莓奶酪酱", "Strawberry Cream Cheese", 6.40, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "开心果奶酪酱", "Pistachio Cream Cheese", 7.50, { img: "cream-cheese", addon: true, d: "50g 手工奶酪酱", de: "50g" }),
    P("bagels", "烤蒜粒黄油", "Roasted Garlic Butter", 6.50, { img: "butter-spreads", addon: true, d: "50g 手工黄油酱", de: "50g" }),
    P("bagels", "芥末海藻黄油", "Seaweed Mustard Butter", 6.80, { img: "butter-spreads", addon: true, d: "50g 手工黄油酱", de: "50g" }),

    // ---- 饼干 & 节庆定制 ----
    P("cookies", "巧克力曲奇饼", "Chocolate Chip Cookies", 9.20, { d: "9块装", de: "9 pcs" }),
    P("cookies", "节庆定制饼干 / 礼盒", "Festive Custom Cookies & Gift Boxes", 0, { quote: true,
      d: "节日、婚礼、公司活动都可以定制，欢迎 WhatsApp 询价", de: "Custom orders for festivals, weddings & events — enquire via WhatsApp" })
  ]);

  window.LSB_SEED = {
    version: "2026-10-18-thumbs",
    settings: {
      shop_name: "Little Story Bakery",
      tagline_zh: "用烘焙，记录生活的小确幸",
      tagline_en: "Baked with heart, for your everyday little joys.",
      whatsapp: "60182252881",
      free_delivery_area: "Cheras",
      free_delivery_min: 50,
      delivery_note_zh: "Cheras 区满 RM50 免运费；其他地区 Lalamove 运费由顾客承担。",
      delivery_note_en: "Free delivery in Cheras for orders RM50+. Other areas: Lalamove fee paid by customer.",
      pickup_note_zh: "自取没有最低消费，确认订单后会把取货地址发给您。",
      pickup_note_en: "No minimum for self-pickup. Pickup address will be sent after order confirmation.",
      announcement: "",
      about_points: [
        "纯手工制作 | Handmade",
        "新鲜制作面包 | Freshly baked",
        "新鲜自制内馅 | Fresh homemade fillings",
        "毫无防腐剂 | No preservatives",
        "无猪肉，肉类都是鸡肉 | No pork — chicken only",
        "零售 · 批发 · 可定制 | Retail · Wholesale · Custom orders"
      ],
      instagram: "https://www.instagram.com/littlestory_bakery/",
      facebook: "https://www.facebook.com/littlestorybakery",
      google: "https://share.google/qG8O30CNKfFKZsIuy",
      hero_image: ""
    },
    categories: [
      { slug: "buns", name_zh: "面包", name_en: "Buns", icon: "bread", sort: 1 },
      { slug: "packs", name_zh: "包装面包 & 吐司", name_en: "Bread Packs & Loaves", icon: "bag", sort: 2 },
      { slug: "bagels", name_zh: "贝果 & 抹酱", name_en: "Bagels & Spreads", icon: "bagel", sort: 3 },
      { slug: "cakes", name_zh: "蛋糕 & 甜点", name_en: "Cakes & Desserts", icon: "cake", sort: 4 },
      { slug: "sandwiches", name_zh: "三明治", name_en: "Sandwiches", icon: "sandwich", sort: 5 },
      { slug: "cookies", name_zh: "饼干 & 节庆定制", name_en: "Cookies & Custom Orders", icon: "cookie", sort: 6 }
    ],
    products: products
  };
})();
