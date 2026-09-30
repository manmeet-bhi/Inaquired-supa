# inaquired – Serverless Public Job Portal

**inaquired** is a high-performance, serverless job discovery and management platform designed to connect candidates with verified opportunities (Remote, On-site, Hybrid, and Internships) while maintaining a clean, minimalist typography-focused aesthetic and zero candidate registration friction.

---

## 1. Project Overview & Architecture Decisions

- **Candidate Experience Without Login Walls**: Public visitors browse, search, and apply to verified positions directly without mandatory account creation or tracking cookies.
- **Serverless Data Backbone**: Built on Google Cloud Firestore with real-time sync (`onSnapshot`), enabling instant updates whenever administrators publish or modify roles.
- **Administrator-Only Authentication**: Firebase Authentication is strictly configured for administrative staff.
- **2FA Multi-Factor Security (RFC 6238 TOTP)**: Integrated 2FA enrollment with dynamic QR code generation for standard Authenticator apps (Google Authenticator, Authy, 1Password) and 8 emergency single-use backup recovery codes.
- **Anti-Logo Minimalist Discipline**: Per design specifications, job cards do not display company logos, emphasizing transparent salaries, role scope, and technical requirements.
- **Clean Responsive Design**: Tailored in Tailwind CSS with primary Indigo accents, accessible contrast ratios, and a global Light/Dark mode toggle.
- **Enterprise SEO**: Structured `JobPosting` JSON-LD schema markup dynamically attached to job detail pages to power Google Search and Google for Jobs indexing.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Build Engine**: Vite 8
- **Database & Storage**: Google Cloud Firestore
- **Authentication**: Firebase Authentication (Google Auth & Email/Password with Password Recovery)
- **Two-Factor Auth**: Web Crypto API HMAC-SHA1 TOTP + QRCode canvas rendering
- **Unit Testing**: Vitest
- **Security**: Firestore Rules v2 with ABAC validation and default-deny catch-all

---

## 3. Project Directory Structure

```text
/
├── firebase-applet-config.json    # Provisioned Firebase credentials and database ID
├── firebase-blueprint.json        # Abstract entities & Firestore collection path mappings
├── firestore.rules                # Hardened Firestore Security Rules
├── security_spec.md               # Security invariants & Dirty Dozen payload tests
├── index.html                     # Entry point with SEO metadata and JSON-LD schema
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tests/
│   └── unit/
│       └── jobUtils.test.ts       # Automated unit tests for utilities & 2FA TOTP
└── src/
    ├── types/
    │   └── job.ts                 # Strongly-typed models for Jobs, Filters, Admin, Audit
    ├── lib/
    │   └── firebase.ts            # Firebase client initialization & structured error handling
    ├── context/
    │   ├── ThemeContext.tsx       # Dark/Light mode theme management
    │   └── AuthContext.tsx        # Admin authentication, 2FA challenge, and audit logging
    ├── services/
    │   ├── jobService.ts          # Firestore queries, real-time subscriptions, and CRUD
    │   ├── seedData.ts            # Production-grade verified starter job postings
    │   └── notificationService.ts # Browser Web Notifications API integration
    ├── utils/
    │   ├── jobUtils.ts            # Slug generation, salary formatting, and search filters
    │   └── totpUtils.ts           # RFC 6238 Base32 secret generation, HMAC-SHA1 TOTP, QR
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx         # Responsive navbar with theme toggle and alerts
    │   │   └── Footer.tsx         # Comprehensive footer with links and governance
    │   └── jobs/
    │       ├── JobCard.tsx        # Minimalist card (no company logos)
    │       └── JobFilters.tsx     # Filter bar for category, location, and work arrangement
    ├── pages/
    │   ├── HomePage.tsx           # Hero, featured positions, search, and category hubs
    │   ├── CategoryJobsPage.tsx   # Dedicated pages for Remote, On-Site, Hybrid, Internships
    │   ├── JobDetailPage.tsx      # SEO JobPosting detail page with direct apply links
    │   ├── AboutPage.tsx          # Platform mission and transparency commitment
    │   ├── ContactPage.tsx        # Contact and verification reporting form
    │   ├── PrivacyPolicyPage.tsx  # Transparent privacy notice
    │   ├── TermsPage.tsx          # Terms and conditions
    │   └── admin/
    │       ├── AdminLoginPage.tsx # Admin auth with password recovery and 2FA step
    │       ├── AdminDashboard.tsx # CMS KPIs, job management, 2FA setup & audit logs
    │       └── JobEditorModal.tsx # Full-featured job creation and editing modal
    ├── App.tsx                    # Main router and state coordination
    ├── main.tsx
    └── index.css                  # Typography and Tailwind CSS rules
```

