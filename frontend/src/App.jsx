import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Offices from "./pages/Offices";
import OfficeDetail from "./pages/OfficeDetail";
import NewReport from "./pages/NewReport";
import MyReports from "./pages/MyReports";
import AdminOffices from "./pages/AdminOffices";
import AdminOfficeForm from "./pages/AdminOfficeForm";
import AdminOfficeDetail from "./pages/AdminOfficeDetail";
import AdminServiceForm from "./pages/AdminServiceForm";
import NotFound from "./pages/NotFound";

const admin = (page) => <ProtectedRoute role="admin">{page}</ProtectedRoute>;

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
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={admin(<AdminOffices />)} />
        <Route path="/admin/offices/new" element={admin(<AdminOfficeForm />)} />
        <Route path="/admin/offices/:id" element={admin(<AdminOfficeDetail />)} />
        <Route path="/admin/offices/:id/edit" element={admin(<AdminOfficeForm />)} />
        <Route path="/admin/offices/:officeId/services/new" element={admin(<AdminServiceForm />)} />
        <Route path="/admin/offices/:officeId/services/:serviceId/edit" element={admin(<AdminServiceForm />)} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}