import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc, 
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import './Pagos.css';

const Pagos = ({ prestamoId, onClose, onPagoRegistrado }) => {
  const { currentUser } = useAuth();
  const [prestamo, setPrestamo] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  });

  useEffect(() => {
    if (prestamoId) {
      fetchPrestamoYPagos();
    }
  }, [prestamoId]);

  const fetchPrestamoYPagos = async () => {
    try {
      setError('');
      // Obtener datos del préstamo
      const prestamoRef = doc(db, 'prestamos', prestamoId);
      const prestamoDoc = await getDoc(prestamoRef);

      if (!prestamoDoc.exists()) {
        throw new Error('Préstamo no encontrado');
      }

      const prestamoData = prestamoDoc.data();
      
      // Obtener datos del deudor
      if (prestamoData.deudorRef) {
        const deudorDoc = await getDoc(prestamoData.deudorRef);
        if (deudorDoc.exists()) {
          setPrestamo({
            id: prestamoDoc.id,
            ...prestamoData,
            deudor: deudorDoc.data()
          });
        }
      }

      // Obtener pagos
      const pagosRef = collection(db, 'pagos');
      const pagosQuery = query(
        pagosRef,
        where('prestamoId', '==', prestamoId)
      );
      
      const pagosSnapshot = await getDocs(pagosQuery);
      // Convertir y ordenar los pagos por fecha descendente
      const pagosData = pagosSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setPagos(pagosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del préstamo');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotalPagado = () => {
    return pagos.reduce((total, pago) => total + Number(pago.monto), 0);
  };

  const calcularSaldoPendiente = () => {
    if (!prestamo) return 0;
    return Number(prestamo.montoPagar) - calcularTotalPagado();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const monto = Number(formData.monto);
      const saldoPendiente = calcularSaldoPendiente();

      if (monto <= 0) {
        setError('El monto debe ser mayor a 0');
        return;
      }

      if (monto > saldoPendiente) {
        setError('El monto del pago no puede ser mayor al saldo pendiente');
        return;
      }

      // Registrar el pago
      const nuevoPago = {
        prestamoId,
        userId: currentUser.uid,
        monto,
        fecha: formData.fecha,
        descripcion: formData.descripcion,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'pagos'), nuevoPago);

      // Actualizar estado del préstamo
      const nuevoTotalPagado = calcularTotalPagado() + monto;
      const prestamoRef = doc(db, 'prestamos', prestamoId);
      await updateDoc(prestamoRef, {
        pagado: nuevoTotalPagado >= prestamo.montoPagar,
        ultimoPago: formData.fecha
      });

      // Limpiar formulario y recargar datos
      setFormData({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: ''
      });
      
      fetchPrestamoYPagos();
      if (onPagoRegistrado) onPagoRegistrado();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      setError('Error al registrar el pago');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!prestamo) {
    return <div className="error-message">No se pudo cargar la información del préstamo</div>;
  }

  return (
    <div className="pagos-modal">
      <div className="pagos-content">
        <h2>Registrar Pago</h2>
        <button className="btn-close" onClick={onClose}>&times;</button>

        <div className="prestamo-info">
          <p><strong>Deudor:</strong> {prestamo.deudor?.nombre || 'No disponible'}</p>
          <p><strong>Monto Total:</strong> ${prestamo.montoPagar?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
          <p><strong>Total Pagado:</strong> ${calcularTotalPagado().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Saldo Pendiente:</strong> ${calcularSaldoPendiente().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="pago-form">
          <div className="form-group">
            <label htmlFor="monto">Monto del Pago</label>
            <input
              type="number"
              id="monto"
              name="monto"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              required
              min="0"
              step="0.01"
              max={calcularSaldoPendiente()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha">Fecha del Pago</label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
            ></textarea>
          </div>

          <button type="submit" className="btn-submit">
            Registrar Pago
          </button>
        </form>

        <div className="pagos-historia">
          <h3>Historial de Pagos</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{new Date(pago.fecha).toLocaleDateString()}</td>
                    <td>${Number(pago.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{pago.descripcion}</td>
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

export default Pagos;