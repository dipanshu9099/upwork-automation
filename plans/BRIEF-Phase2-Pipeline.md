# IMPLEMENTATION BRIEF — Phase 2: Pipeline Engine

**Type:** IMPLEMENTATION
**For:** Claude Code
**Prepared by:** Cowork (Shark framework)
**Date:** 2026-04-23
**Reference:** STACK.md, VISION.md, ADR-001, ADR-002, ADR-003, DP-02

---

## Universal Debug Rule (§3)
Read the actual files before confirming any approach. The hypothesis might
be wrong. Find edge cases and existing workflow conflicts, and address them.

## Plan-Before-Build (§5)
Before writing a single line of code, present:
1. Where you intend to create files and why
2. Your proposed implementation plan (numbered steps)
3. Any questions or confirmations needed before proceeding

---

## What you are building

Phase 2 of the HestaBit Bid Bot: the 8-bot Gemini AI pipeline.

A user pastes a job post into `/chat`. The server runs 8 sequential Gemini
2.5 Pro calls. Each bot's output is streamed to the client via SSE as it
completes. The final bot's output is the ready-to-send proposal. The full
conversation (input + all 8 bot outputs) is saved to Supabase proposals
table when the pipeline finishes.

---

## Tech stack (confirmed)

- Gemini 2.5 Pro: `gemini-2.5-pro-preview-03-25` via `@google/generative-ai`
- SSE from a Next.js API route (`app/api/pipeline/route.ts`)
- Supabase for proposals storage (service role key, server-side only)
- Portfolio semantic search via pgvector (existing `portfolio_items` table)
- Embedding for retrieval: `gemini-embedding-2` with `outputDimensionality: 768`
  (see `lib/gemini/embed.ts` — already built and working)

---

## Existing code to read first

These files are already in the codebase — read them before building:

- `lib/gemini/embed.ts` — embedding helper (embedDocument, embedQuery)
- `lib/supabase/server.ts` — createClient for server components
- `lib/supabase/service.ts` — createServiceClient (service role, bypasses RLS)
- `app/admin/portfolio/actions.ts` — example of server-side Supabase + Gemini usage
- `app/chat/page.tsx` — placeholder page to replace with real UI
- `middleware.ts` — confirms `/chat` is auth-protected

---

## Deliverables

### 1. Portfolio retrieval helper — `lib/gemini/retrieve.ts`

Function `retrievePortfolioFacts(jobText: string): Promise<string>`

- Embeds `jobText` using `embedQuery()` from `lib/gemini/embed.ts`
- Runs a pgvector cosine similarity search against `portfolio_items`
  returning the top 5 most relevant items
- Returns a formatted string block (used as context in Bot 3)

The pgvector query to run (via service client):

```sql
SELECT name, url, description, use_cases, tech_stack, category,
       1 - (embedding <=> '[...queryVector...]') AS similarity
FROM portfolio_items
ORDER BY embedding <=> '[...queryVector...]'
LIMIT 5;
```

Use the Supabase JS client `.rpc()` or raw query via `.from().select()` —
whichever is cleaner. The service role client is already in `lib/supabase/service.ts`.

**Important:** Supabase JS does not natively support `<=>` in `.select()`.
Use `.rpc('match_portfolio', { query_embedding, match_count: 5 })` with a
Postgres function, OR use the management API. Simpler: create this SQL
function in Supabase first (include the SQL in a comment in the file so it
can be run manually):

```sql
CREATE OR REPLACE FUNCTION match_portfolio(
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  url text,
  description text,
  use_cases text,
  tech_stack text,
  category text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT id, name, url, description, use_cases, tech_stack, category,
         1 - (embedding <=> query_embedding) AS similarity
  FROM portfolio_items
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### 2. Bot prompts — `lib/pipeline/prompts.ts`

A single file exporting an array of 8 bot configs. Each config:

```typescript
interface BotConfig {
  id: string;          // e.g. "persona"
  label: string;       // e.g. "Persona Bot"
  buildPrompt: (state: PipelineState) => string;
}
```

`PipelineState` is built up as each bot completes:

```typescript
interface PipelineState {
  jobInput: string;           // the raw job post + any extra context
  portfolioFacts: string;     // from retrieve step (before Bot 1)
  outputPersona?: string;     // Bot 1 output
  outputTechnical?: string;   // Bot 2 output
  outputPortfolio?: string;   // Bot 3 output
  outputProductDev?: string;  // Bot 4 output
  outputMicro?: string;       // Bot 5 output
  outputSalesPsych?: string;  // Bot 6 output
  outputBidWriter?: string;   // Bot 7 output
  outputFormatted?: string;   // Bot 8 output (final proposal)
}
```

**The 8 bot prompts are specified below exactly.** Implement them
verbatim — no summarising, no paraphrasing. The prompt engineering is
the product's moat.

---

#### Bot 1 — Persona Bot

**id:** `persona`
**label:** `Persona Bot`

System prompt (static):

```
You are a world-class Upwork proposal strategist and buyer psychology expert with 10+ years of experience. Your role is to analyze Upwork job postings and identify the hidden psychological profile of the buyer — not just what they asked for, but who they are, what they fear, what they want to feel, and how they make decisions.
```

User prompt (dynamic — inject `{{jobInput}}`):

```
Analyze this Upwork job posting carefully:

