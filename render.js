const BASE = ''; // root-mounted (was /fub-insights)
const LOGO = 'https://momba5.github.io/krgintel-assets/KRG-intel-logo.png';
const BADGE_ICON = 'https://yourbrand.io/wp-content/uploads/2026/03/achievement-2.png';
const FROG_CTA = 'https://yourbrand.io/wp-content/uploads/2026/03/kenna-frog-CTA.png';

const STAGE_COLORS = {
  new: '#60a5fa', attempted: '#fb923c', nurture: '#a78bfa', warm: '#fbbf24',
  hot: '#f87171', spoke: '#22d3ee', pending: '#f472b6',
  archives: '#475569', closed: '#2ecc71'
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

function fmtPct(n) {
  if (n == null) return '—';
  return Number(n).toFixed(1) + '%';
}

function fmtDollar(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtTime(minutes) {
  if (minutes == null) return '—';
  if (minutes < 60) return Math.round(minutes) + 'm';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h + 'h ' + m + 'm';
}

function pctColor(val, target, higherIsBetter = true) {
  if (val == null || target == null) return '';
  const ratio = val / target;
  if (higherIsBetter) {
    if (ratio >= 0.8) return 'green';
    if (ratio >= 0.5) return 'amber';
    return 'red';
  }
  if (ratio <= 1) return 'green';
  if (ratio <= 1.5) return 'amber';
  return 'red';
}

function stageColor(stageName) {
  if (!stageName) return '#475569';
  const lower = stageName.toLowerCase();
  for (const [key, color] of Object.entries(STAGE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#475569';
}

function heatClass(value, low, high) {
  if (value == null) return '';
  if (value >= high) return 'heat-high';
  if (value >= low) return 'heat-med';
  return 'heat-low';
}

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------
function renderLogin(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KRG Intel — Login</title>
  <link rel="stylesheet" href="${BASE}/public/login.css">
</head>
<body>
  <div class="login-bg" aria-hidden="true">
    <div class="login-bg-orb login-bg-orb--cyan"></div>
    <div class="login-bg-orb login-bg-orb--teal"></div>
    <div class="login-bg-scan"></div>
  </div>
  <div class="login-container">
    <div class="login-card">
      <img src="${esc(LOGO)}" alt="KRG Intel" class="login-logo">
      <p class="login-platform">Intelligence Platform</p>
      <h1 class="login-title">Team Performance</h1>
      <p class="login-subtitle">Enter your password to continue</p>
      <form class="login-form" method="POST" action="${BASE}/login">
        <input type="password" name="password" class="login-input" placeholder="Password" autofocus required>
        <button type="submit" class="login-button">Sign In</button>
      </form>
      ${error ? `<div class="login-error">${esc(error)}</div>` : ''}
      <p class="login-footer">KRG Intel &middot; Kenna Real Estate Group</p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------
function renderDashboard(data, config, reminders, refreshState) {
  if (!data) {
    return renderShell(renderNoData(), config, refreshState);
  }

  const sections = [
    renderHealthSnapshot(data, config),
    renderTeamTrends(data),
    renderWinningPath(data),
    renderFunnelSection(data, config),
    renderSourceMatrix(data),
    renderPipelineOpportunity(data),
    renderAgentScorecards(data, config),
    renderAnomalies(data),
    renderCoachingPriorities(data),
    renderReminders(reminders),
  ].join('\n');

  const funBar = renderFunStats(data);

  return renderShell(sections + funBar, config, refreshState);
}

// ---------------------------------------------------------------------------
// Shell (header, nav, container)
// ---------------------------------------------------------------------------
function renderShell(body, config, refreshState) {
  const lastRefresh = refreshState.lastRefresh
    ? new Date(refreshState.lastRefresh).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Never';

  const isStale = refreshState.lastRefresh
    ? (Date.now() - new Date(refreshState.lastRefresh).getTime()) / (1000*60*60*24) > config.thresholds.data_stale_warning_days
    : true;

  const staleBanner = isStale
    ? `<div class="stale-banner">⚠ Data may be stale — last refreshed ${esc(lastRefresh)}. Trigger a refresh to update.</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kenna Real Estate Group — Team Performance Dashboard</title>
  <link rel="stylesheet" href="${BASE}/public/dashboard.css">
</head>
<body>
  <div class="header">
    <img src="${esc(LOGO)}" alt="Kenna" class="header-logo">
    <span class="header-title">Team Performance Dashboard</span>
    <span class="header-meta">Last refreshed ${esc(lastRefresh)}<br>Next refresh Monday 6am</span>
  </div>
  ${staleBanner}
  <nav class="nav">
    <a href="#health">Health</a>
    <a href="#trends">Trends</a>
    <a href="#winning-path">Winning Path</a>
    <a href="#funnel">Funnel</a>
    <a href="#sources">Sources</a>
    <a href="#pipeline">Pipeline</a>
    <a href="#agents">Agents</a>
    <a href="#anomalies">Anomalies</a>
    <a href="#coaching">Coaching</a>
    <a href="#reminders">Reminders</a>
    <a href="${BASE}/logout" style="margin-left:auto;color:var(--white-40);">Logout</a>
  </nav>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// No data state
// ---------------------------------------------------------------------------
function renderNoData() {
  return `<div class="no-data">
  <h2>Welcome to the Kenna Dashboard</h2>
  <p>No data yet. Trigger a refresh to pull data from Follow Up Boss and generate your first dashboard.</p>
  <p style="margin-top:16px;color:var(--white-40);font-size:13px;">
    Call <code>GET ${BASE}/api/refresh?api_key=YOUR_KEY</code> to start the first data pull.
  </p>
</div>`;
}

// ---------------------------------------------------------------------------
// Section 1 — Business Health Snapshot
// ---------------------------------------------------------------------------
function renderHealthSnapshot(data, config) {
  const t = data.team || {};
  const targets = config.targets;
  const callsPct = targets.calls_per_week_agent > 0
    ? Math.round((t.calls_outbound_this_week || 0) / ((data.agents || []).length * targets.calls_per_week_agent) * 100)
    : 0;

  return `<section class="section" id="health">
  <h2 class="section-title">Business Health Snapshot</h2>
  <p class="section-subtitle">The numbers that tell you if the business is healthy</p>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-value">${fmt(t.pipeline_active_count)}</div>
      <div class="kpi-label">Active Pipeline</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value ${pctColor(t.reach_rate_pct, 50)}">${fmtPct(t.reach_rate_pct)}</div>
      <div class="kpi-label">Team Reach Rate</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value ${pctColor(t.quality_rate_pct, 10)}">${fmtPct(t.quality_rate_pct)}</div>
      <div class="kpi-label">Quality Lead Rate</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value ${pctColor(t.lender_referral_rate_pct, targets.lender_referral_rate_pct)}">${fmtPct(t.lender_referral_rate_pct)}</div>
      <div class="kpi-label">Lender Referral Rate</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value ${pctColor(t.lead_to_close_pct, targets.lead_to_close_per_100)}">${fmtPct(t.lead_to_close_pct)}</div>
      <div class="kpi-label">Lead-to-Close Rate</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value teal">${fmtDollar(t.closed_value)}</div>
      <div class="kpi-label">Closed Volume</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">${fmt(t.talk_hours)}</div>
      <div class="kpi-label">Talk Hours</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">${fmt(t.appointments_set)}</div>
      <div class="kpi-label">Appointments Set</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value green">${fmt(t.closed_deals)}</div>
      <div class="kpi-label">Deals Closed</div>
    </div>
  </div>
  <div style="margin-top:20px;">
    <div class="progress-label"><span>Team Calls This Week</span><span>${callsPct}% of target</span></div>
    <div class="progress-wrap">
      <div class="progress-bar ${callsPct >= 100 ? 'over' : 'under'}" style="width:${Math.min(callsPct, 100)}%"></div>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------------------
// Team Trends (shows only with 2+ weeks of data)
// ---------------------------------------------------------------------------
function renderTeamTrends(data) {
  const trend = data.teamTrend;
  if (!trend || trend.length < 2) {
    return `<section class="section" id="trends">
    <h2 class="section-title">Weekly Trends</h2>
    <p class="section-subtitle" style="color:var(--white-20)">Trend data builds over time — check back after next Monday refresh</p>
  </section>`;
  }

  // SVG sparkline helper
  function sparkline(values, color, width = 200, height = 50) {
    if (!values.length) return '';
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = width / Math.max(values.length - 1, 1);
    const points = values.map((v, i) => `${i * step},${height - 4 - ((v - min) / range) * (height - 8)}`).join(' ');
    const labels = values.map((v, i) => {
      const x = i * step;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
    }).join('');
    return `<svg width="${width}" height="${height}" style="display:block">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>
      ${labels}
    </svg>`;
  }

  const weeks = trend.map(t => t.week.slice(5)); // MM-DD
  const reachVals = trend.map(t => t.reachRate || 0);
  const cpaVals = trend.map(t => t.callsPerAppt || 0);
  const closedVals = trend.map(t => t.closedDeals || 0);

  // Week labels
  const weekLabels = `<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--white-20);margin-top:4px">${weeks.map(w => `<span>${w}</span>`).join('')}</div>`;

  return `<section class="section" id="trends">
  <h2 class="section-title">Weekly Trends</h2>
  <p class="section-subtitle">How key metrics are moving week over week</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    <div class="card" style="text-align:center">
      <div style="font-size:12px;font-weight:700;color:var(--white-60);margin-bottom:8px">Reach Rate %</div>
      ${sparkline(reachVals, '#039ba9')}
      ${weekLabels}
      <div style="font-size:18px;font-weight:900;color:var(--teal);margin-top:8px">${reachVals[reachVals.length - 1].toFixed(1)}%</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:12px;font-weight:700;color:var(--white-60);margin-bottom:8px">Calls per Appointment</div>
      ${sparkline(cpaVals, '#ef9f27')}
      ${weekLabels}
      <div style="font-size:18px;font-weight:900;color:var(--amber);margin-top:8px">${Math.round(cpaVals[cpaVals.length - 1])}</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:12px;font-weight:700;color:var(--white-60);margin-bottom:8px">Closed Deals</div>
      ${sparkline(closedVals, '#2ecc71')}
      ${weekLabels}
      <div style="font-size:18px;font-weight:900;color:var(--green);margin-top:8px">${closedVals[closedVals.length - 1]}</div>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------------------
// Section 2 — Winning Path
// ---------------------------------------------------------------------------
function renderWinningPath(data) {
  const wp = data.winningPath || (data.insights && data.insights.winningPath) || {};
  const narrative = (data.insights && data.insights.winningPathNarrative) || '';

  // Determine if calls-to-connect is from real closed deal data or a fallback
  const callsValue = wp.avg_calls_to_connect != null ? Math.round(wp.avg_calls_to_connect) : null;
  const callsDisplay = callsValue != null ? String(callsValue) : '—';
  const callsNote = callsValue != null && wp.based_on_averages ? '(team average)' : callsValue != null ? '(from closed deals)' : 'Insufficient data';

  const steps = [
    { label: 'Speed to Contact', value: fmtTime(wp.avg_speed_to_contact_min), note: 'Industry best practice: under 5 min for internet leads', icon: '⚡' },
    { label: 'Calls to Connect', value: callsDisplay, note: callsNote, icon: '📞' },
    { label: 'Days to Appt', value: wp.avg_days_to_appointment != null ? Math.round(wp.avg_days_to_appointment) + 'd' : '—', note: wp.avg_days_to_appointment != null ? '(from first contact)' : '', icon: '📅' },
    { label: 'Appts Before Lender', value: wp.avg_appts_to_lender != null ? wp.avg_appts_to_lender.toFixed(1) : '—', note: '', icon: '🏦' },
    { label: 'Days to Close', value: wp.avg_days_lender_to_close != null ? Math.round(wp.avg_days_lender_to_close) + 'd' : '—', note: wp.avg_days_lender_to_close != null ? '(from lead creation)' : '', icon: '🏠' },
    { label: 'Top Source', value: esc(wp.top_source_closed || '—'), note: wp.top_source_closed ? '(highest close rate)' : '', icon: '🎯' },
  ];

  const timelineHtml = steps.map((s, i) => {
    const connector = i < steps.length - 1 ? '<div class="timeline-connector"></div>' : '';
    return `<div class="timeline-step">
      <div class="timeline-dot">${s.icon}</div>
      <div class="timeline-value">${s.value}</div>
      <div class="timeline-label">${s.label}</div>
      ${s.note ? `<div style="font-size:10px;color:var(--white-40);margin-top:2px">${s.note}</div>` : ''}
    </div>${connector}`;
  }).join('\n');

  return `<section class="section" id="winning-path">
  <h2 class="section-title">The Winning Path</h2>
  <p class="section-subtitle">Based on ${wp.sample_size || 0} closed deals this period — here is what a Kenna closing actually looks like</p>
  <div class="card">
    <div class="timeline">${timelineHtml}</div>
    ${narrative ? `<div class="insight-block"><img src="${esc(FROG_CTA)}" class="insight-frog" alt="">${narrative.split('\n').map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
  </div>
</section>`;
}

// ---------------------------------------------------------------------------
// Section 3 — Funnel & Law of Averages
// ---------------------------------------------------------------------------
function renderFunnelSection(data, config) {
  const t = data.team || {};
  const targets = config.targets;

  const funnelStages = [
    { name: 'Leads', count: t.leads_assigned },
    { name: 'Calls', count: t.calls_outbound },
    { name: 'Connections', count: t.calls_connected },
    { name: 'Appointments', count: t.appointments_set },
    { name: 'Lender', count: t.lender_sent },
    { name: 'Pending', count: t.pending_deals },
    { name: 'Closed', count: t.closed_deals },
  ];

  const funnelHtml = funnelStages.map((s, i) => {
    const next = funnelStages[i + 1];
    let drop = '';
    if (next && s.count > 0) {
      const dropPct = ((1 - (next.count || 0) / s.count) * 100).toFixed(0);
      drop = `<div class="funnel-drop">-${dropPct}%</div>`;
    }
    const arrow = i < funnelStages.length - 1 ? '<div class="funnel-arrow">→</div>' : '';
    return `<div class="funnel-stage">
      <div class="funnel-count">${fmt(s.count)}</div>
      <div class="funnel-name">${s.name}</div>
      ${drop}
    </div>${arrow}`;
  }).join('\n');

  // Targets vs Actual table
  const comparisons = [
    { metric: 'Calls This Week (Avg/Agent)', actual: Math.round((t.calls_outbound_this_week || 0) / ((data.agents || []).filter(a => !a.is_isa).length || 1)), target: targets.calls_per_week_agent },
    { metric: 'Conversations/Week', actual: t.conversations_per_week_avg, target: targets.conversations_per_week },
    { metric: 'Lead-to-Close / 100', actual: t.lead_to_close_per_100, target: targets.lead_to_close_per_100 },
    { metric: 'Speed to Lead (min)', actual: t.speed_to_lead_avg, target: targets.speed_to_lead_minutes, lower: true },
    { metric: 'Lender Referral Rate %', actual: t.lender_referral_rate_pct, target: targets.lender_referral_rate_pct },
  ];

  const compRows = comparisons.map(c => {
    const color = c.lower
      ? pctColor(c.actual, c.target, false)
      : pctColor(c.actual, c.target, true);
    const chipClass = color === 'green' ? 'chip-green' : color === 'amber' ? 'chip-amber' : 'chip-red';
    const status = color === 'green' ? 'On Track' : color === 'amber' ? 'Building' : 'Opportunity';
    return `<tr>
      <td>${c.metric}</td>
      <td style="font-weight:700">${c.lower ? fmtTime(c.actual) : (c.metric.includes('%') ? fmtPct(c.actual) : fmt(c.actual))}</td>
      <td>${c.lower ? fmtTime(c.target) : (c.metric.includes('%') ? fmtPct(c.target) : fmt(c.target))}</td>
      <td><span class="chip ${chipClass}">${status}</span></td>
    </tr>`;
  }).join('\n');

  // Law of averages
  const loaCards = [
    { label: 'Leads / Closing', value: t.leads_per_closing },
    { label: 'Calls / Appointment', value: t.calls_per_appointment },
    { label: 'Appts / Closing', value: t.appointments_per_closing },
    { label: 'Lender Refs / Closing', value: t.lender_refs_per_closing },
  ];

  // Efficiency leaderboard
  const agents = data.agents || [];
  const effRows = [...agents]
    .filter(a => a.appointments_set > 0)
    .sort((a, b) => (a.calls_per_appointment || 999) - (b.calls_per_appointment || 999))
    .map((a, i) => {
      const color = i === 0 ? 'green' : (a.calls_per_appointment <= (t.calls_per_appointment || 50) ? 'teal' : 'amber');
      return `<tr>
        <td>${esc(a.name)}</td>
        <td><span class="kpi-value ${color}" style="font-size:16px">${fmt(a.calls_per_appointment)}</span></td>
        <td>${fmt(a.appointments_set)}</td>
      </tr>`;
    }).join('\n');

  return `<section class="section" id="funnel">
  <h2 class="section-title">Funnel & Law of Averages</h2>
  <p class="section-subtitle">Your conversion engine — from lead to closing table</p>

  <div class="card" style="margin-bottom:20px">
    <div class="funnel">${funnelHtml}</div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <div class="card">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Targets vs Actual</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Metric</th><th>Actual</th><th>Target</th><th>Status</th></tr></thead>
          <tbody>${compRows}</tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Law of Averages</h3>
      <div class="loa-grid">
        ${loaCards.map(c => `<div class="loa-card"><div class="loa-ratio">${c.value != null ? Math.round(c.value) : '—'}</div><div class="loa-label">${c.label}</div></div>`).join('\n')}
      </div>
    </div>
  </div>

  ${effRows ? `<div class="card">
    <h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Efficiency Leaderboard — Most Efficient Callers</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Agent</th><th>Calls / Appointment</th><th>Appointments</th></tr></thead>
        <tbody>${effRows}</tbody>
      </table>
    </div>
  </div>` : ''}
</section>`;
}

// ---------------------------------------------------------------------------
// Section 4 — Source Quality Matrix
// ---------------------------------------------------------------------------
function renderSourceMatrix(data) {
  const sources = data.sources || [];
  const narrative = (data.insights && data.insights.sourceAnalysis) || '';

  const sortedSources = [...sources].sort((a, b) => (b.revenue_per_lead || 0) - (a.revenue_per_lead || 0));

  // Determine heat thresholds
  const closeRates = sortedSources.map(s => s.close_rate_pct || 0).filter(v => v > 0);
  const crMed = closeRates.length ? closeRates[Math.floor(closeRates.length / 2)] : 5;

  const rows = sortedSources.map(s => {
    const crClass = (s.close_rate_pct || 0) >= crMed * 1.5 ? 'heat-high' : (s.close_rate_pct || 0) >= crMed * 0.5 ? 'heat-med' : 'heat-low';
    return `<tr>
      <td style="font-weight:600">${esc(s.source || 'Untagged')}</td>
      <td>${fmt(s.lead_count)}</td>
      <td>${fmt(s.reached_count)}</td>
      <td>${fmt(s.appointments)}</td>
      <td>${fmt(s.lender_sent)}</td>
      <td>${fmt(s.closings)}</td>
      <td class="${crClass}">${fmtPct(s.close_rate_pct)}</td>
      <td>${fmtDollar(s.closed_value)}</td>
      <td style="font-weight:700">${fmtDollar(s.revenue_per_lead)}</td>
    </tr>`;
  }).join('\n');

  return `<section class="section" id="sources">
  <h2 class="section-title">Source Quality Matrix</h2>
  <p class="section-subtitle">The view FUB cannot show — source performance by outcome, not just volume</p>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Source</th><th>Leads</th><th>Reached</th><th>Appts</th><th>Lender</th><th>Closed</th><th>Close Rate</th><th>Revenue</th><th>Rev/Lead</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${narrative ? `<div class="insight-block">${narrative.split('\n').map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
  </div>
</section>`;
}

// ---------------------------------------------------------------------------
// Section 5 — Pipeline Opportunity
// ---------------------------------------------------------------------------
function renderPipelineOpportunity(data) {
  const p = data.pipeline || {};
  const narrative = (data.insights && data.insights.pipelineOpportunity) || '';

  const buckets = [
    {
      count: p.never_contacted_count,
      label: 'Never Contacted',
      sublabel: 'no outbound attempt logged in FUB',
      note: 'Agents may have called from personal phones which would not appear here',
      color: 'var(--white-40)',
    },
    {
      count: p.reached_no_appt_count,
      label: 'Reached, No Appt',
      sublabel: 'reached — no appointment set yet',
      note: 'Normal for internet leads — most browsers do not become buyers',
      color: 'var(--white-40)',
    },
    {
      count: p.appt_no_lender_count,
      label: 'Appt, No Lender',
      sublabel: 'appointments — no lender referral yet',
      note: 'These people showed up — qualified buyer signal',
      color: 'var(--teal)',
    },
    {
      count: p.lender_not_closed_count,
      label: 'With Lender',
      sublabel: 'with lender — not yet closed',
      note: 'Hottest leads in the pipeline',
      color: 'var(--green)',
    },
    {
      count: p.stale_leads_count,
      label: 'Stale Leads',
      sublabel: 'no activity in 30+ days',
      note: 'Worth a re-engagement attempt',
      color: 'var(--amber)',
    },
  ];

  const cards = buckets.map(b => `<div class="pipeline-card">
    <div class="pipeline-count">${fmt(b.count)}</div>
    <div class="pipeline-label">${b.label}</div>
    <div style="font-size:11px;color:${b.color};margin-top:4px">${b.sublabel}</div>
    <div style="font-size:10px;color:var(--white-20);margin-top:6px;line-height:1.3">${b.note}</div>
  </div>`).join('\n');

  return `<section class="section" id="pipeline">
  <h2 class="section-title">Pipeline Opportunity Analysis</h2>
  <p class="section-subtitle">Where your warmest opportunities are right now</p>
  <div class="pipeline-grid">${cards}</div>
  ${narrative ? `<div class="insight-block" style="margin-top:20px"><img src="${esc(FROG_CTA)}" class="insight-frog" alt="">${narrative.split('\n').map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
</section>`;
}

// ---------------------------------------------------------------------------
// Section 6 — Agent Scorecards
// ---------------------------------------------------------------------------
function renderAgentScorecards(data, config) {
  const agents = data.agents || [];
  const targets = config.targets;

  // Sort: leader first, then by closed_value desc
  const sorted = [...agents].sort((a, b) => {
    if (a.is_leader && !b.is_leader) return -1;
    if (!a.is_leader && b.is_leader) return 1;
    return (b.closed_value || 0) - (a.closed_value || 0);
  });

  const cards = sorted.map(agent => renderAgentCard(agent, data, targets)).join('\n');

  return `<section class="section" id="agents">
  <h2 class="section-title">Agent Scorecards</h2>
  <p class="section-subtitle">Individual performance — every metric computed from live FUB data</p>
  <div class="agent-grid">${cards}</div>
</section>`;
}

function renderAgentCard(agent, data, targets) {
  const roleClass = agent.is_leader ? 'leader' : (agent.is_isa ? 'isa' : 'agent');
  const roleLabel = agent.is_leader ? 'Team Leader' : (agent.is_isa ? 'ISA' : 'Agent');
  const callTarget = agent.is_isa ? targets.calls_per_week_isa : targets.calls_per_week_agent;

  // KPI boxes (role-appropriate)
  const kpis = agent.is_isa
    ? [
        { label: 'Calls Out', value: fmt(agent.calls_outbound) },
        { label: 'Connected', value: fmt(agent.calls_connected) },
        { label: 'Conversations/Wk', value: fmt(agent.conversations_per_week) },
        { label: 'Appts Set', value: fmt(agent.appointments_set) },
        { label: 'Reach Rate', value: fmtPct(agent.reach_rate_pct) },
        { label: 'Speed to Lead', value: fmtTime(agent.speed_to_lead_avg_minutes) },
      ]
    : [
        { label: 'Closed Value', value: fmtDollar(agent.closed_value) },
        { label: 'Deals Closed', value: fmt(agent.closed_deals) },
        { label: 'Quality Rate', value: fmtPct(agent.quality_rate_pct) },
        { label: 'Lender Rate', value: fmtPct(agent.lender_referral_rate_pct) },
        { label: 'Calls/Appt', value: fmt(agent.calls_per_appointment) },
        { label: 'Reach Rate', value: fmtPct(agent.reach_rate_pct) },
      ];

  const kpiHtml = kpis.map(k => `<div class="agent-kpi">
    <div class="agent-kpi-value">${k.value}</div>
    <div class="agent-kpi-label">${k.label}</div>
  </div>`).join('\n');

  // Personal funnel
  const funnelSteps = [
    { label: 'Leads', count: agent.leads_assigned },
    { label: 'Reached', count: agent.leads_reached },
    { label: 'Appts', count: agent.appointments_set },
    { label: 'Lender', count: agent.lender_sent },
    { label: 'Closed', count: agent.closed_deals },
  ];

  const funnelHtml = funnelSteps.map((s, i) => {
    const arrow = i < funnelSteps.length - 1 ? '<span class="agent-funnel-arrow">→</span>' : '';
    return `<div class="agent-funnel-step">
      <div class="agent-funnel-count">${fmt(s.count)}</div>
      <div class="agent-funnel-label">${s.label}</div>
    </div>${arrow}`;
  }).join('');

  // Weekly call target progress
  const callPct = callTarget > 0 ? Math.round((agent.calls_per_week || 0) / callTarget * 100) : 0;
  const convPct = targets.conversations_per_week > 0 ? Math.round((agent.conversations_per_week || 0) / targets.conversations_per_week * 100) : 0;

  // Stage distribution bar
  const stages = agent.stage_distribution || {};
  const totalStage = Object.values(stages).reduce((a, b) => a + b, 0) || 1;
  const stageBarHtml = Object.entries(stages).map(([name, count]) => {
    const pct = (count / totalStage * 100).toFixed(1);
    return `<div class="stage-bar-segment" style="width:${pct}%;background:${stageColor(name)}" title="${esc(name)}: ${count}"></div>`;
  }).join('');

  // Activity chips
  const chips = [];
  if (agent.never_called_count > 0) chips.push(`<span class="chip chip-amber">${agent.never_called_count} never called</span>`);
  if (agent.never_responded_count > 0) chips.push(`<span class="chip chip-red">${agent.never_responded_count} never responded</span>`);
  if (agent.responds_text_count > 0) chips.push(`<span class="chip chip-teal">${agent.responds_text_count} text responders</span>`);
  if (agent.responds_email_count > 0) chips.push(`<span class="chip chip-teal">${agent.responds_email_count} email responders</span>`);

  // Top 3 sources
  const topSources = (agent.top_sources || []).slice(0, 3);
  const sourcesHtml = topSources.length
    ? `<div style="font-size:12px;color:var(--white-40);margin-bottom:12px"><strong>Top Sources:</strong> ${topSources.map(s => esc(s.source) + ' (' + fmt(s.lead_count) + ')').join(' · ')}</div>`
    : '';

  // Claude coaching insight
  const insightHtml = agent.coaching_insight
    ? `<div class="agent-insight"><img src="${esc(FROG_CTA)}" style="width:24px;height:24px;vertical-align:middle;margin-right:6px" alt="">${esc(agent.coaching_insight)}</div>`
    : '';

  // Badges
  const badgesHtml = (agent.badges || []).map(b => {
    const tierClass = b.tier === 'gold' ? 'badge-gold' : b.tier === 'silver' ? 'badge-silver' : 'badge-bronze';
    return `<span class="badge ${tierClass}"><img src="${esc(BADGE_ICON)}" alt="">${esc(b.name)}</span>`;
  }).join('');

  // Trend badge
  const trendDir = agent.trendDirection || 'Building';
  const trendBadge = trendDir === 'Improving' ? '<span style="color:var(--teal);font-weight:700;font-size:12px">↑ Improving</span>'
    : trendDir === 'Declining' ? '<span style="color:var(--amber);font-weight:700;font-size:12px">↓ Declining</span>'
    : trendDir === 'Steady' ? '<span style="color:var(--white-40);font-weight:700;font-size:12px">— Steady</span>'
    : '<span style="color:var(--white-20);font-size:11px">Building</span>';

  // Reach rate delta
  const deltaHtml = agent.reachRateDelta != null
    ? `<span style="font-size:11px;color:${agent.reachRateDelta >= 0 ? 'var(--teal)' : 'var(--amber)'};margin-left:8px">${agent.reachRateDelta >= 0 ? '+' : ''}${agent.reachRateDelta}% vs last week</span>`
    : '';

  // Mini sparkline (SVG) for reach rate trend
  let sparkHtml = '';
  if (agent.weeklyTrend && agent.weeklyTrend.length >= 2) {
    const vals = agent.weeklyTrend.slice(-4).map(w => w.reachRate || 0);
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const range = max - min || 1;
    const points = vals.map((v, i) => `${i * 20},${30 - ((v - min) / range) * 28}`).join(' ');
    sparkHtml = `<svg width="60" height="30" style="margin-left:auto;flex-shrink:0"><polyline points="${points}" fill="none" stroke="var(--teal)" stroke-width="2"/></svg>`;
  }

  return `<div class="agent-card">
  <div class="agent-header">
    <span class="agent-name">${esc(agent.name)}</span>
    <span class="role-badge ${roleClass}">${roleLabel}</span>
    ${trendBadge}${deltaHtml}
    ${sparkHtml}
  </div>
  <div class="agent-summary">${fmt(agent.calls_outbound)} calls · ${fmt(agent.appointments_set)} appts · ${fmt(agent.closed_deals)} closed · ${fmtDollar(agent.closed_value)} volume</div>

  <div class="agent-kpis">${kpiHtml}</div>

  <div class="agent-funnel">${funnelHtml}</div>

  <div style="margin-bottom:12px">
    <div class="progress-label"><span>Calls/Week</span><span>${fmt(agent.calls_per_week)} / ${fmt(callTarget)} (${callPct}%)</span></div>
    <div class="progress-wrap"><div class="progress-bar ${callPct >= 100 ? 'over' : 'under'}" style="width:${Math.min(callPct, 100)}%"></div></div>
  </div>
  <div style="margin-bottom:16px">
    <div class="progress-label"><span>Conversations/Week</span><span>${fmt(agent.conversations_per_week)} / ${fmt(targets.conversations_per_week)} (${convPct}%)</span></div>
    <div class="progress-wrap"><div class="progress-bar ${convPct >= 100 ? 'over' : 'under'}" style="width:${Math.min(convPct, 100)}%"></div></div>
  </div>

  <div class="stage-bar" title="Stage distribution">${stageBarHtml}</div>

  ${chips.length ? `<div class="activity-chips">${chips.join('')}</div>` : ''}
  ${sourcesHtml}
  ${insightHtml}
  ${badgesHtml ? `<div class="badges">${badgesHtml}</div>` : ''}
</div>`;
}

// ---------------------------------------------------------------------------
// Section 7 — Anomalies
// ---------------------------------------------------------------------------
function renderAnomalies(data) {
  const anomalies = (data.insights && data.insights.anomalies) || [];
  if (!anomalies.length) return '';

  const cards = anomalies.map(a => `<div class="anomaly-card">
    <div class="anomaly-title">${esc(a.title)}</div>
    <div class="anomaly-who">${esc(a.who)}</div>
    <div class="anomaly-body">${esc(a.explanation)}</div>
    ${a.conversation_starter ? `<div class="anomaly-starter">"${esc(a.conversation_starter)}"</div>` : ''}
  </div>`).join('\n');

  return `<section class="section" id="anomalies">
  <h2 class="section-title">Anomaly Spotlight</h2>
  <p class="section-subtitle">Unusual patterns worth your attention — framed as opportunities</p>
  <div style="display:grid;gap:16px">${cards}</div>
</section>`;
}

// ---------------------------------------------------------------------------
// Section 8 — Coaching Priorities
// ---------------------------------------------------------------------------
function renderCoachingPriorities(data) {
  const priorities = (data.insights && data.insights.coachingPriorities) || [];
  if (!priorities.length) return '';

  const cards = priorities.map((p, i) => `<div class="coaching-card">
    <div class="coaching-number">${i + 1}</div>
    <div class="coaching-body">${esc(p)}</div>
  </div>`).join('\n');

  return `<section class="section" id="coaching">
  <h2 class="section-title">Coaching Priorities</h2>
  <p class="section-subtitle">Your top 5 opportunities this week, ranked by estimated revenue impact</p>
  <div style="display:grid;gap:16px">${cards}</div>
</section>`;
}

// ---------------------------------------------------------------------------
// Section 9 — Team Reminders
// ---------------------------------------------------------------------------
function renderReminders(reminders) {
  if (!reminders || !reminders.length) return '';

  const cards = reminders.map(r => `<div class="reminder-card">
    <div class="reminder-emoji">${r.emoji || '📌'}</div>
    <div>
      <div class="reminder-title">${esc(r.title)}</div>
      <div class="reminder-desc">${esc(r.description)}</div>
    </div>
  </div>`).join('\n');

  return `<section class="section" id="reminders">
  <h2 class="section-title">Team Reminders</h2>
  <p class="section-subtitle">Notes from Brian</p>
  <div class="reminder-grid">${cards}</div>
</section>`;
}

// ---------------------------------------------------------------------------
// Fun Stats Bar
// ---------------------------------------------------------------------------
function renderFunStats(data) {
  const t = data.team || {};
  const pills = [
    `🔥 ${fmt(t.calls_outbound)} total calls made`,
    `🎙️ ${fmt(t.talk_hours)} talk hours`,
    `🏠 ${fmt(t.closed_deals)} deals closed`,
    `💰 ${fmtDollar(t.closed_value)} volume closed`,
    `📅 ${fmt(t.appointments_set)} appointments set`,
    `👥 ${fmt(t.leads_assigned)} leads in system`,
    `📊 ${fmt(t.calls_per_appointment)} team calls per appt avg`,
  ];

  // Duplicate for seamless loop
  const allPills = [...pills, ...pills].map(p => `<span class="fun-pill">${p}</span>`).join('\n');

  return `<div class="fun-bar"><div class="fun-track">${allPills}</div></div>`;
}

module.exports = { renderDashboard, renderLogin };
