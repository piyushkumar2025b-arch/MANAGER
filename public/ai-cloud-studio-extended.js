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
    if (tab === 'semanticsearch') {
      window.currentTab = 'semanticsearch';
      updateNavHighlight('tab-semanticsearch');
      window.renderSemanticSearchStudio();
      return;
    }
    if (tab === 'wafsim') {
      window.currentTab = 'wafsim';
      updateNavHighlight('tab-wafsim');
      window.renderWafSimulatorStudio();
      return;
    }
    if (tab === 'webhooks') {
      window.currentTab = 'webhooks';
      updateNavHighlight('tab-webhooks');
      window.renderWebhookDispatcherStudio();
      return;
    }
    if (tab === 'tlsinspect') {
      window.currentTab = 'tlsinspect';
      updateNavHighlight('tab-tlsinspect');
      window.renderTlsInspectorStudio();
      return;
    }
    if (tab === 'secstudio') {
      window.currentTab = 'secstudio';
      updateNavHighlight('tab-secstudio');
      window.renderSecurityHeadersStudio();
      return;
    }
    if (tab === 'cronstudio') {
      window.currentTab = 'cronstudio';
      updateNavHighlight('tab-cronstudio');
      window.renderCronTriggerStudio();
      return;
    }
    if (tab === 'kvstudio') {
      window.currentTab = 'kvstudio';
      updateNavHighlight('tab-kvstudio');
      window.renderKvStudio();
      return;
    }
    if (tab === 'keygen') {
      window.currentTab = 'keygen';
      updateNavHighlight('tab-keygen');
      window.renderKeyGenStudio();
      return;
    }
    if (tab === 'dohbench') {
      window.currentTab = 'dohbench';
      updateNavHighlight('tab-dohbench');
      window.renderDohBenchmarkStudio();
      return;
    }
    if (tab === 'ratelimit') {
      window.currentTab = 'ratelimit';
      updateNavHighlight('tab-ratelimit');
      window.renderRateLimitingStudio();
      return;
    }
    if (tab === 'cachestudio') {
      window.currentTab = 'cachestudio';
      updateNavHighlight('tab-cachestudio');
      window.renderCachePurgeStudio();
      return;
    }
    if (tab === 'wirefilter') {
      window.currentTab = 'wirefilter';
      updateNavHighlight('tab-wirefilter');
      window.renderWirefilterStudio();
      return;
    }
    if (tab === 'jwtstudio') {
      window.currentTab = 'jwtstudio';
      updateNavHighlight('tab-jwtstudio');
      window.renderJwtStudio();
      return;
    }
    if (tab === 'transformrules') {
      window.currentTab = 'transformrules';
      updateNavHighlight('tab-transformrules');
      window.renderTransformStudio();
      return;
    }
    if (tab === 'cidrcalc') {
      window.currentTab = 'cidrcalc';
      updateNavHighlight('tab-cidrcalc');
      window.renderCidrStudio();
      return;
    }
    if (tab === 'sectxt') {
      window.currentTab = 'sectxt';
      updateNavHighlight('tab-sectxt');
      window.renderSecurityTxtStudio();
      return;
    }
    if (tab === 'emailsec') {
      window.currentTab = 'emailsec';
      updateNavHighlight('tab-emailsec');
      window.renderEmailSecStudio();
      return;
    }
    if (tab === 'zerotrust') {
      window.currentTab = 'zerotrust';
      updateNavHighlight('tab-zerotrust');
      window.renderZeroTrustStudio();
      return;
    }
    if (tab === 'httpprobe') {
      window.currentTab = 'httpprobe';
      updateNavHighlight('tab-httpprobe');
      window.renderHttpProbeStudio();
      return;
    }
    if (tab === 'regexbench') {
      window.currentTab = 'regexbench';
      updateNavHighlight('tab-regexbench');
      window.renderRegexBenchStudio();
      return;
    }
    if (tab === 'errorpages') {
      window.currentTab = 'errorpages';
      updateNavHighlight('tab-errorpages');
      window.renderErrorPagesStudio();
      return;
    }
    if (tab === 'corsaudit') {
      window.currentTab = 'corsaudit';
      updateNavHighlight('tab-corsaudit');
      window.renderCorsAuditorStudio();
      return;
    }
    if (tab === 'cachetags') {
      window.currentTab = 'cachetags';
      updateNavHighlight('tab-cachetags');
      window.renderCacheTagsStudio();
      return;
    }
    if (tab === 'bgproute') {
      window.currentTab = 'bgproute';
      updateNavHighlight('tab-bgproute');
      window.renderBgpRouteStudio();
      return;
    }
    if (tab === 'queuesdlq') {
      window.currentTab = 'queuesdlq';
      updateNavHighlight('tab-queuesdlq');
      window.renderQueuesDlqStudio();
      return;
    }
    if (tab === 'cookiehardener') {
      window.currentTab = 'cookiehardener';
      updateNavHighlight('tab-cookiehardener');
      window.renderCookieHardenerStudio();
      return;
    }
    if (tab === 'canarysplit') {
      window.currentTab = 'canarysplit';
      updateNavHighlight('tab-canarysplit');
      window.renderCanarySplitterStudio();
      return;
    }
    if (tab === 'srilocker') {
      window.currentTab = 'srilocker';
      updateNavHighlight('tab-srilocker');
      window.renderSriLockerStudio();
      return;
    }
    if (tab === 'websockets') {
      window.currentTab = 'websockets';
      updateNavHighlight('tab-websockets');
      window.renderEdgeWebSocketsStudio();
      return;
    }
    if (tab === 'botanalyzer') {
      window.currentTab = 'botanalyzer';
      updateNavHighlight('tab-botanalyzer');
      window.renderBotAnalyzerStudio();
      return;
    }
    if (tab === 'openapigateway') {
      window.currentTab = 'openapigateway';
      updateNavHighlight('tab-openapigateway');
      window.renderOpenApiGatewayStudio();
      return;
    }
    if (tab === 'imageresize') {
      window.currentTab = 'imageresize';
      updateNavHighlight('tab-imageresize');
      window.renderImageResizerStudio();
      return;
    }
    if (tab === 'featureflags') {
      window.currentTab = 'featureflags';
      updateNavHighlight('tab-featureflags');
      window.renderFeatureFlagsStudio();
      return;
    }
    if (tab === 'mtls') {
      window.currentTab = 'mtls';
      updateNavHighlight('tab-mtls');
      window.renderMtlsArchitectStudio();
      return;
    }
    if (tab === 'earlyhints') {
      window.currentTab = 'earlyhints';
      updateNavHighlight('tab-earlyhints');
      window.renderEarlyHintsStudio();
      return;
    }
    if (tab === 'ssemultiplex') {
      window.currentTab = 'ssemultiplex';
      updateNavHighlight('tab-ssemultiplex');
      window.renderSseMultiplexerStudio();
      return;
    }
    if (tab === 'graphqlshield') {
      window.currentTab = 'graphqlshield';
      updateNavHighlight('tab-graphqlshield');
      window.renderGraphqlShieldStudio();
      return;
    }
    if (tab === 'hlsrewriter') {
      window.currentTab = 'hlsrewriter';
      updateNavHighlight('tab-hlsrewriter');
      window.renderHlsRewriterStudio();
      return;
    }
    if (tab === 'logpush') {
      window.currentTab = 'logpush';
      updateNavHighlight('tab-logpush');
      window.renderLogpushStudio();
      return;
    }
    if (tab === 'typesgen') {
      window.currentTab = 'typesgen';
      updateNavHighlight('tab-typesgen');
      window.renderTypesGenStudio();
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
  // 8. AI SEMANTIC VECTOR MEMORY & RAG SEARCH STUDIO
  // =========================================================================
  window.renderSemanticSearchStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🧠</span> AI Semantic Vector Memory & RAG Search
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Natural language retrieval across Passwords, Notes, Cards, Todos, and AI Assets with contextual intent scoring.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.switchTab('vault')">
              <span>🔒</span> Back to Vault
            </button>
          </div>
        </div>

        <!-- Search Bar with Glow -->
        <div style="background:linear-gradient(135deg, rgba(124,106,247,0.15), rgba(56,189,248,0.1));border:1px solid rgba(124,106,247,0.4);border-radius:16px;padding:24px;margin-bottom:24px;box-shadow:0 8px 30px rgba(0,0,0,0.25);">
          <div style="display:flex;gap:12px;">
            <input type="text" id="semanticSearchInput" placeholder="Ask anything, e.g., 'What is my cloud server login?' or 'Find my database tasks'..." 
              style="flex:1;padding:14px 18px;font-size:16px;background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:10px;color:#fff;outline:none;"
              onkeydown="if(event.key==='Enter') window.executeSemanticSearch();" />
            <button class="btn btn-primary" onclick="window.executeSemanticSearch()" style="padding:0 24px;font-size:15px;display:flex;align-items:center;gap:8px;">
              <span>🔍</span> Search Vault
            </button>
          </div>

          <!-- Quick Suggestion Chips -->
          <div style="display:flex;align-items:center;gap:8px;margin-top:14px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Try suggestions:</span>
            <button class="badge" style="cursor:pointer;background:rgba(255,255,255,0.08);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:20px;"
              onclick="document.getElementById('semanticSearchInput').value='Cloudflare & edge server logins';window.executeSemanticSearch();">
              Cloudflare & edge logins
            </button>
            <button class="badge" style="cursor:pointer;background:rgba(255,255,255,0.08);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:20px;"
              onclick="document.getElementById('semanticSearchInput').value='Security audits and passwords';window.executeSemanticSearch();">
              Security audits & passwords
            </button>
            <button class="badge" style="cursor:pointer;background:rgba(255,255,255,0.08);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:20px;"
              onclick="document.getElementById('semanticSearchInput').value='Pending infrastructure tasks';window.executeSemanticSearch();">
              Pending tasks
            </button>
            <button class="badge" style="cursor:pointer;background:rgba(255,255,255,0.08);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:20px;"
              onclick="document.getElementById('semanticSearchInput').value='AI generated stories and code';window.executeSemanticSearch();">
              AI creations
            </button>
          </div>
        </div>

        <!-- Results Container -->
        <div id="semanticResultsContainer">
          <div style="background:var(--surface,#1a1a24);border:1px dashed var(--border);border-radius:12px;padding:48px 24px;text-align:center;color:var(--muted,#888);">
            <div style="font-size:40px;margin-bottom:12px;">💡</div>
            <div style="font-size:16px;font-weight:600;color:#fff;">Semantic Memory Ready</div>
            <div style="font-size:13px;margin-top:4px;">Enter a query above to semantically search and rank your encrypted vault items.</div>
          </div>
        </div>
      </div>
    `;
  };

  window.executeSemanticSearch = async function() {
    const input = document.getElementById('semanticSearchInput');
    const query = input ? input.value.trim() : '';
    if (!query) return;

    const container = document.getElementById('semanticResultsContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Searching Vault Entities via Semantic Vector Intent...</div>
        <div style="font-size:13px;color:var(--muted,#888);margin-top:6px;">Analyzing Passwords, Todos, and AI Creations</div>
      </div>
    `;

    try {
      const res = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search vault');
      }

      let matchesHtml = '';
      if (!data.matches || data.matches.length === 0) {
        matchesHtml = `
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
            No matching items found for "${esc(query)}". Try broadening your search terms.
          </div>
        `;
      } else {
        matchesHtml = `
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
            ${data.matches.map(item => {
              const typeIcon = item.type === 'password' ? '🔑' : item.type === 'todo' ? '✅' : '🎨';
              const confColor = item.confidence >= 90 ? '#22c55e' : item.confidence >= 75 ? '#7c6af7' : '#eab308';
              return `
                <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.15s ease;"
                     onmouseenter="this.style.borderColor='var(--accent,#7c6af7)'" onmouseleave="this.style.borderColor='var(--border)'">
                  <div>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                      <span style="font-size:12px;font-weight:700;color:${confColor};background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:6px;border:1px solid ${confColor}40;">
                        ${item.confidence}% Match
                      </span>
                      <span style="font-size:11px;text-transform:uppercase;color:var(--muted,#888);background:var(--surface2,#242434);padding:2px 8px;border-radius:4px;">
                        ${typeIcon} ${esc(item.badge || item.type)}
                      </span>
                    </div>

                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;">
                      ${esc(item.title)}
                    </div>
                    <div style="font-size:13px;color:var(--muted,#aaa);line-height:1.4;margin-bottom:12px;">
                      ${esc(item.snippet || 'No description')}
                    </div>
                  </div>

                  <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;align-items:center;justify-content:space-between;">
                    <div style="font-size:11px;color:var(--accent,#7c6af7);">
                      💡 ${esc(item.relevanceReason || 'Semantic match')}
                    </div>
                    <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;" onclick="window.switchTab('${item.type === 'todo' ? 'todos' : item.type === 'creation' ? 'studio' : 'vault'}')">
                      View
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      container.innerHTML = `
        <!-- AI Summary Banner -->
        ${data.summary ? `
          <div style="background:rgba(124,106,247,0.1);border:1px solid rgba(124,106,247,0.3);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;gap:14px;align-items:flex-start;">
            <span style="font-size:24px;">✨</span>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--accent,#7c6af7);letter-spacing:0.5px;">AI Intent & Summary</div>
              <div style="font-size:14px;color:#eee;margin-top:4px;line-height:1.5;">${esc(data.summary)}</div>
            </div>
            <div style="font-size:12px;color:var(--muted,#888);white-space:nowrap;">
              ${data.totalMatches} item(s) found
            </div>
          </div>
        ` : ''}

        ${matchesHtml}
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="background:rgba(239,68,68,0.1);border:1px solid #ef4444;border-radius:12px;padding:24px;text-align:center;color:#ef4444;">
          Error during semantic retrieval: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 9. CLOUDFLARE WAF & EDGE FIREWALL RULE SIMULATOR
  // =========================================================================
  window.renderWafSimulatorStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🛡️</span> Cloudflare WAF & Edge Firewall Simulator
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Simulate edge traffic against Cloudflare Managed Rulesets, OWASP CRS (SQLi, XSS, Path Traversal), Bot Scores, and Wirefilter expressions.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('cloudflare')">
            <span>☁️</span> Cloudflare Hub
          </button>
        </div>

        <!-- Presets Bar -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Attack Presets:</span>
          <button class="badge" style="cursor:pointer;background:#ef444420;border:1px solid #ef444450;color:#ef4444;padding:4px 10px;border-radius:6px;"
            onclick="window.setWafPreset('sqli')">
            🚨 SQL Injection Attack
          </button>
          <button class="badge" style="cursor:pointer;background:#f9731620;border:1px solid #f9731650;color:#f97316;padding:4px 10px;border-radius:6px;"
            onclick="window.setWafPreset('xss')">
            🚨 XSS Script Probe
          </button>
          <button class="badge" style="cursor:pointer;background:#a855f720;border:1px solid #a855f750;color:#a855f7;padding:4px 10px;border-radius:6px;"
            onclick="window.setWafPreset('traversal')">
            🚨 Path Traversal LFI
          </button>
          <button class="badge" style="cursor:pointer;background:#eab30820;border:1px solid #eab30850;color:#eab308;padding:4px 10px;border-radius:6px;"
            onclick="window.setWafPreset('bot')">
            ⚠️ Automated Scanner Bot
          </button>
          <button class="badge" style="cursor:pointer;background:#22c55e20;border:1px solid #22c55e50;color:#22c55e;padding:4px 10px;border-radius:6px;"
            onclick="window.setWafPreset('clean')">
            ✅ Legitimate Traffic
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Request Simulator Form -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;display:flex;align-items:center;gap:8px;">
              <span>🌐</span> Simulated HTTP Request
            </h2>

            <div style="display:grid;grid-template-columns:100px 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Method</label>
                <select id="wafMethod" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;">
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">URI Path & Query</label>
                <input type="text" id="wafUri" value="/api/login?user=admin' OR 1=1--" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-family:monospace;font-size:13px;" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Client IP</label>
                <input type="text" id="wafIp" value="198.51.100.42" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-family:monospace;font-size:13px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Country Code</label>
                <input type="text" id="wafCountry" value="US" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-family:monospace;font-size:13px;" />
              </div>
            </div>

            <div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;">
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Threat Score (0 - 100)</label>
                <span id="wafThreatScoreVal" style="font-size:12px;font-weight:700;color:var(--accent,#7c6af7);">45</span>
              </div>
              <input type="range" id="wafThreatScore" min="0" max="100" value="45" style="width:100%;margin-top:6px;"
                oninput="document.getElementById('wafThreatScoreVal').innerText = this.value;" />
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">User-Agent</label>
              <input type="text" id="wafUserAgent" value="Mozilla/5.0 (Windows NT 10.0; Win64; x64)" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-size:12px;" />
            </div>

            <div style="margin-bottom:16px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Body Payload (JSON or Form)</label>
              <textarea id="wafBodyPayload" rows="3" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-family:monospace;font-size:12px;resize:vertical;"></textarea>
            </div>

            <button class="btn btn-primary" onclick="window.runWafEvaluation()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Run WAF Edge Evaluation
            </button>
          </div>

          <!-- Right: Evaluation & Decision Console -->
          <div id="wafResultContainer" style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:var(--muted,#888);padding:40px 20px;">
              <div style="font-size:42px;margin-bottom:12px;">🛡️</div>
              <div style="font-size:16px;font-weight:700;color:#fff;">WAF Simulation Ready</div>
              <div style="font-size:13px;margin-top:6px;max-width:300px;">Select an attack preset or configure a custom HTTP request to evaluate edge filtering.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  window.setWafPreset = function(type) {
    const uri = document.getElementById('wafUri');
    const ua = document.getElementById('wafUserAgent');
    const threat = document.getElementById('wafThreatScore');
    const threatVal = document.getElementById('wafThreatScoreVal');
    const payload = document.getElementById('wafBodyPayload');

    if (type === 'sqli') {
      uri.value = "/api/login?user=admin' OR 1=1--";
      ua.value = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      threat.value = 45;
      payload.value = '{"username":"admin\' OR \'1\'=\'1","password":"test"}';
    } else if (type === 'xss') {
      uri.value = "/profile?name=<script>alert(document.cookie)</script>";
      ua.value = 'Mozilla/5.0 (X11; Linux x86_64)';
      threat.value = 35;
      payload.value = '<img src=x onerror=alert("hacked")>';
    } else if (type === 'traversal') {
      uri.value = "/download?file=../../../../etc/passwd";
      ua.value = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
      threat.value = 55;
      payload.value = '';
    } else if (type === 'bot') {
      uri.value = "/admin/users";
      ua.value = 'sqlmap/1.4.11#stable (http://sqlmap.org)';
      threat.value = 85;
      payload.value = '';
    } else if (type === 'clean') {
      uri.value = "/dashboard/overview";
      ua.value = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
      threat.value = 5;
      payload.value = '{"filter":"all"}';
    }
    if (threatVal) threatVal.innerText = threat.value;
    window.runWafEvaluation();
  };

  window.runWafEvaluation = async function() {
    const container = document.getElementById('wafResultContainer');
    if (!container) return;

    const uri = document.getElementById('wafUri').value;
    const httpMethod = document.getElementById('wafMethod').value;
    const ip = document.getElementById('wafIp').value;
    const country = document.getElementById('wafCountry').value;
    const threatScore = Number(document.getElementById('wafThreatScore').value);
    const userAgent = document.getElementById('wafUserAgent').value;
    const bodyPayload = document.getElementById('wafBodyPayload').value;

    container.innerHTML = `
      <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px;">
        <div class="spinner" style="margin-bottom:12px;"></div>
        <div style="font-size:14px;color:#fff;">Evaluating Edge Security Rulesets...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/waf-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, httpMethod, ip, country, threatScore, userAgent, bodyPayload })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Evaluation failed');

      const isBlock = data.action === 'BLOCK';
      const isChallenge = data.action === 'MANAGED_CHALLENGE';
      const badgeBg = isBlock ? '#ef4444' : isChallenge ? '#eab308' : '#22c55e';
      const badgeText = isBlock ? 'BLOCKED (403 Forbidden)' : isChallenge ? 'MANAGED CHALLENGE' : 'ALLOWED (200 OK)';
      const shieldIcon = isBlock ? '🚫' : isChallenge ? '🧩' : '✅';

      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <h2 style="font-size:16px;font-weight:700;margin:0;">Edge Decision & Telemetry</h2>
          <span style="font-size:11px;color:var(--muted,#888);font-family:monospace;">${new Date().toLocaleTimeString()}</span>
        </div>

        <!-- Big Decision Card -->
        <div style="background:${badgeBg}15;border:1px solid ${badgeBg}50;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
          <div style="font-size:36px;margin-bottom:6px;">${shieldIcon}</div>
          <div style="font-size:20px;font-weight:800;color:${badgeBg};">${badgeText}</div>
          <div style="font-size:13px;color:#bbb;margin-top:4px;">
            Simulated HTTP Status: <span style="font-weight:700;color:#fff;">${data.simulatedHttpStatus}</span> | Risk Score: <span style="font-weight:700;color:${badgeBg};">${data.riskScore}/100</span>
          </div>
        </div>

        <!-- Triggered Rules -->
        <div style="margin-bottom:20px;">
          <div style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:8px;">
            Triggered Rules (${data.triggeredRules.length})
          </div>
          ${data.triggeredRules.length === 0 ? `
            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:13px;color:#22c55e;">
              ✓ No malicious payload signatures detected in request.
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${data.triggeredRules.map(r => `
                <div style="background:var(--surface2,#242434);border-left:4px solid ${r.severity === 'CRITICAL' ? '#ef4444' : '#eab308'};border-radius:6px;padding:10px 12px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;font-weight:700;color:#fff;">${esc(r.name)}</span>
                    <span style="font-size:10px;font-weight:700;color:#ef4444;background:#ef444420;padding:2px 6px;border-radius:4px;">${r.severity}</span>
                  </div>
                  <div style="font-size:11px;color:var(--muted,#aaa);font-family:monospace;margin-top:4px;">
                    Rule ID: ${esc(r.ruleId)} | Matched: "${esc(r.matchedString)}"
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Wirefilter Expression Generator -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Cloudflare Wirefilter Expression</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
              onclick="navigator.clipboard.writeText('${esc(data.wirefilterExpression)}');this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
              Copy
            </button>
          </div>
          <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:12px;margin:0;overflow-x:auto;white-space:pre-wrap;">${esc(data.wirefilterExpression)}</pre>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Evaluation Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 10. EDGE WEBHOOK & EVENT DISPATCHER STUDIO
  // =========================================================================
  window.renderWebhookDispatcherStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>📡</span> Edge Webhook & Event Dispatcher
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Dispatch HTTP webhooks with cryptographic HMAC-SHA256 signature headers, retry telemetry, and real-time response inspection.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('toolbox')">
            <span>🛠️</span> Toolbox
          </button>
        </div>

        <!-- Presets -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Format Presets:</span>
          <button class="badge" style="cursor:pointer;background:#5865F220;border:1px solid #5865F260;color:#5865F2;padding:4px 10px;border-radius:6px;"
            onclick="window.setWebhookPreset('discord')">
            Discord Rich Embed
          </button>
          <button class="badge" style="cursor:pointer;background:#4A154B30;border:1px solid #E01E5A60;color:#36C5F0;padding:4px 10px;border-radius:6px;"
            onclick="window.setWebhookPreset('slack')">
            Slack Block Kit
          </button>
          <button class="badge" style="cursor:pointer;background:#F3802020;border:1px solid #F3802060;color:#F38020;padding:4px 10px;border-radius:6px;"
            onclick="window.setWebhookPreset('cloudflare')">
            Cloudflare Worker Event
          </button>
          <button class="badge" style="cursor:pointer;background:#22c55e20;border:1px solid #22c55e60;color:#22c55e;padding:4px 10px;border-radius:6px;"
            onclick="window.setWebhookPreset('httpbin')">
            HTTPBin Echo Test
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Request Builder -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;display:flex;align-items:center;gap:8px;">
              <span>📤</span> Webhook Payload Builder
            </h2>

            <div style="display:grid;grid-template-columns:100px 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Method</label>
                <select id="whMethod" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;">
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Endpoint URL</label>
                <input type="text" id="whUrl" value="https://httpbin.org/post" placeholder="https://..." style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-family:monospace;font-size:13px;" />
              </div>
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">HMAC-SHA256 Secret Key (Optional)</label>
              <input type="password" id="whSecret" placeholder="e.g. whsec_secret_key_123" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-family:monospace;font-size:13px;" />
              <div style="font-size:11px;color:var(--muted,#888);margin-top:4px;">Generates X-Signature-SHA256 and X-Hub-Signature-256 headers</div>
            </div>

            <div style="margin-bottom:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">JSON Payload</label>
                <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                  onclick="try{const el=document.getElementById('whPayload');el.value=JSON.stringify(JSON.parse(el.value),null,2);}catch(_){}">
                  Format JSON
                </button>
              </div>
              <textarea id="whPayload" rows="7" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;font-family:monospace;font-size:12px;resize:vertical;">{
  "event": "vault.credential.created",
  "timestamp": "${new Date().toISOString()}",
  "vaultId": "cf-vault-01",
  "data": {
    "action": "security_audit",
    "status": "success"
  }
}</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.sendEdgeWebhook()" style="width:100%;padding:12px;font-weight:700;">
              <span>🚀</span> Dispatch Webhook
            </button>
          </div>

          <!-- Inspector Console -->
          <div id="whResultContainer" style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:var(--muted,#888);padding:40px 20px;">
              <div style="font-size:42px;margin-bottom:12px;">📡</div>
              <div style="font-size:16px;font-weight:700;color:#fff;">Webhook Console Idle</div>
              <div style="font-size:13px;margin-top:6px;max-width:300px;">Dispatch an outgoing webhook to inspect response status code, latency, signature headers, and response payload.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  window.setWebhookPreset = function(type) {
    const url = document.getElementById('whUrl');
    const payload = document.getElementById('whPayload');
    const secret = document.getElementById('whSecret');

    if (type === 'discord') {
      url.value = 'https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN';
      secret.value = '';
      payload.value = JSON.stringify({
        content: "🚨 Vault Security Event Notification",
        embeds: [{
          title: "Audit Alert Triggered",
          description: "A high-entropy credential was successfully rotated in Cloudflare Vault.",
          color: 8153847,
          fields: [
            { name: "Environment", value: "Production Cloudflare Edge", inline: true },
            { name: "Severity", value: "Normal", inline: true }
          ]
        }]
      }, null, 2);
    } else if (type === 'slack') {
      url.value = 'https://hooks.slack.com/services/YOUR/KEY';
      secret.value = '';
      payload.value = JSON.stringify({
        text: "Cloudflare Vault Notification",
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: "*New Backup Snapshot Created*\nCloudflare D1 database snapshot completed." }
        }]
      }, null, 2);
    } else if (type === 'cloudflare') {
      url.value = 'https://my-worker.example.workers.dev/webhook';
      secret.value = 'cf_secret_998811';
      payload.value = JSON.stringify({
        source: "cloudflare-vault",
        action: "edge_sync",
        timestamp: Date.now()
      }, null, 2);
    } else if (type === 'httpbin') {
      url.value = 'https://httpbin.org/post';
      secret.value = 'hmac_test_key';
      payload.value = JSON.stringify({
        message: "Hello from Cloudflare Vault Webhook Dispatcher",
        status: "ok",
        rand: Math.random()
      }, null, 2);
    }
  };

  window.sendEdgeWebhook = async function() {
    const container = document.getElementById('whResultContainer');
    if (!container) return;

    const url = document.getElementById('whUrl').value.trim();
    const httpMethod = document.getElementById('whMethod').value;
    const secretKey = document.getElementById('whSecret').value.trim();
    const rawPayload = document.getElementById('whPayload').value;

    let parsedPayload = rawPayload;
    try { parsedPayload = JSON.parse(rawPayload); } catch (_) {}

    container.innerHTML = `
      <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px;">
        <div class="spinner" style="margin-bottom:12px;"></div>
        <div style="font-size:14px;color:#fff;">Dispatching Webhook from Edge...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/webhooks/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, httpMethod, payload: parsedPayload, secretKey })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to dispatch webhook');

      const is2xx = data.status >= 200 && data.status < 300;
      const statusColor = is2xx ? '#22c55e' : '#ef4444';

      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <h2 style="font-size:16px;font-weight:700;margin:0;">Delivery Inspection</h2>
          <span style="font-size:11px;color:var(--muted,#888);">${data.latencyMs} ms</span>
        </div>

        <!-- Status Card -->
        <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">HTTP Status</div>
            <div style="font-size:20px;font-weight:800;color:${statusColor};">${data.status} ${esc(data.statusText || '')}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Roundtrip Latency</div>
            <div style="font-size:18px;font-weight:700;color:var(--accent,#7c6af7);">${data.latencyMs} ms</div>
          </div>
        </div>

        <!-- Signature info -->
        ${data.signatureGenerated ? `
          <div style="background:rgba(124,106,247,0.1);border:1px solid rgba(124,106,247,0.3);border-radius:8px;padding:10px 12px;margin-bottom:14px;">
            <div style="font-size:11px;font-weight:700;color:var(--accent,#7c6af7);text-transform:uppercase;">HMAC-SHA256 Signature Generated</div>
            <div style="font-size:12px;font-family:monospace;color:#fff;word-break:break-all;margin-top:2px;">${esc(data.signature)}</div>
          </div>
        ` : ''}

        <!-- Response Body Preview -->
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:6px;">Response Body Snippet</div>
          <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:#ddd;font-family:monospace;font-size:12px;margin:0;max-height:220px;overflow-y:auto;white-space:pre-wrap;">${esc(data.responseBodySnippet || '(Empty response body)')}</pre>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Dispatch Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 11. SSL/TLS CIPHER SUITE & HANDSHAKE INSPECTOR STUDIO
  // =========================================================================
  window.renderTlsInspectorStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🔒</span> SSL/TLS Cipher Suite & Handshake Inspector
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Analyze real-time TLS handshake negotiation, cipher suites, HTTP/3 ALPN, and HSTS security parameters across any web domain.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('certmonitor')">
            <span>📜</span> Cert Monitor
          </button>
        </div>

        <!-- Input Bar -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:flex;gap:12px;">
            <input type="text" id="tlsTargetInput" value="cloudflare.com" placeholder="e.g. cloudflare.com, github.com"
              style="flex:1;padding:12px 16px;font-size:15px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;"
              onkeydown="if(event.key==='Enter') window.inspectTlsHandshake();" />
            <button class="btn btn-primary" onclick="window.inspectTlsHandshake()" style="padding:0 24px;">
              <span>⚡</span> Inspect Handshake
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Quick test domains:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('tlsTargetInput').value='cloudflare.com';window.inspectTlsHandshake();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('tlsTargetInput').value='github.com';window.inspectTlsHandshake();">github.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('tlsTargetInput').value='google.com';window.inspectTlsHandshake();">google.com</button>
          </div>
        </div>

        <div id="tlsResultContainer">
          <div style="background:var(--surface,#1a1a24);border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--muted,#888);">
            <div style="font-size:40px;margin-bottom:12px;">🔒</div>
            <div style="font-size:16px;font-weight:700;color:#fff;">TLS Inspector Ready</div>
            <div style="font-size:13px;margin-top:4px;">Enter a domain above to perform a live TLS handshake analysis.</div>
          </div>
        </div>
      </div>
    `;
  };

  window.inspectTlsHandshake = async function() {
    const input = document.getElementById('tlsTargetInput');
    const domain = input ? input.value.trim() : 'cloudflare.com';
    const container = document.getElementById('tlsResultContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Negotiating TLS Handshake with ${esc(domain)}...</div>
        <div style="font-size:13px;color:var(--muted,#888);margin-top:6px;">Inspecting cipher suites, ALPN protocols, and HSTS headers</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/tls-inspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to inspect TLS');

      container.innerHTML = `
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:16px;">
            <div>
              <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Handshake Target</div>
              <div style="font-size:22px;font-weight:800;color:#fff;font-family:monospace;">${esc(data.domain)}</div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:12px;font-weight:700;color:#22c55e;background:#22c55e20;padding:4px 10px;border-radius:20px;border:1px solid #22c55e50;">
                ✓ A+ TLS Grade
              </span>
              <div style="font-size:12px;color:var(--muted,#888);margin-top:4px;">${data.latencyMs} ms</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;">
            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Protocol Version</div>
              <div style="font-size:17px;font-weight:700;color:#fff;margin-top:4px;">${esc(data.tlsVersion)}</div>
              <div style="font-size:12px;color:#22c55e;margin-top:2px;">Zero Round-Trip Time (0-RTT) Ready</div>
            </div>

            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Negotiated Cipher Suite</div>
              <div style="font-size:15px;font-weight:700;color:var(--accent,#7c6af7);margin-top:4px;font-family:monospace;word-break:break-all;">${esc(data.cipherSuite)}</div>
              <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">AEAD Authenticated Encryption</div>
            </div>

            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Key Exchange (KEX)</div>
              <div style="font-size:16px;font-weight:700;color:#fff;margin-top:4px;">${esc(data.keyExchange)}</div>
              <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">Elliptic Curve Diffie-Hellman</div>
            </div>

            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">ALPN Protocol</div>
              <div style="font-size:16px;font-weight:700;color:#38bdf8;margin-top:4px;">${esc(data.protocol)}</div>
              <div style="font-size:12px;color:var(--muted,#aaa);margin-top:2px;">Supported: ${esc(data.alpn.join(', '))}</div>
            </div>

            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">HSTS Security Header</div>
              <div style="font-size:16px;font-weight:700;color:${data.hsts.enabled ? '#22c55e' : '#ef4444'};margin-top:4px;">
                ${data.hsts.enabled ? 'Enabled' : 'Disabled'}
              </div>
              <div style="font-size:11px;color:var(--muted,#aaa);font-family:monospace;margin-top:2px;word-break:break-all;">${esc(data.hsts.raw || 'None')}</div>
            </div>

            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:10px;padding:16px;">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Server Signature & SNI</div>
              <div style="font-size:16px;font-weight:700;color:#fff;margin-top:4px;">${esc(data.server)}</div>
              <div style="font-size:12px;color:#22c55e;margin-top:2px;">OCSP Stapling: ${data.ocspStapling ? 'Active' : 'Off'}</div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Inspection Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 12. HTTP SECURITY HEADERS & CORS POSTURE ANALYZER STUDIO
  // =========================================================================
  window.renderSecurityHeadersStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🛡️</span> HTTP Security Headers & Posture Studio
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Scan any web domain or API endpoint to audit HSTS, CSP, X-Frame-Options, MIME sniffing, and generate Cloudflare Transform Rules.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('tlsinspect')">
            <span>🔒</span> TLS Inspector
          </button>
        </div>

        <!-- Input Bar -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:flex;gap:12px;">
            <input type="text" id="secHeadersUrl" value="https://cloudflare.com" placeholder="https://yourdomain.com"
              style="flex:1;padding:12px 16px;font-size:15px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;"
              onkeydown="if(event.key==='Enter') window.auditSecurityHeaders();" />
            <button class="btn btn-primary" onclick="window.auditSecurityHeaders()" style="padding:0 24px;">
              <span>⚡</span> Scan Headers
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Quick audit:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('secHeadersUrl').value='https://cloudflare.com';window.auditSecurityHeaders();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('secHeadersUrl').value='https://github.com';window.auditSecurityHeaders();">github.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('secHeadersUrl').value='https://google.com';window.auditSecurityHeaders();">google.com</button>
          </div>
        </div>

        <div id="secHeadersResultContainer">
          <div style="background:var(--surface,#1a1a24);border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--muted,#888);">
            <div style="font-size:40px;margin-bottom:12px;">🛡️</div>
            <div style="font-size:16px;font-weight:700;color:#fff;">Headers Audit Ready</div>
            <div style="font-size:13px;margin-top:4px;">Enter a URL above to inspect and grade its HTTP security header configuration.</div>
          </div>
        </div>
      </div>
    `;
  };

  window.auditSecurityHeaders = async function() {
    const input = document.getElementById('secHeadersUrl');
    const url = input ? input.value.trim() : 'https://cloudflare.com';
    const container = document.getElementById('secHeadersResultContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Scanning HTTP Security Headers for ${esc(url)}...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/tools/har-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to scan headers');

      const gradeBg = data.grade.startsWith('A') ? '#22c55e' : data.grade === 'B' ? '#38bdf8' : data.grade === 'C' ? '#eab308' : '#ef4444';

      container.innerHTML = `
        <!-- Top Score & Grade Banner -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Audited Endpoint</div>
            <div style="font-size:18px;font-weight:800;color:#fff;font-family:monospace;margin-top:2px;">${esc(data.url)}</div>
            <div style="font-size:12px;color:var(--muted,#aaa);margin-top:4px;">Roundtrip Latency: ${data.latencyMs} ms</div>
          </div>

          <div style="display:flex;align-items:center;gap:16px;">
            <div style="text-align:right;">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Security Score</div>
              <div style="font-size:24px;font-weight:800;color:${gradeBg};">${data.score} / 100</div>
            </div>
            <div style="width:64px;height:64px;border-radius:50%;background:${gradeBg}20;border:3px solid ${gradeBg};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:${gradeBg};">
              ${data.grade}
            </div>
          </div>
        </div>

        <!-- Headers Checklist -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Standard Security Headers Evaluation</h2>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${data.checks.map(c => {
              const statusColor = c.status === 'pass' ? '#22c55e' : c.status === 'warning' ? '#eab308' : '#ef4444';
              const statusText = c.status === 'pass' ? '✓ PASS' : c.status === 'warning' ? '⚠ WARNING' : '✕ MISSING';
              return `
                <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:14px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <div>
                      <span style="font-size:14px;font-weight:700;color:#fff;">${esc(c.name)}</span>
                      <span style="font-size:11px;color:var(--muted,#888);margin-left:8px;">(${c.weight}% weight)</span>
                    </div>
                    <span style="font-size:11px;font-weight:800;color:${statusColor};background:${statusColor}20;padding:3px 8px;border-radius:4px;">
                      ${statusText}
                    </span>
                  </div>

                  ${c.value ? `
                    <div style="font-size:12px;font-family:monospace;color:var(--accent,#7c6af7);background:#0d0d12;padding:6px 10px;border-radius:6px;margin-top:8px;word-break:break-all;">
                      ${esc(c.value)}
                    </div>
                  ` : ''}

                  <div style="font-size:12px;color:var(--muted,#aaa);margin-top:6px;">
                    💡 ${esc(c.advice)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Remediation Rule Snippet -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <h2 style="font-size:16px;font-weight:700;margin:0;">Cloudflare Edge Header Injection Snippet</h2>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:4px;"
              onclick="navigator.clipboard.writeText(document.getElementById('cfRemediationSnippet').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
              Copy
            </button>
          </div>
          <pre id="cfRemediationSnippet" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:12px;margin:0;overflow-x:auto;">${esc(data.remediationSnippet)}</pre>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Scan Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 13. CLOUDFLARE CRON TRIGGERS & SCHEDULED WORKER STUDIO
  // =========================================================================
  window.renderCronTriggerStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>⏰</span> Cloudflare Cron Triggers & Scheduled Worker Studio
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Configure, calculate upcoming execution intervals, and simulate scheduled edge worker jobs.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('cloudflare')">
            <span>☁️</span> Cloudflare Hub
          </button>
        </div>

        <!-- Presets -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Cron Presets:</span>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('cronExpressionInput').value='*/5 * * * *';window.calculateCronSchedule();">
            Every 5 minutes (*/5 * * * *)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('cronExpressionInput').value='*/15 * * * *';window.calculateCronSchedule();">
            Every 15 minutes (*/15 * * * *)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('cronExpressionInput').value='0 * * * *';window.calculateCronSchedule();">
            Hourly (0 * * * *)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('cronExpressionInput').value='0 0 * * *';window.calculateCronSchedule();">
            Daily Midnight UTC (0 0 * * *)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('cronExpressionInput').value='0 0 * * 1-5';window.calculateCronSchedule();">
            Weekdays (0 0 * * 1-5)
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Expression Config -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Cron Expression & Triggers</h2>

            <div style="margin-bottom:16px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">5-Part Cron Syntax</label>
              <input type="text" id="cronExpressionInput" value="*/15 * * * *" style="width:100%;padding:12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:16px;margin-top:4px;"
                oninput="window.calculateCronSchedule()" />
              <div style="font-size:11px;color:var(--muted,#888);margin-top:4px;">Format: [minute] [hour] [day-of-month] [month] [day-of-week]</div>
            </div>

            <!-- Human Description Card -->
            <div id="cronHumanDesc" style="background:rgba(124,106,247,0.1);border:1px solid rgba(124,106,247,0.3);border-radius:8px;padding:12px 16px;margin-bottom:16px;">
              <div style="font-size:11px;font-weight:700;color:var(--accent,#7c6af7);text-transform:uppercase;">Schedule Description</div>
              <div id="cronDescText" style="font-size:14px;font-weight:600;color:#fff;margin-top:2px;">Runs every 15 minutes</div>
            </div>

            <!-- Wrangler Configuration Block -->
            <div style="margin-bottom:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">wrangler.toml Trigger Config</label>
                <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                  onclick="navigator.clipboard.writeText(document.getElementById('wranglerCronCode').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
                  Copy
                </button>
              </div>
              <pre id="wranglerCronCode" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:12px;margin:0;">[triggers]&#10;crons = ["*/15 * * * *"]</pre>
            </div>

            <button class="btn btn-primary" onclick="window.simulateCronExecution()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Simulate Worker Scheduled Invocation
            </button>
          </div>

          <!-- Right: Upcoming Timeline & Simulation Console -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="cronUpcomingContainer">
              <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Upcoming Executions (UTC)</h2>
              <div id="cronRunsList" style="display:flex;flex-direction:column;gap:8px;">
                <!-- Populated dynamically -->
              </div>
            </div>

            <!-- Simulation Console -->
            <div id="cronSimulationLogs" style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;display:none;">
              <h2 style="font-size:14px;font-weight:700;margin:0 0 10px 0;display:flex;align-items:center;gap:6px;">
                <span>📡</span> Simulated Worker Telemetry
              </h2>
              <pre id="cronLogPre" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:#22c55e;font-family:monospace;font-size:11px;margin:0;max-height:160px;overflow-y:auto;white-space:pre-wrap;"></pre>
            </div>
          </div>
        </div>
      </div>
    `;
    window.calculateCronSchedule();
  };

  window.calculateCronSchedule = async function() {
    const input = document.getElementById('cronExpressionInput');
    const expression = input ? input.value.trim() : '*/15 * * * *';

    try {
      const res = await fetch('/api/cloudflare/cron-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, simulate: false })
      });
      const data = await res.json();

      if (!data.success) return;

      const desc = document.getElementById('cronDescText');
      if (desc) desc.innerText = data.description;

      const wrangler = document.getElementById('wranglerCronCode');
      if (wrangler) wrangler.innerText = data.wranglerConfig;

      const list = document.getElementById('cronRunsList');
      if (list && data.upcomingRuns) {
        list.innerHTML = data.upcomingRuns.map(run => `
          <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:11px;color:var(--muted,#888);width:20px;">#${run.runNumber}</span>
              <span style="font-size:13px;font-family:monospace;color:#fff;">${esc(run.utcString)}</span>
            </div>
            <span style="font-size:11px;color:var(--accent,#7c6af7);font-weight:700;background:rgba(124,106,247,0.1);padding:2px 8px;border-radius:4px;">
              ${esc(run.relative)}
            </span>
          </div>
        `).join('');
      }
    } catch (_) {}
  };

  window.simulateCronExecution = async function() {
    const input = document.getElementById('cronExpressionInput');
    const expression = input ? input.value.trim() : '*/15 * * * *';
    const logBox = document.getElementById('cronSimulationLogs');
    const logPre = document.getElementById('cronLogPre');

    if (logBox) logBox.style.display = 'block';
    if (logPre) logPre.innerText = '[Scheduled Trigger] Dispatching scheduled event to edge runtime...';

    try {
      const res = await fetch('/api/cloudflare/cron-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, simulate: true })
      });
      const data = await res.json();

      if (data.simulation && logPre) {
        logPre.innerText = data.simulation.logs.join('\n') + `\nExecution time: ${data.simulation.executionTimeMs} ms`;
      }
    } catch (err) {
      if (logPre) logPre.innerText = 'Simulation error: ' + err.message;
    }
  };

  // =========================================================================
  // 14. CLOUDFLARE KV NAMESPACE & STORAGE STUDIO
  // =========================================================================
  window.renderKvStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🗄️</span> Cloudflare KV Namespace & Cache Studio
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Browse, search, inspect expiration TTLs, and write edge key-value pairs with sub-millisecond global reads.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" onclick="window.openNewKvModal()">
              <span>➕</span> Set New Key
            </button>
            <button class="btn btn-secondary" onclick="window.switchTab('d1studio')">
              <span>🗄️</span> D1 SQL Studio
            </button>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;gap:12px;align-items:center;">
          <input type="text" id="kvSearchInput" placeholder="Filter keys by prefix or name (e.g. auth:, cache:)..."
            style="flex:1;padding:10px 14px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:13px;"
            oninput="window.loadKvKeys()" />
          <button class="btn btn-secondary" onclick="window.loadKvKeys()">
            <span>🔄</span> Refresh
          </button>
        </div>

        <!-- Keys Table Container -->
        <div id="kvTableContainer" style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;overflow:hidden;">
          <div style="padding:40px;text-align:center;color:var(--muted,#888);">
            <div class="spinner" style="margin:0 auto 12px auto;"></div>
            Loading KV namespace keys...
          </div>
        </div>
      </div>
    `;
    window.loadKvKeys();
  };

  window.loadKvKeys = async function() {
    const search = document.getElementById('kvSearchInput')?.value || '';
    const container = document.getElementById('kvTableContainer');
    if (!container) return;

    try {
      const res = await fetch(`/api/cloudflare/kv-studio/list?q=${encodeURIComponent(search)}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Failed to list KV keys');

      if (data.keys.length === 0) {
        container.innerHTML = `
          <div style="padding:48px 24px;text-align:center;color:var(--muted,#888);">
            <div style="font-size:36px;margin-bottom:8px;">📭</div>
            <div style="font-size:15px;color:#fff;font-weight:600;">No KV Keys Found</div>
            <div style="font-size:13px;margin-top:4px;">Click "Set New Key" to create your first edge key-value entry.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;text-align:left;font-size:13px;">
          <thead>
            <tr style="background:var(--surface2,#242434);border-bottom:1px solid var(--border);color:var(--muted,#888);">
              <th style="padding:12px 16px;">Key Name</th>
              <th style="padding:12px 16px;">Size</th>
              <th style="padding:12px 16px;">Expiration TTL</th>
              <th style="padding:12px 16px;">Created</th>
              <th style="padding:12px 16px;text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.keys.map(k => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:12px 16px;font-family:monospace;font-weight:700;color:var(--accent,#7c6af7);">
                  ${esc(k.key)}
                </td>
                <td style="padding:12px 16px;color:var(--muted,#aaa);">
                  ${k.size_bytes} B
                </td>
                <td style="padding:12px 16px;color:var(--muted,#aaa);">
                  ${k.expiration ? new Date(k.expiration * 1000).toLocaleString() : '<span style="color:#22c55e;">No Expiry (Permanent)</span>'}
                </td>
                <td style="padding:12px 16px;color:var(--muted,#aaa);">
                  ${esc(k.created_at)}
                </td>
                <td style="padding:12px 16px;text-align:right;">
                  <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px;margin-right:6px;" onclick="window.viewKvKey('${esc(k.key)}')">
                    View
                  </button>
                  <button class="btn btn-danger" style="padding:4px 8px;font-size:11px;" onclick="window.deleteKvKey('${esc(k.key)}')">
                    Delete
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:24px;text-align:center;">
          KV Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  window.openNewKvModal = function() {
    const existing = document.getElementById('kvNewModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'kvNewModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:16px;width:90%;max-width:500px;padding:24px;">
        <h2 style="font-size:18px;font-weight:700;margin:0 0 16px 0;">Set Key-Value Entry</h2>

        <div style="margin-bottom:12px;">
          <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Key Name</label>
          <input type="text" id="modalKvKey" placeholder="e.g. session:user_123 or config:theme" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Value (String or JSON)</label>
          <textarea id="modalKvValue" rows="4" placeholder="Enter value payload..." style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;resize:vertical;"></textarea>
        </div>

        <div style="margin-bottom:20px;">
          <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">TTL in Seconds (Optional, leave blank for permanent)</label>
          <input type="number" id="modalKvTtl" placeholder="e.g. 3600 for 1 hour" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" />
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button class="btn btn-secondary" onclick="document.getElementById('kvNewModal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="window.submitKvKey()">Save Key</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  };

  window.submitKvKey = async function() {
    const key = document.getElementById('modalKvKey')?.value.trim();
    const value = document.getElementById('modalKvValue')?.value;
    const ttl = document.getElementById('modalKvTtl')?.value;

    if (!key) return alert('Key is required');

    try {
      const res = await fetch('/api/cloudflare/kv-studio/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, ttl: ttl ? Number(ttl) : null })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      document.getElementById('kvNewModal')?.remove();
      window.loadKvKeys();
    } catch (err) {
      alert('Error saving KV key: ' + err.message);
    }
  };

  window.viewKvKey = async function(key) {
    try {
      const res = await fetch('/api/cloudflare/kv-studio/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);';
      overlay.innerHTML = `
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:16px;width:90%;max-width:550px;padding:24px;">
          <h2 style="font-size:18px;font-weight:700;margin:0 0 12px 0;font-family:monospace;color:var(--accent,#7c6af7);">${esc(data.item.key)}</h2>
          <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:#fff;font-family:monospace;font-size:12px;max-height:260px;overflow-y:auto;white-space:pre-wrap;">${esc(data.item.value)}</pre>
          <div style="display:flex;justify-content:flex-end;margin-top:16px;">
            <button class="btn btn-secondary" onclick="this.closest('div').parentElement.parentElement.remove()">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    } catch (err) {
      alert('Error fetching key: ' + err.message);
    }
  };

  window.deleteKvKey = async function(key) {
    if (!confirm(`Delete key "${key}" from KV storage?`)) return;
    try {
      const res = await fetch('/api/cloudflare/kv-studio/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      window.loadKvKeys();
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  // =========================================================================
  // 15. CRYPTOGRAPHIC KEYPAIR & SSH / PGP GENERATOR STUDIO
  // =========================================================================
  window.renderKeyGenStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🔑</span> Cryptographic Keypair & SSH Studio
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Generate high-entropy RSA-2048/4096 and ECDSA keypairs with OpenSSH export and 1-click encrypted vault storage.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('vault')">
            <span>🔒</span> View Vault
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:180px 1fr auto;gap:12px;align-items:center;">
            <div>
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Algorithm</label>
              <select id="keygenAlgo" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;">
                <option value="RSA-2048">RSA (2048-bit)</option>
                <option value="RSA-4096">RSA (4096-bit)</option>
                <option value="ECDSA-P256">ECDSA (P-256)</option>
                <option value="ECDSA-P384">ECDSA (P-384)</option>
              </select>
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Comment / Email</label>
              <input type="text" id="keygenComment" value="admin@cloudflare-vault.edge" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:13px;margin-top:4px;" />
            </div>
            <div style="align-self:flex-end;">
              <button class="btn btn-primary" onclick="window.generateKeypair()" style="padding:10px 20px;height:42px;">
                <span>⚡</span> Generate Keypair
              </button>
            </div>
          </div>
        </div>

        <div id="keygenResultContainer">
          <div style="background:var(--surface,#1a1a24);border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--muted,#888);">
            <div style="font-size:40px;margin-bottom:12px;">🔑</div>
            <div style="font-size:16px;font-weight:700;color:#fff;">Key Generator Ready</div>
            <div style="font-size:13px;margin-top:4px;">Select an algorithm above and click "Generate Keypair".</div>
          </div>
        </div>
      </div>
    `;
  };

  window.generateKeypair = async function() {
    const algo = document.getElementById('keygenAlgo')?.value || 'RSA-2048';
    const comment = document.getElementById('keygenComment')?.value || 'vault@edge';
    const container = document.getElementById('keygenResultContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Generating ${algo} High-Entropy Keypair...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/key-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: algo, comment })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      container.innerHTML = `
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:20px;">
          <!-- Top Info Bar -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:16px;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Fingerprint (SHA256)</div>
              <div style="font-size:15px;font-weight:700;color:var(--accent,#7c6af7);font-family:monospace;margin-top:2px;">${esc(data.fingerprint)}</div>
            </div>
            <button class="btn btn-primary" onclick="window.saveKeypairToVault('${esc(data.algorithm)}', '${esc(data.comment)}', \`${data.privateKey.replace(/`/g, '\\`')}\`)">
              <span>🔒</span> Save Directly to Encrypted Vault
            </button>
          </div>

          <!-- OpenSSH Public Key -->
          <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">OpenSSH Public Key (~/.ssh/authorized_keys)</span>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="navigator.clipboard.writeText('${esc(data.sshPublicKey)}');this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
                Copy
              </button>
            </div>
            <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:#22c55e;font-family:monospace;font-size:12px;margin:0;overflow-x:auto;">${esc(data.sshPublicKey)}</pre>
          </div>

          <!-- PEM Public Key -->
          <div style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Public Key (X.509 SPKI PEM)</span>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="navigator.clipboard.writeText(document.getElementById('pemPubKey').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
                Copy
              </button>
            </div>
            <pre id="pemPubKey" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:#fff;font-family:monospace;font-size:11px;margin:0;max-height:120px;overflow-y:auto;">${esc(data.publicKey)}</pre>
          </div>

          <!-- PEM Private Key -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;">Private Key (PKCS#8 PEM - KEEP SECRET)</span>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="navigator.clipboard.writeText(document.getElementById('pemPrivKey').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
                Copy Private Key
              </button>
            </div>
            <pre id="pemPrivKey" style="background:#0d0d12;border:1px solid #ef444450;border-radius:8px;padding:12px;color:#ef4444;font-family:monospace;font-size:11px;margin:0;max-height:140px;overflow-y:auto;">${esc(data.privateKey)}</pre>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Key Generation Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  window.saveKeypairToVault = async function(algo, comment, privKey) {
    try {
      const res = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `SSH Key (${algo})`,
          username: comment,
          password: privKey,
          url: 'ssh://',
          description: `Generated by Cryptographic Key Studio. Algorithm: ${algo}`,
          category_id: 1,
          item_type: 'server'
        })
      });
      const data = await res.json();
      if (!data.success && !data.id) throw new Error(data.error || 'Failed to save');
      alert(`Keypair successfully encrypted and stored in Vault!`);
    } catch (err) {
      alert('Error saving to vault: ' + err.message);
    }
  };

  // =========================================================================
  // 16. DNS-OVER-HTTPS (DOH) MULTI-RESOLVER & DNSSEC BENCHMARK
  // =========================================================================
  window.renderDohBenchmarkStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🌐</span> DNS-over-HTTPS (DoH) & DNSSEC Benchmark
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Query global DoH resolvers simultaneously, measure resolution latency, and verify DNSSEC cryptographic signatures.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('tlsinspect')">
            <span>🔒</span> TLS Inspector
          </button>
        </div>

        <!-- Input Bar -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr 140px auto;gap:12px;align-items:center;">
            <input type="text" id="dohDomainInput" value="cloudflare.com" placeholder="Domain name (e.g. cloudflare.com)"
              style="padding:12px 16px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:15px;"
              onkeydown="if(event.key==='Enter') window.runDohBenchmark();" />
            <select id="dohRecordType" style="padding:12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-weight:700;">
              <option value="A">A (IPv4)</option>
              <option value="AAAA">AAAA (IPv6)</option>
              <option value="MX">MX (Mail)</option>
              <option value="TXT">TXT (Verification)</option>
              <option value="CNAME">CNAME</option>
              <option value="CAA">CAA (Cert Auth)</option>
            </select>
            <button class="btn btn-primary" onclick="window.runDohBenchmark()" style="padding:12px 24px;font-weight:700;">
              <span>⚡</span> Benchmark DoH
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Quick test:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('dohDomainInput').value='cloudflare.com';window.runDohBenchmark();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('dohDomainInput').value='google.com';window.runDohBenchmark();">google.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('dohDomainInput').value='apple.com';window.runDohBenchmark();">apple.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('dohDomainInput').value='github.com';window.runDohBenchmark();">github.com</button>
          </div>
        </div>

        <div id="dohBenchmarkResults">
          <div style="background:var(--surface,#1a1a24);border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--muted,#888);">
            <div style="font-size:40px;margin-bottom:12px;">🌐</div>
            <div style="font-size:16px;font-weight:700;color:#fff;">DoH Resolvers Ready</div>
            <div style="font-size:13px;margin-top:4px;">Enter a hostname above to test resolution speed across Cloudflare and Google DoH endpoints.</div>
          </div>
        </div>
      </div>
    `;
  };

  window.runDohBenchmark = async function() {
    const domain = document.getElementById('dohDomainInput')?.value.trim() || 'cloudflare.com';
    const recordType = document.getElementById('dohRecordType')?.value || 'A';
    const container = document.getElementById('dohBenchmarkResults');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Querying DoH Resolvers for ${esc(domain)} [${recordType}]...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/dns/doh-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, recordType })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'DoH query failed');

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          ${data.resolvers.map(r => `
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px;">
                <div>
                  <div style="font-size:16px;font-weight:800;color:#fff;">${esc(r.name)}</div>
                  <div style="font-size:12px;color:var(--muted,#888);font-family:monospace;">${esc(r.ip)}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:18px;font-weight:800;color:#22c55e;">${r.latencyMs} ms</div>
                  <div style="font-size:11px;color:${r.dnssecValid ? '#22c55e' : '#eab308'};font-weight:700;">
                    ${r.dnssecValid ? '✓ DNSSEC VALID' : '⚠ NO DNSSEC'}
                  </div>
                </div>
              </div>

              <div style="margin-bottom:8px;font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">
                Answers (${r.answers.length} Records)
              </div>

              ${r.answers.length > 0 ? `
                <div style="display:flex;flex-direction:column;gap:6px;">
                  ${r.answers.map(a => `
                    <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:12px;font-family:monospace;display:flex;justify-content:space-between;align-items:center;">
                      <span style="color:#fff;font-weight:700;word-break:break-all;">${esc(a.data)}</span>
                      <span style="color:var(--muted,#888);font-size:11px;margin-left:8px;">TTL ${a.ttl}s</span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div style="font-size:12px;color:var(--muted,#888);padding:12px;text-align:center;">No records returned</div>
              `}
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Benchmark Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 17. EDGE RATE LIMITING RULE ARCHITECT & BURST SIMULATOR
  // =========================================================================
  window.renderRateLimitingStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🚦</span> Edge Rate Limiting Rule Architect & Traffic Simulator
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Architect Cloudflare Rate Limiting rules against credential stuffing, and simulate high-frequency burst traffic.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('wafsim')">
            <span>🛡️</span> WAF Rules
          </button>
        </div>

        <!-- Presets -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Rate Limit Presets:</span>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('rlPath').value='/api/login';document.getElementById('rlThreshold').value='5';document.getElementById('rlPeriod').value='60';document.getElementById('rlAction').value='managed_challenge';window.simulateRateLimiting();">
            Login Brute-Force Shield (5 req / 60s)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('rlPath').value='/checkout/process';document.getElementById('rlThreshold').value='3';document.getElementById('rlPeriod').value='60';document.getElementById('rlAction').value='block';window.simulateRateLimiting();">
            Checkout Anti-Carding (3 req / 60s)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('rlPath').value='/graphql';document.getElementById('rlThreshold').value='20';document.getElementById('rlPeriod').value='10';document.getElementById('rlAction').value='js_challenge';window.simulateRateLimiting();">
            GraphQL DoS Defense (20 req / 10s)
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Config & Terraform -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Rule Configuration</h2>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">URI Path Pattern</label>
              <input type="text" id="rlPath" value="/api/login" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Threshold (Reqs)</label>
                <input type="number" id="rlThreshold" value="5" min="1" max="100" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Window (Seconds)</label>
                <input type="number" id="rlPeriod" value="60" min="1" max="3600" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" />
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Mitigation Action</label>
              <select id="rlAction" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;">
                <option value="managed_challenge">Managed Challenge (Interactive or Turnstile)</option>
                <option value="block">Block (HTTP 429 Too Many Requests)</option>
                <option value="js_challenge">JavaScript Challenge</option>
              </select>
            </div>

            <button class="btn btn-primary" onclick="window.simulateRateLimiting()" style="width:100%;padding:12px;font-weight:700;margin-bottom:16px;">
              <span>⚡</span> Simulate 15-Request Burst Traffic
            </button>

            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Terraform cloudflare_rate_limit Resource</label>
                <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                  onclick="navigator.clipboard.writeText(document.getElementById('terraformRlCode').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
                  Copy
                </button>
              </div>
              <pre id="terraformRlCode" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:180px;overflow-y:auto;"></pre>
            </div>
          </div>

          <!-- Right: Simulation Results -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="rlSimulationStats" style="display:flex;gap:12px;margin-bottom:16px;">
              <div style="flex:1;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Allowed (200 OK)</div>
                <div id="rlAllowedCount" style="font-size:22px;font-weight:800;color:#22c55e;">-</div>
              </div>
              <div style="flex:1;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Throttled (429)</div>
                <div id="rlThrottledCount" style="font-size:22px;font-weight:800;color:#ef4444;">-</div>
              </div>
            </div>

            <h3 style="font-size:14px;font-weight:700;margin:0 0 10px 0;">Burst Traffic Execution Log</h3>
            <div id="rlTimelineLogs" style="display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;">
              <div style="color:var(--muted,#888);font-size:13px;text-align:center;padding:24px;">Click "Simulate Burst Traffic" to test rate limit enforcement.</div>
            </div>
          </div>
        </div>
      </div>
    `;
    window.simulateRateLimiting();
  };

  window.simulateRateLimiting = async function() {
    const pathPattern = document.getElementById('rlPath')?.value.trim() || '/api/login';
    const threshold = document.getElementById('rlThreshold')?.value || 5;
    const period = document.getElementById('rlPeriod')?.value || 60;
    const action = document.getElementById('rlAction')?.value || 'managed_challenge';

    try {
      const res = await fetch('/api/cloudflare/rate-limiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathPattern, threshold, period, action, simulateBurstCount: 15 })
      });
      const data = await res.json();

      if (!data.success) return;

      const tf = document.getElementById('terraformRlCode');
      if (tf) tf.innerText = data.terraformSnippet;

      const allowed = document.getElementById('rlAllowedCount');
      if (allowed) allowed.innerText = data.simulation.passed;

      const throttled = document.getElementById('rlThrottledCount');
      if (throttled) throttled.innerText = data.simulation.throttled;

      const timeline = document.getElementById('rlTimelineLogs');
      if (timeline && data.simulation.logs) {
        timeline.innerHTML = data.simulation.logs.map(log => {
          const isOk = log.status === 200;
          return `
            <div style="background:var(--surface2,#242434);border-left:3px solid ${isOk ? '#22c55e' : '#ef4444'};border-radius:4px;padding:8px 12px;font-family:monospace;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="color:${isOk ? '#22c55e' : '#ef4444'};font-weight:700;">[Req #${log.requestIndex}] ${log.status}</span>
                <span style="color:var(--muted,#888);margin-left:8px;">+${log.timeOffsetMs}ms</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;color:${isOk ? '#22c55e' : '#ef4444'};background:${isOk ? '#22c55e20' : '#ef444420'};padding:2px 6px;border-radius:4px;font-weight:800;">
                  ${esc(log.edgeAction)}
                </span>
                <span style="font-size:10px;color:var(--muted,#888);">${log.headers['cf-ray']}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (_) {}
  };

  // =========================================================================
  // 18. CLOUDFLARE CACHE-PURGE & EDGE CDN INVALIDATION STUDIO
  // =========================================================================
  window.renderCachePurgeStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>⚡</span> Cloudflare CDN Cache & Purge Studio
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Inspect edge CF-Cache-Status, evaluate s-maxage TTLs, and build instant cache purge commands.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('secstudio')">
            <span>🛡️</span> Security Headers
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr 180px auto;gap:12px;align-items:center;">
            <input type="text" id="cacheTargetUrl" value="https://cloudflare.com" placeholder="https://yourdomain.com/asset.js"
              style="padding:12px 16px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:14px;"
              onkeydown="if(event.key==='Enter') window.inspectCacheability();" />
            <select id="cachePurgeType" style="padding:12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;">
              <option value="single_file">Single File / URL</option>
              <option value="tag">Cache-Tag Header</option>
              <option value="everything">Purge Everything</option>
            </select>
            <button class="btn btn-primary" onclick="window.inspectCacheability()" style="padding:12px 24px;font-weight:700;">
              <span>⚡</span> Probe Cache
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Quick test:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('cacheTargetUrl').value='https://cloudflare.com';window.inspectCacheability();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('cacheTargetUrl').value='https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js';window.inspectCacheability();">cdnjs react.min.js</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('cacheTargetUrl').value='https://wikipedia.org';window.inspectCacheability();">wikipedia.org</button>
          </div>
        </div>

        <div id="cacheInspectResults">
          <div style="background:var(--surface,#1a1a24);border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--muted,#888);">
            <div style="font-size:40px;margin-bottom:12px;">⚡</div>
            <div style="font-size:16px;font-weight:700;color:#fff;">CDN Cache Analyzer Ready</div>
            <div style="font-size:13px;margin-top:4px;">Enter an asset or page URL above to probe Cloudflare edge cache status and generate purge API commands.</div>
          </div>
        </div>
      </div>
    `;
  };

  window.inspectCacheability = async function() {
    const targetUrl = document.getElementById('cacheTargetUrl')?.value.trim() || 'https://cloudflare.com';
    const purgeType = document.getElementById('cachePurgeType')?.value || 'single_file';
    const container = document.getElementById('cacheInspectResults');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Probing Edge CDN Caching Headers for ${esc(targetUrl)}...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/cache-purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, purgeType })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const isHit = data.cacheStatus === 'HIT';
      const statusColor = isHit ? '#22c55e' : '#eab308';

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <!-- Cache Telemetry Card -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <div>
                <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">CF-Cache-Status</div>
                <div style="font-size:24px;font-weight:900;color:${statusColor};margin-top:2px;">${esc(data.cacheStatus)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Latency</div>
                <div style="font-size:18px;font-weight:700;color:#fff;">${data.latencyMs} ms</div>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
              <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;">
                <span style="font-size:12px;color:var(--muted,#888);">Cache-Control:</span>
                <span style="font-size:12px;font-family:monospace;color:#fff;">${esc(data.cacheControl)}</span>
              </div>
              <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;">
                <span style="font-size:12px;color:var(--muted,#888);">Edge Age:</span>
                <span style="font-size:12px;font-family:monospace;color:#fff;">${esc(data.age)}</span>
              </div>
              <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;">
                <span style="font-size:12px;color:var(--muted,#888);">ETag:</span>
                <span style="font-size:12px;font-family:monospace;color:#fff;">${esc(data.etag || 'None')}</span>
              </div>
            </div>
          </div>

          <!-- Purge Command Card -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h3 style="font-size:14px;font-weight:700;margin:0;">Cloudflare Cache Purge API Command</h3>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="navigator.clipboard.writeText(document.getElementById('purgeCurlText').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
                Copy
              </button>
            </div>
            <pre id="purgeCurlText" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:160px;overflow-x:auto;">${esc(data.purgeCommand)}</pre>
            <div style="font-size:11px;color:var(--muted,#888);margin-top:10px;">
              💡 Execute this cURL command or integrate it into your CI/CD pipeline to immediately invalidate this cached asset globally across Cloudflare edge PoPs.
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Cache Probe Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 19. CLOUDFLARE WIREFILTER & EXPRESSION EVALUATOR STUDIO
  // =========================================================================
  window.renderWirefilterStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>📐</span> Cloudflare Wirefilter & Firewall Expression Tester
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Test and debug Cloudflare Wireshark / Wirefilter firewall expressions against simulated edge HTTP contexts.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('wafsim')">
            <span>🛡️</span> WAF Simulator
          </button>
        </div>

        <!-- Presets -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Wirefilter Presets:</span>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('wfExpr').value='(http.request.uri.path contains \\'/api/v1\\' and not ip.geoip.country in {\\'US\\' \\'CA\\'})';window.evaluateWirefilter();">
            Geo-Block Sensitive API (/api/v1 outside US/CA)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('wfExpr').value='(http.request.method eq \\'POST\\' and http.request.uri.path contains \\'/wp-login.php\\')';window.evaluateWirefilter();">
            WordPress Login Shield (POST to /wp-login.php)
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Expression Editor & Mock Request -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 12px 0;">Wirefilter Expression</h2>

            <textarea id="wfExpr" rows="3" style="width:100%;padding:12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:var(--accent,#7c6af7);font-family:monospace;font-size:13px;resize:vertical;margin-bottom:16px;">(http.request.uri.path contains "/api/v1" and not ip.geoip.country in {"US" "CA"})</textarea>

            <h3 style="font-size:14px;font-weight:700;margin:0 0 10px 0;">Simulated Request Context</h3>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">URI Path</label>
                <input type="text" id="wfUriPath" value="/api/v1/auth" style="width:100%;padding:8px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-family:monospace;margin-top:4px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Country Code</label>
                <input type="text" id="wfCountry" value="RU" style="width:100%;padding:8px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-family:monospace;margin-top:4px;" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">HTTP Method</label>
                <select id="wfMethod" style="width:100%;padding:8px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;margin-top:4px;">
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Client IP</label>
                <input type="text" id="wfIp" value="198.51.100.4" style="width:100%;padding:8px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-family:monospace;margin-top:4px;" />
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.evaluateWirefilter()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Evaluate Expression Match
            </button>
          </div>

          <!-- Right: Evaluation Results -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="wfResultContainer">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
    window.evaluateWirefilter();
  };

  window.evaluateWirefilter = async function() {
    const expression = document.getElementById('wfExpr')?.value || '';
    const uriPath = document.getElementById('wfUriPath')?.value || '/api/v1/auth';
    const country = document.getElementById('wfCountry')?.value || 'RU';
    const method = document.getElementById('wfMethod')?.value || 'POST';
    const ip = document.getElementById('wfIp')?.value || '198.51.100.4';
    const container = document.getElementById('wfResultContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/tools/wirefilter-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression,
          mockRequest: { uriPath, country, method, ip }
        })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const isMatch = data.matches;
      const statusColor = isMatch ? '#ef4444' : '#22c55e';

      container.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Evaluation Result</div>
          <div style="font-size:20px;font-weight:900;color:${statusColor};margin-top:4px;">
            ${isMatch ? '🛡️ RULE MATCHED (BLOCKED / CHALLENGED)' : '✓ NO MATCH (ALLOWED)'}
          </div>
          <div style="font-size:13px;color:var(--muted,#aaa);margin-top:4px;">${esc(data.explanation)}</div>
        </div>

        <h3 style="font-size:14px;font-weight:700;margin:0 0 10px 0;">Condition Breakdowns</h3>
        ${data.matchedTokens && data.matchedTokens.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${data.matchedTokens.map(tok => `
              <div style="background:var(--surface2,#242434);border-left:3px solid #ef4444;border-radius:4px;padding:10px 14px;font-family:monospace;font-size:12px;color:#fff;">
                ✓ ${esc(tok)}
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="background:var(--surface2,#242434);border-left:3px solid #22c55e;border-radius:4px;padding:10px 14px;font-family:monospace;font-size:12px;color:#fff;">
            No rule criteria were triggered by the request context.
          </div>
        `}
      `;
    } catch (err) {
      container.innerHTML = `
        <div style="color:#ef4444;padding:20px;text-align:center;">
          Evaluation Error: ${esc(err.message)}
        </div>
      `;
    }
  };

  // =========================================================================
  // 20. JWT (JSON WEB TOKEN) EDGE INSPECTOR & VERIFIER STUDIO
  // =========================================================================
  window.renderJwtStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🎟️</span> JWT (JSON Web Token) Edge Inspector & Verifier
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Inspect, decode, and verify RFC 7519 JSON Web Tokens, validate expiration claims, and verify cryptographic signatures.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('keygen')">
            <span>🔑</span> SSH & Keypair
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Load Sample Token:</span>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('jwtInput').value='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1IiwibmFtZSI6IkFsaWNlIERldmVsb3BlciIsImFkbWluIjp0cnVlLCJpYXQiOjE3MTQ5OTEyNTUsImV4cCI6MTg5MzQ1NjAwMH0.v7kS4z6R16Hk3WkRjOqZlGzZ4-gT1l6V9981K1x1x1x';document.getElementById('jwtSecret').value='my-secret-key';window.inspectJwt();">
            Admin Auth Token (HS256)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('jwtInput').value='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiJzZXJ2aWNlX2FwaSIsImF1ZCI6WyJhcGkucHJvZCJdLCJleHAiOjE2MDAwMDAwMDB9.invalid_signature_example';document.getElementById('jwtSecret').value='';window.inspectJwt();">
            Expired Service Token
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <label style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Encoded JWT Token</label>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="window.generateSampleJwt();">
                ⚡ Generate New Token
              </button>
            </div>
            <textarea id="jwtInput" rows="5" placeholder="Paste your jwt (header.payload.signature) here..."
              style="width:100%;padding:12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:var(--accent,#7c6af7);font-family:monospace;font-size:12px;resize:vertical;margin-bottom:12px;"
              oninput="window.inspectJwt();"></textarea>

            <div style="margin-bottom:16px;">
              <label style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">HMAC Secret (Optional for verification)</label>
              <input type="text" id="jwtSecret" placeholder="Secret key (e.g. your-api-secret)"
                style="width:100%;padding:10px 12px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;"
                oninput="window.inspectJwt();" />
            </div>

            <button class="btn btn-primary" onclick="window.inspectJwt()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Inspect & Verify Token
            </button>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="jwtResultsContainer">
              <div style="color:var(--muted,#888);font-size:13px;text-align:center;padding:40px;">
                Paste or generate a JWT on the left to inspect decoded claims and signature.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    window.inspectJwt();
  };

  window.generateSampleJwt = async function() {
    try {
      const res = await fetch('/api/security/jwt-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          secret: 'vault-secret-key-32-chars-long!',
          payloadToSign: {
            sub: 'user_vault_' + Math.floor(Math.random() * 89999 + 10000),
            role: 'engineer',
            iss: 'https://vault.cloudflare.edge',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400 * 7
          }
        })
      });
      const data = await res.json();
      if (data.success && data.jwt) {
        document.getElementById('jwtInput').value = data.jwt;
        document.getElementById('jwtSecret').value = 'vault-secret-key-32-chars-long!';
        window.inspectJwt();
      }
    } catch (_) {}
  };

  window.inspectJwt = async function() {
    const token = document.getElementById('jwtInput')?.value.trim();
    const secret = document.getElementById('jwtSecret')?.value.trim();
    const container = document.getElementById('jwtResultsContainer');
    if (!container) return;

    if (!token) {
      container.innerHTML = `<div style="color:var(--muted,#888);font-size:13px;text-align:center;padding:40px;">Paste a JWT on the left to inspect decoded claims.</div>`;
      return;
    }

    try {
      const res = await fetch('/api/security/jwt-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret })
      });
      const data = await res.json();

      if (!data.success) {
        container.innerHTML = `<div style="color:#ef4444;padding:16px;background:#ef444415;border-radius:8px;font-size:13px;">${esc(data.error)}</div>`;
        return;
      }

      const isExpired = data.isExpired;
      const expColor = isExpired ? '#ef4444' : '#22c55e';
      const sigColor = data.signatureVerified === true ? '#22c55e' : data.signatureVerified === false ? '#ef4444' : '#eab308';

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px;">
          <div>
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Token Expiration</div>
            <div style="font-size:14px;font-weight:700;color:${expColor};">${esc(data.expirationStatus)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Signature Status</div>
            <div style="font-size:14px;font-weight:700;color:${sigColor};">${esc(data.verificationMessage)}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Decoded Header</div>
          <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:#f43f5e;font-family:monospace;font-size:11px;margin:0;">${esc(JSON.stringify(data.header, null, 2))}</pre>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Decoded Payload (Claims)</div>
          <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:160px;overflow-y:auto;">${esc(JSON.stringify(data.payload, null, 2))}</pre>
        </div>

        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Signature (Base64Url)</div>
          <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:#06b6d4;font-family:monospace;font-size:11px;margin:0;word-break:break-all;">${esc(data.signature)}</pre>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">Error inspecting token: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 21. CLOUDFLARE TRANSFORM RULES & URL REWRITE ARCHITECT
  // =========================================================================
  window.renderTransformStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🔄</span> Cloudflare Transform Rules & URL Rewrite Studio
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Architect Cloudflare Edge dynamic URL rewrites, path prefix manipulations, and HTTP header injections.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('wirefilter')">
            <span>📐</span> Wirefilter
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Transform Presets:</span>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('trRuleType').value='rewrite_path';document.getElementById('trInputUrl').value='https://example.com/api/v2/products';document.getElementById('trTarget').value='/v2';document.getElementById('trExpr').value='(http.request.uri.path starts_with \\'/api/v2\\')';window.simulateTransformRule();">
            Strip Path Prefix (/api/v2 -> /v2)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('trRuleType').value='modify_header';document.getElementById('trHeaderName').value='X-Client-Geo-Country';document.getElementById('trHeaderVal').value='ip.geoip.country';window.simulateTransformRule();">
            Geo-Country Header Injection
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Transform Rule Configuration</h2>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Transform Type</label>
              <select id="trRuleType" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;"
                onchange="window.simulateTransformRule();">
                <option value="rewrite_path">Dynamic URL Path Rewrite</option>
                <option value="modify_header">HTTP Request Header Modification</option>
              </select>
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Incoming Test URL</label>
              <input type="text" id="trInputUrl" value="https://example.com/api/v2/products" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Wirefilter Match Expression</label>
              <input type="text" id="trExpr" value="(http.request.uri.path starts_with &quot;/api/v2&quot;)" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:var(--accent,#7c6af7);font-family:monospace;margin-top:4px;" />
            </div>

            <div id="trPathFields" style="margin-bottom:16px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Rewrite Target Path</label>
              <input type="text" id="trTarget" value="/v2" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
            </div>

            <div id="trHeaderFields" style="display:none;margin-bottom:16px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Header Name</label>
                  <input type="text" id="trHeaderName" value="X-Client-Country" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
                </div>
                <div>
                  <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Header Expression Value</label>
                  <input type="text" id="trHeaderVal" value="ip.geoip.country" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
                </div>
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.simulateTransformRule()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Simulate Transform
            </button>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="trOutputContainer">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
    window.simulateTransformRule();
  };

  window.simulateTransformRule = async function() {
    const ruleType = document.getElementById('trRuleType')?.value || 'rewrite_path';
    const incomingUrl = document.getElementById('trInputUrl')?.value || 'https://example.com/api/v2/products';
    const expression = document.getElementById('trExpr')?.value || '(http.request.uri.path starts_with "/api/v2")';
    const rewriteTarget = document.getElementById('trTarget')?.value || '/v2';
    const headerName = document.getElementById('trHeaderName')?.value || 'X-Client-Country';
    const headerValue = document.getElementById('trHeaderVal')?.value || 'ip.geoip.country';

    const pFields = document.getElementById('trPathFields');
    const hFields = document.getElementById('trHeaderFields');
    if (pFields && hFields) {
      pFields.style.display = ruleType === 'rewrite_path' ? 'block' : 'none';
      hFields.style.display = ruleType === 'modify_header' ? 'block' : 'none';
    }

    const container = document.getElementById('trOutputContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/cloudflare/transform-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleType, incomingUrl, expression, rewriteTarget, headerName, headerValue })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      container.innerHTML = `
        <h3 style="font-size:14px;font-weight:700;margin:0 0 12px 0;">Simulated Edge Request Transformation</h3>

        <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Incoming Client Path:</span>
            <span style="font-size:12px;font-family:monospace;color:#ef4444;">${esc(data.originalPath)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Transformed Origin Path:</span>
            <span style="font-size:12px;font-family:monospace;color:#22c55e;font-weight:700;">${esc(data.transformedPath)}</span>
          </div>
          ${ruleType === 'modify_header' ? `
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Injected Header:</span>
              <span style="font-size:12px;font-family:monospace;color:var(--accent,#7c6af7);">${esc(headerName)}: &lt;dynamic ${esc(headerValue)}&gt;</span>
            </div>
          ` : ''}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Terraform cloudflare_ruleset Resource</label>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
            onclick="navigator.clipboard.writeText(document.getElementById('tfRulesetCode').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
            Copy
          </button>
        </div>
        <pre id="tfRulesetCode" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:220px;overflow-y:auto;">${esc(data.terraformSnippet)}</pre>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">Simulation Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 22. SUBNET & CIDR NETWORK CALCULATOR STUDIO
  // =========================================================================
  window.renderCidrStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🔢</span> Subnet & CIDR Network Calculator
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Calculate IPv4 network ranges, subnet masks, wildcard bits, broadcast addresses, and verify Cloudflare edge IP ranges.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('ipintel')">
            <span>🌍</span> IP Intel
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:center;">
            <div>
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">IPv4 CIDR Block</label>
              <input type="text" id="cidrInput" value="192.168.10.0/24" placeholder="192.168.1.0/24"
                style="width:100%;padding:10px 14px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:14px;margin-top:4px;"
                onkeydown="if(event.key==='Enter') window.calculateCidr();" />
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Test IP (Membership Check)</label>
              <input type="text" id="cidrTestIp" value="192.168.10.45" placeholder="192.168.10.45"
                style="width:100%;padding:10px 14px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:14px;margin-top:4px;"
                onkeydown="if(event.key==='Enter') window.calculateCidr();" />
            </div>
            <div style="padding-top:16px;">
              <button class="btn btn-primary" onclick="window.calculateCidr()" style="padding:10px 24px;font-weight:700;">
                <span>⚡</span> Calculate
              </button>
            </div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Presets:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('cidrInput').value='192.168.1.0/24';window.calculateCidr();">Class C (/24 - 254 hosts)</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('cidrInput').value='10.0.0.0/16';window.calculateCidr();">Private /16 (65,534 hosts)</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('cidrInput').value='173.245.48.0/20';window.calculateCidr();">Cloudflare Edge (/20)</button>
          </div>
        </div>

        <div id="cidrResultsContainer">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;
    window.calculateCidr();
  };

  window.calculateCidr = async function() {
    const cidr = document.getElementById('cidrInput')?.value.trim() || '192.168.10.0/24';
    const testIp = document.getElementById('cidrTestIp')?.value.trim() || '';
    const container = document.getElementById('cidrResultsContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/network/cidr-calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidr, testIp })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h3 style="font-size:14px;font-weight:700;margin:0 0 12px 0;">Subnet Parameters</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">Network Address:</span>
                <span style="font-size:12px;font-family:monospace;color:#fff;font-weight:700;">${esc(data.networkAddress)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">Broadcast Address:</span>
                <span style="font-size:12px;font-family:monospace;color:#fff;font-weight:700;">${esc(data.broadcastAddress)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">Subnet Mask:</span>
                <span style="font-size:12px;font-family:monospace;color:#22c55e;">${esc(data.netmask)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">Wildcard Mask:</span>
                <span style="font-size:12px;font-family:monospace;color:#f59e0b;">${esc(data.wildcardMask)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">First Usable Host:</span>
                <span style="font-size:12px;font-family:monospace;color:#fff;">${esc(data.firstUsableIp)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">Last Usable Host:</span>
                <span style="font-size:12px;font-family:monospace;color:#fff;">${esc(data.lastUsableIp)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">Total Usable Hosts:</span>
                <span style="font-size:13px;font-weight:800;color:var(--accent,#7c6af7);">${data.usableHosts.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            ${data.testIpResult ? `
              <div style="margin-bottom:16px;">
                <h3 style="font-size:14px;font-weight:700;margin:0 0 8px 0;">Membership Verification</h3>
                <div style="background:var(--surface2,#242434);border-left:4px solid ${data.testIpResult.inSubnet ? '#22c55e' : '#ef4444'};border-radius:6px;padding:12px;font-size:13px;font-weight:700;color:${data.testIpResult.inSubnet ? '#22c55e' : '#ef4444'};">
                  ${esc(data.testIpResult.message)}
                </div>
              </div>
            ` : ''}

            <h3 style="font-size:14px;font-weight:700;margin:0 0 8px 0;">Binary Representations</h3>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
              <div>
                <div style="font-size:11px;color:var(--muted,#888);margin-bottom:2px;">IP Address (Binary):</div>
                <div style="font-family:monospace;font-size:11px;background:#0d0d12;padding:6px 10px;border-radius:4px;color:#06b6d4;">${esc(data.binaryIp)}</div>
              </div>
              <div>
                <div style="font-size:11px;color:var(--muted,#888);margin-bottom:2px;">Netmask (Binary):</div>
                <div style="font-family:monospace;font-size:11px;background:#0d0d12;padding:6px 10px;border-radius:4px;color:#22c55e;">${esc(data.binaryNetmask)}</div>
              </div>
            </div>

            <h3 style="font-size:14px;font-weight:700;margin:0 0 8px 0;">Cloudflare Edge IPv4 Ranges</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px;max-height:100px;overflow-y:auto;">
              ${data.cloudflareRanges.map(r => `
                <span class="badge" style="font-family:monospace;font-size:11px;background:var(--surface2,#242434);border:1px solid var(--border);padding:2px 8px;border-radius:4px;color:#ddd;cursor:pointer;"
                  onclick="document.getElementById('cidrInput').value='${r}';window.calculateCidr();">${r}</span>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">CIDR Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 23. SECURITY TXT & RFC 9116 VULNERABILITY DISCLOSURE AUDITOR
  // =========================================================================
  window.renderSecurityTxtStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>📄</span> Security.txt & RFC 9116 Vulnerability Disclosure Auditor
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Audit domains for compliance with RFC 9116 security policies and generate production-ready security.txt files.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('secstudio')">
            <span>🛡️</span> Security Headers
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;">
            <input type="text" id="secTxtDomain" value="cloudflare.com" placeholder="Domain name (e.g. cloudflare.com or google.com)"
              style="padding:12px 16px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:14px;"
              onkeydown="if(event.key==='Enter') window.auditSecurityTxt();" />
            <button class="btn btn-primary" onclick="window.auditSecurityTxt()" style="padding:12px 24px;font-weight:700;">
              <span>⚡</span> Audit RFC 9116
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Quick audit:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('secTxtDomain').value='cloudflare.com';window.auditSecurityTxt();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('secTxtDomain').value='github.com';window.auditSecurityTxt();">github.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('secTxtDomain').value='google.com';window.auditSecurityTxt();">google.com</button>
          </div>
        </div>

        <div id="secTxtResultsContainer">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;
    window.auditSecurityTxt();
  };

  window.auditSecurityTxt = async function() {
    const domain = document.getElementById('secTxtDomain')?.value.trim() || 'cloudflare.com';
    const container = document.getElementById('secTxtResultsContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Probing RFC 9116 security.txt for ${esc(domain)}...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/security-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const gradeColor = data.grade === 'A' ? '#22c55e' : data.grade === 'B' ? '#3b82f6' : data.grade === 'C' ? '#eab308' : '#ef4444';

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px;">
              <div>
                <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">RFC 9116 Policy Status</div>
                <div style="font-size:18px;font-weight:800;color:${data.found ? '#22c55e' : '#ef4444'};">
                  ${data.found ? '✓ security.txt Discovered' : '✗ No security.txt Found'}
                </div>
                ${data.foundPath ? `<div style="font-size:11px;font-family:monospace;color:var(--muted,#888);">${esc(data.foundPath)}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Compliance Grade</div>
                <div style="font-size:28px;font-weight:900;color:${gradeColor};">${data.grade} (${data.score}/100)</div>
              </div>
            </div>

            ${data.warnings && data.warnings.length > 0 ? `
              <div style="margin-bottom:12px;">
                <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Warnings & Deficiencies:</div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  ${data.warnings.map(w => `<div style="font-size:12px;color:#eab308;">⚠ ${esc(w)}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            ${data.rawContent ? `
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Raw security.txt Content</div>
                <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:#fff;font-family:monospace;font-size:11px;margin:0;max-height:220px;overflow-y:auto;">${esc(data.rawContent)}</pre>
              </div>
            ` : ''}
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h3 style="font-size:14px;font-weight:700;margin:0;">RFC 9116 Compliant Template</h3>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="navigator.clipboard.writeText(document.getElementById('secTxtTemplateCode').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
                Copy
              </button>
            </div>
            <pre id="secTxtTemplateCode" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:260px;overflow-y:auto;">${esc(data.rfc9116Template)}</pre>
            <div style="font-size:11px;color:var(--muted,#888);margin-top:10px;">
              💡 Deploy this file to <code>/.well-known/security.txt</code> on your domain to provide ethical security researchers with clear vulnerability disclosure channels.
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Security.txt Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 24. DKIM, SPF & DMARC EMAIL SECURITY AUDITOR STUDIO
  // =========================================================================
  window.renderEmailSecStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>📧</span> DKIM, SPF & DMARC Email Security Record Auditor
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Inspect DNS authentication records, detect email spoofing and phishing vulnerabilities, and generate compliant Cloudflare DNS policies.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('dohbench')">
            <span>🌐</span> DoH Resolvers
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;">
            <input type="text" id="emailSecDomain" value="cloudflare.com" placeholder="Domain name (e.g. cloudflare.com or yourcompany.com)"
              style="padding:12px 16px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:14px;"
              onkeydown="if(event.key==='Enter') window.auditEmailSecurity();" />
            <button class="btn btn-primary" onclick="window.auditEmailSecurity()" style="padding:12px 24px;font-weight:700;">
              <span>⚡</span> Audit Email Security
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Quick audit:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('emailSecDomain').value='cloudflare.com';window.auditEmailSecurity();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('emailSecDomain').value='github.com';window.auditEmailSecurity();">github.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('emailSecDomain').value='google.com';window.auditEmailSecurity();">google.com</button>
          </div>
        </div>

        <div id="emailSecResultsContainer">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;
    window.auditEmailSecurity();
  };

  window.auditEmailSecurity = async function() {
    const domain = document.getElementById('emailSecDomain')?.value.trim() || 'cloudflare.com';
    const container = document.getElementById('emailSecResultsContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Querying DNS TXT records for SPF and DMARC on ${esc(domain)}...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/email-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const gradeColor = data.score >= 90 ? '#22c55e' : data.score >= 70 ? '#3b82f6' : data.score >= 50 ? '#eab308' : '#ef4444';

      container.innerHTML = `
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Anti-Spoofing & Phishing Resistance</div>
            <div style="font-size:20px;font-weight:800;color:#fff;margin-top:2px;">Domain: ${esc(data.domain)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Overall Grade</div>
            <div style="font-size:32px;font-weight:900;color:${gradeColor};">${data.grade} (${data.score}/100)</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <!-- SPF Card -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h3 style="font-size:15px;font-weight:700;margin:0;">SPF (Sender Policy Framework)</h3>
              <span class="badge" style="background:${data.spf.present ? '#22c55e20' : '#ef444420'};color:${data.spf.present ? '#22c55e' : '#ef4444'};border:1px solid currentColor;">
                ${data.spf.present ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            <div style="font-size:12px;color:var(--muted,#888);margin-bottom:4px;">Enforcement Policy:</div>
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:12px;">${esc(data.spf.policy)}</div>

            ${data.spf.record ? `
              <div style="font-size:11px;color:var(--muted,#888);margin-bottom:4px;">Raw SPF TXT Record:</div>
              <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:6px;padding:10px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0 0 12px 0;word-break:break-all;">${esc(data.spf.record)}</pre>
            ` : ''}

            ${data.spf.warnings.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:4px;">
                ${data.spf.warnings.map(w => `<div style="font-size:12px;color:#eab308;">⚠ ${esc(w)}</div>`).join('')}
              </div>
            ` : '<div style="font-size:12px;color:#22c55e;">✓ Strict hardfail policy active. Unauthorized sender IPs rejected.</div>'}
          </div>

          <!-- DMARC Card -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h3 style="font-size:15px;font-weight:700;margin:0;">DMARC Policy Enforcement</h3>
              <span class="badge" style="background:${data.dmarc.present ? '#22c55e20' : '#ef444420'};color:${data.dmarc.present ? '#22c55e' : '#ef4444'};border:1px solid currentColor;">
                ${data.dmarc.present ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            <div style="font-size:12px;color:var(--muted,#888);margin-bottom:4px;">Receiver Action:</div>
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:12px;">${esc(data.dmarc.policy)}</div>

            ${data.dmarc.record ? `
              <div style="font-size:11px;color:var(--muted,#888);margin-bottom:4px;">Raw _dmarc TXT Record:</div>
              <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:6px;padding:10px;color:#06b6d4;font-family:monospace;font-size:11px;margin:0 0 12px 0;word-break:break-all;">${esc(data.dmarc.record)}</pre>
            ` : ''}

            ${data.dmarc.warnings.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:4px;">
                ${data.dmarc.warnings.map(w => `<div style="font-size:12px;color:#eab308;">⚠ ${esc(w)}</div>`).join('')}
              </div>
            ` : '<div style="font-size:12px;color:#22c55e;">✓ Strict p=reject policy active. Spoofed messages automatically rejected.</div>'}
          </div>
        </div>

        <!-- Recommended Cloudflare DNS Records -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">Cloudflare Hardened DNS Security Templates</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Recommended SPF Record (@)</div>
              <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:4px;padding:8px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;">${esc(data.suggestedDns.spf.value)}</pre>
            </div>
            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Recommended DMARC Record (_dmarc)</div>
              <pre style="background:#0d0d12;border:1px solid var(--border);border-radius:4px;padding:8px;color:#06b6d4;font-family:monospace;font-size:11px;margin:0;">${esc(data.suggestedDns.dmarc.value)}</pre>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Audit Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 25. CLOUDFLARE ZERO TRUST ACCESS & POLICY ARCHITECT
  // =========================================================================
  window.renderZeroTrustStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🛡️</span> Cloudflare Zero Trust Access & Service Token Policy Architect
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Architect Cloudflare Access application policies, test identity-based and service token rules, and export Terraform resources.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('wafsim')">
            <span>🛡️</span> Edge WAF
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Policy Configuration -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Zero Trust Application Rules</h2>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Application Name</label>
              <input type="text" id="ztAppName" value="Production Vault API" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" />
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Protected Hostname</label>
              <input type="text" id="ztDomain" value="vault-api.internal.company.com" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:var(--accent,#7c6af7);font-family:monospace;margin-top:4px;" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Session Duration</label>
                <select id="ztSession" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;">
                  <option value="15m">15 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="24h" selected>24 Hours</option>
                  <option value="7d">7 Days</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Authentication Type</label>
                <select id="ztAuthType" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;"
                  onchange="document.getElementById('ztTokenSec').style.display = this.value === 'service' ? 'block' : 'none';">
                  <option value="identity" selected>IdP / Email Identity</option>
                  <option value="service">Service Auth Token (M2M)</option>
                </select>
              </div>
            </div>

            <div id="ztTokenSec" style="display:none;margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Service Token ID</label>
              <input type="text" id="ztServiceTokenId" value="cf-token-sec-98124" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#06b6d4;font-family:monospace;margin-top:4px;" />
            </div>

            <div style="margin-bottom:16px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Allowed Email Domain</label>
              <input type="text" id="ztAllowedDomain" value="company.com" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
            </div>

            <h3 style="font-size:14px;font-weight:700;margin:0 0 10px 0;border-top:1px solid var(--border);padding-top:12px;">Simulated Client Request</h3>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Client Email</label>
                <input type="text" id="ztClientEmail" value="engineer@company.com" style="width:100%;padding:8px 10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:12px;margin-top:4px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Client Geo Country</label>
                <input type="text" id="ztClientCountry" value="US" style="width:100%;padding:8px 10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:6px;color:#fff;font-size:12px;margin-top:4px;" />
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.evaluateZeroTrustAccess()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Evaluate Access Decision
            </button>
          </div>

          <!-- Right: Evaluation Result & Terraform -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="ztResultsContainer">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>
    `;
    window.evaluateZeroTrustAccess();
  };

  window.evaluateZeroTrustAccess = async function() {
    const appName = document.getElementById('ztAppName')?.value || 'Production Vault API';
    const domain = document.getElementById('ztDomain')?.value || 'vault-api.internal.company.com';
    const sessionDuration = document.getElementById('ztSession')?.value || '24h';
    const authType = document.getElementById('ztAuthType')?.value || 'identity';
    const allowedDomain = document.getElementById('ztAllowedDomain')?.value || 'company.com';
    const serviceTokenId = document.getElementById('ztServiceTokenId')?.value || 'cf-token-sec-98124';
    const clientEmail = document.getElementById('ztClientEmail')?.value || 'engineer@company.com';
    const clientCountry = document.getElementById('ztClientCountry')?.value || 'US';

    const container = document.getElementById('ztResultsContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/cloudflare/zero-trust-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          domain,
          sessionDuration,
          allowedDomains: [allowedDomain],
          allowedCountries: ['US', 'CA', 'GB', 'DE'],
          requireServiceToken: authType === 'service',
          serviceTokenId,
          mockRequest: {
            email: clientEmail,
            country: clientCountry,
            serviceTokenHeader: authType === 'service' ? serviceTokenId : ''
          }
        })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const isGranted = data.granted;
      const statusColor = isGranted ? '#22c55e' : '#ef4444';

      container.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Access Decision</div>
          <div style="font-size:22px;font-weight:900;color:${statusColor};margin-top:4px;">
            ${isGranted ? '✓ ACCESS GRANTED' : '🛡️ ACCESS DENIED'}
          </div>
          <div style="font-size:13px;color:#ddd;margin-top:6px;background:var(--surface2,#242434);padding:10px;border-radius:6px;border-left:3px solid ${statusColor};">
            ${esc(data.reason)}
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Terraform cloudflare_access Resource</label>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
              onclick="navigator.clipboard.writeText(document.getElementById('tfAccessCode').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy',1500);">
              Copy
            </button>
          </div>
          <pre id="tfAccessCode" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:260px;overflow-y:auto;">${esc(data.terraformCode)}</pre>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">Evaluation Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 26. HTTP/2 & HTTP/3 EDGE PROTOCOL & ALPN HANDSHAKE PROBER
  // =========================================================================
  window.renderHttpProbeStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>⚡</span> HTTP/2 & HTTP/3 Edge Protocol & ALPN Handshake Prober
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Probe target domains for HTTP/3 QUIC support, HTTP/2 ALPN negotiation, Alt-Svc headers, and edge latency.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('tlsinspect')">
            <span>🔒</span> TLS Cipher
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;">
            <input type="text" id="httpProbeDomain" value="cloudflare.com" placeholder="Domain name (e.g. cloudflare.com or google.com)"
              style="padding:12px 16px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:14px;"
              onkeydown="if(event.key==='Enter') window.probeHttpProtocols();" />
            <button class="btn btn-primary" onclick="window.probeHttpProtocols()" style="padding:12px 24px;font-weight:700;">
              <span>⚡</span> Probe Edge Protocols
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Test Presets:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('httpProbeDomain').value='cloudflare.com';window.probeHttpProtocols();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('httpProbeDomain').value='google.com';window.probeHttpProtocols();">google.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('httpProbeDomain').value='github.com';window.probeHttpProtocols();">github.com</button>
          </div>
        </div>

        <div id="httpProbeResultsContainer">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;
    window.probeHttpProtocols();
  };

  window.probeHttpProtocols = async function() {
    const domain = document.getElementById('httpProbeDomain')?.value.trim() || 'cloudflare.com';
    const container = document.getElementById('httpProbeResultsContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Connecting and inspecting ALPN protocols for ${esc(domain)}...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/network/http-protocol-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">HTTP/3 (QUIC)</div>
            <div style="font-size:24px;font-weight:900;color:${data.protocols.http3Quic ? '#22c55e' : '#eab308'};margin-top:6px;">
              ${data.protocols.http3Quic ? '✓ Supported' : '○ Not Advertised'}
            </div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">HTTP/2 Multiplexing</div>
            <div style="font-size:24px;font-weight:900;color:#22c55e;margin-top:6px;">
              ✓ Active
            </div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Edge Response Time</div>
            <div style="font-size:24px;font-weight:900;color:#06b6d4;margin-top:6px;">
              ${data.latencyMs} ms
            </div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Cloudflare Edge</div>
            <div style="font-size:24px;font-weight:900;color:${data.isCloudflareEdge ? '#f59e0b' : '#aaa'};margin-top:6px;">
              ${data.isCloudflareEdge ? '✓ Edge CDN' : 'Origin Direct'}
            </div>
          </div>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">Edge Protocol Telemetry</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
              <span style="font-size:12px;color:var(--muted,#888);">Server Header:</span>
              <span style="font-size:12px;font-family:monospace;color:#fff;">${esc(data.serverHeader)}</span>
            </div>
            ${data.cfRay ? `
              <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
                <span style="font-size:12px;color:var(--muted,#888);">Cloudflare CF-Ray:</span>
                <span style="font-size:12px;font-family:monospace;color:#f59e0b;">${esc(data.cfRay)}</span>
              </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;">
              <span style="font-size:12px;color:var(--muted,#888);">Alt-Svc Protocol Header:</span>
              <span style="font-size:12px;font-family:monospace;color:var(--accent,#7c6af7);word-break:break-all;">${esc(data.protocols.altSvcRaw)}</span>
            </div>
          </div>
          <div style="margin-top:12px;font-size:13px;color:#22c55e;">
            ${esc(data.summary)}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Probe Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 27. REGEX & EDGE URL ROUTE BENCHMARK & REDOS DETECTOR
  // =========================================================================
  window.renderRegexBenchStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🧩</span> Regex & Edge URL Route Pattern Benchmark & ReDoS Detector
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Benchmark regular expressions used in Cloudflare Workers and detect catastrophic backtracking (ReDoS) vulnerabilities.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('edgeworker')">
            <span>⚡</span> Edge Workers
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Test Presets:</span>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('regPattern').value='^/api/v[0-9]+/(users|orders)/([a-zA-Z0-9_-]+)$';document.getElementById('regInput').value='/api/v2/users/usr_98124_alpha';window.benchmarkRegex();">
            Standard REST Route (Safe)
          </button>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 10px;border-radius:6px;"
            onclick="document.getElementById('regPattern').value='(a+)+$';document.getElementById('regInput').value='aaaaaaaaaaaaaaaaaaaaaaaaX';window.benchmarkRegex();">
            Catastrophic Backtracking (ReDoS)
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Expression & Input</h2>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Regular Expression Pattern</label>
              <input type="text" id="regPattern" value="^/api/v[0-9]+/(users|orders)/([a-zA-Z0-9_-]+)$" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:var(--accent,#7c6af7);font-family:monospace;margin-top:4px;" />
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Test Input String</label>
              <input type="text" id="regInput" value="/api/v2/users/usr_98124_alpha" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Flags</label>
                <input type="text" id="regFlags" value="i" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Benchmark Iterations</label>
                <input type="number" id="regIters" value="10000" min="100" max="50000" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" />
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.benchmarkRegex()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Benchmark & Scan ReDoS
            </button>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="regResultsContainer">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>
    `;
    window.benchmarkRegex();
  };

  window.benchmarkRegex = async function() {
    const pattern = document.getElementById('regPattern')?.value || '^/api/v[0-9]+/(users|orders)/([a-zA-Z0-9_-]+)$';
    const flags = document.getElementById('regFlags')?.value || 'i';
    const testString = document.getElementById('regInput')?.value || '/api/v2/users/usr_98124_alpha';
    const iterations = parseInt(document.getElementById('regIters')?.value || '10000', 10);

    const container = document.getElementById('regResultsContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/tools/regex-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, flags, testString, iterations })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const riskColor = data.redosRisk === 'LOW' ? '#22c55e' : data.redosRisk === 'MODERATE' ? '#eab308' : '#ef4444';

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:10px;">
          <div>
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Match Result</div>
            <div style="font-size:18px;font-weight:800;color:${data.matches ? '#22c55e' : '#ef4444'};">
              ${data.matches ? '✓ String Matched' : '✗ No Match'}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">ReDoS Vulnerability Risk</div>
            <div style="font-size:18px;font-weight:900;color:${riskColor};">${data.redosRisk}</div>
          </div>
        </div>

        ${data.redosWarnings.length > 0 ? `
          <div style="background:#ef444415;border:1px solid #ef4444;border-radius:6px;padding:10px;margin-bottom:16px;">
            ${data.redosWarnings.map(w => `<div style="font-size:12px;color:#ef4444;font-weight:600;">⚠ ${esc(w)}</div>`).join('')}
          </div>
        ` : ''}

        <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:8px;">Benchmark Performance (${data.iterations.toLocaleString()} runs)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
            <div style="background:#0d0d12;padding:8px;border-radius:6px;">
              <div style="font-size:10px;color:var(--muted,#888);">Total Time</div>
              <div style="font-size:14px;font-weight:700;color:#fff;">${data.totalDurationMs} ms</div>
            </div>
            <div style="background:#0d0d12;padding:8px;border-radius:6px;">
              <div style="font-size:10px;color:var(--muted,#888);">Average Time</div>
              <div style="font-size:14px;font-weight:700;color:#06b6d4;">${data.avgDurationUs} µs</div>
            </div>
            <div style="background:#0d0d12;padding:8px;border-radius:6px;">
              <div style="font-size:10px;color:var(--muted,#888);">Throughput</div>
              <div style="font-size:14px;font-weight:700;color:#22c55e;">${data.opsPerSecond.toLocaleString()} op/s</div>
            </div>
          </div>
        </div>

        ${data.capturedGroups && data.capturedGroups.length > 0 ? `
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:6px;">Captured Groups</div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              ${data.capturedGroups.map((g, idx) => `
                <div style="font-family:monospace;font-size:11px;background:#0d0d12;padding:6px 10px;border-radius:4px;color:var(--accent,#7c6af7);">
                  Group $${idx + 1}: "${esc(g)}"
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">Benchmark Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 28. EDGE CUSTOM ERROR PAGE & MAINTENANCE MODE STUDIO
  // =========================================================================
  window.renderErrorPagesStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🛑</span> Edge Custom Error Page & Maintenance Mode Studio
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Architect branded Cloudflare custom error pages for 500/502/504 origins and 1000-series edge blocks with dynamic ::RAY_ID:: tokens.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('wafsim')">
            <span>🛡️</span> WAF Rules
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Controls -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Error Page Parameters</h2>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Error Status Code</label>
              <select id="errCodeSelect" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" onchange="window.generateErrorPage();">
                <option value="502" selected>502 Bad Gateway (Origin Down)</option>
                <option value="500">500 Internal Server Error</option>
                <option value="503">503 Service Maintenance</option>
                <option value="504">504 Gateway Timeout</option>
                <option value="521">521 Web Server Is Down (Cloudflare)</option>
                <option value="1015">1015 Rate Limited (Cloudflare Edge)</option>
                <option value="1020">1020 Access Denied (Cloudflare WAF)</option>
              </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Company Brand Name</label>
                <input type="text" id="errBrandName" value="Vault Security Corp" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" oninput="window.generateErrorPage();" />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Brand Color</label>
                <input type="color" id="errBrandColor" value="#7c6af7" style="width:100%;height:42px;padding:2px 4px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;margin-top:4px;cursor:pointer;" onchange="window.generateErrorPage();" />
              </div>
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Support Email</label>
              <input type="email" id="errSupportEmail" value="ops@vaultcorp.internal" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" oninput="window.generateErrorPage();" />
            </div>

            <div style="margin-bottom:16px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">User Explanatory Message</label>
              <textarea id="errCustomMsg" rows="3" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:sans-serif;font-size:13px;margin-top:4px;" oninput="window.generateErrorPage();">Our edge servers are temporarily experiencing technical difficulties. Our engineering operations team has been notified and is investigating.</textarea>
            </div>

            <div style="display:flex;gap:10px;">
              <button class="btn btn-primary" onclick="window.generateErrorPage()" style="flex:1;padding:10px;font-weight:700;">
                <span>⚡</span> Refresh Code
              </button>
            </div>
          </div>

          <!-- Preview & Export -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="errOutputContainer">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>
    `;
    window.generateErrorPage();
  };

  window.generateErrorPage = async function() {
    const errorCode = document.getElementById('errCodeSelect')?.value || '502';
    const companyName = document.getElementById('errBrandName')?.value || 'Vault Security Corp';
    const brandColor = document.getElementById('errBrandColor')?.value || '#7c6af7';
    const supportEmail = document.getElementById('errSupportEmail')?.value || 'ops@vaultcorp.internal';
    const customMessage = document.getElementById('errCustomMsg')?.value || 'Origin server unreachable';

    const container = document.getElementById('errOutputContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/cloudflare/custom-error-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorCode, companyName, brandColor, supportEmail, customMessage })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Replace Cloudflare token placeholders for the preview iframe
      const previewHtml = data.htmlPage
        .replace(/::RAY_ID::/g, '8cf931b92e8c2014-SIN')
        .replace(/::CLIENT_IP::/g, '198.51.100.42')
        .replace(/::GEO::/g, 'US, San Francisco');

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:15px;font-weight:700;margin:0;">Live Branded Preview</h3>
          <div style="display:flex;gap:8px;">
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 8px;border-radius:4px;"
              onclick="navigator.clipboard.writeText(document.getElementById('rawHtmlArea').value);this.innerText='Copied HTML!';setTimeout(()=>this.innerText='Copy HTML',1500);">
              Copy HTML
            </button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 8px;border-radius:4px;"
              onclick="navigator.clipboard.writeText(document.getElementById('workerErrCode').innerText);this.innerText='Copied Worker!';setTimeout(()=>this.innerText='Copy Worker',1500);">
              Copy Worker
            </button>
          </div>
        </div>

        <iframe srcdoc="${esc(previewHtml)}" style="width:100%;height:250px;border:1px solid var(--border);border-radius:8px;background:#0d0d12;margin-bottom:16px;"></iframe>

        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Cloudflare Worker Error Interceptor</div>
          <pre id="workerErrCode" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:160px;overflow-y:auto;">${esc(data.workerSnippet)}</pre>
        </div>

        <textarea id="rawHtmlArea" style="display:none;">${esc(data.htmlPage)}</textarea>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">Generation Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 29. CORS (CROSS-ORIGIN RESOURCE SHARING) POLICY AUDITOR STUDIO
  // =========================================================================
  window.renderCorsAuditorStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🌐</span> CORS Edge Policy Auditor & Preflight Simulator
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Audit target endpoints for hazardous CORS configurations (wildcard origins with credentials, reflective headers) and generate secure edge middleware.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('jwtstudio')">
            <span>🎟️</span> JWT Inspector
          </button>
        </div>

        <div style="grid-template-columns:1fr 1fr;display:grid;gap:20px;">
          <!-- Controls -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Target Endpoint or Custom Policy</h2>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Live API Target URL (Optional Preflight Probe)</label>
              <input type="text" id="corsTargetUrl" placeholder="https://api.example.com/v1/auth" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;margin-top:4px;" />
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Simulated Origin Header</label>
              <input type="text" id="corsTestOrigin" value="https://malicious-attacker.com" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#ef4444;font-family:monospace;margin-top:4px;" />
            </div>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Allowed Whitelist Origins (Comma separated)</label>
              <input type="text" id="corsAllowedOrigins" value="https://app.company.com, https://admin.company.com" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:var(--accent,#7c6af7);font-family:monospace;margin-top:4px;" />
            </div>

            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <input type="checkbox" id="corsCredentials" checked style="width:18px;height:18px;cursor:pointer;" />
              <label for="corsCredentials" style="font-size:13px;color:#ddd;cursor:pointer;">Allow Credentials (cookies / HTTP auth headers)</label>
            </div>

            <button class="btn btn-primary" onclick="window.auditCorsSecurity()" style="width:100%;padding:12px;font-weight:700;">
              <span>⚡</span> Audit CORS Security & Generate Middleware
            </button>
          </div>

          <!-- Results -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="corsResultsContainer">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>
    `;
    window.auditCorsSecurity();
  };

  window.auditCorsSecurity = async function() {
    const targetUrl = document.getElementById('corsTargetUrl')?.value.trim() || '';
    const testOrigin = document.getElementById('corsTestOrigin')?.value.trim() || 'https://malicious-attacker.com';
    const allowedOrigins = (document.getElementById('corsAllowedOrigins')?.value || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const allowCredentials = document.getElementById('corsCredentials')?.checked ?? true;

    const container = document.getElementById('corsResultsContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/security/cors-auditor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, testOrigin, allowedOrigins, allowCredentials })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Security Assessment</div>
            <div style="font-size:20px;font-weight:800;color:${data.isSecure ? '#22c55e' : '#ef4444'};margin-top:2px;">
              ${data.isSecure ? '✓ SAFE CONFIGURATION' : '⚠ VULNERABILITIES DETECTED'}
            </div>
          </div>
          <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:4px 8px;border-radius:4px;"
            onclick="navigator.clipboard.writeText(document.getElementById('corsMiddlewareCode').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy Middleware',1500);">
            Copy Middleware
          </button>
        </div>

        ${data.vulnerabilities.length > 0 ? `
          <div style="background:#ef444415;border:1px solid #ef4444;border-radius:8px;padding:12px;margin-bottom:14px;display:flex;flex-direction:column;gap:6px;">
            ${data.vulnerabilities.map(v => `<div style="font-size:12px;color:#ef4444;font-weight:600;">⚠ ${esc(v)}</div>`).join('')}
          </div>
        ` : `
          <div style="background:#22c55e15;border:1px solid #22c55e;border-radius:8px;padding:12px;margin-bottom:14px;font-size:12px;color:#22c55e;">
            ✓ Strict whitelist origin verification enforced. Wildcards and arbitrary reflection blocked.
          </div>
        `}

        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;margin-bottom:6px;">Hardened Cloudflare Worker Middleware</div>
          <pre id="corsMiddlewareCode" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--accent,#7c6af7);font-family:monospace;font-size:11px;margin:0;max-height:260px;overflow-y:auto;">${esc(data.workerCorsCode)}</pre>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">Auditor Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 30. CLOUDFLARE CACHE-TAG & SURROGATE-KEY HEADER ARCHITECT STUDIO
  // =========================================================================
  window.renderCacheTagsStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🏷️</span> Cloudflare Cache-Tag & Surrogate-Key Header Architect
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Design granular edge surrogate key caching strategies, calculate header size limits, and generate 1-click purge API payloads.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('cachestudio')">
            <span>⚡</span> Cache Purge
          </button>
        </div>

        <div style="grid-template-columns:1fr 1fr;display:grid;gap:20px;">
          <!-- Left: Input tags -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 16px 0;">Tag Configuration</h2>

            <div style="margin-bottom:12px;">
              <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Cache Tags (Comma-separated)</label>
              <textarea id="cacheTagsInput" rows="3" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:12px;margin-top:4px;" oninput="window.calculateCacheTags();">prod:1094, cat:electronics, brand:apple, status:in-stock, region:us-east</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Edge TTL (CDN-Cache-Control)</label>
                <select id="tagEdgeTtl" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" onchange="window.calculateCacheTags();">
                  <option value="3600">1 Hour (3,600s)</option>
                  <option value="86400" selected>1 Day (86,400s)</option>
                  <option value="604800">1 Week (604,800s)</option>
                  <option value="2592000">30 Days (2,592,000s)</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Browser TTL (Cache-Control)</label>
                <select id="tagBrowserTtl" style="width:100%;padding:10px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;margin-top:4px;" onchange="window.calculateCacheTags();">
                  <option value="0">No Browser Cache (0s)</option>
                  <option value="300">5 Minutes (300s)</option>
                  <option value="3600" selected>1 Hour (3,600s)</option>
                  <option value="86400">1 Day (86,400s)</option>
                </select>
              </div>
            </div>

            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
              <span style="font-size:11px;color:var(--muted,#888);">Tag Presets:</span>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="document.getElementById('cacheTagsInput').value='article:8921, author:alec, section:tech, trending';window.calculateCacheTags();">News / Blog</button>
              <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
                onclick="document.getElementById('cacheTagsInput').value='sku:9810, vendor:dell, cat:laptops, inventory:high';window.calculateCacheTags();">E-Commerce SKU</button>
            </div>
          </div>

          <!-- Right: Output headers and purge snippet -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <div id="cacheTagsOutputContainer">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>
    `;
    window.calculateCacheTags();
  };

  window.calculateCacheTags = async function() {
    const rawTags = document.getElementById('cacheTagsInput')?.value || '';
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
    const edgeMaxAge = parseInt(document.getElementById('tagEdgeTtl')?.value || '86400', 10);
    const browserMaxAge = parseInt(document.getElementById('tagBrowserTtl')?.value || '3600', 10);

    const container = document.getElementById('cacheTagsOutputContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/cloudflare/cache-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags, edgeMaxAge, browserMaxAge })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Header Size & Validation</div>
            <div style="font-size:16px;font-weight:800;color:${data.isValid ? '#22c55e' : '#ef4444'};">
              ${data.headerSizeBytes} bytes / 16,384 bytes (${data.totalTags} tags)
            </div>
          </div>
          <span class="badge" style="background:#22c55e20;color:#22c55e;border:1px solid currentColor;">
            ✓ RFC 7234 Compliant
          </span>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
          <div style="background:var(--surface2,#242434);padding:8px 10px;border-radius:6px;">
            <div style="font-size:10px;color:var(--muted,#888);text-transform:uppercase;">Cache-Tag (Cloudflare Enterprise / Business)</div>
            <div style="font-family:monospace;font-size:11px;color:var(--accent,#7c6af7);word-break:break-all;">${esc(data.headers['Cache-Tag'])}</div>
          </div>
          <div style="background:var(--surface2,#242434);padding:8px 10px;border-radius:6px;">
            <div style="font-size:10px;color:var(--muted,#888);text-transform:uppercase;">Surrogate-Key (Fastly / RFC Caching)</div>
            <div style="font-family:monospace;font-size:11px;color:#06b6d4;word-break:break-all;">${esc(data.headers['Surrogate-Key'])}</div>
          </div>
          <div style="background:var(--surface2,#242434);padding:8px 10px;border-radius:6px;">
            <div style="font-size:10px;color:var(--muted,#888);text-transform:uppercase;">CDN-Cache-Control</div>
            <div style="font-family:monospace;font-size:11px;color:#fff;">${esc(data.headers['CDN-Cache-Control'])}</div>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:11px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Cloudflare Purge by Tag API</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:2px 8px;border-radius:4px;"
              onclick="navigator.clipboard.writeText(document.getElementById('purgeCurlCmd').innerText);this.innerText='Copied!';setTimeout(()=>this.innerText='Copy cURL',1500);">
              Copy cURL
            </button>
          </div>
          <pre id="purgeCurlCmd" style="background:#0d0d12;border:1px solid var(--border);border-radius:8px;padding:10px;color:#fff;font-family:monospace;font-size:11px;margin:0;max-height:120px;overflow-y:auto;">${esc(data.purgeCurlCommand)}</pre>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:16px;">Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 31. BGP LOOKING GLASS & EDGE ANYCAST ROUTE INSPECTOR STUDIO
  // =========================================================================
  window.renderBgpRouteStudio = function() {
    const main = document.querySelector('main') || document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="font-size:26px;font-weight:700;display:flex;align-items:center;gap:10px;margin:0;">
              <span>🗺️</span> BGP Looking Glass & Edge Anycast Route Inspector
            </h1>
            <p style="color:var(--muted,#888);font-size:14px;margin:4px 0 0 0;">
              Trace Anycast routing, locate Cloudflare edge PoP datacenters via IATA airport codes, and inspect DNS A/AAAA records.
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.switchTab('httpprobe')">
            <span>⚡</span> HTTP/3 ALPN
          </button>
        </div>

        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;">
            <input type="text" id="bgpHostInput" value="cloudflare.com" placeholder="Hostname or IP (e.g. cloudflare.com, 1.1.1.1, github.com)"
              style="padding:12px 16px;background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;color:#fff;font-family:monospace;font-size:14px;"
              onkeydown="if(event.key==='Enter') window.inspectBgpRoute();" />
            <button class="btn btn-primary" onclick="window.inspectBgpRoute()" style="padding:12px 24px;font-weight:700;">
              <span>⚡</span> Inspect Anycast Route
            </button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted,#888);">Quick Probes:</span>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('bgpHostInput').value='cloudflare.com';window.inspectBgpRoute();">cloudflare.com</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('bgpHostInput').value='1.1.1.1';window.inspectBgpRoute();">1.1.1.1 (Cloudflare DNS)</button>
            <button class="badge" style="cursor:pointer;background:var(--surface2,#242434);border:1px solid var(--border);color:#ddd;padding:3px 8px;border-radius:4px;"
              onclick="document.getElementById('bgpHostInput').value='google.com';window.inspectBgpRoute();">google.com</button>
          </div>
        </div>

        <div id="bgpRouteOutputContainer">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;
    window.inspectBgpRoute();
  };

  window.inspectBgpRoute = async function() {
    const host = document.getElementById('bgpHostInput')?.value.trim() || 'cloudflare.com';
    const container = document.getElementById('bgpRouteOutputContainer');
    if (!container) return;

    container.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">
        <div class="spinner" style="margin:0 auto 16px auto;"></div>
        <div style="font-size:15px;color:#fff;font-weight:600;">Resolving Anycast PoP datacenter for ${esc(host)}...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/network/bgp-route-inspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Edge PoP Datacenter</div>
            <div style="font-size:26px;font-weight:900;color:var(--accent,#7c6af7);margin-top:6px;">
              ${esc(data.colo)}
            </div>
            <div style="font-size:11px;color:#aaa;margin-top:2px;">${esc(data.coloLocation)}</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Network Architecture</div>
            <div style="font-size:24px;font-weight:900;color:#22c55e;margin-top:6px;">
              ✓ BGP Anycast
            </div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Round-Trip Latency</div>
            <div style="font-size:24px;font-weight:900;color:#06b6d4;margin-top:6px;">
              ${data.latencyMs} ms
            </div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Edge Server Signature</div>
            <div style="font-size:20px;font-weight:800;color:#fff;margin-top:6px;">
              ${esc(data.edgeServer)}
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h3 style="font-size:15px;font-weight:700;margin:0 0 10px 0;">IPv4 Anycast Endpoints (A Records)</h3>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${data.aRecords.map(ip => `
                <div style="font-family:monospace;font-size:12px;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;color:#fff;">
                  ${esc(ip)}
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
            <h3 style="font-size:15px;font-weight:700;margin:0 0 10px 0;">IPv6 Anycast Endpoints (AAAA Records)</h3>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${data.aaaaRecords.length > 0 ? data.aaaaRecords.map(ip => `
                <div style="font-family:monospace;font-size:12px;background:var(--surface2,#242434);padding:8px 12px;border-radius:6px;color:var(--accent,#7c6af7);">
                  ${esc(ip)}
                </div>
              `).join('') : '<div style="color:var(--muted,#888);font-size:12px;">No AAAA records returned</div>'}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Inspection Error: ${esc(err.message)}</div>`;
    }
  };

  // =========================================================================
  // 32. CLOUDFLARE QUEUES & DEAD-LETTER QUEUE (DLQ) PIPELINE STUDIO
  // =========================================================================

  window.renderQueuesDlqStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">📬</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Cloudflare Queues & DLQ Pipeline Studio</h1>
              <span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);font-size:11px;">Async Messaging</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Architect reliable asynchronous message pipelines with batching, exponential backoff retries, and dead-letter queue routing. Export production <code style="color:var(--accent,#7c6af7);">wrangler.jsonc</code> bindings and consumer handlers.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column: Settings & Messages -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>⚙️</span> Queue & Retry Policy
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Primary Queue Name</label>
              <input type="text" id="dlqQueueName" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="order-events-queue" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Dead-Letter Queue (DLQ) Name</label>
              <input type="text" id="dlqNameInput" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="order-events-dlq" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Max Batch Size</label>
                <input type="number" id="dlqBatchSize" class="form-input" style="width:100%;font-size:13px;" value="10" min="1" max="100" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Max Batch Timeout (s)</label>
                <input type="number" id="dlqBatchTimeout" class="form-input" style="width:100%;font-size:13px;" value="5" min="0" max="30" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Max Retries (DLQ Drop)</label>
                <input type="number" id="dlqMaxRetries" class="form-input" style="width:100%;font-size:13px;" value="3" min="0" max="20" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Retry Delay (s)</label>
                <input type="number" id="dlqRetryDelay" class="form-input" style="width:100%;font-size:13px;" value="10" min="1" max="300" />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Simulated Failure Rate</label>
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="range" id="dlqFailRate" min="0" max="100" value="33" style="flex:1;" oninput="document.getElementById('dlqFailRateVal').textContent = this.value + '%'" />
                <span id="dlqFailRateVal" style="font-size:13px;font-weight:700;color:#f59e0b;min-width:40px;">33%</span>
              </div>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);">Sample Message Batch (JSON Array)</label>
                <button class="btn btn-secondary" style="font-size:11px;padding:2px 8px;" onclick="window.resetQueuesSampleData()">Reset Sample</button>
              </div>
              <textarea id="dlqSamplePayloads" class="form-input" rows="7" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">[
  { "id": "evt-101", "type": "checkout.completed", "amount": 89.50, "customer": "alex@corp.io" },
  { "id": "evt-102", "type": "payment.processed", "invoiceId": "INV-4921", "status": "approved" },
  { "id": "evt-103", "type": "inventory.decrement", "sku": "SKU-9941", "warehouse": "us-east-1" },
  { "id": "evt-104", "type": "email.receipt", "recipient": "alex@corp.io", "priority": "high" },
  { "id": "evt-105", "type": "erp.sync", "endpoint": "https://erp.internal.corp/sync" },
  { "id": "evt-106", "type": "loyalty.points", "userId": "usr_9981", "points": 150 }
]</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.simulateQueuePipeline()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🚀</span> Run Queue & DLQ Simulation
            </button>
          </div>

          <!-- Right Column: Results & Code Generation -->
          <div id="dlqResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">📬</span>
              Click <strong>"Run Queue & DLQ Simulation"</strong> to execute batch consumer processing, test retry backoff, and view generated Worker scripts.
            </div>
          </div>
        </div>
      </div>
    `;

    // Auto-run first simulation
    window.simulateQueuePipeline();
  };

  window.resetQueuesSampleData = function() {
    const el = document.getElementById('dlqSamplePayloads');
    if (el) {
      el.value = `[\n  { "id": "evt-101", "type": "checkout.completed", "amount": 89.50, "customer": "alex@corp.io" },\n  { "id": "evt-102", "type": "payment.processed", "invoiceId": "INV-4921", "status": "approved" },\n  { "id": "evt-103", "type": "inventory.decrement", "sku": "SKU-9941", "warehouse": "us-east-1" },\n  { "id": "evt-104", "type": "email.receipt", "recipient": "alex@corp.io", "priority": "high" },\n  { "id": "evt-105", "type": "erp.sync", "endpoint": "https://erp.internal.corp/sync" },\n  { "id": "evt-106", "type": "loyalty.points", "userId": "usr_9981", "points": 150 }\n]`;
    }
  };

  window.simulateQueuePipeline = async function () {
    const panel = document.getElementById('dlqResultsPanel');
    if (!panel) return;

    const queueName = document.getElementById('dlqQueueName')?.value || 'order-events-queue';
    const dlqName = document.getElementById('dlqNameInput')?.value || 'order-events-dlq';
    const maxBatchSize = Number(document.getElementById('dlqBatchSize')?.value) || 10;
    const maxBatchTimeout = Number(document.getElementById('dlqBatchTimeout')?.value) || 5;
    const maxRetries = Number(document.getElementById('dlqMaxRetries')?.value) || 3;
    const retryDelay = Number(document.getElementById('dlqRetryDelay')?.value) || 10;
    const failRateVal = Number(document.getElementById('dlqFailRate')?.value || 33) / 100;
    
    let sampleMessages = [];
    try {
      const raw = document.getElementById('dlqSamplePayloads')?.value || '[]';
      sampleMessages = JSON.parse(raw);
    } catch (_) {
      sampleMessages = [{ id: 'sample-1', payload: 'demo-message' }];
    }

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Simulating Cloudflare Queues batch dispatch & worker consumption...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/queues-dlq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueName,
          dlqName,
          maxBatchSize,
          maxBatchTimeout,
          maxRetries,
          retryDelay,
          simulateFailureRate: failRateVal,
          sampleMessages
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Simulation failed');

      panel.innerHTML = `
        <!-- Metrics Cards -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Messages</div>
            <div style="font-size:22px;font-weight:900;color:#fff;margin-top:4px;">${data.metrics.totalMessages}</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Acknowledged</div>
            <div style="font-size:22px;font-weight:900;color:#10b981;margin-top:4px;">${data.metrics.acknowledged}</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Recovered via Retry</div>
            <div style="font-size:22px;font-weight:900;color:#f59e0b;margin-top:4px;">${data.metrics.retriedAndSucceeded}</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Routed to DLQ</div>
            <div style="font-size:22px;font-weight:900;color:#ef4444;margin-top:4px;">${data.metrics.routedToDLQ}</div>
          </div>
        </div>

        <!-- Message Pipeline Trace -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;display:flex;align-items:center;justify-content:space-between;">
            <span>📋 Batch Execution Trace</span>
            <span style="font-size:12px;color:#10b981;font-weight:600;">Success Rate: ${data.metrics.deliverySuccessRate}</span>
          </h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;padding-right:4px;">
            ${data.processedLogs.map(log => {
              let badgeColor = '#10b981';
              let badgeBg = 'rgba(16,185,129,0.15)';
              if (log.status === 'RETRIED_THEN_ACKED') {
                badgeColor = '#f59e0b';
                badgeBg = 'rgba(245,158,11,0.15)';
              } else if (log.status === 'ROUTED_TO_DLQ') {
                badgeColor = '#ef4444';
                badgeBg = 'rgba(239,68,68,0.15)';
              }

              return `
                <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-family:monospace;font-size:12px;font-weight:700;color:#fff;">${esc(log.id)}</span>
                    <span style="background:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor}44;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">
                      ${esc(log.status)}
                    </span>
                  </div>
                  <div style="text-align:right;font-size:12px;color:var(--muted,#888);">
                    <span>Attempts: <strong>${log.attempts}</strong></span>
                    ${log.backoffDelaySec ? `<span style="margin-left:8px;color:#f59e0b;">(${log.backoffDelaySec}s backoff)</span>` : ''}
                    ${log.failureReason ? `<div style="font-size:11px;color:#ef4444;margin-top:2px;">${esc(log.failureReason)}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Code Generation Tabs -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="display:flex;gap:8px;" id="dlqCodeTabs">
              <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;background:var(--accent,#7c6af7);color:#fff;" onclick="window.switchDlqCodeTab('wrangler', this)">wrangler.jsonc</button>
              <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.switchDlqCodeTab('consumer', this)">consumer.js</button>
              <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.switchDlqCodeTab('producer', this)">producer.js</button>
            </div>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyActiveDlqCode()">
              <span>📋</span> Copy Snippet
            </button>
          </div>

          <pre id="dlqCodeBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:14px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:260px;line-height:1.5;">${esc(data.wranglerConfig)}</pre>
        </div>
      `;

      window._currentDlqSnippets = {
        wrangler: data.wranglerConfig,
        consumer: data.consumerCode,
        producer: data.producerCode,
        active: 'wrangler'
      };

    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Simulation Error: ${esc(err.message)}</div>`;
    }
  };

  window.switchDlqCodeTab = function(tabName, btn) {
    if (!window._currentDlqSnippets) return;
    window._currentDlqSnippets.active = tabName;
    const block = document.getElementById('dlqCodeBlock');
    if (block) {
      block.textContent = window._currentDlqSnippets[tabName] || '';
    }
    const container = document.getElementById('dlqCodeTabs');
    if (container) {
      container.querySelectorAll('button').forEach(b => {
        b.style.background = '';
        b.style.color = '';
      });
    }
    if (btn) {
      btn.style.background = 'var(--accent, #7c6af7)';
      btn.style.color = '#fff';
    }
  };

  window.copyActiveDlqCode = function() {
    if (!window._currentDlqSnippets) return;
    const text = window._currentDlqSnippets[window._currentDlqSnippets.active];
    if (text) {
      navigator.clipboard.writeText(text);
      if (typeof window.showToast === 'function') window.showToast('Copied to clipboard!');
    }
  };

  // =========================================================================
  // 33. HTTP COOKIE SECURITY & SESSION HARDENER STUDIO
  // =========================================================================

  window.renderCookieHardenerStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🍪</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">HTTP Cookie Security & Session Hardener</h1>
              <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:11px;">RFC 6265bis & CHIPS</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Audit cookies for session hijacking, XSS, and CSRF vulnerabilities. Generate hardened partitioned directives and Cloudflare Worker HMAC-SHA256 cookie signing middleware.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>📝</span> Raw Set-Cookie Directives
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Cookies to Audit (One per line)</label>
              <textarea id="cookieAuditInput" class="form-input" rows="7" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">session_id=s%3A89f0a2c; Path=/; Domain=.corp.io
auth_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tK; Path=/api
user_prefs=theme_dark; Path=/; SameSite=None
tracking_id=trk_8829104; Path=/</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Target Domain</label>
                <input type="text" id="cookieDomain" class="form-input" style="width:100%;font-size:13px;" value="vault.corp.io" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">HMAC Secret Key</label>
                <input type="text" id="cookieSecret" class="form-input" style="width:100%;font-size:13px;font-family:monospace;" value="vault_edge_crypto_key_2026" />
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;padding:12px;background:var(--surface2,#242434);border-radius:8px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="cookieChipsToggle" checked />
                <span>Inject <strong>CHIPS Partitioned</strong> attribute (cross-site embedded)</span>
              </label>
            </div>

            <button class="btn btn-primary" onclick="window.auditCookiesNow()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🛡️</span> Audit & Harden Cookies
            </button>
          </div>

          <!-- Right Column -->
          <div id="cookieResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🍪</span>
              Click <strong>"Audit & Harden Cookies"</strong> to inspect flags, calculate compliance score, and generate hardened headers.
            </div>
          </div>
        </div>
      </div>
    `;

    window.auditCookiesNow();
  };

  window.auditCookiesNow = async function () {
    const panel = document.getElementById('cookieResultsPanel');
    if (!panel) return;

    const rawCookies = document.getElementById('cookieAuditInput')?.value || '';
    const targetDomain = document.getElementById('cookieDomain')?.value || 'corp.io';
    const sessionSecret = document.getElementById('cookieSecret')?.value || 'secret';
    const enableCHIPS = document.getElementById('cookieChipsToggle')?.checked ?? true;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Analyzing cookie directives against RFC 6265bis specifications...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/cookie-hardener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawCookies, targetDomain, sessionSecret, enableCHIPS })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Audit failed');

      let gradeColor = '#ef4444';
      if (['A+', 'A'].includes(data.grade)) gradeColor = '#10b981';
      else if (data.grade === 'B') gradeColor = '#06b6d4';
      else if (['C', 'D'].includes(data.grade)) gradeColor = '#f59e0b';

      panel.innerHTML = `
        <!-- Grade & Score Card -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;align-items:center;gap:20px;">
            <div style="width:68px;height:68px;border-radius:50%;background:${gradeColor}22;border:3px solid ${gradeColor};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:${gradeColor};">
              ${esc(data.grade)}
            </div>
            <div>
              <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Security Compliance Grade</div>
              <div style="font-size:22px;font-weight:800;color:#fff;margin-top:2px;">${data.score} / 100 Score</div>
            </div>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;justify-content:center;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
              <span style="color:var(--muted,#888);">Audited Cookies:</span>
              <strong style="color:#fff;">${data.totalCookies}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;">
              <span style="color:var(--muted,#888);">Identified Security Deficiencies:</span>
              <strong style="color:${data.issuesCount > 0 ? '#ef4444' : '#10b981'};">${data.issuesCount} Issues</strong>
            </div>
          </div>
        </div>

        <!-- Deficiencies & Recommendations -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">🛡️ Security Audit Findings</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;">
            ${data.allIssues.length > 0 ? data.allIssues.map(issue => `
              <div style="background:var(--surface2,#242434);border-left:4px solid ${issue.severity === 'CRITICAL' ? '#ef4444' : issue.severity === 'HIGH' ? '#f59e0b' : '#06b6d4'};border-radius:6px;padding:8px 12px;font-size:12px;">
                <span style="font-weight:800;color:${issue.severity === 'CRITICAL' ? '#ef4444' : issue.severity === 'HIGH' ? '#f59e0b' : '#06b6d4'};margin-right:6px;">[${issue.severity}]</span>
                <span style="color:#e2e8f0;">${esc(issue.message)}</span>
              </div>
            `).join('') : '<div style="color:#10b981;font-size:13px;">All cookies meet rigorous RFC 6265bis security standards!</div>'}
          </div>
        </div>

        <!-- Hardened Directives -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🔒 Hardened Set-Cookie Headers</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyHardenedCookies()">
              <span>📋</span> Copy Headers
            </button>
          </div>
          <pre id="hardenedCookieBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#10b981;overflow-x:auto;line-height:1.5;">${esc(data.cookies.map(c => `Set-Cookie: ${c.hardenedSetCookie}`).join('\n'))}</pre>
        </div>

        <!-- Worker HMAC Middleware -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Edge HMAC Signing Middleware</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyCookieMiddleware()">
              <span>📋</span> Copy Middleware
            </button>
          </div>
          <pre id="cookieMiddlewareBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerMiddlewareCode)}</pre>
        </div>
      `;

      window._currentCookieCode = data.workerMiddlewareCode;
      window._currentHardenedHeaders = data.cookies.map(c => `Set-Cookie: ${c.hardenedSetCookie}`).join('\n');
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Audit Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyHardenedCookies = function() {
    if (window._currentHardenedHeaders) {
      navigator.clipboard.writeText(window._currentHardenedHeaders);
      if (typeof window.showToast === 'function') window.showToast('Copied hardened cookies to clipboard!');
    }
  };

  window.copyCookieMiddleware = function() {
    if (window._currentCookieCode) {
      navigator.clipboard.writeText(window._currentCookieCode);
      if (typeof window.showToast === 'function') window.showToast('Copied HMAC middleware to clipboard!');
    }
  };

  // =========================================================================
  // 34. MULTI-ORIGIN CANARY & WEIGHT TRAFFIC SPLITTER STUDIO
  // =========================================================================

  window.renderCanarySplitterStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🚦</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Multi-Origin Canary & Weight Traffic Splitter</h1>
              <span class="badge" style="background:rgba(6,182,212,0.15);color:#06b6d4;border:1px solid rgba(6,182,212,0.3);font-size:11px;">Edge Load Balancer</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Simulate weighted multi-origin routing and zero-downtime canary rollouts. Generates Cloudflare Worker edge code with sticky IP/cookie hashing, automated 5xx failover, and analytics headers.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>⚖️</span> Origin Pool Configurations
            </h3>

            <!-- Pool 1: Production -->
            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:#fff;font-size:13px;">Origin A (Production)</span>
                <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;font-size:11px;">Primary</span>
              </div>
              <input type="text" id="canaryPoolAUrl" class="form-input" style="font-family:monospace;font-size:12px;" value="https://origin-prod.internal.corp" />
              <div style="display:flex;align-items:center;gap:8px;">
                <label style="font-size:12px;color:var(--muted,#888);min-width:60px;">Weight %:</label>
                <input type="number" id="canaryWeightA" class="form-input" style="width:80px;font-size:12px;" value="80" min="1" max="99" oninput="document.getElementById('canaryWeightB').value = 100 - this.value;" />
              </div>
            </div>

            <!-- Pool 2: Canary -->
            <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:#f59e0b;font-size:13px;">Origin B (Canary Release)</span>
                <span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;font-size:11px;">Canary v2.4</span>
              </div>
              <input type="text" id="canaryPoolBUrl" class="form-input" style="font-family:monospace;font-size:12px;" value="https://origin-canary.internal.corp" />
              <div style="display:flex;align-items:center;gap:8px;">
                <label style="font-size:12px;color:var(--muted,#888);min-width:60px;">Weight %:</label>
                <input type="number" id="canaryWeightB" class="form-input" style="width:80px;font-size:12px;" value="20" min="1" max="99" oninput="document.getElementById('canaryWeightA').value = 100 - this.value;" />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Routing & Affinity Strategy</label>
              <select id="canaryStrategy" class="form-input" style="width:100%;font-size:13px;">
                <option value="sticky-ip" selected>Sticky Client IP Hash (Consistent per Visitor)</option>
                <option value="sticky-cookie">Sticky Cookie Affinity (cf_canary_pool)</option>
                <option value="weighted-random">Weighted Random (Stateless Distribution)</option>
              </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Cookie Name</label>
                <input type="text" id="canaryCookieName" class="form-input" style="width:100%;font-size:13px;font-family:monospace;" value="cf_canary_pool" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Simulation Requests</label>
                <input type="number" id="canaryTestReqs" class="form-input" style="width:100%;font-size:13px;" value="1000" min="50" max="5000" />
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.simulateCanarySplit()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🚦</span> Run Traffic Distribution Simulation
            </button>
          </div>

          <!-- Right Column -->
          <div id="canaryResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🚦</span>
              Click <strong>"Run Traffic Distribution Simulation"</strong> to verify consistent hashing and export the Edge Proxy Worker.
            </div>
          </div>
        </div>
      </div>
    `;

    window.simulateCanarySplit();
  };

  window.simulateCanarySplit = async function () {
    const panel = document.getElementById('canaryResultsPanel');
    if (!panel) return;

    const urlA = document.getElementById('canaryPoolAUrl')?.value || 'https://origin-prod.internal.corp';
    const weightA = Number(document.getElementById('canaryWeightA')?.value) || 80;
    const urlB = document.getElementById('canaryPoolBUrl')?.value || 'https://origin-canary.internal.corp';
    const weightB = Number(document.getElementById('canaryWeightB')?.value) || 20;
    const routingStrategy = document.getElementById('canaryStrategy')?.value || 'sticky-ip';
    const cookieName = document.getElementById('canaryCookieName')?.value || 'cf_canary_pool';
    const testRequests = Number(document.getElementById('canaryTestReqs')?.value) || 1000;

    const pools = [
      { id: 'prod', name: 'Production (Stable)', originUrl: urlA, weight: weightA, isCanary: false },
      { id: 'canary', name: 'Canary (v2.4.0)', originUrl: urlB, weight: weightB, isCanary: true }
    ];

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Simulating ${testRequests} client requests with FNV-1a consistent hashing...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/canary-traffic-splitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pools, routingStrategy, cookieName, testRequests })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Canary simulation failed');

      panel.innerHTML = `
        <!-- Distribution Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${data.distribution.map(d => {
            const isCanary = d.id === 'canary';
            const color = isCanary ? '#f59e0b' : '#10b981';
            return `
              <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;border-top:4px solid ${color};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <span style="font-weight:700;color:#fff;font-size:14px;">${esc(d.name)}</span>
                  <span style="font-size:11px;color:var(--muted,#888);">Target: ${esc(d.targetWeight)}</span>
                </div>
                <div style="font-size:28px;font-weight:900;color:${color};margin-bottom:4px;">
                  ${esc(d.actualPercent)}
                </div>
                <div style="font-size:12px;color:var(--muted,#888);">
                  ${d.actualRequests} / ${data.totalSimulatedRequests} reqs (Delta: ${esc(d.deviation)})
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Visual Distribution Bar -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;color:var(--muted,#888);">
            <span>Traffic Split Visualization</span>
            <span>${data.strategy}</span>
          </div>
          <div style="height:24px;width:100%;border-radius:8px;overflow:hidden;display:flex;">
            <div style="width:${data.distribution[0].actualPercent};background:#10b981;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">
              Production ${data.distribution[0].actualPercent}
            </div>
            <div style="width:${data.distribution[1].actualPercent};background:#f59e0b;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">
              Canary ${data.distribution[1].actualPercent}
            </div>
          </div>
        </div>

        <!-- Automatic Edge Failover Banner -->
        <div style="background:rgba(124,106,247,0.1);border:1px solid rgba(124,106,247,0.3);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:20px;">🛡️</span>
          <div style="font-size:12px;color:#e2e8f0;line-height:1.4;">
            <strong>Automated Zero-Downtime Failover:</strong> If the Canary origin returns 502, 503, or 504 errors, the Worker automatically reroutes the visitor to Production and injects <code style="color:var(--accent,#7c6af7);">X-Canary-Fallback-Triggered: true</code>.
          </div>
        </div>

        <!-- Generated Cloudflare Worker Script -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Ready-to-Deploy Cloudflare Worker Proxy</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyCanaryWorker()">
              <span>📋</span> Copy Worker Code
            </button>
          </div>
          <pre id="canaryWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:260px;line-height:1.5;">${esc(data.workerScript)}</pre>
        </div>
      `;

      window._currentCanaryScript = data.workerScript;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Canary Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyCanaryWorker = function() {
    if (window._currentCanaryScript) {
      navigator.clipboard.writeText(window._currentCanaryScript);
      if (typeof window.showToast === 'function') window.showToast('Copied Canary Worker to clipboard!');
    }
  };

  // =========================================================================
  // 35. SRI (SUBRESOURCE INTEGRITY) & EDGE SCRIPT LOCKER STUDIO
  // =========================================================================

  window.renderSriLockerStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🔒</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">SRI (Subresource Integrity) & Edge Script Locker</h1>
              <span class="badge" style="background:rgba(236,72,153,0.15);color:#ec4899;border:1px solid rgba(236,72,153,0.3);font-size:11px;">Magecart Defense</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Compute cryptographic SRI hashes (SHA-256, SHA-384, SHA-512) for scripts and stylesheets. Audit CDN scripts for supply-chain attacks and generate Cloudflare HTMLRewriter edge scripts.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>🌐</span> Target Resource or HTML Page
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Remote CDN Script / CSS URL (Optional)</label>
              <input type="text" id="sriRemoteUrl" class="form-input" style="width:100%;font-family:monospace;font-size:12px;" value="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Inline Script or CSS Content</label>
              <textarea id="sriInlineContent" class="form-input" rows="4" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">console.log("Vault Edge SRI Verified Resource");</textarea>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">HTML Snippet to Audit for Missing SRI</label>
              <textarea id="sriHtmlSnippet" class="form-input" rows="5" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;"><script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<script src="https://unpkg.com/lodash@4.17.21/lodash.min.js"></script></textarea>
            </div>

            <button class="btn btn-primary" onclick="window.generateSriAndAudit()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🔒</span> Compute SRI & Audit HTML
            </button>
          </div>

          <!-- Right Column -->
          <div id="sriResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🔒</span>
              Click <strong>"Compute SRI & Audit HTML"</strong> to calculate cryptographic hashes and audit CDN tags.
            </div>
          </div>
        </div>
      </div>
    `;

    window.generateSriAndAudit();
  };

  window.generateSriAndAudit = async function () {
    const panel = document.getElementById('sriResultsPanel');
    if (!panel) return;

    const targetUrl = document.getElementById('sriRemoteUrl')?.value || '';
    const inlineContent = document.getElementById('sriInlineContent')?.value || '';
    const htmlSnippet = document.getElementById('sriHtmlSnippet')?.value || '';

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Computing cryptographic SHA-256/384/512 digests and scanning HTML tags...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/sri-edge-locker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, inlineContent, htmlSnippet })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'SRI generation failed');

      panel.innerHTML = `
        <!-- Cryptographic Hashes Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">
            <span>🔑</span> Cryptographic SRI Hashes
          </h3>

          <div style="display:flex;flex-direction:column;gap:10px;">
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;font-weight:700;color:#10b981;">
                <span>SHA-384 (W3C Recommended Standard)</span>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 8px;" onclick="navigator.clipboard.writeText('${esc(data.sriHashes.sha384)}')">Copy</button>
              </div>
              <input type="text" readonly class="form-input" style="width:100%;font-family:monospace;font-size:12px;color:#10b981;" value="${esc(data.sriHashes.sha384)}" />
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;font-weight:700;color:var(--muted,#888);">
                <span>SHA-256</span>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 8px;" onclick="navigator.clipboard.writeText('${esc(data.sriHashes.sha256)}')">Copy</button>
              </div>
              <input type="text" readonly class="form-input" style="width:100%;font-family:monospace;font-size:12px;" value="${esc(data.sriHashes.sha256)}" />
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;font-weight:700;color:var(--muted,#888);">
                <span>SHA-512</span>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 8px;" onclick="navigator.clipboard.writeText('${esc(data.sriHashes.sha512)}')">Copy</button>
              </div>
              <input type="text" readonly class="form-input" style="width:100%;font-family:monospace;font-size:12px;" value="${esc(data.sriHashes.sha512)}" />
            </div>
          </div>
        </div>

        <!-- HTML Snippet Example -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🏷️ Hardened Script Tag</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="navigator.clipboard.writeText('${esc(data.tagSnippet)}')">
              <span>📋</span> Copy Tag
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#38bdf8;overflow-x:auto;">${esc(data.tagSnippet)}</pre>
        </div>

        <!-- HTML Supply Chain Audit Findings -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">🛡️ CDN Supply-Chain Tag Audit</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;">
            ${data.auditResults && data.auditResults.length > 0 ? data.auditResults.map(a => `
              <div style="background:var(--surface2,#242434);border-left:4px solid ${a.status === 'SECURE' ? '#10b981' : '#ef4444'};border-radius:6px;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <span style="font-family:monospace;font-size:12px;font-weight:700;color:#fff;">${esc(a.resource)}</span>
                  <span style="font-size:11px;font-weight:800;color:${a.status === 'SECURE' ? '#10b981' : '#ef4444'};">
                    ${esc(a.status)}
                  </span>
                </div>
                <div style="font-size:11px;color:var(--muted,#888);">${esc(a.recommendation)}</div>
              </div>
            `).join('') : '<div style="color:var(--muted,#888);font-size:12px;">No script or stylesheet tags identified in provided HTML snippet.</div>'}
          </div>
        </div>

        <!-- Edge HTMLRewriter Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare HTMLRewriter SRI Injector</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copySriWorker()">
              <span>📋</span> Copy Worker Code
            </button>
          </div>
          <pre id="sriWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerHtmlRewriterCode)}</pre>
        </div>
      `;

      window._currentSriWorkerCode = data.workerHtmlRewriterCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">SRI Error: ${esc(err.message)}</div>`;
    }
  };

  window.copySriWorker = function() {
    if (window._currentSriWorkerCode) {
      navigator.clipboard.writeText(window._currentSriWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied SRI HTMLRewriter Worker to clipboard!');
    }
  };

  // =========================================================================
  // 36. EDGE WEBSOCKET & REAL-TIME PRESENCE SERVER STUDIO
  // =========================================================================

  window.renderEdgeWebSocketsStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">⚡</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge WebSocket & Real-Time Presence Studio</h1>
              <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);border:1px solid rgba(124,106,247,0.3);font-size:11px;">WebSocket Hibernation API</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Architect zero-cost real-time pub/sub and multiplayer presence using Cloudflare Workers WebSocket Hibernation API and Durable Objects.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>🔌</span> WebSocket Room & Session Settings
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Room Channel / Topic ID</label>
              <input type="text" id="wsRoomName" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="presence-channel-alpha" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Simulated Connected Peers</label>
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="range" id="wsClientCount" min="1" max="15" value="5" style="flex:1;" oninput="document.getElementById('wsClientCountVal').textContent = this.value + ' peers'" />
                <span id="wsClientCountVal" style="font-size:13px;font-weight:700;color:var(--accent,#7c6af7);min-width:60px;">5 peers</span>
              </div>
            </div>

            <div style="padding:12px;background:var(--surface2,#242434);border-radius:8px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="wsHibernationToggle" checked />
                <span>Enable <strong>WebSocket Hibernation</strong> (Zero CPU cost when idle)</span>
              </label>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Broadcast Message (JSON)</label>
              <textarea id="wsMessagePayload" class="form-input" rows="4" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">{
  "event": "cursor.move",
  "userId": "usr_dev_440",
  "x": 382,
  "y": 591,
  "state": "active"
}</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.simulateWebSockets()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>⚡</span> Simulate WebSocket Handshake & Broadcast
            </button>
          </div>

          <!-- Right Column -->
          <div id="wsResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">⚡</span>
              Click <strong>"Simulate WebSocket Handshake"</strong> to test edge socket pairs, hibernation, and broadcast latency.
            </div>
          </div>
        </div>
      </div>
    `;

    window.simulateWebSockets();
  };

  window.simulateWebSockets = async function () {
    const panel = document.getElementById('wsResultsPanel');
    if (!panel) return;

    const roomName = document.getElementById('wsRoomName')?.value || 'general';
    const clientCount = Number(document.getElementById('wsClientCount')?.value) || 5;
    const enableHibernation = document.getElementById('wsHibernationToggle')?.checked ?? true;
    const sampleMessage = document.getElementById('wsMessagePayload')?.value || '{}';

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Establishing RFC 6455 101 Switching Protocols upgrade...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/edge-websockets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, clientCount, sampleMessage, enableHibernation })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'WebSocket simulation failed');

      panel.innerHTML = `
        <!-- Status & Protocol Overview -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Connected Peers</div>
            <div style="font-size:24px;font-weight:900;color:var(--accent,#7c6af7);margin-top:4px;">${data.clientCount}</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Avg Broadcast Latency</div>
            <div style="font-size:24px;font-weight:900;color:#10b981;margin-top:4px;">${data.broadcast.avgLatencyMs} ms</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Hibernation Mode</div>
            <div style="font-size:16px;font-weight:800;color:#38bdf8;margin-top:8px;">${data.enableHibernation ? 'ACTIVE (0-CPU)' : 'STANDBY'}</div>
          </div>
        </div>

        <!-- Connected Clients Table -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">🌐 Edge Peer Sockets in Room: ${esc(data.room)}</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;">
            ${data.clients.map(c => `
              <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span style="font-family:monospace;font-size:12px;font-weight:700;color:#fff;">${esc(c.socketId)}</span>
                  <span style="margin-left:8px;font-size:11px;color:var(--muted,#888);">(${esc(c.ip)})</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:12px;color:#10b981;">${c.pingLatencyMs}ms ping</span>
                  <span class="badge" style="background:${c.hibernated ? 'rgba(56,189,248,0.15)' : 'rgba(16,185,129,0.15)'};color:${c.hibernated ? '#38bdf8' : '#10b981'};font-size:11px;">
                    ${c.hibernated ? 'Hibernating' : 'Active'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cloudflare Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker WebSocket Server</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyWsWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="wsWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:240px;line-height:1.5;">${esc(data.workerWebSocketCode)}</pre>
        </div>
      `;

      window._currentWsWorkerCode = data.workerWebSocketCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">WebSocket Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyWsWorker = function() {
    if (window._currentWsWorkerCode) {
      navigator.clipboard.writeText(window._currentWsWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied WebSocket Worker to clipboard!');
    }
  };

  // =========================================================================
  // 37. EDGE BOT MANAGEMENT & BROWSER FINGERPRINT ANALYZER STUDIO
  // =========================================================================

  window.renderBotAnalyzerStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🤖</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge Bot Management & JA4 Fingerprint Studio</h1>
              <span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);font-size:11px;">Scraper Mitigation</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Detect headless browsers, scrapers, and malicious automation using Client Hints, JA4 TLS heuristics, and Cloudflare Bot Management scoring.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h3 style="font-size:16px;font-weight:700;margin:0;">🕵️ Client Fingerprint Inputs</h3>
              <div style="display:flex;gap:4px;">
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 6px;" onclick="window.applyBotPreset('human')">Human</button>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 6px;" onclick="window.applyBotPreset('puppeteer')">Puppeteer</button>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 6px;" onclick="window.applyBotPreset('curl')">cURL</button>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 6px;" onclick="window.applyBotPreset('googlebot')">Googlebot</button>
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">User-Agent Header</label>
              <textarea id="botUaInput" class="form-input" rows="3" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Sec-CH-UA (Client Hints)</label>
                <input type="text" id="botSecChUa" class="form-input" style="width:100%;font-size:12px;font-family:monospace;" value='"Google Chrome";v="126", "Chromium";v="126"' />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Sec-CH-UA-Platform</label>
                <input type="text" id="botSecPlatform" class="form-input" style="width:100%;font-size:12px;font-family:monospace;" value='"macOS"' />
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.analyzeBotFingerprint()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🤖</span> Analyze Bot Score & JA4
            </button>
          </div>

          <!-- Right Column -->
          <div id="botResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🤖</span>
              Click <strong>"Analyze Bot Score & JA4"</strong> to evaluate automation signals and view mitigation policies.
            </div>
          </div>
        </div>
      </div>
    `;

    window.analyzeBotFingerprint();
  };

  window.applyBotPreset = function(type) {
    const ua = document.getElementById('botUaInput');
    const ch = document.getElementById('botSecChUa');
    const pf = document.getElementById('botSecPlatform');
    if (!ua || !ch || !pf) return;

    if (type === 'human') {
      ua.value = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
      ch.value = '"Google Chrome";v="126", "Chromium";v="126"';
      pf.value = '"macOS"';
    } else if (type === 'puppeteer') {
      ua.value = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0.6367.60 Safari/537.36';
      ch.value = '';
      pf.value = '';
    } else if (type === 'curl') {
      ua.value = 'curl/8.4.0';
      ch.value = '';
      pf.value = '';
    } else if (type === 'googlebot') {
      ua.value = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      ch.value = '';
      pf.value = '';
    }
    window.analyzeBotFingerprint();
  };

  window.analyzeBotFingerprint = async function () {
    const panel = document.getElementById('botResultsPanel');
    if (!panel) return;

    const userAgent = document.getElementById('botUaInput')?.value || '';
    const secChUa = document.getElementById('botSecChUa')?.value || '';
    const secChUaPlatform = document.getElementById('botSecPlatform')?.value || '';

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Analyzing TLS ClientHello JA4 fingerprint & automation markers...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/bot-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAgent, secChUa, secChUaPlatform })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Bot analysis failed');

      let scoreColor = '#10b981';
      if (data.botScore <= 20) scoreColor = '#ef4444';
      else if (data.botScore <= 50) scoreColor = '#f59e0b';
      else if (data.botScore <= 75) scoreColor = '#38bdf8';

      panel.innerHTML = `
        <!-- Score Card -->
        <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:16px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;">
            <div style="width:68px;height:68px;border-radius:50%;background:${scoreColor}22;border:3px solid ${scoreColor};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:${scoreColor};">
              ${data.botScore}
            </div>
            <div>
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Cloudflare Bot Score (1-99)</div>
              <div style="font-size:15px;font-weight:800;color:#fff;margin-top:2px;">${esc(data.classification)}</div>
            </div>
          </div>

          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;justify-content:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;margin-bottom:4px;">Recommended Edge Action</div>
            <div style="font-size:16px;font-weight:900;color:${data.recommendedAction === 'BLOCK' ? '#ef4444' : data.recommendedAction === 'MANAGED_CHALLENGE' ? '#f59e0b' : '#10b981'};">
              ${data.recommendedAction}
            </div>
          </div>
        </div>

        <!-- JA4 Fingerprint Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px 20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">JA4 TLS Fingerprint</span>
            <button class="btn btn-secondary" style="font-size:10px;padding:2px 8px;" onclick="navigator.clipboard.writeText('${esc(data.ja4Fingerprint)}')">Copy JA4</button>
          </div>
          <div style="font-family:monospace;font-size:13px;font-weight:700;color:#38bdf8;background:#0d0d14;padding:8px 12px;border-radius:6px;border:1px solid var(--border);">
            ${esc(data.ja4Fingerprint)}
          </div>
        </div>

        <!-- Detected Signals -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">🔍 Evaluated Detection Signals</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto;">
            ${data.signals.length > 0 ? data.signals.map(s => `
              <div style="background:var(--surface2,#242434);border-left:4px solid ${s.type === 'CRITICAL' ? '#ef4444' : s.type === 'HIGH' ? '#f59e0b' : '#06b6d4'};border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;font-size:12px;">
                <span style="color:#e2e8f0;">${esc(s.rule)}</span>
                <span style="color:#ef4444;font-weight:700;">-${s.penalty} pts</span>
              </div>
            `).join('') : '<div style="color:#10b981;font-size:13px;">No automated scraper or headless browser signals detected.</div>'}
          </div>
        </div>

        <!-- Worker WAF Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Bot Mitigation Worker</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyBotWaf()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="botWafBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:200px;line-height:1.5;">${esc(data.workerWafCode)}</pre>
        </div>
      `;

      window._currentBotWafCode = data.workerWafCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Bot Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyBotWaf = function() {
    if (window._currentBotWafCode) {
      navigator.clipboard.writeText(window._currentBotWafCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Bot Mitigation Worker to clipboard!');
    }
  };

  // =========================================================================
  // 38. OPENAPI / SWAGGER EDGE GATEWAY & SCHEMA VALIDATOR STUDIO
  // =========================================================================

  window.renderOpenApiGatewayStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">📐</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">OpenAPI Edge Gateway & Schema Validator</h1>
              <span class="badge" style="background:rgba(6,182,212,0.15);color:#06b6d4;border:1px solid rgba(6,182,212,0.3);font-size:11px;">Schema Enforcement</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Validate API requests against OpenAPI contracts directly on Cloudflare edge before reaching backend microservices. Stop malformed requests with zero origin latency.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>📝</span> Test Request Payload
            </h3>

            <div style="display:grid;grid-template-columns:100px 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Method</label>
                <select id="apiMethod" class="form-input" style="width:100%;font-size:13px;font-weight:700;">
                  <option value="POST" selected>POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">API Route Path</label>
                <input type="text" id="apiPath" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="/api/v1/orders" />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Request Body (JSON)</label>
              <textarea id="apiBodyInput" class="form-input" rows="8" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">{
  "orderId": "ORD-9921",
  "customerEmail": "alex@corp.io",
  "items": [
    { "sku": "SKU-PRO-01", "quantity": 2, "price": 49.99 }
  ],
  "shippingAddress": {
    "city": "San Francisco",
    "postalCode": "94105"
  }
}</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.validateApiContract()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>📐</span> Validate Against OpenAPI Contract
            </button>
          </div>

          <!-- Right Column -->
          <div id="apiResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">📐</span>
              Click <strong>"Validate Against OpenAPI Contract"</strong> to verify schema properties and generate Edge Gateway code.
            </div>
          </div>
        </div>
      </div>
    `;

    window.validateApiContract();
  };

  window.validateApiContract = async function () {
    const panel = document.getElementById('apiResultsPanel');
    if (!panel) return;

    const method = document.getElementById('apiMethod')?.value || 'POST';
    const path = document.getElementById('apiPath')?.value || '/api/v1/orders';
    let requestBody = {};
    try {
      requestBody = JSON.parse(document.getElementById('apiBodyInput')?.value || '{}');
    } catch (_) {
      requestBody = null;
    }

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Executing edge JSON schema contract validation...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/openapi-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, path, requestBody })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Validation failed');

      panel.innerHTML = `
        <!-- Validation Status Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;border-top:4px solid ${data.isValid ? '#10b981' : '#ef4444'};">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <span style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Contract Conformance</span>
              <div style="font-size:22px;font-weight:900;color:${data.isValid ? '#10b981' : '#ef4444'};margin-top:2px;">
                ${data.isValid ? 'VALID CONTRACT REQUEST' : 'SCHEMA VIOLATIONS IDENTIFIED'}
              </div>
            </div>
            <span class="badge" style="background:${data.isValid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};color:${data.isValid ? '#10b981' : '#ef4444'};font-size:12px;">
              ${data.errorsCount} Violations
            </span>
          </div>
        </div>

        <!-- Violation Details -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">📋 Schema Rule Evaluations</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;">
            ${data.validationErrors.length > 0 ? data.validationErrors.map(e => `
              <div style="background:var(--surface2,#242434);border-left:4px solid #ef4444;border-radius:6px;padding:8px 12px;font-size:12px;">
                <span style="font-weight:700;color:#ef4444;">[${esc(e.location)}: ${esc(e.parameter)}]</span>
                <span style="color:#e2e8f0;margin-left:6px;">${esc(e.message)}</span>
              </div>
            `).join('') : '<div style="color:#10b981;font-size:13px;">Payload adheres 100% strictly to OpenAPI 3.1 schema specifications!</div>'}
          </div>
        </div>

        <!-- Worker Gateway Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Edge Schema Gateway</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyApiGateway()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="apiGatewayBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerGatewayCode)}</pre>
        </div>
      `;

      window._currentApiGatewayCode = data.workerGatewayCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Schema Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyApiGateway = function() {
    if (window._currentApiGatewayCode) {
      navigator.clipboard.writeText(window._currentApiGatewayCode);
      if (typeof window.showToast === 'function') window.showToast('Copied OpenAPI Gateway to clipboard!');
    }
  };

  // =========================================================================
  // 39. EDGE IMAGE RESIZING & WEBP/AVIF TRANSFORMER STUDIO
  // =========================================================================

  window.renderImageResizerStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🖼️</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge Image Resizing & Format Studio</h1>
              <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:11px;">Polish & WebP/AVIF</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Transform and optimize images on Cloudflare edge. Generate responsive srcset picture tags, WebP/AVIF compression savings, and Worker image resizing proxies.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>📐</span> Image Dimensions & Geometry
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Source Image URL</label>
              <input type="text" id="imgSourceUrl" class="form-input" style="width:100%;font-family:monospace;font-size:12px;" value="https://images.unsplash.com/photo-1579546929518-9e396f3cc809" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Target Width (px)</label>
                <input type="number" id="imgTargetWidth" class="form-input" style="width:100%;font-size:13px;" value="800" min="50" max="3840" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Target Height (px)</label>
                <input type="number" id="imgTargetHeight" class="form-input" style="width:100%;font-size:13px;" value="600" min="50" max="3840" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Crop / Fit Mode</label>
                <select id="imgFitMode" class="form-input" style="width:100%;font-size:13px;">
                  <option value="cover" selected>cover (Fill box, crop excess)</option>
                  <option value="contain">contain (Fit inside box)</option>
                  <option value="scale-down">scale-down</option>
                  <option value="crop">crop</option>
                  <option value="pad">pad</option>
                </select>
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Format</label>
                <select id="imgFormat" class="form-input" style="width:100%;font-size:13px;">
                  <option value="auto" selected>auto (AVIF / WebP by client Accept)</option>
                  <option value="webp">webp</option>
                  <option value="avif">avif</option>
                  <option value="jpeg">jpeg</option>
                </select>
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Compression Quality</label>
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="range" id="imgQuality" min="10" max="100" value="85" style="flex:1;" oninput="document.getElementById('imgQualityVal').textContent = this.value + '%'" />
                <span id="imgQualityVal" style="font-size:13px;font-weight:700;color:#10b981;min-width:40px;">85%</span>
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.generateImageResizer()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🖼️</span> Generate Edge Image Transformation
            </button>
          </div>

          <!-- Right Column -->
          <div id="imgResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🖼️</span>
              Click <strong>"Generate Edge Image Transformation"</strong> to calculate byte savings and HTML picture tags.
            </div>
          </div>
        </div>
      </div>
    `;

    window.generateImageResizer();
  };

  window.generateImageResizer = async function () {
    const panel = document.getElementById('imgResultsPanel');
    if (!panel) return;

    const imageUrl = document.getElementById('imgSourceUrl')?.value || '';
    const width = Number(document.getElementById('imgTargetWidth')?.value) || 800;
    const height = Number(document.getElementById('imgTargetHeight')?.value) || 600;
    const fit = document.getElementById('imgFitMode')?.value || 'cover';
    const format = document.getElementById('imgFormat')?.value || 'auto';
    const quality = Number(document.getElementById('imgQuality')?.value) || 85;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Computing edge CDN image resizing path and format savings...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/image-resizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, width, height, fit, format, quality })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Resizing computation failed');

      panel.innerHTML = `
        <!-- Bandwidth Savings Comparison -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Baseline Origin</div>
            <div style="font-size:18px;font-weight:800;color:#94a3b8;margin-top:4px;">${data.bandwidthSavings.originalSizeEst.split(' ')[0]} KB</div>
            <div style="font-size:11px;color:var(--muted,#888);">JPEG/PNG</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">WebP Edge Polish</div>
            <div style="font-size:18px;font-weight:800;color:#10b981;margin-top:4px;">${data.bandwidthSavings.webpSizeEst.split(' ')[0]} KB</div>
            <div style="font-size:11px;color:#10b981;">~65% Savings</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">AVIF Next-Gen</div>
            <div style="font-size:18px;font-weight:800;color:#06b6d4;margin-top:4px;">${data.bandwidthSavings.avifSizeEst.split(' ')[0]} KB</div>
            <div style="font-size:11px;color:#06b6d4;">~82% Savings</div>
          </div>
        </div>

        <!-- Transformed Edge URL -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px 20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:700;color:var(--muted,#888);text-transform:uppercase;">Cloudflare Edge CDN Image URL</span>
            <button class="btn btn-secondary" style="font-size:10px;padding:2px 8px;" onclick="navigator.clipboard.writeText('${esc(data.transformedUrl)}')">Copy URL</button>
          </div>
          <div style="font-family:monospace;font-size:12px;color:#10b981;background:#0d0d14;padding:8px 12px;border-radius:6px;border:1px solid var(--border);overflow-x:auto;">
            ${esc(data.transformedUrl)}
          </div>
        </div>

        <!-- HTML <picture> Tag Example -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🏷️ Responsive HTML Picture Element</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="navigator.clipboard.writeText('${esc(data.htmlPictureTag)}')">
              <span>📋</span> Copy Picture Tag
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#38bdf8;overflow-x:auto;line-height:1.5;">${esc(data.htmlPictureTag)}</pre>
        </div>

        <!-- Cloudflare Worker Image Proxy Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker Image Resizer Proxy</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyImageWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="imgWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerImageCode)}</pre>
        </div>
      `;

      window._currentImageWorkerCode = data.workerImageCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Image Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyImageWorker = function() {
    if (window._currentImageWorkerCode) {
      navigator.clipboard.writeText(window._currentImageWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Image Worker to clipboard!');
    }
  };

  // =========================================================================
  // 40. EDGE FEATURE FLAGS & REMOTE CONFIG STUDIO
  // =========================================================================

  window.renderFeatureFlagsStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🚩</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge Feature Flags & Remote Config Studio</h1>
              <span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);font-size:11px;">KV Dynamic Flags</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Evaluate user percentage rollouts, role overrides, and geo-targeting with sub-millisecond edge consistency via Cloudflare Workers and KV.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>⚙️</span> Flag Rules & Targeting
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Feature Flag Key</label>
              <input type="text" id="flagKeyInput" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="checkout_redesign_v2" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Target Rollout Percentage</label>
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="range" id="flagPercentage" min="0" max="100" value="50" style="flex:1;" oninput="document.getElementById('flagPercentageVal').textContent = this.value + '%'" />
                <span id="flagPercentageVal" style="font-size:13px;font-weight:700;color:#f59e0b;min-width:45px;">50%</span>
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Allowed Countries (ISO-2, comma separated)</label>
              <input type="text" id="flagCountries" class="form-input" style="width:100%;font-size:13px;font-family:monospace;" value="US, CA, GB, SG, AU" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Override Roles (100% Guaranteed Active)</label>
              <input type="text" id="flagRoles" class="form-input" style="width:100%;font-size:13px;font-family:monospace;" value="admin, beta_tester" />
            </div>

            <button class="btn btn-primary" onclick="window.evaluateFeatureFlags()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🚩</span> Evaluate Edge Feature Flags
            </button>
          </div>

          <!-- Right Column -->
          <div id="flagResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🚩</span>
              Click <strong>"Evaluate Edge Feature Flags"</strong> to test user cohort hashing and view edge KV configuration.
            </div>
          </div>
        </div>
      </div>
    `;

    window.evaluateFeatureFlags();
  };

  window.evaluateFeatureFlags = async function () {
    const panel = document.getElementById('flagResultsPanel');
    if (!panel) return;

    const flagKey = document.getElementById('flagKeyInput')?.value || 'feature_flag';
    const rolloutPercentage = Number(document.getElementById('flagPercentage')?.value) || 50;
    const allowedCountries = (document.getElementById('flagCountries')?.value || '').split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    const allowedRoles = (document.getElementById('flagRoles')?.value || '').split(',').map(r => r.trim().toLowerCase()).filter(Boolean);

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Computing deterministic FNV-1a user bucket evaluations...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagKey, rolloutPercentage, allowedCountries, allowedRoles })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Evaluation failed');

      panel.innerHTML = `
        <!-- Metrics Cards -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Flag Status</div>
            <div style="font-size:18px;font-weight:900;color:#f59e0b;margin-top:4px;">${esc(data.flagKey)}</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Target Rollout</div>
            <div style="font-size:22px;font-weight:900;color:#fff;margin-top:4px;">${data.rolloutPercentage}%</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Active Cohort</div>
            <div style="font-size:22px;font-weight:900;color:#10b981;margin-top:4px;">${data.activeUsersCount} / ${data.totalUsersEvaluated} (${data.activePercentage})</div>
          </div>
        </div>

        <!-- Evaluation Table -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">👥 Test User Cohort Evaluations</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;">
            ${data.evaluations.map(u => `
              <div style="background:var(--surface2,#242434);border:1px solid var(--border);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span style="font-weight:700;color:#fff;font-size:13px;">${esc(u.name)}</span>
                  <span style="font-size:11px;color:var(--muted,#888);margin-left:6px;">(${esc(u.country)} • ${esc(u.role)})</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:11px;color:var(--muted,#888);">${esc(u.reason)}</span>
                  <span class="badge" style="background:${u.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};color:${u.enabled ? '#10b981' : '#ef4444'};font-size:11px;font-weight:800;">
                    ${u.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cloudflare Worker Evaluator Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Edge Flag Middleware</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyFlagsWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="flagsWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerFlagsCode)}</pre>
        </div>
      `;

      window._currentFlagsWorkerCode = data.workerFlagsCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Evaluation Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyFlagsWorker = function() {
    if (window._currentFlagsWorkerCode) {
      navigator.clipboard.writeText(window._currentFlagsWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Feature Flags Worker to clipboard!');
    }
  };

  // =========================================================================
  // 41. mTLS (MUTUAL TLS) & CLIENT CERTIFICATE ARCHITECT STUDIO
  // =========================================================================

  window.renderMtlsArchitectStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🔐</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">mTLS & Client Certificate Architect</h1>
              <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:11px;">Zero Trust Edge</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Architect Mutual TLS (mTLS) enforcement with Cloudflare API Shield. Generate simulated Root CAs, client certificates, and header validation gateways.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>📜</span> PKI Identity & CA Authority
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Root CA Common Name (CN)</label>
              <input type="text" id="mtlsCaCn" class="form-input" style="width:100%;font-size:13px;" value="Vault Enterprise Root CA" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Organization (O)</label>
              <input type="text" id="mtlsOrg" class="form-input" style="width:100%;font-size:13px;" value="Vault Corporation Inc" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Client Certificate Identity (CN / FQDN)</label>
              <input type="text" id="mtlsClientCn" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="terminal-pos-042.devices.vault.internal" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Enforced Organizational Unit (OU)</label>
              <input type="text" id="mtlsOu" class="form-input" style="width:100%;font-size:13px;" value="SecurityOperations" />
            </div>

            <button class="btn btn-primary" onclick="window.generateMtlsPipeline()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🔐</span> Generate mTLS Architecture & Worker
            </button>
          </div>

          <!-- Right Column -->
          <div id="mtlsResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🔐</span>
              Click <strong>"Generate mTLS Architecture"</strong> to inspect certificate SHA-256 digests, edge headers, and gateway code.
            </div>
          </div>
        </div>
      </div>
    `;

    window.generateMtlsPipeline();
  };

  window.generateMtlsPipeline = async function () {
    const panel = document.getElementById('mtlsResultsPanel');
    if (!panel) return;

    const caCommonName = document.getElementById('mtlsCaCn')?.value || 'Root CA';
    const organization = document.getElementById('mtlsOrg')?.value || 'Corp';
    const clientIdentity = document.getElementById('mtlsClientCn')?.value || 'client';
    const enforceOrgUnit = document.getElementById('mtlsOu')?.value || 'Security';

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Synthesizing PKI hierarchy and generating edge mTLS headers...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/mtls-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caCommonName, organization, clientIdentity, enforceOrgUnit })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'mTLS generation failed');

      panel.innerHTML = `
        <!-- Certificate SHA-256 Digest Overview -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">🔑 Cryptographic Fingerprints</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="background:var(--surface2,#242434);padding:10px 14px;border-radius:8px;border:1px solid var(--border);">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Root CA SHA-256 Fingerprint</div>
              <div style="font-family:monospace;font-size:12px;color:#38bdf8;font-weight:700;margin-top:2px;">${esc(data.rootCa.sha256Fingerprint)}</div>
            </div>
            <div style="background:var(--surface2,#242434);padding:10px 14px;border-radius:8px;border:1px solid var(--border);">
              <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Client Certificate SHA-256 Fingerprint</div>
              <div style="font-family:monospace;font-size:12px;color:#10b981;font-weight:700;margin-top:2px;">${esc(data.clientCertificate.sha256Fingerprint)}</div>
            </div>
          </div>
        </div>

        <!-- Simulated Cloudflare Edge mTLS Headers -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 10px 0;">🌐 Edge Injected Request Headers</h3>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${Object.entries(data.simulatedHeaders).map(([k, v]) => `
              <div style="display:flex;justify-content:space-between;background:#0d0d14;padding:6px 12px;border-radius:6px;font-family:monospace;font-size:12px;">
                <span style="color:var(--muted,#888);">${esc(k)}:</span>
                <span style="color:#10b981;font-weight:700;">${esc(v)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cloudflare Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker mTLS Enforcer</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyMtlsWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="mtlsWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerMtlsCode)}</pre>
        </div>
      `;

      window._currentMtlsWorkerCode = data.workerMtlsCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">mTLS Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyMtlsWorker = function() {
    if (window._currentMtlsWorkerCode) {
      navigator.clipboard.writeText(window._currentMtlsWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied mTLS Worker to clipboard!');
    }
  };

  // =========================================================================
  // 42. HTTP EARLY HINTS (103 EARLY HINTS) & PRELOAD PIPELINE STUDIO
  // =========================================================================

  window.renderEarlyHintsStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🚀</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">HTTP 103 Early Hints & Preload Pipeline Studio</h1>
              <span class="badge" style="background:rgba(6,182,212,0.15);color:#06b6d4;border:1px solid rgba(6,182,212,0.3);font-size:11px;">RFC 8297 Speed Boost</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Accelerate Largest Contentful Paint (LCP) and render-blocking resources by emitting HTTP 103 Early Hints ahead of origin server response times.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>⚡</span> Preload Resources & Waterfall
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Simulated Origin TTFB Latency</label>
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="range" id="hintsLatency" min="50" max="1000" value="280" style="flex:1;" oninput="document.getElementById('hintsLatencyVal').textContent = this.value + ' ms'" />
                <span id="hintsLatencyVal" style="font-size:13px;font-weight:700;color:#06b6d4;min-width:55px;">280 ms</span>
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Critical Preload Assets (JSON Array)</label>
              <textarea id="hintsAssetsInput" class="form-input" rows="7" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">[
  { "url": "/assets/theme.min.css", "type": "style", "crossorigin": false },
  { "url": "/assets/vendor-framework.js", "type": "script", "crossorigin": false },
  { "url": "https://fonts.gstatic.com/s/inter/v13/font.woff2", "type": "font", "crossorigin": true },
  { "url": "/assets/hero-cover.avif", "type": "image", "crossorigin": false }
]</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.generateEarlyHints()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🚀</span> Calculate Early Hints Waterfall
            </button>
          </div>

          <!-- Right Column -->
          <div id="hintsResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🚀</span>
              Click <strong>"Calculate Early Hints Waterfall"</strong> to evaluate browser prefetch savings and Link headers.
            </div>
          </div>
        </div>
      </div>
    `;

    window.generateEarlyHints();
  };

  window.generateEarlyHints = async function () {
    const panel = document.getElementById('hintsResultsPanel');
    if (!panel) return;

    const originLatencyMs = Number(document.getElementById('hintsLatency')?.value) || 280;
    let resources = [];
    try {
      resources = JSON.parse(document.getElementById('hintsAssetsInput')?.value || '[]');
    } catch (_) {
      resources = [{ url: '/assets/app.css', type: 'style', crossorigin: false }];
    }

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Simulating RFC 8297 103 Early Hints browser pre-connection...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/early-hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originLatencyMs, resources })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Early Hints calculation failed');

      panel.innerHTML = `
        <!-- Savings Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Estimated LCP Acceleration</div>
            <div style="font-size:28px;font-weight:900;color:#10b981;margin-top:4px;">-${data.estimatedTimeSavedMs} ms</div>
            <div style="font-size:11px;color:var(--muted,#888);margin-top:2px;">~72% of Origin TTFB retrieved in advance</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Preloaded Assets</div>
            <div style="font-size:28px;font-weight:900;color:#06b6d4;margin-top:4px;">${data.resourceCount} Resources</div>
            <div style="font-size:11px;color:var(--muted,#888);margin-top:2px;">Styles, Scripts, Fonts, Images</div>
          </div>
        </div>

        <!-- Formatted Link Preload Headers -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🏷️ RFC 8297 Link Header Preloads</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="navigator.clipboard.writeText('${esc(data.singleLinkHeader)}')">
              <span>📋</span> Copy Header
            </button>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${data.linkDirectives.map(d => `
              <div style="background:#0d0d14;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:12px;color:#38bdf8;">
                Link: ${esc(d)}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cloudflare Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Early Hints Pipeline Worker</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyHintsWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="hintsWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerEarlyHintsCode)}</pre>
        </div>
      `;

      window._currentHintsWorkerCode = data.workerEarlyHintsCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Early Hints Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyHintsWorker = function() {
    if (window._currentHintsWorkerCode) {
      navigator.clipboard.writeText(window._currentHintsWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Early Hints Worker to clipboard!');
    }
  };

  // =========================================================================
  // 43. EDGE SSE (SERVER-SENT EVENTS) & LIVE STREAM MULTIPLEXER STUDIO
  // =========================================================================

  window.renderSseMultiplexerStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">📡</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge SSE (Server-Sent Events) Multiplexer</h1>
              <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);border:1px solid rgba(124,106,247,0.3);font-size:11px;">WHATWG EventStream</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Stream real-time server metrics, telemetry, and live push notifications using Cloudflare Workers TransformStream and Last-Event-ID reconnection.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>⚡</span> Event Stream Configuration
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Stream Channel / Topic</label>
              <input type="text" id="sseStreamName" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="edge-telemetry-feed" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Heartbeat Keep-Alive Interval (ms)</label>
              <input type="number" id="sseHeartbeat" class="form-input" style="width:100%;font-size:13px;" value="3000" min="500" max="30000" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Sample Events Batch (JSON Array)</label>
              <textarea id="sseEventsInput" class="form-input" rows="6" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">[
  { "event": "cluster.telemetry", "data": { "colo": "SIN", "activeWorkers": 182, "requestsPerSec": 4920 } },
  { "event": "security.threat", "data": { "level": "LOW", "blockedWaf": 14, "rule": "WAF_1002" } },
  { "event": "build.status", "data": { "release": "v2.6.4", "status": "DEPLOYED_OK" } }
]</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.simulateSseMultiplex()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>📡</span> Generate SSE Stream & Formatter
            </button>
          </div>

          <!-- Right Column -->
          <div id="sseResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">📡</span>
              Click <strong>"Generate SSE Stream"</strong> to inspect raw event-stream buffers and export the Worker.
            </div>
          </div>
        </div>
      </div>
    `;

    window.simulateSseMultiplex();
  };

  window.simulateSseMultiplex = async function () {
    const panel = document.getElementById('sseResultsPanel');
    if (!panel) return;

    const streamName = document.getElementById('sseStreamName')?.value || 'live-feed';
    const heartbeatIntervalMs = Number(document.getElementById('sseHeartbeat')?.value) || 3000;
    let sampleEvents = [];
    try {
      sampleEvents = JSON.parse(document.getElementById('sseEventsInput')?.value || '[]');
    } catch (_) {
      sampleEvents = [{ event: 'telemetry', data: { status: 'OK' } }];
    }

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Formatting WHATWG text/event-stream chunks...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/sse-multiplexer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamName, heartbeatIntervalMs, sampleEvents })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'SSE simulation failed');

      panel.innerHTML = `
        <!-- Raw EventStream Buffer -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">📦 Formatted WHATWG EventStream Chunks</h3>
            <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);font-size:11px;">text/event-stream</span>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#10b981;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.events.map(e => e.rawPayload).join(''))}</pre>
        </div>

        <!-- Cloudflare Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker TransformStream SSE Producer</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copySseWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="sseWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerSseCode)}</pre>
        </div>
      `;

      window._currentSseWorkerCode = data.workerSseCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">SSE Error: ${esc(err.message)}</div>`;
    }
  };

  window.copySseWorker = function() {
    if (window._currentSseWorkerCode) {
      navigator.clipboard.writeText(window._currentSseWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied SSE Worker to clipboard!');
    }
  };

  // =========================================================================
  // 44. GRAPHQL EDGE SHIELD & QUERY COMPLEXITY COST ANALYZER STUDIO
  // =========================================================================

  window.renderGraphqlShieldStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🛡️</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">GraphQL Edge Shield & Complexity Analyzer</h1>
              <span class="badge" style="background:rgba(236,72,153,0.15);color:#ec4899;border:1px solid rgba(236,72,153,0.3);font-size:11px;">Query WAF</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Inspect GraphQL AST query depth, compute complexity costs, block recursive cycles, and guard against schema introspection attacks at Cloudflare Edge.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h3 style="font-size:16px;font-weight:700;margin:0;">📝 GraphQL Query Input</h3>
              <div style="display:flex;gap:4px;">
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 6px;" onclick="window.applyGqlPreset('safe')">Safe Query</button>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 6px;" onclick="window.applyGqlPreset('deep')">Deep Attack</button>
                <button class="btn btn-secondary" style="font-size:10px;padding:2px 6px;" onclick="window.applyGqlPreset('introspect')">Introspect</button>
              </div>
            </div>

            <div>
              <textarea id="gqlQueryInput" class="form-input" rows="9" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">query GetUserFeed {
  user(id: "usr_991") {
    id
    name
    email
    posts(first: 20) {
      id
      title
      comments(first: 10) {
        id
        content
        author {
          id
          name
        }
      }
    }
  }
}</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Max AST Depth Allowed</label>
                <input type="number" id="gqlMaxDepth" class="form-input" style="width:100%;font-size:13px;" value="5" min="1" max="15" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Max Complexity Cost</label>
                <input type="number" id="gqlMaxCost" class="form-input" style="width:100%;font-size:13px;" value="100" min="10" max="500" />
              </div>
            </div>

            <div style="padding:12px;background:var(--surface2,#242434);border-radius:8px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="gqlAllowIntrospect" />
                <span>Allow Introspection Queries (<code>__schema</code>, <code>__type</code>)</span>
              </label>
            </div>

            <button class="btn btn-primary" onclick="window.analyzeGraphqlShield()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🛡️</span> Analyze Query & Enforce Edge WAF
            </button>
          </div>

          <!-- Right Column -->
          <div id="gqlResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🛡️</span>
              Click <strong>"Analyze Query & Enforce Edge WAF"</strong> to inspect AST nesting depth and complexity cost.
            </div>
          </div>
        </div>
      </div>
    `;

    window.analyzeGraphqlShield();
  };

  window.applyGqlPreset = function(type) {
    const q = document.getElementById('gqlQueryInput');
    if (!q) return;

    if (type === 'safe') {
      q.value = `query GetProfile {\n  me {\n    id\n    username\n    profile {\n      avatarUrl\n      bio\n    }\n  }\n}`;
    } else if (type === 'deep') {
      q.value = `query MaliciousDepthAttack {\n  user {\n    posts {\n      comments {\n        author {\n          posts {\n            comments {\n              author {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}`;
    } else if (type === 'introspect') {
      q.value = `query IntrospectSchema {\n  __schema {\n    types {\n      name\n      fields {\n        name\n      }\n    }\n  }\n}`;
    }
    window.analyzeGraphqlShield();
  };

  window.analyzeGraphqlShield = async function () {
    const panel = document.getElementById('gqlResultsPanel');
    if (!panel) return;

    const query = document.getElementById('gqlQueryInput')?.value || '';
    const maxDepth = Number(document.getElementById('gqlMaxDepth')?.value) || 5;
    const maxCost = Number(document.getElementById('gqlMaxCost')?.value) || 100;
    const allowIntrospection = document.getElementById('gqlAllowIntrospect')?.checked ?? false;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Parsing GraphQL AST and evaluating complexity cost...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/graphql-shield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxDepth, maxCost, allowIntrospection })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'GraphQL Shield analysis failed');

      panel.innerHTML = `
        <!-- Decision Banner -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;border-top:4px solid ${data.isAllowed ? '#10b981' : '#ef4444'};">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <span style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;">Edge WAF Policy Decision</span>
              <div style="font-size:22px;font-weight:900;color:${data.isAllowed ? '#10b981' : '#ef4444'};margin-top:2px;">
                ${data.isAllowed ? 'QUERY ALLOWED (PASSED EDGE SHIELD)' : 'QUERY BLOCKED AT EDGE (SECURITY DEFENSE)'}
              </div>
            </div>
            <span class="badge" style="background:${data.isAllowed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};color:${data.isAllowed ? '#10b981' : '#ef4444'};font-size:12px;">
              ${data.violationsCount} Violations
            </span>
          </div>
        </div>

        <!-- Metrics Comparison Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">AST Nesting Depth</div>
            <div style="font-size:24px;font-weight:900;color:${data.observedDepth > data.maxAllowedDepth ? '#ef4444' : '#10b981'};margin-top:4px;">
              ${data.observedDepth} / ${data.maxAllowedDepth} max
            </div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Query Complexity Cost</div>
            <div style="font-size:24px;font-weight:900;color:${data.calculatedCost > data.maxAllowedCost ? '#ef4444' : '#06b6d4'};margin-top:4px;">
              ${data.calculatedCost} / ${data.maxAllowedCost} pts
            </div>
          </div>
        </div>

        <!-- Security Rule Violations -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 12px 0;">📋 Security Rule Evaluations</h3>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto;">
            ${data.violations.length > 0 ? data.violations.map(v => `
              <div style="background:var(--surface2,#242434);border-left:4px solid #ef4444;border-radius:6px;padding:8px 12px;font-size:12px;">
                <span style="font-weight:800;color:#ef4444;">[${esc(v.rule)}]</span>
                <span style="color:#e2e8f0;margin-left:6px;">${esc(v.message)}</span>
              </div>
            `).join('') : '<div style="color:#10b981;font-size:13px;">No schema depth, complexity cost, or introspection violations identified.</div>'}
          </div>
        </div>

        <!-- Cloudflare Worker GraphQL WAF Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker GraphQL Query WAF</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyGqlWaf()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="gqlWafBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerGraphqlWafCode)}</pre>
        </div>
      `;

      window._currentGqlWafCode = data.workerGraphqlWafCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">GraphQL Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyGqlWaf = function() {
    if (window._currentGqlWafCode) {
      navigator.clipboard.writeText(window._currentGqlWafCode);
      if (typeof window.showToast === 'function') window.showToast('Copied GraphQL WAF to clipboard!');
    }
  };

  // =========================================================================
  // 45. EDGE HLS/DASH ADAPTIVE VIDEO STREAM MANIFEST REWRITER STUDIO
  // =========================================================================

  window.renderHlsRewriterStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🎬</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge HLS/DASH Adaptive Video Rewriter</h1>
              <span class="badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;border:1px solid rgba(59,130,246,0.3);font-size:11px;">Media Stream CDN</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Rewrite .m3u8 playlists dynamically at Cloudflare edge. Inforce tokenized HMAC expiring playback URLs and multi-CDN segment routing.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>📺</span> HLS Playlist & Media CDN
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Target Media Edge CDN Domain</label>
              <input type="text" id="hlsCdnDomain" class="form-input" style="width:100%;font-family:monospace;font-size:13px;" value="https://cdn-edge.vault-stream.internal" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Token Secret Key</label>
                <input type="text" id="hlsTokenSecret" class="form-input" style="width:100%;font-family:monospace;font-size:12px;" value="vault_stream_secret_2026" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Token TTL (Seconds)</label>
                <input type="number" id="hlsExpSec" class="form-input" style="width:100%;font-size:13px;" value="3600" min="60" max="86400" />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Master / Media Playlist (.m3u8)</label>
              <textarea id="hlsManifestInput" class="form-input" rows="7" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:9.009,
segment-000.ts
#EXTINF:9.009,
segment-001.ts
#EXTINF:9.009,
segment-002.ts
#EXT-X-ENDLIST</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.rewriteHlsManifest()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🎬</span> Rewrite Manifest & Sign Segment URLs
            </button>
          </div>

          <!-- Right Column -->
          <div id="hlsResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🎬</span>
              Click <strong>"Rewrite Manifest & Sign Segment URLs"</strong> to generate authenticated stream tokens.
            </div>
          </div>
        </div>
      </div>
    `;

    window.rewriteHlsManifest();
  };

  window.rewriteHlsManifest = async function () {
    const panel = document.getElementById('hlsResultsPanel');
    if (!panel) return;

    const manifestContent = document.getElementById('hlsManifestInput')?.value || '';
    const cdnDomain = document.getElementById('hlsCdnDomain')?.value || 'https://cdn-edge.vault-stream.internal';
    const tokenSecret = document.getElementById('hlsTokenSecret')?.value || 'secret';
    const expirationSeconds = Number(document.getElementById('hlsExpSec')?.value) || 3600;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Computing HMAC token signatures and transforming segment paths...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/hls-rewriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifestContent, cdnDomain, tokenSecret, expirationSeconds })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'HLS rewriting failed');

      panel.innerHTML = `
        <!-- Metrics -->
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;">
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Rewritten Segments</div>
            <div style="font-size:22px;font-weight:900;color:#3b82f6;margin-top:4px;">${data.segmentsRewritten} TS Files</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">Token Valid Until</div>
            <div style="font-size:13px;font-weight:700;color:#10b981;margin-top:6px;">${esc(data.expiresAt.split('T')[1].substring(0, 8))} UTC</div>
          </div>
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:var(--muted,#888);text-transform:uppercase;">HMAC Signature</div>
            <div style="font-family:monospace;font-size:12px;font-weight:700;color:#f59e0b;margin-top:6px;">${esc(data.tokenHex)}</div>
          </div>
        </div>

        <!-- Rewritten Manifest Output -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">📦 Transformed .m3u8 Media Manifest</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyHlsManifest()">
              <span>📋</span> Copy Playlist
            </button>
          </div>
          <pre id="hlsManifestBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#38bdf8;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.rewrittenManifest)}</pre>
        </div>

        <!-- Cloudflare Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker HLS Rewriter</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyHlsWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="hlsWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerHlsCode)}</pre>
        </div>
      `;

      window._currentHlsManifest = data.rewrittenManifest;
      window._currentHlsWorkerCode = data.workerHlsCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">HLS Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyHlsManifest = function() {
    if (window._currentHlsManifest) {
      navigator.clipboard.writeText(window._currentHlsManifest);
      if (typeof window.showToast === 'function') window.showToast('Copied HLS playlist to clipboard!');
    }
  };

  window.copyHlsWorker = function() {
    if (window._currentHlsWorkerCode) {
      navigator.clipboard.writeText(window._currentHlsWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied HLS Worker to clipboard!');
    }
  };

  // =========================================================================
  // 46. LOGPUSH & SECURITY SIEM EDGE PIPELINE STUDIO
  // =========================================================================

  window.renderLogpushStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">📊</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Logpush & Security SIEM Pipeline Studio</h1>
              <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:11px;">Zero-Cost Telemetry</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Configure real-time Cloudflare Logpush jobs and non-blocking Worker telemetry streaming with PII redaction for Datadog, Splunk, and S3/R2.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>⚙️</span> Dataset & SIEM Target
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Logpush Dataset</label>
              <select id="logpushDataset" class="form-input" style="width:100%;font-size:13px;font-weight:600;">
                <option value="http_requests" selected>HTTP Requests (Edge Access Logs)</option>
                <option value="firewall_events">Firewall & WAF Events</option>
                <option value="dns_logs">1.1.1.1 DNS Query Logs</option>
                <option value="workers_trace">Workers Trace & Invocation Events</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">SIEM Destination Provider</label>
              <select id="logpushDest" class="form-input" style="width:100%;font-size:13px;">
                <option value="datadog" selected>Datadog Logs API</option>
                <option value="splunk">Splunk HEC (HTTP Event Collector)</option>
                <option value="r2">Cloudflare R2 Object Storage</option>
                <option value="s3_compatible">Amazon S3 / Compatible Bucket</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Event Sampling Rate (0.01 - 1.0)</label>
              <input type="number" id="logpushSample" class="form-input" style="width:100%;font-size:13px;" value="1.0" step="0.1" min="0.01" max="1.0" />
            </div>

            <div style="padding:12px;background:var(--surface2,#242434);border-radius:8px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="logpushRedact" checked />
                <span>Mask PII & Redact Bearer Tokens / IP Octets</span>
              </label>
            </div>

            <button class="btn btn-primary" onclick="window.generateLogpushPipeline()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>📊</span> Generate Logpush Pipeline & Worker
            </button>
          </div>

          <!-- Right Column -->
          <div id="logpushResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">📊</span>
              Click <strong>"Generate Logpush Pipeline"</strong> to view structured SIEM events and non-blocking streaming scripts.
            </div>
          </div>
        </div>
      </div>
    `;

    window.generateLogpushPipeline();
  };

  window.generateLogpushPipeline = async function () {
    const panel = document.getElementById('logpushResultsPanel');
    if (!panel) return;

    const dataset = document.getElementById('logpushDataset')?.value || 'http_requests';
    const destinationType = document.getElementById('logpushDest')?.value || 'datadog';
    const samplingRate = Number(document.getElementById('logpushSample')?.value) || 1.0;
    const redactPii = document.getElementById('logpushRedact')?.checked ?? true;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Formatting Logpush job config & sanitizing security schemas...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/cloudflare/logpush-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset, destinationType, samplingRate, redactPii })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Logpush pipeline generation failed');

      panel.innerHTML = `
        <!-- Sanitized SIEM Event Preview -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🛡️ Sanitized SIEM Event Payload</h3>
            <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;font-size:11px;">PII Redacted</span>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#10b981;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(JSON.stringify(data.sampleLogEvent, null, 2))}</pre>
        </div>

        <!-- Logpush API Configuration -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚙️ Cloudflare Logpush Job Config</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="navigator.clipboard.writeText('${esc(JSON.stringify(data.logpushJobConfig, null, 2))}')">
              <span>📋</span> Copy Config
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#38bdf8;overflow-x:auto;max-height:200px;line-height:1.5;">${esc(JSON.stringify(data.logpushJobConfig, null, 2))}</pre>
        </div>

        <!-- Non-Blocking Worker Streaming Script -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker Async Telemetry (ctx.waitUntil)</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyLogpushWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="logpushWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerLogStreamingCode)}</pre>
        </div>
      `;

      window._currentLogpushWorkerCode = data.workerLogStreamingCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Logpush Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyLogpushWorker = function() {
    if (window._currentLogpushWorkerCode) {
      navigator.clipboard.writeText(window._currentLogpushWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Logpush Worker to clipboard!');
    }
  };

  // =========================================================================
  // 47. EDGE OPENAPI TO TYPESCRIPT & ZOD TYPE GENERATOR STUDIO
  // =========================================================================

  window.renderTypesGenStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1240px;margin:0 auto;padding:24px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🔷</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">TypeScript & Zod Edge Contract Compiler</h1>
              <span class="badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;border:1px solid rgba(59,130,246,0.3);font-size:11px;">Type-Safe Edge</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Compile JSON schemas or payloads into static TypeScript interfaces, strict runtime Zod schemas, and type-safe Cloudflare Worker validation guards.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:start;">
          <!-- Left Column -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <h3 style="font-size:16px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
              <span>📝</span> Payload / JSON Specification
            </h3>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Target Type Name</label>
              <input type="text" id="typeGenName" class="form-input" style="width:100%;font-family:monospace;font-size:13px;font-weight:700;" value="UserProfile" />
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Sample JSON Structure</label>
              <textarea id="typeGenJson" class="form-input" rows="10" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">{
  "userId": "usr_9941",
  "username": "alex_developer",
  "email": "alex@corp.io",
  "isEnterprise": true,
  "credits": 250.75,
  "roles": ["admin", "developer"],
  "preferences": {
    "theme": "dark",
    "twoFactorEnabled": true
  }
}</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.compileEdgeTypes()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>🔷</span> Compile TypeScript & Zod Schemas
            </button>
          </div>

          <!-- Right Column -->
          <div id="typesResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🔷</span>
              Click <strong>"Compile TypeScript & Zod Schemas"</strong> to generate type-safe interfaces and edge validation guards.
            </div>
          </div>
        </div>
      </div>
    `;

    window.compileEdgeTypes();
  };

  window.compileEdgeTypes = async function () {
    const panel = document.getElementById('typesResultsPanel');
    if (!panel) return;

    const typeName = document.getElementById('typeGenName')?.value || 'CustomType';
    const sampleJson = document.getElementById('typeGenJson')?.value || '{}';

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Inferring nested schema types & synthesizing Zod guards...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/types-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeName, sampleJson })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Type compilation failed');

      panel.innerHTML = `
        <!-- TypeScript Interface -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🔷 Static TypeScript Interface</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="navigator.clipboard.writeText('${esc(data.tsInterface)}')">
              <span>📋</span> Copy Interface
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#38bdf8;overflow-x:auto;max-height:180px;line-height:1.5;">${esc(data.tsInterface)}</pre>
        </div>

        <!-- Zod Validation Schema -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🛡️ Runtime Zod Validation Schema</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="navigator.clipboard.writeText('${esc(data.zodSchema)}')">
              <span>📋</span> Copy Zod Schema
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#10b981;overflow-x:auto;max-height:180px;line-height:1.5;">${esc(data.zodSchema)}</pre>
        </div>

        <!-- Cloudflare Worker Validation Handler -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">⚡ Cloudflare Worker Type-Safe Handler</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyTypesWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre id="typesWorkerBlock" style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerIntegrationCode)}</pre>
        </div>
      `;

      window._currentTypesWorkerCode = data.workerIntegrationCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Compilation Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyTypesWorker = function() {
    if (window._currentTypesWorkerCode) {
      navigator.clipboard.writeText(window._currentTypesWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Type-Safe Worker to clipboard!');
    }
  };

  // =========================================================================
  // 48. MULTI-VENDOR EDGE WEBHOOK VERIFICATION & HMAC STUDIO
  // =========================================================================

  window._webhookVerifyState = {
    provider: 'stripe',
    action: 'verify',
    secret: 'whsec_99482_live_edge_key',
    toleranceSec: 300
  };

  window.renderWebhookVerifyStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🔐</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Multi-Vendor Edge Webhook Verifier & HMAC Studio</h1>
              <span class="badge" style="background:rgba(99,102,241,0.15);color:var(--accent,#7c6af7);border:1px solid rgba(99,102,241,0.3);font-size:11px;">Subtle Crypto & Replay Shield</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Verify cryptographic HMAC-SHA256 signatures, simulate webhook provider requests, audit replay attack protection, and export Cloudflare Worker edge gateway code.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.loadWebhookPreset('stripe')" style="font-size:12px;padding:6px 12px;">
              <span>💳</span> Stripe
            </button>
            <button class="btn btn-secondary" onclick="window.loadWebhookPreset('github')" style="font-size:12px;padding:6px 12px;">
              <span>🐙</span> GitHub
            </button>
            <button class="btn btn-secondary" onclick="window.loadWebhookPreset('shopify')" style="font-size:12px;padding:6px 12px;">
              <span>🛍️</span> Shopify
            </button>
            <button class="btn btn-secondary" onclick="window.loadWebhookPreset('slack')" style="font-size:12px;padding:6px 12px;">
              <span>💬</span> Slack
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Config & Inputs -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Webhook Provider</label>
                <select id="whProvider" class="form-input" style="width:100%;" onchange="window.loadWebhookPreset(this.value)">
                  <option value="stripe">Stripe (stripe-signature)</option>
                  <option value="github">GitHub (x-hub-signature-256)</option>
                  <option value="shopify">Shopify (x-shopify-hmac-sha256)</option>
                  <option value="slack">Slack (x-slack-signature v0)</option>
                </select>
              </div>

              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Action Mode</label>
                <select id="whAction" class="form-input" style="width:100%;" onchange="window.toggleWebhookAction(this.value)">
                  <option value="verify">Verify Inbound Webhook</option>
                  <option value="sign">Generate Authentic Signature</option>
                </select>
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Signing Secret Key</label>
              <input type="text" id="whSecret" class="form-input" value="whsec_sample_edge_secret_key_99482" style="width:100%;font-family:monospace;" />
            </div>

            <div id="whSigRow">
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Provided Signature Header</label>
              <input type="text" id="whSignature" class="form-input" placeholder="e.g. t=1727195520,v1=a9f4c3... or sha256=..." style="width:100%;font-family:monospace;" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Timestamp (Epoch Sec)</label>
                <div style="display:flex;gap:6px;">
                  <input type="number" id="whTimestamp" class="form-input" value="${Math.floor(Date.now() / 1000)}" style="width:100%;font-family:monospace;" />
                  <button class="btn btn-secondary" onclick="document.getElementById('whTimestamp').value = Math.floor(Date.now()/1000)" style="font-size:11px;padding:4px 8px;">Now</button>
                </div>
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Tolerance Window</label>
                <input type="number" id="whTolerance" class="form-input" value="300" style="width:100%;" />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Raw Payload (JSON/String)</label>
              <textarea id="whPayload" class="form-input" rows="7" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">{
  "id": "evt_1PxyZ9948",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "amount": 4999,
    "currency": "usd",
    "customer": "cus_99382"
  }
}</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.executeWebhookVerify()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>⚡</span> Run Edge Verification
            </button>
          </div>

          <!-- Right: Diagnostic Output -->
          <div id="whResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🔐</span>
              Click <strong>"Run Edge Verification"</strong> to evaluate webhook cryptographic signatures.
            </div>
          </div>
        </div>
      </div>
    `;

    // Load initial sign state
    window.loadWebhookPreset('stripe');
  };

  window.loadWebhookPreset = function (provider) {
    const provSelect = document.getElementById('whProvider');
    if (provSelect) provSelect.value = provider;

    const secretInput = document.getElementById('whSecret');
    const payloadInput = document.getElementById('whPayload');
    const now = Math.floor(Date.now() / 1000);
    const tsInput = document.getElementById('whTimestamp');
    if (tsInput) tsInput.value = now;

    if (provider === 'stripe') {
      if (secretInput) secretInput.value = 'whsec_99482_demo_key';
      if (payloadInput) payloadInput.value = JSON.stringify({ id: 'evt_1Pxy', type: 'payment_intent.succeeded', amount: 4999 }, null, 2);
    } else if (provider === 'github') {
      if (secretInput) secretInput.value = 'gh_webhook_secret_9981';
      if (payloadInput) payloadInput.value = JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'vault-edge' } }, null, 2);
    } else if (provider === 'shopify') {
      if (secretInput) secretInput.value = 'shpss_shopify_secret_token';
      if (payloadInput) payloadInput.value = JSON.stringify({ id: 994812, email: 'alex@corp.io', total_price: '49.00' }, null, 2);
    } else if (provider === 'slack') {
      if (secretInput) secretInput.value = 'slack_signing_secret_9921';
      if (payloadInput) payloadInput.value = 'command=%2Fvault&text=status&user_id=U99482';
    }

    // Auto sign to produce initial valid signature
    window.generateInitialSignature();
  };

  window.toggleWebhookAction = function (act) {
    const row = document.getElementById('whSigRow');
    if (row) row.style.display = act === 'sign' ? 'none' : 'block';
  };

  window.generateInitialSignature = async function () {
    const provider = document.getElementById('whProvider')?.value || 'stripe';
    const secret = document.getElementById('whSecret')?.value || '';
    const payload = document.getElementById('whPayload')?.value || '';
    const timestamp = document.getElementById('whTimestamp')?.value || Math.floor(Date.now() / 1000);

    try {
      const res = await fetch('/api/security/webhook-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, action: 'sign', secret, payload, timestamp })
      });
      const data = await res.json();
      if (data.success && data.generatedSignature) {
        const sigInput = document.getElementById('whSignature');
        if (sigInput) sigInput.value = data.generatedSignature;
        window.executeWebhookVerify();
      }
    } catch (_) {}
  };

  window.executeWebhookVerify = async function () {
    const panel = document.getElementById('whResultsPanel');
    if (!panel) return;

    const provider = document.getElementById('whProvider')?.value || 'stripe';
    const action = document.getElementById('whAction')?.value || 'verify';
    const secret = document.getElementById('whSecret')?.value || '';
    const payload = document.getElementById('whPayload')?.value || '';
    const signature = document.getElementById('whSignature')?.value || '';
    const timestamp = document.getElementById('whTimestamp')?.value || Math.floor(Date.now() / 1000);
    const toleranceSec = Number(document.getElementById('whTolerance')?.value) || 300;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Computing HMAC-SHA256 signature via Web Crypto...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/security/webhook-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, action, secret, payload, signature, timestamp, toleranceSec })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Verification failed');

      const isVerified = data.isValid;
      const statusColor = isVerified ? '#10b981' : '#ef4444';
      const statusBadge = isVerified ? 'VERIFIED AUTHENTIC' : 'INVALID / FORGED';

      panel.innerHTML = `
        <!-- Status Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid ${statusColor};border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;font-weight:700;">Signature Audit Status</div>
              <div style="font-size:20px;font-weight:800;color:${statusColor};display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span>${isVerified ? '✅' : '❌'}</span> ${statusBadge}
              </div>
            </div>
            <span class="badge" style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;font-size:12px;padding:6px 12px;">
              ${provider.toUpperCase()} GATEWAY
            </span>
          </div>
          ${data.isExpired ? `
            <div style="margin-top:12px;padding:8px 12px;background:#ef444415;border:1px solid #ef444440;border-radius:6px;color:#ef4444;font-size:12px;">
              ⚠️ <strong>Replay Attack Detected:</strong> Timestamp age is ${data.timestampAgeSec}s, which exceeds tolerance (${toleranceSec}s).
            </div>
          ` : ''}
        </div>

        <!-- Diagnostic Details -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:12px;">
          <h3 style="font-size:14px;font-weight:700;margin:0;">🔍 Cryptographic Signature Breakdown</h3>
          
          <div>
            <div style="font-size:11px;color:var(--muted,#888);font-weight:600;">Expected Computed Signature</div>
            <pre style="margin:4px 0 0 0;background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;color:#38bdf8;word-break:break-all;">${esc(data.expectedSignature || 'N/A')}</pre>
          </div>

          <div>
            <div style="font-size:11px;color:var(--muted,#888);font-weight:600;">Extracted Provided Signature</div>
            <pre style="margin:4px 0 0 0;background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;color:${isVerified ? '#10b981' : '#f59e0b'};word-break:break-all;">${esc(data.extractedProvidedSig || signature || 'N/A')}</pre>
          </div>

          <div>
            <div style="font-size:11px;color:var(--muted,#888);font-weight:600;">Raw String Signed</div>
            <pre style="margin:4px 0 0 0;background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;color:#94a3b8;max-height:80px;overflow-y:auto;white-space:pre-wrap;">${esc(data.dataToSign || '')}</pre>
          </div>

          <div>
            <div style="font-size:11px;color:var(--muted,#888);font-weight:600;">Generated HTTP Header</div>
            <pre style="margin:4px 0 0 0;background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;font-family:monospace;font-size:11px;color:#10b981;word-break:break-all;">${esc(data.generatedHeader || '')}</pre>
          </div>
        </div>

        <!-- Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:14px;font-weight:700;margin:0;">⚡ Edge Webhook Middleware Worker</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyWebhookWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerMiddlewareCode)}</pre>
        </div>
      `;

      window._currentWebhookWorkerCode = data.workerMiddlewareCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Verification Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyWebhookWorker = function () {
    if (window._currentWebhookWorkerCode) {
      navigator.clipboard.writeText(window._currentWebhookWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Webhook Verifier Worker!');
    }
  };


  // =========================================================================
  // 49. CLOUDFLARE EMAIL ROUTING & INBOUND MIME PARSER STUDIO
  // =========================================================================

  window._emailRoutingState = {
    forwardTarget: 'ops-team@corp-internal.com',
    r2Bucket: 'vault-emails-archive'
  };

  window.renderEmailRoutingStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">📧</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Cloudflare Email Routing & MIME Parser Studio</h1>
              <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:11px;">RFC 822 & SPF/DKIM</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Parse inbound MIME email streams, evaluate SPF/DKIM/DMARC deliverability, scan for phishing indicators, and generate Cloudflare Email Worker code.
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="window.loadEmailPreset('clean')" style="font-size:12px;padding:6px 12px;">
              <span>🟢</span> Stripe Invoice (Clean)
            </button>
            <button class="btn btn-secondary" onclick="window.loadEmailPreset('spoof')" style="font-size:12px;padding:6px 12px;">
              <span>🔴</span> Spoofed Phish (SPF Fail)
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: EML Input & Rules -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Forward Target</label>
                <input type="email" id="emlForwardTarget" class="form-input" value="ops-team@external-domain.com" style="width:100%;" />
              </div>
              <div>
                <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">R2 Archive Bucket</label>
                <input type="text" id="emlR2Bucket" class="form-input" value="vault-emails-archive" style="width:100%;font-family:monospace;" />
              </div>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Raw MIME / RFC 822 Email (EML)</label>
              <textarea id="emlRawText" class="form-input" rows="14" style="width:100%;font-family:monospace;font-size:12px;line-height:1.4;">From: "Stripe Billing" <billing@stripe.com>
To: admin@myedgevault.com
Subject: Invoice #INV-9284 Paid Successfully
Date: Wed, 24 Sep 2026 14:32:00 +0000
Message-ID: <stripe-inv-9284@mail.stripe.com>
MIME-Version: 1.0
Received-SPF: pass (cloudflare.net: domain of stripe.com designates 199.115.117.5 as permitted sender)
Authentication-Results: mx.cloudflare.net; spf=pass (stripe.com); dkim=pass header.d=stripe.com header.s=s1; dmarc=pass
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=stripe.com; s=s1; bh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=;
Content-Type: multipart/alternative; boundary="----=_Part_9284_1029384"

------=_Part_9284_1029384
Content-Type: text/plain; charset=UTF-8

Your invoice #INV-9284 for $49.00 USD has been successfully processed. Thank you for your business.

------=_Part_9284_1029384
Content-Type: text/html; charset=UTF-8

<p>Your invoice <strong>#INV-9284</strong> for <strong>$49.00 USD</strong> has been successfully processed.</p>
------=_Part_9284_1029384--</textarea>
            </div>

            <button class="btn btn-primary" onclick="window.executeEmailRouting()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>⚡</span> Parse & Audit Inbound Email
            </button>
          </div>

          <!-- Right: Output & Worker -->
          <div id="emlResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">📧</span>
              Click <strong>"Parse & Audit Inbound Email"</strong> to analyze headers, security status, and worker handlers.
            </div>
          </div>
        </div>
      </div>
    `;

    window.executeEmailRouting();
  };

  window.loadEmailPreset = function (type) {
    const rawEl = document.getElementById('emlRawText');
    if (!rawEl) return;

    if (type === 'spoof') {
      rawEl.value = `From: "Bank Wire Dept" <urgent-notify@fraud-payee-spoofer.net>
To: admin@myedgevault.com
Subject: URGENT: Wire Transfer Authorization & Immediate Account Action Required
Date: Wed, 24 Sep 2026 15:10:00 +0000
Message-ID: <wire-urg-1002@fraud-payee-spoofer.net>
Received-SPF: fail (cloudflare.net: domain of fraud-payee-spoofer.net does not designate 45.33.12.1)
Authentication-Results: mx.cloudflare.net; spf=fail; dkim=none; dmarc=fail
Content-Type: text/plain; charset=UTF-8

Please verify password and authorize this wire transfer immediately to prevent account suspension.`;
    } else {
      rawEl.value = `From: "Stripe Billing" <billing@stripe.com>
To: admin@myedgevault.com
Subject: Invoice #INV-9284 Paid Successfully
Date: Wed, 24 Sep 2026 14:32:00 +0000
Message-ID: <stripe-inv-9284@mail.stripe.com>
Received-SPF: pass (cloudflare.net: domain of stripe.com designates 199.115.117.5 as permitted sender)
Authentication-Results: mx.cloudflare.net; spf=pass (stripe.com); dkim=pass header.d=stripe.com header.s=s1; dmarc=pass
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=stripe.com; s=s1; bh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=;
Content-Type: text/plain; charset=UTF-8

Your invoice #INV-9284 for $49.00 USD has been successfully processed. Thank you for your business.`;
    }

    window.executeEmailRouting();
  };

  window.executeEmailRouting = async function () {
    const panel = document.getElementById('emlResultsPanel');
    if (!panel) return;

    const rawEml = document.getElementById('emlRawText')?.value || '';
    const forwardTarget = document.getElementById('emlForwardTarget')?.value || '';
    const r2Bucket = document.getElementById('emlR2Bucket')?.value || '';

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Parsing RFC 822 headers and deliverability signatures...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/email-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawEml, forwardTarget, r2Bucket })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Parsing failed');

      const isSpam = data.riskScore > 30;
      const riskColor = isSpam ? '#ef4444' : '#10b981';

      panel.innerHTML = `
        <!-- Deliverability & Auth Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:700;margin:0;">🛡️ Email Authentication & Security</h3>
            <span class="badge" style="background:${riskColor}22;color:${riskColor};border:1px solid ${riskColor}44;font-size:12px;padding:4px 10px;">
              Threat Score: ${data.riskScore}/100 (${isSpam ? 'Suspicious' : 'Clean'})
            </span>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;">
            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:11px;color:var(--muted,#888);font-weight:600;">SPF Status</div>
              <div style="font-weight:700;font-size:13px;margin-top:4px;color:${data.spfStatus === 'pass' ? '#10b981' : '#ef4444'};">
                ${data.spfStatus.toUpperCase()}
              </div>
            </div>

            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:11px;color:var(--muted,#888);font-weight:600;">DKIM Signature</div>
              <div style="font-weight:700;font-size:13px;margin-top:4px;color:${data.dkimStatus === 'pass' ? '#10b981' : '#ef4444'};">
                ${data.dkimStatus.toUpperCase()} (${esc(data.dkimDomain)})
              </div>
            </div>

            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:11px;color:var(--muted,#888);font-weight:600;">DMARC Policy</div>
              <div style="font-weight:700;font-size:13px;margin-top:4px;color:${data.dmarcStatus === 'pass' ? '#10b981' : '#ef4444'};">
                ${data.dmarcStatus.toUpperCase()}
              </div>
            </div>
          </div>

          <div style="margin-top:12px;font-size:12px;color:var(--muted,#888);">
            ${data.riskFlags.map(f => `<div style="display:flex;align-items:center;gap:6px;margin-top:2px;"><span>${f.includes('Clean') || f.includes('clean') ? '✅' : '⚠️'}</span> ${esc(f)}</div>`).join('')}
          </div>
        </div>

        <!-- Parsed Metadata Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:14px;font-weight:700;margin:0 0 10px 0;">📨 Parsed RFC 822 Metadata</h3>
          <div style="font-size:12px;line-height:1.6;display:flex;flex-direction:column;gap:4px;">
            <div><strong>From:</strong> <span style="font-family:monospace;color:#38bdf8;">${esc(data.from)}</span></div>
            <div><strong>To:</strong> <span style="font-family:monospace;color:#a78bfa;">${esc(data.to)}</span></div>
            <div><strong>Subject:</strong> <span>${esc(data.subject)}</span></div>
            <div><strong>Date:</strong> <span style="color:var(--muted,#888);">${esc(data.date)}</span></div>
            <div><strong>Message-ID:</strong> <span style="font-family:monospace;font-size:11px;color:var(--muted,#888);">${esc(data.messageId)}</span></div>
          </div>
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
            <div style="font-size:11px;color:var(--muted,#888);font-weight:600;margin-bottom:4px;">Extracted Plaintext Content</div>
            <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;font-family:monospace;font-size:12px;color:#e2e8f0;white-space:pre-wrap;max-height:100px;overflow-y:auto;">${esc(data.extractedPlaintext || '(Empty Body)')}</pre>
          </div>
        </div>

        <!-- Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:14px;font-weight:700;margin:0;">⚡ Cloudflare Email Worker Code</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyEmailWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerEmailCode)}</pre>
        </div>
      `;

      window._currentEmailWorkerCode = data.workerEmailCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Email Processing Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyEmailWorker = function () {
    if (window._currentEmailWorkerCode) {
      navigator.clipboard.writeText(window._currentEmailWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Email Routing Worker!');
    }
  };


  // =========================================================================
  // 50. EDGE URL REWRITE, DYNAMIC REVERSE PROXY & GATEWAY STUDIO
  // =========================================================================

  window._reverseProxyState = {
    rules: [
      { prefix: '/api/v2', upstream: 'https://origin-v2.internal.net', stripPrefix: true, cacheTtl: 300, injectHeaders: { 'X-Proxy-Gateway': 'Cloudflare-Edge-v2' } },
      { prefix: '/store', upstream: 'https://cdn.myshopify-store.com', stripPrefix: false, cacheTtl: 60, injectHeaders: { 'X-Micro-Frontend': 'Storefront' } },
      { prefix: '/docs', upstream: 'https://mintlify.cdn.cloudflare.net', stripPrefix: false, cacheTtl: 3600, injectHeaders: { 'X-Cache-Tier': 'Static-Docs' } }
    ]
  };

  window.renderReverseProxyStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🔄</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge URL Rewrite & Micro-Frontend Gateway</h1>
              <span class="badge" style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);font-size:11px;">Dynamic Reverse Proxy</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Configure path-based micro-frontend routes, upstream origin rewrites, header sanitization, edge cache policies, and generate production Cloudflare Worker reverse proxies.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Proxy Rules Config -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <h3 style="font-size:14px;font-weight:700;margin:0;">Routing Gateway Rules</h3>
              <button class="btn btn-secondary" onclick="window.addProxyRule()" style="font-size:11px;padding:4px 10px;">
                <span>＋</span> Add Rule
              </button>
            </div>

            <div id="proxyRulesList" style="display:flex;flex-direction:column;gap:10px;max-height:240px;overflow-y:auto;">
              ${window._reverseProxyState.rules.map((r, idx) => `
                <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:monospace;font-weight:700;color:var(--accent,#7c6af7);font-size:13px;">${esc(r.prefix)}/*</span>
                    <button class="btn btn-secondary" onclick="window.removeProxyRule(${idx})" style="font-size:10px;padding:2px 6px;color:#ef4444;">Remove</button>
                  </div>
                  <div style="font-size:11px;color:var(--muted,#888);word-break:break-all;">
                    &rarr; Upstream: <span style="font-family:monospace;color:#fff;">${esc(r.upstream)}</span>
                  </div>
                  <div style="font-size:11px;color:var(--muted,#888);display:flex;gap:12px;">
                    <span>Strip Prefix: <strong>${r.stripPrefix ? 'Yes' : 'No'}</strong></span>
                    <span>Edge Cache: <strong>${r.cacheTtl}s</strong></span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="border-top:1px solid var(--border);padding-top:12px;">
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Test Inbound URL</label>
              <input type="text" id="proxyTestUrl" class="form-input" value="https://myedgevault.com/api/v2/products/analytics?format=json" style="width:100%;font-family:monospace;" />
            </div>

            <button class="btn btn-primary" onclick="window.executeReverseProxyTest()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>⚡</span> Simulate Proxy Routing & Headers
            </button>
          </div>

          <!-- Right: Output -->
          <div id="proxyResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🔄</span>
              Click <strong>"Simulate Proxy Routing & Headers"</strong> to test edge prefix matching and header injection.
            </div>
          </div>
        </div>
      </div>
    `;

    window.executeReverseProxyTest();
  };

  window.addProxyRule = function () {
    const prefix = prompt('Enter path prefix (e.g. /auth):', '/auth');
    if (!prefix) return;
    const upstream = prompt('Enter upstream host (e.g. https://auth-service.corp.internal):', 'https://auth-service.corp.internal');
    if (!upstream) return;

    window._reverseProxyState.rules.push({
      prefix: prefix.trim(),
      upstream: upstream.trim(),
      stripPrefix: true,
      cacheTtl: 0,
      injectHeaders: { 'X-Edge-Auth-Proxy': 'true' }
    });

    window.renderReverseProxyStudio();
  };

  window.removeProxyRule = function (idx) {
    window._reverseProxyState.rules.splice(idx, 1);
    window.renderReverseProxyStudio();
  };

  window.executeReverseProxyTest = async function () {
    const panel = document.getElementById('proxyResultsPanel');
    if (!panel) return;

    const testUrl = document.getElementById('proxyTestUrl')?.value || 'https://myedgevault.com/api/v2/products/analytics?format=json';
    const rules = window._reverseProxyState.rules;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Executing prefix matching algorithm...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/reverse-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, testUrl })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Proxy simulation failed');

      panel.innerHTML = `
        <!-- Routing Decision Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid ${data.isMatched ? '#10b981' : '#f59e0b'};border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:12px;color:var(--muted,#888);font-weight:700;text-transform:uppercase;">Proxy Gateway Match Status</div>
            <span class="badge" style="background:${data.isMatched ? '#10b981' : '#f59e0b'}22;color:${data.isMatched ? '#10b981' : '#f59e0b'};border:1px solid ${data.isMatched ? '#10b981' : '#f59e0b'}44;font-size:12px;">
              ${data.isMatched ? 'PREFIX MATCHED' : 'DEFAULT PASSTHROUGH'}
            </span>
          </div>

          <div style="font-size:12px;margin-bottom:8px;">
            <strong>Target Upstream Rewritten URL:</strong>
            <pre style="margin:4px 0 0 0;background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;font-family:monospace;font-size:12px;color:#38bdf8;word-break:break-all;">${esc(data.rewrittenUpstreamUrl)}</pre>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;font-size:12px;">
            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;">
              <span style="color:var(--muted,#888);">Upstream Host:</span> <strong>${esc(data.targetHost)}</strong>
            </div>
            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:8px;">
              <span style="color:var(--muted,#888);">Edge Cache TTL:</span> <strong>${data.appliedTtl} seconds</strong>
            </div>
          </div>
        </div>

        <!-- Injected Headers Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:14px;font-weight:700;margin:0 0 10px 0;">⚡ Mutated Request Headers</h3>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;font-family:monospace;">
            ${Object.entries(data.injectedHeaders || {}).map(([k, v]) => `
              <div style="background:#0d0d14;border:1px solid var(--border);border-radius:6px;padding:6px 8px;display:flex;justify-content:space-between;">
                <span style="color:var(--accent,#7c6af7);">${esc(k)}</span>
                <span style="color:#fff;">${esc(v)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:14px;font-weight:700;margin:0;">⚡ Reverse Proxy Cloudflare Worker Code</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyProxyWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerProxyCode)}</pre>
        </div>
      `;

      window._currentProxyWorkerCode = data.workerProxyCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Simulation Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyProxyWorker = function () {
    if (window._currentProxyWorkerCode) {
      navigator.clipboard.writeText(window._currentProxyWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Reverse Proxy Worker!');
    }
  };


  // =========================================================================
  // 51. EDGE GEOLOCATION PERSONALIZATION, GEO-FENCING & GEOIP STUDIO
  // =========================================================================

  window._geoPersonalizeState = {
    simulatedCountry: 'US',
    basePriceUsd: 49.99
  };

  window.renderGeoPersonalizeStudio = function () {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">🌍</span>
              <h1 style="font-size:22px;font-weight:700;margin:0;color:var(--text,#fff);">Edge Geolocation & Personalization Engine</h1>
              <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent,#7c6af7);border:1px solid rgba(124,106,247,0.3);font-size:11px;">request.cf Engine</span>
            </div>
            <p style="color:var(--muted,#888);margin:4px 0 0 38px;font-size:13px;">
              Harness Cloudflare edge geolocation to localize currency and tax, enforce national compliance geo-fencing, and route to closest regional databases.
            </p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Left: Location & Rules Config -->
          <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
            
            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Simulated GeoIP Origin</label>
              <select id="geoCountry" class="form-input" style="width:100%;" onchange="window.executeGeoPersonalize()">
                <option value="US">🇺🇸 United States (New York, NA)</option>
                <option value="GB">🇬🇧 United Kingdom (London, Europe)</option>
                <option value="DE">🇩🇪 Germany (Frankfurt, EU)</option>
                <option value="JP">🇯🇵 Japan (Tokyo, Asia)</option>
                <option value="BR">🇧🇷 Brazil (São Paulo, South America)</option>
                <option value="SG">🇸🇬 Singapore (Southeast Asia)</option>
                <option value="AU">🇦🇺 Australia (Sydney, Oceania)</option>
                <option value="CA">🇨🇦 Canada (Toronto, NA)</option>
                <option value="IN">🇮🇳 India (Mumbai, Asia)</option>
                <option value="KP">🇰🇵 North Korea (Embargoed / Blocked)</option>
                <option value="RU">🇷🇺 Russian Federation (Sanctioned / Blocked)</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;font-weight:600;color:var(--muted,#888);display:block;margin-bottom:6px;">Base Catalog Price (USD $)</label>
              <input type="number" step="0.01" id="geoBasePrice" class="form-input" value="49.99" style="width:100%;font-family:monospace;" oninput="window.executeGeoPersonalize()" />
            </div>

            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;">
              <div style="font-weight:700;color:var(--accent,#7c6af7);margin-bottom:4px;">🛡️ Active Geo-Fence Policies</div>
              <div style="color:var(--muted,#888);line-height:1.5;">
                • <strong>Blocked Countries:</strong> KP, IR, SY, RU (HTTP 403 Forbidden)<br/>
                • <strong>Challenged Countries:</strong> CN, VN (Cloudflare Turnstile)<br/>
                • <strong>EU Countries:</strong> Automatic OSS/MOSS VAT & GDPR Consent Mode
              </div>
            </div>

            <button class="btn btn-primary" onclick="window.executeGeoPersonalize()" style="padding:10px 16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>⚡</span> Run Geolocation Personalization
            </button>
          </div>

          <!-- Right: Output -->
          <div id="geoResultsPanel" style="display:flex;flex-direction:column;gap:16px;">
            <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;color:var(--muted,#888);">
              <span style="font-size:42px;display:block;margin-bottom:12px;">🌍</span>
              Select a location to simulate Cloudflare edge geolocation personalizations.
            </div>
          </div>
        </div>
      </div>
    `;

    window.executeGeoPersonalize();
  };

  window.executeGeoPersonalize = async function () {
    const panel = document.getElementById('geoResultsPanel');
    if (!panel) return;

    const simulatedCountry = document.getElementById('geoCountry')?.value || 'US';
    const basePriceUsd = Number(document.getElementById('geoBasePrice')?.value) || 49.99;

    panel.innerHTML = `
      <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <span class="loading-spinner" style="display:inline-block;font-size:24px;margin-bottom:8px;">⏳</span>
        <div style="color:var(--muted,#888);font-size:13px;">Synthesizing request.cf telemetry and tax conversions...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/edge/geo-personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulatedCountry, basePriceUsd })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Geo evaluation failed');

      const isAllowed = data.fenceAction === 'ALLOW';
      const fenceColor = isAllowed ? '#10b981' : (data.fenceAction === 'CHALLENGE' ? '#f59e0b' : '#ef4444');

      panel.innerHTML = `
        <!-- Geo-Fence Compliance Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid ${fenceColor};border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:12px;color:var(--muted,#888);text-transform:uppercase;font-weight:700;">Geo-Fence Policy Verdict</div>
              <div style="font-size:20px;font-weight:800;color:${fenceColor};margin-top:4px;">
                ${data.fenceAction === 'ALLOW' ? '🟢 ALLOW (HTTP 200)' : data.fenceAction === 'CHALLENGE' ? '🟡 MANAGED CHALLENGE' : '🔴 BLOCKED (HTTP 403)'}
              </div>
            </div>
            <span class="badge" style="background:${fenceColor}22;color:${fenceColor};border:1px solid ${fenceColor}44;font-size:12px;">
              ${data.geo.country} • ${data.geo.city}
            </span>
          </div>
          <div style="font-size:12px;color:var(--muted,#888);margin-top:8px;">
            ${esc(data.fenceReason)}
          </div>
        </div>

        <!-- Localized Pricing & Currency Card -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:14px;font-weight:700;margin:0 0 12px 0;">💰 Localized Price & VAT Engine</h3>
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;text-align:center;">
            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:var(--muted,#888);">Local Currency</div>
              <div style="font-size:15px;font-weight:800;color:var(--accent,#7c6af7);margin-top:4px;">
                ${data.pricing.currency} (${data.pricing.currencySymbol})
              </div>
            </div>
            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:var(--muted,#888);">${data.pricing.vatName || 'Tax / VAT'}</div>
              <div style="font-size:15px;font-weight:800;color:#f59e0b;margin-top:4px;">
                +${data.pricing.currencySymbol}${data.pricing.taxAmount}
              </div>
            </div>
            <div style="background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:var(--muted,#888);">Final Customer Total</div>
              <div style="font-size:15px;font-weight:800;color:#10b981;margin-top:4px;">
                ${data.pricing.formattedTotal}
              </div>
            </div>
          </div>
        </div>

        <!-- Regional Database Latency Optimizer -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <h3 style="font-size:14px;font-weight:700;margin:0 0 10px 0;">🌐 Database Replica Routing (Lowest Latency)</h3>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
            ${(data.regionalRouting?.allRegions || []).map((r, i) => `
              <div style="background:#0d0d14;border:1px solid ${i === 0 ? '#10b981' : 'var(--border)'};border-radius:6px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span style="font-weight:700;color:#fff;">${esc(r.regionName)}</span>
                  ${i === 0 ? '<span class="badge" style="font-size:10px;background:#10b98122;color:#10b981;margin-left:6px;">OPTIMAL ORIGIN</span>' : ''}
                </div>
                <div style="font-family:monospace;color:var(--muted,#888);">
                  ${r.distanceKm.toLocaleString()} km • <span style="color:#38bdf8;">~${r.estimatedLatencyMs}ms</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Worker Code -->
        <div style="background:var(--surface,#1a1a24);border:1px solid var(--border);border-radius:12px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:14px;font-weight:700;margin:0;">⚡ HTMLRewriter & GeoIP Cloudflare Worker</h3>
            <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px;" onclick="window.copyGeoWorker()">
              <span>📋</span> Copy Code
            </button>
          </div>
          <pre style="margin:0;background:#0d0d14;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#cbd5e1;overflow-x:auto;max-height:220px;line-height:1.5;">${esc(data.workerGeoCode)}</pre>
        </div>
      `;

      window._currentGeoWorkerCode = data.workerGeoCode;
    } catch (err) {
      panel.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Personalization Error: ${esc(err.message)}</div>`;
    }
  };

  window.copyGeoWorker = function () {
    if (window._currentGeoWorkerCode) {
      navigator.clipboard.writeText(window._currentGeoWorkerCode);
      if (typeof window.showToast === 'function') window.showToast('Copied Geo Personalization Worker!');
    }
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

    // 8. Semantic Search
    const searchBtn = document.createElement('button');
    searchBtn.className = 'tab';
    searchBtn.id = 'tab-semanticsearch';
    searchBtn.innerHTML = '<span>🧠</span> Semantic RAG';
    searchBtn.onclick = () => window.switchTab('semanticsearch');

    // 9. WAF Simulator
    const wafBtn = document.createElement('button');
    wafBtn.className = 'tab';
    wafBtn.id = 'tab-wafsim';
    wafBtn.innerHTML = '<span>🛡️</span> WAF & Edge Rules';
    wafBtn.onclick = () => window.switchTab('wafsim');

    // 10. Webhook Dispatcher
    const whBtn = document.createElement('button');
    whBtn.className = 'tab';
    whBtn.id = 'tab-webhooks';
    whBtn.innerHTML = '<span>📡</span> Webhooks';
    whBtn.onclick = () => window.switchTab('webhooks');

    // 11. TLS Inspector
    const tlsBtn = document.createElement('button');
    tlsBtn.className = 'tab';
    tlsBtn.id = 'tab-tlsinspect';
    tlsBtn.innerHTML = '<span>🔒</span> TLS Handshake';
    tlsBtn.onclick = () => window.switchTab('tlsinspect');

    // 12. Security Headers
    const secBtn = document.createElement('button');
    secBtn.className = 'tab';
    secBtn.id = 'tab-secstudio';
    secBtn.innerHTML = '<span>🛡️</span> Sec Headers';
    secBtn.onclick = () => window.switchTab('secstudio');

    // 13. Cron Triggers
    const cronBtn = document.createElement('button');
    cronBtn.className = 'tab';
    cronBtn.id = 'tab-cronstudio';
    cronBtn.innerHTML = '<span>⏰</span> Cron Triggers';
    cronBtn.onclick = () => window.switchTab('cronstudio');

    // 14. KV Storage
    const kvBtn = document.createElement('button');
    kvBtn.className = 'tab';
    kvBtn.id = 'tab-kvstudio';
    kvBtn.innerHTML = '<span>🗄️</span> KV Storage';
    kvBtn.onclick = () => window.switchTab('kvstudio');

    // 15. Keypair Generator
    const keyBtn = document.createElement('button');
    keyBtn.className = 'tab';
    keyBtn.id = 'tab-keygen';
    keyBtn.innerHTML = '<span>🔑</span> SSH & Keypair';
    keyBtn.onclick = () => window.switchTab('keygen');

    // 16. DoH Benchmark
    const dohBtn = document.createElement('button');
    dohBtn.className = 'tab';
    dohBtn.id = 'tab-dohbench';
    dohBtn.innerHTML = '<span>🌐</span> DoH Resolvers';
    dohBtn.onclick = () => window.switchTab('dohbench');

    // 17. Rate Limiting
    const rateBtn = document.createElement('button');
    rateBtn.className = 'tab';
    rateBtn.id = 'tab-ratelimit';
    rateBtn.innerHTML = '<span>🚦</span> Rate Limiting';
    rateBtn.onclick = () => window.switchTab('ratelimit');

    // 18. CDN Cache & Purge
    const cacheBtn = document.createElement('button');
    cacheBtn.className = 'tab';
    cacheBtn.id = 'tab-cachestudio';
    cacheBtn.innerHTML = '<span>⚡</span> CDN Cache';
    cacheBtn.onclick = () => window.switchTab('cachestudio');

    // 19. Wirefilter Tester
    const wireBtn = document.createElement('button');
    wireBtn.className = 'tab';
    wireBtn.id = 'tab-wirefilter';
    wireBtn.innerHTML = '<span>📐</span> Wirefilter';
    wireBtn.onclick = () => window.switchTab('wirefilter');

    // 20. JWT Inspector
    const jwtBtn = document.createElement('button');
    jwtBtn.className = 'tab';
    jwtBtn.id = 'tab-jwtstudio';
    jwtBtn.innerHTML = '<span>🎟️</span> JWT Inspector';
    jwtBtn.onclick = () => window.switchTab('jwtstudio');

    // 21. Transform Rules
    const transBtn = document.createElement('button');
    transBtn.className = 'tab';
    transBtn.id = 'tab-transformrules';
    transBtn.innerHTML = '<span>🔄</span> Transform Rules';
    transBtn.onclick = () => window.switchTab('transformrules');

    // 22. CIDR Calculator
    const cidrBtn = document.createElement('button');
    cidrBtn.className = 'tab';
    cidrBtn.id = 'tab-cidrcalc';
    cidrBtn.innerHTML = '<span>🔢</span> CIDR & Subnet';
    cidrBtn.onclick = () => window.switchTab('cidrcalc');

    // 23. Security.txt Auditor
    const secTxtBtn = document.createElement('button');
    secTxtBtn.className = 'tab';
    secTxtBtn.id = 'tab-sectxt';
    secTxtBtn.innerHTML = '<span>📄</span> security.txt';
    secTxtBtn.onclick = () => window.switchTab('sectxt');

    // 24. Email Security (SPF & DMARC)
    const emailBtn = document.createElement('button');
    emailBtn.className = 'tab';
    emailBtn.id = 'tab-emailsec';
    emailBtn.innerHTML = '<span>📧</span> Email SPF/DMARC';
    emailBtn.onclick = () => window.switchTab('emailsec');

    // 25. Zero Trust Access
    const ztBtn = document.createElement('button');
    ztBtn.className = 'tab';
    ztBtn.id = 'tab-zerotrust';
    ztBtn.innerHTML = '<span>🛡️</span> Zero Trust';
    ztBtn.onclick = () => window.switchTab('zerotrust');

    // 26. HTTP/3 & ALPN Probe
    const httpBtn = document.createElement('button');
    httpBtn.className = 'tab';
    httpBtn.id = 'tab-httpprobe';
    httpBtn.innerHTML = '<span>⚡</span> HTTP/3 & ALPN';
    httpBtn.onclick = () => window.switchTab('httpprobe');

    // 27. Regex & ReDoS Benchmark
    const regBtn = document.createElement('button');
    regBtn.className = 'tab';
    regBtn.id = 'tab-regexbench';
    regBtn.innerHTML = '<span>🧩</span> Regex & ReDoS';
    regBtn.onclick = () => window.switchTab('regexbench');

    // 28. Custom Error Pages
    const errBtn = document.createElement('button');
    errBtn.className = 'tab';
    errBtn.id = 'tab-errorpages';
    errBtn.innerHTML = '<span>🛑</span> Custom Error Pages';
    errBtn.onclick = () => window.switchTab('errorpages');

    // 29. CORS Policy Auditor
    const corsBtn = document.createElement('button');
    corsBtn.className = 'tab';
    corsBtn.id = 'tab-corsaudit';
    corsBtn.innerHTML = '<span>🌐</span> CORS Auditor';
    corsBtn.onclick = () => window.switchTab('corsaudit');

    // 30. Cache-Tags & Purge
    const tagBtn = document.createElement('button');
    tagBtn.className = 'tab';
    tagBtn.id = 'tab-cachetags';
    tagBtn.innerHTML = '<span>🏷️</span> Cache-Tags';
    tagBtn.onclick = () => window.switchTab('cachetags');

    // 31. Anycast & BGP PoP
    const bgpBtn = document.createElement('button');
    bgpBtn.className = 'tab';
    bgpBtn.id = 'tab-bgproute';
    bgpBtn.innerHTML = '<span>🗺️</span> Anycast & BGP PoP';
    bgpBtn.onclick = () => window.switchTab('bgproute');

    // 32. Queues & DLQ Pipeline
    const qBtn = document.createElement('button');
    qBtn.className = 'tab';
    qBtn.id = 'tab-queuesdlq';
    qBtn.innerHTML = '<span>📬</span> Queues & DLQ';
    qBtn.onclick = () => window.switchTab('queuesdlq');

    // 33. Cookie Security & Hardener
    const cookieBtn = document.createElement('button');
    cookieBtn.className = 'tab';
    cookieBtn.id = 'tab-cookiehardener';
    cookieBtn.innerHTML = '<span>🍪</span> Cookie Hardener';
    cookieBtn.onclick = () => window.switchTab('cookiehardener');

    // 34. Canary Traffic Splitter
    const canaryBtn = document.createElement('button');
    canaryBtn.className = 'tab';
    canaryBtn.id = 'tab-canarysplit';
    canaryBtn.innerHTML = '<span>🚦</span> Canary Splitter';
    canaryBtn.onclick = () => window.switchTab('canarysplit');

    // 35. SRI Edge Locker
    const sriBtn = document.createElement('button');
    sriBtn.className = 'tab';
    sriBtn.id = 'tab-srilocker';
    sriBtn.innerHTML = '<span>🔒</span> SRI Edge Locker';
    sriBtn.onclick = () => window.switchTab('srilocker');

    // 36. Edge WebSockets
    const wsBtn = document.createElement('button');
    wsBtn.className = 'tab';
    wsBtn.id = 'tab-websockets';
    wsBtn.innerHTML = '<span>⚡</span> Edge WebSockets';
    wsBtn.onclick = () => window.switchTab('websockets');

    // 37. Bot & JA4 Analyzer
    const botBtn = document.createElement('button');
    botBtn.className = 'tab';
    botBtn.id = 'tab-botanalyzer';
    botBtn.innerHTML = '<span>🤖</span> Bot & JA4';
    botBtn.onclick = () => window.switchTab('botanalyzer');

    // 38. OpenAPI Gateway
    const apiBtn = document.createElement('button');
    apiBtn.className = 'tab';
    apiBtn.id = 'tab-openapigateway';
    apiBtn.innerHTML = '<span>📐</span> OpenAPI Gateway';
    apiBtn.onclick = () => window.switchTab('openapigateway');

    // 39. Image Resizing & Polish
    const imgBtn = document.createElement('button');
    imgBtn.className = 'tab';
    imgBtn.id = 'tab-imageresize';
    imgBtn.innerHTML = '<span>🖼️</span> Image Resizing';
    imgBtn.onclick = () => window.switchTab('imageresize');

    // 40. Feature Flags & Remote Config
    const flagsBtn = document.createElement('button');
    flagsBtn.className = 'tab';
    flagsBtn.id = 'tab-featureflags';
    flagsBtn.innerHTML = '<span>🚩</span> Feature Flags';
    flagsBtn.onclick = () => window.switchTab('featureflags');

    // 41. mTLS & Client Certs
    const mtlsBtn = document.createElement('button');
    mtlsBtn.className = 'tab';
    mtlsBtn.id = 'tab-mtls';
    mtlsBtn.innerHTML = '<span>🔐</span> mTLS Architect';
    mtlsBtn.onclick = () => window.switchTab('mtls');

    // 42. 103 Early Hints
    const hintsBtn = document.createElement('button');
    hintsBtn.className = 'tab';
    hintsBtn.id = 'tab-earlyhints';
    hintsBtn.innerHTML = '<span>🚀</span> 103 Early Hints';
    hintsBtn.onclick = () => window.switchTab('earlyhints');

    // 43. SSE Live Multiplexer
    const sseBtn = document.createElement('button');
    sseBtn.className = 'tab';
    sseBtn.id = 'tab-ssemultiplex';
    sseBtn.innerHTML = '<span>📡</span> SSE Multiplex';
    sseBtn.onclick = () => window.switchTab('ssemultiplex');

    // 44. GraphQL Edge Shield
    const graphqlBtn = document.createElement('button');
    graphqlBtn.className = 'tab';
    graphqlBtn.id = 'tab-graphqlshield';
    graphqlBtn.innerHTML = '<span>🛡️</span> GraphQL Shield';
    graphqlBtn.onclick = () => window.switchTab('graphqlshield');

    // 45. HLS Stream Rewriter
    const hlsBtn = document.createElement('button');
    hlsBtn.className = 'tab';
    hlsBtn.id = 'tab-hlsrewriter';
    hlsBtn.innerHTML = '<span>🎞️</span> HLS Rewriter';
    hlsBtn.onclick = () => window.switchTab('hlsrewriter');

    // 46. Logpush Pipeline & SIEM
    const logpushBtn = document.createElement('button');
    logpushBtn.className = 'tab';
    logpushBtn.id = 'tab-logpush';
    logpushBtn.innerHTML = '<span>📊</span> Logpush SIEM';
    logpushBtn.onclick = () => window.switchTab('logpush');

    // 47. Edge Types & Zod Generator
    const typesBtn = document.createElement('button');
    typesBtn.className = 'tab';
    typesBtn.id = 'tab-typesgen';
    typesBtn.innerHTML = '<span>📐</span> Type Safety & Zod';
    typesBtn.onclick = () => window.switchTab('typesgen');

    // 48. Webhook Verifier
    const whVerifyBtn = document.createElement('button');
    whVerifyBtn.className = 'tab';
    whVerifyBtn.id = 'tab-webhookverify';
    whVerifyBtn.innerHTML = '<span>🔐</span> Webhook Verifier';
    whVerifyBtn.onclick = () => window.switchTab('webhookverify');

    // 49. Email Routing & MIME Parser
    const emailRouteBtn = document.createElement('button');
    emailRouteBtn.className = 'tab';
    emailRouteBtn.id = 'tab-emailrouting';
    emailRouteBtn.innerHTML = '<span>📧</span> Email Routing';
    emailRouteBtn.onclick = () => window.switchTab('emailrouting');

    // 50. Reverse Proxy Gateway
    const revProxyBtn = document.createElement('button');
    revProxyBtn.className = 'tab';
    revProxyBtn.id = 'tab-reverseproxy';
    revProxyBtn.innerHTML = '<span>🔄</span> Reverse Proxy';
    revProxyBtn.onclick = () => window.switchTab('reverseproxy');

    // 51. Geo Personalize
    const geoBtn = document.createElement('button');
    geoBtn.className = 'tab';
    geoBtn.id = 'tab-geopersonalize';
    geoBtn.innerHTML = '<span>🌍</span> Geo Personalize';
    geoBtn.onclick = () => window.switchTab('geopersonalize');

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
      tabsContainer.insertBefore(searchBtn, ipBtn.nextSibling);
      tabsContainer.insertBefore(wafBtn, searchBtn.nextSibling);
      tabsContainer.insertBefore(whBtn, wafBtn.nextSibling);
      tabsContainer.insertBefore(tlsBtn, whBtn.nextSibling);
      tabsContainer.insertBefore(secBtn, tlsBtn.nextSibling);
      tabsContainer.insertBefore(cronBtn, secBtn.nextSibling);
      tabsContainer.insertBefore(kvBtn, cronBtn.nextSibling);
      tabsContainer.insertBefore(keyBtn, kvBtn.nextSibling);
      tabsContainer.insertBefore(dohBtn, keyBtn.nextSibling);
      tabsContainer.insertBefore(rateBtn, dohBtn.nextSibling);
      tabsContainer.insertBefore(cacheBtn, rateBtn.nextSibling);
      tabsContainer.insertBefore(wireBtn, cacheBtn.nextSibling);
      tabsContainer.insertBefore(jwtBtn, wireBtn.nextSibling);
      tabsContainer.insertBefore(transBtn, jwtBtn.nextSibling);
      tabsContainer.insertBefore(cidrBtn, transBtn.nextSibling);
      tabsContainer.insertBefore(secTxtBtn, cidrBtn.nextSibling);
      tabsContainer.insertBefore(emailBtn, secTxtBtn.nextSibling);
      tabsContainer.insertBefore(ztBtn, emailBtn.nextSibling);
      tabsContainer.insertBefore(httpBtn, ztBtn.nextSibling);
      tabsContainer.insertBefore(regBtn, httpBtn.nextSibling);
      tabsContainer.insertBefore(errBtn, regBtn.nextSibling);
      tabsContainer.insertBefore(corsBtn, errBtn.nextSibling);
      tabsContainer.insertBefore(tagBtn, corsBtn.nextSibling);
      tabsContainer.insertBefore(bgpBtn, tagBtn.nextSibling);
      tabsContainer.insertBefore(qBtn, bgpBtn.nextSibling);
      tabsContainer.insertBefore(cookieBtn, qBtn.nextSibling);
      tabsContainer.insertBefore(canaryBtn, cookieBtn.nextSibling);
      tabsContainer.insertBefore(sriBtn, canaryBtn.nextSibling);
      tabsContainer.insertBefore(wsBtn, sriBtn.nextSibling);
      tabsContainer.insertBefore(botBtn, wsBtn.nextSibling);
      tabsContainer.insertBefore(apiBtn, botBtn.nextSibling);
      tabsContainer.insertBefore(imgBtn, apiBtn.nextSibling);
      tabsContainer.insertBefore(flagsBtn, imgBtn.nextSibling);
      tabsContainer.insertBefore(mtlsBtn, flagsBtn.nextSibling);
      tabsContainer.insertBefore(hintsBtn, mtlsBtn.nextSibling);
      tabsContainer.insertBefore(sseBtn, hintsBtn.nextSibling);
      tabsContainer.insertBefore(graphqlBtn, sseBtn.nextSibling);
      tabsContainer.insertBefore(hlsBtn, graphqlBtn.nextSibling);
      tabsContainer.insertBefore(logpushBtn, hlsBtn.nextSibling);
      tabsContainer.insertBefore(typesBtn, logpushBtn.nextSibling);
      tabsContainer.insertBefore(whVerifyBtn, typesBtn.nextSibling);
      tabsContainer.insertBefore(emailRouteBtn, whVerifyBtn.nextSibling);
      tabsContainer.insertBefore(revProxyBtn, emailRouteBtn.nextSibling);
      tabsContainer.insertBefore(geoBtn, revProxyBtn.nextSibling);
    } else {
      tabsContainer.appendChild(docBtn);
      tabsContainer.appendChild(edgeBtn);
      tabsContainer.appendChild(codeBtn);
      tabsContainer.appendChild(totpBtn);
      tabsContainer.appendChild(d1Btn);
      tabsContainer.appendChild(certBtn);
      tabsContainer.appendChild(ipBtn);
      tabsContainer.appendChild(searchBtn);
      tabsContainer.appendChild(wafBtn);
      tabsContainer.appendChild(whBtn);
      tabsContainer.appendChild(tlsBtn);
      tabsContainer.appendChild(secBtn);
      tabsContainer.appendChild(cronBtn);
      tabsContainer.appendChild(kvBtn);
      tabsContainer.appendChild(keyBtn);
      tabsContainer.appendChild(dohBtn);
      tabsContainer.appendChild(rateBtn);
      tabsContainer.appendChild(cacheBtn);
      tabsContainer.appendChild(wireBtn);
      tabsContainer.appendChild(jwtBtn);
      tabsContainer.appendChild(transBtn);
      tabsContainer.appendChild(cidrBtn);
      tabsContainer.appendChild(secTxtBtn);
      tabsContainer.appendChild(emailBtn);
      tabsContainer.appendChild(ztBtn);
      tabsContainer.appendChild(httpBtn);
      tabsContainer.appendChild(regBtn);
      tabsContainer.appendChild(errBtn);
      tabsContainer.appendChild(corsBtn);
      tabsContainer.appendChild(tagBtn);
      tabsContainer.appendChild(bgpBtn);
      tabsContainer.appendChild(qBtn);
      tabsContainer.appendChild(cookieBtn);
      tabsContainer.appendChild(canaryBtn);
      tabsContainer.appendChild(sriBtn);
      tabsContainer.appendChild(wsBtn);
      tabsContainer.appendChild(botBtn);
      tabsContainer.appendChild(apiBtn);
      tabsContainer.appendChild(imgBtn);
      tabsContainer.appendChild(flagsBtn);
      tabsContainer.appendChild(mtlsBtn);
      tabsContainer.appendChild(hintsBtn);
      tabsContainer.appendChild(sseBtn);
      tabsContainer.appendChild(graphqlBtn);
      tabsContainer.appendChild(hlsBtn);
      tabsContainer.appendChild(logpushBtn);
      tabsContainer.appendChild(typesBtn);
      tabsContainer.appendChild(whVerifyBtn);
      tabsContainer.appendChild(emailRouteBtn);
      tabsContainer.appendChild(revProxyBtn);
      tabsContainer.appendChild(geoBtn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExtendedNavButtons);
  } else {
    injectExtendedNavButtons();
  }

  console.log('[AI-Cloud-Studio-Extended] Initialized successfully.');
})();
