/* Kenna Real Estate Agent Dashboard — JavaScript */

// ─── DATA ───────────────────────────────────────────────────────────────────

const TEAM = {
  total_clean_leads: 5345,
  total_reached: 2056,
  total_pipeline: 252,
  total_closed_deals: 61,
  total_closed_value: 34334859,
  total_pending_deals: 4,
  total_pending_value: 405000 + 1524000 + 320000, // Brian + Rona + Daniela
  total_commission: 1057403,
  lender_touched_leads: 20
};

const AGENTS = [
  {
    name: "Brian Lee Burke",
    role: "Team Leader & Agent",
    roleType: "team-leader",
    clean_leads: 137,
    reached_yes: 44,
    reached_no: 93,
    reached_pct: 32,
    stages: { Nurture: 22, Attempted: 14, Hot: 2, Archives: 92, Pending: 1, Warm: 3, Closed: 3 },
    top_sources: { RealtyNow: 42, "Google Organic": 20, "kennarealestate.com": 19, "Facebook Lead Ad": 14, "Google PPC": 11 },
    calls_outbound_90d: 47,
    calls_inbound_90d: 7,
    calls_answered_90d: 38,
    avg_talk_seconds: 35,
    calls_no_answer: 17,
    calls_left_msg: 2,
    calls_bad_number: 0,
    notes_90d: 1931,
    deals_closed: 20,
    deals_closed_value: 12148950,
    deals_pending: 1,
    deals_pending_value: 405000,
    deals_listed: 3,
    commission: 330472,
    stl: { never_called: 15, never_responded: 49, responds_text: 13, responds_email: 7, lender_sent: 1, relationship_leads: 14 }
  },
  {
    name: "Felicia Carter",
    role: "ISA (Inside Sales Agent)",
    roleType: "isa",
    clean_leads: 813,
    reached_yes: 297,
    reached_no: 516,
    reached_pct: 37,
    stages: { Attempted: 207, Nurture: 68, Archives: 508, Warm: 25, Hot: 5 },
    top_sources: { "Google Organic": 347, "Google PPC": 120, "Facebook Lead Ad": 118, RealtyNow: 103, "kennarealestate.com": 43 },
    calls_outbound_90d: 634,
    calls_inbound_90d: 34,
    calls_answered_90d: 530,
    avg_talk_seconds: 14,
    calls_no_answer: 101,
    calls_left_msg: 1,
    calls_bad_number: 24,
    notes_90d: 13,
    deals_closed: 0,
    deals_closed_value: 0,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 0,
    stl: { never_called: 89, never_responded: 274, responds_text: 63, responds_email: 9, lender_sent: 8, relationship_leads: 8 }
  },
  {
    name: "Tahverle and Beverly Agent Team",
    role: "Agent",
    roleType: "agent",
    clean_leads: 760,
    reached_yes: 331,
    reached_no: 429,
    reached_pct: 44,
    stages: { Warm: 45, New: 2, Attempted: 206, Nurture: 114, Archives: 387, Hot: 3, Pending: 1, Closed: 2 },
    top_sources: { "Google Organic": 471, "Google PPC": 131, "Facebook Lead Ad": 37, "Direct Traffic": 36, "Bing Organic": 22 },
    calls_outbound_90d: 17,
    calls_inbound_90d: 2,
    calls_answered_90d: 18,
    avg_talk_seconds: 14,
    calls_no_answer: 1,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 6,
    deals_closed: 29,
    deals_closed_value: 16740378,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 462796,
    stl: { never_called: 28, never_responded: 230, responds_text: 97, responds_email: 6, lender_sent: 20, relationship_leads: 9 }
  },
  {
    name: "Rona Lynn",
    role: "Agent",
    roleType: "agent",
    clean_leads: 711,
    reached_yes: 309,
    reached_no: 402,
    reached_pct: 43,
    stages: { Attempted: 166, Nurture: 76, Archives: 420, Hot: 3, Warm: 40, Pending: 2, Closed: 4 },
    top_sources: { "Google Organic": 418, "Google PPC": 84, RealtyNow: 64, "Facebook Lead Ad": 37, "Bing Organic": 27 },
    calls_outbound_90d: 75,
    calls_inbound_90d: 0,
    calls_answered_90d: 41,
    avg_talk_seconds: 15,
    calls_no_answer: 31,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 1,
    deals_closed: 5,
    deals_closed_value: 2439990,
    deals_pending: 2,
    deals_pending_value: 1524000,
    deals_listed: 0,
    commission: 67648,
    stl: { never_called: 58, never_responded: 290, responds_text: 53, responds_email: 3, lender_sent: 10, relationship_leads: 5 }
  },
  {
    name: "Lindsey Jenkins",
    role: "Agent",
    roleType: "agent",
    clean_leads: 545,
    reached_yes: 213,
    reached_no: 332,
    reached_pct: 39,
    stages: { Attempted: 85, Nurture: 169, Warm: 26, Hot: 3, Archives: 255, Pending: 1, Spoke: 2, Closed: 4 },
    top_sources: { "Google Organic": 409, "Facebook Lead Ad": 34, "kennarealestate.com": 29, "Direct Traffic": 20, Sphere: 13 },
    calls_outbound_90d: 359,
    calls_inbound_90d: 26,
    calls_answered_90d: 96,
    avg_talk_seconds: 46,
    calls_no_answer: 18,
    calls_left_msg: 67,
    calls_bad_number: 30,
    notes_90d: 9,
    deals_closed: 4,
    deals_closed_value: 1333251,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 2,
    commission: 138569,
    stl: { never_called: 20, never_responded: 155, responds_text: 73, responds_email: 11, lender_sent: 23, relationship_leads: 20 }
  },
  {
    name: "Brenna Lodge",
    role: "Agent",
    roleType: "agent",
    clean_leads: 381,
    reached_yes: 148,
    reached_no: 233,
    reached_pct: 39,
    stages: { New: 2, Nurture: 81, Attempted: 90, Archives: 170, Warm: 31, Hot: 5, Spoke: 1, Closed: 1 },
    top_sources: { "Google Organic": 130, RealtyNow: 98, "Facebook Lead Ad": 42, Sphere: 38, "kennarealestate.com": 22 },
    calls_outbound_90d: 136,
    calls_inbound_90d: 0,
    calls_answered_90d: 71,
    avg_talk_seconds: 8,
    calls_no_answer: 49,
    calls_left_msg: 0,
    calls_bad_number: 5,
    notes_90d: 1,
    deals_closed: 0,
    deals_closed_value: 0,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 0,
    stl: { never_called: 25, never_responded: 124, responds_text: 11, responds_email: 5, lender_sent: 2, relationship_leads: 39 }
  },
  {
    name: "Daniela Draper",
    role: "Agent",
    roleType: "agent",
    clean_leads: 376,
    reached_yes: 196,
    reached_no: 180,
    reached_pct: 52,
    stages: { Attempted: 126, Warm: 20, Archives: 137, Nurture: 83, Hot: 5, Spoke: 2, Closed: 2, Pending: 1 },
    top_sources: { "Google Organic": 212, "Facebook Lead Ad": 60, "Google PPC": 27, "kennarealestate.com": 22, "Direct Traffic": 17 },
    calls_outbound_90d: 435,
    calls_inbound_90d: 19,
    calls_answered_90d: 291,
    avg_talk_seconds: 21,
    calls_no_answer: 158,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 4,
    deals_closed: 0,
    deals_closed_value: 0,
    deals_pending: 1,
    deals_pending_value: 320000,
    deals_listed: 0,
    commission: 8960,
    stl: { never_called: 39, never_responded: 136, responds_text: 32, responds_email: 6, lender_sent: 7, relationship_leads: 2 }
  },
  {
    name: "Tommy Reed",
    role: "Agent",
    roleType: "agent",
    clean_leads: 1386,
    reached_yes: 388,
    reached_no: 998,
    reached_pct: 28,
    stages: { Attempted: 707, Archives: 212, Nurture: 89, Hot: 4, Warm: 11, Spoke: 8, New: 353, Closed: 2 },
    top_sources: { "Google Organic": 845, "Google PPC": 145, RealtyNow: 145, "kennarealestate.com": 86, "Direct Traffic": 51 },
    calls_outbound_90d: 153,
    calls_inbound_90d: 3,
    calls_answered_90d: 8,
    avg_talk_seconds: 36,
    calls_no_answer: 2,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 9,
    deals_closed: 0,
    deals_closed_value: 0,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 0,
    stl: { never_called: 102, never_responded: 375, responds_text: 161, responds_email: 19, lender_sent: 16, relationship_leads: 8 }
  },
  {
    name: "Henry Chu",
    role: "Agent",
    roleType: "agent",
    clean_leads: 118,
    reached_yes: 48,
    reached_no: 70,
    reached_pct: 41,
    stages: { New: 62, Nurture: 28, Warm: 1, Spoke: 1, Attempted: 3, Archives: 23 },
    top_sources: { "Google Organic": 69, "Open House": 16, "Direct Traffic": 8, "Agent Site": 5, "Google PPC": 4 },
    calls_outbound_90d: 42,
    calls_inbound_90d: 0,
    calls_answered_90d: 1,
    avg_talk_seconds: 407,
    calls_no_answer: 41,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 0,
    deals_closed: 1,
    deals_closed_value: 605000,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 16940,
    stl: { never_called: 4, never_responded: 37, responds_text: 6, responds_email: 3, lender_sent: 1, relationship_leads: 24 }
  },
  {
    name: "James Locus",
    role: "Agent",
    roleType: "agent",
    clean_leads: 101,
    reached_yes: 78,
    reached_no: 23,
    reached_pct: 77,
    stages: { Nurture: 55, Archives: 28, Warm: 11, Attempted: 6, New: 1 },
    top_sources: { RealtyNow: 68, "Google Organic": 12, "kennarealestate.com": 9, "Facebook Lead Ad": 7, "Realtor.com": 1 },
    calls_outbound_90d: 0,
    calls_inbound_90d: 0,
    calls_answered_90d: 0,
    avg_talk_seconds: 0,
    calls_no_answer: 0,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 0,
    deals_closed: 2,
    deals_closed_value: 1067290,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 32018,
    stl: { never_called: 0, never_responded: 33, responds_text: 9, responds_email: 3, lender_sent: 0, relationship_leads: 2 }
  },
  {
    name: "Jack Lang",
    role: "Agent",
    roleType: "agent",
    clean_leads: 3,
    reached_yes: 3,
    reached_no: 0,
    reached_pct: 100,
    stages: { Hot: 2, Closed: 1 },
    top_sources: { Company: 1, "kennarealestate.com": 1, "Google Organic": 1 },
    calls_outbound_90d: 0,
    calls_inbound_90d: 5,
    calls_answered_90d: 3,
    avg_talk_seconds: 17,
    calls_no_answer: 5,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 0,
    deals_closed: 0,
    deals_closed_value: 0,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 0,
    stl: { never_called: 0, never_responded: 0, responds_text: 0, responds_email: 0, lender_sent: 0, relationship_leads: 0 }
  },
  {
    name: "Damon L. Chavez",
    role: "Agent",
    roleType: "agent",
    isNew: true,
    clean_leads: 14,
    reached_yes: 1,
    reached_no: 13,
    reached_pct: 7,
    stages: { New: 8, Attempted: 3, Nurture: 2, Warm: 1 },
    top_sources: { "Google Organic": 11, "Direct Traffic": 1, Duckduckgo: 1, "Seller Lead Site": 1 },
    calls_outbound_90d: 0,
    calls_inbound_90d: 0,
    calls_answered_90d: 0,
    avg_talk_seconds: 0,
    calls_no_answer: 0,
    calls_left_msg: 0,
    calls_bad_number: 0,
    notes_90d: 0,
    deals_closed: 0,
    deals_closed_value: 0,
    deals_pending: 0,
    deals_pending_value: 0,
    deals_listed: 0,
    commission: 0,
    stl: { never_called: 10, never_responded: 9, responds_text: 1, responds_email: 0, lender_sent: 0, relationship_leads: 0 }
  }
];

