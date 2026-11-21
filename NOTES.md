After each save point, push it to GitHub.
OpenAI model with “luna”: gpt-5.6-luna

# StudyStep AI notes

## How to run

1. Make sure your OpenAI key is in `.env` as `OPENAI_API_KEY=...`.
2. Run `npm start`.
3. Open http://localhost:3000 in your browser.

Start command: `npm start`

## Put it online with Vercel

- This project uses regular HTML/CSS/JavaScript in `public/` and a Vercel serverless function in `api/ask.js`.
- The local server and Vercel function share the OpenAI request code in `lib/openai.js`.
- Import the GitHub repository into Vercel with no framework preset and keep the default project root.
- Add one Vercel Environment Variable: `OPENAI_API_KEY` with your OpenAI key. Never put the key in GitHub or source files.
- Deploy. Vercel will serve the page and make `/api/ask` available automatically.
- Browser saves continue to use localStorage, so saved explanations stay on each device.
- Local page/API smoke test passed; the current `.env` key is rejected by OpenAI, so replace it before expecting live AI answers.

## Done

- Built Version 1 MVP: subject picker, homework question box, step-by-step AI explanation, and simpler-step follow-up.
- Added safety/privacy reminders and friendly error handling.
- Added browser-only saved explanations in one small `public/app.js` storage section.
- Added the local server so the OpenAI key never goes to the page.
- Saves on this computer only for now.

## MVP checks

- Paste a homework problem and press Ask: should show Thinking… and then an explanation.
- Pick a subject: the answer should include that subject context.
- Press Explain a step more simply: should return a simpler explanation.
- Ask a real question with a working key: should return a short, safe answer; errors should suggest checking the key.

## Maybe Later

- Try the next step before seeing it.
- Reminder to check answers with a teacher.
- Warning not to type personal information.
- Politely refuse off-topic or rude questions.
- Get a hint instead of a full step.
- Get a similar practice problem.
- Upload a photo of the problem.
- Save explanations to review before a test.

## Next

- Test with student volunteers and collect feedback.
- Improve answer formatting and add teacher-check reminders.
- Replace the rejected/expired OpenAI key in `.env`, then test a real homework question again.
