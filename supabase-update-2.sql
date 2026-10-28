-- =====================================================================
-- Little Story Bakery · 更新 2（规格 & 口味、订单、合并产品）
-- 用法：Supabase → SQL Editor → New query → 贴上全部 → Run
-- 可以重复跑，不会重复合并或弄坏资料。
-- 请先把新的网站档案上传到 GitHub，再跑这一段。
-- =====================================================================

-- ---------- 1. 产品加"规格"栏位 ----------
alter table public.products add column if not exists specs jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists thumb_url text not null default '';
alter table public.products add column if not exists addon boolean not null default false;
alter table public.products add column if not exists flavors jsonb not null default '[]'::jsonb;

-- ---------- 2. 订单 ----------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                 -- 订单号码，例如 1029-05
  created_at   timestamptz not null default now(),
  order_date   date,                                 -- 取货 / 配送日期
  method       text not null default 'pickup',       -- pickup / delivery
  area         text not null default '',
  name         text not null default '',
  address      text not null default '',
  note         text not null default '',             -- 顾客备注
  items        jsonb not null default '[]'::jsonb,
  subtotal     numeric(10,2) not null default 0,
  free_ship    boolean not null default false,
  delivery_fee numeric(10,2),                        -- 店家填的运费
  paid         boolean not null default false,
  status       text not null default 'new' check (status in ('new','confirmed','done','cancelled')),
  store_note   text not null default '',             -- 店家备注（顾客看不到）
  updated_at   timestamptz not null default now()
);
create index if not exists orders_date_idx on public.orders (order_date);
create index if not exists orders_created_idx on public.orders (created_at);

alter table public.orders enable row level security;
drop policy if exists "admin all orders" on public.orders;
create policy "admin all orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
revoke all on public.orders from anon;
grant select, insert, update, delete on public.orders to authenticated;

