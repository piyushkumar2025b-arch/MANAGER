// ============================================================================
// 🛠️ VAULT DEVELOPER & PRODUCTIVITY TOOLBOX SUITE (OMNI TOOLKIT)
// ============================================================================

let currentToolboxSubtab = 'json';

// ---- SUBTABS CONFIGURATION ----
const TOOLBOX_SUBTABS = [
  { id: 'json', icon: '📐', label: 'JSON Studio' },
  { id: 'markdown', icon: '📝', label: 'Markdown Studio' },
  { id: 'ssl', icon: '🔒', label: 'SSL & WHOIS' },
  { id: 'breach', icon: '🛡️', label: 'Breach & Entropy' },
  { id: 'rest', icon: '🚀', label: 'API Playground' },
  { id: 'crypto', icon: '🔐', label: 'Crypto & Hashes' },
  { id: 'jwt', icon: '🎫', label: 'JWT Inspector' },
  { id: 'uuid', icon: '🎲', label: 'UUID & ULID' },
  { id: 'regex', icon: '🔍', label: 'Regex Lab' },
  { id: 'cron', icon: '⏰', label: 'Cron Scheduler' },
  { id: 'epoch', icon: '⏳', label: 'Epoch & Time' },
  { id: 'diff', icon: '📑', label: 'Diff & Case' },
  { id: 'color', icon: '🎨', label: 'Color & WCAG' },
  { id: 'network', icon: '🌐', label: 'Subnet & HTTP' },
  { id: 'extratools', icon: '⚡', label: 'Extra Tools (51)' }
];