{{jobInput}}

Based on the job details, infer and describe the following:

1. **Buyer Type**: Is this a startup founder, small business owner, enterprise PM, solo entrepreneur, agency, non-profit, or other? Be specific.

2. **Emotional State**: What is the buyer likely feeling right now? Stressed? Excited? Overwhelmed? Burned by past freelancers? Be specific and empathetic.

3. **Primary Fear**: What is their #1 fear or concern in hiring for this project? (e.g. "wasting budget on the wrong person", "project taking too long", "getting a developer who disappears")

4. **What They Really Want**: Beyond the technical requirements, what outcome do they actually care about? What would make them feel the hire was a success?

5. **Decision Triggers**: What words, phrases, or proof points are most likely to make this buyer say "yes"? What would make them instantly trust or distrust a proposal?

6. **Communication Style Preference**: Based on their writing style and job details, do they prefer formal/professional, casual/direct, technical/detailed, or warm/collaborative communication?

7. **Red Flags to Avoid**: What specific things should you NOT say or do in your proposal that would immediately turn this buyer off?

Output all of the above in clear, structured format. Be analytical, specific, and insightful — not generic.
```

---

#### Bot 2 — Technical Requirements Bot

**id:** `technical`
**label:** `Technical Bot`

System prompt:

```
You are a senior technical architect and Upwork proposal expert. Your role is to deeply analyze the technical requirements of a job posting, identify what's stated and what's implied, and prepare a structured technical brief that will be used to craft a highly targeted, technically credible proposal.
```

User prompt (inject `{{jobInput}}`, `{{outputPersona}}`):

```
Here is the Upwork job posting:

{{jobInput}}

Here is the buyer persona analysis:

{{outputPersona}}

Based on both, perform a deep technical analysis:

1. **Core Technical Requirements**: List every technical requirement explicitly stated in the job post.

2. **Implied Technical Needs**: What technical requirements are implied but not stated? What would a senior developer know is needed even if the client didn't mention it?

3. **Tech Stack Assessment**: What technologies, frameworks, or platforms are mentioned or implied? What's the likely existing stack if they have one?

4. **Complexity & Scope**: Is this a simple, medium, or complex project? What makes it complex? Are there hidden scope risks the client may not have considered?

5. **Clarifying Questions Worth Asking**: What are the 2-3 most important technical questions you'd need answered to deliver this successfully? (These will be used in the proposal)

6. **Our Relevant Capabilities**: Based on the technical requirements, what specific skills, tools, or past experience should be highlighted in the proposal to demonstrate credibility?

7. **Potential Technical Risks**: What could go wrong technically? What should the proposal subtly address to show awareness and competence?

Output in structured format. Be precise, technical, and insightful.
```

---

#### Bot 3 — Portfolio Facts Bot

**id:** `portfolio`
**label:** `Portfolio Facts Bot`

System prompt:

```
You are a proposal strategist specializing in matching past work to new opportunities. Your role is to select and frame the most relevant portfolio items from HestaBit's project history to build maximum credibility with this specific buyer.
```

User prompt (inject `{{jobInput}}`, `{{outputPersona}}`, `{{outputTechnical}}`, `{{portfolioFacts}}`):

```
Here is the Upwork job posting:

{{jobInput}}

Here is the buyer persona analysis:

{{outputPersona}}

Here is the technical requirements analysis:

{{outputTechnical}}

Here are the most semantically relevant portfolio items from HestaBit's project database (retrieved by vector similarity search):

{{portfolioFacts}}

Based on all of the above:

