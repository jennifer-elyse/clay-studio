---
status: approved
title: Clay Studio chat SDK and local app builder
---

# Plan: Clay Studio v1

## Goal

Ship an embeddable chat SDK and a local host so a non-coder can sign in with Cursor or Copilot, `/plan`, approve, `/build`, and `/run` a Clay-shaped internal app on their machine.

## Approach

1. Monorepo: `apps/studio`, `packages/chat-sdk`, `packages/agent-host`, `templates/web-app`.
2. Durable agent loop (`create` + `send` + `stream` + `wait`), never one-shot prompt.
3. Shared `AgentPort` / `UiEvent` (Zod). Mock adapter for tests; Cursor and Copilot as first-class seats.
4. `/plan` writes `docs/plans/` and blocks `/build` until a human approves.
5. Preview supervisor copies the starter, runs Express + PGlite on localhost, iframes it.
6. Proof: Jest, Storybook, Playwright Plan → Approve → Build → Run.

## Out of scope

Electron packaging, Figma token import, APIM/Cloud Run deploy, team spend-cap dashboards.
