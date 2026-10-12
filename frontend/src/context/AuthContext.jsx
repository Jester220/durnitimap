import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!getToken());


  useEffect(() => {
    if (!getToken()) return;
    apiFetch("/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const data = await apiFetch("/auth/register", { method: "POST", body: { name, email, password } });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}