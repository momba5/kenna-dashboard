/* ============================================
   Kenna Real Estate — Lead Ops Dashboard
   Dashboard Data & Renderers
   ============================================ */

// ========== EMBEDDED DATA ==========

// Lifecycle Funnel Data (9mo post-migration)
const LIFECYCLE_FUNNEL = {"TOTAL":5289,"NEW":747,"ATTEMPTED":1636,"SPOKE":14,"NURTURE":756,"WARM":195,"HOT":30,"PENDING":6,"CLOSED":19,"ARCHIVES":1886};

// Lifecycle Monthly Data (9mo)
const LIFECYCLE_MONTHLY = {"2025-07":{"total":575,"NEW":189,"ATTEMPTED":121,"SPOKE":0,"NURTURE":76,"WARM":14,"HOT":0,"PENDING":0,"CLOSED":3,"ARCHIVES":172,"contact_rate":67.1},"2025-08":{"total":599,"NEW":92,"ATTEMPTED":75,"SPOKE":1,"NURTURE":112,"WARM":15,"HOT":1,"PENDING":1,"CLOSED":4,"ARCHIVES":298,"contact_rate":84.6},"2025-09":{"total":585,"NEW":186,"ATTEMPTED":63,"SPOKE":2,"NURTURE":100,"WARM":7,"HOT":1,"PENDING":0,"CLOSED":4,"ARCHIVES":222,"contact_rate":68.2},"2025-10":{"total":508,"NEW":156,"ATTEMPTED":69,"SPOKE":0,"NURTURE":78,"WARM":11,"HOT":2,"PENDING":0,"CLOSED":2,"ARCHIVES":190,"contact_rate":69.3},"2025-11":{"total":373,"NEW":63,"ATTEMPTED":63,"SPOKE":0,"NURTURE":39,"WARM":15,"HOT":2,"PENDING":0,"CLOSED":3,"ARCHIVES":188,"contact_rate":83.1},"2025-12":{"total":491,"NEW":28,"ATTEMPTED":187,"SPOKE":2,"NURTURE":60,"WARM":12,"HOT":1,"PENDING":1,"CLOSED":3,"ARCHIVES":197,"contact_rate":94.3},"2026-01":{"total":858,"NEW":7,"ATTEMPTED":327,"SPOKE":4,"NURTURE":150,"WARM":36,"HOT":4,"PENDING":2,"CLOSED":0,"ARCHIVES":328,"contact_rate":99.2},"2026-02":{"total":838,"NEW":3,"ATTEMPTED":478,"SPOKE":5,"NURTURE":96,"WARM":53,"HOT":7,"PENDING":2,"CLOSED":0,"ARCHIVES":194,"contact_rate":99.6},"2026-03":{"total":462,"NEW":23,"ATTEMPTED":253,"SPOKE":0,"NURTURE":45,"WARM":32,"HOT":12,"PENDING":0,"CLOSED":0,"ARCHIVES":97,"contact_rate":95.0}};

// Source Lifecycle Data (9mo)
const SOURCE_LIFECYCLE = {"Google Organic":{"total":2910,"pipeline":133,"pipeline_rate":4.57,"contact_rate":38.6,"close_rate":0.24,"never_called_rate":15.6,"avg_budget":655901},"Google PPC":{"total":539,"pipeline":12,"pipeline_rate":2.23,"contact_rate":28.0,"close_rate":0.0,"never_called_rate":11.5,"avg_budget":1132834},"RealtyNow":{"total":537,"pipeline":25,"pipeline_rate":4.66,"contact_rate":39.9,"close_rate":0.0,"never_called_rate":19.0,"avg_budget":525388},"Facebook Lead Ad":{"total":382,"pipeline":18,"pipeline_rate":4.71,"contact_rate":31.7,"close_rate":0.0,"never_called_rate":2.1,"avg_budget":803097},"kennarealestate.com":{"total":267,"pipeline":9,"pipeline_rate":3.37,"contact_rate":45.3,"close_rate":0.0,"never_called_rate":17.2,"avg_budget":552680},"Direct Traffic":{"total":204,"pipeline":12,"pipeline_rate":5.88,"contact_rate":33.3,"close_rate":0.49,"never_called_rate":11.3,"avg_budget":742331},"Bing Organic":{"total":72,"pipeline":5,"pipeline_rate":6.94,"contact_rate":40.3,"close_rate":0.0,"never_called_rate":6.9,"avg_budget":614133},"Website Registration":{"total":75,"pipeline":5,"pipeline_rate":6.67,"contact_rate":38.7,"close_rate":0.0,"never_called_rate":16.0,"avg_budget":889508},"Sphere":{"total":70,"pipeline":6,"pipeline_rate":8.57,"contact_rate":22.9,"close_rate":5.71,"never_called_rate":2.9,"avg_budget":449900},"Duckduckgo":{"total":49,"pipeline":2,"pipeline_rate":4.08,"contact_rate":42.9,"close_rate":0.0,"never_called_rate":20.4,"avg_budget":660756},"Yahoo":{"total":29,"pipeline":3,"pipeline_rate":10.34,"contact_rate":62.1,"close_rate":0.0,"never_called_rate":6.9,"avg_budget":1352144},"Open House":{"total":18,"pipeline":0,"pipeline_rate":0.0,"contact_rate":33.3,"close_rate":0.0,"never_called_rate":33.3,"avg_budget":571495},"Seller Lead Site":{"total":15,"pipeline":1,"pipeline_rate":6.67,"contact_rate":66.7,"close_rate":0.0,"never_called_rate":6.7,"avg_budget":0},"Kenna Lead":{"total":11,"pipeline":3,"pipeline_rate":27.27,"contact_rate":81.8,"close_rate":9.09,"never_called_rate":0.0,"avg_budget":512150},"Agent Site":{"total":10,"pipeline":1,"pipeline_rate":10.0,"contact_rate":80.0,"close_rate":0.0,"never_called_rate":30.0,"avg_budget":344725},"Referral":{"total":9,"pipeline":3,"pipeline_rate":33.33,"contact_rate":66.7,"close_rate":22.22,"never_called_rate":33.3,"avg_budget":200535780},"By Agent":{"total":8,"pipeline":2,"pipeline_rate":25.0,"contact_rate":62.5,"close_rate":12.5,"never_called_rate":0.0,"avg_budget":625000},"Agent personal home":{"total":8,"pipeline":1,"pipeline_rate":12.5,"contact_rate":62.5,"close_rate":0.0,"never_called_rate":50.0,"avg_budget":612400},"RealScout":{"total":7,"pipeline":2,"pipeline_rate":28.57,"contact_rate":57.1,"close_rate":14.29,"never_called_rate":0.0,"avg_budget":485722},"Phone Call":{"total":6,"pipeline":3,"pipeline_rate":50.0,"contact_rate":50.0,"close_rate":0.0,"never_called_rate":0.0,"avg_budget":1699000},"Facebook":{"total":6,"pipeline":1,"pipeline_rate":16.67,"contact_rate":50.0,"close_rate":0.0,"never_called_rate":16.7,"avg_budget":293500}};