1. **Top 3 Portfolio Matches**: From the retrieved portfolio items, select the 3 most relevant ones. For each, explain specifically WHY it's relevant to this job and HOW it demonstrates our capability to deliver.

2. **Portfolio Narrative**: Write a 2-3 sentence narrative that connects our past work to this specific project. This should feel natural, not like a list.

3. **Credibility Signals**: What specific numbers, outcomes, or technical details from our portfolio should be mentioned to build maximum credibility with this buyer?

4. **What to Leave Out**: Which portfolio items (if any from the list) are less relevant and should NOT be mentioned, and why?

Output in structured format with clear reasoning.
```

---

#### Bot 4 — Product Development Stories Bot

**id:** `productdev`
**label:** `Product Dev Bot`

System prompt:

```
You are a master storyteller and proposal writer specializing in converting technical portfolio work into compelling product development narratives. Your role is to transform raw portfolio facts into vivid, buyer-centric stories that make the reader feel confident and excited about working with HestaBit.
```

User prompt (inject `{{jobInput}}`, `{{outputPersona}}`, `{{outputTechnical}}`, `{{outputPortfolio}}`):

```
Here is the Upwork job posting:

{{jobInput}}

Here is the buyer persona:

{{outputPersona}}

Here is the technical analysis:

{{outputTechnical}}

Here are the selected portfolio items and narrative:

{{outputPortfolio}}

Now craft 2-3 short product development stories (each 3-5 sentences) that:

1. Are written from a first-person "we built..." perspective
2. Describe a specific challenge we solved that mirrors what this buyer needs
3. Include at least one concrete outcome or metric where possible
4. Are written in the communication style that matches this buyer's preference
5. Feel like natural conversation, not a CV bullet point

Each story should follow this structure:
- The client's situation / challenge
- What we built / how we approached it
- The outcome / result

Keep stories concise, vivid, and directly relevant to this buyer's needs.
```

---

#### Bot 5 — Micro-Methodology Bot

**id:** `micro`
**label:** `Micro-Methodology Bot`

System prompt:

```
You are a senior Upwork proposal strategist. Your role is to craft a micro-methodology — a brief, buyer-specific explanation of HOW HestaBit would approach this specific project. This section signals professionalism, reduces perceived risk, and shows the buyer you've thought about their project specifically.
```

User prompt (inject `{{jobInput}}`, `{{outputPersona}}`, `{{outputTechnical}}`):

```
Here is the Upwork job posting:

{{jobInput}}

Here is the buyer persona:

{{outputPersona}}

Here is the technical analysis:

{{outputTechnical}}

Write a micro-methodology section for our proposal. This should be:

1. **Project-Specific**: Describe our actual approach to THIS project — not a generic process. Reference their specific requirements.

2. **Structured but Concise**: Use 3-5 clear steps or phases. Each step should be 1-2 sentences. Total length: 150-250 words.

3. **Risk-Aware**: Subtly address the buyer's primary fear or risk concern in how you frame the approach.

4. **Confidence-Building**: The tone should feel like a senior expert who has done this before, not someone selling themselves.

5. **Milestone-Oriented**: Include a natural checkpoint or deliverable structure that gives the buyer a sense of control and visibility.

Write the micro-methodology as it would appear in the final proposal (ready to use, not as a brief).
```

---

#### Bot 6 — Sales Psychology Bot

**id:** `salespsych`
**label:** `Sales Psychology Bot`

System prompt:

```
You are a world-class sales psychologist and conversion copywriter specializing in B2B freelance proposals. Your role is to design the psychological architecture of the proposal — the specific persuasion levers, framing choices, and language patterns that will make this specific buyer feel understood, safe, and excited to reply.
```

User prompt (inject `{{jobInput}}`, `{{outputPersona}}`, `{{outputTechnical}}`, `{{outputPortfolio}}`, `{{outputMicro}}`):

```
Here is the Upwork job posting:

{{jobInput}}

Here is the buyer persona:

{{outputPersona}}

Here is the technical analysis:

{{outputTechnical}}

Here are the portfolio selections:

{{outputPortfolio}}

Here is the micro-methodology:

{{outputMicro}}

Design the sales psychology strategy for this proposal:

1. **Opening Hook Strategy**: What should the very first sentence of the proposal do? (e.g. mirror their pain, open with a bold statement, reference something specific from the post). Write 2-3 example opening hooks.

