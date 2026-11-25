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

- `vercel.json` explicitly builds `api/ask.js` as the only server function and serves the regular HTML/CSS/JavaScript in `public/`.
- Its routes send `/api/ask` to the function and the page/assets to `public/`, so Vercel does not treat the local server as the online entrypoint.
- The local server and Vercel function share the OpenAI request code in `lib/openai.js`, which gets keys through server-only `getKey()`.
- Import the GitHub repository into Vercel, keep the default project root, and choose the `Other` framework preset if Vercel asks.
- Add exactly two Vercel Environment Variables: `KEYGEN_URL` and `KEYGEN_TOKEN`. Never add `OPENAI_API_KEY`; the server gets the returned key through `getKey()`.
- No build command, database, or other environment variable is needed for this project.
- Deploy. Vercel will serve the page and make `/api/ask` available automatically.
- Browser saves continue to use localStorage, so saved explanations stay on each device.

## Done

- Built Version 1 MVP: subject picker, homework question box, step-by-step AI explanation, and simpler-step follow-up.
- Added safety/privacy reminders and friendly error handling.
- Added browser-only saved explanations in one small `public/app.js` storage section.
- Added the local server so the OpenAI key never goes to the page.
- Saves on this computer only for now.

## MVP checks

- Paste a homework problem and press Ask: works locally; it shows Thinking… and then a step-by-step explanation. The deployed Vercel version also needs `KEYGEN_URL` and `KEYGEN_TOKEN` set in Vercel before its AI request can work.
- Pick a subject: the answer should include that subject context.
- Press Explain More Simply: should return a simpler explanation of the whole problem.
- Ask a real question with a working key: should return a short, safe answer; errors should suggest checking the key.
- Verified November 24, 2026: the local page and AI explanation work end to end. The live page loads, but Vercel AI requests still need `KEYGEN_URL` and `KEYGEN_TOKEN` added in Vercel.

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
