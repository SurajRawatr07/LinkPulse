# LinkPulse — Full-Stack URL Shortener & Analytics Platform

**Short links, smart insights, enterprise-grade safety.**

LinkPulse is a complete, production-ready full-stack URL shortening and click analytics platform built with React 18, Vite, TypeScript, Express.js, and Google Cloud SQL (PostgreSQL) managed with Drizzle ORM.

The visual design system matches the reference design with a deep slate aesthetic (`#090D16`), signature teal accents (`#0F9D8A`), 12px border radius, and clean, responsive layouts from 320px mobile to desktop.

---

## 🛠 Technology Stack

### Frontend
- **React 18 + Vite + TypeScript**: Modular components with functional hooks.
- **Tailwind CSS (`darkMode: "class"`)**: Responsive, tokenized styling with flash-free dark mode.
- **React Router v6**: Route guards for Visitors, Authenticated Users, and Admins (`/app/*`, `/admin/*`).
- **Zustand**: Reactive state management for authentication, toast notifications, and themes.
- **Recharts**: Responsive data visualization (Clicks over time, device distribution, top referrers).
- **Zod**: Input validation for URLs, aliases, forms, and CSV data.
- **qrcode.react & papaparse**: Real-time vector QR code generation (PNG/SVG) and client-side CSV bulk parser.
- **Lucide React**: Clean, accessible UI icons.

### Backend & Database
- **Node.js + Express.js (`server.ts`)**: Versioned REST API architecture (`/api/v1/*`), health checks, and 9-step redirect engine (`/r/:code`).
- **Google Cloud SQL (PostgreSQL)**: Fully provisioned relational database in region `asia-southeast1`.
- **Drizzle ORM & Drizzle Kit**: Type-safe relational schema with connection pooling, migrations, and relationships.
- **Firebase Auth & Admin SDK**: Token verification, Google Sign-In via OAuth popup, and secure server-side session cookies.
- **bcryptjs**: Salted password hashing for link protection and user credentials.
- **ua-parser-js**: User-Agent parsing for device category (Mobile, Desktop, Tablet, Bot), browser, and OS attribution.

---

## 🚀 Quickstart & Setup

```bash
# 1. Install dependencies
npm install

# 2. Run schema update / migrations (configured in src/db/drizzle.config.ts)
# (Schema already applied to Cloud SQL instance)

# 3. Seed demo data (campaigns, tags, sample links, and click history)
npx tsx server/seed.ts

# 4. Start full-stack development server (Port 3000)
npm run dev

# 5. Type-check and lint
npm run lint

# 6. Build for production
npm run build
npm run start
```

---

## 🔐 Authentication & Roles

LinkPulse enforces server-side role-based access control (RBAC):

1. **Visitor / Anonymous**:
   - Opens public short links (`/r/:code`).
   - Solves password challenges on protected links.
   - Submits public malicious link reports (`/api/v1/reports`).
   - No access to private analytics or administrative tools.

2. **User**:
   - Registers and logs in (via email/password, Google Sign-In, or 1-click Demo User).
   - Creates and manages their own short links, custom aliases, QR codes, campaigns, folders, and tags.
   - Configures expiration dates, click quotas, passwords, and device routing rules.
   - Bulk imports links via CSV.
   - Views analytics strictly for their owned links.

3. **Admin**:
   - Platform-wide link and user management.
   - Immediate link disabling and reactivation.
   - Maintains the real-time Domain Safety Blocklist.
   - Inspects audit logs and abuse reports.
   - The first registered account automatically receives Admin privileges. A 1-click Demo Admin is also available on `/login`.

---

## 🔄 9-Step Redirect Engine (`/r/:code`)

