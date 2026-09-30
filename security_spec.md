# Security Specification for inaquired

## 1. System Invariants
- **Public Zero-Access to Admin Actions**: Unauthenticated users and visitors can NEVER create, edit, unpublish, or delete jobs.
- **Published-Only Isolation**: Unauthenticated users can strictly query and view jobs where `status == 'published'`. Drafts and archived jobs are never exposed to public queries.
- **Admin RBAC Verification**: Administrative operations require an authenticated admin session validated against the runtime admin email (`manmeet.msh@gmail.com`) or entry in the `/admins` collection.
- **Payload & Input Boundaries**: String sizes are strictly bounded (`title` <= 150, `slug` <= 180, `description` <= 15000, `companyName` <= 120, `location` <= 120) to prevent Denial-of-Wallet and payload injection.
- **Audit Immutability**: Administrative logs in `/auditLogs` cannot be altered or deleted once written.

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Job Creation**: Anonymous client attempts `POST /jobs/test-job` with valid job structure -> `PERMISSION_DENIED`.
2. **Ghost Field Injection**: Admin or non-admin attempts to add unauthorized keys or malicious payloads outside the schema definition.
3. **Draft Job Scraping by Public**: Anonymous user queries `/jobs` without `status == 'published'` filter to view unpublished draft jobs -> `PERMISSION_DENIED`.
4. **Direct Admin Table Modification by Non-Admin**: Non-admin user attempts `setDoc(/admins/hackerUid, {role: 'superadmin'})` -> `PERMISSION_DENIED`.
5. **Audit Log Tampering / Deletion**: Admin or non-admin attempts `deleteDoc(/auditLogs/log123)` -> `PERMISSION_DENIED`.
6. **Title Payload Overflow**: Creating a job with 200,000 character string in `title` -> `PERMISSION_DENIED`.
7. **Invalid Job Type**: Setting `jobType: 'malicious-type'` -> `PERMISSION_DENIED`.
8. **Invalid Work Arrangement**: Setting `workArrangement: 'invalid'` -> `PERMISSION_DENIED`.
9. **Direct Deletion of Published Job by Non-Admin**: Unauthenticated visitor calls `deleteDoc(/jobs/123)` -> `PERMISSION_DENIED`.
10. **Subscriber Token Poisoning**: Injecting >500 character payload into subscriber endpoint -> `PERMISSION_DENIED`.
11. **Reading Private Subscriber Tokens as Public**: Public user attempts `getDocs(/subscribers)` -> `PERMISSION_DENIED`.
12. **Status Privilege Escalation**: Public user attempting to update status from draft to published -> `PERMISSION_DENIED`.
