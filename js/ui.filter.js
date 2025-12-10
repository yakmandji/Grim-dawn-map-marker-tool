(function() {
  const { currentProfile } = window.GDMMCore || {};

  /************************************************************
   *  APPLY CATEGORY FILTERS  (MAP + LIST)
   ************************************************************/
  function applyCategoryFilters() {

    const catButtons = document.querySelectorAll('.filterToggle[data-cat]');
    const sharedBtn  = document.querySelector('.filterToggle[data-shared]');
    const allBtn     = document.querySelector('.filterToggle[data-all]');

    const activeCategoryBtn = [...catButtons].find(btn =>
      btn.classList.contains('is-on')
    );

    const activeCategory = activeCategoryBtn
      ? activeCategoryBtn.getAttribute('data-cat').toLowerCase()
      : null;

    const sharedActive = sharedBtn && sharedBtn.classList.contains('is-on');
    const allActive    = allBtn && allBtn.classList.contains('is-on');

    /************************************************************
     * 1) MODE EXCLUSIF SHARED
     ************************************************************/
    if (sharedActive) {

      // MAP
      document.querySelectorAll('.marker').forEach(el => {
        const cl = el.classList;

        // Catégorie user (general / quest / boss / loot / waypoint / donjon / npc)
        // → même logique que plus bas dans "MODE CATEGORIE EXCLUSIVE"
        const markerCat = [...cl].find(c =>
          ['general','quest','boss','loot','waypoint','donjon','npc'].includes(c)
        );

        // Pas de catégorie = marker admin (rift, etc.) → toujours visible
        if (!markerCat) {
          el.style.display = "";
          return;
        }

        // Filtre "Shared only" appliqué UNIQUEMENT aux user markers
        const isDone   = el.dataset.done === "1";
        const isShared = cl.contains('shared');
        el.style.display = (isShared || isDone) ? "" : "none";
      });

      // LISTE → uniquement les markers user, donc on garde la logique simple
      document.querySelectorAll('#list .listItem').forEach(el => {
        const isShared = el.classList.contains('shared');
        el.style.display = isShared ? "" : "none";
      });

      return;
    }


    /************************************************************
     * 2) MODE ALL
     ************************************************************/
    if (allActive) {
      document.querySelectorAll('.marker').forEach(el => {
        const isDone = el.dataset.done === "1";
        el.style.display = isDone ? "" : ""; // done toujours visible
      });

      document.querySelectorAll('#list .listItem').forEach(el => {
        el.style.display = "";
      });

      return;
    }

    /************************************************************
     * 3) MODE CATEGORIE EXCLUSIVE
     ************************************************************/
    document.querySelectorAll('.marker').forEach(el => {

      // DONE markers are always visible
      if (el.dataset.done === "1") {
        el.style.display = "";
        return;
      }

      const cl = el.classList;

      // Marker user category (general / quest / boss / loot / waypoint / donjon / npc)
      const markerCat = [...cl].find(c =>
        ['general','quest','boss','loot','waypoint','donjon','npc'].includes(c)
      );

      // ADMIN markers (rift, region, dungeon-entry, overlays...)
      // They have NO category → always visible
      if (!markerCat) {
        el.style.display = "";
        return;
      }

      // Apply category filter only to user markers
      const visible = (!activeCategory || markerCat === activeCategory);
      el.style.display = visible ? "" : "none";
    });

    document.querySelectorAll('#list .listItem').forEach(el => {

      const cl = el.classList;

      // Only user markers exist in the list -> no admin markers here
      const markerCat = [...cl].find(c =>
        ['general','quest','boss','loot','waypoint','donjon','npc'].includes(c)
      );

      const visible = (!activeCategory || markerCat === activeCategory);
      el.style.display = visible ? "" : "none";
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
      let sharedCount = 0;

      for (const m of p.markers) {
        // On ne compte que les marqueurs NON terminés pour les filtres
        if (m.done) continue;

        const cat = m.cat || 'General';
        counts[cat] = (counts[cat] || 0) + 1;
        if (m.shared) sharedCount++;
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

      // --- MAJ du compteur / visibilité pour SHARED ---
      const sharedBtn = document.querySelector('.filterToggle[data-shared]');
      if (sharedBtn) {
        let badge = sharedBtn.querySelector('.filterCount');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'filterCount';
          sharedBtn.appendChild(badge);
        }

        if (sharedCount > 0) {
          badge.textContent = sharedCount;
          badge.style.display = '';
          sharedBtn.style.display = '';
        } else {
          badge.textContent = '';
          badge.style.display = 'none';

          if (sharedBtn.classList.contains('is-on')) {
            sharedBtn.classList.remove('is-on');
            const allBtn = document.querySelector('.filterToggle[data-all]');
            if (allBtn) {
              allBtn.classList.add('is-on');
            }
          }

          sharedBtn.style.display = 'none';
        }
      }

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

      // Shared OFF
      document.querySelector('.filterToggle[data-shared]')?.classList.remove('is-on');

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

      // Shared OFF
      document.querySelector('.filterToggle[data-shared]')?.classList.remove('is-on');

      // Ce bouton ON
      btn.classList.add('is-on');

      // Les autres OFF
      document.querySelectorAll('.filterToggle[data-cat]').forEach(catBtn => {
        if (catBtn !== btn) catBtn.classList.remove('is-on');
      });

      applyCategoryFilters();
    });
  });


  /*** SHARED EXCLUSIF *****************************************/
  document.querySelectorAll('.filterToggle[data-shared]').forEach(btn => {
    btn.addEventListener('click', () => {

      // All OFF
      document.querySelector('.filterToggle[data-all]')?.classList.remove('is-on');

      // Catégories OFF
      document.querySelectorAll('.filterToggle[data-cat]').forEach(catBtn => {
        catBtn.classList.remove('is-on');
      });

      // Shared ON
      btn.classList.add('is-on');

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

    mapWrap.classList.toggle('hide-rift',   !riftBtn?.classList.contains('is-on'));
    mapWrap.classList.toggle('hide-region', !regionBtn?.classList.contains('is-on'));
    mapWrap.classList.toggle('hide-shrine', !shrineBtn?.classList.contains('is-on'));
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