const FUB_SOURCES = [
  { source: "Google Organic", leads: 2945, reached: 1152, reached_pct: 39, pipeline: 136, closed: 7, archives: 1216 },
  { source: "RealtyNow", leads: 541, reached: 218, reached_pct: 40, pipeline: 27, closed: 0, archives: 211 },
  { source: "Google PPC", leads: 540, reached: 158, reached_pct: 29, pipeline: 15, closed: 0, archives: 265 },
  { source: "Facebook Lead Ad", leads: 390, reached: 129, reached_pct: 33, pipeline: 18, closed: 0, archives: 148 },
  { source: "kennarealestate.com", leads: 271, reached: 126, reached_pct: 46, pipeline: 9, closed: 0, archives: 108 },
  { source: "Direct Traffic", leads: 206, reached: 74, reached_pct: 36, pipeline: 14, closed: 1, archives: 81 },
  { source: "Website Registration", leads: 75, reached: 29, reached_pct: 39, pipeline: 5, closed: 0, archives: 27 },
  { source: "Bing Organic", leads: 71, reached: 29, reached_pct: 41, pipeline: 5, closed: 0, archives: 38 },
  { source: "Sphere", leads: 70, reached: 16, reached_pct: 23, pipeline: 2, closed: 4, archives: 39 },
  { source: "Duckduckgo", leads: 49, reached: 22, reached_pct: 45, pipeline: 3, closed: 0, archives: 17 },
  { source: "Yahoo", leads: 29, reached: 18, reached_pct: 62, pipeline: 3, closed: 0, archives: 19 },
  { source: "(unspecified)", leads: 20, reached: 11, reached_pct: 55, pipeline: 2, closed: 1, archives: 9 },
  { source: "Open House", leads: 18, reached: 6, reached_pct: 33, pipeline: 0, closed: 0, archives: 2 },
  { source: "Seller Lead Site", leads: 15, reached: 10, reached_pct: 67, pipeline: 1, closed: 0, archives: 9 },
  { source: "Kenna Lead", leads: 11, reached: 9, reached_pct: 82, pipeline: 2, closed: 1, archives: 6 },
  { source: "Agent Site", leads: 10, reached: 8, reached_pct: 80, pipeline: 1, closed: 0, archives: 4 },
  { source: "Referral", leads: 9, reached: 6, reached_pct: 67, pipeline: 1, closed: 2, archives: 1 },
  { source: "By Agent", leads: 8, reached: 5, reached_pct: 62, pipeline: 1, closed: 1, archives: 3 },
  { source: "Agent personal home", leads: 8, reached: 5, reached_pct: 62, pipeline: 1, closed: 0, archives: 2 },
  { source: "RealScout", leads: 7, reached: 4, reached_pct: 57, pipeline: 1, closed: 1, archives: 4 },
  { source: "HouseJet", leads: 6, reached: 3, reached_pct: 50, pipeline: 0, closed: 0, archives: 0 },
  { source: "Phone Call", leads: 6, reached: 3, reached_pct: 50, pipeline: 3, closed: 0, archives: 1 },
  { source: "Facebook", leads: 6, reached: 3, reached_pct: 50, pipeline: 1, closed: 0, archives: 2 }
];

const GA4_CHANNELS = [
  { channel: "Direct", sessions: 267365, conversions: 18, engaged: 35468, bounce_rate: 0.867 },
  { channel: "Organic Search", sessions: 66010, conversions: 55, engaged: 39169, bounce_rate: 0.407 },
  { channel: "Display", sessions: 6772, conversions: 0, engaged: 2819, bounce_rate: 0.584 },
  { channel: "Paid Search", sessions: 3830, conversions: 0, engaged: 2624, bounce_rate: 0.315 },
  { channel: "Referral", sessions: 2727, conversions: 12, engaged: 1856, bounce_rate: 0.319 },
  { channel: "Organic Social", sessions: 1005, conversions: 0, engaged: 681, bounce_rate: 0.322 },
  { channel: "Email", sessions: 953, conversions: 9, engaged: 547, bounce_rate: 0.426 },
  { channel: "Paid Social", sessions: 349, conversions: 1, engaged: 210, bounce_rate: 0.398 },
  { channel: "SMS", sessions: 141, conversions: 4, engaged: 73, bounce_rate: 0.482 }
];

const MONTHLY_DATA = [
  {month:"Jul 2025", leads:575, reached:161},
  {month:"Aug 2025", leads:598, reached:248},
  {month:"Sep 2025", leads:585, reached:255},
  {month:"Oct 2025", leads:508, reached:202},
  {month:"Nov 2025", leads:373, reached:124},
  {month:"Dec 2025", leads:491, reached:172},
  {month:"Jan 2026", leads:855, reached:460},
  {month:"Feb 2026", leads:832, reached:289},
  {month:"Mar 2026*", leads:528, reached:145},
];

const FEB_AGENTS = [
  {name:"Rona Lynn",leads:163},{name:"Tommy Reed",leads:144},
  {name:"Tahverle & Beverly",leads:119},{name:"Lindsey Jenkins",leads:105},
  {name:"Felicia Carter",leads:91},{name:"Brenna Lodge",leads:91},
  {name:"Daniela Draper",leads:86},{name:"Brian Burke",leads:25},
  {name:"Henry Chu",leads:6},{name:"Damon Chavez",leads:1},{name:"Jack Lang",leads:1}
];

