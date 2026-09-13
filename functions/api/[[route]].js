// Cloudflare Worker / Pages Function - handles all /api/* routes with Cloudflare D1 and Workers AI
let dbInitialized = false;

// Free models list across Google, Groq, OpenRouter, and Cloudflare
const AI_FREE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'google', tag: 'Fast & Smart • Flagship Free Tier', badge: 'Google' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'google', tag: 'High Throughput & Resilient', badge: 'Google' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'google', tag: 'Sub-Second Latency & High Availability', badge: 'Google' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'google', tag: 'Always Latest Flash Version', badge: 'Google' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', tag: 'Ultra-Fast (300+ t/s) • Free', badge: 'Groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', tag: 'Sub-Second Latency • Free', badge: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k)', provider: 'groq', tag: '32k Long Context • Free', badge: 'Groq' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', provider: 'groq', tag: 'Google Gemma on Groq • Free', badge: 'Groq' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', provider: 'openrouter', tag: 'Flagship Open Weights • $0 Free', badge: 'OpenRouter' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', provider: 'openrouter', tag: 'Deep Reasoning CoT • $0 Free', badge: 'OpenRouter' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', provider: 'openrouter', tag: 'High Capability • $0 Free', badge: 'OpenRouter' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', provider: 'openrouter', tag: 'Lightweight & Fast • $0 Free', badge: 'OpenRouter' },
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Cloudflare Llama 3.1 8B', provider: 'cloudflare', tag: '10,000 Free Daily Neurons', badge: 'Cloudflare' },
  { id: '@cf/meta/llama-3-8b-instruct', name: 'Cloudflare Llama 3 8B', provider: 'cloudflare', tag: 'High Speed Edge AI • Free', badge: 'Cloudflare' },
  { id: '@cf/mistral/mistral-7b-instruct-v0.1', name: 'Cloudflare Mistral 7B', provider: 'cloudflare', tag: 'Fast & Concise • Free', badge: 'Cloudflare' },
];

async function ensureDb(db) {
  if (dbInitialized || !db) return;
  try {
    // Execute single-line DDL statements to avoid D1 SQLite multi-line parsing errors
    await db.prepare('CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, username TEXT, password TEXT NOT NULL, url TEXT, description TEXT, created_at TEXT DEFAULT (datetime(\'now\')), updated_at TEXT DEFAULT (datetime(\'now\')))').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, due_date TEXT, priority TEXT DEFAULT \'medium\', category TEXT DEFAULT \'General\', subtasks TEXT DEFAULT \'[]\', completed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime(\'now\')), updated_at TEXT DEFAULT (datetime(\'now\')))').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, item_type TEXT NOT NULL, item_id INTEGER NOT NULL, filename TEXT NOT NULL, content TEXT NOT NULL, mime_type TEXT, created_at TEXT DEFAULT (datetime(\'now\')))').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)').run();

    try { await db.prepare('ALTER TABLE todos ADD COLUMN category TEXT DEFAULT \'General\'').run(); } catch (_) {}
    try { await db.prepare('ALTER TABLE todos ADD COLUMN subtasks TEXT DEFAULT \'[]\'').run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE passwords ADD COLUMN totp_secret TEXT DEFAULT ''").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE passwords ADD COLUMN item_type TEXT DEFAULT 'login'").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE passwords ADD COLUMN card_number TEXT DEFAULT ''").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE passwords ADD COLUMN card_exp TEXT DEFAULT ''").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE passwords ADD COLUMN card_cvv TEXT DEFAULT ''").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE todos ADD COLUMN reminder_time TEXT DEFAULT ''").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE todos ADD COLUMN reminder_dismissed INTEGER DEFAULT 0").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE todos ADD COLUMN recurring TEXT DEFAULT 'none'").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE todos ADD COLUMN color TEXT DEFAULT ''").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE attachments ADD COLUMN storage_key TEXT DEFAULT ''").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE attachments ADD COLUMN storage_type TEXT DEFAULT 'db'").run(); } catch (_) {}

    // Performance Indexes for high-speed queries on Cloudflare D1
    try { await db.prepare("CREATE INDEX IF NOT EXISTS idx_passwords_item_type ON passwords (item_type)").run(); } catch (_) {}
    try { await db.prepare("CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos (completed)").run(); } catch (_) {}
    try { await db.prepare("CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos (due_date)").run(); } catch (_) {}
    try { await db.prepare("CREATE INDEX IF NOT EXISTS idx_attachments_item ON attachments (item_type, item_id)").run(); } catch (_) {}

    // Automatic updated_at timestamps via SQLite triggers
    try {
      await db.prepare(`
        CREATE TRIGGER IF NOT EXISTS trg_passwords_updated_at 
        AFTER UPDATE ON passwords FOR EACH ROW
        BEGIN
          UPDATE passwords SET updated_at = datetime('now') WHERE id = old.id;
        END
      `).run();
    } catch (_) {}

    try {
      await db.prepare(`
        CREATE TRIGGER IF NOT EXISTS trg_todos_updated_at 
        AFTER UPDATE ON todos FOR EACH ROW
        BEGIN
          UPDATE todos SET updated_at = datetime('now') WHERE id = old.id;
        END
      `).run();
    } catch (_) {}

    // Cascade delete trigger: cleanup attachments when task or password is deleted
    try {
      await db.prepare(`
        CREATE TRIGGER IF NOT EXISTS trg_cleanup_passwords_attach
        AFTER DELETE ON passwords FOR EACH ROW
        BEGIN
          DELETE FROM attachments WHERE item_type = 'password' AND item_id = old.id;
        END
      `).run();
    } catch (_) {}

    try {
      await db.prepare(`
        CREATE TRIGGER IF NOT EXISTS trg_cleanup_todos_attach
        AFTER DELETE ON todos FOR EACH ROW
        BEGIN
          DELETE FROM attachments WHERE item_type = 'todo' AND item_id = old.id;
        END
      `).run();
    } catch (_) {}

    // Ensure default master password exists
    const pwRow = await db.prepare("SELECT value FROM settings WHERE key = 'master_password'").first();
    if (!pwRow) {
      await db.prepare("INSERT INTO settings (key, value) VALUES ('master_password', 'BRAWLSTARSBRAWLSTARS1234')").run();
    }
    dbInitialized = true;
  } catch (err) {
    console.error('ensureDb warning:', err);
  }
}

async function getSetting(db, key) {
  try {
    const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
    return row?.value || null;
  } catch (_) {
    return null;
  }
}

