const question = document.querySelector('#question');
const subject = document.querySelector('#subject');
const ask = document.querySelector('#ask');
const answer = document.querySelector('#answer');
const answerText = document.querySelector('#answerText');
const simpler = document.querySelector('#simpler');
const save = document.querySelector('#save');
const saved = document.querySelector('#saved');
const savedList = document.querySelector('#savedList');
const savedCount = document.querySelector('#savedCount');
let lastQuestion = '';

// One small browser-storage file: easy to replace with a real database later.
const storage = {
  read() { return JSON.parse(localStorage.getItem('studystep-explanations') || '[]'); },
  add(item) { const items = [item, ...this.read()].slice(0, 10); localStorage.setItem('studystep-explanations', JSON.stringify(items)); renderSaved(); }
};

function renderSaved() { const items = storage.read(); saved.classList.toggle('hidden', !items.length); savedCount.textContent = items.length ? `${items.length} saved` : ''; savedList.innerHTML = items.map(item => `<div class="saved-item"><b>${item.subject}</b><br>${item.question}</div>`).join(''); }
async function askAI(isSimpler = false) {
  const text = question.value.trim(); if (!text) { question.focus(); return; }
  ask.disabled = true; simpler.disabled = true; ask.textContent = 'Thinking…'; answer.classList.remove('hidden'); answerText.textContent = 'Thinking…';
  try { const response = await fetch('/api/ask', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message: isSimpler ? lastQuestion : text, subject: subject.value, simpler: isSimpler }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); lastQuestion = text; answerText.textContent = data.answer; document.querySelector('#subjectBadge').textContent = subject.value.toUpperCase(); }
  catch (error) { answerText.textContent = error.message || 'I could not answer right now. Please check your key and internet connection, then try again.'; }
  finally { ask.disabled = false; simpler.disabled = false; ask.innerHTML = 'Explain step by step <span>→</span>'; }
}
ask.addEventListener('click', () => askAI()); simpler.addEventListener('click', () => askAI(true));
document.querySelector('#clear').addEventListener('click', () => { question.value=''; answer.classList.add('hidden'); });
save.addEventListener('click', () => { if (lastQuestion && answerText.textContent !== 'Thinking…') storage.add({ subject:subject.value, question:lastQuestion, answer:answerText.textContent, date:new Date().toISOString() }); });
renderSaved();