// ---- MAIN TOOLBOX ENTRY POINT ----
window.renderToolboxTab = function() {
  const content = document.getElementById('mainContent');
  if (!content) return;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:18px;">
      <!-- TOP HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;">
        <div>
          <div style="font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px;">
            <span>🛠️</span> Developer & Productivity Toolbox Suite
          </div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px;">
            Client-side cryptographic engines, Markdown studio, SSL/WHOIS auditor, breach analyzer, REST playground, and subnet tools.
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent);font-size:11px;font-weight:600;padding:3px 9px;">
            14 Sub-Tools Active
          </span>
          <button class="filter-pill" onclick="switchTab('bots')" style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;background:var(--accent);color:#fff;border:none;font-weight:600;padding:6px 12px;border-radius:6px;">
            <span>🤖</span> Bot Controller (Telegram & Discord)
          </button>
          <button class="filter-pill" onclick="copyToolboxRestInfo()" style="font-size:12px;display:flex;align-items:center;gap:5px;">
            <span>📋</span> API Endpoints
          </button>
        </div>
      </div>

      <!-- SUBNAV PILLS BAR -->
      <div class="toolbox-subnav" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;">
        ${TOOLBOX_SUBTABS.map(st => `
          <button 
            id="tb-btn-${st.id}"
            class="settings-cat-pill ${currentToolboxSubtab === st.id ? 'active' : ''}" 
            onclick="switchToolboxSubtab('${st.id}')"
            style="font-size:12px;padding:6px 14px;white-space:nowrap;display:flex;align-items:center;gap:6px;"
          >
            <span>${st.icon}</span> <span>${st.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- ACTIVE SUBTAB CONTAINER -->
      <div id="toolboxSubtabContent" style="display:flex;flex-direction:column;gap:16px;">
        <!-- Rendered by active subtab handler -->
      </div>
    </div>
  `;

  renderActiveToolboxSubtab();
};

window.switchToolboxSubtab = function(tabId) {
  currentToolboxSubtab = tabId;
  document.querySelectorAll('.toolbox-subnav .settings-cat-pill').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`tb-btn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderActiveToolboxSubtab();
};

function renderActiveToolboxSubtab() {
  const container = document.getElementById('toolboxSubtabContent');
  if (!container) return;

  switch (currentToolboxSubtab) {
    case 'json': renderJsonStudio(container); break;
    case 'markdown': renderMarkdownStudio(container); break;
    case 'ssl': renderSslInspector(container); break;
    case 'breach': renderBreachAuditor(container); break;
    case 'rest': renderRestPlayground(container); break;
    case 'crypto': renderCryptoMultiTool(container); break;
    case 'jwt': renderJwtInspector(container); break;
    case 'uuid': renderUuidGenerator(container); break;
    case 'regex': renderRegexLab(container); break;
    case 'cron': renderCronExplainer(container); break;
    case 'epoch': renderEpochConverter(container); break;
    case 'diff': renderDiffAndCase(container); break;
    case 'color': renderColorAndWcag(container); break;
    case 'network': renderNetworkAndHttp(container); break;
    case 'extratools': renderExtraToolsDirectory(container); break;
    default: renderJsonStudio(container);
  }
}

function renderExtraToolsDirectory(container) {
  const tools = window.EXTENDED_SECONDARY_TOOLS || [];
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px;color:#fff;">
            <span>⚡</span> Secondary Edge Tools & Studios Directory (51 Tools)
          </div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px;">
            Specialized developer utilities and Cloudflare Edge microservices kept accessible as secondary tools.
          </div>
        </div>
        <button onclick="toggleExtraToolsSidebar()" class="btn-sm primary" style="background:#7c3aed;border-color:#7c3aed;">
          <span>🧰</span> Open Quick Sidebar Drawer
        </button>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <input type="text" id="tbExtraToolsSearch" placeholder="Filter 51 secondary tools..." oninput="filterToolboxExtraTools(this.value)" style="flex:1;min-width:240px;padding:9px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;outline:none;" />
      </div>

      <div id="tbExtraToolsGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:10px;margin-top:6px;">
        ${tools.map(t => `
          <div class="tb-extra-tool-card" data-text="${t.name.toLowerCase()} ${t.desc.toLowerCase()} ${t.cat.toLowerCase()}" onclick="switchTab('${t.id}')" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;cursor:pointer;transition:all 0.15s ease;display:flex;align-items:flex-start;gap:10px;">
            <div style="font-size:22px;line-height:1;width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border-radius:8px;flex-shrink:0;">${t.icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                <span style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</span>
                <span style="font-size:9.5px;font-weight:700;text-transform:uppercase;padding:2px 5px;background:rgba(124,58,237,0.2);color:#c4b5fd;border-radius:4px;">${t.cat}</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:3px;line-height:1.4;">${t.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.filterToolboxExtraTools = function(query) {
  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.tb-extra-tool-card');
  cards.forEach(c => {
    const text = c.getAttribute('data-text') || '';
    c.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
  });
};

function copyToolboxRestInfo() {
  const info = `Vault Developer REST API Endpoints:
- GET  /api/network/ssl-inspect?domain=github.com
- GET  /api/network/whois?domain=cloudflare.com
- POST /api/network/proxy-fetch (body: {"url":"...", "method":"GET"})
- GET  /api/security/pwned-check?prefix=21BD1
- GET  /api/tools/uuid?count=10&type=uuidv4
- POST /api/tools/hash (body: {"text":"...", "algorithm":"SHA-256"})
- POST /api/tools/jwt (body: {"token":"..."})
- POST /api/tools/cron (body: {"expr":"*/15 * * * *"})
- GET  /api/tools/subnet?cidr=192.168.1.0/24`;
  navigator.clipboard.writeText(info).then(() => {
    toast('Copied Developer REST API reference to clipboard!');
  }).catch(() => {
    toast('API: /api/network/ssl-inspect, /api/network/whois, /api/network/proxy-fetch, /api/security/pwned-check');
  });
}

// ============================================================================
// 1. 📐 JSON & DATA STUDIO (FORMATTER, VALIDATOR, MINIFIER, CONVERTER)
// ============================================================================
let jsonStudioViewMode = 'editor'; // 'editor' | 'tree'

function renderJsonStudio(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <!-- TOOLBAR -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-weight:700;font-size:14px;">📐 JSON & Data Studio</span>
          <span id="jsonStatusBadge" class="badge" style="background:rgba(34,197,94,0.15);color:#22c55e;font-size:11px;">Valid JSON</span>
          <span id="jsonStats" style="font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;"></span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <select id="jsonIndentSelect" style="padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:11px;">
            <option value="2">2 Spaces</option>
            <option value="4">4 Spaces</option>
            <option value="tab">Tab Indent</option>
          </select>
          <button class="btn btn-sm btn-primary" onclick="formatJsonInput()">✨ Beautify</button>
          <button class="btn btn-sm" onclick="minifyJsonInput()">🗜️ Minify</button>
          <button class="filter-pill" onclick="toggleJsonViewMode()">
            <span id="jsonViewToggleLabel">🌳 Tree View</span>
          </button>
          <button class="filter-pill" onclick="copyJsonOutput()">📋 Copy</button>
          <button class="filter-pill" onclick="clearJsonStudio()" style="color:var(--danger);">✕ Clear</button>
        </div>
      </div>

      <!-- PRESETS & QUICK CONVERTERS BAR -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;background:var(--surface2);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);flex-wrap:wrap;">
          <span>Load Sample:</span>
          <button class="filter-pill" onclick="loadJsonSample('api')" style="font-size:10px;padding:3px 8px;">API Response</button>
          <button class="filter-pill" onclick="loadJsonSample('package')" style="font-size:10px;padding:3px 8px;">Config Object</button>
          <button class="filter-pill" onclick="loadJsonSample('users')" style="font-size:10px;padding:3px 8px;">Array List</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;flex-wrap:wrap;">
          <span style="color:var(--muted);">Convert to:</span>
          <button class="filter-pill" onclick="convertJsonToTypeScript()" style="font-size:10px;padding:3px 8px;border-color:var(--accent);color:var(--accent);">📘 TypeScript Types</button>
          <button class="filter-pill" onclick="convertJsonToYaml()" style="font-size:10px;padding:3px 8px;">YAML</button>
          <button class="filter-pill" onclick="convertJsonToQueryParams()" style="font-size:10px;padding:3px 8px;">URL Query</button>
          <button class="filter-pill" onclick="convertJsonToCsv()" style="font-size:10px;padding:3px 8px;">CSV Table</button>
        </div>
      </div>

      <!-- MAIN EDITOR / TREE VIEW -->
      <div id="jsonEditorPane" style="display:flex;flex-direction:column;gap:8px;">
        <textarea
          id="jsonStudioText"
          oninput="validateJsonRealtime()"
          placeholder="Paste or write raw JSON here..."
          rows="16"
          style="width:100%;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.5;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);resize:vertical;outline:none;"
        >{
  "app": "Vault",
  "version": "1.0.0",
  "developer": "Google AI Studio",
  "features": [
    "Tasks & Credentials",
    "Cloudflare Drive",
    "Developer Toolbox",
    "Longevity Nutrition API"
  ],
  "security": {
    "algorithm": "AES-256-GCM",
    "zeroKnowledge": true,
    "passwordsEncrypted": 128
  },
  "metrics": {
    "uptime": 99.99,
    "latencyMs": 14
  }
}</textarea>
        <div id="jsonErrorNotice" style="display:none;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:var(--danger);padding:8px 12px;border-radius:6px;font-size:12px;font-family:'JetBrains Mono',monospace;"></div>
      </div>

      <div id="jsonTreePane" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;max-height:450px;overflow-y:auto;font-family:'JetBrains Mono',monospace;font-size:12px;">
        <!-- Rendered tree -->
      </div>

    </div>
  `;

  validateJsonRealtime();
}

function validateJsonRealtime() {
  const textEl = document.getElementById('jsonStudioText');
  const badgeEl = document.getElementById('jsonStatusBadge');
  const statsEl = document.getElementById('jsonStats');
  const errEl = document.getElementById('jsonErrorNotice');
  if (!textEl || !badgeEl) return;

  const raw = textEl.value.trim();
  if (!raw) {
    badgeEl.textContent = 'Empty';
    badgeEl.style.background = 'var(--surface2)';
    badgeEl.style.color = 'var(--muted)';
    if (statsEl) statsEl.textContent = '0 bytes';
    if (errEl) errEl.style.display = 'none';
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    badgeEl.textContent = '✓ Valid JSON';
    badgeEl.style.background = 'rgba(34,197,94,0.15)';
    badgeEl.style.color = '#22c55e';
    if (errEl) errEl.style.display = 'none';

    let keysCount = 0;
    if (Array.isArray(parsed)) keysCount = parsed.length;
    else if (typeof parsed === 'object' && parsed !== null) keysCount = Object.keys(parsed).length;

    if (statsEl) {
      statsEl.textContent = `${(new Blob([raw]).size)} bytes | ${Array.isArray(parsed) ? 'Array [' + keysCount + ']' : 'Object {' + keysCount + '}'}`;
    }
  } catch (err) {
    badgeEl.textContent = '✕ Syntax Error';
    badgeEl.style.background = 'rgba(239,68,68,0.15)';
    badgeEl.style.color = 'var(--danger)';
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = err.message;
    }
    if (statsEl) statsEl.textContent = `${raw.length} chars`;
  }
}

function formatJsonInput() {
  const textEl = document.getElementById('jsonStudioText');
  const indentSelect = document.getElementById('jsonIndentSelect');
  if (!textEl) return;
  try {
    const parsed = JSON.parse(textEl.value);
    const space = indentSelect.value === 'tab' ? '\t' : parseInt(indentSelect.value, 10);
    textEl.value = JSON.stringify(parsed, null, space);
    validateJsonRealtime();
    toast('JSON beautified');
  } catch (err) {
    toast('Cannot format: invalid JSON syntax');
  }
}

function minifyJsonInput() {
  const textEl = document.getElementById('jsonStudioText');
  if (!textEl) return;
  try {
    const parsed = JSON.parse(textEl.value);
    textEl.value = JSON.stringify(parsed);
    validateJsonRealtime();
    toast('JSON minified');
  } catch (err) {
    toast('Cannot minify: invalid JSON syntax');
  }
}

function toggleJsonViewMode() {
  const editor = document.getElementById('jsonEditorPane');
  const tree = document.getElementById('jsonTreePane');
  const toggleLabel = document.getElementById('jsonViewToggleLabel');
  const textEl = document.getElementById('jsonStudioText');
  if (!editor || !tree) return;

  if (jsonStudioViewMode === 'editor') {
    try {
      const parsed = JSON.parse(textEl.value);
      tree.innerHTML = buildJsonTreeHtml(parsed);
      editor.style.display = 'none';
      tree.style.display = 'block';
      jsonStudioViewMode = 'tree';
      if (toggleLabel) toggleLabel.textContent = '📝 Raw Editor';
    } catch (err) {
      toast('Fix JSON syntax errors to open Tree View');
    }
  } else {
    editor.style.display = 'flex';
    tree.style.display = 'none';
    jsonStudioViewMode = 'editor';
    if (toggleLabel) toggleLabel.textContent = '🌳 Tree View';
  }
}

function buildJsonTreeHtml(obj, depth = 0) {
  if (obj === null) return '<span style="color:var(--muted)">null</span>';
  if (typeof obj === 'boolean') return `<span style="color:#f59e0b">${obj}</span>`;
  if (typeof obj === 'number') return `<span style="color:#38bdf8">${obj}</span>`;
  if (typeof obj === 'string') return `<span style="color:#22c55e">"${esc(obj)}"</span>`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '<span>[]</span>';
    return `
      <div style="padding-left:14px;border-left:1px dashed var(--border);margin:2px 0;">
        <span style="color:var(--muted)">[ (${obj.length})</span>
        ${obj.map((item, idx) => `
          <div style="margin:2px 0;">
            <span style="color:var(--muted);font-size:10px;">${idx}:</span> ${buildJsonTreeHtml(item, depth + 1)}
          </div>
        `).join('')}
        <span style="color:var(--muted)">]</span>
      </div>
    `;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '<span>{}</span>';
    return `
      <div style="padding-left:14px;border-left:1px dashed var(--border);margin:2px 0;">
        <span style="color:var(--muted)">{</span>
        ${keys.map(key => `
          <div style="margin:2px 0;">
            <span style="color:var(--accent);font-weight:600;">"${esc(key)}"</span>: ${buildJsonTreeHtml(obj[key], depth + 1)}
          </div>
        `).join('')}
        <span style="color:var(--muted)">}</span>
      </div>
    `;
  }

  return esc(String(obj));
}

function copyJsonOutput() {
  const textEl = document.getElementById('jsonStudioText');
  if (!textEl || !textEl.value) return;
  navigator.clipboard.writeText(textEl.value).then(() => {
    toast('JSON copied to clipboard');
  });
}

function clearJsonStudio() {
  const textEl = document.getElementById('jsonStudioText');
  if (textEl) {
    textEl.value = '';
    validateJsonRealtime();
  }
}

function loadJsonSample(type) {
  const textEl = document.getElementById('jsonStudioText');
  if (!textEl) return;

  if (type === 'api') {
    textEl.value = JSON.stringify({
      status: 200,
      message: "Resource fetched successfully",
      timestamp: new Date().toISOString(),
      pagination: { page: 1, limit: 20, total: 104 },
      data: [
        { id: "usr_101", name: "Alex Mercer", role: "admin", active: true },
        { id: "usr_102", name: "Elena Rostova", role: "analyst", active: true }
      ]
    }, null, 2);
  } else if (type === 'package') {
    textEl.value = JSON.stringify({
      name: "vault-toolbox",
      version: "1.0.0",
      private: true,
      scripts: {
        build: "vite build",
        start: "node server.js"
      },
      dependencies: {
        express: "^4.21.0",
        qrcode: "^1.5.4"
      }
    }, null, 2);
  } else if (type === 'users') {
    textEl.value = JSON.stringify([
      { id: 1, name: "Leanne Graham", email: "sincere@april.biz", city: "Gwenborough" },
      { id: 2, name: "Ervin Howell", email: "shanna@melissa.tv", city: "Wisokyburgh" },
      { id: 3, name: "Clementine Bauch", email: "nathan@yesenia.net", city: "McKenziehaven" }
    ], null, 2);
  }

  validateJsonRealtime();
  toast('Sample loaded');
}

function convertJsonToYaml() {
  const textEl = document.getElementById('jsonStudioText');
  if (!textEl) return;
  try {
    const obj = JSON.parse(textEl.value);
    const toYaml = (val, indent = 0) => {
      const sp = ' '.repeat(indent);
      if (val === null) return 'null\n';
      if (typeof val === 'boolean' || typeof val === 'number') return `${val}\n`;
      if (typeof val === 'string') return `${val.includes('\n') ? `|-\n${val.split('\n').map(l => sp + '  ' + l).join('\n')}` : val}\n`;
      if (Array.isArray(val)) {
        if (val.length === 0) return '[]\n';
        return '\n' + val.map(v => `${sp}- ${toYaml(v, indent + 2).trimStart()}`).join('');
      }
      if (typeof val === 'object') {
        const keys = Object.keys(val);
        if (keys.length === 0) return '{}\n';
        return '\n' + keys.map(k => `${sp}${k}: ${toYaml(val[k], indent + 2).trimStart()}`).join('');
      }
      return String(val) + '\n';
    };

    textEl.value = toYaml(obj).trim();
    toast('Converted to YAML');
  } catch (err) {
    toast('Invalid JSON: ' + err.message);
  }
}

function convertJsonToQueryParams() {
  const textEl = document.getElementById('jsonStudioText');
  if (!textEl) return;
  try {
    const obj = JSON.parse(textEl.value);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(obj)) {
      params.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    textEl.value = params.toString();
    toast('Converted to URL query string');
  } catch (err) {
    toast('Invalid JSON: ' + err.message);
  }
}

function convertJsonToCsv() {
  const textEl = document.getElementById('jsonStudioText');
  if (!textEl) return;
  try {
    let arr = JSON.parse(textEl.value);
    if (!Array.isArray(arr)) {
      if (typeof arr === 'object' && arr !== null) arr = [arr];
      else throw new Error('Input must be a JSON array of objects to generate CSV');
    }
    if (arr.length === 0) return toast('Array is empty');

    const headers = Array.from(new Set(arr.flatMap(o => Object.keys(o))));
    const csvRows = [headers.join(',')];
    for (const row of arr) {
      const values = headers.map(h => {
        const val = row[h] !== undefined ? row[h] : '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    textEl.value = csvRows.join('\n');
    toast('Converted to CSV');
  } catch (err) {
    toast('CSV Conversion: ' + err.message);
  }
}

function convertJsonToTypeScript() {
  const textEl = document.getElementById('jsonStudioText');
  if (!textEl) return;
  try {
    const raw = JSON.parse(textEl.value);
    const interfaces = [];
    let interfaceCounter = 1;

    function toPascalCase(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase()).replace(/[\s-_]+/g, '');
    }

    function getType(val, keyName = '') {
      if (val === null) return 'any';
      if (typeof val === 'string') return 'string';
      if (typeof val === 'number') return 'number';
      if (typeof val === 'boolean') return 'boolean';
      if (Array.isArray(val)) {
        if (val.length === 0) return 'any[]';
        const innerType = getType(val[0], keyName.replace(/s$/, '') || 'Item');
        return `${innerType}[]`;
      }
      if (typeof val === 'object') {
        const interfaceName = keyName ? toPascalCase(keyName) : `GeneratedType${interfaceCounter++}`;
        const fields = [];
        for (const [k, v] of Object.entries(val)) {
          const fieldType = getType(v, k);
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
          fields.push(`  ${safeKey}: ${fieldType};`);
        }
        interfaces.push(`export interface ${interfaceName} {\n${fields.join('\n')}\n}`);
        return interfaceName;
      }
      return 'any';
    }

    const rootName = Array.isArray(raw) ? 'RootItem' : 'RootObject';
    if (Array.isArray(raw)) {
      if (raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
        getType(raw[0], 'RootItem');
        interfaces.push(`export type RootArray = RootItem[];`);
      } else {
        const itemType = raw.length > 0 ? typeof raw[0] : 'any';
        interfaces.push(`export type RootArray = ${itemType}[];`);
      }
    } else {
      getType(raw, rootName);
    }

    textEl.value = `/**\n * Auto-generated TypeScript definitions from JSON\n * Generated on ${new Date().toLocaleString()}\n */\n\n` + interfaces.reverse().join('\n\n');
    toast('✓ Converted to TypeScript Interfaces!');
  } catch (err) {
    toast('TypeScript Conversion error: ' + err.message);
  }
}

// ============================================================================
// 2. 🔐 CRYPTOGRAPHY & ENCODINGS (HASHES, HMAC, BASE64, URL, HTML)
// ============================================================================
let cryptoActiveTool = 'hash'; // 'hash' | 'base64' | 'url' | 'html' | 'secretgen'

function renderCryptoMultiTool(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <!-- SUBNAV -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="settings-cat-pill ${cryptoActiveTool === 'hash' ? 'active' : ''}" onclick="setCryptoTool('hash')"># Hashes & HMAC</button>
          <button class="settings-cat-pill ${cryptoActiveTool === 'base64' ? 'active' : ''}" onclick="setCryptoTool('base64')">📦 Base64 (Text & File)</button>
          <button class="settings-cat-pill ${cryptoActiveTool === 'url' ? 'active' : ''}" onclick="setCryptoTool('url')">🔗 URL Encode / Decode</button>
          <button class="settings-cat-pill ${cryptoActiveTool === 'html' ? 'active' : ''}" onclick="setCryptoTool('html')">&lt;/&gt; HTML Entities</button>
          <button class="settings-cat-pill ${cryptoActiveTool === 'secretgen' ? 'active' : ''}" onclick="setCryptoTool('secretgen')">🔑 Secret Generator</button>
        </div>
      </div>

      <!-- TOOL PANELS -->
      <div id="cryptoToolBody"></div>

    </div>
  `;

  renderCryptoSubTool();
}

function setCryptoTool(tool) {
  cryptoActiveTool = tool;
  renderCryptoMultiTool(document.getElementById('toolboxSubtabContent'));
}

function renderCryptoSubTool() {
  const el = document.getElementById('cryptoToolBody');
  if (!el) return;

  if (cryptoActiveTool === 'hash') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px;display:block;">Input Text for Cryptographic Hashing:</label>
          <textarea id="hashInputText" oninput="computeHashesRealtime()" rows="3" placeholder="Enter text to hash..." style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;"></textarea>
        </div>

        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;">
            <span>Optional HMAC Key:</span>
            <input type="text" id="hmacSecretKey" oninput="computeHashesRealtime()" placeholder="Leave empty for standard hash" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:12px;width:240px;" />
          </label>
        </div>

        <!-- RESULTS GRID -->
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;">
          ${['SHA-256', 'SHA-512', 'SHA-1', 'SHA-384'].map(algo => `
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;display:flex;flex-direction:column;gap:4px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:700;color:var(--accent);">${algo}</span>
                <button class="filter-pill" onclick="copyHashResult('${algo}')" style="font-size:10px;padding:2px 8px;">📋 Copy</button>
              </div>
              <div id="hash_result_${algo}" style="font-family:'JetBrains Mono',monospace;font-size:11px;word-break:break-all;color:var(--text);">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    computeHashesRealtime();
  } else if (cryptoActiveTool === 'base64') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">Base64 Text & File Transcoder</span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-primary" onclick="encodeBase64Text()">Encode to Base64</button>
            <button class="btn btn-sm" onclick="decodeBase64Text()">Decode from Base64</button>
            <button class="filter-pill" onclick="copyBase64Result()">📋 Copy</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Plaintext Input:</label>
            <textarea id="base64Plain" rows="6" placeholder="Type or paste plaintext..." style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;"></textarea>
          </div>
          <div>
            <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Base64 Output / Input:</label>
            <textarea id="base64Encoded" rows="6" placeholder="Base64 encoded string..." style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;word-break:break-all;"></textarea>
          </div>
        </div>

        <!-- FILE TO BASE64 CONVERTER -->
        <div style="border:1px dashed var(--border);border-radius:var(--radius-sm);padding:14px;text-align:center;background:var(--surface2);display:flex;flex-direction:column;align-items:center;gap:6px;">
          <span style="font-size:24px;">📁</span>
          <div style="font-size:12px;font-weight:600;color:var(--text);">Convert Any Local File to Base64 Data URI</div>
          <div style="font-size:11px;color:var(--muted);">Images, PDFs, or archives encode instantly client-side without leaving your browser.</div>
          <input type="file" id="base64FileInput" onchange="handleFileToBase64(event)" style="display:none;" />
          <button class="btn btn-sm btn-primary" onclick="document.getElementById('base64FileInput').click()" style="margin-top:4px;">
            Select File to Encode
          </button>
        </div>
      </div>
    `;
  } else if (cryptoActiveTool === 'url') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">URL Encoder & Decoder</span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-primary" onclick="runUrlEncode()">Encode URL</button>
            <button class="btn btn-sm" onclick="runUrlDecode()">Decode URL</button>
            <button class="filter-pill" onclick="parseUrlQueryParams()">🔍 Parse Query Params</button>
          </div>
        </div>

        <textarea id="urlTranscodeText" rows="4" placeholder="Enter URL or string..." style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;">https://vault.example.com/search?q=developer+toolbox&category=security&page=1#results</textarea>

        <div id="urlParamsTable" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;font-size:12px;">
          <!-- Rendered parameters table -->
        </div>
      </div>
    `;
  } else if (cryptoActiveTool === 'html') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">HTML Entity Escaper & Unescaper</span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-primary" onclick="runHtmlEscape()">Escape (&lt; &gt; &amp;)</button>
            <button class="btn btn-sm" onclick="runHtmlUnescape()">Unescape</button>
          </div>
        </div>

        <textarea id="htmlEntityText" rows="5" placeholder="Enter text with HTML tags or entities..." style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;"><div class="secure-badge" id="app">Vault & "Protection" > 100%</div></textarea>
      </div>
    `;
  } else if (cryptoActiveTool === 'secretgen') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="font-size:12px;font-weight:600;color:var(--text);">Cryptographically Secure Secret & Token Generator</div>
        
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <label style="font-size:12px;color:var(--muted);">
            Length: <strong id="secretLengthVal" style="color:var(--text);">32</strong>
            <input type="range" id="secretLengthSlider" min="8" max="128" value="32" oninput="document.getElementById('secretLengthVal').textContent = this.value; generateSecretToken();" style="vertical-align:middle;margin-left:8px;" />
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:4px;">
            <input type="checkbox" id="secretIncludeUpper" checked onchange="generateSecretToken()" /> A-Z
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:4px;">
            <input type="checkbox" id="secretIncludeLower" checked onchange="generateSecretToken()" /> a-z
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:4px;">
            <input type="checkbox" id="secretIncludeNumbers" checked onchange="generateSecretToken()" /> 0-9
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:4px;">
            <input type="checkbox" id="secretIncludeSymbols" checked onchange="generateSecretToken()" /> Symbols (!@#$%)
          </label>
          <button class="btn btn-sm btn-primary" onclick="generateSecretToken()">🔄 Regenerate</button>
        </div>

        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div id="secretResultText" style="font-family:'JetBrains Mono',monospace;font-size:13px;word-break:break-all;color:var(--accent);font-weight:600;"></div>
          <button class="filter-pill" onclick="copySecretResult()" style="font-size:11px;flex-shrink:0;">📋 Copy</button>
        </div>

        <div id="secretEntropyScore" style="font-size:11px;color:var(--muted);"></div>
      </div>
    `;
    generateSecretToken();
  }
}

async function computeHashesRealtime() {
  const inputEl = document.getElementById('hashInputText');
  const hmacKeyEl = document.getElementById('hmacSecretKey');
  if (!inputEl) return;

  const text = inputEl.value;
  const hmacKey = hmacKeyEl ? hmacKeyEl.value : '';
  const algos = ['SHA-256', 'SHA-512', 'SHA-1', 'SHA-384'];

  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  for (const algo of algos) {
    const resEl = document.getElementById(`hash_result_${algo}`);
    if (!resEl) continue;

    try {
      if (hmacKey) {
        const keyData = encoder.encode(hmacKey);
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: { name: algo } },
          false,
          ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
        resEl.textContent = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        const hashBuf = await crypto.subtle.digest(algo, data);
        resEl.textContent = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (err) {
      resEl.textContent = 'Error: ' + err.message;
    }
  }
}

function copyHashResult(algo) {
  const el = document.getElementById(`hash_result_${algo}`);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim()).then(() => {
    toast(`Copied ${algo} hash`);
  });
}

function encodeBase64Text() {
  const plainEl = document.getElementById('base64Plain');
  const encEl = document.getElementById('base64Encoded');
  if (!plainEl || !encEl) return;
  try {
    const bytes = new TextEncoder().encode(plainEl.value);
    let bin = '';
    bytes.forEach(b => bin += String.fromCharCode(b));
    encEl.value = btoa(bin);
    toast('Encoded to Base64');
  } catch (e) {
    toast('Encoding error: ' + e.message);
  }
}

function decodeBase64Text() {
  const plainEl = document.getElementById('base64Plain');
  const encEl = document.getElementById('base64Encoded');
  if (!plainEl || !encEl) return;
  try {
    const bin = atob(encEl.value.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    plainEl.value = new TextDecoder().decode(bytes);
    toast('Decoded from Base64');
  } catch (e) {
    toast('Invalid Base64 string');
  }
}

function copyBase64Result() {
  const encEl = document.getElementById('base64Encoded');
  if (!encEl || !encEl.value) return;
  navigator.clipboard.writeText(encEl.value).then(() => toast('Base64 copied'));
}

function handleFileToBase64(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const encEl = document.getElementById('base64Encoded');
    const plainEl = document.getElementById('base64Plain');
    if (encEl) encEl.value = reader.result;
    if (plainEl) plainEl.value = `File: ${file.name} (${file.size} bytes, ${file.type || 'application/octet-stream'})`;
    toast(`Encoded ${file.name} to Base64 data URI`);
  };
  reader.readAsDataURL(file);
}

function runUrlEncode() {
  const el = document.getElementById('urlTranscodeText');
  if (el) {
    el.value = encodeURIComponent(el.value);
    toast('URL Encoded');
  }
}

function runUrlDecode() {
  const el = document.getElementById('urlTranscodeText');
  if (el) {
    try {
      el.value = decodeURIComponent(el.value);
      toast('URL Decoded');
    } catch (e) {
      toast('Invalid URL encoding');
    }
  }
}

function parseUrlQueryParams() {
  const el = document.getElementById('urlTranscodeText');
  const tableEl = document.getElementById('urlParamsTable');
  if (!el || !tableEl) return;

  try {
    const url = new URL(el.value.trim());
    const entries = Array.from(url.searchParams.entries());
    if (entries.length === 0) {
      tableEl.style.display = 'block';
      tableEl.innerHTML = '<div style="color:var(--muted)">No query parameters found in URL.</div>';
      return;
    }

    tableEl.style.display = 'block';
    tableEl.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;color:var(--accent);">Extracted Query Parameters (${entries.length}):</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);text-align:left;">
            <th style="padding:4px 8px;color:var(--muted);">KEY</th>
            <th style="padding:4px 8px;color:var(--muted);">VALUE</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(([k, v]) => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:4px 8px;font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--text);">${esc(k)}</td>
              <td style="padding:4px 8px;font-family:'JetBrains Mono',monospace;color:var(--muted);">${esc(v)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    tableEl.style.display = 'block';
    tableEl.innerHTML = `<div style="color:var(--danger)">Please provide a full valid URL (e.g. https://...): ${esc(err.message)}</div>`;
  }
}

function runHtmlEscape() {
  const el = document.getElementById('htmlEntityText');
  if (!el) return;
  el.value = el.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  toast('HTML entities escaped');
}

function runHtmlUnescape() {
  const el = document.getElementById('htmlEntityText');
  if (!el) return;
  const doc = new DOMParser().parseFromString(el.value, 'text/html');
  el.value = doc.documentElement.textContent;
  toast('HTML entities unescaped');
}

function generateSecretToken() {
  const lenEl = document.getElementById('secretLengthSlider');
  const upper = document.getElementById('secretIncludeUpper')?.checked;
  const lower = document.getElementById('secretIncludeLower')?.checked;
  const num = document.getElementById('secretIncludeNumbers')?.checked;
  const sym = document.getElementById('secretIncludeSymbols')?.checked;
  const resEl = document.getElementById('secretResultText');
  const entEl = document.getElementById('secretEntropyScore');
  if (!lenEl || !resEl) return;

  const length = parseInt(lenEl.value, 10);
  let charset = '';
  if (upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lower) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (num) charset += '0123456789';
  if (sym) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!charset) {
    resEl.textContent = 'Please select at least one character set';
    return;
  }

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += charset[randomValues[i] % charset.length];
  }

  resEl.textContent = secret;

  // Calculate Shannon entropy bits
  const poolSize = charset.length;
  const entropyBits = Math.round(length * Math.log2(poolSize));
  if (entEl) {
    entEl.innerHTML = `Entropy: <strong>${entropyBits} bits</strong> | Pool size: ${poolSize} chars | Rating: <span style="color:${entropyBits >= 128 ? '#22c55e' : entropyBits >= 80 ? 'var(--accent)' : '#f59e0b'}">${entropyBits >= 128 ? 'Military-Grade Strong' : entropyBits >= 80 ? 'High Security' : 'Moderate'}</span>`;
  }
}

