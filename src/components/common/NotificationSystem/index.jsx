import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import './NotificationSystem.css';

const NotificationSystem = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkPrestamos();
    }
  }, [currentUser]);

  const checkPrestamos = async () => {
    try {
      const prestamosRef = collection(db, 'prestamos');
      const q = query(prestamosRef, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      
      const nuevasNotificaciones = [];
      const hoy = new Date();
      
      snapshot.docs.forEach(doc => {
        const prestamo = doc.data();
        const fechaVencimiento = new Date(prestamo.fechaVencimiento);
        const diasParaVencimiento = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

        // Verificar préstamos vencidos
        if (!prestamo.pagado && fechaVencimiento < hoy) {
          nuevasNotificaciones.push({
            id: doc.id,
            tipo: 'vencido',
            mensaje: `Préstamo vencido hace ${Math.abs(diasParaVencimiento)} días`,
            deudorId: prestamo.deudorRef.id,
            fechaVencimiento
          });
        }
        // Verificar préstamos próximos a vencer (5 días antes)
        else if (!prestamo.pagado && diasParaVencimiento <= 5 && diasParaVencimiento > 0) {
          nuevasNotificaciones.push({
            id: doc.id,
            tipo: 'proximo',
            mensaje: `Préstamo vence en ${diasParaVencimiento} días`,
            deudorId: prestamo.deudorRef.id,
            fechaVencimiento
          });
        }
      });

      setNotifications(nuevasNotificaciones);
    } catch (error) {
      console.error('Error al verificar préstamos:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-system">
      <button 
        className="notification-trigger"
        onClick={toggleNotifications}
      >
        <span className="notification-count">{notifications.length}</span>
        🔔
      </button>

      {showNotifications && (
        <div className="notification-panel">
          <h3>Notificaciones</h3>
          <div className="notification-list">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`notification-item ${notification.tipo}`}
              >
                <p>{notification.mensaje}</p>
                <small>
                  Vencimiento: {new Date(notification.fechaVencimiento).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;