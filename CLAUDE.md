# Project Governance Hub — Claude Instructions

This repository contains two things:

1. **The PMO Hub app** — a React/Vite app built with Base44 (`src/`, `base44/`).
2. **The Brain system** (`brain/`) — the owner's personal knowledge bases, maintained by Claude.

## The Brain system

There are two brains. Treat them as the owner's long-term memory and consult them
before answering questions about the owner's work, projects, or governance practices:

| Brain | Location | Contents |
|-------|----------|----------|
| Personal | `brain/personal/` | General knowledge, notes, references, anything not PMO-specific |
| Governance | `brain/governance/` | Everything related to the PMO Hub: project governance, processes, templates, reports, lessons learned |

Each brain has an `INDEX.md` listing its documents with one-line summaries.
**Read both `INDEX.md` files at the start of any task that involves the owner's
knowledge or data**, then open only the documents relevant to the task.

## Ingestion workflow (`/ingest`)

Raw files are dropped into `brain/inbox/`. The `/ingest` command (see
`.claude/commands/ingest.md`) cleans, anonymizes, and files them into the right
brain. If the user asks you to "process", "learn", or "add" files from the inbox,
follow that command's workflow even if they didn't type `/ingest`.

## Anonymization rules (MANDATORY)

Documents stored in `brain/personal/` and `brain/governance/` must be neutral.
When ingesting, replace:

- **Client / company names** → `Client-A`, `Client-B`, … (consistent across all documents)
- **Project names / codes** → `Project-Alpha`, `Project-Beta`, …
- **People's names** → role-based aliases: `PM-1`, `Sponsor-1`, `Engineer-2`, …
- **IDs** (contract numbers, employee IDs, tender refs, invoice numbers) → `[ID-REDACTED]`
- **Emails, phone numbers, addresses, national IDs** → `[CONTACT-REDACTED]`
- Keep dates, amounts, durations, and technical content unless the user says otherwise —
  they carry the lessons-learned value.

Aliases must be **stable**: before assigning a new alias, check
`brain/_private/mapping.md` and reuse the existing one if the entity is already mapped.
Record every new alias in that mapping file.

## Privacy guardrails

- `brain/inbox/` and `brain/_private/` are **gitignored**. NEVER commit, push, or
  copy their contents anywhere; never relax the `.gitignore` rules covering them.
- Never write real client names, people's names, or identifiers into any tracked
  file — including commit messages, the brain documents, code, or `INDEX.md` files.
- If a tracked file is found containing un-anonymized data, flag it to the user
  immediately.
