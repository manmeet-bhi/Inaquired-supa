# Engineering Guidelines & Development Rules
## Project: inaquired – Serverless Public Job Portal
**Document**: `rules.md`  
**Scope**: Code Quality, Architecture Invariants, Formatting & Security Standards  

---

## 1. Core Engineering Standards

### 1.1 Strict TypeScript & Build Invariants
- **Zero Type Errors**: Every pull request and change must pass `npm run lint` (`tsc --noEmit`) with **0 errors**.
- **No Unsafe Type Assertions**: Avoid indiscriminate use of `any`. Explicitly model database entities and API responses using strongly-typed models in `src/types/`.
- **Pure ES Modules**: The project strictly uses native ECMAScript Modules (`"type": "module"` in `package.json`).
- **Clean Bundling**: The Vite build (`npm run build`) must compile cleanly without fatal warnings.

### 1.2 Deprecation & Cloud Isolation Rules
- **Zero Firebase Dependency**: Firebase SDK and related cloud configuration files are prohibited. All database and storage operations must use Supabase (`@supabase/supabase-js`).
- **No Candidate Login Barriers**: Never introduce login forms, paywalls, or mandatory sign-ups for browsing jobs, searching positions, or clicking application links.

---

## 2. Supabase Integration Rules

### 2.1 Database & Column Mappings
- **Naming Conventions**:
  - PostgreSQL columns must use **`snake_case`** (e.g. `company_name`, `salary_min`, `work_arrangement`, `published_at`).
  - TypeScript interfaces must use **`camelCase`** (e.g. `companyName`, `salaryMin`, `workArrangement`, `publishedAt`).
  - All database interactions must use mapper functions (`mapFromDb` and `mapToDb` in `jobService.ts`) to ensure clean bi-directional transformation.

### 2.2 Storage & Egress Rules
- **Target Bucket**: All file uploads, resume submissions, and job documents must target the designated bucket: **`ap-northeast-1`**.
- **S3 Endpoint**: Use the official egress endpoint: `https://wnpsrdtlqxfiglhmalwq.storage.supabase.co/storage/v1/s3`.
- **Filename Sanitization**: Uploaded files must sanitize special characters, replacing non-alphanumeric characters with underscores (`_`) and prepending timestamps to avoid collisions.

### 2.3 Resilient Fallback Requirement
- Any data service connecting to Supabase must feature an intelligent local fallback (`offlineStore.ts`). If Supabase is unreachable or credentials are initializing, the application must gracefully render verified fallback data without white-screening or crashing.

---

## 3. Formatting & Internationalization Rules

### 3.1 Currency & Salary Formatting
- To prevent regional machine locale divergence (e.g. Indian numbering `1,00,000` vs international standard `100,000`), always explicitly specify `'en-US'` when invoking `.toLocaleString()` on numerical monetary amounts:
  ```ts
  // REQUIRED:
  `${symbol}${min.toLocaleString('en-US')} - ${symbol}${max.toLocaleString('en-US')} / yr`
  ```

### 3.2 Date Formatting
- Date displays must use standardized relative labels for recently posted roles ("Just posted", "X hours ago", "Yesterday", "X days ago") and explicit `en-US` formatting for older dates.

---

## 4. UI, Styling & Accessibility Rules

### 4.1 Anti-Logo Minimalist Discipline
- Job cards must strictly omit company logo images. Focus user attention on transparent role scope, salary ranges, location tags, and technical stack requirements.

### 4.2 Tailwind CSS v4 Best Practices
- Never use inline styles for layout or color manipulation.
- Utilize established design tokens:
  - Neutral backgrounds: `slate-50` / `white` (light), `slate-950` / `slate-900` (dark).
  - Primary accents: `indigo-600` (light), `indigo-500` / `indigo-400` (dark).
  - Borders: `border-slate-200` (light), `border-slate-800` (dark).

### 4.3 Accessibility Standards
- All interactive `<button>` and `<input>` elements must include meaningful `aria-label`, `title`, or explicit text.
- Contrast ratios must comply with WCAG 2.1 AA standards in both Light and Dark themes.

---

## 5. Testing & Verification Checklist

Before pushing any modification:
1. `npm run test`: All automated unit and integration tests must pass.
2. `npm run lint`: `tsc --noEmit` must report 0 issues.
3. `npm run build`: Production bundle must compile with zero errors.