const FEB_SOURCES = [
  {source:"Google Organic",leads:433},{source:"Facebook Lead Ad",leads:112},
  {source:"Google PPC",leads:96},{source:"RealtyNow",leads:81},
  {source:"Direct Traffic",leads:29},{source:"kennarealestate.com",leads:27}
];

const HOT_VISITORS = [
  {name:"Chen Yan",visits:284,agent:"Henry Chu",stage:"Nurture"},
  {name:"Lisa Hinton",visits:155,agent:"Brenna Lodge",stage:"Warm"},
  {name:"Tracie Holliday",visits:153,agent:"Tommy Reed",stage:"Nurture"},
  {name:"Wendy Karpowicz",visits:83,agent:"Brian Burke",stage:"Warm"},
  {name:"Samantha Dotson",visits:77,agent:"Tommy Reed",stage:"Warm — has deal"}
];

const FUN_STATS = [
  {emoji:"📞",text:"2,000 calls made in 90 days"},
  {emoji:"🕐",text:"6.4 hours of phone conversations"},
  {emoji:"📝",text:"Brian wrote 1,931 notes — 21 per day"},
  {emoji:"🏠",text:"Average deal: $543,820"},
  {emoji:"💰",text:"Biggest deal: $1.4M (Jen Grauer)"},
  {emoji:"📈",text:"20.3 new leads per day"},
  {emoji:"🤖",text:"266 visitors found Kenna via ChatGPT"},
  {emoji:"🐸",text:"Sphere leads close at 8.6% — your network is your net worth"}
];

const BRAND_DATA = {
  sphere_leads: 106,
  sphere_closed: 8,
  sphere_close_rate: 7.5,
  sphere_volume: 5803000,
  online_leads: 4565,
  online_closed: 7,
  online_close_rate: 0.15,
  online_volume: 470000,
  paid_spend_estimate: 22050,
  avg_deal_value: 543820,
  top_builders: [
    {name:"Brenna Lodge", pct:10},
    {name:"Brian Burke", pct:9},
    {name:"Henry Chu", pct:7},
    {name:"Lindsey Jenkins", pct:3}
  ]
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

const STAGE_ORDER = ["New", "Attempted", "Spoke", "Nurture", "Warm", "Hot", "Pending", "Closed", "Archives"];
const STAGE_COLORS = {
  New: "#60a5fa",
  Attempted: "#fbbf24",
  Spoke: "#22d3ee",
  Nurture: "#a78bfa",
  Warm: "#fb923c",
  Hot: "#f87171",
  Pending: "#f472b6",
  Closed: "#2ecc71",
  Archives: "#475569"
};

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#6366f1",
  "#a855f7", "#ef4444"
];

function fmt(n) {
  return n.toLocaleString("en-US");
}

function fmtMoney(n) {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + fmt(n);
}

function fmtMoneyFull(n) {
  return "$" + fmt(n);
}

function pct(n, d) {
  if (d === 0) return "0%";
  return Math.round((n / d) * 100) + "%";
}

function initials(name) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function getPipeline(agent) {
  const s = agent.stages;
  return (s.Warm || 0) + (s.Hot || 0) + (s.Pending || 0);
}

// Calculate team-wide pipeline from actual stage data
function calcTeamPipeline() {
  let total = 0;
  AGENTS.forEach(a => { total += getPipeline(a); });
  return total;
}

// ─── RENDER FUNCTIONS ───────────────────────────────────────────────────────

function renderTeamOverview() {
  const pipeline = calcTeamPipeline();
  const pendingValue = TEAM.total_pending_value;

  let html = `
    <div id="team-overview" class="section-header">
      <h2 class="section-title">Team Overview</h2>
      <p class="section-subtitle">Kenna Real Estate — Post-Migration Data (Jul 2025 – Mar 2026) · Phone & Notes: Last 90 Days</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-value teal">${fmt(TEAM.total_clean_leads)}</div>
        <div class="kpi-label">Clean Leads in Follow Up Boss</div>
        <div class="kpi-note">Post-migration leads only — excludes imported/plus records</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value blue">${fmt(TEAM.total_reached)} <span style="font-size:16px;color:var(--text-muted)">(${pct(TEAM.total_reached, TEAM.total_clean_leads)})</span></div>
        <div class="kpi-label">Reached: ${fmt(TEAM.total_reached)} of ${fmt(TEAM.total_clean_leads)} leads</div>
        <div class="kpi-note">FUB shows some form of contact — call, text, or email</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value purple">${fmt(pipeline)}</div>
        <div class="kpi-label">Active Pipeline</div>
        <div class="kpi-note">Leads currently in Warm, Hot, or Pending stages</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value teal">${TEAM.total_closed_deals}</div>
        <div class="kpi-label">Closed Deals — ${fmtMoney(TEAM.total_closed_value)} total volume</div>
        <div class="kpi-note">Deals marked Closed in FUB since Jul 2025</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value orange">${TEAM.total_pending_deals}</div>
        <div class="kpi-label">Pending Deals — ${fmtMoney(pendingValue)} total value</div>
        <div class="kpi-note">Under contract, not yet closed</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value yellow">${TEAM.lender_touched_leads}</div>
        <div class="kpi-label">Lender-Touched Leads</div>
        <div class="kpi-note">Leads who spoke with Mike Oswald or Krystal Moon — a buying signal</div>
      </div>
    </div>
  `;

  return html;
}

function renderFunnelChart() {
  // Sum stages across all agents
  const totals = {};
  STAGE_ORDER.forEach(s => totals[s] = 0);
  AGENTS.forEach(agent => {
    Object.entries(agent.stages).forEach(([stage, count]) => {
      if (totals[stage] !== undefined) totals[stage] += count;
    });
  });

  return `
    <div class="funnel-section">
      <div class="funnel-title">Team-Wide Lead Stage Funnel — Where All ${fmt(TEAM.total_clean_leads)} Leads Are Right Now</div>
      <div class="funnel-chart-wrapper">
        <canvas id="funnelChart"></canvas>
      </div>
    </div>
  `;
}

function initFunnelChart() {
  const totals = {};
  STAGE_ORDER.forEach(s => totals[s] = 0);
  AGENTS.forEach(agent => {
    Object.entries(agent.stages).forEach(([stage, count]) => {
      if (totals[stage] !== undefined) totals[stage] += count;
    });
  });

  const ctx = document.getElementById("funnelChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: STAGE_ORDER.map(s => s + ": " + fmt(totals[s])),
      datasets: [{
        data: STAGE_ORDER.map(s => totals[s]),
        backgroundColor: STAGE_ORDER.map(s => STAGE_COLORS[s]),
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.7
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => fmt(ctx.raw) + " leads"
          }
        }
      },
      layout: {
        padding: { left: 20 }
      },
      scales: {
        x: {
          grid: { color: "rgba(45,47,69,0.5)" },
          ticks: { color: "#94a3b8", font: { size: 12, family: "Inter" } }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#e2e8f0", font: { size: 13, family: "Inter", weight: 600 }, padding: 8 }
        }
      }
    }
  });
}

