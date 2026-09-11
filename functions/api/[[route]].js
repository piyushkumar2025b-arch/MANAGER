// Cloudflare Pages Function - handles all /api/* routes
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

  // Simple auth check
  const authHeader = request.headers.get('Authorization');
  const masterPassword = authHeader?.replace('Bearer ', '');

  try {
    // Init DB tables
    await env.DB.exec(`
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
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    try { await env.DB.prepare("ALTER TABLE todos ADD COLUMN category TEXT DEFAULT 'General'").run(); } catch (_) {}
    try { await env.DB.prepare("ALTER TABLE todos ADD COLUMN subtasks TEXT DEFAULT '[]'").run(); } catch (_) {}

    // Ensure default master password exists
    const pwRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'master_password'").first();
    if (!pwRow) {
      await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('master_password', 'BRAWLSTARSBRAWLSTARS1234')").run();
    }

    // ---- AUTH ----
    if (path === '/auth/verify' && method === 'POST') {
      const body = await request.json();
      const { password } = body || {};
      const currentPw = (await env.DB.prepare("SELECT value FROM settings WHERE key = 'master_password'").first())?.value || 'BRAWLSTARSBRAWLSTARS1234';
      if (password === currentPw) {
        return new Response(JSON.stringify({ success: true, message: 'Vault unlocked successfully' }), { headers });
      }
      return new Response(JSON.stringify({ success: false, error: 'Incorrect master password' }), { headers, status: 401 });
    }

    if (path === '/auth/status' && method === 'GET') {
      const currentPw = (await env.DB.prepare("SELECT value FROM settings WHERE key = 'master_password'").first())?.value || 'BRAWLSTARSBRAWLSTARS1234';
      return new Response(JSON.stringify({ configured: Boolean(currentPw), protected: true }), { headers });
    }

    if (path === '/auth/change-password' && method === 'POST') {
      const body = await request.json();
      const { currentPassword, newPassword } = body || {};
      if (!newPassword || newPassword.trim().length < 4) {
        return new Response(JSON.stringify({ success: false, error: 'New password must be at least 4 characters' }), { headers, status: 400 });
      }
      const currentPw = (await env.DB.prepare("SELECT value FROM settings WHERE key = 'master_password'").first())?.value || 'BRAWLSTARSBRAWLSTARS1234';
      if (currentPassword !== currentPw) {
        return new Response(JSON.stringify({ success: false, error: 'Current master password is incorrect' }), { headers, status: 401 });
      }
      await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('master_password', ?)").bind(newPassword.trim()).run();
      return new Response(JSON.stringify({ success: true, message: 'Master password updated successfully' }), { headers });
    }

    // ---- PASSWORDS ----
    if (path === '/passwords' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM passwords ORDER BY updated_at DESC').all();
      return new Response(JSON.stringify(results), { headers });
    }

    if (path === '/passwords' && method === 'POST') {
      const body = await request.json();
      const { title, username, password, url: siteUrl, description } = body;
      const result = await env.DB.prepare(
        'INSERT INTO passwords (title, username, password, url, description) VALUES (?, ?, ?, ?, ?)'
      ).bind(title, username || '', password, siteUrl || '', description || '').run();
      return new Response(JSON.stringify({ id: result.meta.last_row_id, ...body }), { headers, status: 201 });
    }

    if (path.startsWith('/passwords/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await request.json();
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

    // ---- TODOS ----
    if (path === '/todos' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM todos ORDER BY due_date ASC, updated_at DESC').all();
      return new Response(JSON.stringify(results), { headers });
    }

    if (path === '/todos' && method === 'POST') {
      const body = await request.json();
      const { title, description, due_date, priority, category, subtasks } = body;
      const result = await env.DB.prepare(
        'INSERT INTO todos (title, description, due_date, priority, category, subtasks) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(title, description || '', due_date || null, priority || 'medium', category || 'General', subtasks || '[]').run();
      return new Response(JSON.stringify({ id: result.meta.last_row_id, ...body }), { headers, status: 201 });
    }

    if (path === '/todos/completed' && method === 'DELETE') {
      const res = await env.DB.prepare('DELETE FROM todos WHERE completed = 1').run();
      return new Response(JSON.stringify({ success: true, deleted: res.meta.changes }), { headers });
    }

    if (path.startsWith('/todos/') && path.endsWith('/breakdown') && method === 'POST') {
      const id = path.split('/')[2];
      const todo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?').bind(id).first();
      if (!todo) return new Response(JSON.stringify({ error: 'Task not found' }), { headers, status: 404 });

      let existing = [];
      try { existing = JSON.parse(todo.subtasks || '[]'); } catch (_) {}
      const nextId = existing.length > 0 ? Math.max(...existing.map(s => s.id || 0)) + 1 : 1;
      const generated = [
        `Review requirements for "${todo.title}"`,
        `Prepare credentials & resources`,
        `Execute primary action steps`,
        `Test and verify output`
      ];
      const newItems = generated.map((txt, idx) => ({ id: nextId + idx, text: txt, done: false }));
      const updatedSubtasks = [...existing, ...newItems];

      await env.DB.prepare('UPDATE todos SET subtasks = ?, updated_at = datetime("now") WHERE id = ?')
        .bind(JSON.stringify(updatedSubtasks), id).run();

      return new Response(JSON.stringify({ success: true, subtasks: updatedSubtasks }), { headers });
    }

    if (path.startsWith('/todos/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await request.json();
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

    // ---- ATTACHMENTS ----
    if (path === '/attachments' && method === 'POST') {
      const body = await request.json();
      const { item_type, item_id, filename, content, mime_type } = body;
      const result = await env.DB.prepare(
        'INSERT INTO attachments (item_type, item_id, filename, content, mime_type) VALUES (?, ?, ?, ?, ?)'
      ).bind(item_type, item_id, filename, content, mime_type || 'application/octet-stream').run();
      return new Response(JSON.stringify({ id: result.meta.last_row_id }), { headers, status: 201 });
    }

    if (path.startsWith('/attachments/') && method === 'GET') {
      const parts = path.split('/');
      const item_type = parts[2];
      const item_id = parts[3];
      const { results } = await env.DB.prepare(
        'SELECT id, item_type, item_id, filename, mime_type, created_at FROM attachments WHERE item_type=? AND item_id=?'
      ).bind(item_type, item_id).all();
      return new Response(JSON.stringify(results), { headers });
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

    // ---- AUDIT ----
    if (path === '/audit' && method === 'GET') {
      const passwords = (await env.DB.prepare('SELECT id, title, username, password, url FROM passwords').all()).results || [];
      const todos = (await env.DB.prepare('SELECT id, title, due_date, priority, completed FROM todos').all()).results || [];
      
      const weakPasswords = passwords.filter(p => !p.password || p.password.length < 12 || !/[0-9]/.test(p.password) || !/[^A-Za-z0-9]/.test(p.password));
      const pwMap = {};
      passwords.forEach(p => {
        if (p.password) {
          pwMap[p.password] = (pwMap[p.password] || 0) + 1;
        }
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

    // ---- BACKUP EXPORT ----
    if (path === '/backup/export' && method === 'GET') {
      const passwords = (await env.DB.prepare('SELECT * FROM passwords').all()).results || [];
      const todos = (await env.DB.prepare('SELECT * FROM todos').all()).results || [];
      const attachments = (await env.DB.prepare('SELECT id, item_type, item_id, filename, mime_type, created_at FROM attachments').all()).results || [];
      
      let sqlDump = `-- Cloudflare D1 SQL Export for Vault\n-- Exported on: ${new Date().toISOString()}\n\n`;
      sqlDump += `CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, username TEXT, password TEXT NOT NULL, url TEXT, description TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));\n`;
      sqlDump += `CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, due_date TEXT, priority TEXT DEFAULT 'medium', completed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));\n`;
      sqlDump += `CREATE TABLE IF NOT EXISTS attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, item_type TEXT NOT NULL, item_id INTEGER NOT NULL, filename TEXT NOT NULL, content TEXT NOT NULL, mime_type TEXT, created_at TEXT DEFAULT (datetime('now')));\n\n`;

      for (const p of passwords) {
        sqlDump += `INSERT INTO passwords (id, title, username, password, url, description, created_at, updated_at) VALUES (${p.id}, ${JSON.stringify(p.title || '')}, ${JSON.stringify(p.username || '')}, ${JSON.stringify(p.password || '')}, ${JSON.stringify(p.url || '')}, ${JSON.stringify(p.description || '')}, ${JSON.stringify(p.created_at || '')}, ${JSON.stringify(p.updated_at || '')});\n`;
      }
      for (const t of todos) {
        sqlDump += `INSERT INTO todos (id, title, description, due_date, priority, completed, created_at, updated_at) VALUES (${t.id}, ${JSON.stringify(t.title || '')}, ${JSON.stringify(t.description || '')}, ${JSON.stringify(t.due_date || '')}, ${JSON.stringify(t.priority || 'medium')}, ${t.completed ? 1 : 0}, ${JSON.stringify(t.created_at || '')}, ${JSON.stringify(t.updated_at || '')});\n`;
      }

      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        passwords,
        todos,
        attachments,
        sql: sqlDump,
      }), { headers });
    }

    // ---- BACKUP IMPORT ----
    if (path === '/backup/import' && method === 'POST') {
      const body = await request.json();
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
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}