function copySecretResult() {
  const resEl = document.getElementById('secretResultText');
  if (resEl) {
    navigator.clipboard.writeText(resEl.textContent).then(() => toast('Secret copied'));
  }
}

// ============================================================================
// 3. 🎫 JWT TOKEN INSPECTOR & DEBUGGER
// ============================================================================
function renderJwtInspector(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>🎫</span> JSON Web Token (JWT) Inspector
          </div>
          <div style="font-size:11px;color:var(--muted);">Decode claims, expiration timestamps, and signature structure client-side</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="filter-pill" onclick="loadSampleJwt()">Load Sample JWT</button>
          <button class="btn btn-sm btn-primary" onclick="inspectJwt()">Inspect Token</button>
        </div>
      </div>

      <!-- JWT TOKEN INPUT -->
      <textarea
        id="jwtInputText"
        oninput="inspectJwt()"
        rows="4"
        placeholder="Paste encoded JWT token (header.payload.signature)..."
        style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11px;word-break:break-all;"
      ></textarea>

      <!-- RESULTS DISPLAY -->
      <div id="jwtResultsContainer" style="display:none;flex-direction:column;gap:12px;">
        <!-- Status indicator -->
        <div id="jwtStatusBanner" style="padding:10px 14px;border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center;"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <!-- HEADER -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
            <div style="font-size:11px;font-weight:700;color:#ef4444;text-transform:uppercase;margin-bottom:6px;">HEADER: Algorithm & Token Type</div>
            <pre id="jwtHeaderJson" style="margin:0;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text);white-space:pre-wrap;"></pre>
          </div>

          <!-- PAYLOAD -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
            <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;margin-bottom:6px;">PAYLOAD: Data Claims</div>
            <pre id="jwtPayloadJson" style="margin:0;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text);white-space:pre-wrap;"></pre>
          </div>
        </div>

        <!-- CLAIMS SUMMARY TABLE -->
        <div id="jwtClaimsSummary" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;"></div>
      </div>

    </div>
  `;

  loadSampleJwt();
}

function loadSampleJwt() {
  const inputEl = document.getElementById('jwtInputText');
  if (!inputEl) return;
  // Standard sample token (valid exp 2028)
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    sub: "usr_998124",
    name: "Alex Vance",
    role: "SecOps Lead",
    iss: "vault.authenticator",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 30) // +30 days
  })).replace(/=/g, '');
  const sig = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  inputEl.value = `${header}.${payload}.${sig}`;
  inspectJwt();
}

function inspectJwt() {
  const inputEl = document.getElementById('jwtInputText');
  const resContainer = document.getElementById('jwtResultsContainer');
  const banner = document.getElementById('jwtStatusBanner');
  const headPre = document.getElementById('jwtHeaderJson');
  const payPre = document.getElementById('jwtPayloadJson');
  const claimsDiv = document.getElementById('jwtClaimsSummary');
  if (!inputEl || !resContainer) return;

  const raw = inputEl.value.trim();
  if (!raw) {
    resContainer.style.display = 'none';
    return;
  }

  const parts = raw.split('.');
  if (parts.length < 2) {
    resContainer.style.display = 'flex';
    banner.style.background = 'rgba(239,68,68,0.15)';
    banner.style.color = 'var(--danger)';
    banner.innerHTML = '<span>✕ Invalid token structure (expected: header.payload.signature)</span>';
    headPre.textContent = '';
    payPre.textContent = '';
    claimsDiv.innerHTML = '';
    return;
  }

  const decodeB64Url = (str) => {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  };

  try {
    const headerObj = decodeB64Url(parts[0]);
    const payloadObj = decodeB64Url(parts[1]);

    resContainer.style.display = 'flex';
    headPre.textContent = JSON.stringify(headerObj, null, 2);
    payPre.textContent = JSON.stringify(payloadObj, null, 2);

    // Calculate expiration
    let isExpired = false;
    let expMsg = 'No expiration claim (exp)';
    if (payloadObj.exp) {
      const expMs = payloadObj.exp * 1000;
      const now = Date.now();
      isExpired = now > expMs;
      const diffSec = Math.abs(Math.round((expMs - now) / 1000));
      const diffHours = Math.round(diffSec / 3600);
      expMsg = isExpired ? `Expired ${diffHours}h ago (${new Date(expMs).toLocaleString()})` : `Valid for next ${diffHours}h (${new Date(expMs).toLocaleString()})`;
    }

    banner.style.background = isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)';
    banner.style.color = isExpired ? 'var(--danger)' : '#22c55e';
    banner.innerHTML = `
      <div style="font-weight:700;display:flex;align-items:center;gap:6px;">
        <span>${isExpired ? '⚠️ Token Expired' : '✓ Active Token'}</span>
        <span style="font-size:12px;opacity:0.9;font-weight:400;">(${expMsg})</span>
      </div>
      <div style="font-size:11px;font-family:'JetBrains Mono',monospace;">
        Alg: ${headerObj.alg || 'none'}
      </div>
    `;

    // Standard claims breakdown
    const stdKeys = ['sub', 'iss', 'aud', 'exp', 'iat', 'nbf'];
    claimsDiv.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px;">KEY CLAIMS INTERPRETATION:</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:8px;font-size:11px;">
        ${Object.entries(payloadObj).map(([k, v]) => {
          let extra = '';
          if (k === 'exp' || k === 'iat' || k === 'nbf') {
            extra = ` <span style="color:var(--muted)">(${new Date(v * 1000).toLocaleString()})</span>`;
          }
          return `
            <div style="background:var(--surface);padding:6px 10px;border-radius:6px;border:1px solid var(--border);">
              <span style="font-weight:700;color:var(--text);font-family:'JetBrains Mono',monospace;">${esc(k)}:</span>
              <span style="color:var(--accent);">${esc(typeof v === 'object' ? JSON.stringify(v) : String(v))}</span>
              ${extra}
            </div>
          `;
        }).join('')}
      </div>
    `;

  } catch (err) {
    resContainer.style.display = 'flex';
    banner.style.background = 'rgba(239,68,68,0.15)';
    banner.style.color = 'var(--danger)';
    banner.innerHTML = `<span>✕ Error decoding token parts: ${esc(err.message)}</span>`;
  }
}

// ============================================================================
// 4. 🎲 UUID, ULID & NANOID GENERATOR
// ============================================================================
function renderUuidGenerator(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>🎲</span> Cryptographic UUID, ULID & NanoID Engine
          </div>
          <div style="font-size:11px;color:var(--muted);">Generate single or bulk unique identifiers using secure random entropy</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <select id="uuidTypeSelect" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:12px;">
            <option value="uuidv4">UUID v4 (Standard 8-4-4-4-12)</option>
            <option value="upper">UUID v4 (Uppercase)</option>
            <option value="compact">UUID v4 (No Hyphens / 32-hex)</option>
            <option value="ulid">ULID (Time-sortable 26-char Base32)</option>
            <option value="nanoid">NanoID (Compact 21-char URL-safe)</option>
          </select>

          <select id="uuidCountSelect" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:12px;">
            <option value="1">1 ID</option>
            <option value="5" selected>5 IDs</option>
            <option value="10">10 IDs</option>
            <option value="25">25 IDs</option>
            <option value="50">50 IDs</option>
          </select>

          <button class="btn btn-sm btn-primary" onclick="generateUuidsList()">Generate</button>
          <button class="filter-pill" onclick="copyAllUuids()">📋 Copy All</button>
        </div>
      </div>

      <!-- RESULTS LIST -->
      <div id="uuidResultsList" style="display:flex;flex-direction:column;gap:6px;font-family:'JetBrains Mono',monospace;font-size:12px;">
        <!-- Rendered IDs -->
      </div>

    </div>
  `;

  generateUuidsList();
}

function generateUuidsList() {
  const typeSelect = document.getElementById('uuidTypeSelect');
  const countSelect = document.getElementById('uuidCountSelect');
  const listEl = document.getElementById('uuidResultsList');
  if (!listEl) return;

  const type = typeSelect ? typeSelect.value : 'uuidv4';
  const count = countSelect ? parseInt(countSelect.value, 10) : 5;
  const ids = [];

  for (let i = 0; i < count; i++) {
    if (type === 'ulid') {
      const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
      let t = Date.now();
      let timePart = '';
      for (let j = 9; j >= 0; j--) {
        timePart = ENCODING[t % 32] + timePart;
        t = Math.floor(t / 32);
      }
      let randPart = '';
      const r = new Uint8Array(16);
      crypto.getRandomValues(r);
      for (let j = 0; j < 16; j++) randPart += ENCODING[r[j] % 32];
      ids.push(timePart + randPart);
    } else if (type === 'nanoid') {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
      const r = new Uint8Array(21);
      crypto.getRandomValues(r);
      let s = '';
      for (let j = 0; j < 21; j++) s += chars[r[j] % chars.length];
      ids.push(s);
    } else if (type === 'compact') {
      ids.push(crypto.randomUUID().replace(/-/g, ''));
    } else if (type === 'upper') {
      ids.push(crypto.randomUUID().toUpperCase());
    } else {
      ids.push(crypto.randomUUID());
    }
  }

  listEl.innerHTML = ids.map((id, idx) => `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="color:var(--text);">${id}</span>
      <button class="filter-pill" onclick="navigator.clipboard.writeText('${id}');toast('Copied ID');" style="font-size:10px;padding:2px 8px;">📋 Copy</button>
    </div>
  `).join('');
}

function copyAllUuids() {
  const listEl = document.getElementById('uuidResultsList');
  if (!listEl) return;
  const text = Array.from(listEl.querySelectorAll('span')).map(s => s.textContent).join('\n');
  navigator.clipboard.writeText(text).then(() => toast('All generated IDs copied'));
}

// ============================================================================
// 5. 🔍 REGEX LABORATORY & TESTER
// ============================================================================
function renderRegexLab(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>🔍</span> Regular Expression (Regex) Laboratory
          </div>
          <div style="font-size:11px;color:var(--muted);">Live visual match highlighting, capture groups inspector, and pattern presets</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--muted);">Preset:</span>
          <select id="regexPresetSelect" onchange="loadRegexPreset(this.value)" style="padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:11px;">
            <option value="email">Email Address</option>
            <option value="url">Web URL</option>
            <option value="ipv4">IPv4 Address</option>
            <option value="date">ISO Date (YYYY-MM-DD)</option>
            <option value="hex">Hex Color (#RGB / #RRGGBB)</option>
            <option value="uuid">UUID v4</option>
            <option value="html">HTML Tag</option>
          </select>
        </div>
      </div>

      <!-- PATTERN & FLAGS INPUT -->
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;">
        <span style="font-size:16px;color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:700;">/</span>
        <input
          type="text"
          id="regexPatternInput"
          oninput="runRegexTest()"
          placeholder="Enter regular expression pattern..."
          value="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
          style="flex:1;min-width:200px;background:transparent;border:none;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;"
        />
        <span style="font-size:16px;color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:700;">/</span>

        <!-- FLAGS -->
        <div style="display:flex;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;">
          <label style="display:flex;align-items:center;gap:3px;cursor:pointer;"><input type="checkbox" id="regexFlagG" checked onchange="runRegexTest()" /> g</label>
          <label style="display:flex;align-items:center;gap:3px;cursor:pointer;"><input type="checkbox" id="regexFlagI" checked onchange="runRegexTest()" /> i</label>
          <label style="display:flex;align-items:center;gap:3px;cursor:pointer;"><input type="checkbox" id="regexFlagM" onchange="runRegexTest()" /> m</label>
          <label style="display:flex;align-items:center;gap:3px;cursor:pointer;"><input type="checkbox" id="regexFlagS" onchange="runRegexTest()" /> s</label>
        </div>
      </div>

      <!-- TEST STRING -->
      <div>
        <label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px;">Test String:</label>
        <textarea
          id="regexTestText"
          oninput="runRegexTest()"
          rows="4"
          placeholder="Type or paste sample text to test..."
          style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;"
        >Contact engineering leads at security@vault.app, support@cloud.io, or admin@corp.internal for keys.</textarea>
      </div>

      <!-- MATCH HIGHLIGHT BOX & CAPTURE GROUPS -->
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span id="regexMatchCount" style="font-size:12px;font-weight:700;color:var(--accent);">Matches</span>
        </div>
        <div id="regexHighlightDisplay" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all;"></div>
        <div id="regexGroupsTable" style="display:none;font-size:11px;"></div>
      </div>

    </div>
  `;

  runRegexTest();
}

function loadRegexPreset(preset) {
  const patternInput = document.getElementById('regexPatternInput');
  const testInput = document.getElementById('regexTestText');
  if (!patternInput || !testInput) return;

  const presets = {
    email: {
      pat: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      test: 'Contact engineering leads at security@vault.app, support@cloud.io, or admin@corp.internal for keys.'
    },
    url: {
      pat: 'https?:\\/\\/[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&\'\\(\\)\\*\\+,;=.]+',
      test: 'Check https://api.cloudflare.com/client/v4 or visit https://github.com/google/genai for documentation.'
    },
    ipv4: {
      pat: '\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
      test: 'DNS Resolvers include 1.1.1.1, 8.8.8.8, and local gateway 192.168.1.1.'
    },
    date: {
      pat: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
      test: 'Events on 2026-09-18 and release slated for 2026-10-01.'
    },
    hex: {
      pat: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
      test: 'Colors: Primary is #7c6af7, Success is #22c55e, and text is #fff.'
    },
    uuid: {
      pat: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
      test: 'Session: c81d4e2e-bcf2-11e6-869b-7df92533d2db'
    },
    html: {
      pat: '<(\\/?[a-zA-Z0-9]+)(\\s+[^>]*)?>',
      test: '<div class="header"><span id="logo">Vault</span></div>'
    }
  };

  if (presets[preset]) {
    patternInput.value = presets[preset].pat;
    testInput.value = presets[preset].test;
    runRegexTest();
  }
}

