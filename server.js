const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 3000;
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const model = 'gpt-5.6-luna';
const systemInstructions = fs.readFileSync(path.join(root, 'BRIEF.md'), 'utf8').match(/## AI instructions[\s\S]*/)?.[0] || '';

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

async function askOpenAI(message, subject, simpler) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'paste-your-key-here') throw new Error('missing key');
  const prompt = `Subject: ${subject}\n${simpler ? 'Please explain the confusing step more simply.\n' : ''}Homework question:\n${message}`;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, instructions: systemInstructions, input: prompt })
  });
  if (!response.ok) throw new Error('OpenAI request failed');
  const data = await response.json();
  return data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join('') || 'I could not find an explanation. Please try again.';
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
