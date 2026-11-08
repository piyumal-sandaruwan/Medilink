import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medilink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [doctor, setDoctor] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('medilink_token'));
  const [loading, setLoading] = useState(true);

  // Fetch full /auth/me profile
  const fetchMe = useCallback(async () => {
    const currentToken = localStorage.getItem('medilink_token');
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setDoctor(res.data.doctor || null);
        setHospital(res.data.hospital || null);
        localStorage.setItem('medilink_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Failed refreshing current user session:', err.message);
      // If unauthorized, token is automatically cleared by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();

    // Listen for custom logout events dispatched by api interceptor
    const handleRemoteLogout = () => {
      setUser(null);
      setDoctor(null);
      setHospital(null);
      setToken(null);
    };

    window.addEventListener('medilink-auth-logout', handleRemoteLogout);
    return () => {
      window.removeEventListener('medilink-auth-logout', handleRemoteLogout);
    };
  }, [fetchMe]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { token: newToken, user: newUser, doctor: newDoctor, hospital: newHospital } = res.data;
      localStorage.setItem('medilink_token', newToken);
      localStorage.setItem('medilink_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setDoctor(newDoctor || null);
      setHospital(newHospital || null);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const registerPatient = async (payload) => {
    const res = await api.post('/auth/register', payload);
    if (res.success && res.data) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('medilink_token', newToken);
      localStorage.setItem('medilink_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setDoctor(null);
      setHospital(null);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const registerDoctor = async (payload) => {
    const res = await api.post('/auth/register-doctor', payload);
    if (res.success && res.data) {
      const { token: newToken, user: newUser, doctor: newDoctor } = res.data;
      localStorage.setItem('medilink_token', newToken);
      localStorage.setItem('medilink_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setDoctor(newDoctor || null);
      setHospital(null);
      return res;
    }
    throw new Error(res.message || 'Doctor registration failed');
  };

  const logout = () => {
    localStorage.removeItem('medilink_token');
    localStorage.removeItem('medilink_user');
    setToken(null);
    setUser(null);
    setDoctor(null);
    setHospital(null);
  };

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isHospitalAdmin = user?.role === 'hospital_admin';
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    doctor,
    hospital,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isPatient,
    isDoctor,
    isHospitalAdmin,
    isAdmin,
    login,
    registerPatient,
    registerDoctor,
    logout,
    refreshMe: fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
