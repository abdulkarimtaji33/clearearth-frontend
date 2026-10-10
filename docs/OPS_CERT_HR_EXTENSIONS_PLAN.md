# Work Orders / Certificates / GRN / HR extensions — Plan

_Created 2026-10-10. Scope: `clearearth-backend` + `clearearth-frontend`. Deploy target: **dev server only** (72.60.223.25) until told to push live._

## Requests covered (verbatim, grouped)

**A — Work orders, certificates, GRN**
1. Multiple users can be assigned to the same work order task.
2. Evidence can be submitted at completion of every work order task.
3. That evidence should be linked with the Certificate Management module.
4. Operations should know, before/while creating a work order, whether the sales side needs a certificate or WDS — and if so, which certificate types.
5. GRN evidence should accept all document/image types, not just images.
6. On GRN submission, the sales user should be notified and able to download it.

**B — Certificate Management**
7. Remove "tons" from the quantity field label.
8. Remove the material type field.
9. Add a UoM field next to quantity.
10. Add a "collection date" filter to the certificate register.
11. Add a certificate type column to the register and its CSV export.

**C — HR module**
12. HR should be able to name any document type themselves when uploading.
13. Uploaded attachments should be removable.
14. IT Asset Form, Salary Certificate, Salary Slip and Handover Form should generate from the details HR has actually filled in — not blank.

## Current-state findings (so the plan doesn't re-build what exists)

- GRN image upload already accepts images + PDF at the backend (shared `uploadFileTypes` allowlist covers images/pdf/doc/docx/xls/xlsx); only the frontend's `accept` attribute and `GrnEvidenceThumbs` rendering are image/PDF-only. (5)
- GRN already has a submit step (`status: 'submitted'`) and a working PDF download wired at `GET /pdf/grn/:id/pdf` (authenticated only); sales already holds `grn.read`. Missing piece is just the notification on submit. (6)
- `CertificateRequest`/`CertificateRequestAttachment` (with `file_type: 'destruction_photo'`) already model "evidence linked to a certificate request" — task evidence can reuse this shape via a new attachment source rather than inventing a parallel system. (2, 3)
- `Deal.wds_required` already exists; there is no `certificate_required` / required-types field yet. (4)
- `WorkOrderTask.assigned_to` is a single FK; needs a join table for multiple assignees, kept backward compatible. (1)
- Certificate register (`CertificateList.jsx`) already exports CSV and filters by type/date range; needs quantity label, remove material type column, add UoM, add collection-date filter (it has from/to already — "collection date" filter likely means filtering on `collection_date` specifically, which `from`/`to` already target — confirm wording covers it, otherwise add an explicit single-date quick filter), and a certificate-type column in the table + CSV. (7–11)
- HR "Other Documents" already supports typing a brand-new document type (freeSolo). The 4 pinned identity documents (Passport/Emirates ID/Visa/Labour Card) have Add/Edit but no delete. `EntityListEditor`-based tabs (qualifications, certifications, skills, dependents, emergency contacts) already support delete. (12, 13)
- IT Asset Form / Salary Certificate / Salary Slip / Handover Form already render from live HR data (Puppeteer HTML→PDF), and salary certificate/slip already refuse to generate without an active salary structure. The asset form silently renders "No assets assigned" instead of refusing. (14)

## Design decisions

- **Multiple assignees**: new `work_order_task_assignees` join table (`task_id`, `user_id`), keep `assigned_to` on `WorkOrderTask` as a nullable legacy column (unused going forward, not dropped, to avoid a risky migration on live data) and a data migration that copies any existing `assigned_to` into the join table. API: `assignedTo` becomes `assigneeIds: number[]` in the task payload; `assignedUser` becomes `assignees: User[]` in responses.
- **Task completion evidence**: new `work_order_task_evidence` table (`task_id`, `file_path`, `original_name`, `uploaded_by`, `certificate_request_id` nullable). Upload endpoint accepts multiple files of any allowed type. When a task is marked `completed`, the UI prompts for evidence (not hard-blocked server-side, to avoid breaking existing completed tasks). A "Link to certificate request" action on the work order lets Operations attach the task's evidence files into a `CertificateRequestAttachment` (`file_type: 'destruction_photo'`) against the deal's certificate request — reusing the existing certificate pipeline instead of a parallel one.
- **Certificate/WDS visibility for Operations**: add `certificate_required` (boolean) and `required_certificate_types` (JSON array of the same enum as `CertificateRequestType.type`) to `Deal`. Editable on the deal form (sales side, alongside the existing `wds_required`). Surfaced as a banner/chip set on `WorkOrderForm` (create/edit) and `WorkOrderView`, reading `deal.wds_required`, `deal.certificate_required`, `deal.required_certificate_types`.
- **GRN evidence file types**: widen `accept` to the same set the backend already allows; give `GrnEvidenceThumbs` a generic file tile (icon + extension) for any non-image/PDF type, extending the existing PDF-tile pattern.
- **GRN submit notification**: in `grnService.updateGrn`, when status transitions to `submitted`, call a new `notificationService.notifyGrnSubmitted(tenantId, grn, dealSalesUserId, submittedByUser)` targeting `deal.assigned_to`. Reuses the existing GRN PDF route for download; add a "Download GRN" affordance in the notification payload (entity type/id is enough, the frontend notification click already deep-links).
- **Certificate register field changes**: `CertificateRequestForm` — rename "Total Weight / Quantity (tons)" to "Quantity", add a `uom` text/select field next to it (free-text matching existing lookup pattern, or a short fixed list: kg, tons, pcs, liters), remove the Material Type dropdown entirely (field stays in the DB as nullable/unused — not dropped, to avoid breaking existing rows). `CertificateList` — add a Collection Date filter (single date, in addition to existing from/to, since the user named it specifically) and a Certificate Type column, included in the CSV export.
- **HR document delete**: add a delete action to the 4 pinned `IdentityDocumentCard`s, reusing the existing generic child-record delete endpoint.
- **HR PDF gating**: Asset Form generation refuses (400, same pattern as salary cert/slip) when the employee has zero assigned assets, with a clear frontend message instead of a blank PDF. Handover Form already requires assets by nature — confirm/align same way.

