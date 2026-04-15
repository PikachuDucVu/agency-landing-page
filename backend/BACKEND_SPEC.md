# Roman Agency Marketing — Backend Specification

> **Mục đích tài liệu:** Spec đầy đủ để dev implement backend. Đọc xong doc này là có thể code mà không cần hỏi thêm.
>
> **Repo:** `F:\RomanAgencyMarketing\`  
> **Live site:** https://cd8fa9af.agency-landing-page-7zg.pages.dev/  
> **Domain production:** romanagency.net

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Database Schema (D1)](#4-database-schema-d1)
5. [API Contract](#5-api-contract)
6. [Admin Panel UI](#6-admin-panel-ui)
7. [Frontend Integration](#7-frontend-integration)
8. [Setup Development](#8-setup-development)
9. [Deployment](#9-deployment)
10. [Phân pha & Checklist](#10-phân-pha--checklist)

---

## 1. Tổng quan dự án

### Công ty
**Roman Marketing Agency** — chuyên cho thuê tài khoản quảng cáo Facebook & TikTok.

### Trạng thái hiện tại

| Component | Trạng thái | Vị trí |
|-----------|-----------|--------|
| **Frontend** | ✅ Hoàn chỉnh | `frontend/` — Static HTML/CSS/JS, deploy trên Cloudflare Pages |
| **Backend** | ❌ Minimal | `backend/` — Chỉ có 1 endpoint `/api/subscribe` lưu vào file JSON |
| **Admin Panel** | ❌ Chưa có | Có design doc tại `frontend/docs/admin-console-design.md` (700 dòng) |

### Frontend đã có gì (KHÔNG CẦN ĐỤNG TỚI)

- **1,147 dòng HTML** — 16 sections (Hero, Services, Products, Pricing, Resources, Workflow, Proof, FAQ, Refund...)
- **52KB CSS** — Dark premium theme, responsive, animations
- **465 dòng JS** — Particle system, product tabs, FAQ accordion, scroll animations, animated counters
- **i18n 3 ngôn ngữ** — EN, ZH (中文), RU (Русский) — 148 keys mỗi ngôn ngữ
- **Build system** — `build-i18n.js` + `build-prod.js` (minify + generate locale pages)
- **~28 media assets** — images + 2 videos trong `assets/`

### Yêu cầu cần build

1. **Backend API** (Cloudflare Workers + Hono) — CRUD cho media, FAQ, settings, subscribers
2. **Admin Panel** — Web UI để quản lý nội dung động (ảnh, video, FAQ, settings)
3. **Media Storage** — Upload ảnh/video lên Cloudflare R2, serve qua CDN
4. **Newsletter** — Kết nối form subscribe frontend với database
5. **Publish Pipeline** — Admin thay đổi media → generate `media-config.json` → rebuild frontend

---

## 2. Kiến trúc hệ thống

### Stack

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| **Runtime** | Cloudflare Workers | Edge computing, V8 isolate |
| **Framework** | **Hono** v4+ | Lightweight, multi-runtime, first-class Workers support |
| **Database** | **Cloudflare D1** | SQLite at the edge, bind vào Worker |
| **Media Storage** | **Cloudflare R2** | S3-compatible, zero egress, public CDN |
| **Auth** | **JWT** (stateless) | Phù hợp edge — không dùng session/cookie |
| **Admin UI** | Vanilla HTML/CSS/JS | Serve static từ Worker hoặc Pages |
| **Frontend** | Cloudflare Pages | ĐÃ CÓ — không đụng tới |

### Diagram

```
                    romanagency.net
                         │
              ┌──────────┴──────────┐
              │                     │
      romanagency.net/*     api.romanagency.net/*
      (hoặc /api/*)
              │                     │
    ┌─────────┴──────┐    ┌────────┴─────────┐
    │  Cloudflare    │    │  Cloudflare       │
    │  Pages         │    │  Workers (Hono)   │
    │                │    │                   │
    │  index.html    │    │  /api/public/*    │
    │  styles.css    │    │  /api/admin/*     │
    │  script.js     │    │  /admin/* (UI)    │
    │  assets/       │    │                   │
    └────────────────┘    └────┬────────┬─────┘
                               │        │
                          ┌────┴──┐ ┌───┴────┐
                          │  D1   │ │   R2   │
                          │SQLite │ │ Media  │
                          │       │ │ Bucket │
                          └───────┘ └────────┘
```

### Tại sao Cloudflare (không phải VPS/Fly.io)?

- Frontend **đã deploy trên Cloudflare Pages** → cùng ecosystem, zero latency giữa Pages ↔ Workers
- **Free tier rộng rãi:** Workers 100K req/ngày, D1 5M rows, R2 10GB storage
- **Deploy 1 lệnh:** `wrangler deploy`
- **Dev local:** `wrangler dev` emulate D1/R2 trên máy, không cần cloud

---

## 3. Cấu trúc thư mục

```
backend/
├── wrangler.toml                  # Cloudflare Workers config
├── package.json
├── tsconfig.json
│
├── migrations/                    # D1 database migrations
│   ├── 0001_create_tables.sql
│   └── 0002_seed_data.sql
│
├── src/
│   ├── index.ts                   # Entry point — Hono app
│   ├── types.ts                   # Bindings, shared types
│   │
│   ├── middleware/
│   │   ├── auth.ts                # JWT verify middleware
│   │   └── cors.ts                # CORS configuration
│   │
│   ├── routes/
│   │   ├── public.ts              # Public read-only endpoints
│   │   ├── subscriber.ts          # POST /api/subscribe
│   │   ├── auth.ts                # POST /api/auth/login, /logout
│   │   ├── admin-media.ts         # CRUD /api/admin/media + R2 upload
│   │   ├── admin-faq.ts           # CRUD /api/admin/faqs
│   │   ├── admin-settings.ts      # GET/PUT /api/admin/settings
│   │   └── admin-publish.ts       # POST /api/admin/publish
│   │
│   ├── services/
│   │   ├── r2.ts                  # R2 upload/delete/list helpers
│   │   └── config-gen.ts          # Generate media-config.json từ DB
│   │
│   └── admin-ui/                  # Admin Panel static files
│       ├── index.html             # Dashboard
│       ├── login.html             # Login page
│       ├── admin.css              # Styles (dark theme matching frontend)
│       └── admin.js               # Client-side JS (fetch API, render)
│
└── scripts/
    └── migrate-assets.ts          # One-time: upload assets/ → R2
```

---

## 4. Database Schema (D1)

### File: `migrations/0001_create_tables.sql`

```sql
-- ═══════════════════════════════════════════════════
--  MEDIA ITEMS — Ảnh, video trên landing page
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS media_items (
  id          TEXT PRIMARY KEY,                      -- "hero-video", "service-rental", "proof-campaign-1"
  section     TEXT NOT NULL,                          -- "hero", "services", "proof-campaign", "proof-sigma"
  slot        TEXT NOT NULL,                          -- "video", "card-1", "screenshot-1"
  file_name   TEXT NOT NULL,                          -- original filename: "SD3.png"
  r2_key      TEXT NOT NULL,                          -- R2 object key: "media/proof-campaign/a1b2c3.png"
  r2_url      TEXT NOT NULL,                          -- public CDN: "https://pub-xxx.r2.dev/media/..."
  mime_type   TEXT NOT NULL,                          -- "image/png", "video/mp4"
  file_size   INTEGER NOT NULL,                       -- bytes
  width       INTEGER,                                -- px (NULL for video)
  height      INTEGER,
  alt_text    TEXT DEFAULT '',                         -- accessibility
  caption     TEXT DEFAULT '',                         -- e.g. "$56,439"
  caption_sub TEXT DEFAULT '',                         -- e.g. "221 campaigns"
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,                      -- 0=hidden, 1=shown
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_media_section ON media_items(section);
CREATE INDEX idx_media_visible ON media_items(is_visible);

-- ═══════════════════════════════════════════════════
--  FAQ — Câu hỏi thường gặp (multi-language)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  lang        TEXT DEFAULT 'en',                      -- "en", "zh", "ru", "vi"
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_faq_lang ON faqs(lang);

-- ═══════════════════════════════════════════════════
--  SETTINGS — Config động (stats, contact, pricing text)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT NOT NULL,                           -- "stat_ad_spend", "stat_accounts", "contact_email"
  value       TEXT NOT NULL,
  lang        TEXT DEFAULT 'en',
  updated_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (key, lang)
);

-- ═══════════════════════════════════════════════════
--  SUBSCRIBERS — Email từ newsletter form
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  created_at  TEXT DEFAULT (datetime('now')),
  origin      TEXT,                                    -- referrer URL
  user_agent  TEXT
);

-- ═══════════════════════════════════════════════════
--  ADMIN USERS — Đăng nhập admin panel
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,                         -- bcrypt/argon2
  created_at    TEXT DEFAULT (datetime('now'))
);
```

### File: `migrations/0002_seed_data.sql`

```sql
-- Seed admin user (password sẽ được hash bởi script riêng)
-- Dev cần tạo script seed riêng vì D1 SQL không hash được

-- Seed FAQ (4 câu hỏi hiện tại trên frontend)
INSERT INTO faqs (question, answer, sort_order, lang) VALUES
('How is the fee calculated?', 'You want to spend $1000 and your fee is 8%, then the total amount you need to pay is $1,080. We don''t charge fees if you haven''t worked or spent on the account. You''ll be able to check your spending and fees directly using the smart dashboard.', 1, 'en'),
('Can the balance from a banned account be transferred to a new account?', 'Usually, this depends on the platform''s policies and the nature of the ban. However, we can guarantee the remaining balance in the report will be used for the new account.', 2, 'en'),
('What happens if the Facebook advertising account is banned?', 'In the event an ad account or profile is banned, a replacement account will be provided promptly. The main requirement is to follow the instructions of our technicians to prevent any abuse or damage to the account.', 3, 'en'),
('How to access my account?', 'We will make your account available through an anti-detection browser after sending an email or through a VPS virtual server (RDP). Our technicians will provide you with all the access information. You can log in and find all the resources in there.', 4, 'en');

-- Seed settings
INSERT INTO settings (key, value, lang) VALUES
('stat_ad_spend', '20000000', 'en'),
('stat_accounts', '50000', 'en'),
('stat_support', '24', 'en'),
('stat_refund', '100', 'en'),
('contact_email', 'romanagency888@gmail.com', 'en'),
('contact_telegram', '@romanwarior', 'en'),
('contact_channel', '@romanagency', 'en'),
('site_url', 'romanagency.net', 'en');
```

### Media sections mapping (28 assets hiện tại)

| Section ID | Slot(s) | Files hiện tại |
|------------|---------|----------------|
| `hero` | `video` | `hero-video-0402.mp4` |
| `brand` | `logo` | `Container.png` |
| `marquee` | `meta-logo` | `meta-logo.png` |
| `services` | `card-1`, `card-2`, `card-3` | `service-rental.png`, `service-sales.png`, `service-managed.png` |
| `resources` | `screenshot-1`, `screenshot-2` | `SD1.png`, `SD2.png` |
| `proof-campaign` | `screenshot-1`, `screenshot-2`, `screenshot-3` | `SD3.png`, `SD7.png`, `SD-extra.jpg` |
| `proof-system` | `screenshot-1`, `screenshot-2` | `SD5.png`, `SD6.png` |
| `proof-bm` | `bm-1`, `bm-2`, `bm-3` | `BM-1.jpg`, `BM-2.jpg`, `BM-3.jpg` |
| `proof-sigma` | `gallery-1` → `gallery-4` | `gallery-large-1.jpg` → `gallery-large-4.jpg` |
| `proof-affiliate` | `gallery-5`, `gallery-7`, `gallery-8` | `gallery-large-5.jpg`, `gallery-large-7.jpg`, `gallery-large-8.jpg` |
| `meta` | `og-image` | `hero-bg.png` |
| `favicon` | `icon` | `image-removebg-preview.png` |

---

## 5. API Contract

### 5.1 Response Format (ALL endpoints)

```jsonc
// Success
{
  "success": true,
  "data": { /* resource hoặc array */ },
  "meta": { "total": 28 }  // optional
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  }
}
```

### 5.2 Public Endpoints

#### `GET /api/faqs`

Lấy danh sách FAQ.

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `lang` | query | `en` | Ngôn ngữ: `en`, `zh`, `ru`, `vi` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question": "How is the fee calculated?",
      "answer": "You want to spend $1000...",
      "sort_order": 1
    }
  ]
}
```

