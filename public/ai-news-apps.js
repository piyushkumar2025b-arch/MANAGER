// ============================================================================
// 🧠 AI PULSE: 100% REAL LIVE API-FETCHED AI NEWS CORNER & TRENDING AI APPS
// Live Feeds: The Verge, Ars Technica, MIT Tech Review, YouTube AI, arXiv, Google News, Hacker News, Hugging Face Hub
// ============================================================================

(function() {
  let activeTab = 'news'; // 'news' | 'apps'
  let newsCategory = 'all';
  let newsSource = 'all';
  let newsMedia = 'all'; // 'all' | 'video' | 'photo' | 'paper' | 'article'
  let newsQuery = '';
  let newsArticles = [];
  let newsLoading = false;
  let newsLastRefreshed = null;

  let appsCategory = 'all';
  let appsType = 'all'; // 'all' | 'space' | 'model'
  let appsQuery = '';
  let appsList = [];
  let appsLoading = false;
  let appsLastRefreshed = null;

  let activeVideo = null; // { videoId, title, author }

  // Relative time helper
  function timeAgo(isoDate) {
    if (!isoDate) return 'Recently';
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (isNaN(seconds) || seconds < 0) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Exact timestamp helper (User requested exact dates)
  function formatExactDate(isoDate) {
    if (!isoDate) return 'Live realtime feed';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return d.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (_) {
      return isoDate;
    }
  }

  // Safe HTML escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load News from Live Backend API
  async function loadNews(force = false) {
    if (newsLoading) return;
    newsLoading = true;
    render();

    try {
      const queryParams = new URLSearchParams();
      if (newsCategory !== 'all') queryParams.set('category', newsCategory);
      if (newsSource !== 'all') queryParams.set('source', newsSource);
      if (newsMedia !== 'all') queryParams.set('media', newsMedia);
      if (newsQuery) queryParams.set('q', newsQuery);
      if (force) queryParams.set('_t', Date.now());

      const res = await api('GET', `/ai/news?${queryParams.toString()}`);
      if (res && res.success && Array.isArray(res.articles)) {
        newsArticles = res.articles;
        newsLastRefreshed = new Date();
      } else {
        toast('Could not fetch live AI news feed');
      }
    } catch (err) {
      console.error('Error fetching live AI news:', err);
      toast('Network error loading live AI news');
    } finally {
      newsLoading = false;
      render();
    }
  }

  // Load Trending AI Apps & Models from Hugging Face Hub API
  async function loadApps() {
    if (appsLoading) return;
    appsLoading = true;
    render();

    try {
      const queryParams = new URLSearchParams();
      if (appsCategory !== 'all') queryParams.set('category', appsCategory);
      if (appsType !== 'all') queryParams.set('type', appsType);
      if (appsQuery) queryParams.set('q', appsQuery);

      const res = await api('GET', `/ai/trending-apps?${queryParams.toString()}`);
      if (res && res.success && Array.isArray(res.apps)) {
        appsList = res.apps;
        appsLastRefreshed = new Date();
      } else {
        toast('Could not fetch trending AI apps');
      }
    } catch (err) {
      console.error('Error fetching trending apps:', err);
      toast('Network error loading trending apps');
    } finally {
      appsLoading = false;
      render();
    }
  }

  // Bookmark Article to Vault Notes
  async function bookmarkArticle(article) {
    try {
      const title = `AI: ${article.title}`;
      const notes = `[Source: ${article.source} | Published: ${formatExactDate(article.publishedAt)}]\nType: ${(article.mediaType || 'article').toUpperCase()}\nLink: ${article.url}\n${article.pdfUrl ? `PDF Paper: ${article.pdfUrl}\n` : ''}${article.author ? `Author: ${article.author}\n` : ''}\nSummary:\n${article.fullSummary || article.summary}`;
      await api('POST', '/passwords', {
        title: title.slice(0, 80),
        website: article.url,
        notes: notes,
        item_type: 'note'
      });
      toast(`✓ Saved to Vault Notes: "${article.title.slice(0, 32)}..."`);
    } catch (err) {
      toast('Failed to save to Vault: ' + err.message);
    }
  }

  // Bookmark App to Vault Notes
  async function bookmarkApp(app) {
    try {
      const title = `AI App: ${app.name}`;
      const notes = `[Hugging Face ${app.type === 'space' ? 'Interactive Space' : 'Foundation Model'}]\nCategory: ${app.category.toUpperCase()} | Score: ${app.trendingScore} | Likes: ${app.likes}\nDeveloper: ${app.developer}\nURL: ${app.url}\n${app.directAppUrl ? `Direct Space Web: ${app.directAppUrl}\n` : ''}\nDescription:\n${app.tagline}\n\nTags: ${(app.tags || []).join(', ')}`;
      await api('POST', '/passwords', {
        title: title.slice(0, 80),
        website: app.directAppUrl || app.url,
        notes: notes,
        item_type: 'note'
      });
      toast(`✓ Saved to Vault: "${app.name}"`);
    } catch (err) {
      toast('Failed to save to Vault: ' + err.message);
    }
  }

  // Copy helper
  function copyLink(url, label = 'link') {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      toast(`✓ Copied ${label} to clipboard!`);
    }).catch(() => {
      prompt('Copy link:', url);
    });
  }

  // MAIN RENDERER
  function render() {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const isNews = activeTab === 'news';

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:18px;max-width:1440px;margin:0 auto;width:100%;">

        <!-- HEADER BANNER -->
        <div style="background:linear-gradient(135deg, rgba(124,106,247,0.16) 0%, rgba(56,189,248,0.12) 100%);border:1px solid rgba(124,106,247,0.25);border-radius:var(--radius);padding:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
              <span style="font-size:26px;">🧠</span>
              <h1 style="font-size:22px;font-weight:800;color:var(--text);margin:0;letter-spacing:-0.02em;">
                AI Pulse: Real-Time AI News & Trending Apps
              </h1>
              <span style="background:rgba(34,197,94,0.18);border:1px solid rgba(34,197,94,0.4);color:var(--green);font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.04em;">
                ● 100% Real Live APIs
              </span>
            </div>
            <p style="font-size:13px;color:var(--muted);margin:0;max-width:820px;line-height:1.5;">
              Direct live API ingestion from <strong>The Verge</strong> (photos & articles), <strong>Ars Technica</strong>, <strong>MIT Technology Review</strong>, <strong>YouTube AI channels</strong> (videos & breakdowns), <strong>arXiv</strong> (cs.AI & cs.LG research papers with PDFs), <strong>Google News</strong>, and <strong>Hugging Face Hub</strong> (trending spaces & foundation models).
            </p>
          </div>

          <!-- TOP ACTIONS -->
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${isNews ? `
              <button id="aiNewsRefreshBtn" class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;" onclick="window.refreshAiNews()">
                <span style="display:inline-block;${newsLoading ? 'animation:spin 1s linear infinite;' : ''}">🔄</span>
                ${newsLoading ? 'Fetching Live Feeds...' : 'Fetch Latest Live'}
              </button>
            ` : `
              <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;" onclick="window.refreshAiApps()">
                <span style="display:inline-block;${appsLoading ? 'animation:spin 1s linear infinite;' : ''}">🔄</span>
                ${appsLoading ? 'Querying Hugging Face...' : 'Refresh Trending Apps'}
              </button>
            `}
            <button class="btn-sm" style="background:rgba(124,106,247,0.15);border:1px solid var(--accent);color:var(--accent);display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;" onclick="switchTab('cards')">
              <span>🔖</span> View Saved Vault Notes
            </button>
          </div>
        </div>

        <!-- SEGMENTED CORNER SWITCHER -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border);padding-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;background:var(--surface);padding:4px;border-radius:var(--radius-sm);border:1px solid var(--border);">
            <button
              id="aiSegmentNews"
              style="padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px;transition:all 0.15s ease;${isNews ? 'background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(124,106,247,0.3);' : 'background:transparent;color:var(--muted);'}"
              onclick="window.switchAiCorner('news')">
              <span>⚡</span> Live AI News & Media
              <span style="background:${isNews ? 'rgba(255,255,255,0.25)' : 'var(--surface2)'};color:${isNews ? '#fff' : 'var(--text)'};font-size:11px;padding:1px 6px;border-radius:10px;">
                ${newsArticles.length ? newsArticles.length : 'Live'}
              </span>
            </button>
            <button
              id="aiSegmentApps"
              style="padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px;transition:all 0.15s ease;${!isNews ? 'background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(124,106,247,0.3);' : 'background:transparent;color:var(--muted);'}"
              onclick="window.switchAiCorner('apps')">
              <span>🔥</span> Trending AI Apps & Models
              <span style="background:${!isNews ? 'rgba(255,255,255,0.25)' : 'var(--surface2)'};color:${!isNews ? '#fff' : 'var(--text)'};font-size:11px;padding:1px 6px;border-radius:10px;">
                ${appsList.length ? appsList.length : 'Hugging Face'}
              </span>
            </button>
          </div>

          <!-- SEARCH FILTER INPUT -->
          <div style="position:relative;width:100%;max-width:340px;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px;">🔍</span>
            <input
              type="text"
              id="aiPulseSearchInput"
              placeholder="${isNews ? 'Search live news, papers, videos, authors...' : 'Search spaces, models, tags, authors...'}"
              value="${escapeHtml(isNews ? newsQuery : appsQuery)}"
              style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px 8px 32px;color:var(--text);font-size:13px;outline:none;"
              oninput="window.onAiSearchInput(this.value)"
            />
          </div>
        </div>

        <!-- ACTIVE CORNER CONTENT -->
        ${isNews ? renderNewsCorner() : renderAppsCorner()}

        <!-- VIDEO MODAL (IF ACTIVE) -->
        ${renderVideoModal()}

      </div>
    `;
  }

  // VIDEO MODAL
  function renderVideoModal() {
    if (!activeVideo) return '';
    return `
      <div id="aiVideoModalOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target.id==='aiVideoModalOverlay') window.closeAiVideoModal();">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);max-width:900px;width:100%;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);display:flex;flex-direction:column;">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface2);">
            <div style="display:flex;align-items:center;gap:8px;max-width:80%;">
              <span style="color:#ef4444;font-size:18px;">▶</span>
              <h2 style="font-size:15px;font-weight:700;color:var(--text);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${escapeHtml(activeVideo.title)}
              </h2>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <a href="https://www.youtube.com/watch?v=${escapeHtml(activeVideo.videoId)}" target="_blank" rel="noopener noreferrer" class="btn-sm" style="text-decoration:none;font-size:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:4px;display:flex;align-items:center;gap:4px;">
                <span>Open on YouTube</span> <span>↗</span>
              </a>
              <button onclick="window.closeAiVideoModal()" style="background:transparent;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;padding:4px 8px;">✕</button>
            </div>
          </div>
          <div style="position:relative;width:100%;padding-top:56.25%;background:#000;">
            <iframe
              src="https://www.youtube-nocookie.com/embed/${escapeHtml(activeVideo.videoId)}?autoplay=1"
              style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>
          <div style="padding:12px 18px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted);">
            <div>Channel: <strong>${escapeHtml(activeVideo.author || 'AI Channel')}</strong></div>
            <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:4px;cursor:pointer;" onclick="window.closeAiVideoModal()">
              Close Player
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // CORNER 1: NEWS CORNER
  function renderNewsCorner() {
    const mediaOptions = [
      { id: 'all', label: 'All Formats', icon: '🌐' },
      { id: 'video', label: 'Videos & Demos', icon: '🎥' },
      { id: 'photo', label: 'Photos & Illustrated', icon: '📸' },
      { id: 'paper', label: 'Research Papers', icon: '📄' },
      { id: 'article', label: 'Live News Articles', icon: '📰' }
    ];

    const categories = [
      { id: 'all', label: 'All Topics', icon: '⚡' },
      { id: 'llm', label: 'Frontier LLMs', icon: '🧠' },
      { id: 'code', label: 'Coding & Dev', icon: '💻' },
      { id: 'vision', label: 'Vision & Diffusion', icon: '🎨' },
      { id: 'audio', label: 'Voice & Audio', icon: '🎙️' },
      { id: 'robotics', label: 'Robotics', icon: '🤖' },
      { id: 'research', label: 'Research', icon: '🔬' }
    ];

    const sources = [
      { id: 'all', label: 'All Sources (100% Live)' },
      { id: 'verge', label: '📸 The Verge AI (Photos & News)' },
      { id: 'arstechnica', label: '📸 Ars Technica Lab' },
      { id: 'mit', label: '🏛️ MIT Technology Review' },
      { id: 'youtube', label: '🎥 YouTube AI (Wes Roth / Two Minute Papers)' },
      { id: 'arxiv', label: '📄 arXiv cs.AI (Academic Papers & PDFs)' },
      { id: 'googlenews', label: '🌐 Google News (Global Coverage)' },
      { id: 'hn', label: '▲ Hacker News AI' }
    ];

    let contentHtml = '';

    if (newsLoading && newsArticles.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:80px 20px;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:36px;animation:spin 1s linear infinite;">🔄</div>
          <div style="font-size:16px;font-weight:700;color:var(--text);">Ingesting Live AI Feeds...</div>
          <div style="font-size:13px;max-width:440px;line-height:1.5;">Querying live RSS & APIs from The Verge, Ars Technica, MIT Technology Review, YouTube AI channels, arXiv research papers, Google News, and Hacker News.</div>
        </div>
      `;
    } else if (newsArticles.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:70px 20px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
          <div style="font-size:38px;margin-bottom:8px;">🔍</div>
          <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;">No live items match your filter criteria</div>
          <div style="font-size:13px;margin-bottom:14px;">Try clearing search keywords or switching media & category filters.</div>
          <button class="btn-sm primary" onclick="window.resetNewsFilters()">Reset Filters</button>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:18px;">
          ${newsArticles.map((item, idx) => {
            const isVideo = item.mediaType === 'video';
            const isPhoto = item.mediaType === 'photo' || (!isVideo && item.mediaUrl);
            const isPaper = item.mediaType === 'paper' || item.pdfUrl;

            let badgeBg = 'rgba(124,106,247,0.12)';
            let badgeBorder = 'rgba(124,106,247,0.3)';
            let badgeColor = 'var(--accent)';
            let badgeIcon = '📰';

            if (isVideo) {
              badgeBg = 'rgba(239,68,68,0.14)';
              badgeBorder = 'rgba(239,68,68,0.35)';
              badgeColor = '#ef4444';
              badgeIcon = '🎥 Video';
            } else if (isPaper) {
              badgeBg = 'rgba(168,85,247,0.14)';
              badgeBorder = 'rgba(168,85,247,0.35)';
              badgeColor = '#c084fc';
              badgeIcon = '📄 arXiv Paper';
            } else if (item.sourceType === 'verge') {
              badgeBg = 'rgba(236,72,153,0.14)';
              badgeBorder = 'rgba(236,72,153,0.35)';
              badgeColor = '#ec4899';
              badgeIcon = '📸 The Verge';
            } else if (item.sourceType === 'arstechnica') {
              badgeBg = 'rgba(249,115,22,0.14)';
              badgeBorder = 'rgba(249,115,22,0.35)';
              badgeColor = '#fb923c';
              badgeIcon = '📸 Ars Technica';
            } else if (item.sourceType === 'mit') {
              badgeBg = 'rgba(56,189,248,0.14)';
              badgeBorder = 'rgba(56,189,248,0.35)';
              badgeColor = '#38bdf8';
              badgeIcon = '🏛️ MIT Tech Review';
            } else if (item.sourceType === 'hn') {
              badgeBg = 'rgba(249,115,22,0.12)';
              badgeBorder = 'rgba(249,115,22,0.35)';
              badgeColor = '#fb923c';
              badgeIcon = '▲ Hacker News';
            } else if (item.sourceType === 'googlenews') {
              badgeBg = 'rgba(34,197,94,0.12)';
              badgeBorder = 'rgba(34,197,94,0.35)';
              badgeColor = 'var(--green)';
              badgeIcon = '🌐 Press';
            }

            return `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 6px rgba(0,0,0,0.06);transition:border-color 0.2s, transform 0.2s;"
                   onmouseover="this.style.borderColor='var(--accent)';"
                   onmouseout="this.style.borderColor='var(--border)';">

                <!-- MEDIA HEADER: PHOTO OR VIDEO THUMBNAIL -->
                ${item.mediaUrl ? `
                  <div style="position:relative;width:100%;height:190px;background:#111;overflow:hidden;cursor:${isVideo ? 'pointer' : 'default'};"
                       ${isVideo ? `onclick="window.playAiVideo('${escapeHtml(item.videoId)}', '${escapeHtml(item.title).replace(/'/g, "\\'")}', '${escapeHtml(item.author || item.source).replace(/'/g, "\\'")}')"` : ''}>
                    <img
                      src="${escapeHtml(item.mediaUrl)}"
                      alt="${escapeHtml(item.title)}"
                      loading="lazy"
                      style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s ease;"
                      onmouseover="this.style.transform='scale(1.04)';"
                      onmouseout="this.style.transform='scale(1)';"
                      onerror="this.parentElement.style.display='none';"
                    />

                    ${isVideo ? `
                      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;transition:background 0.2s;"
                           onmouseover="this.style.background='rgba(0,0,0,0.2)';"
                           onmouseout="this.style.background='rgba(0,0,0,0.35)';">
                        <div style="width:48px;height:48px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;box-shadow:0 4px 14px rgba(239,68,68,0.5);padding-left:3px;">
                          ▶
                        </div>
                      </div>
                      <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.75);color:#fff;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;letter-spacing:0.04em;">
                        YOUTUBE AI
                      </div>
                    ` : `
                      <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.7);color:#fff;font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:4px;">
                        📸 Illustrated
                      </div>
                    `}
                  </div>
                ` : ''}

                <div style="padding:18px;display:flex;flex-direction:column;gap:12px;flex:1;">
                  <!-- TOP META -->
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:6px;background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">
                      <span>${badgeIcon}</span>
                      <span>${escapeHtml(item.source)}</span>
                    </div>

                    <div style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px;" title="Exact Published Date: ${escapeHtml(formatExactDate(item.publishedAt))}">
                      <span>🕒</span>
                      <strong>${timeAgo(item.publishedAt)}</strong>
                    </div>
                  </div>

                  <!-- EXACT DATE DISPLAY (STRICT USER REQUIREMENT) -->
                  <div style="font-size:11px;color:var(--muted);background:var(--surface2);padding:3px 8px;border-radius:4px;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);width:fit-content;">
                    <span>📅</span>
                    <span>${escapeHtml(formatExactDate(item.publishedAt))}</span>
                  </div>

                  <!-- TITLE -->
                  <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;">
                    <h2 style="font-size:15px;font-weight:700;color:var(--text);line-height:1.4;margin:0;">
                      ${escapeHtml(item.title)}
                    </h2>
                  </a>

                  <!-- SUMMARY / ABSTRACT -->
                  <p style="font-size:12.5px;color:var(--muted);line-height:1.55;margin:0;">
                    ${escapeHtml(item.summary)}
                  </p>

                  <!-- METADATA CHIPS (AUTHOR, SCORE, PDF LINK) -->
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:auto;padding-top:4px;">
                    ${item.author ? `
                      <span style="font-size:11px;color:var(--muted);background:var(--surface2);padding:2px 7px;border-radius:4px;border:1px solid var(--border);">
                        ✍️ ${escapeHtml(item.author)}
                      </span>
                    ` : ''}

                    ${item.score !== null && item.score !== undefined ? `
                      <span style="font-size:11px;color:#fb923c;background:rgba(249,115,22,0.1);padding:2px 7px;border-radius:4px;font-weight:700;">
                        ▲ ${item.score} pts
                      </span>
                    ` : ''}

                    ${item.commentsCount !== null && item.commentsCount !== undefined ? `
                      <span style="font-size:11px;color:var(--muted);background:var(--surface2);padding:2px 7px;border-radius:4px;">
                        💬 ${item.commentsCount}
                      </span>
                    ` : ''}

                    ${item.pdfUrl ? `
                      <a href="${escapeHtml(item.pdfUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;font-size:11px;color:#c084fc;background:rgba(168,85,247,0.14);border:1px solid rgba(168,85,247,0.3);padding:2px 7px;border-radius:4px;font-weight:700;display:inline-flex;align-items:center;gap:3px;">
                        <span>📄 Read PDF</span>
                      </a>
                    ` : ''}

                    ${isVideo ? `
                      <span style="font-size:11px;color:#ef4444;background:rgba(239,68,68,0.12);padding:2px 7px;border-radius:4px;font-weight:700;">
                        🎥 Video Stream
                      </span>
                    ` : ''}
                  </div>
                </div>

                <!-- ACTION FOOTER -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-top:1px solid var(--border);background:var(--surface2);gap:8px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    ${isVideo ? `
                      <button class="btn-sm" style="background:#ef4444;border:none;color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;gap:4px;"
                              onclick="window.playAiVideo('${escapeHtml(item.videoId)}', '${escapeHtml(item.title).replace(/'/g, "\\'")}', '${escapeHtml(item.author || item.source).replace(/'/g, "\\'")}')">
                        <span>▶ Play Video</span>
                      </button>
                    ` : (item.pdfUrl ? `
                      <a href="${escapeHtml(item.pdfUrl)}" target="_blank" rel="noopener noreferrer" class="btn-sm" style="text-decoration:none;background:rgba(168,85,247,0.16);border:1px solid rgba(168,85,247,0.35);color:#c084fc;font-size:12px;font-weight:700;padding:6px 12px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:4px;">
                        <span>View arXiv PDF</span> <span>↗</span>
                      </a>
                    ` : `
                      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn-sm" style="text-decoration:none;background:rgba(124,106,247,0.14);border:1px solid rgba(124,106,247,0.3);color:var(--accent);font-size:12px;font-weight:700;padding:6px 12px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:4px;">
                        <span>Read Source</span> <span>↗</span>
                      </a>
                    `)}
                  </div>

                  <div style="display:flex;align-items:center;gap:6px;">
                    <button class="btn-sm" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 10px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.saveArticleIdx(${idx})" title="Bookmark to Vault Notes">
                      <span>🔖 Save</span>
                    </button>
                    <button class="btn-sm" style="background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 8px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.copyNewsUrl('${escapeHtml(item.url)}')" title="Copy URL">
                      <span>📋</span>
                    </button>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    return `
      <div style="display:flex;flex-direction:column;gap:14px;">

        <!-- FILTER TOOLBAR -->
        <div style="display:flex;flex-direction:column;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;">

          <!-- ROW 1: MEDIA FORMAT SELECTOR -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;border-bottom:1px solid var(--border);padding-bottom:10px;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="font-size:12px;color:var(--muted);font-weight:700;margin-right:2px;text-transform:uppercase;letter-spacing:0.04em;">Media:</span>
              ${mediaOptions.map(m => `
                <button
                  class="filter-pill ${newsMedia === m.id ? 'active' : ''}"
                  style="font-size:12px;padding:5px 12px;cursor:pointer;font-weight:600;"
                  onclick="window.setNewsMedia('${m.id}')">
                  ${m.icon} ${m.label}
                </button>
              `).join('')}
            </div>

            <!-- SOURCE DROPDOWN -->
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12px;color:var(--muted);font-weight:600;">Feed Source:</span>
              <select
                style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:5px 10px;border-radius:var(--radius-sm);outline:none;cursor:pointer;"
                onchange="window.setNewsSource(this.value)">
                ${sources.map(s => `
                  <option value="${s.id}" ${newsSource === s.id ? 'selected' : ''}>${s.label}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- ROW 2: CATEGORY TOPICS -->
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted);font-weight:700;margin-right:2px;text-transform:uppercase;letter-spacing:0.04em;">Topics:</span>
            ${categories.map(c => `
              <button
                class="filter-pill ${newsCategory === c.id ? 'active' : ''}"
                style="font-size:12px;padding:4px 10px;cursor:pointer;"
                onclick="window.setNewsCategory('${c.id}')">
                ${c.icon} ${c.label}
              </button>
            `).join('')}
          </div>

        </div>

        <!-- NEWS FEED GRID -->
        ${contentHtml}

      </div>
    `;
  }

  // CORNER 2: TRENDING AI APPS & MODELS CORNER (HUGGING FACE HUB LIVE API)
  function renderAppsCorner() {
    const typeOptions = [
      { id: 'all', label: 'All Trending Apps & Models', icon: '🔥' },
      { id: 'space', label: 'Interactive AI Spaces (Web Apps)', icon: '🚀' },
      { id: 'model', label: 'Foundation Models & Weights', icon: '🧠' }
    ];

    const categories = [
      { id: 'all', label: 'All Domains', icon: '⚡' },
      { id: 'llm', label: 'Language & LLMs', icon: '💬' },
      { id: 'vision', label: 'Vision & Diffusion', icon: '🎨' },
      { id: 'audio', label: 'Voice & Music', icon: '🎙️' },
      { id: 'code', label: 'Code & Dev', icon: '💻' },
      { id: 'robotics', label: 'Robotics', icon: '🤖' },
      { id: 'research', label: 'Research', icon: '🔬' }
    ];

    let contentHtml = '';

    if (appsLoading && appsList.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:80px 20px;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:36px;animation:spin 1s linear infinite;">🔄</div>
          <div style="font-size:16px;font-weight:700;color:var(--text);">Fetching Live Trending AI Apps & Models...</div>
          <div style="font-size:13px;max-width:380px;">Querying Hugging Face Spaces & Models Hub API ranked by real-time community trending scores and star counts.</div>
        </div>
      `;
    } else if (appsList.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:70px 20px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
          <div style="font-size:38px;margin-bottom:8px;">🔍</div>
          <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;">No apps or models match your filters</div>
          <div style="font-size:13px;margin-bottom:14px;">Try selecting "All Domains" or clearing search terms.</div>
          <button class="btn-sm primary" onclick="window.resetAppsFilters()">Reset Filters</button>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:18px;">
          ${appsList.map((app, idx) => {
            const isSpace = app.type === 'space';

            return `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;box-shadow:0 2px 6px rgba(0,0,0,0.06);transition:border-color 0.2s, transform 0.2s;"
                   onmouseover="this.style.borderColor='var(--accent)';"
                   onmouseout="this.style.borderColor='var(--border)';">

                <div>
                  <!-- TOP META -->
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <div style="font-size:26px;background:var(--surface2);width:46px;height:46px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);flex-shrink:0;">
                        ${app.icon || (isSpace ? '🚀' : '🧠')}
                      </div>
                      <div>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                          <h2 style="font-size:16px;font-weight:800;color:var(--text);margin:0;line-height:1.2;">
                            ${escapeHtml(app.name)}
                          </h2>
                          <span style="font-size:10.5px;color:${isSpace ? 'var(--accent)' : 'var(--green)'};font-weight:700;background:${isSpace ? 'rgba(124,106,247,0.12)' : 'rgba(34,197,94,0.12)'};padding:2px 7px;border-radius:10px;border:1px solid ${isSpace ? 'rgba(124,106,247,0.25)' : 'rgba(34,197,94,0.25)'};">
                            ${isSpace ? 'Interactive Space' : 'Foundation Model'}
                          </span>
                        </div>
                        <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">
                          by <strong>${escapeHtml(app.developer)}</strong>
                        </div>
                      </div>
                    </div>

                    <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
                      <span style="background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;font-size:11px;font-weight:800;padding:2px 8px;border-radius:4px;">
                        🔥 ${Math.round(app.trendingScore || 0)} score
                      </span>
                      <span style="font-size:11px;color:var(--muted);">
                        ❤️ ${Number(app.likes || 0).toLocaleString()} likes
                      </span>
                    </div>
                  </div>

                  <!-- TAGLINE / CAPABILITIES -->
                  <p style="font-size:13px;color:var(--text);line-height:1.5;margin:0;margin-bottom:12px;">
                    ${escapeHtml(app.tagline)}
                  </p>

                  <!-- METRICS & TAGS -->
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
                    <span style="font-size:11px;color:var(--muted);background:var(--surface2);padding:2px 8px;border-radius:4px;border:1px solid var(--border);">
                      ⚡ SDK: ${escapeHtml((app.sdk || 'open').toUpperCase())}
                    </span>
                    ${app.downloads ? `
                      <span style="font-size:11px;color:var(--green);background:rgba(34,197,94,0.1);padding:2px 8px;border-radius:4px;font-weight:600;">
                        ⬇️ ${Number(app.downloads).toLocaleString()} dl
                      </span>
                    ` : ''}
                    <span style="font-size:11px;color:var(--muted);background:var(--surface2);padding:2px 8px;border-radius:4px;">
                      Domain: <strong>${escapeHtml((app.category || 'general').toUpperCase())}</strong>
                    </span>
                  </div>

                  <!-- EXACT CREATION TIMESTAMP (REAL API) -->
                  <div style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px;margin-top:6px;">
                    <span>🕒 Added:</span>
                    <span>${escapeHtml(formatExactDate(app.createdAt))}</span>
                  </div>
                </div>

                <!-- ACTION FOOTER -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--border);gap:8px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <a href="${escapeHtml(app.url)}" target="_blank" rel="noopener noreferrer" class="btn-sm primary" style="text-decoration:none;font-size:12.5px;font-weight:700;padding:7px 14px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:6px;">
                      <span>${isSpace ? 'Launch Space' : 'View Model'}</span>
                      <span>↗</span>
                    </a>

                    ${app.directAppUrl ? `
                      <a href="${escapeHtml(app.directAppUrl)}" target="_blank" rel="noopener noreferrer" class="btn-sm" style="text-decoration:none;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;font-weight:600;padding:6px 10px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:4px;" title="Full Screen App Direct">
                        <span>Direct Fullscreen</span> <span>↗</span>
                      </a>
                    ` : ''}
                  </div>

                  <div style="display:flex;align-items:center;gap:6px;">
                    <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 10px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.saveAppIdx(${idx})" title="Bookmark to Vault">
                      <span>🔖 Save</span>
                    </button>
                    <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 8px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.copyNewsUrl('${escapeHtml(app.url)}', '${escapeHtml(app.name)} link')" title="Copy Hugging Face Link">
                      <span>📋</span>
                    </button>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    return `
      <div style="display:flex;flex-direction:column;gap:14px;">

        <!-- FILTER TOOLBAR -->
        <div style="display:flex;flex-direction:column;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;">

          <!-- TYPE SELECTOR -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:10px;">
            <span style="font-size:12px;color:var(--muted);font-weight:700;margin-right:2px;text-transform:uppercase;letter-spacing:0.04em;">Type:</span>
            ${typeOptions.map(t => `
              <button
                class="filter-pill ${appsType === t.id ? 'active' : ''}"
                style="font-size:12px;padding:5px 12px;cursor:pointer;font-weight:600;"
                onclick="window.setAppsType('${t.id}')">
                ${t.icon} ${t.label}
              </button>
            `).join('')}
          </div>

          <!-- DOMAIN CATEGORIES -->
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted);font-weight:700;margin-right:2px;text-transform:uppercase;letter-spacing:0.04em;">Domain:</span>
            ${categories.map(c => `
              <button
                class="filter-pill ${appsCategory === c.id ? 'active' : ''}"
                style="font-size:12px;padding:4px 10px;cursor:pointer;"
                onclick="window.setAppsCategory('${c.id}')">
                ${c.icon} ${c.label}
              </button>
            `).join('')}
          </div>

        </div>

        <!-- APPS GRID -->
        ${contentHtml}

      </div>
    `;
  }

  // GLOBAL WINDOW ACTIONS
  window.renderAiNewsAppsTab = function(defaultSub = 'news') {
    if (defaultSub === 'apps' || defaultSub === 'trendingapps') {
      activeTab = 'apps';
    } else {
      activeTab = 'news';
    }

    render();

    if (activeTab === 'news' && newsArticles.length === 0) {
      loadNews();
    } else if (activeTab === 'apps' && appsList.length === 0) {
      loadApps();
    }
  };

  window.switchAiCorner = function(tab) {
    activeTab = tab;
    render();
    if (activeTab === 'news' && newsArticles.length === 0) loadNews();
    if (activeTab === 'apps' && appsList.length === 0) loadApps();
  };

  window.setNewsCategory = function(cat) {
    newsCategory = cat;
    loadNews();
  };

  window.setNewsMedia = function(media) {
    newsMedia = media;
    loadNews();
  };

  window.setNewsSource = function(src) {
    newsSource = src;
    loadNews();
  };

  window.refreshAiNews = function() {
    loadNews(true);
  };

  window.resetNewsFilters = function() {
    newsCategory = 'all';
    newsSource = 'all';
    newsMedia = 'all';
    newsQuery = '';
    const input = document.getElementById('aiPulseSearchInput');
    if (input) input.value = '';
    loadNews();
  };

  window.setAppsCategory = function(cat) {
    appsCategory = cat;
    loadApps();
  };

  window.setAppsType = function(type) {
    appsType = type;
    loadApps();
  };

  window.refreshAiApps = function() {
    loadApps();
  };

  window.resetAppsFilters = function() {
    appsCategory = 'all';
    appsType = 'all';
    appsQuery = '';
    const input = document.getElementById('aiPulseSearchInput');
    if (input) input.value = '';
    loadApps();
  };

  let searchDebounceTimer = null;
  window.onAiSearchInput = function(val) {
    if (activeTab === 'news') {
      newsQuery = val.trim();
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => loadNews(), 300);
    } else {
      appsQuery = val.trim();
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => loadApps(), 300);
    }
  };

  window.playAiVideo = function(videoId, title, author) {
    activeVideo = { videoId, title, author };
    render();
  };

  window.closeAiVideoModal = function() {
    activeVideo = null;
    render();
  };

  window.saveArticleIdx = function(idx) {
    if (newsArticles[idx]) {
      bookmarkArticle(newsArticles[idx]);
    }
  };

  window.saveAppIdx = function(idx) {
    if (appsList[idx]) {
      bookmarkApp(appsList[idx]);
    }
  };

  window.copyNewsUrl = function(url, label = 'link') {
    copyLink(url, label);
  };

})();
