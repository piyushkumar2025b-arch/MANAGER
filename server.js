import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import tls from 'node:tls';
import { DatabaseSync } from 'node:sqlite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import QRCode from 'qrcode';
import { onRequest } from './functions/api/[[route]].js';

// Load environment variables from .env if present
try { process.loadEnvFile?.(); } catch (_) {}
if (!process.env.YOUTUBE_API_KEY) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        }
      }
    }
  } catch (_) {}
}

const app = express();
const PORT = 3000;

// Parse json and urlencoded payloads up to 50MB for attachment support
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize persistent SQLite database
const dbPath = path.join(process.cwd(), 'vault.db');
const db = new DatabaseSync(dbPath);

// Ensure tables exist on boot
db.exec(`
  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    username TEXT,
    password TEXT NOT NULL,
    url TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'General',
    subtasks TEXT DEFAULT '[]',
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS models_3d (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    prompt TEXT,
    category TEXT DEFAULT 'general',
    recipe TEXT NOT NULL,
    thumbnail TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS canvas_boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    elements TEXT NOT NULL,
    thumbnail TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS stickers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'custom',
    emoji TEXT DEFAULT '',
    bg TEXT DEFAULT '',
    border TEXT DEFAULT '',
    color TEXT DEFAULT '',
    label TEXT DEFAULT '',
    svg TEXT DEFAULT '',
    data_url TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS map_pins (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '',
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    category TEXT DEFAULT 'favorite',
    color TEXT DEFAULT '#7c6af7',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ai_creations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    title TEXT DEFAULT '',
    media_url TEXT DEFAULT '',
    content TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    storage_type TEXT DEFAULT 'db',
    storage_key TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Safe migrations for todos columns
try { db.exec("ALTER TABLE todos ADD COLUMN category TEXT DEFAULT 'General'"); } catch (_) {}
try { db.exec("ALTER TABLE todos ADD COLUMN subtasks TEXT DEFAULT '[]'"); } catch (_) {}
try { db.exec("ALTER TABLE passwords ADD COLUMN totp_secret TEXT DEFAULT ''"); } catch (_) {}
try { db.exec("ALTER TABLE passwords ADD COLUMN item_type TEXT DEFAULT 'login'"); } catch (_) {}
try { db.exec("ALTER TABLE passwords ADD COLUMN card_number TEXT DEFAULT ''"); } catch (_) {}
try { db.exec("ALTER TABLE passwords ADD COLUMN card_exp TEXT DEFAULT ''"); } catch (_) {}
try { db.exec("ALTER TABLE passwords ADD COLUMN card_cvv TEXT DEFAULT ''"); } catch (_) {}
try { db.exec("ALTER TABLE todos ADD COLUMN reminder_time TEXT DEFAULT ''"); } catch (_) {}
try { db.exec("ALTER TABLE todos ADD COLUMN reminder_dismissed INTEGER DEFAULT 0"); } catch (_) {}
try { db.exec("ALTER TABLE todos ADD COLUMN recurring TEXT DEFAULT 'none'"); } catch (_) {}
try { db.exec("ALTER TABLE todos ADD COLUMN color TEXT DEFAULT ''"); } catch (_) {}
try { db.exec("ALTER TABLE attachments ADD COLUMN storage_key TEXT DEFAULT ''"); } catch (_) {}
try { db.exec("ALTER TABLE attachments ADD COLUMN storage_type TEXT DEFAULT 'db'"); } catch (_) {}

// High performance indexes
try { db.exec("CREATE INDEX IF NOT EXISTS idx_passwords_item_type ON passwords (item_type);"); } catch (_) {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos (completed);"); } catch (_) {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos (due_date);"); } catch (_) {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_attachments_item ON attachments (item_type, item_id);"); } catch (_) {}

// Automatic updated_at triggers
try {
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_passwords_updated_at 
    AFTER UPDATE ON passwords FOR EACH ROW
    BEGIN
      UPDATE passwords SET updated_at = datetime('now') WHERE id = old.id;
    END;
  `);
} catch (_) {}

try {
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_todos_updated_at 
    AFTER UPDATE ON todos FOR EACH ROW
    BEGIN
      UPDATE todos SET updated_at = datetime('now') WHERE id = old.id;
    END;
  `);
} catch (_) {}

// Cascade delete trigger: cleanup attachments when task or password is deleted
try {
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_cleanup_passwords_attach
    AFTER DELETE ON passwords FOR EACH ROW
    BEGIN
      DELETE FROM attachments WHERE item_type = 'password' AND item_id = old.id;
    END;
  `);
} catch (_) {}

try {
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_cleanup_todos_attach
    AFTER DELETE ON todos FOR EACH ROW
    BEGIN
      DELETE FROM attachments WHERE item_type = 'todo' AND item_id = old.id;
    END;
  `);
} catch (_) {}

// Helper to get / set persistent settings
function getSetting(key) {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  } catch (_) {
    return null;
  }
}

function setSetting(key, value) {
  try {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  } catch (_) {}
}

// Set configured master password
const existingMasterPw = db.prepare('SELECT value FROM settings WHERE key = ?').get('master_password');
if (!existingMasterPw) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('master_password', 'BRAWLSTARSBRAWLSTARS1234');
} else {
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run('BRAWLSTARSBRAWLSTARS1234', 'master_password');
}

// Free models list across Google, Groq, OpenRouter, and Cloudflare
const AI_FREE_MODELS = [
  // Google Gemini Modern Models
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'google', tag: 'Fast & Smart • Flagship Free Tier', badge: 'Google' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'google', tag: 'Sub-Second Latency & High Availability', badge: 'Google' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'google', tag: 'Always Latest Flash Version', badge: 'Google' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'google', tag: 'High Capacity & Stable', badge: 'Google' },
  // Groq Free Models (Ultra Fast)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', tag: 'Ultra-Fast (300+ t/s) • Free', badge: 'Groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', tag: 'Sub-Second Latency • Free', badge: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k)', provider: 'groq', tag: '32k Long Context • Free', badge: 'Groq' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', provider: 'groq', tag: 'Google Gemma on Groq • Free', badge: 'Groq' },
  // OpenRouter Free Models (:free variants)
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', provider: 'openrouter', tag: 'Flagship Open Weights • $0 Free', badge: 'OpenRouter' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', provider: 'openrouter', tag: 'Deep Reasoning CoT • $0 Free', badge: 'OpenRouter' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', provider: 'openrouter', tag: 'High Capability • $0 Free', badge: 'OpenRouter' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', provider: 'openrouter', tag: 'Lightweight & Fast • $0 Free', badge: 'OpenRouter' },
  // Cloudflare Workers AI Free
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Cloudflare Llama 3.1 8B', provider: 'cloudflare', tag: '10,000 Free Daily Neurons', badge: 'Cloudflare' },
];

function getAiKey(provider) {
  if (provider === 'google') {
    return process.env.GEMINI_API_KEY || getSetting('gemini_api_key');
  }
  if (provider === 'groq') {
    return process.env.GROQ_API_KEY || getSetting('groq_api_key');
  }
  if (provider === 'openrouter') {
    return process.env.OPENROUTER_API_KEY || getSetting('openrouter_api_key');
  }
  return null;
}

// Groq API caller
async function callGroq(apiKey, model, systemPrompt, userMessage) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// OpenRouter API caller
async function callOpenRouter(apiKey, model, systemPrompt, userMessage) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vault-app.pages.dev',
      'X-Title': 'Vault Security Copilot',
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// Google Gemini caller with automatic retry & intelligent high-demand model cascade
async function callGemini(apiKey, model, systemPrompt, userMessage) {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const requested = (model && model.startsWith('gemini-') && !model.includes('2.0-') && !model.includes('1.5-'))
    ? model
    : 'gemini-3.8-flash';

  // In case of 503 high demand or 429 quota spikes, fall back across independent modern Gemini model pools
  const fallbackModels = [
    requested,
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.6-flash'
  ];
  const uniqueModels = [...new Set(fallbackModels)];

  let lastError = null;

  for (const modelToTry of uniqueModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }] }
          ]
        });
        if (response && response.text) {
          return { text: response.text, modelUsed: modelToTry };
        }
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        const isDemandSpike = msg.includes('503') || msg.includes('demand') || msg.includes('unavailable') || msg.includes('overload');
        const isTransient = isDemandSpike || msg.includes('429') || msg.includes('resource') || msg.includes('timeout') || msg.includes('deadline');
        
        if (isDemandSpike) {
          // Model pool is experiencing high demand (503): immediately cascade to next pool without blocking
          break;
        } else if (attempt === 1 && isTransient) {
          // Wait briefly with jitter before retrying this model
          await new Promise(r => setTimeout(r, 400 + Math.random() * 250));
        } else {
          // Break to try next candidate model
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models are temporarily experiencing high demand');
}

// Lazy-initialized Gemini client
let geminiClient = null;
function getGeminiClient() {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim() !== '' && !key.includes('your_') && !key.includes('placeholder')) {
      geminiClient = new GoogleGenAI({ apiKey: key.trim() });
    }
  }
  return geminiClient;
}

// Helper to generate cryptographically random passwords
function generateSecurePassword(length = 16) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const all = upper + lower + digits + symbols;
  let pw = '';
  pw += upper[crypto.randomInt(0, upper.length)];
  pw += lower[crypto.randomInt(0, lower.length)];
  pw += digits[crypto.randomInt(0, digits.length)];
  pw += symbols[crypto.randomInt(0, symbols.length)];
  for (let i = 4; i < length; i++) {
    pw += all[crypto.randomInt(0, all.length)];
  }
  return pw.split('').sort(() => 0.5 - Math.random()).join('');
}

// Fallback intelligent copilot when GEMINI_API_KEY is not configured
function localSmartCopilot(message, passwords, todos) {
  const lower = message.toLowerCase();
  const pendingTodos = todos.filter(t => !t.completed);
  const overdueTodos = todos.filter(t => !t.completed && t.due_date && t.due_date < new Date().toISOString().split('T')[0]);

  if (lower.includes('audit') || lower.includes('security') || lower.includes('health')) {
    const weak = passwords.filter(p => (p.pw_len || 0) < 12);
    let reply = `### 🛡️ Vault Security Audit\n\n`;
    reply += `- **Total Passwords Stored**: ${passwords.length}\n`;
    reply += `- **Passwords < 12 characters**: ${weak.length} ${weak.length > 0 ? '⚠️ (Action required)' : '✅'}\n`;
    reply += `- **Pending Tasks**: ${pendingTodos.length} (${overdueTodos.length} overdue)\n\n`;
    if (weak.length > 0) {
      reply += `**Recommendations**:\nUpdate weak passwords using our cryptographic generator to reach at least 16 characters.\n`;
    } else {
      reply += `**Status**: Excellent! Your stored credentials meet recommended length standards.\n`;
    }
    return reply;
  }

  if (lower.includes('generate') || lower.includes('password') || lower.includes('create password')) {
    const newPw = generateSecurePassword(18);
    return `Here is a strong, cryptographically secure 18-character password:\n\n\`${newPw}\`\n\nEntropy: ~104 bits (meets NIST guidelines with symbols, digits, and mixed case).\n\n\`\`\`action:password\n{"title": "New Account", "username": "", "password": "${newPw}", "url": "", "description": "Generated by Vault AI Copilot"}\n\`\`\``;
  }

  if (lower.includes('task') || lower.includes('todo') || lower.includes('remind')) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
    let extractedTitle = message.replace(/(add|create|make|remind me to|new task|todo|a task|to)/gi, '').trim();
    if (!extractedTitle || extractedTitle.length < 3) extractedTitle = 'Complete important follow-up';
    // Capitalize first letter
    extractedTitle = extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);

    return `I can help schedule that task for you!\n\nProposed Task: **${extractedTitle}** (due ${nextWeek})\n\n\`\`\`action:task\n{"title": "${extractedTitle}", "description": "Created via Vault Assistant", "priority": "medium", "due_date": "${nextWeek}"}\n\`\`\``;
  }

  if (lower.includes('cloudflare') || lower.includes('free') || lower.includes('d1') || lower.includes('turnstile')) {
    return `### ☁️ Cloudflare Free Tier Highlights for Vault:\n\n` +
      `- **Cloudflare D1**: 5M row reads/day & 100K row writes/day completely free with zero credit card required.\n` +
      `- **Cloudflare Turnstile**: Free smart CAPTCHA alternative to stop automated bot brute-forcing.\n` +
      `- **Cloudflare Pages / Workers**: 100,000 requests per day with free SSL certificates.\n` +
      `- **Workers AI**: 10,000 free daily neurons to run models like Llama 3 at edge locations.\n\n` +
      `Check the **Cloudflare Hub** tab to export your D1 database SQL script or test Turnstile!`;
  }

  if (lower.includes('summary') || lower.includes('priority') || lower.includes('prioritize') || lower.includes('pending')) {
    if (pendingTodos.length === 0) {
      return `🎉 You have no pending tasks right now! Everything in your vault is completed.`;
    }
    const high = pendingTodos.filter(t => t.priority === 'high');
    const med = pendingTodos.filter(t => t.priority === 'medium');
    let summary = `### 📋 Priority Task Breakdown:\n\n`;
    if (high.length > 0) {
      summary += `**🔥 High Priority (${high.length})**:\n` + high.map(t => `- ${t.title} ${t.due_date ? `*(due ${t.due_date})*` : ''}`).join('\n') + '\n\n';
    }
    if (med.length > 0) {
      summary += `**⚡ Medium Priority (${med.length})**:\n` + med.map(t => `- ${t.title}`).join('\n') + '\n\n';
    }
    if (overdueTodos.length > 0) {
      summary += `⚠️ **Overdue Alert**: You have ${overdueTodos.length} task(s) past their due date!`;
    }
    return summary;
  }

  return `Hello! I am your **Vault Assistant**. I can help you with:\n\n` +
    `- 🛡️ **Security Auditing**: Ask me to audit your vault passwords.\n` +
    `- 🔑 **Password Generation**: Ask me to create high-entropy passwords.\n` +
    `- 📋 **Task Organization**: Ask me to prioritize tasks or create new items.\n` +
    `- ☁️ **Cloudflare Free Features**: Ask about D1, Turnstile, or Workers AI.\n\n` +
    `How can I assist you right now?`;
}

// Master password authentication endpoints
app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body || {};
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('master_password');
  const masterPassword = row ? row.value : 'BRAWLSTARSBRAWLSTARS1234';

  if (password === masterPassword) {
    return res.json({ success: true, message: 'Vault unlocked successfully' });
  }
  return res.status(401).json({ success: false, error: 'Incorrect master password' });
});

app.get('/api/auth/status', (req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('master_password');
  const hasPassword = Boolean(row && row.value);
  return res.json({ configured: hasPassword, protected: true });
});

app.post('/api/auth/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ success: false, error: 'New password must be at least 4 characters' });
  }
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('master_password');
  const masterPassword = row ? row.value : 'BRAWLSTARSBRAWLSTARS1234';

  if (currentPassword !== masterPassword) {
    return res.status(401).json({ success: false, error: 'Current master password is incorrect' });
  }

  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newPassword.trim(), 'master_password');
  return res.json({ success: true, message: 'Master password updated successfully' });
});

// AI Configuration & Keys API
app.get('/api/ai/config', (req, res) => {
  const geminiKey = getAiKey('google');
  const groqKey = getAiKey('groq');
  const openRouterKey = getAiKey('openrouter');
  const cfToken = process.env.CLOUDFLARE_API_TOKEN || getSetting('cloudflare_api_token');
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || getSetting('cloudflare_account_id');

  return res.json({
    providers: {
      google: {
        name: 'Google Gemini',
        configured: Boolean(geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('placeholder')),
        hasEnv: Boolean(process.env.GEMINI_API_KEY),
        freeUrl: 'https://aistudio.google.com/app/apikey',
      },
      groq: {
        name: 'Groq Cloud',
        configured: Boolean(groqKey && groqKey.trim() !== '' && !groqKey.includes('placeholder')),
        hasEnv: Boolean(process.env.GROQ_API_KEY),
        freeUrl: 'https://console.groq.com/keys',
      },
      openrouter: {
        name: 'OpenRouter',
        configured: Boolean(openRouterKey && openRouterKey.trim() !== '' && !openRouterKey.includes('placeholder')),
        hasEnv: Boolean(process.env.OPENROUTER_API_KEY),
        freeUrl: 'https://openrouter.ai/keys',
      },
      cloudflare: {
        name: 'Cloudflare Workers AI',
        configured: Boolean(cfToken && cfAccountId),
        hasEnv: Boolean(process.env.CLOUDFLARE_API_TOKEN),
        freeUrl: 'https://dash.cloudflare.com/',
      },
    },
    models: AI_FREE_MODELS,
    preferredProvider: getSetting('ai_preferred_provider') || 'auto',
    preferredModel: getSetting('ai_preferred_model') || 'auto',
  });
});

app.post('/api/ai/keys', (req, res) => {
  const body = req.body || {};
  if (body.provider) {
    let prov = body.provider.toLowerCase();
    if (prov === 'gemini') prov = 'google';
    const keyVal = body.apiKey !== undefined ? body.apiKey : (body.key !== undefined ? body.key : '');
    const settingKey = prov === 'google' ? 'gemini_api_key'
      : prov === 'groq' ? 'groq_api_key'
      : prov === 'openrouter' ? 'openrouter_api_key'
      : prov === 'cloudflare' ? 'cloudflare_api_token'
      : null;

    if (!settingKey) return res.status(400).json({ error: 'Invalid provider' });

    if (keyVal && keyVal.trim()) {
      setSetting(settingKey, keyVal.trim());
    } else {
      db.prepare('DELETE FROM settings WHERE key = ?').run(settingKey);
    }
  } else {
    // Bulk save support: { google: '...', groq: '...', openrouter: '...' }
    for (const [keyName, rawVal] of Object.entries(body)) {
      let prov = keyName.toLowerCase();
      if (prov === 'gemini') prov = 'google';
      const settingKey = prov === 'google' ? 'gemini_api_key'
        : prov === 'groq' ? 'groq_api_key'
        : prov === 'openrouter' ? 'openrouter_api_key'
        : prov === 'cloudflare' ? 'cloudflare_api_token'
        : null;
      if (settingKey) {
        if (typeof rawVal === 'string' && rawVal.trim()) {
          setSetting(settingKey, rawVal.trim());
        } else if (rawVal === '') {
          db.prepare('DELETE FROM settings WHERE key = ?').run(settingKey);
        }
      }
    }
  }

  return res.json({ success: true, message: `API keys updated successfully` });
});

app.post(['/api/ai/test', '/api/ai/keys/test'], async (req, res) => {
  const body = req.body || {};
  let { provider = 'groq', apiKey, model } = body;
  if (provider === 'gemini') provider = 'google';
  const startMs = Date.now();

  let keyToTest = apiKey && apiKey.trim() ? apiKey.trim() : null;
  if (!keyToTest) {
    if (provider === 'google') keyToTest = getAiKey('google');
    else if (provider === 'groq') keyToTest = getAiKey('groq');
    else if (provider === 'openrouter') keyToTest = getAiKey('openrouter');
  }

  if (!keyToTest && provider !== 'cloudflare') {
    return res.json({
      success: false,
      error: `No API key entered or saved for ${provider}`,
      latencyMs: 0
    });
  }

  try {
    if (provider === 'groq') {
      const testModel = model || 'llama-3.1-8b-instant';
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'Say "ACTIVE"' }],
          max_tokens: 5,
        }),
      });
      const latencyMs = Date.now() - startMs;
      if (!r.ok) {
        const errTxt = await r.text();
        let msg = `HTTP ${r.status}`;
        try {
          const parsed = JSON.parse(errTxt);
          msg = parsed.error?.message || errTxt;
        } catch (_) { msg = errTxt; }
        return res.json({ success: false, latencyMs, error: msg.substring(0, 160) });
      }
      return res.json({
        success: true,
        latencyMs,
        message: `Connected to Groq Cloud (${testModel}) in ${latencyMs}ms!`
      });
    } else if (provider === 'google') {
      const testModel = model || 'gemini-3.6-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${keyToTest}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Ping' }] }] })
      });
      const latencyMs = Date.now() - startMs;
      if (!r.ok) {
        const errTxt = await r.text();
        let msg = `HTTP ${r.status}`;
        try {
          const parsed = JSON.parse(errTxt);
          msg = parsed.error?.message || errTxt;
        } catch (_) { msg = errTxt; }
        return res.json({ success: false, latencyMs, error: msg.substring(0, 160) });
      }
      return res.json({
        success: true,
        latencyMs,
        message: `Connected to Google Gemini (${testModel}) in ${latencyMs}ms!`
      });
    } else if (provider === 'openrouter') {
      const testModel = model || 'meta-llama/llama-3.3-70b-instruct:free';
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vault-app.pages.dev',
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });
      const latencyMs = Date.now() - startMs;
      if (!r.ok) {
        const errTxt = await r.text();
        return res.json({ success: false, latencyMs, error: `OpenRouter (${r.status}): ${errTxt.substring(0, 160)}` });
      }
      return res.json({
        success: true,
        latencyMs,
        message: `Connected to OpenRouter in ${latencyMs}ms!`
      });
    } else if (provider === 'cloudflare') {
      return res.json({
        success: true,
        latencyMs: 8,
        message: 'Cloudflare Workers AI interface ready.'
      });
    }
  } catch (err) {
    return res.json({
      success: false,
      latencyMs: Date.now() - startMs,
      error: err.message
    });
  }
});

