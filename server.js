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

    // Para comandos de codegen, usar spawn con configuración especial
    // para mantener el proceso activo y mostrar la interfaz gráfica
    if (command.includes('codegen')) {
        const { spawn } = require('child_process');
        const isWindows = process.platform === 'win32';

        // Dividir el comando en partes
        const parts = command.split(' ');
        const mainCommand = parts[0]; // 'npx'
        const args = parts.slice(1); // resto de argumentos

        // Usar npx.cmd en Windows, npx en otros SO
        const commandToRun = isWindows ? 'npx.cmd' : 'npx';

        console.log(`[CODEGEN] Ejecutando: ${commandToRun}`, args);
        console.log(`[CODEGEN] Comando completo: ${command}`);

        // IMPORTANTE: Para codegen, necesitamos mantener el proceso activo y con acceso a stdio
        // Usamos detached: false para mantener la conexión con stdio, pero almacenamos la referencia
        // del proceso para evitar que se cierre cuando el servidor responde
        const codegenProcess = spawn(commandToRun, args, {
            cwd: __dirname,
            shell: true,
            detached: false, // Mantener conectado para acceso a stdio
            stdio: 'inherit' // CRÍTICO: permite que codegen muestre ventana de código e inspector
        });

        // Almacenar referencia del proceso en un objeto global para evitar que se recolecte como basura
        // Esto asegura que el proceso permanezca activo incluso después de que el servidor responda
        if (!global.codegenProcesses) {
            global.codegenProcesses = new Set();
        }
        global.codegenProcesses.add(codegenProcess);

        // Limpiar la referencia cuando el proceso termine
        codegenProcess.on('close', () => {
            if (global.codegenProcesses) {
                global.codegenProcesses.delete(codegenProcess);
            }
        });

        console.log(`[CODEGEN] Proceso iniciado con PID: ${codegenProcess.pid}`);

        // Manejar eventos del proceso (aunque esté desvinculado, podemos escuchar eventos)
        codegenProcess.on('close', (code) => {
            console.log(`[CODEGEN] Proceso terminado con código: ${code}`);
        });

        codegenProcess.on('error', (error) => {
            console.error(`[CODEGEN] Error: ${error.message}`);
        });

        codegenProcess.on('exit', (code, signal) => {
            console.log(`[CODEGEN] Exit - código: ${code}, señal: ${signal}`);
        });

        // Enviar respuesta inmediatamente
        // El proceso codegen es interactivo y mantendrá abiertos el inspector y navegador
        // Está desvinculado del servidor para que sobreviva independientemente
        res.json({
            success: true,
            stdout: 'Codegen iniciado. El navegador y la ventana de código permanecerán abiertos hasta que los cierres manualmente. El proceso está desvinculado del servidor.',
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
        
        // Para comandos complejos con múltiples argumentos, usar shell: true
        // y pasar el comando completo como string en lugar de dividirlo
        // Esto es especialmente importante para comandos con cross-env y múltiples npx
        
        // Determinar el shell a usar
        const shell = isWindows ? process.env.COMSPEC || 'cmd.exe' : '/bin/sh';
        const shellArgs = isWindows ? ['/c'] : ['-c'];
        
        console.log(`[SERVER] Ejecutando en shell: ${shell}`, shellArgs, command);
        
        // Ejecutar el comando completo en el shell
        const childProcess = spawn(shell, [...shellArgs, command], {
            cwd: __dirname,
            shell: false, // Ya estamos usando shell explícitamente
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
    // Verificar si hay un proceso usando el puerto 9323
    exec('lsof -i :9323', { cwd: __dirname }, (portError, portOutput) => {
        if (portOutput && portOutput.trim()) {
            // Puerto ocupado, intentar liberarlo
            console.log('[REPORT] Puerto 9323 ocupado, intentando liberarlo...');
            exec('pkill -f "playwright show-report"', { cwd: __dirname }, (killError) => {
                if (killError) {
                    console.error('[REPORT] Error al matar proceso:', killError);
                }
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
        
        // Intentar leer el archivo con reintentos si está siendo escrito por codegen
        let content;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                content = await fs.readFile(fullPath, 'utf8');
                break; // Éxito, salir del bucle
            } catch (readError) {
                attempts++;
                // Si es un error de acceso y hay codegen activo, esperar un poco y reintentar
                if (readError.code === 'EBUSY' || readError.code === 'EACCES') {
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 100)); // Esperar 100ms
                        continue;
                    }
                }
                throw readError; // Si no es un error de acceso o se agotaron los intentos, lanzar error
            }
        }
        
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
        
        // Verificar si hay un proceso de codegen activo escribiendo en este archivo
        // Si es así, advertir al usuario pero permitir la escritura
        if (global.codegenProcesses && global.codegenProcesses.size > 0) {
            console.log(`[WARNING] Escribiendo archivo ${filePath} mientras codegen está activo`);
            // No bloqueamos la escritura, pero registramos la advertencia
        }
        
        await fs.writeFile(fullPath, content, 'utf8');
        
        res.json({ success: true, message: 'Test guardado exitosamente' });
    } catch (error) {
        console.error('Error guardando test:', error);
        res.status(500).json({ error: error.message });
    }
});

function openReport(res) {
    const { spawn } = require('child_process');
    const isWindows = process.platform === 'win32';
    
    // Determinar el shell a usar
    const shell = isWindows ? process.env.COMSPEC || 'cmd.exe' : '/bin/sh';
    const shellArgs = isWindows ? ['/c'] : ['-c'];
    const command = 'npx playwright show-report';
    
    console.log(`[REPORT] Iniciando: ${command}`);
    
    let responseSent = false;
    
    const sendResponse = (success, data) => {
        if (responseSent) {
            console.log(`[REPORT] Respuesta ya enviada, ignorando`);
            return;
        }
        responseSent = true;
        
        if (success) {
            res.json(data);
        } else {
            res.status(500).json(data);
        }
    };
    
    // Ejecutar el comando en background (detached) para que no bloquee
    const reportProcess = spawn(shell, [...shellArgs, command], {
        cwd: __dirname,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'], // Capturar stderr para detectar errores
        detached: true // Desvincular del proceso padre
    });
    
    // Almacenar referencia del proceso para poder cerrarlo después si es necesario
    if (!global.reportProcesses) {
        global.reportProcesses = new Set();
    }
    global.reportProcesses.add(reportProcess);
    
    let stderrOutput = '';
    
    // Capturar errores de stderr
    reportProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderrOutput += output;
        console.log(`[REPORT] stderr:`, output.substring(0, 200));
        
        // Si hay un error claro en stderr, responder con error
        if (output.includes('No report found') || output.includes('ENOENT') || output.includes('not found')) {
            if (!responseSent) {
                sendResponse(false, {
                    success: false,
                    error: 'No se encontró ningún reporte. Ejecuta algunos tests primero para generar un reporte.',
                    suggestion: 'Ejecuta al menos un test antes de intentar ver el reporte'
                });
            }
        }
    });
    
    // Limpiar la referencia cuando el proceso termine
    reportProcess.on('close', (code) => {
        console.log(`[REPORT] Proceso terminado con código: ${code}`);
        if (global.reportProcesses) {
            global.reportProcesses.delete(reportProcess);
        }
        
        // Si el proceso terminó con error y aún no se envió respuesta
        if (code !== 0 && !responseSent) {
            sendResponse(false, {
                success: false,
                error: `El proceso terminó con código de error: ${code}`,
                stderr: stderrOutput,
                suggestion: 'Verifica que Playwright esté instalado correctamente y que haya tests ejecutados previamente'
            });
        }
    });
    
    // Manejar errores de inicio (no se pudo iniciar el proceso)
    reportProcess.on('error', (error) => {
        console.error(`[REPORT] Error iniciando proceso:`, error);
        
        if (global.reportProcesses) {
            global.reportProcesses.delete(reportProcess);
        }
        
        if (!responseSent) {
            // Si el error es de puerto ocupado, dar instrucciones específicas
            if (error.message && error.message.includes('EADDRINUSE')) {
                sendResponse(false, {
                    success: false,
                    error: 'Puerto 9323 ocupado. Ejecuta: pkill -f "playwright show-report"',
                    solution: 'kill-port'
                });
            } else {
                sendResponse(false, {
                    success: false,
                    error: error.message || 'Error al iniciar el servidor del reporte',
                    suggestion: 'Verifica que Playwright esté instalado correctamente y que haya tests ejecutados previamente'
                });
            }
        }
    });
    
    // Esperar un momento para verificar si el proceso se inició correctamente
    setTimeout(() => {
        if (!responseSent) {
            // Verificar si el proceso sigue ejecutándose
            if (!reportProcess.killed && reportProcess.pid) {
                console.log(`[REPORT] Proceso iniciado con PID: ${reportProcess.pid}`);
                sendResponse(true, {
                    success: true, 
                    message: 'Reporte HTML abierto en el navegador. Si no se abrió automáticamente, visita http://localhost:9323',
                    processId: reportProcess.pid,
                    url: 'http://localhost:9323'
                });
            } else if (!responseSent) {
                // Si el proceso ya terminó o no se inició, esperar un poco más
                setTimeout(() => {
                    if (!responseSent && reportProcess.killed) {
                        sendResponse(false, {
                            success: false,
                            error: 'El proceso del reporte no se pudo iniciar correctamente',
                            suggestion: 'Verifica que Playwright esté instalado correctamente y que haya tests ejecutados previamente'
                        });
                    }
                }, 1000);
            }
        }
    }, 2000); // Esperar 2 segundos para que el proceso inicie
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
