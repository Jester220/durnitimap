# Module 2 - team boundaries

Each feature lives in its **own folders**. Nobody edits another person's folder or the shared loaders,
so pull requests do not conflict.

| Feature | Owner | Backend folder (`backend/src/module2/`) | Frontend folder (`frontend/src/module2/`) | Migration prefix (`database/migrations/`) |
|---|---|---|---|---|
| FR3 Interactive map | **Mahi** (done) | `map/` | `map/` | `m2_map_` |
| FR1 Fee / time comparison | **Nahid** | `comparison/` | `comparison/` | `m2_comparison_` |
| FR4 Transparency Indicator | **Nahid** | `transparency/` | `transparency/` | `m2_transparency_` |
| FR2 Expense / waiting / repeat-visit analysis | **Saif** | `analysis/` | `analysis/` | `m2_analysis_` |

## Shared files (already in the repo, do not edit)
- `backend/src/module2/index.js` - mounts every `<folder>/index.js` automatically under `/api`.
- `backend/src/module2/constants.js` - `MIN_APPROVED_REPORTS` (3) and `REPORT_STATUS_PUBLIC` ("Approved").
- `frontend/src/module2/index.jsx` - registers every `<folder>/feature.jsx` (routes + navbar links) automatically.
- `backend/src/module2/utils.js` and `frontend/src/module2/format.js` - small shared helpers.
- `backend/scripts/migrate.js` - applies new `database/migrations/*.sql` files once (`npm run migrate`).

## How to add your feature
**Backend** - create `backend/src/module2/<folder>/index.js`:
```js
const express = require("express");
const router = express.Router();
router.get("/something", handler);          // handler uses: require("../../config/db")
module.exports = { mountPath: "/comparison", router };   // -> GET /api/comparison/something
```
**Frontend** - create `frontend/src/module2/<folder>/feature.jsx`:
```jsx
import ComparisonPage from "./ComparisonPage";
export default {
  routes: [{ path: "/compare", element: <ComparisonPage /> }],   // add requires: "user" | "admin" if needed
  nav: [{ to: "/compare", label: "Compare" }],
};
```
**Database** - add a new file such as `database/migrations/m2_transparency_001_scores.sql`, then run `npm run migrate`
in `backend`. Never edit `schema.sql` or another person's migration.

## Rules all three follow
- Public statistics use only reports with `status = 'Approved'` and show averages only when the count is at least `MIN_APPROVED_REPORTS`.
- Never return `reports.user_id`, names or e-mails in a public response.
- Reuse `apiFetch`, `useAuth`, `ProtectedRoute` and the existing CSS classes (`card`, `btn`, `input`, `badge-official`, `badge-reported`).
- Money is BDT; official data comes from `service_info`, reported data from `reports`.

## How the features connect
The map popup shows Nahid's Transparency Indicator automatically when `backend/src/module2/transparency/`
is installed (optional hook in `map.controller.js`; nothing breaks if it is missing).

## Git (Nahid and Saif, from their own PC and GitHub account)
```powershell
git checkout dev
git pull origin dev
git checkout -b feature/m2-comparison-transparency      # Saif: feature/m2-analysis
# work only inside your own folders, then:
git status
git add backend/src/module2/<your-folders> frontend/src/module2/<your-folders> database/migrations/<your-files>
git commit -m "feat: <what you built>"
git push -u origin feature/m2-comparison-transparency
```
Open a Pull Request into `dev` on GitHub. After merging anyone's migration, run `npm run migrate` in `backend`.
