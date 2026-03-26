const https = require('https');
const fs = require('fs');
const path = require('path');

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
 * Cursor-based pagination via _metadata.nextLink.
 * Used for /calls, /appointments — offset pagination is unreliable for these.
 */
async function fetchCursor(endpoint, apiKey, params = {}) {
  const records = [];
  const qp = new URLSearchParams({ limit: PAGE_LIMIT, ...params });
  let nextUrl = `${endpoint}?${qp.toString()}`;

  while (nextUrl) {
    const resp = await fubRequest(nextUrl, apiKey);
    const items = resp.people || resp.calls || resp.appointments || resp.deals ||
                  resp.users || resp.events || [];
    records.push(...items);
    nextUrl = (resp._metadata && resp._metadata.nextLink) ? resp._metadata.nextLink : null;
    if (nextUrl) await sleep(RATE_DELAY_MS);
    if (records.length % 1000 === 0 && records.length > 0) {
      console.log(`  ... pulled ${records.length} records from ${endpoint}`);
    }
  }
  console.log(`  Fetched ${records.length} records from ${endpoint}`);
  return records;
}

/**
 * Offset-based pagination. Used for /people, /deals.
 */
async function fetchOffset(endpoint, apiKey, params = {}) {
  const records = [];
  let offset = 0;

  while (true) {
    const qp = new URLSearchParams({ limit: PAGE_LIMIT, offset, ...params });
    const resp = await fubRequest(`${endpoint}?${qp.toString()}`, apiKey);
    const items = resp.people || resp.calls || resp.appointments || resp.deals ||
                  resp.users || resp.events || [];
    records.push(...items);
    if (items.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
    await sleep(RATE_DELAY_MS);
    if (records.length % 1000 === 0 && records.length > 0) {
      console.log(`  ... pulled ${records.length} records from ${endpoint}`);
    }
  }
  console.log(`  Fetched ${records.length} records from ${endpoint}`);
  return records;
}

// ---------------------------------------------------------------------------
// Main data fetch
// ---------------------------------------------------------------------------
async function fetchAllData(config) {
  const apiKey = process.env.FUB_API_KEY;
  if (!apiKey) throw new Error('FUB_API_KEY environment variable is required');

  const periodDays = config.period_days || 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffStr = cutoff.toISOString().split('T')[0]; // e.g. 2025-12-25

  console.log(`Fetching FUB data (period: ${periodDays} days, cutoff: ${cutoffStr})...`);

  // 1. Users — single page
  console.log('Pulling /users...');
  const usersResp = await fubRequest('/users?limit=200', apiKey);
  const users = usersResp.users || [];
  console.log(`  Fetched ${users.length} users`);

  // 2. People — offset pagination, pull ALL (no date filter)
  //    Need all active pipeline leads regardless of creation date.
  //    Calls/appointments/deals are still filtered to 90-day window.
  // TODO: For multi-client scalability, convert to incremental delta pulls
  //       using the updatedAfter parameter. Store last pull timestamp and
  //       only fetch people updated since then, merging into cached data.
  //       Current full pull works fine for single-client use.
  console.log('Pulling /people (post-migration, createdAfter=2025-07-01)...');
  const people = await fetchOffset('/people', apiKey, { sort: 'created', createdAfter: '2025-07-01' });

  // 3. Calls — cursor pagination ONLY (offset caps at 2000)
  //    dateAfter param does NOT work — pull ALL calls, filter locally
  console.log('Pulling /calls (cursor pagination — may take several minutes)...');
  const allCalls = await fetchCursor('/calls', apiKey);

  // Filter calls locally to period
  const cutoffMs = cutoff.getTime();
  const calls = allCalls.filter(c => new Date(c.created).getTime() >= cutoffMs);
  console.log(`  Calls in period: ${calls.length} (filtered from ${allCalls.length})`);

  // 4. Appointments — cursor pagination
  console.log('Pulling /appointments (cursor pagination)...');
  const appointments = await fetchCursor('/appointments', apiKey);

  // 5. Deals — offset pagination (small set, ~135 records)
  console.log('Pulling /deals (offset pagination)...');
  const deals = await fetchOffset('/deals', apiKey);

  // Save raw samples for debug endpoint
  fs.writeFileSync(path.join(__dirname, 'debug-raw.json'), JSON.stringify({
    people_count: people.length,
    calls_count: calls.length,
    appointments_count: appointments.length,
    deals_count: deals.length,
    users_count: users.length,
    people_sample: people.slice(0, 5),
    calls_sample: calls.slice(0, 5),
    appointments_sample: appointments.slice(0, 5),
    deals_sample: deals.slice(0, 5),
    deal_stages: [...new Set(deals.map(d => d.stageName || 'NONE'))],
    people_stages: [...new Set(people.map(p => p.stage || 'NONE'))],
  }, null, 2));

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
  const now = Date.now();

  const EXCLUDED_SOURCES = ['my +plus leads', 'imported'];

  // ==================================================================
  // STEP 1 — Build userId → agent map from /users
  // ==================================================================
  const agentMap = {};
  const nameToId = {};

  for (const u of users) {
    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;
    const role = (u.role || '').toLowerCase();
    const title = (u.title || '').toLowerCase();
    const isIsa = isaRoleNames.some(r => role.includes(r) || title.includes(r));
    const isLeader = role.includes('admin') || role.includes('owner');

    agentMap[u.id] = {
      id: u.id, name, email: u.email, role: u.role,
      is_isa: isIsa, is_leader: isLeader,
      calls_outbound: 0, calls_inbound: 0, calls_connected: 0, talk_seconds: 0,
      leads_assigned: 0, leads_reached: 0,
      never_called_count: 0, never_responded_count: 0,
      responds_text_count: 0, responds_email_count: 0,
      appointments_set: 0, quality_leads: 0, lender_sent: 0,
      closed_deals: 0, closed_value: 0, closed_commission: 0, pending_deals: 0,
      stage_distribution: {}, pipeline_active_count: 0, stale_leads_count: 0,
      _lead_speeds: [], _source_data: {}, _closed_journeys: [],
    };
    nameToId[name.toLowerCase()] = u.id;
  }

  // Helper: resolve person → agent ID
  function resolveAgent(person) {
    // Prefer numeric assignedUserId
    if (person.assignedUserId && agentMap[person.assignedUserId]) {
      return person.assignedUserId;
    }
    // Fallback: parse assignedTo (can be string or {firstName, lastName})
    const at = person.assignedTo;
    if (!at) return null;
    let name;
    if (typeof at === 'string') name = at;
    else if (typeof at === 'object') name = `${at.firstName || ''} ${at.lastName || ''}`.trim();
    if (name) return nameToId[name.toLowerCase()] || null;
    return null;
  }

  // ==================================================================
  // STEP 2 — Index calls by personId
  // FUB calls: personId, userId, isIncoming (bool), duration (sec), created
  // ==================================================================
  const callsByPerson = {};
  for (const c of calls) {
    if (c.personId) {
      if (!callsByPerson[c.personId]) callsByPerson[c.personId] = [];
      callsByPerson[c.personId].push(c);
    }
  }

  // ==================================================================
  // STEP 3 — Quality leads from appointment invitees
  // FUB appointments: createdById (agent), invitees[{userId, personId}]
  // ==================================================================
  const qualityPersonIds = new Set();
  const apptCountByAgent = {};

  for (const a of appointments) {
    // Count per agent
    if (a.createdById && agentMap[a.createdById]) {
      apptCountByAgent[a.createdById] = (apptCountByAgent[a.createdById] || 0) + 1;
    }
    // Collect lead personIds from invitees
    for (const inv of (a.invitees || [])) {
      if (inv.personId) qualityPersonIds.add(inv.personId);
    }
  }

  // ==================================================================
  // STEP 4 — Index deals by agent from users array
  // FUB deals: users[{id,name}], stageName, price, commissionValue
  // ==================================================================
  const dealsByAgent = {};
  for (const d of deals) {
    const du = (d.users || [])[0];
    if (du && du.id && agentMap[du.id]) {
      if (!dealsByAgent[du.id]) dealsByAgent[du.id] = [];
      dealsByAgent[du.id].push(d);
    }
  }

  // ==================================================================
  // STEP 5 — Source quality map (global)
  // ==================================================================
  const sourceMap = {};

  // ==================================================================
  // STEP 6 — Process people (leads)
  // ==================================================================
  let totalClean = 0;
  let excluded = 0;
  let unmatched = 0;

  for (const p of people) {
    // Exclude bad sources
    const srcLower = (p.source || '').toLowerCase().trim();
    if (EXCLUDED_SOURCES.some(ex => srcLower === ex)) { excluded++; continue; }

    const agentId = resolveAgent(p);
    const agent = agentMap[agentId];
    if (!agent) { unmatched++; continue; }

    totalClean++;
    agent.leads_assigned++;

    // Stage distribution
    const stage = p.stage || 'Unknown';
    const stageLower = stage.toLowerCase();
    agent.stage_distribution[stage] = (agent.stage_distribution[stage] || 0) + 1;

    // Pipeline active: exclude closed and archived stages only
    const isActivePipeline = !stageLower.includes('closed') && !stageLower.includes('close')
      && !stageLower.includes('archive');
    if (isActivePipeline) {
      agent.pipeline_active_count++;
    }

    // Stale lead
    const lastAct = p.lastActivity || p.updated;
    if (lastAct) {
      const daysSince = (now - new Date(lastAct).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > staleDays && !stageLower.includes('closed') && !stageLower.includes('close') && !stageLower.includes('archive')) {
        agent.stale_leads_count++;
      }
    }

    // Reached: FUB contacted field is integer 0/1
    // Only count reached against active pipeline leads for accurate reach rate
    if (p.contacted == 1) {
      agent.leads_reached++;
    }

    // Lender sent: tags containing 'lender application' or 'lender - green'
    const tags = p.tags || [];
    const hasLenderTag = tags.some(t =>
      typeof t === 'string' &&
      (t.toLowerCase().includes('lender application') || t.toLowerCase().includes('lender - green'))
    );
    if (hasLenderTag) agent.lender_sent++;

    // Quality lead: person appears in appointment invitees
    if (qualityPersonIds.has(p.id)) agent.quality_leads++;

    // Call-based metrics for this person
    const personCalls = callsByPerson[p.id] || [];
    const outbound = personCalls.filter(c => c.isIncoming === false);
    const inbound = personCalls.filter(c => c.isIncoming === true);

    if (outbound.length === 0) agent.never_called_count++;
    if (inbound.length === 0) agent.never_responded_count++;

    // Speed to lead: person.created → first outbound call
    // Only for leads created in last 90 days, cap at 72 hours
    const leadCreatedMs = new Date(p.created).getTime();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    if (outbound.length > 0 && leadCreatedMs >= ninetyDaysAgo) {
      let earliest = Infinity;
      for (const c of outbound) {
        const t = new Date(c.created).getTime();
        if (t < earliest) earliest = t;
      }
      if (earliest > leadCreatedMs) {
        const speedMin = (earliest - leadCreatedMs) / 60000;
        // Cap at 72 hours (4320 min) — anything over means lead wasn't properly contacted
        if (speedMin <= 4320) {
          agent._lead_speeds.push(speedMin);
        }
      }
    }

    // Source tracking
    const sourceKey = (p.source || '').trim() || 'Untagged';
    if (!sourceMap[sourceKey]) {
      sourceMap[sourceKey] = {
        source: sourceKey, lead_count: 0, reached_count: 0, appointments: 0,
        lender_sent: 0, closings: 0, closed_value: 0, revenue_per_lead: 0, close_rate_pct: 0
      };
    }
    sourceMap[sourceKey].lead_count++;
    if (p.contacted == 1) sourceMap[sourceKey].reached_count++;
    if (qualityPersonIds.has(p.id)) sourceMap[sourceKey].appointments++;
    if (hasLenderTag) sourceMap[sourceKey].lender_sent++;

    // Per-agent source
    if (!agent._source_data[sourceKey]) {
      agent._source_data[sourceKey] = { source: sourceKey, lead_count: 0, closings: 0, closed_value: 0 };
    }
    agent._source_data[sourceKey].lead_count++;
  }

  console.log(`  People: ${people.length} total, ${excluded} excluded, ${unmatched} unmatched agent, ${totalClean} clean`);

  // ==================================================================
  // STEP 7 — Process calls per agent
  // FUB: isIncoming (bool), duration (sec), userId (agent ID)
  // ==================================================================
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoMs = weekAgo.getTime();

  for (const c of calls) {
    const agent = agentMap[c.userId];
    if (!agent) continue;
    const isOutbound = c.isIncoming === false;
    if (isOutbound) {
      agent.calls_outbound++;
      if (new Date(c.created).getTime() >= weekAgoMs) {
        agent.calls_this_week = (agent.calls_this_week || 0) + 1;
      }
    } else if (c.isIncoming === true) {
      agent.calls_inbound++;
    }
    if ((c.duration || 0) > 0) {
      agent.calls_connected++;
      agent.talk_seconds += c.duration;
    }
  }

  // ==================================================================
  // STEP 8 — Appointments per agent (via createdById)
  // ==================================================================
  for (const [uid, count] of Object.entries(apptCountByAgent)) {
    if (agentMap[uid]) agentMap[uid].appointments_set = count;
  }

  // ==================================================================
  // STEP 9 — Deals per agent
  // ==================================================================
  // Build person name → person lookup for source attribution
  const peopleByName = {};
  for (const p of people) {
    if (p.name) peopleByName[p.name.toLowerCase().trim()] = p;
  }

  for (const [uid, agentDeals] of Object.entries(dealsByAgent)) {
    const agent = agentMap[uid];
    if (!agent) continue;

    for (const d of agentDeals) {
      const sn = (d.stageName || '').toLowerCase();
      const isClosed = sn.includes('closed') || sn.includes('close');

      if (isClosed) {
        agent.closed_deals++;
        agent.closed_value += parseFloat(d.price) || 0;
        agent.closed_commission += parseFloat(d.commissionValue) || 0;

        // Source attribution via deal name → person match
        const dealName = (d.name || '').toLowerCase().trim();
        const matched = peopleByName[dealName];
        const sourceKey = matched ? ((matched.source || '').trim() || 'Untagged') : 'Untagged';

        if (!sourceMap[sourceKey]) {
          sourceMap[sourceKey] = {
            source: sourceKey, lead_count: 0, reached_count: 0, appointments: 0,
            lender_sent: 0, closings: 0, closed_value: 0, revenue_per_lead: 0, close_rate_pct: 0
          };
        }
        sourceMap[sourceKey].closings++;
        sourceMap[sourceKey].closed_value += parseFloat(d.price) || 0;

        if (!agent._source_data[sourceKey]) {
          agent._source_data[sourceKey] = { source: sourceKey, lead_count: 0, closings: 0, closed_value: 0 };
        }
        agent._source_data[sourceKey].closings++;
        agent._source_data[sourceKey].closed_value += parseFloat(d.price) || 0;

        // Winning path journey
        const journey = {
          speed_to_contact_min: null, calls_to_connect: 0,
          first_appt_date: null, days_to_appointment: null,
          lender_tag: false, close_date: new Date(d.enteredStageAt || d.projectedCloseDate || d.createdAt),
          days_lender_to_close: null, source: sourceKey, lead_created: null,
        };
        if (matched) {
          journey.lead_created = new Date(matched.created);
          const pc = callsByPerson[matched.id] || [];
          const ob = pc.filter(c => c.isIncoming === false);
          if (ob.length > 0) {
            let earliest = Infinity;
            for (const c of ob) { const t = new Date(c.created).getTime(); if (t < earliest) earliest = t; }
            const lc = journey.lead_created.getTime();
            if (earliest > lc) journey.speed_to_contact_min = (earliest - lc) / 60000;
          }
          const sorted = [...ob].sort((a, b) => new Date(a.created) - new Date(b.created));
          let n = 0;
          for (const c of sorted) { n++; if ((c.duration || 0) > 0) break; }
          journey.calls_to_connect = n;
          const tags = matched.tags || [];
          journey.lender_tag = tags.some(t => typeof t === 'string' &&
            (t.toLowerCase().includes('lender application') || t.toLowerCase().includes('lender - green')));
          if (journey.lender_tag && journey.close_date && journey.lead_created) {
            journey.days_lender_to_close = (journey.close_date - journey.lead_created) / (1000 * 60 * 60 * 24);
          }
        }
        agent._closed_journeys.push(journey);
      } else {
        const lost = sn.includes('lost') || sn.includes('dead') || sn.includes('withdrawn');
        if (!lost) agent.pending_deals++;
      }
    }
  }

  // ==================================================================
  // STEP 10 — Derived per-agent metrics
  // ==================================================================
  const allJourneys = [];
  const agentList = [];

  for (const agent of Object.values(agentMap)) {
    agent.talk_hours = Math.round((agent.talk_seconds / 3600) * 10) / 10;
    agent.calls_per_week = agent.calls_this_week || 0; // Current week actual calls
    agent.calls_per_week_avg = Math.round(agent.calls_outbound / weeks); // 90-day average
    agent.conversations_per_week = Math.round(agent.calls_connected / weeks);
    agent.calls_vs_target_pct = agent.is_isa
      ? (targets.calls_per_week_isa > 0 ? Math.round(agent.calls_per_week / targets.calls_per_week_isa * 100) : 0)
      : (targets.calls_per_week_agent > 0 ? Math.round(agent.calls_per_week / targets.calls_per_week_agent * 100) : 0);

    agent.reach_rate_pct = agent.leads_assigned > 0
      ? Math.round(agent.leads_reached / agent.leads_assigned * 1000) / 10 : 0;
    agent.quality_rate_pct = agent.leads_assigned > 0
      ? Math.round(agent.quality_leads / agent.leads_assigned * 1000) / 10 : 0;
    agent.lender_referral_rate_pct = agent.appointments_set > 0
      ? Math.round(agent.lender_sent / agent.appointments_set * 1000) / 10 : 0;

    agent.calls_per_appointment = agent.appointments_set > 0
      ? Math.round(agent.calls_outbound / agent.appointments_set) : null;
    agent.leads_per_closing = agent.closed_deals > 0
      ? Math.round(agent.leads_assigned / agent.closed_deals) : null;
    agent.appointments_per_closing = agent.closed_deals > 0
      ? Math.round(agent.appointments_set / agent.closed_deals) : null;

    agent.speed_to_lead_avg_minutes = agent._lead_speeds.length > 0
      ? Math.round(agent._lead_speeds.reduce((a, b) => a + b, 0) / agent._lead_speeds.length * 10) / 10
      : null;

    agent.top_sources = Object.values(agent._source_data).sort((a, b) => b.lead_count - a.lead_count).slice(0, 5);
    allJourneys.push(...agent._closed_journeys);

    delete agent._lead_speeds;
    delete agent._source_data;
    delete agent._closed_journeys;

    agentList.push(agent);
  }

  // ==================================================================
  // STEP 11 — Source quality stats
  // ==================================================================
  const sources = Object.values(sourceMap).map(s => {
    s.close_rate_pct = s.lead_count > 0 ? Math.round(s.closings / s.lead_count * 1000) / 10 : 0;
    s.revenue_per_lead = s.lead_count > 0 ? Math.round(s.closed_value / s.lead_count) : 0;
    return s;
  });

  // ==================================================================
  // STEP 12 — Team-wide metrics
  // ==================================================================
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

  team.leads_per_closing = team.closed_deals > 0 ? Math.round(team.leads_assigned / team.closed_deals) : null;
  team.calls_per_appointment = team.appointments_set > 0 ? Math.round(team.calls_outbound / team.appointments_set) : null;
  team.appointments_per_closing = team.closed_deals > 0 ? Math.round(team.appointments_set / team.closed_deals) : null;
  team.lender_refs_per_closing = team.closed_deals > 0 ? Math.round(team.lender_sent / team.closed_deals) : null;

  const agentsOnly = agentList.filter(a => !a.is_isa);
  const ac = agentsOnly.length || 1;
  team.calls_per_week_avg = Math.round(agentsOnly.reduce((s, a) => s + a.calls_per_week, 0) / ac);
  team.conversations_per_week_avg = Math.round(agentsOnly.reduce((s, a) => s + a.conversations_per_week, 0) / ac);

  const allSpeeds = agentList.filter(a => a.speed_to_lead_avg_minutes != null).map(a => a.speed_to_lead_avg_minutes);
  team.speed_to_lead_avg = allSpeeds.length > 0
    ? Math.round(allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length * 10) / 10 : null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  team.calls_outbound_this_week = calls.filter(c => c.isIncoming === false && new Date(c.created) >= weekAgo).length;

  // ==================================================================
  // Winning path
  // ==================================================================
  const winningPath = computeWinningPath(allJourneys);

  // ==================================================================
  // Pipeline opportunity
  // ==================================================================
  const pipeline = computePipelineOpportunity(people, callsByPerson, EXCLUDED_SOURCES, thresholds);

  // ==================================================================
  // Badges
  // ==================================================================
  computeBadges(agentList, team);

  // ==================================================================
  // VALIDATION — stop here if numbers are wrong
  // ==================================================================
  console.log('=== VALIDATION ===');
  console.log(`All clean leads: ${team.leads_assigned}`);
  console.log(`Pipeline active: ${team.pipeline_active_count}  (expect ~5,462)`);
  console.log(`Outbound calls:  ${team.calls_outbound}  (expect ~36,092)`);
  console.log(`Appointments:    ${team.appointments_set}  (expect ~644)`);
  console.log(`Closed deals:    ${team.closed_deals}  (expect ~61)`);
  console.log(`Closed value:    $${team.closed_value.toLocaleString()}  (expect ~$34,334,859)`);
  console.log(`Reach rate:      ${team.reach_rate_pct}%  (expect ~39%)`);
  console.log(`Talk hours:      ${team.talk_hours}  (expect ~245)`);
  console.log(`Lender sent:     ${team.lender_sent}`);
  console.log(`Quality leads:   ${agentList.reduce((s, a) => s + a.quality_leads, 0)}`);
  for (const a of agentList) {
    if (a.leads_assigned > 0 || a.calls_outbound > 0 || a.closed_deals > 0) {
      console.log(`  ${a.name}: leads=${a.leads_assigned} reached=${a.leads_reached}(${a.reach_rate_pct}%) calls=${a.calls_outbound} appts=${a.appointments_set} quality=${a.quality_leads} lender=${a.lender_sent} closed=${a.closed_deals} value=$${a.closed_value}`);
    }
  }

  return { agents: agentList, team, sources, winningPath, pipeline, periodDays, agentCount: agentList.length };
}

// ---------------------------------------------------------------------------
// Winning path
// ---------------------------------------------------------------------------
function computeWinningPath(journeys) {
  if (!journeys.length) {
    return { avg_speed_to_contact_min: null, avg_calls_to_connect: null, avg_days_to_appointment: null,
             avg_appts_to_lender: null, avg_days_lender_to_close: null, top_source_closed: null, sample_size: 0 };
  }
  const speeds = journeys.filter(j => j.speed_to_contact_min != null).map(j => j.speed_to_contact_min);
  const ctc = journeys.map(j => j.calls_to_connect).filter(v => v > 0);
  const dtc = journeys.filter(j => j.days_lender_to_close != null).map(j => j.days_lender_to_close);
  const sc = {};
  for (const j of journeys) sc[j.source] = (sc[j.source] || 0) + 1;
  const top = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
  const lc = journeys.filter(j => j.lender_tag).length;

  return {
    avg_speed_to_contact_min: avg(speeds), avg_calls_to_connect: avg(ctc),
    avg_days_to_appointment: null,
    avg_appts_to_lender: lc > 0 ? Math.round(journeys.length / lc * 10) / 10 : null,
    avg_days_lender_to_close: avg(dtc),
    top_source_closed: top ? top[0] : null, sample_size: journeys.length
  };
}

function avg(arr) {
  if (!arr || !arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10;
}

// ---------------------------------------------------------------------------
// Pipeline opportunity
// ---------------------------------------------------------------------------
function computePipelineOpportunity(people, callsByPerson, excludedSources, thresholds) {
  const staleDays = thresholds.stale_lead_days || 30;
  const now = Date.now();
  const avgDealValue = 300000;

  let neverContacted = { count: 0, value: 0 };
  let reachedNoAppt = { count: 0, value: 0 };
  let apptNoLender = { count: 0, value: 0 };
  let lenderNotClosed = { count: 0, value: 0 };
  let staleCount = 0;

  for (const p of people) {
    if (excludedSources.some(ex => (p.source || '').toLowerCase().trim() === ex)) continue;
    const sl = (p.stage || '').toLowerCase();
    if (sl.includes('closed') || sl.includes('close') || sl.includes('archive')) continue;

    const pc = callsByPerson[p.id] || [];
    const ob = pc.filter(c => c.isIncoming === false);
    const tags = p.tags || [];
    const hasLender = tags.some(t => typeof t === 'string' &&
      (t.toLowerCase().includes('lender application') || t.toLowerCase().includes('lender - green')));
    const lv = parseFloat(p.price) || avgDealValue * 0.02;

    const lastAct = p.lastActivity || p.updated;
    if (lastAct && (now - new Date(lastAct).getTime()) / 86400000 > staleDays) staleCount++;

    if (ob.length === 0) { neverContacted.count++; neverContacted.value += lv; }
    else if (p.contacted != 1) { reachedNoAppt.count++; reachedNoAppt.value += lv; }
    else if (p.contacted == 1 && !hasLender) {
      const adv = sl.includes('spoke') || sl.includes('hot') || sl.includes('warm') || sl.includes('pending');
      if (adv) { apptNoLender.count++; apptNoLender.value += lv; }
      else { reachedNoAppt.count++; reachedNoAppt.value += lv; }
    } else if (hasLender) { lenderNotClosed.count++; lenderNotClosed.value += lv; }
  }

  return {
    never_contacted_count: neverContacted.count, never_contacted_value: Math.round(neverContacted.value),
    reached_no_appt_count: reachedNoAppt.count, reached_no_appt_value: Math.round(reachedNoAppt.value),
    appt_no_lender_count: apptNoLender.count, appt_no_lender_value: Math.round(apptNoLender.value),
    lender_not_closed_count: lenderNotClosed.count, lender_not_closed_value: Math.round(lenderNotClosed.value),
    stale_leads_count: staleCount
  };
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
function computeBadges(agents, team) {
  const ao = agents.filter(a => !a.is_isa && !a.is_leader);
  const active = agents.filter(a => a.leads_assigned > 0 || a.calls_outbound > 0);
  for (const a of agents) a.badges = [];
  if (!active.length) return;

  const byVal = [...ao].sort((a, b) => (b.closed_value || 0) - (a.closed_value || 0));
  if (byVal.length && byVal[0].closed_value > 0) byVal[0].badges.push({ tier: 'gold', name: 'Volume King' });
  for (const a of active) { if (a.quality_rate_pct > (team.quality_rate_pct || 0) && a.quality_rate_pct > 0) a.badges.push({ tier: 'gold', name: 'Quality Machine' }); }
  const byD = [...ao].sort((a, b) => (b.closed_deals || 0) - (a.closed_deals || 0));
  if (byD.length && byD[0].closed_deals > 0) byD[0].badges.push({ tier: 'gold', name: 'Closing Machine' });

  const byC = [...active].sort((a, b) => (b.calls_outbound || 0) - (a.calls_outbound || 0));
  if (byC.length && byC[0].calls_outbound > 0) byC[0].badges.push({ tier: 'silver', name: 'Phone Warrior' });
  const byA = [...active].sort((a, b) => (b.appointments_set || 0) - (a.appointments_set || 0));
  if (byA.length && byA[0].appointments_set > 0) byA[0].badges.push({ tier: 'silver', name: 'Appointment Setter' });
  const wCPA = active.filter(a => a.calls_per_appointment != null && a.calls_per_appointment > 0);
  const byCPA = [...wCPA].sort((a, b) => a.calls_per_appointment - b.calls_per_appointment);
  if (byCPA.length) byCPA[0].badges.push({ tier: 'silver', name: 'Speed Demon' });
  const byL = [...active].sort((a, b) => (b.lender_sent || 0) - (a.lender_sent || 0));
  if (byL.length && byL[0].lender_sent > 0) byL[0].badges.push({ tier: 'silver', name: 'Lender Connector' });

  const byR = [...active].sort((a, b) => (b.reach_rate_pct || 0) - (a.reach_rate_pct || 0));
  if (byR.length && byR[0].reach_rate_pct > 0) byR[0].badges.push({ tier: 'bronze', name: 'Reach Master' });
  const byP = [...active].sort((a, b) => (b.pipeline_active_count || 0) - (a.pipeline_active_count || 0));
  if (byP.length && byP[0].pipeline_active_count > 0) byP[0].badges.push({ tier: 'bronze', name: 'Pipeline Builder' });
  const byT = [...active].sort((a, b) => (b.talk_hours || 0) - (a.talk_hours || 0));
  if (byT.length && byT[0].talk_hours > 0) byT[0].badges.push({ tier: 'bronze', name: 'Talk Time Champ' });
}

module.exports = { fetchAllData };
