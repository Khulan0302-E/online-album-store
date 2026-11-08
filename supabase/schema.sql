create extension if not exists pg_trgm with schema extensions;

create type public.user_role      as enum ('user', 'admin');
create type public.product_type   as enum ('album', 'merch');
create type public.album_format   as enum ('cd', 'vinyl', 'cassette', 'digital');
create type public.order_status   as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.artists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  bio         text,
  image_url   text,
  created_at  timestamptz not null default now()
);

create table public.categories (
  id    bigint generated always as identity primary key,
  name  text not null unique,
  slug  text unique,
  type  public.product_type not null default 'merch'
);

create table public.genres (
  id    bigint generated always as identity primary key,
  name  text not null unique
);

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references public.artists (id) on delete restrict,
  category_id   bigint not null references public.categories (id) on delete restrict,
  type          public.product_type not null,
  title         text not null check (length(trim(title)) > 0),
  description   text,
  price         numeric(12, 2) not null check (price >= 0),
  release_date  date,
  cover_url     text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.product_variants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products (id) on delete cascade,
  size            text,
  color           text,
  format          public.album_format,
  sku             text unique,
  price_override  numeric(12, 2) check (price_override >= 0),
  stock           integer check (stock >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),

  constraint variant_stock_rule check (
    case when format = 'digital' then stock is null else stock is not null end
  ),

  constraint variant_unique unique nulls not distinct (product_id, size, color, format)
);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  sort_order  integer not null default 0
);

create table public.product_genres (
  product_id  uuid   not null references public.products (id) on delete cascade,
  genre_id    bigint not null references public.genres (id) on delete cascade,
  primary key (product_id, genre_id)
);

create table public.tracks (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  track_no      integer not null check (track_no > 0),
  title         text not null,
  duration_sec  integer check (duration_sec > 0),
  preview_url   text,
  unique (product_id, track_no)
);

create table public.cart_items (
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  variant_id  uuid not null references public.product_variants (id) on delete cascade,
  qty         integer not null check (qty between 1 and 10),
  created_at  timestamptz not null default now(),
  primary key (user_id, variant_id)
);

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete restrict,
  status            public.order_status not null default 'pending',
  total             numeric(12, 2) not null check (total >= 0),
  needs_shipping    boolean not null default true,
  shipping_name     text,
  shipping_phone    text,
  shipping_address  text,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  variant_id     uuid not null references public.product_variants (id) on delete restrict,
  product_title  text not null,
  variant_label  text,
  qty            integer not null check (qty > 0),
  unit_price     numeric(12, 2) not null check (unit_price >= 0)
);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references public.orders (id) on delete cascade,
  provider    text not null check (provider in ('qpay', 'stripe')),
  invoice_id  text unique,
  amount      numeric(12, 2) not null check (amount >= 0),
  status      public.payment_status not null default 'pending',
  paid_at     timestamptz,
  raw         jsonb,
  created_at  timestamptz not null default now()
);

create index products_title_trgm_idx on public.products using gin (title extensions.gin_trgm_ops);
create index products_artist_idx     on public.products (artist_id);
create index products_category_idx   on public.products (category_id);
create index products_price_idx      on public.products (price);
create index products_created_idx    on public.products (created_at desc);
create index variants_product_idx    on public.product_variants (product_id);
create index images_product_idx      on public.product_images (product_id, sort_order);
create index tracks_product_idx      on public.tracks (product_id, track_no);
create index orders_user_idx         on public.orders (user_id, created_at desc);
create index orders_status_idx       on public.orders (status);
create index order_items_order_idx   on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Эрх өөрчлөх зөвшөөрөлгүй';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.profiles         enable row level security;
alter table public.artists          enable row level security;
alter table public.categories       enable row level security;
alter table public.genres           enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_genres   enable row level security;
alter table public.tracks           enable row level security;
alter table public.cart_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.payments         enable row level security;

create policy "profiles: own or admin read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: own or admin update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "artists: public read" on public.artists
  for select to anon, authenticated using (true);
create policy "artists: admin write" on public.artists
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: admin write" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "genres: public read" on public.genres
  for select to anon, authenticated using (true);
