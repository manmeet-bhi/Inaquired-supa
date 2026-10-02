# Project Memory & Architectural Knowledge Base
## Project: inaquired – Serverless Public Job Portal
**Document**: `memory.md`  
**Purpose**: Persistent Context, Architectural Decision Records (ADRs), Infrastructure Inventory & Gotchas  

---

## 1. Project Background & Evolution

**inaquired** was originally prototyped with Google Cloud Firestore and Firebase Authentication. During production hardening, the following strategic transitions were completed:
1. **Migration to Supabase**: Replaced proprietary Firestore NoSQL database and Firebase Auth with open-standard PostgreSQL hosted on Supabase, unlocking relational schema integrity, PostgREST RESTful APIs, and S3-compatible egress storage.
2. **Decommissioning of Test Admin Panel**: Eliminated mock offline admin panels, mock bypass buttons, and unnecessary administrative UI scaffolding from the public candidate portal, adhering strictly to the core mission: a pristine, fast, login-free public job discovery platform.
3. **Production Packaging**: Upgraded to Vite 8 with strict peer dependency resolution on `esbuild@^0.28.0`, reducing production client bundle size to ~534 kB (147 kB gzipped).

---

## 2. Architectural Decision Records (ADRs)

### ADR-001: Supabase as the Primary Database & Storage Engine
- **Context**: Firebase Firestore had vendor lock-in, complex composite indexing requirements, and proprietary rules syntax.
- **Decision**: Adopt Supabase PostgreSQL with `@supabase/supabase-js`.
- **Consequences**: Enables standard SQL migrations (`supabase/schema.sql`), PostgREST queries, real-time WebSocket subscriptions, and unified S3 egress storage.

