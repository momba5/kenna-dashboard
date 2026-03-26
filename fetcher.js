const https = require('https');
const fs = require('fs');
const path = require('path');

const FUB_BASE = 'https://api.followupboss.com/v1';
const LIMIT = 100;

// ---------------------------------------------------------------------------
// HTTP + helpers
// ---------------------------------------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms));

function fubGet(endpoint, apiKey) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(endpoint.startsWith('http') ? endpoint : FUB_BASE + endpoint);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
        Accept: 'application/json',
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`FUB ${res.statusCode}: ${d.slice(0, 200)}`));
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ---------------------------------------------------------------------------
// API pullers — match proven patterns exactly
// ---------------------------------------------------------------------------

/** People: offset pagination with createdAfter=migrationDate */
async function getPeople(apiKey, migrationDate) {
  const out = [];
  let offset = 0;
  while (true) {
    const qp = new URLSearchParams({ limit: LIMIT, offset, sort: 'created', createdAfter: migrationDate });
    const r = await fubGet(`/people?${qp}`, apiKey);
    const items = r.people || [];
    out.push(...items);
    if (items.length < LIMIT) break;
    offset += LIMIT;
    await sleep(150);
    if (out.length % 1000 === 0) console.log(`  ... ${out.length} people`);
  }
  console.log(`  Fetched ${out.length} people`);
  return out;
}

/** Calls: cursor pagination, filter locally by cutoff */
async function getCalls(apiKey, cutoffDate) {
  const cutoffMs = new Date(cutoffDate).getTime();
  const out = [];
  let nextUrl = `/calls?limit=${LIMIT}`;
  let pages = 0;

  while (nextUrl && pages < 500) {
    const r = await fubGet(nextUrl, apiKey);
    const items = r.calls || [];
    let hitOld = false;

    for (const c of items) {
      if (new Date(c.created).getTime() >= cutoffMs) {
        out.push({
          userId: c.userId,
          userName: c.userName,
          personId: c.personId,
          created: c.created,
          duration: c.duration || 0,
          isIncoming: c.isIncoming,
          outcome: c.outcome,
        });
      } else {
        hitOld = true;
      }
    }

    if (hitOld) break;
    nextUrl = (r._metadata && r._metadata.nextLink) || null;
    pages++;
    if (nextUrl) await sleep(100);
    if (out.length % 1000 === 0 && out.length > 0) console.log(`  ... ${out.length} calls`);
  }
  console.log(`  Fetched ${out.length} calls (${pages} pages)`);
  return out;
}

/** Appointments: cursor pagination, no date filter */
async function getAppointments(apiKey) {
  const out = [];
  let nextUrl = `/appointments?limit=${LIMIT}`;
  while (nextUrl) {
    const r = await fubGet(nextUrl, apiKey);
    out.push(...(r.appointments || []));
    nextUrl = (r._metadata && r._metadata.nextLink) || null;
    if (nextUrl) await sleep(150);
    if (out.length % 500 === 0 && out.length > 0) console.log(`  ... ${out.length} appointments`);
  }
  console.log(`  Fetched ${out.length} appointments`);
  return out;
}

/** Deals: offset pagination, no date filter */
async function getDeals(apiKey) {
  const out = [];
  let offset = 0;
  while (true) {
    const r = await fubGet(`/deals?limit=${LIMIT}&offset=${offset}`, apiKey);
    const items = r.deals || [];
    out.push(...items);
    if (items.length < LIMIT) break;
    offset += LIMIT;
    await sleep(150);
  }
  console.log(`  Fetched ${out.length} deals`);
  return out;
}

