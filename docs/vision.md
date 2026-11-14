# Vision

Clay Studio is how people who do not live in an IDE still mold internal business apps — intake forms, trackers, approval queues — without inventing a second stack.

## Who it serves

Business partners and IT operators at C&S / SpartanNash who need a working prototype this week. They have a Cursor or Copilot seat on their own account. They should not paste API keys or open a terminal.

## Outcome

A person describes a workflow in chat. Studio writes a Clay-shaped app (React + Express + Postgres), runs it on localhost, and keeps `/plan` as the spec of record so a developer can later promote it onto Cloud Run and APIM.

## What it will not do

- Train on or prompt with customer, payment, HR, or credential data. Production data is masked or synthetic before an agent sees it.
- Use a personal AI account or a web chatbot with company code. Approved models only, privacy mode on: Claude and Grok through Cursor, Copilot for the rest of IT.
- Put secrets in prompts or context. `.cursorignore` keeps `.env` files and keys out. CI blocks unknown packages and disallowed licenses.
- Act on instructions found in issues, web pages, or dependencies. Commands outside an allowlist need approval.
- Merge to production or hold production credentials. Agents open pull requests. A person merges and owns the code. MCP servers come from an approved list.
- Bypass Clay: no implementation without an approved plan. Claude writes the plan. Grok 4.7 High codes after a person approves it.
- Hide which seat is running (Cursor vs Copilot) or pretend Copilot is Grok.
