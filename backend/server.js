const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const photoRoutes = require('./routes/photoRoutes');
const { router: userRoutes } = require('./routes/adminRoutes'); // Extraer solo el router

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conexión exitosa a MongoDB Atlas'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Rutas
app.use('/', photoRoutes); // Rutas de fotos
app.use('/admin', userRoutes);   // Rutas de administrador

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));


