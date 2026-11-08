# Хөвөө — Цомог ба мерчийн онлайн дэлгүүр

**khuvuu.mn** · SWE334 Internet Programming · бие даалтын төсөл

Монгол уран бүтээлчдийн CD, винил, дижитал цомог болон албан ёсны мерч (подволк, малгай, pin)-ийг нэг дороос худалдан авах full-stack веб аппликейшн.

## Асуудал

Монгол уран бүтээлчдийн физик болон дижитал цомгийг онлайнаар хайж, нэг дороос захиалах тусгай газар бараг байхгүй. Мерч нь ихэвчлэн зөвхөн тоглолтын үеэр эсвэл сошиал хуудсаар зарагддаг. Хөвөө нь цомог, мерчийг уран бүтээлчээр нь нэгтгэж, нөөц, захиалга, төлбөрийг нэг системд удирдана.

## Хэрэглэгчийн төрөл

| Төрөл | Боломж |
|---|---|
| Зочин | Бүтээгдэхүүн, уран бүтээлч үзэх, хайх, шүүх, дууны preview сонсох |
| Хэрэглэгч | Сагс, захиалга, захиалгын түүх, профайл |
| Админ | Бүтээгдэхүүн, уран бүтээлч, захиалга, хэрэглэгч удирдах, статистик |

## Технологи

- **Frontend:** React 19, Vite, React Router, Tailwind CSS v4
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RLS, RPC функц)
- **Төлбөр:** QPay (Хамгаалалт-2)
- **Байршуулалт:** Vercel + khuvuu.mn

## Өгөгдлийн сан

13 хүснэгт: `profiles`, `artists`, `categories`, `genres`, `products`, `product_variants`, `product_images`, `product_genres`, `tracks`, `cart_items`, `orders`, `order_items`, `payments`.

- 1:N — `artists → products`, `products → product_variants`, `products → tracks`, `orders → order_items`
- N:M — `products ↔ genres` (`product_genres`), `orders ↔ product_variants` (`order_items`)
- Бүх хүснэгтэд RLS идэвхтэй. Захиалгыг зөвхөн `create_order_from_cart()` функцээр үүсгэдэг тул үнийг database тооцоолно.

## Суулгах заавар

### 1. Supabase

1. [supabase.com](https://supabase.com) дээр шинэ төсөл үүсгэнэ.
2. **SQL Editor** → `supabase/schema.sql`-г бүхэлд нь ажиллуулна (хүснэгт, RLS, функц, Storage bucket үүснэ).
3. Туршилтын өгөгдөл хэрэгтэй бол `supabase/seed.sql`-г ажиллуулна.
4. **Authentication → URL Configuration:**
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`

### 2. Төсөл

```bash
git clone <repo-url>
cd khuvuu
npm install
cp .env.example .env
```

`.env` файлд Supabase → **Project Settings → API**-аас утгуудаа хуулна:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=anon (эсвэл publishable) түлхүүр
```

> `service_role` түлхүүрийг frontend эсвэл `.env`-д хэзээ ч бүү хийнэ.

```bash
npm run dev
```

### 3. Админ эрх

Сайтад бүртгүүлсний дараа SQL Editor дээр:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tanii@email.com');
```

## Хавтасны бүтэц

```
src/
  components/
    admin/       ImageUpload (урьдчилан харах, хэмжээ/төрлийн шалгалт)
    layout/      Navbar, Footer, Layout, AdminLayout
    product/     ProductCard, ProductGrid, TrackList
    routes/      ProtectedRoute (нэвтрэлт, админ эрх шалгах)
    ui/          Modal, ConfirmDialog, Pagination, Field, States...
  context/       AuthContext, CartContext
  hooks/         useDebounce
  lib/           supabase client, format, storage
  pages/         хэрэглэгчийн хуудсууд
    auth/        Login, Register, ForgotPassword, ResetPassword
    admin/       Dashboard, Products, ProductForm, Artists, Orders, Users
supabase/
  schema.sql     хүснэгт, RLS, функц, storage
  seed.sql       туршилтын өгөгдөл
```

## Хуудсууд

| Зам | Тайлбар | Эрх |
|---|---|---|
| `/` | Нүүр | Бүгд |
| `/shop` | Хайлт, шүүлт (төрөл, ангилал, хөгжмийн төрөл, үнэ), эрэмбэ, хуудаслалт | Бүгд |
| `/products/:id` | Дэлгэрэнгүй, сонголт, дуу | Бүгд |
| `/artists`, `/artists/:id` | Уран бүтээлчид | Бүгд |
| `/cart`, `/checkout` | Сагс, захиалга | Хэрэглэгч |
| `/orders`, `/orders/:id` | Захиалгын түүх | Хэрэглэгч |
| `/profile` | Профайл | Хэрэглэгч |
| `/admin/*` | Админ самбар | Админ |
