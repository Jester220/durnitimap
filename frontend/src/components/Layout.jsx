import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="bg-forest text-paper border-t-4 border-ochre">
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm">
          Official information comes from public offices. Reports are personal experiences shared
          by users and are not verified facts.
        </div>
      </footer>
    </div>
  );
}