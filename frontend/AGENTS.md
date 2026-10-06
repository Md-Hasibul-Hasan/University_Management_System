<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Key docs for this app (Next 16, App Router):
- `node_modules/next/dist/docs/01-app/01-getting-started/` (layouts-and-pages, server-and-client-components, fetching-data, mutating-data)
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`
<!-- END:nextjs-agent-rules -->

# Frontend — agent guide

Token-efficient map of the Next.js frontend. Read this before exploring the tree; only open a file listed here.

## Stack
| Area | Choice |
|---|---|
| Framework | Next.js 16.2.11 (App Router, `reactCompiler: true`) |
| UI lib | React 19.2.4 |
| State / data | Redux Toolkit 2.12 + RTK Query |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`, CSS-first in `src/app/globals.css`) — NO `tailwind.config.js` |
| Components | shadcn/ui in `src/components/ui/*` |
| Icons / charts / forms | lucide-react · recharts · react-hook-form |
| Alias | `@/*` → `src/*` (jsconfig.json) |

## Commands
- `npm run dev` · `npm run build` · `npm run start` · `npm run lint`
- Env: `NEXT_PUBLIC_API_URL` is the ONLY frontend env var (`.env.local`).

## Repo map
- `src/app/` — routes. Group `(auth)/` (login, registers, verify-email) + `student/` + `teacher/`.
- `src/components/ui/` — shadcn primitives (avatar, badge, button, card, dropdown-menu, input, sheet, sidebar, skeleton, tabs, tooltip, …).
- `src/components/sidebar/` — app shell (app-sidebar, app-header, app-footer, notification-dropdown, theme-provider, EmptyState, …).
- `src/components/table/` — `DataTableToolbar`, `DataTablePagination`, `ExcelExportButton`.
- `src/components/features/` — cross-page features (newsfeed, complain-box, dashboard-calendar).
- `src/components/auth/` — `StoreProvider`, `AuthProvider`, `RouterGuard`.
- `src/redux/features/<domain>/<name>Api.js` — RTK Query slices.
- `src/lib/` — `utils.js` (`cn`), `xlsx.js`, `curve-fit.js`. `src/hooks/`.

## Routing & layouts
- Portal layouts (`src/app/{student,teacher}/layout.jsx`) are client components that (1) build a role-gated `sidebar_section` array and (2) wrap children in `<RouterGuard roles={["student"]}>` / `roles={["teacher"]}`.
- Roles: `Student`; `Teacher`; admin = `role==="Teacher" && is_admin===true`; chairman = `role==="Teacher" && teacher.is_head===true`. Guard accepts `student|teacher|admin|chairman`.
- Auth bootstrap: `AuthProvider` fetches profile with the `accessToken` and dispatches `setUser`; on 401 `baseApi` refreshes then redirects to `/login`.
- Root `app/page.js` renders null (redirect handled by AuthProvider).

## Page convention
- Pages are Client Components: first line `"use client"`, then `export default function Page()`.
- Dynamic segments: `[year-semester]` (slug `1-1`), `[id]`, `[token]`, `[uid]`. Read via `useParams()` / `useSearchParams()`.

## Data layer (RTK Query)
- One slice per resource: `redux/features/<domain>/<name>Api.js` using `baseApi.injectEndpoints(...)`, exporting `use*Query` / `use*Mutation`.
- `redux/baseApi.js` owns the auth header + 401 refresh; `tagTypes` = Auth, Student, Teacher, Course, Notification, Newsfeed, ComplainBox.
- ALWAYS set `providesTags` / `invalidatesTags` so lists refresh after mutations. Store uses `refetchOnMountOrArgChange: true`.
- Store: `redux/store.js` (`makeStore`), wired in `components/auth/StoreProvider.jsx`.

## List-page recipe (reference: `src/app/teacher/course/page.jsx`)
State `search, ordering, page, records` → RTK list query with those params → `<DataTableToolbar …/>` + `<table>` + `<DataTablePagination …/>`. Reuse this shape; do not hand-roll a table or its toolbar.

## `normalizeList` contract
39 files define this exact helper (duplication hot-spot). Unwrap order:
`Array → response.data.results → response.results → response.data.data.results → response.data → []`
Use it for any list response; the API may nest under `data`/`results` in any combination.

## UI & styling
- Compose class names with `cn()` from `@/lib/utils`.
- Status badge recipe: `bg-{color}-500/10 text-{color}-600 dark:text-{color}-300`; destructive = `bg-destructive/10 text-destructive`.
- Dark mode: `ThemeProvider` (class) + `data-theme` color themes; auth routes are forced light.
- Reuse `components/sidebar/EmptyState.jsx` and `components/Loading.jsx` for empty/loading states.

## Backend pointer
`/backend` = Django 6 + DRF. `Management/` is split into `models/ serializers/ services/ views/` (`views/__init__.py` re-exports). Add routes in `Management/urls.py` (`DefaultRouter` for ViewSets, `path()` for other views). The frontend reaches it via `NEXT_PUBLIC_API_URL` + `api/...` paths.

## Do / Don't
- DO keep pages `"use client"`; data flows through RTK Query, not server components.
- DON'T add `tailwind.config.js` (Tailwind v4 is CSS-first).
- DON'T duplicate `normalizeList`, status badges, toolbars, or tables — import the shared pieces.
- DON'T bypass `RouterGuard` when adding a role-gated route.
- DO add a new endpoint to its domain slice and set `invalidatesTags`.

## Task → file index
| Task | Start here |
|---|---|
| Add a list page | `src/app/teacher/course/page.jsx` |
| Add an API slice | `src/redux/features/course/sesion-courseApi.js` + tag in `src/redux/baseApi.js` |
| Add a sidebar link | `src/app/{student,teacher}/layout.jsx` (`sidebar_section`) |
| Add a modal | `src/components/modals/*` |
| Add a UI primitive | `src/components/ui/*` |
| Change the portal shell | `src/components/sidebar/app-sidebar.jsx` |
| Newsfeed (post/like/comment/share) | `src/components/features/newsfeed.jsx` + `src/redux/features/extra/newsfeedApi.js` |
