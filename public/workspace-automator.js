/**
 * Google Workspace (Gmail & Calendar) Automator
 * Powers client-side OAuth with in-memory token caching,
 * Gmail & Google Calendar REST APIs, and the AI Automator engine.
 */

(function () {
  'use strict';

  // In-memory OAuth credentials cache (NEVER stored in localStorage/sessionStorage)
  let cachedAccessToken = null;
  let cachedUser = null;
  let cachedConfig = null;
  let tokenClient = null;
  let activeWorkspaceSubTab = 'automator'; // 'automator' | 'gmail' | 'calendar' | 'briefing'
  let cachedEmails = [];
  let cachedEvents = [];
  let isLoadingEmails = false;
  let isLoadingEvents = false;

  const WORKSPACE_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  // Fetch Firebase/OAuth configuration
  async function fetchConfig() {
    if (cachedConfig) return cachedConfig;
    try {
      const res = await fetch('/firebase-applet-config.json');
      if (res.ok) {
        cachedConfig = await res.json();
        return cachedConfig;
      }
    } catch (_) {}

    try {
      const res2 = await fetch('/api/workspace/config');
      if (res2.ok) {
        cachedConfig = await res2.json();
        return cachedConfig;
      }
    } catch (_) {}

    cachedConfig = {
      projectId: 'gen-lang-client-0413303583',
      oAuthClientId: '489502497748-ukrq819tp9rknbabu586rj0lfnamcesl.apps.googleusercontent.com',
      authDomain: 'gen-lang-client-0413303583.firebaseapp.com'
    };
    return cachedConfig;
  }

  // Google Identity Services (GSI) Token Client loader
  async function loadGsiClient() {
    if (tokenClient) return tokenClient;
    const config = await fetchConfig();
    const clientId = config.oAuthClientId || (config.apiKey ? '489502497748-ukrq819tp9rknbabu586rj0lfnamcesl.apps.googleusercontent.com' : '');

    return new Promise((resolve) => {
      const init = () => {
        if (window.google?.accounts?.oauth2) {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: WORKSPACE_SCOPES.join(' '),
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                cachedAccessToken = tokenResponse.access_token;
                await fetchUserProfile();
                if (typeof window.renderWorkspaceTab === 'function') {
                  window.renderWorkspaceTab();
                }
                if (typeof window.toast === 'function') {
                  window.toast('Connected to Google Workspace successfully!');
                }
              } else if (tokenResponse && tokenResponse.error) {
                console.error('Google OAuth error:', tokenResponse.error);
                if (typeof window.toast === 'function') {
                  window.toast('Google sign in error: ' + tokenResponse.error);
                }
              }
            }
          });
          resolve(tokenClient);
        } else {
          resolve(null);
        }
      };

      if (window.google?.accounts?.oauth2) {
        init();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = init;
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      }
    });
  }

  // Fetch Google User Profile using OAuth access token
  async function fetchUserProfile() {
    if (!cachedAccessToken) return null;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${cachedAccessToken}` }
      });
      if (res.ok) {
        cachedUser = await res.json();
        return cachedUser;
      }
    } catch (e) {
      console.warn('Could not fetch user profile:', e);
    }
    return null;
  }

  // Public Auth Methods
  window.GoogleWorkspaceAuth = {
    getAccessToken: () => cachedAccessToken,
    setAccessToken: (token) => { cachedAccessToken = token; },
    getUser: () => cachedUser,
    isConnected: () => Boolean(cachedAccessToken),
    getScopes: () => WORKSPACE_SCOPES,
    signIn: async () => {
      // 1. Try Google Identity Services
      const client = await loadGsiClient();
      if (client) {
        client.requestAccessToken({ prompt: 'consent' });
        return;
      }

      // 2. Fallback token prompt for testing or manual connection
      const manual = prompt('Enter a valid Google OAuth Access Token with Gmail & Calendar scopes:');
      if (manual && manual.trim()) {
        cachedAccessToken = manual.trim();
        await fetchUserProfile();
        window.renderWorkspaceTab();
        window.toast('Connected via access token!');
      }
    },
    signOut: () => {
      cachedAccessToken = null;
      cachedUser = null;
      cachedEmails = [];
      cachedEvents = [];
      if (typeof window.toast === 'function') {
        window.toast('Disconnected from Google Workspace');
      }
      window.renderWorkspaceTab();
    }
  };

  // Helper: Confirmation modal for destructive/mutating operations (MANDATORY)
  function promptWorkspaceConfirmation({ title, details, actionType, onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.style.zIndex = '99999';

    overlay.innerHTML = `
      <div class="modal" style="max-width: 480px; border: 1px solid var(--accent); box-shadow: 0 12px 36px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 17px;">
            <span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
              ${actionType || 'Action Confirmation'}
            </span>
            ${title || 'Confirm Action'}
          </h3>
          <button type="button" class="btn" id="wsConfirmClose" style="padding: 4px 8px; background: transparent; border: none; font-size: 18px; cursor: pointer;">✕</button>
        </div>
        <div style="background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13.5px; line-height: 1.5; color: var(--text);">
          ${details}
        </div>
        <p style="font-size: 12px; color: var(--muted); margin-bottom: 20px;">
          ⚠️ This operation will interact directly with your connected Google account. Please verify before proceeding.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn" id="wsConfirmCancel" style="background: var(--surface2); color: var(--text); border: 1px solid var(--border);">Cancel</button>
          <button type="button" class="btn btn-primary" id="wsConfirmProceed" style="background: #2563eb; color: #fff;">Confirm & Execute</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    overlay.querySelector('#wsConfirmClose').onclick = cleanup;
    overlay.querySelector('#wsConfirmCancel').onclick = cleanup;
    overlay.querySelector('#wsConfirmProceed').onclick = async () => {
      cleanup();
      try {
        await onConfirm();
      } catch (err) {
        console.error('Confirmation action error:', err);
        if (typeof window.toast === 'function') {
          window.toast('Action error: ' + err.message);
        }
      }
    };
  }

  // ---- GMAIL API CLIENT ----
  const GmailAPI = {
    async listMessages(query = 'is:unread', maxResults = 10) {
      if (!cachedAccessToken) throw new Error('Not connected to Google Auth');
      const url = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cachedAccessToken}` }
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gmail API error (${res.status}): ${err}`);
      }
      const data = await res.json();
      const messages = data.messages || [];

      // Fetch details for each message
      const details = await Promise.all(
        messages.map(async (m) => {
          try {
            const mRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, {
              headers: { Authorization: `Bearer ${cachedAccessToken}` }
            });
            if (mRes.ok) return await mRes.json();
          } catch (_) {}
          return m;
        })
      );

      return details.map(GmailAPI.parseMessage);
    },

    parseMessage(msg) {
      if (!msg) return {};
      const headers = msg.payload?.headers || [];
      const getHeader = (name) => {
        const h = headers.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : '';
      };

      let body = '';
      if (msg.payload?.parts) {
        for (const part of msg.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            try {
              body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              break;
            } catch (_) {}
          }
        }
      }
      if (!body && msg.payload?.body?.data) {
        try {
          body = atob(msg.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch (_) {}
      }

      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet || '',
        subject: getHeader('Subject') || '(No Subject)',
        from: getHeader('From') || '(Unknown Sender)',
        to: getHeader('To') || '',
        date: getHeader('Date') ? new Date(getHeader('Date')).toLocaleString() : '',
        labelIds: msg.labelIds || [],
        isUnread: (msg.labelIds || []).includes('UNREAD'),
        isStarred: (msg.labelIds || []).includes('STARRED'),
        body: body || msg.snippet || ''
      };
    },

    async sendMessage({ to, subject, body }) {
      if (!cachedAccessToken) throw new Error('Not connected to Google Auth');
      if (!to || !to.includes('@')) throw new Error('Valid recipient email address is required');

      const emailLines = [
        `To: ${to}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject || 'Message from Vault')))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        (body || '').replace(/\n/g, '<br/>')
      ];

      const emailRaw = emailLines.join('\r\n');
      const base64UrlSafe = btoa(unescape(encodeURIComponent(emailRaw)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64UrlSafe })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to send email (${res.status}): ${err}`);
      }
      return await res.json();
    },

    async markAsRead(messageId) {
      if (!cachedAccessToken) return;
      await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
      });
    },

    async trashMessage(messageId) {
      if (!cachedAccessToken) throw new Error('Not connected to Google Auth');
      const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cachedAccessToken}` }
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to trash email (${res.status}): ${err}`);
      }
      return await res.json();
    }
  };

  // ---- GOOGLE CALENDAR API CLIENT ----
  const CalendarAPI = {
    async listEvents(timeMin, timeMax) {
      if (!cachedAccessToken) throw new Error('Not connected to Google Auth');
      const min = timeMin || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const max = timeMax || new Date(Date.now() + 14 * 86400000).toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cachedAccessToken}` }
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Calendar API error (${res.status}): ${err}`);
      }
      const data = await res.json();
      return data.items || [];
    },

    async createEvent({ summary, description, startDateTime, endDateTime, location, attendees = [], createMeet = false }) {
      if (!cachedAccessToken) throw new Error('Not connected to Google Auth');
      if (!summary) throw new Error('Event title/summary is required');

      const payload = {
        summary,
        description: description || '',
        location: location || '',
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        attendees: attendees.map((email) => ({ email: email.trim() })).filter((a) => a.email)
      };

      if (createMeet) {
        payload.conferenceData = {
          createRequest: {
            requestId: 'vault-meet-' + Date.now(),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        };
      }

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to create calendar event (${res.status}): ${err}`);
      }
      return await res.json();
    },

    async deleteEvent(eventId) {
      if (!cachedAccessToken) throw new Error('Not connected to Google Auth');
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cachedAccessToken}` }
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.text();
        throw new Error(`Failed to delete event (${res.status}): ${err}`);
      }
      return true;
    }
  };

  // ---- WORKSPACE AUTOMATOR TAB RENDERER ----
  window.renderWorkspaceTab = async function () {
    const content = document.getElementById('mainContent');
    if (!content) return;

    const isConnected = Boolean(cachedAccessToken);
    const user = cachedUser || {};

    let html = `
      <div style="max-width: 1100px; margin: 0 auto; padding-bottom: 60px;">
        <!-- TOP HEADER CARD -->
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 24px;">⚡</span>
              <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Google Workspace Automator</h2>
              <span style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 600; background: ${isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)'}; color: ${isConnected ? '#22c55e' : '#ef4444'};">
                ${isConnected ? '● Connected' : '○ Not Connected'}
              </span>
            </div>
            <p style="margin: 0; font-size: 13.5px; color: var(--muted);">
              Unified Gmail and Google Calendar automations powered by Google OAuth and AI intelligence.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            ${
              isConnected
                ? `
              <div style="display: flex; align-items: center; gap: 10px; background: var(--surface2); padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border);">
                ${user.picture ? `<img src="${user.picture}" alt="" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover;"/>` : `<span style="font-size: 14px;">👤</span>`}
                <span style="font-size: 13px; font-weight: 600;">${user.email || user.name || 'Google Account'}</span>
              </div>
              <button type="button" class="btn" onclick="window.GoogleWorkspaceAuth.signOut()" style="background: var(--surface2); border: 1px solid var(--border); font-size: 12.5px; padding: 8px 14px;">
                Disconnect
              </button>
            `
                : `
              <!-- OFFICIAL GSI MATERIAL BUTTON (SKILL MANDATE) -->
              <button type="button" class="gsi-material-button" onclick="window.GoogleWorkspaceAuth.signIn()">
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                  <div class="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display: block;">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span class="gsi-material-button-contents">Sign in with Google</span>
                </div>
              </button>
            `
            }
          </div>
        </div>
    `;

    if (!isConnected) {
      // Connect invitation state
      html += `
        <div style="background: var(--surface); border: 1px dashed var(--border); border-radius: 12px; padding: 40px 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
          <h3 style="margin: 0 0 8px 0; font-size: 19px;">Connect Your Google Account</h3>
          <p style="max-width: 560px; margin: 0 auto 24px auto; font-size: 14px; color: var(--muted); line-height: 1.6;">
            Sign in with Google to allow Vault to automate your schedule, read and triage unread emails, compose emails, create Google Meet events, and cross-sync with your tasks.
          </p>

          <div style="display: flex; justify-content: center; margin-bottom: 24px;">
            <button type="button" class="gsi-material-button" onclick="window.GoogleWorkspaceAuth.signIn()">
              <div class="gsi-material-button-state"></div>
              <div class="gsi-material-button-content-wrapper">
                <div class="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display: block;">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span class="gsi-material-button-contents">Sign in with Google to Activate</span>
              </div>
            </button>
          </div>

          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; max-width: 680px; margin: 0 auto; text-align: left;">
            <div style="flex: 1 1 280px; background: var(--surface2); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <div style="font-weight: 600; font-size: 13.5px; margin-bottom: 4px;">✉️ Gmail Intelligence</div>
              <div style="font-size: 12px; color: var(--muted);">Read unread emails, compose drafts, reply with AI assistance, and convert emails directly into Vault tasks.</div>
            </div>
            <div style="flex: 1 1 280px; background: var(--surface2); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
              <div style="font-weight: 600; font-size: 13.5px; margin-bottom: 4px;">📅 Calendar Scheduling</div>
              <div style="font-size: 12px; color: var(--muted);">Natural language meeting scheduling, Google Meet video generation, conflict checking, and schedule previews.</div>
            </div>
          </div>
        </div>
      `;
      content.innerHTML = html;
      return;
    }

    // Connected State: Navigation Sub-Tabs
    html += `
      <!-- SUB-NAVIGATION BAR -->
      <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 20px; overflow-x: auto;">
        <button type="button" class="btn" onclick="window.switchWorkspaceSubTab('automator')" style="background: ${activeWorkspaceSubTab === 'automator' ? 'var(--accent)' : 'var(--surface)'}; color: ${activeWorkspaceSubTab === 'automator' ? '#fff' : 'var(--text)'}; font-weight: 600; font-size: 13px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);">
          ⚡ Natural Language Automator
        </button>
        <button type="button" class="btn" onclick="window.switchWorkspaceSubTab('gmail')" style="background: ${activeWorkspaceSubTab === 'gmail' ? 'var(--accent)' : 'var(--surface)'}; color: ${activeWorkspaceSubTab === 'gmail' ? '#fff' : 'var(--text)'}; font-weight: 600; font-size: 13px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);">
          ✉️ Gmail Inbox & Compose
        </button>
        <button type="button" class="btn" onclick="window.switchWorkspaceSubTab('calendar')" style="background: ${activeWorkspaceSubTab === 'calendar' ? 'var(--accent)' : 'var(--surface)'}; color: ${activeWorkspaceSubTab === 'calendar' ? '#fff' : 'var(--text)'}; font-weight: 600; font-size: 13px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);">
          📅 Calendar & Schedule
        </button>
        <button type="button" class="btn" onclick="window.switchWorkspaceSubTab('briefing')" style="background: ${activeWorkspaceSubTab === 'briefing' ? 'var(--accent)' : 'var(--surface)'}; color: ${activeWorkspaceSubTab === 'briefing' ? '#fff' : 'var(--text)'}; font-weight: 600; font-size: 13px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);">
          ☀️ Daily Briefing & Sync
        </button>
      </div>

      <div id="wsSubContent">
        <!-- DYNAMIC SUBTAB CONTENT -->
      </div>
    </div>`;

    content.innerHTML = html;
    renderCurrentSubTab();
  };

  window.switchWorkspaceSubTab = function (subTab) {
    activeWorkspaceSubTab = subTab;
    window.renderWorkspaceTab();
  };

  function renderCurrentSubTab() {
    const sub = document.getElementById('wsSubContent');
    if (!sub) return;

    if (activeWorkspaceSubTab === 'automator') {
      renderAutomatorConsole(sub);
    } else if (activeWorkspaceSubTab === 'gmail') {
      renderGmailHub(sub);
    } else if (activeWorkspaceSubTab === 'calendar') {
      renderCalendarHub(sub);
    } else if (activeWorkspaceSubTab === 'briefing') {
      renderBriefingHub(sub);
    }
  }

  // ---- 1. NATURAL LANGUAGE AUTOMATOR CONSOLE ----
  function renderAutomatorConsole(container) {
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
        <!-- INPUT COMMAND CARD -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px;">
          <h3 style="margin: 0 0 6px 0; font-size: 16.5px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span>🤖</span> AI Google Automator Prompt
          </h3>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--muted);">
            Type anything in plain English. The Automator will parse your intent, construct an action plan, and ask for confirmation before executing emails or events.
          </p>

          <div style="position: relative; margin-bottom: 14px;">
            <textarea id="wsAutomatorInput" rows="3" placeholder="e.g. Schedule a sync with dev@team.com tomorrow at 3pm, or check my unread emails, or send status update to manager..." style="width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 14px; resize: vertical;"></textarea>
          </div>

          <!-- QUICK PROMPTS -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px;">
            <button type="button" class="btn" onclick="window.fillWsPrompt('Show my latest unread emails and summarize them')" style="font-size: 12px; background: var(--surface2); border: 1px solid var(--border); padding: 5px 10px; border-radius: 6px;">
              ✉️ Check Unread Emails
            </button>
            <button type="button" class="btn" onclick="window.fillWsPrompt('Show my calendar schedule for today and detect any conflicts')" style="font-size: 12px; background: var(--surface2); border: 1px solid var(--border); padding: 5px 10px; border-radius: 6px;">
              📅 Check Today's Schedule
            </button>
            <button type="button" class="btn" onclick="window.fillWsPrompt('Schedule sprint planning meeting tomorrow at 2pm for 45 mins with Google Meet')" style="font-size: 12px; background: var(--surface2); border: 1px solid var(--border); padding: 5px 10px; border-radius: 6px;">
              ➕ Schedule Meeting Tomorrow
            </button>
            <button type="button" class="btn" onclick="window.fillWsPrompt('Generate daily executive briefing from my emails and meetings')" style="font-size: 12px; background: var(--surface2); border: 1px solid var(--border); padding: 5px 10px; border-radius: 6px;">
              ☀️ Executive Morning Briefing
            </button>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="button" class="btn btn-primary" id="btnRunAutomator" onclick="window.executeAutomatorCommand()" style="display: flex; align-items: center; gap: 8px; padding: 10px 22px; font-weight: 600; font-size: 14px;">
              <span>⚡</span> Run Automator
            </button>
          </div>
        </div>

        <!-- EXECUTION RESULT & PLAN DISPLAY -->
        <div id="wsPlanContainer" style="display: none;"></div>
      </div>
    `;
  }

  window.fillWsPrompt = function (text) {
    const el = document.getElementById('wsAutomatorInput');
    if (el) {
      el.value = text;
      el.focus();
    }
  };

  window.executeAutomatorCommand = async function () {
    const input = document.getElementById('wsAutomatorInput');
    const planBox = document.getElementById('wsPlanContainer');
    const runBtn = document.getElementById('btnRunAutomator');
    if (!input || !input.value.trim()) {
      if (typeof window.toast === 'function') window.toast('Please enter a command');
      return;
    }

    const instruction = input.value.trim();
    runBtn.disabled = true;
    runBtn.innerHTML = '<span>⏳</span> Planning...';
    planBox.style.display = 'block';
    planBox.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">⚡</div>
        <p style="margin: 0; color: var(--muted); font-size: 14px;">Analyzing instruction with AI and planning Google Workspace actions...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/workspace/automator/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          now: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!res.ok) {
        throw new Error(`Planner returned error ${res.status}`);
      }

      const plan = await res.json();
      renderPlanReview(planBox, plan, instruction);
    } catch (err) {
      planBox.innerHTML = `
        <div style="background: var(--surface); border: 1px solid #ef4444; border-radius: 12px; padding: 20px;">
          <div style="color: #ef4444; font-weight: 700; margin-bottom: 8px;">Plan Error</div>
          <p style="margin: 0; font-size: 13.5px;">${err.message}</p>
        </div>
      `;
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = '<span>⚡</span> Run Automator';
    }
  };

  function renderPlanReview(container, plan, originalInstruction) {
    const actions = plan.actions || [];
    const requiresConfirmation = Boolean(plan.requiresConfirmation);

    let actionsHtml = actions
      .map((a, idx) => {
        let badge = a.type.toUpperCase();
        let color = '#3b82f6';
        if (a.type.includes('send') || a.type.includes('create')) color = '#10b981';
        if (a.type.includes('trash') || a.type.includes('delete')) color = '#ef4444';

        return `
        <div style="background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: ${color}20; color: ${color}; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px;">
              Step ${idx + 1}: ${badge}
            </span>
          </div>
          <div style="font-size: 13.5px; color: var(--text);">
            <pre style="margin: 0; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; overflow-x: auto;">${JSON.stringify(a.params, null, 2)}</pre>
          </div>
        </div>
      `;
      })
      .join('');

    container.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h4 style="margin: 0; font-size: 16px; font-weight: 700;">Proposed Action Plan</h4>
          <span style="font-size: 12px; color: var(--muted);">${actions.length} action(s)</span>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: var(--text);">
          ${plan.summary || originalInstruction}
        </p>

        <div style="margin-bottom: 18px;">
          ${actionsHtml}
        </div>

        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
          <button type="button" class="btn" onclick="document.getElementById('wsPlanContainer').style.display='none'" style="background: var(--surface2); border: 1px solid var(--border);">
            Dismiss
          </button>
          <button type="button" class="btn btn-primary" id="btnConfirmPlan" style="background: #2563eb; color: #fff; padding: 8px 18px; font-weight: 600;">
            ${requiresConfirmation ? 'Confirm & Execute Plan' : 'Execute Plan'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('btnConfirmPlan').onclick = async () => {
      if (requiresConfirmation) {
        promptWorkspaceConfirmation({
          title: 'Confirm Automator Execution',
          actionType: 'WORKSPACE ACTION',
          details: `
            <strong>Summary:</strong> ${plan.summary || originalInstruction}<br/>
            <br/>
            <strong>Note:</strong> ${plan.confirmationPrompt || 'This will perform mutating operations (email/calendar) with your Google account.'}
          `,
          onConfirm: () => runActionsSequence(actions)
        });
      } else {
        await runActionsSequence(actions);
      }
    };
  }

  async function runActionsSequence(actions) {
    const planBox = document.getElementById('wsPlanContainer');
    planBox.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
        <div style="font-size: 14px; font-weight: 600;">Executing Google Workspace Actions...</div>
      </div>
    `;

    const results = [];

    for (const action of actions) {
      try {
        if (action.type === 'gmail_list') {
          const list = await GmailAPI.listMessages(action.params.query || 'is:unread', action.params.maxResults || 10);
          results.push({
            type: 'gmail_list',
            success: true,
            message: `Found ${list.length} email(s) for query "${action.params.query || 'is:unread'}"`,
            data: list
          });
        } else if (action.type === 'gmail_send') {
          const sent = await GmailAPI.sendMessage(action.params);
          results.push({
            type: 'gmail_send',
            success: true,
            message: `Email sent to ${action.params.to} ("${action.params.subject}")`,
            data: sent
          });
        } else if (action.type === 'gmail_trash') {
          await GmailAPI.trashMessage(action.params.messageId);
          results.push({
            type: 'gmail_trash',
            success: true,
            message: `Email moved to trash`
          });
        } else if (action.type === 'gmail_mark_read') {
          await GmailAPI.markAsRead(action.params.messageId);
          results.push({
            type: 'gmail_mark_read',
            success: true,
            message: `Email marked as read`
          });
        } else if (action.type === 'calendar_list') {
          const events = await CalendarAPI.listEvents(action.params.timeMin, action.params.timeMax);
          results.push({
            type: 'calendar_list',
            success: true,
            message: `Fetched ${events.length} calendar event(s)`,
            data: events
          });
        } else if (action.type === 'calendar_create') {
          const created = await CalendarAPI.createEvent(action.params);
          results.push({
            type: 'calendar_create',
            success: true,
            message: `Calendar event "${created.summary}" scheduled!`,
            data: created
          });
        } else if (action.type === 'calendar_delete') {
          await CalendarAPI.deleteEvent(action.params.eventId);
          results.push({
            type: 'calendar_delete',
            success: true,
            message: `Calendar event deleted`
          });
        } else if (action.type === 'task_create') {
          // Add directly to Vault Todo list via backend API
          const tRes = await fetch('/api/todos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + (window.masterKey || '')
            },
            body: JSON.stringify({
              title: action.params.title,
              description: action.params.description || '',
              due_date: action.params.due_date || '',
              priority: action.params.priority || 'medium',
              category: 'Automator'
            })
          });
          const tData = await tRes.json();
          results.push({
            type: 'task_create',
            success: true,
            message: `Vault Task created: "${action.params.title}"`,
            data: tData
          });
        } else if (action.type === 'explain') {
          results.push({
            type: 'explain',
            success: true,
            message: action.params.text
          });
        }
      } catch (err) {
        results.push({
          type: action.type,
          success: false,
          error: err.message
        });
      }
    }

    // Render results
    let resultsHtml = results
      .map((r) => {
        const ok = r.success;
        return `
        <div style="background: ${ok ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border: 1px solid ${ok ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
          <div style="font-weight: 600; font-size: 13.5px; color: ${ok ? '#22c55e' : '#ef4444'}; margin-bottom: 4px;">
            ${ok ? '✓ Succeeded' : '✕ Failed'}: ${r.type.toUpperCase()}
          </div>
          <div style="font-size: 13px; color: var(--text);">
            ${r.message || r.error}
          </div>
          ${
            r.data?.htmlLink
              ? `
            <div style="margin-top: 6px;">
              <a href="${r.data.htmlLink}" target="_blank" rel="noopener" style="font-size: 12px; color: var(--accent); text-decoration: underline;">Open in Google Calendar ↗</a>
            </div>
          `
              : ''
          }
          ${
            r.data?.hangoutLink
              ? `
            <div style="margin-top: 4px;">
              <a href="${r.data.hangoutLink}" target="_blank" rel="noopener" style="font-size: 12px; color: #22c55e; font-weight: 600; text-decoration: underline;">Join Google Meet 🎥 ↗</a>
            </div>
          `
              : ''
          }
        </div>
      `;
      })
      .join('');

    planBox.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px;">
        <h4 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700;">Automator Execution Results</h4>
        ${resultsHtml}
        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <button type="button" class="btn" onclick="document.getElementById('wsPlanContainer').style.display='none'" style="background: var(--surface2); border: 1px solid var(--border);">
            Close
          </button>
        </div>
      </div>
    `;
    if (typeof window.toast === 'function') {
      window.toast('Automator execution complete!');
    }
  }

  // ---- 2. GMAIL HUB ----
  async function renderGmailHub(container) {
    container.innerHTML = `
      <div>
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px;">
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-primary" onclick="window.openComposeEmailModal()" style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
              <span>✏️</span> Compose Email
            </button>
            <button type="button" class="btn" onclick="window.refreshGmailList('is:unread')" style="background: var(--surface); border: 1px solid var(--border); font-size: 13px;">
              🔄 Unread
            </button>
            <button type="button" class="btn" onclick="window.refreshGmailList('in:inbox')" style="background: var(--surface); border: 1px solid var(--border); font-size: 13px;">
              📥 All Inbox
            </button>
          </div>

          <div style="display: flex; gap: 8px; flex: 1 1 300px; max-width: 450px;">
            <input type="text" id="gmailSearchInput" placeholder="Search emails (e.g. from:support, project...)" style="flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px;"/>
            <button type="button" class="btn" onclick="window.searchGmailCustom()" style="background: var(--surface); border: 1px solid var(--border); font-size: 13px;">Search</button>
          </div>
        </div>

        <div id="gmailListContainer">
          <div style="text-align: center; padding: 40px; color: var(--muted);">Loading emails from Gmail...</div>
        </div>
      </div>
    `;

    await refreshGmailList('is:unread');
  }

  window.searchGmailCustom = function () {
    const q = document.getElementById('gmailSearchInput')?.value.trim();
    refreshGmailList(q || 'in:inbox');
  };

  window.refreshGmailList = async function (query) {
    const listEl = document.getElementById('gmailListContainer');
    if (!listEl) return;
    listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">Loading emails...</div>';

    try {
      cachedEmails = await GmailAPI.listMessages(query, 15);
      if (!cachedEmails || cachedEmails.length === 0) {
        listEl.innerHTML = `
          <div style="background: var(--surface); border: 1px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
            <div style="font-size: 15px; font-weight: 600;">No emails found</div>
            <div style="font-size: 13px; color: var(--muted); margin-top: 4px;">Query: "${query}" returned 0 messages.</div>
          </div>
        `;
        return;
      }

      let itemsHtml = cachedEmails
        .map((m, idx) => {
          return `
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'" onclick="window.openEmailDetailModal(${idx})">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px; font-weight: ${m.isUnread ? '700' : '500'}; font-size: 14px; color: var(--text);">
                ${m.isUnread ? '<span style="color: #3b82f6; font-size: 10px;">●</span>' : ''}
                <span>${m.from.split('<')[0]}</span>
              </div>
              <div style="font-size: 12px; color: var(--muted);">${m.date}</div>
            </div>
            <div style="font-weight: ${m.isUnread ? '700' : '600'}; font-size: 13.5px; color: var(--text); margin-bottom: 4px;">
              ${m.subject}
            </div>
            <div style="font-size: 12.5px; color: var(--muted); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${m.snippet}
            </div>
          </div>
        `;
        })
        .join('');

      listEl.innerHTML = itemsHtml;
    } catch (err) {
      listEl.innerHTML = `
        <div style="background: var(--surface); border: 1px solid #ef4444; border-radius: 10px; padding: 20px; color: #ef4444;">
          <strong>Error loading emails:</strong> ${err.message}
        </div>
      `;
    }
  };

  // Open email detail modal
  window.openEmailDetailModal = function (index) {
    const email = cachedEmails[index];
    if (!email) return;

    // Mark as read in background
    if (email.isUnread) {
      GmailAPI.markAsRead(email.id).catch(() => {});
      email.isUnread = false;
    }

    const html = `
      <div style="max-height: 80vh; display: flex; flex-direction: column;">
        <div style="border-bottom: 1px solid var(--border); padding-bottom: 14px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 700;">${email.subject}</h3>
          <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;">
            <strong>From:</strong> ${email.from}
          </div>
          <div style="font-size: 12px; color: var(--muted);">
            <strong>Date:</strong> ${email.date}
          </div>
        </div>

        <div style="flex: 1; overflow-y: auto; font-size: 13.5px; line-height: 1.6; color: var(--text); white-space: pre-wrap; background: var(--surface2); padding: 14px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 20px;">
          ${email.body}
        </div>

        <!-- ACTIONS ROW -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; border-top: 1px solid var(--border); padding-top: 14px;">
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn" onclick="window.convertEmailToVaultTask(${index})" style="font-size: 12.5px; background: var(--surface2); border: 1px solid var(--border);">
              ✅ Save as Vault Task
            </button>
            <button type="button" class="btn" onclick="window.scheduleMeetingFromEmail(${index})" style="font-size: 12.5px; background: var(--surface2); border: 1px solid var(--border);">
              📅 Schedule Event
            </button>
            <button type="button" class="btn" onclick="window.openReplyEmailModal(${index})" style="font-size: 12.5px; background: var(--surface2); border: 1px solid var(--border);">
              ↩️ Reply
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn" onclick="window.trashEmailWithConfirm(${index})" style="font-size: 12.5px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
              🗑️ Trash
            </button>
            <button type="button" class="btn" onclick="window.closeModal()" style="font-size: 12.5px;">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    if (typeof window.openModal === 'function') {
      window.openModal(html);
    }
  };

  // Convert Email to Vault Task
  window.convertEmailToVaultTask = async function (index) {
    const email = cachedEmails[index];
    if (!email) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (window.masterKey || '')
        },
        body: JSON.stringify({
          title: `Follow up: ${email.subject}`,
          description: `From: ${email.from}\n\n${email.snippet}`,
          priority: 'medium',
          due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          category: 'Gmail'
        })
      });

      if (res.ok) {
        if (typeof window.toast === 'function') {
          window.toast('Created Vault task from email!');
        }
        if (typeof window.closeModal === 'function') {
          window.closeModal();
        }
      }
    } catch (e) {
      if (typeof window.toast === 'function') window.toast('Failed: ' + e.message);
    }
  };

  // Schedule Meeting from Email
  window.scheduleMeetingFromEmail = function (index) {
    const email = cachedEmails[index];
    if (!email) return;
    if (typeof window.closeModal === 'function') window.closeModal();

    window.openNewEventModal({
      summary: `Discussion: ${email.subject}`,
      description: `Follow up on email from ${email.from}.\n\nOriginal snippet: ${email.snippet}`,
      attendees: email.from.match(/<([^>]+)>/)?.[1] || email.from
    });
  };

  // Reply to Email Modal
  window.openReplyEmailModal = function (index) {
    const email = cachedEmails[index];
    if (!email) return;
    if (typeof window.closeModal === 'function') window.closeModal();

    const recipient = email.from.match(/<([^>]+)>/)?.[1] || email.from;
    window.openComposeEmailModal({
      to: recipient,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: `\n\n--- On ${email.date}, ${email.from} wrote:\n> ${email.snippet}`
    });
  };

  // Trash Email with Mandatory Confirmation
  window.trashEmailWithConfirm = function (index) {
    const email = cachedEmails[index];
    if (!email) return;

    promptWorkspaceConfirmation({
      title: 'Move Email to Trash',
      actionType: 'GMAIL TRASH',
      details: `Are you sure you want to move <strong>"${email.subject}"</strong> from <em>${email.from}</em> to trash?`,
      onConfirm: async () => {
        await GmailAPI.trashMessage(email.id);
        if (typeof window.closeModal === 'function') window.closeModal();
        if (typeof window.toast === 'function') window.toast('Email moved to trash');
        await refreshGmailList('is:unread');
      }
    });
  };

  // Compose Email Modal
  window.openComposeEmailModal = function (prefill = {}) {
    const html = `
      <div style="max-width: 580px;">
        <h3 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700;">✏️ Compose Email</h3>
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">To (Recipient):</label>
          <input type="email" id="composeTo" value="${prefill.to || ''}" placeholder="recipient@example.com" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13.5px;"/>
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Subject:</label>
          <input type="text" id="composeSubject" value="${prefill.subject || ''}" placeholder="Subject line" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13.5px;"/>
        </div>
        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Message Body:</label>
          <textarea id="composeBody" rows="7" placeholder="Write your message here..." style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13.5px; resize: vertical;">${prefill.body || ''}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn" onclick="window.closeModal()" style="background: var(--surface2); border: 1px solid var(--border);">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="window.submitSendEmail()" style="background: #2563eb; color: #fff; font-weight: 600;">Review & Send</button>
        </div>
      </div>
    `;

    if (typeof window.openModal === 'function') {
      window.openModal(html);
    }
  };

  // Submit Send Email (Mandatory confirmation check)
  window.submitSendEmail = function () {
    const to = document.getElementById('composeTo')?.value.trim();
    const subject = document.getElementById('composeSubject')?.value.trim();
    const body = document.getElementById('composeBody')?.value.trim();

    if (!to || !to.includes('@')) {
      if (typeof window.toast === 'function') window.toast('Please provide a valid recipient email address');
      return;
    }

    promptWorkspaceConfirmation({
      title: 'Send Email Confirmation',
      actionType: 'GMAIL SEND',
      details: `
        <strong>Recipient:</strong> ${to}<br/>
        <strong>Subject:</strong> ${subject || '(No Subject)'}<br/>
        <strong>Body Preview:</strong><br/>
        <div style="margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.15); border-radius: 4px; max-height: 120px; overflow-y: auto;">
          ${(body || '').replace(/\n/g, '<br/>')}
        </div>
      `,
      onConfirm: async () => {
        await GmailAPI.sendMessage({ to, subject, body });
        if (typeof window.closeModal === 'function') window.closeModal();
        if (typeof window.toast === 'function') window.toast('Email sent successfully!');
      }
    });
  };

  // ---- 3. GOOGLE CALENDAR HUB ----
  async function renderCalendarHub(container) {
    container.innerHTML = `
      <div>
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px;">
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-primary" onclick="window.openNewEventModal()" style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
              <span>➕</span> New Event
            </button>
            <button type="button" class="btn" onclick="window.refreshCalendarList()" style="background: var(--surface); border: 1px solid var(--border); font-size: 13px;">
              🔄 Refresh Events
            </button>
            <button type="button" class="btn" onclick="window.syncEventsToVaultTasks()" style="background: var(--surface); border: 1px solid var(--border); font-size: 13px;">
              📥 Sync Events to Tasks
            </button>
          </div>

          <div style="font-size: 13px; color: var(--muted);">
            Showing next 14 days
          </div>
        </div>

        <div id="calendarListContainer">
          <div style="text-align: center; padding: 40px; color: var(--muted);">Loading events from Google Calendar...</div>
        </div>
      </div>
    `;

    await refreshCalendarList();
  }

  window.refreshCalendarList = async function () {
    const listEl = document.getElementById('calendarListContainer');
    if (!listEl) return;
    listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">Loading events...</div>';

    try {
      cachedEvents = await CalendarAPI.listEvents();
      if (!cachedEvents || cachedEvents.length === 0) {
        listEl.innerHTML = `
          <div style="background: var(--surface); border: 1px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
            <div style="font-size: 15px; font-weight: 600;">No upcoming events</div>
            <div style="font-size: 13px; color: var(--muted); margin-top: 4px;">You have no scheduled meetings in the next 14 days.</div>
          </div>
        `;
        return;
      }

      let eventsHtml = cachedEvents
        .map((evt, idx) => {
          const start = evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString() : evt.start?.date || 'All Day';
          const end = evt.end?.dateTime ? new Date(evt.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          const hasMeet = Boolean(evt.hangoutLink);

          return `
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; margin-bottom: 12px;">
            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text);">${evt.summary || '(Untitled Event)'}</h4>
              <div style="font-size: 12.5px; font-weight: 600; color: var(--accent); background: var(--surface2); padding: 3px 8px; border-radius: 6px;">
                ${start} ${end ? '– ' + end : ''}
              </div>
            </div>

            ${evt.description ? `<p style="margin: 0 0 10px 0; font-size: 13px; color: var(--muted); line-height: 1.4;">${evt.description}</p>` : ''}

            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
              <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--muted);">
                ${evt.location ? `<span>📍 ${evt.location}</span>` : ''}
                ${evt.attendees?.length ? `<span>👥 ${evt.attendees.length} attendee(s)</span>` : ''}
                ${hasMeet ? `<a href="${evt.hangoutLink}" target="_blank" rel="noopener" style="color: #22c55e; font-weight: 600; text-decoration: underline;">Join Google Meet 🎥 ↗</a>` : ''}
              </div>

              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn" onclick="window.addEventToVaultTask(${idx})" style="font-size: 12px; background: var(--surface2); border: 1px solid var(--border);">
                  ✅ Add to Tasks
                </button>
                <button type="button" class="btn" onclick="window.deleteCalendarEventWithConfirm(${idx})" style="font-size: 12px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        `;
        })
        .join('');

      listEl.innerHTML = eventsHtml;
    } catch (err) {
      listEl.innerHTML = `
        <div style="background: var(--surface); border: 1px solid #ef4444; border-radius: 10px; padding: 20px; color: #ef4444;">
          <strong>Error loading events:</strong> ${err.message}
        </div>
      `;
    }
  };

  // Open New Event Modal
  window.openNewEventModal = function (prefill = {}) {
    // Compute default start tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const startStr = tomorrow.toISOString().slice(0, 16);

    const endHour = new Date(tomorrow.getTime() + 45 * 60000);
    const endStr = endHour.toISOString().slice(0, 16);

    const html = `
      <div style="max-width: 580px;">
        <h3 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700;">➕ Schedule Google Calendar Event</h3>
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Event Title:</label>
          <input type="text" id="evtTitle" value="${prefill.summary || ''}" placeholder="e.g. Sprint Planning, Project Sync" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13.5px;"/>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Start Date & Time:</label>
            <input type="datetime-local" id="evtStart" value="${prefill.start || startStr}" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px;"/>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">End Date & Time:</label>
            <input type="datetime-local" id="evtEnd" value="${prefill.end || endStr}" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px;"/>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Attendees (comma-separated emails):</label>
          <input type="text" id="evtAttendees" value="${prefill.attendees || ''}" placeholder="colleague@example.com, manager@example.com" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px;"/>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Location:</label>
          <input type="text" id="evtLocation" value="${prefill.location || ''}" placeholder="Conference Room or Online" style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px;"/>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Description:</label>
          <textarea id="evtDescription" rows="3" placeholder="Meeting agenda or details..." style="width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px; resize: vertical;">${prefill.description || ''}</textarea>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px;">
          <input type="checkbox" id="evtMeetToggle" checked style="cursor: pointer;"/>
          <label for="evtMeetToggle" style="font-size: 13px; cursor: pointer;">Automatically generate Google Meet video call link 🎥</label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn" onclick="window.closeModal()" style="background: var(--surface2); border: 1px solid var(--border);">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="window.submitCreateCalendarEvent()" style="background: #2563eb; color: #fff; font-weight: 600;">Confirm & Schedule</button>
        </div>
      </div>
    `;

    if (typeof window.openModal === 'function') {
      window.openModal(html);
    }
  };

  // Submit Event Create (with mandatory confirmation check)
  window.submitCreateCalendarEvent = function () {
    const summary = document.getElementById('evtTitle')?.value.trim();
    const startVal = document.getElementById('evtStart')?.value;
    const endVal = document.getElementById('evtEnd')?.value;
    const attendeesVal = document.getElementById('evtAttendees')?.value.trim();
    const location = document.getElementById('evtLocation')?.value.trim();
    const description = document.getElementById('evtDescription')?.value.trim();
    const createMeet = Boolean(document.getElementById('evtMeetToggle')?.checked);

    if (!summary) {
      if (typeof window.toast === 'function') window.toast('Please enter an event title');
      return;
    }

    const startISO = new Date(startVal).toISOString();
    const endISO = new Date(endVal).toISOString();
    const attendees = attendeesVal ? attendeesVal.split(',').map((e) => e.trim()) : [];

    promptWorkspaceConfirmation({
      title: 'Schedule Calendar Event',
      actionType: 'CALENDAR CREATE',
      details: `
        <strong>Event:</strong> ${summary}<br/>
        <strong>Start:</strong> ${new Date(startISO).toLocaleString()}<br/>
        <strong>End:</strong> ${new Date(endISO).toLocaleString()}<br/>
        ${attendees.length ? `<strong>Attendees:</strong> ${attendees.join(', ')}<br/>` : ''}
        ${createMeet ? '<strong>Video:</strong> Google Meet link will be generated 🎥<br/>' : ''}
      `,
      onConfirm: async () => {
        await CalendarAPI.createEvent({
          summary,
          description,
          startDateTime: startISO,
          endDateTime: endISO,
          location,
          attendees,
          createMeet
        });
        if (typeof window.closeModal === 'function') window.closeModal();
        if (typeof window.toast === 'function') window.toast('Calendar event scheduled successfully!');
        await refreshCalendarList();
      }
    });
  };

  // Delete Calendar Event with Mandatory Confirmation
  window.deleteCalendarEventWithConfirm = function (index) {
    const evt = cachedEvents[index];
    if (!evt) return;

    promptWorkspaceConfirmation({
      title: 'Delete Calendar Event',
      actionType: 'CALENDAR DELETE',
      details: `Are you sure you want to permanently delete event <strong>"${evt.summary}"</strong> from your Google Calendar?`,
      onConfirm: async () => {
        await CalendarAPI.deleteEvent(evt.id);
        if (typeof window.toast === 'function') window.toast('Event deleted');
        await refreshCalendarList();
      }
    });
  };

  // Add Calendar Event to Vault Tasks
  window.addEventToVaultTask = async function (index) {
    const evt = cachedEvents[index];
    if (!evt) return;

    const start = evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString() : evt.start?.date || '';
    const dateStr = evt.start?.dateTime ? evt.start.dateTime.split('T')[0] : '';

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (window.masterKey || '')
        },
        body: JSON.stringify({
          title: `Attend: ${evt.summary || 'Meeting'}`,
          description: `Time: ${start}\n${evt.location ? 'Location: ' + evt.location + '\n' : ''}${evt.hangoutLink ? 'Meet: ' + evt.hangoutLink : ''}`,
          due_date: dateStr,
          priority: 'medium',
          category: 'Calendar'
        })
      });

      if (res.ok) {
        if (typeof window.toast === 'function') window.toast('Added event to Vault tasks!');
      }
    } catch (e) {
      if (typeof window.toast === 'function') window.toast('Error: ' + e.message);
    }
  };

  // Sync Multiple Calendar Events to Tasks
  window.syncEventsToVaultTasks = async function () {
    if (!cachedEvents || cachedEvents.length === 0) {
      if (typeof window.toast === 'function') window.toast('No events to sync');
      return;
    }

    let synced = 0;
    for (const evt of cachedEvents.slice(0, 10)) {
      try {
        const dateStr = evt.start?.dateTime ? evt.start.dateTime.split('T')[0] : '';
        await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + (window.masterKey || '')
          },
          body: JSON.stringify({
            title: `[Cal] ${evt.summary || 'Meeting'}`,
            description: `${evt.start?.dateTime || ''} ${evt.location || ''}`,
            due_date: dateStr,
            priority: 'medium',
            category: 'Calendar'
          })
        });
        synced++;
      } catch (_) {}
    }

    if (typeof window.toast === 'function') {
      window.toast(`Synced ${synced} event(s) to Vault Tasks!`);
    }
  };

  // ---- 4. DAILY BRIEFING & CROSS-SYNC ----
  async function renderBriefingHub(container) {
    container.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <span>☀️</span> Daily Morning Briefing
            </h3>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--muted);">
              Consolidates today's meetings, unread emails, and pending Vault tasks into an executive summary.
            </p>
          </div>
          <button type="button" class="btn btn-primary" onclick="window.generateBriefing()" style="font-size: 13px; font-weight: 600;">
            ⚡ Generate Fresh Briefing
          </button>
        </div>

        <div id="briefingContentArea" style="min-height: 200px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 18px; font-size: 14px; line-height: 1.6; color: var(--text);">
          <div style="text-align: center; color: var(--muted); padding: 40px 0;">
            Click "Generate Fresh Briefing" to compile your daily intelligence report.
          </div>
        </div>

        <div id="briefingActionRow" style="display: none; justify-content: flex-end; gap: 10px; margin-top: 16px;">
          <button type="button" class="btn btn-primary" onclick="window.emailBriefingToMe()" style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
            <span>📤</span> Email Briefing to Myself
          </button>
        </div>
      </div>
    `;
  }

  let latestBriefingText = '';

  window.generateBriefing = async function () {
    const area = document.getElementById('briefingContentArea');
    const actions = document.getElementById('briefingActionRow');
    if (!area) return;

    area.innerHTML = '<div style="text-align:center; padding: 40px 0; color: var(--muted);">Aggregating Google Calendar, Gmail, and Vault Todos...</div>';

    try {
      // 1. Fetch Today's events
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      const events = await CalendarAPI.listEvents(startOfDay, endOfDay);

      // 2. Fetch unread emails
      const emails = await GmailAPI.listMessages('is:unread', 5);

      // 3. Fetch Vault tasks
      let tasks = [];
      try {
        const tRes = await fetch('/api/todos', {
          headers: { Authorization: 'Bearer ' + (window.masterKey || '') }
        });
        if (tRes.ok) tasks = await tRes.json();
      } catch (_) {}

      // 4. Request AI Briefing from backend
      const bRes = await fetch('/api/workspace/automator/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          emails,
          tasks,
          userName: cachedUser?.name || 'Commander'
        })
      });

      const data = await bRes.json();
      latestBriefingText = data.briefing || 'No briefing generated.';

      // Format simple markdown into HTML
      const formatted = latestBriefingText
        .replace(/### (.*)/g, '<h4 style="margin:16px 0 8px 0; font-size: 15px; color: var(--accent);">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n- /g, '<br/>• ');

      area.innerHTML = formatted;
      if (actions) actions.style.display = 'flex';
    } catch (err) {
      area.innerHTML = `<div style="color: #ef4444;">Error compiling briefing: ${err.message}</div>`;
    }
  };

  // Email Briefing to User (with mandatory confirmation)
  window.emailBriefingToMe = function () {
    if (!cachedUser?.email) {
      if (typeof window.toast === 'function') window.toast('No connected user email found');
      return;
    }
    if (!latestBriefingText) {
      if (typeof window.toast === 'function') window.toast('Please generate a briefing first');
      return;
    }

    const recipient = cachedUser.email;
    const subject = `Executive Daily Briefing - ${new Date().toLocaleDateString()}`;

    promptWorkspaceConfirmation({
      title: 'Email Briefing Confirmation',
      actionType: 'GMAIL SEND',
      details: `Send this morning briefing to your address (<strong>${recipient}</strong>)?`,
      onConfirm: async () => {
        await GmailAPI.sendMessage({
          to: recipient,
          subject,
          body: latestBriefingText
        });
        if (typeof window.toast === 'function') window.toast('Briefing sent to your inbox!');
      }
    });
  };

  // Initialize GSI client on startup
  loadGsiClient().catch(() => {});
})();
