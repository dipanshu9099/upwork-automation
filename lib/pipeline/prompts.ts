import type { BotConfig, PipelineState } from "./types";

const PERSONA_SYSTEM =
  "You are a world-class Upwork proposal strategist and buyer psychology expert with 10+ years of experience. Your role is to analyze Upwork job postings and identify the hidden psychological profile of the buyer — not just what they asked for, but who they are, what they fear, what they want to feel, and how they make decisions.";

const TECHNICAL_SYSTEM =
  "You are a senior technical architect and Upwork proposal expert. Your role is to deeply analyze the technical requirements of a job posting, identify what's stated and what's implied, and prepare a structured technical brief that will be used to craft a highly targeted, technically credible proposal.";

const PORTFOLIO_SYSTEM =
  "You are a proposal strategist specializing in matching past work to new opportunities. Your role is to select and frame the most relevant portfolio items from HestaBit's project history to build maximum credibility with this specific buyer.";

const PRODUCTDEV_SYSTEM =
  "You are a master storyteller and proposal writer specializing in converting technical portfolio work into compelling product development narratives. Your role is to transform raw portfolio facts into vivid, buyer-centric stories that make the reader feel confident and excited about working with HestaBit.";

const MICRO_SYSTEM =
  "You are a senior Upwork proposal strategist. Your role is to craft a micro-methodology — a brief, buyer-specific explanation of HOW HestaBit would approach this specific project. This section signals professionalism, reduces perceived risk, and shows the buyer you've thought about their project specifically.";

const SALESPSYCH_SYSTEM =
  "You are a world-class sales psychologist and conversion copywriter specializing in B2B freelance proposals. Your role is to design the psychological architecture of the proposal — the specific persuasion levers, framing choices, and language patterns that will make this specific buyer feel understood, safe, and excited to reply.";

const BIDWRITER_SYSTEM =
  "You are HestaBit's elite proposal writer — a master of Upwork bid writing who combines technical credibility, buyer psychology, and persuasive storytelling into proposals that consistently win contracts. You write in first person as a senior member of the HestaBit team.";

const FORMATTER_SYSTEM =
  "You are a professional editor specialising in Upwork proposal formatting and final polish. Your role is to take the draft proposal and make it perfect — tightening the language, improving flow, ensuring it reads naturally as a human-written message, and formatting it correctly for the Upwork platform.";

function req(value: string | undefined, field: string): string {
  if (!value || value.trim().length === 0) {
    return `(missing ${field})`;
  }
  return value;
}

