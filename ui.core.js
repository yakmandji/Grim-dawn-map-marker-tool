(function(){
const {
  state,DEV_MODE,clamp,iconFor,isColorAllowed,currentProfile,markAsChanged,updateSaveIndicator,
  setActiveProfile,renameProfile,deleteProfile,listProfiles,
  addMarker: coreAddMarker,
  updateMarker: coreUpdateMarker,
  deleteMarker: coreDeleteMarker,
  clearMarkers: coreClearMarkers,getUserDataOnly,saveUserDataToLocal,loadUserDataFromLocal,
  mergeUserMarkers,ensureProfile,
} = window.GDMMCore;

  const LAST_PROFILE_KEY = 'gdmm_last_profile';
  let hideDoneOnMap = false;

  function rememberActiveProfile() {
    if (!state.active) return;
    try {
      localStorage.setItem(LAST_PROFILE_KEY, state.active);
    } catch (e) {
      console.warn('[GDMM] cannot store last profile', e);
    }
  }

  // Save zoom / pan in profile
  function persistViewForCurrentProfile() {
    const p = currentProfile();
    if (!p) return;
    p.view = {
      x: state.view.x,
      y: state.view.y,
      scale: state.view.scale,
    };
    try {
      saveUserDataToLocal();
    } catch (e) {
      console.warn('Failed to persist view', e);
    }
  }

  const {
    $,$$,viewport,inner,mapImg,
    showLoader,hideLoader,fitToScreen,
    applyView,viewToPct,pctToPx,setMapSrc,
  } = window.UiCore;


  // --- Markers ---
  function addMarkerFromUI(xp, yp){
    if (!state.mapReady) { alert('You need first to load a map'); return; }
    const label = $('#newLabel').value.trim();
    const cat   = $('#newCategory').value;
    const color = $('#newColor').value;
    const done  = false;
    const sharedCheckbox = document.getElementById('newShared');
    const shared = sharedCheckbox ? !!sharedCheckbox.checked : false;
    const marker = coreAddMarker({ xp, yp, label, cat, color, done, shared });
    if (marker) {
      state.lastCreatedMarkerId = marker.id;
    }

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
      showToast(GDMMLang.t('toast.MarkerNameUpdated'));
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

// PATH MODE
// ==============================

let pathMode = {
  active: false,
  current: null
};

// Visual Preview of route
let pathPreviewLine = null;

function clearPathPreview() {
  const svg = document.getElementById('pathLayer');
  if (pathPreviewLine && svg && pathPreviewLine.parentNode === svg) {
    svg.removeChild(pathPreviewLine);
  }
  pathPreviewLine = null;
}

function updatePathPreview(xp, yp) {
  const p = currentProfile();
  if (!p || !state.mapReady) return;
  if (!pathMode.current || !pathMode.current.points || pathMode.current.points.length === 0) {
    clearPathPreview();
    return;
  }

  const last = pathMode.current.points[pathMode.current.points.length - 1];
  const iw = state.mapNatural.w || 1;
  const ih = state.mapNatural.h || 1;
  const x1 = (last.xp / 100) * iw;
  const y1 = (last.yp / 100) * ih;
  const x2 = (xp / 100) * iw;
  const y2 = (yp / 100) * ih;

  const svg = document.getElementById('pathLayer');
  if (!svg) return;
  if (!pathPreviewLine) {
    pathPreviewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    pathPreviewLine.setAttribute('id', 'pathPreview');
    pathPreviewLine.setAttribute('fill', 'none');
    pathPreviewLine.setAttribute('stroke-dasharray', '6 4');
    pathPreviewLine.setAttribute('stroke-linecap', 'round');
    pathPreviewLine.setAttribute('pointer-events', 'none');
    svg.appendChild(pathPreviewLine);
  }
  const color = pathMode.current.color || '#ffcc00';
  const width = pathMode.current.width || 4;
  pathPreviewLine.setAttribute('x1', x1);
  pathPreviewLine.setAttribute('y1', y1);
  pathPreviewLine.setAttribute('x2', x2);
  pathPreviewLine.setAttribute('y2', y2);
  pathPreviewLine.setAttribute('stroke', color);
  pathPreviewLine.setAttribute('stroke-width', width);
  pathPreviewLine.setAttribute('opacity', 0.6);
  pathPreviewLine.setAttribute('vector-effect', 'non-scaling-stroke');
}
//-------------------------


function ensurePathsArray() {
  const p = currentProfile();
  if (!p) return null;
  if (!p.paths) p.paths = [];
  return p.paths;
}

// create new empty path
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
      badge.textContent = GDMMLang.t('toast.PathInProgress');
    }
    updateFinishButtonPulse();
    return path;
  }

  // add point current path
  function addPathPoint(xp, yp) {
    let path = pathMode.current;
    if (!path) {
      path = startNewPath();
    }
    path.points.push({ xp, yp });
    clearPathPreview();
    renderMarkers();
    updateSaveIndicator(false);
    saveUserDataToLocal();
  }

  // finish route
  function finalizeCurrentPath() {
    if (!pathMode.current) {
      const badge0 = document.getElementById('currentPathName');
      if (badge0) {
        badge0.style.display = 'none';
        badge0.textContent = '';
      }
      return;
    }

    const p = currentProfile();

    // If no route -> delete
    if (p && p.paths && pathMode.current.points.length < 2) {
      p.paths = p.paths.filter(r => r.id !== pathMode.current.id);
    }

    // reset mode path
    pathMode.current = null;
    pathMode.active = false;

    // Badge cache
    const badge = document.getElementById('currentPathName');
    if (badge) {
      badge.style.display = 'none';
      badge.textContent = '';
    }
    clearPathPreview();
    renderMarkers();
    saveUserDataToLocal();
    updateFinishButtonPulse();
  }

   function updateFinishButtonPulse() {
      const btn = document.getElementById('toolFinishPath');
      if (!btn) return;
      const isCurrentPath = pathMode.active && pathMode.current && state.tool === 'path';
      btn.classList.toggle('pulse', !!isCurrentPath);
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

function renderList() {
  const markers = listFiltered();
  const host = $('#list');
  const tpl  = $('#tplItem');
  if (!host || !tpl) return;

  // ➜ On sépare les marqueurs actifs et done
  const activeMarkers = markers.filter(m => !m.done);
  const doneMarkers   = markers.filter(m => !!m.done);

  // compteur de la liste principale = seulement les actifs
  const countEl = $('#count');
  if (countEl) countEl.textContent = activeMarkers.length;

  // compteur de l’historique
  const doneCountEl = $('#doneCount');
  if (doneCountEl) doneCountEl.textContent = doneMarkers.length;

  host.innerHTML = '';

  // === LISTE PRINCIPALE : uniquement les marqueurs NON done ===
  activeMarkers.forEach(m => {
    const el = tpl.content.firstElementChild.cloneNode(true);
    el.dataset.mid = m.id;

    if (m.cat) {
      el.classList.add(m.cat.toLowerCase());
    }
    if (m.shared) {
      el.classList.add('shared');
    }

    // pin color
    el.querySelector('[data-pin]').style.background = m.color || '#78f1c2';

    // label
    const label = el.querySelector('[data-label]');
    label.value = m.label || '';
    label.addEventListener('blur', e => {
      updateMarkerFromUI(m.id, { label: e.target.value }, true);
    });

    // catégorie
    const cat = el.querySelector('[data-cat]');
    cat.value = m.cat || 'General';

    // color
    const color = el.querySelector('[data-color]');
    color.value = m.color || '#78f1c2';

    // état done (normalement false ici, mais on reste cohérent)
    const done = el.querySelector('[data-done]');
    done.checked = !!m.done;

    // shared
    const sharedInput = el.querySelector('[data-shared]');
    if (sharedInput) {
      sharedInput.checked = !!m.shared;
      sharedInput.addEventListener('change', e => {
        updateMarkerFromUI(m.id, { shared: !!e.target.checked }, false);
        renderMarkers();
        renderList();
      });
    }

    // visibilité du color picker selon la catégorie
    const syncColorVis = (c) => {
      const allow = isColorAllowed(c);
      color.style.display = allow ? '' : 'none';
    };
    syncColorVis(cat.value);

    cat.onchange = e => {
      const v = e.target.value;
      updateMarkerFromUI(m.id, { cat: v }, false);
      syncColorVis(v);
      renderMarkers();
      renderList();
    };

    color.oninput = e => {
      el.querySelector('[data-pin]').style.background = e.target.value;
      updateMarkerFromUI(m.id, { color: e.target.value }, false);
      renderMarkers();
    };

    // check done :
    done.onchange = e => {
      const isDone = !!e.target.checked;

      if (isDone) {
        // Si le panneau Done est replié, on le ré-ouvre automatiquement
        if (hideDoneOnMap) {
          hideDoneOnMap = false;
          const panel = $('#donePanel');
          if (panel) {
            panel.classList.remove('collapsed');
          }
        }
        if (sharedInput) {
          sharedInput.checked = false;
        }

        el.classList.add('fade-out');

        setTimeout(() => {
          updateMarkerFromUI(m.id, { done: true, shared: false }, true);
        }, 180);
      } else {
        updateMarkerFromUI(m.id, { done: false }, true);
      }
    };


    el.querySelector('[data-center]').onclick = () => centerOn(m.xp, m.yp, 0.8, m.id);
    el.querySelector('[data-delete]').onclick = () => deleteMarkerFromUI(m.id);

    host.appendChild(el);
  });

  // Filtres existants sur la liste principale
  if (window.UiFilters && typeof window.UiFilters.applyCategoryFilters === 'function') {
    window.UiFilters.applyCategoryFilters();
  }

  // i18n
  if (window.GDMMLang && typeof window.GDMMLang.applyLang === 'function') {
    window.GDMMLang.applyLang(window.GDMMLang.getLang());
  }

  // ➜ Met à jour le panneau des Done
  renderDoneList(doneMarkers);
}

// List of Done element
function renderDoneList(doneMarkers) {
  const host = $('#doneList');
  if (!host) return;

  host.innerHTML = '';

  if (!doneMarkers.length) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'done-empty';
    emptyMsg.setAttribute('data-i18n', 'ui.NothingDone');
    emptyMsg.textContent = GDMMLang.t('ui.NothingDone');
    host.appendChild(emptyMsg);
    return;
  }

  doneMarkers.forEach(m => {
    const row = document.createElement('div');
    row.className = 'doneItem';
    row.dataset.mid = m.id;

    // --- icône catégorie ---
    const iconWrap = document.createElement('div');
    iconWrap.className = 'doneIcon';

    const ic = iconFor(m.cat);
    if (ic) {
      const img = document.createElement('img');
      img.className = 'doneIcon-img';
      img.src = ic;
      iconWrap.appendChild(img);
    }
    
    // --- label ---
    const lab = document.createElement('div');
    lab.className = 'doneLabel';
    lab.textContent = m.label || '(no name)';
    lab.title = m.label || '';

    // --- actions ---
    const actions = document.createElement('div');
    actions.className = 'doneActions';

    // Center button
    const centerBtn = document.createElement('button');
    centerBtn.type = 'button';
    centerBtn.className = 'marker-center small';
    centerBtn.innerHTML = `<img src="img/center-icon.svg" width="16">`;
    centerBtn.onclick = () => centerOn(m.xp, m.yp, 1.2, m.id);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'marker-delete danger small';
    delBtn.innerHTML = `<img src="img/bin-icon.svg" width="16">`;
    delBtn.onclick = () => deleteMarkerFromUI(m.id);

    actions.appendChild(centerBtn);
    actions.appendChild(delBtn);

    row.appendChild(iconWrap);
    row.appendChild(lab);
    row.appendChild(actions);

    host.prepend(row);
  });
}

//END list of done element

function initDonePanelToggle() {
  const panel  = $('#donePanel');
  const toggle = $('#donePanelToggle');
  if (!panel || !toggle) return;

  if (window.innerWidth < 768) {
    hideDoneOnMap = true;
    panel.classList.add('collapsed');
  }

  toggle.addEventListener('click', () => {
    hideDoneOnMap = !hideDoneOnMap;
    panel.classList.toggle('collapsed', hideDoneOnMap);
    renderMarkers();
    renderList();
  });
}


  function hexToRgba(hex, alpha = 1) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

// Find best key for map size
function resolveSizeKey(sizeMap) {
  if (!sizeMap || !state.mapNatural) return null;

  const exactKey = `${state.mapNatural.w}x${state.mapNatural.h}`;
  if (sizeMap[exactKey]) {
    return exactKey;
  }
  const targetRatio = state.mapNatural.w / (state.mapNatural.h || 1);
  let bestKey = null;
  let bestDiff = Infinity;

  Object.keys(sizeMap).forEach(k => {
    const [w, h] = k.split('x').map(Number);
    const r = w / (h || 1);
    const diff = Math.abs(r - targetRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestKey = k;
    }
  });

  if (bestDiff < 0.02) {
    return bestKey;
  }
  return null;
}



// RENDER MARKER----------------------------
function renderMarkers(options = {}) {
  const { skipRoutesPanel = false } = options;

  // 1) Cleaning
  document.querySelectorAll('#mapInner .marker').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .path-point').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .path-label').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .path-endpoint').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .marker-region').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .marker-link').forEach(n => n.remove());

  const oldSvg = document.getElementById('pathLayer');
  if (oldSvg) oldSvg.remove();

  const p = currentProfile();
  if (!(p && state.mapReady)) return;

  // 2) New SVG layer
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

  pathPreviewLine = null;

  // 3) Route draw
  const paths = p.paths || [];
  paths.forEach(path => {
      if (path.visible === false) return;
      if (!path.points || !path.points.length) return;
      const isEditing =
        state.editingPathId === path.id ||
        (pathMode.current && pathMode.current.id === path.id);
      const isCurrentPath = pathMode.current && pathMode.current.id === path.id;

      // Main line
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
        el.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(el);
      }

      // Route point
      path.points.forEach(pt => {
        const px = (pt.xp / 100) * (state.mapNatural.w || 1);
        const py = (pt.yp / 100) * (state.mapNatural.h || 1);
        const dot = document.createElement('div');
        dot.className = 'path-point';
        dot.style.left = px + 'px';
        dot.style.top  = py + 'px';
        if (isEditing) dot.classList.add('active-glow');
        inner.appendChild(dot);
      });

      // Bulles Start / End
      if (path.points && path.points.length) {
        const first = path.points[0];
        const last  = path.points[path.points.length - 1];
        const makeEndpoint = (pt, type) => {
          const ex = (pt.xp / 100) * (state.mapNatural.w || 1);
          const ey = (pt.yp / 100) * (state.mapNatural.h || 1);

          const tag = document.createElement('div');
          tag.className = 'path-endpoint ' + (type === 'start' ? 'path-start' : 'path-end');

          if (type === 'start') {
            tag.textContent = '👣 ' + (path.name || '(route)');
          } else {
            tag.textContent = '🚩';
          }

          tag.style.left = ex + 'px';
          tag.style.top  = ey + 'px';

          if (path.color) {
            tag.style.background  = hexToRgba(path.color, 0.9);
            tag.style.borderColor = path.color;
            // text black or white
            const c = path.color.replace('#', '');
            const r = parseInt(c.substring(0, 2), 16);
            const g = parseInt(c.substring(2, 4), 16);
            const b = parseInt(c.substring(4, 6), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            tag.style.color = luminance > 0.6 ? '#000' : '#fff';
          }

          // --- Clic label route ---
          if (type === 'start') {
            tag.addEventListener('pointerdown', (e) => {
              e.stopPropagation();
              const row = document.querySelector(
                `#routesList .listItem[data-pid="${path.id}"]`
              );
              if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('highlight');
                setTimeout(() => row.classList.remove('highlight'), 1500);
              }
            });
          }
          inner.appendChild(tag);
        };
        // Start
        makeEndpoint(first, 'start');
        // End (If route done)
        if (path.points.length > 1 && !isCurrentPath) {
          makeEndpoint(last, 'end');
        }
      }
    });

  // 3) draw markers
  const markers = p.markers || [];
  markers.forEach(m => {
    //Hide done collapesd
    if (hideDoneOnMap && m.done) return;

    const el = document.createElement('div');
    el.classList.add('marker');
    if (m.done) {
      el.classList.add('completed');
      el.dataset.done = '1';
    } else {
      el.dataset.done = '0';
    }
    if (m.cat) el.classList.add(m.cat.toLowerCase());
    if (m.shared) el.classList.add('shared');
    el.dataset.mid = m.id;

    // --- PIN ---
    const pin = document.createElement('div');
    pin.className = 'pin';

    // image de fond (goutte)
    const bg = document.createElement('img');
    bg.className = 'pin-bg';
    bg.src = 'img/pin_fill.svg';
    bg.alt = '';
    pin.appendChild(bg);

    // couleur du pin (pour tous les types)
    const color = m.color || '#78f1c2';

    function hexToHSL(hex) {
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
      } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
      }
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h: h * 360, s: s * 100, l: l * 100 };
    }

    const { h, s, l } = hexToHSL(color);
    bg.style.filter =
      `drop-shadow(0 2px 6px rgba(0,0,0,0.4)) ` +
      `hue-rotate(${h}deg) saturate(${1 + s / 100}) brightness(${0.9 + (l / 200)})`;

    const ic = iconFor(m.cat);
    if (ic) {
      const iconImg = document.createElement('img');
      iconImg.className = 'pin-icon';
      iconImg.src = ic;
      iconImg.alt = m.cat || '';
      pin.appendChild(iconImg);
    }


    // Shared Badge
    if (m.shared) {
      const sharedBadge = document.createElement('img');
      sharedBadge.className = 'shared-badge';
      sharedBadge.src = 'img/share-icon.svg'; // mets ici ton SVG
      sharedBadge.alt = (window.GDMMLang && GDMMLang.t)
        ? GDMMLang.t('ui.SharedMarker')
        : 'Shared';
      pin.appendChild(sharedBadge);
    }

    el.appendChild(pin);

    // --- LABEL ---
    const lab = document.createElement('div');
    lab.className = 'label';
    lab.textContent = m.label || '(no name)';
    el.appendChild(lab);
    // position initiale
    const pt = pctToPx(m.xp, m.yp);
    el.style.left = pt.x + 'px';
    el.style.top  = pt.y + 'px';
    // ========== INTERACTIONS ==========
    let dragging = false;
    let startPct = null;
    let startClient = null;
    const dragThreshold = 6;

    el.addEventListener('pointerdown', (e) => {
      startClient = { x: e.clientX, y: e.clientY };

      if (state.locked) {
        el.setPointerCapture(e.pointerId);
        return;
      }

      dragging = true;
      el.setPointerCapture(e.pointerId);
      const p1 = viewToPct(e.clientX, e.clientY);
      startPct = {
        dx: p1.xp - m.xp,
        dy: p1.yp - m.yp
      };
    });

    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      if (!startPct) return;

      const p1 = viewToPct(e.clientX, e.clientY);
      let nx = clamp(p1.xp - startPct.dx, 0, 100);
      let ny = clamp(p1.yp - startPct.dy, 0, 100);

      const pt2 = pctToPx(nx, ny);
      el.style.left = pt2.x + 'px';
      el.style.top  = pt2.y + 'px';
    });

    el.addEventListener('pointerup', (e) => {
      const dx = e.clientX - (startClient?.x ?? e.clientX);
      const dy = e.clientY - (startClient?.y ?? e.clientY);
      const moved = Math.sqrt(dx*dx + dy*dy) > dragThreshold;
      const justCreated = state.lastCreatedMarkerId === m.id; // test

      try { el.releasePointerCapture(e.pointerId); } catch(_) {}

      // --- Mode LOCK : no drag
        if (state.locked) {
          if (!moved && !justCreated) {   // Scroll only if not just created
            const row = document.querySelector(`#list .listItem[data-mid="${m.id}"]`);
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
              row.classList.add('highlight');
              setTimeout(() => row.classList.remove('highlight'), 1500);
            }
          }
          state.lastCreatedMarkerId = null; 
          return;
        }

      if (!dragging) {
        if (!moved && !justCreated) {     
          const row = document.querySelector(`#list .listItem[data-mid="${m.id}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('highlight');
            setTimeout(() => row.classList.remove('highlight'), 800);
          }
        }
        state.lastCreatedMarkerId = null; 
        return;
      }

      // --- End drag ---
      dragging = false;
      if (!moved) {
        const row = document.querySelector(`#list .listItem[data-mid="${m.id}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('highlight');
          setTimeout(() => row.classList.remove('highlight'), 800);
        }
        return;
      }

      const p1 = viewToPct(e.clientX, e.clientY);
      let nx = clamp(p1.xp - startPct.dx, 0, 100);
      let ny = clamp(p1.yp - startPct.dy, 0, 100);

      updateMarkerFromUI(m.id, { xp: nx, yp: ny }, false);
      renderMarkers({ skipRoutesPanel: true });
      saveUserDataToLocal();
    });

    inner.appendChild(el);   
  });

  // 4) Rift map (admin markers)

  let riftData = [];
  if (window.RIFT_MARKERS_BY_SIZE && state.mapNatural) {
    const key = resolveSizeKey(window.RIFT_MARKERS_BY_SIZE);
    if (key && window.RIFT_MARKERS_BY_SIZE[key]) {
      riftData = window.RIFT_MARKERS_BY_SIZE[key];
    }
  }

  riftData.forEach(m => {
    const el = document.createElement('div');
    el.classList.add('marker', 'marker-rift', 'locked');

    const labelText = window.getRiftLabel
      ? getRiftLabel(m.tag, m.label || m.tag || 'Rift')
      : (m.label || m.tag || 'Rift');

    const lab = document.createElement('div');
    lab.className = 'label rift-label';
    lab.textContent = labelText;
    el.appendChild(lab);

    const iconImg = document.createElement('img');
    iconImg.className = 'rift-icon';
    iconImg.src = 'img/rift.png';
    iconImg.alt = 'Rift';
    el.appendChild(iconImg);

    const pt = pctToPx(m.xp, m.yp);
    el.style.left = pt.x + 'px';
    el.style.top  = pt.y + 'px';

    el.classList.add('is-static');
    inner.appendChild(el);
  });

  // --- Regions statiques (admin) ---
  let regionData = [];
  if (window.REGION_MARKERS_BY_SIZE && state.mapNatural) {
    const key = resolveSizeKey(window.REGION_MARKERS_BY_SIZE);
    if (key && window.REGION_MARKERS_BY_SIZE[key]) {
      regionData = window.REGION_MARKERS_BY_SIZE[key];
    }
  }

  regionData.forEach(m => {
    const el = document.createElement('div');
    el.classList.add('marker-region', 'locked'); 

    if (m.isDungeon) {
      el.classList.add('marker-region-dungeon');
      }

    const labelText = (window.getRegionLabel)
      ? getRegionLabel(m.tag, m.tag)
      : (m.tag || 'Region');

    const lab = document.createElement('div');
    lab.className = 'region-label';
    lab.textContent = labelText;
    el.appendChild(lab);

    const pt = pctToPx(m.xp, m.yp);
    el.style.left = pt.x + 'px';
    el.style.top  = pt.y + 'px';

    el.classList.add('is-static');
    inner.appendChild(el);
  });


  // --- Nav admin markers (icon-only, clickable) ---
    function resolveCompositeTag(tag) {
    if (!tag) return '';
    const parts = tag.split('+').map(s => s.trim());

    let finalText = '';
    parts.forEach(part => {
      if (window.getRegionLabel) {
        finalText += getRegionLabel(part, part);
      } else {
        finalText += part;
      }
    });
    return finalText;
  }

    if (window.NAV_MARKERS_BY_SIZE && state.mapNatural) {
    const key = resolveSizeKey(window.NAV_MARKERS_BY_SIZE);
    const navData = (key && window.NAV_MARKERS_BY_SIZE[key]) ? window.NAV_MARKERS_BY_SIZE[key] : [];
    navData.forEach(m => {
      const el = document.createElement('div');
      el.classList.add('marker-link', 'locked');

      const iconImg = document.createElement('img');
      iconImg.className = 'link-icon';
      iconImg.src = m.icon || 'img/icon-eye.png';
      iconImg.alt = m.alt || 'Go to';
      el.appendChild(iconImg);

      // Tooltip multi-lang via region.js
      let titleText = '';
      if (m.tag) {
        titleText = resolveCompositeTag(m.tag);
      } else if (m.title) {
        titleText = m.title;
      }

      if (titleText) {
        el.title = titleText;
        iconImg.title = titleText;
      }

      const pt = pctToPx(m.xp, m.yp);
      el.style.left = pt.x + 'px';
      el.style.top  = pt.y + 'px';
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();

        // 1) Change profile
        if (m.targetProfile) {
          const name = m.targetProfile;

          if (typeof m.targetXp === 'number' && typeof m.targetYp === 'number') {
            state.skipViewRestoreOnce = true;
          }
          setActiveProfile(name);
          rememberActiveProfile();
          const p2 = currentProfile();
          if (!p2) return;
          const sel = document.getElementById('profileSelect');

          if (sel) sel.value = name;
          if (p2.map && p2.map.embedData) {
            showLoader(GDMMLang?.t ? GDMMLang.t('toast.LoadingMap') : 'Loading map…');
            setMapSrc(p2.map.embedData);
          } else if (p2.map && p2.map.sessionSrc) {
            showLoader(GDMMLang?.t ? GDMMLang.t('toast.LoadingMap') : 'Loading map…');
            setMapSrc(p2.map.sessionSrc);
          }

          if (typeof m.targetXp === 'number' && typeof m.targetYp === 'number') {
            setTimeout(() => {
              centerOn(m.targetXp, m.targetYp, m.targetScale || 1.2);
            }, 300);
          }
          renderList();

          if (typeof renderRoutesPanel === 'function') {
            renderRoutesPanel();
          }
          return;
        }
        // 2) Teleport on same map
        if (typeof m.targetXp === 'number' && typeof m.targetYp === 'number') {
          centerOn(m.targetXp, m.targetYp, m.targetScale || 1.2);
          return;
        }
      });
      inner.appendChild(el);
    });
  }

  // --- Navigation admin markers (icon-only, clickable) END---


  if (!skipRoutesPanel && typeof renderRoutesPanel === 'function') {
    renderRoutesPanel();
  }
  
  // Re-apply filters after re-render
  if (window.UiFilters) {
    if (typeof window.UiFilters.applyCategoryFilters === 'function') {
      window.UiFilters.applyCategoryFilters();
    }
    if (typeof window.UiFilters.updateFilterCounts === 'function') {
      window.UiFilters.updateFilterCounts();
    }
  }

}

