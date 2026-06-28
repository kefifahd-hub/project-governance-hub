# Project Governance Hub — Claude Instructions

This repository contains the **PMO Hub app** — a React/Vite app built with Base44
(`src/`, `base44/`) — plus the project context needed for any Claude session to
continue work without relying on prior chat history.

> **New session? Read `docs/PROJECT_STATE.md` first.** It records what has been
> built, the current state, and the outstanding actions. A Claude session does not
> remember previous conversations — this file and `docs/PROJECT_STATE.md` are the
> memory.

## The app

React + Vite + Base44 SDK. Pages live in `src/pages/` and are auto-registered in
`src/pages.config.js`; shared UI in `src/components/`. Build with `npm install &&
npm run build`. The app is still fully dependent on the Base44 backend
(`src/api/base44Client.js`, `base44.entities.*`) — no migration off Base44 has
happened in code.

## The owner's knowledge bases (the "Brains")

The owner's long-term governance/PMO knowledge lives OUTSIDE this repo, in their
Google Drive, in a folder named **"Claude Brain"** (Personal Brain, Governance
Brain, and an Owner-Firm IP area). The operating rules are in **BRAIN MANUAL v3**
in that folder; if several versions exist, follow the highest number.

If the Google Drive connector is available and the task involves the owner's
knowledge, projects, or governance practices: open the latest
`INDEX — Governance Brain — …` and the BRAIN MANUAL, and follow it. All brain
documents use neutral aliases (Client-A, Client-B, Project-Alpha, Site-US-1,
Owner, …). **Never write real client names, people's names, or identifiers into
this repository or any brain document.**

## The governance framework in the app

The "Battery Industrialisation Processes" framework (workstreams 2.1–2.9, formerly
called "2.0") is modelled in `src/components/processframework/` and surfaced by the
`src/pages/IndustrialisationProcesses.jsx` page. It maps each workstream to its
quality gate (QG0–QG8) and to the platform module that operates it.