// Agent Coaching Data (fresh FUB pull)
const AGENT_COACHING = {
  "Tahverle and Beverly Agent Team": {
    role: "Agent", leads: 585, contact_rate: 22, pipeline: 30, closed: 5,
    calls_90d: 536, call_connect: 92, avg_call_dur: 25, notes_90d: 6,
    stages: {new:0, attempted:68, nurture:207, warm:27, hot:2, pending:1, closed:5, archives:275},
    strengths: ["High call volume (536 calls in 90 days) — putting in the work", "Best stage diversity on the team — using FUB correctly", "5 closings and active pipeline — proven closer", "92% call connect rate — making real conversations happen"],
    coaching: ["Contact rate at 22% — with 536 calls they're clearly trying. May benefit from better lead routing or call timing optimization", "Only 6 notes in 90 days — encourage documenting key conversations so the team can coordinate"],
    closed_volume: 18090378, commission: 462796
  },
  "Rona Lynn": {
    role: "Agent", leads: 466, contact_rate: 20, pipeline: 13, closed: 2,
    calls_90d: 115, call_connect: 78, avg_call_dur: 31, notes_90d: 1,
    stages: {new:0, attempted:2, nurture:14, warm:13, hot:0, pending:0, closed:2, archives:435},
    strengths: ["2 closings with $3.96M volume", "78% call connect rate — quality conversations", "13 leads in active pipeline"],
    coaching: ["93% of leads in Archives — she may be archiving leads too quickly. Review her archive criteria together", "Only 1 note in 90 days — help her build a quick-note habit after each conversation", "115 calls is moderate — dedicated call blocks could help reach more leads"],
    closed_volume: 3963990, commission: 67648
  },
  "Lindsey Jenkins": {
    role: "Agent", leads: 430, contact_rate: 17, pipeline: 4, closed: 1,
    calls_90d: 92, call_connect: 49, avg_call_dur: 54, notes_90d: 2,
    stages: {new:0, attempted:1, nurture:309, warm:3, hot:1, pending:0, closed:1, archives:115},
    strengths: ["Best nurture funnel on the team — 72% of leads in active nurture", "Longest avg calls (54s) — building real relationships", "1 closing — knows how to convert"],
    coaching: ["309 leads in nurture is great, but only 4 in Warm/Hot — help her identify which nurture leads are ready to move up", "Call connect at 49% — may need help with call timing or voicemail strategies", "She's a relationship builder — consider pairing with high-value leads that need personal touch"],
    closed_volume: 3123251, commission: 138569
  },
  "Jack Lang": {
    role: "Agent", leads: 35, contact_rate: 57, pipeline: 2, closed: 0,
    calls_90d: 2, call_connect: 100, avg_call_dur: 249, notes_90d: 0,
    stages: {new:0, attempted:2, nurture:20, warm:2, hot:0, pending:0, closed:0, archives:11},
    strengths: ["Highest contact rate on the team (57%)", "When he connects, he TALKS — avg 4+ minutes per call", "Good nurture pipeline (57% of leads in nurture)"],
    coaching: ["Only 2 calls in 90 days — he has the skills but needs more call volume. Dedicated call blocks could transform his results", "Zero notes — encourage documenting conversations", "With his contact rate, more leads would likely = more closings"],
    closed_volume: 0, commission: 0
  },
  "Daniela Draper": {
    role: "Agent", leads: 180, contact_rate: 16, pipeline: 7, closed: 0,
    calls_90d: 156, call_connect: 72, avg_call_dur: 20, notes_90d: 1,
    stages: {new:0, attempted:1, nurture:105, warm:7, hot:0, pending:0, closed:0, archives:67},
    strengths: ["156 calls in 90 days — consistent effort", "72% call connect rate", "Good nurture pipeline (58%) with 7 leads in Warm stage", "Strong source diversity across Google, Facebook, and direct"],
    coaching: ["No closings yet but 7 warm leads — she may be close to her first deal. Extra encouragement here", "Avg call duration 20s — may need help with conversation scripts to keep leads engaged longer", "Only 1 note — build the documentation habit"],
    closed_volume: 0, commission: 0
  },
  "Brenna Lodge": {
    role: "Agent", leads: 51, contact_rate: 51, pipeline: 7, closed: 1,
    calls_90d: 73, call_connect: 67, avg_call_dur: 25, notes_90d: 2,
    stages: {new:0, attempted:0, nurture:25, warm:7, hot:0, pending:0, closed:1, archives:18},
    strengths: ["Second highest contact rate (51%) — she connects with people", "Strong pipeline — 7 active leads from just 51 total (14% pipeline rate!)", "1 closing — converts", "Good balance of nurture and pipeline"],
    coaching: ["She's doing great — could handle more lead volume given her high contact and pipeline rates", "2 notes is low — with her conversion rate, documented insights would be gold for the team"],
    closed_volume: 0, commission: 0
  },
  "Felicia Carter": {
    role: "Broker", leads: 260, contact_rate: 24, pipeline: 0, closed: 0,
    calls_90d: 733, call_connect: 81, avg_call_dur: 17, notes_90d: 5,
    stages: {new:0, attempted:0, nurture:0, warm:0, hot:0, pending:0, closed:0, archives:260},
    strengths: ["HIGHEST call volume on the entire team — 733 calls in 90 days", "81% call connect rate — she's reaching people", "Persistent and hardworking"],
    coaching: ["733 calls but 0 pipeline and 0 closings — she's putting in massive effort. The issue is likely lead quality routing or call script/qualifying", "All 260 leads are in Archives — help her identify which leads deserve nurture vs archive", "Avg call only 17s — may be getting hung up on or reaching voicemails. Review her call recordings together", "Consider: is she being assigned the right lead types for her strengths?"],
    closed_volume: 0, commission: 0
  },
  "James Locus": {
    role: "Agent", leads: 137, contact_rate: 25, pipeline: 9, closed: 1,
    calls_90d: 2, call_connect: 100, avg_call_dur: 52, notes_90d: 0,
    stages: {new:0, attempted:0, nurture:76, warm:9, hot:0, pending:0, closed:1, archives:51},
    strengths: ["Best pipeline rate on the team — 9 active leads from 137 (6.6%)", "Good nurture pipeline (55%)", "Meaningful conversations when he connects", "1 closing — knows how to close"],
    coaching: ["Only 2 calls in 90 days but strong results — he may be working leads through other channels (text, email)", "Zero notes — critical to document how he's achieving these results", "With his conversion skills, more outbound effort could multiply his closings significantly"],
    closed_volume: 1067290, commission: 32018
  },
  "Henry Chu": {
    role: "Agent", leads: 97, contact_rate: 22, pipeline: 3, closed: 0,
    calls_90d: 60, call_connect: 0, avg_call_dur: 0, notes_90d: 0,
    stages: {new:0, attempted:0, nurture:64, warm:3, hot:0, pending:0, closed:0, archives:30},
    strengths: ["Good nurture pipeline (66%)", "3 active pipeline leads", "60 outbound call attempts — putting in effort"],
    coaching: ["0% call connect on 60 attempts — this is almost certainly a phone system or dialer issue, NOT a motivation problem. Troubleshoot his setup ASAP", "Zero notes — once his phone is working, build the documentation habit", "Good source mix with 16 Open House leads — strong in-person connector"],
    closed_volume: 605000, commission: 16940
  },
  "Tommy Reed": {
    role: "Agent", leads: 81, contact_rate: 10, pipeline: 0, closed: 0,
    calls_90d: 216, call_connect: 0, avg_call_dur: 21, notes_90d: 5,
    stages: {new:64, attempted:0, nurture:3, warm:0, hot:0, pending:0, closed:0, archives:14},
    strengths: ["216 calls in 90 days — strong effort and work ethic", "He's one of the few agents writing notes (5 in 90 days)"],
    coaching: ["64 leads (79%) still sitting in NEW — he needs help with his speed-to-lead workflow and stage updates", "216 calls with 0% connect rate — very likely a dialer/system issue. Priority: fix his phone setup", "Once his system works, pair his high call volume with proper stage tracking and he could be a top performer", "Consider: is he being assigned the right lead types for his strengths?"],
    closed_volume: 0, commission: 0
  },
  "Brian Lee Burke": {
    role: "Team Leader", leads: 136, contact_rate: 32, pipeline: 9, closed: 5,
    calls_90d: 8, call_connect: 75, avg_call_dur: 130, notes_90d: 1966,
    stages: {new:0, attempted:0, nurture:31, warm:9, hot:0, pending:0, closed:5, archives:92},
    strengths: ["5 closings — $14.3M volume, $330K commission — leading by example", "1,966 notes in 90 days — by far the best at documenting", "When he gets on the phone, avg 2+ min conversations — high quality", "Strong pipeline with 9 active leads"],
    coaching: ["As team leader, his focus should shift from personal production to coaching the team", "His noting discipline is exemplary — use him as the standard for the team"],
    closed_volume: 14252950, commission: 330472
  }
};

