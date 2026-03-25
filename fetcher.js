const https = require('https');
const url = require('url');

const FUB_BASE = 'https://api.followupboss.com/v1';
const PAGE_LIMIT = 100;
const RATE_DELAY_MS = 100;

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fubRequest(endpoint, apiKey) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(endpoint.startsWith('http') ? endpoint : FUB_BASE + endpoint);
    const auth = Buffer.from(apiKey + ':').toString('base64');

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`FUB API ${res.statusCode}: ${data.substring(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`FUB JSON parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('FUB request timeout')); });
    req.end();
  });
}

/**
 * Paginate through a FUB endpoint using cursor-based pagination.
 * Returns all records concatenated.
 */
async function fetchAllPages(endpoint, apiKey, params = {}) {
  const records = [];
  const qp = new URLSearchParams({ limit: PAGE_LIMIT, ...params });
  let nextUrl = `${endpoint}?${qp.toString()}`;

  while (nextUrl) {
    const resp = await fubRequest(nextUrl, apiKey);
    const items = resp.people || resp.calls || resp.appointments || resp.deals ||
                  resp.users ||
                  resp.events || resp.tasks || [];
    records.push(...items);

    nextUrl = (resp._metadata && resp._metadata.nextLink) ? resp._metadata.nextLink : null;

    if (nextUrl) {
      await sleep(RATE_DELAY_MS);
    }

    // Log progress for long pulls
    if (records.length % 1000 === 0 && records.length > 0) {
      console.log(`  ... pulled ${records.length} records from ${endpoint}`);
    }
  }

  console.log(`  Fetched ${records.length} records from ${endpoint}`);
  return records;
}

/**
 * Try fetching an endpoint; return empty array if 404 or error.
 */