---

#### `GET /api/media`

Lấy media items.

| Param | Type | Default | Mô tả |
|-------|------|---------|--------|
| `section` | query | all | Filter theo section: `hero`, `services`, `proof-campaign`... |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "proof-campaign-screenshot-1",
      "section": "proof-campaign",
      "slot": "screenshot-1",
      "r2_url": "https://pub-xxx.r2.dev/media/proof-campaign/a1b2c3.png",
      "mime_type": "image/png",
      "alt_text": "Ads Manager showing $56,439 total spend",
      "caption": "$56,439",
      "caption_sub": "Total spend · 221 campaigns",
      "sort_order": 1,
      "is_visible": true
    }
  ]
}
```

---

#### `GET /api/settings`

| Param | Type | Default |
|-------|------|---------|
| `lang` | query | `en` |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "stat_ad_spend": "20000000",
    "stat_accounts": "50000",
    "contact_email": "romanagency888@gmail.com",
    "contact_telegram": "@romanwarior"
  }
}
```

---

#### `POST /api/subscribe`

Đăng ký email newsletter.

**Request:**
```json
{ "email": "user@example.com" }
```

**Response 201:**
```json
{ "success": true, "data": { "message": "Subscribed successfully" } }
```

**Response 409 (duplicate):**
```json
{ "success": true, "data": { "message": "Email already subscribed" } }
```

