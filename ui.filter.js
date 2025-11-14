
(function() {
  const { currentProfile } = window.GDMMCore || {};

  function applyCategoryFilters() {
    const catButtons = document.querySelectorAll('.filterToggle[data-cat]');
    const sharedBtn  = document.querySelector('.filterToggle[data-shared]');
    const activeCats = new Set();

    catButtons.forEach(btn => {
      const cat = btn.getAttribute('data-cat');
      if (!cat) return;
      if (btn.classList.contains('is-on')) {
        activeCats.add(cat.toLowerCase());
      }
    });

    const sharedOn = sharedBtn ? sharedBtn.classList.contains('is-on') : false;

    // --- Markers on map ---
    document.querySelectorAll('.marker').forEach(el => {
      const cl = el.classList;
      const isShared = cl.contains('shared');

      let markerCat = null;
      ['general','quest','boss','loot','waypoint','donjon','npc'].some(cat => {
        if (cl.contains(cat)) {
          markerCat = cat;
          return true;
        }
        return false;
      });

      const catVisible   = !markerCat || activeCats.has(markerCat);
      const sharedVisible = sharedOn && isShared;

      const finalVisible = sharedVisible || catVisible;
      el.style.display = finalVisible ? '' : 'none';
    });

    // --- Éléments dans la liste ---
    document.querySelectorAll('#list .listItem').forEach(el => {
      const cl = el.classList;
      const isShared = cl.contains('shared');

      let itemCat = null;
      ['general','quest','boss','loot','waypoint','donjon','npc'].some(cat => {
        if (cl.contains(cat)) {
          itemCat = cat;
          return true;
        }
        return false;
      });

      const catVisible   = !itemCat || activeCats.has(itemCat);
      const sharedVisible = sharedOn && isShared;

      const finalVisible = sharedVisible || catVisible;
      el.style.display = finalVisible ? '' : 'none';
    });
  }


  // Count by category
  function updateFilterCounts() {
    if (!currentProfile) return;
    const p = currentProfile();
    if (!p || !Array.isArray(p.markers)) return;

    // Count marker
    const counts = {};
    let sharedCount = 0;

    for (const m of p.markers) {
      const cat = m.cat || 'General';
      counts[cat] = (counts[cat] || 0) + 1;

      if (m.shared) {
        sharedCount++;
      }
    }

    document.querySelectorAll('.filterToggle').forEach(btn => {
      const catAttr = btn.getAttribute('data-cat');
      const isSharedBtn = btn.hasAttribute('data-shared');

      let count = 0;

      if (isSharedBtn) {
        count = sharedCount;
      } else if (catAttr) {
        count = counts[catAttr] || 0;
      } else {
        return;
      }

      let badge = btn.querySelector('.filterCount');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'filterCount';
        btn.appendChild(badge);
      }

      badge.textContent = count;

      if (count > 0) {
        badge.style.display = 'flex';
        btn.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
        btn.style.display = 'none';
      }
    });
  }


  // --- Exclure admin filter ---
  document.querySelectorAll('.filterToggle[data-admin]').forEach(btn => {
    btn.classList.add('filter-exempt');
  });


  // Toggle visuel + re-apply filters
  document.querySelectorAll('.filterToggle:not(.filter-exempt)').forEach(btn => {

    btn.addEventListener('click', () => {
      btn.classList.toggle('is-on');
      applyCategoryFilters();
    });
  });

  // --- Admin markers toggles ---
  const mapWrap = document.querySelector('.mapWrap');

  function applyAdminVisibility() {
    if (!mapWrap) return;
    const riftBtn   = document.querySelector('.filterToggle[data-admin="rift"]');
    const regionBtn = document.querySelector('.filterToggle[data-admin="region"]');

    mapWrap.classList.toggle('hide-rift',   !riftBtn?.classList.contains('is-on'));
    mapWrap.classList.toggle('hide-region', !regionBtn?.classList.contains('is-on'));
  }

  // Click listeners
  document.querySelectorAll('.filterToggle[data-admin]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-on');
      applyAdminVisibility();
    });
  });


    const riftBtn = document.querySelector('.filterToggle[data-admin="rift"]');
    if (riftBtn) {
      riftBtn.classList.remove('is-on');
    }

  // Apply initial state
  applyAdminVisibility();

/*------------------------------------------------------------------------
*/

  window.UiFilters = {
    applyCategoryFilters,
    updateFilterCounts,
  };

  applyCategoryFilters();
  updateFilterCounts();

})();
