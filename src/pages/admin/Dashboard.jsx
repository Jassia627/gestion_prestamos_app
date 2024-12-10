import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPrestamos: 0,
    prestamosActivos: 0,
    prestamosVencidos: 0,
    totalDeudores: 0,
    montoTotalPrestado: 0,
    montoPendiente: 0,
    montoRecibido: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const prestamosRef = collection(db, 'prestamos');
      const prestamosQuery = query(prestamosRef, where('userId', '==', currentUser.uid));
      const prestamosSnapshot = await getDocs(prestamosQuery);

      const deudoresRef = collection(db, 'deudores');
      const deudoresQuery = query(deudoresRef, where('userId', '==', currentUser.uid));
      const deudoresSnapshot = await getDocs(deudoresQuery);

      let totalPrestado = 0;
      let montoPendiente = 0;
      let montoRecibido = 0;
      let activos = 0;
      let vencidos = 0;

      // Calcular estadísticas de préstamos
      prestamosSnapshot.docs.forEach(doc => {
        const prestamo = doc.data();
        totalPrestado += prestamo.monto;
        
        if (!prestamo.pagado) {
          const fechaVencimiento = new Date(prestamo.fechaVencimiento);
          if (fechaVencimiento < new Date()) {
            vencidos++;
          } else {
            activos++;
          }
          montoPendiente += prestamo.montoPagar - (prestamo.totalPagado || 0);
        } else {
          montoRecibido += prestamo.totalPagado || prestamo.montoPagar;
        }
      });

      setStats({
        totalPrestamos: prestamosSnapshot.size,
        prestamosActivos: activos,
        prestamosVencidos: vencidos,
        totalDeudores: deudoresSnapshot.size,
        montoTotalPrestado: totalPrestado,
        montoPendiente,
        montoRecibido
      });

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3>Total Préstamos</h3>
            <span className="stat-icon">📊</span>
          </div>
          <p className="stat-value">{stats.totalPrestamos}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Préstamos Activos</h3>
            <span className="stat-icon">✅</span>
          </div>
          <p className="stat-value">{stats.prestamosActivos}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Préstamos Vencidos</h3>
            <span className="stat-icon">⚠️</span>
          </div>
          <p className="stat-value warning">{stats.prestamosVencidos}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Total Deudores</h3>
            <span className="stat-icon">👥</span>
          </div>
          <p className="stat-value">{stats.totalDeudores}</p>
        </div>
      </div>

      <div className="financial-stats-grid">
        <div className="stat-card highlight">
          <div className="stat-header">
            <h3>Monto Total Prestado</h3>
            <span className="stat-icon">💰</span>
          </div>
          <p className="stat-value">
            ${stats.montoTotalPrestado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="stat-card highlight">
          <div className="stat-header">
            <h3>Monto Pendiente</h3>
            <span className="stat-icon">⏳</span>
          </div>
          <p className="stat-value warning">
            ${stats.montoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="stat-card highlight">
          <div className="stat-header">
            <h3>Monto Recibido</h3>
            <span className="stat-icon">✨</span>
          </div>
          <p className="stat-value success">
            ${stats.montoRecibido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;