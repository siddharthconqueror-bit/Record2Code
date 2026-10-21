# Report2Code: build plan for Antigravity

These pages are your Stitch designs (Tailwind CDN HTML), linked together and changed to WHO ICD-10.
They are static: the workspace and trainee pages show sample data and do not analyse notes yet.
`engine.js` is a small working engine with about 35 SAMPLE codes. Antigravity must wire it in, then replace it with your book data.

## Paste this rule at the start of every Antigravity task
"Never invent a code, title or rule. Use only /source. If something is not in the file, say 'not found'. Do not change the visual design unless I ask. Stop after each step and show me the result."

## Prompts, one at a time
1. "Read all files. Do not change anything. List each page and what is static or sample data in it."
2. "In workspace.html, replace the static note with a textarea and a Marked view toggle. On Analyze Note call analyze() from engine.js. Fill the Suggested Codes table with the same row design. Accept code adds a code to Final Codes. Dagger codes go first, asterisk codes after. Keep all Tailwind classes and the layout."
3. "Add Copy and Export .txt for the Final Codes. Remove every fake number (percentages, scores)."
4. "In trainee.html, load the cases from a JS array. Add Submit for Code Evaluation, a score, and the book rule after each answer."
5. "Parse /source into /data/icd10.json: code, title, chapter (1-22), block, inclusions, exclusions, use-additional-code, dagger or asterisk symbol. Build /data/chapters.json with all 22 chapters."
6. "Validate: print the code count per chapter, list codes with missing titles, and show 30 random codes with the source page. Stop and wait for me."
7. "Replace the sample K, S and S2 data in engine.js with /data files, loaded with fetch. Keep negation, past-history, dagger/asterisk and query behaviour."
8. "Add a Code Book page with a 22-chapter sidebar and search, in the same style."
9. "Write a README, push to GitHub and make it ready for Vercel as a static site."

## Test after prompt 7
Paste 20 de-identified notes. Compare with a senior coder. Fix mismatches by adding index terms, not by hard-coding.
