# /ingest — Clean and file inbox documents into the brains

Process every file currently in `brain/inbox/` through the following workflow.

## 1. Inventory

List the files in `brain/inbox/` (ignore `.gitkeep`). If empty, tell the user and stop.

## 2. For each file

1. **Read it** (convert/extract text as needed).
2. **Classify it**: PMO / project governance content goes to `brain/governance/`
   (use or create a fitting subfolder: `processes/`, `templates/`, `reports/`,
   `lessons-learned/`, `risks/`, `decisions/`); everything else goes to
   `brain/personal/`. If genuinely ambiguous, ask the user.
3. **Anonymize it** following the rules in the repo `CLAUDE.md`:
   - Load `brain/_private/mapping.md` first and reuse existing aliases.
   - Clients/companies → `Client-A`, `Client-B`, …
   - Projects → `Project-Alpha`, `Project-Beta`, …
   - People → role aliases (`PM-1`, `Sponsor-1`, `Engineer-2`, …)
   - Contract/employee/invoice/tender numbers and similar IDs → `[ID-REDACTED]`
   - Emails, phones, addresses → `[CONTACT-REDACTED]`
   - Keep dates, amounts, durations, and technical substance.
   - Append any NEW aliases to `brain/_private/mapping.md` in the format:
     `| Client-B | <real name> | client | 2026-06-11 |`
4. **Write the cleaned document** as Markdown into the target brain, named
   `YYYY-MM-DD-short-slug.md`, with this header:

   ```markdown
   ---
   added: YYYY-MM-DD
   source-type: (report | minutes | notes | email | export | other)
   entities: Client-A, Project-Alpha, PM-1
   ---
   # Title

   **Summary:** 2–4 sentences capturing the key knowledge in this document.

   (cleaned content)
   ```

5. **Update the brain's `INDEX.md`** with a row: document link, topic, date, one-line summary.

## 3. Verify before committing

- Re-scan every file you wrote for leftover real names, emails, phone numbers, or
  ID patterns. Fix any leaks.
- Confirm `git status` shows NO files from `brain/inbox/` or `brain/_private/`
  staged (they must remain ignored).

## 4. Finish

- Show the user a table: original file → destination → aliases applied.
- Ask whether to delete the processed originals from `brain/inbox/` (recommend yes,
  reminding them the raw file is not in git so deletion is final unless they have a copy).
- Commit the new brain documents and index updates with message
  `brain: ingest N documents into <personal|governance>` and push.
