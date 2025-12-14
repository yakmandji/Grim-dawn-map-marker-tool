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
  Quest:    'img/quest.svg',
  Boss:     'img/boss.svg',
  Loot:     'img/loot.svg',
  Waypoint: 'img/passage.svg',
  Donjon:   'img/donjon.svg',
  NPC:      'img/npc.svg',
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


  // --- Markers ---
  function addMarkerFromUI(xp, yp){
    if (!state.mapReady) { alert('You need first to load a map'); return; }
    const label = $('#newLabel').value.trim();
    const cat   = $('#newCategory').value;
    const done  = false;

    const marker = coreAddMarker({ xp, yp, label, cat, done });


    // === UX : avertir si le marker créé est caché par un filtre actif ===
    const activeCatBtn = document.querySelector('.filterToggle.is-on[data-cat]');

    // Déterminer si le marker sera invisible
    let hidden = false;

    // Cas 1 : un onglet catégorie est actif
    if (activeCatBtn) {
      const activeCat = activeCatBtn.getAttribute('data-cat');
      if (cat !== activeCat) hidden = true;
    }

    if (hidden) {
      const allBtn       = document.querySelector('.filterToggle[data-all]');
      const catButtons   = document.querySelectorAll('.filterToggle[data-cat]');
      const targetCatBtn = document.querySelector(`.filterToggle[data-cat="${cat}"]`);

      let filtersChanged = false;

      if (targetCatBtn) {
        // 1) On désactive "All"
        allBtn?.classList.remove('is-on');

        // 2) On active uniquement la catégorie du marker
        catButtons.forEach(btn => {
          btn.classList.toggle('is-on', btn === targetCatBtn);
        });

        filtersChanged = true;
      }

      if (filtersChanged && window.UiFilters?.applyCategoryFilters) {
        // 3) On réapplique les filtres → le marker devient visible
        window.UiFilters.applyCategoryFilters();
      } else {
        // Si on n’a pas réussi à changer les filtres (cat inconnue, etc.) → fallback toast
        showToast(GDMMLang.t("toast.MarkerFiltered", { cat }));
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
            if (hideDoneOnMap) {
              hideDoneOnMap = false;
              const panel = $('#donePanel');
              if (panel) {
                panel.classList.remove('collapsed');
              }
            }

            el.classList.add('fade-out');

            setTimeout(() => {
              updateMarkerFromUI(m.id, { done: true, }, true);
            }, 180);
          } else {
            updateMarkerFromUI(m.id, { done: false }, true);
          }
        };

        el.querySelector('[data-center]').onclick = () => centerOn(m.xp, m.yp, 0.8, m.id);
        el.querySelector('[data-delete]').onclick = () => deleteMarkerFromUI(m.id);


        const linkBtn = el.querySelector('[data-link]');
        if (linkBtn) {
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

            const url = await window.GDMMShare.createLink(payload);
            
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

})();