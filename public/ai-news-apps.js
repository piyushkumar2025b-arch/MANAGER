// ============================================================================
// 🧠 AI PULSE: LIVE AI NEWS CORNER & BEST TRENDING AI APPS (REAL SOURCES)
// ============================================================================

(function() {
  let activeTab = 'news'; // 'news' | 'apps'
  let newsCategory = 'all';
  let newsSource = 'all';
  let newsQuery = '';
  let newsArticles = [];
  let newsLoading = false;
  let newsLastRefreshed = null;

  let appsCategory = 'all';
  let appsPricing = 'all';
  let appsQuery = '';
  let appsList = [];
  let appsLoading = false;

  // Relative time helper
  function timeAgo(isoDate) {
    if (!isoDate) return 'Recently';
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (isNaN(seconds) || seconds < 0) return 'Just now';
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  // Load News from Backend
  async function loadNews(force = false) {
    if (newsLoading) return;
    newsLoading = true;
    render();

    try {
      const queryParams = new URLSearchParams();
      if (newsCategory !== 'all') queryParams.set('category', newsCategory);
      if (newsSource !== 'all') queryParams.set('source', newsSource);
      if (newsQuery) queryParams.set('q', newsQuery);
      if (force) queryParams.set('_t', Date.now());

      const res = await api('GET', `/ai/news?${queryParams.toString()}`);
      if (res && res.success && Array.isArray(res.articles)) {
        newsArticles = res.articles;
        newsLastRefreshed = new Date();
      } else {
        toast('Could not fetch AI news feed');
      }
    } catch (err) {
      console.error('Error fetching AI news:', err);
      toast('Network error loading AI news');
    } finally {
      newsLoading = false;
      render();
    }
  }

  // Load Trending Apps from Backend
  async function loadApps() {
    if (appsLoading) return;
    appsLoading = true;
    render();

    try {
      const queryParams = new URLSearchParams();
      if (appsCategory !== 'all') queryParams.set('category', appsCategory);
      if (appsPricing !== 'all') queryParams.set('pricing', appsPricing);
      if (appsQuery) queryParams.set('q', appsQuery);

      const res = await api('GET', `/ai/trending-apps?${queryParams.toString()}`);
      if (res && res.success && Array.isArray(res.apps)) {
        appsList = res.apps;
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
      const title = `AI News: ${article.title}`;
      const notes = `[Source: ${article.source} | Published: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'N/A'}]\n\nLink: ${article.url}\n\nSummary:\n${article.fullSummary || article.summary}`;
      await api('POST', '/passwords', {
        title: title.slice(0, 80),
        website: article.url,
        notes: notes,
        item_type: 'note'
      });
      toast(`✓ Saved to Vault Notes: "${article.title.slice(0, 35)}..."`);
    } catch (err) {
      toast('Failed to save to Vault: ' + err.message);
    }
  }

  // Bookmark App to Vault Notes
  async function bookmarkApp(app) {
    try {
      const title = `AI App: ${app.name}`;
      const notes = `Category: ${app.category.toUpperCase()} | Pricing: ${app.pricing.toUpperCase()} | Rating: ${app.trendingScore}/10\nDeveloper: ${app.developer}\nURL: ${app.url}\n\nTagline:\n${app.tagline}\n\nKey Features:\n• ${app.keyFeatures.join('\n• ')}`;
      await api('POST', '/passwords', {
        title: title.slice(0, 80),
        website: app.url,
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
      <div style="display:flex;flex-direction:column;gap:18px;max-width:1400px;margin:0 auto;width:100%;">

        <!-- HEADER BANNER -->
        <div style="background:linear-gradient(135deg, rgba(124,106,247,0.14) 0%, rgba(56,189,248,0.1) 100%);border:1px solid rgba(124,106,247,0.25);border-radius:var(--radius);padding:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <span style="font-size:26px;">🧠</span>
              <h1 style="font-size:22px;font-weight:800;color:var(--text);margin:0;letter-spacing:-0.02em;">
                AI Pulse: News Corner & Trending Apps
              </h1>
              <span style="background:rgba(34,197,94,0.18);border:1px solid rgba(34,197,94,0.4);color:var(--green);font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.04em;">
                ● Live Feeds
              </span>
            </div>
            <p style="font-size:13px;color:var(--muted);margin:0;max-width:760px;line-height:1.5;">
              Real-time frontier intelligence from leading research labs (Anthropic, DeepMind, OpenAI, DeepSeek), live community stories from Hacker News, peer-reviewed arXiv cs.AI papers, and the curated directory of the world's best trending AI platforms.
            </p>
          </div>

          <!-- TOP ACTIONS -->
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${isNews ? `
              <button id="aiNewsRefreshBtn" class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;" onclick="window.refreshAiNews()">
                <span style="display:inline-block;${newsLoading ? 'animation:spin 1s linear infinite;' : ''}">🔄</span>
                ${newsLoading ? 'Refreshing...' : 'Refresh Feeds'}
              </button>
            ` : `
              <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;" onclick="window.refreshAiApps()">
                <span>🔄</span> Refresh Apps
              </button>
            `}
            <button class="btn-sm" style="background:rgba(124,106,247,0.15);border:1px solid var(--accent);color:var(--accent);display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;" onclick="switchTab('cards')">
              <span>🔖</span> View Saved Notes
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
              <span>⚡</span> AI News Corner
              <span style="background:${isNews ? 'rgba(255,255,255,0.25)' : 'var(--surface2)'};color:${isNews ? '#fff' : 'var(--text)'};font-size:11px;padding:1px 6px;border-radius:10px;">
                ${newsArticles.length ? newsArticles.length : 'Live'}
              </span>
            </button>
            <button
              id="aiSegmentApps"
              style="padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px;transition:all 0.15s ease;${!isNews ? 'background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(124,106,247,0.3);' : 'background:transparent;color:var(--muted);'}"
              onclick="window.switchAiCorner('apps')">
              <span>🔥</span> Best Trending AI Apps
              <span style="background:${!isNews ? 'rgba(255,255,255,0.25)' : 'var(--surface2)'};color:${!isNews ? '#fff' : 'var(--text)'};font-size:11px;padding:1px 6px;border-radius:10px;">
                ${appsList.length ? appsList.length : 'Top 24'}
              </span>
            </button>
          </div>

          <!-- SEARCH FILTER INPUT -->
          <div style="position:relative;width:100%;max-width:320px;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px;">🔍</span>
            <input
              type="text"
              id="aiPulseSearchInput"
              placeholder="${isNews ? 'Search AI news, topics, authors...' : 'Search AI apps, features, developers...'}"
              value="${escapeHtml(isNews ? newsQuery : appsQuery)}"
              style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px 8px 32px;color:var(--text);font-size:13px;outline:none;"
              oninput="window.onAiSearchInput(this.value)"
            />
          </div>
        </div>

        <!-- ACTIVE CORNER CONTENT -->
        ${isNews ? renderNewsCorner() : renderAppsCorner()}

      </div>
    `;
  }

  // CORNER 1: NEWS CORNER
  function renderNewsCorner() {
    const categories = [
      { id: 'all', label: 'All Topics', icon: '🌐' },
      { id: 'llm', label: 'Frontier LLMs', icon: '🧠' },
      { id: 'code', label: 'Coding AI', icon: '💻' },
      { id: 'research', label: 'Research Papers', icon: '🔬' },
      { id: 'vision', label: 'Vision & Diffusion', icon: '🎨' },
      { id: 'robotics', label: 'Robotics & Hardware', icon: '🤖' }
    ];

    const sources = [
      { id: 'all', label: 'All Sources' },
      { id: 'official', label: '🏛️ Official Labs' },
      { id: 'hn', label: '📰 Hacker News AI' },
      { id: 'arxiv', label: '📜 arXiv cs.AI' }
    ];

    let contentHtml = '';

    if (newsLoading && newsArticles.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:80px 20px;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:36px;animation:spin 1s linear infinite;">🔄</div>
          <div style="font-size:15px;font-weight:600;color:var(--text);">Fetching Live AI Feeds...</div>
          <div style="font-size:13px;max-width:340px;">Pulling real-time updates from Hacker News, arXiv research archives, and frontier lab announcements.</div>
        </div>
      `;
    } else if (newsArticles.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:70px 20px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
          <div style="font-size:38px;margin-bottom:8px;">🔍</div>
          <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;">No articles match your criteria</div>
          <div style="font-size:13px;margin-bottom:14px;">Try clearing search keywords or switching category filters.</div>
          <button class="btn-sm primary" onclick="window.resetNewsFilters()">Reset Filters</button>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:16px;">
          ${newsArticles.map((item, idx) => {
            let badgeBg = 'rgba(124,106,247,0.12)';
            let badgeBorder = 'rgba(124,106,247,0.3)';
            let badgeColor = 'var(--accent)';
            let badgeIcon = '📰';

            if (item.sourceType === 'official') {
              badgeBg = 'rgba(56,189,248,0.12)';
              badgeBorder = 'rgba(56,189,248,0.35)';
              badgeColor = '#38bdf8';
              badgeIcon = '🏛️';
            } else if (item.sourceType === 'arxiv') {
              badgeBg = 'rgba(168,85,247,0.12)';
              badgeBorder = 'rgba(168,85,247,0.35)';
              badgeColor = '#c084fc';
              badgeIcon = '📜';
            } else if (item.sourceType === 'hn') {
              badgeBg = 'rgba(249,115,22,0.12)';
              badgeBorder = 'rgba(249,115,22,0.35)';
              badgeColor = '#fb923c';
              badgeIcon = '▲';
            }

            return `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);transition:border-color 0.2s, transform 0.2s;"
                   onmouseover="this.style.borderColor='var(--accent)';"
                   onmouseout="this.style.borderColor='var(--border)';">

                <div>
                  <!-- TOP META -->
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
                    <div style="display:flex;align-items:center;gap:6px;background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">
                      <span>${badgeIcon}</span>
                      <span>${escapeHtml(item.source)}</span>
                    </div>

                    <div style="font-size:11.5px;color:var(--muted);display:flex;align-items:center;gap:4px;">
                      <span>🕒</span>
                      <span>${timeAgo(item.publishedAt)}</span>
                    </div>
                  </div>

                  <!-- TITLE -->
                  <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block;margin-bottom:8px;">
                    <h2 style="font-size:15px;font-weight:700;color:var(--text);line-height:1.4;margin:0;">
                      ${escapeHtml(item.title)}
                    </h2>
                  </a>

                  <!-- SUMMARY -->
                  <p style="font-size:12.5px;color:var(--muted);line-height:1.55;margin:0;margin-bottom:12px;">
                    ${escapeHtml(item.summary)}
                  </p>

                  <!-- TAGS / STATS -->
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                    ${item.author ? `
                      <span style="font-size:11px;color:var(--muted);background:var(--surface2);padding:2px 6px;border-radius:4px;">
                        ✍️ ${escapeHtml(item.author)}
                      </span>
                    ` : ''}

                    ${item.score !== null && item.score !== undefined ? `
                      <span style="font-size:11px;color:#fb923c;background:rgba(249,115,22,0.1);padding:2px 6px;border-radius:4px;font-weight:600;">
                        ▲ ${item.score} pts
                      </span>
                    ` : ''}

                    ${item.commentsCount !== null && item.commentsCount !== undefined ? `
                      <span style="font-size:11px;color:var(--muted);background:var(--surface2);padding:2px 6px;border-radius:4px;">
                        💬 ${item.commentsCount} comments
                      </span>
                    ` : ''}

                    ${item.pdfUrl ? `
                      <a href="${escapeHtml(item.pdfUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;font-size:11px;color:#c084fc;background:rgba(168,85,247,0.12);padding:2px 6px;border-radius:4px;font-weight:600;">
                        📄 PDF Paper
                      </a>
                    ` : ''}
                  </div>
                </div>

                <!-- ACTION FOOTER -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border);gap:8px;">
                  <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn-sm" style="text-decoration:none;background:rgba(124,106,247,0.12);border:1px solid rgba(124,106,247,0.3);color:var(--accent);font-size:12px;font-weight:600;padding:6px 12px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:4px;">
                    <span>Read Source</span>
                    <span>↗</span>
                  </a>

                  <div style="display:flex;align-items:center;gap:6px;">
                    <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 10px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.saveArticleIdx(${idx})" title="Bookmark to Vault Notes">
                      <span>🔖 Save</span>
                    </button>
                    <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 8px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.copyNewsUrl('${escapeHtml(item.url)}')" title="Copy URL">
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
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;">
          <!-- CATEGORY PILLS -->
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted);font-weight:600;margin-right:2px;">Topics:</span>
            ${categories.map(c => `
              <button
                class="filter-pill ${newsCategory === c.id ? 'active' : ''}"
                style="font-size:12px;padding:4px 10px;cursor:pointer;"
                onclick="window.setNewsCategory('${c.id}')">
                ${c.icon} ${c.label}
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

        <!-- NEWS FEED GRID -->
        ${contentHtml}

      </div>
    `;
  }

  // CORNER 2: TRENDING AI APPS CORNER
  function renderAppsCorner() {
    const categories = [
      { id: 'all', label: 'All Apps', icon: '🔥' },
      { id: 'code', label: 'Coding & Dev', icon: '💻' },
      { id: 'llm', label: 'Frontier LLMs', icon: '🧠' },
      { id: 'image', label: 'Image & Design', icon: '🎨' },
      { id: 'video', label: 'Video & VFX', icon: '🎬' },
      { id: 'audio', label: 'Voice & Music', icon: '🎙️' },
      { id: 'productivity', label: 'Agents & Research', icon: '📓' }
    ];

    const pricingOptions = [
      { id: 'all', label: 'All Pricing' },
      { id: 'freemium', label: 'Freemium' },
      { id: 'free', label: '100% Free' },
      { id: 'open', label: 'Open Source / Weights' },
      { id: 'paid', label: 'Pro / Paid' }
    ];

    let contentHtml = '';

    if (appsLoading && appsList.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:80px 20px;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:12px;">
          <div style="font-size:36px;animation:spin 1s linear infinite;">🔄</div>
          <div style="font-size:15px;font-weight:600;color:var(--text);">Loading Trending AI Apps...</div>
        </div>
      `;
    } else if (appsList.length === 0) {
      contentHtml = `
        <div style="text-align:center;padding:70px 20px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
          <div style="font-size:38px;margin-bottom:8px;">🔍</div>
          <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;">No apps found matching filters</div>
          <div style="font-size:13px;margin-bottom:14px;">Try selecting "All Apps" or clearing search keywords.</div>
          <button class="btn-sm primary" onclick="window.resetAppsFilters()">Reset Filters</button>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(350px, 1fr));gap:16px;">
          ${appsList.map((app, idx) => {
            let pricingBg = 'rgba(56,189,248,0.12)';
            let pricingColor = '#38bdf8';
            let pricingText = 'Freemium';

            if (app.pricing === 'open') {
              pricingBg = 'rgba(34,197,94,0.12)';
              pricingColor = 'var(--green)';
              pricingText = 'Open Weights';
            } else if (app.pricing === 'free') {
              pricingBg = 'rgba(168,85,247,0.12)';
              pricingColor = '#c084fc';
              pricingText = '100% Free';
            } else if (app.pricing === 'paid') {
              pricingBg = 'rgba(245,158,11,0.12)';
              pricingColor = '#f59e0b';
              pricingText = 'Commercial / Paid';
            }

            return `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;box-shadow:0 1px 4px rgba(0,0,0,0.08);transition:border-color 0.2s, transform 0.2s;"
                   onmouseover="this.style.borderColor='var(--accent)';"
                   onmouseout="this.style.borderColor='var(--border)';">

                <div>
                  <!-- TOP META -->
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div style="font-size:28px;background:var(--surface2);width:46px;height:46px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);">
                        ${app.icon || '⚡'}
                      </div>
                      <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <h2 style="font-size:16px;font-weight:800;color:var(--text);margin:0;">
                            ${escapeHtml(app.name)}
                          </h2>
                          <span style="font-size:10.5px;color:var(--accent);font-weight:700;background:rgba(124,106,247,0.12);padding:1px 6px;border-radius:10px;">
                            #${app.rank}
                          </span>
                        </div>
                        <div style="font-size:11.5px;color:var(--muted);">
                          by ${escapeHtml(app.developer)}
                        </div>
                      </div>
                    </div>

                    <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                      <span style="background:${pricingBg};color:${pricingColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;border:1px solid ${pricingColor}33;">
                        ${pricingText}
                      </span>
                      <span style="font-size:11px;color:#f59e0b;font-weight:700;">
                        ★ ${app.trendingScore} / 10
                      </span>
                    </div>
                  </div>

                  <!-- BADGE -->
                  <div style="margin-bottom:8px;">
                    <span style="background:rgba(124,106,247,0.12);border:1px solid rgba(124,106,247,0.25);color:var(--accent);font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;">
                      ${escapeHtml(app.badge)}
                    </span>
                  </div>

                  <!-- TAGLINE -->
                  <p style="font-size:12.5px;color:var(--text);line-height:1.5;margin:0;margin-bottom:12px;">
                    ${escapeHtml(app.tagline)}
                  </p>

                  <!-- KEY CAPABILITIES -->
                  <div style="display:flex;flex-direction:column;gap:5px;background:var(--surface2);padding:10px;border-radius:var(--radius-sm);border:1px solid var(--border);">
                    <div style="font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Key Capabilities</div>
                    ${app.keyFeatures.map(feat => `
                      <div style="font-size:11.5px;color:var(--muted);display:flex;align-items:center;gap:6px;line-height:1.3;">
                        <span style="color:var(--accent);font-weight:bold;">•</span>
                        <span>${escapeHtml(feat)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- ACTION FOOTER -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--border);gap:8px;">
                  <a href="${escapeHtml(app.url)}" target="_blank" rel="noopener noreferrer" class="btn-sm primary" style="text-decoration:none;font-size:12.5px;font-weight:700;padding:7px 14px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:6px;">
                    <span>Launch App</span>
                    <span>↗</span>
                  </a>

                  <div style="display:flex;align-items:center;gap:6px;">
                    <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 10px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.saveAppIdx(${idx})" title="Bookmark to Vault">
                      <span>🔖 Save</span>
                    </button>
                    <button class="btn-sm" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:6px 8px;border-radius:var(--radius-sm);cursor:pointer;" onclick="window.copyNewsUrl('${escapeHtml(app.url)}', '${escapeHtml(app.name)} link')" title="Copy Official Link">
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
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;">
          <!-- CATEGORY PILLS -->
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--muted);font-weight:600;margin-right:2px;">Category:</span>
            ${categories.map(c => `
              <button
                class="filter-pill ${appsCategory === c.id ? 'active' : ''}"
                style="font-size:12px;padding:4px 10px;cursor:pointer;"
                onclick="window.setAppsCategory('${c.id}')">
                ${c.icon} ${c.label}
              </button>
            `).join('')}
          </div>

          <!-- PRICING FILTER -->
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--muted);font-weight:600;">License / Pricing:</span>
            <select
              style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:12px;padding:5px 10px;border-radius:var(--radius-sm);outline:none;cursor:pointer;"
              onchange="window.setAppsPricing(this.value)">
              ${pricingOptions.map(p => `
                <option value="${p.id}" ${appsPricing === p.id ? 'selected' : ''}>${p.label}</option>
              `).join('')}
            </select>
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
    newsQuery = '';
    const input = document.getElementById('aiPulseSearchInput');
    if (input) input.value = '';
    loadNews();
  };

  window.setAppsCategory = function(cat) {
    appsCategory = cat;
    loadApps();
  };

  window.setAppsPricing = function(pricing) {
    appsPricing = pricing;
    loadApps();
  };

  window.refreshAiApps = function() {
    loadApps();
  };

  window.resetAppsFilters = function() {
    appsCategory = 'all';
    appsPricing = 'all';
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