function renderAgentCards() {
  // Sort: Brian first (team leader), then by deals_closed_value desc
  const sorted = [...AGENTS].sort((a, b) => {
    if (a.roleType === "team-leader") return -1;
    if (b.roleType === "team-leader") return 1;
    return b.deals_closed_value - a.deals_closed_value;
  });

  let html = `
    <hr class="section-divider">
    <div id="agent-cards" class="section-header">
      <h2 class="section-title">Agent Performance Cards</h2>
      <p class="section-subtitle">Individual performance for each team member — sorted by closed deal volume</p>
    </div>

    <div class="badge-legend">
      <h4>Achievement Badge Guide</h4>
      <div class="badge-legend-grid">
        <!-- Bronze tier -->
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#cd7f32"><img src="img/badge-icon.png" class="badge-icon"> Prospector</span>
          <span class="badge-desc">Reached 35%+ of assigned leads</span>
        </div>
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#cd7f32"><img src="img/badge-icon.png" class="badge-icon"> Speed Dial</span>
          <span class="badge-desc">100+ outbound calls in 90 days</span>
        </div>
        <!-- Silver tier -->
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#c0c0c0"><img src="img/badge-icon.png" class="badge-icon"> Conversation Starter</span>
          <span class="badge-desc">12%+ of leads respond to text or email</span>
        </div>
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#c0c0c0"><img src="img/badge-icon.png" class="badge-icon"> Pipeline Builder</span>
          <span class="badge-desc">5%+ of leads in Warm/Hot/Pending stages</span>
        </div>
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#c0c0c0"><img src="img/badge-icon.png" class="badge-icon"> First Responder</span>
          <span class="badge-desc">Under 5% of leads tagged "Never Called"</span>
        </div>
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#c0c0c0"><img src="img/badge-icon.png" class="badge-icon"> Mover</span>
          <span class="badge-desc">20%+ of leads advanced to Nurture or beyond</span>
        </div>
        <!-- Gold tier -->
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#ffd700"><img src="img/badge-icon.png" class="badge-icon"> Finance Ready</span>
          <span class="badge-desc">3+ leads sent to lender</span>
        </div>
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#ffd700"><img src="img/badge-icon.png" class="badge-icon"> Closer</span>
          <span class="badge-desc">Closed at least 1 deal</span>
        </div>
        <!-- Platinum tier -->
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#e5e4e2"><img src="img/badge-icon.png" class="badge-icon"> Rainmaker</span>
          <span class="badge-desc">5+ closings AND 5+ relationship leads</span>
        </div>
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#e5e4e2"><img src="img/badge-icon.png" class="badge-icon"> Team Leader</span>
          <span class="badge-desc">Leads and coaches the team</span>
        </div>
        <!-- ISA badges -->
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#ffd700"><img src="img/badge-icon.png" class="badge-icon"> Phone Warrior</span>
          <span class="badge-desc">ISA: 500+ outbound calls in 90 days</span>
        </div>
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:#c0c0c0"><img src="img/badge-icon.png" class="badge-icon"> Lead Warmer</span>
          <span class="badge-desc">ISA: Advancing leads past Attempted stage</span>
        </div>
        <!-- Special -->
        <div class="badge-legend-item">
          <span class="badge-pill" style="background:linear-gradient(135deg, #f87171, #fbbf24)"><img src="img/badge-icon.png" class="badge-icon"> 🥩 Steak Dinner Winner</span>
          <span class="badge-desc">TBD — Brian's special award. Stay tuned.</span>
        </div>
      </div>
    </div>

    <div class="agent-grid">
  `;

  sorted.forEach((agent, i) => {
    html += renderOneAgentCard(agent, i);
  });

  html += `</div>`;
  return html;
}

function renderOneAgentCard(agent, colorIdx) {
  const isISA = agent.roleType === "isa";
  const isTeamLeader = agent.roleType === "team-leader";
  const isNew = agent.isNew;
  const pipeline = getPipeline(agent);
  const totalCalls = agent.calls_outbound_90d;
  const answered = agent.calls_answered_90d;

  // Badge
  let badgeClass, badgeText;
  if (isTeamLeader) {
    badgeClass = "badge-team-leader";
    badgeText = "Team Leader";
  } else if (isISA) {
    badgeClass = "badge-isa";
    badgeText = "ISA";
  } else {
    badgeClass = "badge-agent";
    badgeText = "Agent";
  }

  // Metrics row
  let metricsHtml;
  if (isISA) {
    metricsHtml = `
      <div class="agent-metric">
        <div class="agent-metric-value">${fmt(agent.clean_leads)}</div>
        <div class="agent-metric-label">Leads Assigned</div>
      </div>
      <div class="agent-metric">
        <div class="agent-metric-value">${fmt(agent.reached_yes)}</div>
        <div class="agent-metric-label">Reached: ${agent.reached_yes} of ${agent.clean_leads}</div>
      </div>
      <div class="agent-metric">
        <div class="agent-metric-value">${fmt(agent.calls_outbound_90d)}</div>
        <div class="agent-metric-label">Outbound Calls (90 days)</div>
      </div>
      <div class="agent-metric">
        <div class="agent-metric-value">${fmt(agent.calls_answered_90d)}</div>
        <div class="agent-metric-label">Calls Answered (90 days)</div>
      </div>
    `;
  } else {
    metricsHtml = `
      <div class="agent-metric">
        <div class="agent-metric-value">${fmt(agent.clean_leads)}</div>
        <div class="agent-metric-label">Leads Assigned</div>
      </div>
      <div class="agent-metric">
        <div class="agent-metric-value">${fmt(agent.reached_yes)}</div>
        <div class="agent-metric-label">Reached: ${agent.reached_yes} of ${agent.clean_leads}</div>
      </div>
      <div class="agent-metric">
        <div class="agent-metric-value">${pipeline}</div>
        <div class="agent-metric-label">Active Pipeline (Warm+Hot+Pending)</div>
      </div>
      <div class="agent-metric">
        <div class="agent-metric-value">${agent.deals_closed}</div>
        <div class="agent-metric-label">Closed Deals${agent.deals_closed > 0 ? " — " + fmtMoney(agent.deals_closed_value) : ""}</div>
      </div>
    `;
  }

  // Phone activity
  let phoneHtml = `<div class="agent-section">
    <div class="agent-section-title">Phone Activity (Last 90 Days)</div>
    <div class="phone-stats">`;

  phoneHtml += `<span class="phone-stat">Outbound calls: <strong>${fmt(totalCalls)}</strong></span>`;

  if (agent.calls_inbound_90d > 0) {
    phoneHtml += `<span class="phone-stat">Inbound calls: <strong>${fmt(agent.calls_inbound_90d)}</strong></span>`;
  }

  const totalAllCalls = totalCalls + agent.calls_inbound_90d;
  if (totalAllCalls > 20) {
    phoneHtml += `<span class="phone-stat">Answered: <strong>${fmt(answered)} of ${fmt(totalAllCalls)} total (${pct(answered, totalAllCalls)})</strong></span>`;
  } else if (totalAllCalls > 0) {
    phoneHtml += `<span class="phone-stat">Answered: <strong>${fmt(answered)} of ${fmt(totalAllCalls)} total</strong></span>`;
  } else {
    phoneHtml += `<span class="phone-stat">Answered: <strong>0</strong></span>`;
  }

  if (answered > 0) {
    const talkTime = agent.avg_talk_seconds;
    const talkLabel = talkTime >= 60 ? Math.floor(talkTime / 60) + "m " + (talkTime % 60) + "s" : talkTime + "s";
    phoneHtml += `<span class="phone-stat">Avg talk time: <strong>${talkLabel}</strong> (when answered)</span>`;
  }

  if (agent.calls_left_msg > 0) {
    phoneHtml += `<span class="phone-stat">Left message: <strong>${fmt(agent.calls_left_msg)}</strong></span>`;
  }
  phoneHtml += `<span class="phone-stat">No answer: <strong>${fmt(agent.calls_no_answer)}</strong></span>`;
  phoneHtml += `<span class="phone-stat">Notes written (90 days): <strong>${fmt(agent.notes_90d)}</strong></span>`;

  phoneHtml += `</div></div>`;

  // Stage bar
  const stageTotal = Object.values(agent.stages).reduce((a, b) => a + b, 0);
  let stageBarHtml = `<div class="stage-bar-container">
    <div class="stage-bar-title">Where Their ${fmt(stageTotal)} Leads Are — Stage Breakdown</div>
    <div class="stage-bar">`;

  STAGE_ORDER.forEach(stage => {
    const count = agent.stages[stage] || 0;
    if (count === 0) return;
    const widthPct = (count / stageTotal) * 100;
    const label = widthPct > 6 ? count : "";
    stageBarHtml += `<div class="stage-segment" style="width:${widthPct}%;background:${STAGE_COLORS[stage]}" title="${stage}: ${count} leads (${Math.round(widthPct)}%)">${label}</div>`;
  });

  stageBarHtml += `</div><div class="stage-legend">`;
  STAGE_ORDER.forEach(stage => {
    const count = agent.stages[stage] || 0;
    if (count === 0) return;
    stageBarHtml += `<span class="stage-legend-item"><span class="stage-legend-dot" style="background:${STAGE_COLORS[stage]}"></span>${stage}: ${count}</span>`;
  });
  stageBarHtml += `</div></div>`;

  // Strengths
  const strengths = generateStrengths(agent);
  const coaching = generateCoaching(agent);

  let strengthsHtml = `<div class="coaching-grid">
    <div class="coaching-section">
      <div class="coaching-title green"><span class="icon">✓</span> Strengths</div>
      <ul class="coaching-list green">`;
  strengths.forEach(s => { strengthsHtml += `<li>${s}</li>`; });
  strengthsHtml += `</ul></div>
    <div class="coaching-section">
      <img src="img/frog-peek.png" alt="" class="coaching-frog">
      <div class="coaching-title blue"><span class="icon">💡</span> Where Brian Can Help</div>
      <ul class="coaching-list blue">`;
  coaching.forEach(c => { strengthsHtml += `<li>${c}</li>`; });
  strengthsHtml += `</ul></div></div>`;

  // Speed-to-lead chips
  const stlHtml = renderSTLChips(agent);

  // Achievement badges
  const badgesHtml = renderBadges(agent);

  // New agent badge
  let newBadge = "";
  if (isNew) {
    newBadge = ` <span class="agent-badge badge-new-agent">New Agent — Building Pipeline</span>`;
  }

  return `
    <div class="agent-card">
      <div class="agent-header">
        <div class="agent-avatar" style="background:${AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]}">${initials(agent.name)}</div>
        <div>
          <div class="agent-name">${agent.name}${newBadge}</div>
        </div>
        <span class="agent-badge ${badgeClass}" style="margin-left:auto">${badgeText}</span>
      </div>
      <div class="agent-metrics">${metricsHtml}</div>
      ${phoneHtml}
      ${stageBarHtml}
      ${stlHtml}
      ${strengthsHtml}
      ${badgesHtml}
    </div>
  `;
}

