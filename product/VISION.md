# VISION.md

**Hard cap:** 500 words. Do not exceed.
**Last reviewed:** 2026-04-22
**Owner:** Dipanshu (dipanshuupadhyay@gmail.com)

---

## What it is

A custom web application that takes a raw Upwork job post and client
details as input and produces a psychologically-calibrated, ready-to-send
proposal as output — automatically, in one run.

The system replicates and improves on an existing 8-bot sequential
pipeline (currently running on OpenAI's Responses platform) by rebuilding
it on Gemini API, with a clean frontend, proper multi-user management,
and a maintainable portfolio retrieval layer.

---

## Who it's for

**Primary user:** Dipanshu and his team at HestaBit — freelancers and
proposal writers who submit bids on Upwork on behalf of the agency.

**Secondary user:** Any Upwork freelancer or agency that Dipanshu
eventually licenses this to (future scope — not in scope for v1).

Users are non-technical operators. They paste a job post, click a button,
and receive a finished proposal. They do not configure bots, adjust
prompts, or interact with the AI pipeline directly.

---

## What it is NOT

- Not a general-purpose AI writing tool
- Not a CRM or Upwork account manager
- Not a proposal tracker or analytics dashboard
- Not a public SaaS product (v1 is internal to HestaBit only)
- Not a replacement for human review — the proposal is a draft the user
  sends; judgment on whether to send remains human

---

## What success looks like

- A HestaBit team member pastes a job post and receives a
  proposal-ready output in under 3 minutes
- Proposal quality meets or exceeds the current OpenAI pipeline output
- The system costs meaningfully less per proposal than the current
  OpenAI setup
- New portfolio items can be added by Dipanshu without developer
  involvement
- The system handles multiple concurrent users without proposals
  cross-contaminating

---

## Why now

Two things changed simultaneously: Gemini 2.5 Pro reached competitive
reasoning quality at lower cost than GPT-5/5.4, and the current OpenAI
platform (platform.openai.com Responses) is a no-code environment that
limits control, observability, and cost management. Moving to a custom
build gives full control over the pipeline, the portfolio layer, the
user management, and the hosting cost.

The existing prompt engineering (8 bots, ~3,000+ lines of instructions)
is the moat. The rebuild preserves it exactly and adds infrastructure
around it.

---

## The core insight

Most Upwork proposals fail not because of bad writing but because they
are not calibrated to the specific buyer's psychology, fears, and
decision logic. This system runs a structured analysis of the buyer
before a single word of the proposal is written — and that analysis
drives every decision downstream: what to say, what to avoid, how many
questions to ask, which portfolio items to surface, and how warm or
technical to sound.

The output is not generic AI writing. It is a psychologically-targeted
message designed for one specific buyer.
