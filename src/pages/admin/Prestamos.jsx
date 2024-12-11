import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import Pagos from '@/components/common/Pagos';
import './Prestamos.css';




const Prestamos = () => {
  const { currentUser } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [showDesglose, setShowDesglose] = useState(false);
  const [formData, setFormData] = useState({
    deudorId: '',
    monto: '',
    interes: '',
    plazo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    descripcion: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Cargar deudores
      const deudoresRef = collection(db, 'deudores');
      const deudoresQuery = query(deudoresRef, where('userId', '==', currentUser.uid));
      const deudoresSnapshot = await getDocs(deudoresQuery);
      const deudoresData = deudoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeudores(deudoresData);

      // Cargar préstamos
      const prestamosRef = collection(db, 'prestamos');
      const prestamosQuery = query(prestamosRef, where('userId', '==', currentUser.uid));
      const prestamosSnapshot = await getDocs(prestamosQuery);
      const prestamosPromises = prestamosSnapshot.docs.map(async doc => {
        const prestamo = doc.data();
        const deudorDoc = await getDoc(prestamo.deudorRef);
        return {
          id: doc.id,
          ...prestamo,
          deudor: deudorDoc.data()
        };
      });
      const prestamosData = await Promise.all(prestamosPromises);
      setPrestamos(prestamosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular el desglose mensual
  const calcularDesgloseMensual = () => {
    const monto = parseFloat(formData.monto);
    const interes = parseFloat(formData.interes);
    const plazo = parseInt(formData.plazo);
    const meses = Math.ceil(plazo / 30);

    if (!isNaN(monto) && !isNaN(interes) && !isNaN(plazo)) {
      let desglose = [];
      let montoAcumulado = monto;

      for (let i = 1; i <= meses; i++) {
        const interesMes = monto * (interes / 100);
        montoAcumulado += interesMes;
        desglose.push({
          mes: i,
          interesMes,
          montoAcumulado
        });
      }

      return desglose;
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.deudorId || !formData.monto || !formData.interes || !formData.plazo) {
        setError('Todos los campos son obligatorios');
        return;
      }

      const desglose = calcularDesgloseMensual();
      const montoTotal = desglose[desglose.length - 1]?.montoAcumulado || 0;

      const nuevoPrestamo = {
        userId: currentUser.uid,
        deudorRef: doc(db, 'deudores', formData.deudorId),
        monto: parseFloat(formData.monto),
        interes: parseFloat(formData.interes),
        plazo: parseInt(formData.plazo),
        fechaInicio: formData.fechaInicio,
        fechaVencimiento: new Date(formData.fechaInicio).setDate(
          new Date(formData.fechaInicio).getDate() + parseInt(formData.plazo)
        ),
        montoPagar: montoTotal,
        descripcion: formData.descripcion,
        desgloseMensual: desglose,
        estado: 'activo',
        pagado: false,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'prestamos'), nuevoPrestamo);

      setFormData({
        deudorId: '',
        monto: '',
        interes: '',
        plazo: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        descripcion: ''
      });
      setShowDesglose(false);
      fetchData();
    } catch (error) {
      console.error('Error al crear préstamo:', error);
      setError('Error al crear el préstamo');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="prestamos-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  const desgloseMensual = calcularDesgloseMensual();

  return (
    <div className="prestamos-container">
      <div className="page-header">
        <h1 className="page-title">Gestión de Préstamos</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-container">
        <h2 className="section-title">Nuevo Préstamo</h2>
        <form onSubmit={handleSubmit} className="prestamo-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="deudorId">Deudor</label>
              <select
                id="deudorId"
                name="deudorId"
                value={formData.deudorId}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Seleccione un deudor</option>
                {deudores.map(deudor => (
                  <option key={deudor.id} value={deudor.id}>
                    {deudor.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="monto">Monto</label>
              <input
                type="number"
                id="monto"
                name="monto"
                value={formData.monto}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="interes">Interés Mensual (%)</label>
              <input
                type="number"
                id="interes"
                name="interes"
                value={formData.interes}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="plazo">Plazo (días)</label>
              <input
                type="number"
                id="plazo"
                name="plazo"
                value={formData.plazo}
                onChange={handleInputChange}
                required
                min="1"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fechaInicio">Fecha de Inicio</label>
            <input
              type="date"
              id="fechaInicio"
              name="fechaInicio"
              value={formData.fechaInicio}
              onChange={handleInputChange}
              required
              className="form-input"
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
              className="form-textarea"
            ></textarea>
          </div>

          {desgloseMensual.length > 0 && (
            <div className="desglose-section">
              <button
                type="button"
                className="btn-toggle-desglose"
                onClick={() => setShowDesglose(!showDesglose)}
              >
                {showDesglose ? 'Ocultar Desglose' : 'Ver Desglose'}
              </button>

              {showDesglose && (
                <div className="desglose-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Mes</th>
                        <th>Interés</th>
                        <th>Monto Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {desgloseMensual.map((mes) => (
                        <tr key={mes.mes}>
                          <td>Mes {mes.mes}</td>
                          <td>${mes.interesMes.toFixed(2)}</td>
                          <td>${mes.montoAcumulado.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              Crear Préstamo
            </button>
          </div>
        </form>
      </div>

      <div className="prestamos-list">
        <h2 className="section-title">Lista de Préstamos</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Deudor</th>
                <th>Monto</th>
                <th>Interés</th>
                <th>Total a Pagar</th>
                <th>Fecha Inicio</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.map((prestamo) => (
                <tr key={prestamo.id}>
                  <td data-label="Deudor">{prestamo.deudor?.nombre}</td>
                  <td data-label="Monto">
                    ${prestamo.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td data-label="Interés">{prestamo.interes}%</td>
                  <td data-label="Total a Pagar">
                    ${prestamo.montoPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td data-label="Fecha Inicio">
                    {new Date(prestamo.fechaInicio).toLocaleDateString()}
                  </td>
                  <td data-label="Vencimiento">
                    {new Date(prestamo.fechaVencimiento).toLocaleDateString()}
                  </td>
                  <td data-label="Estado">
                    <span className={`estado ${prestamo.pagado ? 'pagado' : 'pendiente'}`}>
                      {prestamo.pagado ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button
                      onClick={() => setSelectedPrestamo(prestamo.id)}
                      className="btn-action"
                    >
                      Registrar Pago
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPrestamo && (
        <Pagos
          prestamoId={selectedPrestamo}
          onClose={() => setSelectedPrestamo(null)}
          onPagoRegistrado={fetchData}
        />
      )}
    </div>
  );
};

export default Prestamos;