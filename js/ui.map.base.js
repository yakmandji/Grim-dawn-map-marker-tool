// ui.core.base.js
(function () {
  const {
    state,
    clamp,
    iconFor,
    currentProfile,
    markAsChanged,
    updateSaveIndicator,
    setActiveProfile,
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

  /*Map decoration*/

  window.DECOR_ICONS_CAIRN = [
    { id:'rashalga', w: 110, h: 80, img: 'img/qol/rashalga-queen.png', xp: 15.35, yp: 30.07, isDungeon: true },
    { id:'attendant', w: 60, h: 60, img: 'img/qol/attendant.png?1.0', xp: 87.77, yp: 63.4, isDungeon: true },
    { id:'sentinel', w: 95, h: 115, img: 'img/qol/sentinel.png?1.0', xp: 87, yp: 63.69, isDungeon: true },
    { id:'hidden-donjon1', w: 70, h: 70, img: 'img/qol/hidden-donjon1.png', xp: 78.47, yp: 62.03,  anchor: 'center' },
    { id:'warden-krieg', w: 110, h: 140, img: 'img/qol/warden-krieg.png', xp: 58.60, yp: 45.82, isDungeon: true },
    { id:'Bastion-order', w: 55, h: 62, img: 'img/qol/bastion-order.png', xp: 31.85, yp: 58.64,  anchor: 'center' },
    { id:'kymon-sanctuary', w: 55, h: 62, img: 'img/qol/kymon-sanctuary.png', xp: 34.34, yp: 57.40,  anchor: 'center' },
    { id:'stonerend-quarry', w: 64, h: 70, img: 'img/qol/stonerend-quarry.png', xp: 32.8, yp: 49.55,  anchor: 'center' },
    { id:'bloodfeast', w: 140, h: 100, img: 'img/qol/bloodfeast.png?1.0', xp: 48.11, yp: 61.1, isDungeon: true },
    { id:'banegargoth', w: 115, h: 138, img: 'img/qol/bane-gargoth.png', xp: 29.00, yp: 29.90, isDungeon: true },
    { id:'lucius', w: 100, h: 110, img: 'img/qol/lucius.png', xp: 14.7, yp: 15, isDungeon: true },
    { id:'loghorrean', w: 140, h: 110, img: 'img/qol/loghorrean.png', xp: 14.11, yp: 4.51, isDungeon: true },
    { id:'thalonis.png', w: 90, h: 130, img: 'img/qol/thalonis.png', xp: 10.70, yp: 7.25, isDungeon: true },
    { id:'sharzul.png', w: 140, h: 170, img: 'img/qol/sharzul.png', xp: 52.30, yp: 1, isDungeon: true },
    { id:'anasteria', w: 150, h: 90, img: 'img/qol/anasteria.png', xp: 8.5, yp: 18.43, isDungeon: true },
    { id:'igor-eternal', w: 100, h: 130, img: 'img/qol/igor-eternal.png', xp: 44.60, yp: 97.91, isDungeon: true },
    { id:'kaliska', w: 120, h: 90, img: 'img/qol/kaliska.png', xp: 79.35, yp: 64.20,  anchor: 'center' },
    { id:'alkamos', w: 100, h: 140, img: 'img/qol/alkamos.png', xp: 54.19, yp: 96.72, isDungeon: true },
    { id:'ravna', w: 140, h: 130, img: 'img/qol/ravna.png', xp: 21.8, yp: 64.15, isDungeon: true },
    { id:'kilrian', w: 110, h: 145, img: 'img/qol/kilrian.png', xp: 50.49, yp: 67.9, isDungeon: true },
    { id:'necropole', w: 130, h: 98, img: 'img/qol/necropole.png?1.1', xp: 22.36, yp: 16.1,  anchor: 'center' },
    { id:'plagius', w: 110, h: 125, img: 'img/qol/plagius.png', xp: 35.63, yp: 10.81, isDungeon: true },
    { id:'necropole-door', w: 80, h: 80, img: 'img/qol/necropole-door.png', xp: 23.22, yp: 4.54,  anchor: 'center' },
    { id:'darius', w: 100, h: 150, img: 'img/qol/darius.png', xp: 59.38, yp: 69.94, isDungeon: true },
    { id:'gargabol', w: 130, h: 190, img: 'img/qol/gargabol.png', xp: 98.27, yp: 58.4, isDungeon: true },
    { id:'manticore', w: 180, h: 120, img: 'img/qol/manticore.png', xp: 92.42, yp: 55, isDungeon: true },
    { id:'ekketzul', w: 190, h: 245, img: 'img/qol/ekketzul.png', xp: 73.66, yp: 19.33, isDungeon: true },
    { id:'naxen', w: 130, h: 90, img: 'img/qol/naxen.png', xp: 99.84, yp: 26.93, isDungeon: true },
    { id:'namadea', w: 140, h: 130, img: 'img/qol/namadea.png', xp: 79.10, yp: 28.1, isDungeon: true },
    { id:'voldrak', w: 130, h: 130, img: 'img/qol/voldrak.png', xp: 26.47, yp: 85.68, isDungeon: true },
    { id:'ragnadar', w: 130, h: 130, img: 'img/qol/ragnadar.png', xp: 22.45, yp: 58.42, isDungeon: true },
    { id:'balokanatu', w: 170, h: 140, img: 'img/qol/balokanatu.png', xp: 35.52, yp: 4.6, isDungeon: true },
    { id:'lagothak', w: 100, h: 190, img: 'img/qol/lagothak.png', xp: 42.55, yp: -1.00, isDungeon: true },
    { id:'harvoul', w: 70, h: 70, img: 'img/qol/harvoul.png', xp: 3.65, yp: 37.06, isDungeon: true },
    { id:'sharanatu', w: 80, h: 160, img: 'img/qol/lagothak.png', xp: 4.14, yp: 36.63, isDungeon: true },

    { id:'noveria', w: 80, h: 90, img: 'img/qol/noveria.png', xp: 30.2, yp: 60.42, isDungeon: true },
    { id:'kymon-father', w: 90, h: 85, img: 'img/qol/kymon-father.png', xp: 39.26, yp: 56.98, isDungeon: true },

    { id:'karroz', w: 115, h: 115, img: 'img/qol/karroz.png', xp: 27.24, yp: 41.14, isDungeon: true },
    { id:'rolderathis', w: 90, h: 120, img: 'img/qol/rolderathis.png', xp: 64.49, yp: 72.94, isDungeon: true },
    { id:'salazar', w: 90, h: 140, img: 'img/qol/salazar.png', xp: 78.70, yp: 74.32, isDungeon: true },
    { id:'carraxus', w: 155, h: 110, img: 'img/qol/carraxus.png', xp: 76.96, yp: 42.46, isDungeon: true },
    { id:'sylvarria', w: 95, h: 78, img: 'img/qol/sylvarria.png', xp: 95.23, yp: 36.05, isDungeon: true },
    { id:'ugdall', w: 75, h: 120, img: 'img/qol/ugdall.png', xp: 93.37, yp: 33.8, isDungeon: true },
    { id:'larria', w: 145, h: 115, img: 'img/qol/larria.png', xp: 51.43, yp: 73.65, isDungeon: true },



  ];

  window.DECOR_ICONS_MALMOUTH = [
    { id:'nimia', w: 120, h: 160, img: 'img/qol/nimia.png', xp: 79.91, yp: 66.4, isDungeon: true },
    { id:'crown_hill_door', w: 125, h: 125, img: 'img/qol/crown-hill-door.png', xp: 39.8, yp: 19, },
    { id:'infestation_enter', w: 170, h: 155, img: 'img/qol/infestation-enter.png', xp: 51, yp: 2.7 },
    { id:'fleshwork-qol', w: 140, h: 110, img: 'img/qol/fleshwork-qol.png', xp: 16.05, yp: 2.82, isDungeon: true },

  ]


   window.DECOR_ICONS_KORVAN = [
    { id:'koovak', w: 200, h: 220, img: 'img/qol/koovak.png', xp: 67.49, yp: 0.55, isDungeon: true },

   ]

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

  function showLoader(msg) {
    if (!loaderOverlay) return;

    const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
      ? GDMMLang.t.bind(GDMMLang)
      : null;

    const finalMsg = msg || (t ? t('toast.LoadingMap') : 'Loading map…');

    loaderMessage.textContent = finalMsg;
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

    showLoader();
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
        // On consomme le flag "une fois"
        state.skipViewRestoreOnce = false;

        // Si une nav inter-map a préparé une vue, on l'applique tout de suite
        const cfg = window._gdmmPendingNavCenter;
        if (cfg) {
          window._gdmmPendingNavCenter = null;

          if (typeof window.centerOn === 'function') {
            // Utilise le centerOn standard (maintenant que mapReady est true)
            window.centerOn(cfg.xp, cfg.yp, cfg.scale);
          } else {
            // Fallback au cas où
            const vb = viewport.getBoundingClientRect();
            const pt = pctToPx(cfg.xp, cfg.yp);

            const scale = clamp(cfg.scale || state.view.scale, 0.30, 1.50);
            state.view.scale = scale;

            state.view.x = vb.width  / 2 - pt.x * scale;
            state.view.y = vb.height / 2 - pt.y * scale;

            applyView();
          }
        }
      } else if (p && p.view && typeof p.view.scale === 'number') {
        // Cas normal : vue mémorisée pour ce profil
        state.view.scale = p.view.scale;
        state.view.x     = p.view.x ?? 0;
        state.view.y     = p.view.y ?? 0;
        applyView();
      } else {
        setDefaultViewForProfile();
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

    if (window.UiCore && typeof window.UiCore.renderDecorIcons === 'function') {
      window.UiCore.renderDecorIcons();
    }


    //Appeler la minimap au changement
    if (window.UiMiniMap && typeof window.UiMiniMap.force === 'function') {
      window.UiMiniMap.force();   // force un redraw immédiat avec la nouvelle map
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

    // Scale that fits the whole map
    let s = Math.min(vb.width / iw, vb.height / ih);

    // Add a tiny padding so the map doesn't touch edges
    s *= 0.98;

    // Clamp to the same "normal navigation" limits
    s = Math.max(0.30, Math.min(1.50, s));

    state.view.scale = s;
    state.view.x = (vb.width  - iw * s) / 2;
    state.view.y = (vb.height - ih * s) / 2;

    applyView();
  }


    function setDefaultViewForProfile() {
      const p  = currentProfile && currentProfile();
      const vp = viewport;
      const iw = state.mapNatural.w || 1;
      const ih = state.mapNatural.h || 1;

      if (!vp || !iw || !ih) {
        fitToScreen();
        return;
      }

      // Nom du profil courant (Cairn / Malmouth / Korvan Basin…)
      const name = p?.name || state.active;

      // Coords par défaut (en % de la map) + zoom "confort"
      let xp = null;
      let yp = null;
      let scale = 0.8; // Ajustement

      if (name === 'Cairn') {
        // Devil's Crossing
        xp = 62.2;
        yp = 88.85;
        scale = 0.8;
      } else if (name === 'Malmouth') {
        // Entrée de Malmouth
        xp = 66.52;
        yp = 87.07;
        scale = 0.7;
      } else if (name === 'Korvan Basin') {
        // Conclave of the Three
        xp = 20.83;
        yp = 93.01;
        scale = 0.7;
      }
      // Si on n'a rien de spécial pour ce profil → fallback
      if (xp == null || yp == null) {
        fitToScreen();
        return;
      }

      const vb = viewport.getBoundingClientRect();
      const mx = (xp / 100) * iw;
      const my = (yp / 100) * ih;

      state.view.scale = scale;
      state.view.x = vb.width  / 2 - mx * scale;
      state.view.y = vb.height / 2 - my * scale;

      applyView();
    }


  let lastZoomPct = null;

  function applyView() {
    const { x, y, scale } = state.view;
    inner.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const MIN_RATIO = 0.82;
    const mk = (scale < MIN_RATIO) ? (MIN_RATIO / scale) : 1;
    inner.style.setProperty('--mk', mk);

    const zr = $('#zoomReadout');
      if (zr) {
         const pct = Math.round(scale * 100);
        if (pct !== lastZoomPct) {
            zr.textContent = pct + '%';
            lastZoomPct = pct;
        }
      }

    // Notifie la minimap qu'il y a eu un changement de vue
    if (window.UiMiniMap && typeof window.UiMiniMap.update === 'function') {
      window.UiMiniMap.update();
    }
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


/*-------ICON DE DECORS------------------------*/
  function renderDecorIcons() {
    if (!state.mapReady || !inner) return;

    // 1) Nettoyage des anciens décors
    inner.querySelectorAll('img[data-decor="1"]').forEach(el => el.remove());

    // 2) Choix de la map active (mobile)
    let list = [];

    const ui = window.UiCore || {};
    const MAP_KEYS = {
      '8948x9133': 'cairn',
      '5142x3574': 'malmouth',
      '5427x5553': 'korvan',
    };

    let key = null;
    if (typeof ui.resolveSizeKey === 'function') {
      key = ui.resolveSizeKey(MAP_KEYS);
    } else if (state.mapNatural?.w && state.mapNatural?.h) {
      key = `${state.mapNatural.w}x${state.mapNatural.h}`;
    }

    const which = key ? MAP_KEYS[key] : null;

    if (which === 'cairn') list = window.DECOR_ICONS_CAIRN || [];
    else if (which === 'malmouth') list = window.DECOR_ICONS_MALMOUTH || [];
    else if (which === 'korvan') list = window.DECOR_ICONS_KORVAN || [];

    // (optionnel) fallback ultime si jamais on n’a rien (évite “zéro décor”)
    if (!list.length && viewport.classList.contains('cairnmap')) list = window.DECOR_ICONS_CAIRN || [];
    if (!list.length && viewport.classList.contains('malmouthmap')) list = window.DECOR_ICONS_MALMOUTH || [];
    if (!list.length && viewport.classList.contains('korvanmap')) list = window.DECOR_ICONS_KORVAN || [];


    // 3) Ajout direct dans #mapInner
    list.forEach(d => {
      if (!d?.img) return;

      const pt = pctToPx(d.xp, d.yp);

      const img = document.createElement('img');
      img.src = d.img;
      img.alt = d.id || '';
      img.dataset.decor = '1';

      // classes
      img.classList.add('decor-icon');
      if (d.id) {
        img.classList.add('decor-' + d.id);
      }

      if (d.isDungeon) {
         img.classList.add('decor-dungeon');
      }

      img.style.position = 'absolute';
      img.style.left = pt.x + 'px';
      img.style.top  = pt.y + 'px';
      img.style.width  = (d.w || 24) + 'px';
      img.style.height = (d.h || 24) + 'px';
      img.style.pointerEvents = 'none';
      img.style.zIndex = '2';
      img.style.transform = 'translate(-50%, -50%)';

      inner.appendChild(img);
    });
  }

/*----------------------------------------END ICON DE DECORS-----------*/


function scrollToAndHighlight(el, {
  highlightClass = 'highlight',
  highlightDuration = 2200
} = {}) {
  if (!el) return;

  // Restart animation if already highlighted
  el.classList.remove(highlightClass);

  // Smooth scroll to element
  el.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  // Wait until scroll is finished before highlighting
  let lastTop = null;
  let stableFrames = 0;

  function check() {
    const rect = el.getBoundingClientRect();

    if (lastTop !== null && Math.abs(rect.top - lastTop) < 1) {
      stableFrames++;
      if (stableFrames >= 3) {
        el.classList.add(highlightClass);

        setTimeout(() => {
          el.classList.remove(highlightClass);
        }, highlightDuration);
        return;
      }
    } else {
      stableFrames = 0;
      lastTop = rect.top;
    }

    requestAnimationFrame(check);
  }

  requestAnimationFrame(check);
}



  // --- Exposition à l'extérieur ---
  window.UiCore = Object.assign(window.UiCore || {}, {
    $, $$,
    viewport,
    inner,
    renderDecorIcons,
    mapImg,
    showLoader,
    hideLoader,
    fitToScreen,
    applyView,
    viewToPct,
    pctToPx,
    setMapSrc,
    scrollToAndHighlight,
  });

  
})();