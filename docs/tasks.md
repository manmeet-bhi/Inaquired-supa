# Implementation Tasks & Roadmap
## Project: inaquired – Serverless Public Job Portal
**Document**: `tasks.md`  
**Status Tracker**: Current Implementation & Future Milestones  

---

## 1. Completed Tasks (Release 2.0.0)

### 1.1 Phase 1: Firebase Decommissioning & Cleanup
- [x] Uninstall `firebase` package from `package.json`.
- [x] Remove legacy configuration files: `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`, and `security_spec.md`.
- [x] Remove `src/lib/firebase.ts`.
- [x] Remove Firebase Firestore subscriber writes from `src/services/notificationService.ts`.
- [x] Verify complete absence of `firebase` imports across all source and test files.

### 1.2 Phase 2: Supabase Database Integration
- [x] Install `@supabase/supabase-js` dependency.
- [x] Implement [`src/lib/supabase.ts`](file:///c:/project/src/lib/supabase.ts) configuring client connection with runtime credentials:
  - Base URL: `https://wnpsrdtlqxfiglhmalwq.supabase.co`
  - Publishable Key: `sb_publishable_n2im84IXBbQ3v2XluipN6Q_N_gfjbhu`
- [x] Implement [`src/services/jobService.ts`](file:///c:/project/src/services/jobService.ts) using Supabase PostgREST queries and Realtime WebSocket subscriptions (`postgres_changes`).
- [x] Create comprehensive PostgreSQL database schema and RLS policies in [`supabase/schema.sql`](file:///c:/project/supabase/schema.sql) covering `jobs`, `subscribers`, and `audit_logs`.
- [x] Configure environment variables in [`.env`](file:///c:/project/.env) and template [`.env.example`](file:///c:/project/.env.example).

### 1.3 Phase 3: Supabase Storage & S3 Egress Integration
- [x] Implement [`src/services/storageService.ts`](file:///c:/project/src/services/storageService.ts) connecting to the Supabase S3 Egress endpoint:
  - Storage URL: `https://wnpsrdtlqxfiglhmalwq.storage.supabase.co/storage/v1/s3`
  - Target Bucket: `ap-northeast-1`
  - Target Region: `ap-northeast-1`
- [x] Implement file upload, asset public URL generation, and fallback resolution.

### 1.4 Phase 4: Test Admin Panel Decommissioning
- [x] Remove mock test admin buttons, offline test pills, and mock superadmin bypasses.
- [x] Clean up [`src/components/layout/Navbar.tsx`](file:///c:/project/src/components/layout/Navbar.tsx), removing test modals and keeping clean public search, navigation, and theme toggles.
- [x] Refactor [`src/App.tsx`](file:///c:/project/src/App.tsx) to eliminate `AuthProvider` and `/admin` routes.
- [x] Delete legacy admin pages (`src/pages/admin/`) and `src/context/AuthContext.tsx`.

### 1.5 Phase 5: Supabase Admin Panel & Real-time Management
- [x] Build [`src/pages/admin/AdminPage.tsx`](file:///c:/project/src/pages/admin/AdminPage.tsx) with live Supabase database sync, real-time metrics, status tabs, and filtering.
- [x] Implement [`src/services/adminAuthService.ts`](file:///c:/project/src/services/adminAuthService.ts) connecting directly to Supabase Auth (`signInWithPassword`, `signUp`, `signOut`, `getSession`, `onAuthStateChange`).
- [x] Build [`src/pages/admin/AdminLoginPage.tsx`](file:///c:/project/src/pages/admin/AdminLoginPage.tsx) with glassmorphism UI, tabbed Sign In / Sign Up, and 1-click test credentials helper.
- [x] Protect Admin Dashboard behind Supabase Authentication gate with profile indicators and Sign Out capabilities.
- [x] Build [`src/components/admin/JobFormModal.tsx`](file:///c:/project/src/components/admin/JobFormModal.tsx) for creating and editing listings directly in Supabase with validation.
- [x] Build [`src/components/admin/DeleteConfirmModal.tsx`](file:///c:/project/src/components/admin/DeleteConfirmModal.tsx) for secure deletion confirmation.
- [x] Add status switcher (Published / Draft / Archived) and featured spotlight toggling.
- [x] Add link to `/admin` in [`src/components/layout/Footer.tsx`](file:///c:/project/src/components/layout/Footer.tsx).
- [x] Add permanent SVG optimization utility [`scripts/optimizeSvg.ts`](file:///c:/project/scripts/optimizeSvg.ts) with npm script `"optimize:logo"` and clean up scratch files.

### 1.6 Phase 6: Verification & Quality Assurance
- [x] Fix number formatting in `formatSalary` to enforce `'en-US'` standard cross-locale grouping.
- [x] Verify TypeScript compilation reports 0 errors (`npm run lint`).
- [x] Verify Vite production bundle compiles cleanly (`npm run build`).

### 1.7 Phase 7: Minimal Admin Panel, Collapsible Sidebar, Theme Toggle & Department Management
- [x] **Test & Demo File Removal**: Deleted legacy test suites (`tests/`), removed `vitest` dependency and test scripts, removed mock login bypasses and demo credentials.
- [x] **Secure Admin Authentication**: Removed "Create Account" tab from [`src/pages/admin/AdminLoginPage.tsx`](file:///c:/project/src/pages/admin/AdminLoginPage.tsx); strictly authenticates registered Supabase administrators.
- [x] **Left-Side Collapsible Sidebar Navigation**: Built responsive collapsible sidebar with `isSidebarCollapsed` state, persistent local storage preference, desktop toggle icons, and mobile overlay drawer.
- [x] **In-Admin Dark / Light Mode Button**: Integrated theme toggle button directly into the sidebar and header using `useTheme()`, supporting instantaneous switching between light and dark palettes.
- [x] **Full Department / Category Management**:
  - Authored Supabase SQL migration [`supabase/migrations/002_categories_schema.sql`](file:///c:/project/supabase/migrations/002_categories_schema.sql) with table `public.categories`, unique URL slug index, and RLS policies.
  - Built [`src/services/categoryService.ts`](file:///c:/project/src/services/categoryService.ts) with real-time WebSocket channel `public:categories_sync`.
  - Built [`src/components/admin/CategoryModal.tsx`](file:///c:/project/src/components/admin/CategoryModal.tsx) for adding and updating department names, descriptions, and custom URL slugs.
  - Built [`src/components/admin/DeleteCategoryModal.tsx`](file:///c:/project/src/components/admin/DeleteCategoryModal.tsx) with active role count warnings.
  - Real-time categories table in Admin dashboard displaying Department Name, URL Slug with 1-click clipboard copy, description, active job count, Edit action, and Delete action.
- [x] **Full Candidate Category Route Support**: Added `/category/:slug` route in [`src/App.tsx`](file:///c:/project/src/App.tsx) and updated [`src/pages/CategoryJobsPage.tsx`](file:///c:/project/src/pages/CategoryJobsPage.tsx) to dynamically resolve department listings.
- [x] **Dynamic Job Form Categories**: Updated [`src/components/admin/JobFormModal.tsx`](file:///c:/project/src/components/admin/JobFormModal.tsx) to automatically populate department selections from live Supabase categories.

### 1.8 Phase 8: Team & User Access Management
- [x] **Supabase Migration 003**: Authored [`supabase/migrations/003_admin_users_schema.sql`](file:///c:/project/supabase/migrations/003_admin_users_schema.sql) with `public.admin_users` directory, indexing, and `SECURITY DEFINER` stored procedures (`admin_create_user`, `admin_update_user`, `admin_delete_user`) to seamlessly provision accounts in `auth.users` with encrypted passwords and immediate login readiness.
- [x] **User Management Service**: Created [`src/services/userService.ts`](file:///c:/project/src/services/userService.ts) and [`src/types/user.ts`](file:///c:/project/src/types/user.ts) for real-time WebSocket synchronization (`public:admin_users_sync`), user creation, updates, and deletion.
- [x] **User Provisioning Modal**: Built [`src/components/admin/UserModal.tsx`](file:///c:/project/src/components/admin/UserModal.tsx) with full name, email, role selection (Super Admin, Administrator, Recruiter, Content Editor), password input with 1-click auto-generation, show/hide eye toggle, and account status toggles.
- [x] **Secure User Deletion**: Built [`src/components/admin/DeleteUserModal.tsx`](file:///c:/project/src/components/admin/DeleteUserModal.tsx) with self-deletion protection to prevent logged-in administrators from deleting their own active session.
- [x] **Admin Page Users Tab**: Added "Users & Access" tab to the collapsible sidebar in [`src/pages/admin/AdminPage.tsx`](file:///c:/project/src/pages/admin/AdminPage.tsx), complete with metrics cards (Total Users, Administrators, Recruiters, Active), real-time search, role filtering, status filters, and live table.

### 1.9 Phase 9: Admin Experience, Brand Collapsible Logo, Profile Management & Sticky Layout
- [x] **Public Directory & Asset Alignment**:
  - Maintained canonical structure with `public/favicon/` and `public/logo/` containing `logo.svg` (full brand logo) and `logo-q.svg` (compact mark).
  - Dynamically switched between `logo.svg` when sidebar is expanded and `logo-q.svg` when sidebar is collapsed.
- [x] **Sidebar Navigation Cleanup**:
  - Removed "Candidate Site" link from the sidebar menu to keep admin workspace focused on management tasks.
- [x] **Administrator Profile Management**:
  - Built [`src/components/admin/AdminProfileView.tsx`](file:///c:/project/src/components/admin/AdminProfileView.tsx) to allow administrators to edit Display Name, Email Address, and Password with validation and feedback alerts.
  - Added "My Profile" tab to the admin sidebar navigation and made the user badge at the bottom of the sidebar an interactive button navigating directly to the Profile view.
  - Implemented `updateAdminProfile` in [`src/services/adminAuthService.ts`](file:///c:/project/src/services/adminAuthService.ts) updating Supabase Auth metadata and `public.admin_users`.
- [x] **Non-Scrollable Fixed Sidebar & Scrollable Main Content**:
  - Fixed admin viewport structure using `h-screen h-[100dvh] flex overflow-hidden`.
  - Configured sidebar as `h-full shrink-0 md:relative` so it remains fixed in place while only the main content viewport (`overflow-y-auto`) scrolls.
- [x] **Branded Admin Footer**:
  - Created [`src/components/admin/AdminFooter.tsx`](file:///c:/project/src/components/admin/AdminFooter.tsx) with `logo.svg` branding, version badge `v1.2.0`, live Supabase real-time connection indicator, and navigation links.
- [x] **Tab Persistence Across Refresh**:
  - Added URL search parameter synchronization (`?tab=...`) and `localStorage` caching (`admin_active_tab`).
  - Refreshing any tab (e.g. `users`, `categories`, `profile`) now preserves the exact active tab view rather than resetting to the first tab.

### 1.10 Phase 10: Intelligently Contained Responsive Layout, Animated Admin Theme Switcher & Clean Jobs Table
- [x] **Minimal Branded Footer**:
  - Updated [`src/components/admin/AdminFooter.tsx`](file:///c:/project/src/components/admin/AdminFooter.tsx) to remove external footer links, displaying clean centered branding and live updating date & time in the right corner.
- [x] **Intelligent Responsive Layout & Stretch Prevention**:
  - Encapsulated header and main content inside responsive `max-w-7xl mx-auto` containers with smooth transitions (`transition-all duration-300 ease-in-out`).
  - Solved content stretching and shortening when toggling the collapsible sidebar.
- [x] **Dedicated Animated Admin Theme Switcher**:
  - Created [`src/components/admin/AdminThemeToggle.tsx`](file:///c:/project/src/components/admin/AdminThemeToggle.tsx) featuring rotating Sun/Moon micro-animations and an animated sliding pill track.
  - Deployed in the sidebar footer and top header bar.
- [x] **Jobs Table Column Refinement**:
  - Removed the Compensation column from the administrative Jobs management table in [`src/pages/admin/AdminPage.tsx`](file:///c:/project/src/pages/admin/AdminPage.tsx), allocating clean proportional widths to remaining columns.

### 1.10 Phase 10: Alphanumeric Admin ID & Public Header / Navigation Refactor
- [x] **Profile Page Alphanumeric ID**:
  - Implemented `formatAdminAlphanumericId` in [`src/components/admin/AdminProfileView.tsx`](file:///c:/project/src/components/admin/AdminProfileView.tsx) to generate a strictly alphanumeric ID (`[A-Z0-9]`).
  - Takes the first 4 alphabetical letters of the user's name uppercase (e.g. `ALEX` or fallback `ADMN`) followed by 4 digits extracted from `adminUser.id`.
  - Displayed prominently in the top profile banner (`ID: ALEX9298`) and inside a dedicated read-only identity field in the profile form.
  - Clipboard copy button copies the exact alphanumeric ID.
- [x] **Public Header Job Tag Removal**:
  - Removed the `<span ...>Jobs</span>` badge adjacent to the brand logo in [`src/components/layout/Navbar.tsx`](file:///c:/project/src/components/layout/Navbar.tsx).
- [x] **Navigation Links Hierarchy**:
  - Restructured top navigation to: `Jobs` (dropdown menu with `Remote`, `Onsite`, `Hybrid`, `Internships`, `By Departments`, `By Companies`), `About`, and `Contact`.
  - Created [`src/pages/DepartmentsPage.tsx`](file:///c:/project/src/pages/DepartmentsPage.tsx) (`/departments`) and [`src/pages/CompaniesPage.tsx`](file:///c:/project/src/pages/CompaniesPage.tsx) (`/companies`).
  - Configured full routing in [`src/App.tsx`](file:///c:/project/src/App.tsx) and updated [`src/pages/CategoryJobsPage.tsx`](file:///c:/project/src/pages/CategoryJobsPage.tsx) to support company-level filtering (`/company/:companyName`).
- [x] **Header Action Controls & Theme Toggle Switch**:
  - Completely removed the notification bell icon button from the header.
  - Placed a dedicated modern theme toggle switch (`role="switch"`) with dual in-track Sun/Moon indicators and sliding circular thumb.

### 1.11 Phase 11: Admin Logo Cleanse, Letter Initial Avatar Badge & Profile/Security Navigation
- [x] **Sidebar Brand Header Cleanse**:
  - Removed the text branding (`inaquired`) and `Admin Panel` label from the admin sidebar brand header in [`src/pages/admin/AdminPage.tsx`](file:///c:/project/src/pages/admin/AdminPage.tsx).
  - Displays only the pure SVG logo asset (`logo.svg` when expanded, `logo-q.svg` when collapsed) with clean hover scaling and home navigation.
- [x] **Sidebar Navigation De-Cluttering**:
  - Removed the redundant "My Profile" tab from the primary sidebar navigation items list.
  - Kept primary management tabs focused on Job Listings, Departments & Categories, and Users & Access.
- [x] **User Name First Letter Avatar Badge**:
  - Replaced generic avatar icons/images across the admin panel with a dynamic single-character initial badge derived from the user's name first letter (`userInitial = (fullName || email || 'A').charAt(0).toUpperCase()`).
  - Styled with vibrant gradient palettes (`from-indigo-600 to-indigo-800`), crisp white font, and subtle glow rings.
- [x] **Account Actions Dropdown Menu**:
  - Implemented interactive profile avatar dropdown in the admin header and sidebar footer with outside-click listener.
  - Provides instant access to:
    - **Profile**: Direct navigation to Personal Information & Identity view (name, email, alphanumeric ID).
    - **Security**: Direct navigation to Security & Access Credentials view (password change, confirm password, authentication security).
    - **Sign Out**: Secure session invalidation and logout.
- [x] **Section Partitioning in Admin Profile View**:
  - Updated [`src/components/admin/AdminProfileView.tsx`](file:///c:/project/src/components/admin/AdminProfileView.tsx) to accept `initialSection?: 'profile' | 'security'`.
  - Added section navigation tabs allowing fluid switching between Personal Information and Security & Password management.

### 1.12 Phase 12: Resend-Style Profile Menu & Header Cleanliness
- [x] **Exclusive Sidebar Profile Switcher**:
  - Implemented top-of-sidebar account switcher featuring a rounded squircle badge in Resend deep purple (`#6d28d9`), bold white initial letter (`userInitial`), username/handle (`userDisplayName`), and rotating chevron arrow (`ChevronDown`).
  - Retained exclusively in the left sidebar as requested, removing redundant duplicate profile trigger from the header top-right.
- [x] **Streamlined Account Dropdown**:
  - Removed `Create team` and `Invite members` items from [`ResendAccountMenu`](file:///c:/project/src/pages/admin/AdminPage.tsx).
  - Preserved focused essential actions:
    - User email header at top in muted font (`text-xs text-slate-500`) with subtle separator.
    - `My profile`: navigates directly to the Administrator Profile view.
    - `Security`: navigates directly to the Security & Password tab.
    - Divider.
    - `Homepage ↗`: opens public candidate portal with diagonal arrow icon (`ArrowUpRight`).
    - Divider.
    - `Log out`: cleanly invalidates administrative session.
- [x] **Header Top-Right Cleanse**:
  - Removed theme toggle button, Supabase Live status indicator pill, and profile dropdown from the header top-right.
  - Kept only contextual CTA buttons (`Post New Job` / `Add Department`) for an ultra-clean, minimal aesthetic.
  - Sidebar footer cleanly houses the animated dark/light mode toggle.
- [x] **Collapsed Sidebar Dropdown Flyout & Overflow Escape**:
  - Resolved dropdown clipping when the sidebar is collapsed/shrinked (`isSidebarCollapsed = true`).
  - Moved profile switcher container out of the scrollable navigation container (`overflow-y-auto`) into its own pinned top block.
  - Implemented dynamic bounding rect coordinate measurement (`toggleProfileDropdown`) applying `position: fixed`, `left: rect.right + 8`, `top: rect.top`, and `z-index: 9999` in collapsed mode to float completely outside of any parent clipping boundaries.
  - Added window resize and scroll listeners to dismiss the floating popover cleanly.

---

## 2. Upcoming Roadmap & Enhancement Tasks

### 2.1 Candidate Attachment Uploader
- [ ] Add an optional "Attach Resume / Portfolio" file input to candidate apply modals using [`storageService.ts`](file:///c:/project/src/services/storageService.ts).
- [ ] Enforce client-side file type restrictions (PDF, DOCX under 10MB) before S3 egress upload.

### 2.2 Supabase Edge Functions & Email Alerts
- [ ] Deploy Supabase Edge Function to process `subscribers` table triggers.
- [ ] Send weekly consolidated digests of newly verified roles to subscribers.

### 2.3 Automated Syndication Feeds
- [ ] Generate an XML RSS / Atom feed at `/api/feed.xml` for automated syndication to developer aggregators and Google Jobs crawlers.

### 2.4 CI/CD Pipeline
- [ ] Create GitHub Actions workflow (`.github/workflows/ci.yml`) to automatically execute `npm run lint` and `npm run test` on every pull request.
