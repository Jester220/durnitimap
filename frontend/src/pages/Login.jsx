import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Enter your email and password");
      return;
    }
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h1 className="font-display text-2xl font-bold text-forest">Log in</h1>
        {error && <div className="alert-error">{error}</div>}

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" value={form.email} onChange={change} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" value={form.password} onChange={change} />
        </div>

        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
        <p className="text-sm">
          No account? <Link to="/register" className="font-semibold text-signal underline">Register</Link>
        </p>
      </form>
    </div>
  );
}