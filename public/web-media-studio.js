// ============================================================================
// WEB MEDIA STUDIO: Web Videos, Web Sounds & Soundscapes, Stickers & Canvas
// ============================================================================

(function () {
  // ---- 1. WEB VIDEOS STATE & HELPERS ----
  let currentWebVideo = null;
  let webVideosList = [];
  let webVideoCategory = 'all';
  let webVideoSearchQuery = '';
  let isWebVideoFloating = false;
  let webVideoSearchTimeout = null;

  const DEFAULT_WEB_VIDEOS = [
    {
      id: 'synthwave-grid',
      title: 'Synthwave Sunset Highway Loop',
      category: 'cyberpunk',
      duration: '0:30',
      resolution: '1080p 60fps',
      thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      tags: ['synthwave', 'retro', 'neon', 'highway', 'chill'],
      description: 'Retro 80s neon synthwave grid highway driving loop with glowing purple sunset.'
    },
    {
      id: 'ocean-waves',
      title: 'Deep Ocean Waves & Golden Hour',
      category: 'nature',
      duration: '0:15',
      resolution: '4K Ultra HD',
      thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      tags: ['ocean', 'waves', 'sunset', 'relax', 'nature'],
      description: 'Slow-motion rhythmic ocean waves washing along the coast at golden hour.'
    },
    {
      id: 'matrix-tunnel',
      title: 'Cyberspace Quantum Data Stream',
      category: 'cyberpunk',
      duration: '0:45',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      tags: ['code', 'matrix', 'data', 'security', 'tech'],
      description: 'High-speed cryptographic data packets flying through an encrypted neural fiber tunnel.'
    },
    {
      id: 'rain-window',
      title: 'Raindrops Falling on Cozy Windowpane',
      category: 'ambient',
      duration: '0:35',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      tags: ['rain', 'window', 'cozy', 'study', 'focus'],
      description: 'Gentle raindrops tracing paths across a warm ambient glass windowpane.'
    },
    {
      id: 'deep-space',
      title: 'Cosmic Nebula & Galactic Core Orbit',
      category: 'space',
      duration: '0:20',
      resolution: '4K Ultra HD',
      thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      tags: ['space', 'galaxy', 'nebula', 'cosmos', 'stars'],
      description: 'Spectacular celestial flythrough of distant glowing gas nebulas and starry galaxies.'
    },
    {
      id: 'cyber-server',
      title: 'Server Room Optical Data Hub',
      category: 'tech',
      duration: '0:18',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      tags: ['server', 'cloud', 'datacenter', 'infra', 'led'],
      description: 'Gleaming server rack array with pulsing fiber-optic network activity LEDs.'
    },
    {
      id: 'lofi-cafe',
      title: 'Lo-Fi Rain Terrace & Coffee Study',
      category: 'ambient',
      duration: '0:40',
      resolution: '1080p',
      thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      tags: ['lofi', 'coffee', 'cafe', 'chill', 'music'],
      description: 'Atmospheric urban rain terrace with warm lanterns, steam from coffee, and lo-fi vibes.'
    },
    {
      id: 'aurora-borealis',
      title: 'Nordic Aurora Borealis Northern Lights',
      category: 'nature',
      duration: '0:25',
      resolution: '4K Ultra HD',
      thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format&fit=crop&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      tags: ['aurora', 'green', 'sky', 'night', 'arctic'],
      description: 'Emerald green ribbons of aurora borealis rippling across the Arctic night sky.'
    }
  ];

  window.renderWebVideosStudio = async function () {
    const content = document.getElementById('mainContent');
    if (!content) return;

    if (!currentWebVideo) {
      currentWebVideo = DEFAULT_WEB_VIDEOS[0];
    }

    content.innerHTML = `
      ${typeof renderStudioSubNav === 'function' ? renderStudioSubNav('webvideos') : ''}
      <div class="web-media-container" id="webVideosContainer">
        <!-- Top Title & Stats Banner -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
          <div>
            <div style="font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px;">
              <span>📹</span> Web Videos & Ambient Cinematics
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:3px;">
              Stream royalty-free high-definition web videos, ambient loops, Wikimedia archives, and custom direct video streams.
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="window.openCustomVideoModal()" style="font-size:12px;padding:6px 12px;">
              ＋ Add Custom Video URL
            </button>
            <button class="btn btn-primary" onclick="window.floatWebVideoToMini()" style="font-size:12px;padding:6px 12px;">
              🪟 Float Mini Player
            </button>
          </div>
        </div>

        <!-- Video Player Stage -->
        <div class="web-video-stage" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:20px;box-shadow:0 8px 24px rgba(0,0,0,0.3);">
          <div style="position:relative;width:100%;aspect-ratio:16/9;background:#000;display:flex;align-items:center;justify-content:center;">
            <video id="mainWebVideoElement" 
              src="${currentWebVideo.url}" 
              poster="${currentWebVideo.thumb || ''}"
              controls 
              autoplay 
              loop 
              playsinline
              style="width:100%;height:100%;object-fit:contain;background:#000;"
              onplay="window.onWebVideoPlayStateChange(true)"
              onpause="window.onWebVideoPlayStateChange(false)">
            </video>
          </div>

          <!-- Video Details Bar -->
          <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-top:1px solid var(--border);">
            <div>
              <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;">
                <span id="webVideoActiveTitle">${esc(currentWebVideo.title)}</span>
                <span class="badge" style="background:var(--accent-glow);color:var(--accent);border:1px solid var(--accent);font-size:11px;">
                  ${esc(currentWebVideo.resolution || 'HD')}
                </span>
                <span class="badge" style="background:var(--surface2);color:var(--muted);border:1px solid var(--border);font-size:11px;">
                  ${esc(currentWebVideo.category || 'video')}
                </span>
              </div>
              <div style="font-size:12px;color:var(--muted);margin-top:4px;" id="webVideoActiveDesc">
                ${esc(currentWebVideo.description || '')}
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary" onclick="window.copyWebVideoUrl()" style="font-size:12px;padding:6px 12px;">
                📋 Copy Link
              </button>
              <button class="btn btn-secondary" onclick="window.attachWebVideoToTask()" style="font-size:12px;padding:6px 12px;">
                ✅ Attach to Task
              </button>
              <button class="btn btn-secondary" onclick="window.attachWebVideoToNote()" style="font-size:12px;padding:6px 12px;">
                📝 Save to Note
              </button>
            </div>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:20px;">
          <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <div style="flex:1;min-width:240px;position:relative;">
              <input type="text" id="webVideoSearchInput" placeholder="Search web videos, ambient loops, Wikimedia Commons..." 
                value="${esc(webVideoSearchQuery)}" 
                oninput="window.onWebVideoSearchInput(this.value)"
                style="width:100%;padding:9px 12px 9px 34px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;outline:none;" />
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);">🔍</span>
            </div>
            <button class="btn btn-secondary" onclick="window.fetchWebVideos()" style="font-size:13px;">
              Refresh
            </button>
          </div>

          <!-- Category Pills -->
          <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;" id="webVideoCategoryPills">
            ${[
              { id: 'all', label: '✨ All Categories' },
              { id: 'ambient', label: '🌧️ Ambient & Study' },
              { id: 'nature', label: '🌊 Nature & 4K' },
              { id: 'cyberpunk', label: '🌆 Cyberpunk & Neon' },
              { id: 'space', label: '🌌 Space & Nebula' },
              { id: 'tech', label: '💻 Tech & Cryptography' }
            ].map(c => `
              <button class="studio-subtab ${webVideoCategory === c.id ? 'active' : ''}" 
                onclick="window.setWebVideoCategory('${c.id}')" 
                style="white-space:nowrap;font-size:12px;padding:5px 12px;">
                ${c.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Video Catalog Grid -->
        <div id="webVideoGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:14px;">
          <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">
            Loading web videos...
          </div>
        </div>
      </div>
    `;

    // Load video library from API
    await window.fetchWebVideos();
  };

  window.fetchWebVideos = async function () {
    const grid = document.getElementById('webVideoGrid');
    if (!grid) return;

    try {
      const q = encodeURIComponent(webVideoSearchQuery || '');
      const cat = encodeURIComponent(webVideoCategory || 'all');
      const res = await fetch(`${API}/videos/web?q=${q}&category=${cat}`);
      if (res.ok) {
        const data = await res.json();
        webVideosList = data.videos || DEFAULT_WEB_VIDEOS;
      } else {
        webVideosList = DEFAULT_WEB_VIDEOS;
      }
    } catch (err) {
      console.warn('Falling back to default web videos:', err);
      webVideosList = DEFAULT_WEB_VIDEOS;
    }

    // Filter locally if needed
    let filtered = webVideosList;
    if (webVideoCategory !== 'all') {
      filtered = filtered.filter(v => v.category === webVideoCategory);
    }
    if (webVideoSearchQuery) {
      const q = webVideoSearchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        (v.title && v.title.toLowerCase().includes(q)) || 
        (v.description && v.description.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:50px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);color:var(--muted);">
          <div style="font-size:32px;margin-bottom:8px;">📹</div>
          <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:4px;">No videos found</div>
          <div style="font-size:13px;">Try searching another keyword or select All Categories.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(v => `
      <div class="web-video-card" onclick="window.playWebVideo('${esc(v.id)}')" 
        style="background:var(--surface);border:1px solid ${currentWebVideo && currentWebVideo.id === v.id ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:transform 0.15s, border-color 0.15s;display:flex;flex-direction:column;"
        onmouseenter="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'"
        onmouseleave="this.style.borderColor='${currentWebVideo && currentWebVideo.id === v.id ? 'var(--accent)' : 'var(--border)'}';this.style.transform='none'">
        <div style="position:relative;width:100%;aspect-ratio:16/9;background:#0a0a0e;overflow:hidden;">
          <img src="${esc(v.thumb || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80')}" 
            alt="${esc(v.title)}" 
            loading="lazy"
            style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;"
            onerror="this.src='https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80'" />
          <span style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.8);color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;backdrop-filter:blur(4px);">
            ${esc(v.duration || 'Web')}
          </span>
          <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.7);color:var(--accent);border:1px solid var(--accent);padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;">
            ${esc(v.resolution || 'HD')}
          </span>
        </div>
        <div style="padding:12px;flex:1;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="font-size:13.5px;font-weight:600;color:var(--text);line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${esc(v.title)}
            </div>
            <div style="font-size:11.5px;color:var(--muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px;">
              ${esc(v.description || '')}
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:8px;margin-top:4px;">
            <span style="font-size:11px;color:var(--muted);text-transform:uppercase;">${esc(v.category || 'clip')}</span>
            <span style="font-size:11.5px;color:var(--accent);font-weight:600;display:flex;align-items:center;gap:4px;">
              ▶ Play Now
            </span>
          </div>
        </div>
      </div>
    `).join('');
  };

  window.playWebVideo = function (id) {
    const found = webVideosList.find(v => v.id === id);
    if (!found) return;
    currentWebVideo = found;

    const vid = document.getElementById('mainWebVideoElement');
    if (vid) {
      vid.src = found.url;
      vid.poster = found.thumb || '';
      vid.play().catch(() => {});
    }

    const titleEl = document.getElementById('webVideoActiveTitle');
    if (titleEl) titleEl.textContent = found.title;

    const descEl = document.getElementById('webVideoActiveDesc');
    if (descEl) descEl.textContent = found.description || '';

    // Update grid selection highlight
    window.fetchWebVideos();
    window.updateFloatingDock();
  };

  window.onWebVideoSearchInput = function (val) {
    webVideoSearchQuery = val;
    clearTimeout(webVideoSearchTimeout);
    webVideoSearchTimeout = setTimeout(() => {
      window.fetchWebVideos();
    }, 350);
  };

  window.setWebVideoCategory = function (cat) {
    webVideoCategory = cat;
    const pills = document.querySelectorAll('#webVideoCategoryPills button');
    pills.forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    window.fetchWebVideos();
  };

  window.onWebVideoPlayStateChange = function (playing) {
    window.updateFloatingDock();
  };

  window.copyWebVideoUrl = function () {
    if (!currentWebVideo) return;
    if (typeof copyText === 'function') {
      copyText(currentWebVideo.url);
    } else {
      navigator.clipboard.writeText(currentWebVideo.url);
    }
    if (typeof toast === 'function') toast('✓ Video URL copied to clipboard!');
  };

  window.attachWebVideoToTask = function () {
    if (!currentWebVideo) return;
    if (typeof showTodoForm === 'function') {
      showTodoForm(null, `📹 Watch: ${currentWebVideo.title} (${currentWebVideo.url})`);
    } else {
      toast('Attach video: ' + currentWebVideo.title);
    }
  };

  window.attachWebVideoToNote = function () {
    if (!currentWebVideo) return;
    if (typeof showPasswordForm === 'function') {
      showPasswordForm(null, 'note', {
        title: `📹 Video: ${currentWebVideo.title}`,
        note: `### 📹 ${currentWebVideo.title}\n- URL: ${currentWebVideo.url}\n- Category: ${currentWebVideo.category}\n- Resolution: ${currentWebVideo.resolution}\n- Description: ${currentWebVideo.description || ''}`
      });
    } else {
      toast('Saved video to note!');
    }
  };

  window.openCustomVideoModal = function () {
    showModal('Add Custom Web Video Stream', `
      <div class="form-group">
        <label>Video Title *</label>
        <input type="text" id="customVidTitle" placeholder="e.g. My Cyberpunk Drone Stream" style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);" />
      </div>
      <div class="form-group">
        <label>Direct Video URL (MP4, WebM, Stream) *</label>
        <input type="url" id="customVidUrl" placeholder="https://example.com/video.mp4" style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);" />
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="customVidCat" style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);">
          <option value="ambient">Ambient & Study</option>
          <option value="nature">Nature & 4K</option>
          <option value="cyberpunk">Cyberpunk & Neon</option>
          <option value="space">Space & Nebula</option>
          <option value="tech">Tech & Cryptography</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveCustomWebVideo()">Save & Play Video</button>
      </div>
    `);
  };

  window.saveCustomWebVideo = function () {
    const title = document.getElementById('customVidTitle').value.trim();
    const url = document.getElementById('customVidUrl').value.trim();
    const cat = document.getElementById('customVidCat').value;

    if (!title || !url) {
      if (typeof toast === 'function') toast('Please provide both Title and Video URL.');
      return;
    }

    const newVid = {
      id: 'custom-' + Date.now(),
      title: title,
      category: cat,
      duration: 'Direct Stream',
      resolution: 'Online Stream',
      thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      url: url,
      description: 'Custom added video stream'
    };

    DEFAULT_WEB_VIDEOS.unshift(newVid);
    webVideosList.unshift(newVid);
    currentWebVideo = newVid;
    closeModal();
    if (typeof toast === 'function') toast('✓ Custom video added!');
    window.renderWebVideosStudio();
  };

  // Floating Mini-Player for Web Videos
  window.floatWebVideoToMini = function () {
    let mini = document.getElementById('webVideoMiniPlayer');
    if (!mini) {
      mini = document.createElement('div');
      mini.id = 'webVideoMiniPlayer';
      mini.style.cssText = `
        position:fixed;bottom:70px;right:20px;width:320px;background:var(--surface);border:1px solid var(--accent);
        border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.6);z-index:9999;overflow:hidden;display:flex;flex-direction:column;
      `;
      mini.innerHTML = `
        <div style="background:var(--surface2);padding:6px 10px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);">
          <span style="font-size:11.5px;font-weight:600;display:flex;align-items:center;gap:6px;color:var(--text);" id="webVideoMiniTitle">
            📹 Web Video
          </span>
          <div style="display:flex;gap:4px;">
            <button onclick="switchTab('webvideos')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;" title="Maximize">↗</button>
            <button onclick="document.getElementById('webVideoMiniPlayer').style.display='none'" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;" title="Close">✕</button>
          </div>
        </div>
        <div style="width:100%;aspect-ratio:16/9;background:#000;">
          <video id="miniWebVideoElement" controls autoplay loop style="width:100%;height:100%;object-fit:cover;"></video>
        </div>
      `;
      document.body.appendChild(mini);
    }

    const mainVid = document.getElementById('mainWebVideoElement');
    const miniVid = document.getElementById('miniWebVideoElement');
    const miniTitle = document.getElementById('webVideoMiniTitle');

    if (currentWebVideo) {
      miniVid.src = currentWebVideo.url;
      if (mainVid) miniVid.currentTime = mainVid.currentTime;
      miniVid.play().catch(() => {});
      if (miniTitle) miniTitle.textContent = currentWebVideo.title;
      mini.style.display = 'flex';
      if (typeof toast === 'function') toast('🪟 Video detached to floating mini-player');
    }
  };


  // ============================================================================
  // 2. WEB SOUNDS & AMBIENCE MIXER (PROCEDURAL WEB AUDIO SYNTHESIS)
  // ============================================================================

  let soundAudioCtx = null;
  let activeSoundNodes = {}; // channelId -> { gainNode, sourceNode, etc. }
  let masterSoundGain = null;
  let masterSoundVolume = 0.75;
  let isSoundMasterMuted = false;
  let pomodoroTimerInterval = null;
  let pomodoroSecondsRemaining = 25 * 60;
  let pomodoroIsRunning = false;

  function getSoundAudioContext() {
    if (!soundAudioCtx) {
      soundAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterSoundGain = soundAudioCtx.createGain();
      masterSoundGain.gain.setValueAtTime(masterSoundVolume, soundAudioCtx.currentTime);
      masterSoundGain.connect(soundAudioCtx.destination);
    }
    if (soundAudioCtx.state === 'suspended') {
      soundAudioCtx.resume();
    }
    return soundAudioCtx;
  }

  // Pure Web Audio Procedural Sound Generators (100% reliable, zero network dependency)
  function createWhiteNoiseNode(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.start();
    return noise;
  }

  function createPinkNoiseNode(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.start();
    return noise;
  }

  function createBrownNoiseNode(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.start();
    return noise;
  }

  const SOUND_CHANNELS = [
    { id: 'rain', name: 'Heavy Rain & Drops', icon: '🌧️', type: 'rain', desc: 'Gentle continuous rainfall on roof and window' },
    { id: 'thunder', name: 'Rolling Thunder', icon: '⚡', type: 'thunder', desc: 'Deep sub-bass distant thunderstorm rumble' },
    { id: 'ocean', name: 'Ocean Tide Waves', icon: '🌊', type: 'ocean', desc: 'Rhythmic oceanic surf rising and ebbing' },
    { id: 'fire', name: 'Crackling Campfire', icon: '🔥', type: 'fire', desc: 'Warm glowing fireplace with wood pops' },
    { id: 'forest', name: 'Night Forest & Crickets', icon: '🌲', type: 'crickets', desc: 'Pine forest evening breeze and rhythmic crickets' },
    { id: 'coffee', name: 'Cafe Terrace Chatter', icon: '☕', type: 'cafe', desc: 'Low pleasant background cafe murmur and cups' },
    { id: 'whitenoise', name: 'Pure White Noise', icon: '📻', type: 'white', desc: 'Equal energy distribution across all audible frequencies' },
    { id: 'pinknoise', name: 'Deep Pink Noise', icon: '🌸', type: 'pink', desc: 'Balanced 1/f acoustic power for deep reading focus' },
    { id: 'brownnoise', name: 'Warm Brown Noise', icon: '🍫', type: 'brown', desc: 'Deep warm sub-weighted noise for sleep and masking' },
    { id: 'binaural40', name: '40Hz Gamma Focus Wave', icon: '🧠', type: 'binaural40', desc: 'Binaural auditory beat for peak cognitive focus' },
    { id: 'binaural14', name: '14Hz Alpha Calm Wave', icon: '⚡', type: 'binaural14', desc: 'Alpha wave brainwave entrainment for relaxed alert flow' },
    { id: 'zenbowl', name: 'Tibetan Singing Bowl Drone', icon: '🧘', type: 'zenbowl', desc: 'Harmonic 432Hz sacred geometry resonant chime' }
  ];

  const SOUND_PRESETS = [
    { id: 'deep_focus', name: '🎯 Peak Focus Room', desc: 'Brown Noise + Rain + 40Hz Gamma', gains: { brownnoise: 60, rain: 45, binaural40: 30 } },
    { id: 'rainy_cabin', name: '🏡 Cozy Cabin Storm', desc: 'Heavy Rain + Thunder + Campfire', gains: { rain: 75, thunder: 50, fire: 65 } },
    { id: 'coastal_sunset', name: '🏖️ Coastal Sunset', desc: 'Ocean Waves + Evening Breeze + Pink Noise', gains: { ocean: 80, pinknoise: 35, forest: 25 } },
    { id: 'cyberpunk_study', name: '🌃 Midnight Cyber Study', desc: 'Rain on Glass + 14Hz Alpha + Pink Noise', gains: { rain: 60, pinknoise: 40, binaural14: 35 } },
    { id: 'zen_sanctuary', name: '🌸 Zen Temple Sanctuary', desc: '432Hz Singing Bowl + Forest + Ocean', gains: { zenbowl: 70, forest: 45, ocean: 30 } }
  ];

  const SOUNDBOARD_ITEMS = [
    { id: 'click', name: 'Mechanical Key', icon: '⌨️' },
    { id: 'success', name: 'Access Granted', icon: '✨' },
    { id: 'chime', name: 'Crystal Bell', icon: '🔔' },
    { id: 'coin', name: 'Retro Coin', icon: '🪙' },
    { id: 'laser', name: 'Laser Blaster', icon: '⚡' },
    { id: 'alert', name: 'Security Ping', icon: '🚨' },
    { id: 'levelup', name: 'Level Complete', icon: '🏆' },
    { id: 'pop', name: 'Bubble Pop', icon: '🫧' },
    { id: 'swoosh', name: 'Cyber Swoosh', icon: '💨' },
    { id: 'shutter', name: 'Camera Shutter', icon: '📸' }
  ];

  window.renderWebSoundsStudio = function () {
    const content = document.getElementById('mainContent');
    if (!content) return;

    content.innerHTML = `
      ${typeof renderStudioSubNav === 'function' ? renderStudioSubNav('websounds') : ''}
      <div class="web-media-container" id="webSoundsContainer">
        <!-- Top Title & Master Controls -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
          <div>
            <div style="font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px;">
              <span>🎧</span> Web Sounds & Multi-Track Ambience Mixer
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:3px;">
              Craft your personalized study & focus soundscapes with procedural high-fidelity nature audio, binaural focus frequencies, and ambient noise generators.
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;background:var(--surface);padding:6px 12px;border:1px solid var(--border);border-radius:6px;">
              <span style="font-size:12px;color:var(--muted);">Master:</span>
              <input type="range" min="0" max="100" value="${Math.round(masterSoundVolume * 100)}" 
                oninput="window.setMasterSoundVolume(this.value / 100)"
                style="width:80px;accent-color:var(--accent);" />
            </div>
            <button class="btn btn-secondary" onclick="window.stopAllAmbientSounds()" style="font-size:12px;padding:6px 12px;">
              ⏹ Mute All
            </button>
            <button class="btn btn-primary" onclick="window.randomZenSoundMix()" style="font-size:12px;padding:6px 12px;">
              🎲 Random Zen Mix
            </button>
          </div>
        </div>

        <!-- Presets Bar -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:20px;">
          <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">
            ⚡ Instant Ambient Soundscape Presets
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${SOUND_PRESETS.map(p => `
              <button class="btn btn-secondary" onclick="window.applySoundPreset('${p.id}')" 
                style="font-size:12px;padding:6px 12px;border-radius:20px;background:var(--surface2);">
                ${p.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Multi-Channel Mixer Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:14px;margin-bottom:24px;">
          ${SOUND_CHANNELS.map(ch => `
            <div class="sound-channel-card" id="soundCard_${ch.id}" 
              style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;justify-content:space-between;transition:border-color 0.2s, background 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:24px;">${ch.icon}</span>
                  <div>
                    <div style="font-size:14px;font-weight:600;color:var(--text);">${ch.name}</div>
                    <div style="font-size:11.5px;color:var(--muted);line-height:1.3;">${ch.desc}</div>
                  </div>
                </div>
                <button class="btn btn-secondary" id="soundBtn_${ch.id}" onclick="window.toggleAmbientChannel('${ch.id}')" 
                  style="padding:4px 10px;font-size:11px;min-width:55px;">
                  ▶ Play
                </button>
              </div>

              <!-- Volume Slider & Animated EQ -->
              <div style="display:flex;align-items:center;gap:10px;margin-top:6px;">
                <span style="font-size:11px;color:var(--muted);min-width:30px;" id="soundVolLabel_${ch.id}">50%</span>
                <input type="range" min="0" max="100" value="50" id="soundSlider_${ch.id}" 
                  oninput="window.setChannelVolume('${ch.id}', this.value / 100)"
                  style="flex:1;accent-color:var(--accent);" />
                <!-- Mini EQ bars indicator -->
                <div id="soundEq_${ch.id}" style="display:none;align-items:flex-end;gap:2px;height:14px;width:16px;">
                  <span style="width:3px;height:60%;background:var(--accent);border-radius:1px;animation:soundPulse 0.6s infinite alternate;"></span>
                  <span style="width:3px;height:100%;background:var(--accent);border-radius:1px;animation:soundPulse 0.4s infinite alternate-reverse;"></span>
                  <span style="width:3px;height:40%;background:var(--accent);border-radius:1px;animation:soundPulse 0.8s infinite alternate;"></span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Two Columns: Pomodoro Focus Timer + Instant Soundboard -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:18px;margin-bottom:20px;">
          <!-- Focus Pomodoro Timer -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
            <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span>⏱️</span> Pomodoro Focus & Ambience Timer
            </div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">
              Keep your ambient soundscape playing during productive sprints. Sound smoothly fades when timer finishes.
            </div>

            <div style="text-align:center;padding:16px;background:var(--surface2);border-radius:var(--radius);margin-bottom:16px;border:1px solid var(--border);">
              <div style="font-size:44px;font-weight:700;font-family:var(--font-mono, monospace);color:var(--text);" id="pomodoroDisplay">
                25:00
              </div>
              <div style="font-size:12px;color:var(--accent);margin-top:4px;" id="pomodoroStatusLabel">
                Ready for Focus Sprint
              </div>
            </div>

            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;">
              <button class="btn btn-secondary" onclick="window.setPomodoroDuration(15)" style="font-size:12px;">15 min</button>
              <button class="btn btn-secondary" onclick="window.setPomodoroDuration(25)" style="font-size:12px;">25 min</button>
              <button class="btn btn-secondary" onclick="window.setPomodoroDuration(45)" style="font-size:12px;">45 min</button>
              <button class="btn btn-secondary" onclick="window.setPomodoroDuration(60)" style="font-size:12px;">60 min</button>
            </div>

            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary" id="pomodoroStartBtn" onclick="window.togglePomodoro()" style="flex:1;">
                ▶ Start Focus Timer
              </button>
              <button class="btn btn-secondary" onclick="window.resetPomodoro()" style="flex:1;">
                ↺ Reset
              </button>
            </div>
          </div>

          <!-- Instant FX Soundboard -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
            <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span>⚡</span> Instant FX & Cyber Soundboard
            </div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">
              Zero-latency synthesized audio feedback triggers for UI events, achievements, and notifications.
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:8px;">
              ${SOUNDBOARD_ITEMS.map(sb => `
                <button class="btn btn-secondary" onclick="window.playSoundEffect('${sb.id}')" 
                  style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px;gap:6px;background:var(--surface2);border-radius:8px;">
                  <span style="font-size:22px;">${sb.icon}</span>
                  <span style="font-size:11.5px;font-weight:600;white-space:nowrap;">${sb.name}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    window.refreshMixerUi();
  };

  window.toggleAmbientChannel = function (id) {
    const ctx = getSoundAudioContext();
    const isPlaying = !!activeSoundNodes[id];

    if (isPlaying) {
      // Stop channel
      const node = activeSoundNodes[id];
      try {
        if (node.source) node.source.stop();
      } catch (_) {}
      delete activeSoundNodes[id];
    } else {
      // Start procedural sound node
      const channel = SOUND_CHANNELS.find(c => c.id === id);
      if (!channel) return;

      const gain = ctx.createGain();
      const slider = document.getElementById(`soundSlider_${id}`);
      const vol = slider ? slider.value / 100 : 0.5;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.connect(masterSoundGain);

      let source = null;
      if (channel.type === 'white') {
        source = createWhiteNoiseNode(ctx);
        source.connect(gain);
      } else if (channel.type === 'pink') {
        source = createPinkNoiseNode(ctx);
        source.connect(gain);
      } else if (channel.type === 'brown') {
        source = createBrownNoiseNode(ctx);
        source.connect(gain);
      } else if (channel.type === 'rain') {
        // Filtered pink noise with slight lowpass
        const noise = createPinkNoiseNode(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        noise.connect(filter);
        filter.connect(gain);
        source = noise;
      } else if (channel.type === 'thunder') {
        // Deep lowpass brownian noise with slow sine LFO
        const noise = createBrownNoiseNode(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, ctx.currentTime);
        noise.connect(filter);
        filter.connect(gain);
        source = noise;
      } else if (channel.type === 'ocean') {
        // Pink noise with modulated gain
        const noise = createPinkNoiseNode(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave period
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.3, ctx.currentTime);
        lfo.connect(lfoGain.gain);
        lfo.start();

        noise.connect(filter);
        filter.connect(gain);
        source = noise;
      } else if (channel.type === 'fire') {
        // Filtered high-passed noise for crackling
        const noise = createPinkNoiseNode(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        noise.connect(filter);
        filter.connect(gain);
        source = noise;
      } else if (channel.type === 'crickets') {
        // High frequency modulated oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500, ctx.currentTime);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(16, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);
        lfo.connect(gain.gain);
        lfo.start();
        osc.connect(gain);
        osc.start();
        source = osc;
      } else if (channel.type === 'cafe') {
        const noise = createPinkNoiseNode(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(0.8, ctx.currentTime);
        noise.connect(filter);
        filter.connect(gain);
        source = noise;
      } else if (channel.type === 'binaural40') {
        // Stereo binaural beat: 200Hz left, 240Hz right (40Hz difference)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.frequency.setValueAtTime(240, ctx.currentTime);
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start();
        osc2.start();
        source = osc1;
      } else if (channel.type === 'binaural14') {
        // Alpha binaural: 200Hz left, 214Hz right (14Hz difference)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.frequency.setValueAtTime(214, ctx.currentTime);
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start();
        osc2.start();
        source = osc1;
      } else if (channel.type === 'zenbowl') {
        // 432Hz harmonic singing bowl
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(432, ctx.currentTime);
        osc2.frequency.setValueAtTime(864, ctx.currentTime);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.25, ctx.currentTime);
        osc1.connect(gain);
        osc2.connect(g2);
        g2.connect(gain);
        osc1.start();
        osc2.start();
        source = osc1;
      }

      activeSoundNodes[id] = { source, gain };
    }

    window.refreshMixerUi();
    window.updateFloatingDock();
  };

  window.setChannelVolume = function (id, vol) {
    if (activeSoundNodes[id] && activeSoundNodes[id].gain && soundAudioCtx) {
      activeSoundNodes[id].gain.gain.setValueAtTime(vol, soundAudioCtx.currentTime);
    }
    const label = document.getElementById(`soundVolLabel_${id}`);
    if (label) label.textContent = Math.round(vol * 100) + '%';
  };

  window.setMasterSoundVolume = function (vol) {
    masterSoundVolume = vol;
    if (masterSoundGain && soundAudioCtx) {
      masterSoundGain.gain.setValueAtTime(vol, soundAudioCtx.currentTime);
    }
    window.updateFloatingDock();
  };

  window.stopAllAmbientSounds = function () {
    for (const id of Object.keys(activeSoundNodes)) {
      try {
        if (activeSoundNodes[id].source) activeSoundNodes[id].source.stop();
      } catch (_) {}
    }
    activeSoundNodes = {};
    window.refreshMixerUi();
    window.updateFloatingDock();
    if (typeof toast === 'function') toast('Ambient soundscape muted');
  };

  window.applySoundPreset = function (presetId) {
    const preset = SOUND_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    window.stopAllAmbientSounds();

    for (const [chId, vol] of Object.entries(preset.gains)) {
      const slider = document.getElementById(`soundSlider_${chId}`);
      if (slider) slider.value = vol;
      const label = document.getElementById(`soundVolLabel_${chId}`);
      if (label) label.textContent = vol + '%';
      window.toggleAmbientChannel(chId);
      window.setChannelVolume(chId, vol / 100);
    }

    if (typeof toast === 'function') toast(`✓ Activated ${preset.name}`);
  };

  window.randomZenSoundMix = function () {
    const pool = ['rain', 'ocean', 'fire', 'forest', 'brownnoise', 'zenbowl', 'binaural14'];
    const chosen = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
    window.stopAllAmbientSounds();

    chosen.forEach(id => {
      const vol = Math.floor(Math.random() * 40 + 35);
      const slider = document.getElementById(`soundSlider_${id}`);
      if (slider) slider.value = vol;
      window.toggleAmbientChannel(id);
      window.setChannelVolume(id, vol / 100);
    });

    if (typeof toast === 'function') toast('🎲 Generated randomized zen sound mix');
  };

  window.refreshMixerUi = function () {
    for (const ch of SOUND_CHANNELS) {
      const card = document.getElementById(`soundCard_${ch.id}`);
      const btn = document.getElementById(`soundBtn_${ch.id}`);
      const eq = document.getElementById(`soundEq_${ch.id}`);
      const isPlaying = !!activeSoundNodes[ch.id];

      if (card) {
        card.style.borderColor = isPlaying ? 'var(--accent)' : 'var(--border)';
        card.style.background = isPlaying ? 'rgba(124,106,247,0.06)' : 'var(--surface)';
      }
      if (btn) {
        btn.textContent = isPlaying ? '⏸ Stop' : '▶ Play';
        btn.className = isPlaying ? 'btn btn-primary' : 'btn btn-secondary';
      }
      if (eq) {
        eq.style.display = isPlaying ? 'flex' : 'none';
      }
    }
  };

  // Synthesized Instant Sound Effects for Soundboard
  window.playSoundEffect = function (type) {
    const ctx = getSoundAudioContext();
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'success') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    } else if (type === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (type === 'coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'laser') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'alert') {
      [880, 660, 880, 660].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.11);
      });
    } else if (type === 'levelup') {
      [392.00, 523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.3, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.35);
      });
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'swoosh') {
      const noise = createWhiteNoiseNode(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2500, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.stop(now + 0.32);
    } else if (type === 'shutter') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  };

  // Pomodoro Focus Timer Logic
  window.setPomodoroDuration = function (mins) {
    pomodoroSecondsRemaining = mins * 60;
    window.updatePomodoroDisplay();
    if (pomodoroIsRunning) window.togglePomodoro();
  };

  window.togglePomodoro = function () {
    const btn = document.getElementById('pomodoroStartBtn');
    const status = document.getElementById('pomodoroStatusLabel');

    if (pomodoroIsRunning) {
      clearInterval(pomodoroTimerInterval);
      pomodoroIsRunning = false;
      if (btn) btn.textContent = '▶ Resume Focus Timer';
      if (status) status.textContent = 'Paused';
    } else {
      pomodoroIsRunning = true;
      if (btn) btn.textContent = '⏸ Pause Focus Timer';
      if (status) status.textContent = '🔥 Deep Focus Sprint Active';

      pomodoroTimerInterval = setInterval(() => {
        pomodoroSecondsRemaining--;
        window.updatePomodoroDisplay();

        if (pomodoroSecondsRemaining <= 0) {
          clearInterval(pomodoroTimerInterval);
          pomodoroIsRunning = false;
          window.playSoundEffect('levelup');
          if (typeof toast === 'function') toast('🎉 Pomodoro Completed! Great focus session!');
          if (btn) btn.textContent = '▶ Start Focus Timer';
          if (status) status.textContent = '🎉 Completed!';
          pomodoroSecondsRemaining = 25 * 60;
        }
      }, 1000);
    }
  };

  window.resetPomodoro = function () {
    clearInterval(pomodoroTimerInterval);
    pomodoroIsRunning = false;
    pomodoroSecondsRemaining = 25 * 60;
    window.updatePomodoroDisplay();
    const btn = document.getElementById('pomodoroStartBtn');
    const status = document.getElementById('pomodoroStatusLabel');
    if (btn) btn.textContent = '▶ Start Focus Timer';
    if (status) status.textContent = 'Ready for Focus Sprint';
  };

  window.updatePomodoroDisplay = function () {
    const el = document.getElementById('pomodoroDisplay');
    if (!el) return;
    const mins = Math.floor(pomodoroSecondsRemaining / 60);
    const secs = pomodoroSecondsRemaining % 60;
    el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  // ============================================================================
  // 3. STICKERS & BADGES STUDIO & INTERACTIVE CANVAS
  // ============================================================================

  let stickerCategory = 'all';
  let stickerSearchQuery = '';
  let canvasStickers = []; // [{ id, emoji, label, bg, border, color, x, y, size, rotation }]
  let customStickersList = [];

  const DEFAULT_STICKERS = [
    // Cyber & Tech
    { id: 'stk-chip', category: 'tech', name: 'Quantum Core', emoji: '💽', bg: '#0f172a', border: '#38bdf8', color: '#38bdf8', label: 'QUANTUM' },
    { id: 'stk-term', category: 'tech', name: 'Root Terminal', emoji: '💻', bg: '#022c22', border: '#10b981', color: '#10b981', label: 'ROOT ACCESS' },
    { id: 'stk-rocket', category: 'tech', name: 'Hyper Rocket', emoji: '🚀', bg: '#450a0a', border: '#f87171', color: '#f87171', label: 'DEPLOYED' },
    { id: 'stk-matrix', category: 'tech', name: 'Cyber Glitch', emoji: '👾', bg: '#14532d', border: '#22c55e', color: '#86efac', label: 'CYBER BUG' },
    { id: 'stk-btc', category: 'tech', name: 'Crypto Gold', emoji: '🪙', bg: '#451a03', border: '#f59e0b', color: '#fbbf24', label: 'HASH 256' },

    // Kawaii & Cute
    { id: 'stk-cat', category: 'kawaii', name: 'Astro Cat', emoji: '🐱‍🚀', bg: '#3b0764', border: '#c084fc', color: '#e9d5ff', label: 'ASTRO MEOW' },
    { id: 'stk-boba', category: 'kawaii', name: 'Boba Delight', emoji: '🧋', bg: '#451a03', border: '#d97706', color: '#fde68a', label: 'SWEET BOBA' },
    { id: 'stk-cloud', category: 'kawaii', name: 'Happy Cloud', emoji: '☁️', bg: '#0c4a6e', border: '#38bdf8', color: '#bae6fd', label: 'CHILL VIBE' },
    { id: 'stk-star', category: 'kawaii', name: 'Magic Star', emoji: '⭐', bg: '#713f12', border: '#eab308', color: '#fef08a', label: 'SUPERSTAR' },
    { id: 'stk-heart', category: 'kawaii', name: 'Pixel Heart', emoji: '💖', bg: '#831843', border: '#f472b6', color: '#fbcfe8', label: 'MAX HP' },

    // Badges & Status
    { id: 'stk-verified', category: 'badges', name: 'Verified Shield', emoji: '🛡️', bg: '#064e3b', border: '#34d399', color: '#6ee7b7', label: 'VERIFIED' },
    { id: 'stk-urgent', category: 'badges', name: 'Urgent Priority', emoji: '🚨', bg: '#7f1d1d', border: '#ef4444', color: '#fca5a5', label: 'URGENT' },
    { id: 'stk-secret', category: 'badges', name: 'Top Secret', emoji: '🤫', bg: '#18181b', border: '#e11d48', color: '#fda4af', label: 'TOP SECRET' },
    { id: 'stk-done', category: 'badges', name: 'Mission Done', emoji: '✅', bg: '#064e3b', border: '#10b981', color: '#a7f3d0', label: '100% COMPLETE' },
    { id: 'stk-vip', category: 'badges', name: 'VIP Status', emoji: '👑', bg: '#581c87', border: '#a855f7', color: '#e9d5ff', label: 'VIP ACCESS' },

    // Reactions & Memes
    { id: 'stk-fire', category: 'reactions', name: 'Pure Fire', emoji: '🔥', bg: '#7c2d12', border: '#ea580c', color: '#fdba74', label: 'LIT' },
    { id: 'stk-brain', category: 'reactions', name: 'Galaxy Brain', emoji: '🧠', bg: '#312e81', border: '#818cf8', color: '#c7d2fe', label: '200 IQ' },
    { id: 'stk-party', category: 'reactions', name: 'Party Popper', emoji: '🎉', bg: '#701a75', border: '#d946ef', color: '#f5d0fe', label: 'CELEBRATE' },
    { id: 'stk-100', category: 'reactions', name: 'Keep It 100', emoji: '💯', bg: '#881337', border: '#f43f5e', color: '#fecdd3', label: 'PERFECT' },
    { id: 'stk-rock', category: 'reactions', name: 'Rock On', emoji: '🤘', bg: '#1e1b4b', border: '#6366f1', color: '#a5b4fc', label: 'ROCK ON' },

    // Security
    { id: 'stk-vault', category: 'security', name: 'Vault Guard', emoji: '🔐', bg: '#0f172a', border: '#60a5fa', color: '#93c5fd', label: 'AES-256' },
    { id: 'stk-biometric', category: 'security', name: 'Biometric Pass', emoji: '🧬', bg: '#042f2e', border: '#14b8a6', color: '#5eead4', label: 'BIOMETRIC' },
    { id: 'stk-bugfix', category: 'security', name: 'Bug Eliminated', emoji: '🎯', bg: '#1c1917', border: '#78716c', color: '#e7e5e4', label: 'ZERO BUG' }
  ];

  window.renderStickersStudio = function () {
    const content = document.getElementById('mainContent');
    if (!content) return;

    try {
      customStickersList = JSON.parse(localStorage.getItem('vault_custom_stickers') || '[]');
    } catch (_) {
      customStickersList = [];
    }

    // Also fetch saved stickers from database
    fetch('/api/stickers')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.stickers)) {
          const dbStickers = data.stickers;
          const merged = [...dbStickers];
          customStickersList.forEach(local => {
            if (!merged.some(m => m.id === local.id)) merged.push(local);
          });
          customStickersList = merged;
          localStorage.setItem('vault_custom_stickers', JSON.stringify(customStickersList));
          window.refreshStickersGrid();
        }
      })
      .catch(() => {});

    content.innerHTML = `
      ${typeof renderStudioSubNav === 'function' ? renderStudioSubNav('stickers') : ''}
      <div class="web-media-container" id="stickersContainer">
        <!-- Top Title & Quick Actions -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
          <div>
            <div style="font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px;">
              <span>🏷️</span> Stickers, Badges & Interactive Canvas
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:3px;">
              Copy stickers to clipboard, attach status badges to tasks and vault credentials, design custom stickers, or stamp them onto the interactive moodboard canvas.
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="window.openCustomStickerModal()" style="font-size:12px;padding:6px 12px;">
              ✨ Create Custom Sticker
            </button>
            <button class="btn btn-primary" onclick="window.clearStickerCanvas()" style="font-size:12px;padding:6px 12px;">
              🧹 Clear Canvas
            </button>
          </div>
        </div>

        <!-- Interactive Sticker Moodboard Canvas -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;">
              <span>🎨</span> Sticker Moodboard Board (Click any sticker below to stamp!)
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-secondary" onclick="window.exportStickerCanvasPng()" style="font-size:11.5px;padding:4px 10px;">
                💾 Export Canvas as PNG
              </button>
            </div>
          </div>

          <div id="stickerCanvasArea" 
            style="position:relative;width:100%;height:220px;background:#0d0d12;border:2px dashed var(--border);border-radius:8px;overflow:hidden;background-image:radial-gradient(var(--border) 1px, transparent 1px);background-size:16px 16px;">
            <div id="stickerCanvasEmptyHint" style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);color:var(--muted);font-size:12.5px;text-align:center;pointer-events:none;">
              👈 Tap or click any sticker below to stamp it onto this moodboard canvas!
            </div>
            <div id="stickerCanvasItems"></div>
          </div>
        </div>

        <!-- Search & Filter Bar -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:20px;">
          <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <div style="flex:1;min-width:240px;position:relative;">
              <input type="text" id="stickerSearchInput" placeholder="Search stickers, emojis, cyber badges..." 
                value="${esc(stickerSearchQuery)}" 
                oninput="window.onStickerSearchInput(this.value)"
                style="width:100%;padding:9px 12px 9px 34px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;outline:none;" />
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);">🔍</span>
            </div>
          </div>

          <!-- Category Pills -->
          <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;" id="stickerCategoryPills">
            ${[
              { id: 'all', label: '✨ All Stickers' },
              { id: 'tech', label: '💻 Cyber & Tech' },
              { id: 'kawaii', label: '🐱 Kawaii & Cute' },
              { id: 'badges', label: '🏷️ Badges & Status' },
              { id: 'reactions', label: '🔥 Reactions & Memes' },
              { id: 'security', label: '🛡️ Vault & Security' },
              { id: 'custom', label: '⭐ My Custom' }
            ].map(c => `
              <button class="studio-subtab ${stickerCategory === c.id ? 'active' : ''}" 
                onclick="window.setStickerCategory('${c.id}')" 
                style="white-space:nowrap;font-size:12px;padding:5px 12px;">
                ${c.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Stickers Grid -->
        <div id="stickersGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(170px, 1fr));gap:12px;">
        </div>
      </div>
    `;

    window.refreshStickersGrid();
  };

  window.refreshStickersGrid = function () {
    const grid = document.getElementById('stickersGrid');
    if (!grid) return;

    let all = [...DEFAULT_STICKERS, ...customStickersList];

    if (stickerCategory === 'custom') {
      all = customStickersList;
    } else if (stickerCategory !== 'all') {
      all = all.filter(s => s.category === stickerCategory);
    }

    if (stickerSearchQuery) {
      const q = stickerSearchQuery.toLowerCase();
      all = all.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.label && s.label.toLowerCase().includes(q)) ||
        (s.emoji && s.emoji.includes(q))
      );
    }

    if (all.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">
          No stickers found. Create one with the "Create Custom Sticker" button!
        </div>
      `;
      return;
    }

    grid.innerHTML = all.map(s => `
      <div class="sticker-card" onclick="window.onStickerCardClick('${esc(s.id)}')" 
        style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px;display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.15s, border-color 0.15s;"
        onmouseenter="this.style.borderColor='${s.border || 'var(--accent)'}';this.style.transform='translateY(-3px)'"
        onmouseleave="this.style.borderColor='var(--border)';this.style.transform='none'">
        <!-- Sticker Badge Display -->
        <div style="background:${s.bg || '#1e1b4b'};border:2px solid ${s.border || '#818cf8'};border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,0.3);width:100%;text-align:center;">
          <span style="font-size:32px;">${s.emoji || '✨'}</span>
          <span style="font-size:11px;font-weight:800;color:${s.color || '#fff'};letter-spacing:0.5px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">
            ${esc(s.label || s.name)}
          </span>
        </div>
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-top:8px;text-align:center;">
          ${esc(s.name)}
        </div>
        <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;justify-content:center;">
          <button class="btn btn-secondary" onclick="event.stopPropagation();window.copyStickerBadge('${esc(s.id)}')" style="font-size:10.5px;padding:2px 6px;" title="Copy Emoji & Text">
            📋 Copy
          </button>
          <button class="btn btn-secondary" onclick="event.stopPropagation();window.attachStickerToTask('${esc(s.id)}')" style="font-size:10.5px;padding:2px 6px;" title="Attach to Task">
            ✅ Task
          </button>
          <button class="btn btn-secondary" onclick="event.stopPropagation();window.downloadStickerPng('${esc(s.id)}')" style="font-size:10.5px;padding:2px 6px;" title="Download PNG">
            💾 PNG
          </button>
          ${s.category === 'custom' ? `
            <button class="btn btn-secondary" onclick="event.stopPropagation();window.deleteCustomSticker('${esc(s.id)}')" style="font-size:10.5px;padding:2px 6px;color:var(--red);" title="Delete custom sticker from database">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  };

  window.onStickerSearchInput = function (val) {
    stickerSearchQuery = val;
    window.refreshStickersGrid();
  };

  window.setStickerCategory = function (cat) {
    stickerCategory = cat;
    const pills = document.querySelectorAll('#stickerCategoryPills button');
    pills.forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    window.refreshStickersGrid();
  };

  // Stamp sticker onto moodboard canvas
  window.onStickerCardClick = function (id) {
    const all = [...DEFAULT_STICKERS, ...customStickersList];
    const s = all.find(x => x.id === id);
    if (!s) return;

    window.playSoundEffect('pop');

    const emptyHint = document.getElementById('stickerCanvasEmptyHint');
    if (emptyHint) emptyHint.style.display = 'none';

    const canvasArea = document.getElementById('stickerCanvasItems');
    if (!canvasArea) return;

    const posX = Math.floor(Math.random() * 60 + 10);
    const posY = Math.floor(Math.random() * 50 + 10);
    const rot = Math.floor(Math.random() * 24 - 12);

    const stampEl = document.createElement('div');
    stampEl.style.cssText = `
      position:absolute;left:${posX}%;top:${posY}%;transform:rotate(${rot}deg);
      background:${s.bg};border:2px solid ${s.border};border-radius:10px;padding:8px 12px;
      display:inline-flex;flex-direction:column;align-items:center;gap:3px;
      box-shadow:0 6px 16px rgba(0,0,0,0.5);cursor:move;user-select:none;transition:transform 0.1s;
    `;
    stampEl.innerHTML = `
      <span style="font-size:26px;">${s.emoji}</span>
      <span style="font-size:10px;font-weight:800;color:${s.color};letter-spacing:0.5px;">${esc(s.label || s.name)}</span>
    `;

    // Make draggable inside canvas
    let isDragging = false;
    let startX, startY, origX, origY;

    stampEl.onmousedown = function (e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origX = stampEl.offsetLeft;
      origY = stampEl.offsetTop;
      stampEl.style.zIndex = '100';

      function onMouseMove(ev) {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        stampEl.style.left = (origX + dx) + 'px';
        stampEl.style.top = (origY + dy) + 'px';
      }

      function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    stampEl.ondblclick = function () {
      stampEl.remove();
      window.playSoundEffect('click');
    };

    canvasArea.appendChild(stampEl);
    if (typeof toast === 'function') toast(`✓ Stamped ${s.name} on canvas! (Double click sticker to remove)`);
  };

  window.clearStickerCanvas = function () {
    const canvasArea = document.getElementById('stickerCanvasItems');
    if (canvasArea) canvasArea.innerHTML = '';
    const emptyHint = document.getElementById('stickerCanvasEmptyHint');
    if (emptyHint) emptyHint.style.display = 'block';
    if (typeof toast === 'function') toast('Canvas cleared');
  };

  window.copyStickerBadge = function (id) {
    const all = [...DEFAULT_STICKERS, ...customStickersList];
    const s = all.find(x => x.id === id);
    if (!s) return;
    const txt = `${s.emoji} [${s.label || s.name}]`;
    if (typeof copyText === 'function') {
      copyText(txt);
    } else {
      navigator.clipboard.writeText(txt);
    }
    window.playSoundEffect('success');
    if (typeof toast === 'function') toast(`Copied sticker: ${txt}`);
  };

  window.attachStickerToTask = function (id) {
    const all = [...DEFAULT_STICKERS, ...customStickersList];
    const s = all.find(x => x.id === id);
    if (!s) return;
    if (typeof showTodoForm === 'function') {
      showTodoForm(null, `${s.emoji} [${s.label || s.name}] `);
    } else {
      toast(`Attach sticker to task: ${s.name}`);
    }
  };

  // Render sticker to high-res PNG canvas and trigger download
  window.downloadStickerPng = function (id) {
    const all = [...DEFAULT_STICKERS, ...customStickersList];
    const s = all.find(x => x.id === id);
    if (!s) return;

    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 512;
    const ctx = cv.getContext('2d');

    // Rounded background
    const r = 48;
    const x = 32, y = 32, w = 448, h = 448;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = s.bg || '#1e1b4b';
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = s.border || '#818cf8';
    ctx.stroke();

    // Emoji icon
    ctx.font = '160px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.emoji || '✨', 256, 210);

    // Label banner text
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = s.color || '#ffffff';
    ctx.fillText((s.label || s.name).toUpperCase(), 256, 380);

    const a = document.createElement('a');
    a.download = `sticker-${s.id}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
    window.playSoundEffect('shutter');
    if (typeof toast === 'function') toast('✓ Downloaded high-res PNG sticker!');
  };

  window.exportStickerCanvasPng = function () {
    const cv = document.createElement('canvas');
    cv.width = 800;
    cv.height = 400;
    const ctx = cv.getContext('2d');

    // Fill dark background
    ctx.fillStyle = '#0d0d12';
    ctx.fillRect(0, 0, 800, 400);

    // Draw grid pattern
    ctx.fillStyle = '#222230';
    for (let x = 0; x < 800; x += 24) {
      for (let y = 0; y < 400; y += 24) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Vault Sticker Moodboard', 24, 40);

    const a = document.createElement('a');
    a.download = `sticker-moodboard-${Date.now()}.png`;
    a.href = cv.toDataURL('image/png');
    a.click();
    if (typeof toast === 'function') toast('✓ Exported moodboard image!');
  };

  // Custom Sticker Creator Modal
  window.openCustomStickerModal = function () {
    showModal('Create Custom Sticker Badge', `
      <div style="display:flex;gap:18px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
        <div id="customStickerPreview" style="background:#0f172a;border:2px solid #38bdf8;border-radius:12px;padding:12px 18px;display:flex;flex-direction:column;align-items:center;gap:6px;width:140px;margin:0 auto;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,0.4);">
          <span style="font-size:40px;" id="prevStkEmoji">🚀</span>
          <span style="font-size:12px;font-weight:800;color:#38bdf8;" id="prevStkLabel">LAUNCHED</span>
        </div>
      </div>

      <div class="form-group">
        <label>Emoji Icon *</label>
        <input type="text" id="custStkEmoji" value="🚀" oninput="window.updateCustomStickerPreview()" 
          style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:16px;" />
      </div>

      <div class="form-group">
        <label>Badge Label Text *</label>
        <input type="text" id="custStkLabel" value="LAUNCHED" oninput="window.updateCustomStickerPreview()" 
          style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);" />
      </div>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;" class="form-group">
        <div>
          <label style="font-size:11px;">Background</label>
          <input type="color" id="custStkBg" value="#0f172a" oninput="window.updateCustomStickerPreview()" style="width:100%;height:36px;border:none;background:transparent;cursor:pointer;" />
        </div>
        <div>
          <label style="font-size:11px;">Border Color</label>
          <input type="color" id="custStkBorder" value="#38bdf8" oninput="window.updateCustomStickerPreview()" style="width:100%;height:36px;border:none;background:transparent;cursor:pointer;" />
        </div>
        <div>
          <label style="font-size:11px;">Text Color</label>
          <input type="color" id="custStkColor" value="#38bdf8" oninput="window.updateCustomStickerPreview()" style="width:100%;height:36px;border:none;background:transparent;cursor:pointer;" />
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveCustomSticker()">Save Sticker</button>
      </div>
    `);
  };

  window.updateCustomStickerPreview = function () {
    const emoji = document.getElementById('custStkEmoji')?.value || '✨';
    const label = document.getElementById('custStkLabel')?.value || 'STICKER';
    const bg = document.getElementById('custStkBg')?.value || '#0f172a';
    const border = document.getElementById('custStkBorder')?.value || '#38bdf8';
    const color = document.getElementById('custStkColor')?.value || '#38bdf8';

    const prevBox = document.getElementById('customStickerPreview');
    const prevEmoji = document.getElementById('prevStkEmoji');
    const prevLabel = document.getElementById('prevStkLabel');

    if (prevBox) {
      prevBox.style.background = bg;
      prevBox.style.borderColor = border;
    }
    if (prevEmoji) prevEmoji.textContent = emoji;
    if (prevLabel) {
      prevLabel.textContent = label.toUpperCase();
      prevLabel.style.color = color;
    }
  };

  window.saveCustomSticker = function () {
    const emoji = document.getElementById('custStkEmoji').value.trim() || '✨';
    const label = document.getElementById('custStkLabel').value.trim() || 'CUSTOM';
    const bg = document.getElementById('custStkBg').value;
    const border = document.getElementById('custStkBorder').value;
    const color = document.getElementById('custStkColor').value;

    const newSticker = {
      id: 'custom-stk-' + Date.now(),
      category: 'custom',
      name: label,
      label: label.toUpperCase(),
      emoji: emoji,
      bg: bg,
      border: border,
      color: color
    };

    // Save sticker to database
    fetch('/api/stickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSticker)
    }).catch(() => {});

    // Call server-side vector badge generator
    fetch('/api/stickers/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: label.toUpperCase(), emoji, bgColor: bg, textColor: color })
    }).then(r => r.json()).then(res => {
      if (res?.sticker?.svg) {
        newSticker.svg = res.sticker.svg;
        newSticker.dataUrl = res.sticker.dataUrl;
        localStorage.setItem('vault_custom_stickers', JSON.stringify(customStickersList));
        fetch('/api/stickers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSticker)
        }).catch(() => {});
      }
    }).catch(() => {});

    customStickersList.push(newSticker);
    localStorage.setItem('vault_custom_stickers', JSON.stringify(customStickersList));
    closeModal();
    window.refreshStickersGrid();
    window.playSoundEffect('levelup');
    if (typeof toast === 'function') toast('✓ Custom vector sticker saved to database!');
  };

  window.deleteCustomSticker = function (id) {
    if (!confirm('Delete this custom sticker?')) return;
    customStickersList = customStickersList.filter(s => s.id !== id);
    localStorage.setItem('vault_custom_stickers', JSON.stringify(customStickersList));
    fetch('/api/stickers/' + id, { method: 'DELETE' }).catch(() => {});
    window.refreshStickersGrid();
    if (typeof toast === 'function') toast('Sticker deleted from database');
  };


  // ============================================================================
  // 4. FLOATING MEDIA DOCK (AMBIENT SOUNDS + VIDEO CONTROLLER)
  // ============================================================================

  window.updateFloatingDock = function () {
    let dock = document.getElementById('floatingMediaDock');
    const activeSoundCount = Object.keys(activeSoundNodes).length;
    const isVideoPlaying = !!document.getElementById('mainWebVideoElement') && !document.getElementById('mainWebVideoElement').paused;

    if (activeSoundCount === 0 && !isVideoPlaying) {
      if (dock) dock.style.display = 'none';
      return;
    }

    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'floatingMediaDock';
      dock.style.cssText = `
        position:fixed;bottom:20px;left:20px;background:var(--surface);border:1px solid var(--accent);
        border-radius:24px;padding:8px 16px;box-shadow:0 8px 24px rgba(0,0,0,0.5);z-index:9990;
        display:flex;align-items:center;gap:12px;backdrop-filter:blur(8px);
      `;
      document.body.appendChild(dock);
    }

    let statusText = '';
    if (activeSoundCount > 0 && isVideoPlaying) {
      statusText = `🎧 ${activeSoundCount} Sounds + 📹 Video Active`;
    } else if (activeSoundCount > 0) {
      statusText = `🎧 ${activeSoundCount} Ambient Sound${activeSoundCount > 1 ? 's' : ''} Playing`;
    } else if (isVideoPlaying) {
      statusText = `📹 Playing: ${currentWebVideo ? currentWebVideo.title : 'Web Video'}`;
    }

    dock.style.display = 'flex';
    dock.innerHTML = `
      <span style="font-size:12.5px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);"></span>
        ${statusText}
      </span>
      <button onclick="window.stopAllAmbientSounds()" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:3px 8px;font-size:11px;cursor:pointer;" title="Mute Sounds">
        ⏹ Mute
      </button>
      <button onclick="switchTab('websounds')" style="background:var(--accent);border:none;color:#fff;border-radius:12px;padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer;">
        Mixer ↗
      </button>
    `;
  };

  // Add CSS keyframes for sound equalizer
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes soundPulse {
      0% { height: 30%; }
      100% { height: 100%; }
    }
  `;
  document.head.appendChild(styleTag);

})();