-- 顾客下单：只能透过这个函数（检查资料、防止狂发、产生订单号码）
create or replace function public.place_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text; v_day text; v_n int;
begin
  if p is null or jsonb_typeof(p->'items') <> 'array'
     or jsonb_array_length(p->'items') = 0 or jsonb_array_length(p->'items') > 60 then
    raise exception 'invalid order';
  end if;
  if length(coalesce(p->>'name','')) < 1 or length(p->>'name') > 80 then raise exception 'invalid name'; end if;
  if length(coalesce(p->>'address','')) > 300 or length(coalesce(p->>'note','')) > 500 then raise exception 'too long'; end if;
  if length(p::text) > 30000 then raise exception 'too big'; end if;

  -- 同一个人两分钟内重复发同一张单：回传同一个号码，不会重复
  select code into v_code from public.orders
   where lower(name) = lower(p->>'name') and items = p->'items' and created_at > now() - interval '2 minutes'
   order by created_at desc limit 1;
  if v_code is not null then return v_code; end if;

  -- 防止被狂发：10 分钟内最多 40 张新订单
  if (select count(*) from public.orders where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'too many orders, please try again later';
  end if;

  -- 一年前的订单自动删除
  delete from public.orders where created_at < now() - interval '1 year';

  perform pg_advisory_xact_lock(4242);
  v_day := to_char(now() at time zone 'Asia/Kuala_Lumpur', 'MMDD');
  select count(*) + 1 into v_n from public.orders where code like v_day || '-%' and created_at > now() - interval '3 days';
  v_code := v_day || '-' || lpad(v_n::text, 2, '0');
  while exists (select 1 from public.orders where code = v_code) loop
    v_n := v_n + 1; v_code := v_day || '-' || lpad(v_n::text, 2, '0');
  end loop;

  insert into public.orders (code, order_date, method, area, name, address, note, items, subtotal, free_ship)
  values (v_code, nullif(p->>'date','')::date, left(coalesce(p->>'method','pickup'),20), left(coalesce(p->>'area',''),40),
          left(p->>'name',80), left(coalesce(p->>'address',''),300), left(coalesce(p->>'note',''),500),
          p->'items', coalesce(nullif(p->>'subtotal','')::numeric,0), coalesce((p->>'free_ship')::boolean,false));
  return v_code;
end;
$$;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- ---------- 3. 旧格式的产品自动转换成"规格 + 口味" ----------
do $$
declare
  r record; opts jsonb; fl jsonb; v_specs jsonb; v_rows jsonb; has_label boolean;
begin
  for r in
    select * from public.products
    where jsonb_array_length(options) = 0
       or exists (select 1 from jsonb_array_elements(options) o where not (o ? 'prices'))
  loop
    opts := case when jsonb_array_length(r.options) = 0
                 then '[{"label_zh":"","label_en":"","price":0,"moq":1}]'::jsonb else r.options end;
    fl := coalesce(r.flavors, '[]'::jsonb);
    has_label := coalesce(opts->0->>'label_zh','') <> '' or coalesce(opts->0->>'label_en','') <> '';

    if jsonb_array_length(fl) > 0 then
      -- 同价口味：口味变成一行一行；原本的规格变成"规格"
      v_specs := case when jsonb_array_length(opts) > 1 or has_label then
        (select jsonb_agg(jsonb_build_object('zh', coalesce(nullif(o->>'label_zh',''), o->>'label_en',''), 'en', coalesce(o->>'label_en','')) order by k)
           from jsonb_array_elements(opts) with ordinality t(o,k))
        else '[]'::jsonb end;
      v_rows := (select jsonb_agg(jsonb_build_object(
          'label_zh', coalesce(f->>'zh',''), 'label_en', coalesce(f->>'en',''),
          'prices', (select jsonb_agg(nullif(o->>'price','')::numeric order by k) from jsonb_array_elements(opts) with ordinality t(o,k)),
          'moq', (select max(coalesce(nullif(o->>'moq','')::int,1)) from jsonb_array_elements(opts) o),
          'sold_out', r.sold_out, 'image_url', '', 'thumb_url', '') order by j)
        from jsonb_array_elements(fl) with ordinality u(f,j));
    elsif jsonb_array_length(opts) > 1 then
      -- 多个规格（例如葡挞 原味/巧克力）：每个变成一行
      v_specs := '[]'::jsonb;
      v_rows := (select jsonb_agg(jsonb_build_object(
          'label_zh', coalesce(o->>'label_zh',''), 'label_en', coalesce(o->>'label_en',''),
          'prices', jsonb_build_array(nullif(o->>'price','')::numeric),
          'moq', coalesce(nullif(o->>'moq','')::int,1), 'sold_out', r.sold_out, 'image_url', '', 'thumb_url', '') order by k)
        from jsonb_array_elements(opts) with ordinality t(o,k));
    else
      -- 只有一个价钱
      v_specs := case when has_label then jsonb_build_array(jsonb_build_object(
          'zh', coalesce(nullif(opts->0->>'label_zh',''), opts->0->>'label_en',''), 'en', coalesce(opts->0->>'label_en','')))
        else '[]'::jsonb end;
      v_rows := jsonb_build_array(jsonb_build_object('label_zh','','label_en','',
          'prices', jsonb_build_array(nullif(opts->0->>'price','')::numeric),
          'moq', coalesce(nullif(opts->0->>'moq','')::int,1), 'sold_out', r.sold_out, 'image_url','', 'thumb_url',''));
    end if;

    update public.products set specs = v_specs, options = v_rows, flavors = '[]'::jsonb where id = r.id;
  end loop;
end $$;

-- ---------- 4. 合并产品 ----------
-- 保留名单里第一个找到的产品，其他的删掉；热门推荐、预订天数会保留
create or replace function pg_temp.lsb_merge(names text[], new_zh text, new_en text, v_specs jsonb, v_rows jsonb,
                                             v_desc_zh text, v_desc_en text, cover text, cover_t text, make_addon boolean)
returns text language plpgsql as $$
declare keep uuid; v_pop boolean; v_pre int; n_del int;
begin
  select id into keep from public.products where name_zh = any(names)
   order by array_position(names, name_zh), sort limit 1;
  if keep is null then return new_zh || '：找不到，跳过'; end if;
  -- 已经合并过（只剩一个、名字对、已经是新格式）：不再改，免得盖掉之后在 admin 改过的东西
  if (select count(*) from public.products where name_zh = any(names)) = 1
     and (select name_zh = new_zh and jsonb_array_length(specs) > 0 from public.products where id = keep) then
    return new_zh || '：之前已经合并过，跳过';
  end if;
  select bool_or(popular), max(preorder_days) into v_pop, v_pre from public.products where name_zh = any(names);
  update public.products set
    name_zh = new_zh, name_en = new_en, specs = v_specs, options = v_rows, flavors = '[]'::jsonb,
    description_zh = coalesce(v_desc_zh, description_zh), description_en = coalesce(v_desc_en, description_en),
    popular = coalesce(v_pop,false), preorder_days = coalesce(v_pre,0),
    image_url = case when cover is not null and image_url = '' then cover else image_url end,
    thumb_url = case when cover_t is not null and thumb_url = '' then cover_t else thumb_url end,
    addon = case when make_addon then true else addon end,
    sold_out = false, hidden = false, quote_only = false, updated_at = now()
  where id = keep;
  delete from public.products where name_zh = any(names) and id <> keep;
  get diagnostics n_del = row_count;
  return new_zh || '：合并完成（删掉 ' || n_del || ' 个旧产品）';
end $$;

select pg_temp.lsb_merge(
  array['低糖蛋糕卷','宇治抹茶红豆蛋糕卷','特色蛋糕卷'], '低糖蛋糕卷', 'Low-Sugar Swiss Roll',
  '[{"zh":"盒装","en":"Box"}]',
  '[{"label_zh":"原味","label_en":"Original","prices":[15],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"班兰","label_en":"Pandan","prices":[15],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"巧克力","label_en":"Chocolate","prices":[15],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"咖啡","label_en":"Coffee","prices":[15],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"柠檬","label_en":"Lemon","prices":[15],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"蓝莓果酱","label_en":"Blueberry","prices":[16],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"咸口黑芝麻","label_en":"Salty Black Sesame","prices":[16],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"宇治抹茶红豆","label_en":"Uji Matcha Red Bean","prices":[18],"moq":1,"sold_out":false,"image_url":"","thumb_url":""}]',
  '低糖', 'Low sugar', null, null, false) as 结果
union all
select pg_temp.lsb_merge(
  array['提拉米苏','咖啡提拉米苏','抹茶提拉米苏','芒果提拉米苏','蓝莓提拉米苏','焦糖饼提拉米苏','奥利奥提拉米苏'], '提拉米苏', 'Tiramisu',
  '[{"zh":"盒装","en":"Box"}]',
  '[{"label_zh":"咖啡","label_en":"Coffee","prices":[12],"moq":1,"sold_out":false,"image_url":"images/tiramisu-coffee.webp","thumb_url":"images/t/tiramisu-coffee.webp"},
    {"label_zh":"芒果","label_en":"Mango","prices":[12],"moq":1,"sold_out":false,"image_url":"images/tiramisu-mango.webp","thumb_url":"images/t/tiramisu-mango.webp"},
    {"label_zh":"蓝莓","label_en":"Blueberry","prices":[12],"moq":1,"sold_out":false,"image_url":"images/tiramisu-blueberry.webp","thumb_url":"images/t/tiramisu-blueberry.webp"},
    {"label_zh":"焦糖饼","label_en":"Lotus Biscoff","prices":[12],"moq":1,"sold_out":false,"image_url":"images/tiramisu-lotus.webp","thumb_url":"images/t/tiramisu-lotus.webp"},
    {"label_zh":"奥利奥","label_en":"Oreo","prices":[12],"moq":1,"sold_out":false,"image_url":"images/tiramisu-oreo.webp","thumb_url":"images/t/tiramisu-oreo.webp"},
    {"label_zh":"抹茶","label_en":"Matcha","prices":[13],"moq":1,"sold_out":false,"image_url":"images/tiramisu-matcha.webp","thumb_url":"images/t/tiramisu-matcha.webp"}]',
  '手指饼干制作，低糖', 'Made with ladyfingers, low sugar', 'images/tiramisu-real.webp', 'images/t/tiramisu-real.webp', false)
