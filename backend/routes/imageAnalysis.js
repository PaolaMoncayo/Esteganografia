const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Ruta absoluta al archivo .jar
const STEGEXPOSE_PATH = path.resolve('C:/Users/comby/Documents/tools/StegExpose.jar');

const analyzeWithStegExpose = async (imageBuffer, imageName) => {
    let tempDir = null; // Inicializar tempDir
    try {
        // Validar que el archivo .jar exista
        if (!fs.existsSync(STEGEXPOSE_PATH)) {
            throw new Error(`El archivo StegExpose.jar no existe en la ruta: ${STEGEXPOSE_PATH}`);
        }

        // Validar entradas
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
            throw new Error('El argumento imageBuffer no es válido o está vacío.');
        }

        if (!imageName || typeof imageName !== 'string') {
            throw new Error('El argumento imageName no es válido o está vacío.');
        }

        // Crear un directorio temporal único
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stegexpose_'));
        const tempImagePath = path.join(tempDir, imageName);

        console.log('Directorio temporal creado:', tempDir);
        console.log('Ruta del archivo temporal:', tempImagePath);

        // Guardar la imagen en el directorio temporal
        fs.writeFileSync(tempImagePath, imageBuffer);

        // Verificar que la imagen se guardó correctamente
        const filesInDir = fs.readdirSync(tempDir);
        console.log('Archivos en el directorio temporal:', filesInDir);

        if (filesInDir.length === 0) {
            throw new Error('El directorio temporal está vacío. No hay archivos para analizar.');
        }

        // Ejecutar StegExpose con el directorio temporal
        return new Promise((resolve, reject) => {
            console.log(`Ejecutando: java -jar ${STEGEXPOSE_PATH} ${tempDir}`);

            execFile('java', ['-jar', STEGEXPOSE_PATH, tempDir], (error, stdout, stderr) => {
                // Limpiar el directorio temporal después de la ejecución
                if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
                if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });

                if (error) {
                    console.error('Error ejecutando StegExpose:', stderr || error.message);
                    return reject(error);
                }

                const result = stdout.trim();
                console.log(`Resultado de StegExpose: ${result}`);

                if (result.includes('SUSPECTED')) {
                    resolve({ isSuspicious: true, details: result });
                } else {
                    resolve({ isSuspicious: false, details: result });
                }
            });
        });
    } catch (error) {
        console.error('Error en analyzeWithStegExpose:', error.message || error);
        throw error;
    } finally {
        // Limpieza del directorio temporal
        if (tempDir && fs.existsSync(tempDir)) {
            fs.readdirSync(tempDir).forEach((file) => {
                const filePath = path.join(tempDir, file);
                fs.unlinkSync(filePath);
            });
            fs.rmSync(tempDir, { recursive: true });
        }
    }
};

module.exports = { analyzeWithStegExpose };
