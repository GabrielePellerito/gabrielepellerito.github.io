// Local preview only; GitHub Pages serves the files itself.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPrivatePath } from './privacy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4175);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const parts = pathname.split(/[\\/]/);
    if (isPrivatePath(pathname) || parts.some((part) => part.startsWith('.')) || ['node_modules', 'scripts', 'tests', 'artifacts'].some((part) => parts.includes(part))) {
      response.writeHead(404).end('Risorsa non trovata'); return;
    }
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const info = await stat(path).catch(() => null);
    const found = info?.isFile();
    const target = found ? path : resolve(root, '404.html');
    response.writeHead(found ? 200 : 404, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    if (request.method === 'HEAD') response.end();
    else createReadStream(target).on('error', () => response.destroy()).pipe(response);
  } catch { response.writeHead(400).end('Richiesta non valida'); }
});
server.on('error', (error) => { console.error(`Anteprima non avviata: ${error.message}`); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Anteprima: http://127.0.0.1:${port}`));
