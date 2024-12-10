import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import './DeudorDetalle.css';

const DeudorDetalle = ({ deudorId, onClose }) => {
  const { currentUser } = useAuth();
  const [deudor, setDeudor] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    totalPrestado: 0,
    totalPendiente: 0,
    prestamosActivos: 0,
    prestamosPagados: 0
  });

  useEffect(() => {
    if (deudorId) {
      cargarDatosDeudor();
    }
  }, [deudorId]);

  const cargarDatosDeudor = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar datos del deudor
      const deudorRef = doc(db, 'deudores', deudorId);
      const deudorDoc = await getDoc(deudorRef);

      if (!deudorDoc.exists()) {
        throw new Error('Deudor no encontrado');
      }

      setDeudor({ id: deudorDoc.id, ...deudorDoc.data() });

      // Cargar préstamos del deudor
      const prestamosRef = collection(db, 'prestamos');
      const prestamosQuery = query(
        prestamosRef,
        where('deudorRef', '==', deudorRef)
      );

      const prestamosSnapshot = await getDocs(prestamosQuery);
      const prestamosData = [];
      let totalPrestado = 0;
      let totalPendiente = 0;
      let prestamosActivos = 0;
      let prestamosPagados = 0;

      // Obtener pagos para cada préstamo
      for (const doc of prestamosSnapshot.docs) {
        const prestamo = { id: doc.id, ...doc.data() };
        
        // Obtener pagos del préstamo
        const pagosRef = collection(db, 'pagos');
        const pagosQuery = query(pagosRef, where('prestamoId', '==', doc.id));
        const pagosSnapshot = await getDocs(pagosQuery);
        
        const totalPagado = pagosSnapshot.docs.reduce(
          (sum, pagoDoc) => sum + pagoDoc.data().monto,
          0
        );

        const prestamoConPagos = {
          ...prestamo,
          totalPagado,
          saldoPendiente: prestamo.montoPagar - totalPagado
        };

        prestamosData.push(prestamoConPagos);
        
        // Calcular estadísticas
        totalPrestado += prestamo.monto;
        totalPendiente += prestamoConPagos.saldoPendiente;
        if (prestamo.pagado) {
          prestamosPagados++;
        } else {
          prestamosActivos++;
        }
      }

      setPrestamos(prestamosData.sort((a, b) => 
        new Date(b.fechaInicio) - new Date(a.fechaInicio)
      ));

      setEstadisticas({
        totalPrestado,
        totalPendiente,
        prestamosActivos,
        prestamosPagados
      });

    } catch (error) {
      console.error('Error al cargar datos del deudor:', error);
      setError('Error al cargar los datos del deudor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!deudor) {
    return <div className="error-message">No se encontró el deudor</div>;
  }

  return (
    <div className="deudor-detalle-modal">
      <div className="deudor-detalle-content">
        <button className="btn-close" onClick={onClose}>&times;</button>
        
        <div className="deudor-info">
          <h2>Información del Deudor</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Nombre:</label>
              <p>{deudor.nombre}</p>
            </div>
            <div className="info-item">
              <label>Teléfono:</label>
              <p>{deudor.telefono}</p>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <p>{deudor.email}</p>
            </div>
            <div className="info-item">
              <label>Dirección:</label>
              <p>{deudor.direccion}</p>
            </div>
          </div>
        </div>

        <div className="estadisticas-container">
          <h3>Estadísticas</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Prestado</h4>
              <p>${estadisticas.totalPrestado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="stat-card">
              <h4>Total Pendiente</h4>
              <p>${estadisticas.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="stat-card">
              <h4>Préstamos Activos</h4>
              <p>{estadisticas.prestamosActivos}</p>
            </div>
            <div className="stat-card">
              <h4>Préstamos Pagados</h4>
              <p>{estadisticas.prestamosPagados}</p>
            </div>
          </div>
        </div>

        <div className="prestamos-container">
          <h3>Historial de Préstamos</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Interés</th>
                  <th>Total a Pagar</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map((prestamo) => (
                  <tr key={prestamo.id}>
                    <td>{new Date(prestamo.fechaInicio).toLocaleDateString()}</td>
                    <td>${prestamo.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>{prestamo.interes}%</td>
                    <td>${prestamo.montoPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>${prestamo.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>${prestamo.saldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`estado ${prestamo.pagado ? 'pagado' : 'pendiente'}`}>
                        {prestamo.pagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeudorDetalle;