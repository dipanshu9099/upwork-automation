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

Output all of the above in clear, structured format. Be analytical, specific, and insightful — not generic.`,
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

Keep stories concise, vivid, and directly relevant to this buyer's needs.`,
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

Here is the buyer persona:

${req(state.outputPersona, "persona analysis")}

Here is the technical analysis:

${req(state.outputTechnical, "technical analysis")}

Here are the portfolio selections:

${req(state.outputPortfolio, "portfolio selection")}

Here is the micro-methodology:

${req(state.outputMicro, "micro-methodology")}

Design the sales psychology strategy for this proposal:

1. **Opening Hook Strategy**: What should the very first sentence of the proposal do? (e.g. mirror their pain, open with a bold statement, reference something specific from the post). Write 2-3 example opening hooks.

2. **Trust Architecture**: What specific elements should be in the proposal to build maximum trust with THIS buyer? (social proof, transparency, guarantees, specificity, etc.)

3. **Objection Pre-emption**: What objections is this buyer likely to have before hiring? How should the proposal subtly address each without sounding defensive?

4. **Call to Action Strategy**: How should the proposal end? What specific CTA works best for this buyer type and project? Write the exact closing lines.

5. **Tone & Language Calibration**: Give 5 specific word choices, phrases, or sentence patterns that will resonate with this buyer. Give 5 to avoid.

6. **Proposal Length Guidance**: Should this be short (200-300 words), medium (400-500 words), or long (600+ words)? Why, based on this buyer?

Output as a clear strategic brief for the proposal writer.`,
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

Here is the sales psychology strategy:

${req(state.outputSalesPsych, "sales psychology strategy")}

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

Output only the final proposal text. No preamble, no explanation. Just the proposal, ready to copy-paste.`,
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

6. **Final Line**: Ensure the closing is warm, specific, and has a clear next step.

7. **Upwork Formatting**: Plain text only. No markdown headers. No bullet points in the final output. Line breaks between paragraphs.

Output ONLY the final, formatted proposal. Nothing else.`,
  },
];
