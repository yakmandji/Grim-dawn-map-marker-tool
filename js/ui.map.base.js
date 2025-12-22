// ui.core.base.js
(function () {
  const {
    state,
    DEV_MODE,
    clamp,
    iconFor,
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


  /*Map decoration*/

  window.DECOR_ICONS_CAIRN = [
    { id:'gardian-dreeg', w: 60, h: 40, img: 'img/qol/gardian-dreeg.png', xp: 67.84, yp: 83.50,  anchor: 'center' },
    { id:'gardian-solael', w: 60, h: 60, img: 'img/qol/gardian-solael.png', xp: 47.23, yp: 84.08,  anchor: 'center' },
    { id:'gardian-bysmael', w: 50, h: 50, img: 'img/qol/guardian-bysmiel.png', xp: 17.00, yp: 33.20,  anchor: 'center', isDungeon: true },
    { id:'rashalga', w: 90, h: 70, img: 'img/qol/rashalga-queen.png', xp: 15.87, yp: 31.11,  anchor: 'center', isDungeon: true },
    { id:'attendant', w: 50, h: 50, img: 'img/qol/attendant.png', xp: 87.37, yp: 62.58,  anchor: 'center', isDungeon: true },
    { id:'sentinel', w: 70, h: 70, img: 'img/qol/sentinel.png', xp: 87, yp: 63.24,  anchor: 'center', isDungeon: true },
    { id:'hidden-donjon1', w: 70, h: 70, img: 'img/qol/hidden-donjon1.png', xp: 78.47, yp: 62.03,  anchor: 'center' },
    { id:'coliseum', w: 70, h: 70, img: 'img/qol/coliseum.png', xp: 45.23, yp: 77.16,  anchor: 'center' },
    { id:'warden-krieg', w: 60, h: 80, img: 'img/qol/warden-krieg.png', xp: 58.52, yp: 45.09,  anchor: 'center', isDungeon: true },
    { id:'Bastion-order', w: 68, h: 75, img: 'img/qol/bastion-order.png', xp: 31.95, yp: 58.64,  anchor: 'center' },
    { id:'kymon-sanctuary', w: 70, h: 75, img: 'img/qol/kymon-sanctuary.png', xp: 34.34, yp: 57.40,  anchor: 'center' },
    { id:'stonerend-quarry', w: 64, h: 70, img: 'img/qol/stonerend-quarry.png', xp: 32.8, yp: 49.55,  anchor: 'center' },
    { id:'fort-ikon', w: 75, h: 83, img: 'img/qol/fort-ikon.png?1.0', xp: 15.10, yp: 21.52,  anchor: 'center' },
    { id:'devil-crossing', w: 65, h: 83, img: 'img/qol/devil-crossing.png', xp: 63.70, yp: 88.50,  anchor: 'center' },

    { id:'bloodfeast', w: 100, h: 70, img: 'img/qol/bloodfeast.png', xp: 45.11, yp: 60.80,  anchor: 'center', isDungeon: true },



  ];


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

            const scale = clamp(cfg.scale || state.view.scale, 0.25, 1.50);
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
    const s = Math.min(vb.width / iw, vb.height / ih);

    state.view.scale = 0.18;
    state.view.x = (vb.width  - iw * state.view.scale) / 2;
    state.view.y = (vb.height - ih * state.view.scale) / 2;

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

    // 2) Choix de la map active
    let list = [];
    if (viewport.classList.contains('cairnmap')) list = window.DECOR_ICONS_CAIRN || [];
    else if (viewport.classList.contains('malmouthmap')) list = window.DECOR_ICONS_MALMOUTH || [];
    else if (viewport.classList.contains('korvanmap')) list = window.DECOR_ICONS_KORVAN || [];

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

      switch (d.anchor) {
        case 'bottom': img.style.transform = 'translate(-50%, -100%)'; break;
        case 'top':    img.style.transform = 'translate(-50%, 0%)'; break;
        default:       img.style.transform = 'translate(-50%, -50%)';
      }

      inner.appendChild(img);
    });
  }

/*----------------------------------------END ICON DE DECORS-----------*/


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
  });

  
})();