/** Users: single request */
async function getUsers(apiKey) {
  const r = await fubGet('/users?limit=100', apiKey);
  const users = r.users || [];
  console.log(`  Fetched ${users.length} users`);
  return users;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
async function fetchAllData(config) {
  const apiKey = process.env.FUB_API_KEY;
  if (!apiKey) throw new Error('FUB_API_KEY required');

  const migrationDate = config.migration_date || '2025-07-01';
  const periodDays = config.period_days || 90;
  const callsCutoff = new Date();
  callsCutoff.setDate(callsCutoff.getDate() - periodDays);
  const callsCutoffStr = callsCutoff.toISOString().split('T')[0];

  console.log(`People cutoff: ${migrationDate} (migration), Calls cutoff: ${callsCutoffStr} (rolling ${periodDays}d)`);

  console.log('Pulling /users...');
  const users = await getUsers(apiKey);
  console.log('Pulling /people...');
  const people = await getPeople(apiKey, migrationDate);
  console.log('Pulling /calls...');
  const calls = await getCalls(apiKey, callsCutoffStr);
  console.log('Pulling /appointments...');
  const appointments = await getAppointments(apiKey);
  console.log('Pulling /deals...');
  const deals = await getDeals(apiKey);

  // Debug file
  fs.writeFileSync(path.join(__dirname, 'debug-raw.json'), JSON.stringify({
    people_count: people.length, calls_count: calls.length,
    appointments_count: appointments.length, deals_count: deals.length,
    users_count: users.length,
    people_sample: people.slice(0, 3), calls_sample: calls.slice(0, 3),
    appointments_sample: appointments.slice(0, 3), deals_sample: deals.slice(0, 3),
    deal_stages: [...new Set(deals.map(d => d.stageName || 'NONE'))],
    people_stages: [...new Set(people.map(p => p.stage || 'NONE'))],
  }, null, 2));

  console.log('Computing metrics...');
  return compute(users, people, calls, appointments, deals, config);
}

// ---------------------------------------------------------------------------
// Compute — matches proven logic exactly
// ---------------------------------------------------------------------------
function compute(users, people, calls, appointments, deals, config) {
  const targets = config.targets || {};
  const thresholds = config.thresholds || {};
  const isaRoleNames = (config.isa_role_names || []).map(r => r.toLowerCase());
  const WEEKS = 13; // 90 days
  const EXCLUDED_SOURCES = ['my +plus leads', 'imported'];
  const RELATIONSHIP_SOURCES = ['sphere', 'referral', 'kenna lead', 'by agent',
    'agent personal home', 'realscout', 'open house'];
  const now = Date.now();
  const staleDays = thresholds.stale_lead_days || 30;

  // ==================================================================
  // 1. Build uidMap: userId → fullName
  // ==================================================================
  const uidMap = {};
  const agentMeta = {};
  for (const u of users) {
    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;
    uidMap[u.id] = name;
    const role = (u.role || '').toLowerCase();
    const title = (u.title || '').toLowerCase();
    agentMeta[name] = {
      id: u.id,
      is_isa: isaRoleNames.some(r => role.includes(r) || title.includes(r)),
      is_leader: role.includes('admin') || role.includes('owner'),
      email: u.email,
      role: u.role,
    };
  }

  // ==================================================================
  // 2. Resolve person → agent name
  // ==================================================================
  function resolveAgentName(p) {
    const at = p.assignedTo;
    if (!at) return null;
    if (typeof at === 'string') return at;
    if (typeof at === 'object') return `${at.firstName || ''} ${at.lastName || ''}`.trim() || null;
    return null;
  }

  // ==================================================================
  // 3. Stage bucket mapper
  // ==================================================================
  function stageBucket(stage) {
    if (!stage) return 'Other';
    const s = stage.toLowerCase();
    if (s.includes('new') || s === 'lead') return 'New';
    if (s.includes('attempted')) return 'Attempted';
    if (s.includes('spoke')) return 'Spoke';
    if (s.includes('nurture')) return 'Nurture';
    if (s.includes('warm')) return 'Warm';
    if (s.includes('hot')) return 'Hot';
    if (s.includes('pending')) return 'Pending';
    if (s.includes('closed') || s.includes('close')) return 'Closed';
    if (s.includes('archiv')) return 'Archives';
    return 'Other';
  }

  // ==================================================================
  // 4. Index calls by personId (for speed-to-lead)
  // ==================================================================
  const callsByPerson = {};
  for (const c of calls) {
    if (c.personId) {
      if (!callsByPerson[c.personId]) callsByPerson[c.personId] = [];
      callsByPerson[c.personId].push(c);
    }
  }

  // ==================================================================
  // 5. Quality leads from appointment invitees
  // ==================================================================
  const qualityPersonIds = new Set();
  for (const a of appointments) {
    for (const inv of (a.invitees || [])) {
      if (inv.personId) qualityPersonIds.add(inv.personId);
    }
  }

  // ==================================================================
  // 6. Build per-agent profiles — keyed by agent NAME
  // ==================================================================
  const agents = {};
  function ensureAgent(name) {
    if (!name || agents[name]) return;
    const meta = agentMeta[name] || { id: null, is_isa: false, is_leader: false, email: null, role: null };
    agents[name] = {
      id: meta.id, name, email: meta.email, role: meta.role,
      is_isa: meta.is_isa, is_leader: meta.is_leader,
      // Leads
      leads_assigned: 0, leads_reached: 0, cleanLeadIds: new Set(),
      never_called_count: 0, never_responded_count: 0,
      responds_text_count: 0, responds_email_count: 0,
      quality_leads: 0, lender_sent: 0,
      stages: {}, pipeline_active_count: 0, stale_leads_count: 0,
      // Calls (filled in step 8)
      calls_outbound: 0, calls_inbound: 0, calls_connected: 0, talk_seconds: 0,
      // Appointments (filled in step 9)
      appointments_set: 0,
      // Deals (filled in step 10)
      closed_deals: 0, closed_value: 0, closed_commission: 0, pending_deals: 0,
      // Tracking
      _lead_speeds: [], _source_data: {}, _closed_journeys: [],
    };
  }
  // Pre-populate from users
  for (const name of Object.keys(agentMeta)) ensureAgent(name);

  // ==================================================================
  // 7. Process people
  // ==================================================================
  let excluded = 0;
  const sourceMap = {};

  for (const p of people) {
    const srcLower = (p.source || '').toLowerCase().trim();
    if (EXCLUDED_SOURCES.includes(srcLower)) { excluded++; continue; }

    const agentName = resolveAgentName(p);
    if (!agentName) continue;
    ensureAgent(agentName);
    const a = agents[agentName];

    a.leads_assigned++;
    a.cleanLeadIds.add(p.id);

    // Stage bucket
    const bucket = stageBucket(p.stage);
    a.stages[bucket] = (a.stages[bucket] || 0) + 1;

    // Pipeline = Warm + Hot + Pending only
    if (bucket === 'Warm' || bucket === 'Hot' || bucket === 'Pending') {
      a.pipeline_active_count++;
    }

    // Stale
    const lastAct = p.lastActivity || p.updated;
    if (lastAct && bucket !== 'Closed' && bucket !== 'Archives') {
      if ((now - new Date(lastAct).getTime()) / 86400000 > staleDays) a.stale_leads_count++;
    }

    // Reached — FUB contacted is int 0/1
    if (p.contacted == 1) a.leads_reached++;

    // Tags — exact lowercase matching
    const tags = (p.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : '');
    if (tags.includes('first call never made')) a.never_called_count++;
    if (tags.includes('lead has never responded')) a.never_responded_count++;
    if (tags.some(t => t === 'lead responds to text')) a.responds_text_count++;
    if (tags.some(t => t === 'lead responds to email')) a.responds_email_count++;
    if (tags.some(t => t.includes('lender application') || t.includes('lender - green'))) a.lender_sent++;

    // Quality lead — is this person in appointment invitees?
    if (qualityPersonIds.has(p.id)) a.quality_leads++;

    // Speed to lead: person.created → earliest outbound call
    const personCalls = callsByPerson[p.id] || [];
    const outbound = personCalls.filter(c => c.isIncoming === false);
    if (outbound.length > 0) {
      const leadCreated = new Date(p.created).getTime();
      let earliest = Infinity;
      for (const c of outbound) {
        const t = new Date(c.created).getTime();
        if (t < earliest) earliest = t;
      }
      if (earliest > leadCreated) {
        const mins = (earliest - leadCreated) / 60000;
        if (mins <= 4320) a._lead_speeds.push(mins); // cap 72h
      }
    }

    // Source tracking
    const sourceKey = (p.source || '').trim() || 'Untagged';
    if (!sourceMap[sourceKey]) {
      sourceMap[sourceKey] = { source: sourceKey, lead_count: 0, reached_count: 0,
        pipeline_count: 0, closings: 0, closed_value: 0, close_rate_pct: 0, revenue_per_lead: 0,
        appointments: 0, lender_sent: 0 };
    }
    sourceMap[sourceKey].lead_count++;
    if (p.contacted == 1) sourceMap[sourceKey].reached_count++;
    if (bucket === 'Warm' || bucket === 'Hot' || bucket === 'Pending') sourceMap[sourceKey].pipeline_count++;
    if (qualityPersonIds.has(p.id)) sourceMap[sourceKey].appointments++;
    if (tags.some(t => t.includes('lender application') || t.includes('lender - green'))) sourceMap[sourceKey].lender_sent++;

    // Per-agent source
    if (!a._source_data[sourceKey]) a._source_data[sourceKey] = { source: sourceKey, lead_count: 0, closings: 0, closed_value: 0 };
    a._source_data[sourceKey].lead_count++;
  }
  console.log(`  People: ${people.length} total, ${excluded} excluded, ${Object.values(agents).reduce((s, a) => s + a.leads_assigned, 0)} clean`);

  // ==================================================================
  // 8. Process calls — match by c.userName
  // ==================================================================
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoMs = weekAgo.getTime();

  for (const c of calls) {
    const name = c.userName;
    if (!name) continue;
    ensureAgent(name);
    const a = agents[name];
    if (c.isIncoming === false) {
      a.calls_outbound++;
      a.calls_this_week = (a.calls_this_week || 0) + (new Date(c.created).getTime() >= weekAgoMs ? 1 : 0);
    } else if (c.isIncoming === true) {
      a.calls_inbound++;
    }
    if (c.duration > 0) {
      a.calls_connected++;
      a.talk_seconds += c.duration;
    }
  }

  // ==================================================================
  // 9. Process appointments — match by uidMap[createdById]
  // ==================================================================
  for (const ap of appointments) {
    const name = uidMap[ap.createdById];
    if (!name) continue;
    ensureAgent(name);
    agents[name].appointments_set++;
  }

  // ==================================================================
  // 10. Process deals — match by d.users[0].name
  // ==================================================================
  const peopleByName = {};
  for (const p of people) { if (p.name) peopleByName[p.name.toLowerCase().trim()] = p; }

  for (const d of deals) {
    const du = (d.users || [])[0];
    if (!du || !du.name) continue;
    const name = du.name;
    ensureAgent(name);
    const a = agents[name];

    const sn = (d.stageName || '').toLowerCase();
    const isClosed = sn.includes('closed') || sn.includes('close');
    const isPending = sn.includes('pending');

    if (isClosed) {
      a.closed_deals++;
      a.closed_value += parseFloat(d.price) || 0;
      a.closed_commission += parseFloat(d.commissionValue) || 0;

      // Source attribution
      const dealName = (d.name || '').toLowerCase().trim();
      const matched = peopleByName[dealName];
      const srcKey = matched ? ((matched.source || '').trim() || 'Untagged') : 'Untagged';
      if (!sourceMap[srcKey]) {
        sourceMap[srcKey] = { source: srcKey, lead_count: 0, reached_count: 0, pipeline_count: 0,
          closings: 0, closed_value: 0, close_rate_pct: 0, revenue_per_lead: 0, appointments: 0, lender_sent: 0 };
      }
      sourceMap[srcKey].closings++;
      sourceMap[srcKey].closed_value += parseFloat(d.price) || 0;

      if (!a._source_data[srcKey]) a._source_data[srcKey] = { source: srcKey, lead_count: 0, closings: 0, closed_value: 0 };
      a._source_data[srcKey].closings++;
      a._source_data[srcKey].closed_value += parseFloat(d.price) || 0;

      // Journey
      a._closed_journeys.push({
        speed_to_contact_min: null, calls_to_connect: 0, lender_tag: false,
        close_date: new Date(d.enteredStageAt || d.projectedCloseDate || d.createdAt),
        days_lender_to_close: null, source: srcKey,
      });
    } else if (isPending) {
      a.pending_deals++;
    }
  }

  // ==================================================================
  // 11. Derived per-agent metrics
  // ==================================================================
  const allJourneys = [];
  const agentList = [];

  for (const a of Object.values(agents)) {
    a.talk_hours = Math.round((a.talk_seconds / 3600) * 10) / 10;
    a.calls_per_week = a.calls_this_week || 0;
    a.calls_per_week_avg = Math.round(a.calls_outbound / WEEKS);
    a.conversations_per_week = Math.round(a.calls_connected / WEEKS);
    a.calls_vs_target_pct = a.is_isa
      ? (targets.calls_per_week_isa > 0 ? Math.round(a.calls_per_week / targets.calls_per_week_isa * 100) : 0)
      : (targets.calls_per_week_agent > 0 ? Math.round(a.calls_per_week / targets.calls_per_week_agent * 100) : 0);

    a.reach_rate_pct = a.leads_assigned > 0
      ? Math.round(a.leads_reached / a.leads_assigned * 1000) / 10 : 0;
    // Cap quality at clean leads
    if (a.quality_leads > a.leads_assigned) a.quality_leads = a.leads_assigned;
    a.quality_rate_pct = a.leads_assigned > 0
      ? Math.round(a.quality_leads / a.leads_assigned * 1000) / 10 : 0;
    a.lender_referral_rate_pct = a.appointments_set > 0
      ? Math.round(a.lender_sent / a.appointments_set * 1000) / 10 : 0;

    a.calls_per_appointment = a.appointments_set > 0 ? Math.round(a.calls_outbound / a.appointments_set) : null;
    a.leads_per_closing = a.closed_deals > 0 ? Math.round(a.leads_assigned / a.closed_deals) : null;
    a.appointments_per_closing = a.closed_deals > 0 ? Math.round(a.appointments_set / a.closed_deals) : null;

    a.speed_to_lead_avg_minutes = a._lead_speeds.length > 0
      ? Math.round(a._lead_speeds.reduce((s, v) => s + v, 0) / a._lead_speeds.length * 10) / 10 : null;

    // Stage distribution for render.js (use raw stage names)
    a.stage_distribution = a.stages;

    a.top_sources = Object.values(a._source_data).sort((x, y) => y.lead_count - x.lead_count).slice(0, 5);
    allJourneys.push(...a._closed_journeys);

    delete a._lead_speeds; delete a._source_data; delete a._closed_journeys;
    delete a.cleanLeadIds; delete a.calls_this_week; delete a.stages;

    agentList.push(a);
  }

  // ==================================================================
  // 12. Source quality
  // ==================================================================
  const sources = Object.values(sourceMap)
    .filter(s => s.lead_count >= 5)
    .map(s => {
      s.close_rate_pct = s.lead_count > 0 ? Math.round(s.closings / s.lead_count * 1000) / 10 : 0;
      s.revenue_per_lead = s.lead_count > 0 ? Math.round(s.closed_value / s.lead_count) : 0;
      return s;
    });

  // ==================================================================
  // 13. Team totals
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

  const nonIsa = agentList.filter(a => !a.is_isa);
  const nc = nonIsa.length || 1;
  team.calls_per_week_avg = Math.round(nonIsa.reduce((s, a) => s + (a.calls_per_week_avg || 0), 0) / nc);
  team.conversations_per_week_avg = Math.round(nonIsa.reduce((s, a) => s + a.conversations_per_week, 0) / nc);

  const speeds = agentList.filter(a => a.speed_to_lead_avg_minutes != null).map(a => a.speed_to_lead_avg_minutes);
  team.speed_to_lead_avg = speeds.length > 0
    ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10 : null;

  team.calls_outbound_this_week = calls.filter(c =>
    c.isIncoming === false && new Date(c.created).getTime() >= weekAgoMs
  ).length;

  // ==================================================================
  // Winning path + pipeline + badges
  // ==================================================================
  const winningPath = computeWinningPath(allJourneys);
  const pipeline = computePipeline(people, callsByPerson, EXCLUDED_SOURCES, thresholds);
  computeBadges(agentList, team);

  // ==================================================================
  // VALIDATION
  // ==================================================================
  console.log('=== VALIDATION ===');
  console.log(`Leads:       ${team.leads_assigned}  (expect ~5,462)`);
  console.log(`Outbound:    ${team.calls_outbound}  (expect ~36,092)`);
  console.log(`Appointments:${team.appointments_set}  (expect ~644)`);
  console.log(`Closed:      ${team.closed_deals}  (expect ~61)`);
  console.log(`Value:       $${team.closed_value.toLocaleString()}  (expect ~$34,334,859)`);
  console.log(`Reach rate:  ${team.reach_rate_pct}%  (expect ~39%)`);
  console.log(`Talk hours:  ${team.talk_hours}  (expect ~245)`);
  const brian = agentList.find(a => a.name && a.name.includes('Brian'));
  if (brian) console.log(`Brian: calls=${brian.calls_outbound} appts=${brian.appointments_set} closed=${brian.closed_deals}`);
  for (const a of agentList) {
    if (a.leads_assigned > 0 || a.calls_outbound > 0 || a.closed_deals > 0) {
      console.log(`  ${a.name}: leads=${a.leads_assigned} reached=${a.leads_reached}(${a.reach_rate_pct}%) calls=${a.calls_outbound} appts=${a.appointments_set} quality=${a.quality_leads} lender=${a.lender_sent} closed=${a.closed_deals} value=$${a.closed_value}`);
    }
  }

  return { agents: agentList, team, sources, winningPath, pipeline, periodDays: 90, agentCount: agentList.length };
}

// ---------------------------------------------------------------------------
// Winning path
// ---------------------------------------------------------------------------
function computeWinningPath(journeys) {
  if (!journeys.length) return { avg_speed_to_contact_min: null, avg_calls_to_connect: null,
    avg_days_to_appointment: null, avg_appts_to_lender: null, avg_days_lender_to_close: null,
    top_source_closed: null, sample_size: 0 };
  const sp = journeys.filter(j => j.speed_to_contact_min != null).map(j => j.speed_to_contact_min);
  const ctc = journeys.map(j => j.calls_to_connect).filter(v => v > 0);
  const dtc = journeys.filter(j => j.days_lender_to_close != null).map(j => j.days_lender_to_close);
  const sc = {};
  for (const j of journeys) sc[j.source] = (sc[j.source] || 0) + 1;
  const top = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
  const lc = journeys.filter(j => j.lender_tag).length;
  return {
    avg_speed_to_contact_min: avg(sp), avg_calls_to_connect: avg(ctc), avg_days_to_appointment: null,
    avg_appts_to_lender: lc > 0 ? Math.round(journeys.length / lc * 10) / 10 : null,
    avg_days_lender_to_close: avg(dtc), top_source_closed: top ? top[0] : null, sample_size: journeys.length,
  };
}
function avg(a) { return a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length * 10) / 10 : null; }

