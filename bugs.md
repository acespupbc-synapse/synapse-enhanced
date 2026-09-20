# ACES Synapse Enhanced — Bugs & Quality of Life (QoL) Tracking

## Bugs (B1–B8) — Verification & Status

1. **[FIXED] Emergency contact no data validation**
   - **Fix:** Validated on both client and server side. Server enforces length restrictions and Philippine phone regex (`^09\d{9}$` or `^0\d{9,10}$`). Client validates required presence, minimum 10 digits, and formats phone numbers with spaces (`0991 234 5678`).
   - **Files:** `app/schemas/student.py`, `frontend/src/components/views/StudentRegistrationView.jsx`.

2. **[FIXED] Retaking forms photo issue; nagiging black pag niretake**
   - **Fix:** Cleared the video feed cleanly upon re-capture. Canvas draws properly without racing uninitialized video frames or leaving stale black canvases. Added explicit aspect ratio handling and canvas dimensions synchronization.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`, `frontend/src/components/common/MediaModals.jsx`.

3. **[FIXED] Name data fields should not allow special characters (`$`, `%`, `#`, etc.)**
   - **Fix:** Enforced strict regex pattern `^[A-Za-zÑñáéíóúÁÉÍÓÚ .,'-]+$` across `first_name`, `middle_name`, `last_name`, and `contact_person_name`. Real-time sanitize filter strips malicious special characters on input to prevent broken queries and database indexing issues.
   - **Files:** `app/schemas/student.py`, `frontend/src/components/views/StudentRegistrationView.jsx`.

4. **[FIXED] Refreshing the site should keep the previous data (`sessionStorage` persistence)**
   - **Fix:** Integrated comprehensive `sessionStorage` draft persistence (`synapse_registration_draft`) storing active step index, all form fields, and captured photo/signature DataURLs. Automatically restores state on page reload and clears completely upon successful registration submission.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`.

5. **[FIXED] When on mobile, even if registration is closed, users can still access form**
   - **Fix:** Mobile responsive banner and route guards authoritatively block form rendering when registration is closed. Automatically redirects mobile and desktop clients to the "Registration Closed" notice card.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`.

6. **[FIXED] Dashboard > Editing an entry in "Live registration feed" > retaking photo causes it to flip the image**
   - **Fix:** Neutralized unwanted CSS `transform: scaleX(-1)` mirroring on canvas save in the edit modal cropper/camera. Camera mirroring is preserved during live viewfinder display for natural user orientation but un-flipped when rendering to canvas and R2 storage.
   - **Files:** `frontend/src/components/common/MediaModals.jsx`, `frontend/src/components/views/RegistrationsView.jsx`.

7. **[FIXED] Live registration feed preview error: Same name, different student number, causes the same pic**
   - **Fix:** R2 object key generation now appends the first 8 characters of the student UUID (`{media_type}s/{clean_name}__{student_id[:8]}.jpg`), preventing key collisions when students share identical names (e.g. two Juan Dela Cruz students). Presigned URL cache is keyed on full R2 key.
   - **Files:** `app/core/r2_storage.py`, `app/routers/students.py`.

8. **[FIXED] Retaking photos changes the photo size instead of retaining the 1:1 ratio**
   - **Fix:** Locked cropper and camera output to strict 1:1 aspect ratio (1500×1500 px). Validated server-side using Pillow in `app/core/r2_storage.py` and enforced on client-side canvas generation.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`, `frontend/src/components/common/MediaModals.jsx`, `app/core/r2_storage.py`.

---

## Quality of Life (QoL 1–5) — Verification & Status

1. **[FIXED] Student number "-" parts already filled out so users just type numbers (`YYYY-NNNNN-BN-0`)**
   - **Fix:** Real-time auto-dash formatting dynamically inserts hyphens as digits are typed (`YYYY-`, `YYYY-NNNNN-`, `YYYY-NNNNN-BN-`). Backspacing gracefully handles dashes without trapping the user.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`.

