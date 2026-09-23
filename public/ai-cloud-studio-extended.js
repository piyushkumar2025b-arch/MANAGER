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

    if (typeof origSwitchTab === 'function') {
      origSwitchTab(tab);
    }
  };

  function updateNavHighlight(activeId) {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(activeId);
    if (btn) btn.classList.add('active');
  }

  // Inject additional navigation tabs into the tabs container
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

    // Insert after cloudflare tab
    const cfTab = document.getElementById('tab-cloudflare');
    if (cfTab && cfTab.nextSibling) {
      tabsContainer.insertBefore(docBtn, cfTab.nextSibling);
      tabsContainer.insertBefore(edgeBtn, docBtn.nextSibling);
      tabsContainer.insertBefore(codeBtn, edgeBtn.nextSibling);
    } else {
      tabsContainer.appendChild(docBtn);
      tabsContainer.appendChild(edgeBtn);
      tabsContainer.appendChild(codeBtn);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExtendedNavButtons);
  } else {
    injectExtendedNavButtons();
  }

  console.log('[AI-Cloud-Studio-Extended] Initialized successfully.');
})();
