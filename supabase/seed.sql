insert into public.artists (id, name, bio) values
  ('a0000000-0000-0000-0000-000000000001', 'Цэнхэр Нуур', 'Улаанбаатарын инди-поп хамтлаг. Зөөлөн гитар, шөнийн хотын тухай дуунууд.'),
  ('a0000000-0000-0000-0000-000000000002', 'Нүүдэл', 'Ардын хөгжмийн зэмсгийг электрон хөгжимтэй хослуулдаг дуэт.'),
  ('a0000000-0000-0000-0000-000000000003', 'Mira Sol', 'R&B, soul чиглэлийн бие даасан дуучин.');

insert into public.products (id, artist_id, category_id, type, title, description, price, release_date) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 'albums'), 'album', 'Шөнийн долгион',
   'Хамтлагийн хоёр дахь студийн цомог, 180гр пянз.', 89000, '2025-09-12'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   (select id from public.categories where slug = 'albums'), 'album', 'Талын салхи',
   'Морин хуур, хөөмий, синтезатор.', 38000, '2024-04-20'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'albums'), 'album', 'Golden Hour',
   'Дебют EP.', 25000, '2026-02-14'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   (select id from public.categories where slug = 't-shirts'), 'merch', 'Шөнийн долгион — подволк',
   '100% хөвөн, цомгийн хавтасны хэвлэлтэй.', 55000, null),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002',
   (select id from public.categories where slug = 'hats'), 'merch', 'Нүүдэл малгай',
   'Хатгамал логотой бейсболк.', 42000, null),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003',
   (select id from public.categories where slug = 'pins'), 'merch', 'Golden Hour pin',
   'Эмальтай металл pin, 3 см.', 12000, null);

insert into public.product_variants (product_id, format, size, color, sku, price_override, stock) values
  ('b0000000-0000-0000-0000-000000000001', 'vinyl', null, null, 'TSN-SD-LP', null, 5),
  ('b0000000-0000-0000-0000-000000000002', 'vinyl', null, null, 'NUD-TS-LP', null, 15),
  ('b0000000-0000-0000-0000-000000000003', 'vinyl', null, null, 'MRS-GH-LP', null, 2),
  ('b0000000-0000-0000-0000-000000000004', null, 'S',  'Хар', 'TSN-TEE-S',  null, 8),
  ('b0000000-0000-0000-0000-000000000004', null, 'M',  'Хар', 'TSN-TEE-M',  null, 12),
  ('b0000000-0000-0000-0000-000000000004', null, 'L',  'Хар', 'TSN-TEE-L',  null, 0),
  ('b0000000-0000-0000-0000-000000000004', null, 'XL', 'Хар', 'TSN-TEE-XL', null, 4),
  ('b0000000-0000-0000-0000-000000000005', null, null, 'Цэнхэр', 'NUD-CAP-BL', null, 10),
  ('b0000000-0000-0000-0000-000000000006', null, null, null, 'MRS-PIN', null, 30);

insert into public.product_genres (product_id, genre_id)
select 'b0000000-0000-0000-0000-000000000001'::uuid, id from public.genres where name in ('Pop', 'Rock')
union all
select 'b0000000-0000-0000-0000-000000000002'::uuid, id from public.genres where name in ('Folk', 'Electronic')
union all
select 'b0000000-0000-0000-0000-000000000003'::uuid, id from public.genres where name in ('R&B');

insert into public.tracks (product_id, track_no, title, duration_sec) values
  ('b0000000-0000-0000-0000-000000000001', 1, 'Шөнийн долгион', 214),
  ('b0000000-0000-0000-0000-000000000001', 2, 'Гэрлэн дохио', 187),
  ('b0000000-0000-0000-0000-000000000001', 3, 'Хөвөх', 243),
  ('b0000000-0000-0000-0000-000000000001', 4, 'Сүүлийн автобус', 199),
  ('b0000000-0000-0000-0000-000000000002', 1, 'Талын салхи', 276),
  ('b0000000-0000-0000-0000-000000000002', 2, 'Нүүдлийн зам', 231),
  ('b0000000-0000-0000-0000-000000000002', 3, 'Хөөмий 2.0', 302),
  ('b0000000-0000-0000-0000-000000000003', 1, 'Golden Hour', 201),
  ('b0000000-0000-0000-0000-000000000003', 2, 'Slow Down', 189),
  ('b0000000-0000-0000-0000-000000000003', 3, 'Ulaanbaatar Nights', 224);