function generateStrengths(agent) {
  const strengths = [];
  const isISA = agent.roleType === "isa";
  const pipeline = getPipeline(agent);
  const totalCalls = agent.calls_outbound_90d;
  const answered = agent.calls_answered_90d;
  const stageTotal = Object.values(agent.stages).reduce((a, b) => a + b, 0);
  const nurtureCount = agent.stages.Nurture || 0;
  const archivesCount = agent.stages.Archives || 0;

  if (agent.isNew) {
    strengths.push("Just joined the team — early stages of building a book of business");
    if (agent.reached_yes > 0) strengths.push(`Already made contact with ${agent.reached_yes} lead${agent.reached_yes > 1 ? "s" : ""}`);
    return strengths;
  }

  // ISA-specific
  if (isISA) {
    if (totalCalls > 100) strengths.push(`Outstanding call volume — ${fmt(totalCalls)} outbound calls in 90 days`);
    if (answered > 100) strengths.push(`${fmt(answered)} calls answered — strong phone presence`);
    if (agent.reached_pct > 30) strengths.push(`Reached ${agent.reached_pct}% of assigned leads through consistent effort`);
    const warmHot = (agent.stages.Warm || 0) + (agent.stages.Hot || 0);
    if (warmHot > 10) strengths.push(`Moved ${warmHot} leads to Warm/Hot stages — leads are progressing`);
    if (strengths.length === 0) strengths.push("Dedicated to the phones — making consistent daily effort");
    return strengths;
  }

  // High call volume
  if (totalCalls > 100) strengths.push(`High call volume — ${fmt(totalCalls)} outbound calls in 90 days`);

  // Good reach rate
  if (agent.reached_pct > 40) strengths.push(`Strong reach rate — contacted ${agent.reached_pct}% of leads`);

  // Active pipeline
  if (pipeline > 5) strengths.push(`Active pipeline with ${pipeline} leads in Warm, Hot, or Pending stages`);

  // Closing deals
  if (agent.deals_closed > 0) {
    strengths.push(`Closed ${agent.deals_closed} deal${agent.deals_closed > 1 ? "s" : ""} — ${fmtMoney(agent.deals_closed_value)} in volume`);
  }

  // Pending deals
  if (agent.deals_pending > 0) {
    strengths.push(`${agent.deals_pending} pending deal${agent.deals_pending > 1 ? "s" : ""} worth ${fmtMoney(agent.deals_pending_value)} in the pipeline`);
  }

  // Good nurture pipeline
  if (stageTotal > 0 && (nurtureCount / stageTotal) > 0.2) {
    strengths.push(`${nurtureCount} leads in Nurture — building long-term relationships`);
  }

  // Notes
  if (agent.notes_90d > 100) {
    strengths.push(`Excellent documentation — ${fmt(agent.notes_90d)} notes written in 90 days`);
  }

  // Best reach rate on team
  const maxReach = Math.max(...AGENTS.filter(a => a.clean_leads > 20 && !a.isNew).map(a => a.reached_pct));
  if (agent.reached_pct === maxReach && agent.clean_leads > 20) {
    strengths.push(`Highest reach rate on the team at ${agent.reached_pct}%`);
  }

  // Low archives ratio (good for agents with significant leads)
  if (stageTotal > 50 && archivesCount / stageTotal < 0.4) {
    strengths.push(`Low archive rate — keeping leads active and engaged`);
  }

  // Fallback
  if (strengths.length === 0) {
    if (agent.clean_leads > 0) strengths.push(`Managing ${fmt(agent.clean_leads)} leads in the system`);
    if (agent.reached_yes > 0) strengths.push(`Reached ${agent.reached_yes} leads so far`);
  }

  return strengths.slice(0, 3);
}

function generateCoaching(agent) {
  const tips = [];
  const isISA = agent.roleType === "isa";
  const pipeline = getPipeline(agent);
  const totalCalls = agent.calls_outbound_90d;
  const answered = agent.calls_answered_90d;
  const stageTotal = Object.values(agent.stages).reduce((a, b) => a + b, 0);
  const newCount = agent.stages.New || 0;
  const archivesCount = agent.stages.Archives || 0;

  if (agent.isNew) {
    tips.push("New to the team — check in on onboarding progress and early wins");
    tips.push(`${newCount} of ${agent.clean_leads} leads are still in the New stage — help with first outreach templates`);
    return tips;
  }

  // ISA-specific
  if (isISA) {
    if (pipeline === 0 && totalCalls > 100) {
      tips.push(`She's making ${fmt(totalCalls)} calls but has 0 active pipeline — review the handoff process to ensure warmed leads are being tracked after she passes them to agents`);
    }
    if (agent.notes_90d < 10) {
      tips.push(`Only ${agent.notes_90d} notes in 90 days — encourage documenting key conversations so agents have context when leads are handed off`);
    }
    if (archivesCount > stageTotal * 0.5) {
      tips.push(`${archivesCount} of ${stageTotal} leads are archived — review together whether some deserve another look`);
    }
    if (tips.length === 0) tips.push("Keep supporting her call workflow and refining handoff scripts");
    return tips;
  }

  // Many leads in New
  if (stageTotal > 0 && newCount > 0 && (newCount / stageTotal) > 0.15) {
    tips.push(`${newCount} leads are still in "New" — haven't been touched yet. Help with speed-to-lead workflow or redistribute if overloaded`);
  }

  // High archive rate
  if (stageTotal > 50 && (archivesCount / stageTotal) > 0.6) {
    tips.push(`${Math.round((archivesCount / stageTotal) * 100)}% of leads are archived (${archivesCount} of ${stageTotal}) — review together whether some deserve another look`);
  }

  // Low call volume with many leads
  if (totalCalls < 50 && agent.clean_leads > 50) {
    tips.push(`Only ${totalCalls} outbound calls in 90 days with ${fmt(agent.clean_leads)} leads assigned — dedicated call blocks could increase contact rate`);
  }

  // Very low call answered rate (under 10% with meaningful volume)
  if (totalCalls > 20 && (answered / totalCalls) < 0.10) {
    tips.push(`${totalCalls} outbound calls but only ${answered} answered (${pct(answered, totalCalls)}) — this could be a phone system or caller ID issue, not an effort problem. Check the dialer setup`);
  }

  // Zero notes
  if (agent.notes_90d === 0) {
    tips.push("No notes logged in 90 days — encourage documenting conversations after calls so the team has context");
  } else if (agent.notes_90d < 5 && agent.clean_leads > 50) {
    tips.push(`Only ${agent.notes_90d} note${agent.notes_90d > 1 ? "s" : ""} in 90 days — encourage more consistent documentation after calls`);
  }

  // No deals closed
  if (agent.deals_closed === 0 && pipeline < 3 && agent.clean_leads > 50) {
    tips.push(`No closed deals yet and only ${pipeline} leads in the active pipeline — focus on converting nurtured leads to appointments`);
  }

  // High bad number rate
  if (agent.calls_bad_number > 20) {
    tips.push(`${agent.calls_bad_number} calls went to bad numbers — run a list scrub to clean up outdated contact info`);
  }

  // Low reach rate with high lead count
  if (agent.reached_pct < 35 && agent.clean_leads > 100) {
    tips.push(`Only ${agent.reached_pct}% of leads have been reached — explore different contact methods (text, email) alongside calls`);
  }

  // Fallback
  if (tips.length === 0) {
    if (agent.deals_closed > 0 && pipeline > 5) {
      tips.push("Performance is solid — continue coaching on pipeline conversion and client experience");
    } else if (agent.deals_closed > 0) {
      tips.push("Closing deals but pipeline is thin — focus on feeding more leads into Warm and Hot stages");
    } else {
      tips.push("Consistent effort shown — work on converting nurtured leads to appointments and building pipeline");
    }
  }

  return tips.slice(0, 3);
}

