# Admin Console — Content & Media Management for Roman Agency Landing Page

> Design document for a full CRUD admin console to manage all media assets
> and data-driven content (products, FAQs, stats, payments, testimonials, subscribers)
> displayed on the romanagency.net landing page.

---

## 1. Current State Analysis

### Landing Page Content Inventory

#### Media Assets

| Section | ID | Media Files | Type | Purpose |
|---------|----|------------|------|---------|
| **Hero** | `hero` | `hero-video-0402.mp4` | Video (autoplay, muted, loop) | Background showcase video |
| **Header** | `brand` | `Container.png` | Image | Brand logo |
| **Marquee** | `marquee` | `meta-logo.png` | Image | Partner logo |
| **Services** | `services` | `service-rental.png`, `service-sales.png`, `service-managed.png` | Images (3) | Service card illustrations |
| **Resources** | `resources` | `SD1.png`, `SD2.png` | Images (2) | Spend proof gallery (rotating) |
| **Proof — Campaign** | `proof-campaign` | `SD3.png`, `SD7.png`, `SD-extra.jpg` | Images (3) | Campaign spend screenshots |
| **Proof — System** | `proof-system` | `SD5.png`, `SD6.png` | Images (2) | Account system proof |
| **Proof — BMs** | `proof-bm` | `BM-3.jpg`, `BM-1.jpg`, `BM-2.jpg` | Images (3) | Verified BM screenshots |
| **Proof — SiGMA** | `proof-sigma` | `gallery-large-1.jpg` – `gallery-large-4.jpg` | Images (4) | Event gallery |
| **Proof — Affiliate** | `proof-affiliate` | `gallery-large-5.jpg`, `gallery-large-7.jpg`, `gallery-large-8.jpg` | Images (4) | Event gallery |
| **OG/Twitter** | `meta` | `hero-bg.png` | Image | Social sharing preview |
| **Favicon** | `favicon` | `image-removebg-preview.png` | Image | Browser tab icon |

**Total: ~28 media assets across 12 sections**

#### Data-Driven Sections (Non-Media)

| Section | ID | Current Items | Data Type | Purpose |
|---------|----|--------------|-----------|---------|
| **Stats** | `stats` | 4 stat cards | Structured data | "Performance You Can Trust" — counters with value/prefix/suffix/label/description |
| **Products** | `products` | ~14 product cards | Structured data | "Our Products" — 4 tabs (Personal/BM/Fanpage/Profile), each with cards showing name/limit/description |
| **Payment Methods** | `payment` | 3 crypto cards | Structured data | USDT/BTC/ETH with wallet addresses per network (TRC-20, ERC-20, etc.) |
| **Testimonials** | `testimonials` | 3 testimonial cards | Text data | "Client Results" — quote, author name, author role |
| **FAQ** | `faq` | 4 Q&A pairs | Text data | Accordion with question/answer pairs |
| **Newsletter** | `newsletter` | Email form (no backend) | User submissions | "Stay Updated" — email collection (currently non-functional) |

**Total: ~28 media assets + ~28 data items + 1 form across 18 managed sections**

### Current Architecture

```
agency-landing-page/
├── index.html              ← Main EN landing page (vanilla HTML)
├── zh/index.html           ← Chinese localized
├── ru/index.html           ← Russian localized
├── styles.css              ← Plain CSS (no framework)
├── assets/                 ← ALL media stored here statically
├── build-prod.js           ← Minifier (terser + clean-css + html-minifier)
├── build-i18n.js           ← i18n builder
└── package.json            ← devDependencies only (no backend)
```

**Key constraint:** Purely static site. No backend, no CMS, no database.

---

## 2. Architecture Decision

### Chosen Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | Node.js + Express | Matches existing build tooling (Node.js). Minimal learning curve. |
| **Database** | SQLite (via `better-sqlite3`) | Zero-config, file-based. Perfect for single-admin use. No external DB needed. |
| **Storage** | Cloudflare R2 | S3-compatible, zero egress fees, global CDN via R2.dev. Cost-effective for image/video hosting. |
| **Auth** | Session-based + bcrypt | Single admin user. Simple, secure. No need for OAuth/JWT complexity. |
| **Admin UI** | Vanilla HTML/CSS/JS | Consistent with landing page tech. No React/Vue overhead for a simple panel. |
| **Landing Page Integration** | JSON config file | Admin writes `site-config.json` → build script reads it → injects URLs and data into HTML. |
| **Newsletter** | Live API endpoint | Single public route (`POST /api/v1/subscribe`) for email collection at runtime. |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Console                           │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐         │
│  │ Admin UI  │→ │ Express  │→ │ Cloudflare R2    │         │
│  │ (HTML/JS) │  │ REST API │  │ (media storage)  │         │
│  └───────────┘  └────┬─────┘  └──────────────────┘         │
│                      │                                       │
│                 ┌────┴─────┐                                 │
│                 │  SQLite  │                                  │
│                 │ (media,  │                                  │
│                 │  faqs,   │                                  │
│                 │ products,│                                  │
│                 │  stats,  │                                  │
│                 │ payments,│                                  │
│                 │ reviews, │                                  │
│                 │ subs)    │                                  │
│                 └────┬─────┘                                 │
│                      │                                       │
│              ┌───────┴────────┐                              │
│              │ site-config    │                               │
│              │    .json       │                               │
│              └───────┬────────┘                              │
│                      │  (build step reads this)              │
└──────────────────────┼──────────────────────────────────────┘
                       │
              ┌────────┴─────────┐
              │  Landing Page    │
              │  (static HTML)   │
              │  images → R2 CDN │
              │                  │──→ POST /api/v1/subscribe
              │  newsletter form │     (runtime, live API)
              └──────────────────┘
