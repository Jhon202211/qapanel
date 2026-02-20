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

function jsonResponse(data: object, status = 200, noCache = false) {
  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (noCache) headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
  return new Response(JSON.stringify(data), { status, headers });
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
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '').split('/')[0] || '';
  const runnerBase = (env.RUNNER_URL || '').trim().replace(/\/$/, '');

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

  // API: Diagnóstico — comprueba si la Function puede alcanzar el runner (para depurar)
  if (path === 'runner-ping' && request.method === 'GET') {
    if (!runnerBase) {
      return jsonResponse({ ok: false, error: 'RUNNER_URL no está definida en Cloudflare' }, 200, true);
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(runnerBase, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PlaywrightPanel-Cloudflare/1.0' },
      });
      clearTimeout(timeoutId);
      const text = await res.text();
      return jsonResponse(
        {
          ok: res.ok,
          status: res.status,
          runnerUrl: runnerBase,
          bodyPreview: text.slice(0, 100),
          message: res.ok ? 'Conexión al runner OK' : `Runner respondió con ${res.status}`,
        },
        200,
        true
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return jsonResponse(
        {
          ok: false,
          runnerUrl: runnerBase,
          error: msg,
          message: 'No se pudo conectar desde Cloudflare al runner. Prueba RUNNER_URL como variable Plaintext o revisa que la URL sea exactamente la de Railway.',
        },
        200,
        true
      );
    }
  }

  // API: List tests — proxy al runner si RUNNER_URL está definida
  if (path === 'list-tests' && request.method === 'GET') {
    if (!runnerBase) {
      return jsonResponse({
        tests: [],
        note: 'Esta funcionalidad requiere un servicio externo para acceder al sistema de archivos. Configura RUNNER_URL en Cloudflare (Variables de entorno).',
      }, 200, true);
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${runnerBase}/tests`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PlaywrightPanel-Cloudflare/1.0' },
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Runner respondió con ${res.status}`);
      const files: string[] = await res.json();
      const tests = files.map((f) => ({
        name: f.replace(/\.spec\.(ts|js)$/, ''),
        path: `tests/${f}`,
      }));
      return jsonResponse({ tests }, 200, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTimeout = msg.includes('abort') || msg.includes('timeout');
      const note = isTimeout
        ? `El runner (${runnerBase}) no respondió a tiempo. Si usas Railway en plan gratuito, el servicio puede estar dormido: abre la URL en el navegador para despertarlo y vuelve a intentar.`
        : `No se pudo conectar al runner (${runnerBase}). ${msg} Comprueba que RUNNER_URL sea correcta y que el servicio esté activo.`;
      return jsonResponse(
        {
          tests: [],
          note,
          error: msg,
        },
        200,
        true
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      const runRes = await fetch(`${runnerBase}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'PlaywrightPanel-Cloudflare/1.0' },
        body: JSON.stringify({ test: testFile }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const result = await runRes.json();
      // El panel espera { success, stdout, stderr, testFailed? }
      return jsonResponse(
        {
          success: result.success,
          stdout: result.stdout ?? '',
          stderr: result.stderr ?? '',
          testFailed: result.success === false,
        },
        200,
        true
      );
    } catch (err) {
      return jsonResponse(
        {
          success: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
        },
        500,
        true
      );
    }
  }

  // API: Open report — proxy al runner; el runner devuelve la URL pública del reporte (/report)
  if (path === 'open-report' && request.method === 'GET') {
    if (!runnerBase) {
      return jsonResponse(
        {
          success: false,
          error: 'Para ver el reporte en producción configura RUNNER_URL (URL de tu runner en Railway).',
          suggestion: 'Configura RUNNER_URL en Cloudflare (Variables de entorno o wrangler.toml).',
        },
        200,
        true
      );
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${runnerBase}/api/open-report`, {
        method: 'GET',
        headers: { 'User-Agent': 'PlaywrightPanel-Cloudflare/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      return jsonResponse(data, res.ok ? 200 : res.status, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return jsonResponse(
        {
          success: false,
          error: `No se pudo conectar al runner para obtener el reporte: ${msg}`,
          suggestion: 'Comprueba que RUNNER_URL sea correcta y que el runner esté desplegado con la ruta /api/open-report.',
        },
        200,
        true
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

