import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import Login from "./Views/login";
import Dashboard from "./Views/dashboard";
import AdminNavigator from "./Views/admin/AdminNavigator";
import DuenoNavigator from "./Views/dueno/DuenoNavigator";
import VentasNavigator from "./Views/ventas/VentasNavigator";
import InventarioNavigator from "./Views/inventario/InventarioNavigator";
import ComprasNavigator from "./Views/compras/ComprasNavigator";
import "./App.css";

// Componente para proteger rutas
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard de selección */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Rutas de Admin */}
            <Route
              path="/admin/*"
              element={
                <PrivateRoute>
                  <AdminNavigator />
                </PrivateRoute>
              }
            />

            {/* Rutas de Dueño */}
            <Route
              path="/dueno/*"
              element={
                <PrivateRoute>
                  <DuenoNavigator />
                </PrivateRoute>
              }
            />

            {/* Rutas de Ventas */}
            <Route
              path="/ventas/*"
              element={
                <PrivateRoute>
                  <VentasNavigator />
                </PrivateRoute>
              }
            />

            {/* Rutas de Inventario */}
            <Route
              path="/inventario/*"
              element={
                <PrivateRoute>
                  <InventarioNavigator />
                </PrivateRoute>
              }
            />

            {/* Rutas de Compras */}
            <Route
              path="/compras/*"
              element={
                <PrivateRoute>
                  <ComprasNavigator />
                </PrivateRoute>
              }
            />

            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