// ---------------------------------------------------------------------------
// Pipeline opportunity
// ---------------------------------------------------------------------------
function computePipeline(people, callsByPerson, excluded, thresholds) {
  const staleDays = thresholds.stale_lead_days || 30;
  const now = Date.now();
  const dv = 300000;
  let nc = { count: 0, value: 0 }, rna = { count: 0, value: 0 },
      anl = { count: 0, value: 0 }, lnc = { count: 0, value: 0 }, stale = 0;

  for (const p of people) {
    if (excluded.includes((p.source || '').toLowerCase().trim())) continue;
    const b = stageBucketSimple(p.stage);
    if (b === 'Closed' || b === 'Archives') continue;
    const pc = callsByPerson[p.id] || [];
    const ob = pc.filter(c => c.isIncoming === false);
    const tags = (p.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : '');
    const hasLender = tags.some(t => t.includes('lender application') || t.includes('lender - green'));
    const lv = parseFloat(p.price) || dv * 0.02;
    const la = p.lastActivity || p.updated;
    if (la && (now - new Date(la).getTime()) / 86400000 > staleDays) stale++;
    if (ob.length === 0) { nc.count++; nc.value += lv; }
    else if (p.contacted != 1) { rna.count++; rna.value += lv; }
    else if (!hasLender) {
      const adv = b === 'Warm' || b === 'Hot' || b === 'Pending' || b === 'Spoke';
      if (adv) { anl.count++; anl.value += lv; } else { rna.count++; rna.value += lv; }
    } else { lnc.count++; lnc.value += lv; }
  }
  return {
    never_contacted_count: nc.count, never_contacted_value: Math.round(nc.value),
    reached_no_appt_count: rna.count, reached_no_appt_value: Math.round(rna.value),
    appt_no_lender_count: anl.count, appt_no_lender_value: Math.round(anl.value),
    lender_not_closed_count: lnc.count, lender_not_closed_value: Math.round(lnc.value),
    stale_leads_count: stale,
  };
}
function stageBucketSimple(stage) {
  if (!stage) return 'Other';
  const s = stage.toLowerCase();
  if (s.includes('closed') || s.includes('close')) return 'Closed';
  if (s.includes('archiv')) return 'Archives';
  if (s.includes('warm')) return 'Warm';
  if (s.includes('hot')) return 'Hot';
  if (s.includes('pending')) return 'Pending';
  if (s.includes('spoke')) return 'Spoke';
  return 'Other';
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
function computeBadges(agents, team) {
  const ao = agents.filter(a => !a.is_isa && !a.is_leader);
  const active = agents.filter(a => a.leads_assigned > 0 || a.calls_outbound > 0);
  for (const a of agents) a.badges = [];
  if (!active.length) return;
  const byV = [...ao].sort((a, b) => (b.closed_value || 0) - (a.closed_value || 0));
  if (byV.length && byV[0].closed_value > 0) byV[0].badges.push({ tier: 'gold', name: 'Volume King' });
  for (const a of active) if (a.quality_rate_pct > (team.quality_rate_pct || 0) && a.quality_rate_pct > 0) a.badges.push({ tier: 'gold', name: 'Quality Machine' });
  const byD = [...ao].sort((a, b) => (b.closed_deals || 0) - (a.closed_deals || 0));
  if (byD.length && byD[0].closed_deals > 0) byD[0].badges.push({ tier: 'gold', name: 'Closing Machine' });
  const byC = [...active].sort((a, b) => (b.calls_outbound || 0) - (a.calls_outbound || 0));
  if (byC.length && byC[0].calls_outbound > 0) byC[0].badges.push({ tier: 'silver', name: 'Phone Warrior' });
  const byA = [...active].sort((a, b) => (b.appointments_set || 0) - (a.appointments_set || 0));
  if (byA.length && byA[0].appointments_set > 0) byA[0].badges.push({ tier: 'silver', name: 'Appointment Setter' });
  const wC = active.filter(a => a.calls_per_appointment != null && a.calls_per_appointment > 0);
  const byCPA = [...wC].sort((a, b) => a.calls_per_appointment - b.calls_per_appointment);
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