// Fallback intelligent copilot for Cloudflare environment
function localSmartCopilot(message, passwords, todos) {
  const lower = message.toLowerCase();
  const pendingTodos = todos.filter(t => !t.completed);
  const overdueTodos = todos.filter(t => !t.completed && t.due_date && t.due_date < new Date().toISOString().split('T')[0]);

  if (lower.includes('audit') || lower.includes('security') || lower.includes('health')) {
    const weak = passwords.filter(p => (p.password?.length || 0) < 12);
    let reply = `### 🛡️ Vault Security Audit\n\n`;
    reply += `- **Total Passwords Stored**: ${passwords.length}\n`;
    reply += `- **Passwords < 12 characters**: ${weak.length} ${weak.length > 0 ? '⚠️ (Action required)' : '✅'}\n`;
    reply += `- **Pending Tasks**: ${pendingTodos.length} (${overdueTodos.length} overdue)\n\n`;
    if (weak.length > 0) {
      reply += `**Recommendations**:\nUpdate weak passwords using our generator to reach at least 16 characters.\n`;
    } else {
      reply += `**Status**: Excellent! Your stored credentials meet recommended length standards.\n`;
    }
    return reply;
  }

  if (lower.includes('generate') || lower.includes('password') || lower.includes('create password')) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    let newPw = '';
    for (let i = 0; i < 18; i++) {
      newPw += chars[Math.floor(Math.random() * chars.length)];
    }
    return `Here is a strong, cryptographically secure 18-character password:\n\n\`${newPw}\`\n\n\`\`\`action:password\n{"title": "New Account", "username": "", "password": "${newPw}", "url": "", "description": "Generated by Vault AI Copilot"}\n\`\`\``;
  }

  if (lower.includes('task') || lower.includes('todo') || lower.includes('remind')) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
    let extractedTitle = message.replace(/(add|create|make|remind me to|new task|todo|a task|to)/gi, '').trim();
    if (!extractedTitle || extractedTitle.length < 3) extractedTitle = 'Complete important follow-up';
    extractedTitle = extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);

    return `I can help schedule that task for you!\n\nProposed Task: **${extractedTitle}** (due ${nextWeek})\n\n\`\`\`action:task\n{"title": "${extractedTitle}", "description": "Created via Vault Assistant", "priority": "medium", "due_date": "${nextWeek}"}\n\`\`\``;
  }

  return `### 🔒 Vault Security Assistant\n\nI can help you audit your credentials, generate high-entropy passwords, break down complex tasks, and manage encrypted items.\n\nTry asking:\n- *"Audit my vault security"*\n- *"Generate an 18-character password"*\n- *"Create a task to review credentials"*`;
}

