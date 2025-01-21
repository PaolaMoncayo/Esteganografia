const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const ADMIN_EMAIL = 'admin@espe.com';
const ADMIN_PASSWORD = 'espe';
const SECRET_KEY = 'AJPESPE';

// Ruta de inicio de sesión
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validar las credenciales
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Generar un token JWT
        const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
        return res.status(200).json({ token });
    } else {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1]; // Extrae el token después de "Bearer"
    if (!token) {
        return res.status(403).json({ message: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = { router, verifyToken };

///CODIGO CORREGIDO