```

---

## 3. Data Model

### `media_items` Table

```sql
CREATE TABLE media_items (
  id            TEXT PRIMARY KEY,          -- e.g., "hero-video", "service-rental"
  section       TEXT NOT NULL,             -- e.g., "hero", "services", "proof-campaign"
  slot          TEXT NOT NULL,             -- e.g., "video", "card-1", "screenshot-1"
  file_name     TEXT NOT NULL,             -- original upload filename
  r2_key        TEXT NOT NULL,             -- R2 object key: "media/{section}/{uuid}.{ext}"
  r2_url        TEXT NOT NULL,             -- public CDN URL
  mime_type     TEXT NOT NULL,             -- e.g., "image/png", "video/mp4"
  file_size     INTEGER NOT NULL,          -- bytes
  width         INTEGER,                   -- px (null for video)
  height        INTEGER,                   -- px (null for video)
  alt_text      TEXT DEFAULT '',           -- accessibility alt text
  caption       TEXT DEFAULT '',           -- optional caption/label (e.g., "$56,439")
  caption_sub   TEXT DEFAULT '',           -- optional sub-caption (e.g., "221 campaigns")
  sort_order    INTEGER DEFAULT 0,         -- ordering within section
  is_visible    INTEGER DEFAULT 1,         -- 0 = hidden, 1 = shown
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_media_section ON media_items(section);
CREATE INDEX idx_media_visible ON media_items(is_visible);
```

### `admin_users` Table

```sql
CREATE TABLE admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,             -- bcrypt
  created_at    TEXT DEFAULT (datetime('now'))
);
```

### `faqs` Table

```sql
CREATE TABLE faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question    TEXT NOT NULL,               -- "How is the fee calculated?"
  answer      TEXT NOT NULL,               -- Rich text / HTML answer
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,           -- 0 = hidden, 1 = shown
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_faqs_visible ON faqs(is_visible);
```

### `stats` Table

```sql
CREATE TABLE stats (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT NOT NULL,               -- "Ad Spend Managed"
  value       INTEGER NOT NULL,            -- 20000000
  prefix      TEXT DEFAULT '',             -- "$"
  suffix      TEXT DEFAULT '',             -- "+"
  description TEXT DEFAULT '',             -- "Massive volume handled across..."
  icon_key    TEXT DEFAULT 'dollar',       -- maps to SVG: "dollar", "user", "clock", "shield"
  card_style  TEXT DEFAULT 'dark',         -- "gold", "dark", "green", "outline"
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
```

### `products` Table

```sql
CREATE TABLE products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT NOT NULL,               -- "personal", "bm", "fanpage", "profile"
  sub_group   TEXT DEFAULT '',             -- "new", "old" (used by personal accounts)
  name        TEXT NOT NULL,               -- "Personal account (new)"
  limit_text  TEXT NOT NULL,               -- "Limit $50", "No limit", "BM Limit $250"
  description TEXT NOT NULL,               -- card body text
  icon_key    TEXT DEFAULT 'fb',           -- "fb", "house", "page", "profile" → maps to SVG
  is_gold     INTEGER DEFAULT 0,           -- 1 = gold highlight card
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_visible ON products(is_visible);
```

### `payment_methods` + `wallet_addresses` Tables

```sql
CREATE TABLE payment_methods (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,               -- "USDT"
  label       TEXT NOT NULL,               -- "Tether"
  icon_key    TEXT NOT NULL,               -- "usdt", "btc", "eth"
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE wallet_addresses (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  network           TEXT NOT NULL,         -- "TRC-20", "ERC-20", "BTC", "ETH"
  address           TEXT NOT NULL,         -- "TCDunashF4ntpBhReGXK31DHoRNYXoeRoY"
  sort_order        INTEGER DEFAULT 0,
  is_visible        INTEGER DEFAULT 1
);

CREATE INDEX idx_wallet_payment ON wallet_addresses(payment_method_id);
```

### `testimonials` Table

```sql
CREATE TABLE testimonials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  quote         TEXT NOT NULL,             -- "Scaled from $5K to $80K/month..."
  author_name   TEXT NOT NULL,             -- "Alex T."
  author_role   TEXT NOT NULL,             -- "E-commerce, Shopify"
  avatar_r2_key TEXT DEFAULT '',           -- optional avatar image in R2
  avatar_r2_url TEXT DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  is_visible    INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_testimonials_visible ON testimonials(is_visible);
```

### `subscribers` Table

```sql
CREATE TABLE subscribers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT UNIQUE NOT NULL,
  status          TEXT DEFAULT 'active',   -- "active", "unsubscribed"
  ip_address      TEXT DEFAULT '',
  subscribed_at   TEXT DEFAULT (datetime('now')),
  unsubscribed_at TEXT
);

CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_email ON subscribers(email);
```

### `site-config.json` (Generated Output)

The admin console generates this file. The build script reads it to produce the final HTML.

```jsonc
{
  // ─── Media Assets ───
  "hero": {
    "video": {
      "url": "https://pub-xxx.r2.dev/media/hero/abc123.mp4",
      "alt": "Roman Agency showcase video"
    }
  },
  "services": {
    "card-1": {
      "url": "https://pub-xxx.r2.dev/media/services/def456.png",
      "alt": "Ad Account Rental illustration"
    },
    "card-2": { "url": "...", "alt": "..." },
    "card-3": { "url": "...", "alt": "..." }
  },
  "proof-campaign": {
    "items": [
      {
        "url": "https://pub-xxx.r2.dev/media/proof/ghi789.png",
        "alt": "Ads Manager showing $56,439 total spend",
        "caption": "$56,439",
        "caption_sub": "221 campaigns",
        "visible": true
      }
    ]
  },
  "proof-sigma": {
    "items": [
      {
        "url": "https://pub-xxx.r2.dev/media/gallery/jkl012.jpg",
        "alt": "Roman Agency team at SiGMA World event",
        "visible": true
      }
    ]
  },
  // ... other media sections

  // ─── Stats ("Performance You Can Trust") ───
  "stats": [
    {
      "label": "Ad Spend Managed",
      "value": 20000000,
      "prefix": "$",
      "suffix": "+",
      "description": "Massive volume handled across Facebook and TikTok campaigns.",
      "icon_key": "dollar",
      "card_style": "gold"
    },
    {
      "label": "Active Accounts",
      "value": 50000,
      "prefix": "",
      "suffix": "+",
      "description": "Ready-to-run accounts available for fast campaign deployment.",
      "icon_key": "user",
      "card_style": "dark"
    }
    // ... more stat cards
  ],

  // ─── Products ("Our Products") ───
  "products": {
    "categories": ["personal", "bm", "fanpage", "profile"],
    "items": [
      {
        "category": "personal",
        "sub_group": "new",
        "name": "Personal account (new)",
        "limit_text": "Limit $50",
        "description": "Never used before, with the ability to change time zone and currency...",
        "icon_key": "fb",
        "is_gold": false
      },
      {
        "category": "personal",
        "sub_group": "new",
        "name": "Personal account (new)",
        "limit_text": "No limit",
        "description": "Never used before... Can spend from $5000 USD to unlimited per day.",
        "icon_key": "fb",
        "is_gold": true
      }
      // ... more products
    ]
  },

  // ─── Payment Methods ───
  "payments": [
    {
      "name": "USDT",
      "label": "Tether",
      "icon_key": "usdt",
      "wallets": [
        { "network": "TRC-20", "address": "TCDunashF4ntpBhReGXK31DHoRNYXoeRoY" },
        { "network": "ERC-20", "address": "0xeec41369dfa92a6e39a67c24cb42bafbaebb3f47" }
      ]
    },
    {
      "name": "BTC",
      "label": "Bitcoin",
      "icon_key": "btc",
      "wallets": [
        { "network": "BTC", "address": "16VTG54exkPyVmQpDD5zVhemN9aUyE4Fne" }
      ]
    }
    // ... more payment methods
  ],

  // ─── Testimonials ("Client Results") ───
  "testimonials": [
    {
      "quote": "Scaled from $5K to $80K/month in 3 months with zero downtime...",
      "author_name": "Alex T.",
      "author_role": "E-commerce, Shopify",
      "avatar_url": ""
    },
    {
      "quote": "The 24/7 support is real...",
      "author_name": "Maria S.",
      "author_role": "Digital Agency Owner",
      "avatar_url": ""
    }
    // ... more testimonials
  ],

  // ─── FAQ ───
  "faqs": [
    {
      "question": "How is the fee calculated?",
      "answer": "You want to spend $1000 and your fee is 8%, then the total amount you need to pay is $1,080..."
    },
    {
      "question": "Can the balance from a banned account be transferred to a new account?",
      "answer": "Usually, this depends on the platform's policies..."
    }
    // ... more FAQs
  ]

  // NOTE: subscribers are NOT included — they are runtime data, not build-time.
}
```

---

## 4. REST API Design

### Base URL

```
/api/v1
```

### Authentication

```
POST   /api/v1/auth/login          — Login (returns session cookie)
POST   /api/v1/auth/logout         — Logout (destroys session)
GET    /api/v1/auth/me             — Check current session
```

### Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/media` | List all media (filterable by `?section=`) |
| `GET` | `/api/v1/media/:id` | Get single media item |
| `POST` | `/api/v1/media` | Upload new media (multipart/form-data) |
| `PATCH` | `/api/v1/media/:id` | Update metadata (alt, caption, visibility, order) |
| `DELETE` | `/api/v1/media/:id` | Delete media (removes from R2 + DB) |
| `PATCH` | `/api/v1/media/reorder` | Batch reorder items within a section |
| `POST` | `/api/v1/media/:id/replace` | Replace file for existing slot (keeps metadata) |

### Publish / Deploy

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/publish` | Generate `site-config.json` and trigger rebuild |
| `GET` | `/api/v1/publish/preview` | Preview what the config would look like |
| `GET` | `/api/v1/publish/history` | List recent publish events |

### FAQ Endpoints (Admin-only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/faqs` | List all FAQs (ordered by `sort_order`) |
| `GET` | `/api/v1/faqs/:id` | Get single FAQ |
| `POST` | `/api/v1/faqs` | Create new FAQ (question + answer) |
| `PATCH` | `/api/v1/faqs/:id` | Update question, answer, visibility, order |
| `DELETE` | `/api/v1/faqs/:id` | Delete FAQ |
| `PATCH` | `/api/v1/faqs/reorder` | Batch reorder FAQs |

### Stats Endpoints (Admin-only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/stats` | List all stat cards |
| `GET` | `/api/v1/stats/:id` | Get single stat |
| `POST` | `/api/v1/stats` | Create new stat card |
| `PATCH` | `/api/v1/stats/:id` | Update value, prefix, suffix, label, description, style |
| `DELETE` | `/api/v1/stats/:id` | Delete stat card |

### Products Endpoints (Admin-only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/products` | List all products (filterable by `?category=`) |
| `GET` | `/api/v1/products/:id` | Get single product |
| `POST` | `/api/v1/products` | Create new product card |
| `PATCH` | `/api/v1/products/:id` | Update name, limit, description, icon, gold, visibility |
| `DELETE` | `/api/v1/products/:id` | Delete product card |
| `PATCH` | `/api/v1/products/reorder` | Batch reorder within a category |

### Payment Methods Endpoints (Admin-only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/payments` | List all payment methods (with nested wallet addresses) |
| `GET` | `/api/v1/payments/:id` | Get single payment method + wallets |
| `POST` | `/api/v1/payments` | Create new payment method |
| `PATCH` | `/api/v1/payments/:id` | Update name, label, icon, visibility |
| `DELETE` | `/api/v1/payments/:id` | Delete payment method (cascades to wallets) |
| `POST` | `/api/v1/payments/:id/wallets` | Add wallet address to a payment method |
| `PATCH` | `/api/v1/payments/:id/wallets/:walletId` | Update wallet network/address |
| `DELETE` | `/api/v1/payments/:id/wallets/:walletId` | Remove wallet address |

### Testimonials Endpoints (Admin-only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/testimonials` | List all testimonials |
| `GET` | `/api/v1/testimonials/:id` | Get single testimonial |
| `POST` | `/api/v1/testimonials` | Create new testimonial |
| `PATCH` | `/api/v1/testimonials/:id` | Update quote, author, role, visibility |
| `DELETE` | `/api/v1/testimonials/:id` | Delete testimonial |
| `POST` | `/api/v1/testimonials/:id/avatar` | Upload avatar image (multipart/form-data) |
| `PATCH` | `/api/v1/testimonials/reorder` | Batch reorder testimonials |

### Subscribers Endpoints (Mixed access)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/subscribe` | **Public** | Submit email from landing page (rate-limited: 3/min per IP) |
| `GET` | `/api/v1/subscribers` | Admin | List all subscribers (paginated, searchable) |
| `GET` | `/api/v1/subscribers/export` | Admin | Export subscribers as CSV |
| `PATCH` | `/api/v1/subscribers/:id` | Admin | Update status (active/unsubscribed) |
| `DELETE` | `/api/v1/subscribers/:id` | Admin | Remove subscriber |

### Request / Response Format

**Envelope pattern** (consistent across all endpoints):

```jsonc
// Success
{
  "success": true,
  "data": { /* resource or array */ },
  "meta": { "total": 28, "section": "proof-campaign" }
}

// Error
{
  "success": false,
  "error": {
    "code": "MEDIA_NOT_FOUND",
    "message": "Media item with id 'xyz' does not exist",
    "status": 404
  }
}
```

### Upload Request Example

```
POST /api/v1/media
Content-Type: multipart/form-data

Fields:
  section:     "proof-campaign"
  slot:        "screenshot-4"       (optional — auto-generated if omitted)
  alt_text:    "New campaign screenshot showing $80,000 spend"
  caption:     "$80,000"
  caption_sub: "150 campaigns"
  file:        <binary>
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "proof-campaign-screenshot-4",
    "section": "proof-campaign",
    "slot": "screenshot-4",
    "r2_url": "https://pub-xxx.r2.dev/media/proof-campaign/a1b2c3d4.png",
    "mime_type": "image/png",
    "file_size": 245830,
    "alt_text": "New campaign screenshot showing $80,000 spend",
    "caption": "$80,000",
    "caption_sub": "150 campaigns",
    "sort_order": 3,
    "is_visible": true,
    "created_at": "2026-04-06T12:00:00Z"
  }
}
```

---

## 5. Cloudflare R2 Setup

### Bucket Structure

```
roman-agency-media/
├── media/
│   ├── hero/
│   │   └── {uuid}.mp4
│   ├── brand/
│   │   └── {uuid}.png
│   ├── services/
│   │   ├── {uuid}.png
│   │   ├── {uuid}.png
│   │   └── {uuid}.png
│   ├── resources/
│   │   ├── {uuid}.png
│   │   └── {uuid}.png
│   ├── proof-campaign/
│   │   ├── {uuid}.png
│   │   └── {uuid}.jpg
│   ├── proof-system/
│   ├── proof-bm/
│   ├── proof-sigma/
│   ├── proof-affiliate/
│   └── meta/
│       ├── {uuid}.png          (og-image)
│       └── {uuid}.png          (favicon)
└── backups/                     (old versions kept for rollback)
    └── {timestamp}/{section}/{old-uuid}.ext
```

### R2 Configuration

```env
# .env (NEVER commit this)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=roman-agency-media
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

### Upload Flow

```
Admin uploads file
       │
       ▼
Express validates (type, size, dimensions)
       │
       ▼
Generate UUID filename → "media/{section}/{uuid}.{ext}"
       │
       ▼
Upload to R2 via S3-compatible API (@aws-sdk/client-s3)
       │
       ▼
Save metadata to SQLite (r2_key, r2_url, etc.)
       │
       ▼
Return CDN URL to admin UI
```

### Validation Rules

| Check | Images | Videos |
|-------|--------|--------|
| **Max size** | 5 MB | 50 MB |
| **Allowed types** | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` | `video/mp4`, `video/webm` |
| **Max dimensions** | 4096 × 4096 px | — |
| **Min dimensions** | 200 × 200 px | — |

---

## 6. Admin UI Screens

### 6.1 Login Screen

```
┌──────────────────────────────────────┐
│         Roman Agency Admin           │
│                                      │
│    ┌─────────────────────────┐       │
│    │ Username                │       │
│    └─────────────────────────┘       │
│    ┌─────────────────────────┐       │
│    │ Password                │       │
│    └─────────────────────────┘       │
│                                      │
│    [ Login ]                         │
└──────────────────────────────────────┘
```

### 6.2 Dashboard (Main View)

```
┌─────────────────────────────────────────────────────────────────┐
│  Roman Agency Admin              [ Publish Changes ] [ Logout ] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── Navigation ─────────────────────────────────────────┐     │
│  │ [Media] [Stats] [Products] [Payments] [Testimonials]   │     │
│  │ [FAQ] [Subscribers]                                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌─── Section Filter (Media) ─────────────────────────────┐    │
│  │ [All] [Hero] [Services] [Resources] [Proof] [Gallery]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════╗       │
│  ║  HERO                                     [+ Add]    ║       │
│  ╠═══════════════════════════════════════════════════════╣       │
│  ║  ┌──────┐                                            ║       │
│  ║  │▶ MP4 │  hero-video-0402.mp4                       ║       │
│  ║  │      │  Alt: "Roman Agency showcase video"        ║       │
│  ║  │ 12MB │  CDN: https://pub-xxx.r2.dev/media/...     ║       │
│  ║  └──────┘  [Replace] [Edit] [Delete]                 ║       │
│  ╚═══════════════════════════════════════════════════════╝       │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════╗       │
│  ║  SERVICES                                 [+ Add]    ║       │
│  ╠═══════════════════════════════════════════════════════╣       │
│  ║  ┌──────┐  ┌──────┐  ┌──────┐                       ║       │
│  ║  │ IMG  │  │ IMG  │  │ IMG  │                        ║       │
│  ║  │card-1│  │card-2│  │card-3│                        ║       │
│  ║  └──────┘  └──────┘  └──────┘                        ║       │
│  ║  ☰ Drag to reorder                                   ║       │
│  ╚═══════════════════════════════════════════════════════╝       │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════╗       │
│  ║  PROOF — CAMPAIGN RESULTS                 [+ Add]    ║       │
│  ╠═══════════════════════════════════════════════════════╣       │
│  ║  ┌──────┐  ┌──────┐  ┌──────┐                       ║       │
│  ║  │SD3   │  │SD7   │  │SD-ex │                        ║       │
│  ║  │$56k  │  │$25k  │  │High  │                        ║       │
│  ║  │ ✅   │  │ ✅   │  │ ✅   │                        ║       │
│  ║  └──────┘  └──────┘  └──────┘                        ║       │
│  ║  ☰ Drag to reorder                                   ║       │
│  ╚═══════════════════════════════════════════════════════╝       │
│                                                                 │
│  ... (more sections: proof-system, proof-bm, galleries, etc.)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Edit Media Modal

```
┌──────────────────────────────────────────────┐
│  Edit Media Item                        [×]  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────┐                      │
│  │                    │  Section: proof-bm   │
│  │    [Preview]       │  Slot: bm-1          │
│  │                    │  Size: 245 KB        │
│  │                    │  Type: image/jpeg    │
│  └────────────────────┘  Uploaded: 2026-04-06│
│                                              │
│  Alt text:                                   │
│  ┌──────────────────────────────────────┐    │
│  │ Algerian Fashion Hub AG - Verified   │    │
│  │ BM 2500                              │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Caption:                                    │
│  ┌──────────────────────────────────────┐    │
│  │ Algerian Fashion Hub                 │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Sub-caption:                                │
│  ┌──────────────────────────────────────┐    │
│  │ BM 2500 · Verified                   │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Visible: [✅ Yes]                           │
│                                              │
│  [Replace File]  [Save Changes]  [Cancel]    │
└──────────────────────────────────────────────┘
```

### 6.4 Upload New Media

```
┌──────────────────────────────────────────────┐
│  Upload New Media                       [×]  │
├──────────────────────────────────────────────┤
│                                              │
│  Section:                                    │
│  ┌──────────────────────────────────────┐    │
│  │ proof-campaign                    ▼  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │     📁 Drag & drop file here         │    │
│  │        or click to browse            │    │
│  │                                      │    │
│  │     Max: 5MB images / 50MB video     │    │
│  │     PNG, JPG, WebP, SVG, MP4, WebM   │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Alt text:                                   │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Caption (optional):                         │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [Upload]                                    │
└──────────────────────────────────────────────┘
```

### 6.5 Stats Manager

```
┌─────────────────────────────────────────────────────────────────┐
│  PERFORMANCE YOU CAN TRUST                          [+ Add]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [gold]  $20,000,000+                                    │    │
│  │  Label: Ad Spend Managed                                │    │
│  │  Desc: Massive volume handled across Facebook and...    │    │
│  │  Value: 20000000  Prefix: $  Suffix: +  Style: gold     │    │
│  │  [Edit] [Delete]                              ✅ Visible │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [dark]  50,000+                                         │    │
│  │  Label: Active Accounts                                 │    │
│  │  [Edit] [Delete]                              ✅ Visible │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [green] 24/7                                            │    │
│  │  Label: Support Available                               │    │
│  │  [Edit] [Delete]                              ✅ Visible │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [outline] 100%                                          │    │
│  │  Label: Refund For Unused Budget                        │    │
│  │  [Edit] [Delete]                              ✅ Visible │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 Products Manager

```
┌─────────────────────────────────────────────────────────────────┐
│  OUR PRODUCTS                                       [+ Add]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── Category Filter ─────────────────────────────────────┐    │
│  │ [Personal] [BM] [Fanpage] [Profile]                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Sub-group: new                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Limit $50│  │Limit $250│  │Limit 1500│  │ No limit │        │
│  │ Personal │  │ Personal │  │ Personal │  │ ★ GOLD  │        │
│  │ (new)    │  │ (new)    │  │ (new)    │  │ Personal │        │
│  │[Edit][×] │  │[Edit][×] │  │[Edit][×] │  │[Edit][×] │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ☰ Drag to reorder                                              │
│                                                                  │
│  Sub-group: old                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Limit $50│  │Limit $250│  │Limit 1500│  │ No limit │        │
│  │ Personal │  │ Personal │  │ Personal │  │ ★ GOLD  │        │
│  │ (old)    │  │ (old)    │  │ (old)    │  │ Personal │        │
│  │[Edit][×] │  │[Edit][×] │  │[Edit][×] │  │[Edit][×] │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ☰ Drag to reorder                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.7 Edit Product Modal

```
┌──────────────────────────────────────────────┐
│  Edit Product                          [×]   │
├──────────────────────────────────────────────┤
│                                              │
│  Category:                                   │
│  ┌──────────────────────────────────────┐    │
│  │ personal                          ▼  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Sub-group:                                  │
│  ┌──────────────────────────────────────┐    │
│  │ new                               ▼  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Name:                                       │
│  ┌──────────────────────────────────────┐    │
│  │ Personal account (new)              │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Limit text:                                 │
│  ┌──────────────────────────────────────┐    │
│  │ Limit $50                           │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Description:                                │
│  ┌──────────────────────────────────────┐    │
│  │ Never used before, with the ability │    │
│  │ to change time zone and currency... │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Icon: [fb ▼]   Gold highlight: [☐ No]       │
│  Visible: [✅ Yes]                           │
│                                              │
│  [Save Changes]  [Cancel]                    │
└──────────────────────────────────────────────┘
```

### 6.8 Payment Methods Manager

```
┌─────────────────────────────────────────────────────────────────┐
│  PAYMENT METHODS                                [+ Add Method]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ╔═══════════════════════════════════════════════════════╗       │
│  ║  USDT — Tether                         [Edit] [×]    ║       │
│  ╠═══════════════════════════════════════════════════════╣       │
│  ║                                                       ║       │
│  ║  TRC-20: TCDunashF4ntpBhReGXK31DHoRNYXoeRoY   [Edit]║       │
│  ║  ERC-20: 0xeec41369dfa92a6e39a67c24cb42baf...  [Edit]║       │
│  ║                                                       ║       │
│  ║  [+ Add Wallet Address]                               ║       │
│  ╚═══════════════════════════════════════════════════════╝       │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════╗       │
│  ║  BTC — Bitcoin                         [Edit] [×]     ║       │
│  ╠═══════════════════════════════════════════════════════╣       │
│  ║  BTC: 16VTG54exkPyVmQpDD5zVhemN9aUyE4Fne      [Edit]║       │
│  ║                                                       ║       │
│  ║  [+ Add Wallet Address]                               ║       │
│  ╚═══════════════════════════════════════════════════════╝       │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════╗       │
│  ║  ETH — Ethereum                        [Edit] [×]    ║       │
│  ╠═══════════════════════════════════════════════════════╣       │
│  ║  ETH: 0xeec41369dfa92a6e39a67c24cb42baf...     [Edit]║       │
│  ║                                                       ║       │
│  ║  [+ Add Wallet Address]                               ║       │
│  ╚═══════════════════════════════════════════════════════╝       │
│                                                                  │
│  ⚠ Wallet address changes require confirmation before publish    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.9 Testimonials Manager

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT RESULTS                                     [+ Add]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ "Scaled from $5K to $80K/month in 3 months with zero   │    │
│  │  downtime. When my account got banned, Roman Agency     │    │
│  │  replaced it in 2 hours. Game changer."                 │    │
│  │                                                         │    │
│  │  — Alex T. · E-commerce, Shopify                        │    │
│  │  [Edit] [Delete]                            ✅ Visible   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ "The 24/7 support is real. I had an issue at 3AM..."    │    │
│  │                                                         │    │
│  │  — Maria S. · Digital Agency Owner                      │    │
│  │  [Edit] [Delete]                            ✅ Visible   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ "Transparent spending reports, no hidden fees..."       │    │
│  │                                                         │    │
│  │  — David K. · Affiliate Marketer                        │    │
│  │  [Edit] [Delete]                            ✅ Visible   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ☰ Drag to reorder                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.10 FAQ Manager

```
┌─────────────────────────────────────────────────────────────────┐
│  FAQ                                                [+ Add]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Q: How is the fee calculated?                           │    │
│  │ A: You want to spend $1000 and your fee is 8%, then...  │    │
│  │ [Edit] [Delete]                             ✅ Visible   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Q: Can the balance from a banned account be...          │    │
│  │ A: Usually, this depends on the platform's policies...  │    │
│  │ [Edit] [Delete]                             ✅ Visible   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Q: What happens if the Facebook advertising account...  │    │
│  │ A: In the event an ad account or profile is banned...   │    │
│  │ [Edit] [Delete]                             ✅ Visible   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Q: How to access my account?                            │    │
│  │ A: We will make your account available through an...    │    │
│  │ [Edit] [Delete]                             ✅ Visible   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ☰ Drag to reorder                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.11 Subscribers Manager

```
┌─────────────────────────────────────────────────────────────────┐
│  NEWSLETTER SUBSCRIBERS                     [Export CSV]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──── Search ────────────────────────┐  Status: [All ▼]        │
│  │ 🔍 Search by email...              │  Total: 142 subscribers │
│  └────────────────────────────────────┘                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ Email                  │ Status │ Subscribed   │ Action│      │
│  ├────────────────────────┼────────┼──────────────┼───────┤      │
│  │ john@example.com       │ Active │ 2026-04-06   │  [×]  │      │
│  │ sarah@agency.co        │ Active │ 2026-04-05   │  [×]  │      │
│  │ mike@test.com          │ Unsub  │ 2026-04-03   │  [×]  │      │
│  │ ...                    │        │              │       │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
│  ◀ Page 1 of 6 ▶                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Publish / Build Integration

### How Changes Reach the Landing Page

```
1. Admin uploads/edits media, products, FAQs, etc. in console
                 │
2. Admin clicks "Publish Changes"
                 │
3. Server generates site-config.json from SQLite (all tables)
                 │
4. Build script (enhanced build-prod.js) reads site-config.json
                 │
5. HTML template engine:
   - Replaces asset paths with R2 CDN URLs
   - Generates stats cards from stats array
   - Generates product cards (tabbed, per category/sub-group)
   - Generates payment method cards with wallet addresses
   - Generates testimonial cards
   - Generates FAQ accordion items
                 │
6. Minified HTML deployed to hosting (Cloudflare Pages / Vercel / static host)
```

> **Note on Newsletter:** The subscriber form is the only **runtime** feature.
> It requires the Express server (or a Cloudflare Worker) to be accessible
> from the live landing page at `POST /api/v1/subscribe`.

### Template Approach

Current HTML uses static paths:
```html
<img src="./assets/SD1.png" alt="..." loading="lazy" />
```

Updated HTML uses template markers:
```html
<img src="{{media.resources.item-1.url}}" alt="{{media.resources.item-1.alt}}" loading="lazy" />
```

The build script resolves these from `site-config.json` → produces final static HTML.

### For Dynamic Sections (Galleries)

Gallery sections (proof-sigma, proof-affiliate) have variable item counts. The build script will loop through the config array:

```js
// In enhanced build-prod.js
const config = JSON.parse(fs.readFileSync('site-config.json'));
const sigmaItems = config['proof-sigma'].items.filter(i => i.visible);

let sigmaHTML = sigmaItems.map(item => `
  <figure class="proof-card">
    <img src="${item.url}" alt="${item.alt}" loading="lazy" />
    ${item.caption ? `<figcaption><strong>${item.caption}</strong><span>${item.caption_sub || ''}</span></figcaption>` : ''}
  </figure>
`).join('\n');
```

### For Data-Driven Sections

```js
// Stats
const statsHTML = config.stats.map(stat => `
  <article class="stat-card stat-card--${stat.card_style}">
    <div class="stat-card__icon" aria-hidden="true">${ICON_MAP[stat.icon_key]}</div>
    <span class="stat-card__value stat-item__number"
          data-target="${stat.value}"
          ${stat.prefix ? `data-prefix="${stat.prefix}"` : ''}
          ${stat.suffix ? `data-suffix="${stat.suffix}"` : ''}>${stat.prefix}0${stat.suffix}</span>
    <span class="stat-card__label">${stat.label}</span>
    <p class="stat-card__desc">${stat.description}</p>
  </article>
`).join('\n');

// FAQ
const faqHTML = config.faqs.map((faq, i) => `
  <article class="faq-item${i === 0 ? ' is-open' : ''}">
    <button class="faq-item__trigger" type="button" aria-expanded="${i === 0}">
      <span>${faq.question}</span>
      <span class="faq-item__icon"></span>
    </button>
    <div class="faq-item__panel">
      <p>${faq.answer}</p>
    </div>
  </article>
`).join('\n');

// Testimonials
const testimonialsHTML = config.testimonials.map(t => `
  <article class="testimonial-card">
    <p class="testimonial-card__text">"${t.quote}"</p>
    <div class="testimonial-card__author">
      ${t.avatar_url ? `<img src="${t.avatar_url}" alt="" class="testimonial-card__avatar" />` : ''}
      <span class="testimonial-card__name">${t.author_name}</span>
      <span class="testimonial-card__role">${t.author_role}</span>
    </div>
  </article>
`).join('\n');

// Products (grouped by category + sub_group)
const categories = config.products.categories;
categories.forEach(cat => {
  const items = config.products.items.filter(p => p.category === cat);
  const subGroups = [...new Set(items.map(p => p.sub_group))];
  // Generate tab panel with sub-group labels and product cards
});

// Payments
const paymentsHTML = config.payments.map(pm => `
  <article class="payment-card">
    <div class="payment-card__header">
      <div class="payment-card__icon payment-card__icon--${pm.icon_key}">${PAYMENT_ICON_MAP[pm.icon_key]}</div>
      <div class="payment-card__info"><h3>${pm.name}</h3><p>${pm.label}</p></div>
    </div>
    <div class="wallet-addresses">
      ${pm.wallets.map(w => `
        <div class="wallet-item">
          <span class="wallet-label">${w.network}</span>
          <code class="wallet-addr" data-copy="${w.address}">${w.address}</code>
          <button class="wallet-copy" aria-label="Copy address">Copy</button>
        </div>
      `).join('')}
    </div>
  </article>
`).join('\n');
```

### Newsletter Form (Landing Page JS)

Add to the landing page's client-side JavaScript:

```js
document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  if (!email) return;

  try {
    const res = await fetch('/api/v1/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.success) {
      e.target.email.value = '';
      // Show success toast: "You're subscribed!"
    } else {
      // Show error toast: data.error.message
    }
  } catch (err) {
    // Show error toast: "Something went wrong. Try again."
  }
});
```

---

## 8. File Structure (New)

```
agency-landing-page/
├── index.html                    ← Landing page (now uses template markers)
├── zh/index.html
├── ru/index.html
├── styles.css
├── assets/                       ← Legacy local assets (fallback)
├── site-config.json              ← Generated by admin console (all sections)
├── build-prod.js                 ← Enhanced: reads site-config.json
├── build-i18n.js
├── package.json                  ← Updated with new dependencies
│
├── admin/                        ← NEW: Admin console
│   ├── server.js                 ← Express server entry point
│   ├── routes/
│   │   ├── auth.js               ← Login/logout endpoints
│   │   ├── media.js              ← CRUD + upload endpoints
│   │   ├── publish.js            ← Config generation + build trigger
│   │   ├── faqs.js               ← FAQ CRUD endpoints
│   │   ├── stats.js              ← Stats CRUD endpoints
│   │   ├── products.js           ← Products CRUD endpoints
│   │   ├── payments.js           ← Payment methods + wallet CRUD
│   │   ├── testimonials.js       ← Testimonials CRUD endpoints
│   │   └── subscribers.js        ← Subscriber list (admin) + public subscribe
│   ├── middleware/
│   │   ├── auth.js               ← Session check middleware
│   │   ├── upload.js             ← Multer config + validation
│   │   └── error.js              ← Error handler
│   ├── services/
│   │   ├── r2.js                 ← Cloudflare R2 client (upload/delete)
│   │   ├── db.js                 ← SQLite connection + queries
│   │   └── config-generator.js   ← Builds site-config.json from all DB tables
│   ├── public/                   ← Admin UI static files
│   │   ├── index.html            ← Admin dashboard
│   │   ├── login.html            ← Login page
│   │   ├── admin.css             ← Admin styles
│   │   └── admin.js              ← Admin client-side JS
│   ├── data/
│   │   └── admin.db              ← SQLite database file
│   └── .env                      ← R2 credentials (NEVER commit)
│
├── dist/                         ← Production build output
└── .gitignore                    ← Updated to exclude admin/data/, admin/.env
```

---

## 9. Dependencies (New)

```jsonc
// Added to package.json
{
  "dependencies": {
    "express": "^5.1.0",          // HTTP server
    "better-sqlite3": "^11.8.0",  // SQLite driver
    "@aws-sdk/client-s3": "^3.x", // R2-compatible S3 client
    "multer": "^2.0.0",           // File upload handling
    "bcrypt": "^5.1.1",           // Password hashing
    "express-session": "^1.18.0", // Session management
    "connect-sqlite3": "^0.10.0", // Session store in SQLite
    "dotenv": "^16.5.0",          // Environment variables
    "uuid": "^11.1.0",            // Unique filenames for R2
    "sharp": "^0.33.0",           // Image validation + metadata extraction
    "express-rate-limit": "^7.5.0", // Rate limiting (login + public subscribe)
    "cors": "^2.8.5"             // CORS for public subscribe endpoint
  }
}
```

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Auth** | bcrypt-hashed password, HTTP-only session cookie, `SameSite=Strict` |
| **File uploads** | Validate MIME type (magic bytes, not just extension), size limits, sharp for image validation |
| **R2 credentials** | `.env` file, never committed. R2 keys scoped to single bucket. |
| **CSRF** | `SameSite=Strict` cookie + custom header check on mutations |
| **Admin access** | Run admin server on non-public port (e.g., `localhost:3001`) or behind VPN/Cloudflare Access |
| **SQL injection** | `better-sqlite3` uses prepared statements by default |
| **Path traversal** | UUID-based filenames, no user-controlled paths |
| **Rate limiting** | `express-rate-limit` on login endpoint (5 attempts / 15 min) + subscribe endpoint (3 / min per IP) |
| **Public endpoint** | `POST /api/v1/subscribe` is the only unauthenticated route. Email validated, rate-limited, no PII beyond email. |
| **Wallet addresses** | Publish confirmation step with diff view before wallet address changes go live. Prevents accidental/malicious address swaps. |
| **Email data** | Subscriber emails stored locally in SQLite. Export restricted to admin sessions only. |

---

## 11. Migration Plan (Current Assets → R2)

### One-time Migration Script

```
Step 1:  Create R2 bucket "roman-agency-media" in Cloudflare dashboard
Step 2:  Enable public access (R2.dev subdomain)
Step 3:  Run migration script:
         - Read all files from /assets/
         - Upload each to R2 under media/{section}/{uuid}.{ext}
         - Create SQLite records with metadata
Step 4:  Seed data-driven sections from current HTML:
         - Parse 4 stat cards → insert into stats table
         - Parse ~14 product cards → insert into products table
         - Parse 3 payment methods + wallet addresses → insert into payment_methods + wallet_addresses
         - Parse 3 testimonials → insert into testimonials table
         - Parse 4 FAQ items → insert into faqs table
Step 5:  Generate initial site-config.json
Step 6:  Update build-prod.js to read site-config.json
Step 7:  Build + deploy landing page
Step 8:  Verify all images load from R2 CDN + all data sections render correctly
Step 9:  Keep /assets/ as fallback (remove later)
```

---

## 12. Implementation Phases

### Phase 1 — Core Backend (Day 1-2)
- [ ] Express server setup with SQLite
- [ ] Auth system (login/session)
- [ ] R2 client integration
- [ ] Media CRUD API endpoints
- [ ] File upload with validation
- [ ] FAQ CRUD API
- [ ] Stats CRUD API
- [ ] Products CRUD API
- [ ] Payment Methods + Wallets CRUD API
- [ ] Testimonials CRUD API

### Phase 2 — Admin UI (Day 2-4)
- [ ] Login page
- [ ] Dashboard with section-grouped media grid
- [ ] Upload modal with drag-and-drop
- [ ] Edit modal (alt text, caption, visibility)
- [ ] Delete confirmation
- [ ] Stats manager screen
- [ ] Products manager screen (tabbed by category)
- [ ] Payment methods manager screen (nested wallet editing)
- [ ] Testimonials manager screen
- [ ] FAQ manager screen (question/answer editing)

### Phase 3 — Publish Pipeline (Day 4-5)
- [ ] Config generator (SQLite → site-config.json for ALL tables)
- [ ] Enhanced build-prod.js (template resolution for media + data sections)
- [ ] Publish button + rebuild trigger
- [ ] Preview before publish
- [ ] Wallet address change confirmation on publish

### Phase 4 — Newsletter & Subscribers (Day 5-6)
- [ ] Public `POST /api/v1/subscribe` endpoint (rate-limited, email validation)
- [ ] Landing page JS: newsletter form submission via fetch
- [ ] Admin subscribers list (paginated, searchable)
- [ ] CSV export for subscriber emails
- [ ] Subscriber status management (active/unsubscribed)

### Phase 5 — Polish (Day 6-7)
- [ ] Drag-and-drop reordering (media, FAQ, testimonials, products)
- [ ] Image preview/lightbox in admin
- [ ] Migration script for existing assets + data seeding from HTML
- [ ] Error handling + loading states
- [ ] Mobile-responsive admin UI
- [ ] i18n support for data-driven sections (optional)

---

## 13. npm Scripts (Updated)

```jsonc
{
  "scripts": {
    "admin": "node admin/server.js",                    // Start admin console
    "admin:init": "node admin/scripts/init-db.js",      // Create DB + seed admin user
    "admin:migrate": "node admin/scripts/migrate.js",   // Migrate existing assets + data to DB
    "admin:seed": "node admin/scripts/seed-data.js",    // Seed stats/products/payments/testimonials/FAQs from HTML
    "build:i18n": "node build-i18n.js",                 // Existing
    "build:prod": "node build-prod.js",                 // Enhanced with site-config.json
    "publish": "node admin/scripts/publish.js"           // Generate config + build
  }
}
```

---

## 14. Open Questions

| # | Question | Options |
|---|----------|---------|
| 1 | Should admin run on same host as landing page or separate? | Same (port 3001) / Separate server |
| 2 | Do you need multi-language caption support in admin? | Yes (EN/ZH/RU per field) / No (EN only) |
| 3 | Should "Publish" auto-deploy or just generate files? | Auto-deploy (CI/CD hook) / Manual deploy |
| 4 | Do you want image optimization on upload (WebP conversion, resize)? | Yes / No |
| 5 | Do you need audit logging (who changed what, when)? | Yes / No |
| 6 | Should the newsletter `POST /api/v1/subscribe` be served by the Express admin server or a separate Cloudflare Worker? | Express (simpler, one server) / Worker (serverless, no admin server needed for live site) |
| 7 | Do FAQ answers need rich text (HTML formatting, links, bold) or plain text only? | Rich text (WYSIWYG editor) / Plain text |
| 8 | Should product prices/fees be managed in admin or remain in external pricing? | Admin-managed / External |
| 9 | Do you want email notifications when new subscribers sign up? | Yes (e.g., via webhook/Telegram bot) / No |
| 10 | Should wallet address changes require a confirmation step (diff review) before publish? | Yes (recommended for security) / No |
