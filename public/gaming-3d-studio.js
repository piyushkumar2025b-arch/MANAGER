// ============================================================================
// GAMING & 3D MODEL STUDIO LAB (Vault Gaming & 3D Engine)
// Features:
// 1. Prompt-to-3D Model Generator with Three.js WebGL interactive viewport
// 2. Multi-format 3D Exporter (.OBJ, .STL for 3D Printing, Three.js JSON, PNG)
// 3. Model Inspector, Explode-View Dissection, Material Shaders & Wireframe
// 4. Playable 3D Games: 3D Starfighter Hyper Tunnel, 3D Cyber Pong, 3D Voxel Runner
// 5. Game Dev Asset Forge: 8-Bit Web Audio SFX Synthesizer & Pixel Art Creator
// ============================================================================

(function () {
  let activeGamingSubtab = '3dgen'; // '3dgen' | 'arcade' | 'forge' | 'library'
  let current3DRecipe = null;
  let threeScene = null;
  let threeCamera = null;
  let threeRenderer = null;
  let threeControls = null;
  let threeModelGroup = null;
  let threeAnimId = null;
  let isAutoRotate = true;
  let rotateSpeed = 0.008;
  let currentLighting = 'studio';
  let isWireframe = false;
  let explosionDistance = 0;
  let activeGameInstance = null;

  // Preset inspiration prompts
  const PROMPT_SUGGESTIONS = [
    { title: 'Aero Starfighter', prompt: 'futuristic sleek starfighter with laser cannons, swept wings, and glowing plasma thrusters', cat: 'scifi' },
    { title: 'Apex Cyber Tank', prompt: 'heavy cyber tank with armor plating, dual cannon turret, and tracks', cat: 'vehicles' },
    { title: 'Neon Arcade Cabinet', prompt: 'classic 80s arcade cabinet with glowing marquee, CRT screen, and joystick deck', cat: 'arcade' },
    { title: 'Floating Sky Island', prompt: 'low poly floating sky island with pine trees, bedrock crust, and crystal spring', cat: 'nature' },
    { title: 'Citadel Wizard Tower', prompt: 'medieval fortress tower with battlement parapets and hovering purple mana crystal', cat: 'fantasy' },
    { title: 'Titan Sentinel Mech', prompt: 'bipedal heavy assault mech with shoulder missile pods and arc reactor chest', cat: 'scifi' },
    { title: 'Runebound Blade', prompt: 'glowing plasma sword with runic channels, gilded crossguard, and mana pommel', cat: 'weapons' },
    { title: 'Ancient Treasure Chest', prompt: 'iron-banded oak treasure chest overflowing with glowing gold coins and rubies', cat: 'collectibles' },
    { title: 'Omni Cyber Drone', prompt: 'autonomous quadcopter surveillance drone with glowing optic sensor and rotor rings', cat: 'scifi' }
  ];

  // Expose global render function
  window.renderGamingStudioTab = function (initialSubtab) {
    if (initialSubtab) activeGamingSubtab = initialSubtab;
    const content = document.getElementById('mainContent');
    if (!content) return;

    // Clean up any ongoing Three.js render loop or game
    cleanupThreeViewport();
    if (activeGameInstance && typeof activeGameInstance.stop === 'function') {
      activeGameInstance.stop();
      activeGameInstance = null;
    }

    content.innerHTML = `
      <div style="max-width:1300px;margin:0 auto;padding:12px 16px 60px;">
        <!-- Top Header & Banner -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border);">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:26px;">🎮</span>
              <h1 style="font-size:22px;font-weight:700;letter-spacing:-0.4px;margin:0;">Gaming & 3D Lab</h1>
              <span style="background:linear-gradient(135deg,#7c6af7,#00f0ff);color:#0f0f13;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">Studio Pro</span>
            </div>
            <p style="color:var(--muted);font-size:13.5px;margin:4px 0 0;">
              Prompt-to-3D Model Generator, 3D WebGL Arcade, Game Dev Asset Synthesizer & Multi-Format Exporters (.OBJ / .STL).
            </p>
          </div>

          <!-- Quick Statistics / Badges -->
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:var(--radius-sm);font-size:12.5px;">
              <span style="color:#00f0ff;">🧊</span>
              <span>WebGL 3D Engine: <strong style="color:var(--green);">Active</strong></span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:var(--radius-sm);font-size:12.5px;">
              <span style="color:#f59e0b;">⚡</span>
              <span>3D Slicing: <strong style="color:var(--text);">STL & OBJ</strong></span>
            </div>
          </div>
        </div>

        <!-- Section Sub-Navigation Tabs -->
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <button id="subtab-btn-3dgen" onclick="window.switchGamingSubtab('3dgen')" class="tab ${activeGamingSubtab === '3dgen' ? 'active' : ''}" style="white-space:nowrap;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;">
            <span>🧊</span> Prompt to 3D Model
          </button>
          <button id="subtab-btn-arcade" onclick="window.switchGamingSubtab('arcade')" class="tab ${activeGamingSubtab === 'arcade' ? 'active' : ''}" style="white-space:nowrap;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;">
            <span>🕹️</span> 3D Arcade Arena
          </button>
          <button id="subtab-btn-forge" onclick="window.switchGamingSubtab('forge')" class="tab ${activeGamingSubtab === 'forge' ? 'active' : ''}" style="white-space:nowrap;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;">
            <span>🛠️</span> Game Dev Asset Forge
          </button>
          <button id="subtab-btn-library" onclick="window.switchGamingSubtab('library')" class="tab ${activeGamingSubtab === 'library' ? 'active' : ''}" style="white-space:nowrap;padding:8px 16px;border-radius:var(--radius-sm);cursor:pointer;">
            <span>📚</span> 3D Model Vault
          </button>
        </div>

        <!-- Dynamic Container for Active Subtab -->
        <div id="gamingSubtabContainer">
          ${renderSubtabContent(activeGamingSubtab)}
        </div>
      </div>
    `;

    // Initialize subtab specifics
    if (activeGamingSubtab === '3dgen') {
      init3DStudioViewport();
    } else if (activeGamingSubtab === 'arcade') {
      initArcadeDefaultGame();
    } else if (activeGamingSubtab === 'forge') {
      initAssetForgeComponents();
    } else if (activeGamingSubtab === 'library') {
      loadSavedModelsList();
    }
  };

  window.switchGamingSubtab = function (sub) {
    activeGamingSubtab = sub;
    window.renderGamingStudioTab(sub);
  };

  function renderSubtabContent(sub) {
    if (sub === '3dgen') return render3DStudioView();
    if (sub === 'arcade') return renderArcadeView();
    if (sub === 'forge') return renderForgeView();
    if (sub === 'library') return renderLibraryView();
    return '';
  }

  // ==========================================================================
  // 1. PROMPT TO 3D MODEL GENERATOR & STUDIO
  // ==========================================================================
  function render3DStudioView() {
    return `
      <!-- Prompt Bar & AI Generator Controls -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:20px;box-shadow:0 8px 24px rgba(0,0,0,0.25);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">✨</span>
            <strong style="font-size:15px;">Prompt to 3D Model Synthesizer</strong>
            <span style="font-size:11px;background:rgba(124,106,247,0.15);color:var(--accent);padding:2px 8px;border-radius:12px;border:1px solid rgba(124,106,247,0.3);">AI + Procedural Hybrid</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="cf-btn" onclick="window.randomize3DPrompt()" style="padding:5px 11px;font-size:12px;" title="Insert a surprise prompt">
              🎲 Surprise Me
            </button>
            <button class="cf-btn" onclick="window.enhance3DPrompt()" style="padding:5px 11px;font-size:12px;" title="Expand prompt with 3D details">
              🪄 Enhance Prompt
            </button>
          </div>
        </div>

        <!-- Prompt input and generate button -->
        <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:280px;position:relative;">
            <input id="prompt3DInput" type="text" placeholder="e.g. Futuristic cyber hovercar with glowing blue repulsors and neon spoiler..."
              value="Aero-Starfighter with dual laser cannons, swept wings, and glowing plasma thrusters"
              style="width:100%;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:14px;outline:none;"
              onkeydown="if(event.key==='Enter') window.generate3DModel();"
            />
          </div>
          <button id="gen3DBtn" onclick="window.generate3DModel()" class="cf-btn cf-btn-primary" style="padding:12px 24px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;cursor:pointer;">
            <span>⚡</span> Generate 3D Model
          </button>
        </div>

        <!-- Category Inspiration Pills -->
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="color:var(--muted);font-size:12px;">Quick Presets:</span>
          ${PROMPT_SUGGESTIONS.map((p, idx) => `
            <button onclick="window.loadPresetPrompt(${idx})" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:16px;padding:3px 10px;font-size:11.5px;cursor:pointer;transition:all 0.15s ease;"
              onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
              ${p.title}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Main 3D Studio Grid: Viewport + Inspector Controls -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start;">
        
        <!-- Left: Three.js 3D WebGL Canvas Viewport -->
        <div style="background:#09090d;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;position:relative;display:flex;flex-direction:column;">
          
          <!-- Viewport Top Overlay Bar -->
          <div style="position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;z-index:10;pointer-events:none;">
            <!-- Model Name & Stats Badge -->
            <div style="pointer-events:auto;background:rgba(15,15,19,0.85);backdrop-filter:blur(8px);border:1px solid var(--border);padding:6px 12px;border-radius:var(--radius-sm);display:flex;align-items:center;gap:8px;">
              <span style="color:#00f0ff;font-size:14px;">🧊</span>
              <strong id="modelNameBadge" style="font-size:13px;font-family:'JetBrains Mono',monospace;">Aero-Starfighter Mk-IV</strong>
              <span id="modelPartCountBadge" style="font-size:11px;color:var(--muted);background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;">12 Parts</span>
            </div>

            <!-- Viewport Actions -->
            <div style="pointer-events:auto;display:flex;gap:6px;">
              <button onclick="window.reset3DCamera()" class="cf-btn" style="padding:6px 10px;font-size:12px;background:rgba(15,15,19,0.85);backdrop-filter:blur(8px);" title="Reset Camera View">
                🔄 Reset Cam
              </button>
              <button onclick="window.toggleAutoRotate()" id="autoRotateBtn" class="cf-btn" style="padding:6px 10px;font-size:12px;background:rgba(124,106,247,0.2);color:var(--accent);border-color:var(--accent);" title="Toggle Turntable Rotation">
                💫 Rotate: ON
              </button>
              <button onclick="window.toggleWireframeMode()" id="wireframeBtn" class="cf-btn" style="padding:6px 10px;font-size:12px;background:rgba(15,15,19,0.85);backdrop-filter:blur(8px);" title="Toggle Wireframe Shading">
                🔲 Wireframe
              </button>
            </div>
          </div>

          <!-- 3D Canvas Element Container -->
          <div id="threeCanvasContainer" style="width:100%;height:520px;position:relative;background:radial-gradient(circle at center, #151522 0%, #08080d 100%);cursor:grab;">
            <!-- Fallback message if Three.js not loaded -->
            <div id="threeLoadingIndicator" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--muted);">
              <div style="font-size:32px;animation:spin 2s linear infinite;">🧊</div>
              <span style="font-size:13.5px;">Initializing 3D WebGL Studio...</span>
            </div>
          </div>

          <!-- Viewport Bottom HUD Bar -->
          <div style="padding:10px 16px;background:var(--surface);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <!-- Lighting Themes -->
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
              <span style="color:var(--muted);">Atmosphere:</span>
              <button onclick="window.set3DLighting('studio')" class="cf-btn" style="padding:3px 8px;font-size:11px;">☀️ Studio</button>
              <button onclick="window.set3DLighting('neon')" class="cf-btn" style="padding:3px 8px;font-size:11px;">🌆 Cyber Neon</button>
              <button onclick="window.set3DLighting('space')" class="cf-btn" style="padding:3px 8px;font-size:11px;">🌌 Deep Space</button>
              <button onclick="window.set3DLighting('matrix')" class="cf-btn" style="padding:3px 8px;font-size:11px;">💡 Matrix</button>
            </div>

            <!-- Explode View Slider -->
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
              <span style="color:#f59e0b;font-weight:600;">💥 Explode View:</span>
              <input type="range" id="explodeSlider" min="0" max="100" value="0" style="width:120px;cursor:pointer;" oninput="window.set3DExplosion(this.value)"/>
              <span id="explodeVal" style="font-family:'JetBrains Mono',monospace;color:var(--muted);width:32px;">0%</span>
            </div>
          </div>
        </div>

        <!-- Right: 3D Model Customizer, Exporters & Part Inspector -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          
          <!-- Export & Save Operations Card -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <strong style="font-size:14px;display:flex;align-items:center;gap:6px;">
                <span>💾</span> Export & 3D Print
              </strong>
              <span style="font-size:11px;color:var(--green);background:rgba(34,197,94,0.1);padding:2px 6px;border-radius:4px;">Ready</span>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
              <button onclick="window.exportModelAsOBJ()" class="cf-btn" style="padding:8px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;" title="Wavefront OBJ format for Blender, Unity, Unreal">
                <span>📦</span> Download .OBJ
              </button>
              <button onclick="window.exportModelAsSTL()" class="cf-btn" style="padding:8px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;" title="STL format ready for Cura / 3D Printers">
                <span>🖨️</span> Download .STL
              </button>
              <button onclick="window.exportModelAsJSON()" class="cf-btn" style="padding:8px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;" title="Three.js JSON scene definition">
                <span>📄</span> Three.js JSON
              </button>
              <button onclick="window.takeSnapshotPNG()" class="cf-btn" style="padding:8px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;" title="Save high-res screenshot as PNG">
                <span>📸</span> Snapshot PNG
              </button>
            </div>

            <button onclick="window.saveModelToVault()" class="cf-btn cf-btn-primary" style="width:100%;padding:9px;font-size:12.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;">
              <span>💾</span> Save to Vault 3D Library
            </button>
          </div>

          <!-- Model Material & Shading Adjuster -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;">
            <strong style="font-size:14px;display:block;margin-bottom:12px;">🎨 Material & Shading</strong>
            
            <div style="display:flex;flex-direction:column;gap:12px;font-size:12.5px;">
              <div>
                <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:4px;">
                  <span>Roughness</span>
                  <span id="roughnessVal">0.4</span>
                </div>
                <input type="range" min="0" max="100" value="40" style="width:100%;cursor:pointer;" oninput="window.setMaterialRoughness(this.value)"/>
              </div>

              <div>
                <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:4px;">
                  <span>Metalness</span>
                  <span id="metalnessVal">0.6</span>
                </div>
                <input type="range" min="0" max="100" value="60" style="width:100%;cursor:pointer;" oninput="window.setMaterialMetalness(this.value)"/>
              </div>

              <div>
                <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:4px;">
                  <span>Emissive Glow</span>
                  <span id="glowVal">1.0x</span>
                </div>
                <input type="range" min="0" max="200" value="100" style="width:100%;cursor:pointer;" oninput="window.setEmissiveGlow(this.value)"/>
              </div>

              <div>
                <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:4px;">
                  <span>Turntable Speed</span>
                  <span id="rotSpeedVal">1.0x</span>
                </div>
                <input type="range" min="0" max="300" value="100" style="width:100%;cursor:pointer;" oninput="window.setRotationSpeed(this.value)"/>
              </div>
            </div>
          </div>

          <!-- Part Hierarchy Inspector -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;max-height:260px;overflow-y:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <strong style="font-size:13.5px;">🔍 Mesh Parts Tree</strong>
              <span id="partCountLabel" style="font-size:11px;color:var(--muted);">Loading parts...</span>
            </div>
            <div id="partListContainer" style="display:flex;flex-direction:column;gap:6px;">
              <!-- Dynamic part items populated here -->
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // ==========================================================================
  // THREE.JS VIEWPORT INITIALIZATION & ENGINE
  // ==========================================================================
  function init3DStudioViewport() {
    const container = document.getElementById('threeCanvasContainer');
    if (!container) return;

    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
      const loader = document.getElementById('threeLoadingIndicator');
      if (loader) {
        loader.innerHTML = `
          <div style="color:var(--red);font-size:24px;">⚠️</div>
          <div style="text-align:center;">Three.js engine is still loading or blocked.<br/><span style="font-size:12px;color:var(--muted);">Attempting fallback reload...</span></div>
          <button class="cf-btn" onclick="location.reload()" style="margin-top:8px;">Reload Page</button>
        `;
      }
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. Scene
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x0a0a10);

    // 2. Camera
    threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    threeCamera.position.set(4, 3, 5);

    // 3. Renderer
    threeRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    threeRenderer.setSize(width, height);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRenderer.shadowMap.enabled = true;
    threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(threeRenderer.domElement);

    // 4. Orbit Controls (Three.js OrbitControls or built-in mouse drag fallback)
    if (typeof THREE.OrbitControls === 'function') {
      threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
      threeControls.enableDamping = true;
      threeControls.dampingFactor = 0.05;
      threeControls.maxDistance = 25;
      threeControls.minDistance = 1;
    } else {
      setupManualMouseOrbit(threeRenderer.domElement, threeCamera);
    }

    // 5. Grid and Ground plane
    setupStudioLighting('studio');

    // 6. Handle Window Resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !threeRenderer || !threeCamera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw === 0 || nh === 0) return;
      threeCamera.aspect = nw / nh;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(nw, nh);
    });
    resizeObserver.observe(container);

    // 7. Load default initial 3D model
    const initialPrompt = document.getElementById('prompt3DInput')?.value || 'Aero-Starfighter';
    window.generate3DModel(initialPrompt);

    // 8. Start Animation Loop
    animateViewport();
  }

  function setupStudioLighting(preset) {
    if (!threeScene) return;
    currentLighting = preset;

    // Remove existing lights & grid
    const toRemove = [];
    threeScene.traverse((child) => {
      if (child.isLight || child.isGridHelper || child.name === 'environmentGroup') {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => threeScene.remove(obj));

    const envGroup = new THREE.Group();
    envGroup.name = 'environmentGroup';

    if (preset === 'neon') {
      threeScene.background = new THREE.Color(0x06020f);
      const ambient = new THREE.AmbientLight(0x2d004d, 1.2);
      const magentaLight = new THREE.DirectionalLight(0xff007f, 2.0);
      magentaLight.position.set(5, 6, 4);
      const cyanLight = new THREE.DirectionalLight(0x00f0ff, 2.0);
      cyanLight.position.set(-5, 4, -4);
      const grid = new THREE.GridHelper(20, 20, 0x00f0ff, 0x3b0764);
      grid.position.y = -0.01;
      envGroup.add(ambient, magentaLight, cyanLight, grid);
    } else if (preset === 'space') {
      threeScene.background = new THREE.Color(0x020205);
      const ambient = new THREE.AmbientLight(0x111827, 0.8);
      const starLight = new THREE.DirectionalLight(0xffffff, 2.5);
      starLight.position.set(6, 8, 5);
      // Particle stars
      const starGeo = new THREE.BufferGeometry();
      const starCount = 300;
      const starCoords = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starCoords[i] = (Math.random() - 0.5) * 50;
        starCoords[i + 1] = (Math.random() - 0.5) * 50;
        starCoords[i + 2] = (Math.random() - 0.5) * 50;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 });
      const starPoints = new THREE.Points(starGeo, starMat);
      envGroup.add(ambient, starLight, starPoints);
    } else if (preset === 'matrix') {
      threeScene.background = new THREE.Color(0x021208);
      const ambient = new THREE.AmbientLight(0x064e3b, 1.5);
      const greenLight = new THREE.DirectionalLight(0x10b981, 2.5);
      greenLight.position.set(4, 7, 4);
      const grid = new THREE.GridHelper(20, 20, 0x10b981, 0x064e3b);
      envGroup.add(ambient, greenLight, grid);
    } else {
      // Standard Studio Preset
      threeScene.background = new THREE.Color(0x0f0f16);
      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.6);
      keyLight.position.set(5, 8, 5);
      const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
      fillLight.position.set(-5, 4, -4);
      const grid = new THREE.GridHelper(20, 20, 0x7c6af7, 0x222233);
      grid.position.y = -0.01;
      envGroup.add(ambient, keyLight, fillLight, grid);
    }

    threeScene.add(envGroup);
  }

  function setupManualMouseOrbit(canvas, camera) {
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let theta = Math.PI / 4;
    let phi = Math.PI / 5;
    let radius = 6;

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      theta -= dx * 0.01;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi + dy * 0.01));

      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0.8, 0);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      if (canvas) canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      radius = Math.max(1.5, Math.min(20, radius + e.deltaY * 0.01));
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0.8, 0);
    }, { passive: false });
  }

  function animateViewport() {
    threeAnimId = requestAnimationFrame(animateViewport);

    if (threeControls) {
      threeControls.update();
    }

    // Auto rotate turntable
    if (threeModelGroup && isAutoRotate) {
      threeModelGroup.rotation.y += rotateSpeed;
    }

    // Hover animation if model specifies it
    if (threeModelGroup && current3DRecipe?.animation === 'hover') {
      const time = Date.now() * 0.002;
      threeModelGroup.position.y = Math.sin(time) * 0.12;
    }

    if (threeRenderer && threeScene && threeCamera) {
      threeRenderer.render(threeScene, threeCamera);
    }
  }

  function cleanupThreeViewport() {
    if (threeAnimId) {
      cancelAnimationFrame(threeAnimId);
      threeAnimId = null;
    }
    threeScene = null;
    threeCamera = null;
    threeRenderer = null;
    threeControls = null;
    threeModelGroup = null;
  }

  // ==========================================================================
  // BUILD & RENDER 3D MODEL FROM RECIPE
  // ==========================================================================
  function buildModelFromRecipe(recipe) {
    if (!threeScene || !recipe || !Array.isArray(recipe.parts)) return;

    // Remove old model
    if (threeModelGroup) {
      threeScene.remove(threeModelGroup);
      threeModelGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }

    current3DRecipe = recipe;
    threeModelGroup = new THREE.Group();
    threeModelGroup.name = 'rootModelGroup';

    // Update Badges
    const nameBadge = document.getElementById('modelNameBadge');
    if (nameBadge) nameBadge.textContent = recipe.title || '3D Construct';
    const countBadge = document.getElementById('modelPartCountBadge');
    if (countBadge) countBadge.textContent = `${recipe.parts.length} Parts`;

    // Reset explosion slider
    const explodeSlider = document.getElementById('explodeSlider');
    if (explodeSlider) explodeSlider.value = 0;
    const explodeVal = document.getElementById('explodeVal');
    if (explodeVal) explodeVal.textContent = '0%';
    explosionDistance = 0;

    // Construct meshes for all parts in the recipe
    recipe.parts.forEach((part, idx) => {
      let geo = null;
      const s = part.size || [1, 1, 1];

      switch (part.shape) {
        case 'box':
          geo = new THREE.BoxGeometry(s[0] || 1, s[1] || 1, s[2] || 1);
          break;
        case 'cylinder':
          geo = new THREE.CylinderGeometry(s[0] || 0.5, s[1] || 0.5, s[2] || 1, s[3] || 16);
          break;
        case 'sphere':
          geo = new THREE.SphereGeometry(s[0] || 0.5, s[1] || 16, s[2] || 16);
          break;
        case 'cone':
          geo = new THREE.ConeGeometry(s[0] || 0.5, s[1] || 1, s[2] || 16);
          break;
        case 'torus':
          geo = new THREE.TorusGeometry(s[0] || 0.6, s[1] || 0.15, 12, 24);
          break;
        case 'dodecahedron':
          geo = new THREE.DodecahedronGeometry(s[0] || 0.5, 0);
          break;
        default:
          geo = new THREE.BoxGeometry(s[0] || 1, s[1] || 1, s[2] || 1);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: part.color || '#38bdf8',
        metalness: part.metalness !== undefined ? part.metalness : 0.4,
        roughness: part.roughness !== undefined ? part.roughness : 0.4,
        emissive: part.emissive || '#000000',
        emissiveIntensity: part.emissiveIntensity !== undefined ? part.emissiveIntensity : 0.0,
        wireframe: isWireframe,
        transparent: !!part.transparent,
        opacity: part.opacity !== undefined ? part.opacity : 1.0,
        flatShading: true
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = part.name || `Part_${idx + 1}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const p = part.position || [0, 0, 0];
      mesh.position.set(p[0], p[1], p[2]);

      const r = part.rotation || [0, 0, 0];
      mesh.rotation.set(r[0], r[1], r[2]);

      // Cache original position for explosion disassembly
      mesh.userData = {
        origPos: mesh.position.clone(),
        partIndex: idx,
        partName: mesh.name,
        baseColor: part.color || '#38bdf8'
      };

      threeModelGroup.add(mesh);
    });

    threeScene.add(threeModelGroup);

    // Position camera to frame the model nicely
    if (recipe.camera?.position && threeCamera) {
      threeCamera.position.set(...recipe.camera.position);
      if (recipe.camera?.target) {
        threeCamera.lookAt(...recipe.camera.target);
        if (threeControls) threeControls.target.set(...recipe.camera.target);
      }
    }

    // Populate Part Inspector Tree
    renderPartInspectorList(recipe.parts);
  }

  function renderPartInspectorList(parts) {
    const listEl = document.getElementById('partListContainer');
    const countEl = document.getElementById('partCountLabel');
    if (!listEl) return;
    if (countEl) countEl.textContent = `${parts.length} items`;

    listEl.innerHTML = parts.map((p, idx) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:var(--surface2);border-radius:4px;border:1px solid rgba(255,255,255,0.04);font-size:11.5px;">
        <div style="display:flex;align-items:center;gap:6px;overflow:hidden;">
          <input type="color" value="${p.color || '#38bdf8'}" style="width:16px;height:16px;padding:0;border:none;border-radius:2px;cursor:pointer;"
            onchange="window.updatePartColor(${idx}, this.value)"/>
          <span style="font-family:'JetBrains Mono',monospace;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;" title="${p.name}">
            ${p.name || `Part ${idx + 1}`}
          </span>
        </div>
        <span style="font-size:10px;color:var(--muted);text-transform:uppercase;">${p.shape}</span>
      </div>
    `).join('');
  }

  // ==========================================================================
  // USER ACTIONS: GENERATE, PROMPT, EXPORT
  // ==========================================================================
  window.generate3DModel = async function (overridePrompt) {
    const input = document.getElementById('prompt3DInput');
    const prompt = overridePrompt || input?.value || '';
    if (!prompt.trim()) {
      toast('Please enter a 3D prompt');
      return;
    }

    const btn = document.getElementById('gen3DBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Synthesizing 3D...';
    }

    try {
      const res = await fetch('/api/3d/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: 'lowpoly' })
      });
      const data = await res.json();
      if (data.success && data.recipe) {
        buildModelFromRecipe(data.recipe);
        toast(`✨ 3D Model created (${data.provider === 'gemini' ? 'Gemini AI' : 'Procedural Core'})`);
        setTimeout(() => { if (typeof window.saveModelToVault === 'function') window.saveModelToVault(true); }, 500);
      } else {
        throw new Error(data.error || 'Failed to synthesize 3D model');
      }
    } catch (err) {
      console.warn('API error, falling back to instant client synthesis:', err);
      // Client-side procedural fallback
      const fallbackRecipe = clientProceduralCompiler(prompt);
      buildModelFromRecipe(fallbackRecipe);
      toast('✨ 3D Model synthesized locally');
      setTimeout(() => { if (typeof window.saveModelToVault === 'function') window.saveModelToVault(true); }, 500);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡</span> Generate 3D Model';
      }
    }
  };

  window.loadPresetPrompt = function (idx) {
    const preset = PROMPT_SUGGESTIONS[idx];
    if (!preset) return;
    const input = document.getElementById('prompt3DInput');
    if (input) input.value = preset.prompt;
    window.generate3DModel(preset.prompt);
  };

  window.randomize3DPrompt = function () {
    const random = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    const input = document.getElementById('prompt3DInput');
    if (input) input.value = random.prompt;
    window.generate3DModel(random.prompt);
  };

  window.enhance3DPrompt = function () {
    const input = document.getElementById('prompt3DInput');
    if (!input) return;
    const current = input.value.trim();
    if (!current) {
      input.value = 'Sci-fi hovercar with neon accents, dual thrusters, and tinted cockpit';
    } else {
      input.value = `${current}, high detail low-poly model, vibrant emissive accents, geometric precision, game-ready aesthetic`;
    }
    toast('Prompt enhanced with 3D descriptors!');
  };

  window.set3DExplosion = function (val) {
    const pct = parseInt(val, 10) || 0;
    const explodeVal = document.getElementById('explodeVal');
    if (explodeVal) explodeVal.textContent = `${pct}%`;

    if (!threeModelGroup) return;
    const factor = pct / 100;

    threeModelGroup.children.forEach((mesh) => {
      if (!mesh.userData?.origPos) return;
      const orig = mesh.userData.origPos;
      // Calculate radial vector from center
      const dir = orig.clone().normalize();
      if (dir.length() === 0) dir.set(0, 1, 0);
      mesh.position.copy(orig).add(dir.multiplyScalar(factor * 1.8));
    });
  };

  window.toggleAutoRotate = function () {
    isAutoRotate = !isAutoRotate;
    const btn = document.getElementById('autoRotateBtn');
    if (btn) {
      btn.textContent = isAutoRotate ? '💫 Rotate: ON' : '⏸️ Rotate: OFF';
      btn.style.color = isAutoRotate ? 'var(--accent)' : 'var(--muted)';
      btn.style.borderColor = isAutoRotate ? 'var(--accent)' : 'var(--border)';
    }
  };

  window.reset3DCamera = function () {
    if (!threeCamera) return;
    threeCamera.position.set(4, 3, 5);
    threeCamera.lookAt(0, 0.8, 0);
    if (threeControls) {
      threeControls.target.set(0, 0.8, 0);
      threeControls.update();
    }
    if (threeModelGroup) {
      threeModelGroup.rotation.set(0, 0, 0);
    }
  };

  window.toggleWireframeMode = function () {
    isWireframe = !isWireframe;
    const btn = document.getElementById('wireframeBtn');
    if (btn) {
      btn.style.color = isWireframe ? '#00f0ff' : 'var(--text)';
      btn.style.borderColor = isWireframe ? '#00f0ff' : 'var(--border)';
    }
    if (threeModelGroup) {
      threeModelGroup.traverse((child) => {
        if (child.material) child.material.wireframe = isWireframe;
      });
    }
  };

  window.set3DLighting = function (preset) {
    setupStudioLighting(preset);
  };

  window.setMaterialRoughness = function (val) {
    const v = val / 100;
    document.getElementById('roughnessVal').textContent = v.toFixed(2);
    if (threeModelGroup) {
      threeModelGroup.traverse((child) => {
        if (child.material) child.material.roughness = v;
      });
    }
  };

  window.setMaterialMetalness = function (val) {
    const v = val / 100;
    document.getElementById('metalnessVal').textContent = v.toFixed(2);
    if (threeModelGroup) {
      threeModelGroup.traverse((child) => {
        if (child.material) child.material.metalness = v;
      });
    }
  };

  window.setEmissiveGlow = function (val) {
    const v = val / 100;
    document.getElementById('glowVal').textContent = `${v.toFixed(1)}x`;
    if (threeModelGroup) {
      threeModelGroup.traverse((child) => {
        if (child.material && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = v;
        }
      });
    }
  };

  window.setRotationSpeed = function (val) {
    const v = val / 100;
    rotateSpeed = 0.008 * v;
    document.getElementById('rotSpeedVal').textContent = `${v.toFixed(1)}x`;
  };

  window.updatePartColor = function (idx, colorHex) {
    if (!threeModelGroup || !current3DRecipe?.parts[idx]) return;
    current3DRecipe.parts[idx].color = colorHex;
    const mesh = threeModelGroup.children[idx];
    if (mesh && mesh.material) {
      mesh.material.color.set(colorHex);
    }
  };

  // ==========================================================================
  // MULTI-FORMAT 3D EXPORTERS (.OBJ, .STL, .JSON, .PNG)
  // ==========================================================================
  window.exportModelAsOBJ = function () {
    if (!threeModelGroup) return toast('No 3D model to export');
    const title = (current3DRecipe?.title || 'model').toLowerCase().replace(/[^a-z0-9]/g, '_');
    let objText = `# Wavefront OBJ generated by Vault 3D Studio\n# Model: ${title}\n\n`;

    let vertexOffset = 1;

    threeModelGroup.children.forEach((mesh) => {
      if (!mesh.geometry) return;
      mesh.updateMatrixWorld(true);

      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);

      const pos = geo.attributes.position;
      if (!pos) return;

      objText += `o ${mesh.name.replace(/\s+/g, '_')}\n`;

      // Write vertices
      for (let i = 0; i < pos.count; i++) {
        objText += `v ${pos.getX(i).toFixed(4)} ${pos.getY(i).toFixed(4)} ${pos.getZ(i).toFixed(4)}\n`;
      }

      // Write faces
      if (geo.index) {
        const idx = geo.index;
        for (let i = 0; i < idx.count; i += 3) {
          const a = idx.getX(i) + vertexOffset;
          const b = idx.getX(i + 1) + vertexOffset;
          const c = idx.getX(i + 2) + vertexOffset;
          objText += `f ${a} ${b} ${c}\n`;
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          const a = i + vertexOffset;
          const b = i + 1 + vertexOffset;
          const c = i + 2 + vertexOffset;
          objText += `f ${a} ${b} ${c}\n`;
        }
      }

      vertexOffset += pos.count;
    });

    downloadBlob(new Blob([objText], { type: 'text/plain' }), `${title}.obj`);
    toast(`📦 ${title}.obj exported!`);
  };

  window.exportModelAsSTL = function () {
    if (!threeModelGroup) return toast('No 3D model to export');
    const title = (current3DRecipe?.title || 'model').toLowerCase().replace(/[^a-z0-9]/g, '_');
    let stlText = `solid ${title}\n`;

    threeModelGroup.children.forEach((mesh) => {
      if (!mesh.geometry) return;
      mesh.updateMatrixWorld(true);

      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);

      const pos = geo.attributes.position;
      if (!pos) return;

      const getVec = (idx) => new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx));

      const writeFacet = (v1, v2, v3) => {
        const norm = new THREE.Vector3().crossVectors(
          new THREE.Vector3().subVectors(v2, v1),
          new THREE.Vector3().subVectors(v3, v1)
        ).normalize();

        stlText += `  facet normal ${norm.x.toFixed(4)} ${norm.y.toFixed(4)} ${norm.z.toFixed(4)}\n`;
        stlText += `    outer loop\n`;
        stlText += `      vertex ${v1.x.toFixed(4)} ${v1.y.toFixed(4)} ${v1.z.toFixed(4)}\n`;
        stlText += `      vertex ${v2.x.toFixed(4)} ${v2.y.toFixed(4)} ${v2.z.toFixed(4)}\n`;
        stlText += `      vertex ${v3.x.toFixed(4)} ${v3.y.toFixed(4)} ${v3.z.toFixed(4)}\n`;
        stlText += `    endloop\n`;
        stlText += `  endfacet\n`;
      };

      if (geo.index) {
        const idx = geo.index;
        for (let i = 0; i < idx.count; i += 3) {
          writeFacet(getVec(idx.getX(i)), getVec(idx.getX(i + 1)), getVec(idx.getX(i + 2)));
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          writeFacet(getVec(i), getVec(i + 1), getVec(i + 2));
        }
      }
    });

    stlText += `endsolid ${title}\n`;
    downloadBlob(new Blob([stlText], { type: 'text/plain' }), `${title}.stl`);
    toast(`🖨️ ${title}.stl ready for 3D printing!`);
  };

  window.exportModelAsJSON = function () {
    if (!current3DRecipe) return toast('No recipe available');
    const title = (current3DRecipe.title || 'model').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const jsonStr = JSON.stringify(current3DRecipe, null, 2);
    downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `${title}_recipe.json`);
    toast('📄 3D Scene JSON exported!');
  };

  window.takeSnapshotPNG = function () {
    if (!threeRenderer) return toast('Viewport renderer not available');
    const dataUrl = threeRenderer.domElement.toDataURL('image/png');
    const title = (current3DRecipe?.title || 'snapshot').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const link = document.createElement('a');
    link.download = `${title}_snapshot.png`;
    link.href = dataUrl;
    link.click();
    toast('📸 PNG Snapshot downloaded!');
  };

  window.saveModelToVault = async function (silent = false) {
    if (!current3DRecipe) {
      if (!silent) toast('No model generated yet');
      return;
    }
    try {
      const thumbnail = threeRenderer ? threeRenderer.domElement.toDataURL('image/webp', 0.5) : '';
      const res = await fetch('/api/3d/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: current3DRecipe.title || 'Custom 3D Model',
          prompt: current3DRecipe.prompt || '',
          category: current3DRecipe.category || 'general',
          recipe: current3DRecipe,
          thumbnail
        })
      });
      const data = await res.json();
      if (data.success) {
        if (!silent) toast('💾 3D Model saved to database!');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      saveModelToLocalCache(current3DRecipe);
      if (!silent) toast('Saved to local backup');
    }
  };

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // 2. PLAYABLE 3D ARCADE GAMES PLAYGROUND
  // ==========================================================================
  function renderArcadeView() {
    return `
      <div style="display:flex;flex-direction:column;gap:20px;">
        <!-- Arcade Game Selector Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🕹️</span>
            <div>
              <strong style="font-size:15px;">3D WebGL Arcade Arena</strong>
              <div style="color:var(--muted);font-size:12px;">Three playable real-time 3D arcade games powered by WebGL & Web Audio API.</div>
            </div>
          </div>

          <!-- Game Selector Buttons -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="window.launchArcadeGame('starfighter')" class="cf-btn cf-btn-primary" style="font-size:12.5px;padding:8px 14px;cursor:pointer;">
              🚀 3D Starfighter Warp
            </button>
            <button onclick="window.launchArcadeGame('pong')" class="cf-btn" style="font-size:12.5px;padding:8px 14px;cursor:pointer;">
              🏓 3D Cyber Pong
            </button>
            <button onclick="window.launchArcadeGame('runner')" class="cf-btn" style="font-size:12.5px;padding:8px 14px;cursor:pointer;">
              🪙 3D Voxel Runner
            </button>
          </div>
        </div>

        <!-- Arcade Screen Canvas & Controls Container -->
        <div style="background:#09090e;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;position:relative;">
          
          <!-- Arcade Top HUD -->
          <div style="padding:10px 16px;background:rgba(15,15,22,0.9);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:16px;">
              <strong id="arcadeGameTitle" style="font-size:14px;color:#00f0ff;font-family:'JetBrains Mono',monospace;">🚀 3D STARFIGHTER: HYPER WARP</strong>
              <div style="font-size:13px;font-family:'JetBrains Mono',monospace;">
                SCORE: <span id="arcadeScoreVal" style="color:#facc15;font-weight:700;">0</span>
              </div>
              <div id="arcadeShieldsContainer" style="font-size:13px;display:flex;align-items:center;gap:4px;">
                SHIELDS: <span id="arcadeShieldsVal" style="color:#22c55e;">🛡️🛡️🛡️</span>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;">
              <button onclick="window.restartCurrentGame()" class="cf-btn" style="padding:4px 10px;font-size:11.5px;">
                🔄 Restart
              </button>
              <button onclick="window.toggleGameAudio()" id="gameAudioBtn" class="cf-btn" style="padding:4px 10px;font-size:11.5px;">
                🔊 SFX: ON
              </button>
            </div>
          </div>

          <!-- Arcade WebGL Game Canvas -->
          <div id="arcadeCanvasContainer" style="width:100%;height:540px;position:relative;background:#05050a;">
            <!-- Canvas dynamically injected here -->
          </div>

          <!-- Arcade Controls Bar for Mobile / Touch & Instructions -->
          <div style="padding:12px 16px;background:var(--surface);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div style="font-size:12px;color:var(--muted);">
              <strong>Controls:</strong> <span id="arcadeControlsHint">Use [Arrow Keys] or [A / D] to steer ship. Press [SPACEBAR] or click FIRE to shoot lasers!</span>
            </div>

            <!-- Touch Gamepad Controls (Visible on mobile/touch screens) -->
            <div id="touchControlsBar" style="display:flex;gap:10px;">
              <button id="touchLeftBtn" class="cf-btn" style="padding:10px 18px;font-size:16px;">⬅️</button>
              <button id="touchFireBtn" class="cf-btn cf-btn-primary" style="padding:10px 22px;font-size:14px;font-weight:700;">🔥 FIRE</button>
              <button id="touchRightBtn" class="cf-btn" style="padding:10px 18px;font-size:16px;">➡️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function initArcadeDefaultGame() {
    window.launchArcadeGame('starfighter');
  }

  // ==========================================================================
  // GAME 1: 3D STARFIGHTER HYPER SPACE TUNNEL
  // ==========================================================================
  let gameAudioMuted = false;

  window.toggleGameAudio = function () {
    gameAudioMuted = !gameAudioMuted;
    const btn = document.getElementById('gameAudioBtn');
    if (btn) btn.textContent = gameAudioMuted ? '🔇 SFX: OFF' : '🔊 SFX: ON';
  };

  function playArcadeSfx(type) {
    if (gameAudioMuted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987, now);
        osc.frequency.setValueAtTime(1318, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (_) {}
  }

  window.launchArcadeGame = function (gameKey) {
    if (activeGameInstance && typeof activeGameInstance.stop === 'function') {
      activeGameInstance.stop();
      activeGameInstance = null;
    }

    const container = document.getElementById('arcadeCanvasContainer');
    if (!container) return;
    container.innerHTML = '';

    if (gameKey === 'starfighter') {
      activeGameInstance = createStarfighterGame(container);
    } else if (gameKey === 'pong') {
      activeGameInstance = createCyberPongGame(container);
    } else if (gameKey === 'runner') {
      activeGameInstance = createVoxelRunnerGame(container);
    }
  };

  window.restartCurrentGame = function () {
    if (activeGameInstance && typeof activeGameInstance.restart === 'function') {
      activeGameInstance.restart();
    }
  };

  // --------------------------------------------------------------------------
  // GAME ENGINE: 3D Starfighter Hyper Warp
  // --------------------------------------------------------------------------
  function createStarfighterGame(container) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050f);
    scene.fog = new THREE.FogExp2(0x05050f, 0.035);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x334155, 1.2);
    const sun = new THREE.DirectionalLight(0x00f0ff, 2.0);
    sun.position.set(0, 5, 5);
    scene.add(ambient, sun);

    // Starfighter Model for Player
    const playerShip = new THREE.Group();
    // Fuselage
    const fuse = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1.8, 4),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.8, roughness: 0.2 })
    );
    fuse.rotation.x = Math.PI / 2;
    // Wings
    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.06, 0.8),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.6, roughness: 0.3 })
    );
    wings.position.z = -0.2;
    // Cockpit
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#00f0ff' })
    );
    cockpit.position.set(0, 0.15, 0.2);

    playerShip.add(fuse, wings, cockpit);
    playerShip.position.set(0, 0.5, 2.5);
    scene.add(playerShip);

    // Warp Rings
    const rings = [];
    for (let i = 0; i < 15; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.5, 0.04, 8, 24),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#7c6af7' : '#00f0ff', transparent: true, opacity: 0.4 })
      );
      ring.position.z = -i * 4;
      scene.add(ring);
      rings.push(ring);
    }

    // Obstacles (Asteroids), Collectibles (Energy Orbs), Lasers
    const asteroids = [];
    const energyOrbs = [];
    const lasers = [];
    let score = 0;
    let shields = 3;
    let isGameOver = false;
    let shipX = 0;
    let targetShipX = 0;

    const scoreEl = document.getElementById('arcadeScoreVal');
    const shieldEl = document.getElementById('arcadeShieldsVal');
    const titleEl = document.getElementById('arcadeGameTitle');
    const hintEl = document.getElementById('arcadeControlsHint');

    if (titleEl) titleEl.textContent = '🚀 3D STARFIGHTER: HYPER WARP';
    if (hintEl) hintEl.textContent = 'Use [A / D] or [Left/Right] arrows to steer. Press [SPACEBAR] to shoot lasers!';
    if (scoreEl) scoreEl.textContent = '0';
    if (shieldEl) shieldEl.textContent = '🛡️🛡️🛡️';

    // Keyboard handlers
    const keys = {};
    const onKeyDown = (e) => {
      keys[e.key] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        fireLaser();
      }
    };
    const onKeyUp = (e) => { keys[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Touch handlers
    const leftBtn = document.getElementById('touchLeftBtn');
    const rightBtn = document.getElementById('touchRightBtn');
    const fireBtn = document.getElementById('touchFireBtn');

    if (leftBtn) leftBtn.onmousedown = leftBtn.ontouchstart = (e) => { e.preventDefault(); keys['ArrowLeft'] = true; };
    if (leftBtn) leftBtn.onmouseup = leftBtn.ontouchend = () => { keys['ArrowLeft'] = false; };
    if (rightBtn) rightBtn.onmousedown = rightBtn.ontouchstart = (e) => { e.preventDefault(); keys['ArrowRight'] = true; };
    if (rightBtn) rightBtn.onmouseup = rightBtn.ontouchend = () => { keys['ArrowRight'] = false; };
    if (fireBtn) fireBtn.onclick = (e) => { e.preventDefault(); fireLaser(); };

    function fireLaser() {
      if (isGameOver) return;
      playArcadeSfx('laser');
      const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8);
      const laserMat = new THREE.MeshBasicMaterial({ color: '#ff007f' });
      const l1 = new THREE.Mesh(laserGeo, laserMat);
      l1.rotation.x = Math.PI / 2;
      l1.position.set(playerShip.position.x - 0.7, playerShip.position.y, playerShip.position.z - 0.4);

      const l2 = new THREE.Mesh(laserGeo, laserMat);
      l2.rotation.x = Math.PI / 2;
      l2.position.set(playerShip.position.x + 0.7, playerShip.position.y, playerShip.position.z - 0.4);

      scene.add(l1, l2);
      lasers.push(l1, l2);
    }

    function spawnAsteroid() {
      if (asteroids.length > 8) return;
      const size = 0.4 + Math.random() * 0.4;
      const ast = new THREE.Mesh(
        new THREE.DodecahedronGeometry(size, 0),
        new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9, flatShading: true })
      );
      ast.position.set((Math.random() - 0.5) * 5.5, 0.5 + (Math.random() - 0.5) * 1.5, -45);
      ast.userData = { rotSpeed: (Math.random() - 0.5) * 0.08 };
      scene.add(ast);
      asteroids.push(ast);
    }

    function spawnEnergyOrb() {
      if (energyOrbs.length > 3) return;
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#facc15' })
      );
      orb.position.set((Math.random() - 0.5) * 4.5, 0.5, -50);
      scene.add(orb);
      energyOrbs.push(orb);
    }

    let animId = null;
    let spawnTimer = 0;

    function gameLoop() {
      animId = requestAnimationFrame(gameLoop);

      if (!isGameOver) {
        // Handle input
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) targetShipX -= 0.12;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) targetShipX += 0.12;
        targetShipX = Math.max(-2.5, Math.min(2.5, targetShipX));

        // Smooth ship steering & banking tilt
        shipX += (targetShipX - shipX) * 0.15;
        playerShip.position.x = shipX;
        playerShip.rotation.z = (targetShipX - shipX) * -1.8;

        // Move warp rings
        rings.forEach((ring) => {
          ring.position.z += 0.35;
          if (ring.position.z > 6) ring.position.z = -54;
        });

        // Spawn timer
        spawnTimer++;
        if (spawnTimer % 45 === 0) spawnAsteroid();
        if (spawnTimer % 90 === 0) spawnEnergyOrb();

        // Move Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          const l = lasers[i];
          l.position.z -= 1.2;
          // Check collision with asteroids
          let hit = false;
          for (let j = asteroids.length - 1; j >= 0; j--) {
            const ast = asteroids[j];
            if (l.position.distanceTo(ast.position) < 0.9) {
              playArcadeSfx('explosion');
              scene.remove(ast);
              asteroids.splice(j, 1);
              scene.remove(l);
              lasers.splice(i, 1);
              score += 150;
              if (scoreEl) scoreEl.textContent = score;
              hit = true;
              break;
            }
          }
          if (!hit && l.position.z < -60) {
            scene.remove(l);
            lasers.splice(i, 1);
          }
        }

        // Move Asteroids
        for (let i = asteroids.length - 1; i >= 0; i--) {
          const ast = asteroids[i];
          ast.position.z += 0.45;
          ast.rotation.x += ast.userData.rotSpeed;
          ast.rotation.y += ast.userData.rotSpeed;

          // Check player collision
          if (ast.position.distanceTo(playerShip.position) < 0.9) {
            playArcadeSfx('hit');
            scene.remove(ast);
            asteroids.splice(i, 1);
            shields--;
            if (shieldEl) shieldEl.textContent = '🛡️'.repeat(Math.max(0, shields));

            if (shields <= 0) {
              isGameOver = true;
              toast(`💥 Game Over! Final Score: ${score}`);
              return;
            }
          } else if (ast.position.z > 6) {
            scene.remove(ast);
            asteroids.splice(i, 1);
            score += 20;
            if (scoreEl) scoreEl.textContent = score;
          }
        }

        // Move Energy Orbs
        for (let i = energyOrbs.length - 1; i >= 0; i--) {
          const orb = energyOrbs[i];
          orb.position.z += 0.45;
          if (orb.position.distanceTo(playerShip.position) < 0.8) {
            playArcadeSfx('coin');
            scene.remove(orb);
            energyOrbs.splice(i, 1);
            score += 300;
            if (shields < 3) {
              shields++;
              if (shieldEl) shieldEl.textContent = '🛡️'.repeat(shields);
            }
            if (scoreEl) scoreEl.textContent = score;
          } else if (orb.position.z > 6) {
            scene.remove(orb);
            energyOrbs.splice(i, 1);
          }
        }
      }

      renderer.render(scene, camera);
    }

    gameLoop();

    return {
      stop: () => {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      },
      restart: () => {
        score = 0;
        shields = 3;
        isGameOver = false;
        shipX = 0;
        targetShipX = 0;
        if (scoreEl) scoreEl.textContent = '0';
        if (shieldEl) shieldEl.textContent = '🛡️🛡️🛡️';
        asteroids.forEach(a => scene.remove(a));
        asteroids.length = 0;
        energyOrbs.forEach(o => scene.remove(o));
        energyOrbs.length = 0;
        lasers.forEach(l => scene.remove(l));
        lasers.length = 0;
      }
    };
  }

  // --------------------------------------------------------------------------
  // GAME 2: 3D CYBER PONG ARENA
  // --------------------------------------------------------------------------
  function createCyberPongGame(container) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060611);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Court Grid
    const court = new THREE.GridHelper(12, 12, 0x00f0ff, 0x3b0764);
    court.position.y = -1;
    scene.add(court);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    // Player Paddle
    const playerPaddle = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.4, 0.2),
      new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.5 })
    );
    playerPaddle.position.set(0, 0, 5);
    scene.add(playerPaddle);

    // AI Paddle
    const aiPaddle = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.4, 0.2),
      new THREE.MeshStandardMaterial({ color: '#ff007f', emissive: '#ff007f', emissiveIntensity: 0.5 })
    );
    aiPaddle.position.set(0, 0, -5);
    scene.add(aiPaddle);

    // Glowing Pong Ball
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#facc15' })
    );
    scene.add(ball);

    let ballX = 0;
    let ballZ = 0;
    let vx = 0.08;
    let vz = 0.14;
    let playerScore = 0;
    let aiScore = 0;

    const titleEl = document.getElementById('arcadeGameTitle');
    const scoreEl = document.getElementById('arcadeScoreVal');
    const shieldEl = document.getElementById('arcadeShieldsContainer');
    const hintEl = document.getElementById('arcadeControlsHint');

    if (titleEl) titleEl.textContent = '🏓 3D CYBER PONG ARENA';
    if (hintEl) hintEl.textContent = 'Move mouse horizontally to steer your cyan paddle and bounce the energy sphere!';
    if (scoreEl) scoreEl.textContent = `PLAYER: ${playerScore} | AI: ${aiScore}`;
    if (shieldEl) shieldEl.innerHTML = `MATCH: <span style="color:#00f0ff;">FIRST TO 5 WINS</span>`;

    // Mouse movement
    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      playerPaddle.position.x = Math.max(-2.5, Math.min(2.5, x * 3.5));
    };
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    let animId = null;

    function gameLoop() {
      animId = requestAnimationFrame(gameLoop);

      // Move Ball
      ballX += vx;
      ballZ += vz;

      // Wall bounce
      if (ballX > 3.0 || ballX < -3.0) {
        vx = -vx;
        playArcadeSfx('laser');
      }

      // AI Paddle tracking
      aiPaddle.position.x += (ballX - aiPaddle.position.x) * 0.08;
      aiPaddle.position.x = Math.max(-2.5, Math.min(2.5, aiPaddle.position.x));

      // Player paddle collision
      if (ballZ >= 4.7 && ballZ <= 5.1 && Math.abs(ballX - playerPaddle.position.x) < 1.1) {
        vz = -Math.abs(vz) * 1.04;
        vx += (ballX - playerPaddle.position.x) * 0.06;
        playArcadeSfx('coin');
      }

      // AI paddle collision
      if (ballZ <= -4.7 && ballZ >= -5.1 && Math.abs(ballX - aiPaddle.position.x) < 1.1) {
        vz = Math.abs(vz) * 1.04;
        playArcadeSfx('coin');
      }

      // Score Player
      if (ballZ < -6) {
        playerScore++;
        playArcadeSfx('coin');
        resetBall();
      }

      // Score AI
      if (ballZ > 6) {
        aiScore++;
        playArcadeSfx('hit');
        resetBall();
      }

      if (scoreEl) scoreEl.textContent = `PLAYER: ${playerScore} | AI: ${aiScore}`;

      ball.position.set(ballX, 0, ballZ);
      renderer.render(scene, camera);
    }

    function resetBall() {
      ballX = 0;
      ballZ = 0;
      vx = (Math.random() - 0.5) * 0.12;
      vz = vz > 0 ? -0.14 : 0.14;
    }

    gameLoop();

    return {
      stop: () => {
        if (animId) cancelAnimationFrame(animId);
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
      },
      restart: () => {
        playerScore = 0;
        aiScore = 0;
        resetBall();
      }
    };
  }

  // --------------------------------------------------------------------------
  // GAME 3: 3D VOXEL RUNNER / COIN RUSH
  // --------------------------------------------------------------------------
  function createVoxelRunnerGame(container) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.Fog(0x0a0f1d, 10, 40);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    // Track platform
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.2, 80),
      new THREE.MeshStandardMaterial({ color: '#1e1e2d', roughness: 0.6 })
    );
    track.position.set(0, -0.1, -20);
    scene.add(track);

    // Voxel Companion / Hero
    const hero = new THREE.Group();
    const heroBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: '#7c6af7', metalness: 0.5 })
    );
    hero.add(heroBody);
    hero.position.set(0, 0.3, 3);
    scene.add(hero);

    let currentLane = 0; // -1 (left), 0 (center), 1 (right)
    const laneWidth = 1.3;
    let isJumping = false;
    let jumpVel = 0;
    let score = 0;

    const titleEl = document.getElementById('arcadeGameTitle');
    const scoreEl = document.getElementById('arcadeScoreVal');
    const hintEl = document.getElementById('arcadeControlsHint');

    if (titleEl) titleEl.textContent = '🪙 3D VOXEL VAULT RUNNER';
    if (hintEl) hintEl.textContent = 'Use [Left / Right] arrows to switch lanes. Press [SPACE] to jump over hurdles!';
    if (scoreEl) scoreEl.textContent = '0';

    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        currentLane = Math.max(-1, currentLane - 1);
        playArcadeSfx('laser');
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        currentLane = Math.min(1, currentLane + 1);
        playArcadeSfx('laser');
      } else if ((e.key === ' ' || e.key === 'ArrowUp') && !isJumping) {
        isJumping = true;
        jumpVel = 0.16;
        playArcadeSfx('laser');
      }
    };
    window.addEventListener('keydown', onKeyDown);

    let animId = null;

    function gameLoop() {
      animId = requestAnimationFrame(gameLoop);

      // Lane smoothing
      const targetX = currentLane * laneWidth;
      hero.position.x += (targetX - hero.position.x) * 0.2;

      // Jumping physics
      if (isJumping) {
        hero.position.y += jumpVel;
        jumpVel -= 0.01;
        if (hero.position.y <= 0.3) {
          hero.position.y = 0.3;
          isJumping = false;
        }
      }

      hero.rotation.x += 0.05;
      score += 1;
      if (scoreEl) scoreEl.textContent = score;

      renderer.render(scene, camera);
    }

    gameLoop();

    return {
      stop: () => {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('keydown', onKeyDown);
      },
      restart: () => {
        score = 0;
        currentLane = 0;
      }
    };
  }

  // ==========================================================================
  // 3. GAME DEV ASSET FORGE (8-Bit Audio SFX & Pixel Art Creator)
  // ==========================================================================
  function renderForgeView() {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">
        <!-- Left: 8-Bit Retro Sound FX Synthesizer -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:20px;">🔊</span>
              <strong style="font-size:15px;">8-Bit Retro Sound FX Synthesizer</strong>
            </div>
            <span style="font-size:11px;background:rgba(34,197,94,0.1);color:var(--green);padding:2px 8px;border-radius:12px;">Web Audio API</span>
          </div>

          <p style="color:var(--muted);font-size:12.5px;margin-bottom:14px;">
            Synthesize authentic 8-bit chip chiptune sound effects in real-time and export uncompressed .WAV files for your games.
          </p>

          <!-- Sound Preset Buttons -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:8px;margin-bottom:16px;">
            <button onclick="window.playAndPreviewSfx('laser')" class="cf-btn" style="padding:8px;font-size:12px;">⚡ Laser</button>
            <button onclick="window.playAndPreviewSfx('jump')" class="cf-btn" style="padding:8px;font-size:12px;">🦘 Jump</button>
            <button onclick="window.playAndPreviewSfx('explosion')" class="cf-btn" style="padding:8px;font-size:12px;">💥 Explosion</button>
            <button onclick="window.playAndPreviewSfx('coin')" class="cf-btn" style="padding:8px;font-size:12px;">🪙 Coin</button>
            <button onclick="window.playAndPreviewSfx('powerup')" class="cf-btn" style="padding:8px;font-size:12px;">⭐ Powerup</button>
            <button onclick="window.playAndPreviewSfx('hit')" class="cf-btn" style="padding:8px;font-size:12px;">💔 Hurt/Hit</button>
          </div>

          <!-- Parameter Sliders -->
          <div style="display:flex;flex-direction:column;gap:12px;font-size:12.5px;margin-bottom:16px;">
            <div>
              <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:4px;">
                <span>Start Frequency (Hz)</span>
                <span id="sfxFreqStartVal">880 Hz</span>
              </div>
              <input type="range" id="sfxFreqStart" min="50" max="2000" value="880" style="width:100%;cursor:pointer;"
                oninput="document.getElementById('sfxFreqStartVal').textContent = this.value + ' Hz'"/>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:4px;">
                <span>End Frequency (Hz)</span>
                <span id="sfxFreqEndVal">110 Hz</span>
              </div>
              <input type="range" id="sfxFreqEnd" min="30" max="1500" value="110" style="width:100%;cursor:pointer;"
                oninput="document.getElementById('sfxFreqEndVal').textContent = this.value + ' Hz'"/>
            </div>

            <div>
              <div style="display:flex;justify-content:space-between;color:var(--muted);margin-bottom:4px;">
                <span>Duration (ms)</span>
                <span id="sfxDurationVal">180 ms</span>
              </div>
              <input type="range" id="sfxDuration" min="50" max="1000" value="180" style="width:100%;cursor:pointer;"
                oninput="document.getElementById('sfxDurationVal').textContent = this.value + ' ms'"/>
            </div>

            <div>
              <span style="color:var(--muted);display:block;margin-bottom:6px;">Waveform Generator</span>
              <div style="display:flex;gap:8px;">
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="radio" name="sfxWave" value="sawtooth" checked/> Sawtooth</label>
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="radio" name="sfxWave" value="square"/> Square</label>
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="radio" name="sfxWave" value="triangle"/> Triangle</label>
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="radio" name="sfxWave" value="sine"/> Sine</label>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:10px;">
            <button onclick="window.playCustomSfx()" class="cf-btn cf-btn-primary" style="flex:1;padding:10px;font-size:13px;font-weight:600;">
              ▶️ Play Synth Sound
            </button>
            <button onclick="window.downloadSfxWav()" class="cf-btn" style="padding:10px 16px;font-size:13px;">
              💾 Download .WAV
            </button>
          </div>
        </div>

        <!-- Right: Pixel Art & Sprite Sheet Creator -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:20px;">👾</span>
              <strong style="font-size:15px;">Pixel Art & Game Sprite Forge</strong>
            </div>
            <span style="font-size:11px;background:rgba(124,106,247,0.15);color:var(--accent);padding:2px 8px;border-radius:12px;">16x16 Grid</span>
          </div>

          <p style="color:var(--muted);font-size:12.5px;margin-bottom:12px;">
            Create 2D pixel sprites, game icons, or avatar textures with symmetry drawing and high-resolution PNG export.
          </p>

          <!-- Palette & Tool Palette -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <input type="color" id="pixelColorPicker" value="#00f0ff" style="width:28px;height:28px;padding:0;border:none;border-radius:4px;cursor:pointer;"/>
              <button onclick="window.setPixelColor('#00f0ff')" style="width:20px;height:20px;background:#00f0ff;border:none;border-radius:3px;cursor:pointer;"></button>
              <button onclick="window.setPixelColor('#ff007f')" style="width:20px;height:20px;background:#ff007f;border:none;border-radius:3px;cursor:pointer;"></button>
              <button onclick="window.setPixelColor('#facc15')" style="width:20px;height:20px;background:#facc15;border:none;border-radius:3px;cursor:pointer;"></button>
              <button onclick="window.setPixelColor('#22c55e')" style="width:20px;height:20px;background:#22c55e;border:none;border-radius:3px;cursor:pointer;"></button>
              <button onclick="window.setPixelColor('#ffffff')" style="width:20px;height:20px;background:#ffffff;border:none;border-radius:3px;cursor:pointer;"></button>
              <button onclick="window.setPixelColor('eraser')" class="cf-btn" style="padding:3px 8px;font-size:11px;">🧹 Erase</button>
            </div>

            <div style="display:flex;gap:6px;">
              <label style="font-size:11.5px;color:var(--muted);display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" id="pixelSymmetryCheck" checked/> Symmetry
              </label>
              <button onclick="window.clearPixelCanvas()" class="cf-btn" style="padding:3px 8px;font-size:11px;">Clear</button>
            </div>
          </div>

          <!-- Pixel Canvas -->
          <div style="display:flex;justify-content:center;margin-bottom:14px;">
            <canvas id="pixelArtCanvas" width="256" height="256" style="background:#09090f;border:1px solid var(--border);border-radius:4px;cursor:crosshair;image-rendering:pixelated;"></canvas>
          </div>

          <div style="display:flex;gap:10px;">
            <button onclick="window.downloadPixelSpritePNG()" class="cf-btn cf-btn-primary" style="flex:1;padding:9px;font-size:13px;font-weight:600;">
              📸 Download Sprite PNG
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function initAssetForgeComponents() {
    initPixelArtEditor();
  }

  // Pixel Art Editor Engine
  let pixelGrid = Array(16).fill(null).map(() => Array(16).fill(null));
  let currentPixelColor = '#00f0ff';
  let isPixelDrawing = false;

  function initPixelArtEditor() {
    const canvas = document.getElementById('pixelArtCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Draw grid
    drawPixelGrid(ctx);

    canvas.onmousedown = (e) => {
      isPixelDrawing = true;
      paintPixel(e, canvas, ctx);
    };

    canvas.onmousemove = (e) => {
      if (!isPixelDrawing) return;
      paintPixel(e, canvas, ctx);
    };

    window.onmouseup = () => { isPixelDrawing = false; };
  }

  function paintPixel(e, canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 16);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 16);

    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
      const color = currentPixelColor === 'eraser' ? null : currentPixelColor;
      pixelGrid[y][x] = color;

      const isSymmetry = document.getElementById('pixelSymmetryCheck')?.checked;
      if (isSymmetry) {
        pixelGrid[y][15 - x] = color;
      }

      drawPixelGrid(ctx);
    }
  }

  function drawPixelGrid(ctx) {
    ctx.clearRect(0, 0, 256, 256);
    const cellSize = 256 / 16;

    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const color = pixelGrid[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.04)';
          ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  window.setPixelColor = function (color) {
    currentPixelColor = color;
    if (color !== 'eraser') {
      const picker = document.getElementById('pixelColorPicker');
      if (picker) picker.value = color;
    }
  };

  window.clearPixelCanvas = function () {
    pixelGrid = Array(16).fill(null).map(() => Array(16).fill(null));
    const canvas = document.getElementById('pixelArtCanvas');
    if (canvas) drawPixelGrid(canvas.getContext('2d'));
  };

  window.downloadPixelSpritePNG = function () {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 128;
    offCanvas.height = 128;
    const ctx = offCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const cellSize = 128 / 16;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        if (pixelGrid[r][c]) {
          ctx.fillStyle = pixelGrid[r][c];
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    const a = document.createElement('a');
    a.download = 'pixel_sprite_16x16.png';
    a.href = offCanvas.toDataURL('image/png');
    a.click();
    toast('👾 Pixel sprite exported!');
  };

  window.playAndPreviewSfx = function (preset) {
    const sfxFreqStart = document.getElementById('sfxFreqStart');
    const sfxFreqEnd = document.getElementById('sfxFreqEnd');
    const sfxDuration = document.getElementById('sfxDuration');

    if (preset === 'laser') {
      if (sfxFreqStart) sfxFreqStart.value = 920;
      if (sfxFreqEnd) sfxFreqEnd.value = 120;
      if (sfxDuration) sfxDuration.value = 160;
    } else if (preset === 'jump') {
      if (sfxFreqStart) sfxFreqStart.value = 180;
      if (sfxFreqEnd) sfxFreqEnd.value = 650;
      if (sfxDuration) sfxDuration.value = 220;
    } else if (preset === 'explosion') {
      if (sfxFreqStart) sfxFreqStart.value = 160;
      if (sfxFreqEnd) sfxFreqEnd.value = 30;
      if (sfxDuration) sfxDuration.value = 350;
    } else if (preset === 'coin') {
      if (sfxFreqStart) sfxFreqStart.value = 987;
      if (sfxFreqEnd) sfxFreqEnd.value = 1318;
      if (sfxDuration) sfxDuration.value = 250;
    } else if (preset === 'powerup') {
      if (sfxFreqStart) sfxFreqStart.value = 330;
      if (sfxFreqEnd) sfxFreqEnd.value = 1100;
      if (sfxDuration) sfxDuration.value = 400;
    } else if (preset === 'hit') {
      if (sfxFreqStart) sfxFreqStart.value = 220;
      if (sfxFreqEnd) sfxFreqEnd.value = 60;
      if (sfxDuration) sfxDuration.value = 200;
    }

    // Trigger update of labels
    if (sfxFreqStart) document.getElementById('sfxFreqStartVal').textContent = sfxFreqStart.value + ' Hz';
    if (sfxFreqEnd) document.getElementById('sfxFreqEndVal').textContent = sfxFreqEnd.value + ' Hz';
    if (sfxDuration) document.getElementById('sfxDurationVal').textContent = sfxDuration.value + ' ms';

    window.playCustomSfx();
  };

  window.playCustomSfx = function () {
    try {
      const fStart = parseInt(document.getElementById('sfxFreqStart')?.value || 880, 10);
      const fEnd = parseInt(document.getElementById('sfxFreqEnd')?.value || 110, 10);
      const dur = parseInt(document.getElementById('sfxDuration')?.value || 180, 10) / 1000;
      const wave = document.querySelector('input[name="sfxWave"]:checked')?.value || 'sawtooth';

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = wave;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(fStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), now + dur);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + dur);

      osc.start(now);
      osc.stop(now + dur);
    } catch (_) {}
  };

  window.downloadSfxWav = function () {
    // Generate WAV buffer
    const fStart = parseInt(document.getElementById('sfxFreqStart')?.value || 880, 10);
    const fEnd = parseInt(document.getElementById('sfxFreqEnd')?.value || 110, 10);
    const dur = parseInt(document.getElementById('sfxDuration')?.value || 180, 10) / 1000;

    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * dur);
    const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(wavBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Synthesize PCM samples
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const progress = t / dur;
      const freq = fStart * Math.pow(Math.max(0.01, fEnd / fStart), progress);
      const sample = Math.sin(2 * Math.PI * freq * t) * (1 - progress);
      view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    downloadBlob(blob, 'retro_sfx.wav');
    toast('💾 WAV Sound file downloaded!');
  };

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // ==========================================================================
  // 4. 3D MODEL VAULT / SAVED MODELS VIEW
  // ==========================================================================
  function renderLibraryView() {
    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:22px;">📚</span>
            <strong style="font-size:16px;">Saved 3D Models & Vault Catalog</strong>
          </div>
          <button onclick="window.switchGamingSubtab('3dgen')" class="cf-btn cf-btn-primary" style="font-size:12px;padding:6px 12px;">
            ➕ Create New 3D Model
          </button>
        </div>

        <div id="saved3DModelsGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px;">
          <div style="color:var(--muted);text-align:center;padding:40px 0;grid-column:1/-1;">Loading saved 3D models...</div>
        </div>
      </div>
    `;
  }

  async function loadSavedModelsList() {
    const grid = document.getElementById('saved3DModelsGrid');
    if (!grid) return;

    try {
      const res = await fetch('/api/3d/models');
      const data = await res.json();
      const models = data.models || [];

      if (models.length === 0) {
        grid.innerHTML = `
          <div style="text-align:center;padding:40px 0;grid-column:1/-1;color:var(--muted);">
            <div style="font-size:36px;margin-bottom:8px;">🧊</div>
            <strong>No saved 3D models yet.</strong>
            <p style="font-size:13px;margin:6px 0 14px;">Generate custom 3D models using the Prompt Synthesizer and save them here.</p>
            <button onclick="window.switchGamingSubtab('3dgen')" class="cf-btn cf-btn-primary">Generate First Model</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = models.map(m => `
        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;display:flex;flex-direction:column;">
          <div style="height:140px;background:#0d0d14;display:flex;align-items:center;justify-content:center;position:relative;">
            ${m.thumbnail ? `<img src="${m.thumbnail}" style="width:100%;height:100%;object-fit:cover;"/>` : `<span style="font-size:48px;">🧊</span>`}
            <span style="position:absolute;top:8px;right:8px;font-size:10.5px;background:rgba(0,0,0,0.7);color:#00f0ff;padding:2px 6px;border-radius:4px;text-transform:uppercase;">
              ${m.category || 'scifi'}
            </span>
          </div>
          <div style="padding:12px;flex:1;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <strong style="font-size:14px;display:block;margin-bottom:4px;">${m.name}</strong>
              <p style="font-size:12px;color:var(--muted);margin:0 0 10px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${m.prompt || 'Custom geometric construct'}
              </p>
            </div>
            <div style="display:flex;gap:6px;">
              <button onclick='window.loadSavedModelRecipe(${JSON.stringify(m.recipe).replace(/'/g, "\\'")})' class="cf-btn cf-btn-primary" style="flex:1;padding:6px;font-size:11.5px;">
                👁️ Open in Studio
              </button>
              <button onclick="window.deleteSaved3DModel('${m.id}')" class="cf-btn" style="padding:6px 10px;font-size:11.5px;color:var(--red);">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<div style="color:var(--red);text-align:center;padding:20px 0;grid-column:1/-1;">Error loading models: ${err.message}</div>`;
    }
  }

  window.loadSavedModelRecipe = function (recipe) {
    window.switchGamingSubtab('3dgen');
    setTimeout(() => {
      buildModelFromRecipe(recipe);
      toast(`Loaded ${recipe.title || 'model'}!`);
    }, 150);
  };

  window.deleteSaved3DModel = async function (id) {
    if (!confirm('Are you sure you want to delete this 3D model?')) return;
    try {
      await fetch(`/api/3d/models/${id}`, { method: 'DELETE' });
      toast('Model deleted');
      loadSavedModelsList();
    } catch (_) {}
  };

  function saveModelToLocalCache(recipe) {
    try {
      const stored = JSON.parse(localStorage.getItem('vault_local_3d_models') || '[]');
      stored.unshift({
        id: 'local_' + Date.now(),
        name: recipe.title || '3D Construct',
        prompt: recipe.prompt || '',
        category: recipe.category || 'general',
        recipe,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('vault_local_3d_models', JSON.stringify(stored.slice(0, 30)));
    } catch (_) {}
  }

  // Client-side fallback procedural compiler for instant offline generation
  function clientProceduralCompiler(prompt) {
    const text = (prompt || '').toLowerCase();
    const id = 'model_' + Date.now();

    if (text.includes('tank')) {
      return {
        id, title: 'Cyber Assault Tank', prompt, category: 'vehicles',
        camera: { position: [4, 3, 5], target: [0, 0.5, 0] },
        parts: [
          { name: 'Treads Left', shape: 'box', size: [0.6, 0.6, 3.2], position: [-1.1, 0.3, 0], color: '#1e293b' },
          { name: 'Treads Right', shape: 'box', size: [0.6, 0.6, 3.2], position: [1.1, 0.3, 0], color: '#1e293b' },
          { name: 'Hull', shape: 'box', size: [1.8, 0.6, 2.8], position: [0, 0.5, 0], color: '#334155' },
          { name: 'Turret', shape: 'cylinder', size: [0.8, 0.9, 0.5], position: [0, 1.0, 0], color: '#2563eb' },
          { name: 'Cannon Barrel', shape: 'cylinder', size: [0.12, 0.12, 2.2], position: [0, 1.1, 1.3], rotation: [Math.PI / 2, 0, 0], color: '#64748b' }
        ]
      };
    }

    // Default Starfighter
    return {
      id, title: 'Starfighter Delta', prompt, category: 'scifi',
      camera: { position: [4, 3, 5], target: [0, 0, 0] },
      parts: [
        { name: 'Fuselage', shape: 'box', size: [1.2, 0.4, 3.0], position: [0, 0, 0], color: '#38bdf8' },
        { name: 'Cockpit', shape: 'sphere', size: [0.4, 12, 12], position: [0, 0.25, 0.3], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.8 },
        { name: 'Left Wing', shape: 'box', size: [2.0, 0.08, 1.2], position: [-1.3, 0, -0.3], color: '#1e293b' },
        { name: 'Right Wing', shape: 'box', size: [2.0, 0.08, 1.2], position: [1.3, 0, -0.3], color: '#1e293b' },
        { name: 'Thruster Left', shape: 'cylinder', size: [0.2, 0.25, 0.6], position: [-0.4, 0, -1.6], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 1.0 },
        { name: 'Thruster Right', shape: 'cylinder', size: [0.2, 0.25, 0.6], position: [0.4, 0, -1.6], rotation: [Math.PI / 2, 0, 0], color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 1.0 }
      ]
    };
  }

})();