union all
select pg_temp.lsb_merge(
  array['奶酪酱','蓝莓奶酪酱','蔓越莓奶酪酱','奥利奥奶酪酱','焦糖饼干奶酪酱','焙茶奶酪酱','茉莉绿茶奶酪酱','草莓奶酪酱','开心果奶酪酱','8口味奶酪酱礼盒'], '奶酪酱', 'Cream Cheese',
  '[{"zh":"罐 (50g)","en":"Jar (50g)"}]',
  '[{"label_zh":"蔓越莓","label_en":"Cranberry","prices":[4.00],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"蓝莓","label_en":"Blueberry","prices":[4.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"奥利奥","label_en":"Oreo","prices":[4.80],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"焦糖饼干","label_en":"Lotus Biscoff","prices":[4.80],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"焙茶","label_en":"Hojicha","prices":[6.00],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"茉莉绿茶","label_en":"Jasmine Green Tea","prices":[6.00],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"草莓","label_en":"Strawberry","prices":[6.40],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"开心果","label_en":"Pistachio","prices":[7.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"8口味礼盒","label_en":"8-Flavour Gift Pack","prices":[40.00],"moq":1,"sold_out":false,"image_url":"images/cream-cheese-gift.webp","thumb_url":"images/t/cream-cheese-gift.webp"}]',
  '手工奶酪酱', 'Handmade cream cheese', 'images/cream-cheese.webp', 'images/t/cream-cheese.webp', true)
