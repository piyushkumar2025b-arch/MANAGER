// ============================================================================
// 🤖 VAULT BOT CONTROLLER SUITE (TELEGRAM & DISCORD INTEGRATIONS & DISPATCHER)
// ============================================================================

(function() {
  'use strict';

  let currentBotSubtab = 'telegram'; // 'telegram' | 'discord' | 'broadcast' | 'logs'
  let isCheckingStatus = false;
  let botConfig = {
    telegram: { configured: false, chatIdConfigured: false, defaultChatId: null },
    discord: { botConfigured: false, webhookConfigured: false, clientId: null },
    logsCount: 0
  };

  // Cached bot diagnostics state
  let telegramBotInfo = null;
  let telegramWebhookInfo = null;
  let discordBotInfo = null;
  let discordWebhookInfo = null;
  let discordGuilds = [];
  let discordChannels = [];
  let botLogs = [];
  let autoRefreshLogsInterval = null;

  // Telegram builder state
  let tgInlineButtons = [
    { text: '🔐 Open Vault', url: window.location.origin }
  ];

  // Discord Embed builder state
  let discordEmbedState = {
    title: '🛡️ Vault Sentinel System Notice',
    url: window.location.origin,
    description: 'All system nodes are running with encrypted master key protection. Cloudflare edge synchronization healthy.',
    color: '#7c6af7',
    authorName: 'Vault Security Sentinel',
    authorIcon: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f512.png',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: 'Vault Copilot • Automated Health Check',
    timestamp: true,
    fields: [
      { name: 'Status', value: '🟢 Operational', inline: true },
      { name: 'Host', value: 'Edge Node (CF/Pages)', inline: true },
      { name: 'Master Key', value: 'Active', inline: true }
    ]
  };

  // Persistent Server/Edge Credentials state
  let serverBotCredentials = {
    telegram_bot_token: '',
    telegram_chat_id: '',
    discord_bot_token: '',
    discord_webhook_url: '',
    discord_channel_id: '',
    discord_client_id: ''
  };

  // Subtabs configuration
  const BOT_SUBTABS = [
    { id: 'telegram', icon: '✈️', label: 'Telegram Bot' },
    { id: 'discord', icon: '🎮', label: 'Discord Bot & Webhooks' },
    { id: 'broadcast', icon: '📢', label: 'Unified Broadcaster' },
    { id: 'edge', icon: '⚡', label: 'Cloudflare Edge 24/7' },
    { id: 'logs', icon: '📜', label: 'Activity & Webhook Stream' }
  ];

  // Helper for notifications / toast
  function showBotToast(msg, isError = false) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
    } else {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = msg;
        toast.style.borderColor = isError ? 'var(--red)' : 'var(--accent)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      }
    }
  }

  // Load config from server
  async function fetchBotsConfig() {
    try {
      const res = await fetch('/api/bots/config');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          botConfig = data;
        }
      }
    } catch (_) {}
  }

  // Fetch persistent credentials from SQLite / Cloudflare KV & Workers D1
  async function fetchBotsCredentials() {
    try {
      const res = await fetch('/api/bots/credentials');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.credentials) {
          serverBotCredentials = { ...serverBotCredentials, ...data.credentials };
          // If local storage is empty, populate with server-stored values
          if (!localStorage.getItem('vault_tg_chat_id') && data.credentials.telegram_chat_id) {
            localStorage.setItem('vault_tg_chat_id', data.credentials.telegram_chat_id);
          }
          if (!localStorage.getItem('vault_dc_channel_id') && data.credentials.discord_channel_id) {
            localStorage.setItem('vault_dc_channel_id', data.credentials.discord_channel_id);
          }
        }
      }
    } catch (_) {}
  }

  // Save persistent credentials to server & Cloudflare edge 24/7
  window.saveBotCredentialsToServer = async function(updates) {
    try {
      const res = await fetch('/api/bots/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showBotToast('✅ Credentials synced to Cloudflare Edge & Database!');
        await fetchBotsCredentials();
        await fetchBotsConfig();
        const tgBadge = document.getElementById('tg-header-badge');
        if (tgBadge && botConfig.telegram?.configured) {
          tgBadge.textContent = '● Configured';
          tgBadge.style.color = 'var(--green)';
        }
        const dcBadge = document.getElementById('dc-header-badge');
        if (dcBadge && (botConfig.discord?.botConfigured || botConfig.discord?.webhookConfigured)) {
          dcBadge.textContent = '● Connected';
          dcBadge.style.color = 'var(--green)';
        }
        return true;
      } else {
        showBotToast('Failed to sync credentials: ' + (data.error || 'Server error'), true);
        return false;
      }
    } catch (err) {
      showBotToast('Sync error: ' + err.message, true);
      return false;
    }
  };

  // Main Tab Renderer
  window.renderBotControllerTab = async function() {
    const content = document.getElementById('mainContent');
    if (!content) return;

    await Promise.all([fetchBotsConfig(), fetchBotsCredentials()]);

    content.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:18px;max-width:1400px;margin:0 auto;width:100%;">
        <!-- TOP HEADER & CONTROLLER SUMMARY -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px 22px;">
          <div>
            <div style="font-size:22px;font-weight:700;display:flex;align-items:center;gap:10px;color:var(--text);">
              <span>🤖</span> Bot Controller & Automation Command Center
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">
              Manage, dispatch, and automate your Telegram and Discord Bots. Real-time rich embeds, webhooks, slash commands, and inbound message streams.
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:12px;">
              <span>✈️ Telegram:</span>
              <span id="tg-header-badge" style="font-weight:600;color:${botConfig.telegram?.configured ? 'var(--green)' : 'var(--muted)'};">
                ${botConfig.telegram?.configured ? '● Configured' : '○ Ready to Connect'}
              </span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:12px;">
              <span>🎮 Discord:</span>
              <span id="dc-header-badge" style="font-weight:600;color:${botConfig.discord?.botConfigured || botConfig.discord?.webhookConfigured ? 'var(--green)' : 'var(--muted)'};">
                ${botConfig.discord?.botConfigured ? '● Bot Active' : botConfig.discord?.webhookConfigured ? '● Webhook Active' : '○ Ready to Connect'}
              </span>
            </div>
            <button class="filter-pill" onclick="window.refreshAllBotDiagnostics()" style="font-size:12px;display:flex;align-items:center;gap:6px;padding:6px 14px;cursor:pointer;">
              <span>🔄</span> Refresh Status
            </button>
          </div>
        </div>

        <!-- SUBNAV PILLS BAR -->
        <div class="bot-subnav" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;-webkit-overflow-scrolling:touch;">
          ${BOT_SUBTABS.map(st => `
            <button 
              id="bot-subbtn-${st.id}"
              class="settings-cat-pill ${currentBotSubtab === st.id ? 'active' : ''}" 
              onclick="window.switchBotSubtab('${st.id}')"
              style="font-size:13px;padding:8px 16px;white-space:nowrap;display:flex;align-items:center;gap:8px;border-radius:8px;border:1px solid ${currentBotSubtab === st.id ? 'var(--accent)' : 'var(--border)'};background:${currentBotSubtab === st.id ? 'var(--surface2)' : 'var(--surface)'};color:${currentBotSubtab === st.id ? 'var(--accent)' : 'var(--text)'};font-weight:600;cursor:pointer;transition:all 0.15s;"
            >
              <span>${st.icon}</span>
              <span>${st.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- SUBTAB CONTENT CONTAINER -->
        <div id="botSubtabContent" style="display:flex;flex-direction:column;gap:18px;">
          <!-- Loaded dynamically based on currentBotSubtab -->
        </div>
      </div>
    `;

    renderActiveBotSubtab();
  };

  // Switch Subtab
  window.switchBotSubtab = function(tabId) {
    currentBotSubtab = tabId;
    BOT_SUBTABS.forEach(st => {
      const btn = document.getElementById(`bot-subbtn-${st.id}`);
      if (btn) {
        if (st.id === tabId) {
          btn.classList.add('active');
          btn.style.borderColor = 'var(--accent)';
          btn.style.color = 'var(--accent)';
          btn.style.background = 'var(--surface2)';
        } else {
          btn.classList.remove('active');
          btn.style.borderColor = 'var(--border)';
          btn.style.color = 'var(--text)';
          btn.style.background = 'var(--surface)';
        }
      }
    });
    renderActiveBotSubtab();
  };

  // Render active subtab
  function renderActiveBotSubtab() {
    const container = document.getElementById('botSubtabContent');
    if (!container) return;

    if (currentBotSubtab === 'telegram') {
      renderTelegramSubtab(container);
    } else if (currentBotSubtab === 'discord') {
      renderDiscordSubtab(container);
    } else if (currentBotSubtab === 'broadcast') {
      renderBroadcastSubtab(container);
    } else if (currentBotSubtab === 'edge') {
      renderEdgeSubtab(container);
    } else if (currentBotSubtab === 'logs') {
      renderLogsSubtab(container);
    }
  }

  // ==========================================================================
  // 1. TELEGRAM BOT CONTROLLER SUBTAB
  // ==========================================================================
  function renderTelegramSubtab(container) {
    const savedToken = localStorage.getItem('vault_tg_bot_token') || (!serverBotCredentials.telegram_bot_token?.includes('***') ? serverBotCredentials.telegram_bot_token : '') || '';
    const savedChatId = localStorage.getItem('vault_tg_chat_id') || serverBotCredentials.telegram_chat_id || '';
    const isEdgePersisted = botConfig.telegram?.configured || !!serverBotCredentials.telegram_bot_token;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:18px;">
        
        <!-- LEFT COLUMN: BOT IDENTITY, AUTH & WEBHOOKS -->
        <div style="display:flex;flex-direction:column;gap:18px;">
          
          <!-- CREDENTIALS & CONNECTION CARD -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>🔐</span> Telegram Bot Credentials
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span id="tg-edge-badge" style="font-size:11px;padding:3px 8px;border-radius:12px;background:${isEdgePersisted ? 'rgba(16,185,129,0.15)' : 'var(--surface2)'};color:${isEdgePersisted ? 'var(--green)' : 'var(--muted)'};font-weight:600;">
                  ${isEdgePersisted ? '● Edge 24/7 Stored' : '○ Not Saved to Edge'}
                </span>
                <span id="tg-status-indicator" style="font-size:11px;padding:3px 8px;border-radius:12px;background:var(--surface2);color:var(--muted);font-weight:600;">
                  Checking...
                </span>
              </div>
            </div>

            <div>
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                Bot API Token (from @BotFather)
              </label>
              <div style="display:flex;gap:8px;">
                <input 
                  type="password" 
                  id="tgBotTokenInput" 
                  value="${savedToken}" 
                  placeholder="${serverBotCredentials.telegram_bot_token || 'e.g. 123456789:ABCdefGhIJKlmNoPQRstuVWXyz'}" 
                  style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;font-family:monospace;"
                />
                <button class="filter-pill" onclick="window.toggleTgTokenVisibility()" style="padding:0 10px;cursor:pointer;" title="Show/Hide Token">
                  <span id="tgTokenEye">👁️</span>
                </button>
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
                <span>${serverBotCredentials.telegram_bot_token ? '✓ Active in Edge database' : 'Enter token to persist in Cloudflare'}</span>
                <a href="#" onclick="window.saveTgTokenToVault();return false;" style="color:var(--accent);text-decoration:none;">
                  + Save to Vault Passwords
                </a>
              </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="filter-pill" onclick="window.verifyTelegramBot()" style="flex:1;padding:8px 14px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer;text-align:center;border-radius:6px;border:none;">
                <span>⚡</span> Verify Bot & Fetch Info
              </button>
              <button class="filter-pill" onclick="window.saveTelegramCredentials()" style="padding:8px 14px;background:rgba(16,185,129,0.15);color:var(--green);border:1px solid var(--green);font-weight:600;cursor:pointer;border-radius:6px;">
                <span>💾</span> Save to Edge 24/7
              </button>
              <button class="filter-pill" onclick="window.clearTgToken()" style="padding:8px 12px;cursor:pointer;">
                Clear
              </button>
            </div>

            <!-- BOT INFO DETAILS CARD -->
            <div id="tgBotInfoBox" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:12px;display:none;font-size:12px;">
              <!-- Populated by verifyTelegramBot() -->
            </div>
          </div>

          <!-- WEBHOOK CONTROLLER & UPDATE ENGINE -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
              <span>🌐</span> Webhook & Updates Manager
            </div>
            <div style="font-size:12px;color:var(--muted);line-height:1.4;">
              Connect your Telegram bot directly to this Vault instance to receive instant notifications, command responses, and webhook events.
            </div>

            <div id="tgWebhookStatusBox" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px 12px;font-size:12px;">
              <div style="color:var(--muted);">Webhook Status: <span style="color:var(--text);font-weight:600;">Not checked yet</span></div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="filter-pill" onclick="window.setTelegramWebhookCurrent()" style="padding:8px 14px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>🔗</span> Set Webhook to Current App Domain
              </button>
              <div style="display:flex;gap:8px;">
                <button class="filter-pill" onclick="window.deleteTelegramWebhook()" style="flex:1;padding:7px 12px;font-size:12px;cursor:pointer;color:var(--red);">
                  <span>❌</span> Delete Webhook (Restore Polling)
                </button>
                <button class="filter-pill" onclick="window.fetchTelegramUpdates()" style="flex:1;padding:7px 12px;font-size:12px;cursor:pointer;">
                  <span>📥</span> Fetch Recent Inbound
                </button>
              </div>
            </div>
          </div>

          <!-- SLASH COMMANDS REGISTRAR -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>⌨️</span> Bot Slash Commands
              </div>
              <button class="filter-pill" onclick="window.fetchTelegramCommands()" style="font-size:11px;padding:4px 8px;cursor:pointer;">
                Load Commands
              </button>
            </div>
            <div style="font-size:12px;color:var(--muted);">
              Commands that appear in the Telegram autocomplete menu when users type <code style="background:var(--surface2);padding:1px 4px;border-radius:3px;">/</code>.
            </div>
            <div id="tgCommandsList" style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
              <div style="color:var(--muted);font-style:italic;">Click 'Load Commands' to view or register defaults.</div>
            </div>
            <button class="filter-pill" onclick="window.registerDefaultTgCommands()" style="padding:7px 12px;font-size:12px;cursor:pointer;align-self:flex-start;">
              <span>➕</span> Register Default Vault Commands (/start, /vault, /ping)
            </button>
          </div>

        </div>

        <!-- RIGHT COLUMN: INTERACTIVE DISPATCHER & LIVE UPDATES STREAM -->
        <div style="display:flex;flex-direction:column;gap:18px;">
          
          <!-- MESSAGE & MEDIA DISPATCHER -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>📤</span> Interactive Dispatcher
              </div>
              <div style="display:flex;gap:6px;">
                <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent);font-size:11px;font-weight:600;padding:2px 8px;">
                  HTML / Markdown
                </span>
              </div>
            </div>

            <!-- TARGET CHAT ID -->
            <div>
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                Target Chat ID or Channel Username
              </label>
              <input 
                type="text" 
                id="tgChatIdInput" 
                value="${savedChatId}" 
                placeholder="e.g. 123456789 or @mychannel or -100123456789" 
                style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;font-family:monospace;"
              />
              <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
                <button class="filter-pill" onclick="window.applyTgChatPreset('@')" style="font-size:11px;padding:2px 8px;">
                  @Channel
                </button>
                <button class="filter-pill" onclick="window.applyTgChatPreset('-100')" style="font-size:11px;padding:2px 8px;">
                  -100 (Supergroup)
                </button>
                <span style="font-size:11px;color:var(--muted);align-self:center;margin-left:auto;">
                  Hint: Send <code>/id</code> to your bot to find your Chat ID
                </span>
              </div>
            </div>

            <!-- MODE SELECTOR & PRESETS -->
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;gap:6px;">
                <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;">
                  <input type="radio" name="tgSendMode" value="text" checked onchange="window.toggleTgPhotoInput(false)" />
                  <span>Text Message</span>
                </label>
                <label style="font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;margin-left:10px;">
                  <input type="radio" name="tgSendMode" value="photo" onchange="window.toggleTgPhotoInput(true)" />
                  <span>Photo + Caption</span>
                </label>
              </div>

              <!-- TEMPLATE CHIPS -->
              <div style="display:flex;gap:4px;flex-wrap:wrap;">
                <button class="filter-pill" onclick="window.loadTgTemplate('security')" style="font-size:11px;padding:2px 7px;">
                  🛡️ Security Alert
                </button>
                <button class="filter-pill" onclick="window.loadTgTemplate('release')" style="font-size:11px;padding:2px 7px;">
                  🚀 Release
                </button>
                <button class="filter-pill" onclick="window.loadTgTemplate('status')" style="font-size:11px;padding:2px 7px;">
                  📊 Health Report
                </button>
              </div>
            </div>

            <!-- PHOTO URL FIELD (Hidden by default) -->
            <div id="tgPhotoRow" style="display:none;">
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                Photo URL (Direct image link .png / .jpg / .webp)
              </label>
              <input 
                type="text" 
                id="tgPhotoUrlInput" 
                placeholder="https://images.unsplash.com/... or any public image URL" 
                style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;"
              />
            </div>

            <!-- MESSAGE TEXTAREA -->
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <label style="font-size:12px;color:var(--muted);">Message / Caption (HTML Formatted)</label>
                <span id="tgCharCounter" style="font-size:11px;color:var(--muted);">0 / 4096</span>
              </div>
              <textarea 
                id="tgMessageInput" 
                rows="6" 
                placeholder="Type your message in <b>HTML</b> or plain text. E.g.:&#10;🚨 <b>Security Audit Notice</b>&#10;Vault status check completed successfully.&#10;Host: <code>cloudflare-edge-01</code>"
                oninput="document.getElementById('tgCharCounter').textContent = this.value.length + ' / 4096'"
                style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px 12px;color:var(--text);font-size:13px;font-family:monospace;resize:vertical;"
              ></textarea>
            </div>

            <!-- INLINE KEYBOARD BUTTONS BUILDER -->
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:600;">Interactive Inline Keyboard Buttons</span>
                <button class="filter-pill" onclick="window.addTgInlineButton()" style="font-size:11px;padding:2px 8px;cursor:pointer;">
                  ＋ Add Button
                </button>
              </div>
              <div id="tgButtonsContainer" style="display:flex;flex-direction:column;gap:6px;">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <!-- DISPATCH CONTROLS -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px;">
              <label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" id="tgDisablePreview" />
                <span>Disable web page link previews</span>
              </label>
              <button 
                id="tgSendBtn" 
                class="filter-pill" 
                onclick="window.sendTelegramMessage()" 
                style="padding:10px 24px;background:var(--accent);color:#fff;font-weight:700;font-size:13px;cursor:pointer;border-radius:6px;border:none;display:flex;align-items:center;gap:8px;"
              >
                <span>✈️ Send to Telegram</span>
              </button>
            </div>

            <div id="tgSendResult" style="display:none;padding:10px 12px;border-radius:6px;font-size:12px;"></div>
          </div>

          <!-- RECENT INBOUND MESSAGES CARD -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>📥</span> Recent Inbound Messages & Interactions
              </div>
              <button class="filter-pill" onclick="window.fetchTelegramUpdates()" style="font-size:11px;padding:3px 8px;cursor:pointer;">
                Refresh Updates
              </button>
            </div>
            <div id="tgInboundContainer" style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">
              <div style="color:var(--muted);font-size:12px;text-align:center;padding:16px;">
                Click 'Fetch Recent Inbound' to check messages received by your bot.
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    renderTgInlineButtonsList();
    verifyTelegramBot(true); // silent check on load
  }

  // Telegram Button builder rendering
  function renderTgInlineButtonsList() {
    const container = document.getElementById('tgButtonsContainer');
    if (!container) return;

    if (tgInlineButtons.length === 0) {
      container.innerHTML = '<div style="color:var(--muted);font-size:11px;font-style:italic;">No inline buttons attached.</div>';
      return;
    }

    container.innerHTML = tgInlineButtons.map((btn, idx) => `
      <div style="display:flex;gap:6px;align-items:center;">
        <input 
          type="text" 
          placeholder="Button Label" 
          value="${escapeHtml(btn.text)}" 
          onchange="window.updateTgButton(${idx}, 'text', this.value)" 
          style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:5px 8px;font-size:12px;color:var(--text);"
        />
        <input 
          type="text" 
          placeholder="https://target-url.com" 
          value="${escapeHtml(btn.url)}" 
          onchange="window.updateTgButton(${idx}, 'url', this.value)" 
          style="flex:1.5;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:5px 8px;font-size:12px;color:var(--text);font-family:monospace;"
        />
        <button class="filter-pill" onclick="window.removeTgInlineButton(${idx})" style="padding:4px 8px;color:var(--red);cursor:pointer;" title="Remove button">
          ✕
        </button>
      </div>
    `).join('');
  }

  window.addTgInlineButton = function() {
    tgInlineButtons.push({ text: '🔗 New Link', url: 'https://' });
    renderTgInlineButtonsList();
  };

  window.updateTgButton = function(index, key, value) {
    if (tgInlineButtons[index]) {
      tgInlineButtons[index][key] = value;
    }
  };

  window.removeTgInlineButton = function(index) {
    tgInlineButtons.splice(index, 1);
    renderTgInlineButtonsList();
  };

  window.toggleTgPhotoInput = function(show) {
    const row = document.getElementById('tgPhotoRow');
    if (row) row.style.display = show ? 'block' : 'none';
  };

  window.applyTgChatPreset = function(preset) {
    const input = document.getElementById('tgChatIdInput');
    if (!input) return;
    if (preset === '@' && !input.value.startsWith('@')) {
      input.value = '@' + input.value.replace(/^@/, '');
    } else if (preset === '-100' && !input.value.startsWith('-100')) {
      input.value = '-100' + input.value.replace(/^-100/, '');
    }
    input.focus();
  };

  window.toggleTgTokenVisibility = function() {
    const input = document.getElementById('tgBotTokenInput');
    const eye = document.getElementById('tgTokenEye');
    if (!input || !eye) return;
    if (input.type === 'password') {
      input.type = 'text';
      eye.textContent = '🔒';
    } else {
      input.type = 'password';
      eye.textContent = '👁️';
    }
  };

  window.clearTgToken = function() {
    localStorage.removeItem('vault_tg_bot_token');
    const input = document.getElementById('tgBotTokenInput');
    if (input) input.value = '';
    const infoBox = document.getElementById('tgBotInfoBox');
    if (infoBox) infoBox.style.display = 'none';
    showBotToast('Telegram bot token cleared');
  };

  window.saveTgTokenToVault = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || '').trim();
    if (!token) {
      showBotToast('Please enter a bot token first', true);
      return;
    }
    try {
      if (typeof window.api === 'function') {
        await window.api('POST', '/passwords', {
          title: 'Telegram Bot Token (@BotFather)',
          username: telegramBotInfo?.username ? `@${telegramBotInfo.username}` : 'Telegram Bot',
          password: token,
          url: 'https://api.telegram.org',
          description: 'Telegram Bot API token stored from Vault Bot Controller'
        });
        showBotToast('Token securely saved to Vault Passwords!');
      } else {
        showBotToast('Token saved to session');
      }
    } catch (e) {
      showBotToast('Saved: ' + e.message);
    }
  };

  window.saveTelegramCredentials = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || '').trim();
    const chatId = (document.getElementById('tgChatIdInput')?.value || '').trim();
    if (!token && !chatId) {
      showBotToast('Please enter a Bot Token or Chat ID first', true);
      return;
    }
    const updates = {};
    if (token && !token.includes('***')) updates.telegram_bot_token = token;
    if (chatId) updates.telegram_chat_id = chatId;

    if (token && !token.includes('***')) localStorage.setItem('vault_tg_bot_token', token);
    if (chatId) localStorage.setItem('vault_tg_chat_id', chatId);

    const ok = await window.saveBotCredentialsToServer(updates);
    if (ok) {
      const edgeBadge = document.getElementById('tg-edge-badge');
      if (edgeBadge) {
        edgeBadge.innerHTML = '● Edge 24/7 Stored';
        edgeBadge.style.color = 'var(--green)';
        edgeBadge.style.background = 'rgba(16,185,129,0.15)';
      }
      window.verifyTelegramBot(true);
    }
  };

  // Telegram Templates
  window.loadTgTemplate = function(type) {
    const msgInput = document.getElementById('tgMessageInput');
    if (!msgInput) return;

    if (type === 'security') {
      msgInput.value = `🛡️ <b>[VAULT SECURITY NOTICE]</b>\n\n<b>Incident Status:</b> RESOLVED / VERIFIED\n<b>Edge Node:</b> <code>cloudflare-pages-asia</code>\n<b>Details:</b> Master Key verification passed. Zero unauthorized attempts recorded in the last 24h.\n\n<i>Generated automatically by Vault Security Sentinel</i>`;
    } else if (type === 'release') {
      msgInput.value = `🚀 <b>[SYSTEM DEPLOYMENT SUCCESSFUL]</b>\n\nVersion: <b>v2.5.0-edge</b>\nFeatures Added:\n• Telegram Bot Controller & Webhooks\n• Discord Rich Embed Builder & Dispatcher\n• Unified Omnipresence Broadcast Engine\n\nAll services operational.`;
    } else if (type === 'status') {
      msgInput.value = `📊 <b>[VAULT HEALTH REPORT]</b>\n\n• Uptime: <b>99.98%</b>\n• KV Store: <b>Operational</b>\n• Turnstile Shield: <b>Enabled</b>\n• API Latency: <b>~24ms</b>\n\nTimestamp: <code>${new Date().toUTCString()}</code>`;
    }
    document.getElementById('tgCharCounter').textContent = msgInput.value.length + ' / 4096';
  };

  // Verify Telegram Bot
  window.verifyTelegramBot = async function(isSilent = false) {
    const input = document.getElementById('tgBotTokenInput');
    const token = (input ? input.value : localStorage.getItem('vault_tg_bot_token') || '').trim();
    const statusIndicator = document.getElementById('tgStatusIndicator');
    const infoBox = document.getElementById('tgBotInfoBox');
    const webhookBox = document.getElementById('tgWebhookStatusBox');

    if (!token && !botConfig.telegram?.configured) {
      if (!isSilent) showBotToast('Please enter a Telegram Bot Token', true);
      if (statusIndicator) {
        statusIndicator.textContent = 'Disconnected';
        statusIndicator.style.color = 'var(--muted)';
      }
      return;
    }

    if (input && token) {
      localStorage.setItem('vault_tg_bot_token', token);
    }

    if (statusIndicator) {
      statusIndicator.textContent = 'Checking...';
      statusIndicator.style.color = 'var(--accent)';
    }

    try {
      const res = await fetch('/api/bots/telegram/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: token })
      });

      const data = await res.json();
      if (res.ok && data.success && data.bot) {
        telegramBotInfo = data.bot;
        telegramWebhookInfo = data.webhook;

        if (statusIndicator) {
          statusIndicator.textContent = '● Verified & Active';
          statusIndicator.style.color = 'var(--green)';
          statusIndicator.style.background = 'rgba(16,185,129,0.15)';
        }

        const headerBadge = document.getElementById('tg-header-badge');
        if (headerBadge) {
          headerBadge.textContent = `● @${data.bot.username || data.bot.first_name}`;
          headerBadge.style.color = 'var(--green)';
        }

        if (infoBox) {
          infoBox.style.display = 'block';
          infoBox.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-weight:700;font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px;">
                  <span>🤖</span> ${escapeHtml(data.bot.first_name)}
                  ${data.bot.username ? `<a href="https://t.me/${data.bot.username}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;font-size:12px;">@${escapeHtml(data.bot.username)}</a>` : ''}
                </div>
                <div style="color:var(--muted);font-size:11px;margin-top:2px;">
                  Bot ID: <code style="color:var(--text);">${data.bot.id}</code>
                </div>
              </div>
              <span class="badge" style="background:rgba(16,185,129,0.15);color:var(--green);font-size:10px;font-weight:600;">
                Valid API Token
              </span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid var(--border);color:var(--muted);font-size:11px;">
              <div>Can Join Groups: <b style="color:var(--text);">${data.bot.can_join_groups ? 'Yes' : 'No'}</b></div>
              <div>Read Group Msgs: <b style="color:var(--text);">${data.bot.can_read_all_group_messages ? 'Yes' : 'No'}</b></div>
              <div>Supports Inline: <b style="color:var(--text);">${data.bot.supports_inline_queries ? 'Yes' : 'No'}</b></div>
              <div>Is Verified Bot: <b style="color:var(--text);">Yes</b></div>
            </div>
          `;
        }

        if (webhookBox && data.webhook) {
          const hasWebhook = !!data.webhook.url;
          webhookBox.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;color:var(--text);">Webhook Configuration</span>
              <span style="color:${hasWebhook ? 'var(--green)' : 'var(--muted)'};font-weight:600;">
                ${hasWebhook ? '● Active' : '○ Disabled (Polling Mode)'}
              </span>
            </div>
            <div style="margin-top:4px;word-break:break-all;color:var(--muted);font-family:monospace;font-size:11px;">
              ${hasWebhook ? escapeHtml(data.webhook.url) : 'No webhook URL assigned. Bot uses manual getUpdates polling.'}
            </div>
            ${data.webhook.pending_update_count > 0 ? `
              <div style="margin-top:4px;color:var(--accent);font-size:11px;">
                Pending updates queue: <b>${data.webhook.pending_update_count}</b>
              </div>
            ` : ''}
            ${data.webhook.last_error_message ? `
              <div style="margin-top:4px;color:var(--red);font-size:11px;">
                Last Error: ${escapeHtml(data.webhook.last_error_message)}
              </div>
            ` : ''}
          `;
        }

        if (!isSilent) showBotToast(`Verified @${data.bot.username || data.bot.first_name}!`);
      } else {
        if (statusIndicator) {
          statusIndicator.textContent = '❌ Error';
          statusIndicator.style.color = 'var(--red)';
        }
        if (!isSilent) showBotToast(data.error || 'Failed to authenticate Telegram Bot', true);
      }
    } catch (err) {
      if (statusIndicator) {
        statusIndicator.textContent = '❌ Offline';
        statusIndicator.style.color = 'var(--red)';
      }
      if (!isSilent) showBotToast('Connection error: ' + err.message, true);
    }
  };

  // Set Telegram Webhook to current host
  window.setTelegramWebhookCurrent = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || localStorage.getItem('vault_tg_bot_token') || '').trim();
    if (!token && !botConfig.telegram?.configured) {
      showBotToast('Please configure a Bot Token first', true);
      return;
    }

    const webhookUrl = `${window.location.origin}/api/bots/telegram/webhook`;
    try {
      const res = await fetch('/api/bots/telegram/webhook/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: token,
          webhook_url: webhookUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        showBotToast('Webhook successfully pointed to: ' + webhookUrl);
        verifyTelegramBot(true);
      } else {
        showBotToast('Webhook error: ' + (data.error || 'Failed to set webhook'), true);
      }
    } catch (e) {
      showBotToast('Error: ' + e.message, true);
    }
  };

  window.deleteTelegramWebhook = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || localStorage.getItem('vault_tg_bot_token') || '').trim();
    try {
      const res = await fetch('/api/bots/telegram/webhook/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: token, drop_pending_updates: false })
      });
      const data = await res.json();
      if (data.success) {
        showBotToast('Webhook deleted. Bot restored to polling mode.');
        verifyTelegramBot(true);
      } else {
        showBotToast('Error: ' + (data.error || 'Failed to delete webhook'), true);
      }
    } catch (e) {
      showBotToast('Error: ' + e.message, true);
    }
  };

  // Fetch Telegram Updates
  window.fetchTelegramUpdates = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || localStorage.getItem('vault_tg_bot_token') || '').trim();
    const container = document.getElementById('tgInboundContainer');
    if (!container) return;

    container.innerHTML = '<div style="color:var(--muted);text-align:center;padding:12px;font-size:12px;">Polling recent Telegram updates...</div>';

    try {
      const res = await fetch(`/api/bots/telegram/updates?limit=15&offset=-15${token ? `&bot_token=${encodeURIComponent(token)}` : ''}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const updates = data.updates || [];
        if (updates.length === 0) {
          container.innerHTML = `
            <div style="color:var(--muted);text-align:center;padding:16px;font-size:12px;">
              No recent inbound messages. Send a message to your bot on Telegram and refresh!
            </div>
          `;
          return;
        }

        container.innerHTML = updates.slice().reverse().map(u => {
          const m = u.message || u.edited_message || u.channel_post || {};
          const sender = m.from?.username ? `@${m.from.username}` : (m.from?.first_name || 'Anonymous');
          const chatId = m.chat?.id || 'Unknown';
          const text = m.text || (m.caption ? `[Photo: ${m.caption}]` : '[Media message]');
          const date = m.date ? new Date(m.date * 1000).toLocaleTimeString() : '';

          return `
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;font-size:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-weight:700;color:var(--accent);">${escapeHtml(sender)}</span>
                  <span style="color:var(--muted);font-size:11px;">Chat ID: <code style="color:var(--text);">${chatId}</code></span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="color:var(--muted);font-size:11px;">${date}</span>
                  <button class="filter-pill" onclick="window.useTgChatId('${chatId}')" style="font-size:10px;padding:2px 6px;cursor:pointer;">
                    Reply to Chat
                  </button>
                </div>
              </div>
              <div style="color:var(--text);font-family:monospace;white-space:pre-wrap;word-break:break-word;margin-top:2px;">${escapeHtml(text)}</div>
            </div>
          `;
        }).join('');
      } else {
        container.innerHTML = `<div style="color:var(--red);padding:12px;font-size:12px;">${escapeHtml(data.error || 'Failed to fetch updates')}</div>`;
      }
    } catch (e) {
      container.innerHTML = `<div style="color:var(--red);padding:12px;font-size:12px;">Error: ${escapeHtml(e.message)}</div>`;
    }
  };

  window.useTgChatId = function(id) {
    const input = document.getElementById('tgChatIdInput');
    if (input) {
      input.value = id;
      localStorage.setItem('vault_tg_chat_id', id);
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
      showBotToast(`Target Chat ID set to: ${id}`);
    }
  };

  // Commands manager
  window.fetchTelegramCommands = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || localStorage.getItem('vault_tg_bot_token') || '').trim();
    const container = document.getElementById('tgCommandsList');
    if (!container) return;

    container.innerHTML = '<div style="color:var(--muted);font-size:11px;">Fetching registered slash commands...</div>';

    try {
      const res = await fetch(`/api/bots/telegram/commands?bot_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.success) {
        const cmds = data.commands || [];
        if (cmds.length === 0) {
          container.innerHTML = '<div style="color:var(--muted);font-size:11px;font-style:italic;">No custom commands registered with Telegram.</div>';
          return;
        }
        container.innerHTML = cmds.map(c => `
          <div style="display:flex;justify-content:space-between;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:5px 8px;">
            <code style="color:var(--accent);font-weight:700;">/${escapeHtml(c.command)}</code>
            <span style="color:var(--muted);">${escapeHtml(c.description)}</span>
          </div>
        `).join('');
      } else {
        container.innerHTML = `<div style="color:var(--red);font-size:11px;">${escapeHtml(data.error || 'Failed')}</div>`;
      }
    } catch (e) {
      container.innerHTML = `<div style="color:var(--red);font-size:11px;">Error: ${escapeHtml(e.message)}</div>`;
    }
  };

  window.registerDefaultTgCommands = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || localStorage.getItem('vault_tg_bot_token') || '').trim();
    if (!token && !botConfig.telegram?.configured) {
      showBotToast('Please enter a Bot Token first', true);
      return;
    }

    const defaultCommands = [
      { command: 'start', description: 'Start the Vault Bot & Show Chat ID' },
      { command: 'status', description: 'Check Vault security health & node status' },
      { command: 'ping', description: 'Measure round-trip API latency' },
      { command: 'vault', description: 'View Vault Sentinel security summary' },
      { command: 'id', description: 'Reveal your personal Telegram Chat ID' }
    ];

    try {
      const res = await fetch('/api/bots/telegram/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: token, commands: defaultCommands })
      });
      const data = await res.json();
      if (data.success) {
        showBotToast('5 Default Vault slash commands registered with Telegram!');
        window.fetchTelegramCommands();
      } else {
        showBotToast('Failed: ' + (data.error || 'Could not register commands'), true);
      }
    } catch (e) {
      showBotToast('Error: ' + e.message, true);
    }
  };

  // Send Message to Telegram
  window.sendTelegramMessage = async function() {
    const token = (document.getElementById('tgBotTokenInput')?.value || localStorage.getItem('vault_tg_bot_token') || '').trim();
    const chatId = (document.getElementById('tgChatIdInput')?.value || '').trim();
    const text = (document.getElementById('tgMessageInput')?.value || '').trim();
    const isPhoto = document.querySelector('input[name="tgSendMode"]:checked')?.value === 'photo';
    const photoUrl = (document.getElementById('tgPhotoUrlInput')?.value || '').trim();
    const disablePreview = !!document.getElementById('tgDisablePreview')?.checked;
    const sendBtn = document.getElementById('tgSendBtn');
    const resultBox = document.getElementById('tgSendResult');

    if (!token && !botConfig.telegram?.configured) {
      showBotToast('Telegram Bot Token is required', true);
      return;
    }
    if (!chatId) {
      showBotToast('Target Chat ID or @channel username is required', true);
      document.getElementById('tgChatIdInput')?.focus();
      return;
    }
    if (!text && !photoUrl) {
      showBotToast('Please enter message text or photo URL', true);
      document.getElementById('tgMessageInput')?.focus();
      return;
    }

    // Save chatId for convenience
    localStorage.setItem('vault_tg_chat_id', chatId);

    // Filter valid inline buttons
    const validButtons = tgInlineButtons.filter(b => b.text && b.url && b.url.startsWith('http')).map(b => [{ text: b.text, url: b.url }]);

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span>⏳ Dispatching...</span>';
    }

    try {
      const payload = {
        bot_token: token,
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_preview: disablePreview
      };

      if (isPhoto && photoUrl) {
        payload.photo_url = photoUrl;
        payload.caption = text;
      }

      if (validButtons.length > 0) {
        payload.buttons = validButtons;
      }

      const res = await fetch('/api/bots/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showBotToast('✅ Message dispatched to Telegram successfully!');
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(16,185,129,0.1)';
          resultBox.style.border = '1px solid var(--green)';
          resultBox.style.color = 'var(--green)';
          resultBox.innerHTML = `
            <b>Success!</b> Message ID: <code>${data.messageId}</code> dispatched to <b>${escapeHtml(data.chat?.title || data.chat?.username || chatId)}</b>.
          `;
        }
      } else {
        showBotToast('Error: ' + (data.error || 'Failed to dispatch message'), true);
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(239,68,68,0.1)';
          resultBox.style.border = '1px solid var(--red)';
          resultBox.style.color = 'var(--red)';
          resultBox.textContent = `Dispatch Failed: ${data.error || 'Unknown error'}`;
        }
      }
    } catch (e) {
      showBotToast('Connection error: ' + e.message, true);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>✈️ Send to Telegram</span>';
      }
    }
  };

  // ==========================================================================
  // 2. DISCORD BOT CONTROLLER SUBTAB
  // ==========================================================================
  function renderDiscordSubtab(container) {
    const savedBotToken = localStorage.getItem('vault_dc_bot_token') || (!serverBotCredentials.discord_bot_token?.includes('***') ? serverBotCredentials.discord_bot_token : '') || '';
    const savedWebhookUrl = localStorage.getItem('vault_dc_webhook_url') || (!serverBotCredentials.discord_webhook_url?.includes('***') ? serverBotCredentials.discord_webhook_url : '') || '';
    const savedChannelId = localStorage.getItem('vault_dc_channel_id') || serverBotCredentials.discord_channel_id || '';
    const isEdgePersisted = botConfig.discord?.botConfigured || botConfig.discord?.webhookConfigured || !!serverBotCredentials.discord_bot_token || !!serverBotCredentials.discord_webhook_url;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:18px;">
        
        <!-- LEFT COLUMN: AUTH, WEBHOOK & RICH EMBED BUILDER -->
        <div style="display:flex;flex-direction:column;gap:18px;">
          
          <!-- CREDENTIALS & CONNECTION MODE -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>🎮</span> Discord Bot & Webhook Credentials
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span id="dc-edge-badge" style="font-size:11px;padding:3px 8px;border-radius:12px;background:${isEdgePersisted ? 'rgba(16,185,129,0.15)' : 'var(--surface2)'};color:${isEdgePersisted ? 'var(--green)' : 'var(--muted)'};font-weight:600;">
                  ${isEdgePersisted ? '● Edge 24/7 Stored' : '○ Not Saved to Edge'}
                </span>
                <span id="dc-status-indicator" style="font-size:11px;padding:3px 8px;border-radius:12px;background:var(--surface2);color:var(--muted);font-weight:600;">
                  Checking...
                </span>
              </div>
            </div>

            <!-- DISPATCH MODE RADIO -->
            <div style="display:flex;gap:12px;background:var(--surface2);padding:6px 10px;border-radius:6px;border:1px solid var(--border);">
              <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="radio" name="dcMode" value="bot" checked onchange="window.toggleDiscordMode('bot')" />
                <span style="font-weight:600;">Bot Token Mode (Channels & Guilds)</span>
              </label>
              <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="radio" name="dcMode" value="webhook" onchange="window.toggleDiscordMode('webhook')" />
                <span style="font-weight:600;">Direct Webhook Mode</span>
              </label>
            </div>

            <!-- BOT TOKEN INPUT ROW -->
            <div id="dcBotTokenRow">
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                Discord Bot Token (from Discord Developer Portal)
              </label>
              <div style="display:flex;gap:8px;">
                <input 
                  type="password" 
                  id="dcBotTokenInput" 
                  value="${savedBotToken}" 
                  placeholder="${serverBotCredentials.discord_bot_token || 'e.g. MTIzNDU2Nzg5... (Bot Token)'}" 
                  style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;font-family:monospace;"
                />
                <button class="filter-pill" onclick="window.toggleDcTokenVisibility()" style="padding:0 10px;cursor:pointer;" title="Show/Hide">
                  <span id="dcTokenEye">👁️</span>
                </button>
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
                <span>${serverBotCredentials.discord_bot_token ? '✓ Active in Edge database' : 'Required for channel enumeration & slash commands'}</span>
                <a href="#" onclick="window.saveDcTokenToVault();return false;" style="color:var(--accent);text-decoration:none;">
                  + Save to Vault
                </a>
              </div>
            </div>

            <!-- WEBHOOK URL INPUT ROW -->
            <div id="dcWebhookRow" style="display:none;">
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                Discord Webhook URL (Channel Settings -> Integrations -> Webhooks)
              </label>
              <input 
                type="text" 
                id="dcWebhookUrlInput" 
                value="${savedWebhookUrl}" 
                placeholder="${serverBotCredentials.discord_webhook_url || 'https://discord.com/api/webhooks/123456789/abcdef...'}" 
                style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;font-family:monospace;"
              />
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="filter-pill" onclick="window.verifyDiscord()" style="flex:1;padding:8px 14px;background:#5865f2;color:#fff;font-weight:600;cursor:pointer;text-align:center;border-radius:6px;border:none;">
                <span>⚡</span> Test Connection & Verify
              </button>
              <button class="filter-pill" onclick="window.saveDiscordCredentials()" style="padding:8px 14px;background:rgba(16,185,129,0.15);color:var(--green);border:1px solid var(--green);font-weight:600;cursor:pointer;border-radius:6px;">
                <span>💾</span> Save to Edge 24/7
              </button>
              <button class="filter-pill" onclick="window.testDiscordDirectWebhook()" style="padding:8px 12px;cursor:pointer;" title="Send instant ping test to Webhook">
                <span>📡</span> Test Webhook
              </button>
              <button class="filter-pill" onclick="window.clearDcToken()" style="padding:8px 12px;cursor:pointer;">
                Clear
              </button>
            </div>

            <!-- DISCORD BOT / WEBHOOK INFO BOX -->
            <div id="dcBotInfoBox" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:12px;display:none;font-size:12px;">
              <!-- Populated by verifyDiscord() -->
            </div>
          </div>

          <!-- SERVER (GUILD) & CHANNEL SELECTOR -->
          <div id="dcGuildChannelCard" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>🏰</span> Target Server & Channel
              </div>
              <button class="filter-pill" onclick="window.fetchDiscordGuilds()" style="font-size:11px;padding:3px 8px;cursor:pointer;">
                Refresh Servers
              </button>
            </div>

            <div>
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                Select Joined Server (Guild)
              </label>
              <select 
                id="dcGuildSelect" 
                onchange="window.onDiscordGuildSelected(this.value)"
                style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;"
              >
                <option value="">-- Select a Server --</option>
              </select>
            </div>

            <div>
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                Select Target Channel OR Enter Channel ID directly
              </label>
              <div style="display:flex;gap:8px;">
                <select 
                  id="dcChannelSelect" 
                  onchange="document.getElementById('dcChannelIdInput').value = this.value"
                  style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;"
                >
                  <option value="">-- Choose Channel from Server --</option>
                </select>
                <input 
                  type="text" 
                  id="dcChannelIdInput" 
                  value="${savedChannelId}" 
                  placeholder="Channel ID (e.g. 1029384756)" 
                  style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;font-family:monospace;"
                />
              </div>
            </div>
          </div>

          <!-- RICH EMBED BUILDER ACCORDION -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>🎨</span> Rich Embed Customizer
              </div>
              <!-- PRESET COLORS -->
              <div style="display:flex;gap:4px;">
                <span onclick="window.setEmbedColor('#7c6af7')" title="Vault Purple" style="width:18px;height:18px;border-radius:50%;background:#7c6af7;cursor:pointer;display:inline-block;border:1px solid rgba(255,255,255,0.2);"></span>
                <span onclick="window.setEmbedColor('#10b981')" title="Success Green" style="width:18px;height:18px;border-radius:50%;background:#10b981;cursor:pointer;display:inline-block;border:1px solid rgba(255,255,255,0.2);"></span>
                <span onclick="window.setEmbedColor('#ef4444')" title="Danger Red" style="width:18px;height:18px;border-radius:50%;background:#ef4444;cursor:pointer;display:inline-block;border:1px solid rgba(255,255,255,0.2);"></span>
                <span onclick="window.setEmbedColor('#06b6d4')" title="Cyber Cyan" style="width:18px;height:18px;border-radius:50%;background:#06b6d4;cursor:pointer;display:inline-block;border:1px solid rgba(255,255,255,0.2);"></span>
                <span onclick="window.setEmbedColor('#f59e0b')" title="Gold Alert" style="width:18px;height:18px;border-radius:50%;background:#f59e0b;cursor:pointer;display:inline-block;border:1px solid rgba(255,255,255,0.2);"></span>
              </div>
            </div>

            <div>
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">Embed Title & Link URL</label>
              <div style="display:flex;gap:8px;">
                <input 
                  type="text" 
                  id="embedTitleInput" 
                  value="${escapeHtml(discordEmbedState.title)}" 
                  oninput="discordEmbedState.title = this.value; window.updateDiscordEmbedPreview();"
                  placeholder="Embed Title" 
                  style="flex:1.5;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;"
                />
                <input 
                  type="text" 
                  id="embedUrlInput" 
                  value="${escapeHtml(discordEmbedState.url)}" 
                  oninput="discordEmbedState.url = this.value; window.updateDiscordEmbedPreview();"
                  placeholder="Link URL" 
                  style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;font-family:monospace;"
                />
              </div>
            </div>

            <div>
              <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">Description (Supports Discord Markdown **bold**, *italics*, \`code\`)</label>
              <textarea 
                id="embedDescInput" 
                rows="3" 
                oninput="discordEmbedState.description = this.value; window.updateDiscordEmbedPreview();"
                style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;resize:vertical;"
              >${escapeHtml(discordEmbedState.description)}</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Author Name</label>
                <input 
                  type="text" 
                  id="embedAuthorInput" 
                  value="${escapeHtml(discordEmbedState.authorName)}" 
                  oninput="discordEmbedState.authorName = this.value; window.updateDiscordEmbedPreview();"
                  style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-size:12px;"
                />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Footer Text</label>
                <input 
                  type="text" 
                  id="embedFooterInput" 
                  value="${escapeHtml(discordEmbedState.footerText)}" 
                  oninput="discordEmbedState.footerText = this.value; window.updateDiscordEmbedPreview();"
                  style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-size:12px;"
                />
              </div>
            </div>

            <!-- EMBED DYNAMIC FIELDS -->
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:600;">Embed Fields (Key-Value Grid)</span>
                <button class="filter-pill" onclick="window.addDiscordEmbedField()" style="font-size:11px;padding:2px 8px;cursor:pointer;">
                  ＋ Add Field
                </button>
              </div>
              <div id="dcFieldsContainer" style="display:flex;flex-direction:column;gap:6px;">
                <!-- Populated dynamically -->
              </div>
            </div>

            <!-- OPTIONAL IMAGE URLS -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Thumbnail URL (Small Icon Top-Right)</label>
                <input 
                  type="text" 
                  id="embedThumbInput" 
                  value="${escapeHtml(discordEmbedState.thumbnailUrl)}" 
                  oninput="discordEmbedState.thumbnailUrl = this.value; window.updateDiscordEmbedPreview();"
                  placeholder="https://..." 
                  style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-size:12px;"
                />
              </div>
              <div>
                <label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Main Image URL (Full Banner)</label>
                <input 
                  type="text" 
                  id="embedImgInput" 
                  value="${escapeHtml(discordEmbedState.imageUrl)}" 
                  oninput="discordEmbedState.imageUrl = this.value; window.updateDiscordEmbedPreview();"
                  placeholder="https://..." 
                  style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-size:12px;"
                />
              </div>
            </div>

          </div>

        </div>

        <!-- RIGHT COLUMN: LIVE DISCORD PREVIEW & DISPATCH -->
        <div style="display:flex;flex-direction:column;gap:18px;">
          
          <!-- LIVE WYSIWYG DISCORD EMBED CARD PREVIEW -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>👁️</span> Live Discord Chat & Embed Simulator
              </div>
              <span style="font-size:11px;color:var(--muted);">WYSIWYG Dark Theme Preview</span>
            </div>

            <!-- SIMULATED DISCORD MESSAGE CONTAINER -->
            <div style="background:#313338;border-radius:8px;padding:16px;color:#dbdee1;font-family:'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;display:flex;gap:14px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.3);">
              <!-- Bot Avatar -->
              <div style="flex-shrink:0;">
                <img 
                  id="dcMockAvatar" 
                  src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f512.png" 
                  alt="Avatar" 
                  style="width:40px;height:40px;border-radius:50%;background:#5865f2;object-fit:cover;"
                />
              </div>

              <!-- Message Body -->
              <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span id="dcMockUsername" style="font-weight:600;color:#f2f3f5;font-size:15px;">Vault Sentinel</span>
                  <span style="background:#5865f2;color:#ffffff;font-size:10px;font-weight:700;padding:1px 4px;border-radius:3px;text-transform:uppercase;">
                    BOT
                  </span>
                  <span style="color:#949ba4;font-size:12px;">Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <!-- PLAIN CONTENT ROW (optional) -->
                <div id="dcMockPlainContent" style="font-size:14px;color:#dbdee1;display:none;word-break:break-word;"></div>

                <!-- EMBED CARD -->
                <div 
                  id="dcMockEmbedCard" 
                  style="background:#2b2d31;border-left:4px solid ${discordEmbedState.color};border-radius:4px;padding:12px 16px;display:flex;flex-direction:column;gap:10px;max-width:520px;"
                >
                  <!-- Author -->
                  <div id="dcMockEmbedAuthor" style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#f2f3f5;">
                    <img id="dcMockEmbedAuthorIcon" src="${discordEmbedState.authorIcon}" style="width:20px;height:20px;border-radius:50%;" />
                    <span id="dcMockEmbedAuthorText">${escapeHtml(discordEmbedState.authorName)}</span>
                  </div>

                  <!-- Title & Thumbnail -->
                  <div style="display:flex;justify-content:space-between;gap:12px;">
                    <div style="display:flex;flex-direction:column;gap:6px;">
                      <a id="dcMockEmbedTitle" href="${discordEmbedState.url}" target="_blank" style="color:#00a8fc;font-weight:700;font-size:15px;text-decoration:none;">
                        ${escapeHtml(discordEmbedState.title)}
                      </a>
                      <div id="dcMockEmbedDesc" style="font-size:13px;color:#dbdee1;line-height:1.4;white-space:pre-wrap;">
                        ${escapeHtml(discordEmbedState.description)}
                      </div>
                    </div>
                    <img id="dcMockEmbedThumbnail" src="" style="width:64px;height:64px;border-radius:4px;object-fit:cover;display:none;" />
                  </div>

                  <!-- Fields Grid -->
                  <div id="dcMockEmbedFields" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;margin-top:2px;">
                    <!-- Populated dynamically -->
                  </div>

                  <!-- Main Image -->
                  <img id="dcMockEmbedImage" src="" style="width:100%;border-radius:4px;max-height:260px;object-fit:cover;display:none;" />

                  <!-- Footer -->
                  <div id="dcMockEmbedFooter" style="font-size:11px;color:#949ba4;display:flex;align-items:center;gap:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;">
                    <span id="dcMockEmbedFooterText">${escapeHtml(discordEmbedState.footerText)}</span>
                    <span>•</span>
                    <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- DISPATCH CONTROLS -->
            <div style="display:flex;flex-direction:column;gap:10px;padding-top:6px;">
              <div>
                <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">
                  Optional Plain Text Message / Alert Mention (@everyone or message)
                </label>
                <input 
                  type="text" 
                  id="dcPlainTextInput" 
                  placeholder="e.g. 🚨 High-priority broadcast to engineering team" 
                  oninput="window.updateDiscordEmbedPreview()"
                  style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;"
                />
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <button class="filter-pill" onclick="window.sendDiscordPingTest()" style="font-size:12px;cursor:pointer;">
                    <span>🏓</span> Ping Test
                  </button>
                  <button class="filter-pill" onclick="window.inviteDiscordBot()" id="dcInviteBtn" style="font-size:12px;cursor:pointer;display:none;">
                    <span>➕</span> Add Bot to Server
                  </button>
                </div>

                <button 
                  id="dcSendBtn" 
                  class="filter-pill" 
                  onclick="window.sendDiscordMessage()" 
                  style="padding:10px 24px;background:#5865f2;color:#fff;font-weight:700;font-size:13px;cursor:pointer;border-radius:6px;border:none;display:flex;align-items:center;gap:8px;"
                >
                  <span>🎮 Dispatch to Discord</span>
                </button>
              </div>

              <div id="dcSendResult" style="display:none;padding:10px 12px;border-radius:6px;font-size:12px;"></div>
            </div>

          </div>

          <!-- DISCORD SLASH COMMANDS CARD -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>⚡</span> Discord Application Slash Commands
              </div>
              <button class="filter-pill" onclick="window.fetchDiscordCommands()" style="font-size:11px;padding:3px 8px;cursor:pointer;">
                Load Slash Commands
              </button>
            </div>
            <div style="font-size:12px;color:var(--muted);">
              Manage global slash commands registered for your Discord application.
            </div>
            <div id="dcCommandsList" style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
              <div style="color:var(--muted);font-style:italic;">Click 'Load Slash Commands' to view or register.</div>
            </div>
            <button class="filter-pill" onclick="window.registerDefaultDcCommands()" style="padding:7px 12px;font-size:12px;cursor:pointer;align-self:flex-start;">
              <span>➕</span> Register Default /vault and /status Commands
            </button>
          </div>

        </div>

      </div>
    `;

    renderDcEmbedFields();
    updateDiscordEmbedPreview();
    verifyDiscord(true); // silent check on load
  }

  // Discord Mode Switcher
  window.toggleDiscordMode = function(mode) {
    const botRow = document.getElementById('dcBotTokenRow');
    const whRow = document.getElementById('dcWebhookRow');
    const guildCard = document.getElementById('dcGuildChannelCard');

    if (mode === 'webhook') {
      if (botRow) botRow.style.display = 'none';
      if (whRow) whRow.style.display = 'block';
      if (guildCard) guildCard.style.display = 'none';
    } else {
      if (botRow) botRow.style.display = 'block';
      if (whRow) whRow.style.display = 'none';
      if (guildCard) guildCard.style.display = 'flex';
    }
  };

  window.toggleDcTokenVisibility = function() {
    const input = document.getElementById('dcBotTokenInput');
    const eye = document.getElementById('dcTokenEye');
    if (!input || !eye) return;
    if (input.type === 'password') {
      input.type = 'text';
      eye.textContent = '🔒';
    } else {
      input.type = 'password';
      eye.textContent = '👁️';
    }
  };

  window.clearDcToken = function() {
    localStorage.removeItem('vault_dc_bot_token');
    localStorage.removeItem('vault_dc_webhook_url');
    const botInput = document.getElementById('dcBotTokenInput');
    const whInput = document.getElementById('dcWebhookUrlInput');
    if (botInput) botInput.value = '';
    if (whInput) whInput.value = '';
    const infoBox = document.getElementById('dcBotInfoBox');
    if (infoBox) infoBox.style.display = 'none';
    showBotToast('Discord credentials cleared');
  };

  window.saveDcTokenToVault = async function() {
    const token = (document.getElementById('dcBotTokenInput')?.value || '').trim();
    if (!token) {
      showBotToast('Enter a Discord Bot Token first', true);
      return;
    }
    try {
      if (typeof window.api === 'function') {
        await window.api('POST', '/passwords', {
          title: 'Discord Bot Token (Discord Developer Portal)',
          username: discordBotInfo?.username ? `${discordBotInfo.username}#${discordBotInfo.discriminator || '0'}` : 'Discord Bot',
          password: token,
          url: 'https://discord.com/developers',
          description: 'Discord Bot credentials saved from Vault Bot Controller'
        });
        showBotToast('Discord Bot Token saved to Vault Passwords!');
      }
    } catch (e) {
      showBotToast('Saved: ' + e.message);
    }
  };

  // Embed Color Preset Handler
  window.setEmbedColor = function(hex) {
    discordEmbedState.color = hex;
    window.updateDiscordEmbedPreview();
  };

  // Embed Fields Builder
  function renderDcEmbedFields() {
    const container = document.getElementById('dcFieldsContainer');
    if (!container) return;

    if (!discordEmbedState.fields || discordEmbedState.fields.length === 0) {
      container.innerHTML = '<div style="color:var(--muted);font-size:11px;font-style:italic;">No custom fields. Click "+ Add Field" to create inline key-value pairs.</div>';
      return;
    }

    container.innerHTML = discordEmbedState.fields.map((f, idx) => `
      <div style="display:flex;gap:6px;align-items:center;">
        <input 
          type="text" 
          placeholder="Field Name" 
          value="${escapeHtml(f.name)}" 
          oninput="discordEmbedState.fields[${idx}].name = this.value; window.updateDiscordEmbedPreview();" 
          style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:5px 8px;font-size:12px;color:var(--text);font-weight:600;"
        />
        <input 
          type="text" 
          placeholder="Value" 
          value="${escapeHtml(f.value)}" 
          oninput="discordEmbedState.fields[${idx}].value = this.value; window.updateDiscordEmbedPreview();" 
          style="flex:1.5;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:5px 8px;font-size:12px;color:var(--text);"
        />
        <label style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:3px;cursor:pointer;white-space:nowrap;">
          <input 
            type="checkbox" 
            ${f.inline ? 'checked' : ''} 
            onchange="discordEmbedState.fields[${idx}].inline = this.checked; window.updateDiscordEmbedPreview();" 
          />
          Inline
        </label>
        <button class="filter-pill" onclick="window.removeDiscordEmbedField(${idx})" style="padding:4px 7px;color:var(--red);cursor:pointer;">
          ✕
        </button>
      </div>
    `).join('');
  }

  window.addDiscordEmbedField = function() {
    discordEmbedState.fields.push({ name: 'Node Name', value: 'Edge Cluster #1', inline: true });
    renderDcEmbedFields();
    window.updateDiscordEmbedPreview();
  };

  window.removeDiscordEmbedField = function(idx) {
    discordEmbedState.fields.splice(idx, 1);
    renderDcEmbedFields();
    window.updateDiscordEmbedPreview();
  };

  // Live Discord Simulator Preview Updater
  window.updateDiscordEmbedPreview = function() {
    const card = document.getElementById('dcMockEmbedCard');
    if (!card) return;

    // Border color
    card.style.borderLeftColor = discordEmbedState.color || '#7c6af7';

    // Title
    const titleEl = document.getElementById('dcMockEmbedTitle');
    if (titleEl) {
      titleEl.textContent = discordEmbedState.title || '';
      titleEl.href = discordEmbedState.url || '#';
      titleEl.style.display = discordEmbedState.title ? 'block' : 'none';
    }

    // Description
    const descEl = document.getElementById('dcMockEmbedDesc');
    if (descEl) {
      descEl.textContent = discordEmbedState.description || '';
      descEl.style.display = discordEmbedState.description ? 'block' : 'none';
    }

    // Author
    const authorEl = document.getElementById('dcMockEmbedAuthor');
    const authorText = document.getElementById('dcMockEmbedAuthorText');
    if (authorEl && authorText) {
      authorText.textContent = discordEmbedState.authorName || '';
      authorEl.style.display = discordEmbedState.authorName ? 'flex' : 'none';
    }

    // Footer
    const footerText = document.getElementById('dcMockEmbedFooterText');
    if (footerText) {
      footerText.textContent = discordEmbedState.footerText || '';
    }

    // Thumbnail
    const thumbEl = document.getElementById('dcMockEmbedThumbnail');
    if (thumbEl) {
      if (discordEmbedState.thumbnailUrl && discordEmbedState.thumbnailUrl.startsWith('http')) {
        thumbEl.src = discordEmbedState.thumbnailUrl;
        thumbEl.style.display = 'block';
      } else {
        thumbEl.style.display = 'none';
      }
    }

    // Main Image
    const imgEl = document.getElementById('dcMockEmbedImage');
    if (imgEl) {
      if (discordEmbedState.imageUrl && discordEmbedState.imageUrl.startsWith('http')) {
        imgEl.src = discordEmbedState.imageUrl;
        imgEl.style.display = 'block';
      } else {
        imgEl.style.display = 'none';
      }
    }

    // Fields
    const fieldsEl = document.getElementById('dcMockEmbedFields');
    if (fieldsEl) {
      const activeFields = (discordEmbedState.fields || []).filter(f => f.name && f.value);
      fieldsEl.innerHTML = activeFields.map(f => `
        <div style="display:flex;flex-direction:column;gap:2px;">
          <div style="font-size:12px;font-weight:700;color:#f2f3f5;">${escapeHtml(f.name)}</div>
          <div style="font-size:13px;color:#dbdee1;">${escapeHtml(f.value)}</div>
        </div>
      `).join('');
    }

    // Plain message row
    const plainInput = document.getElementById('dcPlainTextInput');
    const mockPlain = document.getElementById('dcMockPlainContent');
    if (mockPlain && plainInput) {
      const text = plainInput.value.trim();
      mockPlain.textContent = text;
      mockPlain.style.display = text ? 'block' : 'none';
    }
  };

  // Verify Discord
  window.verifyDiscord = async function(isSilent = false) {
    const isWebhookMode = document.querySelector('input[name="dcMode"]:checked')?.value === 'webhook';
    const botToken = (document.getElementById('dcBotTokenInput')?.value || localStorage.getItem('vault_dc_bot_token') || '').trim();
    const webhookUrl = (document.getElementById('dcWebhookUrlInput')?.value || localStorage.getItem('vault_dc_webhook_url') || '').trim();
    const statusIndicator = document.getElementById('dc-status-indicator');
    const infoBox = document.getElementById('dcBotInfoBox');
    const inviteBtn = document.getElementById('dcInviteBtn');

    if (!botToken && !webhookUrl && !botConfig.discord?.botConfigured && !botConfig.discord?.webhookConfigured) {
      if (!isSilent) showBotToast('Please provide a Discord Bot Token or Webhook URL', true);
      if (statusIndicator) {
        statusIndicator.textContent = 'Disconnected';
        statusIndicator.style.color = 'var(--muted)';
      }
      return;
    }

    if (botToken) localStorage.setItem('vault_dc_bot_token', botToken);
    if (webhookUrl) localStorage.setItem('vault_dc_webhook_url', webhookUrl);

    if (statusIndicator) {
      statusIndicator.textContent = 'Checking...';
      statusIndicator.style.color = 'var(--accent)';
    }

    try {
      const res = await fetch('/api/bots/discord/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: botToken,
          webhook_url: webhookUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        discordBotInfo = data.bot || null;
        discordWebhookInfo = data.webhook || null;

        if (statusIndicator) {
          statusIndicator.textContent = data.bot ? '● Bot Active' : '● Webhook Ready';
          statusIndicator.style.color = 'var(--green)';
          statusIndicator.style.background = 'rgba(16,185,129,0.15)';
        }

        const headerBadge = document.getElementById('dc-header-badge');
        if (headerBadge) {
          headerBadge.textContent = data.bot ? `● ${data.bot.username}` : '● Webhook Connected';
          headerBadge.style.color = 'var(--green)';
        }

        if (data.inviteUrl && inviteBtn) {
          inviteBtn.style.display = 'inline-flex';
          inviteBtn.dataset.url = data.inviteUrl;
        }

        if (infoBox) {
          infoBox.style.display = 'block';
          if (data.bot) {
            const avatarUrl = data.bot.avatar 
              ? `https://cdn.discordapp.com/avatars/${data.bot.id}/${data.bot.avatar}.png`
              : 'https://cdn.discordapp.com/embed/avatars/0.png';

            const mockAvatar = document.getElementById('dcMockAvatar');
            if (mockAvatar) mockAvatar.src = avatarUrl;
            const mockUser = document.getElementById('dcMockUsername');
            if (mockUser) mockUser.textContent = data.bot.username;

            infoBox.innerHTML = `
              <div style="display:flex;align-items:center;gap:12px;">
                <img src="${avatarUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:var(--text);">
                    ${escapeHtml(data.bot.username)} <span style="color:var(--muted);font-weight:normal;font-size:12px;">#${data.bot.discriminator || '0'}</span>
                  </div>
                  <div style="color:var(--muted);font-size:11px;">
                    App ID: <code>${data.bot.id}</code> • Bot Verified: <b>${data.bot.verified ? 'Yes' : 'Active'}</b>
                  </div>
                </div>
                ${data.inviteUrl ? `
                  <a href="${data.inviteUrl}" target="_blank" rel="noopener noreferrer" class="filter-pill" style="padding:4px 10px;font-size:11px;text-decoration:none;background:#5865f2;color:#fff;font-weight:600;">
                    Invite Bot ↗
                  </a>
                ` : ''}
              </div>
            `;
            // Auto fetch guilds
            fetchDiscordGuilds(botToken);
          } else if (data.webhook) {
            infoBox.innerHTML = `
              <div style="display:flex;align-items:center;gap:12px;">
                <span>🌐</span>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:var(--text);">
                    Webhook: ${escapeHtml(data.webhook.name || 'Discord Webhook')}
                  </div>
                  <div style="color:var(--muted);font-size:11px;">
                    Guild ID: <code>${data.webhook.guild_id || 'N/A'}</code> • Channel ID: <code>${data.webhook.channel_id}</code>
                  </div>
                </div>
              </div>
            `;
          }
        }

        if (!isSilent) showBotToast('Discord connection verified successfully!');
      } else {
        if (statusIndicator) {
          statusIndicator.textContent = '❌ Error';
          statusIndicator.style.color = 'var(--red)';
        }
        if (!isSilent) showBotToast(data.error || 'Discord authentication failed', true);
      }
    } catch (e) {
      if (statusIndicator) {
        statusIndicator.textContent = '❌ Offline';
        statusIndicator.style.color = 'var(--red)';
      }
      if (!isSilent) showBotToast('Error: ' + e.message, true);
    }
  };

  window.inviteDiscordBot = function() {
    const btn = document.getElementById('dcInviteBtn');
    const url = btn?.dataset?.url;
    if (url) {
      window.open(url, '_blank');
    } else {
      showBotToast('Invite URL not generated. Click Verify Bot first.', true);
    }
  };

  // Fetch Discord Guilds
  window.fetchDiscordGuilds = async function(explicitToken) {
    const token = explicitToken || (document.getElementById('dcBotTokenInput')?.value || localStorage.getItem('vault_dc_bot_token') || '').trim();
    const select = document.getElementById('dcGuildSelect');
    if (!token || !select) return;

    try {
      const res = await fetch(`/api/bots/discord/guilds?bot_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        discordGuilds = data.guilds || [];
        select.innerHTML = `
          <option value="">-- Select Joined Server (${discordGuilds.length} available) --</option>
          ${discordGuilds.map(g => `
            <option value="${g.id}">${escapeHtml(g.name)} (${g.id})</option>
          `).join('')}
        `;
      }
    } catch (_) {}
  };

  // When a Guild is selected, fetch its channels
  window.onDiscordGuildSelected = async function(guildId) {
    const token = (document.getElementById('dcBotTokenInput')?.value || localStorage.getItem('vault_dc_bot_token') || '').trim();
    const select = document.getElementById('dcChannelSelect');
    if (!guildId || !select) return;

    select.innerHTML = '<option value="">Loading text channels...</option>';

    try {
      const res = await fetch(`/api/bots/discord/channels?guild_id=${encodeURIComponent(guildId)}&bot_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        discordChannels = data.channels || [];
        select.innerHTML = `
          <option value="">-- Choose Channel (${discordChannels.length} text channels) --</option>
          ${discordChannels.map(c => `
            <option value="${c.id}"># ${escapeHtml(c.name)} ${c.type === 5 ? '(Announcements)' : ''}</option>
          `).join('')}
        `;
      } else {
        select.innerHTML = '<option value="">Failed to load channels</option>';
      }
    } catch (e) {
      select.innerHTML = '<option value="">Error loading channels</option>';
    }
  };

  // Dispatch to Discord
  window.sendDiscordMessage = async function() {
    const mode = document.querySelector('input[name="dcMode"]:checked')?.value || 'bot';
    const botToken = (document.getElementById('dcBotTokenInput')?.value || localStorage.getItem('vault_dc_bot_token') || '').trim();
    const channelId = (document.getElementById('dcChannelIdInput')?.value || '').trim();
    const webhookUrl = (document.getElementById('dcWebhookUrlInput')?.value || localStorage.getItem('vault_dc_webhook_url') || '').trim();
    const plainContent = (document.getElementById('dcPlainTextInput')?.value || '').trim();
    const sendBtn = document.getElementById('dcSendBtn');
    const resultBox = document.getElementById('dcSendResult');

    if (mode === 'webhook') {
      if (!webhookUrl) {
        showBotToast('Discord Webhook URL is required', true);
        document.getElementById('dcWebhookUrlInput')?.focus();
        return;
      }
    } else {
      if (!botToken && !botConfig.discord?.botConfigured) {
        showBotToast('Discord Bot Token is required', true);
        return;
      }
      if (!channelId) {
        showBotToast('Please select or input a Discord Channel ID', true);
        document.getElementById('dcChannelIdInput')?.focus();
        return;
      }
    }

    if (channelId) localStorage.setItem('vault_dc_channel_id', channelId);

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span>⏳ Dispatching...</span>';
    }

    try {
      // Build Discord Rich Embed
      const embedPayload = {
        title: discordEmbedState.title,
        url: discordEmbedState.url || undefined,
        description: discordEmbedState.description,
        color: discordEmbedState.color,
        footer: discordEmbedState.footerText ? { text: discordEmbedState.footerText } : undefined,
        timestamp: discordEmbedState.timestamp ? new Date().toISOString() : undefined
      };

      if (discordEmbedState.authorName) {
        embedPayload.author = {
          name: discordEmbedState.authorName,
          icon_url: discordEmbedState.authorIcon || undefined
        };
      }

      if (discordEmbedState.thumbnailUrl && discordEmbedState.thumbnailUrl.startsWith('http')) {
        embedPayload.thumbnail = { url: discordEmbedState.thumbnailUrl };
      }

      if (discordEmbedState.imageUrl && discordEmbedState.imageUrl.startsWith('http')) {
        embedPayload.image = { url: discordEmbedState.imageUrl };
      }

      const activeFields = (discordEmbedState.fields || []).filter(f => f.name && f.value);
      if (activeFields.length > 0) {
        embedPayload.fields = activeFields.map(f => ({
          name: f.name,
          value: f.value,
          inline: !!f.inline
        }));
      }

      const payload = {
        mode: mode,
        bot_token: botToken,
        channel_id: channelId,
        webhook_url: webhookUrl,
        content: plainContent || undefined,
        username: discordEmbedState.authorName || 'Vault Sentinel',
        avatar_url: discordEmbedState.authorIcon || undefined,
        embeds: [embedPayload]
      };

      const res = await fetch('/api/bots/discord/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showBotToast('✅ Dispatched Rich Embed to Discord!');
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(16,185,129,0.1)';
          resultBox.style.border = '1px solid var(--green)';
          resultBox.style.color = 'var(--green)';
          resultBox.innerHTML = `
            <b>Success!</b> Message ID: <code>${data.messageId || 'Generated'}</code> sent to Discord.
          `;
        }
      } else {
        showBotToast('Discord dispatch error: ' + (data.error || 'Failed'), true);
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(239,68,68,0.1)';
          resultBox.style.border = '1px solid var(--red)';
          resultBox.style.color = 'var(--red)';
          resultBox.textContent = `Error: ${data.error || 'Failed to dispatch'}`;
        }
      }
    } catch (e) {
      showBotToast('Connection error: ' + e.message, true);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>🎮 Dispatch to Discord</span>';
      }
    }
  };

  window.sendDiscordPingTest = async function() {
    const savedTitle = discordEmbedState.title;
    const savedDesc = discordEmbedState.description;
    discordEmbedState.title = '🏓 Vault Bot Controller Latency Ping';
    discordEmbedState.description = `Round-trip test verified at **${new Date().toISOString()}** from client host **${window.location.hostname}**.`;
    window.updateDiscordEmbedPreview();
    await window.sendDiscordMessage();
    discordEmbedState.title = savedTitle;
    discordEmbedState.description = savedDesc;
    window.updateDiscordEmbedPreview();
  };

  // Discord Slash commands
  window.fetchDiscordCommands = async function() {
    const token = (document.getElementById('dcBotTokenInput')?.value || localStorage.getItem('vault_dc_bot_token') || '').trim();
    const container = document.getElementById('dcCommandsList');
    if (!token || !container) return;

    container.innerHTML = '<div style="color:var(--muted);font-size:11px;">Fetching Discord application commands...</div>';

    try {
      const res = await fetch(`/api/bots/discord/commands?bot_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.success) {
        const cmds = data.commands || [];
        if (cmds.length === 0) {
          container.innerHTML = '<div style="color:var(--muted);font-size:11px;font-style:italic;">No global slash commands found for this Discord Bot.</div>';
          return;
        }
        container.innerHTML = cmds.map(c => `
          <div style="display:flex;justify-content:space-between;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:6px 10px;">
            <code style="color:#5865f2;font-weight:700;">/${escapeHtml(c.name)}</code>
            <span style="color:var(--muted);">${escapeHtml(c.description)}</span>
          </div>
        `).join('');
      } else {
        container.innerHTML = `<div style="color:var(--red);font-size:11px;">${escapeHtml(data.error || 'Failed')}</div>`;
      }
    } catch (e) {
      container.innerHTML = `<div style="color:var(--red);font-size:11px;">Error: ${escapeHtml(e.message)}</div>`;
    }
  };

  window.saveDiscordCredentials = async function() {
    const botToken = (document.getElementById('dcBotTokenInput')?.value || '').trim();
    const webhookUrl = (document.getElementById('dcWebhookUrlInput')?.value || '').trim();
    const channelId = (document.getElementById('dcChannelIdInput')?.value || '').trim();
    if (!botToken && !webhookUrl && !channelId) {
      showBotToast('Please provide a Discord Token, Webhook URL, or Channel ID first', true);
      return;
    }
    const updates = {};
    if (botToken && !botToken.includes('***')) updates.discord_bot_token = botToken;
    if (webhookUrl && !webhookUrl.includes('***')) updates.discord_webhook_url = webhookUrl;
    if (channelId) updates.discord_channel_id = channelId;

    if (botToken && !botToken.includes('***')) localStorage.setItem('vault_dc_bot_token', botToken);
    if (webhookUrl && !webhookUrl.includes('***')) localStorage.setItem('vault_dc_webhook_url', webhookUrl);
    if (channelId) localStorage.setItem('vault_dc_channel_id', channelId);

    const ok = await window.saveBotCredentialsToServer(updates);
    if (ok) {
      const edgeBadge = document.getElementById('dc-edge-badge');
      if (edgeBadge) {
        edgeBadge.innerHTML = '● Edge 24/7 Stored';
        edgeBadge.style.color = 'var(--green)';
        edgeBadge.style.background = 'rgba(16,185,129,0.15)';
      }
      window.verifyDiscord(true);
    }
  };

  window.testDiscordDirectWebhook = async function() {
    const webhookUrl = (document.getElementById('dcWebhookUrlInput')?.value || localStorage.getItem('vault_dc_webhook_url') || '').trim();
    if (!webhookUrl) {
      showBotToast('Please enter a Discord Webhook URL to test', true);
      document.getElementById('dcWebhookUrlInput')?.focus();
      return;
    }

    showBotToast('Testing Discord Webhook connection...');
    try {
      const res = await fetch('/api/bots/discord/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'webhook',
          webhook_url: webhookUrl,
          username: 'Vault Sentinel 24/7',
          content: '⚡ **Vault Discord Webhook Online**\nDirect edge integration verified at ' + new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showBotToast('✅ Discord Webhook test passed! Message delivered.');
      } else {
        showBotToast('Webhook failed: ' + (data.error || 'Check URL'), true);
      }
    } catch (e) {
      showBotToast('Webhook error: ' + e.message, true);
    }
  };

  window.registerDefaultDcCommands = async function() {
    const token = (document.getElementById('dcBotTokenInput')?.value || localStorage.getItem('vault_dc_bot_token') || '').trim();
    if (!token && !botConfig.discord?.botConfigured) {
      showBotToast('Discord Bot Token required', true);
      return;
    }

    try {
      showBotToast('Registering slash commands (/vault, /status, /ping, /audit)...');
      const commands = [
        { name: 'vault', description: 'Display Vault security metrics and health status' },
        { name: 'status', description: 'Check active edge nodes and Turnstile protection status' },
        { name: 'ping', description: 'Test bot round-trip latency to Cloudflare edge' },
        { name: 'audit', description: 'Run instant security integrity check across passwords' }
      ];

      for (const cmd of commands) {
        await fetch('/api/bots/discord/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_token: token,
            name: cmd.name,
            description: cmd.description
          })
        });
      }
      showBotToast('✅ Registered 4 Slash Commands (/vault, /status, /ping, /audit)!');
      window.fetchDiscordCommands();
    } catch (e) {
      showBotToast('Error: ' + e.message, true);
    }
  };

  // ==========================================================================
  // 3. UNIFIED BROADCASTER SUBTAB (TELEGRAM + DISCORD SIMULTANEOUSLY)
  // ==========================================================================
  let broadcastNewsArticles = [];

  function renderBroadcastSubtab(container) {
    const tgChatId = localStorage.getItem('vault_tg_chat_id') || serverBotCredentials.telegram_chat_id || '';
    const dcChannelId = localStorage.getItem('vault_dc_channel_id') || serverBotCredentials.discord_channel_id || '';
    const dcWebhookUrl = localStorage.getItem('vault_dc_webhook_url') || serverBotCredentials.discord_webhook_url || '';

    container.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:22px;display:flex;flex-direction:column;gap:18px;max-width:900px;margin:0 auto;width:100%;">
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
          <div>
            <div style="font-size:20px;font-weight:700;display:flex;align-items:center;gap:10px;">
              <span>📢</span> Omnipresence Unified Broadcaster
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">
              Publish critical security alerts, deployment announcements, and live AI news to <b>both Telegram and Discord simultaneously</b> with zero latency.
            </div>
          </div>
          <button class="filter-pill" onclick="window.saveBroadcastTargetsToEdge()" style="font-size:12px;padding:6px 12px;background:rgba(16,185,129,0.15);color:var(--green);border:1px solid var(--green);cursor:pointer;display:flex;align-items:center;gap:6px;">
            <span>💾</span> Save Targets to Edge 24/7
          </button>
        </div>

        <!-- TARGET CHANNELS SELECTION -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <!-- Telegram Target -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" id="broadcastTgEnabled" checked />
                <span>✈️ Telegram Target</span>
              </label>
              <span style="font-size:11px;color:var(--muted);">Chat ID or @channel</span>
            </div>
            <input 
              type="text" 
              id="broadcastTgChatId" 
              value="${tgChatId}" 
              placeholder="${serverBotCredentials.telegram_chat_id || 'e.g. 123456789 or @mychannel'}" 
              style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--text);font-family:monospace;"
            />
          </div>

          <!-- Discord Target -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label style="font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" id="broadcastDcEnabled" checked />
                <span>🎮 Discord Target</span>
              </label>
              <span style="font-size:11px;color:var(--muted);">Channel or Webhook</span>
            </div>
            <input 
              type="text" 
              id="broadcastDcTarget" 
              value="${dcWebhookUrl || dcChannelId || serverBotCredentials.discord_webhook_url || serverBotCredentials.discord_channel_id || ''}" 
              placeholder="Webhook URL or Channel ID" 
              style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--text);font-family:monospace;"
            />
          </div>
        </div>

        <!-- REAL-TIME AI NEWS INSERTER -->
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;color:var(--text);">
              <span>📰</span> Broadcast Live AI News (Real API-Fetched Stories)
            </div>
            <button class="filter-pill" onclick="window.fetchBroadcastNewsFeed()" style="font-size:11px;padding:3px 8px;cursor:pointer;">
              🔄 Refresh Feed
            </button>
          </div>
          <select 
            id="broadcastNewsPicker" 
            onchange="window.onBroadcastNewsSelected(this.value)" 
            style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:7px 10px;font-size:12px;color:var(--text);"
          >
            <option value="">-- Or Select Real-Time News Story to Broadcast --</option>
          </select>
        </div>

        <!-- BROADCAST MESSAGE COMPOSER -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">Broadcast Title / Headline</label>
            <input 
              type="text" 
              id="broadcastTitle" 
              value="🚨 URGENT: Vault Security Incident Notification" 
              style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px 12px;font-size:14px;font-weight:600;color:var(--text);"
            />
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <label style="font-size:12px;color:var(--muted);">Announcement Body Content</label>
              <!-- Tone Selector -->
              <div style="display:flex;gap:6px;">
                <button class="filter-pill" onclick="window.applyBroadcastTone('alert')" style="font-size:10px;padding:2px 6px;">Alert</button>
                <button class="filter-pill" onclick="window.applyBroadcastTone('release')" style="font-size:10px;padding:2px 6px;">Release</button>
                <button class="filter-pill" onclick="window.applyBroadcastTone('maintenance')" style="font-size:10px;padding:2px 6px;">Maintenance</button>
              </div>
            </div>
            <textarea 
              id="broadcastBody" 
              rows="6" 
              placeholder="Enter announcement message..." 
              style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:12px;color:var(--text);font-size:13px;resize:vertical;"
            >Security audit completed successfully across all edge clusters. Encryption parameters verified with zero discrepancies. All authorized master sessions remain active.</textarea>
          </div>
        </div>

        <!-- DISPATCH BUTTON & STATUS RESULTS -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border);">
          <div style="font-size:12px;color:var(--muted);">
            Dispatches asynchronously to both platform APIs in parallel.
          </div>
          <button 
            id="broadcastDispatchBtn"
            class="filter-pill" 
            onclick="window.executeUnifiedBroadcast()" 
            style="padding:12px 32px;background:var(--accent);color:#fff;font-weight:700;font-size:14px;cursor:pointer;border-radius:8px;border:none;display:flex;align-items:center;gap:8px;"
          >
            <span>🚀 Publish to All Platforms</span>
          </button>
        </div>

        <div id="broadcastResultBox" style="display:none;padding:14px;border-radius:8px;font-size:13px;"></div>

      </div>
    `;

    window.fetchBroadcastNewsFeed();
  }

  window.saveBroadcastTargetsToEdge = async function() {
    const tgChatId = (document.getElementById('broadcastTgChatId')?.value || '').trim();
    const dcTarget = (document.getElementById('broadcastDcTarget')?.value || '').trim();
    const updates = {};
    if (tgChatId) updates.telegram_chat_id = tgChatId;
    if (dcTarget.startsWith('http')) {
      updates.discord_webhook_url = dcTarget;
    } else if (dcTarget) {
      updates.discord_channel_id = dcTarget;
    }

    if (tgChatId) localStorage.setItem('vault_tg_chat_id', tgChatId);
    if (dcTarget.startsWith('http')) localStorage.setItem('vault_dc_webhook_url', dcTarget);
    else if (dcTarget) localStorage.setItem('vault_dc_channel_id', dcTarget);

    await window.saveBotCredentialsToServer(updates);
  };

  window.fetchBroadcastNewsFeed = async function() {
    const select = document.getElementById('broadcastNewsPicker');
    if (!select) return;

    try {
      const res = await fetch('/api/ainews/articles');
      if (res.ok) {
        const data = await res.json();
        const articles = data.articles || (Array.isArray(data) ? data : []);
        if (articles.length > 0) {
          broadcastNewsArticles = articles;
          select.innerHTML = `
            <option value="">-- Choose Live News Article (${articles.length} available) --</option>
            ${articles.map((a, i) => `
              <option value="${i}">[${escapeHtml(a.source || 'News')}] ${escapeHtml(a.title?.substring(0, 85))}...</option>
            `).join('')}
          `;
        }
      }
    } catch (_) {}
  };

  window.onBroadcastNewsSelected = function(idx) {
    if (idx === '' || !broadcastNewsArticles[idx]) return;
    const item = broadcastNewsArticles[idx];
    const titleInput = document.getElementById('broadcastTitle');
    const bodyInput = document.getElementById('broadcastBody');
    if (titleInput) {
      titleInput.value = `📰 ${item.title || 'Breaking AI News'}`;
    }
    if (bodyInput) {
      const summary = item.summary || item.description || item.content || '';
      const dateStr = item.publishedAt || item.date || new Date().toISOString();
      const sourceStr = item.source ? `\n\n📌 Source: ${item.source} (${dateStr})` : '';
      const linkStr = item.url ? `\n🔗 Read full article: ${item.url}` : '';
      bodyInput.value = `${summary}${sourceStr}${linkStr}`;
    }
    showBotToast('News article loaded into broadcast composer!');
  };

  window.applyBroadcastTone = function(type) {
    const title = document.getElementById('broadcastTitle');
    const body = document.getElementById('broadcastBody');
    if (!title || !body) return;

    if (type === 'alert') {
      title.value = '🚨 CRITICAL ALERT: Vault Security Sentinel';
      body.value = 'Master Key integrity check reported anomalous authentication attempts from unfamiliar subnet. IP rate-limiting applied automatically.';
    } else if (type === 'release') {
      title.value = '🚀 RELEASE ANNOUNCEMENT: Vault System Update';
      body.value = 'Vault Bot Controller and Real-time Telegram/Discord bridges deployed to edge production. Multi-platform notifications active.';
    } else if (type === 'maintenance') {
      title.value = '🛠️ SCHEDULED MAINTENANCE: Edge Database Sync';
      body.value = 'Routine database optimization will take place today at 04:00 UTC. Zero downtime expected for read/write operations.';
    }
  };

  window.executeUnifiedBroadcast = async function() {
    const tgEnabled = !!document.getElementById('broadcastTgEnabled')?.checked;
    const dcEnabled = !!document.getElementById('broadcastDcEnabled')?.checked;
    const tgChatId = (document.getElementById('broadcastTgChatId')?.value || '').trim();
    const dcTarget = (document.getElementById('broadcastDcTarget')?.value || '').trim();
    const title = (document.getElementById('broadcastTitle')?.value || '').trim();
    const message = (document.getElementById('broadcastBody')?.value || '').trim();
    const btn = document.getElementById('broadcastDispatchBtn');
    const resultBox = document.getElementById('broadcastResultBox');

    if (!tgEnabled && !dcEnabled) {
      showBotToast('Select at least one platform (Telegram or Discord)', true);
      return;
    }
    if (!message) {
      showBotToast('Please enter announcement message', true);
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Broadcasting to Edge...</span>';
    }

    const payload = {
      title: title,
      message: message,
      color: '#7c6af7',
      telegram: {
        enabled: tgEnabled,
        chat_id: tgChatId,
        bot_token: localStorage.getItem('vault_tg_bot_token') || undefined
      },
      discord: {
        enabled: dcEnabled,
        webhook_url: dcTarget.startsWith('http') ? dcTarget : undefined,
        channel_id: !dcTarget.startsWith('http') ? dcTarget : undefined,
        bot_token: localStorage.getItem('vault_dc_bot_token') || undefined
      }
    };

    try {
      const res = await fetch('/api/bots/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showBotToast('✅ Unified Broadcast dispatched!');
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'var(--surface2)';
          resultBox.style.border = '1px solid var(--border)';
          resultBox.innerHTML = `
            <div style="font-weight:700;margin-bottom:8px;color:var(--text);">Broadcast Results Summary:</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${tgEnabled ? `
                <div style="display:flex;align-items:center;gap:8px;">
                  <span>✈️ Telegram:</span>
                  <span style="font-weight:600;color:${data.results?.telegram?.success ? 'var(--green)' : 'var(--red)'};">
                    ${data.results?.telegram?.success ? '● Delivered Successfully' : '❌ Failed (' + (data.results?.telegram?.error || 'Error') + ')'}
                  </span>
                </div>
              ` : ''}
              ${dcEnabled ? `
                <div style="display:flex;align-items:center;gap:8px;">
                  <span>🎮 Discord:</span>
                  <span style="font-weight:600;color:${data.results?.discord?.success ? 'var(--green)' : 'var(--red)'};">
                    ${data.results?.discord?.success ? '● Delivered Successfully' : '❌ Failed (' + (data.results?.discord?.error || 'Error') + ')'}
                  </span>
                </div>
              ` : ''}
            </div>
          `;
        }
      } else {
        showBotToast('Broadcast error: ' + (data.error || 'Failed'), true);
      }
    } catch (e) {
      showBotToast('Error: ' + e.message, true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🚀 Publish to All Platforms</span>';
      }
    }
  };

  // ==========================================================================
  // 4. CLOUDFLARE EDGE 24/7 SENTINEL & WEBHOOK HUB SUBTAB
  // ==========================================================================
  function renderEdgeSubtab(container) {
    const origin = window.location.origin;
    const tgWebhookUrl = `${origin}/api/bots/telegram/webhook`;
    const dcRelayUrl = `${origin}/api/bots/discord/send`;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:18px;max-width:1100px;margin:0 auto;width:100%;">
        
        <!-- HERO CARD: OPERATING STATUS & PING -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <span style="font-size:24px;">⚡</span>
              <span style="font-size:20px;font-weight:700;color:var(--text);">Cloudflare Edge Worker 24/7 Sentinel</span>
              <span style="font-size:11px;background:rgba(16,185,129,0.15);color:var(--green);border:1px solid var(--green);padding:3px 10px;border-radius:12px;font-weight:700;">
                🟢 OPERATIONAL 24/7
              </span>
            </div>
            <div style="font-size:13px;color:var(--muted);max-width:700px;line-height:1.5;">
              Telegram webhooks and Discord dispatchers run full-time on Cloudflare Workers & Pages edge serverless runtimes. Inbound webhook requests are parsed instantly with automated multi-command response engines.
            </div>
          </div>

          <div style="display:flex;gap:10px;align-items:center;">
            <button class="filter-pill" onclick="window.pingEdgeHealth()" style="padding:10px 18px;background:var(--accent);color:#fff;font-weight:600;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;border-radius:6px;border:none;">
              <span>⚡</span> Ping Edge Worker
            </button>
            <span id="edgePingResult" style="font-family:monospace;font-size:12px;color:var(--muted);">
              Latency: -- ms
            </span>
          </div>
        </div>

        <!-- TWO COLUMN GRID: WEBHOOK ENDPOINTS & SIMULATOR -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(400px, 1fr));gap:18px;">
          
          <!-- WEBHOOK ENDPOINTS DIRECTORY -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
              <span>🌐</span> Production Edge Webhook Endpoints
            </div>
            <div style="font-size:12px;color:var(--muted);">
              Use these live URLs in Telegram @BotFather or Discord integrations:
            </div>

            <!-- Telegram Webhook Row -->
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;font-size:12px;color:#0088cc;">✈️ Telegram Inbound Webhook:</span>
                <button class="filter-pill" onclick="window.copyToClipboard('${tgWebhookUrl}')" style="font-size:10px;padding:2px 8px;cursor:pointer;">
                  📋 Copy URL
                </button>
              </div>
              <code style="font-size:11px;color:var(--text);word-break:break-all;background:var(--surface);padding:4px 8px;border-radius:4px;border:1px solid var(--border);">
                ${tgWebhookUrl}
              </code>
            </div>

            <!-- Discord Relay Row -->
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;font-size:12px;color:#5865f2;">🎮 Discord Dispatch Relay:</span>
                <button class="filter-pill" onclick="window.copyToClipboard('${dcRelayUrl}')" style="font-size:10px;padding:2px 8px;cursor:pointer;">
                  📋 Copy URL
                </button>
              </div>
              <code style="font-size:11px;color:var(--text);word-break:break-all;background:var(--surface);padding:4px 8px;border-radius:4px;border:1px solid var(--border);">
                ${dcRelayUrl}
              </code>
            </div>

            <button class="filter-pill" onclick="window.setTelegramWebhookCurrent()" style="padding:8px 14px;background:var(--surface2);border:1px solid var(--border);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
              <span>🔗</span> Auto-Bind Telegram Webhook to Current App URL
            </button>
          </div>

          <!-- INBOUND WEBHOOK AUTO-RESPONDER TESTER -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>🧪</span> Edge Webhook Command Simulator
              </div>
              <span style="font-size:11px;color:var(--muted);">Cloudflare Worker Auto-Responder</span>
            </div>
            <div style="font-size:12px;color:var(--muted);">
              Simulate an inbound command message hitting the Cloudflare Edge Webhook to test instantaneous bot execution:
            </div>

            <div style="display:flex;gap:8px;">
              <select id="simulatedWebhookCmd" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--text);font-size:13px;font-family:monospace;">
                <option value="/ping">/ping - Edge Round-trip Latency</option>
                <option value="/status">/status - Cloudflare Node Status</option>
                <option value="/start">/start - Welcome & Menu Options</option>
                <option value="/vault">/vault - Vault Metrics & Passwords</option>
                <option value="/id">/id - Chat & User ID Diagnostic</option>
                <option value="/help">/help - Command Directory</option>
              </select>
              <button class="filter-pill" onclick="window.simulateEdgeWebhook()" style="padding:8px 14px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer;border-radius:6px;border:none;">
                ⚡ Send to Edge
              </button>
            </div>

            <div id="simulatedWebhookResponse" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:12px;min-height:90px;font-family:monospace;font-size:12px;color:var(--muted);white-space:pre-wrap;overflow-x:auto;">
