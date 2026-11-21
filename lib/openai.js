const fs = require('fs');
const path = require('path');

const model = 'gpt-5.6-luna';
const brief = fs.readFileSync(path.join(__dirname, '..', 'BRIEF.md'), 'utf8');
const systemInstructions = brief.match(/## AI instructions[\s\S]*/) ? brief.match(/## AI instructions[\s\S]*/)[0] : '';

async function askOpenAI(message, subject, simpler) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'paste-your-key-here') throw new Error('missing key');
  const prompt = `Subject: ${subject}\n${simpler ? 'Please explain the confusing step more simply.\n' : ''}Homework question:\n${message}`;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, instructions: systemInstructions, input: prompt })
  });
  if (!response.ok) throw new Error('OpenAI request failed');
  const data = await response.json();
  return data.output_text || data.output?.flatMap(item => item.content || []).map(item => item.text || '').join('') || 'I could not find an explanation. Please try again.';
}

module.exports = { askOpenAI };
