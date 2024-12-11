import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import './Reportes.css';

const Reportes = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reporteData, setReporteData] = useState({
    resumen: {
      totalPrestado: 0,
      totalRecuperado: 0,
      totalIntereses: 0,
      prestamosActivos: 0,
      prestamosVencidos: 0,
      totalDeudores: 0
    },
    prestamos: [],
    pagos: []
  });

  useEffect(() => {
    fetchReporteData();
  }, [currentUser]);

  const fetchReporteData = async () => {
    try {
      setLoading(true);
      
      // Obtener préstamos
      const prestamosRef = collection(db, 'prestamos');
      const prestamosQuery = query(prestamosRef, where('userId', '==', currentUser.uid));
      const prestamosSnapshot = await getDocs(prestamosQuery);

      // Obtener pagos
      const pagosRef = collection(db, 'pagos');
      const pagosQuery = query(pagosRef, where('userId', '==', currentUser.uid));
      const pagosSnapshot = await getDocs(pagosQuery);

      // Procesar datos
      let totalPrestado = 0;
      let totalRecuperado = 0;
      let totalIntereses = 0;
      let prestamosActivos = 0;
      let prestamosVencidos = 0;
      const prestamos = [];

      prestamosSnapshot.docs.forEach(doc => {
        const prestamo = { id: doc.id, ...doc.data() };
        totalPrestado += prestamo.monto;
        totalIntereses += prestamo.montoPagar - prestamo.monto;

        if (!prestamo.pagado) {
          const fechaVencimiento = new Date(prestamo.fechaVencimiento);
          if (fechaVencimiento < new Date()) {
            prestamosVencidos++;
          } else {
            prestamosActivos++;
          }
        }

        prestamos.push(prestamo);
      });

      const pagos = pagosSnapshot.docs.map(doc => {
        const pago = doc.data();
        totalRecuperado += pago.monto;
        return { id: doc.id, ...pago };
      });

      setReporteData({
        resumen: {
          totalPrestado,
          totalRecuperado,
          totalIntereses,
          prestamosActivos,
          prestamosVencidos,
          totalDeudores: prestamos.length
        },
        prestamos,
        pagos
      });

    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setError('Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="reportes-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reportes-container">
      <div className="page-header">
        <h1 className="page-title">Reportes y Estadísticas</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <h3>Total Prestado</h3>
          <p className="stat-value">
            ${reporteData.resumen.totalPrestado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💹</div>
          <h3>Total Intereses</h3>
          <p className="stat-value">
            ${reporteData.resumen.totalIntereses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <h3>Total Recuperado</h3>
          <p className="stat-value success">
            ${reporteData.resumen.totalRecuperado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="status-cards">
        <div className="status-card">
          <h3>Estado de Préstamos</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Activos</span>
              <span className="status-value">{reporteData.resumen.prestamosActivos}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Vencidos</span>
              <span className="status-value warning">{reporteData.resumen.prestamosVencidos}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <h3>Actividad Reciente</h3>
        <div className="activity-list">
          {reporteData.pagos.slice(0, 5).map(pago => (
            <div key={pago.id} className="activity-item">
              <div className="activity-icon">💸</div>
              <div className="activity-details">
                <p className="activity-description">
                  Pago registrado por ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="activity-date">
                  {new Date(pago.fecha).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reportes;