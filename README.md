# Little Story Bakery · 网上菜单 + WhatsApp 下单

顾客在网站选产品 → 选自取 / 配送和日期 → 一键打开 WhatsApp，订单内容已经整理好，按发送就完成。
店主用 `admin.html` 自己改菜单、上传照片、设售罄。

## 档案说明

| 档案 | 用途 |
|---|---|
| `index.html` | 顾客看的网站 |
| `admin.html` | 店主后台（要登入） |
| `config.js` | 填 Supabase 网址和 key |
| `shared.js` / `seed-data.js` | 共用程式 / 初始菜单资料 |
| `images/` | 初始菜单的产品照片（已压缩），`images/t/` 是小图 |
| `demo-backend.js` | 示范模式（还没连 Supabase 时用） |
| `supabase-setup.sql` | 在 Supabase 跑一次，建立资料表和权限 |
| `supabase-update-2.sql` | 第二次更新：规格 + 口味照片、订单表、合并产品（跑完 setup 之后再跑一次） |
| `og-image.jpg`、`icon-*.png`、`manifest.webmanifest` | WhatsApp 连结预览图、手机桌面图示 |
| `sw.js` | 把网站和照片存在顾客手机里，下次打开更快 |
| `.github/workflows/keep-alive.yml` | 每 3 天叫醒 Supabase，避免免费版暂停 |

还没填 `config.js` 之前是**示范模式**：
- 打开 `admin.html` → 按「进入示范模式」，可以试用后台全部功能（加产品、贴照片、售罄、改设定）。
- 示范模式的改动存在这台装置的浏览器里，`index.html` 也会跟着显示，可以从头到尾试一次下单流程。
- 后台右上角「重置」可以恢复原本的菜单。
- 连上 Supabase 之后，示范资料不会带过去，正式资料用「导入初始菜单」重新开始。

---

## 设定步骤（只做一次）

### 1. Supabase

1. 到 [supabase.com](https://supabase.com) 建立新项目，Region 选 **Southeast Asia (Singapore)**。
2. 打开 `supabase-setup.sql`，把最下面的 `YOUR-EMAIL@gmail.com` 换成店主登入用的 email。
3. Supabase 后台 → **SQL Editor** → New query → 贴上整个档案 → **Run**。接着用同样方法跑 `supabase-update-2.sql`。
4. **Authentication → Users → Add user → Create new user**：填同一个 email 和密码，勾选 *Auto Confirm User*。
5. **Authentication → Sign In / Providers**：把 *Allow new users to sign up* 关掉（多一层保险）。
6. **Project Settings → API**：复制 *Project URL* 和 *anon public* key，填进 `config.js`：

```js
window.LSB_CONFIG = {
  SUPABASE_URL: "https://xxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```

> anon key 放在网站上是正常的。资料库已经设好权限：所有人只能"看"，只有 `admins` 表里的 email 登入后才能改。

### 2. GitHub Pages

1. 在 GitHub 建立新的 **Public** repository（例如 `littlestory-bakery`）。
2. 把整个资料夹的档案上传上去。
   ⚠️ 用网页拖拉上传时，`.github` 这个隐藏资料夹常常会漏掉。请另外在 GitHub 按 **Add file → Create new file**，档名打 `.github/workflows/keep-alive.yml`，把档案内容贴进去。
3. **Settings → Pages** → Source 选 *Deploy from a branch* → Branch 选 `main` / `/ (root)` → Save。
4. 一两分钟后网站会在：`https://你的帐号.github.io/littlestory-bakery/`
   后台在：`https://你的帐号.github.io/littlestory-bakery/admin.html`
5. 回到 Supabase → **Authentication → URL Configuration** → *Site URL* 填后台网址（忘记密码的 email 会带回这里）。
6. GitHub → **Actions** 页 → 如果有提示就按启用 → 选 *Keep Supabase awake* → **Run workflow** 跑一次，确认是绿色 ✓。

### 3. 第一次登入

打开 `admin.html` → 登入 → 按 **导入初始菜单**，就会把现有菜单放进资料库。之后在后台慢慢补照片、改资料就好。

---

## 店主日常使用

- **售罄**：产品列表每个口味旁边都有开关。按完下面会出现「有 N 个改动还没保存」，按 **保存** 才会生效（看到绿色 ✓ 已保存）。
- **新增产品**：右下角"+ 新增产品"。
- **照片**：可以 📷 上传 / 拍照、📋 贴上图片、长按框框贴上、电脑 Ctrl+V，或直接拖进来。照片会自动压缩到大约 100–200KB，按"保存"才会上传；换照片或删除产品时，旧照片也会自动删掉，不会占空间。
- **规格**：编辑产品时按规格按钮（整条、盒装…，可以选多个，再按一次取消）。名字可以改，例如「盒装 (2片)」。常用规格在「设定」里可以自己改。
- **口味 & 价钱**：一个口味一格，可以放照片（📷 或 📋 贴上）、↑↓ 换顺序。有两个规格时每个口味有两格价钱，**留空 = 那个规格不卖这个口味**。「全部口味都是 RM__ 套用到全部」可以一次填好。
- **订单**：顾客按「WhatsApp 发送订单」时会自动存进「订单」页（有订单号码，例如 #1029-05）。可以打勾已付款、⋯ 里确认订单、编辑、写店家备注、填 Lalamove 运费、已交货、取消。超过一年的订单自动删除。
- **备货**：选日期，自动算出每样产品要准备几份（可以只算已付款的）。
- **预订**：填"需要提前几天预订"，顾客选日期时会自动挡掉太早的日子。
- **热门推荐**：打开就会出现在首页的"热门推荐"。
- **隐藏**：暂时不卖但不想删除。
- **只询价**：定制品不显示价钱，顾客按下去直接 WhatsApp 询问。
- **设定**：WhatsApp 号码、网站 logo、注册号码、常用规格、免运费地区和金额、公告横幅、关于我们、首页大图、WhatsApp 讯息格式、社交链接。
- **连结预览图**：`og-image.jpg` 的网址写在 `index.html` 里（https://littlestorybakery.github.io/catalogue/og-image.jpg）。换网址的话要一起改。
- **图片空间**：产品页最上面会显示用了多少（免费版 1GB，压缩后大约可以放几千张）。

## 订单规则（目前的设定）

- 自取：没有最低消费，确认订单后才发地址给顾客。
- 配送：Cheras 满 RM50 免运费；Cheras 未满 RM50 或其他地区，Lalamove 运费由顾客承担。
- 付款：不在网站处理，店主在 WhatsApp 确认订单时再讲。
- 批发 / 学校 / 活动：网站下方有专门的询问按钮，WhatsApp 讯息会自动带上要填的资料。

## 省流量设计（让 Supabase 一直用免费版）

- **初始菜单的照片放在 GitHub**（`images/` 资料夹），完全不用 Supabase 流量。只有之后在 admin 上传的照片才存到 Supabase。
- **上传时自动压缩成两张**：产品卡片用的小图（约 20–30KB），点开产品才载入大图（约 100–150KB）。顾客逛菜单时只下载小图。
- **照片存在顾客手机里**：看过的照片下次打开不会再下载，网站也会更快，网络差的时候也能看到菜单。
- **一个请求拿全部菜单**：顾客每次打开网站只跟 Supabase 拿一次资料（大约十几 KB），而且不载入 Supabase 的程式库。
- **换照片、删产品时，旧照片会自动删掉**，不会占空间。
- **每 3 天自动 ping 一次**，避免免费版因为 7 天没人用而暂停。

可以在 Supabase → **Usage** 页面看用量。以小 bakery 的访问量，正常情况下离免费额度很远。
