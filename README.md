# inaquired – Serverless Public Job Portal

**inaquired** is a high-performance, serverless job discovery platform designed to connect talent with verified opportunities (Remote, On-site, Hybrid, and Internships) while maintaining a clean, minimalist typography-focused aesthetic and zero candidate registration friction.

---

## 1. Project Overview & Architecture Decisions

- **Candidate Experience Without Login Walls**: Public visitors browse, search, and apply to verified positions directly without mandatory account creation or tracking cookies.
- **Serverless Data Backbone**: Built on **Supabase PostgreSQL** with real-time WebSocket sync, enabling instant updates whenever roles are published or updated.
- **S3 Storage & Asset Egress**: Integrated with Supabase Storage S3 egress in region `ap-northeast-1` (bucket `ap-northeast-1`) for job document attachments and assets.
- **Anti-Logo Minimalist Discipline**: Job cards deliberately omit flashy corporate logo images, emphasizing transparent compensation, role scope, and technical stack requirements.
- **Clean Responsive Design**: Tailored in Tailwind CSS v4 with primary Indigo accents, accessible contrast ratios, and a global Light/Dark mode toggle.
- **Enterprise SEO**: Structured `JobPosting` JSON-LD schema markup dynamically attached to job detail pages to power Google Search and Google for Jobs indexing.
- **Dual-Layer Resilience**: Features an automatic local store fallback (`offlineStore.ts`) ensuring the application remains interactive and testable even during network downtime.

---

## 2. Technology Stack

- **Frontend Framework**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Build Engine**: Vite 8
- **Database & Realtime**: Supabase PostgreSQL (`@supabase/supabase-js`)
- **Storage & Egress**: Supabase S3 Storage API (Bucket: `ap-northeast-1`, Region: `ap-northeast-1`)
- **Unit & Integration Testing**: Vitest (5 test suites, 31 automated tests)
- **Code Quality**: TypeScript 7 strict type checking (`tsc --noEmit`)

---

## 3. Project Directory Structure

```text
/
├── .env                       # Supabase URL, Publishable Key & Egress configuration
├── .env.example               # Template environment configuration
├── docs/                      # Comprehensive platform documentation
│   ├── prd.md                 # Product Requirements Document
│   ├── architecture.md        # Architecture & System Design Document
│   ├── rules.md               # Engineering & Quality Standards
│   ├── design.md              # Design System & UI/UX Specification
│   ├── tasks.md               # Implementation Tasks & Roadmap
│   └── memory.md              # Project Memory, ADRs & Gotchas
├── supabase/
│   └── schema.sql             # PostgreSQL schema, indexes, RLS policies & storage bucket setup
├── index.html                 # Entry point with SEO metadata
├── public/                    # Static public assets
│   ├── favicon/               # Multi-platform favicons, apple touch icons & manifest
│   └── logo/                  # Vector logos (logo.svg expanded, logo-q.svg collapsed)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── types/
    │   └── job.ts                    # Strongly-typed models for Jobs, Filters, Audit
    ├── lib/
    │   └── supabase.ts               # Supabase client initialization & error handling
    ├── context/
    │   └── ThemeContext.tsx          # Dark/Light mode theme management
    ├── services/
    │   ├── jobService.ts             # Supabase queries, real-time channels & CRUD
    │   ├── storageService.ts         # Supabase S3 egress storage uploads and URLs
    │   ├── offlineStore.ts           # Resilient local storage fallback engine
    │   ├── seedData.ts               # Production-grade verified starter job postings
    │   └── notificationService.ts    # Browser Web Notifications API integration
    ├── utils/
    │   ├── jobUtils.ts               # Slug generation, salary formatting, and search filters
    │   └── totpUtils.ts              # RFC 6238 Base32 secret generation, HMAC-SHA1 TOTP
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx            # Responsive glass navbar with theme toggle & search
    │   │   ├── NavbarSearch.tsx      # Real-time search popup
    │   │   └── Footer.tsx            # Comprehensive footer with links and governance
    │   └── jobs/
    │       ├── JobCard.tsx           # Minimalist card (no company logos)
    │       └── JobFilters.tsx        # Filter bar for category, location, and arrangement
    ├── pages/
    │   ├── HomePage.tsx              # Hero, featured positions, search, and category hubs
    │   ├── CategoryJobsPage.tsx      # Dedicated pages for Remote, On-Site, Hybrid, Internships
    │   ├── JobDetailPage.tsx         # SEO JobPosting detail page with direct apply links
    │   ├── AboutPage.tsx             # Platform mission and transparency commitment
    │   ├── ContactPage.tsx           # Contact and verification reporting form
    │   ├── PrivacyPolicyPage.tsx     # Transparent privacy notice
    │   └── TermsPage.tsx             # Terms and conditions
    ├── App.tsx                       # Main router and state coordination
    ├── main.tsx
    └── index.css                     # Typography and Tailwind CSS rules
```

---

## 5. Development & Testing Commands

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suites (Vitest)
npm run test

# 3. Type checking & Lint
npm run lint

# 4. Production build
npm run build

# 5. Start local development server
npm run dev

# 6. Seed / Reset Default Admin User
npm run admin:create
```

### Admin Console Access
- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin) (or click **Admin Portal** in the website footer)
- Provision administrator credentials explicitly with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables before running `npm run admin:create`. Never commit production credentials.
- Configure `APP_URL` as the public HTTPS origin in production, and provide `SUPABASE_SERVICE_ROLE_KEY` to the server for protected recovery and 2FA RPCs. `SUPABASE_DIRECT_URL` remains the database fallback; never expose server keys through `VITE_` variables.

---

## 6. Project Documentation Index

Full architectural documentation is available in the [`docs/`](file:///c:/project/docs) directory:
- [**Product Requirements Document (PRD)**](file:///c:/project/docs/prd.md)
- [**Architecture & System Design**](docs/architecture.md)
- [**Engineering Rules & Standards**](file:///c:/project/docs/rules.md)
- [**Design System & UI/UX**](file:///c:/project/docs/design.md)
- [**Implementation Tasks & Roadmap**](file:///c:/project/docs/tasks.md)
- [**Project Memory & ADRs**](file:///c:/project/docs/memory.md)
