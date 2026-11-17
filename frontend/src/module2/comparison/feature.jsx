import ComparisonPage from "./ComparisonPage";
import ComparisonDetail from "./ComparisonDetail";

// Owner: Nahid (M2-FR1)
export default {
  routes: [
    { path: "/compare", element: <ComparisonPage /> },
    { path: "/compare/:serviceId", element: <ComparisonDetail /> },
  ],
  nav: [{ to: "/compare", label: "Compare" }],
};
