# HRM UI Redesign — Plan

_Created 2026-10-03. Scope: frontend only (`src/views/erp/hr/**`). No API or schema changes._

## Why

- The employee profile and directory looked broken. The cause was legacy MUI v5 `<Grid item xs md>` props, which MUI v7 silently ignores, so card grids collapsed into cramped rows (see the profile Overview).
- The profile has 17 horizontal tabs that overflow the screen, and several of them hold one or two fields each.
- The directory stats (Total / Active / On leave / Exited) are counted from the current page of rows, not the whole directory, so the numbers are wrong.
- Each HR page restyles cards, headers, empty states and chips its own way, so the module has no shared look.
- Most data shows raw values: `full_time`, `2026-09-28`, unformatted salary numbers.

## Design direction

The visual target is a clean, modern HRIS in the style of Rippling, BambooHR or Personio: calm surfaces, strong hierarchy, and dense but readable data.

- **One HR UI kit** (`src/views/erp/hr/components/HrUi.jsx`) that every HR page uses:
  - `HrPage`: page shell with title, subtitle, back link and actions.
  - `SectionCard`: card with icon, title, subtitle, action slot and optional dense body.
  - `DetailGrid` and `DetailItem`: label/value pairs built on CSS grid. They are responsive and work on MUI v7.
  - `StatTile`: KPI tile with an icon, value, label, optional hint and tone.
  - `StatusChip`, `ExpiryChip`, `PersonAvatar` (deterministic colour), `EmptyState`, `LoadingBlock`.
  - Formatters: `fmtDate`, `fmtMoney` (AED), `humanize`, `tenureOf`, `daysUntil`, `fullName`.
- Theme tokens only (palette, `alpha`). No hard-coded colours, so light and dark mode both work.
- Fully responsive. Every layout works at phone width.

## Feature spec (per surface)

### 1. Employee profile (`EmployeeView`, `MyProfile` → `EmployeeProfileTabs`)
- **Hero header.** A large avatar with a photo-upload overlay, plus name, status chip, designation and department. Below that is a meta row: code, manager, joined date with tenure, work email and phone.
- **Header actions.** HR mode shows Edit and a "Documents" menu with Employee Info PDF, Salary Certificate and Salary Slip. Self mode shows Download my info.
- **Compliance banner.** Shown when any identity document is expired or expires within 60 days.
- **The 17 tabs become 7.**
  1. **Overview**
     - KPI tiles: tenure, employment type, monthly package (HR only, when present) and document compliance.
     - Cards: Contact, Employment, Identity documents (with expiry chips), Reporting line.
  2. **Personal**: Personal details, Contact, Current address, Permanent address, Emergency contacts, Dependents.
  3. **Employment**: Job details (with probation and confirmation dates), Compensation (current package and salary history timeline), Bank & payroll IDs, and the Contract placeholder.
  4. **Documents**: Identity and compliance document cards, and Other documents.
  5. **Qualifications**: Education, Certifications, Skills (as chips), Previous employment.
  6. **Assets**: IT assets table, assign and return actions, and the form PDFs.
  7. **Activity**: History timeline, plus Notes in HR mode.
- **Tab persistence.** The active tab lives in the URL (`?tab=`) so a refresh or shared link keeps it.
- **Existing behaviour kept exactly.** Change requests, approval chips, child-record CRUD, salary edit dialog, document dialogs, notes and assets all stay as they are.

### 2. Employee directory (`EmployeeList`)
- A header with headcount and an "Add employee" button.
- **True status counts**, fetched per status with `pageSize=1` and read from `pagination.totalItems`. The status tabs use them (All, Active, Onboarding, On leave, Suspended, Exited).
- **Filters.** Search is debounced at 350 ms. There is also a department filter and a "Clear filters" action.
- **Two views.** A table and a card grid, toggled with a switch that is remembered in localStorage.
- Kept: row click to open, skeletons, empty states and pagination.

### 3. Employee form (`EmployeeForm`)
- **Layout.** One page with a sticky section navigator (scroll-spy anchors) on desktop:
  - Basic info, Identity documents, Contact, Job, Compensation, Bank, Notes, Login access.
  - Compensation is now inline instead of hidden in a second tab.
- **Sticky save bar** at the bottom with Cancel and Save.
- All date inputs are now DatePickers. The live salary total is shown as a summary tile.
- The API payload is identical to today's, and so is the login-access logic.

### 4. Attendance, Leave, Payroll, Departments, Dashboard widgets
Restyle these onto the kit: `HrPage` header, `SectionCard`s, `StatTile`s, consistent tables (uppercase muted headers, hover rows), `StatusChip`, `EmptyState`. Also fix every legacy `Grid item` usage. Behaviour and API calls stay unchanged.

## Phases

| # | Phase | Output | Check |
|---|-------|--------|-------|
| 1 | Foundation | `HrUi.jsx` kit and formatters | builds, lint clean |
| 2 | Employee profile | New `EmployeeProfileTabs`, `ChangeRequestSection`, `EntityListEditor`, `EmployeeView`, `MyProfile` | renders against the API, all 7 tabs |
| 3 | Directory and form | New `EmployeeList` and `EmployeeForm` | create/edit round-trip, filters, counts |
| 4 | Attendance and leave | 4 attendance and 4 leave pages on the kit | build, each route renders |
| 5 | Payroll, departments, dashboard | 4 payroll pages, departments list and form, HR widgets | build, each route renders |
| 6 | QA and ship | `vite build`, browser walkthrough, commit, push, deploy to dev (72.60.223.25) and live (72.60.222.81) | `:3333/erp/hr/*` works on both |

## Deploy

See `clearearth-backend/DEPLOYMENT.md`. Push `clearearth-frontend` `main`, then from `clearearth-backend` run `npm run deploy:vps:all`. That covers both servers. The backend is unchanged, and its migrations are idempotent.

## Progress log
_(appended per phase)_
