(function(){
const {
  state,DEV_MODE,clamp,iconFor,currentProfile,markAsChanged,updateSaveIndicator,
  setActiveProfile,renameProfile,deleteProfile,listProfiles,
  addMarker: coreAddMarker,
  updateMarker: coreUpdateMarker,
  deleteMarker: coreDeleteMarker,
  clearMarkers: coreClearMarkers,getUserDataOnly,saveUserDataToLocal,loadUserDataFromLocal,
  mergeUserMarkers,ensureProfile,
} = window.GDMMCore;

const {
  addMarkerFromUI,
  updateMarkerFromUI,
  deleteMarkerFromUI,
  renderList,
} = window.UiMarkers || {};

 const Routes = window.UiRoutes || {};

  const LAST_PROFILE_KEY = 'gdmm_last_profile';

function rememberActiveProfile() {
  if (!state.active) return;

  // 1) Sauvegarde globale "legacy"
  try {
    localStorage.setItem(LAST_PROFILE_KEY, state.active);
  } catch (e) {
    console.warn('[GDMM] cannot store last profile', e);
  }

  // 2) Synchronise aussi sur le perso actif du multi-character
  try {
    if (window.characterManager && typeof characterManager.updateActiveState === 'function') {
      characterManager.updateActiveState((prev) => {
        const next = { ...(prev || {}) };
        next.lastProfile = state.active;
        return next;
      });
    }
  } catch (e) {
    console.warn('[GDMM] failed to sync lastProfile to character', e);
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


// PATH MODE (délégué à UiRoutes)
// ==============================

  function getPathMode() {
    if (Routes.getPathMode) {
      return Routes.getPathMode();
    }
    return { active: false, current: null };
  }

  function clearPathPreview() {
    if (Routes.clearPathPreview) {
      Routes.clearPathPreview();
    }
  }

  function updatePathPreview(xp, yp) {
    if (Routes.updatePathPreview) {
      Routes.updatePathPreview(xp, yp);
    }
  }

  // Gardé pour compat avec UiTools (exporté via UiCore plus bas)
  function ensurePathsArray() {
    if (Routes.ensurePathsArray) {
      return Routes.ensurePathsArray();
    }
    const p = currentProfile();
    if (!p) return null;
    if (!p.paths) p.paths = [];
    return p.paths;
  }

  function startNewPath(defaultName = '') {
    if (Routes.startNewPath) {
      return Routes.startNewPath(defaultName);
    }
    return null;
  }

  function addPathPoint(xp, yp) {
    if (Routes.addPathPoint) {
      Routes.addPathPoint(xp, yp);
    }
  }

  function finalizeCurrentPath() {
    if (Routes.finalizeCurrentPath) {
      Routes.finalizeCurrentPath();
    }
  }

  function updateFinishButtonPulse() {
    if (Routes.updateFinishButtonPulse) {
      Routes.updateFinishButtonPulse();
      return;
    }
    // fallback au cas où UiRoutes n’est pas chargé
    const btn = document.getElementById('toolFinishPath');
    if (!btn) return;
    const pm = getPathMode();
    const isCurrentPath = pm.active && pm.current && state.tool === 'path';
    btn.classList.toggle('pulse', !!isCurrentPath);
  }
  
/*END ------------------------------------------------------*/

  // --- UI renderers ---
    function refreshProfilesUI() {
      const sel = $('#profileSelect');
      if (!sel) return;
      const active = state.active;
      const names = listProfiles();

      // 1) Met à jour le <select> natif (logique existante)
      sel.innerHTML = names
        .map(n => `<option ${n === active ? 'selected' : ''}>${n}</option>`)
        .join('');
      if (active) sel.value = active;

      // 2) Met à jour le dropdown custom des profils
      const dd = document.getElementById('profileDropdown');
      if (!dd) return;

      const labelEl = dd.querySelector('.select-label');
      const menuEl  = dd.querySelector('.custom-dropdown-inner');
      if (!menuEl || !labelEl) return;

      const current = active || names[0] || '';
      labelEl.textContent = current || '(profil)';

      // On reconstruit la liste des options
      menuEl.innerHTML = names
        .map(name => `
          <button type="button" class="option-item" data-profile="${name}">
            ${name}
          </button>
        `)
        .join('');

      // 3) (Ré)initialise le dropdown custom avec le helper générique
      if (window.initCustomDropdown) {
        initCustomDropdown({
          nativeId: 'profileSelect',
          dropdownId: 'profileDropdown',
          itemSelector: '.option-item',
          valueAttr: 'data-profile',
          currentButtonSelector: '.select-current',
          currentLabelSelector: '.select-label',
          getLabel: (item) => (item.textContent || '').trim()
        });
      }
    }

    // --- Dropdown Catégorie (nouveau marqueur) ---
    (function () {
      const sel = document.getElementById('newCategory');
      const dd  = document.getElementById('categoryDropdown');
      if (!sel || !dd) return;

      const inner = dd.querySelector('.custom-dropdown-inner');
      if (!inner) return;

      const categoryIcons = {
        General:  'img/waypoint.svg',
        Quest:    'img/quest.svg',
        Boss:     'img/boss.svg',
        Loot:     'img/loot.svg',
        Waypoint: 'img/passage.svg',
        Donjon:   'img/donjon.svg',
        NPC:      'img/npc.svg',
      };

      inner.innerHTML = '';

      Array.from(sel.options).forEach(opt => {
        const iconSrc = categoryIcons[opt.value] || '';
        const i18nKey = opt.getAttribute('data-i18n') || '';

        const labelText =
          i18nKey && window.GDMMLang && typeof GDMMLang.t === 'function'
            ? GDMMLang.t(i18nKey)
            : opt.textContent;

        inner.innerHTML += `
          <button class="option-item" data-value="${opt.value}">
            ${iconSrc ? `<img src="${iconSrc}" width="16" height="16" style="margin-right:4px;">` : ''}
            <span ${i18nKey ? `data-i18n="${i18nKey}"` : ''}>${labelText}</span>
          </button>
        `;
      });

      if (window.initCustomDropdown) {
        initCustomDropdown({
          nativeId: 'newCategory',
          dropdownId: 'categoryDropdown',
          itemSelector: '.option-item',
          valueAttr: 'data-value',
          currentButtonSelector: '.select-current',
          currentLabelSelector: '.select-label',
          getLabel: (item) => item.textContent.trim(),
          extraSync: ({ currentBtn, item }) => {
            const btnIcon  = currentBtn.querySelector('.category-icon');
            const itemIcon = item.querySelector('img');
            if (btnIcon && itemIcon) {
              btnIcon.src = itemIcon.src;
            }
          }
        });
      }
    })();

    // --- END Dropdown Catégorie (nouveau marqueur) ---


  // List of Done element ----------------------------------------
  window.renderDoneList = function renderDoneList(doneMarkers) {
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

      const iconWrap = document.createElement('div');
      iconWrap.className = 'doneIcon';

      let ic = iconFor(m.cat);
      if (ic && m.done) {
        ic = ic.replace('.svg', '-done.svg');
      }

      if (ic) {
        const img = document.createElement('img');
        img.className = 'doneIcon-img';
        img.src = ic;
        iconWrap.appendChild(img);
      }

      const lab = document.createElement('div');
      lab.className = 'doneLabel';
      lab.textContent = m.label || '(no name)';
      lab.title = m.label || '';

      const actions = document.createElement('div');
      actions.className = 'doneActions';

      const centerBtn = document.createElement('button');
      centerBtn.type = 'button';
      centerBtn.className = 'marker-center small';
      centerBtn.innerHTML = `<img src="img/center-icon.svg" width="12">`;
      centerBtn.onclick = () => centerOn(m.xp, m.yp, 1.2, m.id);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'marker-delete danger small';
      delBtn.innerHTML = `<img src="img/bin-icon.svg" width="12">`;
      delBtn.onclick = () => deleteMarkerFromUI(m.id);

      actions.appendChild(centerBtn);
      actions.appendChild(delBtn);

      row.appendChild(iconWrap);
      row.appendChild(lab);
      row.appendChild(actions);

      host.prepend(row);
    });
  };
// END -----------------------------------------------

  window.initDonePanelToggle = function initDonePanelToggle() {
    const panel  = $('#donePanel');
    const toggle = $('#donePanelToggle');
    if (!panel || !toggle) return;

    // Mobile : on replie le panneau par défaut
    if (window.innerWidth < 768) {
      panel.classList.add('collapsed');
    }

    toggle.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
    });
  };


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


