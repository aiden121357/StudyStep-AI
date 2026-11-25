const fs = require('fs');
const path = require('path');
const { withOpenAIKey } = require('../server/getKey');

const model = 'gpt-5.6-luna';
const brief = fs.readFileSync(path.join(__dirname, '..', 'BRIEF.md'), 'utf8');
const systemInstructions = brief.match(/## AI instructions[\s\S]*/) ? brief.match(/## AI instructions[\s\S]*/)[0] : '';

async function askOpenAI(message, subject, simpler) {
  const prompt = `Subject: ${subject}\n${simpler ? 'Please explain the entire homework problem more simply. Use very short, friendly numbered steps and define any hard words.\n' : ''}Homework question:\n${message}\n\nFormat your response with one short answer followed by a heading called Steps and a numbered list. Keep each step short and clear.`;
  return withOpenAIKey(async apiKey => {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, instructions: systemInstructions, input: prompt })
    });

    if (!response.ok) {
      let body = {};
      try { body = await response.json(); } catch {}
      const error = new Error(body.error?.message || `OpenAI request failed (${response.status})`);
      error.status = response.status;
      error.code = body.error?.code;
      throw error;
    }

    const data = await response.json();
    return data.output_text || data.output?.flatMap(item => item.content || []).map(item => item.text || '').join('') || 'I could not find an explanation. Please try again.';
  });
}

module.exports = { askOpenAI };