export const BOTS: BotConfig[] = [
  {
    id: "persona",
    label: "Persona Bot",
    systemPrompt: PERSONA_SYSTEM,
    stateKey: "outputPersona",
    buildUserPrompt: (state: PipelineState) => `Analyze this Upwork job posting carefully:

${state.jobInput}

Based on the job details, infer and describe the following:

1. **Buyer Type**: Is this a startup founder, small business owner, enterprise PM, solo entrepreneur, agency, non-profit, or other? Be specific.

2. **Emotional State**: What is the buyer likely feeling right now? Stressed? Excited? Overwhelmed? Burned by past freelancers? Be specific and empathetic.

3. **Primary Fear**: What is their #1 fear or concern in hiring for this project? (e.g. "wasting budget on the wrong person", "project taking too long", "getting a developer who disappears")

4. **What They Really Want**: Beyond the technical requirements, what outcome do they actually care about? What would make them feel the hire was a success?

5. **Decision Triggers**: What words, phrases, or proof points are most likely to make this buyer say "yes"? What would make them instantly trust or distrust a proposal?

6. **Communication Style Preference**: Based on their writing style and job details, do they prefer formal/professional, casual/direct, technical/detailed, or warm/collaborative communication?

7. **Red Flags to Avoid**: What specific things should you NOT say or do in your proposal that would immediately turn this buyer off?

Output all of the above in clear, structured format. Be analytical, specific, and insightful — not generic.

Output must include these additional scored fields at the end:

PMF SCORES (1-10): Score each primary motivational factor from the job post.
  PMF1: [factor] — [score]/10
  PMF2: [factor] — [score]/10
  (list all identified PMFs)

FEAR SCORES (1-10): Score each fear from the job post.
  Fear1: [fear] — [score]/10
  Fear2: [fear] — [score]/10
  (list all identified fears)

AMBIGUITY TOLERANCE: [score]/10 — [one-line justification]
RISK APPETITE: [score]/10 — [one-line justification]
DECISION STYLE: Primary=[style], Secondary=[style] — [one-line justification]
ATTENTION BIAS: [what they scan for first] — [evidence from the post]`,
  },
  {
    id: "technical",
    label: "Technical Bot",
    systemPrompt: TECHNICAL_SYSTEM,
    stateKey: "outputTechnical",
    buildUserPrompt: (state: PipelineState) => `Here is the Upwork job posting:

${state.jobInput}

Here is the buyer persona analysis:

${req(state.outputPersona, "persona analysis")}

Based on both, perform a deep technical analysis:

1. **Core Technical Requirements**: List every technical requirement explicitly stated in the job post.

2. **Implied Technical Needs**: What technical requirements are implied but not stated? What would a senior developer know is needed even if the client didn't mention it?

3. **Tech Stack Assessment**: What technologies, frameworks, or platforms are mentioned or implied? What's the likely existing stack if they have one?

4. **Complexity & Scope**: Is this a simple, medium, or complex project? What makes it complex? Are there hidden scope risks the client may not have considered?

5. **Clarifying Questions Worth Asking**: What are the 2-3 most important technical questions you'd need answered to deliver this successfully? (These will be used in the proposal)

6. **Our Relevant Capabilities**: Based on the technical requirements, what specific skills, tools, or past experience should be highlighted in the proposal to demonstrate credibility?

7. **Potential Technical Risks**: What could go wrong technically? What should the proposal subtly address to show awareness and competence?

Output in structured format. Be precise, technical, and insightful.`,
  },
  {
    id: "portfolio",
    label: "Portfolio Facts Bot",
    systemPrompt: PORTFOLIO_SYSTEM,
    stateKey: "outputPortfolio",
    buildUserPrompt: (state: PipelineState) => `Here is the Upwork job posting:

${state.jobInput}

Here is the buyer persona analysis:

${req(state.outputPersona, "persona analysis")}

Here is the technical requirements analysis:

${req(state.outputTechnical, "technical analysis")}

Here are the most semantically relevant portfolio items from HestaBit's project database (retrieved by vector similarity search):

${state.portfolioFacts}

Based on all of the above:

1. **Top 3 Portfolio Matches**: From the retrieved portfolio items, select the 3 most relevant ones. For each, explain specifically WHY it's relevant to this job and HOW it demonstrates our capability to deliver.

2. **Portfolio Narrative**: Write a 2-3 sentence narrative that connects our past work to this specific project. This should feel natural, not like a list.

3. **Credibility Signals**: What specific numbers, outcomes, or technical details from our portfolio should be mentioned to build maximum credibility with this buyer?

4. **What to Leave Out**: Which portfolio items (if any from the list) are less relevant and should NOT be mentioned, and why?

Output in structured format with clear reasoning.`,
  },
  {
    id: "productdev",
    label: "Product Dev Bot",
    systemPrompt: PRODUCTDEV_SYSTEM,
    stateKey: "outputProductDev",
    buildUserPrompt: (state: PipelineState) => `Here is the Upwork job posting:

${state.jobInput}

Here is the buyer persona:

${req(state.outputPersona, "persona analysis")}

Here is the technical analysis:

${req(state.outputTechnical, "technical analysis")}

Here are the selected portfolio items and narrative:

${req(state.outputPortfolio, "portfolio selection")}

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

Also produce ONE industry story (2-3 sentences) that is NOT from our portfolio:
- Describe a real-world pattern or failure mode relevant to this project
- Frame it as "teams working on [domain] often find..." or "a common challenge in [domain] is..."
- Do NOT claim this as our work
- Make the lesson directly relevant to the buyer's primary fear
- This is used ONLY if the portfolio proof is weak; Bot 6 decides

Label it clearly:
INDUSTRY STORY (not our work):
[story here]`,
  },
  {
    id: "micro",
    label: "Micro-Methodology Bot",
    systemPrompt: MICRO_SYSTEM,
    stateKey: "outputMicro",
    buildUserPrompt: (state: PipelineState) => `Here is the Upwork job posting:

${state.jobInput}

Here is the buyer persona:

${req(state.outputPersona, "persona analysis")}

Here is the technical analysis:

${req(state.outputTechnical, "technical analysis")}

Write a micro-methodology section for our proposal. This should be:

1. **Project-Specific**: Describe our actual approach to THIS project — not a generic process. Reference their specific requirements.

2. **Structured but Concise**: Use 3-5 clear steps or phases. Each step should be 1-2 sentences. Total length: 150-250 words.

3. **Risk-Aware**: Subtly address the buyer's primary fear or risk concern in how you frame the approach.

4. **Confidence-Building**: The tone should feel like a senior expert who has done this before, not someone selling themselves.

5. **Milestone-Oriented**: Include a natural checkpoint or deliverable structure that gives the buyer a sense of control and visibility.

Write the micro-methodology as it would appear in the final proposal (ready to use, not as a brief).`,
  },
  {
    id: "salespsych",
    label: "Sales Psychology Bot",
    systemPrompt: SALESPSYCH_SYSTEM,
    stateKey: "outputSalesPsych",
    buildUserPrompt: (state: PipelineState) => `Here is the Upwork job posting:

${state.jobInput}

Here is the buyer persona analysis with scores:

${req(state.outputPersona, "persona analysis")}

Here is the technical analysis:

${req(state.outputTechnical, "technical analysis")}

Here are the selected portfolio items:

${req(state.outputPortfolio, "portfolio selection")}

Here is the micro-methodology:

${req(state.outputMicro, "micro-methodology")}

Here are the product development stories and industry story:

${req(state.outputProductDev, "product development stories")}

Produce a precise execution blueprint for the Bid-Writing Bot.
Output as structured fields. Each field is a direct instruction.

FIELD 0 — OPENING HOOK
Write 3 candidate opening hooks (one sentence each). Each must:
- Start with the buyer's #1 fear or consequence, not with "I" or "we"
- Be completable in ~12 words (Upwork preview limit)
- Create a knowledge gap (hint at a solution without giving it)
Then write: SELECTED HOOK: [which one and why in one line]

FIELD 1 — EMOTIONAL TONE
Desired feel: [2-3 words]
Avoid: [2-3 specific things to avoid]
Reason: [one line tied to persona scores]

FIELD 2 — REFLECTION RULES
How to open the proposal body (after greeting + hook):
- Mirror these exact buyer phrases: [list 3-5 phrases from the job post verbatim]
- First sentence must be about THEM not us
- Forbidden: meta-compliments about the brief ("great project", "interesting challenge")
- Reflection length: [compact 2-4 lines / medium 1 paragraph / skip]

FIELD 2B — CONTENT ORDERING
Front-load (put early): [ordered bullet list]
Delay (put later or omit): [bullet list]
Hard avoid (never include): [bullet list]
Line-selling rule: [one sentence — what each line must do to earn the next]

FIELD 3 — QUESTION STRATEGY
Number of questions: [1 or 2]
For each question:
  - Internal topic: [the real technical/business question]
  - Buyer-facing phrasing: [exact question text to use]
  - Why it matters to buyer: [one line]
Tone: [soft / direct / outcome-protecting]

FIELD 4 — MICRO-METHOD DEPLOYMENT
Include micro-method: [Yes / No / Condensed to one line]
If yes: emotional job it must do: [one line]
Where in proposal: [early / middle / before questions]

FIELD 5 — PROOF STRATEGY
Primary proof: [portfolio item name + URL if available]
Buyer-benefit clause: [exact 1-sentence frame: "This shows X which means Y for your project"]
Industry story: [include / suppress]
If include: [which story and where]
Coexistence rule: [can portfolio + story both appear? yes/no — why]

FIELD 6 — CLOSING LINE
Write the exact closing line(s) for the proposal.
Requirements:
- Warm but direct — not "if helpful" or "feel free"
- References the questions asked
- Has a clear next step
- Max 2 sentences

FIELD 7 — IDEA BUDGET
Calculation:
  Top PMF score: [score] → base blocks: [N]
  Ambiguity tolerance: [score] → cap: [N]
  Top Fear score: [score] → adjustment: [+0 / cap further]
  MAX IDEA BLOCKS: [final number — never exceed 5]

FIELD 8 — HARD RED LINES FOR BOT 7
List 6-10 absolute prohibitions for the Bid-Writing Bot.
Each must be specific and actionable (not generic like "be concise").
Examples of the right level of specificity:
- "Do not include a step-by-step phase plan — reads as task-only delivery to this buyer"
- "Do not open with 'I' — Upwork preview will show it; hook must lead"
- "Do not use 'if helpful' or 'feel free' — weak framing for this buyer type"

FIELD 9 — BLOCK PLAN
Allocate the MAX IDEA BLOCKS from Field 7 across the proposal:
Block 1: [what it must contain]
Block 2: [what it must contain]
Block 3: [what it must contain — if budget allows]
(etc.)

Suppression order if crowded (which blocks to cut first):
1. [first to cut]
2. [second to cut]
Never cut: [what must always stay]

FIELD 10 — LENGTH AND FORMAT
Target word count: [number range]
Paragraph structure: [how many paragraphs, rough purpose of each]
Line breaks: [where to use them — Upwork plain text]
Forbidden formatting: [markdown headers / bullet points / bold]`,
  },
  {
    id: "bidwriter",
    label: "Bid-Writing Bot",
    systemPrompt: BIDWRITER_SYSTEM,
    stateKey: "outputBidWriter",
    buildUserPrompt: (state: PipelineState) => `Here is the Upwork job posting:
${state.jobInput}

Here is the buyer persona:
${req(state.outputPersona, "persona analysis")}

Here is the technical analysis:
${req(state.outputTechnical, "technical analysis")}

Here are the selected portfolio items:
${req(state.outputPortfolio, "portfolio selection")}

Here are the product development stories:
${req(state.outputProductDev, "product development stories")}

Here is the micro-methodology:
${req(state.outputMicro, "micro-methodology")}

Here is the sales psychology execution blueprint:
${req(state.outputSalesPsych, "sales psychology blueprint")}

Write the complete Upwork proposal. Follow the execution blueprint
field by field — it is your strict specification, not a suggestion.

MANDATORY RULES:
1. Line 1 is the greeting (Hi / Hi [name] / Hi [company] team)
2. Line 2 embeds FIELD 0 SELECTED HOOK — exactly as written or
   lightly adapted. Do not bury it.
3. Follow FIELD 2 REFLECTION RULES — mirror buyer phrases exactly,
   first sentence about them, no meta-compliments
4. Follow FIELD 2B CONTENT ORDERING — front-load what it says,
   delay what it says, never include what it prohibits
5. Include FIELD 5 PRIMARY PROOF with the exact buyer-benefit clause
   from the blueprint
6. Include / suppress industry story per FIELD 5 coexistence rule
7. Ask FIELD 3 QUESTIONS — use the buyer-facing phrasing exactly
8. End with FIELD 6 CLOSING LINE — use it verbatim or lightly adapted.
   Never use "if helpful", "feel free", or passive CTAs.
9. Stay within FIELD 7 MAX IDEA BLOCKS — do not exceed it
10. Obey every item in FIELD 8 HARD RED LINES — no exceptions
11. Follow FIELD 9 BLOCK PLAN — allocate content exactly as specified
12. Hit FIELD 10 TARGET WORD COUNT — cut or expand accordingly
13. Write in first person as a senior HestaBit team member
14. No bullet points in the proposal body — natural paragraphs only
15. Plain text only — no markdown, no headers, no bold

Output ONLY the final proposal. No preamble, no labels, no explanation.`,
  },
  {
    id: "formatter",
    label: "Content Formatting Bot",
    systemPrompt: FORMATTER_SYSTEM,
    stateKey: "outputFormatted",
    buildUserPrompt: (state: PipelineState) => `Here is the draft proposal:

${req(state.outputBidWriter, "draft proposal")}

Here is the sales psychology strategy (for reference):

${req(state.outputSalesPsych, "sales psychology strategy")}

Edit and format the proposal:

1. **Flow & Readability**: Read it aloud in your head. Fix any awkward transitions, repetitive phrases, or unnatural sentences.

2. **Opening Punch**: Make sure the first sentence is strong, specific, and immediately relevant to the buyer. If it isn't, rewrite it.

3. **Paragraph Structure**: Ensure each paragraph has one clear purpose. Merge or split paragraphs where needed.

4. **Length Check**: If the proposal is too long, cut ruthlessly. If too short, identify where more specificity or credibility would help.

5. **Human Voice**: Remove any phrases that sound obviously AI-generated. Make it sound like a confident, experienced person wrote this.

5b. **CLOSING LINE CHECK**: The last 1-2 sentences must be direct and warm. If you see "if helpful", "feel free to", "don't hesitate", or "I'd be happy to" — rewrite the closing to be active and specific. The closing should name the next step, not offer one passively.

5c. **WHAT-WON'T-GO-WRONG AUDIT**: If the proposal has a paragraph explaining what will not go wrong or what risks are covered, it must be no longer than 3 sentences. Cut anything beyond 3 sentences from that block ruthlessly. Quality over quantity.

5d. **IDEA DENSITY CHECK**: If more than 4 distinct concepts appear in the proposal, identify the weakest one and cut it entirely. A sharper, shorter proposal wins over a comprehensive one.

5e. **PROOF CLAUSE CHECK**: If a portfolio link appears, it must be followed immediately by a one-sentence buyer-benefit clause explaining specifically why that project is relevant. If the clause is missing or generic ("this shows our experience"), rewrite it to name the specific capability it proves.

6. **Final Line**: Ensure the closing is warm, specific, and has a clear next step.

7. **Upwork Formatting**: Plain text only. No markdown headers. No bullet points in the final output. Line breaks between paragraphs.

Output ONLY the final, formatted proposal. Nothing else.`,
  },
];
