import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc,
  doc, 
  getDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import './Pagos.css';
import Pagos from "../../components/common/pagos";


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
    fetchPrestamoYPagos();
  }, [prestamoId]);

  const fetchPrestamoYPagos = async () => {
    try {
      // Obtener datos del préstamo
      const prestamoDoc = await getDoc(doc(db, 'prestamos', prestamoId));
      if (prestamoDoc.exists()) {
        const prestamoData = prestamoDoc.data();
        // Obtener datos del deudor
        const deudorDoc = await getDoc(prestamoData.deudorRef);
        setPrestamo({
          id: prestamoDoc.id,
          ...prestamoData,
          deudor: deudorDoc.data()
        });

        // Obtener pagos
        const pagosRef = collection(db, 'pagos');
        const pagosQuery = query(
          pagosRef,
          where('prestamoId', '==', prestamoId),
          orderBy('fecha', 'desc')
        );
        const pagosSnapshot = await getDocs(pagosQuery);
        const pagosData = pagosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPagos(pagosData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del préstamo');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularTotalPagado = () => {
    return pagos.reduce((total, pago) => total + pago.monto, 0);
  };

  const calcularSaldoPendiente = () => {
    if (!prestamo) return 0;
    return prestamo.montoPagar - calcularTotalPagado();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const monto = parseFloat(formData.monto);
      const saldoPendiente = calcularSaldoPendiente();

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
    return <div className="error">Préstamo no encontrado</div>;
  }

  return (
    <div className="pagos-modal">
      <div className="pagos-content">
        <h2>Registrar Pago</h2>
        <button className="btn-close" onClick={onClose}>&times;</button>

        <div className="prestamo-info">
          <p><strong>Deudor:</strong> {prestamo.deudor.nombre}</p>
          <p><strong>Monto Total:</strong> ${prestamo.montoPagar.toFixed(2)}</p>
          <p><strong>Total Pagado:</strong> ${calcularTotalPagado().toFixed(2)}</p>
          <p><strong>Saldo Pendiente:</strong> ${calcularSaldoPendiente().toFixed(2)}</p>
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
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
                    <td>${pago.monto.toFixed(2)}</td>
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