function runRegexTest() {
  const patternInput = document.getElementById('regexPatternInput');
  const testInput = document.getElementById('regexTestText');
  const countEl = document.getElementById('regexMatchCount');
  const displayEl = document.getElementById('regexHighlightDisplay');
  const groupsTable = document.getElementById('regexGroupsTable');
  if (!patternInput || !testInput || !displayEl) return;

  const rawPattern = patternInput.value;
  const testStr = testInput.value;

  let flags = '';
  if (document.getElementById('regexFlagG')?.checked) flags += 'g';
  if (document.getElementById('regexFlagI')?.checked) flags += 'i';
  if (document.getElementById('regexFlagM')?.checked) flags += 'm';
  if (document.getElementById('regexFlagS')?.checked) flags += 's';

  if (!rawPattern) {
    displayEl.textContent = testStr;
    if (countEl) countEl.textContent = 'No pattern specified';
    if (groupsTable) groupsTable.style.display = 'none';
    return;
  }

  try {
    const re = new RegExp(rawPattern, flags);
    const matches = Array.from(testStr.matchAll(new RegExp(rawPattern, flags.includes('g') ? flags : flags + 'g')));

    if (countEl) countEl.innerHTML = `Found <span style="color:#22c55e">${matches.length} match${matches.length === 1 ? '' : 'es'}</span>`;

    if (matches.length === 0) {
      displayEl.textContent = testStr;
      if (groupsTable) groupsTable.style.display = 'none';
      return;
    }

    // Build highlighted HTML
    let lastIdx = 0;
    let html = '';
    matches.forEach(m => {
      const start = m.index;
      const matchText = m[0];
      html += esc(testStr.substring(lastIdx, start));
      html += `<mark style="background:rgba(124,106,247,0.3);color:var(--text);border-bottom:2px solid var(--accent);border-radius:3px;padding:1px 3px;">${esc(matchText)}</mark>`;
      lastIdx = start + matchText.length;
    });
    html += esc(testStr.substring(lastIdx));
    displayEl.innerHTML = html;

    // Build capture groups breakdown
    if (groupsTable && matches.some(m => m.length > 1)) {
      groupsTable.style.display = 'block';
      groupsTable.innerHTML = `
        <div style="font-weight:700;color:var(--accent);margin-top:6px;margin-bottom:4px;">Capture Groups Table:</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);text-align:left;color:var(--muted);">
              <th style="padding:4px 6px;">#</th>
              <th style="padding:4px 6px;">Full Match</th>
              <th style="padding:4px 6px;">Groups</th>
            </tr>
          </thead>
          <tbody>
            ${matches.slice(0, 10).map((m, idx) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:4px 6px;color:var(--muted);">${idx + 1}</td>
                <td style="padding:4px 6px;color:var(--text);font-family:'JetBrains Mono',monospace;">${esc(m[0])}</td>
                <td style="padding:4px 6px;color:var(--accent);font-family:'JetBrains Mono',monospace;">${m.slice(1).map((g, gIdx) => `$${gIdx + 1}: "${esc(g)}"`).join(', ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (groupsTable) {
      groupsTable.style.display = 'none';
    }

  } catch (err) {
    if (countEl) countEl.innerHTML = `<span style="color:var(--danger)">Pattern Error: ${esc(err.message)}</span>`;
    displayEl.textContent = testStr;
  }
}

// ============================================================================
// 6. ⏰ CRON SCHEDULE VISUALIZER & EXPLAINER
// ============================================================================
function renderCronExplainer(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>⏰</span> Cron Schedule Parser & Next Runtime Simulator
          </div>
          <div style="font-size:11px;color:var(--muted);">Converts standard 5-part cron syntax into plain English and forecasts future trigger dates</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--muted);">Preset:</span>
          <select id="cronPresetSelect" onchange="setCronPreset(this.value)" style="padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:11px;">
            <option value="* * * * *">Every Minute (* * * * *)</option>
            <option value="*/15 * * * *">Every 15 Minutes (*/15 * * * *)</option>
            <option value="0 * * * *">Every Hour at :00 (0 * * * *)</option>
            <option value="0 0 * * *">Daily at Midnight (0 0 * * *)</option>
            <option value="0 9 * * 1-5" selected>Weekdays at 9:00 AM (0 9 * * 1-5)</option>
            <option value="0 12 1 * *">1st of Every Month at Noon (0 12 1 * *)</option>
          </select>
        </div>
      </div>

      <!-- CRON INPUT BAR -->
      <div style="display:flex;gap:10px;align-items:center;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;">
        <span style="font-size:18px;">⏰</span>
        <input
          type="text"
          id="cronInputText"
          oninput="explainCronRealtime()"
          value="0 9 * * 1-5"
          placeholder="* * * * *"
          style="flex:1;background:transparent;border:none;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;outline:none;"
        />
        <button class="btn btn-sm btn-primary" onclick="explainCronRealtime()">Simulate</button>
      </div>

      <!-- HUMAN EXPLANATION HERO -->
      <div style="background:rgba(124,106,247,0.1);border:1px solid rgba(124,106,247,0.25);border-radius:var(--radius-sm);padding:14px 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--accent);">Natural Language Schedule:</div>
        <div id="cronExplanationText" style="font-size:16px;font-weight:600;color:var(--text);margin-top:4px;">
          Runs at 09:00 AM on weekdays (Monday through Friday)
        </div>
      </div>

      <!-- NEXT 5 EXECUTIONS FORECAST -->
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;">Upcoming 5 Scheduled Executions:</div>
        <div id="cronUpcomingList" style="display:flex;flex-direction:column;gap:6px;font-family:'JetBrains Mono',monospace;font-size:12px;">
          <!-- Rendered upcoming timestamps -->
        </div>
      </div>

    </div>
  `;

  explainCronRealtime();
}

function setCronPreset(val) {
  const input = document.getElementById('cronInputText');
  if (input) {
    input.value = val;
    explainCronRealtime();
  }
}

function explainCronRealtime() {
  const input = document.getElementById('cronInputText');
  const expEl = document.getElementById('cronExplanationText');
  const listEl = document.getElementById('cronUpcomingList');
  if (!input || !expEl || !listEl) return;

  const raw = input.value.trim();
  const parts = raw.split(/\s+/);

  if (parts.length < 5) {
    expEl.innerHTML = '<span style="color:var(--danger)">Requires 5 cron fields: (minute hour day-of-month month day-of-week)</span>';
    listEl.innerHTML = '';
    return;
  }

  const [min, hr, dom, mon, dow] = parts;

  // Natural Language Explainer
  let desc = 'Runs ';
  if (min === '*' && hr === '*') desc += 'every minute';
  else if (min === '0' && hr === '*') desc += 'at the start of every hour';
  else if (min.startsWith('*/')) desc += `every ${min.replace('*/', '')} minutes`;
  else if (hr.startsWith('*/')) desc += `every ${hr.replace('*/', '')} hours at :${min.padStart(2, '0')}`;
  else if (min !== '*' && hr !== '*') desc += `at ${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
  else desc += `at minute ${min}`;

  if (dow !== '*') {
    if (dow === '1-5') desc += ' on weekdays (Mon-Fri)';
    else if (dow === '0,6' || dow === '6,0') desc += ' on weekends (Sat-Sun)';
    else desc += ` on day-of-week ${dow}`;
  }
  if (mon !== '*') desc += ` in month ${mon}`;
  if (dom !== '*') desc += ` on day-of-month ${dom}`;

  expEl.textContent = desc;

  // Simulate next 5 runs
  const nextRuns = [];
  let cursor = new Date();
  for (let i = 0; i < 600 && nextRuns.length < 5; i++) {
    cursor = new Date(cursor.getTime() + 60000);
    cursor.setSeconds(0);
    cursor.setMilliseconds(0);

    const cMin = cursor.getMinutes();
    const cHr = cursor.getHours();
    const cDom = cursor.getDate();
    const cMon = cursor.getMonth() + 1;
    const cDow = cursor.getDay();

    const matches = (val, pat) => {
      if (pat === '*') return true;
      if (pat.includes(',')) return pat.split(',').some(p => matches(val, p));
      if (pat.includes('/')) {
        const step = parseInt(pat.split('/')[1], 10);
        return val % step === 0;
      }
      if (pat.includes('-')) {
        const [st, en] = pat.split('-').map(Number);
        return val >= st && val <= en;
      }
      return parseInt(pat, 10) === val;
    };

    if (matches(cMin, min) && matches(cHr, hr) && matches(cDom, dom) && matches(cMon, mon) && matches(cDow, dow)) {
      nextRuns.push(new Date(cursor.getTime()));
    }
  }

  listEl.innerHTML = nextRuns.map((d, idx) => {
    const diffMin = Math.round((d.getTime() - Date.now()) / 60000);
    const relStr = diffMin < 60 ? `in ${diffMin} min` : `in ${Math.round(diffMin / 60)} hours`;
    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="color:var(--accent);font-weight:700;">#${idx + 1}:</span>
          <span style="color:var(--text);margin-left:6px;">${d.toLocaleString()}</span>
          <span style="color:var(--muted);font-size:11px;margin-left:8px;">(${d.toISOString()})</span>
        </div>
        <span class="badge" style="background:rgba(34,197,94,0.15);color:#22c55e;font-size:10px;">${relStr}</span>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 7. ⏳ UNIX TIMESTAMP & WORLD TIME CALCULATOR
// ============================================================================
let epochInterval = null;

function renderEpochConverter(container) {
  if (epochInterval) clearInterval(epochInterval);

  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>⏳</span> Unix Epoch & Timestamp Converter
          </div>
          <div style="font-size:11px;color:var(--muted);">Bidirectional seconds/milliseconds conversion with live UTC/local ticker</div>
        </div>
      </div>

      <!-- LIVE TICKER HERO -->
      <div style="background:linear-gradient(135deg, rgba(124,106,247,0.12) 0%, rgba(56,189,248,0.08) 100%);border:1px solid rgba(124,106,247,0.25);border-radius:var(--radius);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--accent);">Current Unix Epoch Ticker (Live):</div>
          <div id="liveEpochSeconds" style="font-size:28px;font-weight:800;font-family:'JetBrains Mono',monospace;color:var(--text);margin-top:2px;"></div>
          <div id="liveEpochMs" style="font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;"></div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="filter-pill" onclick="navigator.clipboard.writeText(Math.floor(Date.now()/1000).toString());toast('Copied Epoch Seconds');">📋 Copy Seconds</button>
          <button class="filter-pill" onclick="navigator.clipboard.writeText(Date.now().toString());toast('Copied Epoch Milliseconds');">📋 Copy ms</button>
        </div>
      </div>

      <!-- BIDIRECTIONAL CONVERTER GRID -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <!-- TIMESTAMP TO DATE -->
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;flex-direction:column;gap:10px;">
          <div style="font-weight:700;font-size:12px;color:var(--text);">Timestamp ➔ Human Date</div>
          <input
            type="text"
            id="epochToDateInput"
            oninput="convertEpochToHumanDate()"
            value="${Math.floor(Date.now() / 1000)}"
            placeholder="Enter seconds or ms..."
            style="width:100%;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;"
          />
          <div id="epochDateResults" style="display:flex;flex-direction:column;gap:4px;font-size:11px;font-family:'JetBrains Mono',monospace;"></div>
        </div>

        <!-- DATE TO TIMESTAMP -->
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;flex-direction:column;gap:10px;">
          <div style="font-weight:700;font-size:12px;color:var(--text);">Date Picker ➔ Timestamp</div>
          <input
            type="datetime-local"
            id="humanDateToEpochInput"
            onchange="convertHumanDateToEpoch()"
            style="width:100%;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;"
          />
          <div id="dateEpochResults" style="display:flex;flex-direction:column;gap:4px;font-size:11px;font-family:'JetBrains Mono',monospace;"></div>
        </div>
      </div>

    </div>
  `;

  const tick = () => {
    const secEl = document.getElementById('liveEpochSeconds');
    const msEl = document.getElementById('liveEpochMs');
    if (!secEl) {
      if (epochInterval) clearInterval(epochInterval);
      return;
    }
    const now = Date.now();
    secEl.textContent = Math.floor(now / 1000);
    if (msEl) msEl.textContent = `Milliseconds: ${now} | UTC: ${new Date(now).toUTCString()}`;
  };

  tick();
  epochInterval = setInterval(tick, 1000);

  // Set datetime-local value to now
  const dtInput = document.getElementById('humanDateToEpochInput');
  if (dtInput) {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    dtInput.value = d.toISOString().slice(0, 16);
  }

  convertEpochToHumanDate();
  convertHumanDateToEpoch();
}

function convertEpochToHumanDate() {
  const input = document.getElementById('epochToDateInput');
  const resEl = document.getElementById('epochDateResults');
  if (!input || !resEl) return;

  const raw = input.value.trim();
  if (!raw || isNaN(raw)) {
    resEl.innerHTML = '<span style="color:var(--muted)">Enter valid numeric epoch timestamp</span>';
    return;
  }

  let num = Number(raw);
  // If length <= 11 digits, assume seconds, otherwise ms
  if (raw.length <= 11) num = num * 1000;

  const d = new Date(num);
  resEl.innerHTML = `
    <div><strong>Local:</strong> <span style="color:var(--text);">${d.toLocaleString()}</span></div>
    <div><strong>UTC:</strong> <span style="color:var(--text);">${d.toUTCString()}</span></div>
    <div><strong>ISO 8601:</strong> <span style="color:var(--accent);">${d.toISOString()}</span></div>
    <div><strong>Relative:</strong> <span style="color:#22c55e;">${formatRelativeTime(num)}</span></div>
  `;
}

function convertHumanDateToEpoch() {
  const input = document.getElementById('humanDateToEpochInput');
  const resEl = document.getElementById('dateEpochResults');
  if (!input || !resEl) return;

  const d = new Date(input.value);
  if (isNaN(d.getTime())) return;

  const ms = d.getTime();
  const sec = Math.floor(ms / 1000);

  resEl.innerHTML = `
    <div><strong>Seconds:</strong> <span style="color:var(--accent);">${sec}</span></div>
    <div><strong>Milliseconds:</strong> <span style="color:var(--text);">${ms}</span></div>
    <div><strong>ISO Date:</strong> <span style="color:var(--muted);">${d.toISOString()}</span></div>
  `;
}

function formatRelativeTime(targetMs) {
  const diff = targetMs - Date.now();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;
  const suffix = isPast ? 'ago' : 'from now';

  if (absDiff < 60000) return 'just now';
  if (absDiff < 3600000) return `${Math.round(absDiff / 60000)} minutes ${suffix}`;
  if (absDiff < 86400000) return `${Math.round(absDiff / 3600000)} hours ${suffix}`;
  return `${Math.round(absDiff / 86400000)} days ${suffix}`;
}

// ============================================================================
// 8. 📝 TEXT DIFF & CASE CONVERTER
// ============================================================================
function renderDiffAndCase(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>📝</span> Text Diff & Programmatic Case Converter
          </div>
          <div style="font-size:11px;color:var(--muted);">Line-by-line file comparison and camelCase, snake_case, kebab-case transformers</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-primary" onclick="computeTextDiff()">Compare Texts</button>
          <button class="filter-pill" onclick="swapDiffTexts()">⇄ Swap</button>
        </div>
      </div>

      <!-- DIFF INPUTS (SIDE BY SIDE) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-size:11px;font-weight:600;color:var(--danger);display:block;margin-bottom:4px;">Original Text:</label>
          <textarea id="diffOriginal" rows="6" placeholder="Original code or text..." style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;">function authenticateUser(user, pass) {
  if (!user || !pass) return false;
  return verifyPasswordHash(pass, user.hash);
}</textarea>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:#22c55e;display:block;margin-bottom:4px;">Modified Text:</label>
          <textarea id="diffModified" rows="6" placeholder="Modified code or text..." style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;">async function authenticateUser(user, pass, options = {}) {
  if (!user || !pass) return false;
  if (options.turnstile && !options.verified) return false;
  return await verifyArgon2Hash(pass, user.hash);
}</textarea>
        </div>
      </div>

      <!-- DIFF OUTPUT PANE -->
      <div id="diffResultsPane" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;font-family:'JetBrains Mono',monospace;font-size:12px;">
        <!-- Line-by-line diff -->
      </div>

      <!-- CASE CONVERTER UTILITY -->
      <div style="border-top:1px solid var(--border);padding-top:14px;display:flex;flex-direction:column;gap:8px;">
        <div style="font-weight:700;font-size:12px;color:var(--text);">Variable & String Case Converter:</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="filter-pill" onclick="applyCaseConversion('camel')">camelCase</button>
          <button class="filter-pill" onclick="applyCaseConversion('snake')">snake_case</button>
          <button class="filter-pill" onclick="applyCaseConversion('kebab')">kebab-case</button>
          <button class="filter-pill" onclick="applyCaseConversion('pascal')">PascalCase</button>
          <button class="filter-pill" onclick="applyCaseConversion('constant')">CONSTANT_CASE</button>
          <button class="filter-pill" onclick="applyCaseConversion('title')">Title Case</button>
          <button class="filter-pill" onclick="applyCaseConversion('upper')">UPPERCASE</button>
          <button class="filter-pill" onclick="applyCaseConversion('lower')">lowercase</button>
        </div>
      </div>

    </div>
  `;

  computeTextDiff();
}

function computeTextDiff() {
  const origEl = document.getElementById('diffOriginal');
  const modEl = document.getElementById('diffModified');
  const outEl = document.getElementById('diffResultsPane');
  if (!origEl || !modEl || !outEl) return;

  const origLines = origEl.value.split('\n');
  const modLines = modEl.value.split('\n');

  let added = 0;
  let removed = 0;
  let html = '';

  const maxLen = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const m = modLines[i];

    if (o === undefined) {
      added++;
      html += `<div style="background:rgba(34,197,94,0.15);color:#22c55e;padding:2px 6px;border-left:3px solid #22c55e;">+ ${esc(m)}</div>`;
    } else if (m === undefined) {
      removed++;
      html += `<div style="background:rgba(239,68,68,0.15);color:var(--danger);padding:2px 6px;border-left:3px solid var(--danger);">- ${esc(o)}</div>`;
    } else if (o !== m) {
      removed++;
      added++;
      html += `<div style="background:rgba(239,68,68,0.15);color:var(--danger);padding:2px 6px;border-left:3px solid var(--danger);">- ${esc(o)}</div>`;
      html += `<div style="background:rgba(34,197,94,0.15);color:#22c55e;padding:2px 6px;border-left:3px solid #22c55e;">+ ${esc(m)}</div>`;
    } else {
      html += `<div style="color:var(--muted);padding:2px 6px;opacity:0.8;">  ${esc(o)}</div>`;
    }
  }

  outEl.innerHTML = `
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px;display:flex;gap:12px;">
      <span style="color:#22c55e;">+ ${added} line${added === 1 ? '' : 's'} added</span>
      <span style="color:var(--danger);">- ${removed} line${removed === 1 ? '' : 's'} removed</span>
    </div>
    <div style="max-height:280px;overflow-y:auto;line-height:1.4;">
      ${html}
    </div>
  `;
}

function swapDiffTexts() {
  const origEl = document.getElementById('diffOriginal');
  const modEl = document.getElementById('diffModified');
  if (origEl && modEl) {
    const temp = origEl.value;
    origEl.value = modEl.value;
    modEl.value = temp;
    computeTextDiff();
  }
}

function applyCaseConversion(style) {
  const modEl = document.getElementById('diffModified');
  if (!modEl || !modEl.value) return;

  const toWords = (str) => str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ').trim().split(/\s+/);
  const words = toWords(modEl.value);

  if (style === 'camel') {
    modEl.value = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  } else if (style === 'pascal') {
    modEl.value = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  } else if (style === 'snake') {
    modEl.value = words.map(w => w.toLowerCase()).join('_');
  } else if (style === 'kebab') {
    modEl.value = words.map(w => w.toLowerCase()).join('-');
  } else if (style === 'constant') {
    modEl.value = words.map(w => w.toUpperCase()).join('_');
  } else if (style === 'title') {
    modEl.value = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  } else if (style === 'upper') {
    modEl.value = modEl.value.toUpperCase();
  } else if (style === 'lower') {
    modEl.value = modEl.value.toLowerCase();
  }

  computeTextDiff();
  toast(`Applied ${style} case conversion`);
}

// ============================================================================
// 9. 🎨 COLOR LAB & WCAG ACCESSIBILITY CONTRAST CHECKER
// ============================================================================
function renderColorAndWcag(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
            <span>🎨</span> Color Lab & WCAG 2.1 Contrast Checker
          </div>
          <div style="font-size:11px;color:var(--muted);">Verify AA / AAA accessibility compliance ratios and inspect color models</div>
        </div>
      </div>

      <!-- CONTRAST TESTER -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:12px;font-weight:700;color:var(--text);">Foreground Color (Text)</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <input type="color" id="wcagFgColor" value="#7c6af7" onchange="updateWcagColors()" style="width:44px;height:36px;border:none;background:transparent;cursor:pointer;" />
            <input type="text" id="wcagFgHex" value="#7c6af7" oninput="document.getElementById('wcagFgColor').value = this.value; updateWcagColors();" style="flex:1;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;" />
          </div>
        </div>

        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:12px;font-weight:700;color:var(--text);">Background Color (Surface)</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <input type="color" id="wcagBgColor" value="#0f0e17" onchange="updateWcagColors()" style="width:44px;height:36px;border:none;background:transparent;cursor:pointer;" />
            <input type="text" id="wcagBgHex" value="#0f0e17" oninput="document.getElementById('wcagBgColor').value = this.value; updateWcagColors();" style="flex:1;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;" />
          </div>
        </div>
      </div>

      <!-- CONTRAST RATIO RESULT BANNER -->
      <div id="wcagResultBanner" style="padding:16px 20px;border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <!-- Calculated ratio and AA/AAA ratings -->
      </div>

      <!-- LIVE PREVIEW CARD -->
      <div id="wcagLivePreview" style="padding:20px;border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:18px;font-weight:700;">Large Headline Preview (Bold 18pt+)</div>
        <div style="font-size:14px;line-height:1.5;">This is standard regular text preview. Testing readability, contrast ratio, and eye fatigue across diverse display backlights.</div>
      </div>

    </div>
  `;

  updateWcagColors();
}

