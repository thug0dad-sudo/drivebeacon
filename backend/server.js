import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const intakeFile = path.join(dataDir, 'intake.jsonl');

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(body);
}

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function appendIntake(entry) {
  await ensureDataDir();
  await fs.appendFile(intakeFile, `${JSON.stringify(entry)}\n`);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/intake') {
    try {
      const body = await parseBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const role = String(body.role || '').trim();
      const note = String(body.note || '').trim();

      if (!name || !email || !role) {
        sendJson(res, 400, { error: 'name, email, and role are required' });
        return;
      }

      const entry = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        name,
        email,
        role,
        note,
        userAgent: req.headers['user-agent'] || null,
      };

      await appendIntake(entry);
      sendJson(res, 201, { ok: true, id: entry.id });
    } catch (error) {
      sendJson(res, 400, { error: 'invalid JSON or request body' });
    }
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`DriveBeacon backend listening on http://localhost:${PORT}`);
});
