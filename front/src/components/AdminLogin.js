import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css'; // Importar estilos

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Realizar la solicitud al backend
      const response = await axios.post('http://localhost:5000/admin/login', {
        email,
        password,
      });

      // Guardar el token en localStorage
      localStorage.setItem('token', response.data.token);

      // Redirigir al panel de administración
      navigate('/admin');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      // Manejo más detallado de errores
      if (err.response && err.response.status === 401) {
        setError('Credenciales inválidas');
      } else {
        setError('Error al iniciar sesión. Inténtalo nuevamente.');
      }
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Inicio de Sesión</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="login-button">Ingresar</button>
      </form>
      {error && <p className="login-error">{error}</p>}
    </div>
  );
};

export default AdminLogin;
