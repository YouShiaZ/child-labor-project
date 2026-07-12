# Child Labor Project — Design System (ideas.md)

This is an **internal NGO / sponsorship management system** (admin tool), inspired by the reference
"Dorcas / Salesforce-style" layout the user shared. It is NOT a marketing landing page — it is a
data-management dashboard. Fidelity to a clean, trustworthy, enterprise-grade admin layout OVERRIDES
any decorative "AI slop" guidance.

## Reference Ground Truth (from user screenshots)
- Top navbar: logo (left) + primary nav (Projects / Beneficiaries / Progress Reports / Users) + global search + user menu.
- Project record page: header with title + status path/stages, then **tabs** (Project Details / Beneficiaries / Documents / ...).
- Detail data shown as **field rows / cards** with inline-style display (label + value), edit via forms/dialogs.
- Beneficiary record page: tabs (Beneficiary / Details Entry / Individual Progress Reports / Related) with a **Photo card on the right**.
- Beneficiaries list: sub-tabs (Entry / Priority / Sponsored / Leaving / All) + "New Entry" button + data table.

## Brand Palette (from Life Vision logo — we do NOT reuse their logo)
- **Navy / Primary**: `#1B3A6B` (headers, primary buttons, nav)
- **Green / Accent**: `#3AAA35` (active states, success, highlights, leaf)
- **Neutrals**: white cards on a light gray canvas `#F4F6F9`, borders `#E2E8F0`, text slate `#1E293B` / muted `#64748B`
- Status colors: Good=green, Average=amber `#D97706`, Poor=red `#DC2626`.

## Chosen Approach: "Trusted Field Records"
- **Design Movement**: Clean enterprise SaaS / governmental case-management (think Salesforce Lightning, but warmer).
- **Core Principles**:
  1. Clarity first — dense data must stay scannable (field rows, cards, tables).
  2. Calm authority — navy chrome + generous white cards + soft shadows (no harsh borders everywhere).
  3. Humane warmth — green accents and child/leaf motif remind users these are children, not rows.
  4. Role-aware — Viewers see read-only; Editors see edit/add controls. UI adapts to role.
- **Layout Paradigm**: Persistent top navbar + left context where useful; record pages use a 2-column split (main content + right Photo/summary rail), tabbed sections.
- **Signature Elements**: rounded leaf/shield accent on active tabs; navy gradient page header band; status pills.
- **Typography**: Display/headings = "Poppins" (600/700); body/data = "Inter" (400/500). Headings navy, data slate.
- **Interaction**: snappy ease-out transitions (<200ms), button active scale 0.97, tab underline slide, subtle card hover lift.
- **Brand Essence**: "A protective record system that helps families keep children out of labor and in school." Personality: trustworthy, caring, organized.
- **Wordmark & Logo**: custom mark — navy protective crescent/hand sheltering a green child + leaf sprout. Used in navbar (icon) and login (full lockup).
- **Signature Brand Color**: the Life-Vision green `#3AAA35` as the unmistakable accent over navy.

## Style Decisions
- Everything in English. No Arabic anywhere in the UI.
- Mock data only for the first delivery; real backend wired later per STRUCTURE.md.
- Age auto-computed from Date of Birth.
- Role gating enforced in the frontend (mock auth) and documented for backend.