function updateWcagColors() {
  const fg = document.getElementById('wcagFgColor')?.value || '#7c6af7';
  const bg = document.getElementById('wcagBgColor')?.value || '#0f0e17';
  const fgHex = document.getElementById('wcagFgHex');
  const bgHex = document.getElementById('wcagBgHex');
  const banner = document.getElementById('wcagResultBanner');
  const preview = document.getElementById('wcagLivePreview');

  if (fgHex) fgHex.value = fg;
  if (bgHex) bgHex.value = bg;

  // Relative luminance calculation
  const getLum = (hex) => {
    const rgb = [0, 2, 4].map(idx => parseInt(hex.substr(idx + 1, 2), 16) / 255);
    const [r, g, b] = rgb.map(val => val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLum(fg);
  const l2 = getLum(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const formattedRatio = ratio.toFixed(2);

  const normalAA = ratio >= 4.5;
  const normalAAA = ratio >= 7.0;
  const largeAA = ratio >= 3.0;
  const largeAAA = ratio >= 4.5;

  if (banner) {
    banner.style.background = ratio >= 4.5 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    banner.style.border = `1px solid ${ratio >= 4.5 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`;
    banner.innerHTML = `
      <div>
        <div style="font-size:24px;font-weight:800;color:var(--text);font-family:'JetBrains Mono',monospace;">
          ${formattedRatio} : 1
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px;">
          ${ratio >= 7.0 ? 'Enhanced Contrast (AAA Passed)' : ratio >= 4.5 ? 'Good Contrast (AA Passed)' : 'Low Contrast (Failed Standard)'}
        </div>
      </div>
      <div style="display:flex;gap:10px;font-size:11px;font-weight:600;flex-wrap:wrap;">
        <span class="badge" style="background:${normalAA ? '#22c55e' : 'var(--danger)'};color:#fff;">Normal AA: ${normalAA ? 'PASS' : 'FAIL'}</span>
        <span class="badge" style="background:${normalAAA ? '#22c55e' : 'var(--surface)'};color:${normalAAA ? '#fff' : 'var(--muted)'};">Normal AAA: ${normalAAA ? 'PASS' : 'FAIL'}</span>
        <span class="badge" style="background:${largeAA ? '#22c55e' : 'var(--danger)'};color:#fff;">Large AA: ${largeAA ? 'PASS' : 'FAIL'}</span>
        <span class="badge" style="background:${largeAAA ? '#22c55e' : 'var(--surface)'};color:${largeAAA ? '#fff' : 'var(--muted)'};">Large AAA: ${largeAAA ? 'PASS' : 'FAIL'}</span>
      </div>
    `;
  }

  if (preview) {
    preview.style.backgroundColor = bg;
    preview.style.color = fg;
  }
}

// ============================================================================
// 10. 🌐 SUBNET (CIDR) CALCULATOR & HTTP STATUS CODES
// ============================================================================
let networkActiveTab = 'cidr'; // 'cidr' | 'http' | 'device'

function renderNetworkAndHttp(container) {
  container.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:6px;">
          <button class="settings-cat-pill ${networkActiveTab === 'cidr' ? 'active' : ''}" onclick="setNetworkTab('cidr')">🖧 IPv4 Subnet / CIDR</button>
          <button class="settings-cat-pill ${networkActiveTab === 'http' ? 'active' : ''}" onclick="setNetworkTab('http')">📡 HTTP Status RFC Codes</button>
          <button class="settings-cat-pill ${networkActiveTab === 'device' ? 'active' : ''}" onclick="setNetworkTab('device')">💻 Browser & Device Inspector</button>
        </div>
      </div>

      <div id="networkTabContent"></div>

    </div>
  `;

  renderNetworkSubTab();
}

function setNetworkTab(tab) {
  networkActiveTab = tab;
  renderNetworkAndHttp(document.getElementById('toolboxSubtabContent'));
}

function renderNetworkSubTab() {
  const el = document.getElementById('networkTabContent');
  if (!el) return;

  if (networkActiveTab === 'cidr') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <label style="font-size:12px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px;">
            <span>CIDR Notation:</span>
            <input type="text" id="cidrInputText" oninput="calculateSubnetCidr()" value="192.168.1.0/24" style="padding:6px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;" />
          </label>
          <div style="display:flex;gap:4px;">
            ${['10.0.0.0/8', '172.16.0.0/12', '192.168.1.0/24', '192.168.1.0/28'].map(c => `
              <button class="filter-pill" onclick="document.getElementById('cidrInputText').value = '${c}'; calculateSubnetCidr();" style="font-size:11px;padding:3px 8px;">${c}</button>
            `).join('')}
          </div>
        </div>

        <div id="cidrResultsGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:10px;font-family:'JetBrains Mono',monospace;font-size:12px;"></div>
      </div>
    `;
    calculateSubnetCidr();
  } else if (networkActiveTab === 'http') {
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input
          type="text"
          id="httpCodeSearch"
          oninput="filterHttpStatusCodes(this.value)"
          placeholder="Search HTTP status codes (e.g. 200, 404, 502, unauthorized, gateway)..."
          style="width:100%;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;"
        />
        <div id="httpStatusList" style="display:flex;flex-direction:column;gap:6px;max-height:380px;overflow-y:auto;"></div>
      </div>
    `;
    filterHttpStatusCodes('');
  } else if (networkActiveTab === 'device') {
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:10px;font-size:12px;">
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
          <span style="color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:700;">Screen Resolution</span>
          <div style="font-size:15px;font-weight:700;color:var(--text);margin-top:2px;">${window.screen.width} x ${window.screen.height} (Pixel Ratio: ${window.devicePixelRatio || 1})</div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
          <span style="color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:700;">Browser Viewport</span>
          <div style="font-size:15px;font-weight:700;color:var(--accent);margin-top:2px;">${window.innerWidth} x ${window.innerHeight} px</div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
          <span style="color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:700;">Language & Timezone</span>
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px;">${navigator.language} (${Intl.DateTimeFormat().resolvedOptions().timeZone})</div>
        </div>
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
          <span style="color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:700;">Hardware Concurrency</span>
          <div style="font-size:15px;font-weight:700;color:var(--text);margin-top:2px;">${navigator.hardwareConcurrency || 'Unknown'} Logical CPU Cores</div>
        </div>
        <div style="grid-column:1 / -1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
          <span style="color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:700;">Raw User Agent</span>
          <div style="font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--text);word-break:break-all;margin-top:4px;">${esc(navigator.userAgent)}</div>
        </div>
      </div>
    `;
  }
}

function calculateSubnetCidr() {
  const input = document.getElementById('cidrInputText');
  const grid = document.getElementById('cidrResultsGrid');
  if (!input || !grid) return;

  const match = input.value.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) {
    grid.innerHTML = '<div style="color:var(--danger);grid-column:1 / -1;">Enter valid CIDR (e.g. 192.168.1.0/24)</div>';
    return;
  }

  const ipStr = match[1];
  const prefix = parseInt(match[2], 10);
  if (prefix < 0 || prefix > 32) return;

  const ipToInt = (ip) => ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  const intToIp = (int) => [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');

  const ipInt = ipToInt(ipStr);
  const maskInt = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const netInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = prefix === 32 ? netInt : (netInt | (~maskInt >>> 0)) >>> 0;
  const totalHosts = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

  const firstHost = prefix >= 31 ? intToIp(netInt) : intToIp(netInt + 1);
  const lastHost = prefix >= 31 ? intToIp(broadcastInt) : intToIp(broadcastInt - 1);

  const items = [
    { label: 'Network Address', val: intToIp(netInt), color: 'var(--accent)' },
    { label: 'Subnet Mask', val: intToIp(maskInt) },
    { label: 'Wildcard Mask', val: intToIp(~maskInt >>> 0) },
    { label: 'Broadcast Address', val: intToIp(broadcastInt), color: 'var(--danger)' },
    { label: 'First Usable Host', val: firstHost, color: '#22c55e' },
    { label: 'Last Usable Host', val: lastHost, color: '#22c55e' },
    { label: 'Total Addresses', val: totalHosts.toLocaleString() },
    { label: 'Usable Host Capacity', val: usableHosts.toLocaleString(), color: '#38bdf8' }
  ];

  grid.innerHTML = items.map(item => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;">${item.label}</div>
      <div style="font-size:13px;font-weight:700;color:${item.color || 'var(--text)'};margin-top:2px;">${item.val}</div>
    </div>
  `).join('');
}

function filterHttpStatusCodes(q) {
  const el = document.getElementById('httpStatusList');
  if (!el) return;

  const codes = [
    { code: 200, name: 'OK', cat: 'Success', desc: 'Standard successful HTTP response.' },
    { code: 201, name: 'Created', cat: 'Success', desc: 'Resource successfully created.' },
    { code: 204, name: 'No Content', cat: 'Success', desc: 'Request succeeded with no body returned.' },
    { code: 301, name: 'Moved Permanently', cat: 'Redirect', desc: 'Target resource has been assigned a new permanent URI.' },
    { code: 304, name: 'Not Modified', cat: 'Redirect', desc: 'Client cached version is still valid.' },
    { code: 400, name: 'Bad Request', cat: 'Client Error', desc: 'Server cannot process request due to client error.' },
    { code: 401, name: 'Unauthorized', cat: 'Client Error', desc: 'Authentication is required and has failed or not been provided.' },
    { code: 403, name: 'Forbidden', cat: 'Client Error', desc: 'Client does not have access rights to the content.' },
    { code: 404, name: 'Not Found', cat: 'Client Error', desc: 'Server cannot find requested resource.' },
    { code: 409, name: 'Conflict', cat: 'Client Error', desc: 'Request conflict with current state of target resource.' },
    { code: 422, name: 'Unprocessable Content', cat: 'Client Error', desc: 'Semantic errors in provided request payload.' },
    { code: 429, name: 'Too Many Requests', cat: 'Client Error', desc: 'Rate limit exceeded.' },
    { code: 500, name: 'Internal Server Error', cat: 'Server Error', desc: 'Unexpected server error encountered.' },
    { code: 502, name: 'Bad Gateway', cat: 'Server Error', desc: 'Invalid response from upstream server.' },
    { code: 503, name: 'Service Unavailable', cat: 'Server Error', desc: 'Server is currently unable to handle the request.' },
    { code: 504, name: 'Gateway Timeout', cat: 'Server Error', desc: 'Upstream server did not send response in time.' }
  ];

  const query = q.toLowerCase();
  const filtered = codes.filter(c => 
    String(c.code).includes(query) || 
    c.name.toLowerCase().includes(query) || 
    c.desc.toLowerCase().includes(query) ||
    c.cat.toLowerCase().includes(query)
  );

  el.innerHTML = filtered.map(c => {
    const is2xx = c.code >= 200 && c.code < 300;
    const is3xx = c.code >= 300 && c.code < 400;
    const is4xx = c.code >= 400 && c.code < 500;
    const color = is2xx ? '#22c55e' : is3xx ? '#38bdf8' : is4xx ? '#f59e0b' : 'var(--danger)';

    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:800;color:${color};width:38px;">${c.code}</span>
          <div>
            <span style="font-size:13px;font-weight:700;color:var(--text);">${esc(c.name)}</span>
            <span style="font-size:11px;color:var(--muted);margin-left:8px;">${esc(c.desc)}</span>
          </div>
        </div>
        <span class="badge" style="background:var(--surface2);color:var(--muted);font-size:10px;">${esc(c.cat)}</span>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 11. 📝 MARKDOWN STUDIO & DOCUMENT EXPORTER
// ============================================================================
let mdStudioText = `# 🚀 Project Architectural Blueprint & System Spec

Welcome to the **Vault Markdown Studio**. Write clean documentation, technical RFCs, and changelogs with real-time preview, interactive task lists, and instant multi-format export.

## ⚡ Core Capabilities
- **Real-Time Split Preview**: Instant rendering with typography scaling.
- **Interactive Checklists**: Clickable checkboxes synchronize directly into Markdown!
- **Table Support**: Clean data presentation with column formatting.
- **Export Options**: 1-Click Export to \`.md\`, standalone \`.html\`, or copy clean markup.

### 📊 Sprint Velocity & Deliverables
| Module | Lead Engineer | Status | Target Date |
| :--- | :--- | :---: | ---: |
| Quantum Crypto Engine | Alex Rivera | \`VERIFIED\` | 2026-10-01 |
| TLS & WHOIS Auditor | Security Ops | \`ACTIVE\` | 2026-10-05 |
| REST API Playground | Fullstack Team | \`SHIPPED\` | 2026-09-18 |

### 🛠️ Key Implementation Checklist
- [x] Integrate k-anonymity breach auditor
- [x] Configure live RDAP and SSL certificate inspector
- [ ] Deploy zero-knowledge synchronization relay
- [ ] Implement WebAuthn FIDO2 physical security key flow

> *"Simplicity is a prerequisite for reliability."* — Edsger W. Dijkstra

\`\`\`typescript
// Cryptographic Hash Integrity Verification
async function verifySha256(data: string, expectedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHash.toLowerCase();
}
\`\`\`
`;

function renderMarkdownStudio(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <!-- TOOLBAR & TEMPLATE SELECTOR -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-weight:700;font-size:14px;margin-right:6px;display:flex;align-items:center;gap:6px;">
            <span>📝</span> Markdown Studio
          </span>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('# ', '')" title="Heading 1"><strong>H1</strong></button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('## ', '')" title="Heading 2"><strong>H2</strong></button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('### ', '')" title="Heading 3"><strong>H3</strong></button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('**', '**')" title="Bold"><strong>B</strong></button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('*', '*')" title="Italic"><em>I</em></button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('~~', '~~')" title="Strikethrough">~S~</button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('\`', '\`')" title="Inline Code"><code>&lt;&gt;</code></button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('\`\`\`javascript\\n', '\\n\`\`\`')" title="Code Block"><code>{ }</code></button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('> ', '')" title="Blockquote">❝❞</button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('- [ ] ', '')" title="Task Item">☑ Task</button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('| Col 1 | Col 2 | Col 3 |\\n| :--- | :---: | ---: |\\n| Data 1 | Data 2 | Data 3 |\\n', '')" title="Table">📊 Table</button>
          <button class="dict-synonym-pill" onclick="insertMdSyntax('[', '](https://)')" title="Hyperlink">🔗 Link</button>
        </div>

        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <select id="mdTemplateSelect" onchange="loadMdTemplate(this.value)" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);padding:6px 10px;font-size:12px;outline:none;">
            <option value="">💡 Load Template...</option>
            <option value="blueprint">Technical Spec / Blueprint</option>
            <option value="readme">Project README</option>
            <option value="changelog">Changelog & Release Notes</option>
            <option value="meeting">Sprint & Meeting Action Items</option>
          </select>
          <button class="filter-pill" onclick="copyRenderedHtml()" style="font-size:12px;">📋 Copy HTML</button>
          <button class="filter-pill" onclick="exportMdFile()" style="font-size:12px;">📥 Export .md</button>
          <button class="btn btn-primary" onclick="exportHtmlFile()" style="font-size:12px;padding:6px 12px;">📄 Export .html</button>
        </div>
      </div>

      <!-- METRICS HEADER -->
      <div id="mdStatsBar" style="display:flex;align-items:center;gap:16px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 14px;font-size:12px;color:var(--muted);flex-wrap:wrap;">
        <!-- Calculated on update -->
      </div>

      <!-- DUAL PANE SPLIT EDITOR -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;min-height:540px;" id="mdSplitGrid">
        <!-- LEFT: INPUT TEXTAREA -->
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;">
            <span>Raw Markdown Editor</span>
            <button onclick="clearMdEditor()" style="background:none;border:none;color:var(--muted);font-size:11px;cursor:pointer;">Clear</button>
          </div>
          <textarea 
            id="mdInputTextarea" 
            placeholder="Type or paste Markdown here..." 
            oninput="onMarkdownEditorInput(this.value)" 
            style="flex:1;width:100%;min-height:500px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.6;padding:14px;outline:none;resize:vertical;"
          >${esc(mdStudioText)}</textarea>
        </div>

        <!-- RIGHT: LIVE FORMATTED PREVIEW -->
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;">
            <span>Live Rendered HTML Preview</span>
            <span style="font-size:11px;color:var(--green);">● Live Reactive</span>
          </div>
          <div 
            id="mdRenderedPreview" 
            class="markdown-body-preview"
            style="flex:1;min-height:500px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:18px 22px;color:var(--text);overflow-y:auto;line-height:1.7;font-size:14px;"
          >
            <!-- Rendered by parseMarkdown -->
          </div>
        </div>
      </div>
    </div>
  `;

  updateMarkdownPreview();
}

function onMarkdownEditorInput(val) {
  mdStudioText = val;
  updateMarkdownPreview();
}

function updateMarkdownPreview() {
  const preview = document.getElementById('mdRenderedPreview');
  const stats = document.getElementById('mdStatsBar');
  if (!preview) return;

  const raw = mdStudioText || '';
  const parsed = parseCustomMarkdown(raw);
  preview.innerHTML = parsed;

  // Calculate statistics
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  const chars = raw.length;
  const readTimeMin = Math.max(1, Math.ceil(words / 200));
  const headingCount = (raw.match(/^#{1,6}\s+/gm) || []).length;
  const codeBlockCount = (raw.match(/```/g) || []).length / 2;

  if (stats) {
    stats.innerHTML = `
      <span><strong>${words.toLocaleString()}</strong> words</span>
      <span>•</span>
      <span><strong>${chars.toLocaleString()}</strong> characters</span>
      <span>•</span>
      <span>⏱️ <strong>${readTimeMin} min</strong> reading time</span>
      <span>•</span>
      <span>🏷️ <strong>${headingCount}</strong> headings</span>
      <span>•</span>
      <span>💻 <strong>${Math.floor(codeBlockCount)}</strong> code blocks</span>
    `;
  }
}

function insertMdSyntax(before, after) {
  const textarea = document.getElementById('mdInputTextarea');
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selected = val.substring(start, end) || 'text';

  const replacement = before + selected + after;
  textarea.value = val.substring(0, start) + replacement + val.substring(end);
  textarea.focus();
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = start + before.length + selected.length;
  mdStudioText = textarea.value;
  updateMarkdownPreview();
}

function clearMdEditor() {
  if (!confirm('Clear Markdown editor content?')) return;
  const textarea = document.getElementById('mdInputTextarea');
  if (textarea) textarea.value = '';
  mdStudioText = '';
  updateMarkdownPreview();
}

function loadMdTemplate(type) {
  if (!type) return;
  const templates = {
    blueprint: `# 🚀 Technical Architectural Specification & Blueprint

## 1. Executive Summary
Brief high-level overview of system goals, throughput metrics, and non-functional requirements.

## 2. System Architecture
| Component | Technology | Scaling Tier |
| :--- | :--- | ---: |
| Edge Ingestion | Cloudflare Workers | Serverless Auto-scale |
| Security Relay | Node.js TLS Proxy | Low-latency Compute |
| Database Engine | SQLite / D1 Replica | Global Read Replicas |

## 3. Cryptographic Primitives
- **Encryption**: AES-256-GCM authenticated encryption with 96-bit random nonce.
- **Key Derivation**: PBKDF2-HMAC-SHA256 with 250,000 iterations.
- **Transport Security**: TLS 1.3 with strict Forward Secrecy.

\`\`\`bash
# Run automated security verification suite
npm run test:security -- --thorough
\`\`\`
`,
    readme: `# 📦 Project Name

> A high-performance, privacy-first developer utility suite.

## ✨ Features
- 🔒 **Zero-Knowledge Security**: Client-side cryptography with zero remote data leakage.
- ⚡ **Sub-Second Performance**: Optimized DOM reactivity and native algorithms.
- 🌐 **Comprehensive Network Tools**: SSL certificates, WHOIS, DNS over HTTPS.

## 🚀 Quick Start
\`\`\`bash
# Clone the repository
git clone https://github.com/user/project.git

# Install dependencies
npm install

# Start local development server
npm run dev
\`\`\`

## 📄 License
MIT License © 2026.
`,
    changelog: `# 📋 Changelog & Release Notes

All notable changes to this project will be documented in this file.

## [v2.4.0] - 2026-09-18
### 🚀 Added
- **SSL / TLS Certificate Inspector**: Real-time inspection of certificate authority, validity period, and SANs.
- **ICANN WHOIS & RDAP Lookup**: Instant domain registrar and DNSSEC verification.
- **Password Breach & Entropy Auditor**: K-anonymity search against 900M+ compromised credentials.
- **REST API Playground**: Integrated HTTP request builder with cURL generator.

### 🛡️ Security
- Upgraded cryptographic key derivation rounds.
- Hardened server endpoints with strict loopback/private subnet SSRF protection.
`,
    meeting: `# 📅 Sprint Review & Engineering Action Items

**Date**: 2026-09-18  
**Attendees**: Lead Architect, Security Engineer, Frontend Lead  

## 🎯 Sprint Objectives
- [x] Complete developer toolbox expansion to 14 tools
- [x] Implement live Markdown studio with export capabilities
- [ ] Schedule Q4 security penetration audit
- [ ] Finalize WebAuthn credential manager

## 📝 Key Discussions
1. **Performance**: Markdown parsing executes synchronously in under 2ms without third-party bundle overhead.
2. **SSRF Hardening**: Implemented strict IP filtering on internal endpoints.
`
  };

  if (templates[type]) {
    const textarea = document.getElementById('mdInputTextarea');
    if (textarea) textarea.value = templates[type];
    mdStudioText = templates[type];
    updateMarkdownPreview();
    toast('Loaded ' + type + ' template!');
  }
}

function parseCustomMarkdown(md) {
  if (!md) return '<div style="color:var(--muted);font-style:italic;">Preview output will appear here...</div>';

  let html = md;

  // 1. Code blocks with copy button
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function(_, lang, code) {
    const safeCode = esc(code.trim());
    return `<div style="position:relative;margin:14px 0;border-radius:var(--radius-sm);overflow:hidden;background:#0d1117;border:1px solid #30363d;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:#161b22;font-size:11px;color:#8b949e;border-bottom:1px solid #30363d;font-family:'JetBrains Mono',monospace;">
        <span>${lang || 'code'}</span>
        <button onclick="copyRawCodeBlock(this)" style="background:transparent;border:none;color:#8b949e;cursor:pointer;font-size:11px;padding:2px 6px;">📋 Copy</button>
      </div>
      <pre style="margin:0;padding:12px 14px;overflow-x:auto;color:#c9d1d9;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.5;"><code>${safeCode}</code></pre>
    </div>`;
  });

  // 2. Tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, function(tableBlock) {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return tableBlock;

    let tableHtml = '<div style="overflow-x:auto;margin:14px 0;"><table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--border);">';
    let isHeader = true;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].trim();
      if (/^\|[\s\-:]+\|\s*$/.test(row)) {
        isHeader = false;
        continue;
      }
      const cols = row.split('|').slice(1, -1);
      if (isHeader) {
        tableHtml += '<thead style="background:var(--surface2);"><tr>';
        cols.forEach(c => {
          tableHtml += `<th style="padding:8px 12px;border:1px solid var(--border);text-align:left;font-weight:700;">${c.trim()}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr style="border-bottom:1px solid var(--border);">';
        cols.forEach(c => {
          tableHtml += `<td style="padding:8px 12px;border:1px solid var(--border);">${c.trim()}</td>`;
        });
        tableHtml += '</tr>';
      }
    }
    tableHtml += '</tbody></table></div>';
    return tableHtml;
  });

  // 3. Headings
  html = html.replace(/^######\s+(.*)$/gm, '<h6 style="font-size:14px;font-weight:700;margin:14px 0 6px 0;color:var(--text);">$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gm, '<h5 style="font-size:15px;font-weight:700;margin:16px 0 6px 0;color:var(--text);">$1</h5>');
  html = html.replace(/^####\s+(.*)$/gm, '<h4 style="font-size:16px;font-weight:700;margin:18px 0 8px 0;color:var(--text);">$1</h4>');
  html = html.replace(/^###\s+(.*)$/gm, '<h3 style="font-size:18px;font-weight:700;margin:20px 0 8px 0;color:var(--text);">$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2 style="font-size:20px;font-weight:800;margin:24px 0 10px 0;padding-bottom:6px;border-bottom:1px solid var(--border);color:var(--text);">$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1 style="font-size:24px;font-weight:800;margin:20px 0 12px 0;color:var(--text);">$1</h1>');

  // 4. Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote style="margin:12px 0;padding:8px 14px;border-left:3px solid var(--accent);background:var(--surface2);border-radius:0 var(--radius-sm) var(--radius-sm) 0;color:var(--muted);font-style:italic;">$1</blockquote>');

  // 5. Task lists (Interactive Checkboxes!)
  let taskIndex = 0;
  html = html.replace(/^- \[([ xX])\]\s+(.*)$/gm, function(_, checked, text) {
    const isChecked = checked.toLowerCase() === 'x';
    const curIdx = taskIndex++;
    return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
      <input type="checkbox" id="md-task-${curIdx}" ${isChecked ? 'checked' : ''} onchange="toggleMdTaskCheckbox(${curIdx})" style="cursor:pointer;" />
      <label for="md-task-${curIdx}" style="cursor:pointer;${isChecked ? 'text-decoration:line-through;color:var(--muted);' : ''}">${text}</label>
    </div>`;
  });

  // 6. Unordered lists
  html = html.replace(/^- (.*)$/gm, '<li style="margin:4px 0 4px 18px;">$1</li>');

  // 7. Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:20px 0;" />');

  // 8. Inline formatting: bold, italic, code, strikethrough
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del style="color:var(--muted);">$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:var(--surface2);padding:2px 6px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:12.5px;color:var(--accent);border:1px solid var(--border);">$1</code>');

  // 9. Links & Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:var(--radius-sm);margin:10px 0;" />');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;">$1</a>');

  // 10. Paragraph line-breaks
  html = html.replace(/\n\n/g, '<div style="height:10px;"></div>');

  return html;
}

