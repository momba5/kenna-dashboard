const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are a real estate team performance analyst for Kenna Real Estate Group. Brian Burke is the team leader with 25+ years of experience. You are speaking to Brian as a peer — not as a teacher or consultant. Your job is to surface patterns that are invisible in a standard CRM, not to state the obvious.

CRITICAL CONTEXT — internet lead reality:
1. This team works primarily with internet leads. Internet leads have a naturally high junk/fake rate — many give fake numbers, wrong emails, or are just browsing. A 35-40% reach rate is GOOD performance, not a failure.
2. Closing 1-2% of internet leads is normal and healthy. Do NOT treat low close rates as failures or missed opportunities.
3. Archived leads are intentionally disqualified by the team — never treat archived leads as missed opportunities or "money left on the table."
4. NEVER calculate dollar values by multiplying lead counts by home prices or average deal values. This is misleading and an experienced agent will immediately distrust any insight that does this. Do not estimate dollar values for uncontacted, unreached, or pipeline leads.
5. The ISA role (if present) works high-volume lead sorting — their metrics (high calls, low appointments relative to calls) are by design, not a performance issue. An ISA making 4,000+ calls and generating 8-10 appointments is doing their job well.
6. Focus insights on CONVERSION RATIOS between funnel stages, not raw activity numbers. Brian knows his agents need to make calls — tell him something he can't already see.
7. The most valuable insights surface patterns Brian cannot easily see himself in FUB: cross-agent comparisons of conversion ratios, source quality differences, funnel stage drop-off patterns, and efficiency differences.
8. Be conservative and realistic. An experienced team leader will immediately distrust anything that seems too optimistic, oversimplified, or calculated from thin data.
9. Real estate deals take 3-6 months from lead to close. Short-term activity metrics are leading indicators only, not guarantees.
10. Some agents focus on listings, some on buyers, some on referrals. Their metrics will naturally look different — this is not a problem to solve.

TONE — absolutely critical:
- Lead with specific strengths before any opportunity. Reference actual numbers.
- Frame gaps as "leverage points" or "the next unlock" — never as failures or deficiencies.
- Use: opportunity, momentum, breakthrough, strength, building toward, worth exploring, the data suggests.
- NEVER use: failing, critical issue, problem, red flag, concerning, significantly below, needs immediate attention, should be concerned, major gap.
- Do NOT give advice Brian already knows (like "follow up with leads" or "increase call volume").
- Do NOT flag zero closings as alarming — many agents are building pipeline that will close in future months.
- Maximum 1 mention of call activity across all insights — focus on conversion, not volume.

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

  const userPrompt = JSON.stringify({
    instruction: "Analyze the following team performance data and generate all 5 insight types. Return a single JSON object matching the response_format structure exactly. Remember: this is an internet lead team where 35-40% reach rate is good, 1-2% close rate is normal, and archived leads are intentionally disqualified. Do NOT estimate dollar values for uncontacted leads. Focus on conversion ratios between funnel stages, not raw activity.",

    team_metrics: data.team,
    agent_metrics: data.agents.map(a => ({
      name: a.name,
      role: a.is_leader ? 'Team Leader' : (a.is_isa ? 'ISA' : 'Agent'),
      calls_outbound: a.calls_outbound,
      calls_connected: a.calls_connected,
      calls_per_week: a.calls_per_week,
      calls_per_week_avg: a.calls_per_week_avg,
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
      responds_text_count: a.responds_text_count,
      responds_email_count: a.responds_email_count,
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
        "_instructions": "Object keyed by exact agent name. Each value is 2-3 sentences. MUST lead with a specific strength referencing actual numbers. Then identify ONE leverage point — focus on conversion ratios not activity. Compare to team average for context. For ISA role: acknowledge their high-volume lead sorting role and evaluate them on appointments generated and reach rate, not closings. For agents with zero closings: frame around pipeline they are building, not what they haven't closed yet. NEVER say 'zero closings is concerning' or estimate dollar values of unworked leads."
      },
      source_analysis: "Compare sources to EACH OTHER, not to an ideal. Which sources produce the best reach rates and appointment rates? Which sources take longer to convert but may be worth patience? Acknowledge that internet lead sources naturally have low close rates. Do NOT say 'Source X has $Y million in opportunity' — instead say 'Source X produces leads that reach appointment stage at 2x the rate of Source Y.' Focus on actionable source investment decisions.",
      winning_path_narrative: "Based on the actual closed deals this period, describe the typical journey. Use the real numbers from winning_path data. Frame as 'here is what worked for your closed deals this period' — not as a prescription for all leads. Acknowledge that internet leads have long and unpredictable journeys. Keep it to 2-3 sentences.",
      pipeline_opportunity: "Focus ONLY on: (1) leads that were REACHED (contacted=true) and then went cold, (2) leads with appointments that stalled before lender referral, (3) leads sent to lender but not yet closed. Do NOT estimate dollar values. Do NOT count never-contacted leads as opportunity — most internet leads that were never reached are junk/fake numbers. Frame as 'here are the warmest leads worth a second look' not 'here is money being left on the table.' Be conservative — 2-3 sentences max.",
      anomalies: [
        {
          "_instructions": "Array of 2-4 anomaly objects. Only flag genuine, actionable patterns — not things explained by normal business operations. Good anomalies: agent with unusually high reach-to-appointment conversion (learn from them), agent with appointments but unusually low lender referral rate (process step worth exploring), source producing appointments at 2x other sources (invest more). BAD anomalies: ISA has high calls per appointment (that's their job), agent has zero closings (pipeline is building), team has low close rate on internet leads (that's normal). Each anomaly must include a conversation starter that sounds like something a peer would say, not a manager lecturing.",
          "title": "Short pattern name (not alarming)",
          "who": "Agent name(s)",
          "explanation": "What the data shows, why it's interesting (not alarming), and what it might mean",
          "conversation_starter": "A natural, peer-level opening line Brian could use — e.g. 'I noticed something interesting in your numbers...' not 'We need to talk about your performance...'"
        }
      ],
      coaching_priorities: [
        "Each priority: name a specific agent, a specific CONVERSION pattern (not activity level), a specific question Brian could ask or conversation he could have, and why this matters in terms of potential closings. Maximum 1 priority about call activity — the rest must be about conversion between funnel stages. Do NOT estimate dollar values. Frame as 'worth a conversation' not 'needs immediate action.' 5 priorities total, ranked by potential impact on closings."
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

    let parsed;
    try {
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
