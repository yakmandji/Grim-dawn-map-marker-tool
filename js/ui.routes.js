// ui.routes.js
// Module de gestion des TRAJETS (Path Mode)

(function () {
  const core = window.GDMMCore || {};
  const state = core.state || {};
  const currentProfile = core.currentProfile || function () { return null; };
  const updateSaveIndicator = core.updateSaveIndicator || function () {};
  const saveUserDataToLocal = core.saveUserDataToLocal || function () {};

  // --- État interne du mode "Path" ---
  let pathMode = {
    active: false,
    current: null,
  };

  // Ligne SVG de prévisualisation
  let pathPreviewLine = null;

  // Helper pour que d'autres modules puissent lire l'état courant
  function getPathMode() {
    return pathMode;
  }

  // --- Efface la prévisualisation de la route en cours ---
  function clearPathPreview() {
    const svg = document.getElementById('pathLayer');
    if (pathPreviewLine && svg && pathPreviewLine.parentNode === svg) {
      svg.removeChild(pathPreviewLine);
    }
    pathPreviewLine = null;
  }

  // --- Met à jour la prévisualisation de la route --------------------------
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
    const width = pathMode.current.width || 3;
    pathPreviewLine.setAttribute('x1', x1);
    pathPreviewLine.setAttribute('y1', y1);
    pathPreviewLine.setAttribute('x2', x2);
    pathPreviewLine.setAttribute('y2', y2);
    pathPreviewLine.setAttribute('stroke', color);
    pathPreviewLine.setAttribute('stroke-width', width);
    pathPreviewLine.setAttribute('opacity', 0.6);
    pathPreviewLine.setAttribute('vector-effect', 'non-scaling-stroke');
  }
/*  END ----------------------------------------------------------------------*/

/*ROUTE POPUP*/
let activeRouteMenu = null;
let activeRouteBtn = null;

function getRouteSingletonMenu() {
  const menus = Array.from(document.querySelectorAll('.route-list-menu'));
  if (!menus.length) return null;

  const keep = menus[0];
  for (let i = 1; i < menus.length; i++) menus[i].remove();
  return keep;
}

function closeRouteListMenu() {
  if (activeRouteMenu) activeRouteMenu.classList.remove('is-open');
  if (activeRouteBtn) activeRouteBtn.classList.remove('is-open');
  activeRouteMenu = null;
  activeRouteBtn = null;
}

function openRouteListMenu(btnEl) {
  const menu = getRouteSingletonMenu();
  if (!menu || !btnEl) return;

  // Toggle si même bouton
  if (activeRouteBtn === btnEl && menu.classList.contains('is-open')) {
    closeRouteListMenu();
    return;
  }

  // Si un autre bouton était actif -> ferme avant
  if (activeRouteBtn && activeRouteBtn !== btnEl) closeRouteListMenu();

  activeRouteMenu = menu;
  activeRouteBtn = btnEl;

  // Stocker l'id route depuis la row
  const row = btnEl.closest('[data-pid]');
  menu.dataset.pid = row?.dataset.pid || '';

  // Toujours dans <body> (évite clipping)
  if (menu.parentElement !== document.body) {
    document.body.appendChild(menu);
  }

  const r = btnEl.getBoundingClientRect();

  menu.style.position = 'fixed';
  menu.style.zIndex = '9999';

  let left = r.right + 8;
  let top  = r.top - 2;

  const approxMenuW = menu.offsetWidth || 170;
  if (left + approxMenuW > window.innerWidth - 8) {
    left = r.left - approxMenuW - 8;
  }

  const approxMenuH = menu.offsetHeight || 140;
  if (top + approxMenuH > window.innerHeight - 8) {
    top = window.innerHeight - approxMenuH - 8;
  }
  if (top < 8) top = 8;

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top  = `${Math.round(top)}px`;

  menu.classList.add('is-open');
  btnEl.classList.add('is-open');
}

function initRouteSubMenus() {
  // (optionnel mais recommandé) éviter double init si jamais
  if (window.__gdmmRoutesSubMenuInit) return;
  window.__gdmmRoutesSubMenuInit = true;

  // 1) Empêcher blur au clic sur ...
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.route-sub-menu');
    if (!btn) return;
    e.preventDefault();
  }, true);

  // 2) Toggle / actions / close
  document.addEventListener('click', async (e) => {
    const menuEl = e.target.closest('.route-list-menu');
    const dotsBtn = e.target.closest('.route-sub-menu');

    // A) Clic sur une action du menu
    const actionBtn = e.target.closest('.route-list-menu [data-route-action]');
    if (actionBtn) {
      e.preventDefault();
      e.stopPropagation();

      // IMPORTANT: récupérer pid AVANT de fermer
      const menu = getRouteSingletonMenu();
      const pid = menu?.dataset?.pid;
      const action = actionBtn.dataset.routeAction;

      // Ferme tout de suite (UX)
      closeRouteListMenu();

      if (!pid || !action) return;

      // retrouve la route
      const p = currentProfile();
      const route = p?.paths?.find(x => String(x.id) === String(pid));
      if (!route) return;

      switch (action) {
        case 'delete':
          deleteRoute(pid);
          break;

        case 'center':
          centerRouteOnMap(route);
          break;

        case 'save':
          if (typeof saveUserDataToLocal === 'function') saveUserDataToLocal();
          if (typeof updateSaveIndicator === 'function') updateSaveIndicator(true);
          break;

          case 'link': {
            if (!window.GDMMShare?.createLink) return;

            const round = v => Math.round((v || 0) * 10) / 10;

            const compactRoute = {
              i: route.id,
              n: route.name || '',
              c: route.color || '#ffcc00',
              w: route.width || 4,
              o: typeof route.opacity === 'number' ? route.opacity : 0.85,
              pts: (route.points || []).map(pt => [round(pt.xp), round(pt.yp)]),
            };

            const payload = {
              v: '3',
              map: state.active,
              r: [compactRoute],
              m: [],
              notes: null,
            };

            await window.GDMMShare.createLink(payload);

            if (typeof showToast === 'function') {
              const msg =
                (window.GDMMLang?.t && GDMMLang.t('toast.ShareUrlCopied')) ||
                'Link copied ✅';
              showToast(msg, 'success', 3800);
            }
            break;
          }

      }

      return;
    }

    // B) Clic sur "..." => toggle
    if (dotsBtn) {
      e.stopPropagation();
      openRouteListMenu(dotsBtn);
      return;
    }

    // C) Clic dans le menu (mais pas sur un bouton action) => ne rien faire
    if (menuEl) return;

    // D) Clic ailleurs => ferme
    closeRouteListMenu();
  });

  // 3) ESC pour fermer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRouteListMenu();
  });

  // 4) resize/scroll -> ferme
  window.addEventListener('resize', closeRouteListMenu);
  document.addEventListener('scroll', closeRouteListMenu, true);
}
/*------------------------------ROUTE POPUP END*/


