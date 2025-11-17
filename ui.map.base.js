// ui.core.base.js
(function () {
  const {
    state,
    DEV_MODE,
    clamp,
    iconFor,
    isColorAllowed,
    currentProfile,
    markAsChanged,
    updateSaveIndicator,
    setActiveProfile,
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
    ensureProfile,
  } = window.GDMMCore;

  // --- Helpers DOM de base ---
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // --- Refs DOM ---
  const viewport = $('#mapViewport');
  const inner    = $('#mapInner');
  const mapImg   = $('#mapImg');

  // --- Loader overlay ---
  const loaderOverlay = document.getElementById('mapLoader');
  const loaderMessage = loaderOverlay?.querySelector('.loader-message');

  function showLoader(msg = 'Loading map…') {
    if (!loaderOverlay) return;
    loaderMessage.textContent = msg;
    loaderOverlay.classList.remove('hidden');
  }

  function hideLoader() {
    if (!loaderOverlay) return;
    loaderOverlay.classList.add('hidden');
  }

  // --- Chargement de la map ---
  let loadToken = 0;

  function setMapSrc(src) {
    if (!state.active) {
      alert('You need first to create profile');
      return;
    }
    const token = ++loadToken;
    mapImg.dataset.token = String(token);
    if (src instanceof File) src = URL.createObjectURL(src);
    mapImg.src = src;

    const p = currentProfile();
    if (p && p.map) {
      p.map.sessionSrc = mapImg.src;
    }

    showLoader('Loading map…');
  }

  mapImg.addEventListener('load', () => {
    if (Number(mapImg.dataset.token || 0) !== loadToken) return;

    state.mapNatural = { w: mapImg.naturalWidth, h: mapImg.naturalHeight };
    state.mapReady   = state.mapNatural.w > 0 && state.mapNatural.h > 0;

    const vp = viewport;
    if (vp && state.mapNatural.w && state.mapNatural.h) {
      const key = `${state.mapNatural.w}x${state.mapNatural.h}`;
      vp.classList.remove('cairnmap', 'malmouthmap', 'korvanmap');

      if (key === '8948x9133') {
        vp.classList.add('cairnmap');
      } else if (key === '5142x3574') {
        vp.classList.add('malmouthmap');
      } else if (key === '5427x5553') {
        vp.classList.add('korvanmap');
      }
    }

    const p = currentProfile();
    if (p && p.map) {
      p.map.width  = state.mapNatural.w;
      p.map.height = state.mapNatural.h;
      p.map.sessionSrc = mapImg.src;
    }
    
    const skipRestore = !!state.skipViewRestoreOnce;

    if (skipRestore) {
    } else if (p && p.view && typeof p.view.scale === 'number') {
      // Cas normal : vue mémorisée pour ce profil
      state.view.scale = p.view.scale;
      state.view.x     = p.view.x ?? 0;
      state.view.y     = p.view.y ?? 0;
      applyView();
    } else {
      fitToScreen();
    }

    if (skipRestore) {
      state.skipViewRestoreOnce = false;
    }

    const ui = window.UiCore;
    if (ui) {
      if (typeof ui.renderList === 'function') ui.renderList();
      if (typeof ui.renderMarkers === 'function') ui.renderMarkers();
      if (typeof ui.renderRoutesPanel === 'function') ui.renderRoutesPanel();
    }

    if (typeof window.renderDungeonOverlays === 'function') {
      window.renderDungeonOverlays();
    }

    hideLoader();
  });

  mapImg.addEventListener('error', () => {
    state.mapReady = false;
    alert('Failed to load image');
    hideLoader();
  });

  // --- Helpers de vue (zoom / position) ---
  function fitToScreen() {
    const vb = viewport.getBoundingClientRect();
    const iw = state.mapNatural.w || 1;
    const ih = state.mapNatural.h || 1;
    const s = Math.min(vb.width / iw, vb.height / ih);

    // Tu utilisais déjà une valeur fixe, je la garde telle quelle
    state.view.scale = 0.18;
    state.view.x = (vb.width  - iw * state.view.scale) / 2;
    state.view.y = (vb.height - ih * state.view.scale) / 2;

    applyView();
  }

  function applyView() {
    const { x, y, scale } = state.view;
    inner.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const MIN_RATIO = 0.82;
    const mk = (scale < MIN_RATIO) ? (MIN_RATIO / scale) : 1;
    inner.style.setProperty('--mk', mk);

    const zr = $('#zoomReadout');
    if (zr) zr.textContent = Math.round(scale * 100) + '%';
  }

  function viewToPct(cx, cy) {
    const vb = viewport.getBoundingClientRect();
    const { x, y, scale } = state.view;
    const mx = (cx - vb.left - x) / scale;
    const my = (cy - vb.top  - y) / scale;

    return {
      xp: (mx / (state.mapNatural.w || 1)) * 100,
      yp: (my / (state.mapNatural.h || 1)) * 100,
    };
  }

  function pctToPx(xp, yp) {
    return {
      x: (xp / 100) * (state.mapNatural.w || 1),
      y: (yp / 100) * (state.mapNatural.h || 1),
    };
  }

  // --- Exposition à l'extérieur ---
  window.UiCore = Object.assign(window.UiCore || {}, {
    $, $$,
    viewport,
    inner,
    mapImg,
    showLoader,
    hideLoader,
    fitToScreen,
    applyView,
    viewToPct,
    pctToPx,
    setMapSrc,
  });
})();
