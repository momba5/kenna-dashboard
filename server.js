require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

const { fetchAllData } = require('./fetcher');
const { generateInsights } = require('./insights');
const { renderDashboard, renderLogin } = require('./render');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE = '/fub-insights';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
}

// ---------------------------------------------------------------------------
// Password hash — generated once on startup from plaintext env var
// ---------------------------------------------------------------------------
let passwordHash = null;

async function initPasswordHash() {
  const plain = process.env.DASHBOARD_PASSWORD;
  if (!plain) {
    console.error('DASHBOARD_PASSWORD environment variable is required');
    process.exit(1);
  }
  passwordHash = await bcrypt.hash(plain, 12);
  console.log('Password hash generated');
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'kenna-fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: 'lax'
  }
}));

// Trust Railway's proxy so secure cookies work
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
app.use(`${BASE}/public`, express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.redirect(`${BASE}/login`);
}

// ---------------------------------------------------------------------------
// Login routes
// ---------------------------------------------------------------------------
app.get(`${BASE}/login`, (req, res) => {
  const error = req.query.error === '1' ? 'Almost! Give that password another shot — you\'ve got this.' : null;
  res.send(renderLogin(error));
});

app.post(`${BASE}/login`, async (req, res) => {
  const { password } = req.body;
  if (!password || !passwordHash) {
    return res.redirect(`${BASE}/login?error=1`);
  }
  const match = await bcrypt.compare(password, passwordHash);
  if (match) {
    req.session.authenticated = true;
    return res.redirect(BASE);
  }
  return res.redirect(`${BASE}/login?error=1`);
});

app.get(`${BASE}/logout`, (req, res) => {
  req.session.destroy(() => {
    res.redirect(`${BASE}/login`);
  });
});

// ---------------------------------------------------------------------------
// Refresh state
// ---------------------------------------------------------------------------
let refreshState = {
  lastRefresh: null,
  status: 'idle', // idle | running | error
  error: null,
  startedAt: null
};

async function runRefresh() {
  if (refreshState.status === 'running') {
    console.log('Refresh already in progress, skipping');
    return;
  }

  refreshState.status = 'running';
  refreshState.startedAt = new Date().toISOString();
  refreshState.error = null;
  console.log(`[${refreshState.startedAt}] Starting data refresh...`);

  try {
    const config = loadConfig();

    // Step 1: Fetch all FUB data and compute metrics
    const data = await fetchAllData(config);

    // Step 2: Generate Claude-powered insights
    const insights = await generateInsights(data, config);

    // Step 3: Combine and save to data.json
    const output = {
      ...data,
      insights,
      refreshedAt: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(__dirname, 'data.json'),
      JSON.stringify(output, null, 2)
    );

    // Step 4: Save snapshot to Postgres for historical trends
    await db.saveSnapshot(output);

    refreshState.lastRefresh = output.refreshedAt;
    refreshState.status = 'idle';
    console.log(`[${output.refreshedAt}] Refresh complete`);
  } catch (err) {
    refreshState.status = 'error';
    refreshState.error = err.message;
    console.error('Refresh failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Debug endpoint (no auth — temporary for development)
// ---------------------------------------------------------------------------
app.get(`${BASE}/api/debug`, (req, res) => {
  const debugPath = path.join(__dirname, 'debug-raw.json');
  if (!fs.existsSync(debugPath)) {
    return res.json({ error: 'No debug data yet — trigger a refresh first' });
  }
  try {
    const raw = JSON.parse(fs.readFileSync(debugPath, 'utf8'));
    res.json(raw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------------------------------------
// API routes (protected by API key)
// ---------------------------------------------------------------------------
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  const expected = process.env.DASHBOARD_API_KEY;
  if (!expected) {
    return res.status(500).json({ error: 'DASHBOARD_API_KEY not configured' });
  }
  if (key !== expected) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  return next();
}

app.get(`${BASE}/api/refresh`, requireApiKey, (req, res) => {
  // Return immediately, run refresh in background
  runRefresh();
  res.json({ message: 'Refresh started', startedAt: refreshState.startedAt });
});

app.get(`${BASE}/api/status`, (req, res) => {
  const config = loadConfig();
  const staleDays = config.thresholds.data_stale_warning_days;
  let isStale = false;

  if (refreshState.lastRefresh) {
    const lastDate = new Date(refreshState.lastRefresh);
    const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    isStale = daysSince > staleDays;
  } else {
    isStale = true;
  }

  res.json({
    lastRefresh: refreshState.lastRefresh,
    status: refreshState.status,
    error: refreshState.error,
    isStale,
    staleDays
  });
});

// ---------------------------------------------------------------------------
// Dashboard route (auth required)
// ---------------------------------------------------------------------------
app.get(BASE, requireAuth, async (req, res) => {
  const dataPath = path.join(__dirname, 'data.json');
  let data = null;

  if (fs.existsSync(dataPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      console.error('Error reading data.json:', e);
    }
  }

  // Attach historical trends from Postgres
  if (data) {
    try {
      const trends = await db.getTrends();
      db.attachTrends(data, trends);
    } catch (e) {
      console.error('Trend loading failed (non-fatal):', e.message);
    }
  }

  const config = loadConfig();
  const reminders = JSON.parse(fs.readFileSync(path.join(__dirname, 'reminders.json'), 'utf8'));

  res.send(renderDashboard(data, config, reminders, refreshState));
});

// Redirect bare path without trailing concerns
app.get(`${BASE}/`, requireAuth, (req, res) => {
  res.redirect(BASE);
});

// ---------------------------------------------------------------------------
// Cron scheduler
// ---------------------------------------------------------------------------
function scheduleCron() {
  const config = loadConfig();
  const schedule = config.refresh_schedule;

  if (cron.validate(schedule)) {
    cron.schedule(schedule, () => {
      console.log('Cron triggered refresh');
      runRefresh();
    });
    console.log(`Cron scheduled: ${schedule}`);
  } else {
    console.error(`Invalid cron schedule: ${schedule}`);
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function start() {
  await initPasswordHash();
  await db.initSchema();
  scheduleCron();

  app.listen(PORT, () => {
    console.log(`Kenna Dashboard v1.1 running on port ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}${BASE}`);
    console.log(`Login: http://localhost:${PORT}${BASE}/login`);
  });
}

start();