**Validation:**
- Email required, valid format
- Rate limit: 5 requests / 15 phút / IP

---

### 5.3 Auth Endpoints

#### `POST /api/auth/login`

**Request:**
```json
{ "username": "admin", "password": "secret123" }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_in": 86400
  }
}
```

**Response 401:**
```json
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Wrong username or password" } }
```

**JWT payload:** `{ sub: "admin", iat: timestamp, exp: timestamp + 24h }`

---

### 5.4 Admin Endpoints

> Tất cả admin endpoints yêu cầu header: `Authorization: Bearer <JWT_TOKEN>`
> Nếu thiếu/sai token → trả 401.

#### `GET /api/admin/media`

Giống public nhưng bao gồm cả items có `is_visible = 0`.

---

#### `POST /api/admin/media`

Upload media mới. **Content-Type: multipart/form-data**

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `file` | File | ✅ | Image/video file |
| `section` | string | ✅ | `hero`, `services`, `proof-campaign`... |
| `slot` | string | ❌ | Auto-generated nếu bỏ trống |
| `alt_text` | string | ❌ | Accessibility text |
| `caption` | string | ❌ | Display caption |
| `caption_sub` | string | ❌ | Sub-caption |

**Upload flow:**
1. Validate file (type, size — xem bảng dưới)
2. Generate UUID filename: `media/{section}/{uuid}.{ext}`
3. Upload to R2: `env.MEDIA.put(r2Key, fileBuffer)`
4. Save metadata to D1
5. Return created item with R2 URL

