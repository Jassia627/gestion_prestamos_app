import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Importación de páginas
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/admin/Dashboard';
import Prestamos from '../pages/admin/Prestamos';
import Deudores from '../pages/admin/Deudores';
import Reportes from '../pages/admin/Reportes';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/prestamos" element={
        <ProtectedRoute>
          <Prestamos />
        </ProtectedRoute>
      } />

      <Route path="/deudores" element={
        <ProtectedRoute>
          <Deudores />
        </ProtectedRoute>
      } />

      <Route path="/reportes" element={
        <ProtectedRoute>
          <Reportes />
        </ProtectedRoute>
      } />

      {/* Ruta para páginas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;