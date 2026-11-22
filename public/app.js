const question = document.querySelector('#question');
const subject = document.querySelector('#subject');
const ask = document.querySelector('#ask');
const assistantForm = document.querySelector('#assistantForm');
const answer = document.querySelector('#answer');
const answerText = document.querySelector('#answerText');
const subjectBadge = document.querySelector('#subjectBadge');
const simpler = document.querySelector('#simpler');
const save = document.querySelector('#save');
const clear = document.querySelector('#clear');
const saved = document.querySelector('#saved');
const savedList = document.querySelector('#savedList');
const savedCount = document.querySelector('#savedCount');
const questionCount = document.querySelector('#questionCount');
const storageKey = 'studystep-explanations';

let lastQuestion = '';
let lastSubject = 'Math';
let lastAnswer = '';

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function formatInline(value) {
  return escapeHTML(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderAnswer(rawAnswer) {
  const lines = String(rawAnswer || '').replace(/\r/g, '').split('\n');
  const stepPattern = /^\s*(?:\d+[.)]|[-*])\s+(.+)$/;
  const headingPattern = /^\s*#{0,3}\s*(?:steps?|step-by-step explanation)\s*:??\s*$/i;
  const intro = [];
  const steps = [];
  let inSteps = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (headingPattern.test(trimmed)) {
      inSteps = true;
      return;
    }
    const match = trimmed.match(stepPattern);
    if (match) {
      steps.push(match[1]);
    } else if (inSteps) {
      steps.push(trimmed);
    } else {
      intro.push(trimmed.replace(/^#{1,3}\s+/, ''));
    }
  });

  if (!steps.length) {
    const fallback = intro.length > 1 ? intro.splice(1) : intro.splice(0);
    steps.push(...fallback);
  }

  const introHTML = intro.map(line => `<p>${formatInline(line)}</p>`).join('');
  const stepsHTML = steps.length
    ? `<h3>Steps</h3><ol>${steps.map(step => `<li>${formatInline(step)}</li>`).join('')}</ol>`
    : '';
  answerText.innerHTML = introHTML + stepsHTML;
}

const storage = {
  read() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  },
  add(item) {
    const items = [item, ...this.read()].slice(0, 10);
    localStorage.setItem(storageKey, JSON.stringify(items));
    renderSaved();
  }
};

function renderSaved() {
  const items = storage.read();
  saved.classList.toggle('hidden', items.length === 0);
  savedCount.textContent = items.length ? `${items.length} saved` : '';
  savedList.innerHTML = items.map(item => (
    `<article class="saved-item"><b>${escapeHTML(item.subject || 'General')}</b><br><span>${escapeHTML(item.question || '')}</span></article>`
  )).join('');
}

function setSubject(value) {
  subject.value = value;
  document.querySelectorAll('.subject').forEach(button => {
    const active = button.dataset.subject === value;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setAnswerActions(enabled) {
  simpler.disabled = !enabled;
  save.disabled = !enabled;
}

function updateQuestionCount() {
  questionCount.textContent = `${question.value.length} / ${question.maxLength}`;
}

async function askAI(isSimpler = false) {
  const text = question.value.trim();
  const message = isSimpler ? lastQuestion : text;
  if (!message) {
    question.focus();
    return;
  }

  ask.disabled = true;
  simpler.disabled = true;
  save.disabled = true;
  ask.innerHTML = '<span class="spinner" aria-hidden="true"></span> Thinking…';
  answer.classList.remove('hidden');
  answerText.innerHTML = '<p class="loading-copy">Thinking through the problem…</p>';
  subjectBadge.textContent = subject.value.toUpperCase();

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, subject: subject.value, simpler: isSimpler })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = typeof data.error === 'string' ? data.error : data.error?.message;
      throw new Error(error || `The request failed (${response.status}). Please try again.`);
    }

    lastQuestion = text || lastQuestion;
    lastSubject = subject.value;
    lastAnswer = data.answer || '';
    renderAnswer(lastAnswer);
    setAnswerActions(true);
  } catch (error) {
    lastAnswer = '';
    answerText.innerHTML = `<p class="error-copy">${escapeHTML(error.message || 'I could not answer right now. Please try again.')}</p>`;
    setAnswerActions(false);
  } finally {
    ask.disabled = false;
    ask.innerHTML = 'Explain Step by Step <span aria-hidden="true">→</span>';
  }
}

document.querySelectorAll('.subject').forEach(button => {
  button.addEventListener('click', () => setSubject(button.dataset.subject));
});

assistantForm.addEventListener('submit', event => {
  event.preventDefault();
  askAI();
});

simpler.addEventListener('click', () => askAI(true));

clear.addEventListener('click', () => {
  question.value = '';
  lastQuestion = '';
  lastAnswer = '';
  subjectBadge.textContent = '';
  answerText.innerHTML = '';
  answer.classList.add('hidden');
  setAnswerActions(false);
  updateQuestionCount();
  question.focus();
});

save.addEventListener('click', () => {
  if (!lastQuestion || !lastAnswer) return;
  storage.add({ subject: lastSubject, question: lastQuestion, answer: lastAnswer, date: new Date().toISOString() });
  save.innerHTML = '✓ Saved Explanation';
  save.disabled = true;
});

question.addEventListener('input', updateQuestionCount);
updateQuestionCount();
setSubject(subject.value);
setAnswerActions(false);
renderSaved();