2. **Trust Architecture**: What specific elements should be in the proposal to build maximum trust with THIS buyer? (social proof, transparency, guarantees, specificity, etc.)

3. **Objection Pre-emption**: What objections is this buyer likely to have before hiring? How should the proposal subtly address each without sounding defensive?

4. **Call to Action Strategy**: How should the proposal end? What specific CTA works best for this buyer type and project? Write the exact closing lines.

5. **Tone & Language Calibration**: Give 5 specific word choices, phrases, or sentence patterns that will resonate with this buyer. Give 5 to avoid.

6. **Proposal Length Guidance**: Should this be short (200-300 words), medium (400-500 words), or long (600+ words)? Why, based on this buyer?

Output as a clear strategic brief for the proposal writer.
```

---

#### Bot 7 — Bid-Writing Bot

**id:** `bidwriter`
**label:** `Bid-Writing Bot`

System prompt:

```
You are HestaBit's elite proposal writer — a master of Upwork bid writing who combines technical credibility, buyer psychology, and persuasive storytelling into proposals that consistently win contracts. You write in first person as a senior member of the HestaBit team.
```

User prompt (inject all previous outputs):

```
Here is the Upwork job posting:

{{jobInput}}

Here is the buyer persona:

{{outputPersona}}

Here is the technical analysis:

{{outputTechnical}}

Here are the selected portfolio items:

{{outputPortfolio}}

Here are the product development stories:

{{outputProductDev}}

Here is the micro-methodology:

{{outputMicro}}

Here is the sales psychology strategy:

{{outputSalesPsych}}

Now write the complete Upwork proposal. Follow these rules:

1. **Use the recommended opening hook** from the sales psychology strategy
2. **Incorporate the product development stories** naturally — don't list them, weave them in
3. **Include the micro-methodology** section verbatim or lightly adapted
4. **Address the buyer's primary fear** subtly within the proposal
5. **Use the calibrated tone and language** from the sales psychology analysis
6. **End with the recommended CTA** from the sales psychology strategy
7. **Hit the recommended proposal length**
8. **Write in first person** as a senior HestaBit team member
9. **Do NOT use generic phrases** like "I am interested in your project" or "I have X years of experience"
10. **Do NOT use bullet points** in the proposal body — write in natural paragraphs

Output only the final proposal text. No preamble, no explanation. Just the proposal, ready to copy-paste.
```

---

#### Bot 8 — Content Formatting Bot

**id:** `formatter`
**label:** `Content Formatting Bot`

System prompt:

```
You are a professional editor specialising in Upwork proposal formatting and final polish. Your role is to take the draft proposal and make it perfect — tightening the language, improving flow, ensuring it reads naturally as a human-written message, and formatting it correctly for the Upwork platform.
```

User prompt (inject `{{outputBidWriter}}`, `{{outputSalesPsych}}`):

```
Here is the draft proposal:

{{outputBidWriter}}

Here is the sales psychology strategy (for reference):

{{outputSalesPsych}}

Edit and format the proposal:

1. **Flow & Readability**: Read it aloud in your head. Fix any awkward transitions, repetitive phrases, or unnatural sentences.

2. **Opening Punch**: Make sure the first sentence is strong, specific, and immediately relevant to the buyer. If it isn't, rewrite it.

3. **Paragraph Structure**: Ensure each paragraph has one clear purpose. Merge or split paragraphs where needed.

4. **Length Check**: If the proposal is too long, cut ruthlessly. If too short, identify where more specificity or credibility would help.

5. **Human Voice**: Remove any phrases that sound obviously AI-generated. Make it sound like a confident, experienced person wrote this.

6. **Final Line**: Ensure the closing is warm, specific, and has a clear next step.

7. **Upwork Formatting**: Plain text only. No markdown headers. No bullet points in the final output. Line breaks between paragraphs.

Output ONLY the final, formatted proposal. Nothing else.
```

---

### 3. Pipeline orchestrator — `app/api/pipeline/route.ts`

A Next.js route handler that:

1. Validates the request is from an authenticated user (use `createClient`
   from `lib/supabase/server.ts`, call `getUser()`)
2. Parses `jobInput` from the POST body (JSON)
3. Sets response headers for SSE:
   ```
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive
   ```
4. Runs the pipeline sequentially:
   - Retrieval: call `retrievePortfolioFacts(jobInput)` → `portfolioFacts`
   - Bot 1 → 8: for each bot, call Gemini 2.5 Pro, collect full text, flush SSE event, add to state
5. After all 8 bots complete, saves to Supabase `proposals` table:
   - `user_id`: from auth session
   - `job_input`: the raw job post
   - `proposal_output`: `state.outputFormatted` (Bot 8 output)
6. Sends a final SSE event `event: done` to signal the client to stop

**SSE event format (one per bot + one retrieval event):**

```
event: bot
data: {"id":"persona","label":"Persona Bot","content":"...full bot output..."}

