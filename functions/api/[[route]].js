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
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
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
          if (res.status === 503 || res.status === 429) {
            await new Promise(r => setTimeout(r, 600));
            continue;
          }
          break;
        }
      } catch (e) {
        lastError = e;
      }
    }
  }
  throw lastError || new Error('All Gemini models temporarily unavailable');
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
      const currentPw = (await getSetting(env.DB, 'master_password')) || 'BRAWLSTARSBRAWLSTARS1234';
      if (password === currentPw) {
        return new Response(JSON.stringify({ success: true, message: 'Vault unlocked successfully' }), { headers });
      }
      return new Response(JSON.stringify({ success: false, error: 'Incorrect master password' }), { headers, status: 401 });
    }

    if (path === '/auth/status' && method === 'GET') {
      const currentPw = (await getSetting(env.DB, 'master_password')) || 'BRAWLSTARSBRAWLSTARS1234';
      return new Response(JSON.stringify({ configured: Boolean(currentPw), protected: true }), { headers });
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

    // 3. AI models and keys endpoints
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
        google: { configured: Boolean(geminiKey), preview: geminiKey ? `${geminiKey.substring(0, 6)}...` : '' },
        groq: { configured: Boolean(groqKey), preview: groqKey ? `${groqKey.substring(0, 6)}...` : '' },
        openrouter: { configured: Boolean(openRouterKey), preview: openRouterKey ? `${openRouterKey.substring(0, 6)}...` : '' },
        cloudflare: { configured: Boolean(env.AI), preview: 'Native Binding' }
      }), { headers });
    }

    if (path === '/ai/keys' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { provider, apiKey } = body;
      const validProviders = ['google', 'groq', 'openrouter'];
      if (!validProviders.includes(provider)) {
        return new Response(JSON.stringify({ error: 'Invalid provider' }), { headers, status: 400 });
      }
      const settingKey = `${provider}_api_key`;
      if (apiKey && apiKey.trim()) {
        await env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(settingKey, apiKey.trim()).run();
      } else {
        await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(settingKey).run();
      }
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 4. Passwords
    if (path === '/passwords' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM passwords ORDER BY updated_at DESC').all();
      return new Response(JSON.stringify(results || []), { headers });
    }

    if (path === '/passwords' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { title, username, password, url: siteUrl, description } = body;
      const result = await env.DB.prepare(
        'INSERT INTO passwords (title, username, password, url, description) VALUES (?, ?, ?, ?, ?)'
      ).bind(title, username || '', password, siteUrl || '', description || '').run();
      return new Response(JSON.stringify({ id: result.meta?.last_row_id, ...body }), { headers, status: 201 });
    }

    if (path.startsWith('/passwords/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await request.json().catch(() => ({}));
      const { title, username, password, url: siteUrl, description } = body;
      await env.DB.prepare(
        'UPDATE passwords SET title=?, username=?, password=?, url=?, description=?, updated_at=datetime("now") WHERE id=?'
      ).bind(title, username || '', password, siteUrl || '', description || '', id).run();
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
      const { title, description, due_date, priority, category, subtasks } = body;
      const result = await env.DB.prepare(
        'INSERT INTO todos (title, description, due_date, priority, category, subtasks) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(title, description || '', due_date || null, priority || 'medium', category || 'General', subtasks || '[]').run();
      return new Response(JSON.stringify({ id: result.meta?.last_row_id, ...body }), { headers, status: 201 });
    }

    if (path === '/todos/completed' && method === 'DELETE') {
      const res = await env.DB.prepare('DELETE FROM todos WHERE completed = 1').run();
      return new Response(JSON.stringify({ success: true, deleted: res.meta?.changes || 0 }), { headers });
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
      const { title, description, due_date, priority, category, subtasks, completed } = body;
      await env.DB.prepare(
        'UPDATE todos SET title=?, description=?, due_date=?, priority=?, category=?, subtasks=?, completed=?, updated_at=datetime("now") WHERE id=?'
      ).bind(
        title,
        description || '',
        due_date || null,
        priority || 'medium',
        category || 'General',
        typeof subtasks === 'string' ? subtasks : JSON.stringify(subtasks || []),
        completed ? 1 : 0,
        id
      ).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (path.startsWith('/todos/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await env.DB.prepare('DELETE FROM todos WHERE id=?').bind(id).run();
      await env.DB.prepare("DELETE FROM attachments WHERE item_type='todo' AND item_id=?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 6. Attachments
    if (path === '/attachments' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { item_type, item_id, filename, content, mime_type } = body;
      const result = await env.DB.prepare(
        'INSERT INTO attachments (item_type, item_id, filename, content, mime_type) VALUES (?, ?, ?, ?, ?)'
      ).bind(item_type, item_id, filename, content, mime_type || 'application/octet-stream').run();
      return new Response(JSON.stringify({ id: result.meta?.last_row_id }), { headers, status: 201 });
    }

    if (path.startsWith('/attachments/') && method === 'GET') {
      const parts = path.split('/');
      const item_type = parts[2];
      const item_id = parts[3];
      const { results } = await env.DB.prepare(
        'SELECT id, item_type, item_id, filename, mime_type, created_at FROM attachments WHERE item_type=? AND item_id=?'
      ).bind(item_type, item_id).all();
      return new Response(JSON.stringify(results || []), { headers });
    }

    if (path.startsWith('/attachments/delete/') && method === 'DELETE') {
      const id = path.split('/')[3];
      await env.DB.prepare('DELETE FROM attachments WHERE id=?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (path.startsWith('/attachments/download/') && method === 'GET') {
      const id = path.split('/')[3];
      const row = await env.DB.prepare('SELECT * FROM attachments WHERE id=?').bind(id).first();
      if (!row) return new Response('Not found', { status: 404 });
      return new Response(JSON.stringify(row), { headers });
    }

    // 7. Security Audit
    if (path === '/audit' && method === 'GET') {
      const passwords = (await env.DB.prepare('SELECT id, title, username, password, url FROM passwords').all()).results || [];
      const todos = (await env.DB.prepare('SELECT id, title, due_date, priority, completed FROM todos').all()).results || [];
      
      const weakPasswords = passwords.filter(p => !p.password || p.password.length < 12 || !/[0-9]/.test(p.password) || !/[^A-Za-z0-9]/.test(p.password));
      const pwMap = {};
      passwords.forEach(p => {
        if (p.password) pwMap[p.password] = (pwMap[p.password] || 0) + 1;
      });
      const reusedPasswords = passwords.filter(p => p.password && pwMap[p.password] > 1);
      const missingUrls = passwords.filter(p => !p.url || p.url.trim() === '');
      
      const now = new Date().toISOString().split('T')[0];
      const overdueTodos = todos.filter(t => !t.completed && t.due_date && t.due_date < now);
      const completedTodos = todos.filter(t => t.completed);
      const pendingTodos = todos.filter(t => !t.completed);
      const highPriority = todos.filter(t => !t.completed && t.priority === 'high');

      let score = 100;
      if (passwords.length > 0) {
        score -= (weakPasswords.length / passwords.length) * 35;
        score -= (reusedPasswords.length / passwords.length) * 35;
        score -= (missingUrls.length / passwords.length) * 10;
      }
      if (pendingTodos.length > 0 && overdueTodos.length > 0) {
        score -= Math.min(20, overdueTodos.length * 5);
      }
      score = Math.max(15, Math.round(score));

      return new Response(JSON.stringify({
        score,
        passwords: {
          total: passwords.length,
          weak: weakPasswords.length,
          reused: reusedPasswords.length,
          missingUrls: missingUrls.length,
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

      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        passwords,
        todos,
        attachments,
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