2. **[FIXED] Fix alignment and placement of the "Same as student's permanent address" checkbox**
   - **Fix:** Moved the checkbox from an awkward detached full-width row into the Contact Person Complete Address header row using `.sreg-label-with-action` and `.sreg-same-address-toggle`. Aligned cleanly with the label on the right side.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`, `frontend/src/components/views/StudentRegistrationView.css`.

3. **[FIXED] Phone number displayed with spaces (`0991 234 5678`)**
   - **Fix:** Implemented `formatPhoneNumber` which formats Philippine mobile numbers as `09XX XXX XXXX` (4 digits, space, 3 digits, space, 4 digits). Max length 13 chars with spaces. Validation extracts clean digits.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`.

4. **[FIXED] Modal top header background for photo and signature capture should just be white**
   - **Fix:** Set `.sreg-cam-modal-header`, `.sreg-cropper-modal-header`, and `.sreg-sig-modal-header` background to `#FFFFFF !important`, text to `#111827 !important`, sub-spec to `#6B7280 !important`, and border to `#E5E7EB !important` across all modal stylesheets.
   - **Files:** `frontend/src/components/common/MediaModals.css`, `frontend/src/components/views/StudentRegistrationView.css`.

5. **[FIXED] Moving gradient on /register navbar and modern dynamic page background (remove "boring" look)**
   - **Fix:** Added `@keyframes sregNavGradientFlow` with animated multi-stop gradient matching active organization color. Added ambient animated aura mesh background (`.sreg-page::before`, `.sreg-page::after`) with organic floating motion that eliminates the dull flat background.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`, `frontend/src/components/views/StudentRegistrationView.css`.

---

## Settings Audit & Cleanups — Verification & Status

1. **[FIXED] Remove useless "Save Changes" button on Settings tab**
   - **Fix:** Removed the redundant "Save Changes" header button. Registration open/close toggling already auto-saves with password confirmation, and Academic Year changes auto-save upon modal confirmation with toast notification feedback.
   - **Files:** `frontend/src/components/views/SettingsView.jsx`.

2. **[FIXED] Remove placeholder data not connected to anything in Settings**
   - **Fix:** Removed client-only `allowedYearLevels` ("Target Registration Audience") and `adminEmail` ("Admin Notification Email").
   - **Fix:** Transformed "Registration Rules" from fake client-side checkboxes into clean, authoritative "PUP Biñan Campus Student Policies" with green status badges (`Enforced & Auto-Formatted`, `Active in Database`, `System Standard`, `1500×1500 & 2000×1200`) and clear university policy documentation.
   - **Files:** `frontend/src/components/views/SettingsView.jsx`, `frontend/src/components/views/SettingsView.css`.

3. **[FIXED] Accurate Database Records, Media Archives, Supabase DB & Cloudflare R2 Stats**
   - **Fix:** Backend `/api/admin/settings/diagnostics` now queries live Supabase PostgreSQL database size (`pg_database_size`) and live Cloudflare R2 bucket metrics via `boto3` (`list_objects_v2`).
   - **Live Metrics Verified:**
     - Supabase PostgreSQL Storage: `10.81 MB / 500 MB`
     - Cloudflare R2 Storage: `5.98 MB (39 files) / 10 GB`
     - Active Student Records: `19 active (0 in Recycle Bin)`
     - Media Archives: `19 photos, 19 signatures`
     - Database Host: `aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
     - Database Engine: `PostgreSQL 15+ (Supabase Pooler) + SQLAlchemy 2.0 Async`
     - Schema Revision: `001_canonical_postgresql_schema`
     - API Status: `Healthy (Online)`
   - **Files:** `app/routers/settings.py`, `app/core/r2_storage.py`, `frontend/src/components/views/SettingsView.jsx`.

---

## Batch 10 & 11 — Academic Year Scope, Programs & Navigation Fixes

1. **[FIXED] Switching Academic Year does not reflect on Dashboard, Database, and Exports**
   - **Fix:** `get_stats`, `get_full_dashboard`, `get_live_feed` in `app/routers/admin.py`, `list_students` in `app/routers/students.py`, and all export routes in `app/routers/export.py` now strictly filter by `Student.academic_year_id == active_ay.id`. `App.jsx` and `RegistrationsView.jsx` re-render accurately on AY change without preserving stale counts.
   - **Files:** `app/routers/admin.py`, `app/routers/students.py`, `app/routers/export.py`, `frontend/src/App.jsx`, `frontend/src/components/views/RegistrationsView.jsx`.

