import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `px-1 py-1 font-semibold border-b-2 ${
    isActive ? "border-signal" : "border-transparent hover:border-ochre"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="bg-paper border-b-4 border-forest">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-baseline">
          <span className="font-display text-2xl font-bold text-forest">Durniti</span>
          <span className="font-display text-2xl font-bold text-signal">Map</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <NavLink to="/offices" className={linkClass}>Offices</NavLink>
          {user && <NavLink to="/report/new" className={linkClass}>Submit Report</NavLink>}
          {user && <NavLink to="/my-reports" className={linkClass}>My Reports</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}

          {user ? (
            <>
              <span className="hidden sm:inline text-stone-600">Hi, {user.name}</span>
              <button onClick={handleLogout} className="btn btn-light btn-sm">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-light btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}