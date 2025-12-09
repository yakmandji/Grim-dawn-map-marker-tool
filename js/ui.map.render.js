// ui.map.render.js
// Module de rendu des éléments sur la carte (routes, markers, admin...)
//21.51 28/11

(function () {

  const core  = window.GDMMCore || {};
  const state = core.state || {};

  let currentRegionIdForPanel = null;

  const t = (window.GDMMLang && typeof GDMMLang.t === 'function')
    ? GDMMLang.t.bind(GDMMLang)
    : (s) => s;


/* NOTE LIST ------------------------------------------------------*/
  function getAllRegionNotes() {
    const store   = loadRegionNotesStore();   // utilise le nouveau format v2
    const profile = getActiveProfileName();
    if (!profile) return {};

    const charKey = typeof getActiveCharacterKey === 'function'
      ? getActiveCharacterKey()
      : '_global';

    const result = {};

    // 1) Anciennes notes globales (v1 migrées dans store.global)
    if (store.global && store.global[profile]) {
      Object.assign(result, store.global[profile]);
    }

    // 2) Notes du personnage actif → priment sur les globales
    if (
      store.byCharacter &&
      store.byCharacter[charKey] &&
      store.byCharacter[charKey][profile]
    ) {
      Object.assign(result, store.byCharacter[charKey][profile]);
    }

    return result;
  }


function buildNoteList() {
  const listEl  = document.getElementById('noteList');
  const countEl = document.getElementById('noteCount');
  if (!listEl || !countEl) return;

  const notes     = getAllRegionNotes();
  const regionIds = Object.keys(notes);

  regionIds.sort((a, b) => {
    const na = notes[a];
    const nb = notes[b];
    const ta = na && typeof na === "object" ? na.ts : 0;
    const tb = nb && typeof nb === "object" ? nb.ts : 0;
    return tb - ta; // plus récent en premier
  });

  countEl.textContent = regionIds.length;

  if (regionIds.length === 0) {
    listEl.innerHTML = `<div class="empty-list"></div>`;
    return;
  }

  listEl.innerHTML = '';

  function truncate(text, max = 40) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  // Choix dynamique selon l’état de la sidebar
  const isCollapsed = document.body.classList.contains("sidebar-collapsed");
  const maxLen = isCollapsed ? 22 : 85;

  regionIds.forEach(regionId => {

    const raw = notes[regionId];
    const noteText = raw && typeof raw === "object" ? raw.text : raw || "";

    const preview = truncate(noteText.trim(), maxLen);

    // Nom localisé depuis le DOM
    let regionName = regionId;
    const regionEl = document.querySelector(`.marker-region[data-region-id="${regionId}"]`);
    if (regionEl) {
      const labelEl = regionEl.querySelector('.region-label');
      if (labelEl && labelEl.textContent.trim()) {
        regionName = labelEl.textContent.trim();
      }
    }

    const row = document.createElement('div');
    row.className = 'listItem';
    row.dataset.regionId = regionId;

    row.innerHTML = `
      <img src="img/info-icon.svg" class="icon-16" width="20"/>
      <span class="note-region-name"></span>

      <button type="button"
              class="marker-center small"
              title="${GDMMLang.t('ui.CenterOnMap')}">
        <img src="img/center-icon.svg" width="14">
      </button>

      <button type="button"
              class="danger small note-delete-btn"
              title="${GDMMLang.t('ui.DeleteButton')}">
        <img src="img/bin-icon.svg" width="14">
      </button>
    `;

    const labelSpan = row.querySelector('.note-region-name');
    if (labelSpan) {
      labelSpan.textContent = preview || regionName;
    }

    // --- Bouton center ---
    const centerBtn = row.querySelector('.marker-center');
    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        const regionEl = document.querySelector(`.marker-region[data-region-id="${regionId}"]`);
        if (!regionEl) return;

        const xp = parseFloat(regionEl.dataset.xp);
        const yp = parseFloat(regionEl.dataset.yp);
        if (isNaN(xp) || isNaN(yp)) return;

        window.centerOn(xp, yp, 1.0);

        // Pulse animation
        regionEl.classList.add('marker-highlight');
        setTimeout(() => regionEl.classList.remove('marker-highlight'), 1500);
      });
    }

    // --- Bouton delete  ---
    const deleteBtn = row.querySelector('.note-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        // 1) Efface du store (perso + global)
        clearRegionNote(regionId);

        // 2) Met à jour l’icône info sur la map
        const regionEl = document.querySelector(`.marker-region[data-region-id="${regionId}"]`);
        if (regionEl) {
          refreshRegionNoteIndicator(regionEl, regionId);
        }

        // 3) Rafraîchir la liste
        buildNoteList();

        // 4) Toast
        if (typeof showToast === 'function') {
          showToast(GDMMLang.t('toast.NoteDeleted'));
        }
      });
    }


    listEl.appendChild(row);
  });
}