**Validation rules:**

| | Images | Videos |
|---|--------|--------|
| **Max size** | 5 MB | 50 MB |
| **Types** | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` | `video/mp4`, `video/webm` |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "proof-campaign-screenshot-4",
    "section": "proof-campaign",
    "r2_url": "https://pub-xxx.r2.dev/media/proof-campaign/a1b2c3d4.png",
    "file_size": 245830,
    "sort_order": 4
  }
}
```

---

#### `PATCH /api/admin/media/:id`

Update metadata (KHÔNG upload file mới).

**Request:**
```json
{
  "alt_text": "Updated alt text",
  "caption": "$80,000",
  "caption_sub": "350 campaigns",
  "is_visible": true
}
```

---

#### `POST /api/admin/media/:id/replace`

Thay file cho media item đã có (giữ metadata). **Content-Type: multipart/form-data**

Flow: delete old R2 object → upload new → update DB record.

---

#### `DELETE /api/admin/media/:id`

Delete media. Xóa cả R2 object và DB record.

---

#### `PATCH /api/admin/media/reorder`

Sắp xếp lại thứ tự trong 1 section.

**Request:**
```json
{
  "section": "proof-campaign",
  "order": ["proof-campaign-screenshot-3", "proof-campaign-screenshot-1", "proof-campaign-screenshot-2"]
}
```

---

#### `GET /api/admin/faqs`

