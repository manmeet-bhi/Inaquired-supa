# Product Requirements Document (PRD)
## Project Name: inaquired – Serverless Public Job Portal
**Version**: 2.0.0  
**Status**: Approved & Implemented  
**Date**: October 2026  

---

## 1. Executive Summary & Vision

**inaquired** is a high-performance, serverless job discovery and management platform designed to connect job seekers with verified employment opportunities (Remote, On-Site, Hybrid, and Paid Internships). 

The platform is strictly designed with an **Anti-Friction, Zero-Barrier Philosophy**: public visitors browse, filter, search, and apply directly to roles without login walls, mandatory registration, or privacy-invasive tracking cookies. 

---

## 2. Target Personas & User Journeys

### 2.1 Primary Persona: The Tech & Design Candidate
- **Attributes**: Engineers (Frontend, Backend, Distributed Systems, Full-Stack), Designers (UI/UX, Design Systems, Product), and Interns.
- **Pain Points with Traditional Job Boards**: 
  - Forced account registration and resume uploads before seeing application links.
  - Vague salary ranges ("Competitive salary") hiding true compensation.
  - Distracting corporate marketing and visual clutter over actual role scope.
- **User Goals**:
  - Instantly search and filter jobs by work arrangement, category, and salary.
  - Read comprehensive, structured job scopes with clear technical requirements.
  - Click a single button to apply directly on the employer's official recruitment portal.

### 2.2 Secondary Persona: Platform Administrator & Curators
- **Attributes**: Platform owners and talent scouts curating verified high-signal roles.
- **Goals**:
  - Manage postings through Supabase PostgreSQL tables and secure APIs.
  - Store and distribute job attachments and assets via S3-compatible egress storage.
  - Broadcast real-time updates to all connected browser clients instantly.

---

## 3. Product Principles

1. **Zero Login Walls for Candidates**: Candidates never encounter registration prompts to view or apply to jobs.
2. **Anti-Logo Minimalist Discipline**: Cards deliberately avoid flashy corporate logos, focusing attention on transparent compensation, technical requirements, and core responsibilities.
3. **Real-Time Data Backbone**: All published roles synchronize instantly via Supabase Realtime channels.
4. **Resilient Local Fallback**: The client features an intelligent offline/local store ensuring the portal remains usable and testable even during intermittent network disconnects.
5. **Google for Jobs SEO**: Dynamic schema injection attaches rich `JobPosting` JSON-LD microdata for maximal discoverability on search engines.

---

## 4. Detailed Feature Specifications

### 4.1 Home Page & Hero Section
- Dynamic headline articulating platform focus.
- Quick summary metrics (e.g. verified positions, transparent compensation).
- Quick category cards: Remote Roles, On-Site, Hybrid, and Internships.

### 4.2 Real-Time Search & Filtration
- **Real-Time Keyword Search**: Real-time debounce matching title, company name, tags, and role description.
- **Filter Parameters**:
  - **Work Arrangement**: All, Remote, On-Site, Hybrid.
  - **Job Type**: All, Full-time, Part-time, Contract, Internship.
  - **Experience Level**: All, Entry, Mid, Senior, Lead, Internship.
  - **Category**: Engineering, Design, Product, Marketing, Operations, etc.
  - **Sorting**: Newest First, Highest Salary, Lowest Salary.

### 4.3 Category & Format Hub Pages
- Dedicated landing routes:
  - `/remote-jobs`: Pre-filtered for 100% remote positions.
  - `/onsite-jobs`: Pre-filtered for on-site locations.
  - `/hybrid-jobs`: Pre-filtered for hybrid work setups.
  - `/internships`: Pre-filtered for university and early-career internships.

### 4.4 Job Detail View (`/jobs/:slug`)
- Full role description, bulleted responsibilities, qualifications, and benefits.
- Standardized salary display formatted across currencies (`USD`, `EUR`, `GBP`).
- Direct application link routing candidates to employer careers pages.
- Dynamic `JobPosting` JSON-LD structured data injection in document `<head>`.
- Social sharing and link copy utilities.

### 4.5 Browser Web Push Notification Alerts
- Integration with standard HTML5 Web Notifications API.
- Live alerts triggered when new roles matching user preferences are published.
- Privacy-compliant opt-in banner with local state persistence.

### 4.6 Governance & Compliance Pages
- `/about`: Platform mission and transparency commitment.
- `/contact`: Direct reporting and inquiry channels.
- `/privacy`: Transparent, cookie-free privacy statement.
- `/terms`: Service governance terms.

---

## 5. Non-Functional Requirements

| Metric / Dimension | Specification |
| :--- | :--- |
| **Performance** | Core Web Vitals: LCP < 1.2s, INP < 50ms, CLS < 0.05. Production bundle gzipped under 160 kB. |
| **Accessibility** | WCAG 2.1 AA compliant. High-contrast typography in both Dark and Light modes. |
| **Database** | PostgreSQL hosted on Supabase (`ap-northeast-1` egress storage). |
| **Offline Resilience** | Automatic in-memory and `localStorage` fallback if database connectivity drops. |
| **SEO** | Serverless JSON-LD schema markup, OpenGraph meta tags, canonical URL routing. |
| **Browser Compatibility** | Chrome, Edge, Safari, Firefox (last 2 major versions) and mobile viewports. |