### ADR-002: Dual-Mode Persistence & Local Fallback Strategy
- **Context**: During development, testing, or intermittent internet outages, cloud-only apps crash or show white screens.
- **Decision**: Retain [`offlineStore.ts`](file:///c:/project/src/services/offlineStore.ts) as a seamless fallback. If Supabase is unreachable or in test environments, the service layer transparently routes to verified seed data without UI interruption.

### ADR-003: Removal of Test Admin Scaffolding
- **Context**: Mock admin login buttons and test indicators cluttered the candidate navigation experience.
- **Decision**: Completely remove `src/pages/admin/`, `AuthContext.tsx`, and admin buttons from `Navbar.tsx`. Administrators manage postings through direct PostgreSQL connections or the Supabase dashboard.

### ADR-004: Explicit Locale Currency Formatting
- **Context**: Calling `toLocaleString()` without locale arguments formatted numbers using host machine locale (e.g. `1,00,000` on Indian systems vs `100,000` in US/Europe), causing test assertion discrepancies.
- **Decision**: Hardened all salary formatting to explicitly declare `'en-US'`.

### ADR-005: Dedicated S3 Egress Storage
- **Context**: Job listings require document attachments and asset distribution.
- **Decision**: Integrate Supabase S3 Egress endpoint with bucket `ap-northeast-1` in region `ap-northeast-1` via [`storageService.ts`](file:///c:/project/src/services/storageService.ts).

### ADR-006: Dedicated Real-Time Supabase Admin Console
- **Context**: Employers and platform managers needed an administrative UI to manage job listings, toggle statuses, and feature roles directly in the Supabase PostgreSQL database.
- **Decision**: Built a dedicated, responsive dashboard at `/admin` ([`src/pages/admin/AdminPage.tsx`](file:///c:/project/src/pages/admin/AdminPage.tsx)) using `subscribeToAllJobsForAdmin`, `createJob`, `updateJob`, and `deleteJob` with real-time WebSocket updates, live connection health checks, and modal CRUD dialogs.
- **Access**: Discrete link in [`Footer.tsx`](file:///c:/project/src/components/layout/Footer.tsx) and direct routing at `/admin`.

### ADR-007: SVG Mask Transparency for Dark Mode Filter Inversion
- **Context**: In raster-traced SVGs, inner counter-holes (like in 'a', 'q', 'e', 'd') are often opaque off-white paths. Applying `filter: brightness(0) invert(1)` turns opaque paths solid white, creating filled white blobs.
- **Decision**: Implemented an SVG `<mask id="logo-holes">` inside [`public/logo/logo.svg`](file:///c:/project/public/logo/logo.svg) to punch true transparent cutouts (`alpha: 0`), and added a permanent reusable optimizer at [`scripts/optimizeSvg.ts`](file:///c:/project/scripts/optimizeSvg.ts). Transparent pixels are untouched by CSS filters, allowing the dark background to show through cleanly.

### ADR-008: Supabase Auth for Admin Panel
- **Context**: The admin dashboard needed authentication to secure listing management without imposing any login friction on public candidates.
- **Decision**: Implemented [`src/services/adminAuthService.ts`](file:///c:/project/src/services/adminAuthService.ts) and [`src/pages/admin/AdminLoginPage.tsx`](file:///c:/project/src/pages/admin/AdminLoginPage.tsx) using `supabase.auth`. Supported JWT session persistence in `localStorage`, Sign In, Sign Out, and default administrator credentials (`admin@inaquired.app` / `AdminPassword123!`, managed via `npm run admin:create`). Candidates remain completely unauthenticated.

### ADR-009: Automated Schema Migrations Engine
- **Context**: Future database modifications need deterministic, versioned, and idempotent execution against Supabase PostgreSQL.
- **Decision**: Implemented an automated runner at [`scripts/runMigrations.ts`](file:///c:/project/scripts/runMigrations.ts) with `"db:migrate": "tsx scripts/runMigrations.ts"` and `"db:seed": "tsx scripts/seedSupabase.ts"`. Migrations are stored chronologically in [`supabase/migrations/`](file:///c:/project/supabase/migrations/) and tracked in the `public.schema_migrations` table with SHA256 checksums and execution timestamps.

### ADR-010: Minimal Admin Dashboard with Collapsible Sidebar, In-Admin Theme Toggle & Department Management
- **Context**: User required complete cleanup of demo/test files, removal of "Create Account" from admin login, a minimal and user-friendly admin dashboard, a left-side collapsible menu, an integrated dark/light mode toggle, and full department/category management with customizable URL slugs.
- **Decision**:
  1. Removed `tests/` directory and test dependencies (`vitest`).
  2. Secured `AdminLoginPage.tsx` to strictly allow registered Supabase administrator credentials.
  3. Redesigned `AdminPage.tsx` with a modern left-side collapsible drawer (`isSidebarCollapsed`, localStorage persistence, responsive mobile overlay), dark/light mode toggle via `useTheme()`, and live Supabase sync.
  4. Created `002_categories_schema.sql` migration creating `public.categories` table in Supabase PostgreSQL, seeded with 10 default departments.
  5. Built `categoryService.ts` for full CRUD and real-time WebSocket subscriptions.
  6. Built `CategoryModal.tsx` and `DeleteCategoryModal.tsx` for adding, modifying (name, URL slug, description), and deleting departments.
  7. Connected dynamic categories to `JobFormModal.tsx` and public `/category/:slug` route in `App.tsx` and `CategoryJobsPage.tsx`.

### ADR-011: Team & User Access Management in Admin Console
- **Context**: Platform administrators need the ability to invite, provision, manage, and revoke access for team members (Super Admins, Administrators, Recruiters, and Content Editors) directly from the Admin Dashboard.
- **Decision**:
  1. Created database migration `003_admin_users_schema.sql` creating the `public.admin_users` directory table with RLS policies, indexing, and real-time support.
  2. Implemented PostgreSQL stored procedures with `SECURITY DEFINER` (`admin_create_user`, `admin_update_user`, `admin_delete_user`) enabling authorized admin users to create accounts directly inside `auth.users`, `auth.identities`, and `public.admin_users` with bcrypt-encrypted passwords and immediate login readiness.
  3. Built `src/types/user.ts` and `src/services/userService.ts` providing full CRUD operations and real-time WebSocket listeners (`public:admin_users_sync`).
  4. Built `UserModal.tsx` supporting user provisioning with role selection, automatic strong password generation, password resets, and account suspension toggles.
  5. Built `DeleteUserModal.tsx` with self-deletion protection to prevent administrators from locking themselves out.
  6. Added a dedicated "Users & Access" tab to `AdminPage.tsx` with metrics cards, real-time search, role filtering, status indicators, and responsive mobile support.

### ADR-012: Prevention & Resolution of GoTrue "Database error querying schema"
- **Context**: When newly created users were added or authenticated, Supabase GoTrue returned a generic 500 error: `"Database error querying schema"`.
- **Root Cause**: GoTrue's Go SQL driver scans string token columns (`email_change_token_new`, `email_change`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token`). If any of these columns contain `NULL` instead of empty strings (`''`), Go fails with `Scan error converting NULL to string is unsupported` and returns HTTP 500.
- **Decision**:
  1. Applied migration [`004_fix_auth_users_schema.sql`](file:///c:/project/supabase/migrations/004_fix_auth_users_schema.sql) which cleans up all historical `NULL` values in `auth.users` to `''`.
  2. Updated `admin_create_user` to explicitly initialize all string token and boolean columns (`confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token`, `is_super_admin`, `is_sso_user`, `is_anonymous`, `email_change_confirm_status`), guaranteeing zero NULL scan conflicts.

### ADR-013: Admin Layout Architecture, Dynamic Brand Collapsible Logo & Tab State Persistence
- **Context**: Several ergonomic refinements were needed in the Admin Console:
  1. Asset folder structure: ensure canonical `public/favicon/` and `public/logo/` directories exist, and switch to `logo-q.svg` when the left sidebar collapses.
  2. Sidebar menu: eliminate external links (like "Candidate Site") to keep navigation focused exclusively on administrative functions.
  3. Profile management: provide a dedicated profile page where administrators can view and edit their display name, email, and password.
  4. Viewport scroll isolation: previously, the entire window scrolled, causing the sidebar to scroll away. The sidebar must remain fixed while only main page content scrolls.
  5. State persistence on reload: reloading the browser while on a sub-tab (such as `users` or `categories`) previously reset to the first tab (`jobs`).
  6. Branded footer: provide an admin console footer with branding and real-time connectivity status.
- **Decision**:
  1. Placed `logo.svg` and `logo-q.svg` in `public/logo/`. When `isSidebarCollapsed` is true, render `/logo/logo-q.svg` with centered aspect ratio; when false, render `/logo/logo.svg`.
  2. Removed Candidate Site navigation item from the sidebar footer.
  3. Built `AdminProfileView.tsx` and `updateAdminProfile` in `adminAuthService.ts` to manage profile attributes.
  4. Styled the admin root as `h-screen h-[100dvh] flex overflow-hidden`, sidebar as `h-full shrink-0 md:relative`, and viewport as `flex-1 flex flex-col min-w-0 h-full overflow-y-auto`.
  5. Implemented `getInitialAdminTab` reading URL search param `?tab=...` and `localStorage.getItem('admin_active_tab')`. Updating tabs calls `changeTab` which pushes URL query params via `replaceState`.
  6. Built and integrated `AdminFooter.tsx` at the bottom of the main content scroll container.

### ADR-014: Responsive Layout Boundary Control, Micro-Animated Theme Toggling & Jobs Table Cleansing
- **Context**:
  1. Responsive Layout: When the left sidebar collapsed or expanded, the main content area experienced jarring stretching or snapping on large viewports because there was no maximum width bound on the content area.
  2. Theme Switcher: A static icon switch lacked tactile visual feedback. An animated toggle specific to the administrative environment was requested.
  3. Jobs Table: Administrative listing reviews prioritize role titles, departments, workstyles, and publish statuses; compensation cluttered the overview and was requested to be removed.
  4. Footer: External links in the admin footer were redundant; a clean centered brand with live system time in the right corner provides a more professional feel.
- **Decision**:
  1. Bound header, content, and footer to `max-w-7xl mx-auto` with `transition-all duration-300 ease-in-out` transitions. This maintains visual equilibrium whether the sidebar is 80px or 256px wide.
  2. Built `AdminThemeToggle.tsx` with smooth Sun/Moon SVG rotations, ambient ring animations, and sliding toggle switches for both header and sidebar.
  3. Removed the Compensation column header and data cells from the jobs table in `AdminPage.tsx`.
  4. Updated `AdminFooter.tsx` with centered branding and a live date/time display with seconds ticker.

### ADR-015: Strictly Alphanumeric Admin ID & Public Header / Navigation Redesign
- **Context**:
  1. Profile ID Format: The previous UUID format (`92f98f68-5226-4441...`) was unwieldy for administrative reference. Required a strictly alphanumeric ID (`[A-Z0-9]`) beginning with the first 4 letters of the admin's name.
  2. Public Header: The "Jobs" tag badge adjacent to the logo added clutter. The user requested its removal.
  3. Nav Links: The top nav links needed a clean hierarchy: `Jobs` dropdown containing `Remote`, `Onsite`, `Hybrid`, `Internships`, `By Departments`, and `By Companies`, followed by `About` and `Contact`.
  4. Header Controls: Notification bell icon needed to be removed, leaving only a modern theme toggle switch in that control area.
- **Decision**:
  1. In `AdminProfileView.tsx`, implemented `formatAdminAlphanumericId`: extracts the first 4 uppercase alphabetical letters from the name (falling back to `ADMN`), extracts 4 digits from the user's ID (or fallback `2026`), producing an 8-character strictly alphanumeric code (e.g. `ALEX9298`). Displayed in both the top banner and as a read-only input in the profile form with 1-click clipboard copying.
  2. In `Navbar.tsx`, removed the `<span ...>Jobs</span>` badge from the brand logo.
  3. Created `DepartmentsPage.tsx` (`/departments`) and `CompaniesPage.tsx` (`/companies`), and enhanced `CategoryJobsPage.tsx` to support `pageType: 'company'` (`/company/:companyName`).
  4. In `Navbar.tsx`, built a `Jobs` dropdown menu housing the 6 sub-links with icons and descriptions, plus direct links to `About` and `Contact`.
  5. Completely removed the notification bell icon and alert tips from the header; placed a tactile theme toggle switch (`role="switch"`) with dual in-track Sun/Moon indicators and sliding circular thumb.

### ADR-016: Admin Brand Header Cleanse, Letter Initial Avatar Badge & Profile/Security Navigation
- **Context**:
  1. Logo Branding Text: In the admin panel sidebar header, the text branding (`inaquired`) and `Admin Panel` label added visual noise next to the logo SVG. Only the pure brand logo asset was desired.
  2. Sidebar Navigation: Having a dedicated "My Profile" tab in the primary management navigation was redundant when account controls logically belong to the user's avatar.
  3. Avatar Presentation: Rather than using generic avatar silhouette icons or placeholder images, the user specified using a stylized badge displaying the first letter of the user's name.
  4. Account Options: Clicking the user avatar needed to open an account menu with "Profile", "Security", and "Sign Out" options.
- **Decision**:
  1. In `AdminPage.tsx`, removed the text branding and `Admin Panel` text span from the brand header. Retained clean dynamic logo rendering (`logo.svg` when expanded, `logo-q.svg` when collapsed).
  2. Removed the "My Profile" navigation item from the sidebar navigation items list.
  3. Computed `userInitial` from `(adminUser.fullName || adminUser.email || 'A').trim().charAt(0).toUpperCase()`.
  4. Rendered a vibrant circular letter badge with gradient styling (`from-indigo-600 via-indigo-700 to-slate-900`) in both the top header bar and sidebar footer.
  5. Implemented an account dropdown menu with:
     - Profile info header with role indicator.
     - "Profile" option (navigates to personal information & identity view with alphanumeric ID).
     - "Security" option (navigates to credentials & password change view).
     - "Sign Out" option.
  6. Updated `AdminProfileView.tsx` with section tabs (`Profile Information` and `Security & Password`) responding to the dropdown selection, and replaced the profile banner icon with the user initial letter badge.

### ADR-017: Resend-Style Sidebar Account Switcher & Header Cleanse
- **Context**: The user provided screenshots of the Resend dashboard (`https://resend.com/emails`) specifying the exact account menu architecture and subsequent layout refinements:
  1. Profile dropdown should exist exclusively in the sidebar (top of the left sidebar), removing duplicate triggers from the header top-right.
  2. Header top-right should be ultra-clean: remove the theme toggle, remove the Supabase Live status indicator pill, and remove the profile dropdown, keeping only contextual action buttons (`Post New Job` / `Add Department`).
  3. Streamline the dropdown menu: remove `Create team` and `Invite members`, retaining:
     - User email header at top in muted font (`text-xs text-slate-500`) with subtle separator.
     - `My profile` (plain text link to Profile tab).
     - `Security` (plain text link to Security & Password tab).
     - Divider.
     - `Homepage ↗` with external arrow icon linking back to the candidate portal (`/`).
     - Divider.
     - `Log out` (plain text sign-out action).
- **Decision**:
  1. Updated `ResendAccountMenu` in `AdminPage.tsx` removing `Create team` and `Invite members`.
  2. Placed the account switcher button exclusively at the top of the left sidebar directly above the management navigation items, bound to `isProfileDropdownOpen` with outside-click dismissal via `sidebarProfileRef`.
  3. Cleaned up the header top-right area by removing `AdminThemeToggle`, `checkConnection` pill, and profile dropdown, leaving only the primary action button.
  4. Retained the animated theme toggle inside the sidebar footer.
  5. **Collapsed Sidebar Overflow Escape**: Previously, `position: absolute` flyouts were clipped by the navigation container's `overflow-y-auto` style. Solved by hoisting the profile switcher outside the scrollable container and dynamically computing trigger coordinates (`getBoundingClientRect()`) to render with `position: fixed`, `top: rect.top`, `left: rect.right + 8`, and `z-index: 9999` in collapsed mode, completely bypassing any clipping hierarchy.

---

## 3. Infrastructure & Connection Inventory

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Supabase URL** | `https://wnpsrdtlqxfiglhmalwq.supabase.co` | Main REST and Realtime gateway |
| **Publishable Key** | `sb_publishable_n2im84IXBbQ3v2XluipN6Q_N_gfjbhu` | Public client token for anon queries |
| **Direct Postgres URI** | `postgresql://postgres:aXihkgIxLsig4svi@db.wnpsrdtlqxfiglhmalwq.supabase.co:5432/postgres` | Direct connection for migrations & DB administration |
| **Postgres Password** | `aXihkgIxLsig4svi` | Database administrator password |
| **Storage Egress Endpoint** | `https://wnpsrdtlqxfiglhmalwq.storage.supabase.co/storage/v1/s3` | S3-compatible storage API |
| **Storage Bucket** | `ap-northeast-1` | Asset storage bucket |
| **Storage Region** | `ap-northeast-1` | AWS Tokyo region |

---

## 4. Key Engineering Gotchas & Troubleshooting

1. **Windows PowerShell Execution Policy**:
   - `npm.ps1 cannot be loaded` due to Windows PowerShell execution policy.
   - **Solution**: Always run commands via `cmd /c` (e.g., `cmd /c npm run test`, `cmd /c npm run lint`).

2. **Vite 8 & Esbuild Peer Dependency**:
   - Vite 8 requires `esbuild@^0.28.0`. Pinned versions of `esbuild@0.25.x` in `devDependencies` cause `npm error ERESOLVE`.
   - **Solution**: Maintain `"esbuild": "^0.28.0"` in `package.json`.

3. **Supabase Realtime Channel Cleanup**:
   - Realtime channels must be unsubscribed using `supabase.removeChannel(channel)` in React `useEffect` cleanups to prevent memory leaks and zombie sockets.

4. **Database Naming Conventions**:
   - PostgreSQL table columns use `snake_case` (e.g. `company_name`). Frontend TypeScript code uses `camelCase` (e.g. `companyName`). The mapper functions `mapFromDb` and `mapToDb` in [`jobService.ts`](file:///c:/project/src/services/jobService.ts) guarantee seamless translation.