create policy "genres: admin write" on public.genres
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: public read active" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "products: admin write" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "variants: public read active" on public.product_variants
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "variants: admin write" on public.product_variants
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "images: public read" on public.product_images
  for select to anon, authenticated using (true);
create policy "images: admin write" on public.product_images
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_genres: public read" on public.product_genres
  for select to anon, authenticated using (true);
create policy "product_genres: admin write" on public.product_genres
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "tracks: public read" on public.tracks
  for select to anon, authenticated using (true);
create policy "tracks: admin write" on public.tracks
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "cart: own only" on public.cart_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "orders: own or admin read" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "orders: admin update status" on public.orders
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order_items: own or admin read" on public.order_items
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy "payments: own or admin read" on public.payments
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create or replace function public.create_order_from_cart(
  p_shipping_name    text default null,
  p_shipping_phone   text default null,
  p_shipping_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user           uuid := auth.uid();
  v_order          uuid;
  v_total          numeric(12, 2);
  v_needs_shipping boolean;
  r                record;
begin
  if v_user is null then
    raise exception 'Нэвтэрсэн байх шаардлагатай';
  end if;

  if not exists (select 1 from public.cart_items where user_id = v_user) then
    raise exception 'Сагс хоосон байна';
  end if;

  for r in
    select c.variant_id, c.qty, v.stock, p.title,
           (p.is_active and v.is_active) as active
    from public.cart_items c
    join public.product_variants v on v.id = c.variant_id
    join public.products p         on p.id = v.product_id
    where c.user_id = v_user
    for update of v
  loop
    if not r.active then
      raise exception '"%" худалдаанд байхгүй байна', r.title;
    end if;
    if r.stock is not null and r.stock < r.qty then
      raise exception '"%" барааны нөөц хүрэлцэхгүй байна (үлдэгдэл: %)', r.title, r.stock;
    end if;
    if r.stock is not null then
      update public.product_variants set stock = stock - r.qty where id = r.variant_id;
    end if;
  end loop;

  select sum(c.qty * coalesce(v.price_override, p.price)),
         bool_or(v.format is distinct from 'digital')
    into v_total, v_needs_shipping
  from public.cart_items c
  join public.product_variants v on v.id = c.variant_id
  join public.products p         on p.id = v.product_id
  where c.user_id = v_user;

  if v_needs_shipping and (
       coalesce(trim(p_shipping_address), '') = ''
    or coalesce(trim(p_shipping_phone), '') = ''
  ) then
    raise exception 'Хүргэлтийн хаяг болон утасны дугаар шаардлагатай';
  end if;

  insert into public.orders (user_id, total, needs_shipping,
                             shipping_name, shipping_phone, shipping_address)
  values (v_user, v_total, v_needs_shipping,
          p_shipping_name, p_shipping_phone, p_shipping_address)
  returning id into v_order;

  insert into public.order_items (order_id, variant_id, product_title, variant_label, qty, unit_price)
  select v_order, v.id, p.title,
         concat_ws(' / ', v.format::text, v.size, v.color),
         c.qty, coalesce(v.price_override, p.price)
  from public.cart_items c
  join public.product_variants v on v.id = c.variant_id
  join public.products p         on p.id = v.product_id
  where c.user_id = v_user;

  delete from public.cart_items where user_id = v_user;

  return v_order;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Захиалга олдсонгүй';
  end if;

  if not public.is_admin() then
    if v_order.user_id is distinct from auth.uid() then
      raise exception 'Зөвшөөрөлгүй';
    end if;
    if v_order.status <> 'pending' then
      raise exception 'Зөвхөн төлөгдөөгүй захиалгыг цуцална';
    end if;
  elsif v_order.status not in ('pending', 'paid') then
    raise exception 'Энэ төлөвтэй захиалгыг цуцлах боломжгүй';
  end if;

  update public.product_variants v
     set stock = v.stock + oi.qty
    from public.order_items oi
   where oi.order_id = p_order_id
     and oi.variant_id = v.id
     and v.stock is not null;

  update public.orders set status = 'cancelled' where id = p_order_id;
  update public.payments set status = 'expired'
   where order_id = p_order_id and status = 'pending';
end;
$$;

create or replace function public.mark_order_paid(
  p_order_id   uuid,
  p_provider   text,
  p_invoice_id text,
  p_amount     numeric,
  p_raw        jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Захиалга олдсонгүй';
  end if;

  if v_order.status <> 'pending' then
    return;
  end if;

  if p_amount <> v_order.total then
    raise exception 'Төлсөн дүн (%) захиалгын дүнтэй (%) таарахгүй', p_amount, v_order.total;
  end if;

  update public.orders set status = 'paid', paid_at = now() where id = p_order_id;

  insert into public.payments (order_id, provider, invoice_id, amount, status, paid_at, raw)
  values (p_order_id, p_provider, p_invoice_id, p_amount, 'paid', now(), p_raw)
  on conflict (order_id) do update
    set status     = 'paid',
        paid_at    = now(),
        invoice_id = excluded.invoice_id,
        amount     = excluded.amount,
        raw        = excluded.raw;
end;
$$;

create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ';
  end if;

  return json_build_object(
    'total_revenue', (
      select coalesce(sum(total), 0) from public.orders
      where status in ('paid', 'shipped', 'delivered')
    ),
    'order_count', (select count(*) from public.orders),
    'user_count',  (select count(*) from public.profiles),
    'orders_by_status', (
      select coalesce(json_object_agg(status, cnt), '{}'::json)
      from (select status, count(*) as cnt from public.orders group by status) s
    ),
    'revenue_last_30_days', (
      select coalesce(json_agg(d order by d.day), '[]'::json)
      from (
        select paid_at::date as day, sum(total) as revenue
        from public.orders
        where paid_at >= now() - interval '30 days'
          and status in ('paid', 'shipped', 'delivered')
        group by paid_at::date
      ) d
    ),
    'revenue_by_category', (
      select coalesce(json_agg(c), '[]'::json)
      from (
        select cat.name, sum(oi.qty * oi.unit_price) as revenue
        from public.order_items oi
        join public.orders o           on o.id = oi.order_id
        join public.product_variants v on v.id = oi.variant_id
        join public.products p         on p.id = v.product_id
        join public.categories cat     on cat.id = p.category_id
        where o.status in ('paid', 'shipped', 'delivered')
        group by cat.name
      ) c
    ),
    'low_stock', (
      select coalesce(json_agg(l), '[]'::json)
      from (
        select p.title,
               concat_ws(' / ', v.format::text, v.size, v.color) as variant,
               v.stock
        from public.product_variants v
        join public.products p on p.id = v.product_id
        where v.stock is not null and v.stock <= 5
        order by v.stock
        limit 10
      ) l
    )
  );
end;
$$;

revoke execute on function public.mark_order_paid(uuid, text, text, numeric, jsonb) from public, anon, authenticated;
grant  execute on function public.mark_order_paid(uuid, text, text, numeric, jsonb) to service_role;

revoke execute on function public.create_order_from_cart(text, text, text) from public, anon;
grant  execute on function public.create_order_from_cart(text, text, text) to authenticated;

revoke execute on function public.cancel_order(uuid) from public, anon;
grant  execute on function public.cancel_order(uuid) to authenticated;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant  execute on function public.admin_dashboard_stats() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images',         'images',         true,  5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('previews',       'previews',       true,  5242880,  array['audio/mpeg']),
  ('digital-albums', 'digital-albums', false, 52428800, array['application/zip', 'application/x-zip-compressed'])
on conflict (id) do nothing;

create policy "storage: public read media" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('images', 'previews'));

create policy "storage: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('images', 'previews', 'digital-albums') and (select public.is_admin()));

create policy "storage: admin update" on storage.objects
  for update to authenticated
  using (bucket_id in ('images', 'previews', 'digital-albums') and (select public.is_admin()));

create policy "storage: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('images', 'previews', 'digital-albums') and (select public.is_admin()));

insert into public.categories (name, slug, type) values
  ('Цомог',   'albums',   'album'),
  ('Подволк', 't-shirts', 'merch'),
  ('Малгай',  'hats',     'merch'),
  ('Pin',     'pins',     'merch');

insert into public.genres (name) values
  ('Pop'), ('Rock'), ('Hip-Hop'), ('R&B'), ('Folk'), ('Jazz'), ('Electronic');