// RENDER MARKER -------------------------------------------------------------------------

function renderMarkers(options = {}) {
  const { skipRoutesPanel = false } = options;

  // 1) Cleaning
  document.querySelectorAll('#mapInner .marker').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .path-point').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .path-label').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .path-endpoint').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .marker-region').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .marker-link').forEach(n => n.remove());
  document.querySelectorAll('#mapInner .marker-entry-dungeon').forEach(n => n.remove());

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

  // --- ROUTES ---
  if (window.UiMapRender?.renderRoutes) {
    UiMapRender.renderRoutes(svg, inner);
  }
  // --- USER MARKERS ---
  if (window.UiMapRender?.renderUserMarkers) {
    UiMapRender.renderUserMarkers(inner);
  }
  // --- ADMIN MARKERS ---
  if (window.UiMapRender?.renderAdminMarkers) {
    UiMapRender.renderAdminMarkers(inner);
  }

  if (typeof window.refreshDungeonForcedHover === 'function') {
    window.refreshDungeonForcedHover();
  }

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

  // === Routes Panel (delegated to UiRoutes) ===

  function renderRoutesPanel() {
    if (Routes.renderRoutesPanel) {
      Routes.renderRoutesPanel();
    }
  }

  // Compat global
  window.renderRoutesPanel = renderRoutesPanel;

  // --- Center on marker ---
  function centerOn(xp, yp, targetScale = 1.5, markerId = null) {
    if (!state.mapReady) return;

    const vb = viewport.getBoundingClientRect();
    const pt = pctToPx(xp, yp);

    const scale = clamp(targetScale || state.view.scale, 0.35, 1.50);
    state.view.scale = scale;

    state.view.x = vb.width  / 2 - pt.x * scale;
    state.view.y = vb.height / 2 - pt.y * scale;

    clampViewToMap();
    applyView();
    persistViewForCurrentProfile();

    if (markerId) {
      const markerEl = document.querySelector(`.marker[data-mid="${markerId}"]`);

      // Si c’est un Done marker et que l’historique est masqué, on réactive L'archive
      if (markerEl && markerEl.classList.contains('completed')) {
        if (typeof window.ensureAdminLayerVisible === 'function') {
          window.ensureAdminLayerVisible('history');
        }
      }

      // (re-sélection après éventuel changement de classe / filtre)
      const markerEl2 = document.querySelector(`.marker[data-mid="${markerId}"]`);
      if (markerEl2) {
        markerEl2.classList.add('marker-highlight');
        setTimeout(() => markerEl2.classList.remove('marker-highlight'), 1500);
      }
    }

  }

  window.centerOn = centerOn;


