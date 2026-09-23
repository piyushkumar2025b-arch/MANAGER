// ============================================================================
// AI CLOUD STUDIO: Google Lyria 3 Music, Veo 3 Video, Search & Maps Grounding,
// and Gemini 3.5 Transcribe with Cloudflare R2, D1, KV & Edge Geo Integrations
// ============================================================================

(function () {
  'use strict';

  // State
  let currentMusicModel = 'lyria-3-clip-preview'; // 'lyria-3-clip-preview' or 'lyria-3-pro-preview'
  let currentMusicGenre = 'Cyberpunk Synthwave';
  let isGeneratingMusic = false;
  let activeAudioPlayer = null;
  let audioContext = null;
  let audioAnalyser = null;
  let audioSourceNode = null;
  let animVisualizerId = null;

  // Video State
  let currentVideoAspectRatio = '16:9'; // '16:9' or '9:16'
  let currentVideoResolution = '720p';
  let isGeneratingVideo = false;
  let currentVideoOperation = null;
  let videoPollInterval = null;

  // Transcribe State
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecordingMic = false;
  let recordingTimer = null;
  let recordingSeconds = 0;
  let isTranscribing = false;
  let lastTranscribedText = '';

  // Grounding State
  let isSearchGroundingLoading = false;
  let isMapsGroundingLoading = false;

  // Cloudflare Edge Geo cached info
  let cfEdgeGeo = null;

  // Detect Cloudflare Edge Geo on init
  async function fetchEdgeGeo() {
    try {
      const res = await fetch('/api/network/ping');
      if (res.ok) {
        const data = await res.json();
        if (data.clientGeo) {
          cfEdgeGeo = data.clientGeo;
        }
      }
    } catch (_) {}
  }
  fetchEdgeGeo();

  // ============================================================================
  // 1. LYRIA 3 MUSIC GENERATION STUDIO
  // ============================================================================
  const MUSIC_PROMPT_PRESETS = [
    { title: 'Neon Cyberpunk Pursuit', genre: 'Cyberpunk Synthwave', prompt: 'Fast tempo 130 BPM arpeggiated analog synthesizers with punchy sidechain bass and neon cyberpunk atmosphere' },
    { title: 'Lo-Fi Midnight Coding', genre: 'Lo-Fi Beats', prompt: 'Chill warm Rhodes electric piano with vinyl crackle, mellow acoustic drums, and relaxing rainy night melody' },
    { title: 'Epic Cinematic Sci-Fi', genre: 'Cinematic Orchestral', prompt: 'Heroic cinematic brass fanfares, rising hybrid string ensembles, and thunderous sub-bass impacts for a spacecraft launch' },
    { title: 'Ambient Zen Temple', genre: 'Ambient Meditation', prompt: 'Serene Tibetan singing bowls, flowing water streams, deep meditative bamboo flute, and peaceful spatial drone' },
    { title: 'Heavy Cyber Metal Riff', genre: 'Industrial Rock', prompt: 'Aggressive drop-tuned 8-string electric guitar distortion with industrial synth bass and energetic live rock drums' },
    { title: 'Retro 80s Disco Funk', genre: 'Nu-Disco / Funk', prompt: 'Groovy slapping bassline, clean Nile Rodgers funk guitar rhythm, bright synth horns, and upbeat 120 BPM drum groove' }
  ];

  window.renderLyriaMusicStudio = async function () {
    const content = document.getElementById('mainContent');
    if (!content) return;

    // Render Studio Subnav if available
    let subnavHtml = '';
    if (typeof window.renderStudioSubNav === 'function') {
      subnavHtml = window.renderStudioSubNav('musicgen');
    }

    content.innerHTML = `
      ${subnavHtml}
      <div class="ai-studio-container" style="max-width:1200px;margin:0 auto;padding-bottom:40px;">
        <!-- HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
          <div>
            <div style="font-size:22px;font-weight:700;display:flex;align-items:center;gap:10px;">
              <span>🎵</span> Google Lyria 3 Music Studio
              <span class="badge" style="background:rgba(124,106,247,0.15);color:var(--accent);border:1px solid rgba(124,106,247,0.3);font-size:11px;">
                ☁️ Cloudflare R2 / D1 Edge Persistence
              </span>
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">
              Generate original studio-quality musical compositions and loops using <code>lyria-3-clip-preview</code> (up to 30s clips) and <code>lyria-3-pro-preview</code> (full-length tracks).
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="filter-pill" onclick="window.loadMusicCreationsGallery()" style="display:flex;align-items:center;gap:5px;">
              <span>📁</span> Music Vault Gallery
            </button>
          </div>
        </div>

        <!-- GENERATOR CARD -->
        <div class="ai-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-bottom:16px;">
            <!-- MODEL SELECTOR -->
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;">
                AI Music Model
              </label>
              <div style="display:flex;gap:8px;">
                <button type="button" class="filter-pill ${currentMusicModel === 'lyria-3-clip-preview' ? 'active' : ''}" 
                  id="btnModelClip" onclick="window.setLyriaModel('lyria-3-clip-preview')"
                  style="flex:1;padding:10px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;">
                  <span style="font-weight:700;font-size:13px;">⚡ Lyria 3 Clip</span>
                  <span style="font-size:11px;opacity:0.8;">Up to 30s Loops & Riffs</span>
                </button>
                <button type="button" class="filter-pill ${currentMusicModel === 'lyria-3-pro-preview' ? 'active' : ''}" 
                  id="btnModelPro" onclick="window.setLyriaModel('lyria-3-pro-preview')"
                  style="flex:1;padding:10px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;">
                  <span style="font-weight:700;font-size:13px;">🎼 Lyria 3 Pro</span>
                  <span style="font-size:11px;opacity:0.8;">Full-Length Rich Tracks</span>
                </button>
              </div>
            </div>

            <!-- GENRE / STYLE -->
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;">
                Genre & Sound Signature
              </label>
              <input type="text" id="musicGenreInput" value="${currentMusicGenre}" placeholder="e.g. Cyberpunk Synthwave, Lo-Fi, Cinematic, Heavy Rock"
                style="width:100%;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;outline:none;" />
            </div>
          </div>

          <!-- PROMPT INPUT -->
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;">
              Composition Prompt & Mood
            </label>
            <textarea id="musicPromptInput" rows="3" placeholder="Describe the musical composition, instruments, tempo, dynamics, and atmospheric vibes..."
              style="width:100%;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:14px;line-height:1.5;outline:none;resize:vertical;">Fast tempo 130 BPM arpeggiated analog synthesizers with punchy sidechain bass and neon cyberpunk atmosphere</textarea>
          </div>

          <!-- CURATED PRESETS -->
          <div style="margin-bottom:18px;">
            <div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">
              Curated Style Presets:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${MUSIC_PROMPT_PRESETS.map((p, idx) => `
                <button type="button" class="dict-synonym-pill" onclick="window.applyMusicPreset(${idx})"
                  style="border-color:rgba(124,106,247,0.25);font-size:12px;padding:5px 10px;">
                  🎵 ${p.title}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- ACTION BUTTONS -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="btn btn-primary" id="btnGenerateMusic" onclick="window.generateLyriaMusic()"
                style="padding:12px 24px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px;">
                <span>✨</span> Generate Lyria Music
              </button>
            </div>
            <div id="musicGenStatus" style="font-size:13px;color:var(--muted);display:none;"></div>
          </div>
        </div>

        <!-- PLAYER & VISUALIZER STAGE -->
        <div id="musicPlayerStage" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
            <div>
              <div style="font-weight:700;font-size:18px;display:flex;align-items:center;gap:8px;" id="currentTrackTitle">
                <span>🎧</span> Track Playing
              </div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px;" id="currentTrackSub">
                Synthesized via Google Lyria 3
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary" id="btnDownloadMusicWav" onclick="window.downloadCurrentMusicWav()" style="padding:8px 14px;font-size:12px;">
                ⬇️ Download WAV
              </button>
              <button class="btn btn-secondary" id="btnSaveMusicDrive" onclick="window.saveCurrentMusicToDrive()" style="padding:8px 14px;font-size:12px;border-color:var(--accent);color:var(--accent);">
                ☁️ Save to Cloudflare Drive (R2)
              </button>
            </div>
          </div>

          <!-- WEB AUDIO WAVEFORM VISUALIZER CANVAS -->
          <div style="position:relative;background:#080b14;border-radius:var(--radius-sm);overflow:hidden;border:1px solid rgba(124,106,247,0.2);margin-bottom:16px;">
            <canvas id="musicSpectrumCanvas" width="1000" height="120" style="width:100%;height:120px;display:block;"></canvas>
            <div style="position:absolute;top:10px;right:14px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent);letter-spacing:1px;" id="musicLiveBadge">
              ● WEB AUDIO 32-BAND FFT SPECTRUM
            </div>
          </div>

          <!-- HTML5 AUDIO ELEMENT -->
          <audio id="lyriaAudioEl" controls style="width:100%;outline:none;border-radius:var(--radius-sm);"></audio>

          <!-- LYRICS / METADATA ACCORDION -->
          <div id="musicLyricsBox" style="display:none;margin-top:16px;padding:12px 16px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
            <div style="font-weight:600;font-size:12px;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">
              Composition Lyrics / Structure:
            </div>
            <div id="musicLyricsContent" style="font-size:13px;line-height:1.6;white-space:pre-wrap;color:var(--text);"></div>
          </div>
        </div>

        <!-- RECENT CREATIONS GALLERY -->
        <div class="ai-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <span style="font-weight:700;font-size:16px;display:flex;align-items:center;gap:6px;">
              <span>📁</span> Cloudflare D1 & R2 Music Gallery
            </span>
            <button class="filter-pill" onclick="window.loadMusicCreationsGallery()" style="font-size:12px;padding:4px 10px;">
              🔄 Refresh
            </button>
          </div>
          <div id="musicGalleryGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:12px;">
            <div style="color:var(--muted);font-size:13px;padding:20px;text-align:center;grid-column:1/-1;">
              Loading saved compositions from database...
            </div>
          </div>
        </div>
      </div>
    `;

    window.loadMusicCreationsGallery();
  };

  window.setLyriaModel = function (model) {
    currentMusicModel = model;
    const btnClip = document.getElementById('btnModelClip');
    const btnPro = document.getElementById('btnModelPro');
    if (btnClip) btnClip.classList.toggle('active', model === 'lyria-3-clip-preview');
    if (btnPro) btnPro.classList.toggle('active', model === 'lyria-3-pro-preview');
  };

  window.applyMusicPreset = function (idx) {
    const p = MUSIC_PROMPT_PRESETS[idx];
    if (!p) return;
    const promptInput = document.getElementById('musicPromptInput');
    const genreInput = document.getElementById('musicGenreInput');
    if (promptInput) promptInput.value = p.prompt;
    if (genreInput) genreInput.value = p.genre;
    if (typeof toast === 'function') toast(`Applied preset: ${p.title}`);
  };

  let currentGeneratedTrack = null;

  window.generateLyriaMusic = async function () {
    const promptInput = document.getElementById('musicPromptInput');
    const genreInput = document.getElementById('musicGenreInput');
    const btn = document.getElementById('btnGenerateMusic');
    const status = document.getElementById('musicGenStatus');

    const prompt = promptInput ? promptInput.value.trim() : '';
    const genre = genreInput ? genreInput.value.trim() : '';

    if (!prompt) {
      if (typeof toast === 'function') toast('Please enter a music prompt');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> Generating with ${currentMusicModel === 'lyria-3-pro-preview' ? 'Lyria 3 Pro' : 'Lyria 3'}…`;
    }
    if (status) {
      status.style.display = 'block';
      status.textContent = 'Streaming audio synthesis from Google Lyria 3 model...';
    }

    try {
      const res = await fetch('/api/ai/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: currentMusicModel,
          genre,
          title: prompt.slice(0, 36)
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Music generation failed');
      }

      currentGeneratedTrack = data;

      // Show Player Stage
      const stage = document.getElementById('musicPlayerStage');
      if (stage) stage.style.display = 'block';

      const trackTitle = document.getElementById('currentTrackTitle');
      if (trackTitle) trackTitle.innerHTML = `<span>🎧</span> ${data.title || 'Generated Lyria Track'}`;

      const trackSub = document.getElementById('currentTrackSub');
      if (trackSub) trackSub.textContent = `Model: ${data.model} • Duration: ${data.duration} • Format: ${data.mimeType}`;

      const audioEl = document.getElementById('lyriaAudioEl');
      if (audioEl && data.audioBase64) {
        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        audioEl.src = audioSrc;
        audioEl.play().catch(() => {});
        setupWebAudioVisualizer(audioEl);
      }

      const lyricsBox = document.getElementById('musicLyricsBox');
      const lyricsContent = document.getElementById('musicLyricsContent');
      if (lyricsBox && lyricsContent) {
        if (data.lyrics && data.lyrics.trim()) {
          lyricsBox.style.display = 'block';
          lyricsContent.textContent = data.lyrics;
        } else {
          lyricsBox.style.display = 'none';
        }
      }

      if (typeof toast === 'function') toast('✓ Music generation complete!');
      window.loadMusicCreationsGallery();

    } catch (err) {
      console.error('Lyria generation error:', err);
      if (typeof toast === 'function') toast(`⚠️ ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>✨</span> Generate Lyria Music';
      }
      if (status) status.style.display = 'none';
    }
  };

  window.downloadCurrentMusicWav = function () {
    if (!currentGeneratedTrack || !currentGeneratedTrack.audioBase64) {
      if (typeof toast === 'function') toast('No generated audio track to download');
      return;
    }
    const a = document.createElement('a');
    a.href = `data:${currentGeneratedTrack.mimeType || 'audio/wav'};base64,${currentGeneratedTrack.audioBase64}`;
    a.download = `vault_lyria_${Date.now()}.wav`;
    a.click();
    if (typeof toast === 'function') toast('Downloaded WAV file!');
  };

  window.saveCurrentMusicToDrive = async function () {
    if (!currentGeneratedTrack || !currentGeneratedTrack.audioBase64) {
      if (typeof toast === 'function') toast('No track ready to save');
      return;
    }
    try {
      const res = await fetch('/api/ai/save-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `Lyria_${(currentGeneratedTrack.title || 'Track').replace(/\s+/g, '_')}_${Date.now()}.wav`,
          content: `data:${currentGeneratedTrack.mimeType || 'audio/wav'};base64,${currentGeneratedTrack.audioBase64}`,
          mime_type: currentGeneratedTrack.mimeType || 'audio/wav',
          item_type: 'music'
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save to Drive');
      if (typeof toast === 'function') toast('✓ Saved music composition to Cloudflare Drive (R2)!');
    } catch (err) {
      if (typeof toast === 'function') toast(`⚠️ ${err.message}`);
    }
  };

  window.loadMusicCreationsGallery = async function () {
    const grid = document.getElementById('musicGalleryGrid');
    if (!grid) return;
    try {
      const res = await fetch('/api/ai/music/list');
      const data = await res.json();
      const tracks = data.tracks || [];

      if (!tracks.length) {
        grid.innerHTML = `
          <div style="color:var(--muted);font-size:13px;padding:24px;text-align:center;grid-column:1/-1;">
            No musical tracks generated yet. Click "Generate Lyria Music" above to create your first track!
          </div>
        `;
        return;
      }

      grid.innerHTML = tracks.map(t => {
        let meta = {};
        try { meta = JSON.parse(t.metadata || '{}'); } catch (_) {}
        return `
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">
            <div>
              <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px;">
                <span>🎵</span> ${esc(t.title || 'Lyria Track')}
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px;">
                Model: <code>${esc(t.model)}</code> • ${esc(meta.genre || 'General')}
              </div>
              <div style="font-size:12px;color:var(--text);margin-top:6px;line-height:1.4;">
                "${esc(t.prompt)}"
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;border-top:1px solid var(--border);padding-top:8px;">
              <span style="font-size:11px;color:var(--muted);">${new Date(t.created_at).toLocaleDateString()}</span>
              <div style="display:flex;gap:6px;">
                <button class="btn-sm" onclick="window.playStoredCreation('${t.id}')" style="background:rgba(124,106,247,0.15);color:var(--accent);border:1px solid rgba(124,106,247,0.3);padding:4px 8px;border-radius:4px;cursor:pointer;">
                  ▶ Play
                </button>
                <button class="btn-sm" onclick="window.deleteCreation('${t.id}')" style="background:transparent;color:var(--red);border:none;padding:4px 8px;cursor:pointer;">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      grid.innerHTML = `<div style="color:var(--red);font-size:12px;padding:12px;grid-column:1/-1;">Failed to load music creations: ${e.message}</div>`;
    }
  };

  window.deleteCreation = async function (id) {
    if (!confirm('Delete this AI creation from database?')) return;
    try {
      await fetch('/api/ai/creations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      window.loadMusicCreationsGallery();
    } catch (_) {}
  };

  function setupWebAudioVisualizer(audioEl) {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (!audioAnalyser) {
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 64;
      }

      if (!audioSourceNode) {
        audioSourceNode = audioContext.createMediaElementSource(audioEl);
        audioSourceNode.connect(audioAnalyser);
        audioAnalyser.connect(audioContext.destination);
      }

      const canvas = document.getElementById('musicSpectrumCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const bufferLength = audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function renderFrame() {
        animVisualizerId = requestAnimationFrame(renderFrame);
        audioAnalyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#080b14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          gradient.addColorStop(0, '#a78bfa');
          gradient.addColorStop(0.5, '#7c6af7');
          gradient.addColorStop(1, '#38bdf8');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 4, barHeight);
          x += barWidth;
        }
      }

      if (animVisualizerId) cancelAnimationFrame(animVisualizerId);
      renderFrame();
    } catch (err) {
      console.warn('Web Audio Spectrum setup note:', err);
    }
  }

  // ============================================================================
  // 2. AUDIO TRANSCRIPTION VIA GEMINI-3.5-TRANSCRIBE WITH MICROPHONE CAPTURE
  // ============================================================================
  window.renderAudioTranscribeStudio = function () {
    const content = document.getElementById('mainContent');
    if (!content) return;

    let subnavHtml = '';
    if (typeof window.renderStudioSubNav === 'function') {
      subnavHtml = window.renderStudioSubNav('transcribe');
    }

    content.innerHTML = `
      ${subnavHtml}
      <div class="ai-studio-container" style="max-width:1100px;margin:0 auto;padding-bottom:40px;">
        <!-- HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
          <div>
            <div style="font-size:22px;font-weight:700;display:flex;align-items:center;gap:10px;">
              <span>🎙️</span> AI Audio Transcription Studio
              <span class="badge" style="background:rgba(16,185,129,0.15);color:var(--green);border:1px solid rgba(16,185,129,0.3);font-size:11px;">
                model: gemini-3.5-transcribe
              </span>
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">
              Dictate hands-free via live microphone recording or upload audio files to transcribe verbatim speech into actionable tasks, notes, and records.
            </div>
          </div>
        </div>

        <!-- MAIN INTERACTION CARD -->
        <div class="ai-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px;align-items:center;">
            <!-- MICROPHONE RECORDING SECTION -->
            <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px;background:var(--surface2);border-radius:var(--radius);border:1px dashed var(--border);">
              <div id="micRecordButton" onclick="window.toggleStudioMicRecording()"
                style="width:90px;height:90px;border-radius:50%;background:${isRecordingMic ? '#ef4444' : 'var(--accent)'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:36px;cursor:pointer;box-shadow:${isRecordingMic ? '0 0 24px rgba(239,68,68,0.6)' : '0 0 20px rgba(124,106,247,0.3)'};transition:all 0.2s ease;">
                ${isRecordingMic ? '⏹' : '🎙️'}
              </div>
              <div style="font-weight:700;font-size:16px;margin-top:14px;" id="micStatusLabel">
                ${isRecordingMic ? 'Recording in progress...' : 'Click Mic to Start Recording'}
              </div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:${isRecordingMic ? 'var(--red)' : 'var(--muted)'};margin-top:4px;" id="micTimerDisplay">
                ${formatTimer(recordingSeconds)}
              </div>
              <div style="font-size:12px;color:var(--muted);margin-top:8px;">
                High-fidelity audio stream captured via browser WebRTC
              </div>
            </div>

            <!-- FILE UPLOAD SECTION -->
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="font-size:14px;font-weight:700;">Or Upload Recorded Audio File:</div>
              <div id="audioDropZone" ondragover="event.preventDefault();this.style.borderColor='var(--accent)';" ondragleave="this.style.borderColor='var(--border)';" ondrop="window.handleAudioFileDrop(event)"
                style="border:2px dashed var(--border);border-radius:var(--radius-sm);padding:24px;text-align:center;background:var(--surface2);cursor:pointer;"
                onclick="document.getElementById('audioFileInput').click()">
                <div style="font-size:28px;margin-bottom:6px;">📁</div>
                <div style="font-size:13px;font-weight:600;">Drag & drop audio file or click to browse</div>
                <div style="font-size:11px;color:var(--muted);margin-top:4px;">Supported: WAV, MP3, WebM, OGG, M4A</div>
                <input type="file" id="audioFileInput" accept="audio/*" style="display:none;" onchange="window.handleAudioFileSelect(event)" />
              </div>

              <!-- SYSTEM INSTRUCTION PROMPT -->
              <div>
                <label style="display:block;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">
                  Transcription Guidance Prompt (Optional)
                </label>
                <input type="text" id="transcribePromptInput" placeholder="e.g. Transcribe with punctuation, format as task bullets, or preserve technical terms"
                  style="width:100%;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;outline:none;" />
              </div>
            </div>
          </div>
        </div>

        <!-- TRANSCRIPTION RESULT BOX -->
        <div id="transcriptionResultCard" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;font-weight:700;">📝 Verbatim Transcript</span>
              <span class="badge" style="background:rgba(124,106,247,0.12);color:var(--accent);font-size:11px;" id="transcribeModelBadge">
                gemini-3.5-transcribe
              </span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="filter-pill" onclick="window.copyTranscribedText()">
                📋 Copy Text
              </button>
              <button class="filter-pill" onclick="window.convertTranscriptToTask()">
                ✅ Create Task
              </button>
              <button class="filter-pill" onclick="window.convertTranscriptToNote()">
                💳 Save as Note
              </button>
              <button class="filter-pill" onclick="window.sendTranscriptToCopilot()">
                🤖 Ask AI Copilot
              </button>
            </div>
          </div>

          <div id="transcribedTextOutput" style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;font-size:14px;line-height:1.6;color:var(--text);white-space:pre-wrap;min-height:100px;"></div>
        </div>
      </div>
    `;
  };

  function formatTimer(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  window.toggleStudioMicRecording = async function () {
    if (isRecordingMic) {
      window.stopStudioMicRecording();
    } else {
      await window.startStudioMicRecording();
    }
  };

  window.startStudioMicRecording = async function () {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await executeTranscription(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      isRecordingMic = true;
      recordingSeconds = 0;

      const btn = document.getElementById('micRecordButton');
      const label = document.getElementById('micStatusLabel');
      const timer = document.getElementById('micTimerDisplay');

      if (btn) {
        btn.style.background = '#ef4444';
        btn.style.boxShadow = '0 0 24px rgba(239,68,68,0.6)';
        btn.innerHTML = '⏹';
      }
      if (label) label.textContent = 'Recording speech... Click to Stop & Transcribe';

      recordingTimer = setInterval(() => {
        recordingSeconds++;
        if (timer) timer.textContent = formatTimer(recordingSeconds);
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      if (typeof toast === 'function') toast(`Microphone error: ${err.message}`);
    }
  };

  window.stopStudioMicRecording = function () {
    if (mediaRecorder && isRecordingMic) {
      mediaRecorder.stop();
      isRecordingMic = false;
      clearInterval(recordingTimer);

      const btn = document.getElementById('micRecordButton');
      const label = document.getElementById('micStatusLabel');

      if (btn) {
        btn.style.background = 'var(--accent)';
        btn.style.boxShadow = '0 0 20px rgba(124,106,247,0.3)';
        btn.innerHTML = '⏳';
      }
      if (label) label.textContent = 'Transcribing audio with gemini-3.5-transcribe...';
    }
  };

  window.handleAudioFileSelect = function (e) {
    const file = e.target.files?.[0];
    if (file) executeTranscription(file);
  };

  window.handleAudioFileDrop = function (e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) executeTranscription(file);
  };

  async function executeTranscription(blobOrFile) {
    const resultCard = document.getElementById('transcriptionResultCard');
    const output = document.getElementById('transcribedTextOutput');
    const promptInput = document.getElementById('transcribePromptInput');
    const guidancePrompt = promptInput ? promptInput.value.trim() : '';

    if (resultCard) resultCard.style.display = 'block';
    if (output) output.textContent = 'Transcribing with gemini-3.5-transcribe... Please wait.';

    try {
      const arrayBuf = await blobOrFile.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(arrayBuf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64Audio = btoa(binary);

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: blobOrFile.type || 'audio/webm',
          prompt: guidancePrompt
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Transcription failed');

      lastTranscribedText = data.text || '';
      if (output) output.textContent = lastTranscribedText;

      const badge = document.getElementById('transcribeModelBadge');
      if (badge) badge.textContent = data.model || 'gemini-3.5-transcribe';

      const micBtn = document.getElementById('micRecordButton');
      const micLabel = document.getElementById('micStatusLabel');
      if (micBtn) micBtn.innerHTML = '🎙️';
      if (micLabel) micLabel.textContent = 'Click Mic to Start Recording';

      if (typeof toast === 'function') toast('✓ Audio transcribed successfully!');
    } catch (err) {
      if (output) output.textContent = `Error transcribing audio: ${err.message}`;
      if (typeof toast === 'function') toast(`⚠️ ${err.message}`);
    }
  }

  window.copyTranscribedText = function () {
    if (!lastTranscribedText) return;
    navigator.clipboard.writeText(lastTranscribedText);
    if (typeof toast === 'function') toast('Copied transcript to clipboard! 📋');
  };

  window.convertTranscriptToTask = function () {
    if (!lastTranscribedText) return;
    if (typeof switchTab === 'function') switchTab('todos');
    setTimeout(() => {
      if (typeof showTodoForm === 'function') {
        showTodoForm(null, { title: lastTranscribedText.slice(0, 50), description: lastTranscribedText });
      }
    }, 200);
  };

  window.convertTranscriptToNote = function () {
    if (!lastTranscribedText) return;
    if (typeof switchTab === 'function') switchTab('cards');
    setTimeout(() => {
      if (typeof showPasswordForm === 'function') {
        showPasswordForm(null, 'note', { title: 'Voice Note ' + new Date().toLocaleDateString(), description: lastTranscribedText });
      }
    }, 200);
  };

  window.sendTranscriptToCopilot = function () {
    if (!lastTranscribedText) return;
    if (typeof switchTab === 'function') switchTab('assistant');
    setTimeout(() => {
      const input = document.getElementById('chatInput');
      if (input) {
        input.value = lastTranscribedText;
        input.focus();
      }
    }, 200);
  };

  // ============================================================================
  // 3. VEO 3 VIDEO GENERATION STUDIO (veo-3.1-fast-generate-preview 16:9 / 9:16)
  // ============================================================================
  const VEO_VIDEO_PROMPTS = [
    { title: 'Neon Cyberpunk Drone', prompt: 'Cinematic wide drone flyover across a futuristic neon cyberpunk metropolis with glowing holograms, flying vehicles, and rain-slicked skyscrapers at night' },
    { title: 'Quantum Vault Breach', prompt: 'Close up shot of an intricate mechanical cyber vault lock turning and emitting blue laser light pulses as it smoothly unlocks' },
    { title: 'Golden Hour Mountain Range', prompt: 'Breathtaking 4K landscape flyover over snow-capped alpine mountains bathed in warm golden hour sunset light with mist rising through pine forests' },
    { title: 'Hyperdrive Warp Speed', prompt: 'First-person cockpit view of a sleek futuristic spacecraft engaging hyperdrive with stars stretching into relativistic light streaks' }
  ];

  window.renderVeoVideoStudio = function () {
    const content = document.getElementById('mainContent');
    if (!content) return;

    let subnavHtml = '';
    if (typeof window.renderStudioSubNav === 'function') {
      subnavHtml = window.renderStudioSubNav('videogen');
    }

    content.innerHTML = `
      ${subnavHtml}
      <div class="ai-studio-container" style="max-width:1200px;margin:0 auto;padding-bottom:40px;">
        <!-- HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
          <div>
            <div style="font-size:22px;font-weight:700;display:flex;align-items:center;gap:10px;">
              <span>🎬</span> Google Veo 3 Video Generation
              <span class="badge" style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid #38bdf8;font-size:11px;">
                model: veo-3.1-fast-generate-preview
              </span>
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;">
              Generate photorealistic cinematic videos in 16:9 (landscape) or 9:16 (portrait) aspect ratios using Google DeepMind's Veo 3 AI engine.
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="filter-pill" onclick="if(typeof renderVideoStudioProcedural === 'function') renderVideoStudioProcedural();" style="display:flex;align-items:center;gap:5px;">
              <span>⚙️</span> 60FPS Procedural Canvas Engine
            </button>
          </div>
        </div>

        <!-- VEO VIDEO PROMPT CARD -->
        <div class="ai-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-bottom:16px;">
            <!-- ASPECT RATIO SELECTOR -->
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;">
                Aspect Ratio (Strict Constraint: 16:9 or 9:16)
              </label>
              <div style="display:flex;gap:8px;">
                <button type="button" class="filter-pill ${currentVideoAspectRatio === '16:9' ? 'active' : ''}" id="btnAspect169"
                  onclick="window.setVideoAspect('16:9')" style="flex:1;padding:10px 14px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;">
                  <span>🖥️</span> 16:9 Landscape
                </button>
                <button type="button" class="filter-pill ${currentVideoAspectRatio === '9:16' ? 'active' : ''}" id="btnAspect916"
                  onclick="window.setVideoAspect('9:16')" style="flex:1;padding:10px 14px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;">
                  <span>📱</span> 9:16 Portrait
                </button>
              </div>
            </div>

            <!-- RESOLUTION -->
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;">
                Resolution
              </label>
              <select id="videoResolutionSelect" class="ai-select" style="width:100%;padding:10px 14px;">
                <option value="720p" selected>720p Fast Preview (Recommended)</option>
                <option value="1080p">1080p High Definition</option>
              </select>
            </div>
          </div>

          <!-- PROMPT -->
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;">
              Cinematic Video Prompt
            </label>
            <textarea id="veoPromptInput" rows="3" placeholder="Describe the camera motion, subject, lighting, atmosphere, and visual narrative in detail..."
              style="width:100%;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:14px;line-height:1.5;outline:none;resize:vertical;">Cinematic wide drone flyover across a futuristic neon cyberpunk metropolis with glowing holograms, flying vehicles, and rain-slicked skyscrapers at night</textarea>
          </div>

          <!-- PRESETS -->
          <div style="margin-bottom:18px;">
            <div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">
              Cinematic Presets:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${VEO_VIDEO_PROMPTS.map((p, idx) => `
                <button type="button" class="dict-synonym-pill" onclick="window.applyVeoPreset(${idx})"
                  style="border-color:rgba(56,189,248,0.3);font-size:12px;padding:5px 10px;">
                  🎬 ${p.title}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- GENERATE ACTION -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <button class="btn btn-primary" id="btnGenerateVeo" onclick="window.startVeoVideoGeneration()"
              style="padding:12px 24px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px;">
              <span>🎬</span> Generate Veo 3 Video
            </button>
            <div id="veoProgressText" style="font-size:13px;color:var(--muted);display:none;"></div>
          </div>

          <!-- GENERATION PROGRESS BAR -->
          <div id="veoProgressBarWrap" style="display:none;margin-top:16px;background:var(--surface2);border-radius:8px;overflow:hidden;height:10px;border:1px solid var(--border);">
            <div id="veoProgressFill" style="height:100%;background:linear-gradient(90deg, var(--accent), #38bdf8);width:0%;transition:width 0.4s ease;"></div>
          </div>
        </div>

        <!-- VIDEO PLAYER PREVIEW STAGE -->
        <div id="veoPlayerStage" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
            <div>
              <div style="font-weight:700;font-size:18px;display:flex;align-items:center;gap:8px;">
                <span>📽️</span> Generated Veo 3 Video
              </div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px;" id="veoVideoMetadataLabel">
                Model: veo-3.1-fast-generate-preview
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary" onclick="window.downloadCurrentVeoVideo()" style="padding:8px 14px;font-size:12px;">
                ⬇️ Download MP4
              </button>
              <button class="btn btn-secondary" onclick="window.saveCurrentVeoToDrive()" style="padding:8px 14px;font-size:12px;border-color:var(--accent);color:var(--accent);">
                ☁️ Save to Cloudflare Drive (R2)
              </button>
            </div>
          </div>

          <div style="max-width:800px;margin:0 auto;border-radius:var(--radius-sm);overflow:hidden;background:#000;box-shadow:0 8px 30px rgba(0,0,0,0.3);">
            <video id="veoVideoPlayer" controls autoplay loop style="width:100%;height:auto;display:block;"></video>
          </div>
        </div>
      </div>
    `;
  };

  window.setVideoAspect = function (aspect) {
    currentVideoAspectRatio = aspect;
    const btn169 = document.getElementById('btnAspect169');
    const btn916 = document.getElementById('btnAspect916');
    if (btn169) btn169.classList.toggle('active', aspect === '16:9');
    if (btn916) btn916.classList.toggle('active', aspect === '9:16');
  };

  window.applyVeoPreset = function (idx) {
    const p = VEO_VIDEO_PROMPTS[idx];
    if (!p) return;
    const input = document.getElementById('veoPromptInput');
    if (input) input.value = p.prompt;
    if (typeof toast === 'function') toast(`Applied preset: ${p.title}`);
  };

  let activeGeneratedVideoBlob = null;

  window.startVeoVideoGeneration = async function () {
    const promptInput = document.getElementById('veoPromptInput');
    const resSelect = document.getElementById('videoResolutionSelect');
    const btn = document.getElementById('btnGenerateVeo');
    const progressText = document.getElementById('veoProgressText');
    const progressWrap = document.getElementById('veoProgressBarWrap');
    const progressFill = document.getElementById('veoProgressFill');

    const prompt = promptInput ? promptInput.value.trim() : '';
    const resolution = resSelect ? resSelect.value : '720p';

    if (!prompt) {
      if (typeof toast === 'function') toast('Please enter a video prompt');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Initializing Veo 3 Operation…';
    }
    if (progressText) {
      progressText.style.display = 'block';
      progressText.textContent = 'Submitting video request to veo-3.1-fast-generate-preview...';
    }
    if (progressWrap) progressWrap.style.display = 'block';
    if (progressFill) progressFill.style.width = '15%';

    try {
      const res = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: currentVideoAspectRatio,
          resolution
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to start video generation');

      currentVideoOperation = data.operationName;
      if (progressFill) progressFill.style.width = '35%';
      if (progressText) progressText.textContent = `Operation ${currentVideoOperation.slice(0, 24)}... Rendering video frames...`;

      // Start Polling loop
      pollVeoOperation(currentVideoOperation);

    } catch (err) {
      console.error('Veo video generation error:', err);
      if (typeof toast === 'function') toast(`⚠️ ${err.message}`);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🎬</span> Generate Veo 3 Video';
      }
      if (progressText) progressText.style.display = 'none';
      if (progressWrap) progressWrap.style.display = 'none';
    }
  };

  async function pollVeoOperation(opName) {
    let attempts = 0;
    const progressFill = document.getElementById('veoProgressFill');
    const progressText = document.getElementById('veoProgressText');
    const btn = document.getElementById('btnGenerateVeo');

    if (videoPollInterval) clearInterval(videoPollInterval);

    videoPollInterval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/ai/video/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName })
        });

        const statusData = await res.json();
        if (!res.ok || statusData.error) throw new Error(statusData.error || 'Status check failed');

        const pct = Math.min(90, 35 + attempts * 5);
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressText) progressText.textContent = `Veo 3 synthesis in progress (${attempts * 4}s elapsed)...`;

        if (statusData.done) {
          clearInterval(videoPollInterval);
          if (progressFill) progressFill.style.width = '100%';
          if (progressText) progressText.textContent = 'Video rendering complete! Downloading MP4 stream...';

          // Download video
          await downloadVeoResult(opName);
        }
      } catch (err) {
        console.warn('Veo poll error:', err);
        if (attempts > 30) {
          clearInterval(videoPollInterval);
          if (typeof toast === 'function') toast('Video generation timed out or failed');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>🎬</span> Generate Veo 3 Video';
          }
        }
      }
    }, 4000);
  }

  async function downloadVeoResult(opName) {
    const btn = document.getElementById('btnGenerateVeo');
    const stage = document.getElementById('veoPlayerStage');
    const videoEl = document.getElementById('veoVideoPlayer');
    const metaLabel = document.getElementById('veoVideoMetadataLabel');

    try {
      const res = await fetch('/api/ai/video/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: opName })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to download video');

      activeGeneratedVideoBlob = data;

      if (stage) stage.style.display = 'block';
      if (videoEl && data.videoBase64) {
        videoEl.src = `data:video/mp4;base64,${data.videoBase64}`;
        videoEl.play().catch(() => {});
      }
      if (metaLabel) {
        metaLabel.textContent = `Model: veo-3.1-fast-generate-preview • Aspect: ${currentVideoAspectRatio}`;
      }

      if (typeof toast === 'function') toast('✓ Veo 3 Video successfully generated!');
    } catch (err) {
      if (typeof toast === 'function') toast(`⚠️ ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🎬</span> Generate Veo 3 Video';
      }
    }
  }

  window.downloadCurrentVeoVideo = function () {
    if (!activeGeneratedVideoBlob || !activeGeneratedVideoBlob.videoBase64) {
      if (typeof toast === 'function') toast('No video available to download');
      return;
    }
    const a = document.createElement('a');
    a.href = `data:video/mp4;base64,${activeGeneratedVideoBlob.videoBase64}`;
    a.download = `vault_veo3_${Date.now()}.mp4`;
    a.click();
    if (typeof toast === 'function') toast('Downloaded MP4 video!');
  };

  window.saveCurrentVeoToDrive = async function () {
    if (!activeGeneratedVideoBlob || !activeGeneratedVideoBlob.videoBase64) {
      if (typeof toast === 'function') toast('No video ready to save');
      return;
    }
    try {
      const res = await fetch('/api/ai/save-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `Veo3_Video_${Date.now()}.mp4`,
          content: `data:video/mp4;base64,${activeGeneratedVideoBlob.videoBase64}`,
          mime_type: 'video/mp4',
          item_type: 'video'
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save video to Drive');
      if (typeof toast === 'function') toast('✓ Saved Veo 3 Video to Cloudflare Drive (R2)!');
    } catch (err) {
      if (typeof toast === 'function') toast(`⚠️ ${err.message}`);
    }
  };

  // ============================================================================
  // 4. GOOGLE SEARCH GROUNDING VIA GEMINI-3.5-FLASH
  // ============================================================================
  window.openSearchGroundingModal = function (initialQuery) {
    const existing = document.getElementById('searchGroundingModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'searchGroundingModal';
    overlay.className = 'modal-backdrop';
    overlay.style.display = 'flex';

    overlay.innerHTML = `
      <div class="modal-card" style="max-width:850px;width:95%;max-height:90vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
        <!-- MODAL HEADER -->
        <div style="padding:18px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface2);">
          <div style="font-weight:700;font-size:17px;display:flex;align-items:center;gap:8px;">
            <span>🌐</span> Google Search Grounding with Gemini 3.5 Flash
          </div>
          <button class="icon-btn" onclick="document.getElementById('searchGroundingModal').remove()">✕</button>
        </div>

        <!-- BODY -->
        <div style="padding:24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:16px;">
          <div style="font-size:13px;color:var(--muted);line-height:1.5;">
            Retrieves real-time verifiable web groundings using Google Search Grounding with <code>gemini-3.5-flash</code>. Queries are edge-cached in Cloudflare Workers KV for low latency.
          </div>

          <!-- INPUT -->
          <div style="display:flex;gap:8px;">
            <input type="text" id="groundingSearchInput" value="${esc(initialQuery || '')}" placeholder="Ask any real-time question (e.g. Latest SpaceX launch, TypeScript 5.8 release, today's tech news)..."
              onkeydown="if(event.key==='Enter') window.executeSearchGrounding()"
              style="flex:1;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:14px;outline:none;" />
            <button class="btn btn-primary" id="btnRunSearchGrounding" onclick="window.executeSearchGrounding()" style="padding:12px 20px;white-space:nowrap;">
              🔍 Grounded Search
            </button>
          </div>

          <!-- RESULT CONTAINER -->
          <div id="groundingSearchResultBox" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <span class="badge" style="background:rgba(34,197,94,0.15);color:var(--green);font-size:11px;" id="groundingKvBadge">
                Cloudflare Edge KV: MISS
              </span>
              <span style="font-size:12px;color:var(--muted);" id="groundingQueryCount"></span>
            </div>

            <!-- SYNTHESIZED TEXT -->
            <div id="groundingTextContent" style="font-size:14px;line-height:1.65;color:var(--text);white-space:pre-wrap;margin-bottom:18px;"></div>

            <!-- CITATION SOURCES -->
            <div id="groundingSourcesContainer" style="border-top:1px solid var(--border);padding-top:14px;">
              <div style="font-weight:700;font-size:12px;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">
                Verified Web Sources & Citations:
              </div>
              <div id="groundingSourcesList" style="display:flex;flex-direction:column;gap:6px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    if (initialQuery) {
      window.executeSearchGrounding();
    }
  };

  window.executeSearchGrounding = async function () {
    const input = document.getElementById('groundingSearchInput');
    const query = input ? input.value.trim() : '';
    if (!query) return;

    const btn = document.getElementById('btnRunSearchGrounding');
    const box = document.getElementById('groundingSearchResultBox');
    const textEl = document.getElementById('groundingTextContent');
    const sourcesList = document.getElementById('groundingSourcesList');
    const kvBadge = document.getElementById('groundingKvBadge');
    const queryCount = document.getElementById('groundingQueryCount');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Searching Google…';
    }
    if (box) box.style.display = 'block';
    if (textEl) textEl.textContent = 'Grounding query with Google Search & Gemini 3.5 Flash...';
    if (sourcesList) sourcesList.innerHTML = '';

    try {
      const res = await fetch('/api/ai/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Grounding request failed');

      if (textEl) textEl.textContent = data.text || 'No response text returned.';
      if (kvBadge) {
        const isHit = res.headers.get('CF-Cache-Status') === 'HIT' || data.cached;
        kvBadge.textContent = isHit ? '⚡ Cloudflare Edge KV: HIT (Cached)' : '🌐 Cloudflare Edge: Real-Time Live Grounding';
        kvBadge.style.color = isHit ? 'var(--accent)' : 'var(--green)';
      }

      const sources = data.grounding?.sources || [];
      const queries = data.grounding?.queries || [];

      if (queryCount) {
        queryCount.textContent = queries.length ? `Google Queries: ${queries.join(', ')}` : '';
      }

      if (sourcesList) {
        if (sources.length) {
          sourcesList.innerHTML = sources.map((s, idx) => `
            <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"
              style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);text-decoration:none;font-size:13px;transition:background 0.2s ease;">
              <span style="display:flex;align-items:center;gap:6px;">
                <span style="color:var(--accent);font-weight:700;">[${idx + 1}]</span>
                <span style="font-weight:600;">${esc(s.title)}</span>
              </span>
              <span style="font-size:11px;color:var(--muted);white-space:nowrap;margin-left:12px;">${esc(new URL(s.url).hostname)} ↗</span>
            </a>
          `).join('');
        } else {
          sourcesList.innerHTML = '<div style="font-size:12px;color:var(--muted);">No explicit web URLs returned in citation metadata.</div>';
        }
      }
    } catch (err) {
      if (textEl) textEl.textContent = `Error in Search Grounding: ${err.message}\n\nNote: If quota exhausted, please ensure your Gemini API key has Google Search Grounding quota enabled.`;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔍 Grounded Search';
      }
    }
  };

  // ============================================================================
  // 5. GOOGLE MAPS GROUNDING VIA GEMINI-3.5-FLASH WITH CLOUDFLARE EDGE GEO
  // ============================================================================
  window.openMapsGroundingModal = function () {
    const existing = document.getElementById('mapsGroundingModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mapsGroundingModal';
    overlay.className = 'modal-backdrop';
    overlay.style.display = 'flex';

    const clientCity = cfEdgeGeo?.city || '';
    const clientCountry = cfEdgeGeo?.country || '';

    overlay.innerHTML = `
      <div class="modal-card" style="max-width:850px;width:95%;max-height:90vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
        <!-- HEADER -->
        <div style="padding:18px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface2);">
          <div style="font-weight:700;font-size:17px;display:flex;align-items:center;gap:8px;">
            <span>🗺️</span> Google Maps Grounding with Gemini 3.5 Flash
          </div>
          <button class="icon-btn" onclick="document.getElementById('mapsGroundingModal').remove()">✕</button>
        </div>

        <!-- BODY -->
        <div style="padding:24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:16px;">
          <div style="font-size:13px;color:var(--muted);line-height:1.5;">
            Discover authentic local landmarks, venues, and geographical details using Google Maps Grounding with <code>gemini-3.5-flash</code>, contextualized by Cloudflare Edge Geolocation.
          </div>

          <!-- CLOUDFLARE EDGE GEO CONTEXT BADGE -->
          ${clientCity || clientCountry ? `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);border-radius:6px;font-size:12px;color:#38bdf8;">
              <span>🌐</span> Cloudflare Edge Geo Location detected: <strong>${esc(clientCity)}${clientCity && clientCountry ? ', ' : ''}${esc(clientCountry)}</strong>
            </div>
          ` : ''}

          <!-- INPUT -->
          <div style="display:flex;gap:8px;">
            <input type="text" id="mapsGroundingInput" placeholder="e.g. Best espresso bars near me, historic monuments in Kyoto, coordinates of Mount Everest..."
              onkeydown="if(event.key==='Enter') window.executeMapsGrounding()"
              style="flex:1;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:14px;outline:none;" />
            <button class="btn btn-primary" id="btnRunMapsGrounding" onclick="window.executeMapsGrounding()" style="padding:12px 20px;white-space:nowrap;">
              🗺️ Grounded Places
            </button>
          </div>

          <!-- RESULTS -->
          <div id="mapsGroundingResultBox" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px;">
            <div id="mapsGroundingText" style="font-size:14px;line-height:1.65;color:var(--text);white-space:pre-wrap;margin-bottom:18px;"></div>
            
            <div id="mapsGroundingPlacesBox" style="border-top:1px solid var(--border);padding-top:14px;display:none;">
              <div style="font-weight:700;font-size:12px;color:var(--muted);text-transform:uppercase;margin-bottom:10px;">
                Detected Venues & Coordinates (1-Click Pin to Map):
              </div>
              <div id="mapsGroundingPlacesList" style="display:flex;flex-direction:column;gap:8px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  };

  window.executeMapsGrounding = async function () {
    const input = document.getElementById('mapsGroundingInput');
    const query = input ? input.value.trim() : '';
    if (!query) return;

    const btn = document.getElementById('btnRunMapsGrounding');
    const box = document.getElementById('mapsGroundingResultBox');
    const textEl = document.getElementById('mapsGroundingText');
    const placesBox = document.getElementById('mapsGroundingPlacesBox');
    const placesList = document.getElementById('mapsGroundingPlacesList');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Querying Maps…';
    }
    if (box) box.style.display = 'block';
    if (textEl) textEl.textContent = 'Querying Google Maps Grounding with Gemini 3.5 Flash...';

    try {
      const res = await fetch('/api/ai/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          city: cfEdgeGeo?.city || '',
          country: cfEdgeGeo?.country || '',
          lat: cfEdgeGeo?.latitude,
          lng: cfEdgeGeo?.longitude
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Maps grounding query failed');

      if (textEl) textEl.textContent = data.text || 'No response text returned.';

      const places = data.places || [];
      if (placesBox && placesList) {
        if (places.length) {
          placesBox.style.display = 'block';
          placesList.innerHTML = places.map((p, idx) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:6px;">
              <div>
                <div style="font-weight:700;font-size:13px;">📍 ${esc(p.title)}</div>
                <div style="font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:2px;">
                  (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})
                </div>
              </div>
              <button class="btn btn-secondary" onclick="window.pinGroundedPlaceToMap('${esc(p.title)}', ${p.lat}, ${p.lng})" style="padding:6px 12px;font-size:12px;color:var(--accent);border-color:var(--accent);">
                📌 Pin to Map
              </button>
            </div>
          `).join('');
        } else {
          placesBox.style.display = 'none';
        }
      }
    } catch (err) {
      if (textEl) textEl.textContent = `Error querying Maps Grounding: ${err.message}\n\nNote: If quota exhausted, verify Gemini API key has Google Maps tool access enabled.`;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🗺️ Grounded Places';
      }
    }
  };

  window.pinGroundedPlaceToMap = async function (title, lat, lng) {
    try {
      const res = await fetch('/api/map/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          notes: 'Discovered via Google Maps Grounding (Gemini 3.5)',
          lat,
          lng,
          category: 'landmark',
          color: '#7c6af7'
        })
      });

      const modal = document.getElementById('mapsGroundingModal');
      if (modal) modal.remove();

      if (typeof switchTab === 'function') switchTab('map');
      setTimeout(() => {
        if (typeof flyToMapLocation === 'function') {
          flyToMapLocation(lat, lng, 14);
        }
      }, 300);

      if (typeof toast === 'function') toast(`Pinned "${title}" to Global Map! 📌`);
    } catch (err) {
      if (typeof toast === 'function') toast(`Error pinning: ${err.message}`);
    }
  };

  // ============================================================================
  // 6. MONKEY PATCH & HOOK INTO NAV TABS & SUBBARS
  // ============================================================================

  // Hook switchTab
  const originalSwitchTab = window.switchTab;
  window.switchTab = function (tab) {
    if (tab === 'musicgen') {
      window.currentTab = 'musicgen';
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      const activeTabEl = document.getElementById('tab-studio');
      if (activeTabEl) activeTabEl.classList.add('active');
      window.renderLyriaMusicStudio();
      return;
    }
    if (tab === 'transcribe') {
      window.currentTab = 'transcribe';
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      const activeTabEl = document.getElementById('tab-studio');
      if (activeTabEl) activeTabEl.classList.add('active');
      window.renderAudioTranscribeStudio();
      return;
    }
    if (tab === 'veovideo') {
      window.currentTab = 'veovideo';
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      const activeTabEl = document.getElementById('tab-studio');
      if (activeTabEl) activeTabEl.classList.add('active');
      window.renderVeoVideoStudio();
      return;
    }

    if (typeof originalSwitchTab === 'function') {
      originalSwitchTab(tab);
    }
  };

  // Hook renderStudioSubNav
  const originalRenderStudioSubNav = window.renderStudioSubNav;
  window.renderStudioSubNav = function (activeSub) {
    let base = typeof originalRenderStudioSubNav === 'function' ? originalRenderStudioSubNav(activeSub) : '<div class="studio-subbar">';
    
    // Inject our buttons if not present
    if (!base.includes("switchStudioSubtab('musicgen')")) {
      const injection = `
        <button class="studio-subtab ${activeSub === 'musicgen' ? 'active' : ''}" onclick="switchStudioSubtab('musicgen')">
          <span>🎵</span> Lyria 3 Music
        </button>
        <button class="studio-subtab ${activeSub === 'transcribe' ? 'active' : ''}" onclick="switchStudioSubtab('transcribe')">
          <span>🎙️</span> Audio Transcribe
        </button>
      `;
      base = base.replace('</div>', `${injection}</div>`);
    }
    return base;
  };

  // Save reference to procedural video studio before overriding
  window.renderVideoStudioProcedural = window.renderVideoStudio;
  window.renderVideoStudio = function () {
    window.renderVeoVideoStudio();
  };

  console.log('✓ AI Cloud Studio initialized: Lyria 3 Music, Veo 3 Video, Maps/Search Grounding, Gemini 3.5 Transcribe');
})();
