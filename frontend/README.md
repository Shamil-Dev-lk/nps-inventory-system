# ANTIGRAVITY — Enterprise Government Store & Inventory Management System

> **Proudly built for Sri Lanka's Pradeshiya Sabha network**

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?logo=laravel)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?logo=next.js)](https://nextjs.org)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php)](https://php.net)

---

## 📋 Overview

**ANTIGRAVITY** is a complete, enterprise-grade Store & Inventory Management System designed for **Sri Lanka's Pradeshiya Sabha** (Local Government Authorities). It is fully **multi-tenant ready** — deploy once, configure per organisation via the database. No source code changes are needed.

### Key Features

| Feature | Details |
|---|---|
| 🏛️ Multi-Pradeshiya Sabha | Zero-code deployment per organisation |
| 🌐 Multi-language | English, Sinhala (සිංහල), Tamil (தமிழ்) |
| 📦 Full Inventory Lifecycle | GRN → Issue → Return → Transfer → Adjustment |
| 🤖 AI Assistant | OpenAI GPT-4o-mini powered chat & recommendations |
| 🔐 RBAC | 14 government roles via Spatie Laravel Permission |
| 📊 Reports | Stock, GRN, Issues, Ledger — CSV & PDF export |
| 🔒 2FA | Google Authenticator support |
| 📋 Audit Log | Complete activity trail for all operations |

---

## 🏗️ Architecture

```
antigravity/
├── backend/          # Laravel 12 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   │   ├── Auth/             # Login, 2FA, profile
│   │   │   ├── Inventory/        # Items, categories, units, brands
│   │   │   ├── Stock/            # GRN, Issue, Return, Transfer, Adjustment, Taking
│   │   │   ├── Purchase/         # Purchase Requests & Orders
│   │   │   ├── Reports/          # All reports + CSV/PDF export
│   │   │   ├── AI/               # OpenAI integration
│   │   │   └── Settings/         # Org, Users, Roles, Departments
│   │   ├── Models/               # 24 Eloquent models
│   │   └── Services/             # StockLedgerService, ItemService
│   ├── database/
│   │   ├── migrations/           # 21 migration files
│   │   └── seeders/              # Complete data seed
│   └── routes/api.php            # All API endpoints
└── frontend/         # Next.js 15 + React 19
    ├── app/
    │   ├── (auth)/login/         # Login + 2FA
    │   └── (dashboard)/          # All dashboard pages
    ├── components/               # Reusable components
    ├── store/                    # Zustand state (auth, org)
    ├── lib/api.ts                # Axios client
    └── types/index.ts            # Full TypeScript types
```

---

## 🚀 Installation

### Prerequisites
- PHP 8.4+
- Composer 2.x
- Node.js 20+
- MySQL 8.0+

### Backend Setup

```bash
cd backend

# 1. Install PHP dependencies
composer install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DB_*, OPENAI_API_KEY, etc.

# 3. Generate application key
php artisan key:generate

# 4. Run migrations and seed
php artisan migrate --seed

# 5. Start development server
php artisan serve --port=8000
```

### Frontend Setup

```bash
cd frontend

# 1. Install Node dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 3. Start development server
npm run dev
```

---

## 🌐 Multi-Pradeshiya Sabha Deployment

The system is **fully configurable at runtime** — change organisation settings in:
1. **`.env` file** — defaults for first install
2. **`organization_settings` database table** — live runtime configuration

| Setting | Example |
|---|---|
| `ORG_NAME` | `Kurunegala Pradeshiya Sabha` |
| `ORG_SHORT_NAME` | `KPS` |
| `ORG_DISTRICT` | `Kurunegala` |
| `ORG_PROVINCE` | `North Western` |

After deployment, log in as **Super Admin** → **Settings → Organization** to update all branding, logos, colours, and contact details from the UI.

---

## 👤 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@example.com | password |
| Secretary | secretary@example.com | password |
| Store Keeper | storekeeper@example.com | password |

> ⚠️ **Change all default passwords immediately after first login.**

---

## 🔐 Role & Permission Matrix

| Role | Description |
|---|---|
| super-admin | Full system access |
| chairman | View & approve operations |
| secretary | Manage & approve workflows |
| store-keeper | GRN, Issue, Transfer |
| procurement-officer | Purchase Requests & Orders |
| accountant | Finance reports |
| department-head | View dept. operations |
| data-entry-operator | Data entry only |
| report-viewer | Read-only reports |
| auditor | Audit log access |

---

## 🤖 AI Features

Enable via `Settings → Organization → AI & Features`:
- **Inventory Chat** — Ask questions in natural language
- **Purchase Recommendations** — AI suggests what to order
- **Duplicate Detection** — Flag similar items
- **Inventory Health Score** — Real-time assessment

Requires `OPENAI_API_KEY` in `.env`.

---

## 📡 API Overview

**Base URL:** `http://your-server/api/v1`

| Group | Endpoints |
|---|---|
| Auth | `/auth/login`, `/auth/me`, `/auth/logout` |
| Items | `/items` CRUD |
| GRN | `/grn` CRUD + approve/reject |
| Stock | `/stock/issues`, `/stock/returns`, `/stock/transfers`, `/stock/adjustments`, `/stock/taking` |
| Purchase | `/purchase/requests`, `/purchase/orders` |
| Reports | `/reports/current-stock`, `/reports/stock-ledger`, `/reports/analytics` |
| AI | `/ai/chat`, `/ai/recommendations`, `/ai/dashboard-summary` |
| Settings | `/organization`, `/users`, `/roles`, `/departments`, `/suppliers` |

All protected routes require `Authorization: Bearer {token}` header.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.4, Sanctum, Spatie Permission |
| Frontend | Next.js 15, React 19, TypeScript, TanStack Query |
| Styling | Tailwind CSS 3, Framer Motion |
| Charts | Recharts |
| State | Zustand |
| DB | MySQL 8.0 |
| PDF | barryvdh/laravel-dompdf |
| AI | openai-php/laravel (GPT-4o-mini) |

---

## 📄 License

Proprietary — All rights reserved. Built for Sri Lanka Government use.

---

*© 2024 ANTIGRAVITY — Enterprise Government Store Management System*