Click "Send to Edge" to simulate an incoming Telegram update payload and observe the real-time response from the worker.
            </div>
          </div>

        </div>

        <!-- PERSISTENT CREDENTIALS REGISTRY TABLE -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span>🗄️</span> Edge & SQLite Persistent Key Registry
              </div>
              <div style="font-size:12px;color:var(--muted);">
                Credentials stored in the encrypted settings database and injected into Cloudflare Workers KV bindings for full-time 24/7 operation.
              </div>
            </div>
            <button class="filter-pill" onclick="window.fetchBotsCredentials().then(() => renderEdgeSubtab(document.getElementById('botSubtabContent')))" style="font-size:12px;padding:6px 12px;cursor:pointer;">
              🔄 Refresh Registry
            </button>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);color:var(--muted);">
                <th style="padding:8px 10px;">Parameter Key</th>
                <th style="padding:8px 10px;">Current Status</th>
                <th style="padding:8px 10px;">Storage Tier</th>
                <th style="padding:8px 10px;">Masked Preview</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--surface2);">
                <td style="padding:8px 10px;font-family:monospace;font-weight:600;">telegram_bot_token</td>
                <td style="padding:8px 10px;">
                  <span style="font-weight:600;color:${serverBotCredentials.telegram_bot_token ? 'var(--green)' : 'var(--muted)'};">
                    ${serverBotCredentials.telegram_bot_token ? '● Stored 24/7' : '○ Not Set'}
                  </span>
                </td>
                <td style="padding:8px 10px;color:var(--muted);">SQLite / Cloudflare KV</td>
                <td style="padding:8px 10px;font-family:monospace;">${serverBotCredentials.telegram_bot_token ? '●●●●●●●●●●●●' : '(empty)'}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--surface2);">
                <td style="padding:8px 10px;font-family:monospace;font-weight:600;">telegram_chat_id</td>
                <td style="padding:8px 10px;">
                  <span style="font-weight:600;color:${serverBotCredentials.telegram_chat_id ? 'var(--green)' : 'var(--muted)'};">
                    ${serverBotCredentials.telegram_chat_id ? '● Stored 24/7' : '○ Not Set'}
                  </span>
                </td>
                <td style="padding:8px 10px;color:var(--muted);">SQLite / Cloudflare KV</td>
                <td style="padding:8px 10px;font-family:monospace;">${escapeHtml(serverBotCredentials.telegram_chat_id) || '(empty)'}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--surface2);">
                <td style="padding:8px 10px;font-family:monospace;font-weight:600;">discord_bot_token</td>
                <td style="padding:8px 10px;">
                  <span style="font-weight:600;color:${serverBotCredentials.discord_bot_token ? 'var(--green)' : 'var(--muted)'};">
                    ${serverBotCredentials.discord_bot_token ? '● Stored 24/7' : '○ Not Set'}
                  </span>
                </td>
                <td style="padding:8px 10px;color:var(--muted);">SQLite / Cloudflare KV</td>
                <td style="padding:8px 10px;font-family:monospace;">${serverBotCredentials.discord_bot_token ? '●●●●●●●●●●●●' : '(empty)'}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--surface2);">
                <td style="padding:8px 10px;font-family:monospace;font-weight:600;">discord_webhook_url</td>
                <td style="padding:8px 10px;">
                  <span style="font-weight:600;color:${serverBotCredentials.discord_webhook_url ? 'var(--green)' : 'var(--muted)'};">
                    ${serverBotCredentials.discord_webhook_url ? '● Stored 24/7' : '○ Not Set'}
                  </span>
                </td>
                <td style="padding:8px 10px;color:var(--muted);">SQLite / Cloudflare KV</td>
                <td style="padding:8px 10px;font-family:monospace;">${serverBotCredentials.discord_webhook_url ? 'https://discord.com/api/webhooks/...' : '(empty)'}</td>
              </tr>
              <tr>
                <td style="padding:8px 10px;font-family:monospace;font-weight:600;">discord_channel_id</td>
                <td style="padding:8px 10px;">
                  <span style="font-weight:600;color:${serverBotCredentials.discord_channel_id ? 'var(--green)' : 'var(--muted)'};">
                    ${serverBotCredentials.discord_channel_id ? '● Stored 24/7' : '○ Not Set'}
                  </span>
                </td>
                <td style="padding:8px 10px;color:var(--muted);">SQLite / Cloudflare KV</td>
                <td style="padding:8px 10px;font-family:monospace;">${escapeHtml(serverBotCredentials.discord_channel_id) || '(empty)'}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    `;
  }

  window.pingEdgeHealth = async function() {
    const resEl = document.getElementById('edgePingResult');
    if (resEl) resEl.textContent = 'Pinging...';
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const timeMs = Math.round(performance.now() - start);
      if (res.ok) {
        if (resEl) {
          resEl.textContent = `🟢 Latency: ${timeMs} ms`;
          resEl.style.color = 'var(--green)';
        }
        showBotToast(`Edge Health Check OK (${timeMs} ms)`);
      } else {
        if (resEl) {
          resEl.textContent = `❌ Error: ${res.status}`;
          resEl.style.color = 'var(--red)';
        }
      }
    } catch (e) {
      if (resEl) {
        resEl.textContent = `❌ ${e.message}`;
        resEl.style.color = 'var(--red)';
      }
    }
  };

  window.simulateEdgeWebhook = async function() {
    const cmd = document.getElementById('simulatedWebhookCmd')?.value || '/ping';
    const box = document.getElementById('simulatedWebhookResponse');
    if (box) box.textContent = `Sending simulated webhook update for command "${cmd}" to /api/bots/telegram/webhook...`;

    try {
      const simulatedUpdate = {
        update_id: Math.floor(Math.random() * 1000000),
        message: {
          message_id: Math.floor(Math.random() * 100000),
          from: { id: 99999999, is_bot: false, first_name: 'Diagnostic', username: 'diagnostic_tester' },
          chat: { id: 99999999, type: 'private', first_name: 'Diagnostic' },
          date: Math.floor(Date.now() / 1000),
          text: cmd
        }
      };

      const res = await fetch('/api/bots/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulatedUpdate)
      });

      const data = await res.json();
      if (box) {
        box.textContent = JSON.stringify(data, null, 2);
        box.style.color = data.ok ? 'var(--green)' : 'var(--text)';
      }
      showBotToast('Simulated edge webhook completed!');
    } catch (e) {
      if (box) {
        box.textContent = 'Error: ' + e.message;
        box.style.color = 'var(--red)';
      }
    }
  };

  window.copyToClipboard = function(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showBotToast('Copied to clipboard!');
      }).catch(() => {
        showBotToast('Failed to copy', true);
      });
    } else {
      showBotToast('Clipboard not supported', true);
    }
  };

  // ==========================================================================
  // 4. ACTIVITY LOGS & INBOUND WEBHOOK STREAM
  // ==========================================================================
  function renderLogsSubtab(container) {
    container.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <div style="font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px;">
              <span>📜</span> Bot Activity & Webhook Event Monitor
            </div>
            <div style="font-size:12px;color:var(--muted);">
              Live audit stream of all outbound dispatches, incoming webhooks, and interaction events.
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="filter-pill" onclick="window.fetchBotLogs()" style="font-size:12px;cursor:pointer;padding:6px 12px;">
              <span>🔄</span> Refresh Stream
            </button>
            <button class="filter-pill" onclick="window.clearBotLogs()" style="font-size:12px;color:var(--red);cursor:pointer;padding:6px 12px;">
              <span>🗑️</span> Clear Logs
            </button>
          </div>
        </div>

        <div id="botLogsTableContainer" style="overflow-x:auto;">
          <div style="color:var(--muted);text-align:center;padding:24px;font-size:13px;">
            Loading activity stream...
          </div>
        </div>
      </div>
    `;

    fetchBotLogs();
  }

  window.fetchBotLogs = async function() {
    const container = document.getElementById('botLogsTableContainer');
    if (!container) return;

    try {
      const res = await fetch('/api/bots/logs');
      const data = await res.json();
      if (res.ok && data.success) {
        botLogs = data.logs || [];
        if (botLogs.length === 0) {
          container.innerHTML = `
            <div style="color:var(--muted);text-align:center;padding:30px;font-size:13px;">
              No bot activity recorded yet. Send a message to Telegram or Discord to see live events appear here!
            </div>
          `;
          return;
        }

        container.innerHTML = `
          <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);color:var(--muted);">
                <th style="padding:8px 10px;">Timestamp</th>
                <th style="padding:8px 10px;">Platform</th>
                <th style="padding:8px 10px;">Action / Event</th>
                <th style="padding:8px 10px;">Target</th>
                <th style="padding:8px 10px;">Content Preview</th>
                <th style="padding:8px 10px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${botLogs.map(log => `
                <tr style="border-bottom:1px solid var(--surface2);">
                  <td style="padding:8px 10px;color:var(--muted);font-family:monospace;white-space:nowrap;">
                    ${new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td style="padding:8px 10px;font-weight:600;">
                    ${log.platform === 'telegram' ? '<span style="color:#0088cc;">✈️ Telegram</span>' : '<span style="color:#5865f2;">🎮 Discord</span>'}
                  </td>
                  <td style="padding:8px 10px;font-family:monospace;">
                    ${escapeHtml(log.action || log.type || 'dispatch')}
                  </td>
                  <td style="padding:8px 10px;color:var(--muted);font-family:monospace;">
                    ${escapeHtml(String(log.target || 'Default'))}
                  </td>
                  <td style="padding:8px 10px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${escapeHtml(log.content || log.sender ? `${log.sender}: ${log.content}` : '-')}
                  </td>
                  <td style="padding:8px 10px;">
                    <span style="font-weight:600;color:${log.status === 'success' || log.status === 'received' ? 'var(--green)' : 'var(--red)'};">
                      ${log.status === 'success' ? '● OK' : log.status === 'received' ? '📥 Inbound' : '❌ Error'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    } catch (e) {
      container.innerHTML = `<div style="color:var(--red);padding:16px;">Failed to load logs: ${escapeHtml(e.message)}</div>`;
    }
  };

  window.clearBotLogs = async function() {
    try {
      await fetch('/api/bots/logs', { method: 'DELETE' });
      showBotToast('Bot activity stream cleared');
      window.fetchBotLogs();
    } catch (_) {}
  };

  // Refresh all diagnostics
  window.refreshAllBotDiagnostics = async function() {
    await fetchBotsConfig();
    verifyTelegramBot(false);
    verifyDiscord(false);
    showBotToast('All bot diagnostics refreshed!');
  };

  // Helper escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
