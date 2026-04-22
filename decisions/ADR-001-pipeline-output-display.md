# ADR-001: Pipeline Output Display

**Status:** ✅ Accepted
**Date:** 2026-04-22
**Decided by:** Dipanshu

---

## Decision

Each bot's output streams into the chat UI as it completes, one by one,
in real time. The user sees the pipeline working live — Persona Bot
output appears first, then Technical Bot, etc. The final Content
Formatting Bot output (the proposal) is the last item in the chat.

## Alternatives considered

**Option A — Spinner until final output only:** Simpler to build.
Rejected because it breaks the mental model users already have from the
current ai-chatkit.hestalabs.com interface. Users expect to see the
pipeline running.

## Consequences

- Requires server-sent events (SSE) or a streaming API route — not a
  simple fire-and-wait POST.
- Each bot call must flush its output to the client as soon as it
  completes, before the next bot starts.
- UI must handle incremental append of chat messages, not a single
  render at the end.
- Adds complexity to Phase 2 (Pipeline Engine) and Phase 3 (Chat UI)
  but is the right UX decision for this user base.
