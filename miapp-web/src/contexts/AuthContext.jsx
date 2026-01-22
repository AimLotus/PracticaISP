// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    loadSession();
  }, []);

  const signIn = async (email, password) => {
    const response = await axios.post(`${config.API_BASE_URL}/login`, { email, password });

    const { token, user } = response.data;

    setToken(token);
    setUser(user);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const signOut = async () => {
    try {
      if (token) {
        await axios.post(`${config.API_BASE_URL}/logout`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {

    } finally {
      // Limpiar estado
      setToken(null);
      setUser(null);
      
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Forzar recarga de la página para limpiar todos los estados
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
