#!/usr/bin/env node

/**
 * Script de validación para el botón "Continuar Grabación"
 * Simula el comportamiento de la función continueRecording() del panel
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Función para hacer peticiones HTTP
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Función para extraer URL del contenido del test (igual que en continueRecording)
function extractUrlFromTest(testContent) {
    let targetUrl = 'https://alex.queo.dev'; // URL por defecto
    let baseUrl = 'https://alex.queo.dev'; // BASE_URL por defecto
    
    // Primero, buscar BASE_URL en el código
    const baseUrlMatch = testContent.match(/BASE_URL\s*=\s*process\.env\.BASE_URL\s*\|\|\s*['"`]([^'"`]+)['"`]/);
    if (baseUrlMatch) {
        baseUrl = baseUrlMatch[1];
        console.log(`✅ BASE_URL detectada: ${baseUrl}`);
    }
    
    // Buscar todas las ocurrencias de page.goto
    const gotoRegex = /page\.goto\([`'"](\$\{BASE_URL\}[^`'"]+|[^`'"]+)['"`]\)/g;
    const allUrls = [];
    let match;
    
    while ((match = gotoRegex.exec(testContent)) !== null) {
        let url = match[1];
        // Si la URL contiene ${BASE_URL}, reemplazarla con el valor real
        if (url.includes('${BASE_URL}')) {
            url = url.replace(/\$\{BASE_URL\}/g, baseUrl);
        }
        allUrls.push(url);
    }
    
    if (allUrls.length > 0) {
        // Usar la última URL visitada
        targetUrl = allUrls[allUrls.length - 1];
        console.log(`✅ Última URL detectada: ${targetUrl}`);
    } else {
        // Si no hay URLs con page.goto, buscar URLs en template literals
        const templateRegex = /`\$\{BASE_URL\}([^`]+)`/g;
        const templateUrls = [];
        while ((match = templateRegex.exec(testContent)) !== null) {
            templateUrls.push(baseUrl + match[1]);
        }
        
        if (templateUrls.length > 0) {
            targetUrl = templateUrls[templateUrls.length - 1];
            console.log(`✅ URL detectada desde template literal: ${targetUrl}`);
        } else {
            console.log(`⚠️ No se detectó URL específica, usando URL por defecto: ${targetUrl}`);
        }
    }
    
    return targetUrl;
}

// Función principal de validación
async function validateContinueRecording() {
    console.log('🧪 Validando funcionalidad "Continuar Grabación"\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Verificar que el servidor está corriendo
        console.log('\n1️⃣ Verificando servidor...');
        const statusResponse = await makeRequest('GET', '/api/status');
        if (statusResponse.status === 200) {
            console.log('✅ Servidor está corriendo');
            console.log(`   Estado: ${statusResponse.data.status}`);
        } else {
            throw new Error('Servidor no está disponible');
        }
        
        // 2. Listar tests disponibles
        console.log('\n2️⃣ Listando tests disponibles...');
        const listResponse = await makeRequest('GET', '/api/list-tests');
        if (listResponse.status === 200 && Array.isArray(listResponse.data)) {
            const tests = listResponse.data;
            console.log(`✅ Se encontraron ${tests.length} tests`);
            
            if (tests.length === 0) {
                console.log('⚠️ No hay tests disponibles para probar');
                return;
            }
            
            // Mostrar algunos tests
            console.log('\n   Tests disponibles:');
            tests.slice(0, 5).forEach((test, index) => {
                console.log(`   ${index + 1}. ${test.name} (${test.path})`);
            });
            if (tests.length > 5) {
                console.log(`   ... y ${tests.length - 5} más`);
            }
            
            // 3. Probar con el primer test
            const testToUse = tests[0];
            console.log(`\n3️⃣ Probando con: ${testToUse.name}`);
            console.log(`   Ruta: ${testToUse.path}`);
            
            // 4. Leer el contenido del test
            console.log('\n4️⃣ Leyendo contenido del test...');
            const readResponse = await makeRequest('POST', '/api/read-test', {
                filePath: testToUse.path
            });
            
            if (readResponse.status === 200 && readResponse.data.success) {
                console.log('✅ Test leído exitosamente');
                const testContent = readResponse.data.content;
                console.log(`   Tamaño: ${testContent.length} caracteres`);
                
                // 5. Extraer URL del test
                console.log('\n5️⃣ Extrayendo URL del test...');
                const targetUrl = extractUrlFromTest(testContent);
                
                // 6. Generar nombre de archivo temporal
                console.log('\n6️⃣ Generando comando de codegen...');
                const pathParts = testToUse.path.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const tempFileName = fileName.replace('.spec.ts', '_temp_continue.spec.ts');
                const tempOutputPath = `tests/${tempFileName}`;
                
                const command = `npx playwright codegen ${targetUrl} --target=playwright-test --output=${tempOutputPath}`;
                
                console.log('\n📋 RESUMEN DE VALIDACIÓN:');
                console.log('=' .repeat(60));
                console.log(`✅ Test seleccionado: ${testToUse.name}`);
                console.log(`✅ URL detectada: ${targetUrl}`);
                console.log(`✅ Archivo temporal: ${tempOutputPath}`);
                console.log(`\n📝 Comando que se ejecutaría:`);
                console.log(`   ${command}`);
                console.log('\n' + '=' .repeat(60));
                console.log('\n✅ Validación completada exitosamente');
                console.log('\n💡 Para probar realmente, ejecuta el comando anterior o usa el botón en el panel web.');
                
            } else {
                throw new Error(`Error leyendo test: ${readResponse.data.error || 'Error desconocido'}`);
            }
            
        } else {
            throw new Error('Error al listar tests');
        }
        
    } catch (error) {
        console.error('\n❌ Error durante la validación:');
        console.error(`   ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Asegúrate de que el servidor esté corriendo:');
            console.error('   npm start');
        }
        process.exit(1);
    }
}

// Ejecutar validación
validateContinueRecording().catch(console.error);

