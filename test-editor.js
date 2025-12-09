// Funciones para el Editor de Tests de Playwright

// Abrir el editor de tests
function openTestEditor() {
    const editor = document.getElementById('testEditor');
    editor.style.display = 'block';
    loadTestList();
}

// Cerrar el editor de tests
function closeTestEditor() {
    const editor = document.getElementById('testEditor');
    editor.style.display = 'none';
}

// Cargar la lista de tests disponibles
async function loadTestList() {
    const selector = document.getElementById('testSelector');
    selector.innerHTML = '<option value="">Seleccionar test...</option>';
    
    try {
        const response = await fetch('/api/list-tests');
        if (response.ok) {
            const tests = await response.json();
            tests.forEach(test => {
                const option = document.createElement('option');
                option.value = test.path;
                option.textContent = test.name;
                selector.appendChild(option);
            });
        }
    } catch (error) {
        appendOutput(`❌ Error cargando lista de tests: ${error.message}`);
    }
}

// Cargar un test específico en el editor
async function loadTest() {
    const selector = document.getElementById('testSelector');
    const codeArea = document.getElementById('testCode');
    const selectedTest = selector.value;
    
    if (!selectedTest) {
        appendOutput('❌ Por favor selecciona un test para cargar');
        return;
    }
    
    // Verificar si hay un proceso de codegen activo
    // Si el archivo seleccionado es el mismo que codegen está escribiendo, advertir
    try {
        // Intentar leer el estado del servidor para ver si codegen está activo
        // Por ahora solo cargamos el test normalmente
        const response = await fetch('/api/read-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: selectedTest })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                codeArea.value = result.content;
                appendOutput(`✅ Test cargado: ${selectedTest}`);
                
                // Advertencia si el archivo podría estar siendo escrito por codegen
                appendOutput(`⚠️ Nota: Si codegen está activo, los cambios se guardarán automáticamente.`);
            } else {
                throw new Error(result.error);
            }
        } else {
            throw new Error(`Error HTTP: ${response.status}`);
        }
    } catch (error) {
        appendOutput(`❌ Error cargando test: ${error.message}`);
        
        // Si el error es por archivo bloqueado, sugerir esperar
        if (error.message.includes('EBUSY') || error.message.includes('EACCES')) {
            appendOutput(`💡 El archivo podría estar siendo escrito por codegen. Intenta de nuevo en unos segundos.`);
        }
    }
}

// Guardar cambios en un test
async function saveTest() {
    const selector = document.getElementById('testSelector');
    const codeArea = document.getElementById('testCode');
    const selectedTest = selector.value;
    const content = codeArea.value;
    
    if (!selectedTest) {
        appendOutput('❌ Por favor selecciona un test para guardar');
        return;
    }
    
    try {
        const response = await fetch('/api/write-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                filePath: selectedTest, 
                content: content 
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                appendOutput(`✅ Test guardado exitosamente: ${selectedTest}`);
                updateStatus('Test guardado', 'success');
            } else {
                throw new Error(result.error);
            }
        } else {
            throw new Error(`Error HTTP: ${response.status}`);
        }
    } catch (error) {
        appendOutput(`❌ Error guardando test: ${error.message}`);
        updateStatus('Error al guardar', 'error');
    }
}

// Función wrapper para guardar cambios
function saveTestChanges() {
    saveTest();
}

// Recargar la lista de tests
function reloadTestList() {
    loadTestList();
    // También recargar el selector de continuar grabación si existe la función
    if (typeof loadContinueTestSelector === 'function') {
        loadContinueTestSelector();
    }
    appendOutput('🔄 Lista de tests recargada');
}

// Exportar funciones al scope global
window.openTestEditor = openTestEditor;
window.closeTestEditor = closeTestEditor;
window.loadTestList = loadTestList;
window.loadTest = loadTest;
window.saveTest = saveTest;
window.saveTestChanges = saveTestChanges;
window.reloadTestList = reloadTestList;