// END RENDER MARKER ---------------------------------------------------------

function renderRoutesPanel() {
  const wrap = document.getElementById('routesList');
  if (!wrap) return;

  const p = currentProfile();
  if (!p) return;
  wrap.innerHTML = '';

  p.paths.forEach((path) => {
    const row = document.createElement('div');
    row.className = 'listItem route-item';
    row.dataset.pid = path.id;

    // --- Color ---
    const color = document.createElement('input');
    color.type = 'color';
    color.value = path.color || '#ffcc00';
    color.className = 'routeColor';

    color.addEventListener('input', (e) => {
      path.color = e.target.value;
      state.editingPathId = path.id;
      renderMarkers({ skipRoutesPanel: true });
    });

    color.addEventListener('change', () => {
      delete state.editingPathId;
      saveUserDataToLocal();
    });
    row.appendChild(color);

    // --- Name ---
    const name = document.createElement('input');
    name.type = 'text';
    name.value = path.name || '(route)';
    name.className = 'markerLabel';
    name.addEventListener('blur', (e) => {
      path.name = e.target.value.trim() || '(route)';
      saveUserDataToLocal();
      renderMarkers({ skipRoutesPanel: true });
    });
    row.appendChild(name);

    // --- Save button ---
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'marker-save';
    saveBtn.setAttribute('data-i18n-title', 'ui.SaveTitle');
    saveBtn.title = GDMMLang.t('ui.SaveTitle');
    saveBtn.innerHTML = `<img src="img/save-icon.svg" width="16" alt="${GDMMLang.t('ui.SaveTitle')}">`;
    saveBtn.addEventListener('click', () => {
      name.blur();
      saveUserDataToLocal();
      showToast(GDMMLang.t('toast.RouteNameSaved'));
    });
    row.appendChild(saveBtn);

    // --- Center button witdth SVG ---
    const centerBtn = document.createElement('button');
    centerBtn.className = 'marker-center';
    centerBtn.setAttribute('data-i18n-title', 'ui.CenterOnMap');
    centerBtn.title = GDMMLang.t('ui.CenterOnMap');
    centerBtn.innerHTML = `<img src="img/center-icon.svg" width="16" alt="${GDMMLang.t('ui.CenterOnMap')}">`;
    centerBtn.addEventListener('click', () => {
      if (!path.points || !path.points.length) return;
      const first = path.points[0];
      centerOn(first.xp, first.yp, 0.8);
    });
    row.appendChild(centerBtn);

    // --- Delete button---
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'marker-delete danger small';
    const deleteKey = 'ui.DeleteButton';
    const deleteLabel = GDMMLang.t(deleteKey);
    delBtn.setAttribute('data-i18n-title', deleteKey);
    delBtn.setAttribute('data-i18n-alt', deleteKey);
    delBtn.title = deleteLabel;
    delBtn.setAttribute('aria-label', deleteLabel);
    delBtn.innerHTML = `<img src="img/bin-icon.svg" width="16" alt="${deleteLabel}">`;

    delBtn.addEventListener('click', () => {
      p.paths = p.paths.filter(r => r.id !== path.id);
      renderMarkers();
      renderRoutesPanel();
      markAsChanged();
      saveUserDataToLocal();
      showToast(GDMMLang.t('toast.RouteDeleted') || 'Route deleted', 'warning', 2500);
    });
    row.appendChild(delBtn);
    wrap.appendChild(row);
  });
  const countEl = document.getElementById('routesCount');
  if (countEl) countEl.textContent = p.paths ? p.paths.length : 0;
}

  // --- Center on marker ---
  function centerOn(xp, yp, targetScale = 1.5, markerId = null) {
    if (!state.mapReady) return;

    const vb = viewport.getBoundingClientRect();
    const pt = pctToPx(xp, yp);

    const scale = clamp(targetScale || state.view.scale, 0.2, 4);
    state.view.scale = scale;

    state.view.x = vb.width  / 2 - pt.x * scale;
    state.view.y = vb.height / 2 - pt.y * scale;

    clampViewToMap();
    applyView();
    persistViewForCurrentProfile();

    if (markerId) {
      const markerEl = document.querySelector(`.marker[data-mid="${markerId}"]`);
      if (markerEl) {
        markerEl.classList.add('marker-highlight');
        setTimeout(() => markerEl.classList.remove('marker-highlight'), 1500);
      }
    }
  }

  // --- Pan & Zoom ---
  let panning = false, panId = null, panStart = {x:0,y:0}, viewStart = {x:0,y:0};

  // --- Pinch zoom (mobile) ---
  const activeTouches = new Map();
  const pinchState = {
    active: false,
    id1: null,
    id2: null,
    startDistance: 0,
    startScale: 1,
    startCenter: { x: 0, y: 0 },
    startView: { x: 0, y: 0 },
  };

  function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

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

    if (t !== 'path' && !skipFinalize) {
      finalizeCurrentPath();
    }
    updateFinishButtonPulse();
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
        showToast(GDMMLang.t('toast.PathFinished'));
      } else {
        showToast(GDMMLang.t('toast.NoPath'));
      }
    });
  }