## Phases

| # | Phase | Output |
|---|-------|--------|
| 1 | Schema + migrations | `work_order_task_assignees`, `work_order_task_evidence` tables; `deals.certificate_required` + `deals.required_certificate_types`; migration copying existing `assigned_to` values |
| 2 | Work order backend | Multi-assignee CRUD on tasks, task evidence upload/list/delete endpoints, "link evidence to certificate request" endpoint, deal certificate fields in deal create/update |
| 3 | Work order frontend | Multi-select assignees in task drawer, evidence upload UI on task completion, certificate/WDS banner on WorkOrderForm/View, deal form fields for certificate requirement |
| 4 | GRN + notifications | Widened evidence file types (frontend+thumbs), GRN-submitted notification to the deal's sales user |
| 5 | Certificate register | Form field changes (quantity label, UoM, remove material type), register filter + column + CSV changes |
| 6 | HR fixes | Delete on pinned identity documents, Asset Form generation guard |
| 7 | QA + deploy to dev | Build both repos, exercise each flow, push `main`, deploy to 72.60.223.25 only |

## Deploy

Push to `main` on both repos, then `DEPLOY_HOST=root@72.60.223.25 npm run deploy:vps` from `clearearth-backend` (dev only — do not touch 72.60.222.81 live until asked).

## Progress log

**2026-10-10 — All phases shipped to dev (72.60.223.25), live untouched.**

- Schema: `work_order_task_assignees` join table (backfilled from existing `assigned_to`), `deals.certificate_required` / `required_certificate_types`, `certificate_requests.uom`, `certificate_request_attachments.source_task_file_id`. Verified present on dev DB after migration.
- Work orders: tasks support multiple assignees end-to-end (API + task drawer multi-select); per-task evidence upload/list/delete (any file type) with a "link to certificate request" action that copies the file into Certificate Management as a `destruction_photo` attachment; deal WDS/certificate requirement banner on both the work order form and view, fed from `Deal.wds_required`/`certificate_required`/`required_certificate_types`.
- Deals: "Certificate Required?" checkbox + certificate type picklist next to the existing WDS fields.
- GRN: evidence upload accepts images/PDF/Word/Excel on the frontend (backend already did); thumbnails show a generic file tile for non-image types; GRN submission now notifies the deal's sales user (`notifyGrnSubmitted`) who can already download the existing GRN PDF.
- Certificate register: Quantity relabeled (no more hardcoded "tons"), UoM field added to the request form, Material Type field removed from the form (DB column kept, unused going forward), register gained a Collection Date filter and a Certificate Type column + CSV export.
- HR: pinned identity documents (Passport/Emirates ID/Visa/Labour Card) can now be deleted, not just added/edited; IT Asset Form generation refuses with a clear error when the employee has no assigned assets (salary certificate/slip already did this).
- Also done this round, not in the original plan: inspection report PDF download for the sales user from the deal view (`GET /deals/:id/inspection-report/pdf`, gated by the same `deals.read` permission sales already holds); confirmation dialogs added for the inspector's "Accept" action on inspection requests and "Approve" action on inspection reports (reject already had a reason dialog, which doubles as confirmation).
- QA done: every changed file parsed with esbuild individually, full `vite build` run twice (clean both times), new tables/columns confirmed on the dev DB via a live query, dev frontend (`:3333/erp/work-orders`) and API both return healthy responses after deploy.
- Not yet done: the admin dashboard redesign (pending a working reference link/screenshot from the user — the shared claude.ai artifact URL could not be opened by either the Artifact tool or WebFetch).
- Not click-tested in a real browser end-to-end (multi-assignee save round-trip, evidence upload/delete, certificate linking, GRN notification delivery, confirmation dialogs) — logic and build are verified, but no live walkthrough was performed.