Tất cả FAQs (bao gồm inactive), tất cả ngôn ngữ.

---

#### `POST /api/admin/faqs`

**Request:**
```json
{
  "question": "New question?",
  "answer": "Answer here.",
  "lang": "en",
  "sort_order": 5
}
```

---

#### `PATCH /api/admin/faqs/:id`

**Request:**
```json
{
  "question": "Updated question?",
  "answer": "Updated answer.",
  "is_active": true
}
```

---

#### `DELETE /api/admin/faqs/:id`

---

#### `GET /api/admin/settings`

Tất cả settings, tất cả ngôn ngữ.

---

#### `PUT /api/admin/settings`

Batch update.

**Request:**
```json
{
  "settings": [
    { "key": "stat_ad_spend", "value": "25000000", "lang": "en" },
    { "key": "contact_email", "value": "new@email.com", "lang": "en" }
  ]
}
```

---

#### `GET /api/admin/subscribers`

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "email": "user@example.com", "created_at": "2026-04-06T12:00:00Z", "origin": "romanagency.net" }
  ],
  "meta": { "total": 42 }
}
```

---

#### `POST /api/admin/publish`

Generate `media-config.json` từ DB → dùng cho build frontend.

**Flow:**
1. Query tất cả `media_items` WHERE `is_visible = 1`, ORDER BY `sort_order`
2. Group theo `section`
3. Output JSON format (xem mẫu bên dưới)
4. Lưu vào R2 hoặc trả về cho admin download

**Output `media-config.json`:**
```json
{
  "hero": {
    "video": {
      "url": "https://pub-xxx.r2.dev/media/hero/abc.mp4",
      "alt": "Roman Agency showcase video"
    }
  },
  "services": {
    "card-1": { "url": "...", "alt": "..." },
    "card-2": { "url": "...", "alt": "..." },
    "card-3": { "url": "...", "alt": "..." }
  },
  "proof-campaign": {
    "items": [
      {
        "url": "...",
        "alt": "Ads Manager showing $56,439",
        "caption": "$56,439",
        "caption_sub": "221 campaigns"
      }
    ]
  },
  "proof-sigma": {
    "items": [
      { "url": "...", "alt": "SiGMA World event photo" }
    ]
  }
}
```

---

## 6. Admin Panel UI

### Design guidelines
- **Dark theme** matching frontend (background `#0a0e1a`, gold accent `#f2ca50`)
- **Responsive** — phải hoạt động trên mobile
- **Vanilla HTML/CSS/JS** — consistent với frontend, không dùng framework

### Screens

#### 6.1 Login (`/admin/login`)
- Form: username + password
- Submit → `POST /api/auth/login` → store JWT in `localStorage`
- Redirect to dashboard on success

#### 6.2 Dashboard (`/admin/`)
- **Header:** Logo, "Publish Changes" button, Logout button
- **Section filter tabs:** All | Hero | Services | Resources | Proof | Gallery
- **Media grid:** Grouped by section
  - Mỗi section có header + "Add" button
  - Mỗi item hiện: thumbnail preview, filename, size, CDN URL
  - Actions: Replace | Edit | Delete
  - Drag-to-reorder (nice-to-have, có thể dùng nút ↑↓ đơn giản hơn)

#### 6.3 Edit Media Modal
- Preview image/video
- Fields: alt_text, caption, caption_sub, is_visible (toggle)
- Save / Cancel

#### 6.4 Upload Modal
- Dropdown chọn section
- Drag & drop zone (hoặc click to browse)
- Fields: alt_text, caption, caption_sub
- Upload progress bar
- Size/type validation client-side trước khi upload

#### 6.5 FAQ Manager (`/admin/faqs`)
- List FAQs grouped by language
- Add / Edit / Delete / Toggle active
- Reorder (sort_order)

#### 6.6 Settings (`/admin/settings`)
- Form fields cho mỗi setting key
- Group by: Stats, Contact Info, Other
- Save all changes

#### 6.7 Subscribers (`/admin/subscribers`)
- Table: email, date, origin
- Export CSV button
- Total count

### Wireframes

Tham khảo chi tiết wireframes (ASCII art) trong file: **`frontend/docs/admin-console-design.md`** — Section 6.

---

