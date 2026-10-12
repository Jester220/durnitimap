import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="font-display text-4xl font-bold text-forest">Page not found</h1>
      <p className="mt-2 text-stone-700">This page does not exist or has not been built yet.</p>
      <Link to="/" className="btn btn-primary mt-6">Go home</Link>
    </div>
  );
}