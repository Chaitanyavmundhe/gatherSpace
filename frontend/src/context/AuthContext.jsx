import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check logged in user on page refresh
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
    return res.data;
  };

  const register = async (userData) => {
    const res = await API.post("/auth/register", userData);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
