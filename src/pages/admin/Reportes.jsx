import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import './Reportes.css';

const Reportes = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumenGeneral, setResumenGeneral] = useState({
    totalPrestado: 0,
    interesesGenerados: 0,
    prestamosActivos: 0,
    prestamosPagados: 0,
    prestamosVencidos: 0,
    montoRecuperado: 0,
    montoPendiente: 0
  });
  const [prestamosData, setPrestamosData] = useState([]);
  const [pagosData, setPagosData] = useState([]);
  const [deudoresTop, setDeudoresTop] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const prestamosRef = collection(db, 'prestamos');
      const prestamosQuery = query(prestamosRef, where('userId', '==', currentUser.uid));
      const prestamosSnapshot = await getDocs(prestamosQuery);

      const pagosRef = collection(db, 'pagos');
      const pagosQuery = query(pagosRef, where('userId', '==', currentUser.uid));
      const pagosSnapshot = await getDocs(pagosQuery);

      // Procesar datos para el resumen general
      let totalPrestado = 0;
      let interesesGenerados = 0;
      let prestamosActivos = 0;
      let prestamosPagados = 0;
      let prestamosVencidos = 0;
      let montoRecuperado = 0;
      let montoPendiente = 0;

      const prestamosPorMes = {};
      const pagosPorMes = {};
      const deudoresStats = {};

      prestamosSnapshot.docs.forEach(doc => {
        const prestamo = doc.data();
        totalPrestado += prestamo.monto;
        interesesGenerados += prestamo.montoPagar - prestamo.monto;

        const fechaPrestamo = new Date(prestamo.fechaInicio);
        const mes = fechaPrestamo.toLocaleString('default', { month: 'long' });
        
        prestamosPorMes[mes] = prestamosPorMes[mes] || { prestamos: 0, monto: 0 };
        prestamosPorMes[mes].prestamos++;
        prestamosPorMes[mes].monto += prestamo.monto;

        if (prestamo.pagado) {
          prestamosPagados++;
        } else {
          const fechaVencimiento = new Date(prestamo.fechaVencimiento);
          if (fechaVencimiento < new Date()) {
            prestamosVencidos++;
          } else {
            prestamosActivos++;
          }
          montoPendiente += prestamo.montoPagar - (prestamo.totalPagado || 0);
        }

        // Estadísticas por deudor
        const deudorId = prestamo.deudorRef.id;
        if (!deudoresStats[deudorId]) {
          deudoresStats[deudorId] = {
            nombre: '',
            totalPrestamos: 0,
            montoTotal: 0
          };
        }
        deudoresStats[deudorId].totalPrestamos++;
        deudoresStats[deudorId].montoTotal += prestamo.monto;
      });

      pagosSnapshot.docs.forEach(doc => {
        const pago = doc.data();
        montoRecuperado += pago.monto;

        const fechaPago = new Date(pago.fecha);
        const mes = fechaPago.toLocaleString('default', { month: 'long' });
        
        pagosPorMes[mes] = pagosPorMes[mes] || { pagos: 0, monto: 0 };
        pagosPorMes[mes].pagos++;
        pagosPorMes[mes].monto += pago.monto;
      });

      // Convertir datos para los gráficos
      const prestamosDataArray = Object.entries(prestamosPorMes).map(([mes, data]) => ({
        mes,
        prestamos: data.prestamos,
        monto: data.monto
      }));

      const pagosDataArray = Object.entries(pagosPorMes).map(([mes, data]) => ({
        mes,
        pagos: data.pagos,
        monto: data.monto
      }));

      // Actualizar el estado
      setResumenGeneral({
        totalPrestado,
        interesesGenerados,
        prestamosActivos,
        prestamosPagados,
        prestamosVencidos,
        montoRecuperado,
        montoPendiente
      });

      setPrestamosData(prestamosDataArray);
      setPagosData(pagosDataArray);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los reportes');
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

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Prestado</h3>
          <p className="stat-value">
            ${resumenGeneral.totalPrestado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Intereses Generados</h3>
          <p className="stat-value">
            ${resumenGeneral.interesesGenerados.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="stat-card">
          <h3>Monto Recuperado</h3>
          <p className="stat-value success">
            ${resumenGeneral.montoRecuperado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="stat-card">
          <h3>Monto Pendiente</h3>
          <p className="stat-value warning">
            ${resumenGeneral.montoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Estado de Préstamos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Activos', value: resumenGeneral.prestamosActivos },
                  { name: 'Pagados', value: resumenGeneral.prestamosPagados },
                  { name: 'Vencidos', value: resumenGeneral.prestamosVencidos }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {[0, 1, 2].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Préstamos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prestamosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="monto" name="Monto Prestado" fill="#FFD700" />
              <Bar dataKey="prestamos" name="Cantidad" fill="#FF0000" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Pagos por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pagosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="monto" name="Monto Pagado" stroke="#00C49F" />
              <Line type="monotone" dataKey="pagos" name="Cantidad" stroke="#0088FE" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reportes;