Redirect resolution executes deterministically in this order:
1. **Find Short Code**: Queries Cloud SQL `links` table.
2. **Not Found**: Returns HTTP 404 and displays friendly Not Found page.
3. **Disabled & Blocked Check**: Verifies link `isActive` status and checks destination against `domain_blocklist`.
4. **Expiration Check**: Validates scheduled expiration date/time.
5. **Click Limit Check**: Atomically verifies whether `clicksCount >= clickLimit`.
6. **Password Challenge**: If protected, redirects to password form. Upon valid bcrypt verification, issues a short-lived access token.
7. **Device Targeting**: Detects Mobile, Tablet, or Desktop user agent and selects device-specific destination if configured.
8. **Asynchronous Click Logging**: Inserts visit record into `click_events` with anonymized IP hash, device, browser, and referrer, while atomically incrementing `clicksCount`.
9. **Redirect**: Issues clean HTTP 302 to destination URL.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health & database connectivity | No |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Email/password sign-in with lockout | No |
| `POST` | `/api/v1/auth/google-session` | Exchange Firebase ID token | No |
| `POST` | `/api/v1/auth/demo-login` | Instant demo login (User / Admin) | No |
| `GET` | `/api/v1/auth/me` | Current authenticated user profile | Yes |
| `POST` | `/api/v1/auth/logout` | Terminate session & clear cookies | No |
| `GET` | `/api/v1/links` | List user links with search & filters | User |
| `POST` | `/api/v1/links` | Create new short link & QR code | User |
| `POST` | `/api/v1/links/check-alias` | Verify custom alias availability | User |
| `GET` | `/api/v1/links/:id` | Get link details & QR customization | User |
| `PATCH` | `/api/v1/links/:id` | Update link settings & rules | User |
| `DELETE` | `/api/v1/links/:id` | Archive link (preserves analytics) | User |
| `POST` | `/api/v1/links/:id/disable` | Disable link | User |
| `POST` | `/api/v1/links/:id/enable` | Reactivate link | User |
| `GET` | `/api/v1/links/:id/analytics` | Link-specific click metrics | User |
| `GET` | `/api/v1/campaigns` | List user campaigns & link stats | User |
| `POST` | `/api/v1/campaigns` | Create new campaign | User |
| `GET` | `/api/v1/analytics/overview` | Aggregated analytics & alerts | User |
| `POST` | `/api/v1/imports/csv` | Batch CSV bulk link import | User |
| `GET` | `/api/v1/admin/overview` | Platform-wide KPIs & counts | Admin |
| `GET` | `/api/v1/admin/users` | Platform user directory | Admin |
| `GET` | `/api/v1/admin/links` | Platform-wide link moderation | Admin |
| `POST` | `/api/v1/admin/links/:id/disable` | Admin disable link with audit log | Admin |
| `GET` | `/api/v1/admin/blocklist` | Domain safety deny-list | Admin |
| `POST` | `/api/v1/admin/blocklist` | Add domain to blocklist | Admin |
| `DELETE` | `/api/v1/admin/blocklist/:id` | Remove domain from blocklist | Admin |
| `POST` | `/api/v1/reports` | Submit malicious link report | No |
| `GET` | `/r/:code` | Public short code redirect engine | No |

---

## 🎬 5-Minute Hackathon Demo Scenarios

### Scenario A — Link Creation to Live Analytics
1. Navigate to `/login` and click **"Demo User"** (or create an account on `/register`).
2. Go to **"Create Link"** (`/app/links/new`).
3. Enter Destination URL `https://github.com/google`, set custom alias `demo-launch`, and choose Campaign **Product Launch Q4**.
4. Click **Publish Short Link**. Review the generated QR code and copy button.
5. In your browser or a new tab, open `http://localhost:3000/r/demo-launch`.
6. Confirm instant HTTP 302 redirection to the destination.
7. Return to `/app/dashboard` and verify the click count and device attribution increment in real time!

### Scenario B — Bulk CSV Import to Administrative Moderation
1. Go to **"Bulk Import"** (`/app/links/import`).
2. Download the sample CSV template or upload links containing both valid destinations and a duplicate alias.
3. Review the live row-by-row validation table showing valid and flagged entries.
4. Click **Import Valid Links** to batch create the links in Cloud SQL.
5. Log out and click **"Demo Admin"** on `/login`.
6. Open **"Admin Links"** (`/admin/links`) and disable a suspicious link.
7. Attempt to open that link's short URL: verify that redirection is blocked and an informative status page is shown.
8. Go to **"Admin Blocklist"** (`/admin/blocklist`) and add a phishing domain (e.g. `bad-actor.com`). Try creating a link to that domain to demonstrate instant rejection!
