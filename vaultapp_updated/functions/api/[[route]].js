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
      await env.DB.prepare('DELETE FROM attachments WHERE item_type="password" AND item_id=?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ---- TODOS ----
    if (path === '/todos' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM todos ORDER BY due_date ASC, updated_at DESC').all();
      return new Response(JSON.stringify(results), { headers });
    }

    if (path === '/todos' && method === 'POST') {
      const body = await request.json();
      const { title, description, due_date, priority } = body;
      const result = await env.DB.prepare(
        'INSERT INTO todos (title, description, due_date, priority) VALUES (?, ?, ?, ?)'
      ).bind(title, description || '', due_date || null, priority || 'medium').run();
      return new Response(JSON.stringify({ id: result.meta.last_row_id, ...body }), { headers, status: 201 });
    }

    if (path.startsWith('/todos/') && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await request.json();
      const { title, description, due_date, priority, completed } = body;
      await env.DB.prepare(
        'UPDATE todos SET title=?, description=?, due_date=?, priority=?, completed=?, updated_at=datetime("now") WHERE id=?'
      ).bind(title, description || '', due_date || null, priority || 'medium', completed ? 1 : 0, id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (path.startsWith('/todos/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await env.DB.prepare('DELETE FROM todos WHERE id=?').bind(id).run();
      await env.DB.prepare('DELETE FROM attachments WHERE item_type="todo" AND item_id=?').bind(id).run();
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

    return new Response(JSON.stringify({ error: 'Not found' }), { headers, status: 404 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { headers, status: 500 });
  }
}
