// ============================================================================
// INFINITE CANVAS LAYER, PHOTO TO PDF CONVERTER & UNIVERSAL FILE PREVIEWER
// ============================================================================

(function () {
  let activeSuiteTab = 'canvas'; // 'canvas' | 'pdf' | 'previewer'
  
  // --------------------------------------------------------------------------
  // STATE: INFINITE CANVAS
  // --------------------------------------------------------------------------
  let canvasElements = []; // { id, type, x, y, width, height, ... }
  let undoStack = [];
  let redoStack = [];
  let selectedElementId = null;
  let activeTool = 'select'; // 'select' | 'hand' | 'pen' | 'brush' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'line' | 'text' | 'sticky'
  let strokeColor = '#00f0ff';
  let fillColor = 'transparent';
  let strokeWidth = 3;
  let canvasScale = 1.0;
  let canvasPanX = 0;
  let canvasPanY = 0;
  let isPanning = false;
  let isDrawing = false;
  let isDraggingElement = false;
  let isResizingElement = false;
  let resizeHandle = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentStrokePoints = [];
  let boardName = 'My Creative Board';
  let activePhotoFilter = { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, invert: 0, hue: 0 };

  // --------------------------------------------------------------------------
  // STATE: PHOTO TO PDF CONVERTER
  // --------------------------------------------------------------------------
  let pdfPhotos = []; // { id, file, name, dataUrl, width, height, rotation: 0 }
  let pdfPageSize = 'a4'; // 'a4' | 'letter' | 'fit'
  let pdfOrientation = 'auto'; // 'auto' | 'portrait' | 'landscape'
  let pdfMargin = 'none'; // 'none' | 'compact' | 'standard'
  let pdfQuality = 0.9;
  let isConvertingPdf = false;

  // --------------------------------------------------------------------------
  // STATE: UNIVERSAL FILE PREVIEWER
  // --------------------------------------------------------------------------
  let previewFile = null; // { name, size, type, dataUrl, textContent, ext }
  let previewAudioCtx = null;
  let previewAudioAnim = null;

  // --------------------------------------------------------------------------
  // MAIN SUITE ENTRY
  // --------------------------------------------------------------------------
  window.renderInfiniteCanvasSuite = function (subtab) {
    if (subtab) activeSuiteTab = subtab;
    const content = document.getElementById('mainContent');
    if (!content) return;

    content.innerHTML = `
      <div style="max-width:1440px;margin:0 auto;padding:12px 16px 60px;">
        <!-- Top Navigation Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border);">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:26px;">🎨</span>
              <h1 style="font-size:22px;font-weight:700;letter-spacing:-0.4px;margin:0;">Creative Canvas & File Lab</h1>
              <span style="background:linear-gradient(135deg,#7c6af7,#00f0ff);color:#0f0f13;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;">v2.0 PRO</span>
            </div>
            <p style="color:var(--muted);font-size:13.5px;margin:4px 0 0;">
              Infinite whiteboard & paint studio, full photo editor & annotator, fast photo-to-PDF converter, and universal file previewer.
            </p>
          </div>

          <!-- Suite Subtab Switcher -->
          <div style="display:flex;gap:8px;background:var(--surface);border:1px solid var(--border);padding:4px;border-radius:var(--radius-sm);">
            <button onclick="window.switchCanvasSuiteSubtab('canvas')" class="cf-btn ${activeSuiteTab === 'canvas' ? 'cf-btn-primary' : ''}" style="padding:6px 14px;font-size:12.5px;">
              <span>🎨</span> Infinite Canvas & Photo Studio
            </button>
            <button onclick="window.switchCanvasSuiteSubtab('pdf')" class="cf-btn ${activeSuiteTab === 'pdf' ? 'cf-btn-primary' : ''}" style="padding:6px 14px;font-size:12.5px;">
              <span>📄</span> Photo to PDF
            </button>
            <button onclick="window.switchCanvasSuiteSubtab('previewer')" class="cf-btn ${activeSuiteTab === 'previewer' ? 'cf-btn-primary' : ''}" style="padding:6px 14px;font-size:12.5px;">
              <span>👁️</span> Universal File Previewer
            </button>
          </div>
        </div>

        <!-- Dynamic Container -->
        <div id="suiteContainer">
          ${renderSuiteContent()}
        </div>
      </div>
    `;

    // Subtab initializers
    if (activeSuiteTab === 'canvas') {
      initCanvasEngine();
    } else if (activeSuiteTab === 'pdf') {
      renderPdfPhotosList();
    }
  };

  window.switchCanvasSuiteSubtab = function (sub) {
    activeSuiteTab = sub;
    window.renderInfiniteCanvasSuite(sub);
  };

  function renderSuiteContent() {
    if (activeSuiteTab === 'canvas') return renderCanvasView();
    if (activeSuiteTab === 'pdf') return renderPdfView();
    if (activeSuiteTab === 'previewer') return renderPreviewerView();
    return '';
  }

  // ==========================================================================
  // 1. INFINITE CANVAS & PHOTO EDITOR
  // ==========================================================================
  function renderCanvasView() {
    return `
      <!-- Toolbar Controls -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;box-shadow:0 4px 16px rgba(0,0,0,0.2);">
        
        <!-- Tool Selector Group -->
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
          <button onclick="window.setCanvasTool('select')" id="tool-select" class="canvas-tool-btn active" title="Select & Move (V)">
            <span>👆</span> Select
          </button>
          <button onclick="window.setCanvasTool('hand')" id="tool-hand" class="canvas-tool-btn" title="Hand Pan (H / Space+Drag)">
            <span>✋</span> Pan
          </button>
          <div style="width:1px;height:22px;background:var(--border);margin:0 4px;"></div>
          <button onclick="window.setCanvasTool('pen')" id="tool-pen" class="canvas-tool-btn" title="Crisp Pen (P)">
            <span>✏️</span> Pen
          </button>
          <button onclick="window.setCanvasTool('brush')" id="tool-brush" class="canvas-tool-btn" title="Soft Brush (B)">
            <span>🖌️</span> Brush
          </button>
          <button onclick="window.setCanvasTool('highlighter')" id="tool-highlighter" class="canvas-tool-btn" title="Highlighter (M)">
            <span>🖍️</span> Marker
          </button>
          <button onclick="window.setCanvasTool('eraser')" id="tool-eraser" class="canvas-tool-btn" title="Eraser (E)">
            <span>🧽</span> Eraser
          </button>
          <div style="width:1px;height:22px;background:var(--border);margin:0 4px;"></div>
          <button onclick="window.setCanvasTool('rect')" id="tool-rect" class="canvas-tool-btn" title="Rectangle (R)">
            <span>⬜</span>
          </button>
          <button onclick="window.setCanvasTool('circle')" id="tool-circle" class="canvas-tool-btn" title="Circle (O)">
            <span>⭕</span>
          </button>
          <button onclick="window.setCanvasTool('arrow')" id="tool-arrow" class="canvas-tool-btn" title="Arrow (A)">
            <span>➡️</span>
          </button>
          <button onclick="window.setCanvasTool('line')" id="tool-line" class="canvas-tool-btn" title="Straight Line (L)">
            <span>➖</span>
          </button>
          <div style="width:1px;height:22px;background:var(--border);margin:0 4px;"></div>
          <button onclick="window.setCanvasTool('text')" id="tool-text" class="canvas-tool-btn" title="Text Box (T)">
            <span>🔤</span> Text
          </button>
          <button onclick="window.setCanvasTool('sticky')" id="tool-sticky" class="canvas-tool-btn" title="Sticky Note (S)">
            <span>📝</span> Note
          </button>
          <button onclick="document.getElementById('canvasPhotoInput').click()" class="canvas-tool-btn" title="Insert / Upload Any Photo">
            <span>🖼️</span> Add Photo
          </button>
          <input type="file" id="canvasPhotoInput" accept="image/*" style="display:none;" onchange="window.handleCanvasPhotoUpload(event)" multiple/>
        </div>

        <!-- Color & Stroke Settings -->
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <!-- Stroke color -->
          <div style="display:flex;align-items:center;gap:5px;" title="Stroke Color">
            <span style="font-size:11px;color:var(--muted);">Ink:</span>
            <input type="color" id="strokeColorPicker" value="${strokeColor}" onchange="window.setStrokeColor(this.value)" style="width:24px;height:24px;border:none;border-radius:4px;cursor:pointer;padding:0;"/>
          </div>

          <!-- Fill color -->
          <div style="display:flex;align-items:center;gap:5px;" title="Shape Fill">
            <span style="font-size:11px;color:var(--muted);">Fill:</span>
            <select id="shapeFillSelect" onchange="window.setShapeFill(this.value)" style="padding:3px 6px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:11px;border-radius:4px;">
              <option value="transparent">None</option>
              <option value="semi">50% Match</option>
              <option value="solid">Solid Match</option>
              <option value="#ffffff">White</option>
              <option value="#0f0f13">Dark</option>
            </select>
          </div>

          <!-- Stroke width -->
          <div style="display:flex;align-items:center;gap:6px;" title="Line Thickness">
            <span style="font-size:11px;color:var(--muted);">Size:</span>
            <input type="range" min="1" max="40" value="${strokeWidth}" style="width:65px;cursor:pointer;" oninput="window.setStrokeWidth(this.value)"/>
            <span id="strokeWidthLabel" style="font-size:11px;font-family:'JetBrains Mono',monospace;width:24px;">${strokeWidth}px</span>
          </div>

          <div style="width:1px;height:22px;background:var(--border);margin:0 2px;"></div>

          <!-- History & Actions -->
          <button onclick="window.undoCanvasAction()" class="cf-btn" style="padding:4px 8px;font-size:11.5px;" title="Undo (Ctrl+Z)">↩️ Undo</button>
          <button onclick="window.redoCanvasAction()" class="cf-btn" style="padding:4px 8px;font-size:11.5px;" title="Redo (Ctrl+Y)">↪️ Redo</button>
          <button onclick="window.clearCanvasConfirm()" class="cf-btn" style="padding:4px 8px;font-size:11.5px;color:var(--red);" title="Clear entire board">🗑️ Clear</button>
          
          <!-- Export & PDF Bridge -->
          <div style="display:flex;gap:5px;">
            <button onclick="window.exportCanvasImage('png')" class="cf-btn" style="padding:4px 8px;font-size:11.5px;" title="Export board as PNG">💾 PNG</button>
            <button onclick="window.sendCanvasToPdfConverter()" class="cf-btn cf-btn-primary" style="padding:4px 10px;font-size:11.5px;font-weight:600;" title="Send all photos to PDF Converter">
              <span>📄</span> Send to PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Main Canvas Stage & Floating HUD -->
      <div style="position:relative;width:100%;height:640px;background:#0d0d14;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:inset 0 0 40px rgba(0,0,0,0.6);" id="canvasViewportWrapper">
        
        <!-- The Infinite HTML5 Canvas -->
        <canvas id="infiniteMainCanvas" style="display:block;width:100%;height:100%;cursor:crosshair;"></canvas>

        <!-- Coordinate & Zoom HUD (Bottom Left) -->
        <div style="position:absolute;bottom:14px;left:14px;background:rgba(15,15,22,0.9);backdrop-filter:blur(8px);border:1px solid var(--border);padding:6px 12px;border-radius:20px;display:flex;align-items:center;gap:10px;font-size:12px;z-index:20;">
          <button onclick="window.zoomCanvas(-0.2)" class="cf-btn" style="padding:2px 7px;font-size:11px;">−</button>
          <span id="canvasZoomLabel" style="font-family:'JetBrains Mono',monospace;min-width:44px;text-align:center;">100%</span>
          <button onclick="window.zoomCanvas(0.2)" class="cf-btn" style="padding:2px 7px;font-size:11px;">＋</button>
          <button onclick="window.resetCanvasView()" class="cf-btn" style="padding:2px 8px;font-size:11px;" title="Reset pan and zoom to center">Reset 100%</button>
          <span style="color:var(--muted);font-size:11px;">|</span>
          <span id="canvasCoordLabel" style="color:var(--muted);font-size:11px;font-family:'JetBrains Mono',monospace;">(0, 0)</span>
        </div>

        <!-- Selected Element / Photo Inspector Sidebar (Floating Top Right) -->
        <div id="elementInspectorPanel" style="display:none;position:absolute;top:14px;right:14px;width:290px;background:rgba(21,21,30,0.95);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:var(--radius);padding:14px;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
          <!-- Populated dynamically when selecting an element or photo -->
        </div>

        <!-- Quick Sticky Palette / Stamp Bar (Bottom Right) -->
        <div style="position:absolute;bottom:14px;right:14px;display:flex;gap:6px;background:rgba(15,15,22,0.9);backdrop-filter:blur(8px);border:1px solid var(--border);padding:6px 10px;border-radius:20px;z-index:20;">
          <span style="font-size:11px;color:var(--muted);display:flex;align-items:center;">Stamps:</span>
          ${['⭐','💡','🔥','✅','❌','❤️','🚀','📌'].map(e => `
            <button onclick="window.stampEmoji('${e}')" style="background:transparent;border:none;cursor:pointer;font-size:16px;padding:2px;transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">${e}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // INFINITE CANVAS ENGINE & INTERACTION
  // ==========================================================================
  function initCanvasEngine() {
    const canvas = document.getElementById('infiniteMainCanvas');
    const wrapper = document.getElementById('canvasViewportWrapper');
    if (!canvas || !wrapper) return;

    function resize() {
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
      redrawCanvas();
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse & Touch Event Handlers
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Drag & drop photo directly onto canvas
    wrapper.addEventListener('dragover', (e) => e.preventDefault());
    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) {
        Array.from(e.dataTransfer.files).forEach((file) => {
          if (file.type.startsWith('image/')) {
            const rect = canvas.getBoundingClientRect();
            const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            importPhotoFile(file, worldPos.x, worldPos.y);
          }
        });
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', onKeyDown);

    // Initial template if empty
    if (canvasElements.length === 0) {
      loadDefaultTemplate();
    }

    redrawCanvas();
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - canvasPanX) / canvasScale,
      y: (sy - canvasPanY) / canvasScale
    };
  }

  function worldToScreen(wx, wy) {
    return {
      x: wx * canvasScale + canvasPanX,
      y: wy * canvasScale + canvasPanY
    };
  }

  function onMouseDown(e) {
    const rect = e.target.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const w = screenToWorld(sx, sy);
    dragStartX = sx;
    dragStartY = sy;

    // Middle click or Space or Hand Tool -> Pan
    if (e.button === 1 || e.spaceKey || activeTool === 'hand') {
      isPanning = true;
      e.target.style.cursor = 'grabbing';
      return;
    }

    if (activeTool === 'select') {
      // Check resize handles of selected element first
      if (selectedElementId) {
        const el = canvasElements.find((item) => item.id === selectedElementId);
        if (el && el.type === 'photo') {
          const handle = getResizeHandleUnderMouse(w.x, w.y, el);
          if (handle) {
            isResizingElement = true;
            resizeHandle = handle;
            saveHistory();
            return;
          }
        }
      }

      // Check element selection
      const clicked = getElementAtPosition(w.x, w.y);
      if (clicked) {
        selectedElementId = clicked.id;
        isDraggingElement = true;
        showElementInspector(clicked);
        saveHistory();
        redrawCanvas();
        return;
      } else {
        selectedElementId = null;
        hideElementInspector();
        redrawCanvas();
      }
    } else if (activeTool === 'pen' || activeTool === 'brush' || activeTool === 'highlighter') {
      isDrawing = true;
      saveHistory();
      currentStrokePoints = [{ x: w.x, y: w.y }];
    } else if (activeTool === 'eraser') {
      eraseAtPosition(w.x, w.y);
    } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow' || activeTool === 'line') {
      isDrawing = true;
      saveHistory();
      const id = 'shape_' + Date.now();
      const newShape = {
        id,
        type: activeTool,
        x: w.x,
        y: w.y,
        width: 1,
        height: 1,
        strokeColor,
        fillColor,
        strokeWidth
      };
      canvasElements.push(newShape);
      selectedElementId = id;
    } else if (activeTool === 'text') {
      const text = prompt('Enter text note:', 'Annotation');
      if (text) {
        saveHistory();
        canvasElements.push({
          id: 'text_' + Date.now(),
          type: 'text',
          x: w.x,
          y: w.y,
          text,
          fontSize: 22,
          color: strokeColor
        });
        redrawCanvas();
      }
    } else if (activeTool === 'sticky') {
      saveHistory();
      canvasElements.push({
        id: 'sticky_' + Date.now(),
        type: 'sticky',
        x: w.x,
        y: w.y,
        width: 180,
        height: 160,
        title: 'Sticky Note',
        body: 'Click to write or edit your note...',
        bg: '#facc15'
      });
      redrawCanvas();
    }
  }

  function onMouseMove(e) {
    const canvas = document.getElementById('infiniteMainCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const w = screenToWorld(sx, sy);

    // Update coordinate HUD
    const coordEl = document.getElementById('canvasCoordLabel');
    if (coordEl) coordEl.textContent = `(${Math.round(w.x)}, ${Math.round(w.y)})`;

    if (isPanning) {
      canvasPanX += sx - dragStartX;
      canvasPanY += sy - dragStartY;
      dragStartX = sx;
      dragStartY = sy;
      redrawCanvas();
      return;
    }

    if (isDraggingElement && selectedElementId) {
      const el = canvasElements.find((item) => item.id === selectedElementId);
      if (el) {
        const dx = (sx - dragStartX) / canvasScale;
        const dy = (sy - dragStartY) / canvasScale;
        el.x += dx;
        el.y += dy;
        dragStartX = sx;
        dragStartY = sy;
        redrawCanvas();
      }
      return;
    }

    if (isResizingElement && selectedElementId && resizeHandle) {
      const el = canvasElements.find((item) => item.id === selectedElementId);
      if (el) {
        const dx = (sx - dragStartX) / canvasScale;
        const dy = (sy - dragStartY) / canvasScale;
        if (resizeHandle.includes('e')) el.width = Math.max(30, el.width + dx);
        if (resizeHandle.includes('s')) el.height = Math.max(30, el.height + dy);
        if (resizeHandle.includes('w')) {
          el.x += dx;
          el.width = Math.max(30, el.width - dx);
        }
        if (resizeHandle.includes('n')) {
          el.y += dy;
          el.height = Math.max(30, el.height - dy);
        }
        dragStartX = sx;
        dragStartY = sy;
        redrawCanvas();
      }
      return;
    }

    if (isDrawing) {
      if (activeTool === 'pen' || activeTool === 'brush' || activeTool === 'highlighter') {
        currentStrokePoints.push({ x: w.x, y: w.y });
        redrawCanvas();
      } else if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow' || activeTool === 'line') {
        const shape = canvasElements[canvasElements.length - 1];
        if (shape) {
          shape.width = w.x - shape.x;
          shape.height = w.y - shape.y;
          redrawCanvas();
        }
      }
    } else if (activeTool === 'eraser' && e.buttons === 1) {
      eraseAtPosition(w.x, w.y);
    }
  }

  function onMouseUp() {
    if (isDrawing && (activeTool === 'pen' || activeTool === 'brush' || activeTool === 'highlighter')) {
      if (currentStrokePoints.length > 1) {
        canvasElements.push({
          id: 'stroke_' + Date.now(),
          type: 'stroke',
          points: [...currentStrokePoints],
          color: strokeColor,
          width: strokeWidth,
          mode: activeTool
        });
      }
      currentStrokePoints = [];
    }

    isPanning = false;
    isDrawing = false;
    isDraggingElement = false;
    isResizingElement = false;
    resizeHandle = null;
    const canvas = document.getElementById('infiniteMainCanvas');
    if (canvas) canvas.style.cursor = activeTool === 'hand' ? 'grab' : 'crosshair';
    redrawCanvas();
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = Math.max(0.1, Math.min(5.0, canvasScale * zoomFactor));

    // Zoom towards mouse position
    canvasPanX = mx - (mx - canvasPanX) * (newScale / canvasScale);
    canvasPanY = my - (my - canvasPanY) * (newScale / canvasScale);
    canvasScale = newScale;

    updateZoomDisplay();
    redrawCanvas();
  }

  function onKeyDown(e) {
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) window.redoCanvasAction();
      else window.undoCanvasAction();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      window.redoCanvasAction();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElementId) {
        saveHistory();
        canvasElements = canvasElements.filter((item) => item.id !== selectedElementId);
        selectedElementId = null;
        hideElementInspector();
        redrawCanvas();
      }
    } else if (e.key.toLowerCase() === 'v') window.setCanvasTool('select');
    else if (e.key.toLowerCase() === 'h') window.setCanvasTool('hand');
    else if (e.key.toLowerCase() === 'p') window.setCanvasTool('pen');
    else if (e.key.toLowerCase() === 'b') window.setCanvasTool('brush');
    else if (e.key.toLowerCase() === 'e') window.setCanvasTool('eraser');
  }

  // ==========================================================================
  // CANVAS RENDERING LOOP
  // ==========================================================================
  function redrawCanvas() {
    const canvas = document.getElementById('infiniteMainCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Infinite Dot Grid Background
    drawGrid(ctx, width, height);

    ctx.save();
    ctx.translate(canvasPanX, canvasPanY);
    ctx.scale(canvasScale, canvasScale);

    // Draw all stored elements in z-order
    canvasElements.forEach((el) => {
      drawSingleElement(ctx, el);
    });

    // Draw active drawing stroke in progress
    if (isDrawing && currentStrokePoints.length > 1) {
      drawStroke(ctx, currentStrokePoints, strokeColor, strokeWidth, activeTool);
    }

    // Draw bounding box and handles for selected element
    if (selectedElementId) {
      const selected = canvasElements.find((item) => item.id === selectedElementId);
      if (selected) {
        drawSelectionBox(ctx, selected);
      }
    }

    ctx.restore();
  }

  function drawGrid(ctx, width, height) {
    const gridSize = 32 * canvasScale;
    const startX = canvasPanX % gridSize;
    const startY = canvasPanY % gridSize;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = startX; x < width; x += gridSize) {
      for (let y = startY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawSingleElement(ctx, el) {
    ctx.save();
    switch (el.type) {
      case 'stroke':
        drawStroke(ctx, el.points, el.color, el.width, el.mode);
        break;
      case 'rect':
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth;
        if (el.fillColor && el.fillColor !== 'transparent') {
          ctx.fillStyle = el.fillColor === 'semi' ? hexToRgba(el.strokeColor, 0.25) : el.fillColor;
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        break;
      case 'circle':
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth;
        ctx.beginPath();
        const rx = Math.abs(el.width) / 2;
        const ry = Math.abs(el.height) / 2;
        ctx.ellipse(el.x + el.width / 2, el.y + el.height / 2, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        if (el.fillColor && el.fillColor !== 'transparent') {
          ctx.fillStyle = el.fillColor === 'semi' ? hexToRgba(el.strokeColor, 0.25) : el.fillColor;
          ctx.fill();
        }
        ctx.stroke();
        break;
      case 'line':
      case 'arrow':
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();

        if (el.type === 'arrow') {
          const angle = Math.atan2(el.height, el.width);
          const headLen = Math.max(10, el.strokeWidth * 3.5);
          const targetX = el.x + el.width;
          const targetY = el.y + el.height;
          ctx.fillStyle = el.strokeColor;
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(targetX - headLen * Math.cos(angle - Math.PI / 6), targetY - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(targetX - headLen * Math.cos(angle + Math.PI / 6), targetY - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'photo':
        if (el.imgObj && el.imgObj.complete) {
          ctx.save();
          // Apply photo filters
          const f = el.filter || activePhotoFilter;
          ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) blur(${f.blur}px) grayscale(${f.grayscale}%) sepia(${f.sepia}%) invert(${f.invert}%) hue-rotate(${f.hue}deg)`;
          ctx.drawImage(el.imgObj, el.x, el.y, el.width, el.height);
          ctx.restore();
        }
        break;
      case 'text':
        ctx.font = `${el.fontSize || 22}px 'Inter', sans-serif`;
        ctx.fillStyle = el.color || '#ffffff';
        ctx.fillText(el.text, el.x, el.y);
        break;
      case 'sticky':
        ctx.fillStyle = el.bg || '#facc15';
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.shadowColor = 'transparent';

        // Sticky title
        ctx.fillStyle = '#1e1b4b';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillText(el.title || 'Note', el.x + 12, el.y + 22);

        // Sticky body
        ctx.font = '12px Inter, sans-serif';
        wrapText(ctx, el.body || '', el.x + 12, el.y + 44, el.width - 24, 18);
        break;
    }
    ctx.restore();
  }

  function drawStroke(ctx, points, color, width, mode) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = width * 2.5;
    } else if (mode === 'brush') {
      ctx.shadowColor = color;
      ctx.shadowBlur = width * 1.5;
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawSelectionBox(ctx, el) {
    const b = getElementBounds(el);
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);

    // Corner Handles for resizing
    ctx.fillStyle = '#00f0ff';
    ctx.setLineDash([]);
    const handleSize = 7;
    const corners = [
      { x: b.x - 4, y: b.y - 4 },
      { x: b.x + b.width + 4, y: b.y - 4 },
      { x: b.x - 4, y: b.y + b.height + 4 },
      { x: b.x + b.width + 4, y: b.y + b.height + 4 }
    ];
    corners.forEach((c) => {
      ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });

    ctx.restore();
  }

  function getElementBounds(el) {
    if (el.type === 'stroke') {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      el.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    if (el.type === 'text') {
      return { x: el.x, y: el.y - (el.fontSize || 22), width: (el.text.length * (el.fontSize || 22)) * 0.6, height: el.fontSize || 22 };
    }
    return {
      x: Math.min(el.x, el.x + (el.width || 0)),
      y: Math.min(el.y, el.y + (el.height || 0)),
      width: Math.abs(el.width || 50),
      height: Math.abs(el.height || 50)
    };
  }

  function getElementAtPosition(wx, wy) {
    for (let i = canvasElements.length - 1; i >= 0; i--) {
      const el = canvasElements[i];
      const b = getElementBounds(el);
      if (wx >= b.x - 5 && wx <= b.x + b.width + 5 && wy >= b.y - 5 && wy <= b.y + b.height + 5) {
        return el;
      }
    }
    return null;
  }

  function getResizeHandleUnderMouse(wx, wy, el) {
    const b = getElementBounds(el);
    const tol = 10;
    if (Math.abs(wx - (b.x + b.width)) < tol && Math.abs(wy - (b.y + b.height)) < tol) return 'se';
    if (Math.abs(wx - b.x) < tol && Math.abs(wy - b.y) < tol) return 'nw';
    if (Math.abs(wx - (b.x + b.width)) < tol && Math.abs(wy - b.y) < tol) return 'ne';
    if (Math.abs(wx - b.x) < tol && Math.abs(wy - (b.y + b.height)) < tol) return 'sw';
    return null;
  }

  function eraseAtPosition(wx, wy) {
    const tol = 18;
    const initialLen = canvasElements.length;
    canvasElements = canvasElements.filter((el) => {
      const b = getElementBounds(el);
      const isInside = wx >= b.x - tol && wx <= b.x + b.width + tol && wy >= b.y - tol && wy <= b.y + b.height + tol;
      return !isInside;
    });
    if (canvasElements.length !== initialLen) {
      saveHistory();
      redrawCanvas();
    }
  }

  // ==========================================================================
  // PHOTO IMPORT, FILTERS & EDITING
  // ==========================================================================
  window.handleCanvasPhotoUpload = function (event) {
    const files = event.target.files;
    if (!files || !files.length) return;
    const viewCenter = screenToWorld(
      document.getElementById('infiniteMainCanvas').width / 2,
      document.getElementById('infiniteMainCanvas').height / 2
    );

    Array.from(files).forEach((file, idx) => {
      importPhotoFile(file, viewCenter.x + idx * 30, viewCenter.y + idx * 30);
    });
    event.target.value = '';
  };

  function importPhotoFile(file, wx, wy) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        saveHistory();
        const maxDim = 420;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w *= ratio;
          h *= ratio;
        }

        const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
        const photoEl = {
          id,
          type: 'photo',
          name: file.name,
          dataUrl,
          imgObj: img,
          x: wx - w / 2,
          y: wy - h / 2,
          width: w,
          height: h,
          filter: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, invert: 0, hue: 0 }
        };

        canvasElements.push(photoEl);
        selectedElementId = id;
        showElementInspector(photoEl);
        redrawCanvas();
        toast('🖼️ Photo imported onto canvas');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function showElementInspector(el) {
    const panel = document.getElementById('elementInspectorPanel');
    if (!panel) return;
    panel.style.display = 'block';

    if (el.type === 'photo') {
      const f = el.filter || activePhotoFilter;
      panel.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <strong style="font-size:13.5px;color:#00f0ff;display:flex;align-items:center;gap:6px;">
            <span>🖼️</span> Photo Editor
          </strong>
          <button onclick="window.closeInspector()" style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:14px;">✕</button>
        </div>

        <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;">
          ${el.name || 'Image'} (${Math.round(el.width)}×${Math.round(el.height)})
        </div>

        <!-- Filter Sliders -->
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
          <div>
            <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:11px;">
              <span>Brightness</span>
              <span id="p-bright-val">${f.brightness}%</span>
            </div>
            <input type="range" min="20" max="200" value="${f.brightness}" style="width:100%;cursor:pointer;" oninput="window.updatePhotoFilter('brightness', this.value)"/>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:11px;">
              <span>Contrast</span>
              <span id="p-contrast-val">${f.contrast}%</span>
            </div>
            <input type="range" min="20" max="200" value="${f.contrast}" style="width:100%;cursor:pointer;" oninput="window.updatePhotoFilter('contrast', this.value)"/>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:11px;">
              <span>Saturation</span>
              <span id="p-sat-val">${f.saturation}%</span>
            </div>
            <input type="range" min="0" max="200" value="${f.saturation}" style="width:100%;cursor:pointer;" oninput="window.updatePhotoFilter('saturation', this.value)"/>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:11px;">
              <span>Grayscale</span>
              <span id="p-gray-val">${f.grayscale}%</span>
            </div>
            <input type="range" min="0" max="100" value="${f.grayscale}" style="width:100%;cursor:pointer;" oninput="window.updatePhotoFilter('grayscale', this.value)"/>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:11px;">
              <span>Sepia / Vintage</span>
              <span id="p-sepia-val">${f.sepia}%</span>
            </div>
            <input type="range" min="0" max="100" value="${f.sepia}" style="width:100%;cursor:pointer;" oninput="window.updatePhotoFilter('sepia', this.value)"/>
          </div>
        </div>

        <!-- Quick actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;">
          <button onclick="window.resetPhotoFilters()" class="cf-btn" style="padding:4px;font-size:11px;">Reset Filters</button>
          <button onclick="window.bringElementForward()" class="cf-btn" style="padding:4px;font-size:11px;">Bring Front</button>
          <button onclick="window.duplicateSelectedElement()" class="cf-btn" style="padding:4px;font-size:11px;">Duplicate</button>
          <button onclick="window.deleteSelectedElement()" class="cf-btn" style="padding:4px;font-size:11px;color:var(--red);">Delete</button>
        </div>
      `;
    } else {
      panel.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <strong style="font-size:13.5px;color:var(--accent);">Element Selected</strong>
          <button onclick="window.closeInspector()" style="background:transparent;border:none;color:var(--muted);cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;gap:6px;">
          <button onclick="window.bringElementForward()" class="cf-btn" style="padding:5px;font-size:11px;flex:1;">Bring Front</button>
          <button onclick="window.deleteSelectedElement()" class="cf-btn" style="padding:5px;font-size:11px;flex:1;color:var(--red);">Delete</button>
        </div>
      `;
    }
  }

  function hideElementInspector() {
    const panel = document.getElementById('elementInspectorPanel');
    if (panel) panel.style.display = 'none';
  }

  window.closeInspector = hideElementInspector;

  window.updatePhotoFilter = function (key, val) {
    if (!selectedElementId) return;
    const el = canvasElements.find((item) => item.id === selectedElementId);
    if (!el || el.type !== 'photo') return;
    el.filter = el.filter || { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, invert: 0, hue: 0 };
    el.filter[key] = Number(val);
    const label = document.getElementById(`p-${key}-val`);
    if (label) label.textContent = `${val}%`;
    redrawCanvas();
  };

  window.resetPhotoFilters = function () {
    if (!selectedElementId) return;
    const el = canvasElements.find((item) => item.id === selectedElementId);
    if (!el || el.type !== 'photo') return;
    el.filter = { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, invert: 0, hue: 0 };
    showElementInspector(el);
    redrawCanvas();
  };

  window.bringElementForward = function () {
    if (!selectedElementId) return;
    const idx = canvasElements.findIndex((item) => item.id === selectedElementId);
    if (idx >= 0 && idx < canvasElements.length - 1) {
      saveHistory();
      const item = canvasElements.splice(idx, 1)[0];
      canvasElements.push(item);
      redrawCanvas();
    }
  };

  window.duplicateSelectedElement = function () {
    if (!selectedElementId) return;
    const el = canvasElements.find((item) => item.id === selectedElementId);
    if (!el) return;
    saveHistory();
    const copy = JSON.parse(JSON.stringify(el));
    copy.id = el.type + '_' + Date.now();
    copy.x += 25;
    copy.y += 25;
    if (el.type === 'photo' && el.imgObj) {
      copy.imgObj = el.imgObj;
    }
    canvasElements.push(copy);
    selectedElementId = copy.id;
    redrawCanvas();
    toast('Element duplicated');
  };

  window.deleteSelectedElement = function () {
    if (!selectedElementId) return;
    saveHistory();
    canvasElements = canvasElements.filter((item) => item.id !== selectedElementId);
    selectedElementId = null;
    hideElementInspector();
    redrawCanvas();
    toast('Element removed');
  };

  window.stampEmoji = function (emoji) {
    const center = screenToWorld(
      document.getElementById('infiniteMainCanvas').width / 2,
      document.getElementById('infiniteMainCanvas').height / 2
    );
    saveHistory();
    canvasElements.push({
      id: 'stamp_' + Date.now(),
      type: 'text',
      x: center.x,
      y: center.y,
      text: emoji,
      fontSize: 44,
      color: '#ffffff'
    });
    redrawCanvas();
  };

  // ==========================================================================
  // CANVAS TOOLBAR DISPATCHERS
  // ==========================================================================
  window.setCanvasTool = function (tool) {
    activeTool = tool;
    document.querySelectorAll('.canvas-tool-btn').forEach((b) => b.classList.remove('active'));
    const btn = document.getElementById('tool-' + tool);
    if (btn) btn.classList.add('active');

    const canvas = document.getElementById('infiniteMainCanvas');
    if (canvas) {
      canvas.style.cursor = tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : 'crosshair';
    }
  };

  window.setStrokeColor = function (color) {
    strokeColor = color;
  };

  window.setShapeFill = function (fill) {
    fillColor = fill;
  };

  window.setStrokeWidth = function (val) {
    strokeWidth = Number(val);
    const label = document.getElementById('strokeWidthLabel');
    if (label) label.textContent = `${val}px`;
  };

  window.zoomCanvas = function (delta) {
    const canvas = document.getElementById('infiniteMainCanvas');
    if (!canvas) return;
    const mx = canvas.width / 2;
    const my = canvas.height / 2;
    const newScale = Math.max(0.1, Math.min(5.0, canvasScale + delta));
    canvasPanX = mx - (mx - canvasPanX) * (newScale / canvasScale);
    canvasPanY = my - (my - canvasPanY) * (newScale / canvasScale);
    canvasScale = newScale;
    updateZoomDisplay();
    redrawCanvas();
  };

  window.resetCanvasView = function () {
    canvasScale = 1.0;
    canvasPanX = 0;
    canvasPanY = 0;
    updateZoomDisplay();
    redrawCanvas();
  };

  function updateZoomDisplay() {
    const label = document.getElementById('canvasZoomLabel');
    if (label) label.textContent = `${Math.round(canvasScale * 100)}%`;
  }

  function saveHistory() {
    undoStack.push(JSON.stringify(canvasElements));
    if (undoStack.length > 30) undoStack.shift();
    redoStack = [];
  }

  window.undoCanvasAction = function () {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(canvasElements));
    const previous = JSON.parse(undoStack.pop());
    restoreElements(previous);
  };

  window.redoCanvasAction = function () {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(canvasElements));
    const next = JSON.parse(redoStack.pop());
    restoreElements(next);
  };

  function restoreElements(elements) {
    canvasElements = elements;
    // Re-bind image objects for photos
    canvasElements.forEach((el) => {
      if (el.type === 'photo' && el.dataUrl) {
        const img = new Image();
        img.src = el.dataUrl;
        el.imgObj = img;
      }
    });
    redrawCanvas();
  }

  window.clearCanvasConfirm = function () {
    if (confirm('Clear the entire canvas?')) {
      saveHistory();
      canvasElements = [];
      selectedElementId = null;
      hideElementInspector();
      redrawCanvas();
      toast('Canvas cleared');
    }
  };

  window.exportCanvasImage = function (format) {
    const canvas = document.getElementById('infiniteMainCanvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
    const link = document.createElement('a');
    link.download = `canvas_artwork_${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
    toast(`💾 Canvas exported as ${format.toUpperCase()}`);
  };

  window.sendCanvasToPdfConverter = function () {
    const photos = canvasElements.filter((el) => el.type === 'photo');
    if (photos.length === 0) {
      // Export current canvas snapshot as a photo for PDF
      const canvas = document.getElementById('infiniteMainCanvas');
      const dataUrl = canvas.toDataURL('image/png');
      pdfPhotos.push({
        id: 'pdf_page_' + Date.now(),
        name: 'Canvas Artwork',
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        rotation: 0
      });
    } else {
      photos.forEach((p) => {
        pdfPhotos.push({
          id: 'pdf_page_' + Date.now() + Math.random(),
          name: p.name || 'Canvas Photo',
          dataUrl: p.dataUrl,
          width: p.width,
          height: p.height,
          rotation: 0
        });
      });
    }

    toast('📄 Sent photos to PDF Converter!');
    window.switchCanvasSuiteSubtab('pdf');
  };

  function loadDefaultTemplate() {
    canvasElements = [
      {
        id: 'note_welcome',
        type: 'sticky',
        x: 80,
        y: 80,
        width: 220,
        height: 180,
        title: '🎨 Welcome to Canvas',
        body: 'Drag and drop any photos, write notes, draw with pen/brush/highlighter, and export as PDF or PNG!',
        bg: '#facc15'
      },
      {
        id: 'note_tools',
        type: 'sticky',
        x: 340,
        y: 80,
        width: 220,
        height: 180,
        title: '💡 Quick Shortcuts',
        body: '• V: Select & Move\n• P: Pen | B: Brush\n• Space+Drag: Pan\n• Mousewheel: Zoom\n• Ctrl+Z: Undo',
        bg: '#38bdf8'
      }
    ];
  }

  // ==========================================================================
  // 2. SIMPLE PHOTO TO PDF CONVERTER
  // ==========================================================================
  function renderPdfView() {
    return `
      <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start;">
        
        <!-- Left: Photo Pages Grid & Dropzone -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <div>
              <strong style="font-size:15px;display:flex;align-items:center;gap:6px;">
                <span>📄</span> Photo to PDF Pages
              </strong>
              <div style="font-size:12px;color:var(--muted);margin-top:2px;">
                Drag to reorder pages, rotate images, and convert into a crisp multi-page PDF document.
              </div>
            </div>

            <!-- Add Photos Button -->
            <div style="display:flex;gap:8px;">
              <button onclick="document.getElementById('pdfPhotoInput').click()" class="cf-btn cf-btn-primary" style="padding:7px 14px;font-size:12.5px;">
                <span>➕</span> Add Photos
              </button>
              <button onclick="window.clearPdfPhotos()" class="cf-btn" style="padding:7px 12px;font-size:12.5px;color:var(--red);">
                Clear All
              </button>
              <input type="file" id="pdfPhotoInput" accept="image/*" multiple style="display:none;" onchange="window.handlePdfPhotoUpload(event)"/>
            </div>
          </div>

          <!-- Drag and Drop Target Zone -->
          <div id="pdfDropzone" onclick="document.getElementById('pdfPhotoInput').click()"
            style="border:2px dashed var(--border);border-radius:var(--radius-sm);padding:32px 16px;text-align:center;background:var(--surface2);cursor:pointer;margin-bottom:18px;transition:all 0.15s ease;"
            onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <span style="font-size:32px;display:block;margin-bottom:8px;">📸</span>
            <strong style="font-size:14px;display:block;">Drag & Drop Photos Here or Click to Browse</strong>
            <span style="font-size:12px;color:var(--muted);">Supports JPG, PNG, WEBP, GIF, SVG, BMP (Batch upload supported)</span>
          </div>

          <!-- Pages Container -->
          <div id="pdfPagesContainer" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:14px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Right: PDF Page Configuration & Export Card -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
            <strong style="font-size:14.5px;display:block;margin-bottom:14px;">⚙️ Page Layout Options</strong>

            <div style="display:flex;flex-direction:column;gap:12px;font-size:12.5px;">
              <div>
                <label style="display:block;color:var(--muted);margin-bottom:4px;">Page Sizing</label>
                <select id="pdfPageSizeSelect" onchange="pdfPageSize = this.value" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);">
                  <option value="a4" ${pdfPageSize === 'a4' ? 'selected' : ''}>A4 (210 × 297 mm)</option>
                  <option value="letter" ${pdfPageSize === 'letter' ? 'selected' : ''}>US Letter (8.5 × 11 in)</option>
                  <option value="fit" ${pdfPageSize === 'fit' ? 'selected' : ''}>Fit to Image (No White Margins)</option>
                </select>
              </div>

              <div>
                <label style="display:block;color:var(--muted);margin-bottom:4px;">Orientation</label>
                <select id="pdfOrientationSelect" onchange="pdfOrientation = this.value" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);">
                  <option value="auto" ${pdfOrientation === 'auto' ? 'selected' : ''}>Auto (Match Image Ratio)</option>
                  <option value="portrait" ${pdfOrientation === 'portrait' ? 'selected' : ''}>Portrait</option>
                  <option value="landscape" ${pdfOrientation === 'landscape' ? 'selected' : ''}>Landscape</option>
                </select>
              </div>

              <div>
                <label style="display:block;color:var(--muted);margin-bottom:4px;">Margins</label>
                <select id="pdfMarginSelect" onchange="pdfMargin = this.value" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);">
                  <option value="none" ${pdfMargin === 'none' ? 'selected' : ''}>Borderless (Full Bleed)</option>
                  <option value="compact" ${pdfMargin === 'compact' ? 'selected' : ''}>Compact (8mm)</option>
                  <option value="standard" ${pdfMargin === 'standard' ? 'selected' : ''}>Standard (15mm)</option>
                </select>
              </div>

              <div>
                <label style="display:block;color:var(--muted);margin-bottom:4px;">Output Quality</label>
                <select id="pdfQualitySelect" onchange="pdfQuality = parseFloat(this.value)" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);">
                  <option value="0.95">High Resolution (95%)</option>
                  <option value="0.80">Optimized (80%)</option>
                  <option value="0.60">Compact File Size (60%)</option>
                </select>
              </div>

              <div>
                <label style="display:block;color:var(--muted);margin-bottom:4px;">Document Title</label>
                <input type="text" id="pdfDocTitle" value="Converted Document" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:12.5px;"/>
              </div>
            </div>

            <!-- PDF Conversion Trigger Button -->
            <button id="convertPdfBtn" onclick="window.generatePdfDocument()" class="cf-btn cf-btn-primary" style="width:100%;padding:12px;margin-top:16px;font-size:13.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
              <span>⚡</span> Convert & Download PDF
            </button>
          </div>

          <!-- Quick Actions & Bridge -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:12px;color:var(--muted);">Total Pages in Queue: <strong id="pdfPageCountBadge" style="color:var(--text);">${pdfPhotos.length}</strong></div>
            <button onclick="window.previewGeneratedPdf()" class="cf-btn" style="padding:8px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;">
              <span>👁️</span> Open in File Previewer
            </button>
          </div>

        </div>
      </div>
    `;
  }

  window.handlePdfPhotoUpload = function (e) {
    const files = e.target.files;
    if (!files || !files.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          pdfPhotos.push({
            id: 'pdf_p_' + Date.now() + Math.random(),
            file,
            name: file.name,
            dataUrl: ev.target.result,
            width: img.width,
            height: img.height,
            rotation: 0
          });
          renderPdfPhotosList();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  function renderPdfPhotosList() {
    const container = document.getElementById('pdfPagesContainer');
    const countBadge = document.getElementById('pdfPageCountBadge');
    if (countBadge) countBadge.textContent = pdfPhotos.length;
    if (!container) return;

    if (pdfPhotos.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;padding:30px;text-align:center;color:var(--muted);font-size:13px;">
          No photos added yet. Upload photos above or send photos from the Infinite Canvas.
        </div>
      `;
      return;
    }

    container.innerHTML = pdfPhotos.map((p, idx) => `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;position:relative;display:flex;flex-direction:column;">
        <div style="position:relative;height:140px;background:#09090d;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          <img src="${p.dataUrl}" style="max-width:100%;max-height:100%;object-fit:contain;transform:rotate(${p.rotation}deg);transition:transform 0.2s;" alt="${p.name}"/>
          <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,0.7);color:#fff;font-size:10.5px;font-weight:700;padding:2px 6px;border-radius:4px;">
            #${idx + 1}
          </span>
        </div>

        <div style="padding:8px 10px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);font-size:11px;">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90px;" title="${p.name}">
            ${p.name}
          </span>
          <div style="display:flex;gap:4px;">
            <button onclick="window.rotatePdfPhoto(${idx})" class="cf-btn" style="padding:2px 5px;font-size:11px;" title="Rotate 90°">🔄</button>
            <button onclick="window.removePdfPhoto(${idx})" class="cf-btn" style="padding:2px 5px;font-size:11px;color:var(--red);" title="Remove">✕</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.rotatePdfPhoto = function (idx) {
    if (pdfPhotos[idx]) {
      pdfPhotos[idx].rotation = (pdfPhotos[idx].rotation + 90) % 360;
      renderPdfPhotosList();
    }
  };

  window.removePdfPhoto = function (idx) {
    pdfPhotos.splice(idx, 1);
    renderPdfPhotosList();
  };

  window.clearPdfPhotos = function () {
    if (pdfPhotos.length && confirm('Clear all photos from PDF queue?')) {
      pdfPhotos = [];
      renderPdfPhotosList();
    }
  };

  window.generatePdfDocument = async function () {
    if (pdfPhotos.length === 0) return toast('Please add at least one photo');

    const btn = document.getElementById('convertPdfBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Rendering PDF...';
    }

    try {
      // Use jsPDF if available in global scope, or pure client-side PDF binary compiler
      const docTitle = document.getElementById('pdfDocTitle')?.value || 'Photo_Document';

      if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: pdfOrientation === 'landscape' ? 'landscape' : 'portrait',
          unit: 'mm',
          format: pdfPageSize === 'letter' ? 'letter' : 'a4'
        });

        for (let i = 0; i < pdfPhotos.length; i++) {
          if (i > 0) pdf.addPage();
          const p = pdfPhotos[i];
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          let m = pdfMargin === 'standard' ? 15 : pdfMargin === 'compact' ? 8 : 0;
          let renderW = pageWidth - m * 2;
          let renderH = pageHeight - m * 2;

          // Maintain aspect ratio
          const imgRatio = p.width / p.height;
          const pageRatio = renderW / renderH;
          if (imgRatio > pageRatio) {
            renderH = renderW / imgRatio;
          } else {
            renderW = renderH * imgRatio;
          }

          const posX = m + (pageWidth - m * 2 - renderW) / 2;
          const posY = m + (pageHeight - m * 2 - renderH) / 2;

          pdf.addImage(p.dataUrl, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
        }

        pdf.save(`${docTitle.replace(/\s+/g, '_')}.pdf`);
        toast('📄 PDF downloaded successfully!');
      } else {
        // High-res fallback: multi-page print-to-PDF or native PDF synthesis
        downloadFallbackHtmlPdf(docTitle);
      }
    } catch (err) {
      console.error('PDF error:', err);
      toast('Failed to generate PDF: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡</span> Convert & Download PDF';
      }
    }
  };

  function downloadFallbackHtmlPdf(title) {
    // Generate clean print-ready printable document ready to save as PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast('Please allow popups to save your PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: auto; margin: 0; }
          body { margin: 0; padding: 0; background: #fff; font-family: sans-serif; }
          .page { page-break-after: always; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; overflow: hidden; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        ${pdfPhotos.map(p => `
          <div class="page">
            <img src="${p.dataUrl}" style="transform:rotate(${p.rotation}deg);"/>
          </div>
        `).join('')}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast('📄 PDF print dialog opened!');
  }

  window.previewGeneratedPdf = function () {
    if (pdfPhotos.length === 0) return toast('Add photos first');
    window.switchCanvasSuiteSubtab('previewer');
    // Load first photo or mock sample in previewer
    window.loadFileInPreviewer({
      name: 'Sample_Document.pdf',
      type: 'application/pdf',
      size: 1024 * 512,
      ext: 'pdf'
    });
  };

  // ==========================================================================
  // 3. UNIVERSAL FILE PREVIEWER
  // ==========================================================================
  function renderPreviewerView() {
    return `
      <div style="display:flex;flex-direction:column;gap:18px;">
        
        <!-- Top Dropzone & Sample Files Bar -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <strong style="font-size:15px;display:flex;align-items:center;gap:6px;">
              <span>👁️</span> Universal File Previewer
            </strong>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">
              Inspect images, PDF documents, audio spectrums, videos, code syntax, CSV tables, and raw hex streams.
            </div>
          </div>

          <!-- Open File & Sample Buttons -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="document.getElementById('universalFileInput').click()" class="cf-btn cf-btn-primary" style="padding:7px 14px;font-size:12.5px;">
              <span>📂</span> Open Any File
            </button>
            <input type="file" id="universalFileInput" style="display:none;" onchange="window.handleUniversalFileUpload(event)"/>
            
            <div style="display:flex;gap:4px;">
              <button onclick="window.loadSamplePreview('image')" class="cf-btn" style="padding:7px 10px;font-size:12px;">🖼️ Image</button>
              <button onclick="window.loadSamplePreview('code')" class="cf-btn" style="padding:7px 10px;font-size:12px;">💻 Code</button>
              <button onclick="window.loadSamplePreview('csv')" class="cf-btn" style="padding:7px 10px;font-size:12px;">📊 CSV</button>
              <button onclick="window.loadSamplePreview('audio')" class="cf-btn" style="padding:7px 10px;font-size:12px;">🎵 Audio</button>
            </div>
          </div>
        </div>

        <!-- Main Preview Stage Container -->
        <div id="universalPreviewStage" style="min-height:500px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;">
          ${renderActiveFilePreview()}
        </div>

      </div>
    `;
  }

  function renderActiveFilePreview() {
    if (!previewFile) {
      return `
        <div style="padding:80px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--muted);">
          <span style="font-size:44px;">📁</span>
          <strong style="font-size:16px;color:var(--text);">No File Loaded</strong>
          <p style="max-width:400px;font-size:13px;line-height:1.5;margin:0;">
            Click <strong>"Open Any File"</strong> above or select a sample to preview Images, Code, Audio, Video, CSV, JSON or Hex streams.
          </p>
        </div>
      `;
    }

    const { name, size, type, ext } = previewFile;
    const formattedSize = formatBytes(size);

    return `
      <!-- Preview Header HUD -->
      <div style="padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">${getFileIcon(ext)}</span>
          <div>
            <strong style="font-size:13.5px;font-family:'JetBrains Mono',monospace;">${name}</strong>
            <div style="font-size:11px;color:var(--muted);">
              ${type || 'Unknown Type'} • ${formattedSize} • <span style="text-transform:uppercase;">${ext}</span>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:6px;">
          ${ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' ? `
            <button onclick="window.sendPreviewPhotoToCanvas()" class="cf-btn" style="padding:5px 10px;font-size:11.5px;">
              <span>🎨</span> Open in Canvas
            </button>
            <button onclick="window.sendPreviewPhotoToPdf()" class="cf-btn" style="padding:5px 10px;font-size:11.5px;">
              <span>📄</span> Convert to PDF
            </button>
          ` : ''}
          <button onclick="window.downloadPreviewFile()" class="cf-btn" style="padding:5px 10px;font-size:11.5px;">
            <span>💾</span> Download
          </button>
        </div>
      </div>

      <!-- Specific Type Viewer -->
      <div style="flex:1;padding:16px;display:flex;flex-direction:column;">
        ${renderViewerBody(previewFile)}
      </div>
    `;
  }

  function renderViewerBody(f) {
    const ext = (f.ext || '').toLowerCase();

    // 1. Images
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext)) {
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#09090f;border-radius:var(--radius-sm);padding:24px;overflow:auto;">
          <img id="previewImageEl" src="${f.dataUrl}" style="max-width:100%;max-height:480px;object-fit:contain;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,0.5);" alt="${f.name}"/>
          <div style="display:flex;gap:8px;font-size:12px;color:var(--muted);">
            <button onclick="document.getElementById('previewImageEl').style.transform='rotate(90deg)'" class="cf-btn" style="padding:4px 8px;font-size:11px;">🔄 Rotate</button>
            <button onclick="document.getElementById('previewImageEl').style.filter=document.getElementById('previewImageEl').style.filter?'':'invert(1)'" class="cf-btn" style="padding:4px 8px;font-size:11px;">🌓 Invert</button>
          </div>
        </div>
      `;
    }

    // 2. Audio
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;gap:20px;background:#09090f;border-radius:var(--radius-sm);">
          <div style="font-size:48px;">🎧</div>
          <audio controls autoplay src="${f.dataUrl}" style="width:100%;max-width:540px;outline:none;"></audio>
          <div style="color:var(--muted);font-size:12px;">Supported Web Audio Stream with direct buffer playback.</div>
        </div>
      `;
    }

    // 3. Video
    if (['mp4', 'webm', 'ogv', 'mov'].includes(ext)) {
      return `
        <div style="display:flex;align-items:center;justify-content:center;background:#000;border-radius:var(--radius-sm);overflow:hidden;padding:12px;">
          <video controls autoplay src="${f.dataUrl}" style="max-width:100%;max-height:500px;border-radius:4px;outline:none;"></video>
        </div>
      `;
    }

    // 4. CSV / Tabular
    if (ext === 'csv' || ext === 'tsv') {
      const rows = parseCsvString(f.textContent || '');
      return `
        <div style="overflow-x:auto;max-height:480px;border:1px solid var(--border);border-radius:var(--radius-sm);">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px;font-family:'JetBrains Mono',monospace;">
            <tbody>
              ${rows.map((r, ri) => `
                <tr style="background:${ri === 0 ? 'var(--surface2)' : ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'};border-bottom:1px solid var(--border);">
                  ${r.map(c => `
                    <td style="padding:8px 12px;border-right:1px solid var(--border);${ri === 0 ? 'font-weight:700;color:var(--accent);' : ''}">${escapeHtml(c)}</td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 5. Code, Text, Markdown, JSON
    if (['js', 'ts', 'html', 'css', 'json', 'py', 'sql', 'sh', 'md', 'txt', 'yml', 'xml', 'log'].includes(ext)) {
      const code = escapeHtml(f.textContent || '');
      return `
        <div style="position:relative;background:#09090f;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;">
          <div style="position:absolute;top:8px;right:8px;">
            <button onclick="navigator.clipboard.writeText(${JSON.stringify(f.textContent || '')}); toast('Copied to clipboard!');" class="cf-btn" style="padding:4px 8px;font-size:11px;">📋 Copy</button>
          </div>
          <pre style="margin:0;padding:16px;max-height:480px;overflow:auto;font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#38bdf8;line-height:1.6;"><code>${code}</code></pre>
        </div>
      `;
    }

    // 6. Binary / Hex Viewer Fallback
    const hex = formatHexDump(f.textContent || '');
    return `
      <div style="background:#09090f;border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;overflow:auto;max-height:480px;">
        <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px;">Raw Hexadecimal Byte Stream (First 512 bytes):</div>
        <pre style="margin:0;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#a78bfa;line-height:1.5;">${hex}</pre>
      </div>
    `;
  }

  window.handleUniversalFileUpload = function (e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop() || '';

    const reader = new FileReader();
    if (file.type.startsWith('text/') || ['json', 'csv', 'tsv', 'js', 'ts', 'py', 'html', 'css', 'sql', 'md', 'sh', 'yml', 'xml'].includes(ext)) {
      reader.onload = (ev) => {
        previewFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          ext,
          textContent: ev.target.result,
          dataUrl: null
        };
        const stage = document.getElementById('universalPreviewStage');
        if (stage) stage.innerHTML = renderActiveFilePreview();
      };
      reader.readAsText(file);
    } else {
      reader.onload = (ev) => {
        previewFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          ext,
          dataUrl: ev.target.result,
          textContent: null
        };
        const stage = document.getElementById('universalPreviewStage');
        if (stage) stage.innerHTML = renderActiveFilePreview();
      };
      reader.readAsDataURL(file);
    }
  };

  window.loadSamplePreview = function (type) {
    if (type === 'image') {
      previewFile = {
        name: 'sample_cyber_vector.png',
        size: 1024 * 320,
        type: 'image/png',
        ext: 'png',
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f0f18"/><circle cx="300" cy="200" r="100" fill="%237c6af7"/><text x="300" y="210" fill="%2300f0ff" font-size="24" font-family="sans-serif" text-anchor="middle">Universal Previewer</text></svg>'
      };
    } else if (type === 'code') {
      previewFile = {
        name: 'quantum_algorithm.ts',
        size: 2400,
        type: 'text/typescript',
        ext: 'ts',
        textContent: `// Quantum Entanglement State Simulation\nexport class QuantumQubit {\n  private alpha: number = 1.0;\n  private beta: number = 0.0;\n\n  constructor(initialState: '0' | '1') {\n    if (initialState === '1') {\n      this.alpha = 0;\n      this.beta = 1;\n    }\n  }\n\n  applyHadamard(): void {\n    const invRoot2 = 1 / Math.sqrt(2);\n    const newA = invRoot2 * (this.alpha + this.beta);\n    const newB = invRoot2 * (this.alpha - this.beta);\n    this.alpha = newA;\n    this.beta = newB;\n  }\n}`
      };
    } else if (type === 'csv') {
      previewFile = {
        name: 'financial_ledger.csv',
        size: 3200,
        type: 'text/csv',
        ext: 'csv',
        textContent: `Transaction ID,Timestamp,Category,Amount,Currency,Status\nTX_98124,2026-09-18T14:22:00Z,Cloud Compute,$420.50,USD,COMPLETED\nTX_98125,2026-09-18T15:10:00Z,Storage Bucket,$85.00,USD,COMPLETED\nTX_98126,2026-09-18T16:45:00Z,SSL Certificate,$0.00,USD,FREE\nTX_98127,2026-09-19T09:12:00Z,AI Inference Token,$14.20,USD,COMPLETED`
      };
    } else if (type === 'audio') {
      // 8-bit synthetic beep wav data
      previewFile = {
        name: 'sample_audio_stream.wav',
        size: 1024 * 128,
        type: 'audio/wav',
        ext: 'wav',
        dataUrl: 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA'
      };
    }

    const stage = document.getElementById('universalPreviewStage');
    if (stage) stage.innerHTML = renderActiveFilePreview();
  };

  window.sendPreviewPhotoToCanvas = function () {
    if (!previewFile?.dataUrl) return;
    window.switchCanvasSuiteSubtab('canvas');
    importPhotoFile(
      { name: previewFile.name },
      200, 200
    );
  };

  window.sendPreviewPhotoToPdf = function () {
    if (!previewFile?.dataUrl) return;
    pdfPhotos.push({
      id: 'pdf_' + Date.now(),
      name: previewFile.name,
      dataUrl: previewFile.dataUrl,
      width: 800,
      height: 600,
      rotation: 0
    });
    window.switchCanvasSuiteSubtab('pdf');
    toast('Photo added to PDF queue');
  };

  window.downloadPreviewFile = function () {
    if (!previewFile) return;
    const a = document.createElement('a');
    a.download = previewFile.name;
    a.href = previewFile.dataUrl || 'data:text/plain;charset=utf-8,' + encodeURIComponent(previewFile.textContent || '');
    a.click();
  };

  // ==========================================================================
  // HELPER UTILITIES
  // ==========================================================================
  function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  function parseCsvString(text) {
    return text.split('\n').filter(Boolean).map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
  }

  function formatHexDump(str) {
    const bytes = new TextEncoder().encode(str.slice(0, 256));
    let out = '';
    for (let i = 0; i < bytes.length; i += 16) {
      const offset = i.toString(16).padStart(4, '0');
      let hexPart = '';
      let asciiPart = '';
      for (let j = 0; j < 16; j++) {
        if (i + j < bytes.length) {
          const b = bytes[i + j];
          hexPart += b.toString(16).padStart(2, '0') + ' ';
          asciiPart += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
        } else {
          hexPart += '   ';
        }
      }
      out += `${offset}  ${hexPart} |${asciiPart}|\n`;
    }
    return out;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getFileIcon(ext) {
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return '🖼️';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return '🎧';
    if (['mp4', 'webm', 'mov'].includes(ext)) return '🎬';
    if (['pdf'].includes(ext)) return '📄';
    if (['csv', 'tsv'].includes(ext)) return '📊';
    if (['js', 'ts', 'py', 'html', 'css'].includes(ext)) return '💻';
    return '📁';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
