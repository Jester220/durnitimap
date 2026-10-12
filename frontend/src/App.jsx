import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* MAHI: office and report pages will be added here */}
        {/* NAHID: add "My Reports" routes here */}
        {/* SAIF: add admin routes here */}

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}