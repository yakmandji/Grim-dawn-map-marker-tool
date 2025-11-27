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
        const isDone   = el.dataset.done === "1";
        const isShared = el.classList.contains('shared');
        el.style.display = (isShared || isDone) ? "" : "none";
      });

      // LISTE
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

      if (el.dataset.done === "1") {
        el.style.display = "";
        return;
      }

      const cl = el.classList;
      const markerCat = [...cl].find(c =>
        ['general','quest','boss','loot','waypoint','donjon','npc'].includes(c)
      );

      const visible = (!activeCategory || markerCat === activeCategory);
      el.style.display = visible ? "" : "none";
    });

    document.querySelectorAll('#list .listItem').forEach(el => {
      const cl = el.classList;
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
        if (m.done) continue;
        const cat = m.cat || 'General';
        counts[cat] = (counts[cat] || 0) + 1;
        if (m.shared) sharedCount++;
      }

      // --- MAJ des compteurs sur chaque bouton de catégorie ---
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
          badge.textContent = count;
          badge.style.display = '';
        } else {
          badge.textContent = '';
          badge.style.display = 'none';
        }
      });

      // --- MAJ du compteur pour SHARED ---
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
        } else {
          badge.textContent = '';
          badge.style.display = 'none';
        }
      }
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
   * ADMIN FILTERS (inchangé)
   ************************************************************/
  document.querySelectorAll('.filterToggle[data-admin]').forEach(btn => {
    btn.classList.add('filter-exempt');
  });

  const mapWrap = document.querySelector('.mapWrap');

  function applyAdminVisibility() {
    if (!mapWrap) return;
    const riftBtn   = document.querySelector('.filterToggle[data-admin="rift"]');
    const regionBtn = document.querySelector('.filterToggle[data-admin="region"]');

    mapWrap.classList.toggle('hide-rift',   !riftBtn?.classList.contains('is-on'));
    mapWrap.classList.toggle('hide-region', !regionBtn?.classList.contains('is-on'));
  }

  document.querySelectorAll('.filterToggle[data-admin]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-on');
      applyAdminVisibility();
    });
  });

  applyAdminVisibility();

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