viewport.addEventListener('pointerdown', e => {
  // --- Copie rapide des coords (Alt+clic sur la carte) ---
  if (e.altKey && state.mapReady) {
    const { xp, yp } = viewToPct(e.clientX, e.clientY);
    if (isFinite(xp) && isFinite(yp)) {
      const cx = clamp(xp, 0, 100).toFixed(2);
      const cy = clamp(yp, 0, 100).toFixed(2);
      const text = `      xp: ${cx},\n      yp: ${cy}`;

      const onDone = () => {
        if (typeof showToast === 'function') {
          showToast(`Coordonnées copiées : xp=${cx}, yp=${cy}`);
        } else {
          console.log('Coordonnées copiées :\n' + text);
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(onDone)
          .catch(err => {
            console.warn('Clipboard error', err);
            onDone();
          });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(ta);
        onDone();
      }
    }
    return;
  }

  // --- MODE MARKER add ---
  if (state.tool === 'add') {
    const { xp, yp } = viewToPct(e.clientX, e.clientY);
    if (xp >= 0 && xp <= 100 && yp >= 0 && yp <= 100 && state.mapReady) {
      addMarkerFromUI(xp, yp);
    }
    return;
  }

  // --- MODE PATH (point add) ---
  if (state.tool === 'path') {
    const { xp, yp } = viewToPct(e.clientX, e.clientY);
    if (xp >= 0 && xp <= 100 && yp >= 0 && yp <= 100 && state.mapReady) {
      addPathPoint(xp, yp);
    }
    return;
  }

  // --- Gestion des touches pour pinch ---
  if (e.pointerType === 'touch') {
    activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Quand on a 2 doigts en mode pan → on démarre le pinch
    if (activeTouches.size === 2 && state.tool === 'pan') {
      const [id1, id2] = Array.from(activeTouches.keys());
      const p1 = activeTouches.get(id1);
      const p2 = activeTouches.get(id2);

      pinchState.active = true;
      pinchState.id1 = id1;
      pinchState.id2 = id2;
      pinchState.startDistance = distance(p1, p2);
      pinchState.startScale = state.view.scale;
      pinchState.startCenter = midpoint(p1, p2);
      pinchState.startView = { x: state.view.x, y: state.view.y };

      // On annule un éventuel pan qui aurait commencé avec le 1er doigt
      panning = false;
      panId = null;
      return;
    }
  }

  // --- classic PAN ---
  e.preventDefault();
  if (e.target.closest && e.target.closest('.marker')) {
    return;
  }
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  panning = true;
  panId = e.pointerId;
  viewport.setPointerCapture?.(panId);
  panStart = { x: e.clientX, y: e.clientY };
  viewStart = { ...state.view };
});


function updateDungeonHover(e) {
  if (!state.dungeonOverlays || !state.dungeonOverlays.length) return;
  const { xp, yp } = viewToPct(e.clientX, e.clientY);

  if (!isFinite(xp) || !isFinite(yp) || xp < 0 || xp > 100 || yp < 0 || yp > 100) {
    state.dungeonOverlays.forEach(d => d.el.classList.remove('is-hovered'));
    return;
  }

  const mapW = state.mapNatural.w || 1;
  const mapH = state.mapNatural.h || 1;
  const mx = (xp / 100) * mapW;
  const my = (yp / 100) * mapH;

  state.dungeonOverlays.forEach(d => {
    const inside =
      mx >= d.left && mx <= d.left + d.width &&
      my >= d.top  && my <= d.top  + d.height;

    d.el.classList.toggle('is-hovered', inside);
  });
}


  viewport.addEventListener('pointermove', e => {

    if (state.dungeonOverlays && state.dungeonOverlays.length) {
      updateDungeonHover(e);
    }

    if (e.pointerType === 'touch') {
  activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Si on est en mode pinch, on gère le zoom ici
    if (pinchState.active) {
      const p1 = activeTouches.get(pinchState.id1);
      const p2 = activeTouches.get(pinchState.id2);

      if (p1 && p2 && pinchState.startDistance > 0) {
        const newDist = distance(p1, p2);
        const ratio = newDist / pinchState.startDistance;
        const targetScale = clamp(
          pinchState.startScale * ratio,
          0.18,
          1.28
        );

        const vb = viewport.getBoundingClientRect();
        const centerNow = midpoint(p1, p2);
        const ox = centerNow.x - vb.left;
        const oy = centerNow.y - vb.top;

        // On garde le centre du pinch “accroché” à la même zone de la map
        const ix = (ox - pinchState.startView.x) / pinchState.startScale;
        const iy = (oy - pinchState.startView.y) / pinchState.startScale;

        state.view.x = ox - ix * targetScale;
        state.view.y = oy - iy * targetScale;
        state.view.scale = targetScale;

        clampViewToMap();
        applyView();
        persistViewForCurrentProfile();
      }

      e.preventDefault();
      return; // on ne fait pas le reste (pan/classic cursor) quand on pinche
    }
  }


    const { xp, yp } = viewToPct(e.clientX, e.clientY);
    if (!panning) {
      if (isFinite(xp) && isFinite(yp)) {
        const cr = $('#cursorReadout');
        if (cr) cr.textContent = `x: ${clamp(xp,0,100).toFixed(1)}%, y: ${clamp(yp,0,100).toFixed(1)}%`;
      }
      // --- Preview de route en mode PATH ---
      if (
        state.tool === 'path' &&
        pathMode.active &&
        pathMode.current &&
        pathMode.current.points &&
        pathMode.current.points.length > 0 &&
        state.mapReady
      ) {
        if (xp >= 0 && xp <= 100 && yp >= 0 && yp <= 100) {
          updatePathPreview(xp, yp);
        } else {
          clearPathPreview();
        }
      } else {
        clearPathPreview();
      }
      return;
    }

    // PAN classique
    e.preventDefault();
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    state.view.x = viewStart.x + dx;
    state.view.y = viewStart.y + dy;
    clampViewToMap();
    applyView();
  });

  function stopPan(e){
    // Nettoyage des touches
    if (e && e.pointerType === 'touch') {
      activeTouches.delete(e.pointerId);

      // Si un des deux doigts du pinch se lève → fin du pinch
      if (pinchState.active &&
          (e.pointerId === pinchState.id1 || e.pointerId === pinchState.id2)) {
        pinchState.active = false;
        pinchState.id1 = null;
        pinchState.id2 = null;
        pinchState.startDistance = 0;
      }
    }

    if (!panning) return;
    panning = false;
    panId = null;
    persistViewForCurrentProfile();
  }


  viewport.addEventListener('pointerup', stopPan);
  viewport.addEventListener('pointerleave', stopPan);
  window.addEventListener('pointerup', stopPan);
  window.addEventListener('pointercancel', stopPan);
  viewport.addEventListener('lostpointercapture', stopPan);

  //ZOOM FONCTION
    function zoomAt(clientX, clientY, step) {
      const old = state.view.scale;
      const ns = clamp(old * (1 + step), 0.18, 1.28);
      if (ns === old) return;

      const vb = viewport.getBoundingClientRect();
      const ox = clientX - vb.left;
      const oy = clientY - vb.top;
      const ix = (ox - state.view.x) / old;
      const iy = (oy - state.view.y) / old;

      state.view.x = ox - ix * ns;
      state.view.y = oy - iy * ns;
      state.view.scale = ns;

      clampViewToMap();
      applyView();
      persistViewForCurrentProfile();
    }

    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      const step = -Math.sign(e.deltaY) * 0.12;
      zoomAt(e.clientX, e.clientY, step);
    }, { passive: false });


  const zoomInBtn  = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      const vb = viewport.getBoundingClientRect();
      const cx = vb.left + vb.width  / 2;
      const cy = vb.top  + vb.height / 2;
      zoomAt(cx, cy, +0.32);
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      const vb = viewport.getBoundingClientRect();
      const cx = vb.left + vb.width  / 2;
      const cy = vb.top  + vb.height / 2;
      zoomAt(cx, cy, -0.32);
    });
  }


