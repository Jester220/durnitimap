import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!EMAIL_PATTERN.test(form.email.trim())) e.email = "Enter a valid email address";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const field = (name, label, type = "text") => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" value={form[name]} onChange={change} />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h1 className="font-display text-2xl font-bold text-forest">Create account</h1>
        <p className="text-sm text-stone-700">
          Your name and email are never shown publicly on your reports.
        </p>
        {error && <div className="alert-error">{error}</div>}

        {field("name", "Name")}
        {field("email", "Email", "email")}
        {field("password", "Password (8+ characters)", "password")}
        {field("confirm", "Confirm password", "password")}

        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Creating..." : "Register"}
        </button>
        <p className="text-sm">
          Already registered? <Link to="/login" className="font-semibold text-signal underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}