initRouteSubMenus();

  function ensurePathsArray() {
    const p = currentProfile();
    if (!p) return null;
    if (!p.paths) p.paths = [];
    return p.paths;
  }

  // Retourne la liste des routes du profil courant
  function listRoutes() {
    const p = currentProfile();
    if (!p || !Array.isArray(p.paths)) return [];
    return p.paths;
  }

  // --- Crée une nouvelle route vide ---
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
      color: '#26a68c',
      width: 3,
    };
    paths.push(path);
    pathMode.active = true;
    pathMode.current = path;

    const badge = document.getElementById('currentPathName');
    if (badge) {
      badge.style.display = 'inline-block';
      // Texte : "Trajet en cours…" (clé déjà dans GDMMLang)
      if (window.GDMMLang && typeof GDMMLang.t === 'function') {
        badge.textContent = GDMMLang.t('toast.PathInProgress');
      } else {
        badge.textContent = 'Path in progress…';
      }
    }
    updateFinishButtonPulse();
    return path;
  }
/* END --------------------------------------------------------------*/

// Ajoute un point à la route en cours --------------------------------
  function addPathPoint(xp, yp) {
    let path = pathMode.current;
    if (!path) {
      path = startNewPath();
    }
    if (!path.points) path.points = [];
    path.points.push({ xp, yp });
    clearPathPreview();

    // Redessine la carte (markers + routes)
    if (window.UiCore && typeof window.UiCore.renderMarkers === 'function') {
      window.UiCore.renderMarkers();
    }

    updateSaveIndicator(false);
    saveUserDataToLocal();
  }
/* END ------------------------------------------------------------------*/

// --- Termine la route en cours -------------------------------------
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

    // Si moins de 2 points → on supprime la route inutile
    if (p && p.paths && pathMode.current.points.length < 2) {
      p.paths = p.paths.filter((r) => r.id !== pathMode.current.id);
    }

    // Reset mode path
    pathMode.current = null;
    pathMode.active = false;

    // Badge caché
    const badge = document.getElementById('currentPathName');
    if (badge) {
      badge.style.display = 'none';
      badge.textContent = '';
    }

    clearPathPreview();

    if (window.UiCore && typeof window.UiCore.renderMarkers === 'function') {
      window.UiCore.renderMarkers();
    }

    saveUserDataToLocal();
    updateFinishButtonPulse();
    renderRoutesPanel();
  }
