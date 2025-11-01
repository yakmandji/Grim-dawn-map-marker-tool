(function(){
  const {
    state,
    DEV_MODE,
    clamp,
    iconFor,
    isColorAllowed,
    currentProfile,
    setActiveProfile,
    createProfile,
    renameProfile,
    deleteProfile,
    listProfiles,
    addMarker: coreAddMarker,
    updateMarker: coreUpdateMarker,
    deleteMarker: coreDeleteMarker,
    clearMarkers: coreClearMarkers,
    getUserDataOnly,
    saveUserDataToLocal,
    loadUserDataFromLocal,
    mergeUserMarkers,
  } = window.GDMMCore;

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Refs DOM
  const viewport = $('#mapViewport');
  const inner    = $('#mapInner');
  const mapImg   = $('#mapImg');

  // Convertit une image affichée (sessionSrc / embedData) en base64 pour l'export admin
  async function srcToDataURL(src, mime = 'image/jpeg', quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL(mime, quality));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  $('#exportMapsOnlyBtn')?.addEventListener('click', async () => {
    // on clone l'état pour ne pas toucher au vrai
    const snapshot = JSON.parse(JSON.stringify(state.profiles || {}));

    // on parcourt chaque profil
    for (const [name, p] of Object.entries(snapshot)) {
      // 1. on vire les markers (c'est un export admin des maps SEULEMENT)
      p.markers = [];

      try {
        // 2. on récupère la vraie source d'image dans l'état "live"
        const live = state.profiles[name];
        const src = live?.map?.sessionSrc || live?.map?.embedData;

        if (src) {
          // on convertit en dataURL pour avoir un JSON portable
          const data = await srcToDataURL(src, 'image/jpeg', 0.85);
          p.map = p.map || {};
          p.map.embedData = data;
        }
      } catch (e) {
        console.warn('[GDMM] export map failed for', name, e);
      }

      // on nettoie les traces de session
      if (p.map) {
        delete p.map.sessionSrc;
      }
    }

    // 3. on télécharge le JSON final
    const data = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gdmm_all_profiles.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);

    // petit feedback
    if (typeof showToast === 'function') {
      showToast('Maps exported (without markers) ✅');
    }
  });



  // --- Save indicator ---
  function updateSaveIndicator(saved){
    const el = document.querySelector('#saveStatus');
    if (!el) return;
    if (saved) {
      el.textContent = '● Saved';
      el.style.color = '#8be38b';
    } else {
      el.textContent = '● Unsaved';
      el.style.color = '#ff6b7a';
    }
  }
  updateSaveIndicator(true);

  function markAsChanged(){
    updateSaveIndicator(false);
  }

  // --- Map load (avec DOM) ---
  let loadToken = 0;
  function setMapSrc(src){
    if (!state.active) { alert('You need first to create profile'); return; }
    const token = ++loadToken;
    mapImg.dataset.token = String(token);
    if (src instanceof File) src = URL.createObjectURL(src);
    mapImg.src = src;
    const p = currentProfile();
    if (p && p.map) p.map.sessionSrc = mapImg.src;
  }

  mapImg.addEventListener('load', () => {
    if (Number(mapImg.dataset.token || 0) !== loadToken) return;
    state.mapNatural = { w: mapImg.naturalWidth, h: mapImg.naturalHeight };
    state.mapReady   = state.mapNatural.w > 0 && state.mapNatural.h > 0;
    const p = currentProfile();
    if (p && p.map) {
      p.map.width  = state.mapNatural.w;
      p.map.height = state.mapNatural.h;
      p.map.sessionSrc = mapImg.src;
    }
    fitToScreen();
    renderMarkers();
  });
  mapImg.addEventListener('error', () => {
    state.mapReady = false;
    alert('Échec du chargement de l\'image');
  });

  // --- View helpers (DOM) ---
  function fitToScreen(){
    const vb = viewport.getBoundingClientRect();
    const iw = state.mapNatural.w || 1;
    const ih = state.mapNatural.h || 1;
    const s = Math.min(vb.width/iw, vb.height/ih);
    state.view.scale = 0.18; // même choix que ton code original
    state.view.x = (vb.width  - iw * state.view.scale) / 2;
    state.view.y = (vb.height - ih * state.view.scale) / 2;
    applyView();
  }

  function applyView(){
    const {x, y, scale} = state.view;
    inner.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const MIN_RATIO = 0.8;
    const mk = (scale < MIN_RATIO) ? (MIN_RATIO / scale) : 1;
    inner.style.setProperty('--mk', mk);
    const zr = $('#zoomReadout');
    if (zr) zr.textContent = Math.round(scale*100) + '%';
  }

  function viewToPct(cx, cy){
    const vb = viewport.getBoundingClientRect();
    const {x, y, scale} = state.view;
    const mx = (cx - vb.left - x) / scale;
    const my = (cy - vb.top  - y) / scale;
    return {
      xp: (mx / (state.mapNatural.w || 1)) * 100,
      yp: (my / (state.mapNatural.h || 1)) * 100,
    };
  }

  function pctToPx(xp, yp){
    return {
      x: (xp/100) * (state.mapNatural.w || 1),
      y: (yp/100) * (state.mapNatural.h || 1),
    };
  }

  // --- Markers ---
  function addMarkerFromUI(xp, yp){
    if (!state.mapReady) { alert('You need first to load a map'); return; }
    const label = $('#newLabel').value.trim();
    const cat   = $('#newCategory').value;
    const color = $('#newColor').value;
    const done  = $('#newCompleted').checked;
    coreAddMarker({ xp, yp, label, cat, color, done });
    $('#newLabel').value = '';
    setTool('pan');
    renderList();
    renderMarkers();
    renderRoutesPanel();
    markAsChanged();
    saveUserDataToLocal();
  }

  function updateMarkerFromUI(id, patch, rerender = true){
    coreUpdateMarker(id, patch);
    markAsChanged();
    saveUserDataToLocal();
    if (rerender) {
      renderList();
      renderMarkers();
      renderRoutesPanel();
    }
    if (patch.label !== undefined) {
      showToast('Marker name updated 💾');
    }
  }

  function deleteMarkerFromUI(id){
    coreDeleteMarker(id);
    renderList();
    renderMarkers();
    renderRoutesPanel();
    markAsChanged();
    saveUserDataToLocal();
  }


 // Path

// ==============================
// PATH MODE
// ==============================

// état local du mode Path
let pathMode = {
  active: false,
  current: null // {id, points: [{xp, yp}]}
};

// assure que le profil actif a un tableau de paths
function ensurePathsArray() {
  const p = currentProfile();
  if (!p) return null;
  if (!p.paths) p.paths = [];
  return p.paths;
}

// crée une nouvelle route vide
  function startNewPath(defaultName = '') {
    const p = currentProfile();
    if (!p) return null;
    const paths = ensurePathsArray();
    const id = 'path_' + Date.now();
    const name = defaultName || `Route ${paths.length + 1}`;
    const path = {
      id,
      name,
      points: [],
      color: '#ffcc00',
      width: 4,
      opacity: 0.85
    };
    paths.push(path);
    pathMode.active = true;
    pathMode.current = path;

    const badge = document.getElementById('currentPathName');
    if (badge) {
      badge.style.display = 'inline-block';
      badge.textContent = name;
    }

    return path;
  }

  // ajoute un point à la route en cours
  function addPathPoint(xp, yp) {
    let path = pathMode.current;
    if (!path) {
      path = startNewPath();
    }
    path.points.push({ xp, yp });
    renderMarkers();
    updateSaveIndicator(false);
    saveUserDataToLocal();
  }

  // finalise la route en cours (appelée quand on quitte le mode Path)
  function finalizeCurrentPath() {
    if (!pathMode.current) {
      const badge = document.getElementById('currentPathName');
      if (badge) badge.style.display = 'none';
      return;
    }

    const p = currentProfile();
    if (p && p.paths && pathMode.current.points.length < 2) {
      // si moins de 2 points → on la supprime
      p.paths = p.paths.filter(r => r.id !== pathMode.current.id);
    }

    pathMode.current = null;
    pathMode.active = false;

    const badge = document.getElementById('currentPathName');
    if (badge) badge.style.display = 'none';

    renderMarkers();
    saveUserDataToLocal();
  }


  // --- UI renderers ---
  function refreshProfilesUI(){
    const sel = $('#profileSelect');
    if (!sel) return;
    const active = state.active;
    const names = listProfiles();
    sel.innerHTML = names.map(n => `<option ${n===active?'selected':''}>${n}</option>`).join('');
    if (active) sel.value = active;
  }

  function listFiltered(){
    const p = currentProfile();
    if (!p) return [];
    return [...(p.markers || [])];
  }

  function renderList(){
    const list = listFiltered();
    const host = $('#list');
    const tpl  = $('#tplItem');
    if (!host || !tpl) return;
    const countEl = $('#count');
    if (countEl) countEl.textContent = list.length;
    host.innerHTML = '';
    list.forEach(m => {
      const el = tpl.content.firstElementChild.cloneNode(true);
      el.querySelector('[data-pin]').style.background = m.color || '#78f1c2';
      const label = el.querySelector('[data-label]');
      label.value = m.label || '';
      label.addEventListener('blur', e => updateMarkerFromUI(m.id, { label: e.target.value }, true));
      const cat = el.querySelector('[data-cat]');
      cat.value = m.cat || 'General';
      const color = el.querySelector('[data-color]');
      color.value = m.color || '#78f1c2';
      const done = el.querySelector('[data-done]');
      done.checked = !!m.done;
      const syncColorVis = (c) => { const allow = isColorAllowed(c); color.style.display = allow ? '' : 'none'; };
      syncColorVis(cat.value);
      cat.onchange = e => { const v = e.target.value; updateMarkerFromUI(m.id, { cat: v }, false); syncColorVis(v); renderMarkers(); };
      color.oninput = e => { el.querySelector('[data-pin]').style.background = e.target.value; updateMarkerFromUI(m.id, { color: e.target.value }, false); renderMarkers(); };
      done.onchange = e => updateMarkerFromUI(m.id, { done: e.target.checked }, true);
      el.querySelector('[data-center]').onclick = () => centerOn(m.xp, m.yp, 1.5);
      el.querySelector('[data-delete]').onclick = () => deleteMarkerFromUI(m.id);
      host.appendChild(el);
    });
  }

  function renderMarkers(options = {}) {
    const { skipRoutesPanel = false } = options;

    // 0) on nettoie ce qui existe
    document.querySelectorAll('#mapInner .marker').forEach(n => n.remove());
    document.querySelectorAll('#mapInner .path-point').forEach(n => n.remove());
    const oldSvg = document.getElementById('pathLayer');
    if (oldSvg) oldSvg.remove();

    const p = currentProfile();
    if (!(p && state.mapReady)) return;

    // 1) on recrée le calque SVG pour les routes
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'pathLayer');
    svg.setAttribute('class', 'path-layer');
    svg.setAttribute('width', state.mapNatural.w);
    svg.setAttribute('height', state.mapNatural.h);
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.pointerEvents = 'none';
    inner.appendChild(svg);

    // 2) on dessine les routes
    const paths = p.paths || [];
    paths.forEach(path => {
      if (path.visible === false) return;
      if (!path.points || !path.points.length) return;

      // ligne
      if (path.points.length >= 2) {
        const d = path.points.map((pt, idx) => {
          const px = (pt.xp / 100) * (state.mapNatural.w || 1);
          const py = (pt.yp / 100) * (state.mapNatural.h || 1);
          return (idx === 0 ? 'M' : 'L') + px + ' ' + py;
        }).join(' ');

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', d);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', path.color || '#ffcc00');
        el.setAttribute('stroke-width', path.width || 4);
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        el.setAttribute('opacity', path.opacity ?? 0.85);
        el.setAttribute('vector-effect', 'non-scaling-stroke'); // 👈 important
        svg.appendChild(el);
      }

      // points
      path.points.forEach(pt => {
        const px = (pt.xp / 100) * (state.mapNatural.w || 1);
        const py = (pt.yp / 100) * (state.mapNatural.h || 1);
        const dot = document.createElement('div');
        dot.className = 'path-point';
        dot.style.left = px + 'px';
        dot.style.top = py + 'px';
        inner.appendChild(dot);
      });
    });

    // 3) on dessine les markers
    const list = p.markers || [];
    list.forEach(m => {
      const el = document.createElement('div');
      el.className = 'marker' + (m.done ? ' completed' : '');

      const pin = document.createElement('div');
      pin.className = 'pin';
      const ic = iconFor(m.cat);
      if (ic) {
        const span = document.createElement('span');
        span.className = 'icon';
        span.textContent = ic;
        pin.appendChild(span);
      } else {
        pin.style.background = m.color || '#78f1c2';
      }
      el.appendChild(pin);

      const lab = document.createElement('div');
      lab.className = 'label';
      lab.textContent = m.label || '(sans titre)';
      el.appendChild(lab);

      const pt = pctToPx(m.xp, m.yp);
      el.style.left = pt.x + 'px';
      el.style.top = pt.y + 'px';

      // (si tu avais déjà le drag, tu le remets ici)
      inner.appendChild(el);
    });

    // 4) on met à jour le panneau routes (⚠️ sauf si on a demandé de ne PAS le faire)
    if (!skipRoutesPanel && typeof renderRoutesPanel === 'function') {
      renderRoutesPanel();
    }
  }



