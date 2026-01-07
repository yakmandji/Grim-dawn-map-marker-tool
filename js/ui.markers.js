// ui.markers.js
(function () {

const {
  state,
  currentProfile,
  markAsChanged,
  saveUserDataToLocal,
  addMarker: coreAddMarker,
  updateMarker: coreUpdateMarker,
  deleteMarker: coreDeleteMarker,
} = window.GDMMCore;


// Icônes par catégorie (utilisé en read-only dans la liste)
const CATEGORY_ICONS = {
  General:  'img/waypoint.svg',
  Quest:    'img/quest2.svg',
  Boss:     'img/boss2.svg',
  Loot:     'img/loot2.svg',
  Waypoint: 'img/passage.svg',
  Donjon:   'img/donjon2.svg',
  NPC:      'img/npc2.svg',
};

// Clé i18n par catégorie (pour le label read-only)
const CATEGORY_I18N_KEYS = {
  General:  'ui.GeneralMarker',
  Quest:    'ui.QuestMarker',
  Boss:     'ui.BossMarker',
  Loot:     'ui.LootMarker',
  Waypoint: 'ui.WaypointMarker',
  Donjon:   'ui.DonjonMarker',
  NPC:      'ui.NPCMarker',
};

const { $, inner } = window.UiCore;


// --- Tooltip-submenu
let activeMenu = null;
let activeBtn = null;

function getMarkerSingletonMenu() {
  const menus = Array.from(document.querySelectorAll('.marker-list-menu'));
  if (!menus.length) return null;

  const keep = menus[0];
  for (let i = 1; i < menus.length; i++) menus[i].remove();
  return keep;
}

function closeMarkerListMenu() {
  if (activeMenu) activeMenu.classList.remove('is-open');
  if (activeBtn) activeBtn.classList.remove('is-open');

  if (activeMenu) {
    activeMenu.style.left = '';
    activeMenu.style.top = '';
    activeMenu.style.position = '';
    activeMenu.style.zIndex = '';
  }

  activeMenu = null;
  activeBtn = null;
}

function openMarkerListMenu(btnEl) {
  const menu = getMarkerSingletonMenu(); // <= IMPORTANT : singleton
  if (!menu || !btnEl) return;

  // Toggle si même bouton
  if (activeBtn === btnEl && menu.classList.contains('is-open')) {
    closeMarkerListMenu();
    return;
  }

  // Si un autre bouton était actif -> ferme avant
  if (activeBtn && activeBtn !== btnEl) closeMarkerListMenu();

  activeMenu = menu;
  activeBtn = btnEl;

  const row = btnEl.closest('[data-mid], [data-pid]');
  menu.dataset.kind = row?.dataset.pid ? 'route' : 'marker';
  menu.dataset.id = row?.dataset.pid || row?.dataset.mid || '';

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

function initMarkerSubMenus() {
  // éviter double init (même pattern que routes)
  if (window.__gdmmMarkersSubMenuInit) return;
  window.__gdmmMarkersSubMenuInit = true;

  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.marker-sub-menu');
    if (!btn) return;
    e.preventDefault();
  }, true);

  document.addEventListener('click', (e) => {
    const menuEl = e.target.closest('.marker-list-menu');
    const dotsBtn = e.target.closest('.marker-sub-menu');

    // Clic sur un bouton du menu tooltip => exécuter l'action via dataset.id
  const inMenuButton = e.target.closest('.marker-list-menu button');
  if (inMenuButton) {
    e.preventDefault();
    e.stopPropagation();

    const menu = inMenuButton.closest('.marker-list-menu');
    const kind = menu?.dataset?.kind || 'marker';
    const id   = menu?.dataset?.id || '';

    // On mappe selon tes attributs HTML (pas de data-action chez toi)
    let action = null;
    if (inMenuButton.hasAttribute('data-center')) action = 'center';
    else if (inMenuButton.hasAttribute('data-link')) action = 'link';
    else if (inMenuButton.hasAttribute('data-delete')) action = 'delete';

    if (action && id) {
      window.GDMMListMenu?.runAction(kind, action, { id });
    }

    closeMarkerListMenu();
    return;
  }


    // Clic sur "..."
    if (dotsBtn) {
      e.stopPropagation();
      openMarkerListMenu(dotsBtn);
      return;
    }

    // Clic dans la popup -> ne ferme pas
    if (menuEl) return;

    // Clic ailleurs -> ferme
    closeMarkerListMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMarkerListMenu();
  });

  window.addEventListener('resize', closeMarkerListMenu);
  document.addEventListener('scroll', closeMarkerListMenu, true);
}



const GDMM_LIST_MENU = {
  handlers: {}, // { marker: {...}, route: {...} }

  register(kind, handlers) {
    this.handlers[kind] = handlers;
  },

  runAction(kind, action, ctx) {
    const fn = this.handlers?.[kind]?.[action];
    if (typeof fn === 'function') fn(ctx);
  }
};

window.GDMMListMenu = GDMM_LIST_MENU;


// Actions tooltip pour les marqueurs
GDMM_LIST_MENU.register('marker', {

  center({ id }) {
    const p = currentProfile();
    const m = (p?.markers || []).find(x => String(x.id) === String(id));
    if (!m) return;

    const duration = 260;

    // 1) on centre avec l'anim
    if (typeof window.smoothCenterOn === 'function') {
      window.smoothCenterOn(m.xp, m.yp, 0.8, duration);
    } else if (typeof window.centerOn === 'function') {
      // fallback: centerOn fait déjà le pulse si on lui passe markerId
      window.centerOn(m.xp, m.yp, 0.8, m.id);
      return;
    }

    // 2) et on refait le pulse (même logique que centerOn)
    setTimeout(() => {
      let markerEl = document.querySelector(`.marker[data-mid="${m.id}"]`);

      // Si c’est un Done marker et que l’historique est masqué, on réactive l'archive
      if (markerEl && markerEl.classList.contains('completed')) {
        if (typeof window.ensureAdminLayerVisible === 'function') {
          window.ensureAdminLayerVisible('history');
        }
      }

      // re-sélection après éventuel changement (filtres, classes, etc.)
      markerEl = document.querySelector(`.marker[data-mid="${m.id}"]`);
      if (markerEl) {
        markerEl.classList.add('marker-highlight');
        setTimeout(() => markerEl.classList.remove('marker-highlight'), 1500);
      }
    }, duration);
  },


  delete({ id }) {
    deleteMarkerFromUI(id);
  },

  async link({ id }) {
    const p = currentProfile();
    const m = (p?.markers || []).find(x => String(x.id) === String(id));
    if (!m) return;

    if (!window.GDMMShare?.createLink) {
      if (typeof showToast === 'function') {
        showToast('Share system not ready ❌', 'error', 3500);
      }
      return;
    }

    const round = (v) => Math.round((v || 0) * 10) / 10;

    const payload = {
      v: '3',
      map: state.active,
      r: [],
      m: [{
        i: m.id,
        x: round(m.xp),
        y: round(m.yp),
        l: m.label || '',
        k: m.cat || 'General',
        c: m.color || '#78f1c2',
      }],
      notes: null,
    };

    await window.GDMMShare.createLink(payload);

    if (typeof showToast === 'function') {
      const msg =
        (window.GDMMLang?.t && GDMMLang.t('toast.ShareUrlCopied')) ||
        'Link copied ✅';
      showToast(msg, 'success', 3800);
    }
  }
});


  // --- Done fly animation ---
function animateArchiveFlyBlock(listRowEl) {
  const target = document.getElementById('donePanel') || document.getElementById('donePanelToggle');
  if (!listRowEl || !target) return;

  const a = listRowEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();

  // Clone du bloc
  const ghost = listRowEl.cloneNode(true);
  ghost.classList.add('marker-fly');

  ghost.style.left = a.left + 'px';
  ghost.style.top = a.top + 'px';
  ghost.style.width = a.width + 'px';
  ghost.style.height = a.height + 'px';
  ghost.style.opacity = '1';

  document.body.appendChild(ghost);

  // Destination : vers le panneau (mais pas besoin d’aller pile dessus)
  const endX = b.left + 20;
  const endY = b.top + b.height / 2;

  const startX = a.left + a.width / 2;
  const startY = a.top + a.height / 2;

  const dx = endX - startX;
  const dy = endY - startY;

  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.65)`;
    ghost.style.opacity = '0';
  });

  ghost.addEventListener('transitionend', (ev) => {
    if (ev.propertyName === 'transform') ghost.remove();
  });
}

function setActiveCategoryFilter(cat) {
  const catKey = String(cat || '').toLowerCase();

  const allBtn = document.querySelector('.filterToggle[data-all]');
  const catButtons = [...document.querySelectorAll('.filterToggle[data-cat]')];

  const target = catButtons.find(b =>
    String(b.getAttribute('data-cat') || '').toLowerCase() === catKey
  );
  if (!target) return;

  // mode exclusif
  allBtn?.classList.remove('is-on');
  catButtons.forEach(b => b.classList.toggle('is-on', b === target));

  window.UiFilters?.applyCategoryFilters?.();
}


  // -------------------------END Done fly animation ---


  // --- Markers ---
  function addMarkerFromUI(xp, yp){
    if (!state.mapReady) { alert('You need first to load a map'); return; }
    const label = $('#newLabel').value.trim();
    const cat   = $('#newCategory').value;
    const done  = false;

    const marker = coreAddMarker({ xp, yp, label, cat, done });

    // === UX : si un filtre catégorie est actif, bascule sur la catégorie du marker créé ===
    const allBtn = document.querySelector('.filterToggle[data-all]');
    const allActive = !!(allBtn && allBtn.classList.contains('is-on'));

    if (!allActive) {
      const activeCatBtn = document.querySelector('.filterToggle.is-on[data-cat]');
      if (activeCatBtn) {
        const activeCat = String(activeCatBtn.getAttribute('data-cat') || '').toLowerCase();
        const markerCat = String(cat || '').toLowerCase();

        if (markerCat && markerCat !== activeCat) {
          setActiveCategoryFilter(markerCat);
        }
      }
    }


    if (marker) {
      state.lastCreatedMarkerId = marker.id;
    }

    $('#newLabel').value = '';
    if (window.UiCore && typeof window.UiCore.setTool === 'function') {
      window.UiCore.setTool('pan');
    }
    renderList();
    if (window.UiCore?.renderMarkers) window.UiCore.renderMarkers();
    if (window.UiCore?.renderRoutesPanel) window.UiCore.renderRoutesPanel();
    markAsChanged();
    saveUserDataToLocal();
  }


    function updateMarkerFromUI(id, patch, rerender = true){
    coreUpdateMarker(id, patch);
    markAsChanged();
    saveUserDataToLocal();
    if (rerender) {
      renderList();
    if (window.UiCore?.renderMarkers) window.UiCore.renderMarkers();
    if (window.UiCore?.renderRoutesPanel) window.UiCore.renderRoutesPanel();
    }
    if (patch.label !== undefined) {
      showToast(GDMMLang.t('toast.MarkerNameUpdated'));
    }
  }

  function deleteMarkerFromUI(id){
    coreDeleteMarker(id);
    renderList();
    if (window.UiCore?.renderMarkers) window.UiCore.renderMarkers();
    if (window.UiCore?.renderRoutesPanel) window.UiCore.renderRoutesPanel();
    markAsChanged();
    saveUserDataToLocal();
  }

  function listFiltered() {
      const p = currentProfile();
      if (!p) return [];
      return [ ...(p.markers || []) ];
  }


  /*Render list ------------------------------------------------------------------*/

  function renderList() {
    const markers = listFiltered();
    const host = $('#list');
    const tpl  = $('#tplItem');
    if (!host || !tpl) return;

    const activeMarkers = markers.filter(m => !m.done);
    const doneMarkers   = markers.filter(m => !!m.done);

    // compteur de la liste principale = seulement les actifs
    const countEl = $('#count');
    if (countEl) countEl.textContent = activeMarkers.length;

    // compteur de l’historique
    const doneCountEl = $('#doneCount');
    if (doneCountEl) doneCountEl.textContent = doneMarkers.length;

    host.innerHTML = '';

    // --- Liste vide (marqueurs actifs) ---
    if (!activeMarkers.length) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'list-empty';

      const mapName = window.GDMMCore?.state?.active;

      emptyMsg.innerHTML = GDMMLang.t('ui.NothingActive', {
        map: mapName
          ? `<span class="done-map-name">${mapName}</span>`
          : ''
      });

      host.appendChild(emptyMsg);
    }


    // === LISTE PRINCIPALE : uniquement les marqueurs NON done ===
    const CAT_ORDER = [
      'General',
      'Quest',
      'Boss',
      'Loot',
      'Waypoint',
      'Donjon',
      'NPC'
    ];

    // Regroupement par catégories
    const grouped = {};
    activeMarkers.forEach(m => {
      const cat = m.cat || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    });

    // Parcours dans l’ordre CAT_ORDER
    CAT_ORDER.forEach(cat => {
      if (!grouped[cat]) return;

      const arr = grouped[cat];

      // Header catégorie (traduit)
      const header = document.createElement('div');
      header.className = 'listCategoryHeader';

      const key = CATEGORY_I18N_KEYS[cat] || CATEGORY_I18N_KEYS.General;
      const label = (window.GDMMLang?.t) ? GDMMLang.t(key) : cat;

      header.textContent = `${label} (${arr.length})`;
      host.appendChild(header);


      // On parcourt du dernier au premier → le plus récent en haut
      for (let i = arr.length - 1; i >= 0; i--) {
        const m = arr[i];

        const el = tpl.content.firstElementChild.cloneNode(true);
        el.dataset.mid = m.id;

        if (m.cat) {
          el.classList.add(m.cat.toLowerCase());
        }

        // label
        const label = el.querySelector('[data-label]');
        const originalLabel = m.label || '';
        label.value = originalLabel;

        // catégorie (read-only)
        const cat = m.cat || 'General';
        const catClass = cat.toLowerCase();

        // badge catégorie (classe CSS dynamique)
        const catBadge = el.querySelector('.marker-cat-badge');
        if (catBadge) {
          // nettoyage au cas où (rerender)
          catBadge.classList.remove(
            'general','quest','boss','loot','waypoint','donjon','npc'
          );
          catBadge.classList.add(catClass);
        }

        // texte
        const catLabel = el.querySelector('[data-cat-label]');
        if (catLabel) {
          const key = CATEGORY_I18N_KEYS[cat] || CATEGORY_I18N_KEYS.General;
          catLabel.textContent = (window.GDMMLang?.t)
            ? GDMMLang.t(key)
            : cat;
        }

        // icône
        const catIcon = el.querySelector('.marker-cat-icon');
        if (catIcon) {
          catIcon.src = CATEGORY_ICONS[cat] || CATEGORY_ICONS.General;
          catIcon.title = catLabel.textContent;
        }

        label.addEventListener('blur', (e) => {
          const newVal = e.target.value;

          // Si rien n'a changé, on ne fait rien
          if (newVal === originalLabel) return;

          // Sinon on met à jour + toast
          updateMarkerFromUI(m.id, { label: newVal }, true);
        });

        // done
        const done = el.querySelector('[data-done]');
        done.checked = !!m.done;

        done.onchange = e => {
          const isDone = !!e.target.checked;

          if (isDone) {
            animateArchiveFlyBlock(el); // Done animation
            // Si l’historique est masqué sur la map, on le réactive (comme shrine/region)
            if (window.UiFilters?.ensureHistoryVisible) {
              window.UiFilters.ensureHistoryVisible();
            }

            // (optionnel) ouvre le panneau done
            const panel = $('#donePanel');
            if (panel) panel.classList.remove('collapsed');

            setTimeout(() => {
              updateMarkerFromUI(
                m.id,
                { done: true, doneAt: Date.now() },
                true
              );
            }, 180);
            } else {
              updateMarkerFromUI(
                m.id,
                { done: false, doneAt: null },
                true
              );
            }
        };


        const centerBtn = el.querySelector('[data-center]');
        if (centerBtn && !centerBtn.closest('.marker-list-menu')) {
          centerBtn.onclick = () => centerOn(m.xp, m.yp, 0.8, m.id);
        }

        const delBtn = el.querySelector('[data-delete]');
        if (delBtn && !delBtn.closest('.marker-list-menu')) {
          delBtn.onclick = () => deleteMarkerFromUI(m.id);
        }

        const linkBtn = el.querySelector('[data-link]');
        if (linkBtn && !linkBtn.closest('.marker-list-menu')) {
          linkBtn.onclick = async () => {
            if (!window.GDMMShare?.createLink) {
              if (typeof showToast === 'function') {
                showToast('Share system not ready ❌', 'error', 3500);
              }
              return;
            }

            const round = (v) => Math.round((v || 0) * 10) / 10;

            const payload = {
              v: '3',
              map: state.active,
              r: [],
              m: [{
                i: m.id,
                x: round(m.xp),
                y: round(m.yp),
                l: m.label || '',
                k: m.cat || 'General',
                c: m.color || '#78f1c2',
              }],
              notes: null,
            };

            await window.GDMMShare.createLink(payload);

            if (typeof showToast === 'function') {
              const msg =
                (window.GDMMLang?.t && GDMMLang.t('toast.ShareUrlCopied')) ||
                'Link copied ✅';
              showToast(msg, 'success', 3800);
            }
          };
        }


        host.appendChild(el);
      }
    });


    // i18n
    if (window.GDMMLang && typeof window.GDMMLang.applyLang === 'function') {
      window.GDMMLang.applyLang(window.GDMMLang.getLang());
    }

    // panneau des Done
    if (window.renderDoneList) {
      window.renderDoneList(doneMarkers);
    }

    //Ré-applique les filtres sur la liste APRÈS rebuild,
    if (window.UiFilters && typeof window.UiFilters.applyCategoryFilters === 'function') {
      window.UiFilters.applyCategoryFilters();
    }

  }

/* END -----------------------------------------------------------------------*/

    // --- Expose API Markers ---
  if (!window.UiMarkers) {
    window.UiMarkers = {};
  }

  Object.assign(window.UiMarkers, {
  addMarkerFromUI,
  updateMarkerFromUI,
  deleteMarkerFromUI,
  listFiltered,
  renderList,
});

  if (window.UiCore) {
    Object.assign(window.UiCore, {
      addMarkerFromUI,
      updateMarkerFromUI,
      deleteMarkerFromUI,
      renderList,
    });
  }

  // Init tooltip menu markers (safe: garde-fou dans la fonction)
  if (typeof initMarkerSubMenus === 'function') {
    initMarkerSubMenus();
  }

})();

