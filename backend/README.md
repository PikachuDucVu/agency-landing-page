# Roman Agency API — Cloudflare Workers

Backend cho **romanagency.net** được build bằng **Hono** chạy trên **Cloudflare Workers**.

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Cloudflare Workers (V8) |
| Framework | Hono v4 |
| Database | Cloudflare D1 (SQLite edge) |
| Storage | Cloudflare R2 (media CDN) |
| Auth | JWT (Web Crypto API) |

## Setup lần đầu

### 1. Cài dependencies

```bash
npm install
# hoặc
bun install
```

### 2. Tạo file wrangler.toml

```bash
cp wrangler.toml.example wrangler.toml
```

### 3. Tạo D1 database và R2 bucket

```bash
# Tạo D1
npx wrangler d1 create roman-agency-db
# Copy database_id từ output paste vào wrangler.toml

# Tạo R2
npx wrangler r2 bucket create roman-agency-media
```

### 4. Chạy migrations (BẮT BUỘC)

```bash
# Chạy TẤT CẢ migrations theo thứ tự:
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0001_initial.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0002_seed.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0003_publish_releases.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0004_testimonials.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0005_products_payments_stats.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0006_subscribers_testimonials_enhance.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0007_seed_media.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0008_i18n_products_stats_payments.sql
```

### 5. Dev local

```bash
npm run dev
# hoặc
npx wrangler dev
# Server chạy tại http://localhost:8787
```

### 6. Tạo admin user (chạy 1 lần sau khi server đã start)

```bash
curl -X POST http://localhost:8787/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin12345"}'
```

### 7. Seed media (upload ảnh vào R2 local)

Giữ server chạy, mở terminal mới:

```bash
npm run seed:media
```

Script tự động upload tất cả ảnh từ `admin/public/asset-preview/` vào R2 local + cập nhật DB.

### 8. Deploy

```bash
npm run deploy
```

## API Endpoints

### Public

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/faqs?lang=en` | Lấy FAQ |
| GET | `/api/media?section=proof-campaign` | Lấy media |
| GET | `/api/settings?lang=en` | Lấy settings |
| POST | `/api/subscribe` | Đăng ký email |

### Auth

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/setup` | Tạo admin (1 lần) |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Check token |

### Admin (cần Authorization: Bearer {token})

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/POST/PATCH/DELETE | `/api/admin/media` | CRUD media |
| POST | `/api/admin/media/upload` | Upload file → R2 |
| PATCH | `/api/admin/media-reorder` | Reorder media |
| GET/POST/PATCH/DELETE | `/api/admin/faqs` | CRUD FAQ |
| PATCH | `/api/admin/faqs-reorder` | Reorder FAQ |
| GET/PUT | `/api/admin/settings` | Settings |
| GET | `/api/admin/subscribers` | Subscribers |
| GET | `/api/admin/subscribers/export` | Export CSV |