// SEO Task Cards (preserved from existing)
const P1_CARDS = [{"type":"UX_lead_capture_fix","priority":1,"url":"/property-search/detail/ (IDX Template)","primary_query":"All property listing pages","metrics_snapshot":{"sessions":45000,"conversions":0,"engagement_rate":0.42},"recommended_action":"Improve the Sierra Interactive listing detail page template. Add a prominent lead capture form, agent contact CTA, and 'Schedule a Showing' button to the template. This single template fix affects every active listing page.","why_it_matters":"Property detail pages collectively get ~45K sessions/quarter. The template currently has weak lead capture \u2014 one fix improves thousands of pages.","fub_signal":"1,936 FUB leads from Property Listings category"},{"type":"UX_lead_capture_fix","priority":1,"url":"/blog/richest-neighborhoods-denver-co-2025","primary_query":"most expensive neighborhoods in denver","metrics_snapshot":{"sessions":860,"conversions":0,"engagement_rate":0.5291,"bounce_rate":0.4709},"recommended_action":"Add lead capture form, CTA, and phone number prominently to /blog/richest-neighborhoods-denver-co-2025. Test exit-intent popup.","why_it_matters":"This Denver-area page gets 860 sessions with 0 conversions. Even a 0.5% conversion rate = 4 leads.","fub_signal":"1 leads, 0 low-quality"},{"type":"UX_lead_capture_fix","priority":1,"url":"/denver/equestrian-properties-for-sale","primary_query":"horse property for sale colorado","metrics_snapshot":{"sessions":541,"conversions":0,"engagement_rate":0.6895,"bounce_rate":0.3105},"recommended_action":"Add lead capture form, CTA, and phone number prominently to /denver/equestrian-properties-for-sale. Test exit-intent popup.","why_it_matters":"This Denver-area page gets 541 sessions with 0 conversions. Even a 0.5% conversion rate = 2 leads.","fub_signal":"No FUB data"},{"type":"UX_lead_capture_fix","priority":1,"url":"/denver/next-gen-homes-for-sale","primary_query":"next gen homes colorado","metrics_snapshot":{"sessions":440,"conversions":0,"engagement_rate":0.8114,"bounce_rate":0.1886},"recommended_action":"Add lead capture form, CTA, and phone number prominently to /denver/next-gen-homes-for-sale. Test exit-intent popup.","why_it_matters":"This Denver-area page gets 440 sessions with 81% engagement and 0 conversions.","fub_signal":"No FUB data"},{"type":"UX_lead_capture_fix","priority":1,"url":"/denver/luxury-homes-for-sale","primary_query":"luxury homes denver","metrics_snapshot":{"sessions":380,"conversions":0,"engagement_rate":0.5737,"bounce_rate":0.4263},"recommended_action":"Add lead capture form, CTA, and phone number prominently. Test exit-intent popup.","why_it_matters":"380 sessions with 57% engagement and 0 conversions. High-value luxury buyer traffic.","fub_signal":"No FUB data"},{"type":"UX_lead_capture_fix","priority":1,"url":"/denver/hud-homes-for-sale","primary_query":"hud homes for sale","metrics_snapshot":{"sessions":283,"conversions":0,"engagement_rate":0.6714,"bounce_rate":0.3286},"recommended_action":"Add lead capture form, CTA, and phone number. 8,798 impressions in GSC.","why_it_matters":"283 sessions, 67% engagement, 0 conversions. Top striking-distance keyword.","fub_signal":"No FUB data"}];

const P2_CARDS = [{"type":"UX_lead_capture_fix","priority":2,"url":"/blog/the-richest-neighborhoods-in-miami-fl-2025","primary_query":"richest neighborhoods in miami","metrics_snapshot":{"sessions":1387,"conversions":0,"engagement_rate":0.5032},"recommended_action":"Add lead capture elements to /blog/the-richest-neighborhoods-in-miami-fl-2025. High engagement suggests intent — CRO fix should convert.","why_it_matters":"1387 sessions producing 0 leads is wasted traffic worth capturing.","fub_signal":"No FUB registration data"},{"type":"UX_lead_capture_fix","priority":2,"url":"/blog/pros-and-cons-of-living-in-sebring-fl-what-to-expect","primary_query":"is sebring florida a good place to live","metrics_snapshot":{"sessions":858,"conversions":0,"engagement_rate":0.6503},"recommended_action":"Add lead capture elements. High engagement suggests intent — CRO fix should convert.","why_it_matters":"858 sessions producing 0 leads is wasted traffic worth capturing.","fub_signal":"No FUB data"},{"type":"UX_lead_capture_fix","priority":2,"url":"/blog/best-neighborhoods-in-fort-collins-honest-local-perspectives","primary_query":"fort collins weather","metrics_snapshot":{"sessions":495,"conversions":0,"engagement_rate":0.5697},"recommended_action":"Add lead capture elements. High engagement suggests intent.","why_it_matters":"495 sessions producing 0 leads is wasted traffic.","fub_signal":"No FUB data"},{"type":"CTR_fix","priority":2,"url":"/","primary_query":"colorado real estate","metrics_snapshot":{"impressions":4682,"clicks":8,"ctr":0.0017,"position":12.5},"recommended_action":"Optimize title/meta for 'colorado real estate'. Current CTR 0.17% at position 12.5.","why_it_matters":"4,682 impressions with nearly zero clicks. Improve title to capture more traffic.","fub_signal":"Homepage has 12 GA4 conversions"},{"type":"CTR_fix","priority":2,"url":"/denver/hud-homes-for-sale","primary_query":"hud homes for sale","metrics_snapshot":{"impressions":8798,"clicks":9,"ctr":0.001,"position":14.2},"recommended_action":"Optimize title/meta for 'hud homes for sale'. Move from pos 14 to page 1.","why_it_matters":"8,798 impressions, 9 clicks. Massive opportunity if pushed to page 1.","fub_signal":"No FUB data"}];

const P3_CARDS = [];

