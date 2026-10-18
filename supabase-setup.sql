-- =====================================================================
-- Little Story Bakery · Supabase 设置
-- 用法：Supabase 后台 → SQL Editor → New query → 贴上全部 → Run
-- 管理员 email 已经设定为 littlestorybakery@gmail.com
-- =====================================================================

-- ---------- 资料表 ----------
create table if not exists public.categories (
  slug        text primary key,
  name_zh     text not null default '',
  name_en     text not null default '',
  icon        text not null default 'bread',   -- bread / bag / bagel / cake / sandwich / jar / cookie
  image_url   text not null default '',        -- 可选：自定分类图片
  sort        int  not null default 0
);

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  category_slug   text references public.categories(slug) on update cascade on delete set null,
  name_zh         text not null default '',
  name_en         text not null default '',
  description_zh  text not null default '',
  description_en  text not null default '',
  image_url       text not null default '',
  thumb_url       text not null default '',           -- 小图（产品卡片用，省流量）
  options         jsonb not null default '[]'::jsonb,  -- [{label_zh,label_en,price,moq}]
  flavors         jsonb not null default '[]'::jsonb,  -- [{zh,en}] 顾客可以选的口味
  preorder_days   int  not null default 0,             -- 0 = 不需要预订
  sold_out        boolean not null default false,
  popular         boolean not null default false,
  hidden          boolean not null default false,
  quote_only      boolean not null default false,      -- 定制品：只显示"询价"
  addon           boolean not null default false,      -- 搭配推荐：同分类其他产品页会出现
  sort            int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 旧版本升级用（已经跑过旧 SQL 的话，会补上新栏位）
alter table public.products add column if not exists flavors jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists addon boolean not null default false;
alter table public.products add column if not exists thumb_url text not null default '';

create table if not exists public.settings (
  id    int primary key default 1 check (id = 1),
  data  jsonb not null default '{}'::jsonb
);
insert into public.settings (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- 谁可以改资料（只有这里列出的 email）
create table if not exists public.admins (
  email text primary key
);

-- ---------- 权限 ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.settings   enable row level security;
alter table public.admins     enable row level security;

drop policy if exists "public read categories" on public.categories;
drop policy if exists "admin write categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
create policy "admin write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read products" on public.products;
drop policy if exists "admin write products" on public.products;
create policy "public read products" on public.products for select using (hidden = false or public.is_admin());
create policy "admin write products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read settings" on public.settings;
drop policy if exists "admin write settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);
create policy "admin write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read admins" on public.admins;
create policy "admin read admins" on public.admins for select using (public.is_admin());

-- ---------- Data API 权限 ----------
-- 项目关掉了"Automatically expose new tables"，所以要在这里手动开放：
-- 所有人（anon）只能读；登入的人可以写，但上面的 RLS 规定只有 admins 里的 email 真的能改
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.settings to authenticated;
grant select on public.admins to authenticated;
revoke all on public.admins from anon;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- 顾客页面：一个请求拿全部菜单（省流量、更快） ----------
create or replace function public.get_catalog() returns json
language sql stable security invoker set search_path = public as $$
  select json_build_object(
    'settings',   (select data from public.settings where id = 1),
    'categories', coalesce((select json_agg(c order by c.sort) from public.categories c), '[]'::json),
    'products',   coalesce((select json_agg(p order by p.sort) from public.products p where p.hidden = false), '[]'::json)
  );
$$;
grant execute on function public.get_catalog() to anon, authenticated;

-- ---------- 图片储存 ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/webp','image/jpeg','image/png'];

drop policy if exists "public read images"  on storage.objects;
drop policy if exists "admin upload images" on storage.objects;
drop policy if exists "admin update images" on storage.objects;
drop policy if exists "admin delete images" on storage.objects;
create policy "public read images"  on storage.objects for select using (bucket_id = 'product-images');
create policy "admin upload images" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin update images" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy "admin delete images" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());

-- ---------- 管理员 ----------
-- ⚠️ 换成你朋友登入 admin 用的 email（要和 Authentication → Users 里建立的一样）
insert into public.admins (email) values ('littlestorybakery@gmail.com') on conflict do nothing;
