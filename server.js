const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos
app.use(express.static('.'));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'playwright-panel.html'));
});

// API para ejecutar comandos
app.post('/api/run-command', async (req, res) => {
    const { command } = req.body;
    
    if (!command) {
        return res.status(400).json({ error: 'Comando no proporcionado' });
    }

    console.log(`Ejecutando comando: ${command}`);

    // Para comandos de codegen, usar spawn para mejor manejo
    if (command.includes('codegen')) {
        const { spawn } = require('child_process');
        const codegenProcess = spawn('npx', command.split(' ').slice(1), { 
            cwd: __dirname,
            stdio: 'pipe',
            detached: true
        });

        // No matar el proceso automáticamente - dejar que el usuario lo controle
        // El proceso se mantendrá vivo hasta que el usuario lo cierre manualmente
        codegenProcess.on('close', (code) => {
            console.log(`Proceso de codegen terminado con código: ${code}`);
        });

        codegenProcess.on('error', (error) => {
            console.error(`Error en proceso de codegen: ${error}`);
        });

        res.json({ 
            success: true, 
            stdout: 'Codegen iniciado. El navegador y la ventana de código permanecerán abiertos hasta que los cierres manualmente.',
            command: command,
            processId: codegenProcess.pid
        });
    } else if (command.includes('show-report')) {
        // Para el comando show-report, abrir en el navegador
        exec('npx playwright show-report', { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error ejecutando show-report: ${error}`);
                res.status(500).json({ 
                    error: error.message, 
                    stderr: stderr,
                    command: command 
                });
                return;
            }

            console.log(`Reporte abierto exitosamente`);
            res.json({ 
                success: true, 
                stdout: 'Reporte HTML abierto en el navegador. Si no se abrió automáticamente, ejecuta: npx playwright show-report',
                stderr: stderr,
                command: command 
            });
        });
    } else {
        // Para otros comandos, usar exec normal
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error ejecutando comando: ${error}`);
                res.status(500).json({ 
                    error: error.message, 
                    stderr: stderr,
                    command: command 
                });
                return;
            }

            console.log(`Comando ejecutado exitosamente: ${command}`);
            res.json({ 
                success: true, 
                stdout: stdout, 
                stderr: stderr,
                command: command 
            });
        });
    }
});

// Ruta para verificar estado del servidor
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'running', 
        timestamp: new Date().toISOString(),
        playwright: 'ready'
    });
});

// Ruta para abrir reporte HTML
app.get('/api/open-report', (req, res) => {
    // Primero verificar si hay un proceso usando el puerto 9323
    exec('lsof -i :9323', { cwd: __dirname }, (portError, portOutput) => {
        if (portOutput && portOutput.trim()) {
            // Puerto ocupado, intentar liberarlo
            exec('pkill -f "playwright show-report"', { cwd: __dirname }, (killError) => {
                // Esperar un momento y luego intentar abrir el reporte
                setTimeout(() => {
                    openReport(res);
                }, 1000);
            });
        } else {
            // Puerto libre, abrir reporte directamente
            openReport(res);
        }
    });
});

// API para listar tests disponibles
app.get('/api/list-tests', async (req, res) => {
    try {
        const testsDir = path.join(__dirname, 'tests');
        const files = await fs.readdir(testsDir);
        
        const testFiles = files
            .filter(file => file.endsWith('.spec.ts') || file.endsWith('.spec.js'))
            .map(file => ({
                name: file.replace('.spec.ts', '').replace('.spec.js', ''),
                path: `tests/${file}`
            }));
        
        res.json(testFiles);
    } catch (error) {
        console.error('Error listando tests:', error);
        res.status(500).json({ error: error.message });
    }
});

// API para leer contenido de un test
app.post('/api/read-test', async (req, res) => {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'Ruta del archivo no proporcionada' });
        }
        
        const fullPath = path.join(__dirname, filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        
        res.json({ success: true, content });
    } catch (error) {
        console.error('Error leyendo test:', error);
        res.status(500).json({ error: error.message });
    }
});

// API para escribir contenido en un test
app.post('/api/write-test', async (req, res) => {
    try {
        const { filePath, content } = req.body;
        
        if (!filePath || content === undefined) {
            return res.status(400).json({ error: 'Ruta del archivo o contenido no proporcionado' });
        }
        
        const fullPath = path.join(__dirname, filePath);
        await fs.writeFile(fullPath, content, 'utf8');
        
        res.json({ success: true, message: 'Test guardado exitosamente' });
    } catch (error) {
        console.error('Error guardando test:', error);
        res.status(500).json({ error: error.message });
    }
});

function openReport(res) {
    exec('npx playwright show-report', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error abriendo reporte: ${error}`);
            
            // Si es error de puerto ocupado, dar instrucciones específicas
            if (error.message.includes('EADDRINUSE')) {
                res.status(500).json({ 
                    error: 'Puerto 9323 ocupado. Ejecuta: pkill -f "playwright show-report"',
                    stderr: stderr,
                    solution: 'kill-port'
                });
            } else {
                res.status(500).json({ 
                    error: error.message, 
                    stderr: stderr
                });
            }
            return;
        }

        console.log(`Reporte abierto exitosamente`);
        res.json({ 
            success: true, 
            message: 'Reporte HTML abierto en el navegador',
            stdout: stdout,
            stderr: stderr
        });
    });
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor del Panel de Control Playwright iniciado en http://localhost:${PORT}`);
    console.log(`📁 Directorio de trabajo: ${__dirname}`);
    console.log(`🎭 Playwright configurado y listo para usar`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
});
