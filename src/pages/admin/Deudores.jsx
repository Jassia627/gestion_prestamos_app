import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import DeudorDetalle from '../../components/common/DeudorDetalle';
import './Deudores.css';

const Deudores = () => {
  const { currentUser } = useAuth();
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    email: '',
    referencia: '',
    telefonoReferencia: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDeudores();
  }, [currentUser]);

  const fetchDeudores = async () => {
    try {
      setLoading(true);
      const deudoresRef = collection(db, 'deudores');
      const q = query(deudoresRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const deudoresData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setDeudores(deudoresData);
    } catch (error) {
      console.error('Error al cargar deudores:', error);
      setError('Error al cargar los deudores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        const deudorRef = doc(db, 'deudores', editingId);
        await updateDoc(deudorRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'deudores'), {
          ...formData,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
          status: 'activo'
        });
      }

      setFormData({
        nombre: '',
        telefono: '',
        direccion: '',
        email: '',
        referencia: '',
        telefonoReferencia: ''
      });
      setEditingId(null);
      fetchDeudores();
    } catch (error) {
      console.error('Error al guardar deudor:', error);
      setError('Error al guardar el deudor');
    }
  };

  const handleEdit = (deudor) => {
    setFormData({
      nombre: deudor.nombre,
      telefono: deudor.telefono,
      direccion: deudor.direccion,
      email: deudor.email,
      referencia: deudor.referencia || '',
      telefonoReferencia: deudor.telefonoReferencia || ''
    });
    setEditingId(deudor.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este deudor?')) {
      try {
        await deleteDoc(doc(db, 'deudores', id));
        fetchDeudores();
      } catch (error) {
        console.error('Error al eliminar deudor:', error);
        setError('Error al eliminar el deudor');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredDeudores = deudores.filter(deudor => 
    deudor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deudor.telefono.includes(searchTerm) ||
    deudor.email.toLowerCase().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="deudores-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deudores-container">
      <div className="page-header">
        <h1 className="page-title">Gestión de Deudores</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-container">
        <h2 className="section-title">
          {editingId ? 'Editar Deudor' : 'Nuevo Deudor'}
        </h2>
        <form onSubmit={handleSubmit} className="deudor-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Nombre completo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Número de teléfono"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Correo electrónico"
              />
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Dirección completa"
              />
            </div>

            <div className="form-group">
              <label htmlFor="referencia">Referencia</label>
              <input
                type="text"
                id="referencia"
                name="referencia"
                value={formData.referencia}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Nombre de referencia"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefonoReferencia">Teléfono de Referencia</label>
              <input
                type="tel"
                id="telefonoReferencia"
                name="telefonoReferencia"
                value={formData.telefonoReferencia}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Teléfono de referencia"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {editingId ? 'Actualizar Deudor' : 'Crear Deudor'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    nombre: '',
                    telefono: '',
                    direccion: '',
                    email: '',
                    referencia: '',
                    telefonoReferencia: ''
                  });
                }}
                className="btn-cancel"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="deudores-list">
        <div className="list-header">
          <h2 className="section-title">Lista de Deudores</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar deudor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeudores.map((deudor) => (
                <tr key={deudor.id}>
                  <td data-label="Nombre">{deudor.nombre}</td>
                  <td data-label="Teléfono">{deudor.telefono}</td>
                  <td data-label="Email">{deudor.email}</td>
                  <td data-label="Dirección">{deudor.direccion}</td>
                  <td className="actions" data-label="Acciones">
                    <button
                      onClick={() => setSelectedDeudor(deudor.id)}
                      className="btn-view"
                    >
                      Ver Detalle
                    </button>
                    <button
                      onClick={() => handleEdit(deudor)}
                      className="btn-edit"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(deudor.id)}
                      className="btn-delete"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDeudor && (
        <DeudorDetalle
          deudorId={selectedDeudor}
          onClose={() => setSelectedDeudor(null)}
        />
      )}
    </div>
  );
};

export default Deudores;