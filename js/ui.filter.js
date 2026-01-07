(function() {
  const { currentProfile } = window.GDMMCore || {};

  /************************************************************
   *  APPLY CATEGORY FILTERS  (MAP + LIST)
   ************************************************************/
    function applyCategoryFilters() {
      const CAT_SET = new Set(['general','quest','boss','loot','waypoint','donjon','npc']);

      const catButtons = document.querySelectorAll('.filterToggle[data-cat]');
      const allBtn = document.querySelector('.filterToggle[data-all]');

      const allActive = !!(allBtn && allBtn.classList.contains('is-on'));

      const activeCategoryBtn = [...catButtons].find(btn => btn.classList.contains('is-on'));
      const activeCategory = (!allActive && activeCategoryBtn)
        ? (activeCategoryBtn.getAttribute('data-cat') || '').toLowerCase()
        : null;

      // --- helpers ---
      const getCatFromClassList = (cl) => {
        for (const c of cl) if (CAT_SET.has(c)) return c;
        return null;
      };

      const setVisibleByCat = (el, cat) => {
        const visible = (!activeCategory || cat === activeCategory);
        el.style.display = visible ? "" : "none";
      };

      // =====================================================
      // MODE ALL : on montre tout, point.
      // =====================================================
      if (allActive) {
        // map
        document.querySelectorAll('.marker').forEach(el => {
          el.style.display = "";
        });

        // liste active
        document.querySelectorAll('#list .listItem').forEach(el => {
          el.style.display = "";
        });

        // archives
        document.querySelectorAll('#doneList .doneItem').forEach(el => {
          el.style.display = "";
        });

        return;
      }

      // =====================================================
      // MODE FILTRE CATEGORIE (exclusive)
      // =====================================================

      // 1) MAP : ne filtre que les markers "user" (ceux qui ont une cat)
      document.querySelectorAll('.marker').forEach(el => {
        const markerCat = getCatFromClassList(el.classList);

        // si pas de cat, c'est un marker "système" (rift/region/etc.) => toujours visible
        if (!markerCat) {
          el.style.display = "";
          return;
        }

        setVisibleByCat(el, markerCat);
      });

      // 2) LISTE ACTIVE
      document.querySelectorAll('#list .listItem').forEach(el => {
        const markerCat = getCatFromClassList(el.classList) || 'general';
        setVisibleByCat(el, markerCat);
      });

      // 3) ARCHIVES
      document.querySelectorAll('#doneList .doneItem').forEach(el => {
        const markerCat = getCatFromClassList(el.classList) || 'general';
        setVisibleByCat(el, markerCat);
      });
    }



  /************************************************************
   * UPDATE FILTER COUNTS
   ************************************************************/
    function updateFilterCounts() {

      if (!currentProfile) return;
      const p = currentProfile();
      if (!p || !Array.isArray(p.markers)) return;

      const counts = {};

      for (const m of p.markers) {
        // On ne compte que les marqueurs NON terminés pour les filtres
/*        if (m.done) continue;*/

        const cat = m.cat || 'General';
        counts[cat] = (counts[cat] || 0) + 1;
      }

      // --- Masquer "All" tant qu'il n'y a aucun marqueur actif ---
        const allBtn = document.querySelector('.filterToggle[data-all]');
        const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);

      if (allBtn) {
        if (totalActive === 0) {
          // Plus aucun marqueur → on cache All et on nettoie les états
          allBtn.style.display = 'none';
          allBtn.classList.remove('is-on');

          document.querySelectorAll('.filterToggle[data-cat]').forEach(catBtn => {
            catBtn.classList.remove('is-on');
          });
        } else {
          // Au moins un marqueur → All redevient visible
          allBtn.style.display = '';

          // Sécurité : si aucun filtre n'est actif, All devient actif
          const anyActive =
            allBtn.classList.contains('is-on') ||
            [...document.querySelectorAll('.filterToggle[data-cat]')]
              .some(btn => btn.classList.contains('is-on'));

          if (!anyActive) {
            allBtn.classList.add('is-on');
          }
        }
      }

      // --- MAJ des compteurs + visibilité des onglets de catégorie ---
      document.querySelectorAll('.filterToggle[data-cat]').forEach(btn => {
        const cat = btn.getAttribute('data-cat') || 'General';
        const count = counts[cat] || 0;

        let badge = btn.querySelector('.filterCount');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'filterCount';
          btn.appendChild(badge);
        }

        if (count > 0) {
          // Il y a des marqueurs dans cette catégorie → on affiche le bouton
          badge.textContent = count;
          badge.style.display = '';
          btn.style.display = '';           // bouton visible
        } else {
          // Aucun marqueur → on cache complètement l’onglet
          badge.textContent = '';
          badge.style.display = 'none';

          // Si ce filtre était actif, on le désactive et on repasse sur "All"
          if (btn.classList.contains('is-on')) {
            btn.classList.remove('is-on');
            const allBtn = document.querySelector('.filterToggle[data-all]');
            if (allBtn) {
              allBtn.classList.add('is-on');
            }
          }

          btn.style.display = 'none';       // bouton masqué
        }
      });

      // On ré-applique les filtres au cas où on vient de changer l’onglet actif
      applyCategoryFilters();
    }




  /************************************************************
   *  CLICK HANDLERS  (LOGIQUE ONGLET EXCLUSIF)
   ************************************************************/
  document.querySelectorAll('.filterToggle[data-all]').forEach(btn => {
    btn.addEventListener('click', () => {

      // All ON
      btn.classList.add('is-on');

      // Toutes les catégories OFF
      document.querySelectorAll('.filterToggle[data-cat]').forEach(catBtn => {
        catBtn.classList.remove('is-on');
      });

      applyCategoryFilters();
    });
  });


  document.querySelectorAll('.filterToggle[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {

      // All OFF
      document.querySelector('.filterToggle[data-all]')?.classList.remove('is-on');

      // Ce bouton ON
      btn.classList.add('is-on');

      // Les autres OFF
      document.querySelectorAll('.filterToggle[data-cat]').forEach(catBtn => {
        if (catBtn !== btn) catBtn.classList.remove('is-on');
      });

      applyCategoryFilters();
    });
  });


  /************************************************************
   * ADMIN FILTERS
   ************************************************************/
    // === SAVE / LOAD des admin filters ===
    const ADMIN_FILTER_KEY = 'gdmm_admin_filters_v1';

    function loadAdminFilterState() {
      try {
        const raw = localStorage.getItem(ADMIN_FILTER_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    }

    function saveAdminFilterState(state) {
      try {
        localStorage.setItem(ADMIN_FILTER_KEY, JSON.stringify(state));
      } catch {}
    }

    function applySavedAdminFilterState() {
      const state = loadAdminFilterState();
      document.querySelectorAll('.filterToggle[data-admin]').forEach(btn => {
        const key = btn.dataset.admin;
        const isOn = state[key];
        if (isOn === false) {
          btn.classList.remove('is-on');
        } else {
          btn.classList.add('is-on');
        }
      });
    }


  document.querySelectorAll('.filterToggle[data-admin]').forEach(btn => {
    btn.classList.add('filter-exempt');
  });

  const mapWrap = document.querySelector('.mapWrap');

  function applyAdminVisibility() {
    if (!mapWrap) return;
    const riftBtn   = document.querySelector('.filterToggle[data-admin="rift"]');
    const regionBtn = document.querySelector('.filterToggle[data-admin="region"]');
    const shrineBtn = document.querySelector('.filterToggle[data-admin="shrine"]');
    const historyBtn = document.querySelector('.filterToggle[data-admin="history"]');


    mapWrap.classList.toggle('hide-rift',   !riftBtn?.classList.contains('is-on'));
    mapWrap.classList.toggle('hide-region', !regionBtn?.classList.contains('is-on'));
    mapWrap.classList.toggle('hide-shrine', !shrineBtn?.classList.contains('is-on'));
    mapWrap.classList.toggle('hide-history', !historyBtn?.classList.contains('is-on'));
  }

  document.querySelectorAll('.filterToggle[data-admin]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-on');

      // --- sauver ---
      const state = loadAdminFilterState();
      state[btn.dataset.admin] = btn.classList.contains('is-on');
      saveAdminFilterState(state);

      applyAdminVisibility();
    });
  });

  applySavedAdminFilterState();
  applyAdminVisibility();


  // Helper global : forcer l’affichage d’une couche admin
  window.ensureAdminLayerVisible = function (kind) {
    const btn = document.querySelector(`.filterToggle[data-admin="${kind}"]`);
    if (!btn) return;

    if (!btn.classList.contains('is-on')) {
      btn.classList.add('is-on');

      const state = loadAdminFilterState();
      state[kind] = true;
      saveAdminFilterState(state);

      applyAdminVisibility();
    }
  };


  /************************************************************
   * INIT
   ************************************************************/
  window.UiFilters = {
    applyCategoryFilters,
    updateFilterCounts,
  };

  applyCategoryFilters();
  updateFilterCounts();

})();
