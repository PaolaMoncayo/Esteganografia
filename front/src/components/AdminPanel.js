import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [approvedPhotos, setApprovedPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
    // Configurar actualización automática cada 5 segundos
    const intervalId = setInterval(() => {
      fetchPhotos();
    }, 5000);

    return () => clearInterval(intervalId); // Limpia el intervalo al desmontar
  }, []);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado. Por favor, inicia sesión nuevamente.');
      }

      // Realizar solicitudes paralelas
      const [pendingRes, approvedRes] = await Promise.all([
        axios.get('http://localhost:5000/pending', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5000/approved', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPendingPhotos(pendingRes.data);
      setApprovedPhotos(approvedRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener las fotos:', err);
      setError('Error al obtener las fotos. Asegúrate de que el servidor esté corriendo.');
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado. Por favor, inicia sesión nuevamente.');
      }

      await axios.patch(
        `http://localhost:5000/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchPhotos(); // Actualiza la lista
      setError(`Foto ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      console.error('Error al actualizar el estado de la foto:', err);
      setError('Error al actualizar el estado de la foto. Inténtalo nuevamente.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token no encontrado. Por favor, inicia sesión nuevamente.');
      }

      await axios.delete(`http://localhost:5000/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchPhotos(); // Actualiza la lista
      setError('Foto eliminada exitosamente');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      console.error('Error al eliminar la foto:', err);
      setError('Error al eliminar la foto. Inténtalo nuevamente.');
    }
  };

  if (loading) {
    return <div className="loading">Cargando panel de administración...</div>;
  }

  return (
    <div className="admin-panel-container">
      <h2 className="admin-panel-title">Panel de Administración</h2>
      {error && <p className={`admin-panel-message ${error.includes('Error') ? 'error' : 'success'}`}>{error}</p>}
      
      <section className="pending-section">
        <h3>Fotos Pendientes de Aprobación ({pendingPhotos.length})</h3>
        <div className="photo-grid">
          {pendingPhotos.length > 0 ? (
            pendingPhotos.map((photo) => (
              <div key={photo._id} className="photo-card">
                <img src={photo.url} alt="Foto pendiente" className="photo-image" />
                <div className="photo-info">
                  <p className="upload-date">
                    Subida: {new Date(photo.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="photo-actions">
                  <button 
                    onClick={() => handleApproval(photo._id, 'approved')}
                    className="approve-button">
                    Aprobar
                  </button>
                  <button 
                    onClick={() => handleApproval(photo._id, 'rejected')}
                    className="reject-button">
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-photos-message">No hay fotos pendientes de aprobación</p>
          )}
        </div>
      </section>

      <section className="approved-section">
        <h3>Fotos Aprobadas ({approvedPhotos.length})</h3>
        <div className="photo-grid">
          {approvedPhotos.length > 0 ? (
            approvedPhotos.map((photo) => (
              <div key={photo._id} className="photo-card">
                <img src={photo.url} alt="Foto aprobada" className="photo-image" />
                <div className="photo-info">
                  <p className="approval-date">
                    Aprobada: {new Date(photo.approvedAt).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(photo._id)} 
                  className="delete-button">
                  Eliminar
                </button>
              </div>
            ))
          ) : (
            <p className="no-photos-message">No hay fotos aprobadas</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
