const { askOpenAI } = require('../lib/openai');
const { KeygenError } = require('../server/getKey');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Please use POST for homework questions.' });
  try {
    const { message, subject, simpler, focusStep } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ error: 'Please enter a homework question.' });
    const answer = await askOpenAI(message.trim(), subject || 'General', Boolean(simpler), typeof focusStep === 'string' ? focusStep.trim() : '');
    return res.status(200).json({ answer });
  } catch (error) {
    if (error instanceof KeygenError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'I could not answer right now. Please check your key and internet connection, then try again.' });
  }
};