function clampViewToMap() {
  if (!state.mapReady) return;

  const vb = viewport.getBoundingClientRect();
  const iw = state.mapNatural.w * state.view.scale;
  const ih = state.mapNatural.h * state.view.scale;

  // marges autour de la map
  const marginLeft   = 320;
  const marginRight  = 320;
  const marginTop    = 320;
  const marginBottom = 450;

  const minX = vb.width  - iw - marginRight;
  const maxX = marginLeft;

  const minY = vb.height - ih - marginBottom;
  const maxY = marginTop;

  state.view.x = clamp(state.view.x, minX, maxX);
  state.view.y = clamp(state.view.y, minY, maxY);
}


  // --- Drag & Drop image ---
  ;['dragenter','dragover'].forEach(ev => viewport.addEventListener(ev, e => { e.preventDefault(); viewport.style.outline = '2px dashed #78f1c2'; }));
  ;['dragleave','drop'].forEach(ev => viewport.addEventListener(ev, e => { e.preventDefault(); viewport.style.outline = 'none'; }));
  viewport.addEventListener('drop', e => { const f = e.dataTransfer.files?.[0]; if (!f) return; setMapSrc(f); });

  // --- Toast ---
    function showToast(message, type = 'success', duration = 2500) {
      const container = document.getElementById('toastContainer');
      if (!container) {
        console.warn('[GDMM] Missing #toastContainer element.');
        return;
      }

      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = message;

      container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
      }, duration);
    }


