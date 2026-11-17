// Module 2 loader. Every folder with a feature.jsx is picked up automatically,
// so each team member adds a NEW folder and never edits App.jsx or Navbar.jsx:
//   map/          Mahi  (FR3)       /map
//   comparison/   Nahid (FR1)
//   transparency/ Nahid (FR4)
//   analysis/     Saif  (FR2)
// feature.jsx default export: { routes: [{ path, element, requires? }], nav: [{ to, label, requires? }] }
// requires: "user" (logged in) or "admin".
import { Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

const found = import.meta.glob("./*/feature.jsx", { eager: true });
const features = Object.values(found).map((m) => m.default).filter(Boolean);

export const module2NavLinks = features.flatMap((f) => f.nav ?? []);

export const module2Routes = features
  .flatMap((f) => f.routes ?? [])
  .map((r) => {
    const element = r.requires ? (
      <ProtectedRoute role={r.requires === "admin" ? "admin" : undefined}>{r.element}</ProtectedRoute>
    ) : (
      r.element
    );
    return <Route key={r.path} path={r.path} element={element} />;
  });