function renderLeadSources() {
  let fubRows = "";
  FUB_SOURCES.forEach(s => {
    const closedClass = s.closed > 0 ? ' class="closed-green"' : '';
    fubRows += `<tr>
      <td>${s.source}</td>
      <td>${fmt(s.leads)}</td>
      <td>${s.reached_pct}%</td>
      <td>${s.pipeline}</td>
      <td${closedClass}>${s.closed}</td>
    </tr>`;
  });

  let ga4Rows = "";
  GA4_CHANNELS.forEach(g => {
    const engRate = ((g.engaged / g.sessions) * 100).toFixed(1) + "%";
    ga4Rows += `<tr>
      <td>${g.channel}</td>
      <td>${fmt(g.sessions)}</td>
      <td>${g.conversions}</td>
      <td>${engRate}</td>
    </tr>`;
  });

  return `
    <hr class="section-divider">
    <div id="lead-sources" class="section-header">
      <h2 class="section-title">Lead Source Channels</h2>
      <p class="section-subtitle">Where leads come from in Follow Up Boss, and how website visitors find you via Google Analytics</p>
    </div>
    <div class="sources-grid">
      <div class="source-panel">
        <div class="source-panel-header">Follow Up Boss Lead Sources</div>
        <table class="source-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Leads</th>
              <th>Reached %</th>
              <th>Active Pipeline</th>
              <th>Closed Deals</th>
            </tr>
          </thead>
          <tbody>${fubRows}</tbody>
        </table>
      </div>
      <div class="source-panel">
        <div class="source-panel-header">GA4 Website Traffic Channels (Last 90 Days)</div>
        <table class="source-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Sessions</th>
              <th>Website Leads</th>
              <th>Engagement Rate</th>
            </tr>
          </thead>
          <tbody>${ga4Rows}</tbody>
        </table>
        <div class="source-note">
          Website leads come from GA4 conversion events. FUB leads come from form fills, IDX registrations, and manual entry — these are different counts measuring different things.
        </div>
      </div>
    </div>
  `;
}

function renderCoachingPriorities() {
  return `
    <hr class="section-divider">
    <div id="coaching" class="section-header">
      <h2 class="section-title">Brian's Coaching Priorities This Week</h2>
      <p class="section-subtitle">Top 3 actions based on what the data shows — tackle these first</p>
    </div>
    <div class="priorities-grid">
      <div class="priority-card">
        <div class="priority-number">1</div>
        <div class="priority-agent">Tommy Reed — Phone System Check</div>
        <div class="priority-issue">
          Tommy has <strong>1,386 leads</strong> — the most on the team — but <strong>353 are still in "New"</strong> (never touched). 
          He made 153 outbound calls, yet only <strong>8 were answered</strong>. That's a red flag for a phone/caller ID issue, not effort. 
          Check his dialer configuration, verify his outbound number isn't flagged as spam, and help him prioritize the untouched leads.
        </div>
      </div>
      <div class="priority-card">
        <div class="priority-number">2</div>
        <div class="priority-agent">Felicia Carter — Handoff Process Review</div>
        <div class="priority-issue">
          Felicia made <strong>634 outbound calls</strong> and had <strong>530 answered</strong> — she's doing the work. 
          But she has <strong>0 active pipeline and 0 closed deals</strong>. As an ISA, her warmed leads should be flowing to agents. 
          Review the handoff workflow — are leads being reassigned properly? Are agents following up on her warm leads?
        </div>
      </div>
      <div class="priority-card">
        <div class="priority-number">3</div>
        <div class="priority-agent">Henry Chu — Dialer Troubleshoot</div>
        <div class="priority-issue">
          Henry has <strong>62 leads stuck in "New"</strong> (53% of his book) and made 42 outbound calls with only <strong>1 answered</strong>. 
          His one connected call lasted 6m 47s — he can talk, he just can't get through. 
          Troubleshoot his dialer setup and help him work through the 62 untouched leads with a fresh approach.
        </div>
      </div>
    </div>
  `;
}

function renderPathToClose() {
  return `
    <hr class="section-divider">
    <div id="path-to-close" class="section-header">
      <h2 class="section-title">Path to Close — What the Data Says Works</h2>
      <p class="section-subtitle">Based on 61 closed deals and 5,345 leads since migration</p>
    </div>
    <div class="ptc-grid">
      <div class="ptc-card">
        <div class="ptc-card-title">Relationship Leads Close</div>
        <div class="ptc-big-stat text-teal">8.6% <span style="font-size:16px;color:var(--text-muted)">close rate</span></div>
        <div class="ptc-big-label">Sphere leads vs <strong style="color:var(--text)">0.03%</strong> for Google Organic</div>
        <div class="ptc-bullet">6 of 14 post-migration closings came from Sphere/Referral sources</div>
        <div class="ptc-bullet">Leads from personal relationships are 280x more likely to close than online leads</div>
      </div>
      <div class="ptc-card border-blue">
        <div class="ptc-card-title">Making Contact Matters</div>
        <div class="ptc-big-stat text-blue">4x</div>
        <div class="ptc-big-label">Reached leads are 4x more likely to close</div>
        <div class="ptc-bullet">Team average: 38% of leads reached — room to grow</div>
        <div class="ptc-bullet">1,218 leads have never been called at all</div>
      </div>
      <div class="ptc-card border-orange">
        <div class="ptc-card-title">Speed &amp; Persistence Win</div>
        <div class="ptc-big-stat text-orange">23%</div>
        <div class="ptc-big-label">of leads tagged "First Call Never Made"</div>
        <div class="ptc-bullet">Leads contacted within 5 minutes convert 21x better (industry benchmark)</div>
        <div class="ptc-bullet">Current median first call: 10+ days after lead creation</div>
      </div>
    </div>
  `;
}

function computeBadges(agent) {
  const badges = [];
  const s = agent.stl;
  const isISA = agent.roleType === "isa";
  const isTeamLeader = agent.roleType === "team-leader";
  const pipeline = getPipeline(agent);
  const stageTotal = Object.values(agent.stages).reduce((a, b) => a + b, 0);
  const nurtureCount = agent.stages.Nurture || 0;
  const neverCalledPct = agent.clean_leads > 0 ? (s.never_called / agent.clean_leads) * 100 : 0;
  const responseRate = agent.clean_leads > 0 ? ((s.responds_text + s.responds_email) / agent.clean_leads) * 100 : 0;
  const pipelinePct = agent.clean_leads > 0 ? (pipeline / agent.clean_leads) * 100 : 0;
  const nurturePct = stageTotal > 0 ? (nurtureCount / stageTotal) * 100 : 0;

  // ISA gets different badges
  if (isISA) {
    if (agent.calls_outbound_90d >= 500) badges.push({ name: "Phone Warrior", color: "#ffd700" });
    // Leads moved past Attempted: total - Attempted - New - Archives
    const attempted = agent.stages.Attempted || 0;
    const newLeads = agent.stages.New || 0;
    const archives = agent.stages.Archives || 0;
    const movedPast = agent.clean_leads - attempted - newLeads - archives;
    const movedPastPct = agent.clean_leads > 0 ? (movedPast / agent.clean_leads) * 100 : 0;
    if (movedPastPct >= 10) badges.push({ name: "Lead Warmer", color: "#c0c0c0" });
    return badges;
  }

  // Bronze badges
  if (agent.reached_pct >= 35) badges.push({ name: "Prospector", color: "#cd7f32" });
  if (agent.calls_outbound_90d >= 100) badges.push({ name: "Speed Dial", color: "#cd7f32" });

  // Silver badges
  if (responseRate >= 12) badges.push({ name: "Conversation Starter", color: "#c0c0c0" });
  if (pipelinePct >= 5) badges.push({ name: "Pipeline Builder", color: "#c0c0c0" });
  if (neverCalledPct <= 5) badges.push({ name: "First Responder", color: "#c0c0c0" });
  if (nurturePct >= 20) badges.push({ name: "Mover", color: "#c0c0c0" });

  // Gold badges
  if (s.lender_sent >= 3) badges.push({ name: "Finance Ready", color: "#ffd700" });
  if (agent.deals_closed >= 1) badges.push({ name: "Closer", color: "#ffd700" });

  // Platinum badges
  if (agent.deals_closed >= 5 && s.relationship_leads >= 5) badges.push({ name: "Rainmaker", color: "#e5e4e2" });
  if (isTeamLeader) badges.push({ name: "Team Leader", color: "#e5e4e2" });

  return badges;
}

function renderBadges(agent) {
  const badges = computeBadges(agent);
  if (badges.length === 0) return '';
  let html = `<div class="badges-section"><div class="badges-title">Achievement Badges</div><div class="badges-row">`;
  badges.forEach(b => {
    html += `<span class="badge-pill" style="background:${b.color}"><img src="img/badge-icon.png" class="badge-icon" alt=""> ${b.name}</span>`;
  });
  html += `</div></div>`;
  return html;
}

