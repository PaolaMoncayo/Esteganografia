const express = require('express');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { verifyToken } = require('./adminRoutes');
const Photo = require('../models/photo');
const { analyzeWithStegExpose } = require('./imageAnalysis');

const router = express.Router();

// Ruta para la carpeta temporal
const tempDir = path.join(__dirname, '../temp');

// Crear la carpeta temporal si no existe
if (!fs.existsSync(tempDir)) {
    try {
        fs.mkdirSync(tempDir, { recursive: true }); // Crear carpeta recursivamente
        console.log(`Carpeta temporal creada en: ${tempDir}`);
    } catch (error) {
        console.error(`Error al crear la carpeta temporal: ${error.message}`);
    }
}

// Configuración de Multer para subir imágenes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB de límite
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    },
});

// Ruta para obtener todas las fotos aprobadas (pública)
router.get('/approved', async (req, res) => {
    try {
        const photos = await Photo.find({ status: 'approved' }).sort({ approvedAt: -1 });
        res.status(200).json(photos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las imágenes', error });
    }
});

// Ruta para obtener todas las fotos (admin)
router.get('/pending', verifyToken, async (req, res) => {
    try {
        const photos = await Photo.find({ status: 'pending' }).sort({ uploadedAt: -1 });
        res.status(200).json(photos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las imágenes', error });
    }
});

// Ruta para subir una nueva imagen (pública)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ninguna imagen' });
        }

        const url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const newPhoto = new Photo({
            url,
            status: 'pending',
        });
        const savedPhoto = await newPhoto.save();

        res.status(201).json({
            id: savedPhoto._id,
            url: savedPhoto.url,
            status: savedPhoto.status,
            uploadedAt: savedPhoto.uploadedAt,
        });
    } catch (error) {
        res.status(400).json({ message: 'Error al subir la imagen', error });
    }
});

// Ruta para aprobar/rechazar una foto (admin) con análisis integrado
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;

        // Validar el estado
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Estado no válido' });
        }

        // Buscar la imagen en la base de datos
        const photo = await Photo.findById(req.params.id);
        if (!photo) {
            return res.status(404).json({ message: 'Imagen no encontrada' });
        }

        // Validar y extraer base64 de la URL
        if (!photo.url || !photo.url.includes(',')) {
            return res.status(400).json({ message: 'La URL de la imagen no tiene un formato válido.' });
        }

        const base64Data = photo.url.split(',')[1];
        if (!base64Data) {
            return res.status(400).json({ message: 'Datos base64 no encontrados en la URL de la imagen.' });
        }

        // Crear un directorio temporal único
        const tempDir = path.join(os.tmpdir(), 'stegexpose_temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Crear una ruta temporal para la imagen
        const tempPath = path.join(tempDir, `${photo._id}.jpg`);
        fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));

        // Verificar que el archivo temporal se creó correctamente
        const fileExists = fs.existsSync(tempPath);
        const fileSize = fileExists ? fs.statSync(tempPath).size : 0;
        console.log(`Archivo temporal creado: ${tempPath}, Tamaño: ${fileSize} bytes`);

        if (!fileExists || fileSize === 0) {
            throw new Error('El archivo temporal no se creó correctamente.');
        }

        let analysis;
        try {
            // Analizar la imagen con StegExpose
            console.log(`Ejecutando análisis en: ${tempPath}`);
            analysis = await analyzeWithStegExpose(tempPath);
            console.log('Reporte de StegExpose:', analysis);
        } finally {
            // Eliminar el archivo temporal y directorio temporal
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true });
            }
        }

        // Si es sospechoso, no se permite aprobar
        if (analysis.isSuspicious && status === 'approved') {
            return res.status(403).json({
                message: 'La imagen contiene características sospechosas y no puede ser aprobada.',
                analysisReport: analysis.details,
            });
        }

        // Actualizar el estado de la imagen
        photo.status = status;
        if (status === 'approved') {
            photo.approvedAt = new Date();
            photo.approvedBy = req.user.email;
        }

        await photo.save();
        res.status(200).json({
            message: `Imagen ${status === 'approved' ? 'aprobada' : 'rechazada'} correctamente.`,
            photo,
        });
    } catch (error) {
        console.error('Error en la ruta de aprobación/rechazo:', error.message || error);
        res.status(500).json({ message: 'Error inesperado al procesar la solicitud', error });
    }
});


// Ruta para eliminar una imagen (admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const photo = await Photo.findByIdAndDelete(req.params.id);
        if (!photo) {
            return res.status(404).json({ message: 'Imagen no encontrada' });
        }
        res.status(200).json({ message: 'Imagen eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la imagen', error });
    }
});

module.exports = router;
