After each save point, push it to GitHub.
The AI connects through getKey().
OpenAI model with “luna”: gpt-5.6-luna

# StudyStep AI notes

## How to run

1. Put `KEYGEN_URL=...` and `KEYGEN_TOKEN=...` in `.env`.
2. Run `npm start`.
3. Open http://localhost:3000 in your browser.

Start command: `npm start`

## Put it online with Vercel

- This project uses regular HTML/CSS/JavaScript in `public/` and a Vercel serverless function in `api/ask.js`.
- The local server and Vercel function share the OpenAI request code in `lib/openai.js`, which gets keys through server-only `getKey()`.
- Import the GitHub repository into Vercel with no framework preset and keep the default project root.
- Add `KEYGEN_URL` and `KEYGEN_TOKEN` as Vercel Environment Variables. Never put the returned OpenAI key in GitHub, source files, or browser code.
- Deploy. Vercel will serve the page and make `/api/ask` available automatically.
- Browser saves continue to use localStorage, so saved explanations stay on each device.

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