function copyRawCodeBlock(btn) {
  const pre = btn.closest('div').parentElement.querySelector('pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.innerText).then(() => {
    btn.innerText = '✓ Copied!';
    setTimeout(() => { btn.innerText = '📋 Copy'; }, 2000);
  });
}

function toggleMdTaskCheckbox(index) {
  let taskCounter = 0;
  mdStudioText = mdStudioText.replace(/^- \[([ xX])\]/gm, function(match, state) {
    if (taskCounter === index) {
      taskCounter++;
      return state.toLowerCase() === 'x' ? '- [ ]' : '- [x]';
    }
    taskCounter++;
    return match;
  });

  const textarea = document.getElementById('mdInputTextarea');
  if (textarea) textarea.value = mdStudioText;
  updateMarkdownPreview();
}

function copyRenderedHtml() {
  const raw = mdStudioText || '';
  const parsed = parseCustomMarkdown(raw);
  navigator.clipboard.writeText(parsed).then(() => {
    toast('Copied rendered HTML to clipboard!');
  }).catch(() => {
    toast('Unable to copy to clipboard');
  });
}

function exportMdFile() {
  const blob = new Blob([mdStudioText || ''], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vault-document-${Date.now()}.md`;
  a.click();
  toast('Exported .md file!');
}

function exportHtmlFile() {
  const raw = mdStudioText || '';
  const parsed = parseCustomMarkdown(raw);
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vault Document Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #e6edf3; background: #0d1117; max-width: 860px; margin: 0 auto; padding: 40px 20px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #30363d; padding: 8px 12px; text-align: left; }
    th { background: #161b22; }
    code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; background: #161b22; padding: 2px 6px; border-radius: 4px; }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 3px solid #7c6af7; padding: 8px 16px; margin: 16px 0; color: #8b949e; background: #161b22; }
    a { color: #58a6ff; }
  </style>
</head>
<body>
  ${parsed}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vault-document-${Date.now()}.html`;
  a.click();
  toast('Exported standalone .html document!');
}

// ============================================================================
// 12. 🔒 SSL / TLS CERTIFICATE & WHOIS DOMAIN INSPECTOR
// ============================================================================
let sslTargetDomain = 'cloudflare.com';
let sslCertData = null;
let whoisData = null;
let isSslLoading = false;

function renderSslInspector(container) {
  const presets = ['cloudflare.com', 'github.com', 'google.com', 'wikipedia.org', 'apple.com', 'mozilla.org'];

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- SEARCH / DOMAIN BAR -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px;">
              <span>🔒</span> SSL/TLS Certificate & WHOIS Domain Inspector
            </span>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">
              Probe TLS cipher suites, X.509 certificate expiry dates, Certificate Authorities (CA), and ICANN RDAP registration.
            </div>
          </div>
          <span class="badge" style="background:rgba(34,197,94,0.12);color:var(--green);font-size:11px;">
            Live Public PKI Ready
          </span>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input 
            type="text" 
            id="sslDomainInput" 
            placeholder="Enter hostname or domain (e.g., github.com)..." 
            value="${esc(sslTargetDomain)}" 
            onkeydown="if(event.key==='Enter') executeSslAudit()"
            style="flex:1;min-width:260px;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;"
          />
          <button class="btn btn-primary" onclick="executeSslAudit()" id="btnExecuteSsl" style="padding:10px 20px;">
            ${isSslLoading ? 'Probing Host...' : '🔍 Inspect Domain & SSL'}
          </button>
        </div>

        <!-- PRESETS CHIPS -->
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;">Quick Presets:</span>
          ${presets.map(p => `
            <button class="dict-synonym-pill" onclick="selectSslPreset('${p}')">${p}</button>
          `).join('')}
        </div>
      </div>

      <!-- RESULTS BODY -->
      <div id="sslAuditResults">
        ${isSslLoading ? `
          <div style="text-align:center;padding:50px;color:var(--accent);">
            <div style="font-size:32px;margin-bottom:8px;">🔒</div>
            <div style="font-size:16px;font-weight:700;">Initiating TLS Handshake & Querying RDAP Registry...</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">Inspecting X.509 chain, cipher negotiations, and domain status.</div>
          </div>
        ` : (sslCertData || whoisData) ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" id="sslGrid">
            
            <!-- PANEL 1: SSL/TLS CERTIFICATE -->
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:10px;">
                <span style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
                  <span>📜</span> SSL/TLS Certificate Profile
                </span>
                ${sslCertData?.isExpired ? `
                  <span class="badge" style="background:rgba(239,68,68,0.15);color:var(--danger);font-weight:700;">⚠️ EXPIRED</span>
                ` : sslCertData?.isExpiringSoon ? `
                  <span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700;">⚠️ Expiring Soon (${sslCertData.daysRemaining} days)</span>
                ` : `
                  <span class="badge" style="background:rgba(34,197,94,0.15);color:var(--green);font-weight:700;">✓ Valid & Active (${sslCertData?.daysRemaining ?? 'N/A'} days left)</span>
                `}
              </div>

              ${sslCertData ? `
                <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Common Name (CN)</span>
                    <span style="font-weight:700;font-family:'JetBrains Mono',monospace;">${esc(sslCertData.subjectCN || sslCertData.subject || sslCertData.domain)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Certificate Authority (Issuer)</span>
                    <span style="font-weight:600;color:var(--accent);">${esc(sslCertData.issuer || sslCertData.issuerOrg || 'Unknown')}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Valid From</span>
                    <span>${sslCertData.validFrom ? new Date(sslCertData.validFrom).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Valid Until (Expiry)</span>
                    <span style="font-weight:700;">${sslCertData.validTo ? new Date(sslCertData.validTo).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Negotiated Protocol</span>
                    <span class="badge" style="background:var(--surface2);font-family:'JetBrains Mono',monospace;">${esc(sslCertData.protocol || 'TLS')}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Cipher Suite</span>
                    <span style="font-size:11.5px;font-family:'JetBrains Mono',monospace;color:var(--muted);">${esc(sslCertData.cipher || 'Standard TLS')}</span>
                  </div>
                  ${sslCertData.fingerprint256 ? `
                    <div style="padding:4px 0;border-bottom:1px solid var(--border);">
                      <div style="color:var(--muted);margin-bottom:3px;font-size:11px;">SHA-256 Fingerprint</div>
                      <div style="font-size:10.5px;font-family:'JetBrains Mono',monospace;word-break:break-all;color:var(--text);background:var(--surface2);padding:6px;border-radius:4px;">${esc(sslCertData.fingerprint256)}</div>
                    </div>
                  ` : ''}
                  ${sslCertData.sans && sslCertData.sans.length ? `
                    <div style="padding-top:4px;">
                      <div style="color:var(--muted);margin-bottom:6px;font-size:11px;font-weight:600;">Subject Alternative Names (${sslCertData.sans.length})</div>
                      <div style="display:flex;flex-wrap:wrap;gap:4px;">
                        ${sslCertData.sans.map(s => `
                          <span style="font-size:11px;font-family:'JetBrains Mono',monospace;background:var(--surface2);padding:2px 6px;border-radius:3px;border:1px solid var(--border);">${esc(s)}</span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div style="color:var(--muted);text-align:center;padding:30px 0;">No SSL certificate details available.</div>
              `}
            </div>

            <!-- PANEL 2: WHOIS & RDAP REGISTRATION -->
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:10px;">
                <span style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
                  <span>🌐</span> WHOIS & RDAP Domain Registry
                </span>
                <span class="badge" style="background:var(--surface2);color:var(--muted);font-size:10px;">
                  ${esc(whoisData?.source || 'ICANN RDAP')}
                </span>
              </div>

              ${whoisData ? `
                <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Registrar</span>
                    <span style="font-weight:700;">${esc(whoisData.registrar || 'Protected / Authoritative')}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Registration Date</span>
                    <span>${whoisData.creationDate ? new Date(whoisData.creationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Registry Expiry</span>
                    <span style="font-weight:600;">${whoisData.expirationDate ? new Date(whoisData.expirationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">Last Changed / Updated</span>
                    <span>${whoisData.updatedDate ? new Date(whoisData.updatedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                    <span style="color:var(--muted);">DNSSEC Signed</span>
                    <span class="badge" style="${whoisData.dnssec ? 'background:rgba(34,197,94,0.15);color:var(--green);' : 'background:var(--surface2);color:var(--muted);'}">
                      ${whoisData.dnssec ? '✓ Enabled / Signed' : 'Disabled'}
                    </span>
                  </div>
                  ${whoisData.abuseEmail ? `
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                      <span style="color:var(--muted);">Abuse Contact</span>
                      <a href="mailto:${esc(whoisData.abuseEmail)}" style="color:var(--accent);font-size:12px;">${esc(whoisData.abuseEmail)}</a>
                    </div>
                  ` : ''}
                  ${whoisData.nameServers && whoisData.nameServers.length ? `
                    <div style="padding-top:4px;">
                      <div style="color:var(--muted);margin-bottom:6px;font-size:11px;font-weight:600;">Authoritative Name Servers (${whoisData.nameServers.length})</div>
                      <div style="display:flex;flex-direction:column;gap:3px;">
                        ${whoisData.nameServers.map(ns => `
                          <span style="font-size:11.5px;font-family:'JetBrains Mono',monospace;color:var(--muted);background:var(--surface2);padding:3px 8px;border-radius:3px;">${esc(ns)}</span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div style="color:var(--muted);text-align:center;padding:30px 0;">No registration data found.</div>
              `}
            </div>

          </div>
        ` : `
          <div style="text-align:center;padding:60px 20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
            <div style="font-size:36px;margin-bottom:10px;">🔒</div>
            <div style="font-size:16px;font-weight:700;">Inspect Any Domain's Cryptographic SSL & WHOIS Records</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;max-width:480px;margin-left:auto;margin-right:auto;">
              Type any domain name or click a preset above to probe certificate validity, issuing authority, expiry countdown, and domain registrar details.
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

function selectSslPreset(domain) {
  sslTargetDomain = domain;
  const input = document.getElementById('sslDomainInput');
  if (input) input.value = domain;
  executeSslAudit();
}

async function executeSslAudit() {
  const input = document.getElementById('sslDomainInput');
  const domain = input ? input.value.trim() : sslTargetDomain;
  if (!domain) return toast('Please enter a domain or host');

  sslTargetDomain = domain;
  isSslLoading = true;
  renderActiveToolboxSubtab();

  try {
    const [sslRes, whoisRes] = await Promise.allSettled([
      api('GET', `/network/ssl-inspect?domain=${encodeURIComponent(domain)}`),
      api('GET', `/network/whois?domain=${encodeURIComponent(domain)}`)
    ]);

    if (sslRes.status === 'fulfilled' && sslRes.value && sslRes.value.success) {
      sslCertData = sslRes.value;
    } else {
      sslCertData = null;
    }

    if (whoisRes.status === 'fulfilled' && whoisRes.value && whoisRes.value.success) {
      whoisData = whoisRes.value;
    } else {
      whoisData = null;
    }

    if (sslCertData || whoisData) {
      toast(`✓ Successfully audited ${domain}!`);
    } else {
      toast('Failed to inspect domain. Ensure domain exists.');
    }
  } catch (err) {
    toast('Audit error: ' + err.message);
  } finally {
    isSslLoading = false;
    renderActiveToolboxSubtab();
  }
}

// ============================================================================
// 13. 🛡️ HAVE I BEEN PWNED & PASSWORD ENTROPY AUDITOR
// ============================================================================
let breachCandidatePassword = '';
let breachAuditResult = null;
let isAuditingBreach = false;

function renderBreachAuditor(container) {
  const entropyInfo = calculateEntropyMetrics(breachCandidatePassword);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- TOP CARD -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px 22px;display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px;">
              <span>🛡️</span> Have I Been Pwned & Password Entropy Auditor
            </span>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">
              Mathematical Shannon bit entropy, cracking time matrix, and 100% private k-anonymity breach verification against 900M+ leaked passwords.
            </div>
          </div>
          <span class="badge" style="background:rgba(34,197,94,0.15);color:var(--green);font-size:11px;font-weight:600;">
            Zero-Knowledge k-Anonymity
          </span>
        </div>

        <!-- INPUT FIELD -->
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <div style="flex:1;min-width:280px;position:relative;">
            <input 
              type="password" 
              id="breachPasswordInput" 
              placeholder="Enter password to test entropy and audit breach leaks..." 
              value="${esc(breachCandidatePassword)}"
              oninput="onBreachPasswordInput(this.value)"
              style="width:100%;padding:11px 44px 11px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:14px;outline:none;"
            />
            <button 
              type="button" 
              onclick="toggleBreachPasswordVisibility()" 
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--muted);font-size:14px;"
            >
              👁️
            </button>
          </div>
          <button class="filter-pill" onclick="generateBreachCandidate()" style="padding:10px 14px;font-size:13px;display:flex;align-items:center;gap:5px;">
            <span>🎲</span> Generate Strong
          </button>
          <button class="btn btn-primary" onclick="executeBreachAudit()" id="btnAuditBreach" style="padding:10px 20px;">
            ${isAuditingBreach ? 'Auditing 900M+ Leaks...' : '🛡️ Audit Breach Status'}
          </button>
        </div>

        <!-- PRIVACY BANNER -->
        <div style="font-size:11.5px;color:var(--muted);background:var(--surface2);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;align-items:center;gap:6px;">
          <span>🔒</span>
          <span><strong>Privacy Guarantee:</strong> Your actual password never leaves your browser. Only the first 5 hexadecimal characters of its SHA-1 hash are queried (k-Anonymity standard).</span>
        </div>
      </div>

      <!-- AUDIT RESULTS & ENTROPY DISPLAY -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" id="breachGrid">
        
        <!-- ENTROPY & STRENGTH METRICS -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:10px;">
            <span style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
              <span>🧮</span> Shannon Bit Entropy & Strength
            </span>
            <span class="badge" style="background:${entropyInfo.colorBg};color:${entropyInfo.colorText};font-weight:700;">
              ${entropyInfo.rating}
            </span>
          </div>

          <!-- METER BAR -->
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;">
              <span style="color:var(--muted);">Information Entropy</span>
              <span style="font-weight:800;font-family:'JetBrains Mono',monospace;">${entropyInfo.entropyBits} bits</span>
            </div>
            <div style="height:8px;background:var(--surface2);border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${Math.min(100, (entropyInfo.entropyBits / 100) * 100)}%;background:${entropyInfo.colorText};transition:width 0.3s ease;"></div>
            </div>
          </div>

          <!-- CHARACTER METRICS -->
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;font-size:12px;">
            <div style="background:var(--surface2);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);">
              <span style="color:var(--muted);">Length:</span>
              <strong style="font-family:'JetBrains Mono',monospace;margin-left:4px;">${entropyInfo.length} chars</strong>
            </div>
            <div style="background:var(--surface2);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);">
              <span style="color:var(--muted);">Pool Space (R):</span>
              <strong style="font-family:'JetBrains Mono',monospace;margin-left:4px;">${entropyInfo.poolSize} chars</strong>
            </div>
            <div style="background:var(--surface2);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);">
              <span style="color:var(--muted);">Lowercase:</span>
              <strong style="margin-left:4px;">${entropyInfo.hasLower ? '✓ Yes' : '✕ No'}</strong>
            </div>
            <div style="background:var(--surface2);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);">
              <span style="color:var(--muted);">Uppercase:</span>
              <strong style="margin-left:4px;">${entropyInfo.hasUpper ? '✓ Yes' : '✕ No'}</strong>
            </div>
            <div style="background:var(--surface2);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);">
              <span style="color:var(--muted);">Numbers:</span>
              <strong style="margin-left:4px;">${entropyInfo.hasDigit ? '✓ Yes' : '✕ No'}</strong>
            </div>
            <div style="background:var(--surface2);padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);">
              <span style="color:var(--muted);">Symbols:</span>
              <strong style="margin-left:4px;">${entropyInfo.hasSymbol ? '✓ Yes' : '✕ No'}</strong>
            </div>
          </div>

          <!-- CRACK TIME ESTIMATES -->
          <div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--border);padding-top:10px;">
            <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;">Estimated Brute-Force Crack Time:</div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0;">
              <span>Online Attack (100 req/sec)</span>
              <strong style="color:var(--text);font-family:'JetBrains Mono',monospace;">${entropyInfo.crackOnline}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0;">
              <span>Fast Hash (100 Billion/sec GPU rig)</span>
              <strong style="color:var(--accent);font-family:'JetBrains Mono',monospace;">${entropyInfo.crackOffline}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0;">
              <span>Supercomputer Cluster (100 Trillion/sec)</span>
              <strong style="font-family:'JetBrains Mono',monospace;">${entropyInfo.crackSuper}</strong>
            </div>
          </div>
        </div>

        <!-- BREACH AUDIT STATUS -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:10px;">
            <span style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:6px;">
              <span>🚨</span> Known Data Breach Status
            </span>
            <span class="badge" style="background:var(--surface2);color:var(--muted);font-size:10px;">Pwned Passwords API</span>
          </div>

          ${breachAuditResult ? (
            breachAuditResult.pwned ? `
              <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);padding:18px;text-align:center;display:flex;flex-direction:column;gap:8px;">
                <div style="font-size:32px;">⚠️</div>
                <div style="font-size:17px;font-weight:800;color:var(--danger);">CRITICALLY COMPROMISED!</div>
                <div style="font-size:13px;color:var(--text);line-height:1.5;">
                  This password has appeared in known public corporate data breaches <strong>${breachAuditResult.count.toLocaleString()} times</strong>.
                </div>
                <div style="font-size:11.5px;color:var(--danger);font-weight:600;margin-top:4px;">
                  DO NOT use this password anywhere. Attackers include it in automated dictionary credential stuffing attacks.
                </div>
              </div>
            ` : `
              <div style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:var(--radius-sm);padding:18px;text-align:center;display:flex;flex-direction:column;gap:8px;">
                <div style="font-size:32px;">🛡️</div>
                <div style="font-size:17px;font-weight:800;color:var(--green);">Zero Breaches Detected!</div>
                <div style="font-size:13px;color:var(--text);line-height:1.5;">
                  This password was <strong>not found</strong> in over 900+ million compromised credentials checked via k-Anonymity range lookup.
                </div>
                <div style="font-size:11.5px;color:var(--green);font-weight:600;margin-top:4px;">
                  Clean cryptographic match. Verified unique against known leak repositories.
                </div>
              </div>
            `
          ) : `
            <div style="color:var(--muted);text-align:center;padding:40px 10px;display:flex;flex-direction:column;align-items:center;gap:10px;">
              <div style="font-size:36px;">🔍</div>
              <div style="font-size:14px;font-weight:600;">No Active Breach Audit Executed</div>
              <div style="font-size:12px;max-width:320px;">
                Enter a password above and click <strong>"Audit Breach Status"</strong> to check whether it has been exposed in major data breaches.
              </div>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}

function onBreachPasswordInput(val) {
  breachCandidatePassword = val;
  breachAuditResult = null;
  renderActiveToolboxSubtab();
}

function toggleBreachPasswordVisibility() {
  const input = document.getElementById('breachPasswordInput');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function generateBreachCandidate() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*()_-+=';
  let pwd = '';
  const randValues = new Uint32Array(24);
  crypto.getRandomValues(randValues);
  for (let i = 0; i < 24; i++) {
    pwd += chars[randValues[i] % chars.length];
  }
  breachCandidatePassword = pwd;
  breachAuditResult = null;
  const input = document.getElementById('breachPasswordInput');
  if (input) input.value = pwd;
  renderActiveToolboxSubtab();
}

function calculateEntropyMetrics(pwd) {
  if (!pwd) {
    return {
      length: 0,
      poolSize: 0,
      entropyBits: 0,
      rating: 'Empty',
      colorBg: 'var(--surface2)',
      colorText: 'var(--muted)',
      hasLower: false,
      hasUpper: false,
      hasDigit: false,
      hasSymbol: false,
      crackOnline: '0 seconds',
      crackOffline: '0 seconds',
      crackSuper: '0 seconds'
    };
  }

  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSymbol) poolSize += 33;
  if (poolSize === 0) poolSize = 1;

  const entropyBits = Math.round(pwd.length * (Math.log2(poolSize) || 1));

  let rating = 'Very Weak';
  let colorBg = 'rgba(239,68,68,0.15)';
  let colorText = 'var(--danger)';

  if (entropyBits >= 80) {
    rating = 'Bulletproof';
    colorBg = 'rgba(34,197,94,0.15)';
    colorText = 'var(--green)';
  } else if (entropyBits >= 60) {
    rating = 'Strong';
    colorBg = 'rgba(56,189,248,0.15)';
    colorText = '#38bdf8';
  } else if (entropyBits >= 40) {
    rating = 'Moderate';
    colorBg = 'rgba(245,158,11,0.15)';
    colorText = '#f59e0b';
  }

  // Combinations
  const totalCombinations = Math.pow(poolSize, pwd.length);

  function formatTime(seconds) {
    if (seconds < 1) return '< 1 second';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    const years = seconds / 31536000;
    if (years < 1000) return `${Math.round(years)} years`;
    if (years < 1e6) return `${(years / 1000).toFixed(1)} thousand years`;
    if (years < 1e9) return `${(years / 1e6).toFixed(1)} million years`;
    return `${(years / 1e9).toFixed(1)} billion years`;
  }

  const crackOnline = formatTime(totalCombinations / 100);
  const crackOffline = formatTime(totalCombinations / 1e11);
  const crackSuper = formatTime(totalCombinations / 1e14);

  return {
    length: pwd.length,
    poolSize,
    entropyBits,
    rating,
    colorBg,
    colorText,
    hasLower,
    hasUpper,
    hasDigit,
    hasSymbol,
    crackOnline,
    crackOffline,
    crackSuper
  };
}

async function executeBreachAudit() {
  const input = document.getElementById('breachPasswordInput');
  const pwd = input ? input.value : breachCandidatePassword;
  if (!pwd) return toast('Please enter a password to audit');

  isAuditingBreach = true;
  renderActiveToolboxSubtab();

  try {
    // 1. Calculate SHA-1 hash locally client-side
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(pwd));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    // 2. Query k-anonymity endpoint
    let hashes = {};
    try {
      const res = await api('GET', `/security/pwned-check?prefix=${prefix}`);
      if (res && res.success && res.hashes) {
        hashes = res.hashes;
      }
    } catch (_) {
      // Fallback direct to open CORS pwnedpasswords API
      const r = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' }
      });
      if (r.ok) {
        const text = await r.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const [h, count] = line.trim().split(':');
          if (h && count) hashes[h] = parseInt(count, 10);
        }
      }
    }

    if (hashes[suffix]) {
      breachAuditResult = { pwned: true, count: hashes[suffix] };
      toast(`⚠️ Compromised: seen ${hashes[suffix].toLocaleString()} times in breaches!`);
    } else {
      breachAuditResult = { pwned: false, count: 0 };
      toast('✓ Zero breaches detected! Safe password.');
    }
  } catch (err) {
    toast('Breach audit error: ' + err.message);
  } finally {
    isAuditingBreach = false;
    renderActiveToolboxSubtab();
  }
}

// ============================================================================
// 14. 🚀 HTTP REST API & WEBHOOK REQUEST PLAYGROUND
// ============================================================================
let restConfig = {
  method: 'GET',
  url: 'https://httpbin.org/get',
  headers: [
    { key: 'Accept', value: 'application/json', enabled: true }
  ],
  body: '{\n  "client": "Vault Developer Suite",\n  "timestamp": 1726675200\n}',
  responseTab: 'body', // 'body' | 'headers' | 'curl'
  responseData: null,
  isLoading: false
};

function renderRestPlayground(container) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
  const presets = [
    { label: 'HTTPBin GET', method: 'GET', url: 'https://httpbin.org/get', body: '' },
    { label: 'HTTPBin POST', method: 'POST', url: 'https://httpbin.org/post', body: '{\n  "event": "webhook_dispatched",\n  "status": "success"\n}' },
    { label: 'Cat Fact API', method: 'GET', url: 'https://catfact.ninja/fact', body: '' },
    { label: 'GitHub Zen', method: 'GET', url: 'https://api.github.com/zen', body: '' },
    { label: 'CoinDesk BTC', method: 'GET', url: 'https://api.coindesk.com/v1/bpi/currentprice.json', body: '' }
  ];

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- TOP BAR: METHOD & URL -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px;">
              <span>🚀</span> HTTP & REST API Playground
            </span>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">
              Test endpoints, inspect JSON responses, measure network latency, and generate cURL & fetch snippets.
            </div>
          </div>
          <span class="badge" style="background:rgba(124,106,247,0.12);color:var(--accent);font-size:11px;">
            SSRF-Protected Relay
          </span>
        </div>

        <!-- URL INPUT GROUP -->
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select 
            id="restMethodSelect" 
            onchange="restConfig.method = this.value" 
            style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--accent);font-weight:800;font-size:13px;padding:10px 14px;outline:none;"
          >
            ${methods.map(m => `
              <option value="${m}" ${restConfig.method === m ? 'selected' : ''}>${m}</option>
            `).join('')}
          </select>
          <input 
            type="text" 
            id="restUrlInput" 
            placeholder="https://api.example.com/v1/endpoint..." 
            value="${esc(restConfig.url)}"
            oninput="restConfig.url = this.value"
            onkeydown="if(event.key==='Enter') executeRestRequest()"
            style="flex:1;min-width:280px;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;"
          />
          <button class="btn btn-primary" onclick="executeRestRequest()" id="btnSendRest" style="padding:10px 22px;">
            ${restConfig.isLoading ? 'Sending...' : '⚡ Send Request'}
          </button>
        </div>

        <!-- PRESETS -->
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;">Sample APIs:</span>
          ${presets.map((p, idx) => `
            <button class="dict-synonym-pill" onclick="loadRestPreset(${idx})">${p.label}</button>
          `).join('')}
        </div>
      </div>

      <!-- MAIN CONFIG & RESPONSE SPLIT GRID -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" id="restSplitGrid">
        
        <!-- LEFT: REQUEST BUILDER (HEADERS & BODY) -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;display:flex;flex-direction:column;gap:14px;">
          <!-- HEADERS BUILDER -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;">HTTP Headers</span>
              <div style="display:flex;gap:4px;">
                <button class="dict-synonym-pill" onclick="addRestHeaderPreset('auth')" style="font-size:11px;">+ Bearer Auth</button>
                <button class="dict-synonym-pill" onclick="addRestHeaderPreset('json')" style="font-size:11px;">+ JSON Content</button>
                <button class="dict-synonym-pill" onclick="addRestHeaderRow()" style="font-size:11px;">+ Add Header</button>
              </div>
            </div>

            <div id="restHeadersList" style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;">
              ${restConfig.headers.map((h, i) => `
                <div style="display:flex;gap:6px;align-items:center;">
                  <input 
                    type="checkbox" 
                    ${h.enabled ? 'checked' : ''} 
                    onchange="toggleRestHeaderEnabled(${i})" 
                  />
                  <input 
                    type="text" 
                    placeholder="Key (e.g. Content-Type)" 
                    value="${esc(h.key)}" 
                    oninput="updateRestHeaderKey(${i}, this.value)"
                    style="flex:1;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;outline:none;"
                  />
                  <input 
                    type="text" 
                    placeholder="Value (e.g. application/json)" 
                    value="${esc(h.value)}" 
                    oninput="updateRestHeaderValue(${i}, this.value)"
                    style="flex:1.2;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;outline:none;"
                  />
                  <button onclick="removeRestHeaderRow(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:2px 6px;">✕</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- REQUEST BODY BUILDER -->
          <div style="display:flex;flex-direction:column;gap:6px;flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;">Request Body (JSON / Text)</span>
              <button class="dict-synonym-pill" onclick="formatRestJsonBody()" style="font-size:11px;">✨ Beautify JSON</button>
            </div>
            <textarea 
              id="restBodyTextarea" 
              placeholder="Enter JSON or text payload for POST / PUT requests..."
              oninput="restConfig.body = this.value"
              style="width:100%;min-height:220px;flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.5;padding:10px;outline:none;resize:vertical;"
            >${esc(restConfig.body)}</textarea>
          </div>
        </div>

        <!-- RIGHT: RESPONSE INSPECTOR & CODE GENERATOR -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;display:flex;flex-direction:column;gap:12px;">
          <!-- RESPONSE STATUS HEADER -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:10px;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:700;font-size:14px;">Response</span>
              ${restConfig.responseData ? `
                <span class="badge" style="background:${restConfig.responseData.status >= 200 && restConfig.responseData.status < 300 ? 'rgba(34,197,94,0.15);color:var(--green);' : restConfig.responseData.status >= 400 ? 'rgba(239,68,68,0.15);color:var(--danger);' : 'rgba(56,189,248,0.15);color:#38bdf8;'};font-weight:800;font-family:'JetBrains Mono',monospace;">
                  ${restConfig.responseData.status} ${esc(restConfig.responseData.statusText)}
                </span>
                <span style="font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;">
                  ⏱️ ${restConfig.responseData.latencyMs}ms
                </span>
                <span style="font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace;">
                  📦 ${(restConfig.responseData.sizeBytes / 1024).toFixed(1)} KB
                </span>
              ` : ''}
            </div>

            <!-- SUBTABS -->
            <div style="display:flex;gap:4px;">
              <button 
                class="settings-cat-pill ${restConfig.responseTab === 'body' ? 'active' : ''}" 
                onclick="switchRestResponseTab('body')" 
                style="font-size:11px;padding:3px 10px;"
              >
                Body
              </button>
              <button 
                class="settings-cat-pill ${restConfig.responseTab === 'headers' ? 'active' : ''}" 
                onclick="switchRestResponseTab('headers')" 
                style="font-size:11px;padding:3px 10px;"
              >
                Headers
              </button>
              <button 
                class="settings-cat-pill ${restConfig.responseTab === 'curl' ? 'active' : ''}" 
                onclick="switchRestResponseTab('curl')" 
                style="font-size:11px;padding:3px 10px;"
              >
                cURL & Fetch
              </button>
            </div>
          </div>

          <!-- RESPONSE CONTENT BODY -->
          <div style="flex:1;min-height:360px;max-height:460px;overflow-y:auto;">
            ${restConfig.isLoading ? `
              <div style="text-align:center;padding:70px 20px;color:var(--accent);">
                <div style="font-size:28px;margin-bottom:8px;">⚡</div>
                <div style="font-size:15px;font-weight:700;">Executing HTTP Request...</div>
                <div style="font-size:12px;color:var(--muted);margin-top:3px;">Resolving DNS and connecting to remote server.</div>
              </div>
            ` : restConfig.responseTab === 'body' ? (
              restConfig.responseData ? `
                <div style="position:relative;">
                  <button 
                    onclick="copyRestResponseBody()" 
                    style="position:absolute;right:10px;top:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:11px;padding:4px 8px;cursor:pointer;"
                  >
                    📋 Copy Body
                  </button>
                  <pre style="margin:0;padding:12px;background:#0d1117;border:1px solid #30363d;border-radius:var(--radius-sm);color:#c9d1d9;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.5;overflow-x:auto;white-space:pre-wrap;"><code>${esc(
                    restConfig.responseData.isJson && restConfig.responseData.json
                      ? JSON.stringify(restConfig.responseData.json, null, 2)
                      : (restConfig.responseData.body || 'Empty Response Body')
                  )}</code></pre>
                </div>
              ` : `
                <div style="color:var(--muted);text-align:center;padding:70px 20px;">
                  <div style="font-size:32px;margin-bottom:6px;">🚀</div>
                  <div style="font-size:14px;font-weight:600;">No Request Executed Yet</div>
                  <div style="font-size:12px;margin-top:3px;">Select an endpoint and click <strong>"Send Request"</strong>.</div>
                </div>
              `
            ) : restConfig.responseTab === 'headers' ? (
              restConfig.responseData?.headers ? `
                <div style="display:flex;flex-direction:column;gap:4px;">
                  ${Object.entries(restConfig.responseData.headers).map(([k, v]) => `
                    <div style="display:flex;justify-content:space-between;padding:6px 8px;background:var(--surface2);border-radius:var(--radius-sm);font-size:12px;font-family:'JetBrains Mono',monospace;">
                      <span style="color:var(--accent);font-weight:700;">${esc(k)}</span>
                      <span style="color:var(--text);word-break:break-all;max-width:60%;text-align:right;">${esc(v)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div style="color:var(--muted);text-align:center;padding:70px 20px;">No headers available yet.</div>
              `
            ) : `
              <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;">cURL Command</span>
                    <button class="dict-synonym-pill" onclick="copyRestCurlSnippet()" style="font-size:10.5px;">📋 Copy cURL</button>
                  </div>
                  <pre style="margin:0;padding:10px;background:#0d1117;border:1px solid #30363d;border-radius:var(--radius-sm);color:#7ee787;font-family:'JetBrains Mono',monospace;font-size:11.5px;overflow-x:auto;"><code>${esc(generateRestCurl())}</code></pre>
                </div>

                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;">JavaScript (Fetch)</span>
                    <button class="dict-synonym-pill" onclick="copyRestFetchSnippet()" style="font-size:10.5px;">📋 Copy JS</button>
                  </div>
                  <pre style="margin:0;padding:10px;background:#0d1117;border:1px solid #30363d;border-radius:var(--radius-sm);color:#79c0ff;font-family:'JetBrains Mono',monospace;font-size:11.5px;overflow-x:auto;"><code>${esc(generateRestFetchCode())}</code></pre>
                </div>
              </div>
            `}
          </div>
        </div>

      </div>
    </div>
  `;
}

function loadRestPreset(idx) {
  const presets = [
    { method: 'GET', url: 'https://httpbin.org/get', body: '' },
    { method: 'POST', url: 'https://httpbin.org/post', body: '{\n  "event": "webhook_dispatched",\n  "status": "success"\n}' },
    { method: 'GET', url: 'https://catfact.ninja/fact', body: '' },
    { method: 'GET', url: 'https://api.github.com/zen', body: '' },
    { method: 'GET', url: 'https://api.coindesk.com/v1/bpi/currentprice.json', body: '' }
  ];
  if (presets[idx]) {
    restConfig.method = presets[idx].method;
    restConfig.url = presets[idx].url;
    restConfig.body = presets[idx].body;
    restConfig.responseData = null;
    renderActiveToolboxSubtab();
    toast(`Loaded ${presets[idx].method} ${presets[idx].url}`);
  }
}

function addRestHeaderRow() {
  restConfig.headers.push({ key: '', value: '', enabled: true });
  renderActiveToolboxSubtab();
}

function removeRestHeaderRow(i) {
  restConfig.headers.splice(i, 1);
  renderActiveToolboxSubtab();
}

function toggleRestHeaderEnabled(i) {
  if (restConfig.headers[i]) {
    restConfig.headers[i].enabled = !restConfig.headers[i].enabled;
  }
}

function updateRestHeaderKey(i, val) {
  if (restConfig.headers[i]) restConfig.headers[i].key = val;
}

function updateRestHeaderValue(i, val) {
  if (restConfig.headers[i]) restConfig.headers[i].value = val;
}

function addRestHeaderPreset(type) {
  if (type === 'auth') {
    restConfig.headers.push({ key: 'Authorization', value: 'Bearer YOUR_TOKEN_HERE', enabled: true });
  } else if (type === 'json') {
    restConfig.headers.push({ key: 'Content-Type', value: 'application/json', enabled: true });
  }
  renderActiveToolboxSubtab();
}

function formatRestJsonBody() {
  const textarea = document.getElementById('restBodyTextarea');
  const txt = textarea ? textarea.value : restConfig.body;
  try {
    const parsed = JSON.parse(txt);
    const formatted = JSON.stringify(parsed, null, 2);
    restConfig.body = formatted;
    if (textarea) textarea.value = formatted;
    toast('JSON formatted cleanly!');
  } catch (err) {
    toast('Invalid JSON syntax: ' + err.message);
  }
}

function switchRestResponseTab(tab) {
  restConfig.responseTab = tab;
  renderActiveToolboxSubtab();
}

function generateRestCurl() {
  let cmd = `curl -X ${restConfig.method} "${restConfig.url}"`;
  restConfig.headers.filter(h => h.enabled && h.key).forEach(h => {
    cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
  });
  if (['POST', 'PUT', 'PATCH'].includes(restConfig.method) && restConfig.body) {
    const escaped = restConfig.body.replace(/"/g, '\\"');
    cmd += ` \\\n  -d "${escaped}"`;
  }
  return cmd;
}

function generateRestFetchCode() {
  const headersObj = {};
  restConfig.headers.filter(h => h.enabled && h.key).forEach(h => {
    headersObj[h.key] = h.value;
  });

  return `const response = await fetch("${restConfig.url}", {
  method: "${restConfig.method}",
  headers: ${JSON.stringify(headersObj, null, 4)}${['POST', 'PUT', 'PATCH'].includes(restConfig.method) && restConfig.body ? `,\n  body: JSON.stringify(${restConfig.body})` : ''}
});
const data = await response.json();
console.log(data);`;
}

function copyRestCurlSnippet() {
  navigator.clipboard.writeText(generateRestCurl()).then(() => toast('Copied cURL command!'));
}

function copyRestFetchSnippet() {
  navigator.clipboard.writeText(generateRestFetchCode()).then(() => toast('Copied JavaScript fetch code!'));
}

function copyRestResponseBody() {
  if (!restConfig.responseData) return;
  const content = restConfig.responseData.isJson && restConfig.responseData.json
    ? JSON.stringify(restConfig.responseData.json, null, 2)
    : restConfig.responseData.body;
  navigator.clipboard.writeText(content).then(() => toast('Copied response body!'));
}

async function executeRestRequest() {
  const methodInput = document.getElementById('restMethodSelect');
  const urlInput = document.getElementById('restUrlInput');
  const bodyTextarea = document.getElementById('restBodyTextarea');

  const method = methodInput ? methodInput.value : restConfig.method;
  const url = urlInput ? urlInput.value.trim() : restConfig.url;
  const body = bodyTextarea ? bodyTextarea.value : restConfig.body;

  if (!url) return toast('Please enter an endpoint URL');

  restConfig.method = method;
  restConfig.url = url;
  restConfig.body = body;
  restConfig.isLoading = true;
  renderActiveToolboxSubtab();

  const headersObj = {};
  restConfig.headers.filter(h => h.enabled && h.key).forEach(h => {
    headersObj[h.key] = h.value;
  });

  try {
    const res = await api('POST', '/network/proxy-fetch', {
      url,
      method,
      headers: headersObj,
      body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? body : null
    });

    if (res && res.success) {
      restConfig.responseData = res;
      toast(`✓ ${res.status} ${res.statusText} (${res.latencyMs}ms)`);
    } else {
      restConfig.responseData = {
        status: 0,
        statusText: 'Failed',
        latencyMs: res?.latencyMs || 0,
        sizeBytes: 0,
        headers: {},
        isJson: false,
        body: res?.error || 'Connection Failed'
      };
      toast('Request failed: ' + (res?.error || 'Unknown error'));
    }
  } catch (err) {
    restConfig.responseData = {
      status: 0,
      statusText: 'Error',
      latencyMs: 0,
      sizeBytes: 0,
      headers: {},
      isJson: false,
      body: 'Network Error: ' + err.message
    };
    toast('Error: ' + err.message);
  } finally {
    restConfig.isLoading = false;
    renderActiveToolboxSubtab();
  }
}

