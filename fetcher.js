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
 * Paginate via _metadata.nextLink (cursor-based).
 * Used for /calls, /appointments — these do NOT support offset pagination reliably.
 */
async function fetchAllPagesCursor(endpoint, apiKey, params = {}) {
  const records = [];
  const qp = new URLSearchParams({ limit: PAGE_LIMIT, ...params });
  let nextUrl = `${endpoint}?${qp.toString()}`;

  while (nextUrl) {
    const resp = await fubRequest(nextUrl, apiKey);
    const items = resp.people || resp.calls || resp.appointments || resp.deals ||
                  resp.users || resp.events || [];
    records.push(...items);

    nextUrl = (resp._metadata && resp._metadata.nextLink) ? resp._metadata.nextLink : null;

    if (nextUrl) {
      await sleep(RATE_DELAY_MS);
    }

    if (records.length % 1000 === 0 && records.length > 0) {
      console.log(`  ... pulled ${records.length} records from ${endpoint}`);
    }
  }

  console.log(`  Fetched ${records.length} records from ${endpoint}`);
  return records;
}

/**
 * Paginate via offset (for /people, /deals which support it).
 */
async function fetchAllPagesOffset(endpoint, apiKey, params = {}) {
  const records = [];
  let offset = 0;

  while (true) {
    const qp = new URLSearchParams({ limit: PAGE_LIMIT, offset, ...params });
    const resp = await fubRequest(`${endpoint}?${qp.toString()}`, apiKey);
    const items = resp.people || resp.calls || resp.appointments || resp.deals ||
                  resp.users || resp.events || [];
    records.push(...items);

    if (items.length < PAGE_LIMIT) break; // Last page
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
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const sinceStr = since.toISOString().split('T')[0];

  console.log(`Fetching FUB data for last ${periodDays} days (since ${sinceStr})...`);

  // Step 1: Users (single page)
  console.log('Pulling /users...');
  const resp = await fubRequest(`/users?limit=200`, apiKey);
  const users = resp.users || [];
  console.log(`  Fetched ${users.length} users`);

  // Step 2: People — offset pagination, createdAfter filter
  console.log('Pulling /people...');
  const people = await fetchAllPagesOffset('/people', apiKey, { sort: 'created', createdAfter: sinceStr });

  // Step 3: Calls — cursor pagination ONLY, NO date filter via API (filter locally)
  console.log('Pulling /calls (cursor pagination, this may take several minutes)...');
  const allCalls = await fetchAllPagesCursor('/calls', apiKey);

  // Step 4: Appointments — cursor pagination
  console.log('Pulling /appointments...');
  const appointments = await fetchAllPagesCursor('/appointments', apiKey);

  // Step 5: Deals — offset pagination (small set)
  console.log('Pulling /deals...');
  const deals = await fetchAllPagesOffset('/deals', apiKey);

  // Filter calls locally to period
  const cutoffDate = since.getTime();
  const calls = allCalls.filter(c => new Date(c.created).getTime() >= cutoffDate);
  console.log(`  Calls in period: ${calls.length} (filtered from ${allCalls.length} total)`);

  // Save raw data for debug endpoint
  const rawDebug = {
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
  };
  fs.writeFileSync(path.join(__dirname, 'debug-raw.json'), JSON.stringify(rawDebug, null, 2));

  // Compute metrics
  console.log('Computing metrics...');
  return computeMetrics({ users, people, calls, appointments, deals }, config);
}

// ---------------------------------------------------------------------------
// Metric computation — uses exact FUB field names
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

  // Sources to exclude
  const excludedSources = ['my +plus leads', 'imported'];

  // ---- Step 1: Build userId → agent map from /users ----
  const agentMap = {};    // keyed by user ID (number)
  const nameToId = {};    // keyed by lowercase name → user ID

  for (const u of users) {
    const role = (u.role || '').toLowerCase();
    const title = (u.title || '').toLowerCase();
    const isIsa = isaRoleNames.some(r => role.includes(r) || title.includes(r));
    const isLeader = role.includes('admin') || role.includes('owner');
    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;

    agentMap[u.id] = {
      id: u.id,
      name,
      email: u.email,
      role: u.role,
      is_isa: isIsa,
      is_leader: isLeader,
      calls_outbound: 0, calls_inbound: 0, calls_connected: 0, talk_seconds: 0,
      leads_assigned: 0, leads_reached: 0,
      never_called_count: 0, never_responded_count: 0,
      responds_text_count: 0, responds_email_count: 0,
      appointments_set: 0, quality_leads: 0, lender_sent: 0,
      closed_deals: 0, closed_value: 0, closed_commission: 0, pending_deals: 0,
      stage_distribution: {},
      pipeline_active_count: 0, stale_leads_count: 0,
      _lead_speeds: [],
      _source_data: {},
      _closed_journeys: [],
      _assigned_person_ids: new Set(),
    };

    nameToId[name.toLowerCase()] = u.id;
  }

  // Helper: resolve assignedTo to a user ID
  function resolveAgentId(person) {
    // Prefer numeric assignedUserId
    if (person.assignedUserId && agentMap[person.assignedUserId]) {
      return person.assignedUserId;
    }
    // Fallback: parse assignedTo (can be string or object)
    const at = person.assignedTo;
    if (!at) return null;
    let assignedName;
    if (typeof at === 'string') {
      assignedName = at;
    } else if (typeof at === 'object') {
      assignedName = `${at.firstName || ''} ${at.lastName || ''}`.trim();
    }
    if (assignedName) {
      const uid = nameToId[assignedName.toLowerCase()];
      if (uid) return uid;
    }
    return null;
  }

  // ---- Step 2: Index calls by personId ----
  // FUB calls: personId, userId, isIncoming (bool), duration (sec), created
  const callsByPerson = {};
  for (const c of calls) {
    if (c.personId) {
      if (!callsByPerson[c.personId]) callsByPerson[c.personId] = [];
      callsByPerson[c.personId].push(c);
    }
  }

  // ---- Step 3: Build quality leads set from appointment invitees ----
  // FUB appointments: createdById (agent), invitees[{userId, personId}]
  const qualityPersonIds = new Set();
  const apptCountByAgent = {};

  for (const a of appointments) {
    const agentId = a.createdById;
    if (agentId) {
      apptCountByAgent[agentId] = (apptCountByAgent[agentId] || 0) + 1;
    }
    // Collect lead personIds from invitees
    const invitees = a.invitees || [];
    for (const inv of invitees) {
      if (inv.personId) {
        qualityPersonIds.add(inv.personId);
      }
    }
  }

  // ---- Step 4: Index deals by agent userId ----
  // FUB deals: users[{id, name}], stageName, price, commissionValue
  const dealsByAgent = {};
  for (const d of deals) {
    const dUsers = d.users || [];
    if (dUsers.length > 0 && dUsers[0].id) {
      const uid = dUsers[0].id;
      if (!dealsByAgent[uid]) dealsByAgent[uid] = [];
      dealsByAgent[uid].push(d);
    }
  }

  // ---- Step 5: Source quality tracking (global) ----
  const sourceMap = {};

  // ---- Step 6: Process people (leads) ----
  let excludedCount = 0;

  for (const p of people) {
    // Exclude certain sources
    const src = (p.source || '').toLowerCase().trim();
    if (excludedSources.some(ex => src === ex.toLowerCase())) {
      excludedCount++;
      continue;
    }

    const agentId = resolveAgentId(p);
    const agent = agentMap[agentId];
    if (!agent) continue;

    agent.leads_assigned++;
    agent._assigned_person_ids.add(p.id);

    // Stage distribution
    const stage = p.stage || 'Unknown';
    agent.stage_distribution[stage] = (agent.stage_distribution[stage] || 0) + 1;

    // Pipeline active: not closed and not archived
    const stageLower = stage.toLowerCase();
    if (!stageLower.includes('closed') && !stageLower.includes('close') && !stageLower.includes('archive')) {
      agent.pipeline_active_count++;
    }

    // Stale lead detection
    const lastAct = p.lastActivity || p.updated;
    if (lastAct) {
      const daysSince = (now - new Date(lastAct).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > staleDays && !stageLower.includes('closed') && !stageLower.includes('close') && !stageLower.includes('archive')) {
        agent.stale_leads_count++;
      }
    }

    // Reached: use FUB's contacted boolean
    if (p.contacted === true) {
      agent.leads_reached++;
    }

    // Lender sent: check tags for 'lender application' or 'lender - green'
    const tags = p.tags || [];
    const hasLenderTag = tags.some(t =>
      typeof t === 'string' &&
      (t.toLowerCase().includes('lender application') || t.toLowerCase().includes('lender - green'))
    );
    if (hasLenderTag) {
      agent.lender_sent++;
    }

    // Quality lead: is this person in the appointment invitees set?
    if (qualityPersonIds.has(p.id)) {
      agent.quality_leads++;
    }

    // Never called: no outbound calls to this person
    const personCalls = callsByPerson[p.id] || [];
    const outboundCalls = personCalls.filter(c => c.isIncoming === false);
    if (outboundCalls.length === 0) {
      agent.never_called_count++;
    }

    // Never responded: no inbound calls from this person
    const inboundCalls = personCalls.filter(c => c.isIncoming === true);
    if (inboundCalls.length === 0) {
      agent.never_responded_count++;
    }

    // Speed to lead: earliest outbound call after lead creation
    const leadCreated = new Date(p.created);
    if (outboundCalls.length > 0) {
      let earliest = null;
      for (const c of outboundCalls) {
        const cDate = new Date(c.created);
        if (!earliest || cDate < earliest) earliest = cDate;
      }
      if (earliest && earliest > leadCreated) {
        const speedMin = (earliest - leadCreated) / (1000 * 60);
        agent._lead_speeds.push(speedMin);
      }
    }

    // Source quality tracking
    const sourceKey = (p.source || '').trim() || 'Untagged';
    if (!sourceMap[sourceKey]) {
      sourceMap[sourceKey] = {
        source: sourceKey,
        lead_count: 0, reached_count: 0, appointments: 0,
        lender_sent: 0, closings: 0, closed_value: 0, revenue_per_lead: 0, close_rate_pct: 0
      };
    }
    sourceMap[sourceKey].lead_count++;
    if (p.contacted === true) sourceMap[sourceKey].reached_count++;
    if (qualityPersonIds.has(p.id)) sourceMap[sourceKey].appointments++;
    if (hasLenderTag) sourceMap[sourceKey].lender_sent++;

    // Per-agent source tracking
    if (!agent._source_data[sourceKey]) {
      agent._source_data[sourceKey] = { source: sourceKey, lead_count: 0, closings: 0, closed_value: 0 };
    }
    agent._source_data[sourceKey].lead_count++;
  }

  console.log(`  People processed: ${people.length - excludedCount} clean (${excludedCount} excluded)`);

  // ---- Step 7: Process calls for per-agent counts ----
  // FUB: isIncoming (bool), duration (sec), userId (agent)
  for (const c of calls) {
    const agent = agentMap[c.userId];
    if (!agent) continue;

    if (c.isIncoming === false) {
      agent.calls_outbound++;
    } else if (c.isIncoming === true) {
      agent.calls_inbound++;
    }

    if ((c.duration || 0) > 0) {
      agent.calls_connected++;
      agent.talk_seconds += c.duration;
    }
  }

  // ---- Step 8: Appointments per agent (via createdById) ----
  for (const [uid, count] of Object.entries(apptCountByAgent)) {
    const agent = agentMap[uid];
    if (agent) {
      agent.appointments_set = count;
    }
  }

  // ---- Step 9: Deals per agent ----
  // Match deal name to people for source attribution
  const peopleByName = {};
  for (const p of people) {
    if (p.name) peopleByName[p.name.toLowerCase()] = p;
  }

  for (const [uid, agentDeals] of Object.entries(dealsByAgent)) {
    const agent = agentMap[uid];
    if (!agent) continue;

    for (const d of agentDeals) {
      const stageName = (d.stageName || '').toLowerCase();
      const isClosed = stageName.includes('closed') || stageName.includes('close');

      if (isClosed) {
        agent.closed_deals++;
        agent.closed_value += parseFloat(d.price) || 0;
        agent.closed_commission += parseFloat(d.commissionValue) || 0;

        // Source attribution: try to match deal name to a person
        const dealName = (d.name || '').toLowerCase();
        const matchedPerson = peopleByName[dealName];
        const sourceKey = matchedPerson ? ((matchedPerson.source || '').trim() || 'Untagged') : 'Untagged';

        if (!sourceMap[sourceKey]) {
          sourceMap[sourceKey] = {
            source: sourceKey,
            lead_count: 0, reached_count: 0, appointments: 0,
            lender_sent: 0, closings: 0, closed_value: 0, revenue_per_lead: 0, close_rate_pct: 0
          };
        }
        sourceMap[sourceKey].closings++;
        sourceMap[sourceKey].closed_value += parseFloat(d.price) || 0;

        // Per-agent source data
        if (!agent._source_data[sourceKey]) {
          agent._source_data[sourceKey] = { source: sourceKey, lead_count: 0, closings: 0, closed_value: 0 };
        }
        agent._source_data[sourceKey].closings++;
        agent._source_data[sourceKey].closed_value += parseFloat(d.price) || 0;

        // Journey tracking for winning path
        const journey = {
          speed_to_contact_min: null,
          calls_to_connect: 0,
          first_appt_date: null,
          days_to_appointment: null,
          lender_tag: false,
          close_date: new Date(d.enteredStageAt || d.projectedCloseDate || d.createdAt),
          days_lender_to_close: null,
          source: sourceKey,
          lead_created: null,
        };

        // Try to enrich journey from matched person
        if (matchedPerson) {
          journey.lead_created = new Date(matchedPerson.created);
          const personCalls = callsByPerson[matchedPerson.id] || [];
          const outbound = personCalls.filter(c => c.isIncoming === false);

          // Speed to contact
          if (outbound.length > 0) {
            let earliest = null;
            for (const c of outbound) {
              const cd = new Date(c.created);
              if (!earliest || cd < earliest) earliest = cd;
            }
            if (earliest && earliest > journey.lead_created) {
              journey.speed_to_contact_min = (earliest - journey.lead_created) / (1000 * 60);
            }
          }

          // Calls before first connection
          const sorted = [...outbound].sort((a, b) => new Date(a.created) - new Date(b.created));
          let count = 0;
          for (const c of sorted) {
            count++;
            if ((c.duration || 0) > 0) break;
          }
          journey.calls_to_connect = count;

          // Lender tag
          const tags = matchedPerson.tags || [];
          journey.lender_tag = tags.some(t =>
            typeof t === 'string' &&
            (t.toLowerCase().includes('lender application') || t.toLowerCase().includes('lender - green'))
          );

          // Days lender to close
          if (journey.lender_tag && journey.close_date && journey.lead_created) {
            journey.days_lender_to_close = (journey.close_date - journey.lead_created) / (1000 * 60 * 60 * 24);
          }
        }

        agent._closed_journeys.push(journey);
      } else {
        const isLost = stageName.includes('lost') || stageName.includes('dead') || stageName.includes('withdrawn');
        if (!isLost) {
          agent.pending_deals++;
        }
      }
    }
  }

  // ---- Step 10: Compute derived per-agent metrics ----
  const allJourneys = [];
  const agentList = [];

  for (const agent of Object.values(agentMap)) {
    agent.talk_hours = Math.round((agent.talk_seconds / 3600) * 10) / 10;
    agent.calls_per_week = Math.round(agent.calls_outbound / weeks);
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

    agent.top_sources = Object.values(agent._source_data)
      .sort((a, b) => b.lead_count - a.lead_count)
      .slice(0, 5);

    allJourneys.push(...agent._closed_journeys);

    // Clean up internal fields
    delete agent._lead_speeds;
    delete agent._source_data;
    delete agent._closed_journeys;
    delete agent._assigned_person_ids;

    agentList.push(agent);
  }

  // ---- Step 11: Source quality stats ----
  const sources = Object.values(sourceMap).map(s => {
    s.close_rate_pct = s.lead_count > 0 ? Math.round(s.closings / s.lead_count * 1000) / 10 : 0;
    s.revenue_per_lead = s.lead_count > 0 ? Math.round(s.closed_value / s.lead_count) : 0;
    return s;
  });

  // ---- Step 12: Team-wide metrics ----
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

  // Law of averages
  team.leads_per_closing = team.closed_deals > 0 ? Math.round(team.leads_assigned / team.closed_deals) : null;
  team.calls_per_appointment = team.appointments_set > 0 ? Math.round(team.calls_outbound / team.appointments_set) : null;
  team.appointments_per_closing = team.closed_deals > 0 ? Math.round(team.appointments_set / team.closed_deals) : null;
  team.lender_refs_per_closing = team.closed_deals > 0 ? Math.round(team.lender_sent / team.closed_deals) : null;

  // Weekly averages (per agent, excluding ISAs)
  const agentsOnly = agentList.filter(a => !a.is_isa);
  const agentCount = agentsOnly.length || 1;
  team.calls_per_week_avg = Math.round(agentsOnly.reduce((s, a) => s + a.calls_per_week, 0) / agentCount);
  team.conversations_per_week_avg = Math.round(agentsOnly.reduce((s, a) => s + a.conversations_per_week, 0) / agentCount);

  // Speed to lead team average
  const allSpeeds = agentList.filter(a => a.speed_to_lead_avg_minutes != null).map(a => a.speed_to_lead_avg_minutes);
  team.speed_to_lead_avg = allSpeeds.length > 0
    ? Math.round(allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length * 10) / 10 : null;

  // Current week outbound calls
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  team.calls_outbound_this_week = calls.filter(c =>
    c.isIncoming === false && new Date(c.created) >= weekAgo
  ).length;

  // ---- Winning path ----
  const winningPath = computeWinningPath(allJourneys);

  // ---- Pipeline opportunity ----
  const pipeline = computePipelineOpportunity(people, callsByPerson, excludedSources, thresholds);

  // ---- Badges ----
  computeBadges(agentList, team);

  // ---- Validation ----
  console.log('=== VALIDATION ===');
  console.log(`Active leads (clean): ${team.leads_assigned} (expected ~5,462)`);
  console.log(`Outbound calls (period): ${team.calls_outbound} (expected ~36,092)`);
  console.log(`Appointments: ${team.appointments_set} (expected ~644)`);
  console.log(`Closed deals: ${team.closed_deals} (expected ~61)`);
  console.log(`Closed value: $${team.closed_value.toLocaleString()} (expected ~$34,334,859)`);
  console.log(`Team reach rate: ${team.reach_rate_pct}% (expected ~39%)`);
  console.log(`Talk hours: ${team.talk_hours} (expected ~245)`);
  console.log(`Lender sent: ${team.lender_sent}`);
  console.log(`Quality leads: ${agentList.reduce((s, a) => s + a.quality_leads, 0)}`);
  for (const a of agentList) {
    if (a.leads_assigned > 0 || a.calls_outbound > 0 || a.closed_deals > 0) {
      console.log(`  ${a.name}: leads=${a.leads_assigned} reached=${a.leads_reached} calls_out=${a.calls_outbound} connected=${a.calls_connected} appts=${a.appointments_set} quality=${a.quality_leads} lender=${a.lender_sent} closed=${a.closed_deals} value=${a.closed_value}`);
    }
  }

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
      avg_speed_to_contact_min: null, avg_calls_to_connect: null,
      avg_days_to_appointment: null, avg_appts_to_lender: null,
      avg_days_lender_to_close: null, top_source_closed: null, sample_size: 0
    };
  }

  const speeds = journeys.filter(j => j.speed_to_contact_min != null).map(j => j.speed_to_contact_min);
  const callsToConnect = journeys.map(j => j.calls_to_connect).filter(v => v > 0);
  const daysLenderToClose = journeys.filter(j => j.days_lender_to_close != null).map(j => j.days_lender_to_close);

  const sourceCounts = {};
  for (const j of journeys) {
    sourceCounts[j.source] = (sourceCounts[j.source] || 0) + 1;
  }
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
  const lenderCount = journeys.filter(j => j.lender_tag).length;

  return {
    avg_speed_to_contact_min: avg(speeds),
    avg_calls_to_connect: avg(callsToConnect),
    avg_days_to_appointment: null, // Can't compute without person-appointment join date
    avg_appts_to_lender: lenderCount > 0 ? Math.round(journeys.length / lenderCount * 10) / 10 : null,
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
    const src = (p.source || '').toLowerCase().trim();
    if (excludedSources.some(ex => src === ex.toLowerCase())) continue;

    const stage = (p.stage || '').toLowerCase();
    if (stage.includes('closed') || stage.includes('close') || stage.includes('archive')) continue;

    const personCalls = callsByPerson[p.id] || [];
    const outboundCalls = personCalls.filter(c => c.isIncoming === false);
    const tags = p.tags || [];
    const hasLender = tags.some(t =>
      typeof t === 'string' &&
      (t.toLowerCase().includes('lender application') || t.toLowerCase().includes('lender - green'))
    );

    const leadValue = parseFloat(p.price) || avgDealValue * 0.02;

    // Stale
    const lastAct = p.lastActivity || p.updated;
    if (lastAct) {
      const daysSince = (now - new Date(lastAct).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > staleDays) staleCount++;
    }

    // Funnel position
    if (outboundCalls.length === 0) {
      neverContacted.count++;
      neverContacted.value += leadValue;
    } else if (p.contacted !== true) {
      // Called but not reached
      reachedNoAppt.count++;
      reachedNoAppt.value += leadValue;
    } else if (p.contacted === true && !hasLender) {
      // Reached but no lender tag — could have appt or not
      const advancedStage = stage.includes('spoke') || stage.includes('hot') || stage.includes('warm') || stage.includes('pending');
      if (advancedStage) {
        apptNoLender.count++;
        apptNoLender.value += leadValue;
      } else {
        reachedNoAppt.count++;
        reachedNoAppt.value += leadValue;
      }
    } else if (hasLender) {
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
  const allActive = agents.filter(a => a.leads_assigned > 0 || a.calls_outbound > 0);

  for (const a of agents) a.badges = [];
  if (allActive.length === 0) return;

  // Gold
  const byValue = [...agentsOnly].sort((a, b) => (b.closed_value || 0) - (a.closed_value || 0));
  if (byValue.length && byValue[0].closed_value > 0) byValue[0].badges.push({ tier: 'gold', name: 'Volume King' });

  const teamQR = team.quality_rate_pct || 0;
  for (const a of allActive) {
    if (a.quality_rate_pct > teamQR && a.quality_rate_pct > 0) a.badges.push({ tier: 'gold', name: 'Quality Machine' });
  }

  const byDeals = [...agentsOnly].sort((a, b) => (b.closed_deals || 0) - (a.closed_deals || 0));
  if (byDeals.length && byDeals[0].closed_deals > 0) byDeals[0].badges.push({ tier: 'gold', name: 'Closing Machine' });

  // Silver
  const byCalls = [...allActive].sort((a, b) => (b.calls_outbound || 0) - (a.calls_outbound || 0));
  if (byCalls.length && byCalls[0].calls_outbound > 0) byCalls[0].badges.push({ tier: 'silver', name: 'Phone Warrior' });

  const byAppts = [...allActive].sort((a, b) => (b.appointments_set || 0) - (a.appointments_set || 0));
  if (byAppts.length && byAppts[0].appointments_set > 0) byAppts[0].badges.push({ tier: 'silver', name: 'Appointment Setter' });

  const withCPA = allActive.filter(a => a.calls_per_appointment != null && a.calls_per_appointment > 0);
  const byCPA = [...withCPA].sort((a, b) => a.calls_per_appointment - b.calls_per_appointment);
  if (byCPA.length) byCPA[0].badges.push({ tier: 'silver', name: 'Speed Demon' });

  const byLender = [...allActive].sort((a, b) => (b.lender_sent || 0) - (a.lender_sent || 0));
  if (byLender.length && byLender[0].lender_sent > 0) byLender[0].badges.push({ tier: 'silver', name: 'Lender Connector' });

  // Bronze
  const byReach = [...allActive].sort((a, b) => (b.reach_rate_pct || 0) - (a.reach_rate_pct || 0));
  if (byReach.length && byReach[0].reach_rate_pct > 0) byReach[0].badges.push({ tier: 'bronze', name: 'Reach Master' });

  const byPipeline = [...allActive].sort((a, b) => (b.pipeline_active_count || 0) - (a.pipeline_active_count || 0));
  if (byPipeline.length && byPipeline[0].pipeline_active_count > 0) byPipeline[0].badges.push({ tier: 'bronze', name: 'Pipeline Builder' });

  const byTalk = [...allActive].sort((a, b) => (b.talk_hours || 0) - (a.talk_hours || 0));
  if (byTalk.length && byTalk[0].talk_hours > 0) byTalk[0].badges.push({ tier: 'bronze', name: 'Talk Time Champ' });
}

module.exports = { fetchAllData };