## 7. Frontend Integration

### 7.1 Newsletter Form

File: `frontend/script.js` — line 228-244

**Hiện tại:**
```javascript
// Replace with real API call when backend is ready
email.value = "";
email.placeholder = "Thanks! We'll be in touch.";
```

**Cần sửa thành:**
```javascript
const API_URL = 'https://api.romanagency.net'; // hoặc config

try {
  const res = await fetch(`${API_URL}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value.trim() })
  });
  const data = await res.json();
  if (data.success) {
    email.value = "";
    email.placeholder = "Thanks! We'll be in touch.";
  }
} catch (err) {
  email.placeholder = "Something went wrong. Try again.";
}
```

### 7.2 Media Config Integration (Phase sau)

File: `frontend/build-prod.js`

Sau khi admin publish → download `media-config.json` → build script đọc file này → thay thế `./assets/SD1.png` bằng R2 CDN URL trong HTML output.

Cách thực hiện:
1. Admin click "Publish" → backend trả `media-config.json`
2. Lưu file vào `frontend/media-config.json`
3. Sửa `build-prod.js` để đọc config và replace asset paths
4. Deploy lại Pages

> **Lưu ý:** Đây là Phase 3, làm sau khi backend + admin panel hoạt động.

---

## 8. Setup Development

### Prerequisites
- Node.js 18+ (cần cho `wrangler`)
- Cloudflare account (cùng account đang deploy Pages)

### Bước 1: Init project

```bash
cd F:\RomanAgencyMarketing\backend

# Cài wrangler CLI
npm install -D wrangler @cloudflare/workers-types

# Cài deps
npm install hono

# Login Cloudflare
npx wrangler login
```

### Bước 2: Tạo wrangler.toml

```toml
name = "roman-agency-api"
main = "src/index.ts"
compatibility_date = "2026-04-01"
compatibility_flags = ["nodejs_compat"]

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "roman-agency-db"
database_id = "" # Sẽ được fill sau khi tạo

# R2 Bucket
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "roman-agency-media"

# Environment variables
[vars]
JWT_SECRET = "change-this-to-random-string-64-chars"
ADMIN_USERNAME = "admin"
CORS_ORIGIN = "https://romanagency.net"
```

### Bước 3: Tạo D1 + R2

```bash
# Tạo database
npx wrangler d1 create roman-agency-db
# → Copy database_id vào wrangler.toml

# Tạo R2 bucket
npx wrangler r2 bucket create roman-agency-media

# Chạy migrations
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0001_create_tables.sql
npx wrangler d1 execute roman-agency-db --local --file=./migrations/0002_seed_data.sql
```

### Bước 4: Dev local

```bash
npx wrangler dev
# → Server chạy tại http://localhost:8787
# → D1 và R2 được emulate local
```

---

## 9. Deployment

### Production deploy

```bash
# 1. Chạy migrations trên production D1
npx wrangler d1 execute roman-agency-db --remote --file=./migrations/0001_create_tables.sql
npx wrangler d1 execute roman-agency-db --remote --file=./migrations/0002_seed_data.sql

# 2. Deploy Worker
npx wrangler deploy

# 3. Setup custom domain (trong Cloudflare dashboard)
# Workers → roman-agency-api → Settings → Domains → Add: api.romanagency.net