function renderSTLChips(agent) {
  const s = agent.stl;
  if (!s) return '';
  const neverCalledPct = agent.clean_leads > 0 ? (s.never_called / agent.clean_leads) * 100 : 0;
  const ncClass = neverCalledPct > 10 ? 'chip-red' : '';
  const rtClass = s.responds_text > 0 ? 'chip-green' : '';
  const reClass = s.responds_email > 0 ? 'chip-green' : '';
  const lsClass = s.lender_sent > 0 ? 'chip-teal' : '';

  return `
    <div class="stl-section">
      <div class="stl-title">Speed-to-Lead Signals</div>
      <div class="stl-chips">
        <span class="stl-chip ${ncClass}">Never Called: <strong>${s.never_called}</strong></span>
        <span class="stl-chip">Never Responded: <strong>${s.never_responded}</strong></span>
        <span class="stl-chip ${rtClass}">Responds to Text: <strong>${s.responds_text}</strong></span>
        <span class="stl-chip ${reClass}">Responds to Email: <strong>${s.responds_email}</strong></span>
        <span class="stl-chip ${lsClass}">Sent to Lender: <strong>${s.lender_sent}</strong></span>
      </div>
    </div>
  `;
}

function renderMonthlyBreakdown() {
  // Monthly lead volume table
  let tableRows = '';
  MONTHLY_DATA.forEach(m => {
    const rate = Math.round((m.reached / m.leads) * 100);
    let note = '';
    if (m.month === 'Jan 2026') note = ' <span class="spike-label">← spike</span>';
    if (m.month === 'Mar 2026*') note = ' <span class="partial-label">(*through Mar 20)</span>';
    tableRows += `<tr>
      <td>${m.month}</td>
      <td>${fmt(m.leads)}</td>
      <td>${fmt(m.reached)}</td>
      <td>${rate}%${note}</td>
    </tr>`;
  });

  return `
    <hr class="section-divider">
    <div id="monthly-trends" class="section-header">
      <h2 class="section-title">Monthly Breakdown</h2>
      <p class="section-subtitle">Lead volume and reach rates by month since migration</p>
    </div>

    <div class="monthly-grid">
      <div class="source-panel">
        <div class="source-panel-header">Monthly Lead Volume</div>
        <table class="source-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>New Leads</th>
              <th>Reached</th>
              <th>Reach Rate</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <div class="source-panel">
        <div class="source-panel-header">Monthly Leads vs Reached</div>
        <div class="monthly-chart-wrapper">
          <canvas id="monthlyChart"></canvas>
        </div>
      </div>
    </div>

    <div class="anomaly-callouts">
      <div class="callout callout-teal">
        <strong>January 2026</strong> saw a <strong>74% spike</strong> in leads (855 vs avg 530) — driven by a RealtyNow surge (89 leads on Jan 2 alone). The team responded well: <strong>54% reach rate</strong>, the highest month on record.
      </div>
      <div class="callout callout-orange">
        <strong>March 2026:</strong> Felicia (ISA) is receiving <strong>40% of all new leads</strong> this month (211 of 528) — she's being used as the front-line lead handler. Monitor her capacity.
      </div>
    </div>
  `;
}

function initMonthlyChart() {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHLY_DATA.map(m => m.month),
      datasets: [
        {
          label: 'New Leads',
          data: MONTHLY_DATA.map(m => m.leads),
          backgroundColor: '#60a5fa',
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.8,
          categoryPercentage: 0.7
        },
        {
          label: 'Reached',
          data: MONTHLY_DATA.map(m => m.reached),
          backgroundColor: '#2ecc71',
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.8,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#94a3b8', font: { size: 12, family: 'Inter' }, boxWidth: 12, padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.label + ': ' + fmt(ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, maxRotation: 45 }
        },
        y: {
          grid: { color: 'rgba(45,47,69,0.5)' },
          ticks: { color: '#94a3b8', font: { size: 12, family: 'Inter' } },
          beginAtZero: true
        }
      }
    }
  });
}

function renderLastMonth() {
  // Feb agents horizontal bar
  let agentItems = '';
  const maxLeads = FEB_AGENTS[0].leads;
  FEB_AGENTS.forEach(a => {
    const pctWidth = Math.max((a.leads / maxLeads) * 100, 2);
    agentItems += `
      <div class="hbar-row">
        <span class="hbar-label">${a.name}</span>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${pctWidth}%;background:var(--blue)"></div>
        </div>
        <span class="hbar-value">${a.leads}</span>
      </div>`;
  });

  let sourceItems = '';
  const maxSrc = FEB_SOURCES[0].leads;
  FEB_SOURCES.forEach(s => {
    const pctWidth = Math.max((s.leads / maxSrc) * 100, 2);
    sourceItems += `
      <div class="hbar-row">
        <span class="hbar-label">${s.source}</span>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${pctWidth}%;background:var(--teal)"></div>
        </div>
        <span class="hbar-value">${s.leads}</span>
      </div>`;
  });

  return `
    <div class="last-month-section">
      <div class="section-header">
        <h3 class="section-title" style="font-size:18px">February 2026 — Last Full Month</h3>
      </div>
      <div class="last-month-grid">
        <div class="source-panel" style="padding:20px">
          <div class="source-panel-header" style="padding:0;margin-bottom:16px">Lead Distribution by Agent (Feb)</div>
          <div class="hbar-list">${agentItems}</div>
        </div>
        <div class="source-panel" style="padding:20px">
          <div class="source-panel-header" style="padding:0;margin-bottom:16px">Lead Sources (Feb)</div>
          <div class="hbar-list">${sourceItems}</div>
        </div>
      </div>
    </div>
  `;
}

function renderInsights() {
  let visitorRows = '';
  HOT_VISITORS.forEach(v => {
    visitorRows += `<li><strong>${v.name}</strong>: ${v.visits} visits (${v.agent}’s lead, ${v.stage})</li>`;
  });

  return `
    <hr class="section-divider">
    <div id="insights" class="section-header">
      <h2 class="section-title">Hidden Gems &amp; Anomalies</h2>
      <p class="section-subtitle">Patterns and opportunities hiding in the data</p>
    </div>
    <div class="insights-grid">
      <div class="insight-card insight-teal">
        <div class="insight-card-title">🔥 Hot Leads Hiding in Plain Sight</div>
        <p class="insight-text"><strong>238 leads</strong> have visited kennarealestate.com <strong>10+ times</strong>. These people keep coming back — they're actively shopping.</p>
        <div class="insight-subhead">Top 5 by Website Visits:</div>
        <ol class="insight-list">${visitorRows}</ol>
        <p class="insight-note">Sort by website visits in FUB to find your most engaged prospects.</p>
      </div>
      <div class="insight-card insight-orange">
        <div class="insight-card-title">👻 Closed Without a Call</div>
        <p class="insight-text"><strong>6 people</strong> who closed deals were still tagged “First Call Never Made” in FUB. They transacted through other channels (text, email, in-person) but FUB thinks they were never called.</p>
        <p class="insight-text">This suggests the team is doing <strong>more work than FUB captures</strong>. Consider logging all touchpoints.</p>
      </div>
      <div class="insight-card insight-gold">
        <div class="insight-card-title">🌟 The 25 Golden Leads</div>
        <p class="insight-text"><strong>25 leads</strong> respond to BOTH text AND email — they’re engaged on multiple channels. These are your highest-intent prospects.</p>
        <p class="insight-text">Industry data: multi-channel responsive leads convert <strong>3–5x higher</strong> than single-channel.</p>
      </div>
    </div>
  `;
}

function renderFunStats() {
  let pills = '';
  FUN_STATS.forEach(s => {
    pills += `<div class="fun-stat-pill"><span class="fun-stat-emoji">${s.emoji}</span> ${s.text}</div>`;
  });
  return `
    <div class="fun-stats-section">
      <div class="fun-stats-title">Fun Stats</div>
      <div class="fun-stats-row">${pills}</div>
    </div>
  `;
}

