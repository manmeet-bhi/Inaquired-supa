# Design System & UI/UX Specification
## Project: inaquired – Serverless Public Job Portal
**Document**: `design.md`  
**Aesthetic Style**: Minimalist Typography-Focused, Anti-Logo Discipline, Modern Glassmorphism  
**Framework**: Tailwind CSS v4  

---

## 1. Design Philosophy & Guiding Principles

### 1.1 Anti-Logo Minimalist Discipline
Traditional job boards are dominated by brightly colored corporate logos and banner ads that distract from the substance of an opportunity. **inaquired** enforces an **anti-logo discipline**:
- No company logo image avatars on job cards.
- The visual weight is directed to **job titles**, **transparent salaries**, **technical tags**, and **work format chips** (Remote, On-site, Hybrid).
- Produces a calm, high-density, readable interface that respects the candidate's time.

### 1.2 Glassmorphism & Depth
- **Sticky Glass Navbar**: `backdrop-blur-md` with subtle translucency (`bg-white/95` in Light mode, `bg-slate-900/95` in Dark mode) anchored by a 1px border (`border-slate-200` / `border-slate-800`).
- **Interactive Depth**: Cards utilize subtle ambient shadows (`shadow-xs` to `shadow-sm`) with soft micro-elevations on hover (`hover:-translate-y-0.5`).

---

## 2. Color System & Semantic Tokens

### 2.1 Color Palette
| Token | Light Mode Value | Dark Mode Value | Semantic Role |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `slate-50` (`#f8fafc`) | `slate-950` (`#020617`) | Main application viewport |
| **Card Surface** | `white` (`#ffffff`) | `slate-900` (`#0f172a`) | Elevated content containers |
| **Border Neutral** | `slate-200` (`#e2e8f0`) | `slate-800` (`#1e293b`) | Structural dividers & outlines |
| **Primary Accent** | `indigo-600` (`#4f46e5`) | `indigo-500` (`#6366f1`) | Primary CTAs, active indicators |
| **Primary Subtle** | `indigo-50` (`#eef2ff`) | `indigo-950/60` | Chip backgrounds, active pills |
| **Text Primary** | `slate-900` (`#0f172a`) | `white` (`#ffffff`) | Page headings, role titles |
| **Text Secondary** | `slate-600` (`#475569`) | `slate-400` (`#94a3b8`) | Company names, body copy |
| **Text Muted** | `slate-400` (`#94a3b8`) | `slate-500` (`#64748b`) | Timestamps, placeholders |
| **Success / Verified** | `emerald-600` (`#059669`) | `emerald-400` (`#34d399`) | Verified status, competitive pay |
| **Warning / Caution** | `amber-500` (`#f59e0b`) | `amber-400` (`#fbbf24`) | Deadlines approaching |
| **Danger / Alert** | `rose-600` (`#e11d48`) | `rose-400` (`#fb7185`) | Error states |

---

## 3. Typography & Hierarchy

### 3.1 Typeface Stack
The platform uses the native System UI / Modern Sans font stack with high legibility across platforms:
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### 3.2 Scale & Hierarchy
- **Display 1 (`h1`)**: `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight` (Home Hero).
- **Heading 2 (`h2`)**: `text-2xl font-bold tracking-tight` (Detail Title, Section Hubs).
- **Heading 3 (`h3`)**: `text-lg sm:text-xl font-semibold` (Card Title).
- **Body Regular**: `text-sm leading-relaxed` (Descriptions, Requirements).
- **Microcopy & Chips**: `text-[11px] sm:text-xs font-medium uppercase tracking-wider` (Tags, Dates, Status).

---

## 4. Component Design Specifications

### 4.1 Navigation Bar (`Navbar.tsx`)
- **Height**: Fixed 64px (`h-16`).
- **Elements (Left to Right)**:
  1. **Brand Mark**: Indigo rounded square icon with `Briefcase` + `inaquired` typography with `Jobs` badge.
  2. **Search Pill**: Quick search input with magnifying glass and keyboard accessibility.
  3. **Nav Links**: Horizontal text buttons with active Indigo underline pills.
  4. **Right Actions**: Notification alert bell (with animated live ping), Light/Dark mode toggle button, and mobile hamburger drawer.

### 4.2 Job Card (`JobCard.tsx`)
- **Container**: Rounded 16px (`rounded-2xl`) card with 1px border.
- **Top Row**: Role Title (hover color shift to Indigo), Work Arrangement badge (e.g. `Remote` in Indigo pill, `On-site` in Slate pill, `Hybrid` in Purple pill).
- **Middle Row**: Company name, Location pin with locality text, Experience level badge.
- **Bottom Row**:
  - Formatted Salary pill (`$120,000 - $150,000 / yr`).
  - Relative posting time (`2 days ago`).
  - Technology tags (e.g. `TypeScript`, `React`, `Supabase`).
  - Direct "View Opening" chevron button.

### 4.3 Job Detail View (`JobDetailPage.tsx`)
- **Header Banner**: Back button link to previous view, full job title, company name, location, and direct "Apply on Employer Site" CTA button.
- **Content Columns**:
  - Left / Main Column: Overview, bulleted Responsibilities list, bulleted Requirements list, Lifestyle & Benefits perks.
  - Right / Sidebar: Summary metadata card (Job Type, Work Arrangement, Salary Range, Application Deadline, Verification Stamp).
- **SEO Injection**: Automatic insertion of schema.org `JobPosting` JSON-LD microdata into `<head>`.

### 4.4 Global Footer (`Footer.tsx`)
- 4-column responsive grid on desktop, single column on mobile.
- Column 1: Brand mission & real-time platform badge.
- Column 2: Work format shortcuts (Remote, On-site, Hybrid, Internships).
- Column 3: Corporate governance (About, Contact, Privacy Policy, Terms of Service).
- Column 4: Platform pledge on zero candidate tracking and verified compensation.