/*  END----------------------------------------------------------------------*/

  
  // --- Met à jour l’animation du bouton "Finish Path" ---
    function updateFinishButtonPulse() {
      const btn = document.getElementById('toolFinishPath');
      if (!btn) return;
      const isCurrentPath =
        pathMode.active && pathMode.current && state.tool === 'path';
      btn.classList.toggle('pulse', !!isCurrentPath);
    }

  function updateRoute(id, patch) {
    const p = currentProfile();
    if (!p || !Array.isArray(p.paths)) return;

    const r = p.paths.find(rt => rt.id === id);
    if (!r) return;

    Object.assign(r, patch);

    updateSaveIndicator(false);
    saveUserDataToLocal();

    // Met à jour le rendu de la map sans rerendre le panneau
    if (window.UiCore?.renderMarkers) {
      window.UiCore.renderMarkers({ skipRoutesPanel: true });
    }
  }

  function deleteRoute(id) {
    const p = currentProfile();
    if (!p || !Array.isArray(p.paths)) return;

    const idx = p.paths.findIndex(r => r.id === id);
    if (idx === -1) return;

    p.paths.splice(idx, 1);

    saveUserDataToLocal();
    updateSaveIndicator(false);

    // Redessine la map mais pas le panel (évite double rendu)
    if (window.UiCore?.renderMarkers) {
      window.UiCore.renderMarkers({ skipRoutesPanel: true });
    }

    // Redessine le panneau une fois
    renderRoutesPanel();

    if (window.showToast && window.GDMMLang?.t) {
      showToast(GDMMLang.t('toast.RouteDeleted'));
    }
  }

  function centerRouteOnMap(path) {
    if (!path || !Array.isArray(path.points) || !path.points.length) return;

    const xs = path.points.map(pt => pt.xp);
    const ys = path.points.map(pt => pt.yp);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const span = Math.max(spanX, spanY);

    // Zoom un peu intelligent selon la taille de la route
    let zoom;
    if (span > 40) zoom = 0.6;
    else if (span > 20) zoom = 0.8;
    else if (span > 10) zoom = 1.0;
    else zoom = 1.2;

    // Utilisation de smoothCenterOn ou centerOn pour effectuer le centrage fluide
    if (typeof window.smoothCenterOn === 'function') {
      window.smoothCenterOn(cx, cy, zoom);  // Centrage fluide avec zoom
    } else if (typeof window.centerOn === 'function') {
      window.centerOn(cx, cy, zoom);  // Fallback vers centerOn si smoothCenterOn n'est pas disponible
    }
  }


  // --- Template helper (Routes list) ---------------------------------
  function getRouteItemTemplate() {
    const tpl = document.getElementById('tplRouteItem');
    if (tpl && tpl.content) return tpl;

    // Fallback sécurité : si le template n'existe pas, on recrée un <template> en JS
    // (ça évite de casser si quelqu’un oublie de merge index.html)
    const fallback = document.createElement('template');
    fallback.id = 'tplRouteItem';
    fallback.innerHTML = `
      <div class="listItem route-item" data-route-item>
        <input data-route-color type="color" class="routeColor" />
        <input data-route-name type="text" class="markerLabel" placeholder="Route name" />

        <button type="button" class="marker-save small" data-route-save data-i18n-title="ui.SaveTitle" title="Save">
          <img src="img/save-icon.svg" width="13">
        </button>

        <button type="button" class="marker-center small" data-route-center data-i18n-title="ui.CenterOnMap" title="Center on map">
          <img src="img/center-icon.svg" width="13">
        </button>

        <button type="button" class="link-for-route small" data-route-link data-i18n-title="ui.linkRoute" title="Link">
          <img src="img/link.svg" width="15" alt="Link">
        </button>

        <button type="button" class="danger small" data-route-delete data-i18n-title="ui.DeleteButton" title="Delete">
          <img src="img/bin-icon.svg" width="13">
        </button>
      </div>
    `.trim();

    document.body.appendChild(fallback);
    return fallback;
  }

  function buildRouteRowFromTemplate(path) {
    const tpl = getRouteItemTemplate();
    const node = tpl.content.firstElementChild.cloneNode(true);

    node.dataset.pid = path.id;

    const color = node.querySelector('[data-route-color]');
    const nameInput = node.querySelector('[data-route-name]');
    const saveBtn = node.querySelector('[data-route-save]');
    const centerBtn = node.querySelector('[data-route-center]');
    const linkBtn = node.querySelector('[data-route-link]');
    const deleteBtn = node.querySelector('[data-route-delete]');

    // --- Couleur ---
    if (color) {
      color.value = path.color || '#ffcc00';

      let colorTimer = null;
      color.addEventListener('input', (e) => {
        const val = e.target.value;
        clearTimeout(colorTimer);
        colorTimer = setTimeout(() => {
          updateRoute(path.id, { color: val });
          if (window.UiCore?.renderMarkers) {
            window.UiCore.renderMarkers({ skipRoutesPanel: true });
          }
        }, 160);
      });
    }

    // --- Nom + save-if-changed (même logique qu'avant) ---
    const saveNameIfChanged = () => {
      const newName = (nameInput?.value || '').trim();
      const oldName = path.name || '';
      if (newName === oldName) return;

      updateRoute(path.id, { name: newName });

      if (typeof showToast === 'function' && window.GDMMLang?.t) {
        showToast(GDMMLang.t('toast.RouteNameSaved'));
      }
    };

    if (nameInput) {
      nameInput.value = path.name || '';
      nameInput.classList.add('markerLabel'); // au cas où (sécurité)
      nameInput.placeholder =
        (window.GDMMLang?.t && GDMMLang.t('ui.PathNamePlaceholder')) || 'Route name';

      nameInput.addEventListener('blur', saveNameIfChanged);
    }


    // --- DEV: double-clic sur le nom => copie les points de la route (format overlayPoly) ---
      async function __gdmmCopyToClipboard(text) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
          } catch (_) {
            return false;
          }
        }
      }

      if (nameInput && window.GDMMCore?.isDevUnlocked?.()) {
        nameInput.title = (nameInput.title ? nameInput.title + '\n' : '') + 'DEV: double-click to copy overlay points';

        nameInput.addEventListener('dblclick', async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const round = v => Math.round((v || 0) * 10) / 10; // 1 décimale
          const pts = (path.points || []).map(pt => [round(pt.xp), round(pt.yp)]);

          // prêt à coller dans ui.region.js
          const text = `overlayPoly: ${JSON.stringify(pts)}`;

          const ok = await __gdmmCopyToClipboard(text);

          if (typeof showToast === 'function') {
            showToast(ok ? 'Overlay copied ✅' : 'Copy failed ❌', ok ? 'success' : 'error', 2500);
          }
        });
      }



    // --- Save button ---
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveNameIfChanged();
        nameInput?.blur();
      });
    }

    // --- Center button ---
    if (centerBtn) {
      centerBtn.addEventListener('click', () => centerRouteOnMap(path));
    }

    // --- Link button (identique à l’existant) ---
    if (linkBtn) {
      linkBtn.addEventListener('click', async () => {
        if (!window.GDMMShare?.createLink) return;

        const round = v => Math.round((v || 0) * 10) / 10;

        const compactRoute = {
          i: path.id,
          n: path.name || '',
          c: path.color || '#ffcc00',
          w: path.width || 4,
          o: typeof path.opacity === 'number' ? path.opacity : 0.85,
          pts: (path.points || []).map(pt => [round(pt.xp), round(pt.yp)]),
        };

        const payload = {
          v: '3',
          map: state.active,
          r: [compactRoute],
          m: [],
          notes: null,
        };

        await window.GDMMShare.createLink(payload);

        if (typeof showToast === 'function') {
          const msg =
            (window.GDMMLang?.t && GDMMLang.t('toast.ShareUrlCopied')) ||
            'Link copied ✅';
          showToast(msg, 'success', 3800);
        }
      });
    }

    // --- Delete button ---
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteRoute(path.id));
    }

    return node;
  }


  function renderRoutesPanel() {
    const host = document.getElementById('routesList');
    if (!host) return;

    const p = currentProfile();
    if (!p) return;

    const paths = Array.isArray(p.paths) ? p.paths : [];
    if (!Array.isArray(p.paths)) {
      p.paths = paths;
    }

    host.innerHTML = '';

    // Compteur
    const countEl = document.getElementById('routesCount');
    if (countEl) countEl.textContent = paths.length;

    for (const path of paths) {
      const row = buildRouteRowFromTemplate(path);
      host.appendChild(row);
    }

    // i18n sur les titres / tooltips
    if (window.GDMMLang?.applyLang && window.GDMMLang?.getLang) {
      GDMMLang.applyLang(GDMMLang.getLang());
    }
  }



  window.UiRoutes = {
    getPathMode,
    clearPathPreview,
    updatePathPreview,
    ensurePathsArray,
    startNewPath,
    addPathPoint,
    finalizeCurrentPath,
    updateFinishButtonPulse,
    listRoutes,
    updateRoute,
    deleteRoute,
    renderRoutesPanel,
    centerRouteOnMap,
  };

})();
