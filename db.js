const { Pool } = require('pg');

// ---------------------------------------------------------------------------
// Connection — lazy, never crashes app if DB unavailable
// ---------------------------------------------------------------------------
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

if (!pool) {
  console.warn('DATABASE_URL not set — historical trend tracking disabled');
} else {
  pool.on('error', (err) => {
    console.error('Postgres pool error (non-fatal):', err.message);
  });
}

// ---------------------------------------------------------------------------
// Week normalization — always Monday of current week
// ---------------------------------------------------------------------------
function getWeekDate() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Schema — create tables if they don't exist
// ---------------------------------------------------------------------------
async function initSchema() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_snapshots (
        id SERIAL PRIMARY KEY,
        week_date DATE UNIQUE,
        total_leads INT,
        reach_rate DECIMAL(5,2),
        quality_rate DECIMAL(5,2),
        lender_rate DECIMAL(5,2),
        lead_to_close_rate DECIMAL(5,2),
        closed_deals INT,
        closed_value BIGINT,
        talk_hours DECIMAL(7,1),
        total_calls INT,
        total_appointments INT,
        calls_per_appt DECIMAL(7,1),
        leads_per_closing DECIMAL(7,1),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS agent_snapshots (
        id SERIAL PRIMARY KEY,
        week_date DATE,
        agent_name VARCHAR(100),
        calls_outbound INT,
        calls_connected INT,
        talk_hours DECIMAL(7,1),
        reach_rate DECIMAL(5,2),
        appointments INT,
        quality_leads INT,
        lender_sent INT,
        closed_deals INT,
        closed_value BIGINT,
        calls_per_appt DECIMAL(7,1),
        pipeline INT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(week_date, agent_name)
      );

      CREATE INDEX IF NOT EXISTS idx_agent_snapshots_date
        ON agent_snapshots(week_date DESC);
    `);
    console.log('Database schema initialized');
  } catch (err) {
    console.error('Schema init failed (non-fatal):', err.message);
  }
}

// ---------------------------------------------------------------------------
// Save snapshot — upsert current week data
// ---------------------------------------------------------------------------
async function saveSnapshot(data) {
  if (!pool) return;
  const weekDate = getWeekDate();
  const team = data.team;
  const agents = data.agents || [];

  try {
    // Team snapshot
    await pool.query(`
      INSERT INTO team_snapshots
        (week_date, total_leads, reach_rate, quality_rate, lender_rate,
         lead_to_close_rate, closed_deals, closed_value, talk_hours,
         total_calls, total_appointments, calls_per_appt, leads_per_closing)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (week_date) DO UPDATE SET
        total_leads = EXCLUDED.total_leads,
        reach_rate = EXCLUDED.reach_rate,
        quality_rate = EXCLUDED.quality_rate,
        lender_rate = EXCLUDED.lender_rate,
        lead_to_close_rate = EXCLUDED.lead_to_close_rate,
        closed_deals = EXCLUDED.closed_deals,
        closed_value = EXCLUDED.closed_value,
        talk_hours = EXCLUDED.talk_hours,
        total_calls = EXCLUDED.total_calls,
        total_appointments = EXCLUDED.total_appointments,
        calls_per_appt = EXCLUDED.calls_per_appt,
        leads_per_closing = EXCLUDED.leads_per_closing
    `, [
      weekDate, team.leads_assigned, team.reach_rate_pct, team.quality_rate_pct,
      team.lender_referral_rate_pct, team.lead_to_close_pct, team.closed_deals,
      team.closed_value, team.talk_hours, team.calls_outbound,
      team.appointments_set, team.calls_per_appointment, team.leads_per_closing,
    ]);

    // Agent snapshots
    for (const a of agents) {
      if (!a.name || (!a.leads_assigned && !a.calls_outbound && !a.closed_deals)) continue;
      await pool.query(`
        INSERT INTO agent_snapshots
          (week_date, agent_name, calls_outbound, calls_connected, talk_hours,
           reach_rate, appointments, quality_leads, lender_sent, closed_deals,
           closed_value, calls_per_appt, pipeline)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (week_date, agent_name) DO UPDATE SET
          calls_outbound = EXCLUDED.calls_outbound,
          calls_connected = EXCLUDED.calls_connected,
          talk_hours = EXCLUDED.talk_hours,
          reach_rate = EXCLUDED.reach_rate,
          appointments = EXCLUDED.appointments,
          quality_leads = EXCLUDED.quality_leads,
          lender_sent = EXCLUDED.lender_sent,
          closed_deals = EXCLUDED.closed_deals,
          closed_value = EXCLUDED.closed_value,
          calls_per_appt = EXCLUDED.calls_per_appt,
          pipeline = EXCLUDED.pipeline
      `, [
        weekDate, a.name, a.calls_outbound, a.calls_connected, a.talk_hours,
        a.reach_rate_pct, a.appointments_set, a.quality_leads, a.lender_sent,
        a.closed_deals, a.closed_value, a.calls_per_appointment, a.pipeline_active_count,
      ]);
    }

    console.log(`Snapshot saved for week ${weekDate} (${agents.length} agents)`);
  } catch (err) {
    console.error('Snapshot save failed (non-fatal):', err.message);
  }
}

// ---------------------------------------------------------------------------
// Query trends — last 8 weeks
// ---------------------------------------------------------------------------
async function getTrends() {
  if (!pool) return { team: [], agents: [] };

  try {
    const teamRes = await pool.query(
      'SELECT * FROM team_snapshots ORDER BY week_date DESC LIMIT 8'
    );

    const agentRes = await pool.query(
      `SELECT * FROM agent_snapshots
       WHERE week_date >= NOW() - INTERVAL '8 weeks'
       ORDER BY agent_name, week_date ASC`
    );

    // Parse BIGINT values
    const teamRows = teamRes.rows.map(r => ({
      ...r,
      closed_value: parseInt(r.closed_value) || 0,
      reach_rate: parseFloat(r.reach_rate) || 0,
      quality_rate: parseFloat(r.quality_rate) || 0,
      lender_rate: parseFloat(r.lender_rate) || 0,
      lead_to_close_rate: parseFloat(r.lead_to_close_rate) || 0,
      talk_hours: parseFloat(r.talk_hours) || 0,
      calls_per_appt: parseFloat(r.calls_per_appt) || 0,
      leads_per_closing: parseFloat(r.leads_per_closing) || 0,
    }));

    const agentRows = agentRes.rows.map(r => ({
      ...r,
      closed_value: parseInt(r.closed_value) || 0,
      reach_rate: parseFloat(r.reach_rate) || 0,
      talk_hours: parseFloat(r.talk_hours) || 0,
      calls_per_appt: parseFloat(r.calls_per_appt) || 0,
    }));

    return { team: teamRows, agents: agentRows };
  } catch (err) {
    console.error('Trend query failed (non-fatal):', err.message);
    return { team: [], agents: [] };
  }
}

// ---------------------------------------------------------------------------
// Attach trends to agent objects + compute direction
// ---------------------------------------------------------------------------
function attachTrends(data, trends) {
  if (!trends || !trends.agents.length) return;

  // Group agent trends by name
  const byAgent = {};
  for (const row of trends.agents) {
    if (!byAgent[row.agent_name]) byAgent[row.agent_name] = [];
    byAgent[row.agent_name].push({
      week: row.week_date instanceof Date ? row.week_date.toISOString().slice(0, 10) : String(row.week_date).slice(0, 10),
      reachRate: row.reach_rate,
      callsPerAppt: row.calls_per_appt,
      closedDeals: row.closed_deals,
      appointments: row.appointments,
      pipeline: row.pipeline,
    });
  }

  for (const agent of data.agents) {
    const history = byAgent[agent.name];
    if (!history || history.length < 2) {
      agent.weeklyTrend = null;
      agent.trendDirection = 'Building';
      continue;
    }

    agent.weeklyTrend = history;

    // Trend direction: compare last two weeks' reach_rate
    const current = history[history.length - 1].reachRate;
    const prior = history[history.length - 2].reachRate;

    if (history.length < 3) {
      agent.trendDirection = 'Building';
    } else if (prior === 0) {
      agent.trendDirection = current > 0 ? 'Improving' : 'Steady';
    } else {
      const delta = ((current - prior) / prior) * 100;
      if (delta > 5) agent.trendDirection = 'Improving';
      else if (delta < -5) agent.trendDirection = 'Declining';
      else agent.trendDirection = 'Steady';
    }

    // Delta vs last week
    agent.reachRateDelta = history.length >= 2
      ? Math.round((current - prior) * 10) / 10
      : null;
  }

  // Attach team trend
  if (trends.team.length > 0) {
    data.teamTrend = trends.team.reverse().map(r => ({
      week: r.week_date instanceof Date ? r.week_date.toISOString().slice(0, 10) : String(r.week_date).slice(0, 10),
      reachRate: r.reach_rate,
      callsPerAppt: r.calls_per_appt,
      closedDeals: r.closed_deals,
      totalCalls: r.total_calls,
    }));
  }
}

module.exports = { initSchema, saveSnapshot, getTrends, attachTrends };
