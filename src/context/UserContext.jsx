import { createContext, useState, useCallback } from "react";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("gradeops_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("gradeops_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("gradeops_user");
  }, []);

  const authHeader = user?.token
    ? { Authorization: `Bearer ${user.token}` }
    : {};

  return (
    <UserContext.Provider value={{ user, login, logout, authHeader }}>
      {children}
    </UserContext.Provider>
  );
}