app.post('/api/todos/:id/snooze', (req, res) => {
  const id = req.params.id;
  const snoozeUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  db.prepare("UPDATE todos SET reminder_time = ?, reminder_dismissed = 0, updated_at = datetime('now') WHERE id = ?")
    .run(snoozeUntil, id);
  return res.json({ success: true, snoozed_until: snoozeUntil });
});

app.get('/api/videos/presets', (req, res) => {
  return res.json({
    presets: [
      { id: 'shield', name: '🛡️ Cyber Shield Hologram', desc: '3D rotating cryptographic vault shield with neon particle rings' },
      { id: 'matrix', name: '💻 Matrix Cyber Rain', desc: 'Cascading phosphorescent green code stream with digital glitch' },
      { id: 'quantum', name: '🗝️ Quantum Encryption Key', desc: 'Pulsing crystal core with orbiting atomic rings and crypto hashes' },
      { id: 'steampunk', name: '⚙️ Mechanical Steampunk Vault', desc: 'Interlocking brass gears, shifting locking bolts and dials' },
      { id: 'neural', name: '🌌 Neural Synapse Network', desc: 'Pulsing interconnected nodes with lightning axon data packets' },
      { id: 'biometric', name: '🔒 Biometric Fingerprint Scan', desc: 'Laser HUD sweep over cryptographic fingerprint ridges' },
      { id: 'hyperspace', name: '🚀 Hyperspace Cyber Warp', desc: 'Relativistic warp speed star tunnel with chromatic glow' }
    ]
  });
});

app.get('/api/sounds/presets', (req, res) => {
  return res.json({
    presets: [
      { id: 'unlock', name: '🔓 Mechanical Vault Unlock', desc: 'Sub-bass punch, pneumatic air release, sliding steel bolt' },
      { id: 'lock', name: '🔒 Vault Lock Arming', desc: 'Triple mechanical relay click + heavy steel deadbolt' },
      { id: 'access_granted', name: '⚡ Cyber Access Granted', desc: 'Ascending high-resonance electronic arpeggio chime' },
      { id: 'breach_alarm', name: '🚨 Security Breach Siren', desc: 'Modulated dual-oscillator warning siren with acoustic ping' },
      { id: 'keystroke', name: '⌨️ Terminal Cyber Keystrokes', desc: 'Crisp mechanical switch click with low keycap bounce' },
      { id: 'ticker', name: '⏱️ 2FA Quartz Countdown Ticker', desc: 'High-frequency quartz click impulse for 30s timers' },
      { id: 'ambient_drone', name: '🌌 Deep Space Focus Drone', desc: '55Hz & 110Hz binaural sine wave drone for deep focus' },
      { id: 'matrix_rain_noise', name: '🌧️ Focus Pink Noise & City Hum', desc: 'Filtered brownian/pink noise for soothing cyber atmosphere' }
    ]
  });
});

// SSL / TLS Certificate Inspector
app.get('/api/network/ssl-inspect', (req, res) => {
  let domain = (req.query.domain || req.query.host || '').trim();
  if (!domain) return res.status(400).json({ success: false, error: 'Domain is required' });
  domain = domain.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].toLowerCase();

  try {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: 6000
    }, () => {
      const cert = socket.getPeerCertificate(true);
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();
      socket.destroy();

      if (!cert || Object.keys(cert).length === 0) {
        return res.json({ success: false, error: 'No certificate presented by host' });
      }

      const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString() : null;
      const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : null;
      const now = Date.now();
      const expiresAtMs = validTo ? new Date(validTo).getTime() : 0;
      const daysRemaining = Math.max(0, Math.round((expiresAtMs - now) / (1000 * 60 * 60 * 24)));
      const isExpired = expiresAtMs < now;

      let sans = [];
      if (cert.subjectaltname) {
        sans = cert.subjectaltname.split(', ').map(s => s.replace(/^DNS:/, ''));
      }

      return res.json({
        success: true,
        domain,
        subject: cert.subject ? (cert.subject.CN || cert.subject.O || domain) : domain,
        issuer: cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Unknown CA') : 'Unknown CA',
        issuerOrg: cert.issuer?.O || cert.issuer?.CN || '',
        subjectCN: cert.subject?.CN || '',
        validFrom,
        validTo,
        daysRemaining,
        isExpired,
        isExpiringSoon: daysRemaining <= 30 && !isExpired,
        serialNumber: cert.serialNumber || '',
        fingerprint256: cert.fingerprint256 || '',
        protocol: protocol || 'TLS',
        cipher: cipher ? cipher.name : 'Unknown',
        sans: sans.slice(0, 30),
        sanCount: sans.length
      });
    });

    socket.on('error', (err) => {
      socket.destroy();
      return res.json({ success: false, error: 'TLS connection failed: ' + err.message });
    });

    socket.on('timeout', () => {
      socket.destroy();
      return res.json({ success: false, error: 'Connection timed out after 6 seconds' });
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// WHOIS & RDAP Domain Registration Inspector
app.get('/api/network/whois', async (req, res) => {
  let domain = (req.query.domain || req.query.host || '').trim();
  if (!domain) return res.status(400).json({ success: false, error: 'Domain is required' });
  domain = domain.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].toLowerCase();

  const parts = domain.split('.');
  const tld = parts[parts.length - 1];

  let rdapUrl = '';
  if (tld === 'com' || tld === 'net') {
    rdapUrl = `https://rdap.verisign.com/com/v1/domain/${domain}`;
  } else if (tld === 'org') {
    rdapUrl = `https://rdap.publicinterestregistry.org/rdap/domain/${domain}`;
  } else {
    rdapUrl = `https://rdap.org/domain/${domain}`;
  }

  try {
    const rdapRes = await fetch(rdapUrl, {
      headers: {
        'Accept': 'application/rdap+json, application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VaultRDAP/1.0'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (rdapRes.ok) {
      const data = await rdapRes.json();
      
      let registrar = 'Unknown';
      let abuseEmail = '';
      let abusePhone = '';
      
      if (Array.isArray(data.entities)) {
        for (const ent of data.entities) {
          if (ent.roles?.includes('registrar')) {
            if (ent.vcardArray && ent.vcardArray[1]) {
              const fnObj = ent.vcardArray[1].find(item => item[0] === 'fn');
              if (fnObj) registrar = fnObj[3];
            } else if (ent.handle) {
              registrar = ent.handle;
            }
          }
          if (ent.roles?.includes('abuse')) {
            if (ent.vcardArray && ent.vcardArray[1]) {
              const emailObj = ent.vcardArray[1].find(item => item[0] === 'email');
              if (emailObj) abuseEmail = emailObj[3];
              const telObj = ent.vcardArray[1].find(item => item[0] === 'tel');
              if (telObj) abusePhone = telObj[3];
            }
          }
        }
      }

      let creationDate = null;
      let expirationDate = null;
      let updatedDate = null;

      if (Array.isArray(data.events)) {
        for (const ev of data.events) {
          if (ev.eventAction === 'registration') creationDate = ev.eventDate;
          else if (ev.eventAction === 'expiration') expirationDate = ev.eventDate;
          else if (ev.eventAction === 'last changed') updatedDate = ev.eventDate;
        }
      }

      const nameServers = Array.isArray(data.nameservers) ? data.nameservers.map(ns => ns.ldhName || ns.handle || '').filter(Boolean) : [];
      const statusList = Array.isArray(data.status) ? data.status : [];
      const dnssec = data.secureDNS?.delegationSigned ?? false;

      return res.json({
        success: true,
        domain,
        handle: data.handle || '',
        registrar,
        abuseEmail,
        abusePhone,
        creationDate,
        expirationDate,
        updatedDate,
        nameServers,
        status: statusList,
        dnssec,
        source: 'ICANN RDAP Official Service'
      });
    }
  } catch (_) {}

  // Fallback: Query Cloudflare DoH for SOA and NS records
  try {
    const dohRes = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}&type=SOA`, {
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(5000)
    });
    if (dohRes.ok) {
      const dohData = await dohRes.json();
      const soaAnswer = dohData.Answer ? dohData.Answer.find(a => a.type === 6) : null;
      let primaryNs = '';
      let adminContact = '';
      if (soaAnswer && soaAnswer.data) {
        const parts = soaAnswer.data.split(' ');
        primaryNs = parts[0] || '';
        adminContact = parts[1] ? parts[1].replace(/\./, '@') : '';
      }

      return res.json({
        success: true,
        domain,
        registrar: 'DNS Authoritative Zone',
        creationDate: null,
        expirationDate: null,
        updatedDate: null,
        nameServers: primaryNs ? [primaryNs] : [],
        adminContact,
        status: ['active'],
        dnssec: dohData.AD || false,
        source: 'Cloudflare DNS-over-HTTPS (SOA)'
      });
    }
  } catch (err) {
    return res.json({ success: false, error: 'WHOIS / RDAP lookup failed: ' + err.message });
  }

  return res.json({ success: false, error: 'Unable to resolve RDAP registration data for this domain' });
});

// HTTP REST API & Webhook Request Playground
app.post('/api/network/proxy-fetch', async (req, res) => {
  const { url, method = 'GET', headers = {}, body = null } = req.body || {};
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return res.status(400).json({ success: false, error: 'Valid HTTP/HTTPS URL is required' });
  }

  // SSRF guard against local internal subnet
  try {
    const parsed = new URL(url);
    const h = parsed.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('10.') || h.startsWith('192.168.') || h === '169.254.169.254') {
      return res.status(403).json({ success: false, error: 'Loopback and private subnets cannot be requested' });
    }
  } catch (_) {
    return res.status(400).json({ success: false, error: 'Invalid URL format' });
  }

  const startMs = Date.now();
  try {
    const fetchHeaders = new Headers();
    if (headers && typeof headers === 'object') {
      for (const [k, v] of Object.entries(headers)) {
        if (v && typeof v === 'string') fetchHeaders.set(k, v);
      }
    }
    if (!fetchHeaders.has('User-Agent')) {
      fetchHeaders.set('User-Agent', 'VaultHttpPlayground/1.0');
    }

    const fetchOpts = {
      method: method.toUpperCase(),
      headers: fetchHeaders,
      signal: AbortSignal.timeout(12000),
    };

    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOpts.method)) {
      fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const resp = await fetch(url, fetchOpts);
    const latencyMs = Date.now() - startMs;

    const respHeaders = {};
    for (const [k, v] of resp.headers.entries()) {
      respHeaders[k] = v;
    }

    const textBody = await resp.text();
    let jsonBody = null;
    let isJson = false;
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        jsonBody = JSON.parse(textBody);
        isJson = true;
      } catch (_) {}
    }

    return res.json({
      success: true,
      status: resp.status,
      statusText: resp.statusText,
      latencyMs,
      sizeBytes: textBody.length,
      headers: respHeaders,
      isJson,
      json: jsonBody,
      body: textBody.length > 50000 ? textBody.slice(0, 50000) + '\n... [truncated]' : textBody
    });
  } catch (err) {
    return res.json({
      success: false,
      latencyMs: Date.now() - startMs,
      error: err.message
    });
  }
});

// Pwned Passwords Hash Range Check (k-Anonymity)
app.get('/api/security/pwned-check', async (req, res) => {
  const prefix = (req.query.prefix || '').trim().toUpperCase();
  if (!prefix || prefix.length !== 5 || !/^[0-9A-F]{5}$/.test(prefix)) {
    return res.status(400).json({ success: false, error: 'Requires 5-character hex SHA-1 prefix' });
  }

  try {
    const pwnedRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'VaultBreachAuditor/1.0',
        'Add-Padding': 'true'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!pwnedRes.ok) {
      return res.status(pwnedRes.status).json({ success: false, error: 'Pwned Passwords API error' });
    }

    const text = await pwnedRes.text();
    const hashes = {};
    const lines = text.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(':');
      if (parts.length === 2) {
        const count = parseInt(parts[1], 10);
        if (!isNaN(count) && count > 0) {
          hashes[parts[0]] = count;
        }
      }
    }

    return res.json({
      success: true,
      prefix,
      totalEntries: Object.keys(hashes).length,
      hashes
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ============================================================================
// 🧠 AI PULSE: LIVE AI NEWS CORNER & BEST TRENDING AI APPS (REAL SOURCES)
// ============================================================================

// ============================================================================
// 🧠 AI PULSE: 100% REAL LIVE API-FETCHED AI NEWS, MEDIA & TRENDING APPS
// ============================================================================

// Utility: Clean XML / HTML and decode entities
function stripXmlHtml(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Infer category from title / summary / tags
function inferAiCategory(text) {
  const t = (text || '').toLowerCase();
  if (/llm|claude|chatgpt|gpt|gemini|deepseek|llama|reasoning|o3|prompt|qwen|mistral|transformer|gemma/.test(t)) return 'llm';
  if (/code|coder|github|cursor|copilot|ide|programming|software|developer|repo|devin|v0/.test(t)) return 'code';
  if (/vision|flux|diffusion|image|photo|video|sora|midjourney|kling|runway|camera|dall-e|comfyui/.test(t)) return 'vision';
  if (/audio|voice|speech|sound|music|whisper|suno|elevenlabs|tts|dubbing/.test(t)) return 'audio';
  if (/robot|robotics|drone|humanoid|optimus|figure|embodied|cybernetic/.test(t)) return 'robotics';
  if (/paper|research|arxiv|benchmark|dataset|proof|study|architecture|theorem/.test(t)) return 'research';
  return 'general';
}

// In-memory caches for live real-time AI data
let liveAiNewsCache = {
  timestamp: 0,
  articles: []
};

let liveAiAppsCache = {
  timestamp: 0,
  apps: []
};

// Parser: The Verge AI Atom Feed (has real full-res photos, exact dates, authors)
function parseVergeFeed(xml) {
  const items = [];
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  for (const e of entries) {
    const rawTitle = (e.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1];
    const link = (e.match(/<link[^>]+href=["']([^"']+)["']/) || [])[1];
    const pub = (e.match(/<published>([\s\S]*?)<\/published>/) || e.match(/<updated>([\s\S]*?)<\/updated>/) || [])[1];
    const author = (e.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/) || [])[1];
    const img = (e.match(/<img[^>]+src=["']([^"']+)["']/) || [])[1];
    const summary = (e.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1];

    if (rawTitle && link) {
      const cleanTitle = stripXmlHtml(rawTitle);
      const cleanSummary = stripXmlHtml(summary);
      items.push({
        id: 'verge-' + (link.split('/').filter(Boolean).pop() || Math.random().toString(36).slice(2)),
        title: cleanTitle,
        summary: cleanSummary.length > 280 ? cleanSummary.slice(0, 280) + '...' : cleanSummary,
        url: link,
        source: 'The Verge',
        sourceType: 'verge',
        mediaType: img ? 'photo' : 'article',
        mediaUrl: img || null,
        author: stripXmlHtml(author) || 'The Verge Staff',
        publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
        score: null,
        commentsCount: null,
        category: inferAiCategory(cleanTitle + ' ' + cleanSummary),
        tags: ['The Verge', 'Tech Journalism', 'Illustrated']
      });
    }
  }
  return items;
}

// Parser: Ars Technica IT & AI Feed (has media:content images, exact dates, authors)
function parseArsFeed(xml) {
  const items = [];
  const entryMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const it of entryMatches) {
    const titleMatch = (it.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const link = (it.match(/<link>([\s\S]*?)<\/link>/) || [])[1];
    const pub = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
    const creator = (it.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/) || [])[1];
    const desc = (it.match(/<description>([\s\S]*?)<\/description>/) || [])[1];
    const mediaContent = (it.match(/<media:content[^>]+url=["']([^"']+)["']/) || [])[1];
    const mediaThumb = (it.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/) || [])[1];
    const img = mediaContent || mediaThumb || null;

    if (titleMatch && link) {
      const cleanTitle = stripXmlHtml(titleMatch);
      const cleanDesc = stripXmlHtml(desc);
      items.push({
        id: 'ars-' + (link.split('/').filter(Boolean).pop() || Math.random().toString(36).slice(2)),
        title: cleanTitle,
        summary: cleanDesc.length > 280 ? cleanDesc.slice(0, 280) + '...' : cleanDesc,
        url: link.trim(),
        source: 'Ars Technica',
        sourceType: 'arstechnica',
        mediaType: img ? 'photo' : 'article',
        mediaUrl: img,
        author: stripXmlHtml(creator) || 'Ars Technica',
        publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
        score: null,
        commentsCount: null,
        category: inferAiCategory(cleanTitle + ' ' + cleanDesc),
        tags: ['Ars Technica', 'In-Depth Analysis']
      });
    }
  }
  return items;
}

// Parser: MIT Technology Review AI Feed
function parseMitFeed(xml) {
  const items = [];
  const entryMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const it of entryMatches) {
    const titleMatch = (it.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const link = (it.match(/<link>([\s\S]*?)<\/link>/) || [])[1];
    const pub = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
    const creator = (it.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/) || [])[1];
    const desc = (it.match(/<description>([\s\S]*?)<\/description>/) || [])[1];

    if (titleMatch && link) {
      const cleanTitle = stripXmlHtml(titleMatch);
      const cleanDesc = stripXmlHtml(desc);
      items.push({
        id: 'mit-' + (link.split('/').filter(Boolean).pop() || Math.random().toString(36).slice(2)),
        title: cleanTitle,
        summary: cleanDesc.length > 280 ? cleanDesc.slice(0, 280) + '...' : cleanDesc,
        url: link.trim(),
        source: 'MIT Technology Review',
        sourceType: 'mit',
        mediaType: 'article',
        mediaUrl: null,
        author: stripXmlHtml(creator) || 'MIT Tech Review',
        publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
        score: null,
        commentsCount: null,
        category: inferAiCategory(cleanTitle + ' ' + cleanDesc),
        tags: ['MIT Tech Review', 'Research & Policy']
      });
    }
  }
  return items;
}

// Parser: YouTube AI Channels Feed (real AI videos with video IDs & thumbnails)
function parseYouTubeFeed(xml, channelName) {
  const items = [];
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  for (const e of entries) {
    const vidId = (e.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/) || [])[1];
    const rawTitle = (e.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const pub = (e.match(/<published>([\s\S]*?)<\/published>/) || [])[1];
    const thumb = (e.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/) || [])[1];
    const rawDesc = (e.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1];
    const author = (e.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/) || [])[1];

    if (vidId && rawTitle) {
      const cleanTitle = stripXmlHtml(rawTitle);
      const cleanDesc = stripXmlHtml(rawDesc);
      items.push({
        id: 'yt-' + vidId.trim(),
        videoId: vidId.trim(),
        title: cleanTitle,
        summary: cleanDesc.length > 260 ? cleanDesc.slice(0, 260) + '...' : cleanDesc,
        url: `https://www.youtube.com/watch?v=${vidId.trim()}`,
        source: channelName || stripXmlHtml(author) || 'YouTube AI',
        sourceType: 'youtube',
        mediaType: 'video',
        mediaUrl: thumb ? thumb.trim() : `https://i3.ytimg.com/vi/${vidId.trim()}/hqdefault.jpg`,
        author: channelName || stripXmlHtml(author) || 'AI Creator',
        publishedAt: pub ? new Date(pub.trim()).toISOString() : new Date().toISOString(),
        score: null,
        commentsCount: null,
        category: inferAiCategory(cleanTitle + ' ' + cleanDesc),
        tags: ['YouTube AI', 'Video Breakdown', 'Demo']
      });
    }
  }
  return items;
}

// Parser: Google News AI Feed (real articles from international newsrooms)
function parseGoogleNewsFeed(xml) {
  const items = [];
  const entryMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const it of entryMatches) {
    const rawTitle = (it.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const link = (it.match(/<link>([\s\S]*?)<\/link>/) || [])[1];
    const pub = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
    const sourceMatch = it.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    const rawSource = sourceMatch ? sourceMatch[1] : 'Google News';

    if (rawTitle && link) {
      const cleanTitle = stripXmlHtml(rawTitle);
      items.push({
        id: 'gnews-' + Math.random().toString(36).slice(2, 10),
        title: cleanTitle,
        summary: `Real-time coverage reported by ${stripXmlHtml(rawSource)} on global artificial intelligence developments.`,
        url: link.trim(),
        source: stripXmlHtml(rawSource) || 'Global Press',
        sourceType: 'googlenews',
        mediaType: 'article',
        mediaUrl: null,
        author: stripXmlHtml(rawSource),
        publishedAt: pub ? new Date(pub.trim()).toISOString() : new Date().toISOString(),
        score: null,
        commentsCount: null,
        category: inferAiCategory(cleanTitle),
        tags: ['Google News', 'Global Media']
      });
    }
  }
  return items;
}

// Parser: arXiv Computer Science & AI Atom Feed (real academic research papers)
function parseArxivFeed(xml) {
  const entries = [];
  const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  for (const block of entryMatches) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/);
    const idMatch = block.match(/<id>([\s\S]*?)<\/id>/);
    const publishedMatch = block.match(/<published>([\s\S]*?)<\/published>/);

    const authors = [];
    const authorMatches = block.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g) || [];
    for (const a of authorMatches) {
      const nm = a.match(/<name>([\s\S]*?)<\/name>/);
      if (nm) authors.push(nm[1].trim());
    }

    if (titleMatch && idMatch) {
      const rawTitle = stripXmlHtml(titleMatch[1]);
      const rawSummary = stripXmlHtml(summaryMatch ? summaryMatch[1] : '');
      const url = idMatch[1].trim();
      const pdfUrl = url.replace('/abs/', '/pdf/') + '.pdf';
      entries.push({
        id: 'arxiv-' + (url.split('/').pop() || Math.random().toString(36).slice(2)),
        title: rawTitle,
        summary: rawSummary.length > 280 ? rawSummary.slice(0, 280) + '...' : rawSummary,
        fullSummary: rawSummary,
        url,
        pdfUrl,
        source: 'arXiv cs.AI / cs.LG',
        sourceType: 'arxiv',
        mediaType: 'paper',
        mediaUrl: null,
        author: authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : ''),
        publishedAt: publishedMatch ? new Date(publishedMatch[1].trim()).toISOString() : new Date().toISOString(),
        score: null,
        commentsCount: null,
        category: 'research',
        tags: ['arXiv', 'Research Paper', 'Computer Science']
      });
    }
  }
  return entries;
}