union all
select pg_temp.lsb_merge(
  array['黄油酱','烤蒜粒黄油','芥末海藻黄油'], '黄油酱', 'Butter Spread',
  '[{"zh":"罐 (50g)","en":"Jar (50g)"}]',
  '[{"label_zh":"烤蒜粒","label_en":"Roasted Garlic","prices":[6.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"芥末海藻","label_en":"Seaweed Mustard","prices":[6.80],"moq":1,"sold_out":false,"image_url":"","thumb_url":""}]',
  '手工黄油酱', 'Handmade butter spread', 'images/butter-spreads.webp', 'images/t/butter-spreads.webp', true)
union all
select pg_temp.lsb_merge(
  array['贝果','原味贝果','黑白芝麻贝果','燕麦贝果','罂粟籽贝果','南瓜子贝果','紫薯贝果（馅）','巧克力贝果','双重巧克力贝果（馅）','墨西哥辣椒美式腊肠贝果（馅）'], '贝果', 'Bagel',
  '[{"zh":"个","en":"pc"}]',
  '[{"label_zh":"原味","label_en":"Plain","prices":[4.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"南瓜子","label_en":"Pumpkin Seed","prices":[5.30],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"黑白芝麻","label_en":"Black & White Sesame","prices":[5.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"燕麦","label_en":"Oat","prices":[5.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"罂粟籽","label_en":"Poppy Seed","prices":[5.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"巧克力","label_en":"Chocolate","prices":[5.80],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"紫薯（馅）","label_en":"Purple Sweet Potato (filled)","prices":[6.00],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"双重巧克力（馅）","label_en":"Double Chocolate Chips (filled)","prices":[7.50],"moq":1,"sold_out":false,"image_url":"","thumb_url":""},
    {"label_zh":"墨西哥辣椒美式腊肠（馅）","label_en":"Jalapeño Pepperoni (filled)","prices":[8.00],"moq":1,"sold_out":false,"image_url":"","thumb_url":""}]',
  '', '', 'images/bagel-pumpkin-plain.webp', 'images/t/bagel-pumpkin-plain.webp', false);

-- ---------- 5. 其他小调整 ----------
-- 香蕉蛋糕：只卖整条
update public.products set
  specs = '[{"zh":"整条 (32cm)","en":"Whole (32cm)"}]',
  options = '[{"label_zh":"","label_en":"","prices":[22.00],"moq":1,"sold_out":false,"image_url":"","thumb_url":""}]',
  updated_at = now()
where name_zh = '香蕉蛋糕' and specs = '[]'::jsonb;
update public.products set
  specs = '[{"zh":"整条 (19cm)","en":"Whole (19cm)"}]',
  options = '[{"label_zh":"","label_en":"","prices":[25.00],"moq":1,"sold_out":false,"image_url":"","thumb_url":""}]',
  updated_at = now()
where name_zh = '双倍香蕉蛋糕' and specs = '[]'::jsonb;
-- 4粒装、5粒装：规格写"袋装"
update public.products set specs = '[{"zh":"袋装","en":"Bag"}]', updated_at = now()
where name_zh in ('4粒装小面包','5粒装原味小餐包') and specs = '[]'::jsonb;

-- ---------- 6. 结果（检查用） ----------
select name_zh as 产品,
       (select string_agg(coalesce(s->>'zh',''), ' / ') from jsonb_array_elements(specs) s) as 规格,
       jsonb_array_length(options) as 口味数量
from public.products
where name_zh in ('低糖蛋糕卷','提拉米苏','奶酪酱','黄油酱','贝果','香蕉蛋糕','双倍香蕉蛋糕','4粒装小面包','5粒装原味小餐包')
order by name_zh;