// Rebuild note list automatically when sidebar size changes
(function() {
  const body = document.body;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === "class") {
        if (typeof buildNoteList === "function") {
          buildNoteList();
        }
      }
    }
  });

  observer.observe(body, { attributes: true });
})();



/*END -Note list-----------------------------------------------------------------*/


  // --- NOTES DE REGION : stockage par personnages ---
  // localStorage: { [profileName]: { [regionId]: "note" } }

  const REGION_NOTES_KEY = 'gdmm_region_notes_v1';
  let regionNotesStore = null;

  function getActiveProfileName() {
    return state && state.active ? state.active : null;
  }

  // 🔹 Helper perso actif
  function getActiveCharacterKey() {
    try {
      if (window.characterManager && typeof characterManager.getActiveCharacter === 'function') {
        const c = characterManager.getActiveCharacter();
        if (c && c.id) return c.id;
      }
    } catch (e) {
      console.warn('[GDMM] Failed to read active character for notes', e);
    }
    return '_global';
  }

  function loadRegionNotesStore() {
    let store = null;
    try {
      const raw = localStorage.getItem(REGION_NOTES_KEY);
      store = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[GDMM] Failed to parse region notes store', e);
      store = null;
    }

    if (!store || typeof store !== 'object') {
      // Rien en storage → on crée un store v2 vide
      store = {
        __schema: 2,
        global: {},
        byCharacter: {},
      };
    }

    // Migration v1 → v2 si __schema absent
    if (!store.__schema) {
      // Ancien format = tout l'objet => on le considère comme global
      store = {
        __schema: 2,
        global: store,
        byCharacter: {},
      };
    } else {
      // Par sécurité, on s'assure que les clés existent
      store.global      = store.global      || {};
      store.byCharacter = store.byCharacter || {};
    }

    return store;
  }


  function saveRegionNotesStore(store) {
    if (!store) return;
    try {
      localStorage.setItem(REGION_NOTES_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn('[GDMM] Failed to save region notes store', e);
    }
  }



  function clearRegionNote(regionId) {
    const store   = loadRegionNotesStore();
    const profile = getActiveProfileName();
    if (!profile || !regionId) return;

    const charKey = typeof getActiveCharacterKey === 'function'
      ? getActiveCharacterKey()
      : '_global';

    // 1) Supprime la note "par personnage"
    if (
      store.byCharacter &&
      store.byCharacter[charKey] &&
      store.byCharacter[charKey][profile] &&
      store.byCharacter[charKey][profile][regionId] !== undefined
    ) {
      delete store.byCharacter[charKey][profile][regionId];
    }

    // 2) Supprime aussi la note globale héritée de l'ancien système
    if (
      store.global &&
      store.global[profile] &&
      store.global[profile][regionId] !== undefined
    ) {
      delete store.global[profile][regionId];
    }

    saveRegionNotesStore(store);
  }



  // Lecture : perso -> fallback global
  function getRegionNote(regionId) {
    const store   = loadRegionNotesStore();
    const profile = getActiveProfileName();
    if (!profile || !regionId) return '';

    const charKey = getActiveCharacterKey();

    // 1) Notes par personnage
    const byChar      = store.byCharacter && store.byCharacter[charKey];
    const byProfileCh = byChar && byChar[profile];
    const vCh         = byProfileCh && byProfileCh[regionId];

    if (vCh !== undefined) {
      return (vCh && typeof vCh === 'object') ? (vCh.text || '') : (vCh || '');
    }

    // 2) Fallback sur les anciennes notes globales
    const byProfile = store.global && store.global[profile];
    const v         = byProfile && byProfile[regionId];

    return (v && typeof v === 'object') ? (v.text || '') : (v || '');
  }



  // Écriture : toujours en "par personnage"
  function setRegionNote(regionId, text) {
    const store   = loadRegionNotesStore();
    const profile = getActiveProfileName();
    if (!profile || !regionId) return;

    const charKey = getActiveCharacterKey();

    if (!store.byCharacter) store.byCharacter = {};
    if (!store.byCharacter[charKey]) store.byCharacter[charKey] = {};
    if (!store.byCharacter[charKey][profile]) {
      store.byCharacter[charKey][profile] = {};
    }

    const byProfile = store.byCharacter[charKey][profile];
    const existing  = byProfile[regionId];

    const trimmed = (text || '').trim();

    if (trimmed) {
      if (!existing || typeof existing === 'string') {
        byProfile[regionId] = {
          text: trimmed,
          ts: Date.now(),
        };
      } else {
        existing.text = trimmed;
        existing.ts   = Date.now();
      }
    } else {
      if (existing !== undefined) {
        delete byProfile[regionId];
      }
    }

    saveRegionNotesStore(store);
  }



    function refreshRegionNoteIndicator(regionEl, regionId) {
      if (!regionEl || !regionId) return;

      // nettoyer l'ancien éventuel indicateur
      const oldIcon = regionEl.querySelector('.region-note-indicator');
      if (oldIcon) oldIcon.remove();

      const note = getRegionNote(regionId);
      const trimmed = note ? note.trim() : '';

      if (!trimmed) {
        regionEl.classList.remove('has-region-note');
        return;
      }

      regionEl.classList.add('has-region-note');

      const infoIcon = document.createElement('img');
      infoIcon.className = 'region-note-indicator';
      infoIcon.src = 'img/info2-icon.svg';
      infoIcon.alt = 'Note';

      // éviter de démarrer un pan quand on clique sur le i
      infoIcon.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });

      // Tooltip lecture seule
      infoIcon.addEventListener('mouseenter', (ev) => {
        const txt = getRegionNote(regionId);
        if (!txt) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'region-note-tooltip';
        tooltip.textContent = txt;

        document.body.appendChild(tooltip);

        const r = ev.target.getBoundingClientRect();
        tooltip.style.left = `${r.left}px`;
        tooltip.style.top  = `${r.bottom + 6}px`;

        ev.target._noteTooltip = tooltip;
      });

      infoIcon.addEventListener('mouseleave', (ev) => {
        const tip = ev.target._noteTooltip;
        if (tip) tip.remove();
        ev.target._noteTooltip = null;
      });

      regionEl.appendChild(infoIcon);
    }



  const currentProfile = core.currentProfile || function(){ return null; };
  const iconFor = core.iconFor || function () { return ''; };
  const getPathMode = window.UiRoutes?.getPathMode || function(){ return { active:false, current:null }; };

  // Helpers venant de UiCore / GDMMCore
  const uiCore = window.UiCore || {};
  const pctToPx   = uiCore.pctToPx   || function(){ return { x:0, y:0 }; };
  const viewToPct = uiCore.viewToPct || function(){ return { xp:0, yp:0 }; };
  const resolveSizeKey = uiCore.resolveSizeKey || function(){ return null; };
  const updateMarkerFromUI = uiCore.updateMarkerFromUI || function () {};
  const clamp     = core.clamp || ((v,min,max) => Math.max(min, Math.min(max, v)));

  // --- RENDER ROUTES (extrait de ui.core.js) ---
  function renderRoutes(svgLayer, inner) {
    const p = currentProfile();
    if (!p || !state.mapReady) return;

    const paths = p.paths || [];
    const pm = getPathMode ? getPathMode() : { active:false, current:null };

    paths.forEach(path => {
      if (path.visible === false) return;
      if (!path.points || !path.points.length) return;

      const isEditing =
        state.editingPathId === path.id ||
        (pm.current && pm.current.id === path.id);
      const isCurrentPath = pm.current && pm.current.id === path.id;

      // --- MAIN LINE ---
      if (path.points.length >= 2) {
        const d = path.points
          .map((pt, idx) => {
            const px = (pt.xp / 100) * (state.mapNatural.w || 1);
            const py = (pt.yp / 100) * (state.mapNatural.h || 1);
            return (idx === 0 ? 'M' : 'L') + px + ' ' + py;
          })
          .join(' ');

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', d);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', path.color || '#ffcc00');
        el.setAttribute('stroke-width', path.width || 4);
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        el.setAttribute('opacity', path.opacity ?? 0.85);
        el.setAttribute('vector-effect', 'non-scaling-stroke');

        svgLayer.appendChild(el);
      }

      // --- ROUTE POINTS ---
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

      // --- START / END bubbles ---
      if (path.points.length) {
        const first = path.points[0];
        const last  = path.points[path.points.length - 1];

        const makeEndpoint = (pt, type) => {
          const ex = (pt.xp / 100) * (state.mapNatural.w || 1);
          const ey = (pt.yp / 100) * (state.mapNatural.h || 1);

          const tag = document.createElement('div');
          tag.className = 'path-endpoint ' +
            (type === 'start' ? 'path-start' : 'path-end');

          if (type === 'start') {
            tag.innerHTML = `
              <img src="img/foot-icon.svg" class="route-icon" width="14" height="14" alt="">
              <span>${path.name || '(route)'}</span>
            `;
          } else {
            tag.innerHTML = `
              <img src="img/flag-icon.svg" class="route-icon" width="14" height="14" alt="">
            `;
          }

          tag.style.left = ex + 'px';
          tag.style.top  = ey + 'px';

          if (path.color) {
            tag.style.background  = path.color;;
            tag.style.borderColor = path.color;

            const c = path.color.replace('#', '');
            const r = parseInt(c.substring(0, 2), 16);
            const g = parseInt(c.substring(2, 4), 16);
            const b = parseInt(c.substring(4, 6), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            tag.style.color = luminance > 0.6 ? '#000' : '#fff';
          }

          if (type === 'start') {
            tag.addEventListener('pointerdown', e => {
              e.stopPropagation();
              const row = document.querySelector(
                `#routesList .listItem[data-pid="${path.id}"]`
              );
              if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('highlight');
                setTimeout(() => row.classList.remove('highlight'), 2200);
              }
            });
          }
          inner.appendChild(tag);
        };

        makeEndpoint(first, 'start');
        if (path.points.length > 1 && !isCurrentPath) {
          makeEndpoint(last, 'end');
        }
      }
    });
  }

  // Helper interne (on copie-coller depuis ton core)
  function hexToRgba(hex, alpha = 1) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }


    // --- RENDER USER MARKERS (pins normaux) ---
    function renderUserMarkers(inner) {
      const p = currentProfile();
      if (!(p && state.mapReady)) return;

      const markers = Array.isArray(p.markers) ? p.markers : [];
      if (!markers.length) return;

        // 3) draw markers
            markers.forEach(m => {
              //Hide done collapesd
              if (window.hideDoneOnMap && m.done) return;

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

              const bg = document.createElement('img');
              bg.className = 'pin-bg';

              // on prend directement l'icône de la catégorie
              const iconSrc = iconFor(m.cat) || 'img/pin-general.svg';
              bg.src = iconSrc;
              bg.alt = '';

              pin.appendChild(bg);
              el.appendChild(pin);

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

              // --- LABEL ---
              const lab = document.createElement('div');
              lab.className = 'label';

              const p = document.createElement('p');
              p.textContent = m.label || '(no name)'; 
              lab.appendChild(p);

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
                        setTimeout(() => row.classList.remove('highlight'), 2200);
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
              });

              inner.appendChild(el);   
           });

      }