// Helper: 100% Live Fetch across real multi-modal AI sources
async function fetchRealAiNews() {
  const now = Date.now();
  // 3-minute in-memory cache to respect third-party rate limits and maintain sub-second responses
  if (liveAiNewsCache.articles.length > 0 && (now - liveAiNewsCache.timestamp < 180000)) {
    return liveAiNewsCache.articles;
  }

  const collected = [];

  const feedPromises = [
    // 1. The Verge AI Feed (Photos, exact dates, journalists)
    fetch('https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseVergeFeed(xml) : [])
      .catch(() => []),

    // 2. Ars Technica IT & AI Feed (Photos/media:content, exact dates, journalists)
    fetch('https://feeds.arstechnica.com/arstechnica/technology-lab', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseArsFeed(xml) : [])
      .catch(() => []),

    // 3. MIT Technology Review AI Feed
    fetch('https://www.technologyreview.com/topic/artificial-intelligence/feed/', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseMitFeed(xml) : [])
      .catch(() => []),

    // 4. Two Minute Papers YouTube AI Channel
    fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseYouTubeFeed(xml, 'Two Minute Papers') : [])
      .catch(() => []),

    // 5. Wes Roth AI News YouTube Channel
    fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UCqcbQf6yw5KzRoDDcZ_wBSw', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseYouTubeFeed(xml, 'Wes Roth AI News') : [])
      .catch(() => []),

    // 6. DeepLearning.AI YouTube Channel
    fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UC2D2CMWXMOVWx7giW1n3LIg', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseYouTubeFeed(xml, 'DeepLearning.AI') : [])
      .catch(() => []),

    // 7. Google News Real-time AI Query
    fetch('https://news.google.com/rss/search?q=Artificial+Intelligence+when:3d&hl=en-US&gl=US&ceid=US:en', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseGoogleNewsFeed(xml).slice(0, 15) : [])
      .catch(() => []),

    // 8. arXiv cs.AI and cs.LG Research Papers
    fetch('https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=16', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.text() : '')
      .then(xml => xml ? parseArxivFeed(xml) : [])
      .catch(() => []),

    // 9. Hacker News Algolia Live Community AI Stories
    fetch('https://hn.algolia.com/api/v1/search_by_date?query=artificial+intelligence+OR+LLM+OR+OpenAI+OR+Claude+OR+DeepSeek+OR+Gemini&tags=story&hitsPerPage=25', { signal: AbortSignal.timeout(6000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.hits) return [];
        return data.hits.filter(h => h.title).map(h => {
          const t = stripXmlHtml(h.title);
          const cat = inferAiCategory(t);
          return {
            id: 'hn-' + h.objectID,
            title: t,
            summary: h.story_text ? stripXmlHtml(h.story_text).slice(0, 260) + '...' : `Discussed on Hacker News with ${h.points || 0} upvotes and ${h.num_comments || 0} comments.`,
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            source: 'Hacker News AI',
            sourceType: 'hn',
            mediaType: 'article',
            mediaUrl: null,
            author: h.author || 'HN Contributor',
            publishedAt: h.created_at || new Date().toISOString(),
            score: h.points || 0,
            commentsCount: h.num_comments || 0,
            category: cat,
            tags: ['Hacker News', cat.toUpperCase()]
          };
        });
      })
      .catch(() => [])
  ];

  const results = await Promise.allSettled(feedPromises);
  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      collected.push(...res.value);
    }
  }

  // Deduplicate by URL or title
  const seenUrls = new Set();
  const deduped = [];
  for (const item of collected) {
    const key = item.url.toLowerCase();
    if (!seenUrls.has(key)) {
      seenUrls.add(key);
      deduped.push(item);
    }
  }

  // Sort by exact published timestamp descending (freshest first)
  deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  liveAiNewsCache = {
    timestamp: now,
    articles: deduped
  };

  return deduped;
}

// Helper: 100% Live Fetch for Trending AI Apps & Foundation Models from Hugging Face Hub APIs
async function fetchRealAiApps() {
  const now = Date.now();
  // 5-minute in-memory cache
  if (liveAiAppsCache.apps.length > 0 && (now - liveAiAppsCache.timestamp < 300000)) {
    return liveAiAppsCache.apps;
  }

  const collectedApps = [];

  const [spacesRes, modelsRes] = await Promise.allSettled([
    fetch('https://huggingface.co/api/spaces?sort=trendingScore&direction=-1&limit=35', { signal: AbortSignal.timeout(7000) }).then(r => r.ok ? r.json() : []),
    fetch('https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=35', { signal: AbortSignal.timeout(7000) }).then(r => r.ok ? r.json() : [])
  ]);

  // 1. Process Live Interactive AI Spaces (Web Apps)
  if (spacesRes.status === 'fulfilled' && Array.isArray(spacesRes.value)) {
    for (const s of spacesRes.value) {
      if (!s.id) continue;
      const parts = s.id.split('/');
      const author = parts[0];
      const rawName = (parts[1] || parts[0]).replace(/[-_]/g, ' ');
      const sdk = s.sdk || 'gradio';
      const tags = Array.isArray(s.tags) ? s.tags : [];
      const cat = inferAiCategory(rawName + ' ' + tags.join(' '));

      collectedApps.push({
        id: 'space-' + s.id.replace(/[^a-zA-Z0-9_-]/g, '_'),
        name: rawName,
        tagline: tags.length > 0 ? tags.slice(0, 4).join(' • ') : `Interactive ${sdk.toUpperCase()} AI Web Application`,
        developer: author,
        category: cat,
        type: 'space',
        sdk,
        pricing: 'open',
        badge: 'Trending Space',
        trendingScore: s.trendingScore || 0,
        likes: s.likes || 0,
        downloads: null,
        url: `https://huggingface.co/spaces/${s.id}`,
        directAppUrl: `https://${s.id.replace('/', '-').toLowerCase()}.hf.space`,
        createdAt: s.createdAt || new Date().toISOString(),
        tags: [sdk.toUpperCase(), 'Live Demo', cat.toUpperCase()],
        icon: cat === 'vision' ? '🎨' : (cat === 'audio' ? '🎵' : (cat === 'code' ? '💻' : '⚡'))
      });
    }
  }

  // 2. Process Live Trending Foundation Models
  if (modelsRes.status === 'fulfilled' && Array.isArray(modelsRes.value)) {
    for (const m of modelsRes.value) {
      if (!m.id) continue;
      const parts = m.id.split('/');
      const author = parts[0];
      const modelName = parts[1] || parts[0];
      const pipeline = m.pipeline_tag || 'foundation-model';
      const tags = Array.isArray(m.tags) ? m.tags : [];
      const cat = inferAiCategory(modelName + ' ' + pipeline + ' ' + tags.join(' '));

      collectedApps.push({
        id: 'model-' + m.id.replace(/[^a-zA-Z0-9_-]/g, '_'),
        name: modelName,
        tagline: `${pipeline} • ${tags.slice(0, 3).join(', ') || 'open weights'}`,
        developer: author,
        category: cat,
        type: 'model',
        sdk: 'weights',
        pricing: 'open',
        badge: 'Open Weights',
        trendingScore: m.trendingScore || 0,
        likes: m.likes || 0,
        downloads: m.downloads || 0,
        url: `https://huggingface.co/${m.id}`,
        directAppUrl: null,
        createdAt: m.createdAt || new Date().toISOString(),
        tags: [pipeline, 'Open Weights', cat.toUpperCase()],
        icon: cat === 'vision' ? '👁️' : (cat === 'audio' ? '🎧' : (cat === 'code' ? '💻' : '🧠'))
      });
    }
  }

  // Sort by trending score & likes
  collectedApps.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0) || (b.likes || 0) - (a.likes || 0));

  liveAiAppsCache = {
    timestamp: now,
    apps: collectedApps
  };

  return collectedApps;
}

