const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are a real estate team performance analyst for Kenna Real Estate Group. Brian Burke is the team leader. Your job is to find the insights that are invisible in a standard CRM — patterns, anomalies, and leverage points that would change how Brian supports his team this week.

Tone and framing — this is critical:
- Always lead with strengths before opportunities. Frame every gap as a leverage point or next unlock, never as a failure or deficiency.
- Use words like: opportunity, momentum, breakthrough, strength, one conversation away, leverage point, next unlock.
- Avoid: failing, critical, problem, bad, worst, underperforming, behind, deficiency.
- Assume every agent is working hard and wants to improve.
- The goal is Brian walking away energized about how to help his team win — not frustrated with anyone.
- Be specific — reference actual numbers and agent names.
- Compare each agent's numbers to the team average so Brian sees context.
- Every insight must be immediately actionable — no generic advice.
- Coaching priorities must be ranked by estimated revenue impact and specific enough that Brian knows exactly who to talk to and what to say.

For per-agent coaching insights:
- ALWAYS lead with something specific the agent is doing well, referencing their actual numbers.
- Then identify the single biggest leverage point — the one behavior change that would have the most impact.
- Compare their numbers to the team average to give Brian context.
- Frame the opportunity as "the next unlock" or "one conversation away from a breakthrough."

For coaching priorities:
- Rank all 5 by estimated revenue impact (highest first).
- Each priority must name a specific agent, a specific behavior, a specific action Brian can take, and an encouraging framing.
- Brian should be able to read each priority and immediately know who to talk to, what to discuss, and how to open the conversation.

Respond with valid JSON only. No markdown code fences, no commentary outside the JSON object.`;

/**
 * Generate all 5 insight types from computed metrics via Claude API.
 * Called once per refresh (manual or cron), never on page load.
 * Results are cached in data.json by the caller.
 */
async function generateInsights(data, config) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — skipping insight generation');
    return null;
  }

  const client = new Anthropic({ apiKey });

  // Build the user prompt with all computed data
  const userPrompt = JSON.stringify({
    instruction: "Analyze the following team performance data and generate all 5 insight types. Return a single JSON object matching the response_format structure exactly.",
    team_metrics: data.team,
    agent_metrics: data.agents.map(a => ({
      name: a.name,
      role: a.is_leader ? 'Team Leader' : (a.is_isa ? 'ISA' : 'Agent'),
      calls_outbound: a.calls_outbound,
      calls_connected: a.calls_connected,
      calls_per_week: a.calls_per_week,
      conversations_per_week: a.conversations_per_week,
      talk_hours: a.talk_hours,
      leads_assigned: a.leads_assigned,
      leads_reached: a.leads_reached,
      reach_rate_pct: a.reach_rate_pct,
      appointments_set: a.appointments_set,
      quality_leads: a.quality_leads,
      quality_rate_pct: a.quality_rate_pct,
      lender_sent: a.lender_sent,
      lender_referral_rate_pct: a.lender_referral_rate_pct,
      closed_deals: a.closed_deals,
      closed_value: a.closed_value,
      pending_deals: a.pending_deals,
      calls_per_appointment: a.calls_per_appointment,
      leads_per_closing: a.leads_per_closing,
      appointments_per_closing: a.appointments_per_closing,
      speed_to_lead_avg_minutes: a.speed_to_lead_avg_minutes,
      never_called_count: a.never_called_count,
      never_responded_count: a.never_responded_count,
      stale_leads_count: a.stale_leads_count,
      pipeline_active_count: a.pipeline_active_count,
      stage_distribution: a.stage_distribution,
      top_sources: a.top_sources,
    })),
    source_data: data.sources,
    winning_path: data.winningPath,
    pipeline: data.pipeline,
    config_targets: config.targets,
    config_thresholds: config.thresholds,
    response_format: {
      agent_coaching: {
        "_description": "Object keyed by agent name. Each value is a 2-3 sentence coaching insight. MUST lead with a specific strength (with numbers), then identify the single biggest leverage point comparing to team average."
      },
      source_analysis: "Multi-paragraph analysis of source quality. Which sources produce closable leads vs just volume. Where to invest more vs reconsider. Flag if untagged leads are a significant portion and recommend improving source tagging. Surprising patterns.",
      winning_path_narrative: "Narrative describing the team's winning conversion path based on closed deals. Frame as: 'Here is what a Kenna closing looks like — this is the path your top agents are walking.' Reference the actual numbers from winning_path data.",
      pipeline_opportunity: "Narrative about where the next closings are hiding. Reference the pipeline bucket counts and estimated values. Identify the single biggest opportunity and the specific action to capture it. Frame as: 'Here is where the next closings are hiding.'",
      anomalies: [
        {
          "_description": "Array of 3-6 anomaly objects. Auto-detect: agents with strong calls but low appt conversion, agents with appts but low lender rate, very low activity vs target, leads with many calls never connected, sources with high volume but low close rate, any ratio 2x+ off team average. Frame as opportunities not failures.",
          "title": "Short pattern name",
          "who": "Agent name(s) involved",
          "explanation": "What was noticed, why it matters, encouraging framing",
          "conversation_starter": "Suggested opening line for Brian to use in a 1-on-1"
        }
      ],
      coaching_priorities: [
        "Priority 1 (highest revenue impact): Specific agent, specific behavior, specific action Brian can take, encouraging framing. Brian should know exactly who to talk to and what to say.",
        "Priority 2: ...",
        "Priority 3: ...",
        "Priority 4: ...",
        "Priority 5 (lowest revenue impact of top 5): ..."
      ]
    }
  }, null, 0);

  console.log('Calling Claude API for insights...');

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Parse the JSON response
    let parsed;
    try {
      // Strip markdown fences if Claude included them despite instructions
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Claude response as JSON:', parseErr.message);
      console.error('Raw response (first 500 chars):', text.substring(0, 500));
      return null;
    }

    // Map agent coaching insights back to agent objects
    const agentCoaching = parsed.agent_coaching || {};
    for (const agent of data.agents) {
      // Try exact name match first, then case-insensitive
      agent.coaching_insight = agentCoaching[agent.name]
        || agentCoaching[agent.name.toLowerCase()]
        || Object.entries(agentCoaching).find(([k]) =>
            k.toLowerCase() === agent.name.toLowerCase() ||
            agent.name.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(agent.name.toLowerCase())
          )?.[1]
        || null;
    }

    console.log('Claude insights generated successfully');

    return {
      sourceAnalysis: parsed.source_analysis || null,
      winningPathNarrative: parsed.winning_path_narrative || null,
      pipelineOpportunity: parsed.pipeline_opportunity || null,
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      coachingPriorities: Array.isArray(parsed.coaching_priorities) ? parsed.coaching_priorities : [],
    };

  } catch (err) {
    console.error('Claude API call failed:', err.message);
    return null;
  }
}

module.exports = { generateInsights };
