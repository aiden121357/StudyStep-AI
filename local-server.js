const http = require('http');
const fs = require('fs');
const path = require('path');
const { askOpenAI } = require('./lib/openai');
const { KeygenError } = require('./server/getKey');

const root = __dirname;
const port = process.env.PORT || 3000;
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/ask') {
    let raw = ''; req.on('data', chunk => { raw += chunk; });
    req.on('end', async () => {
      try {
        const { message, subject, simpler } = JSON.parse(raw || '{}');
        if (!message?.trim()) return send(res, 400, { error: 'Please enter a homework question.' });
        const answer = await askOpenAI(message.trim(), subject || 'General', Boolean(simpler));
        send(res, 200, { answer });
      } catch (error) {
        if (error instanceof KeygenError) return send(res, error.status, { error: error.message });
        send(res, 500, { error: 'I could not answer right now. Please check your key and internet connection, then try again.' });
      }
    });
    return;
  }
  const requested = req.url === '/' ? '/index.html' : req.url;
  const publicRoot = path.join(root, 'public');
  const filePath = path.normalize(path.join(publicRoot, requested));
  if (!filePath.startsWith(publicRoot)) return send(res, 404, { error: 'Not found' });
  const types = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' };
  fs.readFile(filePath, (err, data) => err ? send(res, 404, { error: 'Not found' }) : send(res, 200, data, types[path.extname(filePath)] || 'application/octet-stream'));
});
server.listen(port, () => console.log(`StudyStep AI is running at http://localhost:${port}`));