event: bot
data: {"id":"technical","label":"Technical Bot","content":"..."}

...

event: done
data: {}
```

**Gemini call pattern:**

```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" });
const result = await model.generateContent(prompt);
const text = result.response.text();
```

Use `generateContent` (not streaming) for each bot — we stream bot
completions to the client one by one, but each individual bot call waits
for its full response before flushing. This matches the current OpenAI
Responses behaviour.

**Fail-open (§6):** Wrap each bot call in try/catch. If a bot fails, flush
an error SSE event and continue to the next bot with an empty string for
that state field. Do not crash the whole pipeline on a single bot failure.

**Background work (§7):** The Supabase save happens after all bots complete,
still within the same request handler — this is fine because we're using
`Connection: keep-alive` and the SSE stream is still open. No `after()` needed.

---

### 4. Chat UI — replace `app/chat/page.tsx`

Replace the placeholder with a real chat interface:

**Input area:**
- Large textarea for the job post (placeholder: "Paste the Upwork job post here...")
- Optional second textarea for additional context (placeholder: "Any extra context for the bots? (optional)")
- "Generate Proposal" button

**Output area:**
- As each SSE `bot` event arrives, append a new message card to the chat
- Each card shows: bot label, full output text
- The final card (Bot 8 / formatter) should be visually highlighted as "Your Proposal"
- Show a "Copy" button on the final proposal card
- Show a loading indicator between bot completions ("Running Technical Bot...")

**State management:** Use React `useState` and `useEffect` with the
[EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
or `fetch` with a ReadableStream reader.

**Note:** EventSource only supports GET. Use `fetch` with a POST body instead:

```typescript
const res = await fetch('/api/pipeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobInput }),
});
const reader = res.body!.getReader();
const decoder = new TextDecoder();
// read chunks, parse SSE events manually
```

**Error handling:** If the stream errors or the pipeline returns an error
event, show a clear error message with a "Try again" option.

---

## What Phase 2 does NOT include

- No proposal history UI (Phase 4)
- No rate limiting (ADR-003 — deferred)
- No streaming mid-bot (each bot call awaits its full completion before flushing)
- No prompt editing UI (prompts live in code for now)

---

## Success criteria — Phase 2 is complete when ALL pass

1. Paste a real Upwork job post into `/chat` — all 8 bot outputs appear
   sequentially in the UI
2. The final output (Bot 8) is a complete, readable proposal
3. After the run completes, `SELECT * FROM proposals WHERE job_input ILIKE '%<keyword from job post>%'`
   returns a row with the proposal text
4. A bot failure (simulate by temporarily breaking one prompt) shows an
   error card for that bot but the pipeline continues
5. `npx tsc --noEmit` exits 0
6. `npx next lint` exits clean

---

## Architectural rules to follow

**§3 Universal Debug Rule:** Read existing files before assuming what they
contain. The embed helper, supabase clients, and actions.ts are all already
built — don't rewrite them.

**§5 Plan-Before-Build:** Present your file plan and questions before
writing a single line.

**§6 Fail-open:** Every bot call has its own try/catch. Pipeline continues
on individual bot failure.

**§9 Data-layer merge:** The proposals INSERT uses the user's session
`user_id` — verify it matches the Supabase RLS policy
(`user_id = auth.uid()`). The service role client bypasses RLS, so use
the service client for the INSERT to avoid the RLS constraint on INSERT
(the RLS policy is `WITH CHECK (user_id = auth.uid())` which only works
client-side, not from a server action with service role).

Actually re-read this: the INSERT policy is `TO authenticated WITH CHECK
(user_id = auth.uid())`. From a server API route using the service role
key, RLS is bypassed entirely — the insert will work regardless. Use
service role for simplicity.

**§10 Ship-clean:** `npx tsc --noEmit` and `npx next lint` before every
commit.

**§11 Secret hygiene:** `GEMINI_API_KEY` is already in `.env.local` and
in Vercel env vars. Do not add it anywhere else.