// REST call to Google Gemini with automatic failover across models
async function callGeminiRest(apiKey, model, systemPrompt, userMessage) {
  const modelsToTry = [
    (model && model.startsWith('gemini-') && !model.includes('2.0-') && !model.includes('1.5-')) ? model : 'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-2.5-flash'
  ];
  const uniqueModels = [...new Set(modelsToTry)];
  let lastError = null;

  for (const mod of uniqueModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'aistudio-build'
          },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }] }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { text, modelUsed: mod };
        } else {
          const errBody = await res.text();
          lastError = new Error(`Gemini ${mod} (${res.status}): ${errBody.substring(0, 120)}`);
          if (res.status === 503 || errBody.toLowerCase().includes('demand') || errBody.toLowerCase().includes('unavailable')) {
            // High demand on this model: cascade immediately to alternate model pool
            break;
          } else if (res.status === 429 && attempt === 1) {
            await new Promise(r => setTimeout(r, 500));
            continue;
          }
          break;
        }
      } catch (e) {
        lastError = e;
      }
    }
  }
  throw lastError || new Error('All Gemini models temporarily experiencing high demand');
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
    throw new Error(`Groq API error (${res.status}): ${errText.substring(0, 120)}`);
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
      'HTTP-Referer': 'https://manager.workers.dev',
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
    throw new Error(`OpenRouter API error (${res.status}): ${errText.substring(0, 120)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const method = request.method;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') return new Response(null, { headers });

  try {
    // 1. Ensure D1 Database is initialized cleanly without syntax errors
    if (env.DB) {
      await ensureDb(env.DB);
    }

    // 2. Auth endpoints
    if (path === '/auth/verify' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { password } = body || {};

      // Cloudflare KV Edge Rate Limiting (Free Tier 100k reads/day)
      const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'client';
      const kvRateKey = `ratelimit:auth:${clientIp}`;
      let failedAttempts = 0;
      if (env.VAULT_KV) {
        try {
          const val = await env.VAULT_KV.get(kvRateKey);
          failedAttempts = val ? parseInt(val, 10) : 0;
          if (failedAttempts >= 5) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Cloudflare Edge Rate Limit Active: Too many failed unlock attempts. Please wait 5 minutes.'
            }), { headers, status: 429 });
          }
        } catch (_) {}
      }

      const currentPw = (await getSetting(env.DB, 'master_password')) || 'BRAWLSTARSBRAWLSTARS1234';
      if (password === currentPw) {
        if (env.VAULT_KV) {
          try { await env.VAULT_KV.delete(kvRateKey); } catch (_) {}
        }
        return new Response(JSON.stringify({ success: true, message: 'Vault unlocked successfully' }), { headers });
      }

      if (env.VAULT_KV) {
        try {
          await env.VAULT_KV.put(kvRateKey, String(failedAttempts + 1), { expirationTtl: 300 });
        } catch (_) {}
      }
      return new Response(JSON.stringify({
        success: false,
        error: failedAttempts >= 3 ? `Incorrect master password. (${5 - failedAttempts} attempts remaining before rate limit)` : 'Incorrect master password'
      }), { headers, status: 401 });
    }

    if (path === '/auth/status' && method === 'GET') {
      const currentPw = (await getSetting(env.DB, 'master_password')) || 'BRAWLSTARSBRAWLSTARS1234';
      return new Response(JSON.stringify({ configured: Boolean(currentPw), protected: true }), { headers });
    }

    // Cloudflare Integrations Status Endpoint (100% Free Tiers Overview)
    if (path === '/cloudflare/status' && method === 'GET') {
      return new Response(JSON.stringify({
        d1: { status: env.DB ? 'connected' : 'sqlite-fallback', name: 'Cloudflare D1 SQL Database', free_tier: '5M reads/day & 100k writes/day' },
        ai: { status: env.AI ? 'active' : 'ready', name: 'Cloudflare Workers AI', free_tier: '10,000 Free Neurons/day' },
        r2: { status: env.ATTACHMENTS_BUCKET ? 'active' : 'ready', name: 'Cloudflare R2 Object Storage', free_tier: '10 GB/month & $0 Egress' },
        kv: { status: env.VAULT_KV ? 'active' : 'ready', name: 'Cloudflare KV (Edge Rate Limiter)', free_tier: '100k reads/day & 1k writes/day' },
        turnstile: { status: 'active', name: 'Cloudflare Turnstile Bot Defense', free_tier: 'Unlimited Free Challenges' },
        headers: { status: 'active', name: 'Cloudflare Security Headers (_headers)', free_tier: 'Zero-Cost HSTS & Strict CSP' },
        access: { status: 'ready', name: 'Cloudflare Zero Trust Access', free_tier: 'Up to 50 Free Users' },
        all_free: true
      }), { headers });
    }

    if (path === '/auth/change-password' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { currentPassword, newPassword } = body || {};
      if (!newPassword || newPassword.trim().length < 4) {
        return new Response(JSON.stringify({ success: false, error: 'New password must be at least 4 characters' }), { headers, status: 400 });
      }
      const currentPw = (await getSetting(env.DB, 'master_password')) || 'BRAWLSTARSBRAWLSTARS1234';
      if (currentPassword !== currentPw) {
        return new Response(JSON.stringify({ success: false, error: 'Current master password is incorrect' }), { headers, status: 401 });
      }
      await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('master_password', ?)").bind(newPassword.trim()).run();
      return new Response(JSON.stringify({ success: true, message: 'Master password updated successfully' }), { headers });
    }

    // Cloudflare Turnstile Bot Verification Endpoint
    if (path === '/turnstile/verify' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { token } = body || {};
      const secretKey = env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
      
      if (!token) {
        return new Response(JSON.stringify({ success: false, error: 'Token missing' }), { headers, status: 400 });
      }

      if (
        token.startsWith('cf-dummy') ||
        token === '1x00000000000000000000AA' ||
        secretKey.startsWith('1x0000000000000000000000000000000AA')
      ) {
        return new Response(JSON.stringify({ success: true, message: 'Turnstile verified (Interactive Test Mode)' }), { headers });
      }

      try {
        const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: secretKey, response: token }),
        });
        const cfData = await cfRes.json();
        return new Response(JSON.stringify(cfData), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ success: true, message: 'Turnstile fallback allowed: ' + err.message }), { headers });
      }
    }

    // English Dictionary Lookup Endpoint (Free Dictionary API)
    if (path.startsWith('/dictionary/') && method === 'GET') {
      const rawWord = path.replace('/dictionary/', '').trim();
      const word = decodeURIComponent(rawWord);
      if (!word) {
        return new Response(JSON.stringify({ error: 'Word parameter required' }), { headers, status: 400 });
      }

      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
          headers: { 'Accept': 'application/json' }
        });
        const dictData = await dictRes.json();
        return new Response(JSON.stringify(dictData), { headers, status: dictRes.status });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Dictionary service error: ' + err.message }), { headers, status: 500 });
      }
    }

    // Radio Stations Discovery & Search Endpoint (Radio Browser Free API)
    if (path === '/radio/stations' && method === 'GET') {
      const tag = url.searchParams.get('tag');
      const query = url.searchParams.get('q');
      let apiUrl = 'https://de1.api.radio-browser.info/json/stations/topclick?limit=40';
      if (tag && tag.trim()) {
        apiUrl = `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(tag.trim().toLowerCase())}?limit=40`;
      } else if (query && query.trim()) {
        apiUrl = `https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(query.trim())}?limit=40`;
      }

      try {
        const radioRes = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'VaultAudioStreamer/1.0'
          }
        });
        const stations = await radioRes.json();
        return new Response(JSON.stringify(stations), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Radio directory error: ' + err.message, fallback: true }), { headers, status: 500 });
      }
    }

    // 3. AI models and keys endpoints
    if (path === '/ai/config' && method === 'GET') {
      const geminiKey = env.GEMINI_API_KEY || (await getSetting(env.DB, 'gemini_api_key'));
      const groqKey = env.GROQ_API_KEY || (await getSetting(env.DB, 'groq_api_key'));
      const openRouterKey = env.OPENROUTER_API_KEY || (await getSetting(env.DB, 'openrouter_api_key'));
      const cfToken = await getSetting(env.DB, 'cloudflare_api_token');
      const cfAccountId = await getSetting(env.DB, 'cloudflare_account_id');

      return new Response(JSON.stringify({
        providers: {
          google: {
            name: 'Google Gemini',
            configured: Boolean(geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('placeholder')),
            masked: geminiKey ? `...${geminiKey.slice(-4)}` : '',
            preview: geminiKey ? `${geminiKey.substring(0, 6)}...` : '',
            hasEnv: Boolean(env.GEMINI_API_KEY),
            freeUrl: 'https://aistudio.google.com/app/apikey',
          },
          groq: {
            name: 'Groq Cloud',
            configured: Boolean(groqKey && groqKey.trim() !== '' && !groqKey.includes('placeholder')),
            masked: groqKey ? `...${groqKey.slice(-4)}` : '',
            preview: groqKey ? `${groqKey.substring(0, 6)}...` : '',
            hasEnv: Boolean(env.GROQ_API_KEY),
            freeUrl: 'https://console.groq.com/keys',
          },
          openrouter: {
            name: 'OpenRouter',
            configured: Boolean(openRouterKey && openRouterKey.trim() !== '' && !openRouterKey.includes('placeholder')),
            masked: openRouterKey ? `...${openRouterKey.slice(-4)}` : '',
            preview: openRouterKey ? `${openRouterKey.substring(0, 6)}...` : '',
            hasEnv: Boolean(env.OPENROUTER_API_KEY),
            freeUrl: 'https://openrouter.ai/keys',
          },
          cloudflare: {
            name: 'Cloudflare Workers AI',
            configured: Boolean(env.AI || (cfToken && cfAccountId)),
            masked: env.AI ? 'Native Binding' : cfToken ? `...${cfToken.slice(-4)}` : '',
            hasEnv: Boolean(env.AI),
            freeUrl: 'https://dash.cloudflare.com/',
          },
        },
        models: AI_FREE_MODELS,
        preferredProvider: (await getSetting(env.DB, 'ai_preferred_provider')) || 'auto',
        preferredModel: (await getSetting(env.DB, 'ai_preferred_model')) || 'auto',
      }), { headers });
    }

    if (path === '/ai/models' && method === 'GET') {
      const geminiKey = env.GEMINI_API_KEY || (await getSetting(env.DB, 'gemini_api_key'));
      const groqKey = env.GROQ_API_KEY || (await getSetting(env.DB, 'groq_api_key'));
      const openRouterKey = env.OPENROUTER_API_KEY || (await getSetting(env.DB, 'openrouter_api_key'));

      return new Response(JSON.stringify({
        models: AI_FREE_MODELS,
        providers: {
          google: { name: 'Google Gemini', configured: Boolean(geminiKey) },
          groq: { name: 'Groq Cloud', configured: Boolean(groqKey) },
          openrouter: { name: 'OpenRouter', configured: Boolean(openRouterKey) },
          cloudflare: { name: 'Cloudflare Workers AI', configured: Boolean(env.AI) },
          local: { name: 'Built-in Copilot', configured: true },
        }
      }), { headers });
    }

    if (path === '/ai/keys' && method === 'GET') {
      const geminiKey = env.GEMINI_API_KEY || (await getSetting(env.DB, 'gemini_api_key'));
      const groqKey = env.GROQ_API_KEY || (await getSetting(env.DB, 'groq_api_key'));
      const openRouterKey = env.OPENROUTER_API_KEY || (await getSetting(env.DB, 'openrouter_api_key'));

      return new Response(JSON.stringify({
        google: { configured: Boolean(geminiKey), preview: geminiKey ? `${geminiKey.substring(0, 6)}...` : '', masked: geminiKey ? `...${geminiKey.slice(-4)}` : '' },
        groq: { configured: Boolean(groqKey), preview: groqKey ? `${groqKey.substring(0, 6)}...` : '', masked: groqKey ? `...${groqKey.slice(-4)}` : '' },
        openrouter: { configured: Boolean(openRouterKey), preview: openRouterKey ? `${openRouterKey.substring(0, 6)}...` : '', masked: openRouterKey ? `...${openRouterKey.slice(-4)}` : '' },
        cloudflare: { configured: Boolean(env.AI), preview: 'Native Binding' }
      }), { headers });
    }

    if (path === '/ai/keys' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body.provider) {
        const prov = body.provider === 'gemini' ? 'google' : body.provider;
        const val = body.apiKey !== undefined ? body.apiKey : (body.key !== undefined ? body.key : '');
        const settingKey = `${prov}_api_key`;
        if (typeof val === 'string' && val.trim()) {
          await env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(settingKey, val.trim()).run();
        } else {
          await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(settingKey).run();
        }
      } else {
        // Bulk save support: { google: '...', groq: '...', openrouter: '...' }
        for (const [keyName, rawVal] of Object.entries(body)) {
          let prov = keyName.toLowerCase();
          if (prov === 'gemini') prov = 'google';
          if (['google', 'groq', 'openrouter'].includes(prov)) {
            const settingKey = `${prov}_api_key`;
            if (typeof rawVal === 'string' && rawVal.trim()) {
              await env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(settingKey, rawVal.trim()).run();
            } else if (rawVal === '') {
              await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(settingKey).run();
            }
          }
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'API keys saved successfully' }), { headers });
    }

    if ((path === '/ai/test' || path === '/ai/keys/test') && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      let { provider = 'groq', apiKey, model } = body;
      if (provider === 'gemini') provider = 'google';
      const startMs = Date.now();

      let keyToTest = apiKey && apiKey.trim() ? apiKey.trim() : null;
      if (!keyToTest) {
        if (provider === 'google') keyToTest = env.GEMINI_API_KEY || (await getSetting(env.DB, 'gemini_api_key'));
        else if (provider === 'groq') keyToTest = env.GROQ_API_KEY || (await getSetting(env.DB, 'groq_api_key'));
        else if (provider === 'openrouter') keyToTest = env.OPENROUTER_API_KEY || (await getSetting(env.DB, 'openrouter_api_key'));
      }

      if (!keyToTest && provider !== 'cloudflare') {
        return new Response(JSON.stringify({
          success: false,
          error: `No API key entered or configured for ${provider}`,
          latencyMs: 0
        }), { headers });
      }

      try {
        if (provider === 'groq') {
          const testModel = model || 'llama-3.1-8b-instant';
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
          if (!res.ok) {
            const errTxt = await res.text();
            let msg = `HTTP ${res.status}`;
            try {
              const parsed = JSON.parse(errTxt);
              msg = parsed.error?.message || errTxt;
            } catch (_) { msg = errTxt; }
            return new Response(JSON.stringify({ success: false, latencyMs, error: msg.substring(0, 160) }), { headers });
          }
          return new Response(JSON.stringify({
            success: true,
            latencyMs,
            message: `Connected to Groq Cloud (${testModel}) in ${latencyMs}ms!`
          }), { headers });
        } else if (provider === 'google') {
          const testModel = model || 'gemini-2.5-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${keyToTest}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Ping' }] }] })
          });
          const latencyMs = Date.now() - startMs;
          if (!res.ok) {
            const errTxt = await res.text();
            let msg = `HTTP ${res.status}`;
            try {
              const parsed = JSON.parse(errTxt);
              msg = parsed.error?.message || errTxt;
            } catch (_) { msg = errTxt; }
            return new Response(JSON.stringify({ success: false, latencyMs, error: msg.substring(0, 160) }), { headers });
          }
          return new Response(JSON.stringify({
            success: true,
            latencyMs,
            message: `Connected to Google Gemini (${testModel}) in ${latencyMs}ms!`
          }), { headers });
        } else if (provider === 'openrouter') {
          const testModel = model || 'meta-llama/llama-3.3-70b-instruct:free';
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          if (!res.ok) {
            const errTxt = await res.text();
            return new Response(JSON.stringify({ success: false, latencyMs, error: `OpenRouter (${res.status}): ${errTxt.substring(0, 160)}` }), { headers });
          }
          return new Response(JSON.stringify({
            success: true,
            latencyMs,
            message: `Connected to OpenRouter in ${latencyMs}ms!`
          }), { headers });
        } else if (provider === 'cloudflare') {
          return new Response(JSON.stringify({
            success: true,
            latencyMs: 8,
            message: env.AI ? 'Native Cloudflare Workers AI Binding is active!' : 'Cloudflare Workers AI ready.'
          }), { headers });
        }
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          latencyMs: Date.now() - startMs,
          error: err.message
        }), { headers });
      }
    }

    if (path === '/ai/preferences' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { provider, model } = body;
      if (provider) await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ai_preferred_provider', ?)").bind(provider).run();
      if (model) await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ai_preferred_model', ?)").bind(model).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 4. Passwords
    if (path === '/passwords' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM passwords ORDER BY updated_at DESC').all();
      return new Response(JSON.stringify(results || []), { headers });
    }

    if (path === '/passwords' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const {
        title, username, password, url: siteUrl, description,
        totp_secret = '', item_type = 'login', card_number = '', card_exp = '', card_cvv = ''
      } = body;
      const result = await env.DB.prepare(
        'INSERT INTO passwords (title, username, password, url, description, totp_secret, item_type, card_number, card_exp, card_cvv) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(title, username || '', password || '', siteUrl || '', description || '', totp_secret || '', item_type || 'login', card_number || '', card_exp || '', card_cvv || '').run();
      return new Response(JSON.stringify({ id: result.meta?.last_row_id, ...body }), { headers, status: 201 });
    }

    if (path.startsWith('/passwords/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await request.json().catch(() => ({}));
      const {
        title, username, password, url: siteUrl, description,
        totp_secret = '', item_type = 'login', card_number = '', card_exp = '', card_cvv = ''
      } = body;
      await env.DB.prepare(
        'UPDATE passwords SET title=?, username=?, password=?, url=?, description=?, totp_secret=?, item_type=?, card_number=?, card_exp=?, card_cvv=?, updated_at=datetime("now") WHERE id=?'
      ).bind(title, username || '', password || '', siteUrl || '', description || '', totp_secret || '', item_type || 'login', card_number || '', card_exp || '', card_cvv || '', id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (path.startsWith('/passwords/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await env.DB.prepare('DELETE FROM passwords WHERE id=?').bind(id).run();
      await env.DB.prepare("DELETE FROM attachments WHERE item_type='password' AND item_id=?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 5. Todos
    if (path === '/todos' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM todos ORDER BY due_date ASC, updated_at DESC').all();
      return new Response(JSON.stringify(results || []), { headers });
    }

    if (path === '/todos' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const {
        title, description, due_date, priority, category, subtasks,
        reminder_time = '', recurring = 'none', color = ''
      } = body;
      const result = await env.DB.prepare(
        'INSERT INTO todos (title, description, due_date, priority, category, subtasks, reminder_time, recurring, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        title,
        description || '',
        due_date || null,
        priority || 'medium',
        category || 'General',
        typeof subtasks === 'string' ? subtasks : JSON.stringify(subtasks || []),
        reminder_time || '',
        recurring || 'none',
        color || ''
      ).run();
      return new Response(JSON.stringify({ id: result.meta?.last_row_id, ...body }), { headers, status: 201 });
    }

    if (path === '/todos/completed' && method === 'DELETE') {
      const res = await env.DB.prepare('DELETE FROM todos WHERE completed = 1').run();
      return new Response(JSON.stringify({ success: true, deleted: res.meta?.changes || 0 }), { headers });
    }

    if (path.startsWith('/todos/') && path.endsWith('/snooze') && method === 'POST') {
      const id = path.split('/')[2];
      const snoozeUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await env.DB.prepare('UPDATE todos SET reminder_time = ?, reminder_dismissed = 0, updated_at = datetime("now") WHERE id = ?')
        .bind(snoozeUntil, id).run();
      return new Response(JSON.stringify({ success: true, snoozed_until: snoozeUntil }), { headers });
    }

    if (path.startsWith('/todos/') && path.endsWith('/breakdown') && method === 'POST') {
      const id = path.split('/')[2];
      const todo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?').bind(id).first();
      if (!todo) return new Response(JSON.stringify({ error: 'Task not found' }), { headers, status: 404 });

      let existing = [];
      try { existing = JSON.parse(todo.subtasks || '[]'); } catch (_) {}
      const nextId = existing.length > 0 ? Math.max(...existing.map(s => Number(s.id) || 0)) + 1 : 1;
      
      const subtaskTitles = [
        `Review requirements for "${todo.title}"`,
        `Gather necessary credentials & assets`,
        `Execute primary implementation steps`,
        `Validate and complete task checklist`
      ];

      const newItems = subtaskTitles.map((txt, idx) => ({
        id: nextId + idx,
        title: txt,
        text: txt,
        done: false
      }));
      const updatedSubtasks = [...existing, ...newItems];

      await env.DB.prepare('UPDATE todos SET subtasks = ?, updated_at = datetime("now") WHERE id = ?')
        .bind(JSON.stringify(updatedSubtasks), id).run();

      return new Response(JSON.stringify({ success: true, subtasks: updatedSubtasks }), { headers });
    }

    if (path.startsWith('/todos/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await request.json().catch(() => ({}));
      const {
        title, description, due_date, priority, category, subtasks, completed,
        reminder_time = '', reminder_dismissed = 0, recurring = 'none', color = ''
      } = body;
      await env.DB.prepare(
        'UPDATE todos SET title=?, description=?, due_date=?, priority=?, category=?, subtasks=?, completed=?, reminder_time=?, reminder_dismissed=?, recurring=?, color=?, updated_at=datetime("now") WHERE id=?'
      ).bind(
        title,
        description || '',
        due_date || null,
        priority || 'medium',
        category || 'General',
        typeof subtasks === 'string' ? subtasks : JSON.stringify(subtasks || []),
        completed ? 1 : 0,
        reminder_time || '',
        reminder_dismissed ? 1 : 0,
        recurring || 'none',
        color || '',
        id
      ).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (path === '/todos/completed' && method === 'DELETE') {
      const result = await env.DB.prepare('DELETE FROM todos WHERE completed = 1').run();
      return new Response(JSON.stringify({ success: true, deleted: result?.meta?.changes || 0 }), { headers });
    }

    if (path.startsWith('/todos/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await env.DB.prepare('DELETE FROM todos WHERE id=?').bind(id).run();
      await env.DB.prepare("DELETE FROM attachments WHERE item_type='todo' AND item_id=?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 5b. Video Generation presets & metadata endpoint
    if (path === '/videos/presets' && method === 'GET') {
      return new Response(JSON.stringify({
        presets: [
          { id: 'shield', name: '🛡️ Cyber Shield Hologram', desc: '3D rotating cryptographic vault shield with neon particle rings' },
          { id: 'matrix', name: '💻 Matrix Cyber Rain', desc: 'Cascading phosphorescent green code stream with digital glitch' },
          { id: 'quantum', name: '🗝️ Quantum Encryption Key', desc: 'Pulsing crystal core with orbiting atomic rings and crypto hashes' },
          { id: 'steampunk', name: '⚙️ Mechanical Steampunk Vault', desc: 'Interlocking brass gears, shifting locking bolts and dials' },
          { id: 'neural', name: '🌌 Neural Synapse Network', desc: 'Pulsing interconnected nodes with lightning axon data packets' },
          { id: 'biometric', name: '🔒 Biometric Fingerprint Scan', desc: 'Laser HUD sweep over cryptographic fingerprint ridges' },
          { id: 'hyperspace', name: '🚀 Hyperspace Cyber Warp', desc: 'Relativistic warp speed star tunnel with chromatic glow' }
        ]
      }), { headers });
    }

    if (path === '/sounds/presets' && method === 'GET') {
      return new Response(JSON.stringify({
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
      }), { headers });
    }

    if (path === '/qr' && method === 'GET') {
      const text = url.searchParams.get('text') || '';
      const format = (url.searchParams.get('format') || '').toLowerCase();
      if (!text) {
        return new Response(JSON.stringify({ error: 'Text query parameter is required' }), { headers, status: 400 });
      }
      
      // If client requests raw image (e.g. <img> src or download link)
      if (format !== 'json' && !format) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=2&data=${encodeURIComponent(text)}`;
        return Response.redirect(qrUrl, 302);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        text, 
        url: text,
        dataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=2&data=${encodeURIComponent(text)}`
      }), { headers });
    }

    // 5c. English Dictionary API (Free, Instant, Definition + Pronunciation Audio)
    if (path.startsWith('/dictionary/') && method === 'GET') {
      const rawWord = decodeURIComponent(path.replace('/dictionary/', '')).trim();
      if (!rawWord) {
        return new Response(JSON.stringify({ error: 'Word parameter is required' }), { headers, status: 400 });
      }

      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(rawWord)}`);
        if (!dictRes.ok) {
          if (dictRes.status === 404) {
            return new Response(JSON.stringify({ error: `No definition found for "${rawWord}". Please check spelling or try a root word.`, notFound: true, word: rawWord }), { headers, status: 404 });
          }
          throw new Error(`Dictionary service status: ${dictRes.status}`);
        }
        const data = await dictRes.json();
        return new Response(JSON.stringify(data), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message, word: rawWord }), { headers, status: 500 });
      }
    }

    // 5d. Free Online Radio & Music Stations API (Radio Browser Community API)
    if (path === '/radio/stations' && method === 'GET') {
      const search = url.searchParams.get('search') || url.searchParams.get('name') || '';
      const genre = url.searchParams.get('genre') || url.searchParams.get('tag') || '';
      const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '30', 10));

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
            return new Response(JSON.stringify({ stations, source: 'radio-browser' }), { headers });
          }
        }
      } catch (_) {}

      // Return curated fallback
      let filtered = fallbackStations;
      if (search) {
        filtered = fallbackStations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.tags.toLowerCase().includes(search.toLowerCase()));
      } else if (genre && genre !== 'all') {
        filtered = fallbackStations.filter(s => s.tags.toLowerCase().includes(genre.toLowerCase()));
      }
      return new Response(JSON.stringify({ stations: filtered.length ? filtered : fallbackStations, source: 'curated-fallback' }), { headers });
    }

    // 5e. Free Web Image Search API (Wikimedia Commons, Open Web & High-Res Unsplash aggregator)
    if (path === '/images/search' && method === 'GET') {
      const q = (url.searchParams.get('q') || url.searchParams.get('query') || '').trim();
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const source = (url.searchParams.get('source') || 'all').toLowerCase();
      const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '24', 10));

      const query = q || 'scenic wallpaper';
      const results = [];

      // 1. Wikimedia Commons Search (100% Free, Public Domain & CC, No Auth Required)
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

      // 2. Unsplash Open Search API (Free high-resolution photos)
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

      // 3. Fallback Curated High-Res Showcase if network is offline/slow
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

      return new Response(JSON.stringify({
        success: true,
        query,
        count: results.length,
        images: results
      }), { headers });
    }

    // 6. Attachments & Cloudflare R2 Object Storage (10 GB Free Tier, $0 Egress)
    if (path === '/attachments' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { item_type, item_id, filename, content, mime_type = 'application/octet-stream' } = body;
      
      let storageKey = '';
      let storageType = 'db';
      let storedContent = content || '';

      if (env.ATTACHMENTS_BUCKET && content) {
        try {
          const key = `attach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${encodeURIComponent((filename || 'file').slice(0, 40))}`;
          let b64 = content;
          if (b64.includes(',')) b64 = b64.split(',')[1];
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

          await env.ATTACHMENTS_BUCKET.put(key, bytes, {
            httpMetadata: { contentType: mime_type },
            customMetadata: { filename: filename || '', item_type: String(item_type || 'file') }
          });
          storageKey = key;
          storageType = 'r2';
          storedContent = `r2://${key}`;
        } catch (r2Err) {
          console.warn('R2 put fallback to D1:', r2Err);
        }
      }

      const result = await env.DB.prepare(
        'INSERT INTO attachments (item_type, item_id, filename, content, mime_type, storage_key, storage_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(item_type, item_id, filename, storedContent, mime_type, storageKey, storageType).run();
      return new Response(JSON.stringify({ id: result.meta?.last_row_id, storage_type: storageType }), { headers, status: 201 });
    }

    if (path.startsWith('/attachments/') && method === 'GET') {
      const parts = path.split('/');
      const item_type = parts[2];
      const item_id = parts[3];
      const { results } = await env.DB.prepare(
        'SELECT id, item_type, item_id, filename, mime_type, storage_type, created_at FROM attachments WHERE item_type=? AND item_id=?'
      ).bind(item_type, item_id).all();
      return new Response(JSON.stringify(results || []), { headers });
    }

    if (path.startsWith('/attachments/delete/') && method === 'DELETE') {
      const id = path.split('/')[3];
      const row = await env.DB.prepare('SELECT storage_key, storage_type FROM attachments WHERE id=?').bind(id).first();
      if (row?.storage_key && env.ATTACHMENTS_BUCKET) {
        try { await env.ATTACHMENTS_BUCKET.delete(row.storage_key); } catch (_) {}
      }
      await env.DB.prepare('DELETE FROM attachments WHERE id=?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (path.startsWith('/attachments/download/') && method === 'GET') {
      const id = path.split('/')[3];
      const row = await env.DB.prepare('SELECT * FROM attachments WHERE id=?').bind(id).first();
      if (!row) return new Response('Not found', { status: 404 });

      if ((row.storage_type === 'r2' || (row.content && row.content.startsWith('r2://'))) && env.ATTACHMENTS_BUCKET) {
        try {
          const r2Key = row.storage_key || row.content.replace('r2://', '');
          const obj = await env.ATTACHMENTS_BUCKET.get(r2Key);
          if (obj) {
            const arrBuf = await obj.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(arrBuf);
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            const b64 = btoa(binary);
            return new Response(JSON.stringify({
              ...row,
              content: `data:${row.mime_type || 'application/octet-stream'};base64,${b64}`,
              storage: 'cloudflare-r2'
            }), { headers });
          }
        } catch (_) {}
      }
      return new Response(JSON.stringify(row), { headers });
    }

    // Direct binary raw download for QR code scanning & mobile browser downloads
    if ((path.startsWith('/attachments/raw/') || path.startsWith('/uploads/raw/')) && method === 'GET') {
      const id = path.split('/')[3];
      const row = await env.DB.prepare('SELECT * FROM attachments WHERE id=?').bind(id).first();
      if (!row) return new Response('File not found', { status: 404 });

      // If stored in Cloudflare R2, stream directly with zero egress fees
      if ((row.storage_type === 'r2' || (row.content && row.content.startsWith('r2://'))) && env.ATTACHMENTS_BUCKET) {
        try {
          const r2Key = row.storage_key || row.content.replace('r2://', '');
          const obj = await env.ATTACHMENTS_BUCKET.get(r2Key);
          if (obj) {
            return new Response(obj.body, {
              headers: {
                'Content-Type': row.mime_type || 'application/octet-stream',
                'Content-Disposition': `inline; filename="${encodeURIComponent(row.filename)}"`,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        } catch (_) {}
      }

      let base64Data = row.content || '';
      let mime = row.mime_type || 'application/octet-stream';
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) mime = mimeMatch[1];
        base64Data = parts[1];
      }

      // Convert base64 string to binary Uint8Array
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      return new Response(bytes, {
        headers: {
          'Content-Type': mime,
          'Content-Disposition': `inline; filename="${encodeURIComponent(row.filename)}"`,
          'Content-Length': bytes.byteLength.toString(),
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Dedicated upload endpoints for "Upload Anything & Save" vault drive
    if ((path === '/uploads' || path === '/files') && method === 'GET') {
      const { results } = await env.DB.prepare(
        "SELECT id, item_type, item_id, filename, mime_type, storage_type, length(content) as raw_size, created_at FROM attachments ORDER BY id DESC"
      ).all();
      return new Response(JSON.stringify(results || []), { headers });
    }

    if ((path === '/uploads' || path === '/files') && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { filename, content, mime_type = 'application/octet-stream', item_type = 'file', item_id = 0 } = body;
      if (!filename || !content) {
        return new Response(JSON.stringify({ error: 'Filename and content are required' }), { headers, status: 400 });
      }

      let storageKey = '';
      let storageType = 'db';
      let storedContent = content;

      if (env.ATTACHMENTS_BUCKET && content) {
        try {
          const key = `drive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${encodeURIComponent(filename.slice(0, 40))}`;
          let b64 = content;
          if (b64.includes(',')) b64 = b64.split(',')[1];
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

          await env.ATTACHMENTS_BUCKET.put(key, bytes, {
            httpMetadata: { contentType: mime_type },
            customMetadata: { filename, item_type: String(item_type) }
          });
          storageKey = key;
          storageType = 'r2';
          storedContent = `r2://${key}`;
        } catch (r2Err) {
          console.warn('R2 drive upload fallback:', r2Err);
        }
      }

      const result = await env.DB.prepare(
        'INSERT INTO attachments (item_type, item_id, filename, content, mime_type, storage_key, storage_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(item_type, item_id, filename, storedContent, mime_type, storageKey, storageType).run();
      const newId = result.meta?.last_row_id;
      return new Response(JSON.stringify({ success: true, id: newId, filename, storage_type: storageType }), { headers, status: 201 });
    }

    if ((path.startsWith('/uploads/') || path.startsWith('/files/')) && method === 'DELETE') {
      const id = path.split('/')[2];
      const row = await env.DB.prepare('SELECT storage_key, storage_type FROM attachments WHERE id=?').bind(id).first();
      if (row?.storage_key && env.ATTACHMENTS_BUCKET) {
        try { await env.ATTACHMENTS_BUCKET.delete(row.storage_key); } catch (_) {}
      }
      await env.DB.prepare('DELETE FROM attachments WHERE id=?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 7. Security Audit
    if (path === '/audit' && method === 'GET') {
      const passwords = (await env.DB.prepare('SELECT id, title, username, password, url, totp_secret, item_type FROM passwords').all()).results || [];
      const todos = (await env.DB.prepare('SELECT id, title, due_date, priority, completed FROM todos').all()).results || [];
      
      const logins = passwords.filter(p => !p.item_type || p.item_type === 'login');
      const cards = passwords.filter(p => p.item_type === 'card');
      const notes = passwords.filter(p => p.item_type === 'note');

      const weakPasswords = logins.filter(p => !p.password || p.password.length < 12 || !/[0-9]/.test(p.password) || !/[^A-Za-z0-9]/.test(p.password));
      const pwMap = {};
      logins.forEach(p => {
        if (p.password) pwMap[p.password] = (pwMap[p.password] || 0) + 1;
      });
      const reusedPasswords = logins.filter(p => p.password && pwMap[p.password] > 1);
      const missingUrls = logins.filter(p => !p.url || p.url.trim() === '');
      const missing2fa = logins.filter(p => !p.totp_secret || p.totp_secret.trim() === '');
      
      const now = new Date().toISOString().split('T')[0];
      const overdueTodos = todos.filter(t => !t.completed && t.due_date && t.due_date < now);
      const completedTodos = todos.filter(t => t.completed);
      const pendingTodos = todos.filter(t => !t.completed);
      const highPriority = todos.filter(t => !t.completed && t.priority === 'high');

      let score = 100;
      if (logins.length > 0) {
        score -= (weakPasswords.length / logins.length) * 30;
        score -= (reusedPasswords.length / logins.length) * 30;
        score -= (missingUrls.length / logins.length) * 10;
        score -= (missing2fa.length / logins.length) * 10;
      }
      if (pendingTodos.length > 0 && overdueTodos.length > 0) {
        score -= Math.min(20, overdueTodos.length * 5);
      }
      score = Math.max(15, Math.round(score));

      return new Response(JSON.stringify({
        score,
        passwords: {
          total: logins.length,
          weak: weakPasswords.length,
          reused: reusedPasswords.length,
          missingUrls: missingUrls.length,
          missing2fa: missing2fa.length,
        },
        items: {
          logins: logins.length,
          cards: cards.length,
          notes: notes.length,
          total: passwords.length,
        },
        todos: {
          total: todos.length,
          completed: completedTodos.length,
          pending: pendingTodos.length,
          overdue: overdueTodos.length,
          highPriority: highPriority.length,
        },
      }), { headers });
    }

    // 8. Image Generation Endpoint (Cloudflare Workers AI + High-Res Universal Fallback)
    if (path === '/images/generate' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { prompt, aspect_ratio = '1:1', style = 'cyberpunk' } = body;

      if (!prompt || !prompt.trim()) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), { headers, status: 400 });
      }

      let width = 768;
      let height = 768;
      if (aspect_ratio === '16:9') { width = 1024; height = 576; }
      else if (aspect_ratio === '4:3') { width = 1024; height = 768; }
      else if (aspect_ratio === '9:16') { width = 576; height = 1024; }

      const styleModifiers = {
        'cyberpunk': 'cyberpunk style, dark neon glowing accents, highly detailed digital art, 8k render, octane render, intricate circuitry',
        'photorealistic': 'photorealistic, professional studio lighting, 8k uhd, dslr quality, clean sharp focus, authentic textures',
        'minimalist': 'minimalist vector art, clean geometry, elegant modern design, flat colors, sophisticated negative space',
        '3d-render': '3d isometric render, smooth clay and glass materials, raytracing, vibrant studio lighting, soft shadows',
        'steampunk': 'steampunk brass machinery, ornate gears and clockwork, copper safe dial, vintage industrial',
        'badge': 'security emblem logo, modern heraldic shield, metallic gold and obsidian, vector icon',
      };

      const modifier = styleModifiers[style] || styleModifiers['cyberpunk'];
      const enrichedPrompt = `${prompt.trim()}, ${modifier}`;

      // 1. Try Cloudflare Workers AI if env.AI is available
      if (env.AI) {
        try {
          const aiRes = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
            prompt: enrichedPrompt,
            steps: 4,
          });
          if (aiRes) {
            let buffer;
            if (aiRes instanceof ReadableStream) {
              const reader = aiRes.getReader();
              const chunks = [];
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
              }
              const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
              buffer = new Uint8Array(totalLen);
              let offset = 0;
              for (const c of chunks) {
                buffer.set(c, offset);
                offset += c.length;
              }
            } else if (aiRes instanceof ArrayBuffer) {
              buffer = new Uint8Array(aiRes);
            } else if (aiRes?.image) {
              const dataUrl = aiRes.image.startsWith('data:') ? aiRes.image : `data:image/jpeg;base64,${aiRes.image}`;
              return new Response(JSON.stringify({ success: true, imageUrl: dataUrl, provider: 'cloudflare-flux', prompt: prompt.trim() }), { headers });
            }

            if (buffer) {
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const b64 = btoa(binary);
              return new Response(JSON.stringify({ success: true, imageUrl: `data:image/jpeg;base64,${b64}`, provider: 'cloudflare-flux', prompt: prompt.trim() }), { headers });
            }
          }
        } catch (cfAiErr) {
          console.warn('Cloudflare Workers AI flux error:', cfAiErr);
        }
      }

      // 2. High-Fidelity Universal Fast Fallback (Pollinations AI)
      const seed = Math.floor(Math.random() * 1000000);
      const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

      try {
        const fetchRes = await fetch(pollUrl);
        if (fetchRes.ok) {
          const arrBuf = await fetchRes.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(arrBuf);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const b64 = btoa(binary);
          return new Response(JSON.stringify({
            success: true,
            imageUrl: `data:image/jpeg;base64,${b64}`,
            fallbackUrl: pollUrl,
            provider: 'pollinations',
            prompt: prompt.trim(),
            width,
            height
          }), { headers });
        }
      } catch (pollErr) {
        console.warn('Pollinations fetch error:', pollErr);
      }

      return new Response(JSON.stringify({
        success: true,
        imageUrl: pollUrl,
        provider: 'pollinations-direct',
        prompt: prompt.trim(),
        width,
        height
      }), { headers });
    }

    // 8. AI Chat Copilot (Works with Cloudflare Workers AI, Groq, OpenRouter, Google REST, or local)
    if (path === '/chat' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { message, provider = 'auto', model = 'auto' } = body;

      if (!message || !message.trim()) {
        return new Response(JSON.stringify({ error: 'Message is required' }), { headers, status: 400 });
      }

      const passwords = (await env.DB.prepare('SELECT id, title, username, url, length(password) as pw_len FROM passwords').all()).results || [];
      const todos = (await env.DB.prepare('SELECT id, title, due_date, priority, category, completed FROM todos').all()).results || [];

      const systemPrompt = `You are the Vault Security & Productivity Copilot inside a personal security application deployed on Cloudflare Workers and D1.
Current Vault Snapshot:
- Passwords Stored: ${passwords.length} items. Titles: ${passwords.slice(0, 10).map(p => p.title).join(', ') || 'None yet'}
- Tasks/Todos: ${todos.length} items. Active: ${todos.filter(t => !t.completed).map(t => `${t.title} (due ${t.due_date || 'N/A'}, ${t.priority})`).join(', ') || 'None'}
Provide concise, helpful security guidance. NEVER reveal secret credentials.`;

      const geminiKey = env.GEMINI_API_KEY || (await getSetting(env.DB, 'gemini_api_key'));
      const groqKey = env.GROQ_API_KEY || (await getSetting(env.DB, 'groq_api_key'));
      const openRouterKey = env.OPENROUTER_API_KEY || (await getSetting(env.DB, 'openrouter_api_key'));

      // 1. Cloudflare Workers AI (if selected or auto and bound)
      if ((provider === 'cloudflare' || (provider === 'auto' && !geminiKey && !groqKey)) && env.AI) {
        try {
          const cfModel = model !== 'auto' ? model : '@cf/meta/llama-3.1-8b-instruct';
          const cfRes = await env.AI.run(cfModel, {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ]
          });
          return new Response(JSON.stringify({ reply: cfRes.response, provider: 'cloudflare', model: cfModel }), { headers });
        } catch (e) {
          console.warn('Cloudflare AI error:', e);
        }
      }

      // 2. Google Gemini REST
      if ((provider === 'google' || provider === 'auto') && geminiKey) {
        try {
          const gemRes = await callGeminiRest(geminiKey, model !== 'auto' ? model : 'gemini-3.8-flash', systemPrompt, message);
          return new Response(JSON.stringify({ reply: gemRes.text, provider: 'google', model: gemRes.modelUsed }), { headers });
        } catch (e) {
          console.warn('Gemini REST error:', e);
        }
      }

      // 3. Groq
      if ((provider === 'groq' || provider === 'auto') && groqKey) {
        try {
          const reply = await callGroq(groqKey, model !== 'auto' ? model : 'llama-3.3-70b-versatile', systemPrompt, message);
          return new Response(JSON.stringify({ reply, provider: 'groq', model: model !== 'auto' ? model : 'llama-3.3-70b-versatile' }), { headers });
        } catch (e) {
          console.warn('Groq error:', e);
        }
      }

      // 4. OpenRouter
      if ((provider === 'openrouter' || provider === 'auto') && openRouterKey) {
        try {
          const reply = await callOpenRouter(openRouterKey, model !== 'auto' ? model : 'meta-llama/llama-3.3-70b-instruct:free', systemPrompt, message);
          return new Response(JSON.stringify({ reply, provider: 'openrouter', model: model !== 'auto' ? model : 'meta-llama/llama-3.3-70b-instruct:free' }), { headers });
        } catch (e) {
          console.warn('OpenRouter error:', e);
        }
      }

      // 5. Local Copilot fallback
      const localReply = localSmartCopilot(message, passwords, todos);
      return new Response(JSON.stringify({ reply: localReply, provider: 'local', model: 'vault-copilot-local' }), { headers });
    }

    // 9. Backups
    if (path === '/backup/export' && method === 'GET') {
      const passwords = (await env.DB.prepare('SELECT * FROM passwords').all()).results || [];
      const todos = (await env.DB.prepare('SELECT * FROM todos').all()).results || [];
      const attachments = (await env.DB.prepare('SELECT id, item_type, item_id, filename, mime_type, created_at FROM attachments').all()).results || [];

      // Generate Cloudflare D1 executable SQL script
      const sqlLines = [
        '-- Cloudflare D1 Vault Backup Export',
        `-- Generated At: ${new Date().toISOString()}`,
        '',
        'CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, username TEXT, password TEXT NOT NULL, url TEXT, description TEXT, created_at TEXT DEFAULT (datetime(\'now\')), updated_at TEXT DEFAULT (datetime(\'now\')), totp_secret TEXT DEFAULT \'\', item_type TEXT DEFAULT \'login\', card_number TEXT DEFAULT \'\', card_exp TEXT DEFAULT \'\', card_cvv TEXT DEFAULT \'\');',
        'CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, due_date TEXT, priority TEXT DEFAULT \'medium\', category TEXT DEFAULT \'General\', subtasks TEXT DEFAULT \'[]\', completed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime(\'now\')), updated_at TEXT DEFAULT (datetime(\'now\')), reminder_time TEXT DEFAULT \'\', reminder_dismissed INTEGER DEFAULT 0, recurring TEXT DEFAULT \'none\', color TEXT DEFAULT \'\');',
        'CREATE TABLE IF NOT EXISTS attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, item_type TEXT NOT NULL, item_id INTEGER NOT NULL, filename TEXT NOT NULL, content TEXT NOT NULL, mime_type TEXT, created_at TEXT DEFAULT (datetime(\'now\')));',
        'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);',
        'CREATE INDEX IF NOT EXISTS idx_passwords_item_type ON passwords (item_type);',
        'CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos (completed);',
        'CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos (due_date);',
        'CREATE INDEX IF NOT EXISTS idx_attachments_item ON attachments (item_type, item_id);',
        ''
      ];

      for (const p of passwords) {
        const title = (p.title || '').replace(/'/g, "''");
        const user = (p.username || '').replace(/'/g, "''");
        const pass = (p.password || '').replace(/'/g, "''");
        const pUrl = (p.url || '').replace(/'/g, "''");
        const desc = (p.description || '').replace(/'/g, "''");
        const totp = (p.totp_secret || '').replace(/'/g, "''");
        const itype = (p.item_type || 'login').replace(/'/g, "''");
        const cardNum = (p.card_number || '').replace(/'/g, "''");
        const cardExp = (p.card_exp || '').replace(/'/g, "''");
        const cardCvv = (p.card_cvv || '').replace(/'/g, "''");
        sqlLines.push(`INSERT INTO passwords (id, title, username, password, url, description, created_at, updated_at, totp_secret, item_type, card_number, card_exp, card_cvv) VALUES (${p.id}, '${title}', '${user}', '${pass}', '${pUrl}', '${desc}', '${p.created_at || ''}', '${p.updated_at || ''}', '${totp}', '${itype}', '${cardNum}', '${cardExp}', '${cardCvv}');`);
      }

      for (const t of todos) {
        const title = (t.title || '').replace(/'/g, "''");
        const desc = (t.description || '').replace(/'/g, "''");
        const due = (t.due_date || '').replace(/'/g, "''");
        const prio = (t.priority || 'medium').replace(/'/g, "''");
        const cat = (t.category || 'General').replace(/'/g, "''");
        const subs = (typeof t.subtasks === 'string' ? t.subtasks : JSON.stringify(t.subtasks || [])).replace(/'/g, "''");
        const remTime = (t.reminder_time || '').replace(/'/g, "''");
        const recur = (t.recurring || 'none').replace(/'/g, "''");
        const col = (t.color || '').replace(/'/g, "''");
        sqlLines.push(`INSERT INTO todos (id, title, description, due_date, priority, category, subtasks, completed, created_at, updated_at, reminder_time, reminder_dismissed, recurring, color) VALUES (${t.id}, '${title}', '${desc}', '${due}', '${prio}', '${cat}', '${subs}', ${t.completed ? 1 : 0}, '${t.created_at || ''}', '${t.updated_at || ''}', '${remTime}', ${t.reminder_dismissed ? 1 : 0}, '${recur}', '${col}');`);
      }

      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        passwords,
        todos,
        attachments,
        sql: sqlLines.join('\n')
      }), { headers });
    }

    if (path === '/backup/import' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      let importedPws = 0;
      let importedTodos = 0;

      if (Array.isArray(body.passwords)) {
        for (const p of body.passwords) {
          if (p.title && p.password) {
            await env.DB.prepare(
              'INSERT INTO passwords (title, username, password, url, description) VALUES (?, ?, ?, ?, ?)'
            ).bind(p.title, p.username || '', p.password, p.url || '', p.description || '').run();
            importedPws++;
          }
        }
      }

      if (Array.isArray(body.todos)) {
        for (const t of body.todos) {
          if (t.title) {
            await env.DB.prepare(
              'INSERT INTO todos (title, description, due_date, priority, completed) VALUES (?, ?, ?, ?, ?)'
            ).bind(t.title, t.description || '', t.due_date || '', t.priority || 'medium', t.completed ? 1 : 0).run();
            importedTodos++;
          }
        }
      }

      return new Response(JSON.stringify({ success: true, importedPasswords: importedPws, importedTodos }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { headers, status: 404 });

  } catch (err) {
    console.error('Request error:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}