// FUB Task Cards from 3mo analysis
const FUB_TASK_CARDS = [{"type": "fub_high_value", "priority": "P2", "url": "https://www.kennarealestate.com/personalized-home-search", "path": "/personalized-home-search", "category": "Personalized Search", "metrics_snapshot": {"fub_leads_3mo": 4, "fub_high_quality": 3, "fub_high_rate": "75.0%"}, "fub_signal": "Strong: 3 high-quality leads in 3 months (75% rate!)", "recommended_action": "Boost visibility \u2014 this page generates quality leads under current marketing.", "why_it_matters": "Proven high-quality lead generator. More traffic here = more qualified pipeline."}, {"type": "fub_source_scale", "priority": "P2", "source": "Google Organic", "metrics_snapshot": {"leads_3mo": 1210, "high_quality": 81, "high_rate": "6.7%"}, "fub_signal": "81 high-quality from 1210 leads (6.7%)", "recommended_action": "Scale 'Google Organic' \u2014 current HIGH rate is 6.7%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "RealtyNow", "metrics_snapshot": {"leads_3mo": 275, "high_quality": 21, "high_rate": "7.6%"}, "fub_signal": "21 high-quality from 275 leads (7.6%)", "recommended_action": "Scale 'RealtyNow' \u2014 current HIGH rate is 7.6%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "Direct Traffic", "metrics_snapshot": {"leads_3mo": 92, "high_quality": 8, "high_rate": "8.7%"}, "fub_signal": "8 high-quality from 92 leads (8.7%)", "recommended_action": "Scale 'Direct Traffic' \u2014 current HIGH rate is 8.7%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "kennarealestate.com", "metrics_snapshot": {"leads_3mo": 86, "high_quality": 5, "high_rate": "5.8%"}, "fub_signal": "5 high-quality from 86 leads (5.8%)", "recommended_action": "Scale 'kennarealestate.com' \u2014 current HIGH rate is 5.8%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "Website Registration", "metrics_snapshot": {"leads_3mo": 28, "high_quality": 4, "high_rate": "14.3%"}, "fub_signal": "4 high-quality from 28 leads (14.3%)", "recommended_action": "Scale 'Website Registration' \u2014 current HIGH rate is 14.3%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "Bing Organic", "metrics_snapshot": {"leads_3mo": 34, "high_quality": 3, "high_rate": "8.8%"}, "fub_signal": "3 high-quality from 34 leads (8.8%)", "recommended_action": "Scale 'Bing Organic' \u2014 current HIGH rate is 8.8%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "Yahoo", "metrics_snapshot": {"leads_3mo": 13, "high_quality": 3, "high_rate": "23.1%"}, "fub_signal": "3 high-quality from 13 leads (23.1%)", "recommended_action": "Scale 'Yahoo' \u2014 current HIGH rate is 23.1%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "Duckduckgo", "metrics_snapshot": {"leads_3mo": 25, "high_quality": 2, "high_rate": "8.0%"}, "fub_signal": "2 high-quality from 25 leads (8.0%)", "recommended_action": "Scale 'Duckduckgo' \u2014 current HIGH rate is 8.0%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_source_scale", "priority": "P2", "source": "Sphere", "metrics_snapshot": {"leads_3mo": 11, "high_quality": 1, "high_rate": "9.1%"}, "fub_signal": "1 high-quality from 11 leads (9.1%)", "recommended_action": "Scale 'Sphere' \u2014 current HIGH rate is 9.1%.", "why_it_matters": "Active, proven channel with above-average quality rate."}, {"type": "fub_quality_fix", "priority": "P3", "url": "https://www.kennarealestate.com/financing/1000-cash-to-close", "path": "/financing/1000-cash-to-close", "category": "Financing", "metrics_snapshot": {"fub_leads_3mo": 8, "fub_high_quality": 0, "fub_high_rate": "0.0%", "fub_low_quality": 1}, "fub_signal": "Weak: 8 leads, 0 high-quality (0.0%)", "recommended_action": "Tighten qualification on this page \u2014 leads aren't converting to quality.", "why_it_matters": "Generating volume without quality wastes agent follow-up time."}];

// Preserved SEO data
const TOP10_WASTED = [{"path": "/(not set)", "sessions": 13007, "engagement_rate": 0.0068, "bounce_rate": 0.9932}, {"path": "/blog/the-richest-neighborhoods-in-miami-fl-2025", "sessions": 1387, "engagement_rate": 0.5032, "bounce_rate": 0.4968}, {"path": "/mortgage-calculator.php", "sessions": 1151, "engagement_rate": 0.0252, "bounce_rate": 0.9748}, {"path": "/property-search/property-tracker", "sessions": 992, "engagement_rate": 0.3569, "bounce_rate": 0.6431}, {"path": "/blog/common-issues-with-lighted-mirrors-and-how-to-fix-them", "sessions": 941, "engagement_rate": 0.4516, "bounce_rate": 0.5484}, {"path": "/blog/richest-neighborhoods-denver-co-2025", "sessions": 860, "engagement_rate": 0.5291, "bounce_rate": 0.4709}, {"path": "/blog/pros-and-cons-of-living-in-sebring-fl-what-to-expect", "sessions": 858, "engagement_rate": 0.6503, "bounce_rate": 0.3497}];

const CANNIBALIZED = [{"query":"rent to own","num_pages":11,"total_impressions":20644},{"query":"hud homes for sale","num_pages":7,"total_impressions":10242},{"query":"rent to own homes near me","num_pages":32,"total_impressions":9982},{"query":"rent to own homes","num_pages":24,"total_impressions":6567},{"query":"rent to own near me","num_pages":13,"total_impressions":6206},{"query":"kenna real estate","num_pages":14,"total_impressions":2740},{"query":"rent to own homes denver","num_pages":4,"total_impressions":1876},{"query":"next gen homes colorado","num_pages":9,"total_impressions":1368},{"query":"rent to own homes colorado","num_pages":5,"total_impressions":1253},{"query":"lease to own homes","num_pages":12,"total_impressions":1038}];

const STRIKING = [{"query":"hud homes for sale","path":"/denver/hud-homes-for-sale","position":14.2,"impressions":8798,"clicks":9,"ctr":0.001},{"query":"rent to own","path":"/colorado-springs-rent-to-own","position":19.5,"impressions":5325,"clicks":24,"ctr":0.0045},{"query":"colorado real estate","path":"/","position":12.5,"impressions":4682,"clicks":8,"ctr":0.0017},{"query":"sebring fl","path":"/blog/pros-and-cons-of-living-in-sebring-fl-what-to-expect","position":8.8,"impressions":4299,"clicks":60,"ctr":0.014},{"query":"rent to own homes near me","path":"/denver/rent-to-own-homes","position":10.2,"impressions":3991,"clicks":48,"ctr":0.012},{"query":"junk removal honolulu","path":"/blog/the-cost-of-junk-removal-in-honolulu-hi-what-to-expect-and-how-to-budget","position":6.5,"impressions":3512,"clicks":3,"ctr":0.0009},{"query":"commercial real estate denver","path":"/commercial-real-estate","position":13.5,"impressions":3092,"clicks":4,"ctr":0.0013},{"query":"colorado homes for sale","path":"/","position":11.2,"impressions":3000,"clicks":5,"ctr":0.0017},{"query":"sebring florida","path":"/blog/pros-and-cons-of-living-in-sebring-fl-what-to-expect","position":8.1,"impressions":2490,"clicks":27,"ctr":0.0108},{"query":"rent to own homes","path":"/colorado-springs-rent-to-own","position":15.5,"impressions":2348,"clicks":21,"ctr":0.0089},{"query":"colorado homes","path":"/","position":8.2,"impressions":2308,"clicks":7,"ctr":0.003},{"query":"rent to own near me","path":"/denver/rent-to-own-homes","position":11.5,"impressions":2210,"clicks":14,"ctr":0.0063},{"query":"rent to own colorado","path":"/colorado-springs-rent-to-own","position":14.0,"impressions":2032,"clicks":15,"ctr":0.0074},{"query":"horse property for sale colorado","path":"/denver/equestrian-properties-for-sale","position":5.8,"impressions":1742,"clicks":47,"ctr":0.027},{"query":"most expensive neighborhoods in denver","path":"/blog/richest-neighborhoods-denver-co-2025","position":4.2,"impressions":1607,"clicks":96,"ctr":0.0597},{"query":"colorado springs rent to own","path":"/colorado-springs-rent-to-own","position":9.5,"impressions":1566,"clicks":55,"ctr":0.0351},{"query":"homes for sale colorado","path":"/","position":14.2,"impressions":1332,"clicks":2,"ctr":0.0015},{"query":"next gen homes colorado","path":"/denver/next-gen-homes-for-sale","position":6.2,"impressions":1115,"clicks":110,"ctr":0.0987},{"query":"lease to own homes","path":"/denver/rent-to-own-homes","position":12.8,"impressions":1022,"clicks":5,"ctr":0.0049},{"query":"fort collins co","path":"/blog/best-neighborhoods-in-fort-collins-honest-local-perspectives","position":17.5,"impressions":943,"clicks":2,"ctr":0.0021}];

const RSEO = {"source":"Relational SEO API","business":"Kenna Real Estate","location":"Denver, CO","diagnostic_summary":{"primary_suppressor":{"label":"Scaled Content & Deadweight Pages","impact":"HIGH","recovery_type":"Threshold-based","description":"Hundreds of templated community/lifestyle pages with thin, repetitive text + IDX feeds create massive content redundancy. Google's Scaled Content System likely classifies the site as 'built for search engines' causing domain-level quality suppression.","action":"Audit and prune/consolidate the vast majority of zero-traffic community pages. Merge 15+ small suburban pages into regional hub 'power pages' with unique video tours, agent commentary, original photography."},"amplifier_b1":{"label":"E-E-A-T & Information Gain Deficit","impact":"MED-HIGH","recovery_type":"Incremental (only after primary fix)","description":"Community pages offer little beyond IDX feeds. Blog covers standard topics without original data or lived experience. Agent bios may lack detailed transaction histories or unique local insights.","action":"Embed agent-led video commentary on key market pages. Shift blog to expert-authored content with original data. Enhance agent bios with transaction history, client testimonials, video interviews."},"amplifier_b2":{"label":"Intent & Satisfaction Mismatch","impact":"MEDIUM","recovery_type":"Incremental","description":"Users searching 'homes for sale Washington Park' land on generic intro + IDX feed, then bounce back to SERP for Zillow/Redfin which have better map interfaces, filters, and community data.","action":"Enrich remaining key pages with deeper community insight, better map interfaces, and granular search filters that compete with aggregator platforms."},"friction_c1":{"label":"Trust Signal Asymmetry","impact":"LOW","description":"1,700+ Zillow reviews and 500+ Google reviews are strong, but may lack deep corroboration from local media mentions, agent features, or independent validation."}},"classifier_status":{"scaled_content_system":{"status":"LIKELY TRIGGERED","detail":"High ratio of templated community pages to unique content pages. 3,744 template pages vs ~400 unique pages suggests domain-level quality suppression."},"helpful_content_system":{"status":"AT RISK","detail":"Blog content covers standard topics without original data. Community pages rely on IDX feeds without unique value-add."},"brand_bias_model":{"status":"FAVORABLE","detail":"Strong brand signals: 1,700+ Zillow reviews, 500+ Google reviews, established local presence."}},"website_scores":{"seo":{"score":"4/10","note":"Massive cannibalization, thin content, poor technical structure"},"cro":{"score":"3/10","note":"0.025% lead rate, 99.67% of pages generate zero leads"},"content_integrity":{"score":"3/10","note":"3,744 template pages, minimal original content"},"ux_friction":{"score":"5/10","note":"Basic IDX search works but lacks modern UX patterns"},"trust_validation":{"score":"8/10","note":"Strong review profile, established brand"},"temporal_drift":{"score":"6/10","note":"Blog publishes regularly but community pages are static"}},"priority_actions":[{"priority":1,"action":"Build Neighborhood Authority Hubs","detail":"Consolidate ~500+ community template pages into 30-50 authoritative regional hub pages with unique video tours, agent commentary, and original photography. Each hub becomes a ranking powerhouse.","effort":"HIGH","impact":"HIGH"},{"priority":2,"action":"Consolidate Keyword Groups into Hub Pages","detail":"Unify 123 keyword groups by creating definitive hub pages. Start with rent-to-own (32 pages \u2192 1 hub) and HUD homes (7 pages \u2192 1 hub).","effort":"MEDIUM","impact":"HIGH"},{"priority":3,"action":"Add Lead Capture to High-Traffic Pages","detail":"Deploy forms, CTAs, and exit-intent popups on the highest-traffic zero-conversion pages. Quick win: 23,343 sessions could yield 112+ leads at 0.5% capture.","effort":"LOW","impact":"HIGH"},{"priority":4,"action":"Strengthen E-E-A-T with Agent Expertise","detail":"Embed agent-led video commentary, transaction histories, and original photography on top 50 pages to differentiate from aggregator competitors.","effort":"MEDIUM","impact":"MEDIUM"},{"priority":5,"action":"Push Striking Distance Keywords to Page 1","detail":"547 keywords at positions 4-20 are within reach. Content enrichment and internal linking can push these to page 1 for significant traffic gains.","effort":"MEDIUM","impact":"MEDIUM"}]};


// ========== NAV ACTIVE STATE ==========
function setActive(el) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
}

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const id = entry.target.id;
      const link = document.querySelector(`.nav-link[href="#${id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { threshold: 0.15, rootMargin: '-64px 0px -50% 0px' });
sections.forEach(s => observer.observe(s));

// ========== HELPERS ==========
function fmt(n) { return n.toLocaleString(); }
function fmtDollar(n) { 
  if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n/1000).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}
function pct(n, d) { return d > 0 ? (n/d*100).toFixed(1) + '%' : '0%'; }

function rateClass(rate) {
  if (rate >= 0.08) return 'rate-green';
  if (rate >= 0.05) return 'rate-yellow';
  if (rate < 0.03 && rate > 0) return 'rate-red';
  return '';
}

// ========== RENDER TASK CARDS ==========
function typeBadge(type) {
  const map = {
    'UX_lead_capture_fix': ['UX/CRO', 'badge-ux'],
    'CTR_fix': ['CTR Fix', 'badge-ctr'],
    'content_rewrite': ['Content', 'badge-content'],
    'consolidate': ['Consolidate', 'badge-consolidate'],
    'risk_cleanup': ['Risk', 'badge-risk'],
    'fub_high_value': ['FUB REVENUE', 'badge-fub'],
    'fub_quality_fix': ['FUB QUALITY', 'badge-fub'],
    'fub_source_scale': ['FUB SOURCE', 'badge-fub'],
    'fub_source_channel': ['FUB SOURCE', 'badge-fub'],
    'fub_agent_workload': ['FUB AGENT', 'badge-fub']
  };
  const [label, cls] = map[type] || [type, 'badge-ux'];
  return `<span class="badge ${cls}">${label}</span>`;
}

function priorityBadgeClass(p) {
  const s = String(p);
  if (s === '1' || s === 'P1') return 'badge-p1';
  if (s === '2' || s === 'P2') return 'badge-p2';
  return 'badge-p3';
}
function priorityLabel(p) {
  const s = String(p);
  if (s.startsWith('P')) return s;
  return 'P' + s;
}

function renderMixedCards(seoCards, fubCards, containerId, dimmed) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  let allCards = [];
  seoCards.forEach(c => allCards.push({...c, _source: 'seo'}));
  fubCards.forEach(c => allCards.push({...c, _source: 'fub'}));
  
  container.innerHTML = allCards.map(card => {
    const isFub = card._source === 'fub';
    const m = card.metrics_snapshot || {};
    const metricsHtml = [];
    
    if (m.sessions !== undefined) metricsHtml.push(`<div class="task-metric">Sessions: <span>${fmt(m.sessions)}</span></div>`);
    if (m.conversions !== undefined) metricsHtml.push(`<div class="task-metric">Conv: <span>${m.conversions}</span></div>`);
    if (m.engagement_rate !== undefined) metricsHtml.push(`<div class="task-metric">Engage: <span>${(m.engagement_rate * 100).toFixed(1)}%</span></div>`);
    if (m.bounce_rate !== undefined) metricsHtml.push(`<div class="task-metric">Bounce: <span>${(m.bounce_rate * 100).toFixed(1)}%</span></div>`);
    if (m.impressions !== undefined) metricsHtml.push(`<div class="task-metric">Impr: <span>${fmt(m.impressions)}</span></div>`);
    if (m.clicks !== undefined) metricsHtml.push(`<div class="task-metric">Clicks: <span>${m.clicks}</span></div>`);
    if (m.ctr !== undefined) metricsHtml.push(`<div class="task-metric">CTR: <span>${(m.ctr * 100).toFixed(2)}%</span></div>`);
    if (m.position !== undefined) metricsHtml.push(`<div class="task-metric">Pos: <span>${m.position}</span></div>`);
    if (m.fub_total_leads !== undefined) metricsHtml.push(`<div class="task-metric">FUB Leads: <span>${m.fub_total_leads}</span></div>`);
    if (m.fub_leads_3mo !== undefined) metricsHtml.push(`<div class="task-metric">FUB Leads (3mo): <span>${m.fub_leads_3mo}</span></div>`);
    if (m.fub_high_quality !== undefined) metricsHtml.push(`<div class="task-metric">HIGH: <span>${m.fub_high_quality}</span></div>`);
    if (m.fub_high_rate) metricsHtml.push(`<div class="task-metric">High Rate: <span>${m.fub_high_rate}</span></div>`);
    if (m.fub_closed_volume) metricsHtml.push(`<div class="task-metric" style="color:var(--teal)">Closed: <span style="color:var(--teal)">${m.fub_closed_volume}</span></div>`);
    if (m.fub_commission) metricsHtml.push(`<div class="task-metric">Commission: <span>${m.fub_commission}</span></div>`);
    if (m.leads_3mo) metricsHtml.push(`<div class="task-metric">Leads (3mo): <span>${fmt(m.leads_3mo)}</span></div>`);
    if (m.high_quality !== undefined && !m.fub_high_quality) metricsHtml.push(`<div class="task-metric">HIGH: <span>${m.high_quality}</span></div>`);
    if (m.high_rate && !m.fub_high_rate) metricsHtml.push(`<div class="task-metric">High Rate: <span>${m.high_rate}</span></div>`);
    
    const path = card.path || card.url || '';
    const displayPath = path.replace(/^https?:\/\/[^\/]+/, '');
    const displayUrl = displayPath.length > 70 ? displayPath.substring(0, 67) + '...' : displayPath;
    const linkUrl = card.url && card.url.startsWith('http') ? card.url : 'https://www.kennarealestate.com' + displayPath;
    const fubSignal = card.fub_signal ? `<div class="fub-signal-tag">&#9670; ${card.fub_signal}</div>` : '';
    const sourceLabel = card.source ? `<div style="font-size:12px;color:var(--text-muted);margin:4px 0">Source: <strong>${card.source}</strong></div>` : '';
    
    return `
      <div class="task-card${dimmed ? ' dimmed' : ''}${isFub ? ' fub-card' : ''}" data-source="${card._source}">
        <div class="task-header">
          <span class="badge ${priorityBadgeClass(card.priority)}">${priorityLabel(card.priority)}</span>
          ${typeBadge(card.type)}
        </div>
        ${displayPath ? `<a href="${linkUrl}" class="task-url" target="_blank" rel="noopener">${displayUrl}</a>` : ''}
        ${sourceLabel}
        ${card.primary_query && card.primary_query !== 'N/A' ? `<div class="task-query">Query: "${card.primary_query}"</div>` : ''}
        <div class="task-metrics">${metricsHtml.join('')}</div>
        <div class="task-action">${card.recommended_action}</div>
        <div class="task-why">${card.why_it_matters}</div>
        ${fubSignal}
      </div>
    `;
  }).join('');
}

