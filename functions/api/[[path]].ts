/**
 * Cloudflare Workers Function para APIs del panel de Playwright
 *
 * Si env.RUNNER_URL está definida (ej. tu app en Railway), hace proxy a ese backend
 * para listar y ejecutar tests. Si no, devuelve mensajes indicando que se necesita
 * un servicio externo.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context: {
  request: Request;
  env: { RUNNER_URL?: string };
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
  params: Record<string, string>;
  data: any;
}) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  const runnerBase = (env.RUNNER_URL || '').replace(/\/$/, '');

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // API: Status
  if (path === 'status' && request.method === 'GET') {
    return jsonResponse({
      status: 'running',
      timestamp: new Date().toISOString(),
      platform: 'cloudflare-pages',
      runnerConnected: !!runnerBase,
      note: runnerBase
        ? 'Conectado al runner en ' + runnerBase
        : 'Configura RUNNER_URL (ej. tu URL de Railway) para ejecutar tests.',
    });
  }

  // API: List tests — proxy al runner si RUNNER_URL está definida
  if (path === 'list-tests' && request.method === 'GET') {
    if (!runnerBase) {
      return jsonResponse({
        tests: [],
        note: 'Esta funcionalidad requiere un servicio externo para acceder al sistema de archivos. Configura RUNNER_URL en Cloudflare (Variables de entorno).',
      });
    }
    try {
      const res = await fetch(`${runnerBase}/tests`);
      if (!res.ok) throw new Error(`Runner: ${res.status}`);
      const files: string[] = await res.json();
      const tests = files.map((f) => ({
        name: f.replace(/\.spec\.(ts|js)$/, ''),
        path: `tests/${f}`,
      }));
      return jsonResponse({ tests });
    } catch (err) {
      return jsonResponse(
        {
          tests: [],
          note: `No se pudo conectar al runner (${runnerBase}). Comprueba RUNNER_URL y que el servicio esté activo.`,
          error: err instanceof Error ? err.message : String(err),
        },
        200
      );
    }
  }

  // API: Run command — proxy al runner (extrae nombre del test y llama POST /run)
  if (path === 'run-command' && request.method === 'POST') {
    if (!runnerBase) {
      return jsonResponse(
        {
          success: false,
          error: 'Se requiere un servicio externo para ejecutar tests. Configura RUNNER_URL en Cloudflare (Variables de entorno) con la URL de tu runner (ej. Railway).',
        },
        501
      );
    }
    try {
      const body = await request.json();
      const command: string = body?.command || '';
      // Extraer archivo de test: "npx playwright test tests/foo.spec.ts ..." -> "foo.spec.ts"
      const match = command.match(/tests\/([^\s]+\.spec\.(ts|js))/);
      const testFile = match ? match[1] : null;
      if (!testFile) {
        return jsonResponse(
          {
            success: false,
            error: 'No se pudo extraer el archivo de test del comando. El runner solo ejecuta un test por vez (ej. tests/nombre.spec.ts).',
            command,
          },
          400
        );
      }
      const runRes = await fetch(`${runnerBase}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: testFile }),
      });
      const result = await runRes.json();
      // El panel espera { success, stdout, stderr, testFailed? }
      return jsonResponse({
        success: result.success,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        testFailed: result.success === false,
      });
    } catch (err) {
      return jsonResponse(
        {
          success: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
        },
        500
      );
    }
  }

  // API: Read test (limitado — el runner actual no expone lectura de archivos)
  if (path === 'read-test' && request.method === 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'No se puede acceder al sistema de archivos en Cloudflare Workers. Se requiere un servicio externo o Cloudflare R2 para almacenar tests.',
      },
      501
    );
  }

  // API: Write test (limitado)
  if (path === 'write-test' && request.method === 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'No se puede escribir en el sistema de archivos en Cloudflare Workers. Se requiere un servicio externo o Cloudflare R2 para almacenar tests.',
      },
      501
    );
  }

  return jsonResponse({ error: 'Ruta no encontrada' }, 404);
}

