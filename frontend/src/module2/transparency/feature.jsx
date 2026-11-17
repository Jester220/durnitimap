import TransparencyPage from "./TransparencyPage";
import TransparencyDetail from "./TransparencyDetail";

// Owner: Nahid (M2-FR4)
export default {
  routes: [
    { path: "/transparency", element: <TransparencyPage /> },
    { path: "/transparency/:officeId", element: <TransparencyDetail /> },
  ],
  nav: [{ to: "/transparency", label: "Transparency" }],
};