// Split FUB cards by priority
const fubP1 = FUB_TASK_CARDS.filter(c => c.priority === 'P1');
const fubP2 = FUB_TASK_CARDS.filter(c => c.priority === 'P2');
const fubP3 = FUB_TASK_CARDS.filter(c => c.priority === 'P3');

renderMixedCards(P1_CARDS, fubP1, 'p1-list', false);
renderMixedCards(P2_CARDS, fubP2, 'p2-list', true);
renderMixedCards(P3_CARDS, fubP3, 'p3-list', true);

// Count tasks
const seoTotal = P1_CARDS.length + P2_CARDS.length + P3_CARDS.length;
const fubTotal = FUB_TASK_CARDS.length;
document.getElementById('task-count-label').textContent = `${seoTotal + fubTotal} total task cards: ${seoTotal} SEO + ${fubTotal} FUB-specific`;

// Task summary
document.getElementById('task-summary').innerHTML = `
  <span class="count-chip" style="color:var(--red)">${P1_CARDS.length} SEO P1</span>
  <span class="count-chip" style="color:var(--text-dim)">+</span>
  <span class="count-chip" style="color:var(--purple)">${fubP1.length} FUB P1</span>
  <span class="count-chip" style="color:var(--text-dim)">|</span>
  <span class="count-chip" style="color:var(--orange)">${P2_CARDS.length} SEO P2</span>
  <span class="count-chip" style="color:var(--text-dim)">+</span>
  <span class="count-chip" style="color:var(--purple)">${fubP2.length} FUB P2</span>
  <span class="count-chip" style="color:var(--text-dim)">|</span>
  <span class="count-chip" style="color:var(--yellow)">${P3_CARDS.length} SEO P3</span>
  <span class="count-chip" style="color:var(--text-dim)">+</span>
  <span class="count-chip" style="color:var(--purple)">${fubP3.length} FUB P3</span>
  <span class="count-chip" style="color:var(--text-dim)">=</span>
  <span class="count-chip" style="color:var(--text)">${seoTotal + fubTotal} total</span>
`;

