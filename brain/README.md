# Brain — Personal Knowledge System

This folder is a two-part "second brain" maintained with Claude Code.

## How it works

```
brain/
├── inbox/        ← DROP YOUR RAW FILES HERE (never committed to git)
├── personal/     ← Brain #1: general/personal knowledge (anonymized, committed)
├── governance/   ← Brain #2: PMO Hub / project governance knowledge (anonymized, committed)
└── _private/     ← alias mapping (real name ↔ placeholder), local only, never committed
```

## Daily use

1. **Add knowledge**: drop any file (notes, reports, minutes, exports, emails saved
   as text) into `brain/inbox/`, then run `/ingest` in Claude Code. Claude will:
   - read each file,
   - strip or replace client names, people's names, IDs, and contact details with
     neutral placeholders (`Client-A`, `PM-1`, `[ID-REDACTED]`, …),
   - file the cleaned document into `personal/` or `governance/`,
   - update that brain's `INDEX.md`,
   - record the placeholder mapping in `_private/mapping.md`,
   - delete the raw file from the inbox once you confirm.

2. **Use knowledge**: just ask Claude anything — it reads the brain indexes
   automatically (instructed via the repo's `CLAUDE.md`) and pulls the relevant
   documents into context. Examples:
   - "What were the recurring risks across my projects?"
   - "Draft a stage-gate checklist based on my governance brain."
   - "Summarize the lessons learned from Project-Alpha."

3. **De-anonymize locally**: when you need real names back, the mapping in
   `brain/_private/mapping.md` translates placeholders to real entities. This file
   stays on your machine only.

## Why anonymize?

The cleaned brains are committed to GitHub so they persist across Claude Code
sessions and devices. Anonymization means no confidential client data, personal
data, or identifiers ever leave your machine — only the neutral knowledge does.

## Note on how Claude "learns"

Claude doesn't permanently train on your files. Instead, these folders ARE the
memory: every session, Claude reads the indexes and relevant documents fresh.
The better organized and summarized the brain, the smarter Claude is about your
work — that's why `/ingest` also writes a summary header on each document.
