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
  // Build people index by ID and by name for deal→person linking
  const peopleById = {};
  const peopleByName = {};
  for (const p of people) {
    if (p.id) peopleById[p.id] = p;
    if (p.name) peopleByName[p.name.toLowerCase().trim()] = p;
  }

  // Build appointments index by personId (from invitees) for earliest appt date
  const apptsByPersonId = {};
  for (const ap of appointments) {
    for (const inv of (ap.invitees || [])) {
      if (inv.personId) {
        const apptDate = new Date(ap.start || ap.created);
        if (!apptsByPersonId[inv.personId] || apptDate < apptsByPersonId[inv.personId]) {
          apptsByPersonId[inv.personId] = apptDate;
        }
      }
    }
  }

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

      // Find the associated person: try deal.people[0].id first, then name match
      const dealPeople = d.people || [];
      let person = null;
      if (dealPeople.length > 0 && dealPeople[0].id) {
        person = peopleById[dealPeople[0].id] || null;
      }
      if (!person) {
        const dealName = (d.name || '').toLowerCase().trim();
        person = peopleByName[dealName] || null;
      }

      // Source attribution
      const srcKey = person ? ((person.source || '').trim() || 'Unknown') : 'Unknown';
      if (!sourceMap[srcKey]) {
        sourceMap[srcKey] = { source: srcKey, lead_count: 0, reached_count: 0, pipeline_count: 0,
          closings: 0, closed_value: 0, close_rate_pct: 0, revenue_per_lead: 0, appointments: 0, lender_sent: 0 };
      }
      sourceMap[srcKey].closings++;
      sourceMap[srcKey].closed_value += parseFloat(d.price) || 0;

      if (!a._source_data[srcKey]) a._source_data[srcKey] = { source: srcKey, lead_count: 0, closings: 0, closed_value: 0 };
      a._source_data[srcKey].closings++;
      a._source_data[srcKey].closed_value += parseFloat(d.price) || 0;

      // Build enriched journey from person data
      const closeDate = new Date(d.enteredStageAt || d.projectedCloseDate || d.createdAt);
      const journey = {
        speed_to_contact_min: null,
        calls_to_connect: null,
        days_to_appointment: null,
        days_to_close: null,
        lender_tag: false,
        close_date: closeDate,
        source: srcKey,
      };

      if (person) {
        const personCreated = new Date(person.created);
        const pc = callsByPerson[person.id] || [];
        const outbound = pc.filter(c => c.isIncoming === false);

        // Speed to contact: person.created → earliest outbound call
        if (outbound.length > 0) {
          let earliest = Infinity;
          for (const c of outbound) {
            const t = new Date(c.created).getTime();
            if (t < earliest) earliest = t;
          }
          const pcMs = personCreated.getTime();
          if (earliest > pcMs) {
            const mins = (earliest - pcMs) / 60000;
            if (mins <= 4320) journey.speed_to_contact_min = mins; // cap 72h
          }
        }

        // Calls to connect: outbound calls before first connected call
        const sorted = [...outbound].sort((x, y) => new Date(x.created) - new Date(y.created));
        let callCount = 0;
        for (const c of sorted) {
          callCount++;
          if (c.duration > 0) break;
        }
        if (callCount > 0) journey.calls_to_connect = callCount;

        // Days to appointment: earliest appointment date - person.created
        const firstAppt = apptsByPersonId[person.id];
        if (firstAppt) {
          journey.days_to_appointment = (firstAppt.getTime() - personCreated.getTime()) / 86400000;
          if (journey.days_to_appointment < 0) journey.days_to_appointment = null;
        }

        // Days to close: closeDate - person.created
        journey.days_to_close = (closeDate.getTime() - personCreated.getTime()) / 86400000;
        if (journey.days_to_close < 0) journey.days_to_close = null;

        // Lender tag
        const tags = (person.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : '');
        journey.lender_tag = tags.some(t => t.includes('lender application') || t.includes('lender - green'));
      }

      a._closed_journeys.push(journey);
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
  const winningPath = computeWinningPath(allJourneys, team);
  console.log(`Winning path: speed=${winningPath.avg_speed_to_contact_min} calls=${winningPath.avg_calls_to_connect} daysAppt=${winningPath.avg_days_to_appointment} apptsLender=${winningPath.avg_appts_to_lender} daysClose=${winningPath.avg_days_lender_to_close} topSrc=${winningPath.top_source_closed} n=${winningPath.sample_size}`);
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
function computeWinningPath(journeys, team) {
  const empty = { avg_speed_to_contact_min: null, avg_calls_to_connect: null,
    avg_days_to_appointment: null, avg_appts_to_lender: null, avg_days_lender_to_close: null,
    top_source_closed: null, sample_size: 0, based_on_averages: false };
  if (!journeys.length) return empty;

  // Collect values from enriched journeys
  const speeds = journeys.filter(j => j.speed_to_contact_min != null).map(j => j.speed_to_contact_min);
  const callsToConnect = journeys.filter(j => j.calls_to_connect != null && j.calls_to_connect > 0).map(j => j.calls_to_connect);
  const daysToAppt = journeys.filter(j => j.days_to_appointment != null && j.days_to_appointment >= 0).map(j => j.days_to_appointment);
  const daysToClose = journeys.filter(j => j.days_to_close != null && j.days_to_close >= 0).map(j => j.days_to_close);

  // Top source — exclude Unknown/Untagged, find most common real source
  const sc = {};
  for (const j of journeys) {
    const s = j.source;
    if (s && s !== 'Unknown' && s !== 'Untagged') sc[s] = (sc[s] || 0) + 1;
  }
  const topEntries = Object.entries(sc).sort((a, b) => b[1] - a[1]);
  let topSource = null;
  if (topEntries.length > 0) {
    // If top source has > 50% of named sources, use it; otherwise 'Mixed Sources'
    const total = topEntries.reduce((s, e) => s + e[1], 0);
    topSource = topEntries[0][1] / total > 0.3 ? topEntries[0][0] : 'Mixed Sources';
  }

  // Appts to lender: use team ratio as fallback
  const lenderCount = journeys.filter(j => j.lender_tag).length;
  let apptsToLender = null;
  if (lenderCount > 0 && team.appointments_set > 0) {
    apptsToLender = Math.round(team.appointments_set / team.lender_sent * 10) / 10;
  }

  // Use team averages as fallback if journey data is sparse
  const basedOnAverages = speeds.length < 3 && callsToConnect.length < 3;

  return {
    avg_speed_to_contact_min: avg(speeds),
    avg_calls_to_connect: callsToConnect.length >= 3 ? avg(callsToConnect) : (team.calls_per_appointment || null),
    avg_days_to_appointment: avg(daysToAppt),
    avg_appts_to_lender: apptsToLender,
    avg_days_lender_to_close: avg(daysToClose), // days to close from lead creation
    top_source_closed: topSource,
    sample_size: journeys.length,
    based_on_averages: basedOnAverages,
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
// Badges — one winner per badge, ties award to all, gold never to ISAs
// ---------------------------------------------------------------------------
function computeBadges(agents, team) {
  for (const a of agents) a.badges = [];

  const active = agents.filter(a => a.leads_assigned > 0 || a.calls_outbound > 0);
  if (!active.length) return;

  // Gold-eligible: non-ISA agents only
  const goldPool = active.filter(a => !a.is_isa);

  // Award badge to all agents tied for the best value (highest or lowest)
  // Returns without awarding if best value is zero
  function award(pool, field, tier, name, lowest) {
    if (!pool.length) return;
    const sorted = [...pool].sort((a, b) =>
      lowest ? (a[field] || 0) - (b[field] || 0) : (b[field] || 0) - (a[field] || 0)
    );
    const best = sorted[0][field] || 0;
    if (best === 0) return;
    for (const a of sorted) {
      if ((a[field] || 0) === best) a.badges.push({ tier, name });
      else break;
    }
  }

  // Gold badges (agents only, not ISA)
  award(goldPool, 'closed_value', 'gold', 'Volume King');
  award(goldPool, 'closed_deals', 'gold', 'Closing Machine');
  // Quality Machine: highest quality_rate among gold-eligible, must be above team avg
  const qualPool = goldPool.filter(a => a.quality_rate_pct > (team.quality_rate_pct || 0));
  award(qualPool, 'quality_rate_pct', 'gold', 'Quality Machine');

  // Silver badges (all active agents)
  award(active, 'calls_outbound', 'silver', 'Phone Warrior');
  award(active, 'appointments_set', 'silver', 'Appointment Setter');
  award(active, 'lender_sent', 'silver', 'Lender Connector');
  // Speed Demon: lowest calls_per_appointment (most efficient)
  const withCPA = active.filter(a => a.calls_per_appointment != null && a.calls_per_appointment > 0);
  award(withCPA, 'calls_per_appointment', 'silver', 'Speed Demon', true);

  // Bronze badges (all active agents)
  award(active, 'reach_rate_pct', 'bronze', 'Reach Master');
  award(active, 'pipeline_active_count', 'bronze', 'Pipeline Builder');
  award(active, 'talk_hours', 'bronze', 'Talk Time Champ');
}

module.exports = { fetchAllData };
