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

    if (typeof window.centerOn === 'function') {
      window.centerOn(cx, cy, zoom);
    }
  }


  function renderRoutesPanel() {
    const host = document.getElementById('routesList');
    if (!host) return;

    const p = currentProfile();
    if (!p) return;

    const paths = Array.isArray(p.paths) ? p.paths : [];
    if (!Array.isArray(p.paths)) {
      p.paths = paths; // sécurise une bonne fois pour toutes
    }

    host.innerHTML = '';

    // Compteur
    const countEl = document.getElementById('routesCount');
    if (countEl) countEl.textContent = paths.length;

    paths.forEach(path => {
      const row = document.createElement('div');
      row.className = 'listItem route-item';
      row.dataset.pid = path.id;

      // --- Couleur ---
      const color = document.createElement('input');
      color.type = 'color';
      color.value = path.color || '#ffcc00';
      color.className = 'routeColor';

      // Debounce léger pour ne pas spammer updateRoute + saveUserDataToLocal
      let colorTimer = null;

      color.addEventListener('input', (e) => {
        const val = e.target.value;
        clearTimeout(colorTimer);

        colorTimer = setTimeout(() => {
          // Met à jour la route + sauvegarde
          updateRoute(path.id, { color: val });

          // Re-render de la carte pour voir la nouvelle couleur de suite
          if (window.UiCore?.renderMarkers) {
            window.UiCore.renderMarkers({ skipRoutesPanel: true });
          }
        }, 160); // Rafraichissment de la couleur
      });

      row.appendChild(color);


      // --- Nom ---
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = path.name || '';
      nameInput.className = 'markerLabel';
      nameInput.placeholder =
        (window.GDMMLang?.t && GDMMLang.t('ui.PathNamePlaceholder')) ||
        'Route name';

      // Helper commun : sauvegarde seulement si le nom a changé
      const saveNameIfChanged = () => {
        const newName = (nameInput.value || '').trim();
        const oldName = path.name || '';

        if (newName === oldName) {
          return; // rien changé → rien à faire
        }

        updateRoute(path.id, { name: newName });

        if (typeof showToast === 'function' && window.GDMMLang?.t) {
          showToast(GDMMLang.t('toast.RouteNameSaved'));
        }
      };

      // Blur : autosave seulement si modifié
      nameInput.addEventListener('blur', () => {
        saveNameIfChanged();
      });

      row.appendChild(nameInput);

      // --- Bouton Save ---
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'marker-save small';
      saveBtn.setAttribute('data-i18n-title', 'ui.SaveTitle');
      saveBtn.title =
        (window.GDMMLang?.t && GDMMLang.t('ui.SaveTitle')) || 'Save';
      saveBtn.innerHTML = '<img src="img/save-icon.svg" width="13">';

      // Clic sur le bouton : même logique, avec toast, et sans double-save
      saveBtn.addEventListener('click', () => {
        saveNameIfChanged();
        nameInput.blur(); // pour sortir proprement du champ
      });

      row.appendChild(saveBtn);


      // --- Bouton Center ---
      const centerBtn = document.createElement('button');
      centerBtn.type = 'button';
      centerBtn.className = 'marker-center small';
      centerBtn.title =
        (window.GDMMLang?.t && GDMMLang.t('ui.CenterOnMap')) ||
        'Center on map';
      centerBtn.innerHTML = '<img src="img/center-icon.svg" width="13">';
      centerBtn.addEventListener('click', () => centerRouteOnMap(path));
      row.appendChild(centerBtn);

      // --- Bouton Link (share only this route) ---
      const linkBtn = document.createElement('button');
      linkBtn.type = 'button';
      linkBtn.className = 'link-for-route small';
      linkBtn.setAttribute('data-i18n-title', 'ui.linkRoute');
      linkBtn.title =
        (window.GDMMLang?.t && GDMMLang.t('ui.linkRoute')) || 'Link';
      linkBtn.innerHTML = '<img src="img/link.svg" width="15" alt="Link">';

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

        // toast (comme marker)
        if (typeof showToast === 'function') {
          const msg =
            (window.GDMMLang?.t && GDMMLang.t('toast.ShareUrlCopied')) ||
            'Link copied ✅';
          showToast(msg, 'success', 3800);
        }
      });

      row.appendChild(linkBtn);



      // --- Bouton Delete ---
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger small';
      deleteBtn.title =
        (window.GDMMLang?.t && GDMMLang.t('ui.DeleteButton')) ||
        'Delete';
      deleteBtn.innerHTML = '<img src="img/bin-icon.svg" width="13">';
      deleteBtn.addEventListener('click', () => deleteRoute(path.id));
      row.appendChild(deleteBtn);

      host.appendChild(row);
    });

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