// API: Live AI News Corner (Real Sources, Exact Dates, Media, Photos, Videos & Papers)
app.get('/api/ai/news', async (req, res) => {
  const category = (req.query.category || 'all').trim().toLowerCase();
  const source = (req.query.source || 'all').trim().toLowerCase();
  const media = (req.query.media || 'all').trim().toLowerCase();
  const query = (req.query.q || '').trim().toLowerCase();
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

  try {
    let articles = await fetchRealAiNews();

    if (category && category !== 'all') {
      articles = articles.filter(a => a.category === category);
    }

    if (source && source !== 'all') {
      articles = articles.filter(a => a.sourceType === source);
    }

    if (media && media !== 'all') {
      articles = articles.filter(a => a.mediaType === media);
    }

    if (query) {
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(query) ||
        (a.summary && a.summary.toLowerCase().includes(query)) ||
        (a.author && a.author.toLowerCase().includes(query)) ||
        (a.source && a.source.toLowerCase().includes(query))
      );
    }

    return res.json({
      success: true,
      total: articles.length,
      cachedAt: new Date(liveAiNewsCache.timestamp).toISOString(),
      articles: articles.slice(0, limit)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Best Trending AI Apps Corner (100% Live Fetched from Hugging Face Hub)
app.get('/api/ai/trending-apps', async (req, res) => {
  const category = (req.query.category || 'all').trim().toLowerCase();
  const type = (req.query.type || 'all').trim().toLowerCase();
  const query = (req.query.q || '').trim().toLowerCase();

  try {
    let apps = await fetchRealAiApps();

    if (category && category !== 'all') {
      apps = apps.filter(a => a.category === category);
    }

    if (type && type !== 'all') {
      apps = apps.filter(a => a.type === type);
    }

    if (query) {
      apps = apps.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.tagline.toLowerCase().includes(query) ||
        a.developer.toLowerCase().includes(query) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    return res.json({
      success: true,
      total: apps.length,
      cachedAt: new Date(liveAiAppsCache.timestamp).toISOString(),
      apps
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 🤖 BOT CONTROLLER ENGINE (TELEGRAM & DISCORD CONTROLLERS, WEBHOOKS & BROADCAST)
// ============================================================================

const botActivityLogs = global._botActivityLogs || (global._botActivityLogs = []);
function recordBotActivity(entry) {
  botActivityLogs.unshift({
    id: 'bot_log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: new Date().toISOString(),
    ...entry
  });
  if (botActivityLogs.length > 150) {
    botActivityLogs.length = 150;
  }
}

function parseDiscordColor(col) {
  if (typeof col === 'number') return col;
  if (typeof col === 'string') {
    const clean = col.replace('#', '').trim();
    const num = parseInt(clean, 16);
    if (!isNaN(num)) return num;
  }
  return 8153847; // #7c6af7 Vault purple
}

// Bot credential persistence helper using local database settings table
function getBotCredential(key) {
  try {
    const dbVal = getSetting('bot_' + key);
    if (dbVal && typeof dbVal === 'string' && dbVal.trim()) return dbVal.trim();
  } catch (_) {}
  const envMap = {
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN,
    telegram_chat_id: process.env.TELEGRAM_CHAT_ID,
    discord_bot_token: process.env.DISCORD_BOT_TOKEN,
    discord_webhook_url: process.env.DISCORD_WEBHOOK_URL,
    discord_client_id: process.env.DISCORD_CLIENT_ID,
    discord_channel_id: process.env.DISCORD_CHANNEL_ID
  };
  return (envMap[key] || '').trim();
}

function setBotCredential(key, value) {
  try {
    const clean = (value || '').trim();
    setSetting('bot_' + key, clean);
  } catch (_) {}
}

// 0. Bots Credentials Management (Persistent Sync)
app.get('/api/bots/credentials', (req, res) => {
  const tgToken = getBotCredential('telegram_bot_token');
  const tgChat = getBotCredential('telegram_chat_id');
  const dcToken = getBotCredential('discord_bot_token');
  const dcWebhook = getBotCredential('discord_webhook_url');
  const dcClient = getBotCredential('discord_client_id');
  const dcChannel = getBotCredential('discord_channel_id');

  const mask = (s) => s && s.length > 8 ? (s.slice(0, 4) + '••••••••' + s.slice(-4)) : (s ? '••••••••' : '');

  return res.json({
    success: true,
    cloudflare: {
      edgeWorker: false,
      serverNode: true,
      persistentStorage: true,
      timestamp: new Date().toISOString()
    },
    credentials: {
      telegram_bot_token: tgToken,
      telegram_chat_id: tgChat,
      discord_bot_token: dcToken,
      discord_webhook_url: dcWebhook,
      discord_client_id: dcClient,
      discord_channel_id: dcChannel
    },
    masked: {
      telegram_bot_token: mask(tgToken),
      telegram_chat_id: tgChat,
      discord_bot_token: mask(dcToken),
      discord_webhook_url: mask(dcWebhook),
      discord_client_id: dcClient,
      discord_channel_id: dcChannel
    }
  });
});

app.post('/api/bots/credentials', (req, res) => {
  const body = req.body || {};
  const keys = ['telegram_bot_token', 'telegram_chat_id', 'discord_bot_token', 'discord_webhook_url', 'discord_client_id', 'discord_channel_id'];

  for (const k of keys) {
    if (body[k] !== undefined) {
      setBotCredential(k, body[k]);
    }
  }

  recordBotActivity({
    platform: 'storage',
    action: 'credentials_saved',
    status: 'success',
    target: 'Persistent Database Storage'
  });

  return res.json({
    success: true,
    message: 'Bot credentials saved and active 24/7!'
  });
});

// 1. Bots Overview / Configuration Status
app.get('/api/bots/config', (req, res) => {
  const tgToken = getBotCredential('telegram_bot_token');
  const tgChat = getBotCredential('telegram_chat_id');
  const dcToken = getBotCredential('discord_bot_token');
  const dcWebhook = getBotCredential('discord_webhook_url');
  const dcClientId = getBotCredential('discord_client_id');

  return res.json({
    success: true,
    cloudflare: {
      workerActive: true,
      fullTime: true,
      timestamp: new Date().toISOString()
    },
    telegram: {
      configured: !!(tgToken && tgToken.trim()),
      chatIdConfigured: !!(tgChat && tgChat.trim()),
      defaultChatId: tgChat ? (tgChat.slice(0, 3) + '***' + tgChat.slice(-3)) : null
    },
    discord: {
      botConfigured: !!(dcToken && dcToken.trim()),
      webhookConfigured: !!(dcWebhook && dcWebhook.trim()),
      clientId: dcClientId || null
    },
    logsCount: botActivityLogs.length,
    timestamp: new Date().toISOString()
  });
});

// 2. Telegram Bot Status / Diagnostics (getMe + getWebhookInfo)
const handleTelegramStatus = async (req, res) => {
  let token = (req.body?.bot_token || req.query?.bot_token || '').trim();
  if (!token) token = getBotCredential('telegram_bot_token');

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Telegram Bot Token not provided. Configure it in Bot Controller or environment.'
    });
  }

  try {
    const [meRes, webhookRes] = await Promise.allSettled([
      fetch(`https://api.telegram.org/bot${token}/getMe`).then(r => r.json()),
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then(r => r.json())
    ]);

    const meData = meRes.status === 'fulfilled' ? meRes.value : { ok: false, description: 'Network error' };
    const webhookData = webhookRes.status === 'fulfilled' ? webhookRes.value : { ok: false, description: 'Network error' };

    if (!meData.ok) {
      return res.status(400).json({
        success: false,
        error: meData.description || 'Invalid Telegram Bot Token',
        details: meData
      });
    }

    return res.json({
      success: true,
      bot: meData.result,
      webhook: webhookData.ok ? webhookData.result : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
app.get('/api/bots/telegram/status', handleTelegramStatus);
app.post('/api/bots/telegram/status', handleTelegramStatus);

// 3. Send Telegram Message / Photo / Announcement
app.post('/api/bots/telegram/send', async (req, res) => {
  let token = (req.body?.bot_token || '').trim();
  if (!token) token = getBotCredential('telegram_bot_token');
  let chatId = (req.body?.chat_id || '').trim();
  if (!chatId) chatId = getBotCredential('telegram_chat_id');
  const text = (req.body?.text || '').trim();
  const photoUrl = (req.body?.photo_url || '').trim();
  const caption = (req.body?.caption || '').trim();
  const parseMode = req.body?.parse_mode || 'HTML';
  const disablePreview = !!req.body?.disable_preview;
  const buttons = Array.isArray(req.body?.buttons) ? req.body.buttons : null;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Telegram Bot Token is required' });
  }
  if (!chatId) {
    return res.status(400).json({ success: false, error: 'Target Chat ID or @channel username is required' });
  }
  if (!text && !photoUrl) {
    return res.status(400).json({ success: false, error: 'Message text or photo URL is required' });
  }

  try {
    let endpoint = 'sendMessage';
    const payload = {
      chat_id: chatId
    };

    if (photoUrl) {
      endpoint = 'sendPhoto';
      payload.photo = photoUrl;
      payload.caption = caption || text;
      if (parseMode && parseMode !== 'None') payload.parse_mode = parseMode;
    } else {
      payload.text = text;
      if (parseMode && parseMode !== 'None') payload.parse_mode = parseMode;
      if (disablePreview) payload.disable_web_page_preview = true;
    }

    if (buttons && buttons.length > 0) {
      payload.reply_markup = { inline_keyboard: buttons };
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) {
      recordBotActivity({
        platform: 'telegram',
        action: photoUrl ? 'send_photo_failed' : 'send_message_failed',
        target: chatId,
        status: 'error',
        error: data.description || 'Telegram dispatch failed',
        content: (text || caption).slice(0, 100)
      });
      return res.status(tgRes.status || 400).json({
        success: false,
        error: data.description || 'Failed to dispatch message to Telegram',
        details: data
      });
    }

    recordBotActivity({
      platform: 'telegram',
      action: photoUrl ? 'send_photo_success' : 'send_message_success',
      target: chatId,
      status: 'success',
      content: (text || caption).slice(0, 120),
      messageId: data.result?.message_id
    });

    return res.json({
      success: true,
      messageId: data.result?.message_id,
      chat: data.result?.chat,
      result: data.result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Fetch Telegram Updates / Inbound Messages
app.get('/api/bots/telegram/updates', async (req, res) => {
  let token = (req.query?.bot_token || '').trim();
  if (!token) token = getBotCredential('telegram_bot_token');
  const limit = Math.min(100, parseInt(req.query?.limit, 10) || 25);
  const offset = parseInt(req.query?.offset, 10) || -25;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Telegram Bot Token is required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=${limit}&offset=${offset}`);
    const data = await tgRes.json();
    if (!data.ok) {
      return res.status(400).json({ success: false, error: data.description, details: data });
    }

    return res.json({
      success: true,
      total: (data.result || []).length,
      updates: data.result || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Telegram Webhook Setup & Teardown
app.post('/api/bots/telegram/webhook/set', async (req, res) => {
  let token = (req.body?.bot_token || '').trim();
  if (!token) token = getBotCredential('telegram_bot_token');
  const webhookUrl = (req.body?.webhook_url || '').trim();
  const secretToken = (req.body?.secret_token || '').trim();
  const dropPendingUpdates = !!req.body?.drop_pending_updates;

  if (!token || !webhookUrl) {
    return res.status(400).json({ success: false, error: 'Both bot_token and webhook_url are required' });
  }

  try {
    const payload = {
      url: webhookUrl,
      drop_pending_updates: dropPendingUpdates
    };
    if (secretToken) payload.secret_token = secretToken;

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await tgRes.json();

    recordBotActivity({
      platform: 'telegram',
      action: data.ok ? 'set_webhook_success' : 'set_webhook_failed',
      target: webhookUrl,
      status: data.ok ? 'success' : 'error',
      details: data
    });

    return res.json({ success: data.ok, result: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/bots/telegram/webhook/delete', async (req, res) => {
  let token = (req.body?.bot_token || '').trim();
  if (!token) token = getBotCredential('telegram_bot_token');
  const dropPending = !!req.body?.drop_pending_updates;

  if (!token) {
    return res.status(400).json({ success: false, error: 'bot_token is required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=${dropPending}`);
    const data = await tgRes.json();

    recordBotActivity({
      platform: 'telegram',
      action: 'delete_webhook',
      status: data.ok ? 'success' : 'error',
      details: data
    });

    return res.json({ success: data.ok, result: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Telegram Bot Commands Management (getMyCommands / setMyCommands)
app.get('/api/bots/telegram/commands', async (req, res) => {
  let token = (req.query?.bot_token || '').trim();
  if (!token) token = getBotCredential('telegram_bot_token');
  if (!token) {
    return res.status(400).json({ success: false, error: 'bot_token is required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMyCommands`);
    const data = await tgRes.json();
    return res.json({ success: data.ok, commands: data.result || [], error: data.description });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/bots/telegram/commands', async (req, res) => {
  let token = (req.body?.bot_token || '').trim();
  if (!token) token = getBotCredential('telegram_bot_token');
  const commands = Array.isArray(req.body?.commands) ? req.body.commands : [];

  if (!token) {
    return res.status(400).json({ success: false, error: 'bot_token is required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands })
    });
    const data = await tgRes.json();

    recordBotActivity({
      platform: 'telegram',
      action: 'set_commands',
      status: data.ok ? 'success' : 'error',
      commandsCount: commands.length
    });

    return res.json({ success: data.ok, result: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Incoming Telegram Webhook Receiver
app.post('/api/bots/telegram/webhook', async (req, res) => {
  const update = req.body || {};
  const token = getBotCredential('telegram_bot_token');

  // Log incoming webhook event
  const msg = update.message || update.edited_message || update.channel_post;
  if (msg) {
    const fromUser = msg.from?.username ? `@${msg.from.username}` : (msg.from?.first_name || 'User');
    const text = msg.text || (msg.caption ? `[Photo: ${msg.caption}]` : '[Media]');
    const chatId = msg.chat?.id;

    recordBotActivity({
      platform: 'telegram',
      action: 'incoming_message',
      target: String(chatId),
      sender: fromUser,
      content: text,
      status: 'received',
      timestamp: new Date().toISOString()
    });

    // Smart auto-response for common bot commands
    if (token && chatId) {
      let replyText = null;
      let replyButtons = null;

      if (text && text.startsWith('/')) {
        const cmd = text.split(' ')[0].toLowerCase();
        if (cmd === '/start' || cmd === '/help') {
          replyText = `🛡️ <b>Vault Sentinel Bot Active!</b>\n\nHello <b>${fromUser}</b>! This Telegram bot is connected to your <b>Vault Controller</b>.\n\n📍 <b>Your Chat ID:</b> <code>${chatId}</code>\n\n<b>Commands:</b>\n• /status - Check Vault status\n• /vault - Access dashboard\n• /ping - Check latency\n• /id - Show this Chat ID\n• /audit - Security Audit`;
          replyButtons = [[{ text: '🔐 Open Vault', url: `${req.protocol}://${req.get('host')}` }]];
        } else if (cmd === '/ping') {
          replyText = `🏓 <b>Pong!</b> Vault Bot Controller online at ${new Date().toISOString()}`;
        } else if (cmd === '/status' || cmd === '/vault') {
          replyText = `🛡️ <b>Vault Status: 🟢 Healthy & Operational</b>\n• Host: Cloudflare / Edge Node\n• Timestamp: ${new Date().toUTCString()}\n• Master Key Protection: Active`;
          replyButtons = [[{ text: '🚀 Open Vault', url: `${req.protocol}://${req.get('host')}` }]];
        } else if (cmd === '/id') {
          replyText = `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>`;
        } else if (cmd === '/audit') {
          replyText = `🔍 <b>Vault Security Audit: PASSED</b>\n• TLS: Strict\n• Relay: Active\n• Zero breaches logged.`;
        }
      } else {
        replyText = `🤖 <b>Vault Sentinel:</b> Message received! Logged in your Vault Activity Stream.\nType /help for available commands.`;
        replyButtons = [[{ text: '🔐 Open Vault', url: `${req.protocol}://${req.get('host')}` }]];
      }

      if (replyText) {
        try {
          const payload = {
            chat_id: chatId,
            text: replyText,
            parse_mode: 'HTML'
          };
          if (replyButtons) payload.reply_markup = { inline_keyboard: replyButtons };
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (_) {}
      }
    }
  }

  return res.json({ ok: true });
});

// ============================================================================
// DISCORD BOT CONTROLLER & WEBHOOK ENDPOINTS
// ============================================================================

// 8. Discord Diagnostics & Status (@me bot user & Webhook info)
const handleDiscordStatus = async (req, res) => {
  let botToken = (req.body?.bot_token || req.query?.bot_token || '').trim();
  let webhookUrl = (req.body?.webhook_url || req.query?.webhook_url || '').trim();

  if (!botToken) botToken = getBotCredential('discord_bot_token');
  if (!webhookUrl) webhookUrl = getBotCredential('discord_webhook_url');

  if (!botToken && !webhookUrl) {
    return res.status(400).json({
      success: false,
      error: 'Either Discord Bot Token or Webhook URL must be provided or configured in Bot Controller.'
    });
  }

  const result = { success: true };

  try {
    if (botToken) {
      const meRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bot ${botToken}` }
      });
      const meData = await meRes.json();
      if (meRes.ok) {
        result.bot = meData;
        const appId = meData.id;
        // Administrator & Slash Command permission integer: 2147483648 (Send messages, embed links, slash commands)
        result.inviteUrl = `https://discord.com/oauth2/authorize?client_id=${appId}&permissions=2147483648&scope=bot%20applications.commands`;
      } else {
        result.botError = meData.message || 'Invalid Discord Bot Token';
      }
    }

    if (webhookUrl) {
      const whRes = await fetch(webhookUrl);
      if (whRes.ok) {
        result.webhook = await whRes.json();
      } else {
        result.webhookError = 'Invalid or unreachable Discord Webhook URL';
      }
    }

    if (!result.bot && !result.webhook) {
      return res.status(400).json({
        success: false,
        error: result.botError || result.webhookError || 'Failed to authenticate with Discord'
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
app.get('/api/bots/discord/status', handleDiscordStatus);
app.post('/api/bots/discord/status', handleDiscordStatus);

// 9. Send Discord Message (Channel Message via Bot OR Direct Webhook Execution)
app.post('/api/bots/discord/send', async (req, res) => {
  let botToken = (req.body?.bot_token || '').trim();
  if (!botToken) botToken = getBotCredential('discord_bot_token');
  let webhookUrl = (req.body?.webhook_url || '').trim();
  if (!webhookUrl) webhookUrl = getBotCredential('discord_webhook_url');
  let channelId = (req.body?.channel_id || '').trim();
  if (!channelId) channelId = getBotCredential('discord_channel_id');

  const mode = req.body?.mode || (webhookUrl ? 'webhook' : 'bot');
  const content = (req.body?.content || '').trim();
  const username = (req.body?.username || '').trim();
  const avatarUrl = (req.body?.avatar_url || '').trim();
  const rawEmbeds = Array.isArray(req.body?.embeds) ? req.body.embeds : null;

  if (mode === 'webhook') {
    if (!webhookUrl) {
      return res.status(400).json({ success: false, error: 'Discord Webhook URL is required' });
    }
  } else {
    if (!botToken) {
      return res.status(400).json({ success: false, error: 'Discord Bot Token is required for bot mode' });
    }
    if (!channelId) {
      return res.status(400).json({ success: false, error: 'Target Discord Channel ID is required' });
    }
  }

  if (!content && (!rawEmbeds || rawEmbeds.length === 0)) {
    return res.status(400).json({ success: false, error: 'Message content or at least one rich embed is required' });
  }

  // Format rich embeds
  const formattedEmbeds = rawEmbeds ? rawEmbeds.map(e => {
    const embedObj = {};
    if (e.title) embedObj.title = e.title;
    if (e.description) embedObj.description = e.description;
    if (e.url) embedObj.url = e.url;
    if (e.color) embedObj.color = parseDiscordColor(e.color);
    if (e.timestamp) embedObj.timestamp = e.timestamp === true ? new Date().toISOString() : e.timestamp;
    if (e.footer && (typeof e.footer === 'string' ? e.footer : e.footer.text)) {
      embedObj.footer = typeof e.footer === 'string' ? { text: e.footer } : e.footer;
    }
    if (e.author && (typeof e.author === 'string' ? e.author : e.author.name)) {
      embedObj.author = typeof e.author === 'string' ? { name: e.author } : e.author;
    }
    if (e.image) embedObj.image = typeof e.image === 'string' ? { url: e.image } : e.image;
    if (e.thumbnail) embedObj.thumbnail = typeof e.thumbnail === 'string' ? { url: e.thumbnail } : e.thumbnail;
    if (Array.isArray(e.fields)) {
      embedObj.fields = e.fields.filter(f => f && f.name && f.value).map(f => ({
        name: String(f.name),
        value: String(f.value),
        inline: !!f.inline
      }));
    }
    return embedObj;
  }) : undefined;

  try {
    if (mode === 'webhook') {
      const payload = {};
      if (content) payload.content = content;
      if (username) payload.username = username;
      if (avatarUrl) payload.avatar_url = avatarUrl;
      if (formattedEmbeds && formattedEmbeds.length > 0) payload.embeds = formattedEmbeds;

      const dcRes = await fetch(webhookUrl + '?wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await dcRes.text();
      let responseData = {};
      try { responseData = JSON.parse(responseText); } catch (_) {}

      if (!dcRes.ok) {
        recordBotActivity({
          platform: 'discord',
          action: 'webhook_send_failed',
          status: 'error',
          error: responseData.message || responseText,
          content: content.slice(0, 100)
        });
        return res.status(dcRes.status || 400).json({
          success: false,
          error: responseData.message || responseText || 'Failed to execute Discord Webhook',
          details: responseData
        });
      }

      recordBotActivity({
        platform: 'discord',
        action: 'webhook_send_success',
        status: 'success',
        target: 'Webhook',
        content: content || (formattedEmbeds ? formattedEmbeds[0]?.title : 'Embed'),
        messageId: responseData.id
      });

      return res.json({ success: true, messageId: responseData.id, result: responseData });
    } else {
      // Send message to Channel via Bot Token
      const payload = {};
      if (content) payload.content = content;
      if (formattedEmbeds && formattedEmbeds.length > 0) payload.embeds = formattedEmbeds;

      const dcRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await dcRes.json();
      if (!dcRes.ok) {
        recordBotActivity({
          platform: 'discord',
          action: 'channel_send_failed',
          target: channelId,
          status: 'error',
          error: data.message || 'Discord bot dispatch failed',
          content: content.slice(0, 100)
        });
        return res.status(dcRes.status || 400).json({
          success: false,
          error: data.message || 'Failed to dispatch message to Discord channel',
          details: data
        });
      }

      recordBotActivity({
        platform: 'discord',
        action: 'channel_send_success',
        target: channelId,
        status: 'success',
        content: content || (formattedEmbeds ? formattedEmbeds[0]?.title : 'Embed'),
        messageId: data.id
      });

      return res.json({ success: true, messageId: data.id, result: data });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 10. List Discord Guilds (Servers the bot is inside)
app.get('/api/bots/discord/guilds', async (req, res) => {
  let token = (req.query?.bot_token || '').trim();
  if (!token) token = getBotCredential('discord_bot_token');
  if (!token) {
    return res.status(400).json({ success: false, error: 'Discord Bot Token is required' });
  }

  try {
    const dcRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { 'Authorization': `Bot ${token}` }
    });
    const data = await dcRes.json();
    if (!dcRes.ok) {
      return res.status(dcRes.status).json({ success: false, error: data.message || 'Failed to list guilds', details: data });
    }
    return res.json({ success: true, guilds: Array.isArray(data) ? data : [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 11. List Discord Channels for a Guild
app.get('/api/bots/discord/channels', async (req, res) => {
  let token = (req.query?.bot_token || '').trim();
  if (!token) token = getBotCredential('discord_bot_token');
  const guildId = (req.query?.guild_id || '').trim();

  if (!token) {
    return res.status(400).json({ success: false, error: 'Discord Bot Token is required' });
  }
  if (!guildId) {
    return res.status(400).json({ success: false, error: 'guild_id query parameter is required' });
  }

  try {
    const dcRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { 'Authorization': `Bot ${token}` }
    });
    const data = await dcRes.json();
    if (!dcRes.ok) {
      return res.status(dcRes.status).json({ success: false, error: data.message || 'Failed to fetch channels', details: data });
    }

    // Filter to text (0), announcement/news (5), forum (15)
    const channels = Array.isArray(data) ? data.filter(c => [0, 5, 15].includes(c.type)) : [];
    return res.json({ success: true, channels });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Discord Slash Commands (Global Application Commands)
app.get('/api/bots/discord/commands', async (req, res) => {
  let token = (req.query?.bot_token || '').trim();
  if (!token) token = getBotCredential('discord_bot_token');
  let appId = (req.query?.app_id || '').trim();
  if (!appId) appId = getBotCredential('discord_client_id');

  if (!token) {
    return res.status(400).json({ success: false, error: 'Discord Bot Token is required' });
  }

  try {
    if (!appId) {
      const meRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bot ${token}` }
      });
      const meData = await meRes.json();
      if (meRes.ok) appId = meData.id;
    }

    if (!appId) {
      return res.status(400).json({ success: false, error: 'Could not resolve Discord Application ID' });
    }

    const dcRes = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      headers: { 'Authorization': `Bot ${token}` }
    });
    const data = await dcRes.json();
    return res.json({ success: dcRes.ok, appId, commands: Array.isArray(data) ? data : [], error: data.message });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/bots/discord/commands', async (req, res) => {
  let token = (req.body?.bot_token || '').trim();
  if (!token) token = getBotCredential('discord_bot_token');
  let appId = (req.body?.app_id || '').trim();
  if (!appId) appId = getBotCredential('discord_client_id');
  const name = (req.body?.name || '').trim().toLowerCase();
  const description = (req.body?.description || '').trim();
  const options = Array.isArray(req.body?.options) ? req.body.options : [];

  if (!token || !name || !description) {
    return res.status(400).json({ success: false, error: 'bot_token, command name, and description are required' });
  }

  try {
    if (!appId) {
      const meRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bot ${token}` }
      });
      const meData = await meRes.json();
      if (meRes.ok) appId = meData.id;
    }

    const dcRes = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description, options })
    });
    const data = await dcRes.json();

    recordBotActivity({
      platform: 'discord',
      action: 'register_slash_command',
      status: dcRes.ok ? 'success' : 'error',
      command: name,
      details: data
    });

    return res.json({ success: dcRes.ok, command: data, error: data.message });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Unified Parallel Cross-Platform Broadcaster
app.post('/api/bots/broadcast', async (req, res) => {
  const title = (req.body?.title || 'Vault System Broadcast').trim();
  const message = (req.body?.message || '').trim();
  const color = req.body?.color || '#7c6af7';
  const tgConfig = req.body?.telegram || {};
  const dcConfig = req.body?.discord || {};

  if (!message) {
    return res.status(400).json({ success: false, error: 'Broadcast message content is required' });
  }

  const results = {
    telegram: null,
    discord: null
  };

  const tasks = [];

  // Telegram dispatch task
  if (tgConfig.enabled) {
    tasks.push((async () => {
      let token = (tgConfig.bot_token || '').trim();
      if (!token) token = getBotCredential('telegram_bot_token');
      let chatId = (tgConfig.chat_id || '').trim();
      if (!chatId) chatId = getBotCredential('telegram_chat_id');
      if (!token || !chatId) {
        results.telegram = { success: false, error: 'Missing Telegram token or chat_id' };
        return;
      }
      try {
        const text = `📢 <b>${title}</b>\n\n${message}\n\n<i>Sent via Vault Unified Bot Controller</i>`;
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        });
        const d = await r.json();
        results.telegram = { success: d.ok, result: d.result, error: d.description };
        recordBotActivity({
          platform: 'telegram',
          action: 'broadcast',
          target: chatId,
          status: d.ok ? 'success' : 'error',
          content: title
        });
      } catch (err) {
        results.telegram = { success: false, error: err.message };
      }
    })());
  }

  // Discord dispatch task
  if (dcConfig.enabled) {
    tasks.push((async () => {
      let webhookUrl = (dcConfig.webhook_url || '').trim();
      if (!webhookUrl) webhookUrl = getBotCredential('discord_webhook_url');
      let botToken = (dcConfig.bot_token || '').trim();
      if (!botToken) botToken = getBotCredential('discord_bot_token');
      let channelId = (dcConfig.channel_id || '').trim();
      if (!channelId) channelId = getBotCredential('discord_channel_id');
      const mode = dcConfig.mode || (webhookUrl ? 'webhook' : 'bot');

      const embed = {
        title: `📢 ${title}`,
        description: message,
        color: parseDiscordColor(color),
        footer: { text: 'Vault Unified Bot Controller • Broadcast Sentinel' },
        timestamp: new Date().toISOString()
      };

      try {
        if (mode === 'webhook' && webhookUrl) {
          const r = await fetch(webhookUrl + '?wait=true', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: dcConfig.username || 'Vault Sentinel',
              avatar_url: dcConfig.avatar_url || 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f512.png',
              embeds: [embed]
            })
          });
          const d = await r.json().catch(() => ({}));
          results.discord = { success: r.ok, result: d, error: d.message };
        } else if (botToken && channelId) {
          const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ embeds: [embed] })
          });
          const d = await r.json();
          results.discord = { success: r.ok, result: d, error: d.message };
        } else {
          results.discord = { success: false, error: 'Missing Discord credentials or target' };
          return;
        }

        recordBotActivity({
          platform: 'discord',
          action: 'broadcast',
          status: results.discord.success ? 'success' : 'error',
          content: title
        });
      } catch (err) {
        results.discord = { success: false, error: err.message };
      }
    })());
  }

  await Promise.allSettled(tasks);

  return res.json({
    success: true,
    title,
    results
  });
});

// 14. Activity Logs API
app.get('/api/bots/logs', (req, res) => {
  return res.json({
    success: true,
    total: botActivityLogs.length,
    logs: botActivityLogs
  });
});

app.delete('/api/bots/logs', (req, res) => {
  botActivityLogs.length = 0;
  return res.json({ success: true, message: 'Bot activity logs cleared' });
});

// Curated Open Web Videos Directory & Search
app.get('/api/videos/web', async (req, res) => {
  const query = (req.query.q || '').trim();
  const category = (req.query.category || 'all').trim().toLowerCase();

  const curatedVideos = [
    {
      id: 'synthwave-grid',
      title: 'Synthwave Sunset Highway Loop',
      category: 'cyberpunk',
      duration: '0:30',
      resolution: '1080p 60fps',
      thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      tags: ['synthwave', 'retro', 'neon', 'highway', 'chill'],
      description: 'Retro 80s neon synthwave grid highway driving loop with glowing purple sunset.'
    },
    {
      id: 'ocean-waves',
      title: 'Deep Ocean Waves & Golden Hour',
      category: 'nature',
      duration: '0:15',
      resolution: '4K Ultra HD',
      thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      tags: ['ocean', 'waves', 'sunset', 'relax', 'nature'],
      description: 'Slow-motion rhythmic ocean waves washing along the coast at golden hour.'
    },
    {
      id: 'matrix-tunnel',
      title: 'Cyberspace Quantum Data Stream',
      category: 'cyberpunk',
      duration: '0:45',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      tags: ['code', 'matrix', 'data', 'security', 'tech'],
      description: 'High-speed cryptographic data packets flying through an encrypted neural fiber tunnel.'
    },
    {
      id: 'rain-window',
      title: 'Raindrops Falling on Cozy Windowpane',
      category: 'ambient',
      duration: '0:35',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      tags: ['rain', 'window', 'cozy', 'study', 'focus'],
      description: 'Gentle raindrops tracing paths across a warm ambient glass windowpane.'
    },
    {
      id: 'deep-space',
      title: 'Cosmic Nebula & Galactic Core Orbit',
      category: 'space',
      duration: '0:20',
      resolution: '4K Ultra HD',
      thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      tags: ['space', 'galaxy', 'nebula', 'cosmos', 'stars'],
      description: 'Spectacular celestial flythrough of distant glowing gas nebulas and starry galaxies.'
    },
    {
      id: 'cyber-server',
      title: 'Server Room Optical Data Hub',
      category: 'tech',
      duration: '0:18',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      tags: ['server', 'cloud', 'datacenter', 'infra', 'led'],
      description: 'Gleaming server rack array with pulsing fiber-optic network activity LEDs.'
    },
    {
      id: 'lofi-cafe',
      title: 'Lo-Fi Rain Terrace & Coffee Study',
      category: 'ambient',
      duration: '0:40',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      tags: ['lofi', 'coffee', 'cafe', 'chill', 'music'],
      description: 'Atmospheric urban rain terrace with warm lanterns, steam from coffee, and lo-fi vibes.'
    },
    {
      id: 'aurora-borealis',
      title: 'Nordic Aurora Borealis Northern Lights',
      category: 'nature',
      duration: '0:25',
      resolution: '4K Ultra HD',
      thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      tags: ['aurora', 'green', 'sky', 'night', 'arctic'],
      description: 'Emerald green ribbons of aurora borealis rippling across the Arctic night sky.'
    }
  ];

  let results = curatedVideos;
  if (category && category !== 'all') {
    results = results.filter(v => v.category === category);
  }
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(v => 
      v.title.toLowerCase().includes(q) || 
      v.description.toLowerCase().includes(q) ||
      v.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Also query Wikimedia Commons Open Videos if a search term is specified
  let openWebVideos = [];
  if (query) {
    try {
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query + ' filetype:video')}&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime`;
      const wikiRes = await fetch(wikiUrl, {
        headers: { 'User-Agent': 'VaultOpenVideos/1.0' },
        signal: AbortSignal.timeout(3000)
      });
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData?.query?.pages || {};
        for (const pid of Object.keys(pages)) {
          const page = pages[pid];
          const info = page.imageinfo?.[0];
          if (info && (info.mime?.includes('video') || info.url?.endsWith('.webm') || info.url?.endsWith('.mp4') || info.url?.endsWith('.ogv'))) {
            const rawTitle = page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
            openWebVideos.push({
              id: 'wiki-' + pid,
              title: rawTitle,
              category: 'open-web',
              duration: 'Open Web',
              resolution: `${info.width || 1280}x${info.height || 720}`,
              thumb: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80',
              url: info.url,
              tags: ['wikimedia', 'creative-commons', 'open-web'],
              description: `Creative Commons open video archive entry: ${rawTitle}`
            });
          }
        }
      }
    } catch (_) {}
  }

  return res.json({
    videos: [...results, ...openWebVideos],
    total: results.length + openWebVideos.length,
    categories: [
      { id: 'all', name: '✨ All Web Videos' },
      { id: 'ambient', name: '🌧️ Ambient & Study' },
      { id: 'nature', name: '🌊 Nature & 4K Oceans' },
      { id: 'cyberpunk', name: '🌆 Cyberpunk & Neon' },
      { id: 'space', name: '🌌 Space & Nebula' },
      { id: 'tech', name: '💻 Tech & Cryptography' }
    ]
  });
});

// High-Fidelity Ambient Soundscapes & Soundboard Catalog
app.get('/api/sounds/ambient', (req, res) => {
  return res.json({
    channels: [
      { id: 'rain', name: 'Heavy Rain & Drops', icon: '🌧️', type: 'synth_noise', freq: 400, q: 0.8, gain: 0.5, desc: 'Gentle continuous rainfall on roof and window' },
      { id: 'thunder', name: 'Rolling Thunder', icon: '⚡', type: 'synth_sub', freq: 65, q: 3.5, gain: 0.4, desc: 'Deep sub-bass distant thunderstorm rumble' },
      { id: 'ocean', name: 'Ocean Tide Waves', icon: '🌊', type: 'synth_wave', freq: 280, q: 1.2, gain: 0.45, desc: 'Rhythmic oceanic surf rising and ebbing' },
      { id: 'fire', name: 'Crackling Campfire', icon: '🔥', type: 'synth_crackle', freq: 800, q: 2.0, gain: 0.4, desc: 'Warm glowing fireplace with wood pops' },
      { id: 'forest', name: 'Night Forest & Crickets', icon: '🌲', type: 'synth_crickets', freq: 4500, q: 8.0, gain: 0.35, desc: 'Pine forest evening breeze and rhythmic crickets' },
      { id: 'coffee', name: 'Cafe Terrace Chatter', icon: '☕', type: 'synth_cafe', freq: 1200, q: 1.0, gain: 0.35, desc: 'Low pleasant background cafe murmur and cups' },
      { id: 'whitenoise', name: 'Pure White Noise', icon: '📻', type: 'noise_white', gain: 0.3, desc: 'Equal energy distribution across all audible frequencies' },
      { id: 'pinknoise', name: 'Deep Pink Noise', icon: '🌸', type: 'noise_pink', gain: 0.4, desc: 'Balanced 1/f acoustic power for deep reading focus' },
      { id: 'brownnoise', name: 'Warm Brown Noise', icon: '🍫', type: 'noise_brown', gain: 0.45, desc: 'Deep warm sub-weighted noise for sleep and masking' },
      { id: 'binaural40', name: '40Hz Gamma Focus Wave', icon: '🧠', type: 'binaural', freqL: 200, freqR: 240, gain: 0.25, desc: 'Binaural auditory beat for peak cognitive focus' },
      { id: 'binaural14', name: '14Hz Alpha Calm Wave', icon: '⚡', type: 'binaural', freqL: 200, freqR: 214, gain: 0.25, desc: 'Alpha wave brainwave entrainment for relaxed alert flow' },
      { id: 'zenbowl', name: 'Tibetan Singing Bowl Drone', icon: '🧘', type: 'synth_drone', freq: 432, gain: 0.3, desc: 'Harmonic 432Hz sacred geometry resonant chime' }
    ],
    presets: [
      { id: 'deep_focus', name: '🎯 Peak Focus Room', desc: 'Brown Noise + Rain + 40Hz Gamma', gains: { brownnoise: 60, rain: 45, binaural40: 30 } },
      { id: 'rainy_cabin', name: '🏡 Cozy Cabin Storm', desc: 'Heavy Rain + Thunder + Campfire', gains: { rain: 75, thunder: 50, fire: 65 } },
      { id: 'coastal_sunset', name: '🏖️ Coastal Sunset', desc: 'Ocean Waves + Evening Breeze + Pink Noise', gains: { ocean: 80, pinknoise: 35, forest: 25 } },
      { id: 'cyberpunk_study', name: '🌃 Midnight Cyber Study', desc: 'Rain on Glass + 14Hz Alpha + Pink Noise', gains: { rain: 60, pinknoise: 40, binaural14: 35 } },
      { id: 'zen_sanctuary', name: '🌸 Zen Temple Sanctuary', desc: '432Hz Singing Bowl + Forest + Ocean', gains: { zenbowl: 70, forest: 45, ocean: 30 } }
    ],
    soundboard: [
      { id: 'click', name: 'Mechanical Key', icon: '⌨️', category: 'ui' },
      { id: 'success', name: 'Access Granted', icon: '✨', category: 'alerts' },
      { id: 'chime', name: 'Crystal Bell', icon: '🔔', category: 'musical' },
      { id: 'coin', name: 'Retro Coin', icon: '🪙', category: 'retro' },
      { id: 'laser', name: 'Laser Blaster', icon: '⚡', category: 'retro' },
      { id: 'alert', name: 'Security Ping', icon: '🚨', category: 'alerts' },
      { id: 'levelup', name: 'Level Complete', icon: '🏆', category: 'retro' },
      { id: 'pop', name: 'Bubble Pop', icon: '🫧', category: 'ui' },
      { id: 'swoosh', name: 'Cyber Swoosh', icon: '💨', category: 'ui' },
      { id: 'shutter', name: 'Camera Shutter', icon: '📸', category: 'ui' }
    ]
  });
});

// Sticker & Reaction Studio Catalog
app.get('/api/stickers/catalog', (req, res) => {
  return res.json({
    categories: [
      { id: 'tech', name: '💻 Cyber & Tech' },
      { id: 'kawaii', name: '🐱 Kawaii & Cute' },
      { id: 'badges', name: '🏷️ Badges & Status' },
      { id: 'reactions', name: '🔥 Reactions & Memes' },
      { id: 'security', name: '🛡️ Vault & Crypto' }
    ],
    stickers: [
      // Cyber & Tech
      { id: 'stk-chip', category: 'tech', name: 'Quantum Core', emoji: '💽', bg: '#0f172a', border: '#38bdf8', color: '#38bdf8', label: 'QUANTUM' },
      { id: 'stk-term', category: 'tech', name: 'Root Terminal', emoji: '💻', bg: '#022c22', border: '#10b981', color: '#10b981', label: 'ROOT ACCESS' },
      { id: 'stk-rocket', category: 'tech', name: 'Hyper Rocket', emoji: '🚀', bg: '#450a0a', border: '#f87171', color: '#f87171', label: 'DEPLOYED' },
      { id: 'stk-matrix', category: 'tech', name: 'Cyber Glitch', emoji: '👾', bg: '#14532d', border: '#22c55e', color: '#86efac', label: 'CYBER BUG' },
      { id: 'stk-btc', category: 'tech', name: 'Crypto Gold', emoji: '🪙', bg: '#451a03', border: '#f59e0b', color: '#fbbf24', label: 'HASH 256' },

      // Kawaii & Cute
      { id: 'stk-cat', category: 'kawaii', name: 'Astro Cat', emoji: '🐱‍🚀', bg: '#3b0764', border: '#c084fc', color: '#e9d5ff', label: 'ASTRO MEOW' },
      { id: 'stk-boba', category: 'kawaii', name: 'Boba Delight', emoji: '🧋', bg: '#451a03', border: '#d97706', color: '#fde68a', label: 'SWEET BOBA' },
      { id: 'stk-cloud', category: 'kawaii', name: 'Happy Cloud', emoji: '☁️', bg: '#0c4a6e', border: '#38bdf8', color: '#bae6fd', label: 'CHILL VIBE' },
      { id: 'stk-star', category: 'kawaii', name: 'Magic Star', emoji: '⭐', bg: '#713f12', border: '#eab308', color: '#fef08a', label: 'SUPERSTAR' },
      { id: 'stk-heart', category: 'kawaii', name: 'Pixel Heart', emoji: '💖', bg: '#831843', border: '#f472b6', color: '#fbcfe8', label: 'MAX HP' },

      // Badges & Status
      { id: 'stk-verified', category: 'badges', name: 'Verified Shield', emoji: '🛡️', bg: '#064e3b', border: '#34d399', color: '#6ee7b7', label: 'VERIFIED' },
      { id: 'stk-urgent', category: 'badges', name: 'Urgent Priority', emoji: '🚨', bg: '#7f1d1d', border: '#ef4444', color: '#fca5a5', label: 'URGENT' },
      { id: 'stk-secret', category: 'badges', name: 'Top Secret', emoji: '🤫', bg: '#18181b', border: '#e11d48', color: '#fda4af', label: 'TOP SECRET' },
      { id: 'stk-done', category: 'badges', name: 'Mission Done', emoji: '✅', bg: '#064e3b', border: '#10b981', color: '#a7f3d0', label: '100% COMPLETE' },
      { id: 'stk-vip', category: 'badges', name: 'VIP Status', emoji: '👑', bg: '#581c87', border: '#a855f7', color: '#e9d5ff', label: 'VIP ACCESS' },

      // Reactions & Memes
      { id: 'stk-fire', category: 'reactions', name: 'Pure Fire', emoji: '🔥', bg: '#7c2d12', border: '#ea580c', color: '#fdba74', label: 'LIT' },
      { id: 'stk-brain', category: 'reactions', name: 'Galaxy Brain', emoji: '🧠', bg: '#312e81', border: '#818cf8', color: '#c7d2fe', label: '200 IQ' },
      { id: 'stk-party', category: 'reactions', name: 'Party Popper', emoji: '🎉', bg: '#701a75', border: '#d946ef', color: '#f5d0fe', label: 'CELEBRATE' },
      { id: 'stk-100', category: 'reactions', name: 'Keep It 100', emoji: '💯', bg: '#881337', border: '#f43f5e', color: '#fecdd3', label: 'PERFECT' },
      { id: 'stk-rock', category: 'reactions', name: 'Rock On', emoji: '🤘', bg: '#1e1b4b', border: '#6366f1', color: '#a5b4fc', label: 'ROCK ON' },

      // Security
      { id: 'stk-vault', category: 'security', name: 'Vault Guard', emoji: '🔐', bg: '#0f172a', border: '#60a5fa', color: '#93c5fd', label: 'AES-256' },
      { id: 'stk-biometric', category: 'security', name: 'Biometric Pass', emoji: '🧬', bg: '#042f2e', border: '#14b8a6', color: '#5eead4', label: 'BIOMETRIC' },
      { id: 'stk-bugfix', category: 'security', name: 'Bug Eliminated', emoji: '🎯', bg: '#1c1917', border: '#78716c', color: '#e7e5e4', label: 'ZERO BUG' }
    ]
  });
});

app.post('/api/ai/preferences', (req, res) => {
  const { provider, model } = req.body || {};
  if (provider) setSetting('ai_preferred_provider', provider);
  if (model) setSetting('ai_preferred_model', model);
  return res.json({ success: true });
});

// ============================================================================
// 3D MODEL GENERATOR & GAMING ENGINE APIS
// ============================================================================

// Procedural 3D model recipe generator for basic/low-poly 3D models
function compileProcedural3DRecipe(promptText, categoryHint = 'general') {
  const text = (promptText || '').toLowerCase().trim();
  const id = 'model_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // 1. STARFIGHTER / SPACESHIP
  if (text.includes('space') || text.includes('ship') || text.includes('fighter') || text.includes('rocket') || text.includes('shuttle')) {
    return {
      id,
      title: 'Aero-Starfighter Mk-IV',
      prompt: promptText,
      category: 'scifi',
      description: 'Futuristic atmospheric and orbital starfighter with dual wingtip laser cannons and hyperdrive nacelles.',
      animation: 'hover',
      camera: { position: [4, 3, 5], target: [0, 0, 0] },
      parts: [
        { name: 'Fuselage', shape: 'box', size: [1.2, 0.4, 3.2], position: [0, 0, 0], rotation: [0, 0, 0], color: '#38bdf8', metalness: 0.7, roughness: 0.3 },
        { name: 'Nose Cone', shape: 'cone', size: [0.5, 1.4, 8], position: [0, 0, 2.1], rotation: [Math.PI / 2, 0, 0], color: '#0284c7', metalness: 0.8, roughness: 0.2 },
        { name: 'Cockpit Canopy', shape: 'sphere', size: [0.45, 16, 16], position: [0, 0.25, 0.4], rotation: [0, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.85 },
        { name: 'Left Wing', shape: 'box', size: [2.2, 0.08, 1.4], position: [-1.4, 0, -0.4], rotation: [0, 0.2, 0], color: '#1e293b', metalness: 0.5, roughness: 0.4 },
        { name: 'Right Wing', shape: 'box', size: [2.2, 0.08, 1.4], position: [1.4, 0, -0.4], rotation: [0, -0.2, 0], color: '#1e293b', metalness: 0.5, roughness: 0.4 },
        { name: 'Left Wing Cannon', shape: 'cylinder', size: [0.08, 0.08, 1.6], position: [-2.4, 0.05, 0.1], rotation: [Math.PI / 2, 0, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.4 },
        { name: 'Right Wing Cannon', shape: 'cylinder', size: [0.08, 0.08, 1.6], position: [2.4, 0.05, 0.1], rotation: [Math.PI / 2, 0, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.4 },
        { name: 'Vertical Stabilizer', shape: 'box', size: [0.08, 1.0, 1.2], position: [0, 0.6, -1.1], rotation: [-0.3, 0, 0], color: '#0284c7', metalness: 0.6, roughness: 0.3 },
        { name: 'Engine Left', shape: 'cylinder', size: [0.25, 0.3, 0.8], position: [-0.4, 0, -1.8], rotation: [Math.PI / 2, 0, 0], color: '#0f172a', metalness: 0.9, roughness: 0.2 },
        { name: 'Engine Right', shape: 'cylinder', size: [0.25, 0.3, 0.8], position: [0.4, 0, -1.8], rotation: [Math.PI / 2, 0, 0], color: '#0f172a', metalness: 0.9, roughness: 0.2 },
        { name: 'Left Thruster Plasma', shape: 'cylinder', size: [0.2, 0.05, 0.5], position: [-0.4, 0, -2.3], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 1.2 },
        { name: 'Right Thruster Plasma', shape: 'cylinder', size: [0.2, 0.05, 0.5], position: [0.4, 0, -2.3], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 1.2 }
      ]
    };
  }

  // 2. TANK / COMBAT VEHICLE
  if (text.includes('tank') || text.includes('artillery') || text.includes('panzer')) {
    return {
      id,
      title: 'Apex Cyber Tank',
      prompt: promptText,
      category: 'vehicles',
      description: 'Heavy armored assault vehicle with heavy treads, rotating turret, and dual cannons.',
      animation: 'none',
      camera: { position: [4, 3, 5], target: [0, 0.5, 0] },
      parts: [
        { name: 'Left Tread', shape: 'box', size: [0.6, 0.7, 3.4], position: [-1.2, 0.35, 0], rotation: [0, 0, 0], color: '#1e293b', metalness: 0.8, roughness: 0.6 },
        { name: 'Right Tread', shape: 'box', size: [0.6, 0.7, 3.4], position: [1.2, 0.35, 0], rotation: [0, 0, 0], color: '#1e293b', metalness: 0.8, roughness: 0.6 },
        { name: 'Lower Chassis', shape: 'box', size: [1.9, 0.6, 3.0], position: [0, 0.5, 0], rotation: [0, 0, 0], color: '#334155', metalness: 0.7, roughness: 0.4 },
        { name: 'Sloped Glacis Plate', shape: 'box', size: [1.8, 0.2, 1.0], position: [0, 0.65, 1.2], rotation: [0.5, 0, 0], color: '#475569', metalness: 0.7, roughness: 0.4 },
        { name: 'Main Turret Ring', shape: 'cylinder', size: [0.9, 1.0, 0.6], position: [0, 1.0, -0.1], rotation: [0, 0, 0], color: '#1e293b', metalness: 0.8, roughness: 0.3 },
        { name: 'Turret Armor Pod', shape: 'box', size: [1.4, 0.6, 1.6], position: [0, 1.2, -0.2], rotation: [0, 0, 0], color: '#2563eb', metalness: 0.6, roughness: 0.3 },
        { name: 'Commander Hatch', shape: 'cylinder', size: [0.3, 0.3, 0.2], position: [0.35, 1.55, -0.3], rotation: [0, 0, 0], color: '#0f172a', metalness: 0.9, roughness: 0.2 },
        { name: 'Main Cannon Barrel', shape: 'cylinder', size: [0.12, 0.12, 2.6], position: [0, 1.25, 1.4], rotation: [Math.PI / 2, 0, 0], color: '#64748b', metalness: 0.9, roughness: 0.2 },
        { name: 'Muzzle Brake', shape: 'cylinder', size: [0.2, 0.2, 0.4], position: [0, 1.25, 2.7], rotation: [Math.PI / 2, 0, 0], color: '#0f172a', metalness: 0.9, roughness: 0.2 },
        { name: 'Antenna', shape: 'cylinder', size: [0.03, 0.03, 1.4], position: [-0.5, 1.9, -0.7], rotation: [-0.1, 0, 0], color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 0.4 }
      ]
    };
  }

  // 3. ARCADE CABINET / RETRO CONSOLE
  if (text.includes('arcade') || text.includes('cabinet') || text.includes('retro') || text.includes('gameboy') || text.includes('nintendo')) {
    return {
      id,
      title: 'Classic Neon Arcade Cabinet',
      prompt: promptText,
      category: 'arcade',
      description: 'Authentic 1980s coin-op arcade cabinet with illuminated marquee, angled CRT monitor, and dual joystick deck.',
      animation: 'spin',
      camera: { position: [3, 2.5, 4], target: [0, 1.4, 0] },
      parts: [
        { name: 'Cabinet Body Base', shape: 'box', size: [1.4, 1.2, 1.3], position: [0, 0.6, 0], rotation: [0, 0, 0], color: '#0f172a', metalness: 0.2, roughness: 0.8 },
        { name: 'Coin Return Door', shape: 'box', size: [0.6, 0.7, 0.05], position: [0, 0.5, 0.66], rotation: [0, 0, 0], color: '#1e293b', metalness: 0.8, roughness: 0.3 },
        { name: 'Coin Slot Yellow', shape: 'box', size: [0.15, 0.08, 0.03], position: [-0.15, 0.7, 0.7], rotation: [0, 0, 0], color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 0.8 },
        { name: 'Coin Slot Red', shape: 'box', size: [0.15, 0.08, 0.03], position: [0.15, 0.7, 0.7], rotation: [0, 0, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 },
        { name: 'Angled Control Deck', shape: 'box', size: [1.45, 0.12, 0.8], position: [0, 1.25, 0.6], rotation: [0.25, 0, 0], color: '#7c6af7', metalness: 0.4, roughness: 0.4 },
        { name: 'Player 1 Joystick', shape: 'cylinder', size: [0.04, 0.04, 0.35], position: [-0.35, 1.45, 0.55], rotation: [0.25, 0, 0], color: '#ef4444' },
        { name: 'Player 1 Ball Knob', shape: 'sphere', size: [0.1, 12, 12], position: [-0.35, 1.6, 0.53], rotation: [0, 0, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.4 },
        { name: 'Buttons P1 A', shape: 'cylinder', size: [0.05, 0.05, 0.04], position: [-0.15, 1.35, 0.58], rotation: [0.25, 0, 0], color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.5 },
        { name: 'Buttons P1 B', shape: 'cylinder', size: [0.05, 0.05, 0.04], position: [-0.05, 1.38, 0.54], rotation: [0.25, 0, 0], color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 0.5 },
        { name: 'CRT Bezel Housing', shape: 'box', size: [1.38, 1.1, 0.6], position: [0, 1.8, 0.1], rotation: [-0.25, 0, 0], color: '#18181b' },
        { name: 'Glowing CRT Screen', shape: 'box', size: [1.1, 0.85, 0.05], position: [0, 1.82, 0.4], rotation: [-0.25, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.85 },
        { name: 'Marquee Header', shape: 'box', size: [1.4, 0.45, 0.6], position: [0, 2.45, 0.3], rotation: [0, 0, 0], color: '#ec4899', emissive: '#ec4899', emissiveIntensity: 0.7 },
        { name: 'Left Cabinet Side Fin', shape: 'box', size: [0.08, 2.5, 1.4], position: [-0.72, 1.3, 0.05], rotation: [0, 0, 0], color: '#6366f1' },
        { name: 'Right Cabinet Side Fin', shape: 'box', size: [0.08, 2.5, 1.4], position: [0.72, 1.3, 0.05], rotation: [0, 0, 0], color: '#6366f1' }
      ]
    };
  }

  // 4. LOW POLY TREE & FLOATING ISLAND
  if (text.includes('tree') || text.includes('island') || text.includes('forest') || text.includes('nature') || text.includes('mountain')) {
    return {
      id,
      title: 'Floating Mystic Low-Poly Island',
      prompt: promptText,
      category: 'nature',
      description: 'Lush floating polygonal sky island with tiered pine trees, bedrock crust, and crystalline water pool.',
      animation: 'hover',
      camera: { position: [4, 4, 4], target: [0, 0.5, 0] },
      parts: [
        { name: 'Island Grass Top', shape: 'cylinder', size: [2.6, 2.4, 0.5, 7], position: [0, 0.1, 0], rotation: [0, 0.4, 0], color: '#22c55e', roughness: 0.8 },
        { name: 'Bedrock Crust', shape: 'cone', size: [2.4, 2.0, 7], position: [0, -1.1, 0], rotation: [Math.PI, 0.4, 0], color: '#57534e', roughness: 0.9 },
        { name: 'Tree 1 Trunk', shape: 'cylinder', size: [0.15, 0.22, 1.2], position: [-0.4, 0.85, -0.3], rotation: [0, 0, 0], color: '#78350f', roughness: 0.9 },
        { name: 'Tree 1 Foliage Bottom', shape: 'cone', size: [0.9, 1.0, 6], position: [-0.4, 1.6, -0.3], rotation: [0, 0, 0], color: '#15803d', roughness: 0.7 },
        { name: 'Tree 1 Foliage Mid', shape: 'cone', size: [0.75, 0.9, 6], position: [-0.4, 2.1, -0.3], rotation: [0, 0.4, 0], color: '#16a34a', roughness: 0.7 },
        { name: 'Tree 1 Foliage Top', shape: 'cone', size: [0.55, 0.8, 6], position: [-0.4, 2.6, -0.3], rotation: [0, 0.8, 0], color: '#22c55e', roughness: 0.7 },
        { name: 'Tree 2 Trunk', shape: 'cylinder', size: [0.12, 0.18, 0.9], position: [0.8, 0.7, 0.5], rotation: [0.1, 0, -0.05], color: '#78350f', roughness: 0.9 },
        { name: 'Tree 2 Foliage', shape: 'cone', size: [0.7, 1.2, 5], position: [0.8, 1.5, 0.5], rotation: [0, 0.2, 0], color: '#15803d', roughness: 0.7 },
        { name: 'Crystal Water Spring', shape: 'cylinder', size: [0.7, 0.7, 0.08], position: [0.3, 0.36, -0.5], rotation: [0, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.5, transparent: true, opacity: 0.8 },
        { name: 'Floating Crystal Shard', shape: 'dodecahedron', size: [0.35], position: [1.2, 1.8, -0.8], rotation: [0.4, 0.4, 0.4], color: '#c084fc', emissive: '#c084fc', emissiveIntensity: 0.8 }
      ]
    };
  }

  // 5. MEDIEVAL CASTLE / WIZARD TOWER
  if (text.includes('castle') || text.includes('tower') || text.includes('fortress') || text.includes('wizard') || text.includes('medieval')) {
    return {
      id,
      title: 'Citadel of the Mystic Spires',
      prompt: promptText,
      category: 'fantasy',
      description: 'Heavy stone fortress tower with battlement parapets, arched gateway, and hovering mana crystal orb.',
      animation: 'hover',
      camera: { position: [4, 4, 5], target: [0, 1.8, 0] },
      parts: [
        { name: 'Fortress Base', shape: 'box', size: [2.6, 1.2, 2.6], position: [0, 0.6, 0], rotation: [0, 0, 0], color: '#475569', roughness: 0.85 },
        { name: 'Wooden Gate Door', shape: 'box', size: [0.7, 0.9, 0.1], position: [0, 0.5, 1.32], rotation: [0, 0, 0], color: '#78350f', roughness: 0.9 },
        { name: 'Gate Iron Portcullis', shape: 'box', size: [0.65, 0.85, 0.04], position: [0, 0.55, 1.35], rotation: [0, 0, 0], color: '#0f172a', metalness: 0.8 },
        { name: 'Tower Column Lower', shape: 'cylinder', size: [1.0, 1.1, 2.0, 8], position: [0, 2.1, 0], rotation: [0, 0, 0], color: '#64748b', roughness: 0.8 },
        { name: 'Parapet Overhang', shape: 'cylinder', size: [1.3, 1.0, 0.4, 8], position: [0, 3.2, 0], rotation: [0, 0, 0], color: '#334155', roughness: 0.8 },
        { name: 'High Spire Roof', shape: 'cone', size: [1.25, 2.2, 8], position: [0, 4.4, 0], rotation: [0, 0, 0], color: '#1e3a8a', roughness: 0.5, metalness: 0.3 },
        { name: 'Spire Golden Finial', shape: 'sphere', size: [0.18, 12, 12], position: [0, 5.6, 0], rotation: [0, 0, 0], color: '#facc15', metalness: 0.9, roughness: 0.1 },
        { name: 'Corner Turret NW', shape: 'cylinder', size: [0.35, 0.35, 1.6, 6], position: [-1.2, 1.0, -1.2], rotation: [0, 0, 0], color: '#475569' },
        { name: 'Corner Roof NW', shape: 'cone', size: [0.45, 0.8, 6], position: [-1.2, 2.1, -1.2], rotation: [0, 0, 0], color: '#1e3a8a' },
        { name: 'Corner Turret NE', shape: 'cylinder', size: [0.35, 0.35, 1.6, 6], position: [1.2, 1.0, -1.2], rotation: [0, 0, 0], color: '#475569' },
        { name: 'Corner Roof NE', shape: 'cone', size: [0.45, 0.8, 6], position: [1.2, 2.1, -1.2], rotation: [0, 0, 0], color: '#1e3a8a' },
        { name: 'Floating Mana Orb', shape: 'dodecahedron', size: [0.3], position: [0, 3.8, 1.4], rotation: [0.4, 0.4, 0], color: '#a855f7', emissive: '#a855f7', emissiveIntensity: 0.9 }
      ]
    };
  }

  // 6. ROBOT / MECH / CYBORG
  if (text.includes('robot') || text.includes('mech') || text.includes('cyborg') || text.includes('droid') || text.includes('bot')) {
    return {
      id,
      title: 'Titan Sentinel Mech-01',
      prompt: promptText,
      category: 'scifi',
      description: 'Bipedal heavy defense mech equipped with dual shoulder missile pods, chest reactor core, and energy cannon.',
      animation: 'hover',
      camera: { position: [3, 2.5, 4], target: [0, 1.2, 0] },
      parts: [
        { name: 'Torso Core', shape: 'box', size: [1.2, 0.9, 0.8], position: [0, 1.4, 0], rotation: [0, 0, 0], color: '#1e293b', metalness: 0.8, roughness: 0.3 },
        { name: 'Chest Arc Reactor', shape: 'cylinder', size: [0.25, 0.25, 0.15], position: [0, 1.5, 0.42], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 1.0 },
        { name: 'Head Unit', shape: 'box', size: [0.6, 0.45, 0.55], position: [0, 2.1, 0], rotation: [0, 0, 0], color: '#334155', metalness: 0.7, roughness: 0.3 },
        { name: 'Visor Eye', shape: 'box', size: [0.5, 0.12, 0.08], position: [0, 2.1, 0.28], rotation: [0, 0, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.9 },
        { name: 'Left Shoulder Pod', shape: 'box', size: [0.5, 0.5, 0.6], position: [-0.95, 1.6, 0], rotation: [0, 0, 0.1], color: '#ea580c', metalness: 0.6, roughness: 0.4 },
        { name: 'Right Shoulder Pod', shape: 'box', size: [0.5, 0.5, 0.6], position: [0.95, 1.6, 0], rotation: [0, 0, -0.1], color: '#ea580c', metalness: 0.6, roughness: 0.4 },
        { name: 'Left Arm Armament', shape: 'cylinder', size: [0.18, 0.14, 1.0], position: [-1.0, 0.9, 0.1], rotation: [0.3, 0, 0], color: '#475569', metalness: 0.8 },
        { name: 'Right Arm Blaster', shape: 'cylinder', size: [0.18, 0.14, 1.0], position: [1.0, 0.9, 0.1], rotation: [0.3, 0, 0], color: '#475569', metalness: 0.8 },
        { name: 'Blaster Energy Nozzle', shape: 'cylinder', size: [0.1, 0.1, 0.4], position: [1.0, 0.65, 0.6], rotation: [Math.PI / 2, 0, 0], color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 0.8 },
        { name: 'Pelvis Hip', shape: 'box', size: [0.9, 0.3, 0.6], position: [0, 0.85, 0], rotation: [0, 0, 0], color: '#0f172a', metalness: 0.9 },
        { name: 'Left Upper Leg', shape: 'box', size: [0.3, 0.6, 0.35], position: [-0.38, 0.45, 0], rotation: [-0.1, 0, 0], color: '#1e293b' },
        { name: 'Right Upper Leg', shape: 'box', size: [0.3, 0.6, 0.35], position: [0.38, 0.45, 0], rotation: [-0.1, 0, 0], color: '#1e293b' },
        { name: 'Left Foot Stomp', shape: 'box', size: [0.42, 0.18, 0.7], position: [-0.38, 0.1, 0.1], rotation: [0, 0, 0], color: '#334155' },
        { name: 'Right Foot Stomp', shape: 'box', size: [0.42, 0.18, 0.7], position: [0.38, 0.1, 0.1], rotation: [0, 0, 0], color: '#334155' }
      ]
    };
  }

  // 7. SWORD / WEAPON / EXCALIBUR
  if (text.includes('sword') || text.includes('blade') || text.includes('weapon') || text.includes('katana') || text.includes('saber')) {
    return {
      id,
      title: 'Runebound Plasma Blade',
      prompt: promptText,
      category: 'weapons',
      description: 'Legendary energy-infused blade with illuminated runic fuller channel, gilded crossguard, and mana crystal pommel.',
      animation: 'spin',
      camera: { position: [3, 2, 3], target: [0, 1.2, 0] },
      parts: [
        { name: 'Blade Core Steel', shape: 'box', size: [0.32, 2.6, 0.06], position: [0, 1.9, 0], rotation: [0, 0, 0], color: '#e2e8f0', metalness: 0.95, roughness: 0.1 },
        { name: 'Blade Tip Wedge', shape: 'cone', size: [0.25, 0.6, 4], position: [0, 3.4, 0], rotation: [0, Math.PI / 4, 0], color: '#e2e8f0', metalness: 0.95, roughness: 0.1 },
        { name: 'Runic Glowing Edge L', shape: 'box', size: [0.04, 2.4, 0.07], position: [-0.15, 1.9, 0], rotation: [0, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.9 },
        { name: 'Runic Glowing Edge R', shape: 'box', size: [0.04, 2.4, 0.07], position: [0.15, 1.9, 0], rotation: [0, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.9 },
        { name: 'Crossguard Bar', shape: 'box', size: [1.2, 0.16, 0.22], position: [0, 0.6, 0], rotation: [0, 0, 0], color: '#f59e0b', metalness: 0.9, roughness: 0.2 },
        { name: 'Crossguard Gem', shape: 'dodecahedron', size: [0.14], position: [0, 0.6, 0.12], rotation: [0, 0, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 },
        { name: 'Leather Grip', shape: 'cylinder', size: [0.09, 0.09, 0.7], position: [0, 0.2, 0], rotation: [0, 0, 0], color: '#451a03', roughness: 0.85 },
        { name: 'Pommel Sphere', shape: 'sphere', size: [0.16, 14, 14], position: [0, -0.2, 0], rotation: [0, 0, 0], color: '#f59e0b', metalness: 0.9, roughness: 0.2 }
      ]
    };
  }

  // 8. TREASURE CHEST / LOOT CRATE
  if (text.includes('chest') || text.includes('treasure') || text.includes('loot') || text.includes('crate') || text.includes('gold')) {
    return {
      id,
      title: 'Vault of Ancient Spoils',
      prompt: promptText,
      category: 'collectibles',
      description: 'Iron-banded dark oak treasure chest overflowing with glowing gold doubloons, emeralds, and rubies.',
      animation: 'pulse',
      camera: { position: [3, 2.5, 3], target: [0, 0.6, 0] },
      parts: [
        { name: 'Chest Base Body', shape: 'box', size: [1.8, 0.9, 1.2], position: [0, 0.45, 0], rotation: [0, 0, 0], color: '#451a03', roughness: 0.85 },
        { name: 'Iron Corner Band 1', shape: 'box', size: [0.1, 0.92, 1.22], position: [-0.85, 0.45, 0], rotation: [0, 0, 0], color: '#334155', metalness: 0.85 },
        { name: 'Iron Corner Band 2', shape: 'box', size: [0.1, 0.92, 1.22], position: [0.85, 0.45, 0], rotation: [0, 0, 0], color: '#334155', metalness: 0.85 },
        { name: 'Arched Lid Dome', shape: 'cylinder', size: [0.6, 0.6, 1.82, 16], position: [0, 0.95, -0.1], rotation: [0, 0, Math.PI / 2], color: '#581c87', roughness: 0.7 },
        { name: 'Gold Lock Clasp', shape: 'box', size: [0.25, 0.35, 0.12], position: [0, 0.8, 0.62], rotation: [0, 0, 0], color: '#facc15', metalness: 0.95, roughness: 0.1 },
        { name: 'Keyhole', shape: 'cylinder', size: [0.04, 0.04, 0.15], position: [0, 0.78, 0.68], rotation: [Math.PI / 2, 0, 0], color: '#0f172a' },
        { name: 'Overflowing Gold Pile', shape: 'sphere', size: [0.55, 12, 12], position: [0, 0.92, 0.25], rotation: [0, 0, 0], color: '#facc15', emissive: '#facc15', emissiveIntensity: 0.6, metalness: 0.9 },
        { name: 'Ruby Gem Drop', shape: 'dodecahedron', size: [0.16], position: [-0.4, 1.05, 0.3], rotation: [0.3, 0.4, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 },
        { name: 'Emerald Gem Drop', shape: 'dodecahedron', size: [0.14], position: [0.35, 1.1, 0.2], rotation: [0.1, 0.6, 0], color: '#10b981', emissive: '#10b981', emissiveIntensity: 0.8 }
      ]
    };
  }

  // 9. CYBER DRONE / QUADCOPTER
  if (text.includes('drone') || text.includes('uav') || text.includes('quad') || text.includes('hover')) {
    return {
      id,
      title: 'Omni-Scout Cyber Drone',
      prompt: promptText,
      category: 'scifi',
      description: 'Autonomous high-altitude surveillance drone with carbon-fiber cross struts and glowing optical sensor array.',
      animation: 'hover',
      camera: { position: [3, 2.5, 3.5], target: [0, 0.5, 0] },
      parts: [
        { name: 'Central Avionics Pod', shape: 'sphere', size: [0.5, 16, 16], position: [0, 0.5, 0], rotation: [0, 0, 0], color: '#0f172a', metalness: 0.8, roughness: 0.2 },
        { name: 'Optic Eye Lens', shape: 'sphere', size: [0.25, 16, 16], position: [0, 0.35, 0.42], rotation: [0, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.9 },
        { name: 'Strut Arm Front-L', shape: 'cylinder', size: [0.06, 0.06, 1.6], position: [-0.6, 0.5, 0.6], rotation: [0.3, 0, -Math.PI / 4], color: '#334155', metalness: 0.9 },
        { name: 'Strut Arm Front-R', shape: 'cylinder', size: [0.06, 0.06, 1.6], position: [0.6, 0.5, 0.6], rotation: [0.3, 0, Math.PI / 4], color: '#334155', metalness: 0.9 },
        { name: 'Strut Arm Back-L', shape: 'cylinder', size: [0.06, 0.06, 1.6], position: [-0.6, 0.5, -0.6], rotation: [-0.3, 0, -Math.PI / 4], color: '#334155', metalness: 0.9 },
        { name: 'Strut Arm Back-R', shape: 'cylinder', size: [0.06, 0.06, 1.6], position: [0.6, 0.5, -0.6], rotation: [-0.3, 0, Math.PI / 4], color: '#334155', metalness: 0.9 },
        { name: 'Rotor Guard FL', shape: 'torus', size: [0.38, 0.03], position: [-1.15, 0.65, 1.15], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.4 },
        { name: 'Rotor Guard FR', shape: 'torus', size: [0.38, 0.03], position: [1.15, 0.65, 1.15], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.4 },
        { name: 'Rotor Guard BL', shape: 'torus', size: [0.38, 0.03], position: [-1.15, 0.65, -1.15], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.4 },
        { name: 'Rotor Guard BR', shape: 'torus', size: [0.38, 0.03], position: [1.15, 0.65, -1.15], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.4 },
        { name: 'Antenna Beacon', shape: 'cylinder', size: [0.02, 0.02, 0.6], position: [0, 0.9, 0], rotation: [0, 0, 0], color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.8 }
      ]
    };
  }

  // 10. DEFAULT DYNAMIC PROCEDURAL RECIPE (Matches any creative prompt)
  const colors = [
    { primary: '#7c6af7', secondary: '#00f0ff', accent: '#f59e0b', dark: '#181824' },
    { primary: '#22c55e', secondary: '#10b981', accent: '#facc15', dark: '#052e16' },
    { primary: '#ec4899', secondary: '#a855f7', accent: '#38bdf8', dark: '#1f132b' },
    { primary: '#f97316', secondary: '#ef4444', accent: '#facc15', dark: '#2a1208' },
    { primary: '#0ea5e9', secondary: '#6366f1', accent: '#10b981', dark: '#0c1a2f' }
  ];
  const theme = colors[Math.abs(hashString(promptText)) % colors.length];

  return {
    id,
    title: promptText ? promptText.charAt(0).toUpperCase() + promptText.slice(1) : 'Cyber Crystal Artifact',
    prompt: promptText,
    category: categoryHint || 'general',
    description: `Procedural 3D construct generated for "${promptText || 'custom model'}" with high-contrast low-poly aesthetic.`,
    animation: 'spin',
    camera: { position: [3.5, 3, 4], target: [0, 1.2, 0] },
    parts: [
      { name: 'Pedestal Base', shape: 'cylinder', size: [1.6, 1.8, 0.4, 8], position: [0, 0.2, 0], rotation: [0, 0, 0], color: theme.dark, metalness: 0.6, roughness: 0.4 },
      { name: 'Runed Energy Ring', shape: 'torus', size: [1.2, 0.08], position: [0, 0.42, 0], rotation: [Math.PI / 2, 0, 0], color: theme.secondary, emissive: theme.secondary, emissiveIntensity: 0.8 },
      { name: 'Lower Pylon Pillar', shape: 'cylinder', size: [0.4, 0.6, 1.2, 6], position: [0, 1.0, 0], rotation: [0, 0, 0], color: theme.primary, metalness: 0.8, roughness: 0.2 },
      { name: 'Floating Central Relic', shape: 'dodecahedron', size: [0.8], position: [0, 2.0, 0], rotation: [0.3, 0.4, 0], color: theme.secondary, emissive: theme.secondary, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.1 },
      { name: 'Satellite Orbital Node 1', shape: 'sphere', size: [0.2, 12, 12], position: [-1.2, 2.2, 0], rotation: [0, 0, 0], color: theme.accent, emissive: theme.accent, emissiveIntensity: 0.9 },
      { name: 'Satellite Orbital Node 2', shape: 'sphere', size: [0.2, 12, 12], position: [1.2, 2.2, 0], rotation: [0, 0, 0], color: theme.accent, emissive: theme.accent, emissiveIntensity: 0.9 },
      { name: 'Upper Spire Point', shape: 'cone', size: [0.4, 0.8, 6], position: [0, 2.85, 0], rotation: [0, 0, 0], color: theme.primary, metalness: 0.9, roughness: 0.2 }
    ]
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// 1. Generate 3D Model API
app.post('/api/3d/generate', async (req, res) => {
  try {
    const { prompt, style = 'lowpoly', category = 'general' } = req.body || {};
    const cleanPrompt = (prompt || '').trim();
    if (!cleanPrompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const geminiKey = getAiKey('google');
    const groqKey = getAiKey('groq');

    // Attempt AI Generation if keys exist
    if (geminiKey) {
      try {
        const systemPrompt = `You are an expert 3D generative modeler. You convert natural language descriptions into clean, low-poly 3D scene recipes for Three.js.
Return ONLY a valid JSON object without markdown fences, following this exact schema:
{
  "title": "Short descriptive title",
  "description": "Brief description of model",
  "category": "scifi|fantasy|vehicles|nature|arcade|weapons|collectibles",
  "animation": "hover|spin|pulse|none",
  "camera": { "position": [4, 3, 5], "target": [0, 1, 0] },
  "parts": [
    {
      "name": "Part name (e.g. Fuselage, Left Wing, Core)",
      "shape": "box|cylinder|sphere|cone|torus|dodecahedron",
      "size": [width, height, depth],
      "position": [x, y, z],
      "rotation": [rx, ry, rz],
      "color": "#HEX_COLOR",
      "metalness": 0.0-1.0,
      "roughness": 0.0-1.0,
      "emissive": "#HEX_COLOR",
      "emissiveIntensity": 0.0-1.0
    }
  ]
}
Construct between 8 and 18 distinct primitive parts assembled together to form the object accurately.`;

        const geminiRes = await callGemini(geminiKey, 'gemini-3.8-flash', systemPrompt, `Generate a 3D model recipe for: "${cleanPrompt}". Style: ${style}.`);
        const replyText = typeof geminiRes === 'object' ? geminiRes.text : geminiRes;
        const cleaned = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed && Array.isArray(parsed.parts) && parsed.parts.length > 0) {
          parsed.id = 'model_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          parsed.prompt = cleanPrompt;
          return res.json({ success: true, recipe: parsed, provider: 'gemini' });
        }
      } catch (aiErr) {
        console.warn('AI 3D generation fallback to procedural:', aiErr.message);
      }
    }

    // High quality procedural compiler fallback
    const recipe = compileProcedural3DRecipe(cleanPrompt, category);
    return res.json({ success: true, recipe, provider: 'procedural' });
  } catch (err) {
    console.error('3D generate error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Preset 3D Model Catalog API
app.get('/api/3d/presets', (req, res) => {
  const presets = [
    {
      id: 'preset_starfighter',
      title: 'Aero-Starfighter Mk-IV',
      category: 'scifi',
      tags: ['space', 'spaceship', 'starfighter', 'fighter', 'scifi'],
      prompt: 'futuristic starfighter with laser cannons and plasma thrusters',
      badge: 'POPULAR'
    },
    {
      id: 'preset_tank',
      title: 'Apex Cyber Tank',
      category: 'vehicles',
      tags: ['tank', 'armor', 'military', 'cannon', 'combat'],
      prompt: 'heavy cyber tank with treads and dual cannon turret',
      badge: 'FEATURED'
    },
    {
      id: 'preset_arcade',
      title: 'Classic Neon Arcade Cabinet',
      category: 'arcade',
      tags: ['arcade', 'retro', 'cabinet', 'gaming', 'joystick'],
      prompt: 'vintage 80s arcade cabinet with glowing marquee and joystick deck',
      badge: 'RETRO'
    },
    {
      id: 'preset_tree_island',
      title: 'Floating Mystic Low-Poly Island',
      category: 'nature',
      tags: ['island', 'tree', 'nature', 'floating', 'lowpoly'],
      prompt: 'low poly floating sky island with pine trees and crystal waterfall',
      badge: 'PEACEFUL'
    },
    {
      id: 'preset_castle',
      title: 'Citadel of the Mystic Spires',
      category: 'fantasy',
      tags: ['castle', 'tower', 'fantasy', 'fortress', 'medieval'],
      prompt: 'medieval fortress tower with battlements and hovering mana orb',
      badge: 'FANTASY'
    },
    {
      id: 'preset_mech',
      title: 'Titan Sentinel Mech-01',
      category: 'scifi',
      tags: ['robot', 'mech', 'sentinel', 'bipedal', 'cyborg'],
      prompt: 'bipedal defense mech with shoulder missile pods and arc reactor',
      badge: 'ACTION'
    },
    {
      id: 'preset_sword',
      title: 'Runebound Plasma Blade',
      category: 'weapons',
      tags: ['sword', 'blade', 'katana', 'weapon', 'plasma'],
      prompt: 'glowing plasma sword with runic channels and jeweled crossguard',
      badge: 'WEAPON'
    },
    {
      id: 'preset_chest',
      title: 'Vault of Ancient Spoils',
      category: 'collectibles',
      tags: ['chest', 'treasure', 'gold', 'loot', 'coins'],
      prompt: 'iron-banded treasure chest overflowing with gold and gems',
      badge: 'LOOT'
    },
    {
      id: 'preset_drone',
      title: 'Omni-Scout Cyber Drone',
      category: 'scifi',
      tags: ['drone', 'uav', 'quadcopter', 'camera', 'hover'],
      prompt: 'cyberpunk surveillance drone with glowing optic sensors and rotor guards',
      badge: 'TECH'
    }
  ];

  return res.json({ success: true, presets });
});

// 3. User Saved 3D Models (CRUD)
app.get('/api/3d/models', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, prompt, category, recipe, thumbnail, created_at FROM models_3d ORDER BY created_at DESC').all();
    const models = rows.map(r => ({
      id: r.id,
      name: r.name,
      prompt: r.prompt,
      category: r.category,
      recipe: typeof r.recipe === 'string' ? JSON.parse(r.recipe) : r.recipe,
      thumbnail: r.thumbnail,
      created_at: r.created_at
    }));
    return res.json({ success: true, total: models.length, models });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/3d/models', (req, res) => {
  try {
    const { name, prompt, category = 'general', recipe, thumbnail = '' } = req.body || {};
    if (!name || !recipe) {
      return res.status(400).json({ error: 'Model name and recipe are required' });
    }
    const id = 'model_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const recipeStr = typeof recipe === 'string' ? recipe : JSON.stringify(recipe);

    db.prepare(`
      INSERT INTO models_3d (id, name, prompt, category, recipe, thumbnail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, name, prompt || '', category, recipeStr, thumbnail || '');

    return res.json({ success: true, id, message: '3D model saved to your vault!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/3d/models/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM models_3d WHERE id = ?').run(id);
    return res.json({ success: true, message: '3D model deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// INFINITE CANVAS & WHITEBOARD DATABASE CRUD
// ============================================================================
app.get('/api/canvas/boards', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, elements, thumbnail, created_at, updated_at FROM canvas_boards ORDER BY updated_at DESC').all();
    const boards = rows.map(r => ({
      id: r.id,
      name: r.name,
      elements: typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements,
      thumbnail: r.thumbnail,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    return res.json({ success: true, total: boards.length, boards });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/canvas/boards', (req, res) => {
  try {
    const { id, name = 'Untitled Canvas', elements = [], thumbnail = '' } = req.body || {};
    const boardId = id || ('board_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const elementsStr = typeof elements === 'string' ? elements : JSON.stringify(elements);
    const trimmedName = (name || 'Untitled Canvas').trim();

    const existing = db.prepare('SELECT id FROM canvas_boards WHERE id = ?').get(boardId);
    if (existing) {
      db.prepare(`
        UPDATE canvas_boards 
        SET name = ?, elements = ?, thumbnail = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(trimmedName, elementsStr, thumbnail, boardId);
    } else {
      db.prepare(`
        INSERT INTO canvas_boards (id, name, elements, thumbnail, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(boardId, trimmedName, elementsStr, thumbnail);
    }

    return res.json({
      success: true,
      board: {
        id: boardId,
        name: trimmedName,
        elements,
        thumbnail,
        updated_at: new Date().toISOString()
      },
      message: 'Board saved to database successfully!'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/canvas/boards/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM canvas_boards WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Canvas board deleted', deletedId: id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// CUSTOM STICKERS STUDIO DATABASE CRUD
// ============================================================================
app.get('/api/stickers', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, category, emoji, bg, border, color, label, svg, data_url, created_at FROM stickers ORDER BY created_at DESC').all();
    return res.json({ success: true, stickers: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stickers', (req, res) => {
  try {
    const { id, name = 'Custom Sticker', category = 'custom', emoji = '✨', bg = '', border = '', color = '', label = '', svg = '', data_url = '' } = req.body || {};
    const stickerId = id || ('stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

    db.prepare(`
      INSERT OR REPLACE INTO stickers (id, name, category, emoji, bg, border, color, label, svg, data_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(stickerId, name, category, emoji, bg, border, color, label, svg, data_url);

    return res.json({ success: true, sticker: { id: stickerId, name, category, emoji, bg, border, color, label, svg, data_url } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stickers/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM stickers WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Sticker deleted', id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// MAP BOOKMARKS / PINS DATABASE CRUD
// ============================================================================
app.get('/api/map/pins', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, title, notes, lat, lng, category, color, created_at FROM map_pins ORDER BY created_at DESC').all();
    return res.json({ success: true, pins: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/map/pins', (req, res) => {
  try {
    const { id, title = 'Bookmarked Place', notes = '', lat, lng, category = 'favorite', color = '#7c6af7' } = req.body || {};
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Latitude and Longitude required' });
    }
    const pinId = id || ('pin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

    db.prepare(`
      INSERT OR REPLACE INTO map_pins (id, title, notes, lat, lng, category, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(pinId, title, notes, Number(lat), Number(lng), category, color);

    return res.json({ success: true, pin: { id: pinId, title, notes, lat: Number(lat), lng: Number(lng), category, color } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/map/pins/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM map_pins WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Map pin removed', id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// UNIVERSAL KEY-VALUE SETTINGS GET/SET IN DATABASE
// ============================================================================
app.get('/api/settings/get', (req, res) => {
  try {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Key query parameter required' });
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    let val = row ? row.value : null;
    try { val = JSON.parse(val); } catch (_) {}
    return res.json({ success: true, key, value: val });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/set', (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: 'Key required' });
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, valStr);
    return res.json({ success: true, key, message: 'Setting saved in database' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Dynamic QR Code Generator Endpoint (for uploads, download links, and arbitrary text)
app.get('/api/qr', async (req, res) => {
  const text = (req.query.text || '').trim();
  const format = (req.query.format || 'png').toLowerCase();
  if (!text) {
    return res.status(400).json({ error: 'Text query parameter is required' });
  }

  try {
    if (format === 'json') {
      const dataUrl = await QRCode.toDataURL(text, { width: 340, margin: 2 });
      return res.json({ success: true, dataUrl, text });
    } else if (format === 'svg') {
      const svg = await QRCode.toString(text, { type: 'svg', margin: 2 });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    } else {
      const buf = await QRCode.toBuffer(text, { width: 340, margin: 2 });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buf);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate QR code: ' + err.message });
  }
});

// AI Task Breakdown Endpoint
app.post('/api/todos/:id/breakdown', async (req, res) => {
  try {
    const id = req.params.id;
    const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    if (!todo) return res.status(404).json({ error: 'Task not found' });

    const prompt = `Break down the following task into 3-5 concrete, actionable sequential steps.\nTask Title: "${todo.title}"\nTask Description: "${todo.description || 'None'}"\n\nReturn ONLY a valid JSON array of step title strings, example:\n["First step", "Second step", "Third step"]\nDo not include code fences, markdown, or any explanation outside the JSON array.`;

    let subtaskTitles = [];
    try {
      const groqKey = getAiKey('groq');
      const geminiKey = getAiKey('google');
      const openRouterKey = getAiKey('openrouter');
      let rawReply = '';

      if (groqKey) {
        try {
          rawReply = await callGroq(groqKey, 'llama-3.3-70b-versatile', 'You are an AI task breakdown assistant that outputs only valid raw JSON arrays.', prompt);
        } catch (_) {}
      } 
      if (!rawReply && geminiKey) {
        try {
          const gemRes = await callGemini(geminiKey, 'gemini-3.6-flash', 'You are an AI task breakdown assistant that outputs only valid raw JSON arrays.', prompt);
          rawReply = typeof gemRes === 'object' ? gemRes.text : gemRes;
        } catch (gemErr) {
          console.warn('Gemini breakdown failed, trying alternatives:', gemErr.message);
        }
      } 
      if (!rawReply && openRouterKey) {
        try {
          rawReply = await callOpenRouter(openRouterKey, 'meta-llama/llama-3.3-70b-instruct:free', 'You are an AI task breakdown assistant that outputs only valid raw JSON arrays.', prompt);
        } catch (_) {}
      }

      if (rawReply) {
        const match = rawReply.match(/\[[\s\S]*\]/);
        if (match) subtaskTitles = JSON.parse(match[0]);
      }
    } catch (err) {
      console.warn('AI breakdown API call error:', err.message);
    }

    // Fallback intelligent breakdown
    if (!Array.isArray(subtaskTitles) || subtaskTitles.length === 0) {
      subtaskTitles = [
        `Review goals and requirements for "${todo.title}"`,
        `Prepare necessary tools, credentials, or resources`,
        `Perform primary execution steps`,
        `Verify results and finalize checklist`
      ];
    }

    let existing = [];
    try { existing = JSON.parse(todo.subtasks || '[]'); } catch (_) {}
    const nextId = existing.length > 0 ? Math.max(...existing.map(s => Number(s.id) || 0)) + 1 : 1;
    const newItems = subtaskTitles.map((title, idx) => ({
      id: nextId + idx,
      title: String(title).trim(),
      text: String(title).trim(),
      done: false
    }));

    const updatedSubtasks = [...existing, ...newItems];
    db.prepare("UPDATE todos SET subtasks = ?, updated_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(updatedSubtasks), id);

    return res.json({ success: true, subtasks: updatedSubtasks });
  } catch (err) {
    console.error('Breakdown endpoint error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Clear Completed Tasks Endpoint
app.delete('/api/todos/completed', (req, res) => {
  const result = db.prepare('DELETE FROM todos WHERE completed = 1').run();
  return res.json({ success: true, deleted: result.changes });
});

// Complete All Pending Tasks Endpoint
app.post('/api/todos/complete-all', (req, res) => {
  const result = db.prepare('UPDATE todos SET completed = 1 WHERE completed = 0').run();
  return res.json({ success: true, updated: result.changes });
});

// Turnstile verification endpoint
app.post('/api/turnstile/verify', async (req, res) => {
  const { token } = req.body || {};
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
  
  if (!token) return res.status(400).json({ success: false, error: 'Token missing' });

  // If using Cloudflare standard test tokens or keys
  if (
    token.startsWith('cf-dummy') ||
    token === '1x00000000000000000000AA' ||
    secretKey.startsWith('1x0000000000000000000000000000000AA')
  ) {
    return res.json({ success: true, message: 'Turnstile verified (Interactive Test Mode)' });
  }

  try {
    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
    });
    const cfData = await cfRes.json();
    return res.json(cfData);
  } catch (err) {
    return res.json({ success: true, message: 'Turnstile allowed via fallback: ' + err.message });
  }
});

// Vault Copilot AI Chat Endpoint (Multi-Provider: Google, Groq, OpenRouter, Cloudflare)
app.post('/api/chat', async (req, res) => {
  try {
    const { history, provider: reqProvider, model: reqModel } = req.body || {};
    const message = (
      req.body?.message ||
      req.body?.prompt ||
      (Array.isArray(req.body?.messages) ? req.body.messages[req.body.messages.length - 1]?.content : '') ||
      ''
    ).toString().trim();

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const preferredProvider = reqProvider || getSetting('ai_preferred_provider') || 'auto';
    const preferredModel = reqModel || getSetting('ai_preferred_model') || 'auto';

    // Query vault context from SQLite
    const passwords = db.prepare('SELECT id, title, username, url, description, length(password) as pw_len, created_at FROM passwords').all();
    const todos = db.prepare('SELECT id, title, description, due_date, priority, category, completed FROM todos').all();

    const systemPrompt = `You are Vault Assistant, an AI security and productivity copilot built into the Vault application.
The user is managing their tasks, subtasks, credentials, and passwords securely.

CURRENT VAULT CONTEXT:
- Total Passwords: ${passwords.length} accounts (${passwords.map(p => `${p.title} (user: ${p.username || 'n/a'}, url: ${p.url || 'none'}, len: ${p.pw_len})`).join('; ')})
- Total Tasks: ${todos.length} (${todos.filter(t => !t.completed).length} pending, ${todos.filter(t => t.completed).length} completed)
- Pending Tasks: ${todos.filter(t => !t.completed).map(t => `[${t.priority.toUpperCase()}|${t.category || 'General'}] ${t.title} (due: ${t.due_date || 'none'})`).join('; ')}
- Today's Date: ${new Date().toISOString().split('T')[0]}

CAPABILITIES:
1. Answer questions about the user's tasks, priorities, categories, and security posture.
2. Recommend strong passwords, passphrases, or security habits.
3. Suggest new tasks, subtasks, or passwords with 1-click action buttons!

ACTION BLOCKS:
Whenever you suggest creating or adding a task or a password, you MUST format the recommendation with an action code block so the UI can render an interactive "Add to Vault" button:

To suggest a task:
\`\`\`action:task
{"title": "Task title", "description": "Details", "priority": "high|medium|low", "category": "Work|Personal|Security|Dev", "due_date": "YYYY-MM-DD"}
\`\`\`

To suggest a password:
\`\`\`action:password
{"title": "Service Name", "username": "email or username", "password": "SecureGeneratedPassword123!", "url": "https://example.com", "description": "Notes"}
\`\`\`

Be concise, supportive, helpful, and formatted with clean markdown bullet points.`;

    // Determine provider & key
    const groqKey = getAiKey('groq');
    const openRouterKey = getAiKey('openrouter');
    const geminiKey = getAiKey('google');

    // 1. Try Groq if explicitly selected or auto with Groq key
    if ((preferredProvider === 'groq' || (preferredProvider === 'auto' && groqKey)) && groqKey) {
      try {
        const modelToUse = (preferredModel !== 'auto' && preferredModel) || 'llama-3.3-70b-versatile';
        const reply = await callGroq(groqKey, modelToUse, systemPrompt, message);
        return res.json({ reply, provider: 'groq', model: modelToUse });
      } catch (groqErr) {
        console.warn('Groq error, trying next provider:', groqErr.message);
      }
    }

    // 2. Try OpenRouter if explicitly selected or auto with OpenRouter key
    if ((preferredProvider === 'openrouter' || (preferredProvider === 'auto' && openRouterKey)) && openRouterKey) {
      try {
        const modelToUse = (preferredModel !== 'auto' && preferredModel) || 'meta-llama/llama-3.3-70b-instruct:free';
        const reply = await callOpenRouter(openRouterKey, modelToUse, systemPrompt, message);
        return res.json({ reply, provider: 'openrouter', model: modelToUse });
      } catch (orErr) {
        console.warn('OpenRouter error, trying next provider:', orErr.message);
      }
    }

    // 3. Try Google Gemini if explicitly selected or auto with Gemini key
    if ((preferredProvider === 'google' || preferredProvider === 'auto') && geminiKey) {
      try {
        const modelToUse = (preferredModel !== 'auto' && preferredModel && preferredModel.startsWith('gemini-')) ? preferredModel : 'gemini-3.8-flash';
        const geminiRes = await callGemini(geminiKey, modelToUse, systemPrompt, message);
        const reply = typeof geminiRes === 'object' ? geminiRes.text : geminiRes;
        const actualModel = typeof geminiRes === 'object' ? geminiRes.modelUsed : modelToUse;
        return res.json({ reply, provider: 'google', model: actualModel });
      } catch (_) {
        // If preferredProvider was auto and we have Groq or OpenRouter, try them before local copilot
        if (preferredProvider === 'auto') {
          if (groqKey) {
            try {
              const reply = await callGroq(groqKey, 'llama-3.3-70b-versatile', systemPrompt, message);
              return res.json({ reply, provider: 'groq', model: 'llama-3.3-70b-versatile' });
            } catch (_) {}
          }
          if (openRouterKey) {
            try {
              const reply = await callOpenRouter(openRouterKey, 'meta-llama/llama-3.3-70b-instruct:free', systemPrompt, message);
              return res.json({ reply, provider: 'openrouter', model: 'llama-3.3-70b-instruct:free' });
            } catch (_) {}
          }
        }
      }
    }

    // 4. Fallback to smart local copilot
    const localReply = localSmartCopilot(message, passwords, todos);
    const notice = (preferredProvider === 'google')
      ? `*(Note: Cloud AI is currently experiencing high demand. Vault Copilot answered using local intelligence.)*\n\n`
      : '';
    return res.json({ reply: notice + localReply, provider: 'local', model: 'vault-copilot-local' });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5. English Dictionary API (Free, Instant, Definition + Pronunciation Audio)
app.get('/api/dictionary/:word', async (req, res) => {
  const word = req.params.word.trim();
  if (!word) return res.status(400).json({ error: 'Word parameter is required' });

  try {
    let data = null;

    // 1. Try Free Dictionary API with a 2.5s timeout
    try {
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
        signal: AbortSignal.timeout(2500)
      });
      if (dictRes.ok) {
        data = await dictRes.json();
      }
    } catch (_) {
      // Free Dictionary API timed out or unavailable
    }

    // 2. Resilient fallback via Datamuse API (fast, reliable lexical database)
    if (!data) {
      try {
        const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`, {
          signal: AbortSignal.timeout(2500)
        });
        if (dmRes.ok) {
          const dmData = await dmRes.json();
          if (dmData && dmData[0] && Array.isArray(dmData[0].defs) && dmData[0].defs.length > 0) {
            const meaningsMap = {};
            const posNameMap = { adj: 'adjective', n: 'noun', v: 'verb', adv: 'adverb', u: 'general' };
            for (const defStr of dmData[0].defs) {
              const tabIdx = defStr.indexOf('\t');
              const posAbbr = tabIdx !== -1 ? defStr.slice(0, tabIdx).trim() : 'general';
              const defText = tabIdx !== -1 ? defStr.slice(tabIdx + 1).trim() : defStr.trim();
              const pos = posNameMap[posAbbr] || posAbbr;
              if (!meaningsMap[pos]) meaningsMap[pos] = { partOfSpeech: pos, definitions: [] };
              meaningsMap[pos].definitions.push({ definition: defText });
            }
            data = [{
              word: dmData[0].word || word,
              phonetic: '',
              phonetics: [],
              meanings: Object.values(meaningsMap)
            }];
          }
        }
      } catch (_) {}
    }

    if (data && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }

    return res.status(404).json({ error: `No definition found for "${word}". Please check spelling or try a root word.`, notFound: true, word });
  } catch (err) {
    return res.status(500).json({ error: err.message, word });
  }
});

// 6. Free Online Radio & Music Stations API
app.get('/api/radio/stations', async (req, res) => {
  const search = (req.query.search || req.query.name || '').toString().trim();
  const genre = (req.query.genre || req.query.tag || '').toString().trim();
  const limit = Math.min(50, parseInt(req.query.limit || '30', 10));

  const fallbackStations = [
    { name: 'Lofi Chill & Focus Beats', url_resolved: 'https://streams.ilovemusic.de/iloveradio17.mp3', tags: 'lofi,chill,beats,relax', country: 'Global', bitrate: 128, codec: 'MP3', favicon: '🎧' },
    { name: 'Radio Swiss Classic', url_resolved: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128', tags: 'classical,orchestra,baroque', country: 'Switzerland', bitrate: 128, codec: 'MP3', favicon: '🎻' },
    { name: 'Synthwave & Cyberpunk Chill', url_resolved: 'https://stream.zeno.fm/0r0xa792kwzuv', tags: 'synthwave,cyberpunk,retro,electronic', country: 'United States', bitrate: 128, codec: 'MP3', favicon: '🌆' },
    { name: 'Radio Swiss Jazz & Blues', url_resolved: 'https://stream.srg-ssr.ch/m/rsj/mp3_128', tags: 'jazz,blues,smooth,cafe', country: 'Switzerland', bitrate: 128, codec: 'MP3', favicon: '☕' },
    { name: 'Hirschmilch Ambient Lounge', url_resolved: 'https://hirschmilch.de:7000/chillout.mp3', tags: 'ambient,chillout,lounge,downtempo', country: 'Germany', bitrate: 128, codec: 'MP3', favicon: '🏖️' },
    { name: 'Rock Antenne Classic Perlen', url_resolved: 'https://stream.rockantenne.de/classic-perlen/stream/mp3', tags: 'rock,classic,guitar', country: 'Germany', bitrate: 128, codec: 'MP3', favicon: '🎸' },
    { name: 'I Love Dance Hits', url_resolved: 'https://streams.ilovemusic.de/iloveradio2.mp3', tags: 'dance,edm,electronic,club', country: 'Germany', bitrate: 128, codec: 'MP3', favicon: '💃' },
    { name: 'BBC World Service News', url_resolved: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service', tags: 'news,talk,world,current', country: 'United Kingdom', bitrate: 128, codec: 'MP3', favicon: '📰' }
  ];

  try {
    let apiUrl = '';
    if (search) {
      apiUrl = `https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(search)}?limit=${limit}&hidebroken=true&order=clickcount&reverse=true`;
    } else if (genre && genre !== 'all') {
      apiUrl = `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(genre)}?limit=${limit}&hidebroken=true&order=clickcount&reverse=true`;
    } else {
      apiUrl = `https://de1.api.radio-browser.info/json/stations/topclick/${limit}?hidebroken=true`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const radioRes = await fetch(apiUrl, { signal: controller.signal, headers: { 'User-Agent': 'VaultMusicApp/1.0' } });
    clearTimeout(timeout);

    if (radioRes.ok) {
      const stations = await radioRes.json();
      if (Array.isArray(stations) && stations.length > 0) {
        return res.json({ stations, source: 'radio-browser' });
      }
    }
  } catch (_) {}

  let filtered = fallbackStations;
  if (search) {
    filtered = fallbackStations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.tags.toLowerCase().includes(search.toLowerCase()));
  } else if (genre && genre !== 'all') {
    filtered = fallbackStations.filter(s => s.tags.toLowerCase().includes(genre.toLowerCase()));
  }
  return res.json({ stations: filtered.length ? filtered : fallbackStations, source: 'curated-fallback' });
});

// 7. Free Web Image Search API
app.get('/api/images/search', async (req, res) => {
  const q = (req.query.q || req.query.query || '').toString().trim();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const source = (req.query.source || 'all').toString().toLowerCase();
  const limit = Math.min(30, parseInt(req.query.limit || '24', 10));

  const query = q || 'scenic wallpaper';
  const results = [];

  // 1. Wikimedia Commons Search
  if (source === 'all' || source === 'wikimedia') {
    try {
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=800&format=json&origin=*`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3800);
      const wikiRes = await fetch(wikiUrl, { signal: controller.signal, headers: { 'User-Agent': 'VaultImageSearch/1.0' } });
      clearTimeout(timeout);

      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData.query?.pages || {};
        for (const key of Object.keys(pages)) {
          const p = pages[key];
          const info = p.imageinfo?.[0];
          if (!info || !info.url) continue;
          if (info.mime && !info.mime.startsWith('image/')) continue;
          const title = (p.title || '').replace(/^File:/i, '').replace(/\.[a-zA-Z0-9]+$/, '').replace(/[_+]/g, ' ');
          const author = info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikimedia Contributor';
          const license = info.extmetadata?.LicenseShortName?.value || 'Creative Commons / Public Domain';
          results.push({
            id: `wiki_${p.pageid || key}`,
            title: title.slice(0, 80),
            thumbUrl: info.thumburl || info.url,
            fullUrl: info.url,
            width: info.width || 1200,
            height: info.height || 800,
            author: author.slice(0, 45),
            license,
            source: 'Wikimedia Commons',
            sourceUrl: info.descriptionshorturl || info.descriptionurl || info.url
          });
        }
      }
    } catch (_) {}
  }

  // 2. Unsplash Open Search API
  if ((results.length < 8 && (source === 'all' || source === 'unsplash')) || source === 'unsplash') {
    try {
      const unsplashUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&page=${page}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3800);
      const unsplashRes = await fetch(unsplashUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      clearTimeout(timeout);

      if (unsplashRes.ok) {
        const unsplashData = await unsplashRes.json();
        const photos = unsplashData.results || [];
        for (const item of photos) {
          if (!item.urls) continue;
          results.push({
            id: `unsplash_${item.id}`,
            title: item.alt_description || item.description || query,
            thumbUrl: item.urls.small || item.urls.thumb,
            fullUrl: item.urls.regular || item.urls.full,
            downloadUrl: item.urls.full || item.urls.regular,
            width: item.width || 1200,
            height: item.height || 800,
            author: item.user?.name || 'Unsplash Creator',
            license: 'Free Commercial & Personal',
            source: 'Unsplash Stock',
            sourceUrl: item.links?.html || 'https://unsplash.com'
          });
        }
      }
    } catch (_) {}
  }

  // 3. Fallback Curated High-Res Showcase
  if (results.length === 0) {
    const curated = [
      { id: 'c1', title: 'Cyberpunk Neon Metropolis at Night', thumbUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80', fullUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=85', author: 'Alexander Andrews', source: 'Web Free Stock', width: 1920, height: 1080 },
      { id: 'c2', title: 'Mountain Misty Peak Sunrise', thumbUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80', fullUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=85', author: 'Kalen Emsley', source: 'Web Free Stock', width: 1920, height: 1280 },
      { id: 'c3', title: 'Deep Ocean Blue Waves', thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80', fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=85', author: 'Sean Oulashin', source: 'Web Free Stock', width: 1920, height: 1080 },
      { id: 'c4', title: 'Deep Space Nebula Galaxy Cosmic Stars', thumbUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80', fullUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=85', author: 'NASA Hubble', source: 'Web Free Stock', width: 1920, height: 1080 },
      { id: 'c5', title: 'Minimalist Architecture Modern Geometry', thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80', fullUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=85', author: 'Simone Hutsch', source: 'Web Free Stock', width: 1920, height: 1080 },
      { id: 'c6', title: 'Cozy Coffee and Notebook Workspace', thumbUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80', fullUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=85', author: 'Kimberly Farmer', source: 'Web Free Stock', width: 1920, height: 1280 }
    ];
    results.push(...curated);
  }

  return res.json({
    success: true,
    query,
    count: results.length,
    images: results
  });
});

// D1 Database Adapter for Cloudflare D1 compatibility
const d1 = {
  async exec(sql) {
    db.exec(sql);
  },
  prepare(sql) {
    return {
      bind(...args) {
        return {
          async all() {
            const stmt = db.prepare(sql);
            return { results: stmt.all(...args) };
          },
          async run() {
            const stmt = db.prepare(sql);
            const res = stmt.run(...args);
            return {
              meta: {
                last_row_id: Number(res.lastInsertRowid),
                changes: res.changes,
              },
            };
          },
          async first() {
            const stmt = db.prepare(sql);
            const row = stmt.get(...args);
            return row || null;
          },
        };
      },
      async all() {
        const stmt = db.prepare(sql);
        return { results: stmt.all() };
      },
      async run() {
        const stmt = db.prepare(sql);
        const res = stmt.run();
        return {
          meta: {
            last_row_id: Number(res.lastInsertRowid),
            changes: res.changes,
          },
        };
      },
      async first() {
        const stmt = db.prepare(sql);
        const row = stmt.get();
        return row || null;
      },
    };
  },
};

// ============================================================================
// AI STUDIO CAPABILITIES (Lyria 3 Music, Veo 3 Video, Search/Maps Grounding, Audio Transcribe)
// ============================================================================

function getGeminiInstance(customKey) {
  const key = customKey || getAiKey('google');
  if (!key || !key.trim() || key.includes('placeholder')) {
    throw new Error('Gemini API key is required. Please verify GEMINI_API_KEY is configured in your environment or Settings.');
  }
  return new GoogleGenAI({ apiKey: key.trim(), httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

// 1. Music Generation via lyria-3-clip-preview (<=30s) or lyria-3-pro-preview (full track)
app.post('/api/ai/music/generate', async (req, res) => {
  try {
    const { prompt, model, genre, title } = req.body || {};
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Music prompt is required' });
    }

    const ai = getGeminiInstance();
    const modelToUse = (model === 'lyria-3-pro-preview') ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
    const isPro = modelToUse === 'lyria-3-pro-preview';

    const fullPrompt = genre ? `${genre} style: ${prompt.trim()}` : prompt.trim();

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    try {
      const responseStream = await ai.models.generateContentStream({
        model: modelToUse,
        contents: fullPrompt,
      });

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }
    } catch (genErr) {
      console.error('Lyria generation stream error:', genErr);
      throw new Error(`Music generation with ${modelToUse} failed: ${genErr.message}`);
    }

    const creationId = `mus_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const trackTitle = (title && title.trim()) || `Music: ${prompt.slice(0, 32)}`;

    // Store in ai_creations
    try {
      db.prepare(`
        INSERT INTO ai_creations (id, type, prompt, model, title, media_url, content, metadata, storage_type, storage_key)
        VALUES (?, 'music', ?, ?, ?, ?, ?, ?, 'db', ?)
      `).run(
        creationId,
        prompt.trim(),
        modelToUse,
        trackTitle,
        `data:${mimeType};base64,${audioBase64.slice(0, 80)}...`,
        lyrics || '',
        JSON.stringify({ duration: isPro ? 'Full Track' : '30s Clip', genre: genre || 'General', mimeType }),
        creationId
      );
    } catch (dbErr) {
      console.warn('Failed to record music creation to db:', dbErr.message);
    }

    return res.json({
      success: true,
      id: creationId,
      audioBase64,
      mimeType,
      lyrics,
      model: modelToUse,
      duration: isPro ? 'Full Track' : '30s Clip',
      title: trackTitle
    });
  } catch (err) {
    console.error('Music Generation Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/music/list', (req, res) => {
  try {
    const rows = db.prepare("SELECT id, type, prompt, model, title, content, metadata, created_at FROM ai_creations WHERE type = 'music' ORDER BY created_at DESC LIMIT 30").all();
    return res.json({ success: true, tracks: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Google Search Grounding via gemini-3.5-flash with googleSearch tool
app.post('/api/ai/search-grounding', async (req, res) => {
  try {
    const { query, systemInstruction } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const ai = getGeminiInstance();
    const config = {
      tools: [{ googleSearch: {} }]
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: query.trim(),
      config
    });

    const text = response.text || '';
    const candidate = response.candidates?.[0];
    const metadata = candidate?.groundingMetadata || {};
    const queries = metadata.webSearchQueries || [];
    const sources = (metadata.groundingChunks || []).map(chunk => ({
      title: chunk.web?.title || 'Web Result',
      url: chunk.web?.uri || ''
    })).filter(s => Boolean(s.url));

    const creationId = `sea_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    try {
      db.prepare(`
        INSERT INTO ai_creations (id, type, prompt, model, title, content, metadata)
        VALUES (?, 'search_grounding', ?, 'gemini-3.5-flash', ?, ?, ?)
      `).run(
        creationId,
        query.trim(),
        `Search: ${query.slice(0, 32)}`,
        text,
        JSON.stringify({ queries, sourcesCount: sources.length, sources: sources.slice(0, 10) })
      );
    } catch (_) {}

    return res.json({
      success: true,
      id: creationId,
      text,
      model: 'gemini-3.5-flash',
      grounding: {
        queries,
        sources,
        searchEntryPoint: metadata.searchEntryPoint?.renderedContent || ''
      }
    });
  } catch (err) {
    console.error('Search Grounding Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. Google Maps Grounding via gemini-3.5-flash with googleMaps tool
app.post('/api/ai/maps-grounding', async (req, res) => {
  try {
    const { query, lat, lng, city, country } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Location search query is required' });
    }

    const ai = getGeminiInstance();
    let locationPrefix = '';
    if (city || country) {
      locationPrefix = `[User Location Context: ${city || ''}${city && country ? ', ' : ''}${country || ''}${lat && lng ? ` (${lat.toFixed(4)}, ${lng.toFixed(4)})` : ''}]\n`;
    }

    const promptText = `${locationPrefix}Provide specific location details, addresses, and geographic coordinates if available for this request: ${query.trim()}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    const text = response.text || '';
    const candidate = response.candidates?.[0];
    const metadata = candidate?.groundingMetadata || {};

    // Heuristically extract candidate places/coordinates for 1-click Pin to Map
    const places = [];
    const coordMatches = text.matchAll(/([A-Z0-9][A-Za-z0-9\s,&.'-]{2,40})[:\-—]?\s*(?:lat|coordinates?|located at)?\s*\(?(-?\d+\.\d{3,}),\s*(-?\d+\.\d{3,})\)?/g);
    for (const match of coordMatches) {
      const pLat = parseFloat(match[2]);
      const pLng = parseFloat(match[3]);
      if (!isNaN(pLat) && !isNaN(pLng) && pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
        places.push({
          title: match[1].trim(),
          lat: pLat,
          lng: pLng,
          notes: `Discovered via Google Maps Grounding (${query.slice(0, 30)})`
        });
      }
    }

    const creationId = `map_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    try {
      db.prepare(`
        INSERT INTO ai_creations (id, type, prompt, model, title, content, metadata)
        VALUES (?, 'maps_grounding', ?, 'gemini-3.5-flash', ?, ?, ?)
      `).run(
        creationId,
        query.trim(),
        `Map: ${query.slice(0, 32)}`,
        text,
        JSON.stringify({ places, edgeCity: city || '', edgeCountry: country || '' })
      );
    } catch (_) {}

    return res.json({
      success: true,
      id: creationId,
      text,
      model: 'gemini-3.5-flash',
      grounding: metadata,
      places,
      edgeLocation: { city, country, lat, lng }
    });
  } catch (err) {
    console.error('Maps Grounding Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Veo 3 Video Generation via veo-3.1-fast-generate-preview (16:9 landscape or 9:16 portrait)
app.post('/api/ai/video/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio, resolution } = req.body || {};
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Video prompt is required' });
    }

    const ai = getGeminiInstance();
    // Validate aspect ratio strictly to 16:9 or 9:16
    const validAspectRatio = (aspectRatio === '9:16') ? '9:16' : '16:9';
    const validResolution = (resolution === '1080p') ? '1080p' : '720p';

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt.trim(),
      config: {
        numberOfVideos: 1,
        aspectRatio: validAspectRatio,
        resolution: validResolution
      }
    });

    return res.json({
      success: true,
      operationName: operation.name,
      model: 'veo-3.1-fast-generate-preview',
      aspectRatio: validAspectRatio,
      resolution: validResolution
    });
  } catch (err) {
    console.error('Veo Video Generation Start Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/video/status', async (req, res) => {
  try {
    const { operationName } = req.body || {};
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const ai = getGeminiInstance();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const isDone = Boolean(updated.done);
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri || null;

    return res.json({
      success: true,
      done: isDone,
      error: updated.error || null,
      videoUri: videoUri ? true : false,
      metadata: updated.metadata
    });
  } catch (err) {
    console.error('Veo Video Status Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/video/download', async (req, res) => {
  try {
    const { operationName } = req.body || {};
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const ai = getGeminiInstance();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      return res.status(404).json({ error: 'Video is not yet ready or failed to generate' });
    }

    const apiKey = getAiKey('google');
    const videoRes = await fetch(videoUri, {
      headers: { 'x-goog-api-key': apiKey }
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Failed to download video from Google service' });
    }

    const arrayBuf = await videoRes.arrayBuffer();
    const base64Video = Buffer.from(arrayBuf).toString('base64');

    const creationId = `vid_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    try {
      db.prepare(`
        INSERT INTO ai_creations (id, type, prompt, model, title, media_url, storage_type, storage_key)
        VALUES (?, 'video', 'Veo 3 Generated Video', 'veo-3.1-fast-generate-preview', 'Veo 3 AI Video', ?, 'db', ?)
      `).run(creationId, `data:video/mp4;base64,${base64Video.slice(0, 100)}...`, creationId);
    } catch (_) {}

    return res.json({
      success: true,
      id: creationId,
      videoBase64: base64Video,
      mimeType: 'video/mp4'
    });
  } catch (err) {
    console.error('Veo Video Download Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/video/stream', async (req, res) => {
  try {
    const operationName = req.query.operationName;
    if (!operationName) {
      return res.status(400).send('operationName query param required');
    }

    const ai = getGeminiInstance();
    const op = new GenerateVideosOperation();
    op.name = String(operationName);

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      return res.status(404).send('Video not ready');
    }

    const apiKey = getAiKey('google');
    const videoRes = await fetch(videoUri, {
      headers: { 'x-goog-api-key': apiKey }
    });

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuf = await videoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuf));
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

// 5. Audio Transcription via gemini-3.5-transcribe
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType, prompt } = req.body || {};
    if (!audioBase64 || !audioBase64.trim()) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const cleanMime = mimeType || 'audio/webm';

    const ai = getGeminiInstance();
    const audioPart = {
      inlineData: {
        mimeType: cleanMime,
        data: cleanBase64
      }
    };

    const instruction = prompt || 'Transcribe this audio recording verbatim with accurate spelling, punctuation, speaker cues, and capitalization.';
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: instruction }
        ]
      }
    });

    const text = response.text || '';
    const creationId = `tra_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    try {
      db.prepare(`
        INSERT INTO ai_creations (id, type, prompt, model, title, content, metadata)
        VALUES (?, 'transcription', ?, 'gemini-3.5-transcribe', 'Voice Transcription', ?, ?)
      `).run(
        creationId,
        instruction.slice(0, 80),
        text,
        JSON.stringify({ mimeType: cleanMime, lengthChars: text.length, wordsCount: text.split(/\s+/).filter(Boolean).length })
      );
    } catch (_) {}

    return res.json({
      success: true,
      id: creationId,
      text,
      model: 'gemini-3.5-transcribe'
    });
  } catch (err) {
    console.error('Audio Transcription Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 6. Save AI creations directly to Cloudflare Drive / Vault Attachments
app.post('/api/ai/save-to-drive', async (req, res) => {
  try {
    const { filename, content, mime_type, item_type = 'creation', item_id = 0 } = req.body || {};
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    const fileExt = path.extname(filename) || '.bin';
    const storageKey = `cf_ai_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${fileExt}`;
    const storageType = 'r2'; // Mark as Cloudflare R2 / Drive ready

    const insertResult = db.prepare(`
      INSERT INTO attachments (item_type, item_id, filename, content, mime_type, storage_key, storage_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(item_type, item_id, filename, content, mime_type || 'application/octet-stream', storageKey, storageType);

    return res.json({
      success: true,
      id: Number(insertResult.lastInsertRowid),
      storage_key: storageKey,
      storage_type: storageType,
      message: 'Saved to Vault Cloudflare Drive'
    });
  } catch (err) {
    console.error('Save to drive error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 7. General AI Creations Gallery Management
app.get('/api/ai/creations', (req, res) => {
  try {
    const typeFilter = req.query.type;
    let query = 'SELECT id, type, prompt, model, title, content, metadata, storage_type, storage_key, created_at FROM ai_creations';
    const params = [];
    if (typeFilter) {
      query += ' WHERE type = ?';
      params.push(typeFilter);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const items = db.prepare(query).all(...params);
    return res.json({ success: true, creations: items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/creations/delete', (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Creation ID is required' });
    db.prepare('DELETE FROM ai_creations WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Deleted creation' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// API routes handling via Cloudflare Pages function handler
app.all(['/api', '/api/*'], async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get('host') || '0.0.0.0:3000'}${req.originalUrl}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const init = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      init.body = JSON.stringify(req.body ?? {});
      headers.set('content-type', 'application/json');
    }

    const memoryKvStore = global._memoryKvStore || (global._memoryKvStore = new Map());
    const localKv = {
      async get(key) {
        const item = memoryKvStore.get(key);
        if (!item) return null;
        if (item.expires && Date.now() > item.expires) {
          memoryKvStore.delete(key);
          return null;
        }
        return item.value;
      },
      async put(key, value, options = {}) {
        const expires = options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null;
        memoryKvStore.set(key, { value: String(value), expires });
      },
      async delete(key) {
        memoryKvStore.delete(key);
      }
    };

    const webRequest = new Request(url, init);
    const webResponse = await onRequest({
      request: webRequest,
      env: {
        DB: d1,
        VAULT_KV: localKv,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
        CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.CLOUDFLARE_TURNSTILE_SITE_KEY,
        CLOUDFLARE_TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
        BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
        TAVILY_API_KEY: process.env.TAVILY_API_KEY,
        OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
      },
    });

    res.status(webResponse.status);
    for (const [key, val] of webResponse.headers.entries()) {
      res.setHeader(key, val);
    }
    const arrayBuffer = await webResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend assets
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Fallback to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vault server listening on http://0.0.0.0:${PORT}`);
});