async function tryFetchAllPages(endpoint, apiKey, params = {}) {
  try {
    return await fetchAllPages(endpoint, apiKey, params);
  } catch (err) {
    console.warn(`  Endpoint ${endpoint} unavailable: ${err.message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main data fetch + metric computation
// ---------------------------------------------------------------------------
async function fetchAllData(config) {
  const apiKey = process.env.FUB_API_KEY;
  if (!apiKey) throw new Error('FUB_API_KEY environment variable is required');

  const periodDays = config.period_days || 90;
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const sinceStr = since.toISOString().split('T')[0];

  console.log(`Fetching FUB data for last ${periodDays} days (since ${sinceStr})...`);

  // Step 1: Fetch all users
  console.log('Pulling /users...');
  const users = await fetchAllPages('/users', apiKey);

  // Step 2: Fetch all people (leads) created in period
  console.log('Pulling /people...');
  const people = await fetchAllPages('/people', apiKey, { sort: 'created', 'created[gte]': sinceStr });

  // Step 3: Fetch all calls in period
  console.log('Pulling /calls (this may take several minutes)...');
  const calls = await fetchAllPages('/calls', apiKey, { sort: 'created', 'created[gte]': sinceStr });

  // Step 4: Fetch all appointments in period
  console.log('Pulling /appointments...');
  const appointments = await fetchAllPages('/appointments', apiKey, { sort: 'created', 'created[gte]': sinceStr });

  // Step 5: Fetch all deals
  console.log('Pulling /deals...');
  const deals = await fetchAllPages('/deals', apiKey);

  // Speed to lead uses outbound calls only — /textMessages and /emails
  // require per-person queries and /notes returns 168K+ records.
  // All three are skipped; earliest outbound call is used instead.

  // Build computed metrics
  console.log('Computing metrics...');
  return computeMetrics({ users, people, calls, appointments, deals }, config);
}

// ---------------------------------------------------------------------------
// Metric computation
// ---------------------------------------------------------------------------
function computeMetrics(raw, config) {
  const { users, people, calls, appointments, deals } = raw;
  const periodDays = config.period_days || 90;
  const thresholds = config.thresholds || {};
  const targets = config.targets || {};
  const isaRoleNames = (config.isa_role_names || []).map(r => r.toLowerCase());
  const staleDays = thresholds.stale_lead_days || 30;
  const weeks = periodDays / 7;
  const months = periodDays / 30;
  const now = Date.now();

  // ---- Build agent map from users ----
  const agentMap = {};
  for (const u of users) {
    if (u.isActive === false) continue;
    const role = (u.role || '').toLowerCase();
    const title = (u.title || '').toLowerCase();
    const isIsa = isaRoleNames.some(r => role.includes(r) || title.includes(r));
    const isLeader = role.includes('admin') || role.includes('owner');

    agentMap[u.id] = {
      id: u.id,
      name: u.name || u.email || `User ${u.id}`,
      email: u.email,
      role: u.role,
      is_isa: isIsa,
      is_leader: isLeader,
      // Activity
      calls_outbound: 0, calls_inbound: 0, calls_connected: 0, talk_seconds: 0,
      // Leads
      leads_assigned: 0, leads_reached: 0,
      never_called_count: 0, never_responded_count: 0,
      responds_text_count: 0, responds_email_count: 0,
      // Conversion
      appointments_set: 0, quality_leads: 0, lender_sent: 0,
      closed_deals: 0, closed_value: 0, closed_commission: 0, pending_deals: 0,
      // Pipeline
      stage_distribution: {},
      pipeline_active_count: 0,
      stale_leads_count: 0,
      // Speed to lead tracking
      _lead_speeds: [],
      // Source tracking
      _source_data: {},
      // Closed deal journey tracking
      _closed_journeys: [],
    };
  }

  // ---- Index calls by personId for quick lookup ----
  const callsByPerson = {};
  const callsByAgent = {};
  for (const c of calls) {
    const pid = c.personId;
    const uid = c.userId;
    if (pid) {
      if (!callsByPerson[pid]) callsByPerson[pid] = [];
      callsByPerson[pid].push(c);
    }
    if (uid) {
      if (!callsByAgent[uid]) callsByAgent[uid] = [];
      callsByAgent[uid].push(c);
    }
  }

  // ---- Index appointments by personId ----
  const apptsByPerson = {};
  for (const a of appointments) {
    const pid = a.personId;
    if (pid) {
      if (!apptsByPerson[pid]) apptsByPerson[pid] = [];
      apptsByPerson[pid].push(a);
    }
  }

  // ---- Index deals by personId ----
  const dealsByPerson = {};
  for (const d of deals) {
    const pid = d.personId;
    if (pid) {
      if (!dealsByPerson[pid]) dealsByPerson[pid] = [];
      dealsByPerson[pid].push(d);
    }
  }

  // ---- Index inbound calls by personId (for never_responded detection) ----
  const inboundByPerson = {};
  for (const c of calls) {
    if (c.personId && (c.type === 'inbound' || c.direction === 'inbound')) {
      inboundByPerson[c.personId] = true;
    }
  }

  // ---- Source quality tracking (global) ----
  const sourceMap = {};

  // ---- Process people (leads) ----
  for (const p of people) {
    const agentId = p.assignedTo || p.assignedUserId;
    const agent = agentMap[agentId];
    if (!agent) continue;

    agent.leads_assigned++;

    // Stage distribution
    const stage = p.stage || p.stageName || 'Unknown';
    agent.stage_distribution[stage] = (agent.stage_distribution[stage] || 0) + 1;

    // Pipeline active (not archived, not closed)
    const stageLower = stage.toLowerCase();
    if (!stageLower.includes('archive') && !stageLower.includes('closed')) {
      agent.pipeline_active_count++;
    }

    // Stale lead detection
    const lastAct = p.lastActivity || p.lastUpdated || p.updated;
    if (lastAct) {
      const daysSince = (now - new Date(lastAct).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > staleDays && !stageLower.includes('closed') && !stageLower.includes('archive')) {
        agent.stale_leads_count++;
      }
    }

    // Lender tag detection
    const tags = p.tags || [];
    const hasLenderTag = tags.some(t => (typeof t === 'string' ? t : (t.name || '')).toLowerCase().includes('lender'));
    if (hasLenderTag) {
      agent.lender_sent++;
    }

    // Check if lead was reached (has any connected outbound call)
    const personCalls = callsByPerson[p.id] || [];
    const outboundCalls = personCalls.filter(c => c.type === 'outbound' || c.direction === 'outbound');
    const connectedCalls = outboundCalls.filter(c => c.duration > 0);
    const hasOutbound = outboundCalls.length > 0;
    const hasConnected = connectedCalls.length > 0;

    if (hasConnected) {
      agent.leads_reached++;
    }

    // Never called
    if (!hasOutbound) {
      agent.never_called_count++;
    }

    // Never responded (no inbound activity)
    if (!inboundByPerson[p.id]) {
      agent.never_responded_count++;
    }

    // Responds by text / email — not available without per-person API calls
    // These counts remain at 0; can be enabled if FUB adds global endpoints

    // Quality lead (has 1+ appointment)
    const personAppts = apptsByPerson[p.id] || [];
    if (personAppts.length > 0) {
      agent.quality_leads++;
    }

    // Appointments count
    agent.appointments_set += personAppts.length;

    // Deals
    const personDeals = dealsByPerson[p.id] || [];
    for (const d of personDeals) {
      const dStage = (d.stage || d.stageName || '').toLowerCase();
      if (dStage.includes('closed')) {
        agent.closed_deals++;
        agent.closed_value += parseFloat(d.price) || 0;
        agent.closed_commission += parseFloat(d.commission) || 0;
      } else if (!dStage.includes('lost') && !dStage.includes('dead')) {
        agent.pending_deals++;
      }
    }

    // Speed to lead — find earliest outbound call
    const leadCreated = new Date(p.created || p.dateCreated);
    let earliestOutbound = null;

    for (const c of outboundCalls) {
      const cDate = new Date(c.created || c.dateCreated);
      if (!earliestOutbound || cDate < earliestOutbound) earliestOutbound = cDate;
    }

    if (earliestOutbound && earliestOutbound > leadCreated) {
      const speedMin = (earliestOutbound - leadCreated) / (1000 * 60);
      agent._lead_speeds.push(speedMin);
    }

    // Source quality tracking
    const source = p.source || p.sourceType || 'Untagged';
    const srcKey = source.trim() || 'Untagged';

    if (!sourceMap[srcKey]) {
      sourceMap[srcKey] = {
        source: srcKey,
        lead_count: 0, reached_count: 0, appointments: 0,
        lender_sent: 0, closings: 0, closed_value: 0, revenue_per_lead: 0, close_rate_pct: 0
      };
    }
    sourceMap[srcKey].lead_count++;
    if (hasConnected) sourceMap[srcKey].reached_count++;
    sourceMap[srcKey].appointments += personAppts.length;
    if (hasLenderTag) sourceMap[srcKey].lender_sent++;

    for (const d of personDeals) {
      const dStage = (d.stage || d.stageName || '').toLowerCase();
      if (dStage.includes('closed')) {
        sourceMap[srcKey].closings++;
        sourceMap[srcKey].closed_value += parseFloat(d.price) || 0;
      }
    }

    // Per-agent source tracking
    if (!agent._source_data[srcKey]) {
      agent._source_data[srcKey] = { source: srcKey, lead_count: 0, closings: 0, closed_value: 0 };
    }
    agent._source_data[srcKey].lead_count++;
    for (const d of personDeals) {
      const dStage = (d.stage || d.stageName || '').toLowerCase();
      if (dStage.includes('closed')) {
        agent._source_data[srcKey].closings++;
        agent._source_data[srcKey].closed_value += parseFloat(d.price) || 0;
      }
    }

    // Closed deal journey tracking (for winning path)
    for (const d of personDeals) {
      const dStage = (d.stage || d.stageName || '').toLowerCase();
      if (dStage.includes('closed')) {
        const journey = {
          lead_created: leadCreated,
          speed_to_contact_min: earliestOutbound && earliestOutbound > leadCreated
            ? (earliestOutbound - leadCreated) / (1000 * 60) : null,
          calls_to_connect: 0,
          first_appt_date: null,
          days_to_appointment: null,
          lender_tag: hasLenderTag,
          close_date: new Date(d.closedAt || d.updated || d.created),
          days_lender_to_close: null,
          source: srcKey
        };

        // Calls before first connection
        const sortedOutbound = outboundCalls.sort((a, b) => new Date(a.created) - new Date(b.created));
        let callsBeforeConnect = 0;
        for (const c of sortedOutbound) {
          callsBeforeConnect++;
          if (c.duration > 0) break;
        }
        journey.calls_to_connect = callsBeforeConnect;

        // First appointment date
        if (personAppts.length > 0) {
          const sortedAppts = [...personAppts].sort((a, b) =>
            new Date(a.startDate || a.created) - new Date(b.startDate || b.created));
          journey.first_appt_date = new Date(sortedAppts[0].startDate || sortedAppts[0].created);
          journey.days_to_appointment = (journey.first_appt_date - leadCreated) / (1000 * 60 * 60 * 24);
        }

        // Days from lender to close (if lender tagged)
        if (hasLenderTag && journey.close_date) {
          // Approximate: use midpoint of period as lender referral date estimate
          // In reality we'd need lender tag date, but FUB doesn't track tag-added dates
          // So we estimate based on appointment date → close date
          if (journey.first_appt_date) {
            journey.days_lender_to_close = (journey.close_date - journey.first_appt_date) / (1000 * 60 * 60 * 24);
          }
        }

        agent._closed_journeys.push(journey);
      }
    }
  }

  // ---- Process calls for agent-level counts ----
  for (const c of calls) {
    const agent = agentMap[c.userId];
    if (!agent) continue;

    const isOutbound = c.type === 'outbound' || c.direction === 'outbound';
    const isInbound = c.type === 'inbound' || c.direction === 'inbound';

    if (isOutbound) agent.calls_outbound++;
    if (isInbound) agent.calls_inbound++;
    if ((c.duration || 0) > 0) {
      agent.calls_connected++;
      agent.talk_seconds += c.duration || 0;
    }
  }

  // ---- Compute derived per-agent metrics ----
  const allJourneys = [];
  const agentList = [];

  for (const agent of Object.values(agentMap)) {
    // Time-based rates
    agent.talk_hours = Math.round((agent.talk_seconds / 3600) * 10) / 10;
    agent.calls_per_week = Math.round(agent.calls_outbound / weeks);
    agent.conversations_per_week = Math.round(agent.calls_connected / weeks);
    agent.calls_vs_target_pct = agent.is_isa
      ? (targets.calls_per_week_isa > 0 ? Math.round(agent.calls_per_week / targets.calls_per_week_isa * 100) : 0)
      : (targets.calls_per_week_agent > 0 ? Math.round(agent.calls_per_week / targets.calls_per_week_agent * 100) : 0);

    // Conversion rates
    agent.reach_rate_pct = agent.leads_assigned > 0
      ? Math.round(agent.leads_reached / agent.leads_assigned * 1000) / 10 : 0;
    agent.quality_rate_pct = agent.leads_assigned > 0
      ? Math.round(agent.quality_leads / agent.leads_assigned * 1000) / 10 : 0;
    agent.lender_referral_rate_pct = agent.appointments_set > 0
      ? Math.round(agent.lender_sent / agent.appointments_set * 1000) / 10 : 0;

    // Efficiency
    agent.calls_per_appointment = agent.appointments_set > 0
      ? Math.round(agent.calls_outbound / agent.appointments_set) : null;
    agent.leads_per_closing = agent.closed_deals > 0
      ? Math.round(agent.leads_assigned / agent.closed_deals) : null;
    agent.appointments_per_closing = agent.closed_deals > 0
      ? Math.round(agent.appointments_set / agent.closed_deals) : null;

    // Speed to lead
    agent.speed_to_lead_avg_minutes = agent._lead_speeds.length > 0
      ? Math.round(agent._lead_speeds.reduce((a, b) => a + b, 0) / agent._lead_speeds.length * 10) / 10
      : null;

    // Top sources
    agent.top_sources = Object.values(agent._source_data)
      .sort((a, b) => b.lead_count - a.lead_count)
      .slice(0, 5);

    // Collect journeys
    allJourneys.push(...agent._closed_journeys);

    // Clean up internal tracking fields
    delete agent._lead_speeds;
    delete agent._source_data;
    delete agent._closed_journeys;

    agentList.push(agent);
  }

  // ---- Compute source quality stats ----
  const sources = Object.values(sourceMap).map(s => {
    s.close_rate_pct = s.lead_count > 0 ? Math.round(s.closings / s.lead_count * 1000) / 10 : 0;
    s.revenue_per_lead = s.lead_count > 0 ? Math.round(s.closed_value / s.lead_count) : 0;
    return s;
  });

  // ---- Compute team-wide metrics ----
  const team = {
    leads_assigned: agentList.reduce((s, a) => s + a.leads_assigned, 0),
    leads_reached: agentList.reduce((s, a) => s + a.leads_reached, 0),
    calls_outbound: agentList.reduce((s, a) => s + a.calls_outbound, 0),
    calls_connected: agentList.reduce((s, a) => s + a.calls_connected, 0),
    talk_hours: Math.round(agentList.reduce((s, a) => s + a.talk_hours, 0) * 10) / 10,
    appointments_set: agentList.reduce((s, a) => s + a.appointments_set, 0),
    lender_sent: agentList.reduce((s, a) => s + a.lender_sent, 0),
    closed_deals: agentList.reduce((s, a) => s + a.closed_deals, 0),
    closed_value: agentList.reduce((s, a) => s + a.closed_value, 0),
    closed_commission: agentList.reduce((s, a) => s + a.closed_commission, 0),
    pending_deals: agentList.reduce((s, a) => s + a.pending_deals, 0),
    pipeline_active_count: agentList.reduce((s, a) => s + a.pipeline_active_count, 0),
    stale_leads_count: agentList.reduce((s, a) => s + a.stale_leads_count, 0),
    never_called_count: agentList.reduce((s, a) => s + a.never_called_count, 0),
  };

  // Team rates
  team.reach_rate_pct = team.leads_assigned > 0
    ? Math.round(team.leads_reached / team.leads_assigned * 1000) / 10 : 0;
  team.quality_rate_pct = team.leads_assigned > 0
    ? Math.round(agentList.reduce((s, a) => s + a.quality_leads, 0) / team.leads_assigned * 1000) / 10 : 0;
  team.lender_referral_rate_pct = team.appointments_set > 0
    ? Math.round(team.lender_sent / team.appointments_set * 1000) / 10 : 0;
  team.lead_to_close_pct = team.leads_assigned > 0
    ? Math.round(team.closed_deals / team.leads_assigned * 1000) / 10 : 0;
  team.lead_to_close_per_100 = team.leads_assigned > 0
    ? Math.round(team.closed_deals / team.leads_assigned * 100 * 10) / 10 : 0;

  // Law of averages
  team.leads_per_closing = team.closed_deals > 0 ? Math.round(team.leads_assigned / team.closed_deals) : null;
  team.calls_per_appointment = team.appointments_set > 0 ? Math.round(team.calls_outbound / team.appointments_set) : null;
  team.appointments_per_closing = team.closed_deals > 0 ? Math.round(team.appointments_set / team.closed_deals) : null;
  team.lender_refs_per_closing = team.closed_deals > 0 ? Math.round(team.lender_sent / team.closed_deals) : null;

  // Weekly averages (per agent, excluding ISAs for agent metrics)
  const agentsOnly = agentList.filter(a => !a.is_isa);
  const agentCount = agentsOnly.length || 1;
  team.calls_per_week_avg = Math.round(agentsOnly.reduce((s, a) => s + a.calls_per_week, 0) / agentCount);
  team.conversations_per_week_avg = Math.round(agentsOnly.reduce((s, a) => s + a.conversations_per_week, 0) / agentCount);

  // Speed to lead team average
  const allSpeeds = agentList.filter(a => a.speed_to_lead_avg_minutes != null).map(a => a.speed_to_lead_avg_minutes);
  team.speed_to_lead_avg = allSpeeds.length > 0
    ? Math.round(allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length * 10) / 10 : null;

  // Current week calls (approximate: last 7 days of calls)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  team.calls_outbound_this_week = calls.filter(c =>
    (c.type === 'outbound' || c.direction === 'outbound') &&
    new Date(c.created || c.dateCreated) >= weekAgo
  ).length;

  // ---- Winning path from closed journeys ----
  const winningPath = computeWinningPath(allJourneys);

  // ---- Pipeline opportunity buckets ----
  const pipeline = computePipelineOpportunity(people, callsByPerson, apptsByPerson, dealsByPerson, thresholds);

  // ---- Compute badges ----
  computeBadges(agentList, team);

  return {
    agents: agentList,
    team,
    sources,
    winningPath,
    pipeline,
    periodDays,
    agentCount: agentList.length,
  };
}

// ---------------------------------------------------------------------------
// Winning path computation
// ---------------------------------------------------------------------------
function computeWinningPath(journeys) {
  if (journeys.length === 0) {
    return {
      avg_speed_to_contact_min: null,
      avg_calls_to_connect: null,
      avg_days_to_appointment: null,
      avg_appts_to_lender: null,
      avg_days_lender_to_close: null,
      top_source_closed: null,
      sample_size: 0
    };
  }

  const speeds = journeys.filter(j => j.speed_to_contact_min != null).map(j => j.speed_to_contact_min);
  const callsToConnect = journeys.map(j => j.calls_to_connect).filter(v => v > 0);
  const daysToAppt = journeys.filter(j => j.days_to_appointment != null).map(j => j.days_to_appointment);
  const daysLenderToClose = journeys.filter(j => j.days_lender_to_close != null).map(j => j.days_lender_to_close);

  // Top source
  const sourceCounts = {};
  for (const j of journeys) {
    sourceCounts[j.source] = (sourceCounts[j.source] || 0) + 1;
  }
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];

  // Appts to lender: count of journeys with lender tag / total
  const lenderCount = journeys.filter(j => j.lender_tag).length;

  return {
    avg_speed_to_contact_min: avg(speeds),
    avg_calls_to_connect: avg(callsToConnect),
    avg_days_to_appointment: avg(daysToAppt),
    avg_appts_to_lender: journeys.length > 0 && lenderCount > 0
      ? Math.round(journeys.filter(j => j.first_appt_date).length / lenderCount * 10) / 10 : null,
    avg_days_lender_to_close: avg(daysLenderToClose),
    top_source_closed: topSource ? topSource[0] : null,
    sample_size: journeys.length
  };
}

function avg(arr) {
  if (!arr || arr.length === 0) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10;
}

// ---------------------------------------------------------------------------
// Pipeline opportunity
// ---------------------------------------------------------------------------
function computePipelineOpportunity(people, callsByPerson, apptsByPerson, dealsByPerson, thresholds) {
  const staleDays = thresholds.stale_lead_days || 30;
  const now = Date.now();

  // Estimate average deal value from closed deals for pipeline valuation
  let totalClosedValue = 0;
  let closedCount = 0;
  for (const personDeals of Object.values(dealsByPerson)) {
    for (const d of personDeals) {
      const stage = (d.stage || d.stageName || '').toLowerCase();
      if (stage.includes('closed')) {
        totalClosedValue += parseFloat(d.price) || 0;
        closedCount++;
      }
    }
  }
  const avgDealValue = closedCount > 0 ? totalClosedValue / closedCount : 300000;

  let neverContacted = { count: 0, value: 0 };
  let reachedNoAppt = { count: 0, value: 0 };
  let apptNoLender = { count: 0, value: 0 };
  let lenderNotClosed = { count: 0, value: 0 };
  let staleCount = 0;

  for (const p of people) {
    const stage = (p.stage || p.stageName || '').toLowerCase();
    if (stage.includes('closed') || stage.includes('archive')) continue;

    const personCalls = callsByPerson[p.id] || [];
    const outboundCalls = personCalls.filter(c => c.type === 'outbound' || c.direction === 'outbound');
    const connectedCalls = outboundCalls.filter(c => c.duration > 0);
    const personAppts = apptsByPerson[p.id] || [];
    const tags = p.tags || [];
    const hasLender = tags.some(t => (typeof t === 'string' ? t : (t.name || '')).toLowerCase().includes('lender'));

    const leadValue = parseFloat(p.price) || avgDealValue * 0.02; // 2% estimated close rate

    // Stale check
    const lastAct = p.lastActivity || p.lastUpdated || p.updated;
    if (lastAct) {
      const daysSince = (now - new Date(lastAct).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > staleDays) staleCount++;
    }

    if (outboundCalls.length === 0) {
      neverContacted.count++;
      neverContacted.value += leadValue;
    } else if (connectedCalls.length === 0 && personAppts.length === 0) {
      // Attempted but never reached, no appointment
      reachedNoAppt.count++;
      reachedNoAppt.value += leadValue;
    } else if (connectedCalls.length > 0 && personAppts.length === 0) {
      reachedNoAppt.count++;
      reachedNoAppt.value += leadValue;
    } else if (personAppts.length > 0 && !hasLender) {
      apptNoLender.count++;
      apptNoLender.value += leadValue;
    } else if (hasLender) {
      // Has lender tag but not closed (we already filtered closed above)
      lenderNotClosed.count++;
      lenderNotClosed.value += leadValue;
    }
  }

  return {
    never_contacted_count: neverContacted.count,
    never_contacted_value: Math.round(neverContacted.value),
    reached_no_appt_count: reachedNoAppt.count,
    reached_no_appt_value: Math.round(reachedNoAppt.value),
    appt_no_lender_count: apptNoLender.count,
    appt_no_lender_value: Math.round(apptNoLender.value),
    lender_not_closed_count: lenderNotClosed.count,
    lender_not_closed_value: Math.round(lenderNotClosed.value),
    stale_leads_count: staleCount
  };
}

// ---------------------------------------------------------------------------
// Badge computation
// ---------------------------------------------------------------------------
function computeBadges(agents, team) {
  const agentsOnly = agents.filter(a => !a.is_isa && !a.is_leader);
  const allActive = agents.filter(a => a.leads_assigned > 0);

  for (const a of agents) {
    a.badges = [];
  }

  if (agentsOnly.length === 0 && allActive.length === 0) return;

  // Gold badges (agents only, excluding ISA)
  const byClosedValue = [...agentsOnly].sort((a, b) => (b.closed_value || 0) - (a.closed_value || 0));
  if (byClosedValue.length && byClosedValue[0].closed_value > 0) {
    byClosedValue[0].badges.push({ tier: 'gold', name: 'Volume King' });
  }

  const teamQualityRate = team.quality_rate_pct || 0;
  for (const a of allActive) {
    if (a.quality_rate_pct > teamQualityRate && a.quality_rate_pct > 0) {
      a.badges.push({ tier: 'gold', name: 'Quality Machine' });
    }
  }

  const byClosedDeals = [...agentsOnly].sort((a, b) => (b.closed_deals || 0) - (a.closed_deals || 0));
  if (byClosedDeals.length && byClosedDeals[0].closed_deals > 0) {
    byClosedDeals[0].badges.push({ tier: 'gold', name: 'Closing Machine' });
  }

  // Silver badges
  const byCallsOut = [...allActive].sort((a, b) => (b.calls_outbound || 0) - (a.calls_outbound || 0));
  if (byCallsOut.length && byCallsOut[0].calls_outbound > 0) {
    byCallsOut[0].badges.push({ tier: 'silver', name: 'Phone Warrior' });
  }

  const byAppts = [...allActive].sort((a, b) => (b.appointments_set || 0) - (a.appointments_set || 0));
  if (byAppts.length && byAppts[0].appointments_set > 0) {
    byAppts[0].badges.push({ tier: 'silver', name: 'Appointment Setter' });
  }

  const withCPA = allActive.filter(a => a.calls_per_appointment != null && a.calls_per_appointment > 0);
  const byCPA = [...withCPA].sort((a, b) => a.calls_per_appointment - b.calls_per_appointment);
  if (byCPA.length) {
    byCPA[0].badges.push({ tier: 'silver', name: 'Speed Demon' });
  }

  const byLender = [...allActive].sort((a, b) => (b.lender_sent || 0) - (a.lender_sent || 0));
  if (byLender.length && byLender[0].lender_sent > 0) {
    byLender[0].badges.push({ tier: 'silver', name: 'Lender Connector' });
  }

  // Bronze badges
  const byReach = [...allActive].sort((a, b) => (b.reach_rate_pct || 0) - (a.reach_rate_pct || 0));
  if (byReach.length && byReach[0].reach_rate_pct > 0) {
    byReach[0].badges.push({ tier: 'bronze', name: 'Reach Master' });
  }

  const byPipeline = [...allActive].sort((a, b) => (b.pipeline_active_count || 0) - (a.pipeline_active_count || 0));
  if (byPipeline.length && byPipeline[0].pipeline_active_count > 0) {
    byPipeline[0].badges.push({ tier: 'bronze', name: 'Pipeline Builder' });
  }

  const byTalkHours = [...allActive].sort((a, b) => (b.talk_hours || 0) - (a.talk_hours || 0));
  if (byTalkHours.length && byTalkHours[0].talk_hours > 0) {
    byTalkHours[0].badges.push({ tier: 'bronze', name: 'Talk Time Champ' });
  }
}

module.exports = { fetchAllData };