// === PATHS (ADD / EXPORT / IMPORT) ===
const newPathBtn = document.getElementById('newPathBtn');
if (newPathBtn) {
  newPathBtn.addEventListener('click', () => {
    setTool('path');
    const input = document.getElementById('newPathName');
    const customName = input ? input.value.trim() : '';
    const path = startNewPath(customName);
    if (input) input.value = '';
    renderRoutesPanel();
  });
}

  // --- Profils (buttons) ---
  $('#profileSelect')?.addEventListener('change', e => {
    const name = e.target.value;
    setActiveProfile(name);
    rememberActiveProfile();
    const p = currentProfile();
    if (p && p.map && p.map.embedData) {
      showLoader(GDMMLang.t('toast.LoadingMap'));
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
//----------------------------------------------------------------------------------------

// Decode share payload from URL (handles GZIP + Base64 + LZString)
  function decodeSharePayload(str) {
    if (!str) return null;

    if (window.pako) {
      try {
        const b64 = decodeURIComponent(str);
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const out = pako.inflate(bin, { to: 'string' });
        if (out) {
          return JSON.parse(out);
        }
      } catch (e) {
        console.warn('[GDMM] GZIP decode failed, fallback to LZString/base64', e);
      }
    }

    // 2) Try LZString (ancien format ?share= compressToEncodedURIComponent)
    if (window.LZString && typeof LZString.decompressFromEncodedURIComponent === 'function') {
      try {
        const out = LZString.decompressFromEncodedURIComponent(str);
        if (out) {
          return JSON.parse(out);
        }
      } catch (e) {
        console.warn('[GDMM] LZString decompress failed', e);
      }
    }

    try {
      const decoded = atob(str);
      return JSON.parse(decoded);
    } catch (e) {
      // 4) Try URI-encoded base64 JSON
      try {
        const decoded = atob(decodeURIComponent(str));
        return JSON.parse(decoded);
      } catch (e2) {
        console.error('[GDMM] All decode methods failed', e2);
      }
    }
    return null;
  }


  // Load shared routes from ?share= parameter
  function loadSharedFromUrl() {
    const params = new URLSearchParams(location.search);
    const raw = params.get('share');
    if (!raw) return;

    let data;
    try {
      data = decodeSharePayload(raw);
    } catch (e) {
      console.warn('[GDMM] invalid share payload', e);
      return;
    }

    if (!data) return;

    let routes = [];
    let markers = [];
    const mapName = data.map || null;

    if (Array.isArray(data.r) || Array.isArray(data.m)) {
      const compactRoutes = Array.isArray(data.r) ? data.r : [];

      routes = compactRoutes.map(r => ({
        id: r.i,
        name: r.n || '',
        color: r.c || '#ffcc00',
        width: r.w || 4,
        opacity: (typeof r.o === 'number') ? r.o : 0.85,
        points: Array.isArray(r.pts)
          ? r.pts.map(pt => ({
              xp: pt[0],
              yp: pt[1],
            }))
          : [],
      }));

      markers = (Array.isArray(data.m) ? data.m : []).map(m => ({
        id: m.i || (window.GDMMCore && GDMMCore.uid ? GDMMCore.uid() : Math.random().toString(36).slice(2)),
        xp: m.x,
        yp: m.y,
        label: m.l || '',
        cat: m.k || 'General',
        color: m.c || '#78f1c2',
        done: false,
        shared: true,
      }));
    }
    // --- Ancien format : { routes: [...], markers: [...] }
    else if (Array.isArray(data.routes)) {
      routes = data.routes;
      const incomingMarkers = Array.isArray(data.markers) ? data.markers : [];
      markers = incomingMarkers.map(m => {
        if (!m || typeof m !== 'object') return m;
        return { ...m, shared: true };
      });
    } else {
      // rien d'exploitable
      return;
    }

    if (!routes.length && !markers.length) return;

    const baseName = `[Shared] ${mapName || 'Route'}`;
    let name = baseName;
    let i = 2;
    while (state.profiles[name]) {
      name = `${baseName} #${i++}`;
    }

    const p = ensureProfile(name);

    p.markers = markers;
    p.paths = routes;
    p.isShared = true;
    p.sharedSourceMap = mapName;

    const src = mapName && state.profiles[mapName];
    if (src && src.map) {
      p.map = src.map;
    }

    setActiveProfile(name);

    // Si la map originale a un embed / sessionSrc, on la réutilise
    if (p.map && p.map.embedData) {
      showLoader(GDMMLang.t('toast.LoadingMap'));
      setMapSrc(p.map.embedData);
    } else if (p.map && p.map.sessionSrc) {
      showLoader(GDMMLang.t('toast.LoadingMap'));
      setMapSrc(p.map.sessionSrc);
    }

    refreshProfilesUI();
    renderList();
    renderMarkers();
    renderRoutesPanel();

    // Active read only + bouton "Add shared to my map"
    document.body.classList.add('shared-only-view');
  }
//---------------------------------------------------------------------------------------

  // --- Init on load ---
  (async () => {
    let REMOTE_JSON_URL;

      if (location.protocol === 'file:') {
          // Version DEV
          REMOTE_JSON_URL = 'https://raw.githubusercontent.com/yakmandji/Grim-dawn-map-marker-tool/main/dev-map/gdmm_all_profiles.json';
      } else {
          // Version PROD
          REMOTE_JSON_URL = 'https://www.grimcustommarker.org/gdmm_all_profiles.json?v=3.27';
      }
          // empty base
    state.profiles['Profil 1'] = {
     markers:[],
     paths: [],
     map:{}, 
     created: new Date().toISOString(), 
     updated: new Date().toISOString() 
   };
    setActiveProfile('Profil 1');
    // Try remote
    try {
      const resp = await fetch(REMOTE_JSON_URL, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const txt = await resp.text();
      const obj = JSON.parse(txt);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        state.profiles = obj;

        const keys = Object.keys(state.profiles);
        let initial = keys[0] || 'Profil 1';

        try {
          const last = localStorage.getItem(LAST_PROFILE_KEY);
          if (last && keys.includes(last)) {
            initial = last;
          }
        } catch (e) {
          console.warn('[GDMM] cannot read last profile', e);
        }

        setActiveProfile(initial);
        rememberActiveProfile();

        const p = currentProfile();
        if (p && p.map && p.map.embedData) {
          showLoader('Loading map…');
          setMapSrc(p.map.embedData);
        } else if (p && p.map && p.map.sessionSrc) {
          showLoader('Loading map…');
          setMapSrc(p.map.sessionSrc);
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
    initDonePanelToggle();
    // defaut lock
    state.locked = true;
    applyLockUI();
    loadSharedFromUrl();
  })();

// === SPACE → PAN (global) ===
  let isSpaceDown = false;
  let prevTool = null;

  window.addEventListener(
    'keydown',
    (e) => {
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isSpaceDown) {
          isSpaceDown = true;
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

        if (prevTool) {
          setTool(prevTool);
          prevTool = null;
        }
      }
    },
    true
  );

  // MOBILE MENU
    const btn = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('left-menu');

    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('open');
      });
    }


  // --- Expose global ---
  window.UiCore = {
    $,ensurePathsArray,mapImg,refreshProfilesUI,renderList,renderMarkers,renderRoutesPanel,setMapSrc,showToast,updateSaveIndicator,
  };

})();