// Anim Smooth ---------------------------------------------------------
      let _centerAnim = null;

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function smoothCenterOn(xp, yp, targetScale = null, duration = 260) {
        if (!state.mapReady) return;
        if (_centerAnim) cancelAnimationFrame(_centerAnim);

        const vb = viewport.getBoundingClientRect();
        const pt = pctToPx(xp, yp);

        const start = {
          x: state.view.x,
          y: state.view.y,
          scale: state.view.scale,
        };

        const endScale = clamp(
          targetScale == null ? state.view.scale : targetScale,
          0.40,
          1.20
        );

        const end = {
          scale: endScale,
          x: vb.width  / 2 - pt.x * endScale,
          y: vb.height / 2 - pt.y * endScale,
        };

        const t0 = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - t0) / Math.max(1, duration));
          const e = easeOutCubic(t);

          state.view.scale = start.scale + (end.scale - start.scale) * e;
          state.view.x     = start.x     + (end.x     - start.x)     * e;
          state.view.y     = start.y     + (end.y     - start.y)     * e;

          clampViewToMap();
          applyView();

          if (t < 1) {
            _centerAnim = requestAnimationFrame(step);
          } else {
            _centerAnim = null;
            persistViewForCurrentProfile();
          }
        };

        _centerAnim = requestAnimationFrame(step);
      }

      window.smoothCenterOn = smoothCenterOn;
