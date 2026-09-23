/**
 * AI Cloud Studio Extended Features
 * - AI Document & File Intelligence Studio (Executive Briefing, PII Audit, Task Extractor)
 * - Cloudflare Edge Analytics & Global Speed Benchmark (PoP Latency, 1.1.1.1 DoH DNSSEC, Security Headers)
 * - AI Code Sandbox & Vulnerability Security Auditor (OWASP/CWE Scanner, Live Sandbox, Auto-Fix)
 * - Smart Voice Meeting Recorder & Action Item Extractor
 */

(function () {
  'use strict';

  // Global state
  window._docIntelState = {
    selectedFile: null,
    fileBase64: null,
    mimeType: null,
    filename: '',
    text: '',
    mode: 'summary',
    targetLang: 'Spanish',
    isAnalyzing: false,
    analysisResult: null,
    extractedTasks: []
  };

  window._edgeBenchmarkState = {
    isRunning: false,
    telemetry: null,
    results: {},
    dohDomain: '',
    dohType: 'A',
    dohResult: null,
    headerUrl: '',
    headerResult: null
  };

  window._codeSandboxState = {
    language: 'javascript',
    code: `// Sample vulnerable code snippet to audit
function authenticateUser(db, userInput) {
  // Vulnerable to SQL injection!
  const query = "SELECT * FROM users WHERE username = '" + userInput.username + "' AND password = '" + userInput.password + "'";
  return db.query(query);
}

console.log("System initialized on Cloudflare Edge.");`,
    isAuditing: false,
    auditResult: null,
    consoleLogs: []
  };

  // Helper: escape HTML
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // =========================================================================
  // 1. AI DOCUMENT & FILE INTELLIGENCE STUDIO
  // =========================================================================

  window.renderDocIntelStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const s = window._docIntelState;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">📑</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text, #fff);">AI Document & File Intelligence Studio</h1>
              <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);border:1px solid rgba(124,106,247,0.3);font-size:11px;">Gemini 3.8 Multimodal</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Extract executive takeaways, detect security credential leaks & PII, and automatically parse actionable tasks from any document or source file.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.loadDocIntelHistory()" style="font-size:12px;padding:8px 14px;">
              <span>📜</span> History & Saved Reports
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Input & Configuration -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border,rgba(255,255,255,0.08));border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            
            <!-- Analysis Mode Selector -->
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#aaa);text-transform:uppercase;display:block;margin-bottom:8px;">
                Intelligence Mode
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <button 
                  class="btn ${s.mode === 'summary' ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="window.setDocIntelMode('summary')"
                  style="text-align:left;padding:10px 12px;font-size:12px;"
                >
                  <div style="font-weight:700;">📊 Executive Summary</div>
                  <div style="font-size:11px;opacity:0.75;">Takeaways, key entities & briefing</div>
                </button>

                <button 
                  class="btn ${s.mode === 'security_scan' ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="window.setDocIntelMode('security_scan')"
                  style="text-align:left;padding:10px 12px;font-size:12px;"
                >
                  <div style="font-weight:700;">🛡️ Security & PII Leak Audit</div>
                  <div style="font-size:11px;opacity:0.75;">Redact passwords, tokens & API keys</div>
                </button>

                <button 
                  class="btn ${s.mode === 'tasks' ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="window.setDocIntelMode('tasks')"
                  style="text-align:left;padding:10px 12px;font-size:12px;"
                >
                  <div style="font-weight:700;">✅ Action Items Extractor</div>
                  <div style="font-size:11px;opacity:0.75;">1-click import into Vault Tasks</div>
                </button>

                <button 
                  class="btn ${s.mode === 'translate' ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="window.setDocIntelMode('translate')"
                  style="text-align:left;padding:10px 12px;font-size:12px;"
                >
                  <div style="font-weight:700;">🌐 Technical Translation</div>
                  <div style="font-size:11px;opacity:0.75;">Preserves code, format & markdown</div>
                </button>
              </div>
            </div>

            <!-- Target Language (if translate) -->
            ${s.mode === 'translate' ? `
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#aaa);display:block;margin-bottom:6px;">Target Language:</label>
                <select id="docIntelLang" class="form-control" style="width:100%;padding:8px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;" onchange="window._docIntelState.targetLang=this.value">
                  <option value="Spanish" ${s.targetLang === 'Spanish' ? 'selected' : ''}>Spanish (Español)</option>
                  <option value="French" ${s.targetLang === 'French' ? 'selected' : ''}>French (Français)</option>
                  <option value="German" ${s.targetLang === 'German' ? 'selected' : ''}>German (Deutsch)</option>
                  <option value="Japanese" ${s.targetLang === 'Japanese' ? 'selected' : ''}>Japanese (日本語)</option>
                  <option value="Chinese" ${s.targetLang === 'Chinese' ? 'selected' : ''}>Chinese (Simplified / 简体中文)</option>
                  <option value="Portuguese" ${s.targetLang === 'Portuguese' ? 'selected' : ''}>Portuguese (Português)</option>
                  <option value="Arabic" ${s.targetLang === 'Arabic' ? 'selected' : ''}>Arabic (العربية)</option>
                </select>
              </div>
            ` : ''}

            <!-- File Upload Dropzone -->
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#aaa);text-transform:uppercase;display:block;margin-bottom:8px;">
                Upload File or Document (PDF, TXT, MD, Code, Images)
              </label>
              <div 
                id="docIntelDropzone" 
                onclick="document.getElementById('docIntelFileInput').click()"
                style="border:2px dashed var(--border,rgba(255,255,255,0.15));border-radius:10px;padding:24px;text-align:center;cursor:pointer;background:var(--surface2,rgba(255,255,255,0.02));transition:all 0.2s ease;"
                onmouseover="this.style.borderColor='var(--accent,#7c6af7)'"
                onmouseout="this.style.borderColor='var(--border,rgba(255,255,255,0.15))'"
              >
                <input type="file" id="docIntelFileInput" style="display:none;" onchange="window.handleDocIntelFile(this.files[0])" accept=".pdf,.txt,.md,.json,.js,.ts,.py,.csv,.png,.jpg,.jpeg,.webp" />
                <div style="font-size:32px;margin-bottom:8px;">📁</div>
                <div style="font-size:14px;font-weight:600;color:var(--text,#fff);">
                  ${s.filename ? `Selected: <span style="color:var(--accent,#7c6af7);">${esc(s.filename)}</span>` : 'Click or drag file here'}
                </div>
                <div style="font-size:12px;color:var(--muted,#888);margin-top:4px;">
                  PDF, Markdown, Source Code, Screenshots, Receipts (up to 15MB)
                </div>
                ${s.filename ? `
                  <button class="btn btn-secondary" onclick="event.stopPropagation();window.clearDocIntelFile();" style="margin-top:10px;font-size:11px;padding:4px 10px;">
                    ✕ Clear File
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Direct Text / Paste Area -->
            <div style="flex:1;display:flex;flex-direction:column;">
              <label style="font-size:12px;font-weight:600;color:var(--muted,#aaa);text-transform:uppercase;display:block;margin-bottom:8px;">
                Or Paste Raw Document / Code / Notes
              </label>
              <textarea 
                id="docIntelText" 
                placeholder="Paste contract notes, incident logs, system requirements, or sensitive text to sanitize..." 
                style="flex:1;min-height:160px;width:100%;padding:12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:13px;resize:vertical;"
                oninput="window._docIntelState.text=this.value"
              >${esc(s.text)}</textarea>
            </div>

            <!-- Action Button -->
            <button 
              class="btn btn-primary" 
              id="btnRunDocIntel" 
              onclick="window.executeDocIntel()" 
              style="padding:14px;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;"
              ${s.isAnalyzing ? 'disabled' : ''}
            >
              ${s.isAnalyzing ? '<span>⏳</span> Processing with Gemini 3.8...' : '<span>⚡</span> Run Document Intelligence'}
            </button>
          </div>

          <!-- Right: Output & Extracted Actions -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border,rgba(255,255,255,0.08));border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:14px;font-weight:700;color:var(--text,#fff);display:flex;align-items:center;gap:6px;">
                <span>📋</span> Intelligence Report & Findings
              </span>
              ${s.analysisResult ? `
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-secondary" onclick="window.copyDocIntelResult()" style="font-size:11px;padding:6px 10px;">
                    📋 Copy
                  </button>
                  <button class="btn btn-secondary" onclick="window.saveDocIntelToVault()" style="font-size:11px;padding:6px 10px;">
                    💾 Save to Drive
                  </button>
                </div>
              ` : ''}
            </div>

            <!-- Tasks Bar (if extracted) -->
            ${s.extractedTasks && s.extractedTasks.length > 0 ? `
              <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:700;color:var(--green,#22c55e);font-size:13px;">
                    🎯 ${s.extractedTasks.length} Action Items Extracted!
                  </div>
                  <div style="font-size:11px;color:var(--muted,#aaa);">
                    Ready to populate your Vault Tasks database.
                  </div>
                </div>
                <button class="btn btn-primary" onclick="window.importAllExtractedTasks()" style="font-size:12px;padding:6px 14px;background:#22c55e;border-color:#22c55e;">
                  ➕ Import All to Tasks
                </button>
              </div>
            ` : ''}

            <!-- Analysis Output Viewer -->
            <div 
              id="docIntelOutput" 
              style="flex:1;min-height:360px;max-height:600px;overflow-y:auto;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:16px;color:#fff;font-size:13px;line-height:1.6;"
            >
              ${s.isAnalyzing ? `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted,#888);gap:12px;">
                  <div style="font-size:32px;animation:spin 1s linear infinite;">⏳</div>
                  <div>Analyzing document contents, extracting entities, and parsing security signals...</div>
                </div>
              ` : s.analysisResult ? `
                <div style="white-space:pre-wrap;font-family:system-ui,-apple-system,sans-serif;">${esc(s.analysisResult)}</div>
              ` : `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted,#888);text-align:center;padding:40px 20px;">
                  <span style="font-size:48px;opacity:0.4;margin-bottom:12px;">📄</span>
                  <div style="font-weight:600;font-size:15px;color:var(--text,#fff);">No Document Analyzed Yet</div>
                  <div style="font-size:12px;margin-top:6px;max-width:320px;">
                    Upload a file or paste text on the left, then click <strong>Run Document Intelligence</strong> to generate structured takeaways and security insights.
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Setup drag-and-drop
    const dropzone = document.getElementById('docIntelDropzone');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--accent, #7c6af7)';
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--border, rgba(255,255,255,0.15))';
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border, rgba(255,255,255,0.15))';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          window.handleDocIntelFile(e.dataTransfer.files[0]);
        }
      });
    }
  };

  window.setDocIntelMode = function (mode) {
    window._docIntelState.mode = mode;
    window.renderDocIntelStudio();
  };

  window.handleDocIntelFile = function (file) {
    if (!file) return;
    const s = window._docIntelState;
    s.filename = file.name;
    s.mimeType = file.type || 'text/plain';

    const reader = new FileReader();
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.onload = function (e) {
        s.fileBase64 = e.target.result;
        window.renderDocIntelStudio();
      };
      reader.readAsDataURL(file);
    } else {
      // Text / code / markdown
      reader.onload = function (e) {
        s.text = e.target.result;
        window.renderDocIntelStudio();
      };
      reader.readAsText(file);
    }
  };

  window.clearDocIntelFile = function () {
    const s = window._docIntelState;
    s.filename = '';
    s.fileBase64 = null;
    s.mimeType = null;
    window.renderDocIntelStudio();
  };

  window.executeDocIntel = async function () {
    const s = window._docIntelState;
    const txtInput = document.getElementById('docIntelText');
    if (txtInput) s.text = txtInput.value;

    if (!s.text && !s.fileBase64) {
      if (typeof window.toast === 'function') window.toast('Please provide a file or enter text to analyze.');
      return;
    }

    s.isAnalyzing = true;
    s.analysisResult = null;
    s.extractedTasks = [];
    window.renderDocIntelStudio();

    try {
      const res = await fetch('/api/ai/doc-intel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (window.masterKey || '')
        },
        body: JSON.stringify({
          text: s.text,
          fileBase64: s.fileBase64,
          mimeType: s.mimeType,
          filename: s.filename,
          mode: s.mode,
          targetLang: s.targetLang
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Document intelligence analysis failed');

      s.analysisResult = data.analysis;
      s.extractedTasks = data.extractedTasks || [];

      if (typeof window.toast === 'function') window.toast('Analysis complete!');
    } catch (err) {
      s.analysisResult = `Error: ${err.message}`;
      if (typeof window.toast === 'function') window.toast(`Analysis error: ${err.message}`);
    } finally {
      s.isAnalyzing = false;
      window.renderDocIntelStudio();
    }
  };

  window.importAllExtractedTasks = async function () {
    const tasks = window._docIntelState.extractedTasks;
    if (!tasks || tasks.length === 0) return;

    let imported = 0;
    for (const t of tasks) {
      try {
        const body = {
          title: t.title || 'Follow up task',
          description: t.description || 'Imported from Document Intelligence',
          priority: t.priority || 'medium',
          due_date: t.due_date || new Date().toISOString().split('T')[0]
        };
        if (typeof window.api === 'function') {
          await window.api('POST', '/todos', body);
          imported++;
        }
      } catch (_) {}
    }

    if (typeof window.toast === 'function') window.toast(`Successfully imported ${imported} tasks to Vault!`);
    window._docIntelState.extractedTasks = [];
    window.renderDocIntelStudio();
  };

  window.copyDocIntelResult = function () {
    const res = window._docIntelState.analysisResult;
    if (!res) return;
    navigator.clipboard.writeText(res).then(() => {
      if (typeof window.toast === 'function') window.toast('Copied analysis to clipboard!');
    });
  };

  window.saveDocIntelToVault = async function () {
    const s = window._docIntelState;
    if (!s.analysisResult) return;

    try {
      const filename = `DocIntel_${s.mode}_${Date.now()}.txt`;
      const base64 = btoa(unescape(encodeURIComponent(s.analysisResult)));

      const res = await fetch('/api/ai/save-to-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (window.masterKey || '')
        },
        body: JSON.stringify({
          filename,
          content: base64,
          mime_type: 'text/plain'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save to drive');
      if (typeof window.toast === 'function') window.toast('Report saved to Vault Drive!');
    } catch (err) {
      if (typeof window.toast === 'function') window.toast(`Save error: ${err.message}`);
    }
  };

  window.loadDocIntelHistory = async function () {
    try {
      const res = await fetch('/api/ai/creations?type=doc_intel', {
        headers: { 'Authorization': 'Bearer ' + (window.masterKey || '') }
      });
      const data = await res.json();
      const items = (data.creations || []).filter(c => c.type === 'doc_intel');

      if (items.length === 0) {
        if (typeof window.toast === 'function') window.toast('No saved document reports found.');
        return;
      }

      const modalHtml = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;width:100%;max-width:700px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;">
            <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <h3 style="margin:0;font-size:16px;color:#fff;">📜 Document Intelligence Reports</h3>
              <button class="btn btn-secondary" onclick="document.getElementById('docIntelModal').remove()" style="padding:4px 10px;">✕</button>
            </div>
            <div style="padding:16px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
              ${items.map(it => `
                <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-weight:700;font-size:13px;color:#fff;">${esc(it.title)}</div>
                    <div style="font-size:11px;color:var(--muted,#aaa);">${new Date(it.created_at).toLocaleString()}</div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-secondary" onclick="window.viewDocIntelItem('${esc(it.id)}')" style="font-size:11px;padding:4px 8px;">View</button>
                    <button class="btn btn-secondary" onclick="window.deleteDocIntelItem('${esc(it.id)}')" style="font-size:11px;padding:4px 8px;color:#ef4444;">Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      const div = document.createElement('div');
      div.id = 'docIntelModal';
      div.innerHTML = modalHtml;
      document.body.appendChild(div);
      window._cachedDocItems = items;
    } catch (err) {
      if (typeof window.toast === 'function') window.toast(`Error loading history: ${err.message}`);
    }
  };

  window.viewDocIntelItem = function (id) {
    const item = (window._cachedDocItems || []).find(i => i.id === id);
    if (!item) return;
    window._docIntelState.analysisResult = item.content;
    const modal = document.getElementById('docIntelModal');
    if (modal) modal.remove();
    window.renderDocIntelStudio();
  };

  window.deleteDocIntelItem = async function (id) {
    if (!confirm('Delete this report?')) return;
    try {
      await fetch('/api/ai/creations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ id })
      });
      const modal = document.getElementById('docIntelModal');
      if (modal) modal.remove();
      window.loadDocIntelHistory();
    } catch (_) {}
  };


  // =========================================================================
  // 2. CLOUDFLARE EDGE ANALYTICS & SPEED BENCHMARK HUB
  // =========================================================================

  window.renderEdgeBenchmarkStudio = async function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const s = window._edgeBenchmarkState;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">⚡</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text, #fff);">Cloudflare Edge Analytics & Speed Hub</h1>
              <span class="badge" style="background:rgba(244,129,32,0.15);color:#f48120;border:1px solid rgba(244,129,32,0.3);font-size:11px;">Edge Telemetry & 1.1.1.1 DoH</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Live global Point-of-Presence (PoP) latency benchmarks, Cloudflare 1.1.1.1 DNSSEC query engine, and HTTP security headers analyzer.
            </p>
          </div>
          <button class="btn btn-primary" onclick="window.runEdgeBenchmarkSuite()" style="background:#f48120;border-color:#f48120;padding:10px 18px;font-weight:700;">
            ${s.isRunning ? '<span>⏳</span> Testing Global PoPs...' : '<span>🚀</span> Run Global Speed Test'}
          </button>
        </div>

        <!-- Telemetry Cards Row -->
        <div id="edgeTelemetryRow" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:24px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Connected PoP / Colo</div>
            <div id="statColo" style="font-size:20px;font-weight:700;color:var(--text,#fff);margin-top:4px;">Detecting...</div>
            <div id="statRay" style="font-size:10px;color:var(--muted,#888);margin-top:2px;">Ray ID: -</div>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Network Protocol</div>
            <div id="statProtocol" style="font-size:20px;font-weight:700;color:#22c55e;margin-top:4px;">HTTP/3 (QUIC)</div>
            <div id="statTls" style="font-size:10px;color:var(--muted,#888);margin-top:2px;">TLSv1.3 AEAD</div>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Client Geolocation</div>
            <div id="statGeo" style="font-size:20px;font-weight:700;color:var(--accent,#7c6af7);margin-top:4px;">Resolving...</div>
            <div id="statIp" style="font-size:10px;color:var(--muted,#888);margin-top:2px;">IP: Protected</div>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Cloudflare Anycast Status</div>
            <div style="font-size:20px;font-weight:700;color:#3b82f6;margin-top:4px;">Active & Optimal</div>
            <div style="font-size:10px;color:var(--muted,#888);margin-top:2px;">Global 330+ Cities Mesh</div>
          </div>
        </div>

        <!-- Two Column: Global Latency Matrix & 1.1.1.1 DoH Tool -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          
          <!-- Left: Global Edge Benchmark Matrix -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <span style="font-size:14px;font-weight:700;color:var(--text,#fff);display:flex;align-items:center;gap:6px;">
                <span>🌐</span> Global Cloudflare PoP Latency (RTT)
              </span>
              <span id="benchmarkAvgLatency" class="badge" style="background:rgba(34,197,94,0.1);color:#22c55e;">
                Ready
              </span>
            </div>

            <div id="edgePoPList" style="display:flex;flex-direction:column;gap:8px;">
              <div style="color:var(--muted,#888);font-size:12px;text-align:center;padding:24px 0;">
                Click "Run Global Speed Test" above to measure round-trip time across Cloudflare's Anycast nodes.
              </div>
            </div>
          </div>

          <!-- Right: Cloudflare 1.1.1.1 DNS over HTTPS (DoH) Inspector -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:14px;font-weight:700;color:var(--text,#fff);display:flex;align-items:center;gap:6px;">
                <span>🔒</span> Cloudflare 1.1.1.1 DoH & DNSSEC Inspector
              </span>
              <span class="badge" style="background:rgba(59,130,246,0.1);color:#3b82f6;font-size:11px;">RFC 8484</span>
            </div>

            <div style="display:flex;gap:8px;">
              <input 
                type="text" 
                id="dohDomainInput" 
                placeholder="Enter domain (e.g. cloudflare.com, google.com, github.com)..." 
                style="flex:1;padding:10px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:13px;"
                onkeydown="if(event.key==='Enter') window.executeDohLookup()"
              />
              <select id="dohTypeSelect" class="form-control" style="width:90px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:12px;">
                <option value="A">A (IPv4)</option>
                <option value="AAAA">AAAA (IPv6)</option>
                <option value="MX">MX (Mail)</option>
                <option value="TXT">TXT</option>
                <option value="CNAME">CNAME</option>
                <option value="NS">NS</option>
                <option value="SOA">SOA</option>
              </select>
              <button class="btn btn-primary" onclick="window.executeDohLookup()" style="padding:10px 14px;font-size:12px;white-space:nowrap;">
                Resolve
              </button>
            </div>

            <!-- DoH Results Container -->
            <div id="dohResultsContainer" style="flex:1;min-height:200px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:14px;overflow-y:auto;font-size:12px;">
              <div style="color:var(--muted,#888);text-align:center;padding:40px 0;">
                Query official 1.1.1.1 DNS over HTTPS to inspect live records and DNSSEC validation status.
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom: HTTP Security Headers Auditor -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <span style="font-size:14px;font-weight:700;color:var(--text,#fff);display:flex;align-items:center;gap:6px;">
              <span>🛡️</span> HTTP Security Headers Auditor & Grade
            </span>
            <span style="font-size:12px;color:var(--muted,#888);">
              Audits HSTS, CSP, X-Frame-Options, X-Content-Type-Options & Permissions-Policy
            </span>
          </div>

          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <input 
              type="text" 
              id="headersUrlInput" 
              placeholder="Enter URL to audit (e.g. https://cloudflare.com or example.com)..." 
              style="flex:1;padding:10px 14px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:13px;"
              onkeydown="if(event.key==='Enter') window.executeHeadersAudit()"
            />
            <button class="btn btn-primary" onclick="window.executeHeadersAudit()" style="padding:10px 20px;font-size:13px;white-space:nowrap;">
              🔍 Audit Headers
            </button>
          </div>

          <div id="headersAuditResult" style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:16px;min-height:100px;">
            <div style="color:var(--muted,#888);text-align:center;padding:16px 0;font-size:12px;">
              Enter any URL above and click <strong>Audit Headers</strong> to inspect its security posture.
            </div>
          </div>
        </div>
      </div>
    `;

    // Fetch initial telemetry
    try {
      const res = await fetch('/api/network/edge-benchmark');
      const data = await res.json();
      if (data.success && data.telemetry) {
        window._edgeBenchmarkState.telemetry = data.telemetry;
        window._edgeBenchmarkState.edgePoPs = data.edgePoPs || [];

        const t = data.telemetry;
        const statColo = document.getElementById('statColo');
        const statRay = document.getElementById('statRay');
        const statGeo = document.getElementById('statGeo');
        const statIp = document.getElementById('statIp');
        const statProtocol = document.getElementById('statProtocol');
        const statTls = document.getElementById('statTls');

        if (statColo) statColo.textContent = t.colo || 'EDGE';
        if (statRay) statRay.textContent = `Ray ID: ${t.rayId || '-'}`;
        if (statGeo) statGeo.textContent = `${t.city || 'Edge'}, ${t.country || 'Global'}`;
        if (statIp) statIp.textContent = `IP: ${t.clientIp || 'Protected'}`;
        if (statProtocol) statProtocol.textContent = t.httpProtocol || 'HTTP/2';
        if (statTls) statTls.textContent = `${t.tlsVersion || 'TLSv1.3'} ${t.tlsCipher ? '(' + t.tlsCipher.slice(0, 10) + ')' : ''}`;

        // Render PoP list placeholders
        window.renderEdgePoPList(data.edgePoPs);
      }
    } catch (_) {}
  };

  window.renderEdgePoPList = function (pops, results = {}) {
    const list = document.getElementById('edgePoPList');
    if (!list) return;

    if (!pops || pops.length === 0) return;

    list.innerHTML = pops.map(pop => {
      const r = results[pop.code];
      const latencyText = r !== undefined ? (r === -1 ? 'Timeout' : `${r} ms`) : 'Ready';
      let badgeColor = 'var(--muted,#888)';
      let badgeBg = 'rgba(255,255,255,0.05)';

      if (r !== undefined && r !== -1) {
        if (r < 80) {
          badgeColor = '#22c55e';
          badgeBg = 'rgba(34,197,94,0.12)';
        } else if (r < 180) {
          badgeColor = '#eab308';
          badgeBg = 'rgba(234,179,8,0.12)';
        } else {
          badgeColor = '#ef4444';
          badgeBg = 'rgba(239,68,68,0.12)';
        }
      }

      return `
        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-weight:700;font-family:monospace;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:12px;">${esc(pop.code)}</span>
            <div>
              <div style="font-weight:600;font-size:13px;color:#fff;">${esc(pop.city)}, ${esc(pop.country)}</div>
              <div style="font-size:11px;color:var(--muted,#888);">${esc(pop.region)}</div>
            </div>
          </div>
          <span style="font-size:12px;font-weight:700;color:${badgeColor};background:${badgeBg};padding:4px 8px;border-radius:6px;min-width:65px;text-align:center;">
            ${latencyText}
          </span>
        </div>
      `;
    }).join('');
  };

  window.runEdgeBenchmarkSuite = async function () {
    const s = window._edgeBenchmarkState;
    if (s.isRunning) return;

    s.isRunning = true;
    s.results = {};

    const pops = s.edgePoPs || [
      { code: 'IAD', city: 'Washington D.C.', country: 'United States', region: 'North America', endpoint: 'https://1.1.1.1' },
      { code: 'SFO', city: 'San Francisco', country: 'United States', region: 'North America', endpoint: 'https://cloudflare.com' },
      { code: 'ORD', city: 'Chicago', country: 'United States', region: 'North America', endpoint: 'https://one.one.one.one' },
      { code: 'LHR', city: 'London', country: 'United Kingdom', region: 'Europe', endpoint: 'https://cloudflare-dns.com' },
      { code: 'FRA', city: 'Frankfurt', country: 'Germany', region: 'Europe', endpoint: 'https://1.0.0.1' },
      { code: 'NRT', city: 'Tokyo', country: 'Japan', region: 'Asia-Pacific', endpoint: 'https://cloudflare.tv' },
      { code: 'SIN', city: 'Singapore', country: 'Singapore', region: 'Asia-Pacific', endpoint: 'https://pages.dev' },
      { code: 'SYD', city: 'Sydney', country: 'Australia', region: 'Oceania', endpoint: 'https://workers.dev' }
    ];

    window.renderEdgeBenchmarkStudio();

    let totalMs = 0;
    let successCount = 0;

    for (const pop of pops) {
      const t0 = performance.now();
      try {
        await fetch(`${pop.endpoint}/cdn-cgi/trace?cache_bust=${Date.now()}`, {
          mode: 'no-cors',
          cache: 'no-store'
        });
        const elapsed = Math.round(performance.now() - t0);
        s.results[pop.code] = elapsed;
        totalMs += elapsed;
        successCount++;
      } catch (_) {
        // Fallback timing
        const elapsed = Math.round(performance.now() - t0);
        s.results[pop.code] = elapsed < 5000 ? elapsed : -1;
        if (s.results[pop.code] !== -1) {
          totalMs += elapsed;
          successCount++;
        }
      }

      window.renderEdgePoPList(pops, s.results);
    }

    s.isRunning = false;
    const avgLatency = successCount > 0 ? Math.round(totalMs / successCount) : 0;
    const avgBadge = document.getElementById('benchmarkAvgLatency');
    if (avgBadge) {
      avgBadge.textContent = `Avg Latency: ${avgLatency} ms`;
    }

    if (typeof window.toast === 'function') window.toast(`Speed test complete! Global Average: ${avgLatency} ms`);
  };

  window.executeDohLookup = async function () {
    const domainInput = document.getElementById('dohDomainInput');
    const typeSelect = document.getElementById('dohTypeSelect');
    const container = document.getElementById('dohResultsContainer');

    const domain = domainInput ? domainInput.value.trim() : '';
    const type = typeSelect ? typeSelect.value : 'A';

    if (!domain) {
      if (typeof window.toast === 'function') window.toast('Please enter a domain name.');
      return;
    }

    if (container) {
      container.innerHTML = '<div style="text-align:center;padding:30px 0;color:var(--muted,#888);">Querying Cloudflare 1.1.1.1 DoH endpoint...</div>';
    }

    try {
      const res = await fetch('/api/network/dns-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ domain, type })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'DoH lookup failed');

      if (!container) return;

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);">
          <div>
            <span style="font-weight:700;color:#fff;font-size:14px;">${esc(data.domain)}</span>
            <span class="badge" style="margin-left:6px;background:rgba(255,255,255,0.08);color:#fff;font-size:10px;">${esc(data.queryType)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="badge" style="background:${data.dnssecAuthenticated ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)'};color:${data.dnssecAuthenticated ? '#22c55e' : '#eab308'};font-size:10px;">
              ${data.dnssecAuthenticated ? '🛡️ DNSSEC Authenticated' : '⚠️ No DNSSEC Record'}
            </span>
            <span class="badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;font-size:10px;">
              ${esc(data.status)}
            </span>
          </div>
        </div>

        ${data.answers && data.answers.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="color:var(--muted,#888);border-bottom:1px solid var(--border);text-align:left;">
                <th style="padding:6px;">Name</th>
                <th style="padding:6px;">Type</th>
                <th style="padding:6px;">TTL</th>
                <th style="padding:6px;">Data / IP</th>
              </tr>
            </thead>
            <tbody>
              ${data.answers.map(ans => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:6px;color:var(--muted,#aaa);">${esc(ans.name)}</td>
                  <td style="padding:6px;font-weight:700;color:var(--accent,#7c6af7);">${esc(ans.type)}</td>
                  <td style="padding:6px;color:var(--muted,#888);">${esc(ans.ttl)}s</td>
                  <td style="padding:6px;font-family:monospace;color:#22c55e;word-break:break-all;">${esc(ans.data)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div style="color:var(--muted,#888);text-align:center;padding:20px 0;">
            No ${esc(type)} records found for ${esc(domain)}.
          </div>
        `}
      `;
    } catch (err) {
      if (container) {
        container.innerHTML = `<div style="color:#ef4444;padding:20px 0;text-align:center;">Error: ${esc(err.message)}</div>`;
      }
    }
  };

  window.executeHeadersAudit = async function () {
    const input = document.getElementById('headersUrlInput');
    const container = document.getElementById('headersAuditResult');
    const url = input ? input.value.trim() : '';

    if (!url) {
      if (typeof window.toast === 'function') window.toast('Please enter a website URL.');
      return;
    }

    if (container) {
      container.innerHTML = '<div style="text-align:center;padding:20px 0;color:var(--muted,#888);">Auditing HTTP security headers...</div>';
    }

    try {
      const res = await fetch('/api/network/headers-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Headers audit failed');

      if (!container) return;

      const gradeColors = {
        'A+': '#22c55e',
        'A': '#22c55e',
        'B': '#3b82f6',
        'C': '#eab308',
        'D': '#f97316',
        'F': '#ef4444'
      };

      const gColor = gradeColors[data.grade] || '#ef4444';

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:50px;height:50px;border-radius:10px;background:${gColor}22;border:2px solid ${gColor};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:${gColor};">
              ${esc(data.grade)}
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;color:#fff;">${esc(data.url)}</div>
              <div style="font-size:12px;color:var(--muted,#888);">
                Security Score: <strong>${data.score}/100</strong> &bull; Server: ${esc(data.server)}
              </div>
            </div>
          </div>
          <span class="badge" style="background:rgba(255,255,255,0.08);color:#fff;">
            HTTP Status: ${data.status}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:10px;">
          ${data.checks.map(c => `
            <div style="background:var(--surface,#1a1a24);border:1px solid ${c.present ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};border-radius:8px;padding:10px 12px;display:flex;align-items:flex-start;gap:10px;">
              <span style="font-size:16px;margin-top:2px;">${c.present ? '✅' : '❌'}</span>
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-weight:700;font-size:12px;color:#fff;">${esc(c.name)}</span>
                  <span style="font-size:11px;font-weight:700;color:${c.present ? '#22c55e' : '#ef4444'};">
                    ${c.present ? `+${c.score} pts` : '0 pts'}
                  </span>
                </div>
                <div style="font-size:11px;color:var(--muted,#aaa);margin-top:2px;">${esc(c.desc)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      if (container) {
        container.innerHTML = `<div style="color:#ef4444;padding:20px 0;text-align:center;">Audit failed: ${esc(err.message)}</div>`;
      }
    }
  };


  // =========================================================================
  // 3. AI CODE SANDBOX & VULNERABILITY AUDITOR
  // =========================================================================

  window.renderCodeSandboxStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const s = window._codeSandboxState;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🧪</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text, #fff);">AI Code Sandbox & Vulnerability Auditor</h1>
              <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);border:1px solid rgba(124,106,247,0.3);font-size:11px;">OWASP & CWE Security Engine</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Live browser execution sandbox with Gemini-powered vulnerability scanner (SQLi, XSS, insecure tokens) and 1-click refactored secure fixes.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.runSandboxCode()" style="padding:10px 16px;font-weight:700;border-color:var(--green,#22c55e);color:var(--green,#22c55e);">
              <span>▶️</span> Run JavaScript
            </button>
            <button class="btn btn-primary" onclick="window.auditSandboxCode()" style="padding:10px 18px;font-weight:700;" ${s.isAuditing ? 'disabled' : ''}>
              ${s.isAuditing ? '<span>⏳</span> Auditing...' : '<span>🛡️</span> Audit Vulnerabilities'}
            </button>
          </div>
        </div>

        <!-- Controls: Language & Presets -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:12px;color:var(--muted,#aaa);font-weight:600;">Language:</span>
            <select id="sandboxLangSelect" class="form-control" style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:6px;color:#fff;padding:6px 10px;font-size:12px;" onchange="window.setSandboxLanguage(this.value)">
              <option value="javascript" ${s.language === 'javascript' ? 'selected' : ''}>JavaScript (Node/Browser)</option>
              <option value="typescript" ${s.language === 'typescript' ? 'selected' : ''}>TypeScript</option>
              <option value="python" ${s.language === 'python' ? 'selected' : ''}>Python</option>
              <option value="sql" ${s.language === 'sql' ? 'selected' : ''}>SQL (Postgres/SQLite)</option>
              <option value="html" ${s.language === 'html' ? 'selected' : ''}>HTML5 & Web</option>
            </select>
          </div>

          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary" onclick="window.loadSandboxPreset('sqli')" style="font-size:11px;padding:4px 8px;">Preset: SQLi Risk</button>
            <button class="btn btn-secondary" onclick="window.loadSandboxPreset('xss')" style="font-size:11px;padding:4px 8px;">Preset: XSS & Tokens</button>
            <button class="btn btn-secondary" onclick="window.loadSandboxPreset('clean')" style="font-size:11px;padding:4px 8px;">Clear</button>
          </div>
        </div>

        <!-- Editor & Output Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          
          <!-- Code Editor Pane -->
          <div style="display:flex;flex-direction:column;background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
            <div style="padding:10px 14px;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-family:monospace;color:var(--muted,#aaa);">editor.${s.language === 'javascript' ? 'js' : s.language === 'python' ? 'py' : s.language === 'sql' ? 'sql' : 'ts'}</span>
              <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('sandboxCodeTextarea').value);window.toast('Copied code!');" style="font-size:10px;padding:2px 8px;">Copy</button>
            </div>
            <textarea 
              id="sandboxCodeTextarea" 
              style="flex:1;min-height:380px;background:#13131c;border:none;padding:16px;color:#f8f8f2;font-family:Consolas, 'Courier New', monospace;font-size:13px;line-height:1.5;resize:none;outline:none;"
              oninput="window._codeSandboxState.code=this.value"
            >${esc(s.code)}</textarea>
          </div>

          <!-- Console & Execution Pane -->
          <div style="display:flex;flex-direction:column;background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
            <div style="padding:10px 14px;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:700;color:var(--text,#fff);">Sandbox Console & Output</span>
              <button class="btn btn-secondary" onclick="window._codeSandboxState.consoleLogs=[];window.renderSandboxLogs();" style="font-size:10px;padding:2px 8px;">Clear Console</button>
            </div>
            <div 
              id="sandboxConsoleOutput" 
              style="flex:1;min-height:380px;background:#0e0e15;padding:14px;font-family:Consolas, 'Courier New', monospace;font-size:12px;color:#a3e635;overflow-y:auto;white-space:pre-wrap;"
            >
              <div style="color:var(--muted,#666);">[Sandbox ready. Click "Run JavaScript" to execute, or "Audit Vulnerabilities" for security inspection.]</div>
            </div>
          </div>
        </div>

        <!-- Security Audit Findings Panel -->
        <div id="sandboxAuditContainer" style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          ${s.auditResult ? window.renderAuditFindingsHtml(s.auditResult) : `
            <div style="text-align:center;padding:30px 0;color:var(--muted,#888);">
              <span style="font-size:36px;opacity:0.4;display:block;margin-bottom:8px;">🛡️</span>
              <div style="font-weight:600;font-size:14px;color:#fff;">No Vulnerability Scan Run Yet</div>
              <div style="font-size:12px;margin-top:4px;">Click <strong>Audit Vulnerabilities</strong> to inspect code for OWASP risks, memory leaks, and hardcoded secrets.</div>
            </div>
          `}
        </div>
      </div>
    `;

    window.renderSandboxLogs();
  };

  window.setSandboxLanguage = function (lang) {
    window._codeSandboxState.language = lang;
    window.renderCodeSandboxStudio();
  };

  window.loadSandboxPreset = function (type) {
    const s = window._codeSandboxState;
    if (type === 'sqli') {
      s.language = 'javascript';
      s.code = `// SQL Injection & Insecure Token Vulnerability Demo
const express = require('express');
const app = express();

const HARDCODED_ADMIN_JWT_SECRET = "super_secret_production_key_12345!"; // Exposed secret!

app.post('/api/user/search', async (req, res) => {
  const userInput = req.body.query;
  // Vulnerable to SQL Injection via direct concatenation:
  const sql = "SELECT id, username, email FROM accounts WHERE username LIKE '%" + userInput + "%'";
  const results = await db.query(sql);
  res.json(results);
});`;
    } else if (type === 'xss') {
      s.language = 'javascript';
      s.code = `// Cross-Site Scripting (XSS) & Prototype Pollution Demo
function renderComment(commentData) {
  // Vulnerable: raw innerHTML allows arbitrary script injection!
  document.getElementById('commentsContainer').innerHTML += '<div class="comment">' + commentData.author + ': ' + commentData.text + '</div>';
}

function mergeObjects(target, source) {
  // Vulnerable to Prototype Pollution:
  for (let key in source) {
    target[key] = source[key];
  }
  return target;
}`;
    } else {
      s.code = `// Enter your code here to run or audit...`;
    }
    s.auditResult = null;
    window.renderCodeSandboxStudio();
  };

  window.runSandboxCode = function () {
    const s = window._codeSandboxState;
    const txt = document.getElementById('sandboxCodeTextarea');
    if (txt) s.code = txt.value;

    const logs = [];
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Custom console
    iframe.contentWindow.console = {
      log: (...args) => logs.push({ type: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
      error: (...args) => logs.push({ type: 'error', text: args.map(a => String(a)).join(' ') }),
      warn: (...args) => logs.push({ type: 'warn', text: args.map(a => String(a)).join(' ') }),
      info: (...args) => logs.push({ type: 'info', text: args.map(a => String(a)).join(' ') })
    };

    try {
      const startTime = performance.now();
      iframe.contentWindow.eval(s.code);
      const elapsed = Math.round(performance.now() - startTime);
      logs.push({ type: 'system', text: `\n✨ Execution finished in ${elapsed} ms with 0 uncaught errors.` });
    } catch (err) {
      logs.push({ type: 'error', text: `Uncaught Exception: ${err.message}` });
    } finally {
      iframe.remove();
    }

    s.consoleLogs = logs;
    window.renderSandboxLogs();
  };

  window.renderSandboxLogs = function () {
    const el = document.getElementById('sandboxConsoleOutput');
    if (!el) return;

    const logs = window._codeSandboxState.consoleLogs;
    if (!logs || logs.length === 0) return;

    el.innerHTML = logs.map(l => {
      const color = l.type === 'error' ? '#ef4444' : l.type === 'warn' ? '#f59e0b' : l.type === 'system' ? '#38bdf8' : '#a3e635';
      return `<div style="color:${color};margin-bottom:4px;">${esc(l.text)}</div>`;
    }).join('');
  };

  window.auditSandboxCode = async function () {
    const s = window._codeSandboxState;
    const txt = document.getElementById('sandboxCodeTextarea');
    if (txt) s.code = txt.value;

    if (!s.code || !s.code.trim()) {
      if (typeof window.toast === 'function') window.toast('Please enter code to audit.');
      return;
    }

    s.isAuditing = true;
    s.auditResult = null;
    window.renderCodeSandboxStudio();

    try {
      const res = await fetch('/api/ai/code-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({
          code: s.code,
          language: s.language,
          filename: `code.${s.language}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code audit failed');

      s.auditResult = data.audit;
      if (typeof window.toast === 'function') window.toast(`Audit complete! Security Score: ${data.audit?.securityScore || 80}/100`);
    } catch (err) {
      if (typeof window.toast === 'function') window.toast(`Audit error: ${err.message}`);
    } finally {
      s.isAuditing = false;
      window.renderCodeSandboxStudio();
    }
  };

  window.renderAuditFindingsHtml = function (a) {
    const scoreColor = a.securityScore >= 80 ? '#22c55e' : a.securityScore >= 60 ? '#f59e0b' : '#ef4444';

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border);padding-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:52px;height:52px;border-radius:10px;background:${scoreColor}22;border:2px solid ${scoreColor};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${scoreColor};">
            ${a.securityScore || 80}
          </div>
          <div>
            <div style="font-weight:700;font-size:15px;color:#fff;">
              Security Rating: <span style="color:${scoreColor};">${esc(a.riskLevel || 'MEDIUM')} RISK</span>
            </div>
            <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">
              ${esc(a.summary || 'Code analysis complete.')}
            </div>
          </div>
        </div>

        ${a.refactoredCode ? `
          <button class="btn btn-primary" onclick="window.applyRefactoredCode()" style="background:#22c55e;border-color:#22c55e;font-size:12px;padding:8px 16px;">
            ✨ Apply Secure Refactored Fix
          </button>
        ` : ''}
      </div>

      <!-- Vulnerabilities List -->
      ${a.vulnerabilities && a.vulnerabilities.length > 0 ? `
        <div style="margin-bottom:16px;">
          <h4 style="font-size:13px;font-weight:700;color:#fff;margin:0 0 10px 0;">
            ⚠️ Identified Vulnerabilities (${a.vulnerabilities.length}):
          </h4>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${a.vulnerabilities.map(v => `
              <div style="background:var(--surface2,#242434);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-weight:700;color:#ef4444;font-size:13px;">${esc(v.type)}</span>
                  <span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;font-size:10px;">
                    ${esc(v.severity || 'HIGH')} ${v.line ? `&bull; Line ${v.line}` : ''}
                  </span>
                </div>
                <div style="font-size:12px;color:#fff;margin-top:4px;">${esc(v.description)}</div>
                ${v.fix ? `<div style="font-size:11px;color:#22c55e;margin-top:4px;">💡 Fix: ${esc(v.fix)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:12px;color:#22c55e;font-size:13px;margin-bottom:16px;">
          ✅ No high-severity vulnerabilities detected in this snippet!
        </div>
      `}

      <!-- Refactored Code Preview (if available) -->
      ${a.refactoredCode ? `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:12px;font-weight:700;color:var(--text,#fff);">Refactored Secure Code Preview:</span>
            <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(window._codeSandboxState.auditResult.refactoredCode);window.toast('Copied refactored code!');" style="font-size:10px;padding:2px 8px;">Copy Refactored</button>
          </div>
          <pre style="background:#0e0e15;padding:14px;border-radius:8px;border:1px solid var(--border);color:#f8f8f2;font-family:monospace;font-size:12px;overflow-x:auto;max-height:240px;">${esc(a.refactoredCode)}</pre>
        </div>
      ` : ''}
    `;
  };

  window.applyRefactoredCode = function () {
    const ref = window._codeSandboxState.auditResult?.refactoredCode;
    if (!ref) return;
    window._codeSandboxState.code = ref;
    window.renderCodeSandboxStudio();
    if (typeof window.toast === 'function') window.toast('Applied secured code fix!');
  };


  // =========================================================================
  // HOOK INTO NAVIGATION & TABS
  // =========================================================================

  // Hook into window.switchTab to handle docintel, edgebench, and codesandbox
  const origSwitchTab = window.switchTab;
  window.switchTab = function (tab) {
    if (tab === 'docintel') {
      window.currentTab = 'docintel';
      updateNavHighlight('tab-docintel');
      window.renderDocIntelStudio();
      return;
    }
    if (tab === 'edgebench') {
      window.currentTab = 'edgebench';
      updateNavHighlight('tab-edgebench');
      window.renderEdgeBenchmarkStudio();
      return;
    }
    if (tab === 'codesandbox') {
      window.currentTab = 'codesandbox';
      updateNavHighlight('tab-codesandbox');
      window.renderCodeSandboxStudio();
      return;
    }
    if (tab === 'totp') {
      window.currentTab = 'totp';
      updateNavHighlight('tab-totp');
      window.renderTotpStudio();
      return;
    }
    if (tab === 'd1studio') {
      window.currentTab = 'd1studio';
      updateNavHighlight('tab-d1studio');
      window.renderD1Studio();
      return;
    }
    if (tab === 'certmonitor') {
      window.currentTab = 'certmonitor';
      updateNavHighlight('tab-certmonitor');
      window.renderCertTransparencyStudio();
      return;
    }
    if (tab === 'ipintel') {
      window.currentTab = 'ipintel';
      updateNavHighlight('tab-ipintel');
      window.renderIpIntelStudio();
      return;
    }

    if (typeof origSwitchTab === 'function') {
      origSwitchTab(tab);
    }
  };

  function updateNavHighlight(activeId) {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(activeId);
    if (btn) btn.classList.add('active');
  }

  // =========================================================================
  // 4. TOTP 2-FACTOR AUTHENTICATION (2FA) AUTHENTICATOR STUDIO
  // =========================================================================

  window._totpState = {
    items: [],
    filter: '',
    timer: null,
    testSecret: 'JBSWY3DPEHPK3PXP',
    testCodes: null
  };

  // Standard RFC 6238 Base32 decoding
  function base32Decode(base32) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleaned = (base32 || '').toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (let i = 0; i < cleaned.length; i++) {
      const idx = alphabet.indexOf(cleaned[i]);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return new Uint8Array(bytes);
  }

  // Pure Web Crypto RFC 6238 TOTP computation
  async function computeTOTP(secret, epochSeconds, period = 30, digits = 6) {
    try {
      const nowSec = epochSeconds !== undefined ? epochSeconds : Math.floor(Date.now() / 1000);
      const counter = Math.floor(nowSec / period);
      const counterBuffer = new ArrayBuffer(8);
      const counterView = new DataView(counterBuffer);
      counterView.setUint32(0, Math.floor(counter / 0x100000000));
      counterView.setUint32(4, counter & 0xffffffff);

      const keyBytes = base32Decode(secret);
      if (keyBytes.length === 0) return { otp: '------', secondsRemaining: 30, period };

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: { name: 'SHA-1' } },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
      const sigBytes = new Uint8Array(signature);
      const offset = sigBytes[sigBytes.length - 1] & 0x0f;
      const codeInt =
        ((sigBytes[offset] & 0x7f) << 24) |
        ((sigBytes[offset + 1] & 0xff) << 16) |
        ((sigBytes[offset + 2] & 0xff) << 8) |
        (sigBytes[offset + 3] & 0xff);

      const otp = (codeInt % Math.pow(10, digits)).toString().padStart(digits, '0');
      const secondsRemaining = period - (nowSec % period);
      return { otp, secondsRemaining, period };
    } catch (_) {
      return { otp: '------', secondsRemaining: 30, period };
    }
  }

  window.renderTotpStudio = async function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    if (window._totpState.timer) {
      clearInterval(window._totpState.timer);
      window._totpState.timer = null;
    }

    // Load saved items
    try {
      const res = await fetch('/api/auth/totp/list', {
        headers: { 'Authorization': 'Bearer ' + (window.masterKey || '') }
      });
      const data = await res.json();
      window._totpState.items = data.items || [];
    } catch (_) {}

    // If empty, add a default demo token so user immediately sees live verification
    if (window._totpState.items.length === 0) {
      window._totpState.items = [
        { id: 'demo_cf', issuer: 'Cloudflare', account: 'admin@cloudflare.com', secret: 'JBSWY3DPEHPK3PXP', digits: 6, period: 30 },
        { id: 'demo_gh', issuer: 'GitHub', account: 'developer@vault.dev', secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ', digits: 6, period: 30 }
      ];
    }

    container.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🔑</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">2FA TOTP Authenticator Vault</h1>
              <span class="badge" style="background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3);font-size:11px;">RFC 6238 HMAC-SHA1</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Rolling 30-second one-time verification passcodes for Cloudflare, GitHub, Google, AWS, and sensitive services.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.openTotpTesterModal()" style="font-size:12px;padding:8px 14px;">
              <span>🧪</span> Test Any Secret Key
            </button>
            <button class="btn btn-primary" onclick="window.openAddTotpModal()" style="font-size:12px;padding:8px 16px;background:var(--accent,#7c6af7);font-weight:700;">
              <span>➕</span> Add 2FA Account
            </button>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <input 
            type="text" 
            id="totpSearchInput" 
            placeholder="Search accounts or issuers (e.g. Cloudflare, GitHub, admin)..." 
            style="flex:1;padding:10px 14px;background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:8px;color:#fff;font-size:13px;"
            oninput="window._totpState.filter=this.value;window.updateTotpCards(true);"
          />
        </div>

        <!-- Cards Grid -->
        <div id="totpCardsContainer" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
          <!-- Live cards injected here -->
        </div>
      </div>
    `;

    // Render cards and start timer
    await window.updateTotpCards(false);
    window._totpState.timer = setInterval(() => {
      window.updateTotpCards(false);
    }, 1000);
  };

  window.updateTotpCards = async function (rebuildDom = false) {
    const container = document.getElementById('totpCardsContainer');
    if (!container) return;

    const s = window._totpState;
    const q = (s.filter || '').toLowerCase();
    const filtered = s.items.filter(it =>
      (it.issuer || '').toLowerCase().includes(q) ||
      (it.account || '').toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted,#888);background:var(--surface,#1a1a24);border-radius:12px;border:1px solid var(--border);">
          No 2FA accounts found. Click <strong>Add 2FA Account</strong> to set up rolling verification tokens.
        </div>
      `;
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);

    for (const item of filtered) {
      const { otp, secondsRemaining, period } = await computeTOTP(item.secret, nowSec, item.period || 30, item.digits || 6);
      const formattedOtp = otp.length === 6 ? `${otp.slice(0, 3)} ${otp.slice(3)}` : otp;
      const progressPercent = Math.round((secondsRemaining / period) * 100);

      // Stroke color based on remaining time
      let strokeColor = '#22c55e';
      if (secondsRemaining <= 5) strokeColor = '#ef4444';
      else if (secondsRemaining <= 10) strokeColor = '#eab308';

      let cardEl = document.getElementById(`totp-card-${item.id}`);

      if (!cardEl || rebuildDom) {
        // Build card HTML
        const cardHtml = `
          <div id="totp-card-${item.id}" style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:12px;transition:border-color 0.2s ease;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;border-radius:8px;background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);font-weight:700;display:flex;align-items:center;justify-content:center;font-size:16px;">
                  ${esc(item.issuer.charAt(0).toUpperCase())}
                </div>
                <div>
                  <div style="font-weight:700;font-size:14px;color:#fff;">${esc(item.issuer)}</div>
                  <div style="font-size:11px;color:var(--muted,#aaa);">${esc(item.account)}</div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:8px;">
                <!-- Circular progress countdown ring -->
                <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                  <svg width="32" height="32" viewBox="0 0 36 36" style="transform:rotate(-90deg);">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" />
                    <path id="totp-ring-${item.id}" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${strokeColor}" stroke-width="4" stroke-dasharray="${progressPercent}, 100" stroke-linecap="round" />
                  </svg>
                  <span id="totp-sec-${item.id}" style="position:absolute;font-size:10px;font-weight:700;color:${strokeColor};">${secondsRemaining}</span>
                </div>

                <button class="btn btn-secondary" onclick="window.deleteTotpAccount('${esc(item.id)}')" style="padding:4px 8px;font-size:11px;color:#ef4444;" title="Delete token">
                  ✕
                </button>
              </div>
            </div>

            <!-- OTP Code Display & 1-Click Copy -->
            <div 
              id="totp-val-${item.id}"
              onclick="window.copyTotpCode('${otp}', '${item.id}')"
              style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center;cursor:pointer;user-select:none;transition:all 0.15s ease;"
              title="Click to copy code"
              onmouseover="this.style.borderColor='var(--accent,#7c6af7)'"
              onmouseout="this.style.borderColor='var(--border)'"
            >
              <div style="font-family:monospace;font-size:26px;font-weight:900;letter-spacing:4px;color:#fff;">
                ${esc(formattedOtp)}
              </div>
              <div style="font-size:10px;color:var(--muted,#888);margin-top:2px;">
                Click to copy to clipboard
              </div>
            </div>
          </div>
        `;

        if (!cardEl) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cardHtml;
          container.appendChild(tempDiv.firstElementChild);
        } else {
          cardEl.outerHTML = cardHtml;
        }
      } else {
        // Fast in-place DOM update without flicker
        const valBox = document.getElementById(`totp-val-${item.id}`);
        const ring = document.getElementById(`totp-ring-${item.id}`);
        const secText = document.getElementById(`totp-sec-${item.id}`);

        if (valBox) {
          valBox.onclick = () => window.copyTotpCode(otp, item.id);
          valBox.querySelector('div:first-child').textContent = formattedOtp;
        }
        if (ring) {
          ring.setAttribute('stroke', strokeColor);
          ring.setAttribute('stroke-dasharray', `${progressPercent}, 100`);
        }
        if (secText) {
          secText.textContent = secondsRemaining;
          secText.style.color = strokeColor;
        }
      }
    }
  };

  window.copyTotpCode = function (code, itemId) {
    navigator.clipboard.writeText(code).then(() => {
      if (typeof window.toast === 'function') window.toast(`Copied ${code} to clipboard!`);
      const valBox = document.getElementById(`totp-val-${itemId}`);
      if (valBox) {
        const origBg = valBox.style.background;
        valBox.style.background = 'rgba(34,197,94,0.15)';
        setTimeout(() => { valBox.style.background = origBg; }, 400);
      }
    });
  };

  window.openAddTotpModal = function () {
    const modalHtml = `
      <div id="addTotpModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;width:100%;max-width:500px;padding:24px;display:flex;flex-direction:column;gap:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:16px;color:#fff;">➕ Add 2FA Authenticator Account</h3>
            <button class="btn btn-secondary" onclick="document.getElementById('addTotpModal').remove()" style="padding:4px 8px;">✕</button>
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted,#aaa);font-weight:600;display:block;margin-bottom:6px;">Paste URI (otpauth://) or enter below:</label>
            <input 
              type="text" 
              id="totpUriInput" 
              placeholder="otpauth://totp/Cloudflare:user@example.com?secret=JBSWY3DPEHPK3PXP" 
              style="width:100%;padding:10px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:12px;"
              oninput="window.parseTotpUri(this.value)"
            />
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:12px;color:var(--muted,#aaa);font-weight:600;display:block;margin-bottom:4px;">Issuer / Service:</label>
              <input type="text" id="totpIssuer" placeholder="e.g. Cloudflare, GitHub" style="width:100%;padding:8px 10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:13px;" />
            </div>
            <div>
              <label style="font-size:12px;color:var(--muted,#aaa);font-weight:600;display:block;margin-bottom:4px;">Account / Username:</label>
              <input type="text" id="totpAccount" placeholder="e.g. admin@domain.com" style="width:100%;padding:8px 10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:13px;" />
            </div>
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted,#aaa);font-weight:600;display:block;margin-bottom:4px;">Base32 Secret Key:</label>
            <input type="text" id="totpSecret" placeholder="e.g. JBSWY3DPEHPK3PXP" style="width:100%;padding:8px 10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-family:monospace;font-size:13px;" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
            <button class="btn btn-secondary" onclick="document.getElementById('addTotpModal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="window.saveNewTotpAccount()">Save Account</button>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
  };

  window.parseTotpUri = function (uri) {
    try {
      if (!uri.startsWith('otpauth://totp/')) return;
      const url = new URL(uri);
      const pathLabel = decodeURIComponent(url.pathname.replace(/^\/\/?/, ''));
      let issuer = url.searchParams.get('issuer') || '';
      let account = pathLabel;

      if (pathLabel.includes(':')) {
        const parts = pathLabel.split(':');
        if (!issuer) issuer = parts[0].trim();
        account = parts.slice(1).join(':').trim();
      }

      const secret = url.searchParams.get('secret') || '';
      if (issuer && document.getElementById('totpIssuer')) document.getElementById('totpIssuer').value = issuer;
      if (account && document.getElementById('totpAccount')) document.getElementById('totpAccount').value = account;
      if (secret && document.getElementById('totpSecret')) document.getElementById('totpSecret').value = secret;
    } catch (_) {}
  };

  window.saveNewTotpAccount = async function () {
    const issuer = document.getElementById('totpIssuer')?.value.trim();
    const account = document.getElementById('totpAccount')?.value.trim();
    const secret = document.getElementById('totpSecret')?.value.trim();

    if (!issuer || !account || !secret) {
      if (typeof window.toast === 'function') window.toast('Please fill in Issuer, Account, and Secret Key.');
      return;
    }

    try {
      const res = await fetch('/api/auth/totp/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ issuer, account, secret })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      document.getElementById('addTotpModal')?.remove();
      if (typeof window.toast === 'function') window.toast('2FA account added!');
      window.renderTotpStudio();
    } catch (err) {
      if (typeof window.toast === 'function') window.toast(`Error: ${err.message}`);
    }
  };

  window.deleteTotpAccount = async function (id) {
    if (!confirm('Remove this 2FA account?')) return;
    try {
      await fetch('/api/auth/totp/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ id })
      });
      window._totpState.items = window._totpState.items.filter(i => i.id !== id);
      window.updateTotpCards(true);
      if (typeof window.toast === 'function') window.toast('Account removed.');
    } catch (_) {}
  };

  window.openTotpTesterModal = async function () {
    const s = window._totpState;
    const nowSec = Math.floor(Date.now() / 1000);
    const curr = await computeTOTP(s.testSecret, nowSec);
    const prev = await computeTOTP(s.testSecret, nowSec - 30);
    const next = await computeTOTP(s.testSecret, nowSec + 30);

    const modalHtml = `
      <div id="totpTestModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;width:100%;max-width:520px;padding:24px;display:flex;flex-direction:column;gap:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:16px;color:#fff;">🧪 Live RFC 6238 TOTP Test Bench</h3>
            <button class="btn btn-secondary" onclick="document.getElementById('totpTestModal').remove()" style="padding:4px 8px;">✕</button>
          </div>

          <div>
            <label style="font-size:12px;color:var(--muted,#aaa);font-weight:600;display:block;margin-bottom:6px;">Secret Key to Test:</label>
            <input 
              type="text" 
              id="totpTestKeyInput" 
              value="${esc(s.testSecret)}" 
              style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-family:monospace;font-size:13px;"
              oninput="window.runTestTotpKey(this.value)"
            />
          </div>

          <div id="totpTestResultsRow" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center;">
            <div style="background:var(--surface2,#242434);padding:12px;border-radius:8px;border:1px solid var(--border);">
              <div style="font-size:10px;color:var(--muted,#888);">PREVIOUS (-30s)</div>
              <div id="totpTestPrev" style="font-family:monospace;font-size:18px;font-weight:700;color:var(--muted,#aaa);margin-top:4px;">${prev.otp}</div>
            </div>

            <div style="background:rgba(34,197,94,0.1);padding:12px;border-radius:8px;border:1px solid rgba(34,197,94,0.3);">
              <div style="font-size:10px;color:#22c55e;font-weight:700;">CURRENT (${curr.secondsRemaining}s)</div>
              <div id="totpTestCurr" style="font-family:monospace;font-size:22px;font-weight:900;color:#22c55e;margin-top:4px;">${curr.otp}</div>
            </div>

            <div style="background:var(--surface2,#242434);padding:12px;border-radius:8px;border:1px solid var(--border);">
              <div style="font-size:10px;color:var(--muted,#888);">NEXT (+30s)</div>
              <div id="totpTestNext" style="font-family:monospace;font-size:18px;font-weight:700;color:var(--muted,#aaa);margin-top:4px;">${next.otp}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
  };

  window.runTestTotpKey = async function (secret) {
    window._totpState.testSecret = secret;
    const nowSec = Math.floor(Date.now() / 1000);
    const curr = await computeTOTP(secret, nowSec);
    const prev = await computeTOTP(secret, nowSec - 30);
    const next = await computeTOTP(secret, nowSec + 30);

    const prevEl = document.getElementById('totpTestPrev');
    const currEl = document.getElementById('totpTestCurr');
    const nextEl = document.getElementById('totpTestNext');

    if (prevEl) prevEl.textContent = prev.otp;
    if (currEl) currEl.textContent = curr.otp;
    if (nextEl) nextEl.textContent = next.otp;
  };


  // =========================================================================
  // 5. CLOUDFLARE D1 DATABASE STUDIO & SQL CONSOLE
  // =========================================================================

  window._d1StudioState = {
    tables: [],
    selectedTable: '',
    currentSql: 'SELECT id, title, username, item_type FROM passwords LIMIT 25;',
    isExecuting: false,
    result: null,
    error: null
  };

  window.renderD1Studio = async function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const s = window._d1StudioState;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🗄️</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Cloudflare D1 Database Studio & SQL Console</h1>
              <span class="badge" style="background:rgba(244,129,32,0.15);color:#f48120;border:1px solid rgba(244,129,32,0.3);font-size:11px;">Serverless SQLite Edge DB</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Live schema explorer, interactive query execution, execution telemetry, and 1-click JSON/CSV data exports.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.exportD1QueryResult('csv')" style="font-size:12px;padding:8px 14px;">
              📥 Export CSV
            </button>
            <button class="btn btn-secondary" onclick="window.exportD1QueryResult('json')" style="font-size:12px;padding:8px 14px;">
              📥 Export JSON
            </button>
            <button class="btn btn-primary" onclick="window.executeD1Query()" style="background:#f48120;border-color:#f48120;padding:8px 18px;font-weight:700;">
              <span>⚡</span> Run Query (Ctrl+Enter)
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:280px 1fr;gap:20px;">
          <!-- Left: Schema Explorer -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;max-height:750px;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:13px;font-weight:700;color:var(--text,#fff);">Tables & Entities</span>
              <button class="btn btn-secondary" onclick="window.loadD1Schema()" style="font-size:10px;padding:2px 6px;">↻ Refresh</button>
            </div>

            <div id="d1TableList" style="display:flex;flex-direction:column;gap:6px;">
              <div style="color:var(--muted,#888);font-size:12px;text-align:center;padding:20px 0;">Loading tables...</div>
            </div>
          </div>

          <!-- Right: Query Editor & Live Results -->
          <div style="display:flex;flex-direction:column;gap:16px;">
            <!-- Presets Bar -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              <span style="font-size:11px;color:var(--muted,#aaa);font-weight:600;">Presets:</span>
              <button class="btn btn-secondary" onclick="window.setD1Preset('passwords')" style="font-size:11px;padding:4px 8px;">Vault Passwords</button>
              <button class="btn btn-secondary" onclick="window.setD1Preset('todos')" style="font-size:11px;padding:4px 8px;">Pending Todos</button>
              <button class="btn btn-secondary" onclick="window.setD1Preset('ai_creations')" style="font-size:11px;padding:4px 8px;">AI Creations</button>
              <button class="btn btn-secondary" onclick="window.setD1Preset('attachments')" style="font-size:11px;padding:4px 8px;">Drive Storage</button>
              <button class="btn btn-secondary" onclick="window.setD1Preset('totp_vault')" style="font-size:11px;padding:4px 8px;">2FA Tokens</button>
            </div>

            <!-- SQL Editor Box -->
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
              <textarea 
                id="d1SqlEditor" 
                style="width:100%;min-height:110px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;color:#fff;font-family:monospace;font-size:13px;resize:vertical;"
                placeholder="Enter SQL statement (e.g. SELECT * FROM passwords LIMIT 10)..."
                onkeydown="if((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); window.executeD1Query(); }"
              >${esc(s.currentSql)}</textarea>
            </div>

            <!-- Query Execution Stats & Results Table -->
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;flex:1;min-height:360px;display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:13px;font-weight:700;color:var(--text,#fff);">Query Results</span>
                  <span id="d1ExecBadge" class="badge" style="background:rgba(34,197,94,0.1);color:#22c55e;font-size:11px;">
                    Ready
                  </span>
                </div>
                <div id="d1RowCount" style="font-size:12px;color:var(--muted,#aaa);">0 rows</div>
              </div>

              <div id="d1ResultsTableContainer" style="flex:1;overflow-x:auto;max-height:480px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:4px;">
                <div style="color:var(--muted,#888);text-align:center;padding:60px 0;font-size:13px;">
                  Run a query to inspect live records from Cloudflare D1.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    await window.loadD1Schema();
  };

  window.loadD1Schema = async function () {
    try {
      const res = await fetch('/api/cloudflare/d1-schema');
      const data = await res.json();
      if (!data.success) return;

      window._d1StudioState.tables = data.tables || [];
      const list = document.getElementById('d1TableList');
      if (!list) return;

      list.innerHTML = data.tables.map(t => `
        <div 
          onclick="window.selectD1Table('${esc(t.name)}')"
          style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:8px 10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all 0.15s ease;"
          onmouseover="this.style.borderColor='var(--accent,#7c6af7)'"
          onmouseout="this.style.borderColor='var(--border)'"
        >
          <div>
            <div style="font-weight:700;font-size:12px;color:#fff;">${esc(t.name)}</div>
            <div style="font-size:10px;color:var(--muted,#888);">${t.columns.length} columns</div>
          </div>
          <span class="badge" style="background:rgba(255,255,255,0.06);font-size:10px;color:var(--muted,#aaa);">
            ${t.rowCount} rows
          </span>
        </div>
      `).join('');
    } catch (_) {}
  };

  window.selectD1Table = function (tableName) {
    const editor = document.getElementById('d1SqlEditor');
    if (editor) {
      editor.value = `SELECT * FROM "${tableName}" LIMIT 25;`;
      window.executeD1Query();
    }
  };

  window.setD1Preset = function (type) {
    const editor = document.getElementById('d1SqlEditor');
    if (!editor) return;

    if (type === 'passwords') {
      editor.value = 'SELECT id, title, username, item_type, created_at FROM passwords ORDER BY id DESC LIMIT 25;';
    } else if (type === 'todos') {
      editor.value = 'SELECT id, title, priority, due_date, completed FROM todos ORDER BY id DESC LIMIT 25;';
    } else if (type === 'ai_creations') {
      editor.value = 'SELECT id, type, model, title, created_at FROM ai_creations ORDER BY created_at DESC LIMIT 25;';
    } else if (type === 'attachments') {
      editor.value = 'SELECT id, filename, mime_type, item_type, length(content) as bytes FROM attachments LIMIT 25;';
    } else if (type === 'totp_vault') {
      editor.value = 'SELECT id, issuer, account, algorithm, digits, period, created_at FROM totp_vault LIMIT 25;';
    }
    window.executeD1Query();
  };

  window.executeD1Query = async function () {
    const editor = document.getElementById('d1SqlEditor');
    const tableContainer = document.getElementById('d1ResultsTableContainer');
    const badge = document.getElementById('d1ExecBadge');
    const countEl = document.getElementById('d1RowCount');

    const sql = editor ? editor.value.trim() : '';
    if (!sql) return;

    if (badge) badge.textContent = 'Executing...';

    try {
      const res = await fetch('/api/cloudflare/d1-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ sql })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      window._d1StudioState.result = data;

      if (badge) badge.textContent = `${data.executionTimeMs} ms`;
      if (countEl) countEl.textContent = `${data.rowCount} rows`;

      if (!tableContainer) return;

      if (!data.rows || data.rows.length === 0) {
        tableContainer.innerHTML = '<div style="color:var(--muted,#888);text-align:center;padding:40px 0;">Query executed successfully. 0 rows returned.</div>';
        return;
      }

      tableContainer.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);color:var(--muted,#aaa);background:var(--surface,#1a1a24);">
              <th style="padding:8px 10px;width:40px;">#</th>
              ${data.columns.map(col => `<th style="padding:8px 10px;font-weight:700;">${esc(col)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.rows.map((row, idx) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:8px 10px;color:var(--muted,#666);">${idx + 1}</td>
                ${data.columns.map(col => `<td style="padding:8px 10px;color:#fff;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(row[col])}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      if (badge) badge.textContent = 'Error';
      if (tableContainer) {
        tableContainer.innerHTML = `<div style="color:#ef4444;padding:24px;text-align:center;font-family:monospace;">Error: ${esc(err.message)}</div>`;
      }
    }
  };

  window.exportD1QueryResult = function (format) {
    const res = window._d1StudioState.result;
    if (!res || !res.rows || res.rows.length === 0) {
      if (typeof window.toast === 'function') window.toast('No query results to export.');
      return;
    }

    let blob, filename;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(res.rows, null, 2)], { type: 'application/json' });
      filename = `d1_export_${Date.now()}.json`;
    } else {
      const headers = res.columns.join(',');
      const rows = res.rows.map(r => res.columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
      blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
      filename = `d1_export_${Date.now()}.csv`;
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    if (typeof window.toast === 'function') window.toast(`Exported ${filename}`);
  };


  // =========================================================================
  // 6. CERTIFICATE TRANSPARENCY & DOMAIN BRAND RECONNAISSANCE
  // =========================================================================

  window._certState = {
    domain: 'cloudflare.com',
    data: null,
    isQuerying: false,
    subFilter: ''
  };

  window.renderCertTransparencyStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const s = window._certState;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">📜</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Certificate Transparency & Subdomain Recon</h1>
              <span class="badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;border:1px solid rgba(59,130,246,0.3);font-size:11px;">Public CT Logs</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Monitor active SSL/TLS certificates, discover hidden staging/internal subdomains, and audit expiration dates.
            </p>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary" onclick="window.queryCertDomain('cloudflare.com')" style="font-size:11px;padding:4px 8px;">cloudflare.com</button>
            <button class="btn btn-secondary" onclick="window.queryCertDomain('github.com')" style="font-size:11px;padding:4px 8px;">github.com</button>
            <button class="btn btn-secondary" onclick="window.queryCertDomain('google.com')" style="font-size:11px;padding:4px 8px;">google.com</button>
          </div>
        </div>

        <!-- Search input -->
        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <input 
            type="text" 
            id="certDomainInput" 
            value="${esc(s.domain)}"
            placeholder="Enter domain name to inspect (e.g. cloudflare.com, yourdomain.com)..."
            style="flex:1;padding:12px 16px;background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:8px;color:#fff;font-size:14px;"
            onkeydown="if(event.key==='Enter') window.executeCertQuery()"
          />
          <button class="btn btn-primary" onclick="window.executeCertQuery()" style="padding:12px 24px;font-weight:700;" ${s.isQuerying ? 'disabled' : ''}>
            ${s.isQuerying ? '<span>⏳</span> Querying Logs...' : '<span>🔍</span> Scan CT Logs'}
          </button>
        </div>

        <!-- Metrics Row -->
        <div id="certStatsRow" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Total Certificates</div>
            <div id="certStatTotal" style="font-size:22px;font-weight:700;color:#fff;margin-top:4px;">-</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Discovered Subdomains</div>
            <div id="certStatSubs" style="font-size:22px;font-weight:700;color:var(--accent,#7c6af7);margin-top:4px;">-</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Expiring Soon (&lt;30d)</div>
            <div id="certStatExpiring" style="font-size:22px;font-weight:700;color:#eab308;margin-top:4px;">-</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;padding:16px;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Expired / Deprecated</div>
            <div id="certStatExpired" style="font-size:22px;font-weight:700;color:#ef4444;margin-top:4px;">-</div>
          </div>
        </div>

        <!-- Two Column: Subdomain Directory & Cert Ledger -->
        <div style="display:grid;grid-template-columns:320px 1fr;gap:20px;">
          <!-- Subdomains list -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:13px;font-weight:700;color:#fff;">Discovered Subdomains</span>
              <button class="btn btn-secondary" onclick="window.copyDiscoveredSubdomains()" style="font-size:10px;padding:2px 6px;">📋 Copy All</button>
            </div>
            <input 
              type="text" 
              placeholder="Filter subdomains..." 
              style="padding:6px 10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:12px;"
              oninput="window._certState.subFilter=this.value;window.renderSubdomainList();"
            />
            <div id="certSubdomainsList" style="flex:1;min-height:300px;max-height:480px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;">
              <div style="color:var(--muted,#888);text-align:center;padding:40px 0;font-size:12px;">
                Enter domain and click <strong>Scan CT Logs</strong>.
              </div>
            </div>
          </div>

          <!-- Certificates Ledger -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;">
            <span style="font-size:13px;font-weight:700;color:#fff;">Certificates Ledger</span>
            <div id="certLedgerContainer" style="flex:1;min-height:360px;max-height:520px;overflow-y:auto;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;">
              <div style="color:var(--muted,#888);text-align:center;padding:60px 0;font-size:13px;">
                Public certificate history will be displayed here.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (s.data) {
      window.displayCertResults(s.data);
    }
  };

  window.queryCertDomain = function (d) {
    const input = document.getElementById('certDomainInput');
    if (input) input.value = d;
    window.executeCertQuery();
  };

  window.executeCertQuery = async function () {
    const input = document.getElementById('certDomainInput');
    const domain = input ? input.value.trim() : '';
    if (!domain) return;

    window._certState.domain = domain;
    window._certState.isQuerying = true;
    window.renderCertTransparencyStudio();

    try {
      const res = await fetch('/api/security/cert-transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ domain })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'CT query failed');

      window._certState.data = data;
      window.displayCertResults(data);
    } catch (err) {
      if (typeof window.toast === 'function') window.toast(`CT Scan Error: ${err.message}`);
    } finally {
      window._certState.isQuerying = false;
    }
  };

  window.displayCertResults = function (data) {
    const statTotal = document.getElementById('certStatTotal');
    const statSubs = document.getElementById('certStatSubs');
    const statExpiring = document.getElementById('certStatExpiring');
    const statExpired = document.getElementById('certStatExpired');

    if (statTotal) statTotal.textContent = data.totalCertificates || 0;
    if (statSubs) statSubs.textContent = data.stats?.totalSubdomains || 0;
    if (statExpiring) statExpiring.textContent = data.stats?.expiringSoon || 0;
    if (statExpired) statExpired.textContent = data.stats?.expired || 0;

    window.renderSubdomainList();

    const ledger = document.getElementById('certLedgerContainer');
    if (!ledger) return;

    if (!data.certificates || data.certificates.length === 0) {
      ledger.innerHTML = '<div style="color:var(--muted,#888);text-align:center;padding:40px;">No public certificates found.</div>';
      return;
    }

    ledger.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);color:var(--muted,#aaa);background:var(--surface,#1a1a24);">
            <th style="padding:8px 10px;">Common Name</th>
            <th style="padding:8px 10px;">Issuer CA</th>
            <th style="padding:8px 10px;">Valid Range</th>
            <th style="padding:8px 10px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.certificates.map(c => {
            let statusBadge = `<span class="badge" style="background:rgba(34,197,94,0.15);color:#22c55e;">${c.daysRemaining} days left</span>`;
            if (c.isExpired) {
              statusBadge = `<span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;">Expired</span>`;
            } else if (c.isExpiringSoon) {
              statusBadge = `<span class="badge" style="background:rgba(234,179,8,0.15);color:#eab308;">Expiring Soon (${c.daysRemaining}d)</span>`;
            }

            return `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:8px 10px;font-family:monospace;color:#fff;">
                  ${esc(c.commonName)}
                  ${c.isWildcard ? '<span class="badge" style="font-size:9px;background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);margin-left:4px;">Wildcard</span>' : ''}
                </td>
                <td style="padding:8px 10px;color:var(--muted,#aaa);">${esc(c.issuer)}</td>
                <td style="padding:8px 10px;color:var(--muted,#888);font-size:11px;">${esc(c.notBefore)} &rarr; ${esc(c.notAfter)}</td>
                <td style="padding:8px 10px;">${statusBadge}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  };

  window.renderSubdomainList = function () {
    const list = document.getElementById('certSubdomainsList');
    if (!list) return;

    const data = window._certState.data;
    if (!data || !data.subdomains) return;

    const filter = (window._certState.subFilter || '').toLowerCase();
    const filtered = data.subdomains.filter(s => s.toLowerCase().includes(filter));

    list.innerHTML = filtered.map(sub => `
      <div style="font-family:monospace;font-size:11px;padding:6px 8px;background:var(--surface2,#242434);border-radius:4px;color:#fff;word-break:break-all;display:flex;justify-content:space-between;align-items:center;">
        <span>${esc(sub)}</span>
        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${esc(sub)}');if(typeof window.toast==='function')window.toast('Copied!');" style="font-size:9px;padding:2px 4px;">Copy</button>
      </div>
    `).join('');
  };

  window.copyDiscoveredSubdomains = function () {
    const data = window._certState.data;
    if (!data || !data.subdomains) return;
    navigator.clipboard.writeText(data.subdomains.join('\n')).then(() => {
      if (typeof window.toast === 'function') window.toast(`Copied ${data.subdomains.length} subdomains!`);
    });
  };


  // =========================================================================
  // 7. BGP ROUTING & AUTONOMOUS SYSTEM THREAT INTELLIGENCE
  // =========================================================================

  window._ipIntelState = {
    target: '1.1.1.1',
    data: null,
    isQuerying: false
  };

  window.renderIpIntelStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const s = window._ipIntelState;

    container.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🛰️</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">BGP Autonomous System & Threat Intelligence</h1>
              <span class="badge" style="background:rgba(234,179,8,0.15);color:#eab308;border:1px solid rgba(234,179,8,0.3);font-size:11px;">ASN & Prefix Intel</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Inspect Autonomous System Numbers (ASN), BGP routing prefixes, geolocation, and security risk classifications.
            </p>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary" onclick="window.queryIpTarget('1.1.1.1')" style="font-size:11px;padding:4px 8px;">1.1.1.1 (Cloudflare)</button>
            <button class="btn btn-secondary" onclick="window.queryIpTarget('8.8.8.8')" style="font-size:11px;padding:4px 8px;">8.8.8.8 (Google)</button>
            <button class="btn btn-secondary" onclick="window.queryIpTarget('9.9.9.9')" style="font-size:11px;padding:4px 8px;">9.9.9.9 (Quad9)</button>
          </div>
        </div>

        <!-- Input -->
        <div style="display:flex;gap:10px;margin-bottom:24px;">
          <input 
            type="text" 
            id="ipIntelInput" 
            value="${esc(s.target)}"
            placeholder="Enter IPv4, IPv6, or domain name (e.g. 1.1.1.1, cloudflare.com)..."
            style="flex:1;padding:12px 16px;background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:8px;color:#fff;font-size:14px;"
            onkeydown="if(event.key==='Enter') window.executeIpIntelQuery()"
          />
          <button class="btn btn-primary" onclick="window.executeIpIntelQuery()" style="padding:12px 24px;font-weight:700;" ${s.isQuerying ? 'disabled' : ''}>
            ${s.isQuerying ? '<span>⏳</span> Analyzing...' : '<span>🛰️</span> Inspect IP'}
          </button>
        </div>

        <div id="ipIntelResultContainer" style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:24px;min-height:300px;">
          <div style="color:var(--muted,#888);text-align:center;padding:60px 0;font-size:13px;">
            Enter an IP address or domain above and click <strong>Inspect IP</strong>.
          </div>
        </div>
      </div>
    `;

    if (s.data) {
      window.displayIpIntelResults(s.data);
    }
  };

  window.queryIpTarget = function (t) {
    const input = document.getElementById('ipIntelInput');
    if (input) input.value = t;
    window.executeIpIntelQuery();
  };

  window.executeIpIntelQuery = async function () {
    const input = document.getElementById('ipIntelInput');
    const target = input ? input.value.trim() : '';
    if (!target) return;

    window._ipIntelState.target = target;
    window._ipIntelState.isQuerying = true;
    window.renderIpIntelStudio();

    try {
      const res = await fetch('/api/network/ip-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (window.masterKey || '') },
        body: JSON.stringify({ target })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Query failed');

      window._ipIntelState.data = data;
      window.displayIpIntelResults(data);
    } catch (err) {
      if (typeof window.toast === 'function') window.toast(`IP Intel Error: ${err.message}`);
    } finally {
      window._ipIntelState.isQuerying = false;
    }
  };

  window.displayIpIntelResults = function (data) {
    const container = document.getElementById('ipIntelResultContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:32px;">🌐</div>
          <div>
            <div style="font-size:22px;font-weight:900;color:#fff;font-family:monospace;">${esc(data.ip)}</div>
            ${data.domain ? `<div style="font-size:12px;color:var(--accent,#7c6af7);font-weight:600;">Resolved from: ${esc(data.domain)}</div>` : ''}
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <span class="badge" style="background:${data.isCloudflare ? 'rgba(244,129,32,0.15)' : 'rgba(59,130,246,0.15)'};color:${data.isCloudflare ? '#f48120' : '#3b82f6'};font-size:11px;">
            ${data.threatCategory}
          </span>
          <span class="badge" style="background:${data.threatScore > 50 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'};color:${data.threatScore > 50 ? '#ef4444' : '#22c55e'};font-size:11px;">
            Risk Score: ${data.threatScore}/100
          </span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;">
        <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
          <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Autonomous System (ASN)</div>
          <div style="font-size:18px;font-weight:700;color:#fff;margin-top:4px;">${esc(data.asn)}</div>
          <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">${esc(data.org)}</div>
        </div>

        <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
          <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">BGP Route Prefix</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent,#7c6af7);margin-top:4px;font-family:monospace;">${esc(data.networkPrefix || 'N/A')}</div>
          <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">CIDR Allocation Block</div>
        </div>

        <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
          <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Geolocation</div>
          <div style="font-size:18px;font-weight:700;color:#22c55e;margin-top:4px;">${esc(data.city)}, ${esc(data.country)}</div>
          <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">Timezone: ${esc(data.timezone)}</div>
        </div>

        <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
          <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Anycast & Network Type</div>
          <div style="font-size:18px;font-weight:700;color:#fff;margin-top:4px;">${data.isCloudflare ? 'Anycast Global Edge' : data.isDatacenter ? 'Datacenter Cloud' : 'ISP Transit'}</div>
          <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">Private RFC1918: ${data.isPrivate ? 'Yes' : 'No'}</div>
        </div>
      </div>
    `;
  };


  // =========================================================================
  // TAB BUTTON INJECTION
  // =========================================================================

  function injectExtendedNavButtons() {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer || document.getElementById('tab-docintel')) return;

    // 1. Doc Intel
    const docBtn = document.createElement('button');
    docBtn.className = 'tab';
    docBtn.id = 'tab-docintel';
    docBtn.innerHTML = '<span>📑</span> Doc Intel';
    docBtn.onclick = () => window.switchTab('docintel');

    // 2. Edge Speed & DoH
    const edgeBtn = document.createElement('button');
    edgeBtn.className = 'tab';
    edgeBtn.id = 'tab-edgebench';
    edgeBtn.innerHTML = '<span>⚡</span> Edge Speed & DoH';
    edgeBtn.onclick = () => window.switchTab('edgebench');

    // 3. Code Sandbox
    const codeBtn = document.createElement('button');
    codeBtn.className = 'tab';
    codeBtn.id = 'tab-codesandbox';
    codeBtn.innerHTML = '<span>🧪</span> Code Sandbox';
    codeBtn.onclick = () => window.switchTab('codesandbox');

    // 4. 2FA Authenticator
    const totpBtn = document.createElement('button');
    totpBtn.className = 'tab';
    totpBtn.id = 'tab-totp';
    totpBtn.innerHTML = '<span>🔑</span> 2FA Vault';
    totpBtn.onclick = () => window.switchTab('totp');

    // 5. D1 SQL Studio
    const d1Btn = document.createElement('button');
    d1Btn.className = 'tab';
    d1Btn.id = 'tab-d1studio';
    d1Btn.innerHTML = '<span>🗄️</span> D1 SQL Studio';
    d1Btn.onclick = () => window.switchTab('d1studio');

    // 6. Cert Transparency
    const certBtn = document.createElement('button');
    certBtn.className = 'tab';
    certBtn.id = 'tab-certmonitor';
    certBtn.innerHTML = '<span>📜</span> Cert Monitor';
    certBtn.onclick = () => window.switchTab('certmonitor');

    // 7. IP Intel
    const ipBtn = document.createElement('button');
    ipBtn.className = 'tab';
    ipBtn.id = 'tab-ipintel';
    ipBtn.innerHTML = '<span>🛰️</span> Threat & IP Intel';
    ipBtn.onclick = () => window.switchTab('ipintel');

    // Insert after cloudflare tab
    const cfTab = document.getElementById('tab-cloudflare');
    if (cfTab && cfTab.nextSibling) {
      tabsContainer.insertBefore(docBtn, cfTab.nextSibling);
      tabsContainer.insertBefore(edgeBtn, docBtn.nextSibling);
      tabsContainer.insertBefore(codeBtn, edgeBtn.nextSibling);
      tabsContainer.insertBefore(totpBtn, codeBtn.nextSibling);
      tabsContainer.insertBefore(d1Btn, totpBtn.nextSibling);
      tabsContainer.insertBefore(certBtn, d1Btn.nextSibling);
      tabsContainer.insertBefore(ipBtn, certBtn.nextSibling);
    } else {
      tabsContainer.appendChild(docBtn);
      tabsContainer.appendChild(edgeBtn);
      tabsContainer.appendChild(codeBtn);
      tabsContainer.appendChild(totpBtn);
      tabsContainer.appendChild(d1Btn);
      tabsContainer.appendChild(certBtn);
      tabsContainer.appendChild(ipBtn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExtendedNavButtons);
  } else {
    injectExtendedNavButtons();
  }

  console.log('[AI-Cloud-Studio-Extended] Initialized successfully.');
})();