// Task filtering
function filterTasks(filter, btn) {
  document.querySelectorAll('.task-toggle-btn').forEach(b => b.classList.remove('active', 'active-seo'));
  btn.classList.add(filter === 'fub' ? 'active' : 'active-seo');
  
  document.querySelectorAll('.task-card').forEach(card => {
    const src = card.dataset.source;
    if (filter === 'all') card.style.display = '';
    else if (filter === 'seo') card.style.display = src === 'seo' ? '' : 'none';
    else if (filter === 'fub') card.style.display = src === 'fub' ? '' : 'none';
  });
}

// ========== RENDER WASTED TRAFFIC TABLE ==========
(function() {
  const tbody = document.getElementById('wasted-tbody');
  // Filter out ephemeral IDX listing pages
  const filteredWasted = TOP10_WASTED.filter(p => !p.path.includes('/property-search/detail/'));
  tbody.innerHTML = filteredWasted.map((p, i) => {
    const isHighEngage = p.engagement_rate > 0.35;
    const signal = isHighEngage 
      ? '<span style="color:var(--teal);font-weight:600">&#9679; Ready to Convert</span>'
      : '<span style="color:var(--text-dim)">Needs work</span>';
    return `
      <tr class="${isHighEngage ? 'highlight' : ''}">
        <td style="font-weight:600;color:var(--text-dim)">${i + 1}</td>
        <td class="path">${p.path}</td>
        <td style="font-weight:600">${p.sessions.toLocaleString()}</td>
        <td>${(p.engagement_rate * 100).toFixed(1)}%</td>
        <td>${(p.bounce_rate * 100).toFixed(1)}%</td>
        <td>${signal}</td>
      </tr>
    `;
  }).join('');
})();

