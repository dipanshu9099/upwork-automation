# [prompt-name].md

**Purpose:** [1 sentence. What this prompt does in the product. E.g. "Generates a personalised reply to an inbound LinkedIn message, given the prospect's profile and the most recent 3 messages in the thread."]

**Called from:** [1 line pointer — file path in the repo where this prompt is used]
**Input variables:** [list the templated variables this prompt expects]
**Output format:** [JSON structure, plain text, markdown, etc.]

---

## v[N] — YYYY-MM-DD (CURRENT)

**Changelog:** [1-2 sentences. What changed from the previous version and why.]

**Eval results:**
- Accuracy on golden set: [N%]
- Regression check against golden set: [pass / fail — list any regressed cases]
- Tone match (if applicable): [score]
- Token cost per call (input + output): [avg numbers]
- Run date: [YYYY-MM-DD]

**The prompt:**

```
[The actual prompt text. Include system message, few-shot examples, output format specification. This is the canonical copy — what's in the code should match this character-for-character.]
```

**Known failure modes:**
- [Any cases where this prompt is known to produce bad output — e.g. "struggles with non-English names in the prospect profile"]

---

## v[N-1] — YYYY-MM-DD (retired)

**Retired reason:** [1 sentence. Why this version was superseded.]

**Changelog at the time:** [what was new in this version when it shipped]

**Eval results at the time:**
- [same fields as current version]

**The prompt:**

```
[Full previous prompt text, retained for rollback and regression analysis]
```

---

## v[N-2] and older

[Move to `prompts/_archive/[prompt-name]-history.md` once there are more than 2 retired versions above. Keep only current + 1 previous in the active file.]

---

## Calibration notes

When Cowork proposes a prompt version bump:
- Eval numbers MUST be included — no "I'll run the eval later"
- Changelog must be specific ("added few-shot for negative sentiment") not vague ("improved quality")
- If eval shows regression on any golden case, version bump requires explicit owner sign-off with reason
- Previous version stays visible in this file; only v(N-2) and older get archived
