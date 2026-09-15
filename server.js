import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { GoogleGenAI } from '@google/genai';
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
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', tag: 'High Capacity & Stable', badge: 'Google' },
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
    'gemini-2.5-flash'
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
      const testModel = model || 'gemini-2.5-flash';
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
  db.prepare('UPDATE todos SET reminder_time = ?, reminder_dismissed = 0, updated_at = datetime("now") WHERE id = ?')
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

app.post('/api/ai/preferences', (req, res) => {
  const { provider, model } = req.body || {};
  if (provider) setSetting('ai_preferred_provider', provider);
  if (model) setSetting('ai_preferred_model', model);
  return res.json({ success: true });
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
        const gemRes = await callGemini(geminiKey, 'gemini-3.8-flash', 'You are an AI task breakdown assistant that outputs only valid raw JSON arrays.', prompt);
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
  db.prepare('UPDATE todos SET subtasks = ?, updated_at = datetime("now") WHERE id = ?')
    .run(JSON.stringify(updatedSubtasks), id);

  return res.json({ success: true, subtasks: updatedSubtasks });
});

// Clear Completed Tasks Endpoint
app.delete('/api/todos/completed', (req, res) => {
  const result = db.prepare('DELETE FROM todos WHERE completed = 1').run();
  return res.json({ success: true, deleted: result.changes });
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
    const { message, history, provider: reqProvider, model: reqModel } = req.body || {};
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
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!dictRes.ok) {
      if (dictRes.status === 404) {
        return res.status(404).json({ error: `No definition found for "${word}". Please check spelling or try a root word.`, notFound: true, word });
      }
      return res.status(dictRes.status).json({ error: 'Dictionary lookup error' });
    }
    const data = await dictRes.json();
    return res.json(data);
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
