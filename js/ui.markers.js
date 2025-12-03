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

const { $, inner } = window.UiCore;


  // --- Markers ---
  function addMarkerFromUI(xp, yp){
    if (!state.mapReady) { alert('You need first to load a map'); return; }
    const label = $('#newLabel').value.trim();
    const cat   = $('#newCategory').value;
    const done  = false;
    const sharedCheckbox = document.getElementById('newShared');
    const shared = sharedCheckbox ? !!sharedCheckbox.checked : false;

    const marker = coreAddMarker({ xp, yp, label, cat, done, shared });


    // === UX : avertir si le marker créé est caché par un filtre actif ===
    const activeCatBtn = document.querySelector('.filterToggle.is-on[data-cat]');
    const sharedBtn    = document.querySelector('.filterToggle.is-on[data-shared]');

    // Déterminer si le marker sera invisible
    let hidden = false;

    // Cas 1 : un onglet catégorie est actif
    if (activeCatBtn) {
      const activeCat = activeCatBtn.getAttribute('data-cat');
      if (cat !== activeCat) hidden = true;
    }

    // Cas 2 : onglet shared actif
    if (sharedBtn && !shared) {
      hidden = true;
    }

    if (hidden) {
      showToast(GDMMLang.t("toast.MarkerFiltered", { cat }));
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
        if (m.shared) {
          el.classList.add('shared');
        }

        // label
        const label = el.querySelector('[data-label]');
        const originalLabel = m.label || '';

        label.value = originalLabel;

        label.addEventListener('blur', (e) => {
          const newVal = e.target.value;

          // Si rien n'a changé, on ne fait rien
          if (newVal === originalLabel) return;

          // Sinon on met à jour + toast
          updateMarkerFromUI(m.id, { label: newVal }, true);
        });


        // catégorie
        const catSel = el.querySelector('[data-cat]');
        catSel.value = m.cat || 'General';

        catSel.onchange = e => {
          const v = e.target.value;
          // on laisse updateMarkerFromUI gérer le re-render complet
          updateMarkerFromUI(m.id, { cat: v }, true);
        };

          // shared
          const sharedInput = el.querySelector('[data-shared]');
          if (sharedInput) {
            sharedInput.checked = !!m.shared;
            sharedInput.onchange = (e) => {
              const isShared = !!e.target.checked;

              // 1) MAJ des données
              coreUpdateMarker(m.id, { shared: isShared });
              markAsChanged();
              saveUserDataToLocal();

              // 2) MAJ de la ligne dans la liste
              el.classList.toggle('shared', isShared);

              // 3) MAJ du marker sur la map (classe + badge)
              const markerEl = document.querySelector(`.marker[data-mid="${m.id}"]`);
              if (markerEl) {
                markerEl.classList.toggle('shared', isShared);

                const pin = markerEl.querySelector('.pin');
                if (pin) {
                  let badge = pin.querySelector('.shared-badge');

                  if (isShared) {
                    if (!badge) {
                      badge = document.createElement('img');
                      badge.className = 'shared-badge';
                      badge.src = 'img/share-icon.svg';
                      badge.alt = (window.GDMMLang && GDMMLang.t)
                        ? GDMMLang.t('ui.SharedMarker')
                        : 'Shared';
                      pin.appendChild(badge);
                    }
                  } else if (badge) {
                    badge.remove();
                  }
                }
              }

              // 4) MAJ des compteurs / filtres (sans re-render massif)
              if (window.UiFilters) {
                if (typeof UiFilters.updateFilterCounts === 'function') {
                  UiFilters.updateFilterCounts();
                }
                if (typeof UiFilters.applyCategoryFilters === 'function') {
                  UiFilters.applyCategoryFilters();
                }
              }
            };
          }

        // done
        const done = el.querySelector('[data-done]');
        done.checked = !!m.done;

        done.onchange = e => {
          const isDone = !!e.target.checked;

          if (isDone) {
            const sharedInput = el.querySelector('[data-shared]');
            if (sharedInput) {
              sharedInput.checked = false;
            }

            if (hideDoneOnMap) {
              hideDoneOnMap = false;
              const panel = $('#donePanel');
              if (panel) {
                panel.classList.remove('collapsed');
              }
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
        initMarkerCategoryDropdown(el);
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


/*Marker Edition New Dropdown --------------------------------------------------------*/

  function initMarkerCategoryDropdown(rowEl) {
    const sel = rowEl.querySelector('[data-cat]');
    const dd  = rowEl.querySelector('.marker-cat-dropdown');
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

    // Remplir les options avec SVG + traduction
    inner.innerHTML = '';
    Array.from(sel.options).forEach(opt => {
      const iconSrc = categoryIcons[opt.value] || '';
      const i18nKey = opt.getAttribute('data-i18n') || '';

      inner.innerHTML += `
        <button class="option-item" data-value="${opt.value}">
          ${iconSrc ? `<img src="${iconSrc}" width="14" height="14" style="margin-right:6px;">` : ''}
          <span ${i18nKey ? `data-i18n="${i18nKey}"` : ''}>${opt.textContent}</span>
        </button>
      `;
    });

    // Init du dropdown custom
    initCustomDropdownForElements({
      nativeSelect: sel,
      dropdown: dd,
      itemSelector: '.option-item',
      valueAttr: 'data-value',
      currentButtonSelector: '.select-current',
      currentLabelSelector: '.select-label',
      getLabel: (item) => {
        const span = item.querySelector('span[data-i18n]');
        if (!span) return item.textContent.trim();
        const key = span.getAttribute('data-i18n');
        return GDMMLang.t(key);   // ← traduction dynamique !
      },

      extraSync: ({ currentBtn, item }) => {
        const btnIcon = currentBtn.querySelector('.marker-cat-icon');
        const itemIcon = item.querySelector('img');
        if (btnIcon && itemIcon) {
          btnIcon.src = itemIcon.src;
        }
      }
    });

    // retraduction (car contenu créé après applyLang initial)
    if (window.GDMMLang) {
      GDMMLang.applyLang(GDMMLang.getLang());
    }
  }
  /*END ------------------------------------------------------------*/



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
  initMarkerCategoryDropdown,
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