// ========== RENDER CANNIBALIZATION ==========
(function() {
  const tbody = document.getElementById('cannib-tbody');
  tbody.innerHTML = CANNIBALIZED.map(q => `
    <tr>
      <td style="font-weight:500">${q.query}</td>
      <td style="font-weight:700;color:var(--purple)">${q.num_pages}</td>
      <td>${q.total_impressions.toLocaleString()}</td>
    </tr>
  `).join('');
  
  const ctx = document.getElementById('cannibChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: CANNIBALIZED.map(q => q.query.length > 25 ? q.query.substring(0, 22) + '...' : q.query),
      datasets: [{
        label: 'Competing Pages',
        data: CANNIBALIZED.map(q => q.num_pages),
        backgroundColor: CANNIBALIZED.map(q => q.num_pages > 20 ? 'rgba(167,139,250,0.7)' : q.num_pages > 10 ? 'rgba(167,139,250,0.5)' : 'rgba(96,165,250,0.5)'),
        borderRadius: 4,
        barThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1b2e',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: '#2d2f45',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            afterLabel: function(ctx) {
              return CANNIBALIZED[ctx.dataIndex].total_impressions.toLocaleString() + ' impressions';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(45,47,69,0.4)' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e2e8f0', font: { size: 11, family: 'Inter' } }
        }
      }
    }
  });
})();

// ========== RENDER STRIKING DISTANCE ==========
(function() {
  const denverQueries = ['colorado', 'denver', 'colorado springs', 'rent to own', 'hud homes', 'sell my house'];
  const tbody = document.getElementById('striking-tbody');
  tbody.innerHTML = STRIKING.map(s => {
    const isDenver = denverQueries.some(d => s.query.toLowerCase().includes(d) || s.path.toLowerCase().includes('denver') || s.path.toLowerCase().includes('colorado'));
    return `
      <tr class="${isDenver ? 'denver-intent' : ''}">
        <td style="font-weight:500">${s.query}</td>
        <td class="path">${s.path}</td>
        <td style="font-weight:600">${s.position.toFixed(1)}</td>
        <td>${s.impressions.toLocaleString()}</td>
        <td>${s.clicks}</td>
        <td>${(s.ctr * 100).toFixed(2)}%</td>
      </tr>
    `;
  }).join('');
})();

// ========== RENDER RISK MONITOR ==========
(function() {
  const classifiers = RSEO.classifier_status;
  const grid = document.getElementById('classifier-grid');
  const classMap = {
    'scaled_content_system': { name: 'Scaled Content System', statusClass: 'status-red' },
    'helpful_content_system': { name: 'Helpful Content System', statusClass: 'status-orange' },
    'brand_bias_model': { name: 'Brand Bias Model', statusClass: 'status-green' }
  };
  grid.innerHTML = Object.entries(classifiers).map(([key, val]) => {
    const info = classMap[key] || { name: key, statusClass: 'status-orange' };
    return `
      <div class="classifier-card">
        <h3 style="margin-bottom:8px">${info.name}</h3>
        <div class="classifier-status ${info.statusClass}">
          <span class="status-dot"></span>
          ${val.status}
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:6px">${val.detail}</p>
      </div>
    `;
  }).join('');
  
  const scores = RSEO.website_scores;
  const scoreGrid = document.getElementById('score-grid');
  const scoreNames = {
    'seo': 'SEO',
    'cro': 'CRO',
    'content_integrity': 'Content Integrity',
    'ux_friction': 'UX / Friction',
    'trust_validation': 'Trust Validation',
    'temporal_drift': 'Temporal Drift'
  };
  scoreGrid.innerHTML = Object.entries(scores).map(([key, val]) => {
    const score = parseInt(val.score);
    const color = score >= 9 ? 'var(--teal)' : score >= 7 ? 'var(--yellow)' : 'var(--red)';
    return `
      <div class="score-item" title="${val.note}">
        <span class="score-label">${scoreNames[key] || key}</span>
        <span class="score-val" style="color:${color}">${val.score}</span>
      </div>
    `;
  }).join('');
  
  const actions = RSEO.priority_actions;
  const actionList = document.getElementById('action-list');
  actionList.innerHTML = actions.map(a => `
    <li class="action-item">
      <div class="action-num">${a.priority}</div>
      <div class="action-text">
        <strong>${a.action}</strong>
        <div class="detail">${a.detail}</div>
        <div style="margin-top:4px;font-size:11px">
          <span style="color:var(--orange);font-weight:600">Effort: ${a.effort}</span> &middot;
          <span style="color:var(--teal);font-weight:600">Impact: ${a.impact}</span>
        </div>
      </div>
    </li>
  `).join('');
})();

// ========== LIFECYCLE: FUNNEL VISUALIZATION ==========
(function() {
  const stages = [
    { key: 'TOTAL', label: 'TOTAL', count: LIFECYCLE_FUNNEL.TOTAL, color: 'var(--purple)', bg: 'rgba(167,139,250,0.15)' },
    { key: 'NEW', label: 'NEW', count: LIFECYCLE_FUNNEL.NEW, color: 'var(--red)', bg: 'rgba(248,113,113,0.12)' },
    { key: 'ATTEMPTED', label: 'ATTEMPTED', count: LIFECYCLE_FUNNEL.ATTEMPTED, color: 'var(--orange)', bg: 'rgba(251,146,60,0.12)' },
    { key: 'SPOKE', label: 'SPOKE', count: LIFECYCLE_FUNNEL.SPOKE, color: 'var(--yellow)', bg: 'rgba(251,191,36,0.12)' },
    { key: 'NURTURE', label: 'NURTURE', count: LIFECYCLE_FUNNEL.NURTURE, color: 'var(--yellow)', bg: 'rgba(251,191,36,0.10)' },
    { key: 'WARM', label: 'WARM', count: LIFECYCLE_FUNNEL.WARM, color: 'var(--teal)', bg: 'rgba(46,204,113,0.12)' },
    { key: 'HOT', label: 'HOT', count: LIFECYCLE_FUNNEL.HOT, color: 'var(--teal)', bg: 'rgba(46,204,113,0.18)' },
    { key: 'PENDING', label: 'PENDING', count: LIFECYCLE_FUNNEL.PENDING, color: 'var(--blue)', bg: 'rgba(96,165,250,0.12)' },
    { key: 'CLOSED', label: 'CLOSED', count: LIFECYCLE_FUNNEL.CLOSED, color: 'var(--teal)', bg: 'rgba(46,204,113,0.25)' }
  ];
  const maxCount = stages[0].count;
  const container = document.getElementById('lifecycle-funnel');
  container.innerHTML = stages.map(s => {
    const widthPct = Math.max((s.count / maxCount) * 100, 6);
    return `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="font-size:11px;color:var(--text-dim);min-width:90px;text-transform:uppercase;letter-spacing:0.04em">${s.label}</span>
        <div style="flex:1;height:28px;background:${s.bg};border-radius:6px;overflow:hidden;position:relative">
          <div style="width:${widthPct}%;height:100%;background:${s.bg.replace('0.1', '0.4').replace('0.12', '0.5').replace('0.15', '0.5').replace('0.18', '0.5').replace('0.25', '0.6')};border-radius:6px;display:flex;align-items:center;padding-left:10px;min-width:50px">
            <span style="font-size:12px;font-weight:700;color:${s.color}">${fmt(s.count)}</span>
          </div>
        </div>
        <span style="font-size:11px;color:var(--text-dim);min-width:40px;text-align:right">${(s.count / maxCount * 100).toFixed(1)}%</span>
      </div>
    `;
  }).join('');
})();

