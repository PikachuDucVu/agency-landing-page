# Admin Console — Media Management for Roman Agency Landing Page

> Design document for a full CRUD admin console to manage all media assets
> displayed on the romanagency.net landing page.

---

## 1. Current State Analysis

### Landing Page Media Inventory

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
| **Landing Page Integration** | JSON config file | Admin writes `media-config.json` → build script reads it → injects URLs into HTML. |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Admin Console                      │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Admin UI  │→ │ Express  │→ │ Cloudflare R2    │  │
│  │ (HTML/JS) │  │ REST API │  │ (media storage)  │  │
│  └───────────┘  └────┬─────┘  └──────────────────┘  │
│                      │                               │
│                 ┌────┴─────┐                         │
│                 │  SQLite  │                         │
│                 │ (metadata│                         │
│                 │  + state)│                         │
│                 └────┬─────┘                         │
│                      │                               │
│              ┌───────┴────────┐                      │
│              │ media-config   │                      │
│              │    .json       │                      │
│              └───────┬────────┘                      │
│                      │  (build step reads this)      │
└──────────────────────┼──────────────────────────────┘
                       │
              ┌────────┴─────────┐
              │  Landing Page    │
              │  (static HTML)   │
              │  images → R2 CDN │
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

### `media_config.json` (Generated Output)

The admin console generates this file. The build script reads it to produce the final HTML.

```jsonc
{
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
  }
  // ... other sections
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
| `POST` | `/api/v1/publish` | Generate `media-config.json` and trigger rebuild |
| `GET` | `/api/v1/publish/preview` | Preview what the config would look like |
| `GET` | `/api/v1/publish/history` | List recent publish events |

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
│  ┌─── Section Filter ───────────────────────────────────────┐   │
│  │ [All] [Hero] [Services] [Resources] [Proof] [Gallery]    │   │
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

---

## 7. Publish / Build Integration

### How Changes Reach the Landing Page

```
1. Admin uploads/edits media in console
                 │
2. Admin clicks "Publish Changes"
                 │
3. Server generates media-config.json from SQLite
                 │
4. Build script (enhanced build-prod.js) reads media-config.json
                 │
5. HTML template engine replaces asset paths with R2 CDN URLs
                 │
6. Minified HTML deployed to hosting (Cloudflare Pages / Vercel / static host)
```

### Template Approach

Current HTML uses static paths:
```html
<img src="./assets/SD1.png" alt="..." loading="lazy" />
```

Updated HTML uses template markers:
```html
<img src="{{media.resources.item-1.url}}" alt="{{media.resources.item-1.alt}}" loading="lazy" />
```

The build script resolves these from `media-config.json` → produces final static HTML.

### For Dynamic Sections (Galleries)

Gallery sections (proof-sigma, proof-affiliate) have variable item counts. The build script will loop through the config array:

```js
// In enhanced build-prod.js
const config = JSON.parse(fs.readFileSync('media-config.json'));
const sigmaItems = config['proof-sigma'].items.filter(i => i.visible);

let sigmaHTML = sigmaItems.map(item => `
  <figure class="proof-card">
    <img src="${item.url}" alt="${item.alt}" loading="lazy" />
    ${item.caption ? `<figcaption><strong>${item.caption}</strong><span>${item.caption_sub || ''}</span></figcaption>` : ''}
  </figure>
`).join('\n');
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
├── media-config.json             ← Generated by admin console
├── build-prod.js                 ← Enhanced: reads media-config.json
├── build-i18n.js
├── package.json                  ← Updated with new dependencies
│
├── admin/                        ← NEW: Admin console
│   ├── server.js                 ← Express server entry point
│   ├── routes/
│   │   ├── auth.js               ← Login/logout endpoints
│   │   ├── media.js              ← CRUD + upload endpoints
│   │   └── publish.js            ← Config generation + build trigger
│   ├── middleware/
│   │   ├── auth.js               ← Session check middleware
│   │   ├── upload.js             ← Multer config + validation
│   │   └── error.js              ← Error handler
│   ├── services/
│   │   ├── r2.js                 ← Cloudflare R2 client (upload/delete)
│   │   ├── db.js                 ← SQLite connection + queries
│   │   └── config-generator.js   ← Builds media-config.json from DB
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
    "sharp": "^0.33.0"            // Image validation + metadata extraction
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
| **Rate limiting** | `express-rate-limit` on login endpoint (5 attempts / 15 min) |

---

## 11. Migration Plan (Current Assets → R2)

### One-time Migration Script

```
Step 1: Create R2 bucket "roman-agency-media" in Cloudflare dashboard
Step 2: Enable public access (R2.dev subdomain)
Step 3: Run migration script:
        - Read all files from /assets/
        - Upload each to R2 under media/{section}/{uuid}.{ext}
        - Create SQLite records with metadata
        - Generate initial media-config.json
Step 4: Update build-prod.js to read media-config.json
Step 5: Build + deploy landing page
Step 6: Verify all images load from R2 CDN
Step 7: Keep /assets/ as fallback (remove later)
```

---

## 12. Implementation Phases

### Phase 1 — Core Backend (Day 1-2)
- [ ] Express server setup with SQLite
- [ ] Auth system (login/session)
- [ ] R2 client integration
- [ ] Media CRUD API endpoints
- [ ] File upload with validation

### Phase 2 — Admin UI (Day 2-3)
- [ ] Login page
- [ ] Dashboard with section-grouped media grid
- [ ] Upload modal with drag-and-drop
- [ ] Edit modal (alt text, caption, visibility)
- [ ] Delete confirmation

### Phase 3 — Publish Pipeline (Day 3-4)
- [ ] Config generator (SQLite → media-config.json)
- [ ] Enhanced build-prod.js (template resolution)
- [ ] Publish button + rebuild trigger
- [ ] Preview before publish

### Phase 4 — Polish (Day 4-5)
- [ ] Drag-and-drop reordering
- [ ] Image preview/lightbox in admin
- [ ] Migration script for existing assets
- [ ] Error handling + loading states
- [ ] Mobile-responsive admin UI

---

## 13. npm Scripts (Updated)

```jsonc
{
  "scripts": {
    "admin": "node admin/server.js",                    // Start admin console
    "admin:init": "node admin/scripts/init-db.js",      // Create DB + seed admin user
    "admin:migrate": "node admin/scripts/migrate.js",   // Migrate existing assets to R2
    "build:i18n": "node build-i18n.js",                 // Existing
    "build:prod": "node build-prod.js",                 // Enhanced with media-config.json
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