2. **[FIXED] Section separation per Academic Year (Schema change)**
   - **Fix:** Added `academic_year_id` (UUID foreign key, nullable, indexed) to `sections` table via migration `003_sections_ay`. Backfilled existing sections to default active AY (`2026-2027`). `list_programs` filters sections per active AY, and creating a section automatically associates it with the active AY.
   - **Files:** `alembic/versions/003_sections_academic_year.py`, `app/models/config.py`, `app/routers/programs.py`, `app/routers/students.py`.

3. **[FIXED] Section fallback bug (2-1 showing when no 2-1 in settings)**
   - **Fix:** `availableSections` in `StudentRegistrationView.jsx` now treats the loaded database programs as authoritative. When database programs are loaded, if no sections exist in the database for the selected year level, it returns empty (`[]`) rather than inventing sections via `SECTIONS_BY_YEAR`. Dropdown displays "No sections available".
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`.

4. **[FIXED] Contact person address bug in Admin Edit Portal**
   - **Fix:** In `RegistrationsView.jsx`'s `EditStudentModal`, `formAddress` (residential) and `formContactAddress` (emergency contact) are maintained in independent `useState` hooks with separate input handlers. Editing the residential address no longer alters or syncs to the emergency contact address.
   - **Files:** `frontend/src/components/views/RegistrationsView.jsx`, `frontend/src/components/BentoGrid.jsx`.

5. **[FIXED] Navbar and Page Background Animations in /register**
   - **Fix:** Adjusted navbar gradient speed to a linear, uninterrupted 20s loop (`0% 0%` to `200% 0%`). Used `backgroundImage` instead of `background` shorthand so toggling between Light and Dark mode does not reset or pause the running animation. Enhanced ambient auras (`::before` and `::after`) and `.sreg-page` background shift for noticeable, fluid motion.
   - **Files:** `frontend/src/components/views/StudentRegistrationView.jsx`, `frontend/src/components/views/StudentRegistrationView.css`.

6. **[FIXED] Mobile Admin Navigation & Logout Placement**
   - **Fix:** Replaced hamburger slide-out with a sleek fixed bottom navigation bar (`mobile-bottom-nav`) on mobile viewports (`≤ 1024px`), placing Student Registration in the primary nav tabs. Relocated Logout into the Settings tab with a dedicated sidebar button and an "Admin Session" management card in the Security tab. Added `80px` bottom padding to `.main-wrapper` to prevent content obstruction.
   - **Files:** `frontend/src/components/Sidebar.jsx`, `frontend/src/components/Sidebar.css`, `frontend/src/components/views/SettingsView.jsx`, `frontend/src/components/views/SettingsView.css`, `frontend/src/index.css`, `frontend/src/App.jsx`.

7. **[FIXED] Export Filenames**
   - **Fix:** Exported CSV, MDB, and XLSX files are formatted as `PUP Biñan AY {ay_name}` (e.g. `PUP Biñan AY 2026-2027.csv`), using UTF-8 RFC 5987 header encoding with standard ASCII fallback.
   - **Files:** `app/routers/export.py`.

8. **[FIXED] Dashboard Cloudflare and Supabase Storage Capacity Cards Have Delay**
   - **Root Cause:** `_get_r2_storage_info()` calls boto3's `paginator.paginate()` — a synchronous blocking I/O operation — directly from the async event loop. This stalled the entire `/api/admin/dashboard` response (and `/api/admin/capacity`) for 1–3 seconds whenever the 60-second R2 cache expired, causing a visible delay on the storage capacity cards.
   - **Fix:** Wrapped both calls to `_get_r2_storage_info()` in `await asyncio.to_thread(...)` in both `get_capacity` and `get_full_dashboard`, offloading the blocking boto3 paginator to the thread pool so the event loop remains responsive. Extended R2 cache TTL from 60s to 300s (R2 bucket size changes slowly) to reduce Cloudflare API churn.
   - **Files:** `app/routers/admin.py`.