function renderBuildTheBrand() {
  const b = BRAND_DATA;
  const actions = [
    {
      title: "Post a 30-Second Selfie Video Once a Week",
      what: "Stand in front of a listing, a neighborhood spot, or just your car and record a quick video. \"Hey, I just showed a great home in Lakewood — if you know anyone looking, give me a call!\" Post it to Instagram Reels, Facebook, or TikTok.",
      why: "Listings with video get 403% more inquiries (NAR). Video generates 1,200% more shares than text and images combined. Yet only 38% of agents use video — massive competitive advantage. 73% of homeowners prefer agents who use video."
    },
    {
      title: "Ask Every Closing Client for a Google Review",
      what: "Right after closing, while they're happy, say: \"Would you mind leaving us a quick Google review? It really helps the team.\" Send them the direct link.",
      why: "Referred clients convert 30% better than cold leads (American Marketing Association). 92% of agents say online reviews directly impact their business (NAR survey, Kerfuffle)."
    },
    {
      title: "Text 5 People in Your Sphere Every Week",
      what: "Not a sales pitch — just a check-in. \"Hey, how's the new house treating you?\" or \"Saw your kid's soccer game post — awesome!\" Keep the relationship warm.",
      why: "38% of agents' new clients originate from social media and sphere interactions (Hootsuite/NAR). Kenna's own data: 555 leads respond to text messages. One referral = $543K average deal value."
    },
    {
      title: "Share One Listing or Market Update on Social Media Weekly",
      what: "Doesn't have to be fancy. Share a listing photo, a quick market stat, or congratulate a teammate on a closing. Tag @KennaRealEstateGroup. Consistency beats perfection — 71% of buyers hire the first agent they interview, often someone they already follow (The Close).",
      why: "Agents who use social media consistently generate 66% more leads than those who don't (HubSpot). Facebook video gets 6x more engagement than static posts."
    },
    {
      title: "Host or Attend One Community Event Per Quarter",
      what: "Client appreciation parties, local charity events, open houses with a neighborhood vibe. Invite past clients. They bring friends. Friends become leads.",
      why: "Kenna's Sphere leads close at 7.5% — every new relationship is potential revenue. Every person you meet at an event could become one of those leads. Follow Up Boss even has a guide on this — your CRM supports it."
    }
  ];

  let actionCards = '';
  actions.forEach((a, i) => {
    actionCards += `
      <div class="brand-action-card">
        <div class="brand-action-number">${i + 1}</div>
        <div class="brand-action-content">
          <div class="brand-action-title">${a.title}</div>
          <p class="brand-action-what">${a.what}</p>
          <div class="brand-action-why"><strong>WHY IT WORKS:</strong> ${a.why}</div>
        </div>
      </div>`;
  });

  let builderChips = '';
  b.top_builders.forEach(t => {
    builderChips += `<span class="brand-builder-chip">${t.name}: <strong>${t.pct}%</strong></span>`;
  });

  return `
    <hr class="section-divider">
    <div id="build-the-brand" class="section-header" style="position:relative">
      <img src="img/frog-peek.png" alt="" class="brand-frog-peek">
      <h2 class="section-title">Build the Kenna Brand — It Pays Off</h2>
      <p class="section-subtitle">Your personal brand IS the team's brand. Every relationship you build generates leads that actually close.</p>
    </div>

    <!-- Part 1: The Data Makes the Case -->
    <div class="brand-data-grid">
      <div class="brand-data-card brand-border-teal">
        <div class="brand-data-card-title">Relationships vs Online</div>
        <div class="brand-big-number text-teal">50x</div>
        <p class="brand-data-text">Sphere and referral leads close at <strong>7.5%</strong> — online leads close at <strong>0.15%</strong>. That's a 50x difference.</p>
        <div class="brand-data-compare">
          <div class="brand-compare-row brand-compare-good">106 relationship leads → 8 closings → $5.8M volume</div>
          <div class="brand-compare-row brand-compare-bad">4,565 online leads → 7 closings → $470K volume</div>
        </div>
      </div>
      <div class="brand-data-card brand-border-orange">
        <div class="brand-data-card-title">The $22K Question</div>
        <div class="brand-big-number text-orange">$22,050</div>
        <p class="brand-data-text">Estimated spend on Google PPC + Facebook Ads → <strong>0 closings</strong></p>
        <p class="brand-data-text">Sphere leads cost <strong>$0</strong> in ad spend → <strong>4 closings, $2.4M+ volume</strong></p>
        <p class="brand-data-note">Every referral you generate saves the team money AND actually closes.</p>
      </div>
      <div class="brand-data-card brand-border-purple">
        <div class="brand-data-card-title">Who's Building Relationships?</div>
        <div class="brand-big-number text-purple">Only 2%</div>
        <p class="brand-data-text">Only 106 of 5,345 leads come from Sphere/Referral sources. There's <strong>massive room to grow</strong>.</p>
        <div class="brand-data-builders-label">Top relationship builders:</div>
        <div class="brand-builders-row">${builderChips}</div>
      </div>
    </div>

    <!-- Part 1B: Vision, Goals, Tactics Framework -->
    <div style="background:var(--card,#1a1b2e);border:1px solid var(--border,#2d2f45);border-radius:12px;padding:28px 32px;margin-bottom:28px">
      <h3 style="color:#f1f5f9;font-size:20px;font-weight:700;margin-bottom:6px">Vision → Goals → Tactics: Know the Difference</h3>
      <p style="color:#94a3b8;font-size:14px;margin-bottom:20px">The most successful agents don't just grind — they work with intention. Here's how to think about your business at three levels:</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
        <div style="border-left:3px solid #a78bfa;padding:12px 16px;background:rgba(167,139,250,0.06);border-radius:0 8px 8px 0">
          <div style="color:#a78bfa;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Vision</div>
          <div style="color:#f1f5f9;font-size:16px;font-weight:600;margin-bottom:6px">Where you're going</div>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.5;margin:0">Your vision is the big picture — the future you're building toward. It doesn't change month to month. Example: <em>"I want to be the go-to agent for families relocating to the Denver metro, known for honest advice and local expertise."</em></p>
        </div>
        <div style="border-left:3px solid #2ecc71;padding:12px 16px;background:rgba(46,204,113,0.06);border-radius:0 8px 8px 0">
          <div style="color:#2ecc71;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Goals</div>
          <div style="color:#f1f5f9;font-size:16px;font-weight:600;margin-bottom:6px">What you're measuring</div>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.5;margin:0">Goals are specific, time-bound targets that move you toward your vision. They're how you know you're making progress. Example: <em>"Close 2 deals this quarter"</em> or <em>"Get 5 Google reviews this month"</em> or <em>"Reach 50% of my assigned leads."</em></p>
        </div>
        <div style="border-left:3px solid #fb923c;padding:12px 16px;background:rgba(251,146,60,0.06);border-radius:0 8px 8px 0">
          <div style="color:#fb923c;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Tactics</div>
          <div style="color:#f1f5f9;font-size:16px;font-weight:600;margin-bottom:6px">What you do every day</div>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.5;margin:0">Tactics are the daily and weekly actions that achieve your goals. They're small, repeatable, and controllable. Example: <em>"Post one selfie video per week"</em> or <em>"Text 5 past clients every Monday"</em> or <em>"Call 10 new leads within 5 minutes of assignment."</em></p>
        </div>
      </div>
      <p style="color:#94a3b8;font-size:14px;margin-top:16px;margin-bottom:0;line-height:1.5"><strong style="color:#e2e8f0">The mistake most agents make:</strong> jumping straight to tactics without a vision or goals. You end up busy but not productive. The 5 actions below are <em>tactics</em> — but they only work when you connect them to <em>your</em> goals and <em>your</em> vision for where you want your career to go. Brian can help you define all three.</p>
    </div>

    <!-- Part 2: 5 Things Every Agent Can Do This Month -->
    <div class="brand-actions-header">
      <h3 class="brand-actions-title">5 Tactics Every Agent Can Start This Month</h3>
    </div>
    <div class="brand-actions-list">
      ${actionCards}
    </div>

    <!-- Part 3: How It Helps YOU -->
    <div class="brand-helps-you">
      <div class="brand-helps-you-title">How It Helps YOU</div>
      <p class="brand-helps-you-text">Every relationship lead you bring in:</p>
      <ul class="brand-helps-list">
        <li>Costs <strong>$0</strong> in ad spend</li>
        <li>Closes at <strong>50x</strong> the rate of online leads</li>
        <li>Earns you <strong>full commission</strong> (no referral fee)</li>
        <li>Builds <strong>YOUR reputation</strong> as the go-to agent in your community</li>
        <li>Makes Brian's job easier — he can invest more in <strong>tools that help YOU</strong> instead of ads that don't close</li>
      </ul>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div><a href="https://yourbrand.io">Prepared by YourBrand.io</a></div>

    </footer>
  `;
}

// ─── INIT ───────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      ${renderTeamOverview()}
      ${renderFunnelChart()}
      ${renderPathToClose()}
      ${renderBuildTheBrand()}
      ${renderMonthlyBreakdown()}
      ${renderLastMonth()}
      ${renderAgentCards()}
      ${renderLeadSources()}
      ${renderInsights()}
      ${renderCoachingPriorities()}
      ${renderFunStats()}
    </div>
    ${renderFooter()}
  `;

  initFunnelChart();
  initMonthlyChart();
});