/*      END Render marker ---------------------------------------------------------*/

      // --- RENDER ADMIN MARKERS (rifts, regions, dungeon entries, nav links) ---
      function renderAdminMarkers(inner) {
        if (!state.mapNatural) return;

        // 1) RIFTS ---------------------------------------------------
        let riftData = [];
        if (window.RIFT_MARKERS_BY_SIZE) {
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

        // 2) REGIONS -------------------------------------------------
        let regionData = [];
        if (window.REGION_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.REGION_MARKERS_BY_SIZE);
          if (key && window.REGION_MARKERS_BY_SIZE[key]) {
            regionData = window.REGION_MARKERS_BY_SIZE[key];
          }
        }

        regionData.forEach(m => {
          const el = document.createElement('div');
          el.classList.add('marker-region', 'locked');
          el.dataset.regionId = m.id;
          el.dataset.xp = m.xp;
          el.dataset.yp = m.yp;

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

          // --- Tooltip lecture seule sur tout le label ---
          lab.addEventListener('mouseenter', (ev) => {
              const txt = getRegionNote(m.id);
              if (!txt) return;

              const tooltip = document.createElement('div');
              tooltip.className = 'region-note-tooltip';
              tooltip.textContent = txt;

              document.body.appendChild(tooltip);

              const r = ev.target.getBoundingClientRect();
              tooltip.style.left = `${r.left + (r.width / 2)}px`;
              tooltip.style.transform = "translateX(-50%)";
              tooltip.style.top  = `${r.bottom + 10}px`;

              ev.target._noteTooltip = tooltip;
          });

          lab.addEventListener('mouseleave', (ev) => {
              const tip = ev.target._noteTooltip;
              if (tip) tip.remove();
              ev.target._noteTooltip = null;
          });

          // Bloquer le pan SI une note existe pour cette région
          lab.addEventListener('pointerdown', (e) => {
            const note = getRegionNote(m.id);
            if (note && note.trim()) {
              // il y a une note → on ne laisse pas le viewport capter le pointer
              e.stopPropagation();
            }
          });

          // --- Indicateur si une note existe déjà pour cette région ---

          try {
            refreshRegionNoteIndicator(el, m.id);
          } catch (e) {
            console.warn('[GDMM] Failed to refresh region note for', m.id, e);
          }


          // --- Icône crayon pour futur système de notes ---
          const editIcon = document.createElement('button');
          editIcon.className = 'region-note-edit';
          editIcon.type = 'button';

          const editImg = document.createElement('img');
          editImg.src = 'img/edit-icon.svg';
          editImg.alt = (window.GDMMLang && GDMMLang.t)
            ? GDMMLang.t('ui.EditRegionNote')
            : 'Edit note';

          editIcon.appendChild(editImg);

          editIcon.addEventListener('pointerdown', (e) => {
            // On bloque le pan quand on clique sur l'icône
            e.stopPropagation();
          });

          editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const regionId = m.id;
            openRegionNotePanel(regionId, labelText, el);
          });

          el.appendChild(editIcon);

          const pt = pctToPx(m.xp, m.yp);
          el.style.left = pt.x + 'px';
          el.style.top  = pt.y + 'px';

          el.classList.add('is-static');
          inner.appendChild(el);

          lab.addEventListener('click', (e) => {
            // on évite de marcher sur le clic du crayon
            if (e.target.closest('.region-note-edit')) return;

            const noteList = document.getElementById('noteList');
            if (!noteList) return;

            const row = noteList.querySelector(`.listItem[data-region-id="${m.id}"]`);
            if (!row) return;

            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('highlight');
            setTimeout(() => row.classList.remove('highlight'), 2200);
          });

        });

        // 2c) SHRINES -------------------------------------------------
        if (window.SHRINE_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.SHRINE_MARKERS_BY_SIZE);
          const shrineData = (key && window.SHRINE_MARKERS_BY_SIZE[key])
            ? window.SHRINE_MARKERS_BY_SIZE[key]
            : [];

          shrineData.forEach(m => {
            const el = document.createElement('div');
            el.classList.add('marker', 'marker-shrine', 'locked');
            el.dataset.shrineId = m.id;
            el.dataset.xp = m.xp;
            el.dataset.yp = m.yp;
            el.dataset.difficulty = m.difficulty || 'normal';

            if (isShrineDoneForActiveChar(m.id, m.difficulty)) {
              el.classList.add('shrine-done');

              // --- AJOUT BADGE ---
              const badge = document.createElement('div');
              badge.className = 'shrine-done-badge';
              el.appendChild(badge);
            }

            // Classe CSS selon la difficulté
            if (m.difficulty === 'elite') {
              el.classList.add('shrine-elite');
            } else if (m.difficulty === 'ultimate') {
              el.classList.add('shrine-ultimate');
            } else {
              el.classList.add('shrine-normal');
            }

            // Icône
            const iconImg = document.createElement('img');
            iconImg.className = 'shrine-icon';

            let iconPath = 'img/icon-shrine.png'; // normal
            if (m.difficulty === 'elite') {
              iconPath = 'img/icon-shrine-e.png';
            } else if (m.difficulty === 'ultimate') {
              iconPath = 'img/icon-shrine-u.png';
            }
            iconImg.src = iconPath;

            // LABEL (avec 2ᵉ ligne difficulté)
            const lab = document.createElement('div');
            lab.className = 'label shrine-label';

            // Nom de région via helper existant
            const regionName =
              (window.getRegionLabel && m.regionTag)
                ? getRegionLabel(m.regionTag, m.regionTag)
                : (m.label || m.tag || m.regionTag || '');

            const shrineWord = t('ui.shrine') || 'Shrine';

            // Texte de difficulté (i18n)
            let difficultyKey = 'ui.shrineTierNormal';
            if (m.difficulty === 'elite') {
              difficultyKey = 'ui.shrineTierElite';
            } else if (m.difficulty === 'ultimate') {
              difficultyKey = 'ui.shrineTierUltimate';
            }
            const difficultyText = t(difficultyKey) || '';

            const mainText = `${shrineWord} – ${regionName}`;
            const tooltipText = difficultyText
              ? `${mainText} - ${difficultyText}`
              : mainText;

            // 1ʳᵉ ligne = texte principal, 2ᵉ = difficulté en petit
            if (difficultyText) {
              lab.innerHTML = `${mainText}<br><span class="shrine-difficulty">${difficultyText}</span>`;
            } else {
              lab.textContent = mainText;
            }

            // Tooltip natif
            iconImg.alt = tooltipText;

            el.appendChild(iconImg);
            el.appendChild(lab);

            // Position
            const pt = pctToPx(m.xp, m.yp);
            el.style.left = pt.x + 'px';
            el.style.top  = pt.y + 'px';

            el.classList.add('is-static');

            // Empêcher le pan quand on clique sur le shrine
            el.addEventListener('pointerdown', (e) => {
              e.stopPropagation();
            });

            // Clic = ouvrir un petit panneau "Terminé"
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              if (typeof openShrinePanel === 'function') {
                openShrinePanel(m, el);
              }
            });

            el.classList.add('is-static');
            inner.appendChild(el);
          });

          if (typeof updateShrineCounterUI === 'function') {
            updateShrineCounterUI();
          }

        }



        // 2b) Search index (regions + rifts)
        if (window.GDMMSearch && typeof GDMMSearch.refresh === 'function') {
          GDMMSearch.refresh(regionData, riftData);
        }

        // 3) DUNGEON ENTRIES (eyes) ---------------------------------
        let entryMarkers = [];
        if (window.DUNGEON_ENTRY_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.DUNGEON_ENTRY_MARKERS_BY_SIZE);
          if (key && window.DUNGEON_ENTRY_MARKERS_BY_SIZE[key]) {
            entryMarkers = window.DUNGEON_ENTRY_MARKERS_BY_SIZE[key];
          }
        }

        state.dungeonEntries = {};

        entryMarkers.forEach(m => {
          const el = document.createElement('div');
          el.classList.add('marker-entry-dungeon');
          el.dataset.entryId = m.id;

          const img = document.createElement('img');
          img.src = m.icon || 'img/eye-icon.png';
          img.className = 'entry-icon';
          el.appendChild(img);

          const pt = pctToPx(m.xp, m.yp);
          el.style.left = pt.x + 'px';
          el.style.top  = pt.y + 'px';

          el.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'touch') return; 
            // On ne clear plus ici : le donjon reste allumé
          });


          // Tap mobile : affiche l’overlay du donjon
          // ----------------------------------------
          el.addEventListener('pointerup', (e) => {
            e.preventDefault();
            e.stopPropagation(); // très important pour que le "tap ailleurs pour fermer" ne s’active pas

            if (window.showDungeonLinksForEntry) {
              window.showDungeonLinksForEntry(m.id);
            }
          });


          inner.appendChild(el);
          state.dungeonEntries[m.id] = { cfg: m, el };
        });

        // 4) NAV LINKS -----------------------------------------------
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

        if (window.NAV_MARKERS_BY_SIZE) {
          const key = resolveSizeKey(window.NAV_MARKERS_BY_SIZE);
          const navData = (key && window.NAV_MARKERS_BY_SIZE[key])
            ? window.NAV_MARKERS_BY_SIZE[key]
            : [];

          navData.forEach(m => {
            const el = document.createElement('div');
            el.classList.add('marker-link', 'locked');
            if (m.id) {
              el.dataset.navId = m.id;
            }

            const iconImg = document.createElement('img');
            iconImg.className = 'link-icon';
            iconImg.src = m.icon || 'img/icon-eye.png';
            iconImg.alt = m.alt || 'Go to';
            el.appendChild(iconImg);

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

            el.addEventListener('pointerdown', e => {
              e.stopPropagation();
            });

            el.addEventListener('click', async e => {
              e.stopPropagation();


              // 1) Nav dans la même map
              if (!m.targetProfile) {
                if (typeof m.targetXp === 'number' && typeof m.targetYp === 'number') {
                  centerOn(m.targetXp, m.targetYp, m.targetScale || 1.2);

                  const navId = m.targetId || m.id;   // <- compat : targetId si défini, sinon id

                  if (navId) {
                    const destNav = document.querySelector(`.marker-link[data-nav-id="${navId}"]`);
                    if (destNav) {
                      destNav.classList.add('marker-highlight');
                      setTimeout(() => destNav.classList.remove('marker-highlight'), 1500);
                    }
                  }
                }
                return;
              }

                // 2) Nav vers un autre profil
                const targetProfile = m.targetProfile;
                const sel = document.getElementById('profileSelect');
                if (!sel || !targetProfile) return;

                sel.value = targetProfile;

                const hasCoords = (typeof m.targetXp === 'number' && typeof m.targetYp === 'number');

                if (hasCoords) {
                  state.skipViewRestoreOnce = true;

                  // On mémorise ce qu'on veut faire une fois la nouvelle map chargée
                  window._gdmmPendingNavCenter = {
                    xp: m.targetXp,
                    yp: m.targetYp,
                    scale: m.targetScale || 1.2,
                    targetId: m.targetId || null,
                  };
                }

                sel.dispatchEvent(new Event('change', { bubbles: true }));

                // on supprime le setTimeout(centerOn(...))
                // Le centrage sera fait dans le onload de la map.
                    
                // On garde juste éventuellement le pulse après coup :
                if (hasCoords && m.targetId) {
                  // Petit délai pour laisser les navlinks se rendre sur la nouvelle map
                  setTimeout(() => {
                    const destNav = document.querySelector(`.marker-link[data-nav-id="${m.targetId}"]`);
                    if (destNav) {
                      destNav.classList.add('marker-highlight');
                      setTimeout(() => destNav.classList.remove('marker-highlight'), 1500);
                    }
                  }, 450);
                }

            });

            inner.appendChild(el);
          });
        }

        buildNoteList();
      }

    /* ---------------------------------------------------------------NOTE PANNER*/

    function openRegionNotePanel(regionId, labelText, anchorEl) {
      // Traduction actuelle pour le bouton Save

      const saveLabel = t ? t('ui.SaveTitle') : 'Save';

      // créer le panel s’il n’existe pas
      let panel = document.getElementById('regionNotePanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'regionNotePanel';
        panel.className = 'region-note-panel';

        panel.innerHTML = `
          <div class="region-note-header">
            <span class="region-note-title"></span>
            <button type="button" class="region-note-close">✕</button>
          </div>
          <textarea class="region-note-text markers-scroll" rows="5" spellcheck="false"></textarea>
          <div class="region-note-actions">
            <button type="button" class="mt-1 region-note-save">${saveLabel}</button>
          </div>
        `;

        document.body.appendChild(panel);

        // close on X
        panel.querySelector('.region-note-close').addEventListener('click', () => {
          panel.style.display = 'none';
        });

        // FERMETURE EN CLIQUANT DEHORS
        document.addEventListener(
          'pointerdown',
          function handleOutsideClick(e) {
            const p = document.getElementById('regionNotePanel');
            if (!p || p.style.display === 'none') return;

            // si on clique dans la fenêtre -> ne rien faire
            if (p.contains(e.target)) return;

            // si on clique sur le bouton crayon -> ne rien faire (ça rouvre le panneau)
            if (e.target.closest('.region-note-edit')) return;

            // si on clique sur une région -> ne pas fermer (pan doit fonctionner)
            if (e.target.closest('.marker-region')) return;

            // on ferme proprement
            p.style.display = 'none';
          },
          true
        );

        // SAVE → enregistre dans le store global + met à jour l’icône
        panel.querySelector('.region-note-save').addEventListener('click', () => {
          const txt = panel.querySelector('.region-note-text').value || '';
          const trimmed = txt.trim();

          if (currentRegionIdForPanel) {
            // 1) Sauvegarde globale
            setRegionNote(currentRegionIdForPanel, txt);

            // 2) Rebuild la liste
            buildNoteList();

            // 3) Mise à jour visuelle via le helper
            const regionEl = document.querySelector(
              `.marker-region[data-region-id="${currentRegionIdForPanel}"]`
            );
            if (regionEl && typeof refreshRegionNoteIndicator === 'function') {
              refreshRegionNoteIndicator(regionEl, currentRegionIdForPanel);
            }
          }

          // 4) Fermer le panel
          panel.style.display = 'none';

          // 5) Toast "Note enregistrée"
          if (typeof showToast === 'function' && window.GDMMLang && typeof GDMMLang.t === 'function') {
            showToast(GDMMLang.t('toast.NoteSaved'));
          }
        });

      } else {
        // Panel déjà créé : mettre à jour le texte du bouton avec la langue actuelle
        const btn = panel.querySelector('.region-note-save');
        if (btn) btn.textContent = saveLabel;
      }

      // ==== À partir d’ici, c’est exécuté à CHAQUE ouverture du panel ====

      // garder l’ID courant en mémoire
      currentRegionIdForPanel = regionId;
      window.currentRegionIdForPanel = regionId; // debug optionnel

      // set du titre (le label de région est déjà localisé)
      const titleEl = panel.querySelector('.region-note-title');
      if (titleEl) {
        titleEl.textContent = labelText || 'Region note';
      }

      // set du contenu existant (lecture dans le store global)
      const txtEl = panel.querySelector('.region-note-text');
      if (txtEl) {
        txtEl.value = getRegionNote(regionId) || '';
        txtEl.maxLength = 500;
      }

      // positionner le panel par rapport au marker
      const rect = anchorEl.getBoundingClientRect();
      panel.style.position = 'fixed';
      panel.style.left = `${rect.left + 10}px`;
      panel.style.top  = `${rect.bottom + 8}px`;
      panel.style.display = 'block';

      if (txtEl) {
        txtEl.focus();
      }
    }


  // Export public
  window.UiMapRender = {
    renderRoutes,
    renderUserMarkers,
    renderAdminMarkers,
  };


})();
