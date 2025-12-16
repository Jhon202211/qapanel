const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 3001;

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

        // Usar npx.cmd en Windows, npx en otros SO
        const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        const args = command.split(' ').slice(1);

        // IMPORTANTE: sin detached y sin stdio raro para evitar EINVAL en Windows
        const codegenProcess = spawn(npxCommand, args, {
            cwd: __dirname,
            shell: true
        });

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
        const isTestCommand = command.includes('playwright test');
        
        console.log(`[SERVER] Iniciando ejecución del comando: ${command}`);
        console.log(`[SERVER] Es comando de test: ${isTestCommand}`);
        
        const { spawn } = require('child_process');
        const isWindows = process.platform === 'win32';
        
        // Dividir el comando en partes para spawn
        const parts = command.split(' ');
        const mainCommand = parts[0];
        const args = parts.slice(1);
        
        // Usar cmd en Windows para comandos que empiezan con npx
        const commandToRun = isWindows && mainCommand === 'npx' ? 'npx.cmd' : mainCommand;
        
        console.log(`[SERVER] Ejecutando: ${commandToRun}`, args);
        
        const childProcess = spawn(commandToRun, args, {
            cwd: __dirname,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });
        
        let stdout = '';
        let stderr = '';
        let testCompleted = false;
        let responseSent = false;
        
        const sendResponse = (testFailed) => {
            if (responseSent) {
                console.log(`[SERVER] Respuesta ya enviada, ignorando`);
                return;
            }
            
            responseSent = true;
            clearTimeout(processTimeout);
            
            console.log(`[SERVER] Enviando respuesta al cliente...`);
            res.json({ 
                success: true, 
                stdout: stdout || '', 
                stderr: stderr || '',
                command: command,
                testFailed: testFailed
            });
            console.log(`[SERVER] Respuesta enviada`);
        };
        
        childProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            console.log(`[SERVER] stdout:`, output.substring(0, 200));
            
            if (isTestCommand) {
                // Detectar cuando el test realmente terminó (antes del servidor del reporte)
                // Playwright muestra estos patrones cuando el test termina:
                if (output.includes('failed') || output.includes('passed')) {
                    // Contar cuántos tests pasaron/fallaron
                    const failedMatch = output.match(/(\d+)\s+failed/);
                    const passedMatch = output.match(/(\d+)\s+passed/);
                    
                    if (failedMatch || passedMatch) {
                        console.log(`[SERVER] Test completado detectado en stdout`);
                        // Esperar un poco más para capturar toda la salida
                        setTimeout(() => {
                            if (!responseSent) {
                                const testFailed = failedMatch && parseInt(failedMatch[1]) > 0;
                                sendResponse(testFailed);
                            }
                        }, 1000); // Esperar 1 segundo para capturar toda la salida
                    }
                }
                
                // Si aparece el mensaje del servidor del reporte, el test ya terminó
                if (output.includes('Serving HTML report')) {
                    console.log(`[SERVER] Detectado servidor del reporte - test ya terminó`);
                    if (!responseSent) {
                        // Determinar si falló basándose en la salida anterior
                        const testFailed = stdout.includes('failed') && !stdout.includes('0 failed');
                        sendResponse(testFailed);
                    }
                }
            }
        });
        
        childProcess.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            console.log(`[SERVER] stderr:`, output.substring(0, 200));
        });
        
        // Timeout de seguridad
        const processTimeout = setTimeout(() => {
            console.log(`[SERVER] Timeout: proceso tomando demasiado tiempo`);
            if (!responseSent) {
                testCompleted = true;
                try {
                    childProcess.kill('SIGTERM');
                    setTimeout(() => {
                        if (!childProcess.killed) {
                            childProcess.kill('SIGKILL');
                        }
                    }, 5000);
                } catch (e) {
                    console.error(`[SERVER] Error al matar proceso:`, e);
                }
                
                sendResponse(true); // Asumir que falló por timeout
            }
        }, 5 * 60 * 1000);
        
        childProcess.on('close', (code, signal) => {
            clearTimeout(processTimeout);
            testCompleted = true;
            
            console.log(`[SERVER] Proceso terminado con código: ${code}, signal: ${signal}`);
            
            // Si aún no se envió respuesta, enviarla ahora
            if (!responseSent) {
                const testFailed = isTestCommand && code !== 0;
                sendResponse(testFailed);
            }
        });
        
        childProcess.on('exit', (code, signal) => {
            console.log(`[SERVER] Proceso exit con código: ${code}, signal: ${signal}`);
        });
        
        childProcess.on('error', (error) => {
            clearTimeout(processTimeout);
            testCompleted = true;
            console.error(`[SERVER] Error en proceso:`, error);
            
            if (!responseSent) {
                if (isTestCommand) {
                    sendResponse(true);
                } else {
                    res.status(500).json({ 
                        success: false,
                        error: error.message, 
                        stderr: stderr,
                        command: command 
                    });
                    responseSent = true;
                }
            }
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