function renderRoutesPanel() {
  const wrap = document.getElementById('routesList');
  if (!wrap) return;

  const p = currentProfile();
  wrap.innerHTML = '';

  p.paths.forEach((path) => {
    const row = document.createElement('div');
    row.className = 'listItem route-item';

    // --- Couleur ---
    const color = document.createElement('input');
    color.type = 'color';
    color.value = path.color || '#ffcc00';
    color.className = 'routeColor';
    color.addEventListener('input', (e) => {
      path.color = e.target.value;
      renderMarkers({ skipRoutesPanel: true });
    });
    color.addEventListener('change', () => {
      saveUserDataToLocal();
    });
    row.appendChild(color);

    // --- Nom ---
    const name = document.createElement('input');
    name.type = 'text';
    name.value = path.name || '(route)';
    name.className = 'markerLabel';
    name.addEventListener('blur', (e) => {
      path.name = e.target.value.trim() || '(route)';
      saveUserDataToLocal();
    });
    row.appendChild(name);

    // --- Bouton Save ---
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'marker-save';
    saveBtn.title = 'Sauvegarder';
    saveBtn.innerHTML = '💾';
    saveBtn.addEventListener('click', () => {
      name.blur();
      saveUserDataToLocal();
      showToast('Route name saved 💾');
    });
    row.appendChild(saveBtn);

    // --- Bouton Center avec ton SVG ---
    const centerBtn = document.createElement('button');
    centerBtn.className = 'marker-center';
    centerBtn.title = 'Center on map';
    centerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
      </svg>
    `;
    centerBtn.addEventListener('click', () => {
      if (!path.points || !path.points.length) return;
      const first = path.points[0];
      centerOn(first.xp, first.yp, 1.2);
    });
    row.appendChild(centerBtn);

    // --- Bouton Delete ---
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'marker-delete danger small';
    delBtn.title = 'Supprimer la route';
    delBtn.innerHTML = 'Suppr';
    delBtn.addEventListener('click', () => {
      p.paths = p.paths.filter(r => r.id !== path.id);
      renderMarkers();
      renderRoutesPanel();
      saveUserDataToLocal();
    });
    row.appendChild(delBtn);

    wrap.appendChild(row);
  });
  const countEl = document.getElementById('routesCount');
  if (countEl) countEl.textContent = p.paths ? p.paths.length : 0;
}


  // --- Center on marker ---
  function centerOn(xp, yp, targetScale){
    if (!(state.mapNatural.w > 0 && state.mapNatural.h > 0)) return;
    const vb = viewport.getBoundingClientRect();
    const imgx = (xp/100) * (state.mapNatural.w || 1);
    const imgy = (yp/100) * (state.mapNatural.h || 1);
    const s = targetScale || state.view.scale;
    state.view.scale = s;
    state.view.x = vb.width/2  - imgx * s;
    state.view.y = vb.height/2 - imgy * s;
    applyView();
  }

  // --- Pan & Zoom ---
  let panning = false, panId = null, panStart = {x:0,y:0}, viewStart = {x:0,y:0};

  function setTool(t, options = {}) {
    const { skipFinalize = false } = options;

    state.tool = t;

    viewport.classList.toggle('pan',  t === 'pan');
    viewport.classList.toggle('add',  t === 'add');
    viewport.classList.toggle('path', t === 'path');

    const panBtn  = document.getElementById('toolPan');
    const addBtn  = document.getElementById('toolAdd');
    const pathBtn = document.getElementById('toolPath');

    if (panBtn)  panBtn.classList.toggle('active', t === 'pan');
    if (addBtn)  addBtn.classList.toggle('active', t === 'add');
    if (pathBtn) pathBtn.classList.toggle('active', t === 'path');

    // 👇 On ne finalize PAS si on est dans un switch temporaire (espace)
    if (t !== 'path' && !skipFinalize) {
      finalizeCurrentPath();
    }
  }


  function applyLockUI(){
    const lockEl = document.getElementById('lockAll');
    if (lockEl) lockEl.checked = !!state.locked;
    viewport.classList.toggle('locked', !!state.locked);
  }

  $('#toolPan')?.addEventListener('click', () => setTool('pan'));
  $('#toolAdd')?.addEventListener('click', () => setTool('add'));
  setTool('pan');

  const finishPathBtn = document.getElementById('toolFinishPath');
  if (finishPathBtn) {
    finishPathBtn.addEventListener('click', () => {
      if (state.tool === 'path') {
        finalizeCurrentPath();
        setTool('pan');
        showToast('Trajet terminé ✅');
      } else {
        showToast('Aucune route en cours', 'error');
      }
    });
  }


  viewport.addEventListener('pointerdown', e => {
    // --- MODE MARKER ---
    if (state.tool === 'add') {
      const { xp, yp } = viewToPct(e.clientX, e.clientY);
      if (xp >= 0 && xp <= 100 && yp >= 0 && yp <= 100 && state.mapReady) {
        addMarkerFromUI(xp, yp);
      }
      return;
    }

    // --- MODE PATH ---
    if (state.tool === 'path') {
      const { xp, yp } = viewToPct(e.clientX, e.clientY);
      if (xp >= 0 && xp <= 100 && yp >= 0 && yp <= 100 && state.mapReady) {
        addPathPoint(xp, yp);
      }
      return;
    }

    // --- PAN classique ---
    e.preventDefault();
    if (e.target.closest && e.target.closest('.marker') && !state.locked) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    panning = true;
    panId = e.pointerId;
    viewport.setPointerCapture?.(panId);
    panStart = { x: e.clientX, y: e.clientY };
    viewStart = { ...state.view };
  });




  viewport.addEventListener('pointermove', e => {
    if (!panning) {
      const {xp, yp} = viewToPct(e.clientX, e.clientY);
      if (isFinite(xp) && isFinite(yp)) {
        const cr = $('#cursorReadout');
        if (cr) cr.textContent = `x: ${clamp(xp,0,100).toFixed(1)}%, y: ${clamp(yp,0,100).toFixed(1)}%`;
      }
      return;
    }
    e.preventDefault();
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    state.view.x = viewStart.x + dx;
    state.view.y = viewStart.y + dy;
    clampViewToMap();
    applyView();
  });

  function stopPan(){ panning = false; panId = null; }
  viewport.addEventListener('pointerup', stopPan);
  viewport.addEventListener('pointerleave', stopPan);
  window.addEventListener('pointerup', stopPan);
  window.addEventListener('pointercancel', stopPan);
  viewport.addEventListener('lostpointercapture', stopPan);

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.12;
    const old = state.view.scale;
    const ns = clamp(old * (1 + delta), 0.18, 5);
    if (ns === old) return;
    const vb = viewport.getBoundingClientRect();
    const ox = e.clientX - vb.left;
    const oy = e.clientY - vb.top;
    const ix = (ox - state.view.x) / old;
    const iy = (oy - state.view.y) / old;
    state.view.x = ox - ix * ns;
    state.view.y = oy - iy * ns;
    state.view.scale = ns;
    clampViewToMap();
    applyView();
  }, { passive: false });

  function clampViewToMap(){
    if (!state.mapReady) return;
    const vb = viewport.getBoundingClientRect();
    const iw = state.mapNatural.w * state.view.scale;
    const ih = state.mapNatural.h * state.view.scale;
    const margin = 320;
    const minX = vb.width  - iw - margin;
    const maxX = margin;
    const minY = vb.height - ih - margin;
    const maxY = margin;
    state.view.x = clamp(state.view.x, minX, maxX);
    state.view.y = clamp(state.view.y, minY, maxY);
  }

  // --- Drag & Drop image ---
  ;['dragenter','dragover'].forEach(ev => viewport.addEventListener(ev, e => { e.preventDefault(); viewport.style.outline = '2px dashed #78f1c2'; }));
  ;['dragleave','drop'].forEach(ev => viewport.addEventListener(ev, e => { e.preventDefault(); viewport.style.outline = 'none'; }));
  viewport.addEventListener('drop', e => { const f = e.dataTransfer.files?.[0]; if (!f) return; setMapSrc(f); });

  // --- Toast ---
  function showToast(message, type = 'success', duration = 2200) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => { el.classList.add('show'); });
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, duration);
  }

  // --- Import / Export boutons ---
  $('#exportAllBtn')?.addEventListener('click', () => {
    saveUserDataToLocal();
    updateSaveIndicator(true);
    showToast('Markers & routes saved locally 💾');
  });

  // Export fichier JSON (markers only)
  $('#exportFileBtn')?.addEventListener('click', async () => {
    const data = getUserDataOnly();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gdmm_user_markers.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  });

  // Import fichier JSON
  $('#importReplaceBtn')?.addEventListener('click', () => {
    const input = $('#importInput');
    input.value = '';
    input.click();
  });

  // IMPORT funtion
    $('#importInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);

        const values = Object.values(imported);

        const isFullExport = values.some(p => p && (p.map || p.embedData));
        const isPathsOnly  = values.some(p => p && p.paths && !p.markers);

        // 1) cas FULL → on remplace tout (comme avant)
        if (isFullExport && !isPathsOnly) {
          state.profiles = imported;
          const first = Object.keys(state.profiles)[0] || null;
          state.active = first;
          refreshProfilesUI();
          renderList();
          renderMarkers();
          renderRoutesPanel();
          updateSaveIndicator(true);
          showToast('Full map data imported ✅');
          return;
        }

        // 2) cas PATHS ONLY → on fusionne
        if (isPathsOnly) {
          // petit choix utilisateur
          const mode = confirm('Import paths: OK = merge, Cancel = replace paths on matching maps ?')
            ? 'merge'
            : 'replace';

          for (const [name, incoming] of Object.entries(imported)) {
            const prof = state.profiles[name];
            if (!prof) continue; // on n’écrase pas une map qu’on n’a pas
            if (!incoming.paths) continue;

            if (!prof.paths) prof.paths = [];

            if (mode === 'replace') {
              prof.paths = incoming.paths;
            } else {
              // merge = on ajoute à la fin (sans dédup, volontairement simple)
              prof.paths = prof.paths.concat(incoming.paths);
            }
          }

          renderMarkers();
          updateSaveIndicator(false);
          showToast('Paths imported ✅');
          return;
        }

        // 3) sinon → comportement markers only (ton cas actuel)
        mergeUserMarkers(imported);
        refreshProfilesUI();
        renderList();
        renderMarkers();
        renderRoutesPanel();
        updateSaveIndicator(true);
        showToast('Markers imported ✅');

      } catch (err) {
        console.error('[GDMM] import failed:', err);
        showToast('Import failed (invalid JSON) ❌', 'error');
      }
    });


    //Export path only
    document.getElementById('exportPathsBtn')?.addEventListener('click', () => {
      const out = {};
      const profiles = state.profiles || {};

      for (const [name, prof] of Object.entries(profiles)) {
        if (!prof) continue;
        if (!prof.paths || !prof.paths.length) continue; // on n'exporte pas les vides

        out[name] = {
          paths: prof.paths,
          // on peut mettre le nom de la map aussi, mais pas les markers
          map: {
            // on met juste le nom si tu veux
          }
        };
      }

    document.getElementById('newPathBtn')?.addEventListener('click', () => {
      // on force le mode path et on commence une route vide
      setTool('path');
      startNewPath();
      const badge = document.getElementById('currentPathName');
      if (badge) {
        badge.style.display = 'inline-block';
        badge.textContent = 'Route en cours…';
      }
      renderRoutesPanel();
    });

    document.getElementById('exportPathsBtn')?.addEventListener('click', () => {
      const out = {};
      const profiles = state.profiles || {};
      for (const [name, prof] of Object.entries(profiles)) {
        if (!prof?.paths || !prof.paths.length) continue;
        out[name] = {
          paths: prof.paths
        };
      }
      const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gdmm_paths_only.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      showToast('Routes exported ✅');
    });

    document.getElementById('importPathsBtn')?.addEventListener('click', () => {
      // on réutilise l’input global
      document.getElementById('importInput')?.click();
    });


      const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gdmm_paths_only.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);

      showToast('Paths exported ✅');
    });


  // --- Profils (boutons) ---
  $('#profileSelect')?.addEventListener('change', e => {
    const name = e.target.value;
    setActiveProfile(name);
    // côté UI : recharger image si profil a embedData
    const p = currentProfile();
    if (p && p.map && p.map.embedData) {
      setMapSrc(p.map.embedData);
    } else if (p && p.map && p.map.sessionSrc) {
      setMapSrc(p.map.sessionSrc);
    } else {
      mapImg.removeAttribute('src');
      state.mapReady = false;
      state.mapNatural = { w:0, h:0 };
    }
    renderList();
    renderMarkers();
    renderRoutesPanel();
    applyLockUI();
  });

  if (DEV_MODE) {
    $('#clearSession')?.addEventListener('click', () => {
      if (!confirm('Delete all session ?')) return;
      state.profiles = {}; state.active = null;
      mapImg.removeAttribute('src'); state.mapReady = false; state.mapNatural = { w:0, h:0 };
      refreshProfilesUI();
    });

    $('#newProfile')?.addEventListener('click', () => {
      const n = prompt('Name of new map ?'); if (!n) return;
      if (state.profiles[n]) { alert('this name already exist'); return; }
      createProfile(n);
      setActiveProfile(n);
      refreshProfilesUI();
      renderList();
      renderMarkers();
      renderRoutesPanel();
    });

    $('#renProfile')?.addEventListener('click', () => {
      if (!state.active) return;
      const n = prompt('New name ?', state.active); if (!n || n === state.active) return;
      if (state.profiles[n]) { alert('Name already exist'); return; }
      renameProfile(state.active, n);
      refreshProfilesUI();
    });

    $('#delProfile')?.addEventListener('click', () => {
      if (!state.active) return;
      const victim = state.active;
      if (!confirm('You will delete « '+victim+' » map and all associated markers')) return;
      deleteProfile(victim);
      mapImg.removeAttribute('src'); state.mapReady=false; state.mapNatural={w:0,h:0};
      refreshProfilesUI();
      renderList();
      renderMarkers();
      renderRoutesPanel();
    });

    $('#mapFile')?.addEventListener('change', e => {
      const f = e.target.files?.[0]; if (!f) return;
      setMapSrc(f);
      showToast('🗺️ Map image updated successfully');
      markAsChanged();
    });
  } else {
    document.getElementById('admin-section')?.remove();
  }

  // --- Clear markers du profil actif ---
  $('#clearProfile')?.addEventListener('click', () => {
    const prof = currentProfile(); if (!prof) return;
    if (!confirm('Do you really want to delete all markers from this map?')) return;
    coreClearMarkers();
    saveUserDataToLocal();
    renderList();
    renderMarkers();
    markAsChanged();
    renderRoutesPanel();
    showToast('Markers cleared for this map 🧹');
  });

  // --- Aide ---
  document.querySelector('.closeHelp')?.addEventListener('click', () => {
    const sec = document.getElementById('helpSection');
    if (!sec) return;
    sec.style.display = 'none';
  });
  document.getElementById('helpToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    const sec = document.getElementById('helpSection');
    if (!sec) return;
    const show = sec.style.display === 'none' || sec.style.display === '';
    sec.style.display = show ? 'block' : 'none';
    if (show) {
      const handler = (e2) => {
        if (!sec.contains(e2.target) && e2.target !== e.target) {
          sec.style.display = 'none';
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }
  });

  // --- Lock ---
  const lockEl = document.getElementById('lockAll');
  if (lockEl) lockEl.addEventListener('change', (e) => {
    state.locked = !!e.target.checked;
    applyLockUI();
  });
  applyLockUI();

  // --- New marker category → toggle color visibility ---
  const newCatEl = document.getElementById('newCategory');
  const newColorEl = document.getElementById('newColor');
  if (newCatEl && newColorEl) {
    const syncNewColor = () => { newColorEl.style.display = isColorAllowed(newCatEl.value) ? '' : 'none'; };
    newCatEl.addEventListener('change', syncNewColor);
    syncNewColor();
  }

  // --- Init au chargement ---
  (async () => {
    const REMOTE_JSON_URL = 'https://yakmandji.github.io/Grim-dawn-map-marker-tool/gdmm_all_profiles.json';
    // Base vide
    state.profiles['Profil 1'] = { markers:[], map:{}, created: new Date().toISOString(), updated: new Date().toISOString() };
    setActiveProfile('Profil 1');
    // Try remote
    try {
      const resp = await fetch(REMOTE_JSON_URL, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const txt = await resp.text();
      const obj = JSON.parse(txt);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        state.profiles = obj;
        const first = Object.keys(state.profiles)[0] || 'Profil 1';
        setActiveProfile(first);
        const p = currentProfile();
        if (p && p.map && p.map.embedData) {
          setMapSrc(p.map.embedData);
        }
      }
    } catch (err) {
      console.warn('[GDMM] remote JSON not loaded, using local empty profile', err);
    }
    // local user data
    loadUserDataFromLocal();
    refreshProfilesUI();
    renderList();
    renderMarkers();
    renderRoutesPanel();
    // lock par défaut
    state.locked = true;
    applyLockUI();
  })();

  // === PATCH: brancher les boutons tools ===
  window.addEventListener('DOMContentLoaded', () => {
    const btnPan  = document.getElementById('toolPan');
    const btnAdd  = document.getElementById('toolAdd');
    const btnPath = document.getElementById('toolPath');
    const btnNewPath = document.getElementById('newPathBtn');

    // sécurité : si setTool n'existe pas, on ne fait rien
    if (typeof setTool !== 'function') {
      console.warn('[GDMM] setTool() not found');
      return;
    }

    if (btnPan)  btnPan.addEventListener('click', () => setTool('pan'));
    if (btnAdd)  btnAdd.addEventListener('click', () => setTool('add'));

    // bouton dans l'aside (➕ Add)
    if (btnNewPath) btnNewPath.addEventListener('click', () => {
      setTool('path');
      // là on crée vraiment une route
      if (typeof startNewPath === 'function') {
        startNewPath();
      }
    });
  });

  // === PATCH: clic sur la carte en mode path ===
  window.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('mapViewport');

    // sécurité
    if (!viewport) return;
    if (typeof viewToPct !== 'function') return;
    if (typeof addPathPoint !== 'function') return;

    viewport.addEventListener('pointerdown', (e) => {
      // si on n'est pas en mode path, on laisse le vieux code faire son taf
      if (!window.GDMMCore || window.GDMMCore.state?.tool !== 'path') return;
      e.preventDefault();

      const { xp, yp } = viewToPct(e.clientX, e.clientY);
      if (xp < 0 || xp > 100 || yp < 0 || yp > 100) return;

      addPathPoint(xp, yp);
    });
  });


// === SPACE → PAN (global) ===
// === SPACE → hold-to-pan ===
// === SPACE → hold-to-pan ===
// === SPACE → hold-to-pan (avec protection des inputs) ===
  let isSpaceDown = false;
  let prevTool = null;

  window.addEventListener(
    'keydown',
    (e) => {
      // 1. si on est dans un champ → on ne vole pas la barre espace
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();

        if (!isSpaceDown) {
          isSpaceDown = true;

          // 2. si on était en train d'ajouter (marker) ou de tracer (path)
          //    -> on passe en pan SANS finaliser
          if (state.tool === 'path' || state.tool === 'add') {
            prevTool = state.tool;
            setTool('pan', { skipFinalize: true });
          }
        }
      }
    },
    true
  );

  window.addEventListener(
    'keyup',
    (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        isSpaceDown = false;

        // 3. on revient à l'outil d'avant (add ou path)
        if (prevTool) {
          setTool(prevTool);
          prevTool = null;
        }
      }
    },
    true
  );








})();