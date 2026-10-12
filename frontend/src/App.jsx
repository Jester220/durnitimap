import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Offices from "./pages/Offices";
import OfficeDetail from "./pages/OfficeDetail";
import NewReport from "./pages/NewReport";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/offices" element={<Offices />} />
        <Route path="/offices/:id" element={<OfficeDetail />} />
        <Route
          path="/report/new"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
          }
        />

        {/* NAHID: add "My Reports" routes here */}
        {/* SAIF: add admin routes here */}

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}