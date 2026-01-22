import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const token = localStorage.getItem('token');
        const userDataRaw = localStorage.getItem('user');

        if (token && userDataRaw) {
          const user = JSON.parse(userDataRaw);
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    cargarSesion();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
