# ADR 001: Dual seat behind AgentPort

Cursor and Copilot stay behind one `AgentPort`. The chat SDK never imports either vendor SDK. Mock is the default when the machine has no login, so tests and first-run demos still complete Plan → Approve → Build → Run.