// ========== LIFECYCLE: MONTHLY TREND CHART (9mo) ==========
(function() {
  const months = Object.keys(LIFECYCLE_MONTHLY).sort();
  const labels = months.map(m => {
    const [y, mo] = m.split('-');
    const names = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return names[parseInt(mo)] + ' \'' + y.slice(2);
  });
  
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'NEW',
          data: months.map(m => LIFECYCLE_MONTHLY[m].NEW),
          borderColor: '#f87171',
          backgroundColor: 'rgba(248,113,113,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          borderWidth: 2
        },
        {
          label: 'ATTEMPTED',
          data: months.map(m => LIFECYCLE_MONTHLY[m].ATTEMPTED),
          borderColor: '#fb923c',
          backgroundColor: 'rgba(251,146,60,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          borderWidth: 2
        },
        {
          label: 'NURTURE',
          data: months.map(m => LIFECYCLE_MONTHLY[m].NURTURE),
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251,191,36,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          borderWidth: 2
        },
        {
          label: 'WARM+HOT+PENDING',
          data: months.map(m => (LIFECYCLE_MONTHLY[m].WARM || 0) + (LIFECYCLE_MONTHLY[m].HOT || 0) + (LIFECYCLE_MONTHLY[m].PENDING || 0)),
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46,204,113,0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5
        },
        {
          label: 'ARCHIVES',
          data: months.map(m => LIFECYCLE_MONTHLY[m].ARCHIVES),
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167,139,250,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          borderWidth: 2
        },
        {
          label: 'Contact Rate %',
          data: months.map(m => LIFECYCLE_MONTHLY[m].contact_rate),
          borderColor: '#60a5fa',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5,
          borderDash: [5, 3],
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, padding: 16 }
        },
        tooltip: {
          backgroundColor: '#1a1b2e',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: '#2d2f45',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            footer: function(items) {
              const idx = items[0] ? items[0].dataIndex : null;
              if (idx !== null) {
                const m = LIFECYCLE_MONTHLY[months[idx]];
                return 'Total: ' + fmt(m.total) + ' | Contact Rate: ' + m.contact_rate + '%';
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(45,47,69,0.3)' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(45,47,69,0.3)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          title: { display: true, text: 'Lead Count', color: '#64748b', font: { size: 11 } }
        },
        y1: {
          position: 'right',
          grid: { display: false },
          ticks: { color: '#60a5fa', font: { size: 11 }, callback: v => v + '%' },
          title: { display: true, text: 'Contact Rate', color: '#60a5fa', font: { size: 11 } },
          min: 0,
          max: 100
        }
      }
    }
  });
})();

// ========== LIFECYCLE: SOURCE CHANNEL MATRIX ==========
(function() {
  const sources = Object.entries(SOURCE_LIFECYCLE)
    .map(([name, d]) => ({name, ...d}))
    .sort((a, b) => b.pipeline - a.pipeline);
  
  const maxTotal = Math.max(...sources.map(s => s.total));
  
  function pipelineRateClass(rate) {
    if (rate > 5) return 'rate-green';
    if (rate >= 3) return 'rate-yellow';
    if (rate < 3 && rate > 0) return 'rate-red';
    return '';
  }
  
  const tbody = document.getElementById('source-tbody');
  tbody.innerHTML = sources.map(s => {
    const barWidth = maxTotal > 0 ? (s.total / maxTotal * 100) : 0;
    const prc = pipelineRateClass(s.pipeline_rate);
    const ncColor = s.never_called_rate > 20 ? 'color:var(--red);font-weight:700' : s.never_called_rate > 10 ? 'color:var(--orange)' : '';
    const budgetStr = s.avg_budget > 0 ? fmtDollar(s.avg_budget) : '—';
    return `
      <tr>
        <td style="font-weight:600;white-space:nowrap">${s.name}</td>
        <td class="num">${fmt(s.total)}</td>
        <td class="num">${s.contact_rate}%</td>
        <td class="num" style="${ncColor}">${s.never_called_rate}%</td>
        <td class="num" style="color:var(--teal);font-weight:700">${s.pipeline}</td>
        <td class="num ${prc}">${s.pipeline_rate.toFixed(1)}%</td>
        <td class="num" style="${s.close_rate > 0 ? 'color:var(--teal);font-weight:600' : 'color:var(--text-dim)'}">${s.close_rate.toFixed(1)}%</td>
        <td class="num">${budgetStr}</td>
        <td>
          <div class="vol-bar">
            <div class="vol-bar-fill" style="width:${barWidth}%;background:var(--purple)"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
})();

// ========== COACHING: AGENT CARDS ==========
(function() {
  const stageColors = {
    new: '#60a5fa', attempted: '#a78bfa', nurture: '#2ecc71',
    warm: '#fb923c', hot: '#f87171', pending: '#fbbf24',
    closed: '#34d399', archives: '#475569'
  };
  const stageLabels = {
    new: 'New', attempted: 'Attempted', nurture: 'Nurture',
    warm: 'Warm', hot: 'Hot', pending: 'Pending',
    closed: 'Closed', archives: 'Archives'
  };

  // Sort: closings desc, then pipeline desc, then leads desc
  const agents = Object.entries(AGENT_COACHING)
    .map(([name, d]) => ({name, ...d}))
    .sort((a, b) => (b.closed - a.closed) || (b.pipeline - a.pipeline) || (b.leads - a.leads));

  const grid = document.getElementById('agent-cards-grid');
  grid.innerHTML = agents.map(agent => {
    const roleBadgeClass = agent.role === 'Broker' ? 'broker' : agent.role === 'Team Leader' ? 'leader' : '';
    const totalStages = Object.values(agent.stages).reduce((s, v) => s + v, 0);

    // Stage bar segments
    const stageBar = Object.entries(agent.stages)
      .filter(([, v]) => v > 0)
      .map(([stage, count]) => {
        const pct = (count / totalStages * 100).toFixed(1);
        return `<div class="stage-bar-segment" style="width:${pct}%;background:${stageColors[stage]}" title="${stageLabels[stage]}: ${count} (${pct}%)"></div>`;
      }).join('');

    // Stage legend (only stages with > 0)
    const stageLegend = Object.entries(agent.stages)
      .filter(([, v]) => v > 0)
      .map(([stage, count]) => `<span><span class="dot" style="background:${stageColors[stage]}"></span>${stageLabels[stage]} ${count}</span>`)
      .join('');

    // Format call duration
    const durLabel = agent.avg_call_dur >= 60
      ? (agent.avg_call_dur / 60).toFixed(1) + 'm'
      : agent.avg_call_dur + 's';

    return `
      <div class="agent-card">
        <div class="agent-card-header">
          <h4>${agent.name}</h4>
          <span class="agent-role-badge ${roleBadgeClass}">${agent.role}</span>
        </div>
        <div class="agent-metrics-row">
          <div class="agent-metric">
            <div class="am-val">${agent.leads}</div>
            <div class="am-label">Leads</div>
          </div>
          <div class="agent-metric">
            <div class="am-val" style="color:${agent.contact_rate >= 40 ? 'var(--teal)' : agent.contact_rate >= 20 ? 'var(--text)' : 'var(--orange)'}">${agent.contact_rate}%</div>
            <div class="am-label">Contact Rate</div>
          </div>
          <div class="agent-metric">
            <div class="am-val" style="color:var(--blue)">${agent.pipeline}</div>
            <div class="am-label">Pipeline</div>
          </div>
          <div class="agent-metric">
            <div class="am-val" style="color:${agent.closed > 0 ? 'var(--teal)' : 'var(--text-muted)'}">${agent.closed}</div>
            <div class="am-label">Closings</div>
          </div>
        </div>
        <div class="agent-calls-row">
          <span>&#128222; <strong>${agent.calls_90d}</strong> calls (90d)</span>
          <span>Connect: <strong>${agent.call_connect}%</strong></span>
          <span>Avg: <strong>${durLabel}</strong></span>
          <span>Notes: <strong>${agent.notes_90d}</strong></span>
        </div>
        <div class="agent-section-label strengths">&#10003; Strengths</div>
        <ul class="agent-strengths">
          ${agent.strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
        <div class="agent-section-label coaching">&#128161; Where Brian Can Help</div>
        <ul class="agent-coaching">
          ${agent.coaching.map(c => `<li>${c}</li>`).join('')}
        </ul>
        <div class="stage-bar-container">
          <div class="stage-bar">${stageBar}</div>
          <div class="stage-legend">${stageLegend}</div>
        </div>
      </div>
    `;
  }).join('');
})();