---

## 4. Firestore Schema Design

### `/jobs/{jobId}`
- `title`: string (2-150 chars)
- `slug`: string (unique URL-safe slug)
- `companyName`: string (2-120 chars)
- `location`: string (e.g., "San Francisco, CA (Remote)")
- `jobType`: "full-time" | "part-time" | "contract" | "internship"
- `workArrangement`: "remote" | "on-site" | "hybrid"
- `category`: string (e.g. "Engineering", "Design", "Product")
- `experienceLevel`: "entry" | "mid" | "senior" | "lead" | "internship"
- `salaryMin` / `salaryMax`: number (optional)
- `currency`: string (e.g. "USD", "EUR")
- `description`: string (detailed role overview)
- `responsibilities`: string (bulleted points)
- `requirements`: string (qualifications)
- `benefits`: string (perks and compensation details)
- `applicationUrl`: string (direct employer URL)
- `applicationDeadline`: string (YYYY-MM-DD)
- `tags`: string[] (keywords, tech stack)
- `status`: "published" | "draft" | "archived"
- `featured`: boolean
- `createdAt` / `updatedAt` / `publishedAt`: ISO 8601 timestamps
- `createdBy`: string

### `/admins/{adminId}`
- `email`: string
- `role`: "superadmin" | "admin"
- `mfaEnabled`: boolean
- `mfaSecret`: string (Base32 TOTP key, optional)
- `backupCodes`: string[] (8 emergency single-use recovery codes)
- `createdAt`: ISO 8601 timestamp

### `/subscribers/{subscriberId}`
- `endpoint`: string (anonymous browser client identifier)
- `subscribedAt`: ISO 8601 timestamp
- `categories`: string[]

### `/auditLogs/{logId}`
- `adminId`: string
- `adminEmail`: string
- `action`: string (e.g. `JOB_CREATED`, `JOB_DELETED`, `MFA_ENABLED`)
- `targetResource`: string
- `details`: string
- `timestamp`: ISO 8601 timestamp

---

## 5. Security Rules & Enforcement

Security rules (`firestore.rules`) enforce strict Attribute-Based Access Control (ABAC):
1. **Default-Deny Catch-All**: All documents deny reads and writes by default.
2. **Public Read Isolation**: Anonymous public visitors can ONLY read jobs where `status == 'published'`. Drafts and archived jobs cannot be scraped or accessed by unauthenticated clients.
3. **Admin Verification**: Modification of `/jobs`, `/admins`, and `/auditLogs` requires authentication matching the designated superadmin email (`manmeet.msh@gmail.com`) or an existing administrative profile in `/admins/$(request.auth.uid)`.
4. **Denial-of-Wallet Protections**: All incoming document fields enforce string size boundaries (e.g. `title.size() <= 150`, `description.size() <= 15000`).
5. **Audit Trail Immutability**: Documents in `/auditLogs` allow `create` by admins but forbid `update` and `delete`.

---

## 6. Admin Account Bootstrap & Two-Factor Authentication Setup

### Designated Superadmin
The environment is pre-configured to grant administrative permissions to the runtime project owner:
- Email: `manmeet.msh@gmail.com`
- Click **"Continue with Google"** on `/admin/login` to sign in instantly.

### Enrolling in 2FA (TOTP):
1. Navigate to `/admin` and select the **Admin 2FA & Security** tab.
2. Open **Google Authenticator**, **Authy**, or **1Password** on your mobile device.
3. Scan the generated QR code or copy the Base32 Secret Key.
4. Input the current 6-digit verification code from your authenticator app and click **Activate Two-Factor Authentication**.
5. Copy and store the 8 generated emergency recovery codes in a safe password vault.

---

## 7. Running Unit Tests

Automated unit tests test all core utilities, slug generation, salary formatting, search filtering, and 2FA TOTP RFC 6238 token creation and verification:

```bash
npm run test
```

---

## 8. Deployment to Firebase

To deploy to production Firebase hosting and Firestore:
```bash
# 1. Login to Firebase CLI
firebase login

# 2. Deploy security rules and hosting
firebase deploy --only firestore:rules,hosting
```
