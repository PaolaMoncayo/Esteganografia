import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UploadPhoto.css';

const UploadPhoto = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [approvedPhotos, setApprovedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Nuevo estado para forzar actualización

  // Modificamos useEffect para que dependa de refreshKey
  useEffect(() => {
    fetchApprovedPhotos();
    
    // Configurar intervalo de actualización
    const intervalId = setInterval(() => {
      fetchApprovedPhotos();
    }, 5000); // Actualiza cada 5 segundos

    // Limpieza del intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, [refreshKey]); // Agregamos refreshKey como dependencia

  const fetchApprovedPhotos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/photos/approved');
      setApprovedPhotos(response.data);
      setLoading(false);
    } catch (error) {
      setMessage('Error al cargar la galería de fotos.');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage('Por favor selecciona una imagen.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      await axios.post('http://localhost:5000/api/photos', formData);
      setMessage('Imagen subida exitosamente. Pendiente de aprobación por el administrador.');
      setFile(null);
      setPreview(null);
      setRefreshKey(oldKey => oldKey + 1); // Forzar actualización
      fetchApprovedPhotos(); // Actualizar inmediatamente
    } catch (error) {
      setMessage('Error al subir la imagen.');
    }
  };

  return (
    <div className="upload-container">
      {/* Sección de subida de fotos */}
      <section className="upload-section">
        <h2 className="title">Subir Foto</h2>
        <form onSubmit={handleSubmit} className="upload-form">
          <label className="file-label">
            Seleccionar Imagen
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </label>
          <button type="submit" className="submit-button">Subir</button>
        </form>

        {preview && (
          <div className="preview-container">
            <h3 className="preview-title">Vista Previa:</h3>
            <img src={preview} alt="Vista previa" className="preview-image" />
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </section>

      {/* Sección de galería */}
      <section className="gallery-section">
        <h2 className="gallery-title">Galería de Fotos Aprobadas</h2>
        {loading ? (
          <p>Cargando galería...</p>
        ) : (
          <div className="gallery-grid">
            {approvedPhotos.length > 0 ? (
              approvedPhotos.map((photo) => (
                <div key={photo._id} className="gallery-item">
                  <img 
                    src={photo.url} 
                    alt="Foto aprobada" 
                    className="gallery-image"
                  />
                  <p className="photo-date">
                    Aprobada el: {new Date(photo.approvedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="no-photos-message">
                No hay fotos aprobadas en la galería.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default UploadPhoto;