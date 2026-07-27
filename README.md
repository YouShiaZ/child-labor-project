# Child Labor Project (CLP)

NGO case-management system for a child-labor prevention program run across two
offices (Cairo + Minya). React + TypeScript + Vite single-page app.

**→ Full engineering handoff, architecture, accounts, deploy & Phase-2 backend
steps: see [`HANDOFF.md`](./HANDOFF.md).**

## Quick start

```bash
rm -rf node_modules      # old install had platform-specific artifacts
npm install
npm run dev              # http://localhost:3000
```

`npm run build` → `dist/public` (static). Deploys on Vercel from `main`
(config in `vercel.json`). Backend design lives in [`supabase/`](./supabase).

Status: **Phase 1** — working front-end, data in `localStorage`, mock auth,
ships with no sample data. **Phase 2** wires Supabase (Postgres + Auth +
Storage); schema and RLS are ready in `supabase/schema.sql`.