// Anim Smooth ---------------------------------------------------------



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

    const addBtn  = document.getElementById('toolAdd');
    const pathBtn = document.getElementById('toolPath');

    if (addBtn)  addBtn.classList.toggle('active', t === 'add');
    if (pathBtn) pathBtn.classList.toggle('active', t === 'path');

    if (addBtn) {
      const labelEl = addBtn.querySelector('span') || addBtn;
      if (t === 'add') {
          labelEl.setAttribute('data-i18n', 'ui.CancelMarkerButton');
          labelEl.textContent = GDMMLang.t('ui.CancelMarkerButton');
      } else {
          labelEl.setAttribute('data-i18n', 'ui.AddMarkerButton');
          labelEl.textContent = GDMMLang.t('ui.AddMarkerButton');
      }
    }

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
  $('#toolAdd')?.addEventListener('click', () => {
    if (state.tool === 'add') {
      setTool('pan');
    } else {
      setTool('add');
    }
  });
  setTool('pan');
  const finishPathBtn = document.getElementById('toolFinishPath');
  if (finishPathBtn) {
    finishPathBtn.addEventListener('click', () => {
      if (state.tool === 'path') {
        finalizeCurrentPath();
        setTool('pan');
        showToast(GDMMLang.t('toast.PathFinished'));
        const popup = document.querySelector('.gd-popup--route');
        if (popup) popup.classList.remove('is-open');
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

        const text = `xp: ${cx}, yp: ${cy},`;

        const onDone = () => {
          if (typeof showToast === 'function') {
            showToast(`Coordonnées copiées : xp=${cx}, yp=${cy}`);
          } else {
            console.log('Coordonnées copiées : ' + text);
          }
        };

        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text)
            .then(onDone)
            .catch(err => { console.warn('Clipboard error', err); onDone(); });
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

  // Blur inputs
  const ae = document.activeElement;
  if (
    ae &&
    (
      ae.tagName === 'INPUT' ||
      ae.tagName === 'TEXTAREA' ||
      ae.tagName === 'SELECT' ||
      ae.isContentEditable ||
      ae.classList?.contains('select-green') // <- bouton de select custom
    )
  ) {
    ae.blur();
  }

  // Fermer aussi les dropdowns custom si la map prend le focus
  document.querySelectorAll('.custom-dropdown.open').forEach((el) => {
    el.classList.remove('open');
  });


  if (
    e.target.closest &&
    (
      e.target.closest('.marker') ||
      e.target.closest('.marker-entry-dungeon') ||
      e.target.closest('.dungeon-wrapper') 
    )
  ) {
    // on laisse l'élément gérer son pointerup / click.
    return;
  }

  if (e.pointerType === 'mouse' && e.button !== 0) return;
    
  panning = true;
  panId = e.pointerId;
  viewport.setPointerCapture?.(panId);
  panStart = { x: e.clientX, y: e.clientY };
  viewStart = { ...state.view };
  });


/*Pointer move------------------------------------------------*/

viewport.addEventListener('pointermove', e => {
  const isTouch = e.pointerType === 'touch';

    // 2) Sur mobile (touch) : on gère uniquement le pinch / pan,
    if (isTouch) {
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
            0.35,
            1.50
          );
          const vb = viewport.getBoundingClientRect();
          const centerNow = midpoint(p1, p2);
          const ox = centerNow.x - vb.left;
          const oy = centerNow.y - vb.top;
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
        return;
      }
    }

    const { xp, yp } = viewToPct(e.clientX, e.clientY);
    if (!panning) {
      if (isFinite(xp) && isFinite(yp)) {
        const cr = $('#cursorReadout');
        if (cr) cr.textContent = `x: ${clamp(xp,0,100).toFixed(1)}%, y: ${clamp(yp,0,100).toFixed(1)}%`;
      }
      // --- Preview route mode PATH ---
      const pm = getPathMode();
      if (
        state.tool === 'path' &&
        pm.active &&
        pm.current &&
        pm.current.points &&
        pm.current.points.length > 0 &&
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
/*END------------------------------------------*/



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
      const ns = clamp(old * (1 + step), 0.35, 1.50);
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
    const marginLeft   = 550;
    const marginRight  = 550;
    const marginTop    = 550;
    const marginBottom = 550;

    const minX = vb.width  - iw - marginRight;
    const maxX = marginLeft;
    const minY = vb.height - ih - marginBottom;
    const maxY = marginTop;

    state.view.x = clamp(state.view.x, minX, maxX);
    state.view.y = clamp(state.view.y, minY, maxY);
  }


  // --- Drag & Drop image ---

  viewport.addEventListener('dragstart', e => e.preventDefault());
  
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
  $('#profileSelect')?.addEventListener('change', async (e) => {
    const name = e.target.value;
    setActiveProfile(name);
    rememberActiveProfile();
    showLoader(GDMMLang.t('toast.LoadingMap'));

    // Charge le JSON de cette map si besoin
    await ensureMapLoadedForProfile(name);

    const p = currentProfile();
    if (p && p.map && p.map.embedData) {
      setMapSrc(p.map.embedData);
    } else if (p && p.map && p.map.sessionSrc) {
      setMapSrc(p.map.sessionSrc);
    } else {
      mapImg.removeAttribute('src');
      state.mapReady = false;
      state.mapNatural = { w: 0, h: 0 };
      hideLoader();
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

//----------------------------------------------------------------------------------------


  // --- Map sources (One Json per map) ---
  const MAP_SOURCES = {
    'Cairn':        'https://www.grimcustommarker.org/maps/cairn_profile.json?v=1.13',
    'Malmouth':     'https://www.grimcustommarker.org/maps/malmouth_profile.json?v=1.13',
    'Korvan Basin': 'https://www.grimcustommarker.org/maps/korvan_basin_profile.json?v=1.15',
    'Asterkarn':    'https://www.grimcustommarker.org/maps/asterkarn_profile.json?v=1',
  };

  // Load map for profile if need
  async function ensureMapLoadedForProfile(name) {
    if (!name) return;
    const p = ensureProfile(name);
    if (p.map && (p.map.embedData || p.map.sessionSrc)) {
      return;
    }

    const url = MAP_SOURCES[name];
    if (!url) {
      console.warn('[GDMM] no MAP_SOURCES entry for', name);
      return;
    }

    try {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();

      // Si le JSON est { map: { ... } }
      if (json.map) {
        p.map = json.map;
      } else {
        // Si le JSON has only map
        p.map = json;
      }
    } catch (e) {
      console.warn('[GDMM] Failed to load map JSON for', name, e);
    }
  }



// =============================
// PAN AU CLAVIER
// =============================

    const keys = {};

    const PAN_KEYS = [
      "ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
      "a","d","w","s",
      "z","q"
    ];

    let keyboardPanInterval = null;

    const SPEED       = 20;
    const SPEED_FAST  = 42;
    const SPEED_SLOW  = 10;
    const MIN_PAN_SCALE = 1;

    function normKey(e) {
      const k = e.key;
      // lettres -> minuscule (évite le piège Shift)
      if (typeof k === "string" && k.length === 1) return k.toLowerCase();
      return k; // ArrowLeft, Shift, Control, etc.
    }

      let panHintEl = null;
      let panHintHideTimer = null;
      let panHintHasBeenShown = false;

      const PAN_HINT_DURATION_MS = 9000;  // temps affiché

      function ensurePanHint() {
        if (panHintEl) return panHintEl;

        panHintEl = document.createElement("div");
        panHintEl.className = "gdmm-pan-hint";

        // clé i18n + rendu initial
        panHintEl.setAttribute("data-i18n-html", "hint.PanSpeed");
        panHintEl.innerHTML = GDMMLang.t("hint.PanSpeed");

        document.body.appendChild(panHintEl);
        return panHintEl;
      }

      function showPanHintOncePerPageLoad() {
        if (panHintHasBeenShown) return;
        panHintHasBeenShown = true;

        const el = ensurePanHint();
        el.classList.add("is-visible");

        if (panHintHideTimer) clearTimeout(panHintHideTimer);
        panHintHideTimer = setTimeout(() => {
          el.classList.remove("is-visible");
        }, PAN_HINT_DURATION_MS);
      }


    function startKeyboardPan() {
      if (keyboardPanInterval) return;

      showPanHintOncePerPageLoad();
      keyboardPanInterval = setInterval(() => {
        const core = window.GDMMCore || {};
        const state = core.state || {};
        if (!state.view) return;

        let dx = 0;
        let dy = 0;

        if (keys["ArrowLeft"] || keys["a"] || keys["q"]) dx -= 1;
        if (keys["ArrowRight"] || keys["d"])            dx += 1;
        if (keys["ArrowUp"] || keys["w"] || keys["z"])  dy -= 1;
        if (keys["ArrowDown"] || keys["s"])             dy += 1;

        if (dx === 0 && dy === 0) return;

        const speed =
          keys["Shift"] ? SPEED_FAST :
          keys["Control"] ? SPEED_SLOW :
          SPEED;

        const rawScale = state.view.scale || 1;
        const effectiveScale = Math.max(rawScale, MIN_PAN_SCALE);
        const real = speed / effectiveScale;

        state.view.x -= dx * real;
        state.view.y -= dy * real;

        if (typeof clampViewToMap === "function") clampViewToMap();
        if (typeof applyView === "function") applyView();
      }, 16);
    }

    function stopKeyboardPan() {
      if (keyboardPanInterval) {
        clearInterval(keyboardPanInterval);
        keyboardPanInterval = null;
      }
      if (typeof persistViewForCurrentProfile === "function") {
        persistViewForCurrentProfile();
      }
    }

    window.addEventListener("keydown", (e) => {
      const el = e.target;
      if (
        el &&
        (el.tagName === "INPUT" ||
         el.tagName === "TEXTAREA" ||
         el.isContentEditable)
      ) return;

      const k = normKey(e);

      if (PAN_KEYS.includes(k) || k === "Shift" || k === "Control") {
        keys[k] = true;
        e.preventDefault();
        startKeyboardPan();
      }
    });

    window.addEventListener("keyup", (e) => {
      const k = normKey(e);

      if (keys[k]) {
        delete keys[k];
        if (Object.keys(keys).length === 0) stopKeyboardPan();
      }
    });

    // Important: si focus perdu, on purge tout (évite “touches coincées”)
    window.addEventListener("blur", () => {
      for (const k of Object.keys(keys)) delete keys[k];
      stopKeyboardPan();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        for (const k of Object.keys(keys)) delete keys[k];
        stopKeyboardPan();
      }
    });


  // --- Init on load ---
    (async () => {

      // 1) Crée la structure de base pour chaque map connue
      Object.keys(MAP_SOURCES).forEach((name) => {
        ensureProfile(name);
      });


        loadUserDataFromLocal();

        const params = new URLSearchParams(location.search);
        const isSharedBoot = params.has('s') || params.has('share');

        if (isSharedBoot) {
          showLoader(GDMMLang.t('toast.LoadingMap'));

          // attendre UiShare (car ui.share.js est chargé après ui.core.js)
          const waitUiShare = () => new Promise((resolve, reject) => {
            const t0 = Date.now();
            const timer = setInterval(() => {
              if (window.UiShare && typeof UiShare.loadSharedFromUrl === 'function') {
                clearInterval(timer);
                resolve();
              } else if (Date.now() - t0 > 4000) {
                clearInterval(timer);
                reject(new Error('UiShare not ready'));
              }
            }, 20);
          });

          try {
            await waitUiShare();
            await UiShare.loadSharedFromUrl();
          } catch (e) {
            console.warn('[GDMM] shared boot failed:', e);
            hideLoader(); // évite loader infini si ça foire
          }

          // RENDU UI (comme un boot normal)
          refreshProfilesUI();
          renderList();
          renderMarkers();
          renderRoutesPanel();
          initDonePanelToggle();

          // UI / lock
          state.locked = true;
          applyLockUI();

          return;
        }

      // 3) Choix du profil initial
      const mapNames = Object.keys(MAP_SOURCES);
      let initial = mapNames[0] || Object.keys(state.profiles)[0] || null;

      // On essaie d'abord d'utiliser la dernière map connue valide
      try {
        const last = localStorage.getItem(LAST_PROFILE_KEY);
        if (last && state.profiles[last]) {
          initial = last;
        }
      } catch (e) {
        console.warn('[GDMM] cannot read last profile', e);
      }

      // 4) Active le profil choisi (sans réécrire gdmm_last_profile ici)
      if (initial) {
        setActiveProfile(initial);
      }

      // Synchronise le <select> natif + dropdown custom
      refreshProfilesUI();

      // 5) Charge l'image de map du profil
      if (initial) {
        showLoader(GDMMLang.t('toast.LoadingMap'));
        await ensureMapLoadedForProfile(initial);

        const p = currentProfile();
        if (p && p.map && p.map.embedData) {
          setMapSrc(p.map.embedData);
        } else if (p && p.map && p.map.sessionSrc) {
          setMapSrc(p.map.sessionSrc);
        } else {
          // pas de map trouvée pour ce profil
          hideLoader();
        }
      }

      // 6) UI
      renderList();
      renderMarkers();
      renderRoutesPanel();
      initDonePanelToggle();

      // defaut lock
      state.locked = true;
      applyLockUI();

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
  if (!window.UiCore) {
    window.UiCore = {};
  }

  /*POPUP ADD MARKER AND ROUTE*/

function setupPopup(triggerSelector, popupAttr) {

    const trigger = document.querySelector(triggerSelector);
    const popup   = document.querySelector(`.gd-popup[data-popup="${popupAttr}"]`);
    const group   = document.getElementById('header-add-group');

    if (!trigger || !popup || !group) return;

    const closeButtons = popup.querySelectorAll('[data-popup-close]');

    function closePopup() {
        popup.classList.remove('is-open');
    }

    function openPopup() {

        // Fermer autres popups
        document.querySelectorAll('.gd-popup.is-open').forEach(p => {
            if (p !== popup) p.classList.remove('is-open');
        });

        // Positionner sous le groupe de boutons
        const rect     = group.getBoundingClientRect();
        const margin   = 8;
        const card     = popup.querySelector('.gd-popup__card');
        const width    = card.offsetWidth;

        // Centrer : milieu du groupe - moitié popup
        const POPUP_ALIGN_OFFSET = 62;
        let left = rect.left + (rect.width / 2) - (width / 2) + POPUP_ALIGN_OFFSET;

        // Ne pas sortir de l'écran
        if (left < margin) left = margin;
        if (left + width > window.innerWidth - margin) {
            left = window.innerWidth - width - margin;
        }

        popup.style.top  = `${rect.bottom + margin + 15}px`;
        popup.style.left = `${left}px`;

        popup.classList.add('is-open');
    }

    function togglePopup() {
        popup.classList.contains('is-open')
            ? closePopup()
            : openPopup();
    }

    // Ouvrir / fermer en cliquant sur le bouton
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopup();
    });

    // Boutons internes
    closeButtons.forEach(btn =>
        btn.addEventListener('click', closePopup)
    );

    // Fermer en cliquant dehors
    document.addEventListener('click', (e) => {

        // Ne pas fermer popup route pendant un tracé
        if (state.tool === 'path' && popupAttr === 'route') return;

        if (
            popup.classList.contains('is-open') &&
            !popup.contains(e.target) &&
            !trigger.contains(e.target)
        ) {
            closePopup();
        }
    });

    // Fermer avec ESC
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        // ESC termine la route
        if (popupAttr === 'route' && state.tool === 'path') {
            finalizeCurrentPath();
            setTool('pan');
            showToast(GDMMLang.t('toast.PathFinished'));
        }
        closePopup();
    });

}


//TOGGLE SIDE BAR


// Init
setupPopup('#btn-new-marker', 'marker');
setupPopup('#btn-new-route',  'route');

  Object.assign(window.UiCore, {
    ensurePathsArray,refreshProfilesUI,renderList,renderMarkers,
    renderRoutesPanel,showToast,updateSaveIndicator,resolveSizeKey,setTool,ensureMapLoadedForProfile
  });

})();