# 4. Enable R2 public access
# R2 → roman-agency-media → Settings → Public access → Enable R2.dev subdomain
```

### Seed admin user (cần script riêng)

```typescript
// scripts/create-admin.ts
// Chạy local: npx wrangler d1 execute ... --command "INSERT INTO admin_users ..."
// Hoặc viết 1 endpoint tạm POST /api/setup chỉ chạy 1 lần
```

> **Password hashing trên Workers:** Dùng Web Crypto API hoặc thư viện `bcryptjs` (pure JS, chạy được trên Workers). Không dùng native `bcrypt` (cần C bindings).

---

## 10. Phân pha & Checklist

### Phase 1 — Core Backend (3-4 ngày)

- [ ] Init project: `wrangler.toml`, `package.json`, `tsconfig.json`
- [ ] Tạo D1 database + R2 bucket
- [ ] Write migration SQL + seed data
- [ ] `src/types.ts` — Bindings type definition
- [ ] `src/index.ts` — Hono app entry point, mount routes
- [ ] `src/middleware/cors.ts` — CORS cho frontend domain
- [ ] `src/middleware/auth.ts` — JWT verify middleware
- [ ] `src/routes/auth.ts` — Login endpoint + JWT sign
- [ ] `src/routes/subscriber.ts` — POST /api/subscribe (migrate từ code hiện tại)
- [ ] `src/routes/public.ts` — GET /api/faqs, /api/media, /api/settings
- [ ] `src/routes/admin-faq.ts` — CRUD FAQ
- [ ] `src/routes/admin-settings.ts` — GET/PUT settings
- [ ] `src/routes/admin-media.ts` — CRUD media + R2 upload/delete
- [ ] `src/routes/admin-publish.ts` — Generate media-config.json
- [ ] `src/services/r2.ts` — R2 helpers (put, delete, getPublicUrl)
- [ ] `src/services/config-gen.ts` — Build media-config.json từ DB
- [ ] Test tất cả endpoints với `wrangler dev`
- [ ] Deploy test: `wrangler deploy`

### Phase 2 — Admin Panel UI (4-5 ngày)

- [ ] `admin-ui/login.html` — Login form
- [ ] `admin-ui/admin.css` — Dark premium theme
- [ ] `admin-ui/index.html` — Dashboard layout (header, sidebar/tabs, content area)
- [ ] `admin-ui/admin.js` — API client (fetch wrapper with JWT)
- [ ] Dashboard: Media grid grouped by section
- [ ] Upload modal: Drag & drop + validation + progress
- [ ] Edit modal: Alt text, caption, visibility toggle
- [ ] Delete confirmation
- [ ] FAQ Manager page
- [ ] Settings page
- [ ] Subscribers page + CSV export
- [ ] Publish button: call /api/admin/publish → download config
- [ ] Serve admin UI từ Worker route `/admin/*`

### Phase 3 — Frontend Integration (2-3 ngày)

- [ ] Sửa `frontend/script.js` — newsletter form gọi API
- [ ] Sửa `frontend/build-prod.js` — đọc media-config.json
- [ ] Write migration script: upload existing `assets/` → R2
- [ ] Test full flow: Admin upload → Publish → Build → Deploy Pages

### Phase 4 — Polish (2-3 ngày)

- [ ] Thêm tiếng Việt (VN) vào i18n (cập nhật `i18n.js`, `build-i18n.js`)
- [ ] Rate limiting cho /api/subscribe
- [ ] Image optimization: convert gallery PNGs → WebP trước khi upload R2
- [ ] Error handling + loading states trong admin UI
- [ ] Test mobile admin UI
- [ ] Lighthouse audit

---

## Tài liệu tham khảo

| Tài liệu | Vị trí |
|-----------|--------|
| Admin Console Design Doc (của dev Vũ) | `frontend/docs/admin-console-design.md` |
| Hono on Cloudflare Workers | https://hono.dev/docs/getting-started/cloudflare-workers |
| Cloudflare D1 docs | https://developers.cloudflare.com/d1/ |
| Cloudflare R2 docs | https://developers.cloudflare.com/r2/ |
| Wrangler CLI | https://developers.cloudflare.com/workers/wrangler/ |

---

## Ghi chú cho dev

1. **ĐỌC FILE `frontend/docs/admin-console-design.md` TRƯỚC** — có wireframes, data model, validation rules chi tiết
2. **Đừng đụng vào frontend/** — chỉ sửa `script.js` (newsletter form) và `build-prod.js` (media-config) ở Phase 3
3. **Hono context bindings:** Trên Workers, D1 và R2 access qua `c.env.DB` và `c.env.MEDIA` — không import trực tiếp
4. **JWT:** Dùng `hono/jwt` middleware — đã có built-in, không cần thêm lib
5. **Password hashing:** Dùng `bcryptjs` (pure JS) hoặc Web Crypto `PBKDF2` — KHÔNG dùng native `bcrypt`
6. **R2 upload trên Workers:** Dùng `env.MEDIA.put(key, body)` trực tiếp — KHÔNG cần `@aws-sdk/client-s3`
7. **File upload parsing:** Dùng `c.req.parseBody()` của Hono (hỗ trợ multipart) hoặc `hono/body` helper
